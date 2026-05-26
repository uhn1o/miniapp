import type { Message, ModelInfo } from "./types";
import { tg } from "./telegram";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";

type ApiMessage = { role: "user" | "assistant"; content: string };

export async function* streamReply(
  history: Message[],
  model: ModelInfo,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const messages: ApiMessage[] = history
    .filter((m) => m.content.length > 0)
    .map((m) => ({ role: m.role, content: m.content }));

  const initData = tg()?.initData ?? "";
  if (!initData) {
    throw new Error("Open this app from Telegram");
  }

  const resp = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
    },
    body: JSON.stringify({ model: model.id, messages }),
    signal,
  });

  if (resp.status === 401) {
    throw new Error("Unauthorized — open via Telegram bot");
  }
  if (!resp.ok || !resp.body) {
    throw new Error(`backend ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!raw.startsWith("data:")) continue;
      const payload = raw.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const obj = JSON.parse(payload);
        if (obj.error) throw new Error(obj.error);
        if (typeof obj.delta === "string") yield obj.delta;
      } catch (e) {
        if (e instanceof Error && e.message !== payload) throw e;
      }
    }
  }
}

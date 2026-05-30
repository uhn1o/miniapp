import type { Message, ModelInfo } from "./types";
import { tg } from "./telegram";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type ApiContent = string | Array<TextPart | ImagePart>;
type ApiMessage = { role: "user" | "assistant"; content: ApiContent };

function toApiMessage(m: Message): ApiMessage {
  const imgs = m.attachments?.filter((a) => a.type === "image") ?? [];
  if (imgs.length === 0) {
    return { role: m.role, content: m.content };
  }
  const parts: Array<TextPart | ImagePart> = [];
  if (m.content) parts.push({ type: "text", text: m.content });
  for (const a of imgs) {
    parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
  }
  return { role: m.role, content: parts };
}

export async function* streamReply(
  history: Message[],
  model: ModelInfo,
  signal?: AbortSignal,
  opts?: { thinking?: boolean; temperature?: number; maxTokens?: number },
): AsyncGenerator<string> {
  const messages: ApiMessage[] = history
    .filter((m) => m.content.length > 0 || (m.attachments && m.attachments.length > 0))
    .map(toApiMessage);

  const initData = tg()?.initData ?? "";
  if (!initData) {
    throw new Error("Open this app from Telegram");
  }

  const body: Record<string, unknown> = { model: model.id, messages };
  if (opts?.thinking && model.family === "claude") {
    body.thinking = { type: "enabled", budget_tokens: 4000 };
  }
  if (typeof opts?.temperature === "number") {
    body.temperature = opts.temperature;
  }
  if (typeof opts?.maxTokens === "number" && opts.maxTokens > 0) {
    body.max_tokens = opts.maxTokens;
  }

  const resp = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (resp.status === 401) {
    throw new Error("Unauthorized — open via Telegram bot");
  }
  if (!resp.ok || !resp.body) {
    let detail = "";
    try {
      const j = await resp.json();
      if (j?.error) detail = `: ${j.error}`;
    } catch {
      try {
        detail = `: ${(await resp.text()).slice(0, 200)}`;
      } catch {
        // ignore
      }
    }
    throw new Error(`backend ${resp.status}${detail}`);
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
      let obj: unknown;
      try {
        obj = JSON.parse(payload);
      } catch {
        // битый/частковий JSON — пропускаємо, не валимо весь стрім
        continue;
      }
      if (obj && typeof obj === "object") {
        const o = obj as { error?: unknown; delta?: unknown };
        if (typeof o.error === "string") throw new Error(o.error);
        if (typeof o.delta === "string") yield o.delta;
      }
    }
  }
}

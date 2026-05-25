import type { ModelInfo } from "./types";

const SAMPLE_RESPONSES: Record<string, string[]> = {
  default: [
    "Цікаве питання. Дай-но подумати... ",
    "Ось як я це бачу: технічна частина задачі зводиться до двох речей — структура даних та поведінка інтерфейсу. ",
    "Якщо хочеш, можу запропонувати конкретний підхід з кодом. Які саме обмеження для тебе критичні?",
  ],
  code: [
    "Звісно, ось приклад:\n\n```ts\nfunction debounce<T extends (...a: any[]) => void>(fn: T, ms = 200) {\n  let t: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}\n```\n\nЦя функція ",
    "затримує виклик `fn` на `ms` мілісекунд після останнього виклику. Корисно для пошуку, ресайзу, скролу.",
  ],
};

function pickResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("код") || lower.includes("code") || lower.includes("function")) {
    return SAMPLE_RESPONSES.code.join("");
  }
  return SAMPLE_RESPONSES.default.join("");
}

export async function* streamReply(
  prompt: string,
  model: ModelInfo,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const full = `**${model.shortName}** • ${pickResponse(prompt)}`;
  const tokens = full.match(/.{1,3}/g) ?? [full];

  const baseDelay = model.tier === "fast" ? 12 : model.tier === "balanced" ? 22 : 32;

  for (const token of tokens) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, baseDelay + Math.random() * 14));
    yield token;
  }
}

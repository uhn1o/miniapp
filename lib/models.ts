import type { ModelInfo } from "./types";

export const MODELS: ModelInfo[] = [
  {
    id: "claude-opus-4-7",
    vendor: "anthropic",
    family: "claude",
    name: "Claude Opus 4.7",
    shortName: "Opus 4.7",
    tier: "flagship",
    contextK: 200,
    blurb: "Найрозумніша модель Anthropic. Глибокі міркування, складний код.",
    accent: "#6B7F4E",
  },
  {
    id: "gpt-5-5",
    vendor: "openai",
    family: "gpt",
    name: "GPT 5.5",
    shortName: "GPT 5.5",
    tier: "flagship",
    contextK: 256,
    blurb: "Топова мультимодальна модель OpenAI.",
    accent: "#A7BFA5",
  },
  {
    id: "gpt-5-4",
    vendor: "openai",
    family: "gpt",
    name: "GPT 5.4",
    shortName: "GPT 5.4",
    tier: "balanced",
    contextK: 128,
    blurb: "Збалансована OpenAI модель — швидкість і якість в рівновазі.",
    accent: "#879d63",
  },
  {
    id: "claude-opus-4-6",
    vendor: "anthropic",
    family: "claude",
    name: "Claude Opus 4.6",
    shortName: "Opus 4.6",
    tier: "flagship",
    contextK: 200,
    blurb: "Перевірений флагман. Стабільний для агентних задач.",
    accent: "#596a40",
  },
  {
    id: "claude-sonnet-4-6",
    vendor: "anthropic",
    family: "claude",
    name: "Claude Sonnet 4.6",
    shortName: "Sonnet 4.6",
    tier: "balanced",
    contextK: 200,
    blurb: "Робоча конячка. Швидко, якісно, дешевше за Opus.",
    accent: "#86a184",
  },
  {
    id: "claude-haiku-4-5",
    vendor: "anthropic",
    family: "claude",
    name: "Claude Haiku 4.5",
    shortName: "Haiku 4.5",
    tier: "fast",
    contextK: 200,
    blurb: "Найшвидша. Ідеальна для коротких відповідей.",
    accent: "#c6a96f",
  },
];

export const DEFAULT_MODEL_ID = "claude-opus-4-7";

export function getModel(id: string): ModelInfo {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

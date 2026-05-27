import type { ModelInfo, ModelTier } from "./types";

interface ModelMeta {
  shortName?: string;
  blurb?: string;
  contextK?: number;
  tier?: ModelTier;
  accent?: string;
  vendor?: ModelInfo["vendor"];
  family?: ModelInfo["family"];
}

// Декорація для відомих ID. Нові моделі підхопляться з API і отримають
// дефолтне оформлення на основі inferFamily().
const KNOWN: Record<string, ModelMeta> = {
  "claude-opus-4-7": {
    shortName: "Opus 4.7",
    tier: "flagship",
    contextK: 200,
    blurb: "Найрозумніша модель Anthropic. Глибокі міркування, складний код.",
    accent: "#6B7F4E",
    vendor: "anthropic",
    family: "claude",
  },
  "claude-opus-4-6": {
    shortName: "Opus 4.6",
    tier: "flagship",
    contextK: 200,
    blurb: "Перевірений флагман. Стабільний для агентних задач.",
    accent: "#596a40",
    vendor: "anthropic",
    family: "claude",
  },
  "claude-sonnet-4-6": {
    shortName: "Sonnet 4.6",
    tier: "balanced",
    contextK: 200,
    blurb: "Робоча конячка. Швидко, якісно, дешевше за Opus.",
    accent: "#86a184",
    vendor: "anthropic",
    family: "claude",
  },
  "claude-haiku-4-5": {
    shortName: "Haiku 4.5",
    tier: "fast",
    contextK: 200,
    blurb: "Найшвидша. Ідеальна для коротких відповідей.",
    accent: "#c6a96f",
    vendor: "anthropic",
    family: "claude",
  },
  "gpt-5-5": {
    shortName: "GPT 5.5",
    tier: "flagship",
    contextK: 256,
    blurb: "Топова мультимодальна модель OpenAI.",
    accent: "#A7BFA5",
    vendor: "openai",
    family: "gpt",
  },
  "gpt-5-4": {
    shortName: "GPT 5.4",
    tier: "balanced",
    contextK: 128,
    blurb: "Збалансована OpenAI модель — швидкість і якість в рівновазі.",
    accent: "#879d63",
    vendor: "openai",
    family: "gpt",
  },
};

const ANTHROPIC_ACCENT = "#6B7F4E";
const OPENAI_ACCENT = "#A7BFA5";

function inferFamily(id: string): {
  vendor: ModelInfo["vendor"];
  family: ModelInfo["family"];
  accent: string;
} {
  const low = id.toLowerCase();
  if (low.includes("claude") || low.includes("anthropic")) {
    return { vendor: "anthropic", family: "claude", accent: ANTHROPIC_ACCENT };
  }
  return { vendor: "openai", family: "gpt", accent: OPENAI_ACCENT };
}

function normalizeVendor(v: string | null | undefined, fallback: ModelInfo["vendor"]): ModelInfo["vendor"] {
  if (v === "anthropic" || v === "openai") return v;
  return fallback;
}

function normalizeFamily(f: string | null | undefined, fallback: ModelInfo["family"]): ModelInfo["family"] {
  if (f === "claude" || f === "gpt") return f;
  return fallback;
}

export function buildModelInfo(
  id: string,
  display_name?: string | null,
  vendor?: string | null,
  family?: string | null,
): ModelInfo {
  const known = KNOWN[id] ?? {};
  const inferred = inferFamily(id);
  const v = normalizeVendor(vendor, known.vendor ?? inferred.vendor);
  const f = normalizeFamily(family, known.family ?? inferred.family);
  const fullName = display_name || known.shortName || id;
  return {
    id,
    vendor: v,
    family: f,
    name: fullName,
    shortName: known.shortName ?? display_name ?? id,
    tier: known.tier ?? "balanced",
    contextK: known.contextK ?? 128,
    blurb: known.blurb ?? "",
    accent: known.accent ?? inferred.accent,
  };
}

export function getModel(id: string): ModelInfo {
  return buildModelInfo(id);
}

export const DEFAULT_MODEL_ID = "claude-opus-4-7";

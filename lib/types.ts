export type ModelTier = "flagship" | "balanced" | "fast";

export interface ModelInfo {
  id: string;
  vendor: "anthropic" | "openai";
  family: "claude" | "gpt";
  name: string;
  shortName: string;
  tier: ModelTier;
  contextK: number;
  blurb: string;
  accent: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  modelId?: string;
  streaming?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  hapticsEnabled: boolean;
  sendOnEnter: boolean;
  showModelBadges: boolean;
  language: "uk" | "ru" | "en";
}

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

export interface Attachment {
  type: "image";
  dataUrl: string;
  mime: string;
  name?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  modelId?: string;
  streaming?: boolean;
  attachments?: Attachment[];
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
  thinkingEnabled: boolean;
  temperature: number;
  maxTokens: number;
  language: "uk" | "ru" | "en";
}

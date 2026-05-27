"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Chat, Message, AppSettings, Attachment } from "./types";
import { DEFAULT_MODEL_ID } from "./models";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface State {
  chats: Chat[];
  activeChatId: string | null;
  currentModelId: string;
  settings: AppSettings;

  newChat: (modelId?: string) => string;
  setActiveChat: (id: string) => void;
  deleteChat: (id: string) => void;
  clearAllChats: () => void;

  setModel: (id: string) => void;
  appendMessage: (chatId: string, msg: Message) => void;
  updateMessage: (chatId: string, msgId: string, patch: Partial<Message>) => void;
  deleteMessage: (chatId: string, msgId: string) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  hapticsEnabled: true,
  sendOnEnter: false,
  showModelBadges: true,
  thinkingEnabled: false,
  temperature: 1.0,
  maxTokens: 2048,
  language: "uk",
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      currentModelId: DEFAULT_MODEL_ID,
      settings: defaultSettings,

      newChat: (modelId) => {
        const id = uid();
        const chat: Chat = {
          id,
          title: "",
          modelId: modelId ?? get().currentModelId,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ chats: [chat, ...s.chats], activeChatId: id }));
        return id;
      },

      setActiveChat: (id) => set({ activeChatId: id }),

      deleteChat: (id) =>
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id);
          const activeChatId = s.activeChatId === id ? chats[0]?.id ?? null : s.activeChatId;
          return { chats, activeChatId };
        }),

      clearAllChats: () => set({ chats: [], activeChatId: null }),

      setModel: (id) =>
        set((s) => {
          const next: Partial<State> = { currentModelId: id };
          if (s.activeChatId) {
            next.chats = s.chats.map((c) =>
              c.id === s.activeChatId ? { ...c, modelId: id } : c,
            );
          }
          return next as State;
        }),

      appendMessage: (chatId, msg) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length === 0 && msg.role === "user"
                      ? msg.content.slice(0, 40) || c.title
                      : c.title,
                }
              : c,
          ),
        })),

      updateMessage: (chatId, msgId, patch) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
                }
              : c,
          ),
        })),

      deleteMessage: (chatId, msgId) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? { ...c, messages: c.messages.filter((m) => m.id !== msgId), updatedAt: Date.now() }
              : c,
          ),
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "aurora-tma-store",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (s) => ({
        chats: s.chats,
        activeChatId: s.activeChatId,
        currentModelId: s.currentModelId,
        settings: s.settings,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...defaultSettings, ...(p.settings ?? {}) },
        };
      },
    },
  ),
);

export function makeMessage(
  role: "user" | "assistant",
  content: string,
  modelId?: string,
  attachments?: Attachment[],
): Message {
  return {
    id: uid(),
    role,
    content,
    createdAt: Date.now(),
    modelId,
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
  };
}

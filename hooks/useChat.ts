"use client";

import { useCallback, useRef, useState } from "react";
import { useStore, makeMessage } from "@/lib/store";
import { getModel } from "@/lib/models";
import { streamReply } from "@/lib/mockApi";
import { haptic, hapticNotify } from "@/lib/telegram";

export function useChat() {
  const chats = useStore((s) => s.chats);
  const activeChatId = useStore((s) => s.activeChatId);
  const newChat = useStore((s) => s.newChat);
  const appendMessage = useStore((s) => s.appendMessage);
  const updateMessage = useStore((s) => s.updateMessage);
  const currentModelId = useStore((s) => s.currentModelId);
  const settings = useStore((s) => s.settings);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      let chatId = activeChatId;
      if (!chatId) {
        chatId = newChat();
      }
      const modelId = activeChat?.modelId ?? currentModelId;
      const model = getModel(modelId);

      appendMessage(chatId, makeMessage("user", text));
      const reply = makeMessage("assistant", "", modelId);
      reply.streaming = true;
      appendMessage(chatId, reply);

      const ac = new AbortController();
      abortRef.current = ac;
      setIsStreaming(true);

      try {
        let acc = "";
        for await (const token of streamReply(text, model, ac.signal)) {
          acc += token;
          updateMessage(chatId, reply.id, { content: acc });
        }
        updateMessage(chatId, reply.id, { streaming: false });
        if (settings.hapticsEnabled) hapticNotify("success");
      } catch {
        updateMessage(chatId, reply.id, { streaming: false });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeChatId, activeChat, currentModelId, newChat, appendMessage, updateMessage, settings.hapticsEnabled],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (settings.hapticsEnabled) haptic("heavy");
  }, [settings.hapticsEnabled]);

  const regenerate = useCallback(
    async (messageId: string) => {
      if (!activeChat) return;
      const idx = activeChat.messages.findIndex((m) => m.id === messageId);
      if (idx <= 0) return;
      const userMsg = activeChat.messages[idx - 1];
      if (userMsg?.role !== "user") return;
      updateMessage(activeChat.id, messageId, { content: "", streaming: true });

      const model = getModel(activeChat.modelId);
      const ac = new AbortController();
      abortRef.current = ac;
      setIsStreaming(true);

      try {
        let acc = "";
        for await (const token of streamReply(userMsg.content, model, ac.signal)) {
          acc += token;
          updateMessage(activeChat.id, messageId, { content: acc });
        }
      } finally {
        updateMessage(activeChat.id, messageId, { streaming: false });
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeChat, updateMessage],
  );

  return { activeChat, isStreaming, send, stop, regenerate };
}

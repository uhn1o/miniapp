"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatStream } from "@/components/ChatStream";
import { Composer } from "@/components/Composer";
import { HistorySheet } from "@/components/HistorySheet";
import { SettingsSheet } from "@/components/SettingsSheet";
import { TopBar } from "@/components/TopBar";
import { useChat } from "@/hooks/useChat";
import { useTelegram } from "@/hooks/useTelegram";
import { useStore } from "@/lib/store";

export default function Home() {
  useTelegram();
  const { activeChat, isStreaming, send, stop, regenerate } = useChat();
  const newChat = useStore((s) => s.newChat);
  const chats = useStore((s) => s.chats);
  const deleteMessage = useStore((s) => s.deleteMessage);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    if (chats.length === 0) newChat();
  }, [chats.length, newChat]);

  const consumeSuggestion = useCallback(() => setSuggestion(""), []);

  return (
    <div className="h-dvh">
      <TopBar onHistory={() => setHistoryOpen(true)} onSettings={() => setSettingsOpen(true)} />
      <ChatStream
        chat={activeChat}
        onRegenerate={regenerate}
        onDelete={(msgId) => activeChat && deleteMessage(activeChat.id, msgId)}
        onSuggestion={(text) => setSuggestion(text)}
      />
      <Composer
        onSend={send}
        onStop={stop}
        isStreaming={isStreaming}
        externalValue={suggestion}
        onExternalConsumed={consumeSuggestion}
      />
      <HistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

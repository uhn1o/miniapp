"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getModel } from "@/lib/models";
import { Sheet } from "./Sheet";
import { ModelLogo } from "./ModelLogo";
import { formatRelative, cn } from "@/lib/utils";
import { haptic } from "@/lib/telegram";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function HistorySheet({ open, onClose }: Props) {
  const chats = useStore((s) => s.chats);
  const activeChatId = useStore((s) => s.activeChatId);
  const setActiveChat = useStore((s) => s.setActiveChat);
  const deleteChat = useStore((s) => s.deleteChat);
  const clearAllChats = useStore((s) => s.clearAllChats);
  const newChat = useStore((s) => s.newChat);
  const settings = useStore((s) => s.settings);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) setConfirmClear(false);
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Історія розмов"
      footer={
        chats.length > 0 ? (
          confirmClear ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => setConfirmClear(false)}
                className="ripple flex-1 rounded-full border border-[var(--color-app-line)] bg-tertiary-700/42 py-2.5 text-sm font-semibold text-[var(--color-text-strong)] active:bg-tertiary-700/68"
              >
                Скасувати
              </button>
              <button
                onClick={() => {
                  clearAllChats();
                  if (settings.hapticsEnabled) haptic("heavy");
                  setConfirmClear(false);
                  onClose();
                }}
                className="ripple flex-1 rounded-full py-2.5 text-sm font-semibold text-neutral-50 active:scale-[0.98]"
                style={{ background: "var(--color-danger)" }}
              >
                Так, видалити все
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => {
                setConfirmClear(true);
                if (settings.hapticsEnabled) haptic("medium");
              }}
              className="ripple flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 py-2.5 text-sm font-semibold text-[var(--color-danger)] active:bg-[var(--color-danger)]/18"
            >
              <Trash2 size={15} />
              Очистити всі чати
            </button>
          )
        ) : null
      }
    >
      {chats.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <div className="icon-soft mb-3 grid h-14 w-14 place-items-center rounded-full">
            <MessageSquare size={24} />
          </div>
          <p className="font-display text-[17px] font-semibold text-[var(--color-text-strong)]">Поки що порожньо</p>
          <p className="mt-1 max-w-[240px] text-sm text-[var(--color-text-muted)]">
            Почни нову розмову — вона зʼявиться тут.
          </p>
          <button
            className="btn-primary mt-5 rounded-full px-5 py-2.5 text-sm font-semibold"
            onClick={() => {
              newChat();
              if (settings.hapticsEnabled) haptic("medium");
              onClose();
            }}
          >
            Нова розмова
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {chats.map((chat) => {
              const model = getModel(chat.modelId);
              const last = chat.messages[chat.messages.length - 1];
              const active = chat.id === activeChatId;
              return (
                <motion.li
                  key={chat.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className={cn(
                    "ripple group relative flex items-center gap-3 rounded-[22px] border p-3 transition-colors",
                    active
                      ? "border-primary-500/55 bg-primary-500/14"
                      : "border-[var(--color-app-line)] bg-tertiary-700/42 active:bg-tertiary-700/68",
                  )}
                  onClick={() => {
                    setActiveChat(chat.id);
                    if (settings.hapticsEnabled) haptic("light");
                    onClose();
                  }}
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-neutral-50"
                    style={{ background: model.accent }}
                  >
                    <ModelLogo family={model.family} size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate font-display text-[15px] font-semibold text-[var(--color-text-strong)]">
                        {chat.title}
                      </h3>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-dim)]">
                        {formatRelative(chat.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-[var(--color-text-muted)]">
                      {last ? last.content.slice(0, 80) : "Порожня розмова"}
                    </p>
                    <span className="chip chip-beta mt-1.5">{model.shortName}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                      if (settings.hapticsEnabled) haptic("heavy");
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-text-dim)] transition-colors hover:bg-[var(--color-danger)]/16 hover:text-[var(--color-danger)] active:scale-90"
                    aria-label="Видалити"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </Sheet>
  );
}

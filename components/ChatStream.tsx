"use client";

import { motion } from "framer-motion";
import { MessageSquarePlus, Leaf } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { getModel } from "@/lib/models";
import { MessageBubble } from "./MessageBubble";
import type { Chat } from "@/lib/types";

interface Props {
  chat: Chat | null;
  onRegenerate?: (messageId: string) => void;
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  { chip: "new", title: "Поясни код", text: "Поясни мені цей фрагмент коду рядок за рядком" },
  { chip: "premium", title: "Напиши пост", text: "Напиши короткий пост для соцмереж про..." },
  { chip: "beta", title: "Згенеруй ідеї", text: "Дай 5 креативних ідей для..." },
  { chip: "soon", title: "Знайди баг", text: "Допоможи знайти помилку в цьому коді:" },
] as const;

export function ChatStream({ chat, onRegenerate, onSuggestion }: Props) {
  const currentModelId = useStore((s) => s.currentModelId);
  const model = getModel(chat?.modelId ?? currentModelId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, chat?.messages[chat.messages.length - 1]?.content]);

  const empty = !chat || chat.messages.length === 0;

  return (
    <div ref={scrollRef} className="relative h-full overflow-y-auto px-4 pb-44 pt-24">
      {empty ? (
        <EmptyState model={model} onSuggestion={onSuggestion} />
      ) : (
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          {chat.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onRegenerate={
                m.role === "assistant" && onRegenerate ? () => onRegenerate(m.id) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  model,
  onSuggestion,
}: {
  model: ReturnType<typeof getModel>;
  onSuggestion?: (text: string) => void;
}) {
  return (
    <motion.div
      className="mx-auto flex max-w-xl flex-col items-center pt-6 text-center"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
        transition={{ type: "spring", damping: 20, stiffness: 220 }}
        className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary-500 text-neutral-50 shadow-[var(--shadow-press)]"
      >
        <Leaf size={32} strokeWidth={2.2} />
      </motion.div>

      <motion.h1
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="font-display text-[28px] font-bold leading-tight tracking-tight text-[var(--color-text-strong)]"
      >
        Привіт. Я <span className="text-secondary-300">{model.shortName}</span>
      </motion.h1>

      <motion.p
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--color-text-muted)]"
      >
        Спокійний AI-чат у Telegram стилі: без зайвого шуму, з мʼякими оливковими акцентами.
      </motion.p>

      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        className="mt-8 grid w-full grid-cols-2 gap-2.5"
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ delay: 0.16 + i * 0.04 }}
            onClick={() => onSuggestion?.(s.text)}
            className="ripple surface-soft group flex min-h-[118px] flex-col items-start gap-3 rounded-[22px] p-4 text-left active:scale-[0.98]"
          >
            <span className={`chip chip-${s.chip}`}>{s.chip}</span>
            <span className="font-display text-[16px] font-semibold text-[var(--color-text-strong)]">
              {s.title}
            </span>
            <span className="line-clamp-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              {s.text}
            </span>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-app-line)] bg-tertiary-700/34 px-3 py-1.5 text-[11px] text-[var(--color-text-muted)]"
      >
        <MessageSquarePlus size={12} />
        <span className="font-mono uppercase tracking-[0.14em]">Demo • mock streaming</span>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { getModel } from "@/lib/models";
import { MessageBubble } from "./MessageBubble";
import { useT, type TKey } from "@/lib/i18n";
import type { Chat } from "@/lib/types";

interface Props {
  chat: Chat | null;
  onRegenerate?: (messageId: string, modelId?: string) => void;
  onDelete?: (messageId: string) => void;
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  { chip: "new", titleKey: "suggest.code.title", textKey: "suggest.code.text" },
  { chip: "premium", titleKey: "suggest.post.title", textKey: "suggest.post.text" },
  { chip: "beta", titleKey: "suggest.ideas.title", textKey: "suggest.ideas.text" },
  { chip: "soon", titleKey: "suggest.bug.title", textKey: "suggest.bug.text" },
] as const satisfies ReadonlyArray<{ chip: string; titleKey: TKey; textKey: TKey }>;

export function ChatStream({ chat, onRegenerate, onDelete, onSuggestion }: Props) {
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
                m.role === "assistant" && onRegenerate
                  ? (modelId) => onRegenerate(m.id, modelId)
                  : undefined
              }
              onDelete={onDelete ? () => onDelete(m.id) : undefined}
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
  const { t } = useT();
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
        {t("chat.greeting")} <span className="text-secondary-300">{model.shortName}</span>
      </motion.h1>

      <motion.p
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--color-text-muted)]"
      >
        {t("chat.subtitle")}
      </motion.p>

      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
        className="mt-8 grid w-full grid-cols-2 gap-2.5"
      >
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.titleKey}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            transition={{ delay: 0.16 + i * 0.04 }}
            onClick={() => onSuggestion?.(t(s.textKey))}
            className="ripple surface-soft group flex min-h-[118px] flex-col items-start gap-3 rounded-[22px] p-4 text-left active:scale-[0.98]"
          >
            <span className={`chip chip-${s.chip}`}>{s.chip}</span>
            <span className="font-display text-[16px] font-semibold text-[var(--color-text-strong)]">
              {t(s.titleKey)}
            </span>
            <span className="line-clamp-2 text-[12px] leading-relaxed text-[var(--color-text-muted)]">
              {t(s.textKey)}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

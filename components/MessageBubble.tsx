"use client";

import { motion } from "framer-motion";
import { Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/types";
import { getModel } from "@/lib/models";
import { cn } from "@/lib/utils";
import { formatTime, useT } from "@/lib/i18n";
import { haptic } from "@/lib/telegram";
import { useStore } from "@/lib/store";
import { ModelLogo } from "./ModelLogo";

interface Props {
  message: Message;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, onRegenerate }: Props) {
  const isUser = message.role === "user";
  const model = message.modelId ? getModel(message.modelId) : null;
  const settings = useStore((s) => s.settings);
  const { t, lang } = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    if (settings.hapticsEnabled) haptic("light");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.div
      className={cn("flex w-full gap-2.5", isUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 280 }}
    >
      {!isUser && model && (
        <div
          className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-50"
          style={{ background: model.accent }}
        >
          <ModelLogo family={model.family} size={16} />
        </div>
      )}

      <div className={cn("flex min-w-0 max-w-[78%] flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] px-4 py-3 text-[15px] leading-relaxed",
            isUser
              ? "btn-primary rounded-[22px] rounded-br-md"
              : "surface-soft rounded-[22px] rounded-bl-md text-[var(--color-text-strong)]",
          )}
        >
          {renderContent(message.content)}
          {message.streaming && (
            <span className="ml-1 inline-flex translate-y-0.5 gap-1">
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-secondary-400" />
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-secondary-400" />
              <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-secondary-400" />
            </span>
          )}
        </div>

        <div
          className={cn(
            "mt-1 flex items-center gap-2 px-1 text-[11px] text-[var(--color-text-dim)]",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-mono">{formatTime(message.createdAt, lang)}</span>
          {!isUser && !message.streaming && (
            <>
              <button
                onClick={copy}
                className="rounded-full p-1 transition-colors hover:bg-secondary-400/10 active:scale-90"
                aria-label={t("bubble.copy")}
              >
                <Copy size={11} />
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="rounded-full p-1 transition-colors hover:bg-secondary-400/10 active:scale-90"
                  aria-label={t("bubble.regen")}
                >
                  <RotateCcw size={11} />
                </button>
              )}
              {copied && <span className="text-secondary-300">{t("bubble.copied")}</span>}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```|\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
      return (
        <pre
          key={i}
          className="my-2 max-w-full overflow-hidden rounded-2xl border border-[var(--color-app-line)] bg-tertiary-950/65 p-3 font-mono text-[13px] leading-relaxed text-secondary-200"
        >
          <code className="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{code}</code>
        </pre>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-display font-semibold text-[var(--color-text-strong)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded-md bg-secondary-400/12 px-1.5 py-0.5 font-mono text-[13px] text-secondary-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

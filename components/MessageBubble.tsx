"use client";

import { motion } from "framer-motion";
import { Copy, RotateCcw, Sparkles, Trash2, Check } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/types";
import { MODELS, getModel } from "@/lib/models";
import { cn } from "@/lib/utils";
import { formatTime, useT } from "@/lib/i18n";
import { haptic, hapticSelection } from "@/lib/telegram";
import { useStore } from "@/lib/store";
import { ModelLogo } from "./ModelLogo";
import { Sheet } from "./Sheet";

interface Props {
  message: Message;
  onRegenerate?: (modelId?: string) => void;
  onDelete?: () => void;
}

export function MessageBubble({ message, onRegenerate, onDelete }: Props) {
  const isUser = message.role === "user";
  const model = message.modelId ? getModel(message.modelId) : null;
  const settings = useStore((s) => s.settings);
  const { t, lang } = useT();
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

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
                  onClick={() => onRegenerate()}
                  className="rounded-full p-1 transition-colors hover:bg-secondary-400/10 active:scale-90"
                  aria-label={t("bubble.regen")}
                >
                  <RotateCcw size={11} />
                </button>
              )}
              {onRegenerate && (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="rounded-full p-1 transition-colors hover:bg-secondary-400/10 active:scale-90"
                  aria-label={t("bubble.regenWith")}
                >
                  <Sparkles size={11} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (settings.hapticsEnabled) haptic("medium");
                    onDelete();
                  }}
                  className="rounded-full p-1 transition-colors hover:bg-secondary-400/10 active:scale-90"
                  aria-label={t("bubble.delete")}
                >
                  <Trash2 size={11} />
                </button>
              )}
              {copied && <span className="text-secondary-300">{t("bubble.copied")}</span>}
            </>
          )}
        </div>
      </div>

      {!isUser && onRegenerate && (
        <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title={t("bubble.pickModel")}>
          <div className="space-y-2">
            {MODELS.map((m) => {
              const selected = m.id === message.modelId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (settings.hapticsEnabled) hapticSelection();
                    setPickerOpen(false);
                    onRegenerate(m.id);
                  }}
                  className={cn(
                    "ripple flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition-colors",
                    selected
                      ? "border-primary-500/55 bg-primary-500/14"
                      : "border-[var(--color-app-line)] bg-tertiary-700/42 active:bg-tertiary-700/68",
                  )}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-50"
                    style={{ background: m.accent }}
                  >
                    <ModelLogo family={m.family} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-semibold text-[var(--color-text-strong)]">
                      {m.name}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--color-text-muted)]">
                      {m.blurb}
                    </span>
                  </span>
                  {selected && (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-500 text-neutral-50">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </motion.div>
  );
}

function renderContent(text: string) {
  const blocks = splitBlocks(text);
  return blocks.map((block, i) => renderBlock(block, i));
}

type Block =
  | { kind: "code"; lang: string; body: string }
  | { kind: "heading"; level: number; body: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; body: string }
  | { kind: "hr" }
  | { kind: "p"; body: string };

function splitBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ kind: "code", lang, body: body.join("\n") });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^\s{0,3}(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, body: heading[2].trim() });
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ kind: "quote", body: body.join("\n") });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    const body: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("```") &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      body.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", body: body.join("\n") });
  }

  return blocks;
}

function renderBlock(block: Block, key: number) {
  if (block.kind === "code") {
    return (
      <pre
        key={key}
        className="my-2 max-w-full overflow-hidden rounded-2xl border border-[var(--color-app-line)] bg-tertiary-950/65 p-3 font-mono text-[13px] leading-relaxed text-secondary-200"
      >
        <code className="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{block.body}</code>
      </pre>
    );
  }
  if (block.kind === "heading") {
    const sizes = ["text-[20px]", "text-[18px]", "text-[16px]", "text-[15px]", "text-[15px]", "text-[15px]"];
    const size = sizes[block.level - 1] ?? "text-[15px]";
    return (
      <p
        key={key}
        className={cn(
          "mb-1.5 mt-2 first:mt-0 font-display font-semibold text-[var(--color-text-strong)]",
          size,
        )}
      >
        {renderInline(block.body)}
      </p>
    );
  }
  if (block.kind === "ul") {
    return (
      <ul key={key} className="my-1.5 list-disc space-y-0.5 pl-5 marker:text-secondary-400">
        {block.items.map((it, j) => (
          <li key={j}>{renderInline(it)}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === "ol") {
    return (
      <ol key={key} className="my-1.5 list-decimal space-y-0.5 pl-5 marker:text-secondary-400">
        {block.items.map((it, j) => (
          <li key={j}>{renderInline(it)}</li>
        ))}
      </ol>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote
        key={key}
        className="my-1.5 border-l-2 border-secondary-400/50 pl-3 italic text-[var(--color-text-muted)]"
      >
        {renderInline(block.body)}
      </blockquote>
    );
  }
  if (block.kind === "hr") {
    return <hr key={key} className="my-3 border-[var(--color-app-line)]" />;
  }
  return (
    <p key={key} className="whitespace-pre-wrap [&:not(:last-child)]:mb-1.5">
      {renderInline(block.body)}
    </p>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={i} className="font-display font-semibold text-[var(--color-text-strong)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
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
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noreferrer noopener"
          className="text-secondary-300 underline decoration-secondary-400/40 underline-offset-2 hover:decoration-secondary-300"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

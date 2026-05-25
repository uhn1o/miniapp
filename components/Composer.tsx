"use client";

import { motion } from "framer-motion";
import { ArrowUp, Mic, Paperclip, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { haptic } from "@/lib/telegram";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  externalValue?: string;
  onExternalConsumed?: () => void;
  bottomOffset?: number;
}

export function Composer({ onSend, onStop, isStreaming, externalValue, onExternalConsumed, bottomOffset = 0 }: Props) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    if (externalValue) {
      setValue(externalValue);
      onExternalConsumed?.();
      taRef.current?.focus();
    }
  }, [externalValue, onExternalConsumed]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    if (settings.hapticsEnabled) haptic("medium");
    onSend(text);
    setValue("");
  };

  return (
    <motion.div
      className="fixed inset-x-0 z-20 px-3 safe-bottom"
      style={{ bottom: bottomOffset }}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 260, delay: 0.05 }}
    >
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-32"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(17,23,15,0.78) 45%, rgba(17,23,15,0.96) 100%)",
        }}
      />

      <div className="mx-auto flex max-w-xl items-end gap-2 pb-3">
        <div className="surface flex min-w-0 flex-1 items-end gap-2 rounded-[26px] px-3 py-2.5">
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 active:scale-90"
            aria-label="Прикріпити"
            onClick={() => settings.hapticsEnabled && haptic("light")}
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && settings.sendOnEnter) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Search anything..."
            rows={1}
            className="min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-[var(--color-text-strong)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
          />

          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-400 active:scale-90"
            aria-label="Голосове"
            onClick={() => settings.hapticsEnabled && haptic("light")}
          >
            <Mic size={18} />
          </button>
        </div>

        {isStreaming ? (
          <motion.button
            key="stop"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-danger)] text-neutral-50 shadow-[var(--shadow-press)] active:scale-95"
            onClick={() => {
              if (settings.hapticsEnabled) haptic("heavy");
              onStop?.();
            }}
            aria-label="Зупинити"
          >
            <Square size={18} fill="currentColor" />
          </motion.button>
        ) : (
          <motion.button
            key="send"
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            disabled={!value.trim()}
            className="btn-primary grid h-12 w-12 shrink-0 place-items-center rounded-full disabled:opacity-40 disabled:saturate-50"
            onClick={submit}
            aria-label="Надіслати"
          >
            <ArrowUp size={20} strokeWidth={2.6} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

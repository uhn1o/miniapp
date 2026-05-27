"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { MODELS, getModel } from "@/lib/models";
import { hapticSelection } from "@/lib/telegram";
import { useStore } from "@/lib/store";
import { ModelBadge } from "./ModelBadge";
import { ModelLogo } from "./ModelLogo";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VENDOR_LABEL = { anthropic: "Anthropic", openai: "OpenAI" } as const;

export function ModelPicker({ open, onOpenChange }: Props) {
  const currentModelId = useStore((s) => s.currentModelId);
  const setModel = useStore((s) => s.setModel);
  const settings = useStore((s) => s.settings);
  const current = getModel(currentModelId);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={wrapRef} className="relative">
      <motion.button
        className="ripple surface-soft flex w-full min-w-0 items-center gap-2 rounded-full px-3 py-2 text-left"
        onClick={() => onOpenChange(!open)}
        whileTap={{ scale: 0.97 }}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-500 text-neutral-50">
          <ModelLogo family={current.family} size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[15px] font-semibold text-[var(--color-text-strong)]">
            {current.shortName}
          </span>
          <span className="block truncate text-[10px] text-[var(--color-text-muted)]">
            {VENDOR_LABEL[current.vendor]}
          </span>
        </span>
        <motion.span
          className="shrink-0 text-[var(--color-text-muted)]"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
        >
          <ChevronDown size={16} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="surface absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-[var(--color-app-line)] p-1.5 shadow-[var(--shadow-press)]"
          >
            {MODELS.map((m) => {
              const selected = m.id === currentModelId;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setModel(m.id);
                    if (settings.hapticsEnabled) hapticSelection();
                    onOpenChange(false);
                  }}
                  className={cn(
                    "ripple flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    selected ? "bg-primary-500/16" : "hover:bg-secondary-400/8 active:bg-tertiary-700/68",
                  )}
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-50"
                    style={{ background: m.accent }}
                  >
                    <ModelLogo family={m.family} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[14px] font-semibold text-[var(--color-text-strong)]">
                      {m.name}
                    </span>
                    {settings.showModelBadges && (
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <ModelBadge model={m} />
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {VENDOR_LABEL[m.vendor]}
                        </span>
                      </span>
                    )}
                  </span>
                  {selected && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-500 text-neutral-50">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

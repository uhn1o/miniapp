"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { getModel } from "@/lib/models";
import { useModels } from "@/hooks/useModels";
import { hapticSelection } from "@/lib/telegram";
import { useStore } from "@/lib/store";
import type { ModelInfo } from "@/lib/types";
import { ModelBadge } from "./ModelBadge";
import { ModelLogo } from "./ModelLogo";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VENDOR_LABEL = { anthropic: "Anthropic", openai: "OpenAI" } as const;
const VENDOR_ORDER: ModelInfo["vendor"][] = ["anthropic", "openai"];

export function ModelPicker({ open, onOpenChange }: Props) {
  const currentModelId = useStore((s) => s.currentModelId);
  const setModel = useStore((s) => s.setModel);
  const settings = useStore((s) => s.settings);
  const { models, status } = useModels();
  // Якщо поточна модель є в списку — беремо її; інакше декоруємо ID на льоту.
  const current = models.find((m) => m.id === currentModelId) ?? getModel(currentModelId);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Групуємо моделі по вендору й тримаємо стабільний порядок: Anthropic → OpenAI → інші.
  const grouped = useMemo(() => {
    const buckets = new Map<ModelInfo["vendor"], ModelInfo[]>();
    for (const m of models) {
      const arr = buckets.get(m.vendor);
      if (arr) arr.push(m);
      else buckets.set(m.vendor, [m]);
    }
    const ordered: { vendor: ModelInfo["vendor"]; items: ModelInfo[] }[] = [];
    for (const v of VENDOR_ORDER) {
      const items = buckets.get(v);
      if (items && items.length) ordered.push({ vendor: v, items });
      buckets.delete(v);
    }
    for (const [v, items] of buckets) {
      if (items.length) ordered.push({ vendor: v, items });
    }
    return ordered;
  }, [models]);

  // Якщо адмін зняв публікацію поточної моделі — переключитися на першу доступну.
  useEffect(() => {
    if (status !== "ready" || models.length === 0) return;
    if (!models.some((m) => m.id === currentModelId)) {
      setModel(models[0].id);
    }
  }, [status, models, currentModelId, setModel]);

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
            {status === "loading" && models.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-3 py-4 text-[12px] text-[var(--color-text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                Завантаження моделей…
              </div>
            )}
            {status === "ready" && models.length === 0 && (
              <div className="px-3 py-4 text-center text-[12px] text-[var(--color-text-muted)]">
                Немає доступних моделей
              </div>
            )}
            {status === "error" && (
              <div className="px-3 py-4 text-center text-[12px] text-[#e2998f]">
                Помилка завантаження
              </div>
            )}
            {grouped.map(({ vendor, items }, gi) => (
              <div key={vendor} className={cn(gi > 0 && "mt-1.5 border-t border-[var(--color-app-line)] pt-1.5")}>
                <div className="px-2.5 pb-1 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
                  {VENDOR_LABEL[vendor] ?? vendor}
                </div>
                {items.map((m) => {
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
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

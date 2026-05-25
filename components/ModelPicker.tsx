"use client";

import { motion } from "framer-motion";
import { Check, ChevronDown, Leaf } from "lucide-react";
import { MODELS, getModel } from "@/lib/models";
import { hapticSelection } from "@/lib/telegram";
import { useStore } from "@/lib/store";
import { ModelBadge } from "./ModelBadge";
import { ModelLogo } from "./ModelLogo";
import { Sheet } from "./Sheet";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PREMIUM_MODEL_ID = "claude-opus-4-7";
const VENDOR_LABEL = { anthropic: "Anthropic", openai: "OpenAI" } as const;

export function ModelPicker({ open, onOpenChange }: Props) {
  const currentModelId = useStore((s) => s.currentModelId);
  const setModel = useStore((s) => s.setModel);
  const settings = useStore((s) => s.settings);
  const current = getModel(currentModelId);

  return (
    <>
      <motion.button
        className="ripple surface-soft flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-left"
        onClick={() => onOpenChange(true)}
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
        <ChevronDown size={16} className="shrink-0 text-[var(--color-text-muted)]" />
      </motion.button>

      <Sheet open={open} onClose={() => onOpenChange(false)} title="Обери модель">
        <div className="mb-4 rounded-[22px] border border-[var(--color-app-line)] bg-secondary-400/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-secondary-300">
            <Leaf size={16} />
            <span className="font-display text-sm font-semibold text-[var(--color-text-strong)]">
              Спокійний режим
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            Демо-версія. Моделі перемикаються миттєво, а відповіді стрімляться локально.
          </p>
        </div>

        <div className="space-y-2.5">
          {MODELS.map((model, index) => {
            const selected = model.id === currentModelId;
            const isPremium = model.id === PREMIUM_MODEL_ID;
            return (
              <motion.button
                key={model.id}
                className={cn(
                  "ripple relative w-full rounded-[24px] border p-4 text-left transition-colors",
                  selected
                    ? "border-primary-500/55 bg-primary-500/14"
                    : "border-[var(--color-app-line)] bg-tertiary-700/42 active:bg-tertiary-700/68",
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  setModel(model.id);
                  if (settings.hapticsEnabled) hapticSelection();
                  onOpenChange(false);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-full shadow-[var(--shadow-press)]",
                      selected ? "bg-primary-500 text-neutral-50" : "bg-secondary-400/16 text-secondary-200",
                    )}
                  >
                    <ModelLogo family={model.family} size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-[17px] font-semibold text-[var(--color-text-strong)]">
                        {model.name}
                      </h3>
                      {isPremium && <span className="chip chip-premium">Premium</span>}
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{model.blurb}</p>
                    {settings.showModelBadges && (
                      <div className="mt-3 flex items-center gap-2">
                        <ModelBadge model={model} />
                        <span className="rounded-full border border-[var(--color-app-line)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                          {VENDOR_LABEL[model.vendor]}
                        </span>
                      </div>
                    )}
                  </div>

                  {selected && (
                    <motion.div
                      layoutId="selected-model-check"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-500 text-neutral-50"
                    >
                      <Check size={16} strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}

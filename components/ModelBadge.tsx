"use client";

import { Sparkles, Zap, Crown } from "lucide-react";
import type { ModelInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT, type TKey } from "@/lib/i18n";

const TIER_ICON = {
  flagship: Crown,
  balanced: Sparkles,
  fast: Zap,
} as const;

const TIER_LABEL_KEY: Record<ModelInfo["tier"], TKey> = {
  flagship: "badge.flagship",
  balanced: "badge.balanced",
  fast: "badge.fast",
};

interface Props {
  model: ModelInfo;
  size?: "sm" | "md";
  className?: string;
}

export function ModelBadge({ model, size = "sm", className }: Props) {
  const Icon = TIER_ICON[model.tier];
  const { t } = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[var(--color-app-line)]",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      style={{ background: "rgba(167,191,165,0.08)", color: "var(--color-secondary-300)" }}
    >
      <Icon size={size === "sm" ? 10 : 12} strokeWidth={2.2} />
      <span className="font-mono uppercase tracking-[0.14em]">{t(TIER_LABEL_KEY[model.tier])}</span>
    </span>
  );
}

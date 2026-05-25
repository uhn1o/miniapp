"use client";

import { cn } from "@/lib/utils";

type ChipKind = "new" | "premium" | "beta" | "soon";

interface Props {
  kind: ChipKind;
  children?: React.ReactNode;
  className?: string;
}

const LABELS: Record<ChipKind, string> = {
  new: "New",
  premium: "Premium",
  beta: "Beta",
  soon: "Soon",
};

export function Chip({ kind, children, className }: Props) {
  return (
    <span className={cn(`chip chip-${kind}`, className)}>{children ?? LABELS[kind]}</span>
  );
}

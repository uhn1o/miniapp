"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

export function Sheet({ open, onClose, title, children, footer, maxHeight = "85vh" }: Props) {
  const { t } = useT();
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 surface rounded-t-[30px] safe-bottom",
            )}
            style={{ maxHeight }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-[var(--color-neutral-400)]/35" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-5 pb-3 pt-1">
                <h2 className="font-display text-xl font-semibold text-[var(--color-text-strong)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="icon-soft grid h-9 w-9 place-items-center rounded-full"
                  aria-label={t("sheet.close")}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div
              className="overflow-y-auto px-5 pb-6"
              style={{ maxHeight: `calc(${maxHeight} - ${footer ? "150px" : "80px"})` }}
            >
              {children}
            </div>

            {footer && (
              <div className="border-t border-[var(--color-app-line)] px-5 pt-3 pb-2">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

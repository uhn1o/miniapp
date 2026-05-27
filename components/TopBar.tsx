"use client";

import { motion } from "framer-motion";
import { History, Plus, Settings, Shield } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModelPicker } from "./ModelPicker";
import { haptic } from "@/lib/telegram";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useOwner } from "@/hooks/useOwner";

interface Props {
  onHistory: () => void;
  onSettings: () => void;
}

export function TopBar({ onHistory, onSettings }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const newChat = useStore((s) => s.newChat);
  const currentModelId = useStore((s) => s.currentModelId);
  const settings = useStore((s) => s.settings);
  const { t } = useT();
  const ownerStatus = useOwner();
  const router = useRouter();

  const tap = () => settings.hapticsEnabled && haptic("light");

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-30 safe-top"
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => {
            tap();
            onHistory();
          }}
          className="icon-soft grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label={t("topbar.history")}
        >
          <History size={19} />
        </button>

        <div className="min-w-0 flex-1">
          <ModelPicker open={pickerOpen} onOpenChange={setPickerOpen} />
        </div>

        <button
          onClick={() => {
            tap();
            newChat(currentModelId);
          }}
          className="btn-primary grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label={t("topbar.newChat")}
        >
          <Plus size={20} strokeWidth={2.6} />
        </button>

        {ownerStatus === "owner" && (
          <button
            onClick={() => {
              tap();
              router.push("/admin");
            }}
            className="icon-soft grid h-11 w-11 shrink-0 place-items-center rounded-full"
            aria-label={t("topbar.admin")}
            title={t("topbar.admin")}
          >
            <Shield size={19} />
          </button>
        )}

        <button
          onClick={() => {
            tap();
            onSettings();
          }}
          className="icon-soft grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label={t("topbar.settings")}
        >
          <Settings size={19} />
        </button>
      </div>
    </motion.header>
  );
}

"use client";

import { useEffect } from "react";
import { initTelegram } from "@/lib/telegram";
import { useStore } from "@/lib/store";

export function useTelegram() {
  const lang = useStore((s) => s.settings.language);

  useEffect(() => {
    initTelegram();
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);
}

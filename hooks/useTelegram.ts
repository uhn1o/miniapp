"use client";

import { useEffect } from "react";
import { initTelegram } from "@/lib/telegram";

export function useTelegram() {
  useEffect(() => {
    initTelegram();
  }, []);
}

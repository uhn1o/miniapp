"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminApiError } from "@/lib/adminApi";
import { tg } from "@/lib/telegram";

type Status = "checking" | "owner" | "denied";

let cached: Status | null = null;
const listeners = new Set<(s: Status) => void>();

function publish(next: Status) {
  cached = next;
  listeners.forEach((l) => l(next));
}

function waitForInitData(timeoutMs = 3000): Promise<string> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const data = tg()?.initData ?? "";
      if (data) return resolve(data);
      if (Date.now() - start >= timeoutMs) return resolve("");
      setTimeout(tick, 100);
    };
    tick();
  });
}

async function probe() {
  if (cached === "owner" || cached === "denied") return;

  const initData = await waitForInitData();
  if (!initData) {
    console.warn("[useOwner] no initData after wait — opened outside Telegram?");
    publish("denied");
    return;
  }

  try {
    const res = await adminApi.whoami();
    console.info("[useOwner] whoami ok", res);
    publish("owner");
  } catch (e) {
    if (e instanceof AdminApiError) {
      // 403 — авторизован, но не овнер; 401 — нет initData / просрочена; 5xx — бэк лежит
      console.warn("[useOwner] whoami failed", e.status, e.message);
    } else {
      console.error("[useOwner] whoami error", e);
    }
    publish("denied");
  }
}

export function useOwner(): Status {
  const [status, setStatus] = useState<Status>(cached ?? "checking");

  useEffect(() => {
    listeners.add(setStatus);
    if (cached === null) {
      cached = "checking";
      probe();
    }
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return status;
}

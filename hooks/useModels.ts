"use client";

import { useEffect, useState } from "react";
import { tg } from "@/lib/telegram";
import { buildModelInfo } from "@/lib/models";
import type { ModelInfo } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";
const BG_REFRESH_MS = 90_000; // тихий рефетч раз на 90с

interface ApiModel {
  id: string;
  display_name: string | null;
  vendor: string | null;
  family: string | null;
  public: boolean;
}

type Status = "loading" | "ready" | "error";

let cache: ModelInfo[] | null = null;
let inflight: Promise<ModelInfo[]> | null = null;
let refreshing = false;
const listeners = new Set<(s: Status, m: ModelInfo[]) => void>();
let bgTimer: ReturnType<typeof setInterval> | null = null;
let visListenerInstalled = false;

function publish(status: Status, models: ModelInfo[]) {
  listeners.forEach((l) => l(status, models));
}

/** Глибше порівняння: список «не змінився» лише якщо збігаються id, назва, вендор і порядок. */
function sameList(a: ModelInfo[], b: ModelInfo[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].name !== b[i].name ||
      a[i].vendor !== b[i].vendor ||
      a[i].family !== b[i].family
    ) {
      return false;
    }
  }
  return true;
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

async function load(): Promise<ModelInfo[]> {
  if (inflight) return inflight;
  inflight = (async () => {
    const initData = await waitForInitData();
    if (!initData) {
      console.warn("[useModels] no initData — opened outside Telegram?");
      return cache ?? [];
    }
    const resp = await fetch(`${BACKEND_URL}/api/models`, {
      headers: { "X-Telegram-Init-Data": initData },
      cache: "no-store",
    });
    if (!resp.ok) {
      console.warn("[useModels] /api/models", resp.status);
      return cache ?? [];
    }
    const data = (await resp.json()) as { models: ApiModel[] };
    const list = (data.models ?? []).map((m) =>
      buildModelInfo(m.id, m.display_name, m.vendor, m.family),
    );
    cache = list;
    return list;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** Тихий рефетч у фоні: оновлює підписників лише якщо список реально змінився. */
async function silentRefresh() {
  if (typeof document !== "undefined" && document.hidden) return;
  if (refreshing) return; // не дублюємо запит (interval + focus + visibilitychange)
  refreshing = true;
  try {
    const prev = cache;
    const list = await load();
    if (!prev || !sameList(prev, list)) {
      publish("ready", list);
    }
  } catch (e) {
    console.warn("[useModels] silent refresh error", e);
  } finally {
    refreshing = false;
  }
}

function ensureBackgroundRefresh() {
  if (typeof window === "undefined") return;
  if (!visListenerInstalled) {
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", silentRefresh);
    visListenerInstalled = true;
  }
  if (bgTimer === null) {
    bgTimer = setInterval(silentRefresh, BG_REFRESH_MS);
  }
}

function onVisible() {
  if (!document.hidden) silentRefresh();
}

/** Зупиняє фонове оновлення, коли не лишилось підписників. */
function teardownBackgroundRefresh() {
  if (typeof window === "undefined") return;
  if (bgTimer !== null) {
    clearInterval(bgTimer);
    bgTimer = null;
  }
  if (visListenerInstalled) {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", silentRefresh);
    visListenerInstalled = false;
  }
}

/** Скинути кеш та одразу перезавантажити для всіх підписників (без мигання, якщо дані вже є). */
export function invalidateModelsCache() {
  const prev = cache;
  cache = null;
  inflight = null;
  if (!prev || prev.length === 0) publish("loading", []);
  load()
    .then((list) => {
      if (!prev || !sameList(prev, list)) publish("ready", list);
    })
    .catch((e) => {
      console.error("[useModels] invalidate reload error", e);
      if (!prev || prev.length === 0) publish("error", []);
    });
}

export function useModels(): { models: ModelInfo[]; status: Status; reload: () => void } {
  const [models, setModels] = useState<ModelInfo[]>(cache ?? []);
  const [status, setStatus] = useState<Status>(cache ? "ready" : "loading");

  useEffect(() => {
    const cb = (s: Status, m: ModelInfo[]) => {
      setStatus(s);
      setModels(m);
    };
    listeners.add(cb);
    ensureBackgroundRefresh();

    if (cache === null && !inflight) {
      load()
        .then((list) => publish("ready", list))
        .catch((e) => {
          console.error("[useModels] load error", e);
          publish("error", []);
        });
    } else if (cache) {
      setModels(cache);
      setStatus("ready");
      // навіть з кешу — спробуємо тихо підтягнути актуальне
      silentRefresh();
    }

    return () => {
      listeners.delete(cb);
      if (listeners.size === 0) teardownBackgroundRefresh();
    };
  }, []);

  const reload = () => {
    const prev = cache;
    cache = null;
    if (!prev || prev.length === 0) publish("loading", []);
    load()
      .then((list) => {
        if (!prev || !sameList(prev, list)) publish("ready", list);
      })
      .catch((e) => {
        console.error("[useModels] reload error", e);
        if (!prev || prev.length === 0) publish("error", []);
      });
  };

  return { models, status, reload };
}

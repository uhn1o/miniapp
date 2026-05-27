"use client";

import { useEffect, useState } from "react";
import { tg } from "@/lib/telegram";
import { buildModelInfo } from "@/lib/models";
import type { ModelInfo } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";
const BG_REFRESH_MS = 30_000; // тихий рефетч раз на 30с

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
const listeners = new Set<(s: Status, m: ModelInfo[]) => void>();
let bgTimer: ReturnType<typeof setInterval> | null = null;
let visListenerInstalled = false;

function publish(status: Status, models: ModelInfo[]) {
  listeners.forEach((l) => l(status, models));
}

function sameList(a: ModelInfo[], b: ModelInfo[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
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
  try {
    const prev = cache;
    const list = await load();
    if (!prev || !sameList(prev, list)) {
      publish("ready", list);
    }
  } catch (e) {
    console.warn("[useModels] silent refresh error", e);
  }
}

function ensureBackgroundRefresh() {
  if (typeof window === "undefined") return;
  if (!visListenerInstalled) {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) silentRefresh();
    });
    window.addEventListener("focus", silentRefresh);
    visListenerInstalled = true;
  }
  if (bgTimer === null) {
    bgTimer = setInterval(silentRefresh, BG_REFRESH_MS);
  }
}

/** Скинути кеш та одразу перезавантажити для всіх підписників. */
export function invalidateModelsCache() {
  cache = null;
  inflight = null;
  publish("loading", []);
  load()
    .then((list) => publish("ready", list))
    .catch((e) => {
      console.error("[useModels] invalidate reload error", e);
      publish("error", []);
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
    };
  }, []);

  const reload = () => {
    cache = null;
    publish("loading", []);
    load()
      .then((list) => publish("ready", list))
      .catch((e) => {
        console.error("[useModels] reload error", e);
        publish("error", []);
      });
  };

  return { models, status, reload };
}

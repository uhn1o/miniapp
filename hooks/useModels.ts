"use client";

import { useEffect, useState } from "react";
import { tg } from "@/lib/telegram";
import { buildModelInfo } from "@/lib/models";
import type { ModelInfo } from "@/lib/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";

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

function publish(status: Status, models: ModelInfo[]) {
  listeners.forEach((l) => l(status, models));
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
      return [];
    }
    const resp = await fetch(`${BACKEND_URL}/api/models`, {
      headers: { "X-Telegram-Init-Data": initData },
    });
    if (!resp.ok) {
      console.warn("[useModels] /api/models", resp.status);
      return [];
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

export function useModels(): { models: ModelInfo[]; status: Status; reload: () => void } {
  const [models, setModels] = useState<ModelInfo[]>(cache ?? []);
  const [status, setStatus] = useState<Status>(cache ? "ready" : "loading");

  useEffect(() => {
    const cb = (s: Status, m: ModelInfo[]) => {
      setStatus(s);
      setModels(m);
    };
    listeners.add(cb);

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

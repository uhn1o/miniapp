"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminApiError } from "@/lib/adminApi";

type Status = "checking" | "owner" | "denied";

let cached: Status | null = null;
const listeners = new Set<(s: Status) => void>();

function publish(next: Status) {
  cached = next;
  listeners.forEach((l) => l(next));
}

async function probe() {
  if (cached === "owner" || cached === "denied") return;
  try {
    await adminApi.whoami();
    publish("owner");
  } catch (e) {
    if (e instanceof AdminApiError) {
      publish("denied");
    } else {
      publish("denied");
    }
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

"use client";

import { tg } from "./telegram";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8787";

export interface AdminUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language: string | null;
  first_seen: number;
  last_seen: number;
  messages: number;
}

export interface AdminBan {
  user_id: number;
  reason: string | null;
  banned_at: number;
  banned_by: number | null;
}

export interface AdminSubscription {
  user_id: number;
  plan: string;
  started_at: number;
  expires_at: number | null;
  note: string | null;
}

export interface AdminModel {
  id: string;
  display_name: string | null;
  vendor: string | null;
  family: string | null;
  status: "pending" | "approved" | "hidden";
  public: number; // 0 | 1
  first_seen: number;
  last_seen: number;
}

class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const initData = tg()?.initData ?? "";
  if (!initData) throw new AdminApiError(401, "Open via Telegram");
  const headers = new Headers(init.headers);
  headers.set("X-Telegram-Init-Data", initData);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const resp = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!resp.ok) {
    let msg = `${resp.status}`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch {
      // ignore
    }
    throw new AdminApiError(resp.status, msg);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

export const adminApi = {
  whoami: () => request<{ ok: true; user: { id: number } }>("/api/admin/whoami"),

  listUsers: (limit = 500, offset = 0) =>
    request<{ users: AdminUser[]; bans: AdminBan[] }>(
      `/api/admin/users?limit=${limit}&offset=${offset}`,
    ),

  ban: (user_id: number, reason?: string) =>
    request<{ ok: true }>("/api/admin/bans", {
      method: "POST",
      body: JSON.stringify({ user_id, action: "ban", reason }),
    }),

  unban: (user_id: number) =>
    request<{ ok: true }>("/api/admin/bans", {
      method: "POST",
      body: JSON.stringify({ user_id, action: "unban" }),
    }),

  listSubscriptions: () =>
    request<{ subscriptions: AdminSubscription[] }>("/api/admin/subscriptions"),

  setSubscription: (user_id: number, plan: string, expires_at?: number | null, note?: string) =>
    request<{ ok: true }>("/api/admin/subscriptions", {
      method: "POST",
      body: JSON.stringify({ user_id, plan, expires_at: expires_at ?? null, note }),
    }),

  cancelSubscription: (user_id: number) =>
    request<{ ok: true }>("/api/admin/subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ user_id }),
    }),

  listModels: () => request<{ models: AdminModel[] }>("/api/admin/models"),

  setModel: (id: string, status: AdminModel["status"], public_?: boolean) =>
    request<{ ok: true }>("/api/admin/models", {
      method: "POST",
      body: JSON.stringify({ id, status, public: public_ }),
    }),

  refreshModels: () =>
    request<{ ok: true; models: AdminModel[] }>("/api/admin/models/refresh", {
      method: "POST",
    }),
};

export { AdminApiError };

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  Check,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useOwner } from "@/hooks/useOwner";
import { invalidateModelsCache } from "@/hooks/useModels";
import {
  adminApi,
  type AdminBan,
  type AdminModel,
  type AdminSubscription,
  type AdminUser,
} from "@/lib/adminApi";
import { cn } from "@/lib/utils";
import { haptic, hapticNotify } from "@/lib/telegram";

type Tab = "users" | "subs" | "models";

const TABS: { id: Tab; label: string }[] = [
  { id: "users", label: "Пользователи" },
  { id: "subs", label: "Подписки" },
  { id: "models", label: "Модели" },
];

export default function AdminPage() {
  const owner = useOwner();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (owner === "denied") router.replace("/");
  }, [owner, router]);

  if (owner !== "owner") {
    return (
      <div className="grid min-h-screen place-items-center text-[var(--color-text-muted)]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-3 pb-24 pt-3 safe-top">
      <header className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="icon-soft grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label="back"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="icon-soft grid h-9 w-9 place-items-center rounded-full">
            <Shield size={16} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[18px] font-semibold leading-tight text-[var(--color-text-strong)]">
              Админ-панель
            </h1>
            <p className="text-[12px] text-[var(--color-text-muted)]">Только для владельцев</p>
          </div>
        </div>
      </header>

      <div className="mt-4 flex gap-1.5 overflow-x-auto">
        {TABS.map((tt) => (
          <button
            key={tt.id}
            onClick={() => {
              haptic("light");
              setTab(tt.id);
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 font-display text-[13px] font-semibold transition-colors",
              tab === tt.id ? "btn-primary" : "btn-outlined",
            )}
          >
            {tt.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "users" && <UsersTab />}
        {tab === "subs" && <SubscriptionsTab />}
        {tab === "models" && <ModelsTab />}
      </div>
    </main>
  );
}

// ----- Users tab -----------------------------------------------------------

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bans, setBans] = useState<AdminBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminApi.listUsers();
      console.info("[admin/users] loaded", r);
      setUsers(r.users);
      setBans(r.bans);
    } catch (e) {
      console.error("[admin/users] load failed", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const bannedSet = new Set(bans.map((b) => b.user_id));

  const toggleBan = async (u: AdminUser) => {
    setBusy(u.user_id);
    try {
      if (bannedSet.has(u.user_id)) {
        await adminApi.unban(u.user_id);
      } else {
        await adminApi.ban(u.user_id);
      }
      hapticNotify("success");
      await load();
    } catch {
      hapticNotify("error");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-2">
      <SectionHint icon={<Users size={14} />}>
        Все, кто нажал /start. Бан блокирует доступ к чату и API.
      </SectionHint>
      {error && (
        <div className="rounded-[20px] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-[12px] text-[#e2998f]">
          Ошибка загрузки: {error}
          <button onClick={load} className="ml-2 underline">повторить</button>
        </div>
      )}
      {!error && users.length === 0 && <EmptyState text="Пока нет пользователей" />}
      {users.map((u) => {
        const banned = bannedSet.has(u.user_id);
        const handle = u.username ? `@${u.username}` : "—";
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
        return (
          <motion.div
            key={u.user_id}
            layout
            className="surface-soft flex items-center gap-3 rounded-[20px] p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-[14px] font-semibold text-[var(--color-text-strong)]">
                  {fullName}
                </p>
                {banned && (
                  <span className="chip chip-soon" style={{ background: "rgba(198,107,98,0.18)", color: "#e2998f" }}>
                    бан
                  </span>
                )}
              </div>
              <p className="truncate text-[12px] text-[var(--color-text-muted)]">
                {handle} · ID <span className="font-mono">{u.user_id}</span>
              </p>
              <p className="truncate text-[11px] text-[var(--color-text-dim)]">
                {u.messages} сообщ. · {u.language || "—"}
              </p>
            </div>
            <button
              onClick={() => toggleBan(u)}
              disabled={busy === u.user_id}
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors",
                banned ? "btn-primary" : "icon-soft",
              )}
              aria-label={banned ? "разбанить" : "забанить"}
            >
              {busy === u.user_id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : banned ? (
                <UserCheck size={16} />
              ) : (
                <Ban size={16} />
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ----- Subscriptions tab ---------------------------------------------------

function SubscriptionsTab() {
  const [items, setItems] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState("pro");
  const [days, setDays] = useState("30");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listSubscriptions();
      setItems(r.subscriptions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grant = async () => {
    const id = parseInt(userId, 10);
    if (!id) return;
    setSaving(true);
    try {
      const expires = days
        ? Math.floor(Date.now() / 1000) + parseInt(days, 10) * 24 * 60 * 60
        : null;
      await adminApi.setSubscription(id, plan, expires);
      hapticNotify("success");
      setUserId("");
      await load();
    } catch {
      hapticNotify("error");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id: number) => {
    try {
      await adminApi.cancelSubscription(id);
      hapticNotify("success");
      await load();
    } catch {
      hapticNotify("error");
    }
  };

  return (
    <div className="space-y-3">
      <div className="surface-soft rounded-[22px] p-3">
        <p className="font-display text-[14px] font-semibold text-[var(--color-text-strong)]">
          Выдать подписку
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/\D/g, ""))}
            placeholder="User ID"
            inputMode="numeric"
            className="rounded-2xl bg-tertiary-700/55 px-3 py-2.5 font-mono text-[13px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
          />
          <input
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="План (pro / lite)"
            className="rounded-2xl bg-tertiary-700/55 px-3 py-2.5 text-[13px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={days}
            onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
            placeholder="Дней (пусто = бессрочно)"
            inputMode="numeric"
            className="flex-1 rounded-2xl bg-tertiary-700/55 px-3 py-2.5 text-[13px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
          />
          <button
            onClick={grant}
            disabled={!userId || saving}
            className="btn-primary rounded-full px-4 py-2.5 font-display text-[13px] font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : "Выдать"}
          </button>
        </div>
      </div>

      <SectionHint>Активные подписки</SectionHint>
      {loading && <Spinner />}
      {!loading && items.length === 0 && <EmptyState text="Пусто" />}
      {items.map((s) => (
        <div key={s.user_id} className="surface-soft flex items-center gap-3 rounded-[20px] p-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14px] font-semibold text-[var(--color-text-strong)]">
              {s.plan}
            </p>
            <p className="truncate text-[12px] text-[var(--color-text-muted)]">
              ID <span className="font-mono">{s.user_id}</span> ·{" "}
              {s.expires_at
                ? `до ${new Date(s.expires_at * 1000).toLocaleDateString()}`
                : "бессрочно"}
            </p>
          </div>
          <button
            onClick={() => cancel(s.user_id)}
            className="icon-soft grid h-10 w-10 place-items-center rounded-full"
            aria-label="отменить"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ----- Models tab ----------------------------------------------------------

function ModelsTab() {
  const [models, setModels] = useState<AdminModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const r = await adminApi.listModels();
      setModels(r.models);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const r = await adminApi.refreshModels();
      setModels(r.models);
      invalidateModelsCache();
      hapticNotify("success");
    } catch {
      hapticNotify("error");
    } finally {
      setRefreshing(false);
    }
  };

  const update = async (m: AdminModel, status: AdminModel["status"], pub?: boolean) => {
    if (busyId) return; // не дублюємо, поки летить попередній запит
    setBusyId(m.id);
    const prev = models;
    // оптимістично оновлюємо лише цей рядок — без спінера й перезавантаження списку
    setModels((list) =>
      list.map((x) =>
        x.id === m.id
          ? { ...x, status, public: pub === undefined ? x.public : pub ? 1 : 0 }
          : x,
      ),
    );
    try {
      await adminApi.setModel(m.id, status, pub);
      hapticNotify("success");
      invalidateModelsCache();
      // тихо синхронізуємо з бекендом, без мигання
      await load({ silent: true });
    } catch {
      hapticNotify("error");
      setModels(prev); // відкат при помилці
    } finally {
      setBusyId(null);
    }
  };

  const grouped = {
    pending: models.filter((m) => m.status === "pending"),
    approved: models.filter((m) => m.status === "approved"),
    hidden: models.filter((m) => m.status === "hidden"),
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      <button
        onClick={refresh}
        disabled={refreshing}
        className="btn-outlined flex w-full items-center justify-center gap-2 rounded-full py-2.5 font-display text-[13px] font-semibold disabled:opacity-50"
      >
        {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Обновить из Wellflow
      </button>

      {grouped.pending.length > 0 && (
        <>
          <SectionHint>Ожидают одобрения</SectionHint>
          {grouped.pending.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              busy={busyId === m.id}
              actions={
                <>
                  <ActionBtn
                    onClick={() => update(m, "approved", true)}
                    title="одобрить публично"
                    disabled={busyId !== null}
                    loading={busyId === m.id}
                  >
                    <Check size={14} />
                  </ActionBtn>
                  <ActionBtn
                    onClick={() => update(m, "hidden")}
                    title="отказать"
                    disabled={busyId !== null}
                  >
                    <X size={14} />
                  </ActionBtn>
                </>
              }
            />
          ))}
        </>
      )}

      {grouped.approved.length > 0 && (
        <>
          <SectionHint>Одобренные</SectionHint>
          {grouped.approved.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              busy={busyId === m.id}
              actions={
                <ActionBtn
                  onClick={() => update(m, "hidden")}
                  title="убрать в скрытые"
                  disabled={busyId !== null}
                  loading={busyId === m.id}
                >
                  <Trash2 size={14} />
                </ActionBtn>
              }
            />
          ))}
        </>
      )}

      {grouped.hidden.length > 0 && (
        <>
          <SectionHint>Скрытые</SectionHint>
          {grouped.hidden.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              busy={busyId === m.id}
              actions={
                <ActionBtn
                  onClick={() => update(m, "approved", true)}
                  title="вернуть"
                  disabled={busyId !== null}
                  loading={busyId === m.id}
                >
                  <Check size={14} />
                </ActionBtn>
              }
            />
          ))}
        </>
      )}

      {models.length === 0 && <EmptyState text="Пока ничего" />}
    </div>
  );
}

function ModelRow({
  model,
  actions,
  busy,
}: {
  model: AdminModel;
  actions: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-soft flex items-center gap-3 rounded-[20px] p-3 transition-opacity",
        busy && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[14px] font-semibold text-[var(--color-text-strong)]">
          {model.display_name || model.id}
        </p>
        <p className="truncate font-mono text-[11px] text-[var(--color-text-muted)]">{model.id}</p>
        <p className="text-[11px] text-[var(--color-text-dim)]">
          {[model.vendor, model.family].filter(Boolean).join(" · ") || "—"}
          {model.public ? " · публичная" : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">{actions}</div>
    </div>
  );
}

function ActionBtn({
  onClick,
  title,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="icon-soft grid h-9 w-9 place-items-center rounded-full disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  );
}

// ----- API key tab ---------------------------------------------------------
// (видалено: ключ беремо тільки з config.py)

// ----- shared --------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex justify-center py-8 text-[var(--color-text-muted)]">
      <Loader2 className="animate-spin" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--color-app-line)] py-10 text-center text-[13px] text-[var(--color-text-muted)]">
      {text}
    </div>
  );
}

function SectionHint({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-1 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
      {icon}
      {children}
    </div>
  );
}

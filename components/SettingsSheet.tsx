"use client";

import { Globe, Send, Sparkles, Vibrate } from "lucide-react";
import { useStore } from "@/lib/store";
import { Sheet } from "./Sheet";
import { haptic } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import { LANG_LABELS, useT, type Lang } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

const LANGS: Lang[] = ["uk", "ru", "en"];

export function SettingsSheet({ open, onClose }: Props) {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const { t } = useT();

  return (
    <Sheet open={open} onClose={onClose} title={t("settings.title")}>
      <div className="space-y-3">
        <SectionTitle>{t("settings.section.ui")}</SectionTitle>

        <SettingRow
          icon={<Vibrate size={18} />}
          title={t("settings.haptics.title")}
          description={t("settings.haptics.desc")}
        >
          <Toggle
            value={settings.hapticsEnabled}
            onChange={(v) => {
              update({ hapticsEnabled: v });
              if (v) haptic("medium");
            }}
          />
        </SettingRow>

        <SettingRow
          icon={<Send size={18} />}
          title={t("settings.enter.title")}
          description={t("settings.enter.desc")}
        >
          <Toggle value={settings.sendOnEnter} onChange={(v) => update({ sendOnEnter: v })} />
        </SettingRow>

        <SettingRow
          icon={<Sparkles size={18} />}
          title={t("settings.badges.title")}
          description={t("settings.badges.desc")}
        >
          <Toggle value={settings.showModelBadges} onChange={(v) => update({ showModelBadges: v })} />
        </SettingRow>

        <SectionTitle>{t("settings.section.locale")}</SectionTitle>

        <div className="surface-soft rounded-[22px] p-3">
          <div className="flex items-center gap-3">
            <span className="icon-soft grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <Globe size={18} />
            </span>
            <div className="flex-1">
              <p className="font-display text-[15px] font-semibold text-[var(--color-text-strong)]">{t("settings.lang.title")}</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">{t("settings.lang.desc")}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {LANGS.map((lang) => (
              <button
                key={lang}
                onClick={() => update({ language: lang })}
                className={cn(
                  "rounded-full py-2.5 font-display text-sm font-semibold transition-colors",
                  settings.language === lang ? "btn-primary" : "btn-outlined",
                )}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-1 pb-0.5 pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
      {children}
    </h3>
  );
}

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-soft flex items-center gap-3 rounded-[22px] p-3">
      <span className="icon-soft grid h-10 w-10 shrink-0 place-items-center rounded-full">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-semibold text-[var(--color-text-strong)]">{title}</p>
        <p className="truncate text-[12px] text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
        value ? "bg-primary-500" : "bg-neutral-400/22",
      )}
    >
      <span
        className={cn(
          "inline-block h-6 w-6 transform rounded-full bg-neutral-50 shadow-sm transition-transform duration-200 ease-out",
          value ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

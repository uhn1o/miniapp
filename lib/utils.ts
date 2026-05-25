import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return "щойно";
  if (min < 60) return `${min} хв тому`;
  if (hr < 24) return `${hr} год тому`;
  if (day < 7) return `${day} дн тому`;
  return new Date(ts).toLocaleDateString("uk-UA");
}

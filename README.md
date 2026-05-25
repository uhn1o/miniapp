# Olive AI — Telegram Mini App

Next.js + TypeScript + Tailwind 4 + Framer Motion + Lucide React.
Дизайн-система **Olive Calm** — спокійна оливкова палітра, без glow і шуму.

## Запуск

```bash
npm install
npm run dev
```

Відкрий `http://localhost:3000`.

## Палітра

Усі hex'и в `app/globals.css` під `@theme`:

| Роль       | Hex       | Призначення                                           |
| ---------- | --------- | ----------------------------------------------------- |
| Primary    | `#6B7F4E` | CTA, активні перемикачі, ключові іконки               |
| Secondary  | `#A7BFA5` | Другорядні кнопки, підкладки                          |
| Tertiary   | `#2F3E2F` | Картки, поля, контейнери                              |
| Neutral    | `#9E978C` | Допоміжні тексти, рамки, неактивні стани              |

## Шрифти

- **Space Grotesk** — заголовки (`font-display`)
- **Inter** — основний текст
- **JetBrains Mono** — лейбли, час, теги

## Компоненти

- `TopBar` — Soft UI іконки + ModelPicker по центру + Primary New chat
- `ModelPicker` — bottom-sheet з 6 моделями + chips New/Premium/Beta/Soon
- `BottomNav` — pill з оливковим залитим колом на активній вкладці
- `Toggle` — flexbox-based switch без абсолютного позиціювання (більше не «кривий»)
- `Chip` — статусні плашки (`new` / `premium` / `beta` / `soon`)
- `Sheet` — drag-to-dismiss bottom-sheet
- `Composer` — pill input з Paperclip / Mic / Primary Send
- `HistorySheet` — список чатів з swipe-видаленням
- `SettingsSheet` — Toggle, мова, інфо

## Моделі

Claude Opus 4.7, GPT 5.5, GPT 5.4, Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5.
Всі стримляться через mock у `lib/mockApi.ts`.

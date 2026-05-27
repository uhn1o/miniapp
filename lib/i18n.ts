"use client";

import { useStore } from "./store";

export type Lang = "uk" | "ru" | "en";

export const LOCALE_MAP: Record<Lang, string> = {
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

export const LANG_LABELS: Record<Lang, string> = {
  uk: "Українська",
  ru: "Русский",
  en: "English",
};

const DICT = {
  uk: {
    "topbar.history": "Історія",
    "topbar.newChat": "Новий чат",
    "topbar.settings": "Налаштування",
    "topbar.admin": "Адмінка",

    "composer.placeholder": "Запитай що завгодно...",
    "composer.attach": "Прикріпити",
    "composer.voice": "Голосове",
    "composer.send": "Надіслати",
    "composer.stop": "Зупинити",

    "history.title": "Історія розмов",
    "history.empty.title": "Поки що порожньо",
    "history.empty.subtitle": "Почни нову розмову — вона зʼявиться тут.",
    "history.newChat": "Нова розмова",
    "history.emptyChat": "Порожня розмова",
    "history.delete": "Видалити",
    "history.clearAll": "Очистити всі чати",
    "history.cancel": "Скасувати",
    "history.confirmClear": "Так, видалити все",

    "settings.title": "Налаштування",
    "settings.section.ui": "Інтерфейс",
    "settings.haptics.title": "Haptic Feedback",
    "settings.haptics.desc": "Тактильна віддача на дотиках",
    "settings.enter.title": "Enter — надіслати",
    "settings.enter.desc": "Інакше Enter додає новий рядок",
    "settings.badges.title": "Бейджі моделей",
    "settings.badges.desc": "Показувати тип (флагман / швидка)",
    "settings.thinking.title": "Режим міркування",
    "settings.thinking.desc": "Глибокий аналіз перед відповіддю (лише Claude)",
    "settings.section.generation": "Генерація",
    "settings.temperature.title": "Температура",
    "settings.temperature.desc": "Нижче — точніше, вище — креативніше",
    "settings.maxTokens.title": "Довжина відповіді",
    "settings.maxTokens.desc": "Максимум токенів у відповіді",
    "settings.maxTokens.short": "Коротко",
    "settings.maxTokens.medium": "Середньо",
    "settings.maxTokens.long": "Довго",
    "settings.section.locale": "Локалізація",
    "settings.lang.title": "Мова",
    "settings.lang.desc": "Інтерфейс застосунку",

    "sheet.close": "Закрити",

    "picker.title": "Обери модель",
    "picker.calmTitle": "Спокійний режим",
    "picker.calmDesc": "Моделі перемикаються миттєво, відповіді стрімляться через бекенд.",

    "chat.greeting": "Привіт. Я",
    "chat.subtitle": "Спокійний AI-чат у Telegram стилі: без зайвого шуму, з мʼякими оливковими акцентами.",
    "chat.defaultTitle": "Нова розмова",

    "suggest.code.title": "Поясни код",
    "suggest.code.text": "Поясни мені цей фрагмент коду рядок за рядком",
    "suggest.post.title": "Напиши пост",
    "suggest.post.text": "Напиши короткий пост для соцмереж про...",
    "suggest.ideas.title": "Згенеруй ідеї",
    "suggest.ideas.text": "Дай 5 креативних ідей для...",
    "suggest.bug.title": "Знайди баг",
    "suggest.bug.text": "Допоможи знайти помилку в цьому коді:",

    "bubble.copy": "Копіювати",
    "bubble.regen": "Перегенерувати",
    "bubble.regenWith": "Іншою моделлю",
    "bubble.delete": "Видалити",
    "bubble.pickModel": "Перегенерувати моделлю",
    "bubble.copied": "скопійовано",

    "badge.flagship": "Флагман",
    "badge.balanced": "Збалансована",
    "badge.fast": "Швидка",

    "time.justNow": "щойно",
    "time.minutes": "хв тому",
    "time.hours": "год тому",
    "time.days": "дн тому",
  },
  ru: {
    "topbar.history": "История",
    "topbar.newChat": "Новый чат",
    "topbar.settings": "Настройки",
    "topbar.admin": "Админка",

    "composer.placeholder": "Спроси что угодно...",
    "composer.attach": "Прикрепить",
    "composer.voice": "Голосовое",
    "composer.send": "Отправить",
    "composer.stop": "Остановить",

    "history.title": "История чатов",
    "history.empty.title": "Пока пусто",
    "history.empty.subtitle": "Начни новый чат — он появится здесь.",
    "history.newChat": "Новый чат",
    "history.emptyChat": "Пустой чат",
    "history.delete": "Удалить",
    "history.clearAll": "Очистить все чаты",
    "history.cancel": "Отмена",
    "history.confirmClear": "Да, удалить всё",

    "settings.title": "Настройки",
    "settings.section.ui": "Интерфейс",
    "settings.haptics.title": "Haptic Feedback",
    "settings.haptics.desc": "Тактильный отклик при касаниях",
    "settings.enter.title": "Enter — отправить",
    "settings.enter.desc": "Иначе Enter добавляет новую строку",
    "settings.badges.title": "Бейджи моделей",
    "settings.badges.desc": "Показывать тип (флагман / быстрая)",
    "settings.thinking.title": "Режим размышления",
    "settings.thinking.desc": "Глубокий анализ перед ответом (только Claude)",
    "settings.section.generation": "Генерация",
    "settings.temperature.title": "Температура",
    "settings.temperature.desc": "Ниже — точнее, выше — креативнее",
    "settings.maxTokens.title": "Длина ответа",
    "settings.maxTokens.desc": "Максимум токенов в ответе",
    "settings.maxTokens.short": "Кратко",
    "settings.maxTokens.medium": "Средне",
    "settings.maxTokens.long": "Длинно",
    "settings.section.locale": "Локализация",
    "settings.lang.title": "Язык",
    "settings.lang.desc": "Интерфейс приложения",

    "sheet.close": "Закрыть",

    "picker.title": "Выбери модель",
    "picker.calmTitle": "Спокойный режим",
    "picker.calmDesc": "Модели переключаются мгновенно, ответы стримятся через бэкенд.",

    "chat.greeting": "Привет. Я",
    "chat.subtitle": "Спокойный AI-чат в стиле Telegram: без лишнего шума, с мягкими оливковыми акцентами.",
    "chat.defaultTitle": "Новый чат",

    "suggest.code.title": "Объясни код",
    "suggest.code.text": "Объясни мне этот фрагмент кода построчно",
    "suggest.post.title": "Напиши пост",
    "suggest.post.text": "Напиши короткий пост для соцсетей про...",
    "suggest.ideas.title": "Подкинь идеи",
    "suggest.ideas.text": "Дай 5 креативных идей для...",
    "suggest.bug.title": "Найди баг",
    "suggest.bug.text": "Помоги найти ошибку в этом коде:",

    "bubble.copy": "Копировать",
    "bubble.regen": "Перегенерировать",
    "bubble.regenWith": "Другой моделью",
    "bubble.delete": "Удалить",
    "bubble.pickModel": "Перегенерировать моделью",
    "bubble.copied": "скопировано",

    "badge.flagship": "Флагман",
    "badge.balanced": "Сбалансированная",
    "badge.fast": "Быстрая",

    "time.justNow": "только что",
    "time.minutes": "мин назад",
    "time.hours": "ч назад",
    "time.days": "дн назад",
  },
  en: {
    "topbar.history": "History",
    "topbar.newChat": "New chat",
    "topbar.settings": "Settings",
    "topbar.admin": "Admin",

    "composer.placeholder": "Ask anything...",
    "composer.attach": "Attach",
    "composer.voice": "Voice",
    "composer.send": "Send",
    "composer.stop": "Stop",

    "history.title": "Chat history",
    "history.empty.title": "Nothing yet",
    "history.empty.subtitle": "Start a new chat — it'll appear here.",
    "history.newChat": "New chat",
    "history.emptyChat": "Empty chat",
    "history.delete": "Delete",
    "history.clearAll": "Clear all chats",
    "history.cancel": "Cancel",
    "history.confirmClear": "Yes, delete all",

    "settings.title": "Settings",
    "settings.section.ui": "Interface",
    "settings.haptics.title": "Haptic feedback",
    "settings.haptics.desc": "Tactile response on touch",
    "settings.enter.title": "Enter to send",
    "settings.enter.desc": "Otherwise Enter adds a new line",
    "settings.badges.title": "Model badges",
    "settings.badges.desc": "Show tier (flagship / fast)",
    "settings.thinking.title": "Thinking mode",
    "settings.thinking.desc": "Deep reasoning before reply (Claude only)",
    "settings.section.generation": "Generation",
    "settings.temperature.title": "Temperature",
    "settings.temperature.desc": "Lower — precise, higher — creative",
    "settings.maxTokens.title": "Response length",
    "settings.maxTokens.desc": "Max tokens per reply",
    "settings.maxTokens.short": "Short",
    "settings.maxTokens.medium": "Medium",
    "settings.maxTokens.long": "Long",
    "settings.section.locale": "Localization",
    "settings.lang.title": "Language",
    "settings.lang.desc": "App interface",

    "sheet.close": "Close",

    "picker.title": "Choose a model",
    "picker.calmTitle": "Calm mode",
    "picker.calmDesc": "Models switch instantly, responses stream through the backend.",

    "chat.greeting": "Hi. I'm",
    "chat.subtitle": "A calm AI chat in Telegram style: no noise, soft olive accents.",
    "chat.defaultTitle": "New chat",

    "suggest.code.title": "Explain code",
    "suggest.code.text": "Walk me through this code snippet line by line",
    "suggest.post.title": "Write a post",
    "suggest.post.text": "Write a short social media post about...",
    "suggest.ideas.title": "Generate ideas",
    "suggest.ideas.text": "Give me 5 creative ideas for...",
    "suggest.bug.title": "Find a bug",
    "suggest.bug.text": "Help me find the bug in this code:",

    "bubble.copy": "Copy",
    "bubble.regen": "Regenerate",
    "bubble.regenWith": "Another model",
    "bubble.delete": "Delete",
    "bubble.pickModel": "Regenerate with model",
    "bubble.copied": "copied",

    "badge.flagship": "Flagship",
    "badge.balanced": "Balanced",
    "badge.fast": "Fast",

    "time.justNow": "just now",
    "time.minutes": "m ago",
    "time.hours": "h ago",
    "time.days": "d ago",
  },
} as const;

export type TKey = keyof typeof DICT.uk;

export function tFor(lang: Lang, key: TKey): string {
  return DICT[lang][key] ?? DICT.uk[key];
}

export function useT() {
  const lang = useStore((s) => s.settings.language);
  const t = (key: TKey) => tFor(lang, key);
  return { t, lang, locale: LOCALE_MAP[lang] };
}

export function formatRelative(ts: number, lang: Lang): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return tFor(lang, "time.justNow");
  if (min < 60) return `${min} ${tFor(lang, "time.minutes")}`;
  if (hr < 24) return `${hr} ${tFor(lang, "time.hours")}`;
  if (day < 7) return `${day} ${tFor(lang, "time.days")}`;
  return new Date(ts).toLocaleDateString(LOCALE_MAP[lang]);
}

export function formatTime(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleTimeString(LOCALE_MAP[lang], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

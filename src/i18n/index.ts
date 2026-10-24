import { loadLang, saveLang } from '../storage';
import { dict, type Lang } from './dict';

export type { Lang };

let current: Lang = loadLang() ?? 'ru';

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  saveLang(lang);
}

export function t(key: string, params?: Record<string, string | number>): string {
  let s = dict[current][key] ?? dict.ru[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

/** Russian: 1/21 день, 2–4/22–24 дня, 5–20/25+ дней. English: day/days. */
export function daysWord(n: number, lang: Lang): string {
  if (lang === 'en') return n === 1 ? 'day' : 'days';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

export function monthName(year: number, month0: number, form: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(current, { month: form }).format(new Date(year, month0, 1));
}

/** Monday-first weekday labels for the current language. */
export function weekdayShort(): string[] {
  const fmt = new Intl.DateTimeFormat(current, { weekday: 'short' });
  const monday = new Date(2026, 5, 1); // 2026-06-01 is a Monday
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)),
  );
}

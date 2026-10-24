import type { AppData } from './types';

const DATA_KEY = 'mmmdays.v1';
const LANG_KEY = 'mmmdays.lang';

export type Lang = 'ru' | 'en';

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { v?: unknown; days?: unknown };
  if (v.v !== 1) return false;
  if (typeof v.days !== 'object' || v.days === null || Array.isArray(v.days)) return false;
  for (const [key, state] of Object.entries(v.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    if (state !== 1 && state !== 2) return false;
  }
  return true;
}

/** Never throws: corrupted storage reads as empty data. */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw === null) return { v: 1, days: {} };
    const parsed: unknown = JSON.parse(raw);
    if (isAppData(parsed)) return parsed;
    console.warn('MmmDays: stored data has wrong shape, starting fresh');
    return { v: 1, days: {} };
  } catch {
    console.warn('MmmDays: stored data is corrupted, starting fresh');
    return { v: 1, days: {} };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadLang(): Lang | null {
  const raw = localStorage.getItem(LANG_KEY);
  return raw === 'ru' || raw === 'en' ? raw : null;
}

export function saveLang(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang);
}

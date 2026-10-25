import type { AppData } from './types';

const DATA_KEY = 'mmmdays.v1';
const LANG_KEY = 'mmmdays.lang';

export type Lang = 'ru' | 'en';

function isValidEntry(key: string, state: unknown): state is 1 | 2 {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && (state === 1 || state === 2);
}

/**
 * Never throws: corrupted storage reads as empty data. A stored object with
 * the right shape keeps its valid day entries and drops only the invalid
 * ones, so one bad entry can never wipe the rest of the history.
 */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (raw === null) return { v: 1, days: {} };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('not an object');
    const obj = parsed as { v?: unknown; days?: unknown };
    if (obj.v !== 1 || typeof obj.days !== 'object' || obj.days === null || Array.isArray(obj.days)) {
      throw new Error('wrong shape');
    }
    const days: AppData['days'] = {};
    let dropped = 0;
    for (const [key, state] of Object.entries(obj.days)) {
      if (isValidEntry(key, state)) days[key] = state;
      else dropped++;
    }
    if (dropped > 0) console.warn(`MmmDays: dropped ${dropped} invalid stored day(s)`);
    return { v: 1, days };
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

import type { AppData, DayState, DaysMap } from './types';
import { loadData, saveData } from './storage';

const listeners = new Set<() => void>();

/** localStorage is the single source of truth; the store is a write-through cache. */

export function getDays(): DaysMap {
  return loadData().days;
}

export function getAllData(): AppData {
  return loadData();
}

export function setDay(key: string, state: DayState): void {
  const data = loadData();
  if (state === 0) delete data.days[key];
  else data.days[key] = state;
  saveData(data);
  for (const fn of listeners) fn();
}

export function replaceDays(days: DaysMap): void {
  saveData({ v: 1, days: { ...days } });
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

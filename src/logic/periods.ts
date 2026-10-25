import type { DaysMap } from '../types';
import { diffDays, fromKey } from './dates';

export interface Period {
  start: string;
  end: string;
  firstHeavy: string | null;
  hasHeavy: boolean;
  /** Calendar days from start to end, light days included. */
  lengthDays: number;
  /** Number of heavy (2) days in the period — how long it "lasts". */
  heavyDays: number;
}

/**
 * Split marked days into periods: a run of marked days where one unmarked
 * day does not break the chain (a two-day gap splits it).
 */
export function parsePeriods(days: DaysMap): Period[] {
  const keys = Object.keys(days).sort();
  const periods: Period[] = [];
  for (const key of keys) {
    const heavy = days[key] === 2;
    const prev = periods[periods.length - 1];
    const continues = prev && diffDays(fromKey(prev.end), fromKey(key)) <= 2;
    if (!continues) {
      periods.push({
        start: key,
        end: key,
        firstHeavy: heavy ? key : null,
        hasHeavy: heavy,
        lengthDays: 1,
        heavyDays: heavy ? 1 : 0,
      });
    } else {
      prev.end = key;
      prev.lengthDays = diffDays(fromKey(prev.start), fromKey(key)) + 1;
      if (heavy) {
        prev.heavyDays += 1;
        if (!prev.hasHeavy) {
          prev.hasHeavy = true;
          prev.firstHeavy = key;
        }
      }
    }
  }
  return periods;
}

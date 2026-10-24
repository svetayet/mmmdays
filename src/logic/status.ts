import type { DaysMap } from '../types';
import { computeCycleStats } from './cycles';
import { parsePeriods } from './periods';
import { addDays, diffDays, fromKey, toKey } from './dates';

export type Status =
  | { mode: 'no-data' }
  | { mode: 'no-forecast' }
  | { mode: 'in-progress'; dayNumber: number }
  | { mode: 'until'; days: number }
  | { mode: 'delay'; days: number };

/**
 * The status card. "In progress" holds for one extra unmarked day after the
 * last mark (a one-day pause inside a period must not jump the card).
 */
export function computeStatus(days: DaysMap, today: Date): Status {
  const periods = parsePeriods(days);
  if (periods.length === 0) return { mode: 'no-data' };

  const todayKey = toKey(today);
  const yesterdayKey = toKey(addDays(today, -1));
  const last = periods[periods.length - 1];
  const open = last.end === todayKey || last.end === yesterdayKey;
  if (open) {
    const anchor = last.firstHeavy ?? last.start;
    return { mode: 'in-progress', dayNumber: diffDays(fromKey(anchor), today) + 1 };
  }

  const stats = computeCycleStats(periods);
  if (stats.forecast === null) return { mode: 'no-forecast' };

  const daysLeft = diffDays(today, fromKey(stats.forecast));
  return daysLeft >= 0
    ? { mode: 'until', days: daysLeft }
    : { mode: 'delay', days: -daysLeft };
}

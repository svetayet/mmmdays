import type { Period } from './periods';
import { addDays, diffDays, fromKey, toKey } from './dates';

export type Regularity = 'even' | 'uneven' | 'irregular';

export interface CycleStats {
  /** First heavy day of each period, ascending. */
  starts: string[];
  /** Days between neighbouring starts. */
  lengths: number[];
  /** Mean of lengths, rounded; null with fewer than 2 cycles. */
  avgCycle: number | null;
  /** Mean of heavy-day counts per period («длится» = по обильным); light-only periods excluded. */
  avgDuration: number | null;
  /** The last completed cycle length. */
  lastCycleLength: number | null;
  /** Last start + avgCycle; null with fewer than 2 cycles. */
  forecast: string | null;
  /** From lengths spread: <=2 even, 3-5 uneven, >5 irregular; null with no lengths. */
  regularity: Regularity | null;
}

export function computeCycleStats(periods: Period[]): CycleStats {
  const starts = periods
    .filter((p) => p.firstHeavy !== null)
    .map((p) => p.firstHeavy as string);

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    lengths.push(diffDays(fromKey(starts[i - 1]), fromKey(starts[i])));
  }

  const avgCycle = lengths.length >= 1
    ? Math.round(lengths.reduce((s, n) => s + n, 0) / lengths.length)
    : null;

  const heavyPeriods = periods.filter((p) => p.hasHeavy);
  const avgDuration = heavyPeriods.length > 0
    ? Math.round(heavyPeriods.reduce((s, p) => s + p.heavyDays, 0) / heavyPeriods.length)
    : null;

  const lastCycleLength = lengths.length > 0 ? lengths[lengths.length - 1] : null;

  const forecast = avgCycle !== null && starts.length > 0
    ? toKey(addDays(fromKey(starts[starts.length - 1]), avgCycle))
    : null;

  let regularity: Regularity | null = null;
  if (lengths.length >= 1) {
    // Spec: «ритм: ровно» при разбросе ≤ 2 дней; one length → spread 0 → even.
    const spread = Math.max(...lengths) - Math.min(...lengths);
    regularity = spread <= 2 ? 'even' : spread <= 5 ? 'uneven' : 'irregular';
  }

  return { starts, lengths, avgCycle, avgDuration, lastCycleLength, forecast, regularity };
}

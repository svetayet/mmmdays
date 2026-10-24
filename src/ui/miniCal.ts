import type { DaysMap } from '../types';

export interface YearMonth {
  year: number;
  month0: number;
}

/** First month (0-indexed) of the May–Oct / Nov–Apr half-year containing this month. */
function halfStart(year: number, month0: number): YearMonth {
  if (month0 >= 4 && month0 <= 9) return { year, month0: 4 };
  if (month0 >= 10) return { year, month0: 10 };
  return { year: year - 1, month0: 10 };
}

/** The 6 months of half-year page `page`: page 0 holds `today`, page k is 6k months earlier. */
export function halfYearPage(page: number, today: Date): YearMonth[] {
  const start = halfStart(today.getFullYear(), today.getMonth());
  const abs = start.year * 12 + start.month0 - page * 6;
  return Array.from({ length: 6 }, (_, i) => {
    const m = abs + i;
    return { year: Math.floor(m / 12), month0: m % 12 };
  });
}

/** How many carousel pages span from the earliest data to the current half-year (min 1). */
export function pageCount(earliestKey: string | null, today: Date): number {
  if (earliestKey === null) return 1;
  const y = Number(earliestKey.slice(0, 4));
  const m = Number(earliestKey.slice(5, 7)) - 1;
  const earliest = halfStart(y, m);
  const current = halfStart(today.getFullYear(), today.getMonth());
  const diffMonths = (current.year - earliest.year) * 12 + current.month0 - earliest.month0;
  return Math.max(1, diffMonths / 6 + 1);
}

/** Earliest key of a days map, or null when empty. */
export function earliestDay(days: DaysMap): string | null {
  const keys = Object.keys(days).sort();
  return keys[0] ?? null;
}

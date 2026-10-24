const DAY_MS = 24 * 60 * 60 * 1000;

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** b − a in whole days; rounding absorbs DST shifts between local midnights. */
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** 0 = Monday … 6 = Sunday. */
export function firstWeekdayOfMonth(year: number, month0: number): number {
  const dow = new Date(year, month0, 1).getDay(); // 0 = Sunday
  return (dow + 6) % 7;
}

export function monthGridKeys(year: number, month0: number): (string | null)[] {
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekdayOfMonth(year, month0); i++) cells.push(null);
  const total = daysInMonth(year, month0);
  for (let day = 1; day <= total; day++) {
    cells.push(toKey(new Date(year, month0, day)));
  }
  return cells;
}

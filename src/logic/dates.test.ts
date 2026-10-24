import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysInMonth,
  diffDays,
  firstWeekdayOfMonth,
  fromKey,
  monthGridKeys,
  toKey,
} from './dates';

describe('toKey', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(toKey(new Date(2026, 9, 24))).toBe('2026-10-24');
  });

  it('keeps late evening on the same local day', () => {
    expect(toKey(new Date(2026, 9, 24, 23, 30))).toBe('2026-10-24');
  });
});

describe('fromKey', () => {
  it('parses key into local calendar date', () => {
    const d = fromKey('2026-10-24');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(24);
  });
});

describe('diffDays', () => {
  it('two days apart within a month', () => {
    expect(diffDays(new Date(2026, 9, 24), new Date(2026, 9, 26))).toBe(2);
  });

  it('across year boundary', () => {
    expect(diffDays(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
  });

  it('leap february 2028', () => {
    expect(diffDays(new Date(2028, 1, 28), new Date(2028, 1, 29))).toBe(1);
    expect(diffDays(new Date(2028, 1, 28), new Date(2028, 2, 1))).toBe(2);
  });

  it('non-leap february 2027', () => {
    expect(diffDays(new Date(2027, 1, 28), new Date(2027, 2, 1))).toBe(1);
  });
});

describe('addDays', () => {
  it('rolls into next month', () => {
    const d = addDays(new Date(2026, 9, 31), 1);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(1);
  });

  it('zero returns same calendar date', () => {
    const d = addDays(new Date(2026, 9, 24), 0);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(24);
  });
});

describe('daysInMonth', () => {
  it('leap year february', () => {
    expect(daysInMonth(2028, 1)).toBe(29);
  });

  it('non-leap february', () => {
    expect(daysInMonth(2027, 1)).toBe(28);
  });

  it('october', () => {
    expect(daysInMonth(2026, 9)).toBe(31);
  });
});

describe('firstWeekdayOfMonth', () => {
  it('october 2026 starts thursday (monday=0)', () => {
    expect(firstWeekdayOfMonth(2026, 9)).toBe(3);
  });

  it('june 2026 starts monday', () => {
    expect(firstWeekdayOfMonth(2026, 5)).toBe(0);
  });

  it('august 2026 starts saturday', () => {
    expect(firstWeekdayOfMonth(2026, 7)).toBe(5);
  });
});

describe('monthGridKeys', () => {
  it('builds october 2026 grid with 3 leading empties', () => {
    const grid = monthGridKeys(2026, 9);
    expect(grid).toHaveLength(34);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]).toBe('2026-10-01');
    expect(grid[grid.length - 1]).toBe('2026-10-31');
  });
});

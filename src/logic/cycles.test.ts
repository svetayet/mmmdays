import { describe, expect, it } from 'vitest';
import type { Period } from './periods';
import { computeCycleStats } from './cycles';
import { addDays, fromKey, toKey } from './dates';

function period(firstHeavy: string, lengthDays = 5): Period {
  return {
    start: firstHeavy,
    end: toKey(addDays(fromKey(firstHeavy), lengthDays - 1)),
    firstHeavy,
    hasHeavy: true,
    lengthDays,
  };
}

function lightPeriod(start: string, lengthDays: number): Period {
  return {
    start,
    end: toKey(addDays(fromKey(start), lengthDays - 1)),
    firstHeavy: null,
    hasHeavy: false,
    lengthDays,
  };
}

describe('computeCycleStats', () => {
  it('full fixture: seven periods, steady 27-day cycles', () => {
    const periods = [
      '2026-05-12', '2026-06-08', '2026-07-05', '2026-08-01',
      '2026-08-28', '2026-09-24', '2026-10-21',
    ].map((d) => period(d));

    const stats = computeCycleStats(periods);
    expect(stats.starts).toEqual([
      '2026-05-12', '2026-06-08', '2026-07-05', '2026-08-01',
      '2026-08-28', '2026-09-24', '2026-10-21',
    ]);
    expect(stats.lengths).toEqual([27, 27, 27, 27, 27, 27]);
    expect(stats.avgCycle).toBe(27);
    expect(stats.avgDuration).toBe(5);
    expect(stats.lastCycleLength).toBe(27);
    expect(stats.forecast).toBe('2026-11-17');
    expect(stats.regularity).toBe('even');
  });

  it('empty input: everything null', () => {
    expect(computeCycleStats([])).toEqual({
      starts: [],
      lengths: [],
      avgCycle: null,
      avgDuration: null,
      lastCycleLength: null,
      forecast: null,
      regularity: null,
    });
  });

  it('single heavy period: no cycle metrics yet, duration known', () => {
    const stats = computeCycleStats([period('2026-10-21')]);
    expect(stats.starts).toEqual(['2026-10-21']);
    expect(stats.avgCycle).toBeNull();
    expect(stats.forecast).toBeNull();
    expect(stats.regularity).toBeNull();
    expect(stats.avgDuration).toBe(5);
  });

  it('two cycles: average and forecast appear, regularity still unknown', () => {
    const stats = computeCycleStats([period('2026-09-24'), period('2026-10-21')]);
    expect(stats.avgCycle).toBe(27);
    expect(stats.lastCycleLength).toBe(27);
    expect(stats.forecast).toBe('2026-11-17');
    expect(stats.regularity).toBeNull();
  });

  it('light-only periods are excluded from starts but count into duration', () => {
    const stats = computeCycleStats([
      lightPeriod('2026-05-02', 3),
      period('2026-06-08', 5),
      lightPeriod('2026-07-01', 4),
    ]);
    expect(stats.starts).toEqual(['2026-06-08']);
    expect(stats.avgCycle).toBeNull();
    expect(stats.avgDuration).toBe(4); // (3 + 5 + 4) / 3
  });

  it('single length (two cycles) gives no regularity', () => {
    const stats = computeCycleStats([period('2026-08-25'), period('2026-09-19')]);
    expect(stats.lengths).toEqual([25]);
    expect(stats.regularity).toBeNull();
  });

  it('spread of 6 days is irregular', () => {
    const stats = computeCycleStats([
      period('2026-06-01'), period('2026-06-26'), period('2026-07-27'),
    ]);
    expect(stats.lengths).toEqual([25, 31]);
    expect(stats.regularity).toBe('irregular');
  });

  it('spread of 4 days is uneven', () => {
    const stats = computeCycleStats([
      period('2026-06-01'), period('2026-06-27'), period('2026-07-27'),
    ]);
    expect(stats.lengths).toEqual([26, 30]);
    expect(stats.regularity).toBe('uneven');
  });

  it('average rounds to nearest integer (27.5 → 28)', () => {
    const stats = computeCycleStats([
      period('2026-06-01'), period('2026-06-28'), period('2026-07-26'),
    ]);
    expect(stats.lengths).toEqual([27, 28]);
    expect(stats.avgCycle).toBe(28);
  });
});

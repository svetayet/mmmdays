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
    heavyDays: lengthDays, // helper periods are all-heavy
  };
}

function lightPeriod(start: string, lengthDays: number): Period {
  return {
    start,
    end: toKey(addDays(fromKey(start), lengthDays - 1)),
    firstHeavy: null,
    hasHeavy: false,
    lengthDays,
    heavyDays: 0,
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

  it('two cycles: average, forecast and first rhythm verdict appear', () => {
    const stats = computeCycleStats([period('2026-09-24'), period('2026-10-21')]);
    expect(stats.avgCycle).toBe(27);
    expect(stats.lastCycleLength).toBe(27);
    expect(stats.forecast).toBe('2026-11-17');
    expect(stats.regularity).toBe('even'); // spread of a single length is 0 ≤ 2
  });

  it('light-only periods are excluded from starts and from duration', () => {
    const stats = computeCycleStats([
      lightPeriod('2026-05-02', 3),
      period('2026-06-08', 5),
      lightPeriod('2026-07-01', 4),
    ]);
    expect(stats.starts).toEqual(['2026-06-08']);
    expect(stats.avgCycle).toBeNull();
    expect(stats.avgDuration).toBe(5); // only the heavy period counts
  });

  it('duration counts heavy days only: скудно, скудно, обильно lasts one day', () => {
    const stats = computeCycleStats([
      { start: '2026-10-20', end: '2026-10-22', firstHeavy: '2026-10-22', hasHeavy: true, lengthDays: 3, heavyDays: 1 },
    ]);
    expect(stats.avgDuration).toBe(1);
  });

  it('single length (two cycles) reads as even rhythm per the spec', () => {
    const stats = computeCycleStats([period('2026-08-25'), period('2026-09-19')]);
    expect(stats.lengths).toEqual([25]);
    expect(stats.regularity).toBe('even');
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

describe('computeCycleStats with countLight', () => {
  // period starting 2026-10-20: light, light, heavy → heavyDays 1, lengthDays 3
  const mixed: Period[] = [
    { start: '2026-10-20', end: '2026-10-22', firstHeavy: '2026-10-22', hasHeavy: true, lengthDays: 3, heavyDays: 1 },
    { start: '2026-11-16', end: '2026-11-20', firstHeavy: '2026-11-16', hasHeavy: true, lengthDays: 5, heavyDays: 5 },
  ];

  it('on: starts anchor at period start, duration is full length', () => {
    const stats = computeCycleStats(mixed, { countLight: true });
    expect(stats.starts).toEqual(['2026-10-20', '2026-11-16']);
    expect(stats.avgDuration).toBe(4); // (3 + 5) / 2
    expect(stats.avgCycle).toBe(27);
  });

  it('off: heavy anchors and heavy-day duration (default)', () => {
    const stats = computeCycleStats(mixed, { countLight: false });
    expect(stats.starts).toEqual(['2026-10-22', '2026-11-16']);
    expect(stats.avgDuration).toBe(3); // (1 + 5) / 2
    expect(computeCycleStats(mixed).avgDuration).toBe(3);
  });

  it('on: light-only periods join starts and duration', () => {
    const stats = computeCycleStats(
      [lightPeriod('2026-05-02', 3), period('2026-06-08', 5)],
      { countLight: true },
    );
    expect(stats.starts).toEqual(['2026-05-02', '2026-06-08']);
    expect(stats.avgDuration).toBe(4); // (3 + 5) / 2
  });
});

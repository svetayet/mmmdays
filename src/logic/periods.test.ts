import { describe, expect, it } from 'vitest';
import { parsePeriods } from './periods';

describe('parsePeriods', () => {
  it('single continuous period with light start', () => {
    const days = {
      '2026-10-20': 1,
      '2026-10-21': 2,
      '2026-10-22': 2,
      '2026-10-23': 2,
      '2026-10-24': 2,
    };
    const periods = parsePeriods(days);
    expect(periods).toHaveLength(1);
    expect(periods[0]).toEqual({
      start: '2026-10-20',
      end: '2026-10-24',
      firstHeavy: '2026-10-21',
      hasHeavy: true,
      lengthDays: 5,
    });
  });

  it('one-day gap does not break a period', () => {
    const days = { '2026-11-01': 1, '2026-11-02': 2, '2026-11-04': 1 };
    const periods = parsePeriods(days);
    expect(periods).toHaveLength(1);
    expect(periods[0].lengthDays).toBe(4);
    expect(periods[0].end).toBe('2026-11-04');
  });

  it('two-day gap splits periods', () => {
    const days = { '2026-11-01': 1, '2026-11-02': 2, '2026-11-05': 1 };
    const periods = parsePeriods(days);
    expect(periods).toHaveLength(2);
    expect(periods[0].end).toBe('2026-11-02');
    expect(periods[1].start).toBe('2026-11-05');
  });

  it('light-only period has no heavy day', () => {
    const periods = parsePeriods({ '2026-10-01': 1, '2026-10-02': 1 });
    expect(periods).toHaveLength(1);
    expect(periods[0].firstHeavy).toBeNull();
    expect(periods[0].hasHeavy).toBe(false);
  });

  it('single marked day is a period of length 1', () => {
    const periods = parsePeriods({ '2026-10-21': 2 });
    expect(periods).toHaveLength(1);
    expect(periods[0].lengthDays).toBe(1);
  });

  it('returns sorted periods regardless of key order in the map', () => {
    const days = {
      '2026-09-24': 2,
      '2026-10-21': 2,
      '2026-08-27': 2,
    };
    const starts = parsePeriods(days).map((p) => p.start);
    expect(starts).toEqual(['2026-08-27', '2026-09-24', '2026-10-21']);
  });
});

import { describe, expect, it } from 'vitest';
import { computeStatus } from './status';
import type { DaysMap } from '../types';

/** Two full cycles: heavy starts 2026-09-24 and 2026-10-21, forecast 2026-11-17. */
const twoCycles: DaysMap = {
  '2026-09-23': 1,
  '2026-09-24': 2,
  '2026-09-25': 2,
  '2026-09-26': 2,
  '2026-09-27': 1,
  '2026-10-20': 1,
  '2026-10-21': 2,
  '2026-10-22': 2,
  '2026-10-23': 2,
  '2026-10-24': 2,
};

const singleCycle: DaysMap = {
  '2026-10-20': 1,
  '2026-10-21': 2,
  '2026-10-22': 2,
  '2026-10-23': 2,
  '2026-10-24': 2,
};

describe('computeStatus', () => {
  it('marked today mid-period is in progress, counted from first heavy day', () => {
    expect(computeStatus(twoCycles, new Date(2026, 9, 23))).toEqual({
      mode: 'in-progress',
      dayNumber: 3,
    });
  });

  it('unmarked today right after a marked yesterday is still in progress', () => {
    expect(computeStatus(twoCycles, new Date(2026, 9, 25))).toEqual({
      mode: 'in-progress',
      dayNumber: 5,
    });
  });

  it('second unmarked day switches to countdown', () => {
    expect(computeStatus(twoCycles, new Date(2026, 9, 26))).toEqual({
      mode: 'until',
      days: 22,
    });
  });

  it('passed forecast date becomes delay', () => {
    expect(computeStatus(twoCycles, new Date(2026, 10, 20))).toEqual({
      mode: 'delay',
      days: 3,
    });
  });

  it('only one cycle in history: not in progress, not enough data for forecast', () => {
    expect(computeStatus(singleCycle, new Date(2026, 9, 27))).toEqual({
      mode: 'no-forecast',
    });
  });

  it('no marks at all', () => {
    expect(computeStatus({}, new Date(2026, 9, 24))).toEqual({ mode: 'no-data' });
  });

  it('light-only period counts days from its first marked day', () => {
    expect(computeStatus({ '2026-10-24': 1 }, new Date(2026, 9, 25))).toEqual({
      mode: 'in-progress',
      dayNumber: 2,
    });
  });
});

describe('computeStatus with countLight', () => {
  it('on: in-progress anchors at period start, not first heavy', () => {
    // light 2026-10-20, heavy 2026-10-21, today 2026-10-21
    const days = { '2026-10-20': 1, '2026-10-21': 2 } as const;
    const today = new Date(2026, 9, 21);
    expect(computeStatus({ ...days }, today)).toEqual({ mode: 'in-progress', dayNumber: 1 });
    expect(computeStatus({ ...days }, today, { countLight: true })).toEqual({ mode: 'in-progress', dayNumber: 2 });
    expect(computeStatus({ ...days }, new Date(2026, 9, 22), { countLight: true })).toEqual({ mode: 'in-progress', dayNumber: 3 });
  });
});

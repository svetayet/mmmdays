import { beforeEach, describe, expect, it } from 'vitest';
import { getAllData, getDays, replaceDays, setDay, subscribe } from './store';

beforeEach(() => {
  localStorage.clear();
});

describe('store', () => {
  it('setDay adds a day and persists', () => {
    setDay('2026-10-21', 2);
    expect(getDays()).toEqual({ '2026-10-21': 2 });
    expect(getAllData().days).toEqual({ '2026-10-21': 2 });
  });

  it('setDay with 0 removes the day', () => {
    setDay('2026-10-21', 2);
    setDay('2026-10-21', 0);
    expect(getDays()).toEqual({});
  });

  it('replaceDays swaps the whole map and persists', () => {
    setDay('2026-10-21', 2);
    replaceDays({ '2026-05-12': 1 });
    expect(getDays()).toEqual({ '2026-05-12': 1 });
  });

  it('subscribe fires on every change, unsubscribe stops it', () => {
    let calls = 0;
    const off = subscribe(() => calls++);
    setDay('2026-10-21', 1);
    setDay('2026-10-22', 1);
    setDay('2026-10-21', 0);
    off();
    setDay('2026-10-23', 1);
    expect(calls).toBe(3);
  });
});

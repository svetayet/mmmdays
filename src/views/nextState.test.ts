import { describe, expect, it } from 'vitest';
import { nextState } from './calendarView';

describe('nextState', () => {
  it('cycles none → light → heavy → none in one tap each', () => {
    expect(nextState(0)).toBe(1);
    expect(nextState(1)).toBe(2);
    expect(nextState(2)).toBe(0);
  });
});

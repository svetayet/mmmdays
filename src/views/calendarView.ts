import type { DayState } from '../types';

/** One tap walks none → light → heavy → none. */
export function nextState(state: DayState): DayState {
  return ((state + 1) % 3) as DayState;
}

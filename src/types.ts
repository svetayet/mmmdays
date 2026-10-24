export type DayState = 0 | 1 | 2;

/** Map of marked days only: 1 = light, 2 = heavy. */
export type DaysMap = Record<string, 1 | 2>;

export interface AppData {
  v: 1;
  days: DaysMap;
}

import { t, monthName } from '../i18n';
import { toKey } from '../logic/dates';
import type { DayState, DaysMap } from '../types';
import { getDays, subscribe } from '../store';
import { el } from './dom';

export const CHART_RANGES = [3, 6, 9, 12] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

export interface DayBar {
  key: string;
  level: DayState;
}

/**
 * The last `monthsBack` calendar months ending with `today`'s month:
 * from the first day of the month (monthsBack - 1) before today's through today.
 * Date rollover handles the year boundary for negative months.
 */
export function sliceDays(days: DaysMap, monthsBack: number, today: Date): DayBar[] {
  const bars: DayBar[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth() - monthsBack + 1, 1);
  const endKey = toKey(today);
  while (toKey(cursor) <= endKey) {
    const key = toKey(cursor);
    bars.push({ key, level: days[key] ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return bars;
}

let currentRoot: HTMLElement | null = null;
let lastToday = new Date();
let range: ChartRange = 6;
let unsub: (() => void) | null = null;

export function renderChart(root: HTMLElement, today: Date = new Date()): void {
  currentRoot = root;
  lastToday = today;
  range = 6; // each mount starts at the default range; chip clicks re-draw
  if (!unsub) unsub = subscribe(draw);
  draw();
}

function draw(): void {
  const root = currentRoot;
  if (!root) return;
  root.innerHTML = '';

  const chips = el('div', 'chips');
  for (const r of CHART_RANGES) {
    const chip = el('button', 'chip' + (r === range ? ' active' : ''));
    chip.type = 'button';
    chip.textContent = t(`stats.range.${r}`);
    chip.addEventListener('click', () => {
      range = r;
      draw();
    });
    chips.appendChild(chip);
  }
  root.appendChild(chips);

  const bars = sliceDays(getDays(), range, lastToday);
  const barRow = el('div', 'bars');
  for (const bar of bars) {
    const node = el('i', `bar b${bar.level}`);
    node.dataset.key = bar.key;
    barRow.appendChild(node);
  }
  root.appendChild(barRow);

  const labels = el('div', 'month-labels');
  for (const label of monthSpans(bars)) {
    const span = el('span', 'month-label');
    span.textContent = label.name;
    span.style.flexGrow = String(label.days);
    labels.appendChild(span);
  }
  root.appendChild(labels);
}

interface MonthSpan {
  key: string;
  name: string;
  days: number;
}

function monthSpans(bars: DayBar[]): MonthSpan[] {
  const spans: MonthSpan[] = [];
  for (const bar of bars) {
    const month = bar.key.slice(0, 7);
    const last = spans[spans.length - 1];
    if (last && last.key === month) {
      last.days += 1;
    } else {
      spans.push({ key: month, name: monthLabel(month), days: 1 });
    }
  }
  return spans;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return monthName(y, m - 1, 'short');
}

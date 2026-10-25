import type { DaysMap } from '../types';
import { monthGridKeys, toKey } from '../logic/dates';
import { monthName } from '../i18n';
import { getDays, subscribe } from '../store';
import { el } from './dom';

export interface YearMonth {
  year: number;
  month0: number;
}

/** First month (0-indexed) of the May–Oct / Nov–Apr half-year containing this month. */
function halfStart(year: number, month0: number): YearMonth {
  if (month0 >= 4 && month0 <= 9) return { year, month0: 4 };
  if (month0 >= 10) return { year, month0: 10 };
  return { year: year - 1, month0: 10 };
}

/** The 6 months of half-year page `page`: page 0 holds `today`, page k is 6k months earlier. */
export function halfYearPage(page: number, today: Date): YearMonth[] {
  const start = halfStart(today.getFullYear(), today.getMonth());
  const abs = start.year * 12 + start.month0 - page * 6;
  return Array.from({ length: 6 }, (_, i) => {
    const m = abs + i;
    return { year: Math.floor(m / 12), month0: m % 12 };
  });
}

/** How many carousel pages span from the earliest data to the current half-year (min 1). */
export function pageCount(earliestKey: string | null, today: Date): number {
  if (earliestKey === null) return 1;
  const y = Number(earliestKey.slice(0, 4));
  const m = Number(earliestKey.slice(5, 7)) - 1;
  const earliest = halfStart(y, m);
  const current = halfStart(today.getFullYear(), today.getMonth());
  const diffMonths = (current.year - earliest.year) * 12 + current.month0 - earliest.month0;
  return Math.max(1, diffMonths / 6 + 1);
}

/** Earliest key of a days map, or null when empty. */
export function earliestDay(days: DaysMap): string | null {
  const keys = Object.keys(days).sort();
  return keys[0] ?? null;
}

let currentRoot: HTMLElement | null = null;
let lastToday = new Date();
let page = 0;
let unsub: (() => void) | null = null;

export function renderMiniCal(root: HTMLElement, today: Date = new Date()): void {
  currentRoot = root;
  lastToday = today;
  page = 0;
  if (!unsub) unsub = subscribe(draw);
  draw();
}

function shift(delta: number): void {
  // Back is always allowed (empty months render fine); forward stops at page 0.
  page = Math.max(page + delta, 0);
  draw();
}

function draw(): void {
  const root = currentRoot;
  if (!root) return;
  const today = lastToday;
  const days = getDays();
  root.innerHTML = '';

  const card = el('div', 'card mini-cal-card');

  const months = halfYearPage(page, today);
  const first = months[0];
  const last = months[months.length - 1];
  const sameYear = first.year === last.year;

  const nav = el('div', 'month-nav mini-nav');
  const prev = el('button', 'nav-btn mini-prev');
  prev.type = 'button';
  prev.textContent = '‹';
  prev.setAttribute('aria-label', 'older half-year');
  const next = el('button', 'nav-btn mini-next');
  next.type = 'button';
  next.textContent = '›';
  next.setAttribute('aria-label', 'newer half-year');
  next.disabled = page === 0;
  const title = el('span', 'mini-title');
  title.textContent = sameYear
    ? `${monthName(first.year, first.month0)} – ${monthName(last.year, last.month0)} ${last.year}`
    : `${monthName(first.year, first.month0)} ${first.year} – ${monthName(last.year, last.month0)} ${last.year}`;
  prev.addEventListener('click', () => shift(1));
  next.addEventListener('click', () => shift(-1));
  nav.append(prev, title, next);
  card.appendChild(nav);

  const grid = el('div', 'mini-months');
  for (const { year, month0 } of months) {
    grid.appendChild(drawMonth(year, month0, days, today));
  }
  card.appendChild(grid);

  const dots = el('div', 'dots');
  // Dots cover the data extent and keep growing as the user pages beyond it.
  const total = Math.max(pageCount(earliestDay(days), today), page + 1);
  for (let i = 0; i < total; i++) {
    const dot = el('i');
    if (i === page) dot.classList.add('active');
    dots.appendChild(dot);
  }
  card.appendChild(dots);

  let startX = 0;
  let startY = 0;
  card.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  card.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 2 * Math.abs(dy)) {
        shift(dx < 0 ? 1 : -1);
      }
    },
    { passive: true },
  );

  root.appendChild(card);
}

function drawMonth(year: number, month0: number, days: DaysMap, today: Date): HTMLElement {
  const month = el('div', 'mini-month');
  const name = el('div', 'mini-month-name');
  name.textContent = monthName(year, month0, 'short');
  month.appendChild(name);

  const grid = el('div', 'mini-grid');
  const todayKey = toKey(today);
  for (const key of monthGridKeys(year, month0)) {
    if (key === null) {
      grid.appendChild(el('div', 'mday empty'));
      continue;
    }
    const cell = el('div', 'mday');
    cell.textContent = String(Number(key.slice(8)));
    const state = days[key] ?? 0;
    if (state === 1) cell.classList.add('light');
    if (state === 2) cell.classList.add('heavy');
    if (key === todayKey) cell.classList.add('today');
    grid.appendChild(cell);
  }
  month.appendChild(grid);
  return month;
}

import type { DayState, DaysMap } from '../types';
import { computeCycleStats } from '../logic/cycles';
import { monthGridKeys, toKey } from '../logic/dates';
import { parsePeriods } from '../logic/periods';
import { computeStatus } from '../logic/status';
import { daysWord, getLang, monthName, t, weekdayShort } from '../i18n';
import { getDays, setDay, subscribe } from '../store';
import { getSettings } from '../settings';
import { el } from '../ui/dom';

/** One tap walks none → light → heavy → none. */
export function nextState(state: DayState): DayState {
  return ((state + 1) % 3) as DayState;
}

let currentRoot: HTMLElement | null = null;
let lastToday = new Date();
let viewYear = 0;
let viewMonth = 0;
let unsub: (() => void) | null = null;

export function renderCalendarView(root: HTMLElement, today: Date = new Date()): void {
  currentRoot = root;
  lastToday = today;
  if (viewYear === 0) {
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
  }
  if (!unsub) unsub = subscribe(draw);
  draw();
}

function shiftMonth(delta: number): void {
  viewMonth += delta;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  } else if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  draw();
}

function draw(): void {
  const root = currentRoot;
  if (!root) return;
  const today = lastToday;
  const days = getDays();
  const lang = getLang();
  root.innerHTML = '';

  root.appendChild(drawStatusCard(days, today, lang));
  root.appendChild(drawMonthNav());
  root.appendChild(drawGrid(days, today));
  root.appendChild(drawLegend());
}

function drawStatusCard(days: DaysMap, today: Date, lang: 'ru' | 'en') {
  const card = el('div', 'card status-card');
  const main = el('div', 'status-main');
  const sub = el('div', 'status-sub');

  const opts = { countLight: getSettings().countLight };
  const status = computeStatus(days, today, opts);
  if (status.mode === 'in-progress') {
    main.textContent = t('status.inProgress', { n: status.dayNumber, dw: daysWord(status.dayNumber, lang) });
  } else if (status.mode === 'until') {
    main.textContent = t('status.until', { n: status.days, dw: daysWord(status.days, lang) });
  } else if (status.mode === 'delay') {
    main.textContent = t('status.delay', { n: status.days, dw: daysWord(status.days, lang) });
  } else if (status.mode === 'no-data') {
    main.textContent = t('status.noData');
  } else {
    main.textContent = t('status.noForecast');
  }

  const stats = computeCycleStats(parsePeriods(days), opts);
  if (stats.lastCycleLength !== null) {
    sub.textContent = t('status.lastCycle', {
      n: stats.lastCycleLength,
      dw: daysWord(stats.lastCycleLength, lang),
    });
  }

  card.append(main, sub);
  return card;
}

function drawMonthNav() {
  const nav = el('div', 'month-nav');
  const prev = el('button', 'nav-btn prev');
  prev.type = 'button';
  prev.textContent = '‹';
  prev.setAttribute('aria-label', 'prev month');
  const next = el('button', 'nav-btn next');
  next.type = 'button';
  next.textContent = '›';
  next.setAttribute('aria-label', 'next month');
  const title = el('span', 'month-title');
  title.textContent = `${monthName(viewYear, viewMonth)} ${viewYear}`;
  prev.addEventListener('click', () => shiftMonth(-1));
  next.addEventListener('click', () => shiftMonth(1));
  nav.append(prev, title, next);
  return nav;
}

function drawGrid(days: DaysMap, today: Date) {
  const grid = el('div', 'cal-grid');
  for (const label of weekdayShort()) {
    const dow = el('div', 'dow');
    dow.textContent = label;
    grid.appendChild(dow);
  }

  const todayKey = toKey(today);
  for (const key of monthGridKeys(viewYear, viewMonth)) {
    if (key === null) {
      grid.appendChild(el('div', 'cell empty'));
      continue;
    }
    const cell = el('button', 'cell');
    cell.type = 'button';
    cell.dataset.key = key;
    cell.textContent = String(Number(key.slice(8)));
    const state = days[key] ?? 0;
    if (state === 1) cell.classList.add('light');
    if (state === 2) cell.classList.add('heavy');
    if (key === todayKey) cell.classList.add('today');
    cell.addEventListener('click', () => setDay(key, nextState(getDays()[key] ?? 0)));
    grid.appendChild(cell);
  }

  let startX = 0;
  let startY = 0;
  grid.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    },
    { passive: true },
  );
  grid.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 2 * Math.abs(dy)) {
        shiftMonth(dx < 0 ? 1 : -1);
      }
    },
    { passive: true },
  );

  return grid;
}

function drawLegend() {
  const legend = el('div', 'legend');
  const items: Array<[string, string]> = [
    ['dot light', t('legend.light')],
    ['dot heavy', t('legend.heavy')],
    ['ring', t('legend.today')],
  ];
  for (const [cls, label] of items) {
    const item = el('span', 'legend-item');
    const mark = el('i', cls);
    const text = el('span');
    text.textContent = label;
    item.append(mark, text);
    legend.appendChild(item);
  }
  return legend;
}

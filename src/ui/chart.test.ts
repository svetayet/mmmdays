import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderChart, sliceDays } from './chart';

let root: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('sliceDays', () => {
  it('six months back from 2026-10-25 starts at May 1, 178 days', () => {
    const bars = sliceDays({}, 6, new Date(2026, 9, 25));
    expect(bars).toHaveLength(178);
    expect(bars[0].key).toBe('2026-05-01');
    expect(bars[bars.length - 1].key).toBe('2026-10-25');
  });

  it('twelve months back starts at 2025-11-01, 359 days', () => {
    const bars = sliceDays({}, 12, new Date(2026, 9, 25));
    expect(bars[0].key).toBe('2025-11-01');
    expect(bars).toHaveLength(359);
  });

  it('carries day levels into bars', () => {
    const bars = sliceDays({ '2026-10-21': 2 }, 6, new Date(2026, 9, 25));
    expect(bars.find((b) => b.key === '2026-10-21')?.level).toBe(2);
    expect(bars.find((b) => b.key === '2026-10-20')?.level).toBe(0);
    expect(bars.filter((b) => b.level !== 0)).toHaveLength(1);
  });

  it('crosses the year boundary correctly', () => {
    const bars = sliceDays({}, 2, new Date(2027, 0, 10));
    expect(bars[0].key).toBe('2026-12-01');
    expect(bars).toHaveLength(41); // Dec 31 + Jan 10
    expect(bars[bars.length - 1].key).toBe('2027-01-10');
  });
});

describe('chart layout arithmetic', () => {
  // No layout engine in happy-dom, so model the overflow deterministically:
  // a flex row's minimum width is sum(min-width) + gaps. The bars must fit
  // the widest chart (12 months ≈ 359 bars) into a 360px phone viewport.
  const PHONE_VIEWPORT = 360;
  const APP_PADDING = 28; // #app side padding 14+14
  const CARD_PADDING = 24; // .card padding 12+12
  const MAX_BARS = 365;

  const css = readFileSync('src/styles.css', 'utf8');

  const rule = (selector: string, prop: string): number | null => {
    const m = css.match(new RegExp(`\\.bars(?:\\s|\\{)[^}]*\\}`))!;
    const block = selector === '.bars' ? m[0] : css.match(new RegExp(`\\.bars \\.bar(?:\\s|\\{)[^}]*\\}`))![0];
    const propMatch = block.match(new RegExp(`${prop}\\s*:\\s*([\\d.]+)px`));
    return propMatch ? Number(propMatch[1]) : null;
  };

  it('bar row fits the widest range on a 360px phone', () => {
    const gap = rule('.bars', 'gap') ?? 0;
    const minWidth = rule('.bars .bar', 'min-width') ?? 0;
    const minRowWidth = MAX_BARS * minWidth + (MAX_BARS - 1) * gap;
    expect(minRowWidth).toBeLessThanOrEqual(PHONE_VIEWPORT - APP_PADDING - CARD_PADDING);
  });
});

describe('renderChart', () => {
  it('renders four range chips with 6 months active by default', () => {
    renderChart(root, new Date(2026, 9, 25));
    const chips = [...root.querySelectorAll('.chip')] as HTMLElement[];
    expect(chips.map((c) => c.textContent)).toEqual(['3 мес', '6 мес', '9 мес', '1 год']);
    expect(chips[1].classList.contains('active')).toBe(true);
  });

  it('renders one thin bar per day and switches range on chip click', () => {
    renderChart(root, new Date(2026, 9, 25));
    expect(root.querySelectorAll('.bar')).toHaveLength(178);
    root.querySelectorAll<HTMLElement>('.chip')[0].click();
    expect(root.querySelectorAll('.bar')).toHaveLength(86); // Aug 1 … Oct 25
  });

  it('colors bars by day level', () => {
    localStorage.setItem(
      'mmmdays.v1',
      JSON.stringify({ v: 1, days: { '2026-10-21': 1, '2026-10-22': 2 } }),
    );
    renderChart(root, new Date(2026, 9, 25));
    expect(root.querySelector('.bar[data-key="2026-10-21"]')?.classList.contains('b1')).toBe(true);
    expect(root.querySelector('.bar[data-key="2026-10-22"]')?.classList.contains('b2')).toBe(true);
    expect(root.querySelector('.bar[data-key="2026-10-20"]')?.classList.contains('b0')).toBe(true);
  });

  it('labels each month of the range once', () => {
    renderChart(root, new Date(2026, 9, 25));
    expect(root.querySelectorAll('.month-label')).toHaveLength(6);
  });
});

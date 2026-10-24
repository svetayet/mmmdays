import { beforeEach, describe, expect, it } from 'vitest';
import { halfYearPage, pageCount, renderMiniCal } from './miniCal';

const TODAY = new Date(2026, 9, 25);

let root: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('halfYearPage', () => {
  it('page 0 is the half-year containing today, ascending', () => {
    expect(halfYearPage(0, TODAY)).toEqual([
      { year: 2026, month0: 4 },
      { year: 2026, month0: 5 },
      { year: 2026, month0: 6 },
      { year: 2026, month0: 7 },
      { year: 2026, month0: 8 },
      { year: 2026, month0: 9 },
    ]);
  });

  it('page 1 is the previous half-year across the year boundary', () => {
    expect(halfYearPage(1, TODAY)).toEqual([
      { year: 2025, month0: 10 },
      { year: 2025, month0: 11 },
      { year: 2026, month0: 0 },
      { year: 2026, month0: 1 },
      { year: 2026, month0: 2 },
      { year: 2026, month0: 3 },
    ]);
  });

  it('page 2 starts at May 2025', () => {
    expect(halfYearPage(2, TODAY)[0]).toEqual({ year: 2025, month0: 4 });
  });

  it('today in spring belongs to the Nov–Apr half-year', () => {
    expect(halfYearPage(0, new Date(2026, 1, 10))[0]).toEqual({ year: 2025, month0: 10 });
  });
});

describe('pageCount', () => {
  it('no data → 1', () => {
    expect(pageCount(null, TODAY)).toBe(1);
  });

  it('data inside the current half-year → 1', () => {
    expect(pageCount('2026-05-01', TODAY)).toBe(1);
  });

  it('data in the previous half-year → 2', () => {
    expect(pageCount('2026-03-15', TODAY)).toBe(2);
  });

  it('data two and a half years back → 5', () => {
    expect(pageCount('2024-06-01', TODAY)).toBe(5);
  });
});

describe('renderMiniCal', () => {
  it('header names the half-year; › disabled on page 0', () => {
    renderMiniCal(root, TODAY);
    expect(root.querySelector('.mini-title')?.textContent).toBe('Май – Октябрь 2026');
    expect((root.querySelector('.mini-next') as HTMLButtonElement)?.disabled).toBe(true);
  });

  it('‹ flips to the previous half-year with both years in the header', () => {
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days: { '2026-03-15': 1 } }));
    renderMiniCal(root, TODAY);
    (root.querySelector('.mini-prev') as HTMLButtonElement).click();
    expect(root.querySelector('.mini-title')?.textContent).toBe('Ноябрь 2025 – Апрель 2026');
    expect((root.querySelector('.mini-next') as HTMLButtonElement)?.disabled).toBe(false);
  });

  it('renders day numbers and colors marked days', () => {
    localStorage.setItem(
      'mmmdays.v1',
      JSON.stringify({ v: 1, days: { '2026-05-10': 2, '2026-05-11': 1 } }),
    );
    renderMiniCal(root, TODAY);
    const may = [...root.querySelectorAll('.mini-month')].find(
      (m) => m.querySelector('.mini-month-name')?.textContent === 'Май',
    );
    const days = [...(may?.querySelectorAll('.mday') ?? [])] as HTMLElement[];
    expect(days.map((d) => d.textContent)).toContain('10');
    expect(days.find((d) => d.textContent === '10')?.classList.contains('heavy')).toBe(true);
    expect(days.find((d) => d.textContent === '11')?.classList.contains('light')).toBe(true);
    expect(days.find((d) => d.textContent === '12')?.classList.contains('heavy')).toBe(false);
  });

  it('rings today on page 0 and shows one dot per page with the current active', () => {
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days: { '2026-03-15': 1 } }));
    renderMiniCal(root, TODAY);
    expect(root.querySelectorAll('.mday.today')).toHaveLength(1);
    const dots = [...root.querySelectorAll('.dots i')];
    expect(dots).toHaveLength(2);
    expect(dots[0].classList.contains('active')).toBe(true);
  });

  it('swipe left goes older, swipe right goes back', () => {
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days: { '2026-03-15': 1 } }));
    renderMiniCal(root, TODAY);
    const card = root.querySelector('.mini-cal-card') as HTMLElement;
    swipe(card, -80, 0);
    expect(root.querySelector('.mini-title')?.textContent).toBe('Ноябрь 2025 – Апрель 2026');
    swipe(card, 80, 0);
    expect(root.querySelector('.mini-title')?.textContent).toBe('Май – Октябрь 2026');
  });
});

function swipe(target: HTMLElement, dx: number, dy: number): void {  target.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 0, target, clientX: 100, clientY: 100 })] }));
  target.dispatchEvent(
    new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target, clientX: 100 + dx, clientY: 100 + dy })],
    }),
  );
}

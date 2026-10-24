import { beforeEach, describe, expect, it } from 'vitest';
import { renderCalendarView } from './calendarView';
import { getDays } from '../store';

let root: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('calendar view', () => {
  it('renders weekday header and 31 day cells for the month of today', () => {
    renderCalendarView(root, new Date(2026, 9, 24));
    expect(root.querySelectorAll('.dow')).toHaveLength(7);
    expect(root.querySelectorAll('.cell[data-key]')).toHaveLength(31);
    expect(root.querySelector('[data-key="2026-10-01"]')).not.toBeNull();
    expect(root.querySelector('[data-key="2026-10-31"]')).not.toBeNull();
  });

  it('shows the empty status when there is no data', () => {
    renderCalendarView(root, new Date(2026, 9, 24));
    expect(root.querySelector('.status-card')?.textContent).toContain('Отметьте первый день');
  });

  it('marks today with a ring', () => {
    renderCalendarView(root, new Date(2026, 9, 24));
    expect(root.querySelector('.cell.today')?.textContent?.trim()).toBe('24');
  });

  it('tapping a day cycles none → light → heavy → none and persists', () => {
    renderCalendarView(root, new Date(2026, 9, 24));
    root.querySelector<HTMLElement>('[data-key="2026-10-21"]')!.click();
    expect(getDays()['2026-10-21']).toBe(1);
    expect(root.querySelector('[data-key="2026-10-21"]')!.classList.contains('light')).toBe(true);

    root.querySelector<HTMLElement>('[data-key="2026-10-21"]')!.click();
    expect(getDays()['2026-10-21']).toBe(2);
    expect(root.querySelector('[data-key="2026-10-21"]')!.classList.contains('heavy')).toBe(true);

    root.querySelector<HTMLElement>('[data-key="2026-10-21"]')!.click();
    expect(getDays()['2026-10-21']).toBeUndefined();
  });

  it('status card counts in-progress days from the first heavy day', () => {
    const days = getDays();
    days['2026-10-20'] = 1;
    days['2026-10-21'] = 2;
    days['2026-10-22'] = 2;
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days }));

    renderCalendarView(root, new Date(2026, 9, 23));
    expect(root.querySelector('.status-main')?.textContent).toContain('В процессе • 3 дня');
  });

  it('arrows navigate to the previous month', () => {
    renderCalendarView(root, new Date(2026, 9, 24));
    root.querySelector<HTMLElement>('.month-nav .prev')!.click();
    expect(root.querySelector('.month-title')?.textContent).toContain('Сентябрь');
    expect(root.querySelectorAll('.cell[data-key]')).toHaveLength(30);
    root.querySelector<HTMLElement>('.month-nav .next')!.click();
    expect(root.querySelector('.month-title')?.textContent).toContain('Октябрь');
  });
});

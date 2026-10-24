import { beforeEach, describe, expect, it } from 'vitest';
import { mountApp } from './main';
import { toKey } from './logic/dates';

/** Final spec pass: the whole user journey through the real mountApp. */
describe('app journey', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('mark days → status → stats screen → carousel → language switch', () => {
    // Seed three 28-day cycles ending near today (dates relative to real now),
    // plus one stray old mark so the carousel has a second half-year page.
    const now = new Date();
    const days: Record<string, 1 | 2> = {};
    const old = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 240);
    days[toKey(old)] = 1;
    for (let c = 2; c >= 0; c--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - c * 28 - 5);
      for (let i = 0; i < 5; i++) {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        days[toKey(d)] = i === 0 ? 2 : 1;
      }
    }
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days }));

    mountApp();
    const app = document.getElementById('app')!;

    // Calendar is the first screen and shows a status card.
    expect(app.querySelector('#view-calendar')!.hidden).toBe(false);
    expect(app.querySelector('.status-main')?.textContent).toBeTruthy();

    // A tap cycles today's cell: none → light → heavy → none.
    // The grid re-renders on every mark, so re-query after each click.
    const todayKey = toKey(now);
    const cell = () => app.querySelector(`.cell[data-key="${todayKey}"]`) as HTMLElement;
    const state = () => {
      const c = cell();
      return c.classList.contains('heavy') ? 2 : c.classList.contains('light') ? 1 : 0;
    };
    if (state() === 0) {
      cell().click();
      expect(state()).toBe(1);
      cell().click();
      expect(state()).toBe(2);
      cell().click();
      expect(state()).toBe(0); // leave storage as seeded
    }

    // Switch to stats.
    const statsTab = [...app.querySelectorAll('.tab-btn')].find((b) => b.dataset.view === 'view-stats')!;
    statsTab.click();
    const stats = app.querySelector('#view-stats') as HTMLElement;
    expect(stats.hidden).toBe(false);
    expect(stats.querySelector('.card-last .card-value')?.textContent).not.toBe('—');
    expect(stats.querySelectorAll('.tile-value')).toHaveLength(3);
    expect(stats.querySelector('.chips')).not.toBeNull();
    expect(stats.querySelector('.mini-cal-card')).not.toBeNull();
    expect([...stats.querySelectorAll('button')].some((b) => b.textContent === 'Экспорт JSON')).toBe(true);

    // Carousel pages back into history (data is ~2.5 months old).
    const titleBefore = stats.querySelector('.mini-title')?.textContent;
    (stats.querySelector('.mini-prev') as HTMLElement).click();
    expect(stats.querySelector('.mini-title')?.textContent).not.toBe(titleBefore);
    (stats.querySelector('.mini-next') as HTMLElement).click();
    expect(stats.querySelector('.mini-title')?.textContent).toBe(titleBefore);

    // Language switch re-mounts the app in English (calendar tab active again), and back.
    (app.querySelector('.lang-btn:not(.active)') as HTMLElement).click();
    expect(document.querySelector('.tab-btn.active')?.textContent).toBe('Calendar');
    (document.querySelector('.lang-btn:not(.active)') as HTMLElement).click();
    expect(document.querySelector('.tab-btn.active')?.textContent).toBe('Календарь');
    expect(localStorage.getItem('mmmdays.lang')).toBe('ru');
  });
});

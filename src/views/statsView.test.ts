import { beforeEach, describe, expect, it } from 'vitest';
import { renderStatsView } from './statsView';
import { setDay } from '../store';
import { setSettings } from '../settings';

let root: HTMLElement;

function seedDays(days: Record<string, 1 | 2>): void {
  localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days }));
}

/** Three 5-day periods starting 2026-08-20, 2026-09-17, 2026-10-15: cycles of 28, 28. */
function seedRegular(): void {
  const days: Record<string, 1 | 2> = {};
  for (const start of ['2026-08-20', '2026-09-17', '2026-10-15']) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, Number(start.slice(8)) + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days[key] = 2;
    }
  }
  seedDays(days);
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('renderStatsView', () => {
  it('shows last start date and forecast with ≈', () => {
    seedRegular();
    renderStatsView(root, new Date(2026, 9, 25));
    expect(root.querySelector('.card-last .card-value')?.textContent).toBe('15 октября');
    expect(root.querySelector('.card-forecast .card-value')?.textContent).toBe('≈ 12 ноября');
  });

  it('tiles show avg cycle, avg duration and rhythm', () => {
    seedRegular();
    renderStatsView(root, new Date(2026, 9, 25));
    const values = [...root.querySelectorAll('.tile-value')].map((n) => n.textContent);
    const labels = [...root.querySelectorAll('.tile-label')].map((n) => n.textContent);
    expect(values).toEqual(['28', '5', 'ровно']);
    expect(labels).toEqual(['дней в цикле', 'дней длится', 'ритм']);
  });

  it('empty state: dashes everywhere and мало данных under rhythm', () => {
    renderStatsView(root, new Date(2026, 9, 25));
    expect(root.querySelector('.card-last .card-value')?.textContent).toBe('—');
    expect(root.querySelector('.card-forecast .card-value')?.textContent).toBe('—');
    const values = [...root.querySelectorAll('.tile-value')].map((n) => n.textContent);
    expect(values).toEqual(['—', '—', '—']);
    expect(root.querySelectorAll('.tile-label')[2]?.textContent).toBe('мало данных');
  });

  it('mounts the chart and mini-cal; the data card no longer lives here', () => {
    renderStatsView(root, new Date(2026, 9, 25));
    expect(root.querySelector('.chips')).not.toBeNull();
    expect(root.querySelector('#mini-cal-mount')).not.toBeNull();
    expect(root.querySelector('#data-mount')).toBeNull();
    expect(root.querySelector('.data-card')).toBeNull();
  });

  it('re-renders when the store changes', () => {
    renderStatsView(root, new Date(2026, 9, 25));
    expect(root.querySelector('.card-last .card-value')?.textContent).toBe('—');
    setDay('2026-10-15', 2);
    expect(root.querySelector('.card-last .card-value')?.textContent).toBe('15 октября');
  });

  it('countLight setting switches duration and cycle math', () => {
    // Two periods of 5 marked days each; two leading light days in the first.
    seedDays({
      '2026-09-17': 1, '2026-09-18': 1,
      '2026-09-19': 2, '2026-09-20': 2, '2026-09-21': 2,
      '2026-10-15': 1, '2026-10-16': 2, '2026-10-17': 2, '2026-10-18': 2, '2026-10-19': 2,
    });
    renderStatsView(root, new Date(2026, 9, 25));
    expect(values()).toEqual(['27', '4', 'ровно']); // heavy anchors, heavy-day duration

    setSettings({ countLight: true });
    renderStatsView(root, new Date(2026, 9, 25));
    expect(values()).toEqual(['28', '5', 'ровно']); // first marked day, full length
  });
});

function values(): string[] {
  return [...root.querySelectorAll('.tile-value')].map((n) => n.textContent);
}

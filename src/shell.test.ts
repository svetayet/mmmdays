import { beforeEach, describe, expect, it } from 'vitest';
import { mountApp } from './main';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
});

describe('app shell', () => {
  it('renders header with title, language pill, two views and tab bar', () => {
    mountApp();
    expect(document.querySelector('.app-title')?.textContent).toBe('MmmDays');
    expect(document.querySelectorAll('.lang-btn')).toHaveLength(2);
    expect(document.getElementById('view-calendar')).not.toBeNull();
    expect(document.getElementById('view-stats')).not.toBeNull();
    expect(document.querySelectorAll('.tabbar .tab-btn')).toHaveLength(2);
  });

  it('shows calendar first, stats hidden', () => {
    mountApp();
    expect((document.getElementById('view-calendar') as HTMLElement).hidden).toBe(false);
    expect((document.getElementById('view-stats') as HTMLElement).hidden).toBe(true);
  });

  it('switches tabs on click', () => {
    mountApp();
    const statsTab = [...document.querySelectorAll('.tab-btn')].find(
      (b) => b.getAttribute('data-view') === 'view-stats',
    ) as HTMLElement;
    statsTab.click();
    expect((document.getElementById('view-calendar') as HTMLElement).hidden).toBe(true);
    expect((document.getElementById('view-stats') as HTMLElement).hidden).toBe(false);
    expect(statsTab.classList.contains('active')).toBe(true);
  });

  it('language toggle re-renders tab labels and persists choice', () => {
    mountApp();
    const enBtn = [...document.querySelectorAll('.lang-btn')].find(
      (b) => b.textContent === 'EN',
    ) as HTMLElement;
    enBtn.click();
    const labels = [...document.querySelectorAll('.tab-btn')].map((b) => b.textContent);
    expect(labels).toContain('Stats');
    expect(localStorage.getItem('mmmdays.lang')).toBe('en');
  });
});

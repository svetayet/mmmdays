import { beforeEach, describe, expect, it } from 'vitest';
import { mountApp } from './main';
import { setSettings } from './settings';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
  document.body.innerHTML = '<div id="app"></div>';
});

describe('app shell', () => {
  it('renders header with title, language pill, three views and tab bar', () => {
    mountApp();
    expect(document.querySelector('.app-title')?.textContent).toBe('MmmDays');
    expect(document.querySelectorAll('.lang-btn')).toHaveLength(2);
    expect(document.getElementById('view-calendar')).not.toBeNull();
    expect(document.getElementById('view-stats')).not.toBeNull();
    expect(document.getElementById('view-settings')).not.toBeNull();
    const tabs = [...document.querySelectorAll('.tabbar .tab-btn')];
    expect(tabs).toHaveLength(3);
    expect(tabs.map((b) => b.textContent)).toEqual(['Календарь', 'Статистика', 'Настройки']);
  });

  it('shows calendar first, other views hidden', () => {
    mountApp();
    expect((document.getElementById('view-calendar') as HTMLElement).hidden).toBe(false);
    expect((document.getElementById('view-stats') as HTMLElement).hidden).toBe(true);
    expect((document.getElementById('view-settings') as HTMLElement).hidden).toBe(true);
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

  it('applies the stored theme at mount', () => {
    localStorage.setItem('mmmdays.settings', JSON.stringify({ theme: 'dark', countLight: false }));
    mountApp();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('settings change re-renders views in place, keeping the current tab', () => {
    mountApp();
    const statsTab = [...document.querySelectorAll('.tab-btn')].find(
      (b) => b.getAttribute('data-view') === 'view-stats',
    ) as HTMLElement;
    statsTab.click();
    setSettings({ countLight: true });
    const stats = document.getElementById('view-stats') as HTMLElement;
    expect(stats.hidden).toBe(false);
    expect(stats.querySelector('.card-last')).not.toBeNull();
    setSettings({ theme: 'dark' });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect((document.getElementById('view-stats') as HTMLElement).hidden).toBe(false);
  });

  it('language toggle re-renders tab labels and persists choice', () => {
    mountApp();
    const enBtn = [...document.querySelectorAll('.lang-btn')].find(
      (b) => b.textContent === 'EN',
    ) as HTMLElement;
    enBtn.click();
    const labels = [...document.querySelectorAll('.tab-btn')].map((b) => b.textContent);
    expect(labels).toContain('Stats');
    expect(labels).toContain('Settings');
    expect(localStorage.getItem('mmmdays.lang')).toBe('en');
  });
});

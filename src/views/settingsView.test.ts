import { beforeEach, describe, expect, it } from 'vitest';
import { renderSettingsView } from './settingsView';

let root: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('renderSettingsView', () => {
  it('renders title, theme pills with active state, countLight toggle and data card', () => {
    renderSettingsView(root, new Date(2026, 9, 25));
    expect(root.querySelector('.section-title')?.textContent).toBe('Настройки');

    const pills = [...root.querySelectorAll('.theme-btn')];
    expect(pills.map((b) => b.textContent)).toEqual(['Светлая', 'Тёмная']);
    expect(pills.find((b) => b.classList.contains('active'))?.textContent).toBe('Светлая');

    const toggle = root.querySelector<HTMLInputElement>('input.toggle')!;
    expect(toggle.type).toBe('checkbox');
    expect(toggle.checked).toBe(false);
    expect(root.querySelector('.toggle-hint')?.textContent).toContain('в расчётах');

    expect(root.querySelector('#data-mount .data-btn')?.textContent).toBe('Экспорт JSON');
  });

  it('dark pill click applies the theme, persists and redraws the pills', () => {
    renderSettingsView(root, new Date(2026, 9, 25));
    const dark = [...root.querySelectorAll('.theme-btn')].find(
      (b) => b.textContent === 'Тёмная',
    ) as HTMLElement;
    dark.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('mmmdays.settings')).toBe('{"theme":"dark","countLight":false}');
    expect(root.querySelector('.theme-btn.active')?.textContent).toBe('Тёмная');
  });

  it('countLight toggle persists and redraws checked state', () => {
    renderSettingsView(root, new Date(2026, 9, 25));
    const toggle = root.querySelector<HTMLInputElement>('input.toggle')!;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(localStorage.getItem('mmmdays.settings')).toBe('{"theme":"light","countLight":true}');
    expect(root.querySelector<HTMLInputElement>('input.toggle')!.checked).toBe(true);
  });

  it('restores stored settings on mount', () => {
    localStorage.setItem('mmmdays.settings', JSON.stringify({ theme: 'dark', countLight: true }));
    renderSettingsView(root, new Date(2026, 9, 25));
    expect(root.querySelector('.theme-btn.active')?.textContent).toBe('Тёмная');
    expect(root.querySelector<HTMLInputElement>('input.toggle')!.checked).toBe(true);
  });
});

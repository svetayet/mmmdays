import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSettings, setSettings, subscribe } from './settings';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = 'light';
});

describe('settings module', () => {
  it('defaults from a clean store', () => {
    expect(getSettings()).toEqual({ theme: 'light', countLight: false });
  });

  it('setSettings patches, persists and notifies', () => {
    const listener = vi.fn();
    const unsub = subscribe(listener);
    setSettings({ theme: 'dark' });
    expect(getSettings()).toEqual({ theme: 'dark', countLight: false });
    expect(localStorage.getItem('mmmdays.settings')).toBe('{"theme":"dark","countLight":false}');
    expect(listener).toHaveBeenCalledTimes(1);
    setSettings({ countLight: true });
    expect(getSettings()).toEqual({ theme: 'dark', countLight: true });
    expect(listener).toHaveBeenCalledTimes(2);
    unsub();
    setSettings({ theme: 'light' });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('theme change applies data-theme to the document root', () => {
    setSettings({ theme: 'dark' });
    expect(document.documentElement.dataset.theme).toBe('dark');
    setSettings({ theme: 'light' });
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('countLight change alone does not touch the theme attribute', () => {
    setSettings({ theme: 'dark' });
    setSettings({ countLight: true });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { loadData, loadLang, loadSettings, saveData, saveLang, saveSettings } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('loadData', () => {
  it('returns empty data when key is missing', () => {
    expect(loadData()).toEqual({ v: 1, days: {} });
  });

  it('round-trips through saveData', () => {
    saveData({ v: 1, days: { '2026-10-21': 2 } });
    expect(loadData()).toEqual({ v: 1, days: { '2026-10-21': 2 } });
  });

  it('corrupted value falls back to empty data without throwing', () => {
    localStorage.setItem('mmmdays.v1', '{not json');
    expect(loadData()).toEqual({ v: 1, days: {} });
  });

  it('keeps valid entries and drops only invalid ones (no silent total loss)', () => {
    localStorage.setItem(
      'mmmdays.v1',
      JSON.stringify({ v: 1, days: { '2026-10-21': 2, '2026-10-22': 1, '2026-10-23': 3 } }),
    );
    expect(loadData()).toEqual({ v: 1, days: { '2026-10-21': 2, '2026-10-22': 1 } });
  });

  it('drops entries with malformed date keys, keeps the rest', () => {
    localStorage.setItem(
      'mmmdays.v1',
      JSON.stringify({ v: 1, days: { 'yesterday': 1, '2026-10-21': 2 } }),
    );
    expect(loadData()).toEqual({ v: 1, days: { '2026-10-21': 2 } });
  });

  it('wrong shape falls back to empty data', () => {
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days: 'nope' }));
    expect(loadData()).toEqual({ v: 1, days: {} });
  });

  it('invalid day values fall back to empty data', () => {
    localStorage.setItem('mmmdays.v1', JSON.stringify({ v: 1, days: { x: 9 } }));
    expect(loadData()).toEqual({ v: 1, days: {} });
  });
});

describe('lang persistence', () => {
  it('null when never chosen', () => {
    expect(loadLang()).toBeNull();
  });

  it('saves and loads', () => {
    saveLang('en');
    expect(loadLang()).toBe('en');
  });

  it('unknown stored value reads as null', () => {
    localStorage.setItem('mmmdays.lang', 'de');
    expect(loadLang()).toBeNull();
  });
});

describe('settings persistence', () => {
  it('defaults: light theme, light days not counted', () => {
    expect(loadSettings()).toEqual({ theme: 'light', countLight: false });
  });

  it('round-trips through saveSettings', () => {
    saveSettings({ theme: 'dark', countLight: true });
    expect(loadSettings()).toEqual({ theme: 'dark', countLight: true });
  });

  it('grey theme round-trips and survives the guard', () => {
    saveSettings({ theme: 'grey', countLight: false });
    expect(loadSettings()).toEqual({ theme: 'grey', countLight: false });
    localStorage.setItem('mmmdays.settings', JSON.stringify({ theme: 'grey' }));
    expect(loadSettings()).toEqual({ theme: 'grey', countLight: false });
  });

  it('corrupted or partial settings fall back to defaults without throwing', () => {
    localStorage.setItem('mmmdays.settings', '{oops');
    expect(loadSettings()).toEqual({ theme: 'light', countLight: false });
    localStorage.setItem('mmmdays.settings', JSON.stringify({ theme: 'blue' }));
    expect(loadSettings()).toEqual({ theme: 'light', countLight: false });
    localStorage.setItem('mmmdays.settings', JSON.stringify({ theme: 'pink' }));
    expect(loadSettings()).toEqual({ theme: 'light', countLight: false });
    localStorage.setItem('mmmdays.settings', JSON.stringify({ theme: 'dark' }));
    expect(loadSettings()).toEqual({ theme: 'dark', countLight: false });
  });
});

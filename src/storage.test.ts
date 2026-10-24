import { beforeEach, describe, expect, it } from 'vitest';
import { loadData, loadLang, saveData, saveLang } from './storage';

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

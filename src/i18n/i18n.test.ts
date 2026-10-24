import { beforeEach, describe, expect, it, vi } from 'vitest';
import { daysWord, monthName, setLang, t, weekdayShort } from './index';

beforeEach(() => {
  localStorage.clear();
  setLang('ru');
});

describe('i18n', () => {
  it('defaults to ru when nothing is stored', async () => {
    localStorage.clear();
    vi.resetModules();
    const { getLang } = await import('./index');
    expect(getLang()).toBe('ru');
  });

  it('switches dictionary with setLang', () => {
    setLang('en');
    expect(t('tabs.stats')).toBe('Stats');
    setLang('ru');
    expect(t('tabs.stats')).toBe('Статистика');
  });

  it('substitutes params', () => {
    expect(t('status.until', { n: 5, dw: daysWord(5, 'ru') })).toBe('До начала: 5 дней');
    expect(t('status.inProgress', { n: 3, dw: daysWord(3, 'ru') })).toBe('В процессе • 3 дня');
  });

  it('falls back to ru for a missing key, then to the key itself', () => {
    setLang('en');
    expect(t('tabs.calendar')).toBe('Calendar');
    expect(t('no.such.key')).toBe('no.such.key');
  });
});

describe('daysWord', () => {
  it('russian plural forms', () => {
    expect(daysWord(1, 'ru')).toBe('день');
    expect(daysWord(2, 'ru')).toBe('дня');
    expect(daysWord(4, 'ru')).toBe('дня');
    expect(daysWord(5, 'ru')).toBe('дней');
    expect(daysWord(11, 'ru')).toBe('дней');
    expect(daysWord(21, 'ru')).toBe('день');
    expect(daysWord(22, 'ru')).toBe('дня');
    expect(daysWord(25, 'ru')).toBe('дней');
  });

  it('english plural forms', () => {
    expect(daysWord(1, 'en')).toBe('day');
    expect(daysWord(2, 'en')).toBe('days');
    expect(daysWord(5, 'en')).toBe('days');
  });
});

describe('monthName', () => {
  it('long form in ru', () => {
    expect(monthName(2026, 9)).toBe('октябрь');
  });

  it('long form in en', () => {
    setLang('en');
    expect(monthName(2026, 9)).toBe('October');
  });

  it('short form', () => {
    setLang('en');
    expect(monthName(2026, 9, 'short')).toBe('Oct');
  });
});

describe('weekdayShort', () => {
  it('starts with monday, ru', () => {
    expect(weekdayShort()[0]).toBe('пн');
    expect(weekdayShort()).toHaveLength(7);
  });

  it('starts with monday, en', () => {
    setLang('en');
    expect(weekdayShort()[0]).toBe('Mon');
  });
});

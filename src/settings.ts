import { loadSettings, saveSettings, type Settings } from './storage';

/** Settings live in localStorage; every change is applied and announced. */

const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return loadSettings();
}

export function setSettings(patch: Partial<Settings>): void {
  const next = { ...loadSettings(), ...patch };
  saveSettings(next);
  if (patch.theme !== undefined) applyTheme(next.theme);
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Set at startup too, so a stored dark theme survives reloads. */
export function applyTheme(theme: Settings['theme']): void {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#16171B' : '#F5F6F7');
}

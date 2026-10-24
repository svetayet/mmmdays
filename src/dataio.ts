import type { AppData, DaysMap } from './types';
import { t } from './i18n';
import { toKey } from './logic/dates';
import { getAllData, replaceDays } from './store';
import { el } from './ui/dom';

export interface Backup {
  v: 1;
  days: DaysMap;
  exportedAt: string;
}

export function buildBackup(data: AppData): Backup {
  return { v: 1, days: { ...data.days }, exportedAt: new Date().toISOString() };
}

export type BackupParse =
  | { ok: true; days: DaysMap }
  | { ok: false; error: string };

/** Key must be a real calendar date, not just three number groups. */
const DATE_KEY = /^(?:\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function validateBackup(text: string): BackupParse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'not JSON' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'not an object' };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.v !== 1) return { ok: false, error: 'unsupported version' };
  const days = obj.days;
  if (typeof days !== 'object' || days === null || Array.isArray(days)) {
    return { ok: false, error: 'missing days' };
  }
  for (const [key, value] of Object.entries(days)) {
    if (!DATE_KEY.test(key)) return { ok: false, error: `bad key ${key}` };
    if (value !== 1 && value !== 2) return { ok: false, error: `bad value for ${key}` };
  }
  return { ok: true, days: days as DaysMap };
}

export function mergeDays(current: DaysMap, incoming: DaysMap): {
  merged: DaysMap;
  added: number;
  replaced: number;
} {
  const merged: DaysMap = { ...current };
  let added = 0;
  let replaced = 0;
  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in merged)) {
      added++;
    } else if (merged[key] !== value) {
      replaced++;
    }
    merged[key] = value;
  }
  return { merged, added, replaced };
}

/** «Данные» card: export downloads a dated JSON backup, import merges after a confirm. */
export function renderDataCard(root: HTMLElement, today: Date = new Date()): void {
  const card = el('div', 'card data-card');

  const title = el('div', 'card-label');
  title.textContent = t('data.title');
  card.appendChild(title);

  const buttons = el('div', 'data-buttons');

  const exportBtn = el('button', 'data-btn');
  exportBtn.type = 'button';
  exportBtn.textContent = t('data.export');
  exportBtn.addEventListener('click', () => {
    const backup = buildBackup(getAllData());
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mmmdays-backup-${toKey(today)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });
  buttons.appendChild(exportBtn);

  const fileInput = el('input') as HTMLInputElement;
  fileInput.type = 'file';
  fileInput.accept = 'application/json';
  fileInput.classList.add('data-input');
  const importLabel = el('label', 'data-btn');
  importLabel.textContent = t('data.import');
  importLabel.appendChild(fileInput);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void importFile(file);
    fileInput.value = '';
  });
  buttons.appendChild(importLabel);

  card.appendChild(buttons);
  root.appendChild(card);
}

async function importFile(file: File): Promise<void> {
  const text = await file.text();
  const parsed = validateBackup(text);
  if (!parsed.ok) {
    window.alert(t('data.importInvalid'));
    return;
  }
  const current = getAllData().days;
  const { merged, added, replaced } = mergeDays(current, parsed.days);
  if (window.confirm(t('data.importConfirm', { a: added, r: replaced }))) {
    replaceDays(merged);
  }
}

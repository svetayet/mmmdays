import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBackup, mergeDays, renderDataCard, validateBackup } from './dataio';
import { setDay } from './store';

let root: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('validateBackup', () => {
  it('accepts a valid file with exportedAt', () => {
    const res = validateBackup('{"v":1,"days":{"2026-10-15":2},"exportedAt":"2026-10-25T00:00:00.000Z"}');
    expect(res).toEqual({ ok: true, days: { '2026-10-15': 2 } });
  });

  it('accepts a file without exportedAt and ignores extra top-level fields', () => {
    const res = validateBackup('{"v":1,"days":{"2026-10-15":1},"note":"x"}');
    expect(res).toEqual({ ok: true, days: { '2026-10-15': 1 } });
  });

  it('rejects non-JSON', () => {
    expect(validateBackup('not json').ok).toBe(false);
  });

  it('rejects missing days', () => {
    expect(validateBackup('{"v":1}').ok).toBe(false);
  });

  it('rejects v 2', () => {
    expect(validateBackup('{"v":2,"days":{}}').ok).toBe(false);
  });

  it('rejects impossible dates like 2026-13-40', () => {
    expect(validateBackup('{"v":1,"days":{"2026-13-40":1}}').ok).toBe(false);
  });

  it('rejects string, 0 and 3 values', () => {
    expect(validateBackup('{"v":1,"days":{"2026-10-15":"2"}}').ok).toBe(false);
    expect(validateBackup('{"v":1,"days":{"2026-10-15":0}}').ok).toBe(false);
    expect(validateBackup('{"v":1,"days":{"2026-10-15":3}}').ok).toBe(false);
  });
});

describe('mergeDays', () => {
  it('incoming wins, counts added and replaced', () => {
    const res = mergeDays({ '2026-01-01': 1 }, { '2026-01-01': 2, '2026-01-02': 1 });
    expect(res.merged).toEqual({ '2026-01-01': 2, '2026-01-02': 1 });
    expect(res.added).toBe(1);
    expect(res.replaced).toBe(1);
  });

  it('identical values count as neither', () => {
    const res = mergeDays({ '2026-01-01': 2, '2026-01-02': 1 }, { '2026-01-01': 2, '2026-01-03': 1 });
    expect(res.added).toBe(1);
    expect(res.replaced).toBe(0);
  });
});

describe('buildBackup', () => {
  it('adds exportedAt, keeps days', () => {
    const backup = buildBackup({ v: 1, days: { '2026-10-15': 2 } });
    expect(backup.v).toBe(1);
    expect(backup.days).toEqual({ '2026-10-15': 2 });
    expect(typeof backup.exportedAt).toBe('string');
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
  });
});

describe('renderDataCard', () => {
  it('export builds a Blob download named mmmdays-backup-YYYY-MM-DD.json', async () => {
    setDay('2026-10-15', 2);
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderDataCard(root, new Date(2026, 9, 25));
    const btn = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Экспорт JSON');
    btn?.click();
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(JSON.parse(await blob.text())).toMatchObject({ v: 1, days: { '2026-10-15': 2 } });
    expect(click.mock.calls.length).toBeGreaterThanOrEqual(1);
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe('mmmdays-backup-2026-10-25.json');
    vi.unstubAllGlobals();
    click.mockRestore();
  });

  it('import of a valid file: confirm shows counts, replaceDays applies merge', async () => {
    setDay('2026-10-15', 2);
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    renderDataCard(root, new Date(2026, 9, 25));
    const file = new File(['{"v":1,"days":{"2026-10-15":1,"2026-11-12":2}}'], 'backup.json', {
      type: 'application/json',
    });
    await callImport(root, file);
    expect(confirm).toHaveBeenCalledWith('Добавится 1 дней, заменится 1. Применить?');
    expect(JSON.parse(localStorage.getItem('mmmdays.v1')!).days).toEqual({
      '2026-10-15': 1,
      '2026-11-12': 2,
    });
    vi.unstubAllGlobals();
  });

  it('import of garbage: alert, data untouched, no confirm', async () => {
    setDay('2026-10-15', 2);
    const confirm = vi.fn(() => true);
    const alert = vi.fn();
    vi.stubGlobal('confirm', confirm);
    vi.stubGlobal('alert', alert);
    renderDataCard(root, new Date(2026, 9, 25));
    await callImport(root, new File(['garbage'], 'backup.json', { type: 'application/json' }));
    expect(confirm).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('mmmdays.v1')!).days).toEqual({ '2026-10-15': 2 });
    vi.unstubAllGlobals();
  });
});

/** Drive the hidden file input's change handler with a File. */
async function callImport(root: HTMLElement, file: File): Promise<void> {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  const dt = new DataTransfer();
  dt.items.add(file);
  input!.files = dt.files;
  input!.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
}

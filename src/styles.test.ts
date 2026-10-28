import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Pins the user-approved design: dark palette values and the smaller light-day circle. */
const css = readFileSync('src/styles.css', 'utf8');
const html = readFileSync('index.html', 'utf8');

describe('styles: approved design values', () => {
  it('dark theme overrides the palette under :root[data-theme="dark"]', () => {
    const dark = css.match(/:root\[data-theme='dark'\]\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(dark).toContain('--bg: #16171B');    expect(dark).toContain('--card: #212227');
    expect(dark).toContain('--accent: #E77482');
    expect(dark).toContain('--text: #B6B7B9');
    expect(dark).toContain('--border: #323439');
    expect(dark).toContain('--light: #693A42');
    expect(dark).toContain('--on-accent: #1B1416');
    expect(dark).toContain('color-scheme: dark');
  });

  it('root opts out of Chromium auto-dark with color-scheme: only light', () => {
    const root = css.match(/^:root\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(root).toContain('color-scheme: only light');
  });

  it('index.html carries the meta color-scheme opt-out (Chromium-documented channel)', () => {
    expect(html).toContain('<meta name="color-scheme" content="only light" />');
  });

  it('grey theme (промо-палитра) overrides the palette under :root[data-theme="grey"]', () => {
    const grey = css.match(/:root\[data-theme='grey'\]\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(grey).toContain('--bg: #756E75');
    expect(grey).toContain('--card: #827A82');
    expect(grey).toContain('--accent: #E89AA4');
    expect(grey).toContain('--text: #F5EFF2');
    expect(grey).toContain('--muted: #CDC3CD');
    expect(grey).toContain('--border: #908891');
    expect(grey).toContain('--light: #F4C6CC');
    expect(grey).toContain('--on-accent: #201519');
    expect(grey).toContain('--on-light: #693A42'); // винные цифры на бледном кружке
    expect(grey).toContain('color-scheme: only light'); // force-dark не трогает средний тон
  });

  it('accent text uses --on-accent so dark theme text stays readable', () => {
    expect(css).not.toMatch(/--accent[^;]*;[^}]*color:\s*#fff/);
    expect(css.match(/color:\s*#fff/g)).toBeNull();
    expect(css).toContain('color: var(--on-accent)');
  });

  it('light day renders a smaller circle behind the number, not a full-cell fill', () => {
    for (const selector of ['.cell.light', '.mday.light']) {
      const block = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
      expect(block).toContain('background: transparent');
      expect(block).toContain('position: relative');
      expect(block).toContain('color: var(--on-light)');
      const before = css.match(
        new RegExp(`${selector.replace('.', '\\.')}::before\\s*\\{([^}]*)\\}`),
      )?.[1] ?? '';
      expect(before).toContain('border-radius: 50%');
      expect(before).toContain('background: var(--light)');
      expect(before).toMatch(/inset:\s*\d+%/); // smaller diameter than the heavy circle
    }
  });

  it('view content keeps 16px of breathing room above the tab bar', () => {
    const main = css.match(/^main\s*\{([^}]*)\}/m)?.[1] ?? '';
    expect(main).toContain('padding-bottom: 16px');
  });

  it('header logo: accent circle with a light inner dot, promo-style', () => {
    const block = css.match(/\.logo-mark\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(block).toContain('background: var(--accent)');
    expect(block).toContain('border-radius: 50%');
    const after = css.match(/\.logo-mark::after\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(after).toContain('background: var(--light)');
  });
});

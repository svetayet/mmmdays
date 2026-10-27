import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ru = readFileSync('promo/index.html', 'utf8');
const en = readFileSync('promo/en.html', 'utf8');
const css = readFileSync('promo/styles.css', 'utf8');

describe('promo site', () => {
  it('RU page: russian lang, hero, CTA to the app, link to EN', () => {
    expect(ru).toContain('<html lang="ru">');
    expect(ru).toContain('Трекер цикла');
    expect(ru).toContain('Установить бесплатно');
    expect(ru).toContain('Ваши дни остаются вашими');
    expect(ru).toContain('даже мы не&nbsp;знаем');
    expect(ru).toContain('href="app/"');
    expect(ru).toContain('href="en.html"');
    expect(ru).toContain('href="styles.css"');
  });

  it('EN page: english lang, same sections, link back to RU', () => {
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('period tracker');
    expect(en).toContain('Install for free');
    expect(en).toContain('Your days stay yours');
    expect(en).toContain('even we don&rsquo;t know');
    expect(en).toContain('href="app/"');
    expect(en).toContain('href="index.html"');
    expect(en).toContain('href="styles.css"');
  });

  it('both pages carry the three «Ммм» cards, install steps and footer', () => {
    for (const page of [ru, en]) {
      expect((page.match(/class="why"/g) ?? []).length).toBe(3);
      expect((page.match(/class="step"/g) ?? []).length).toBe(3);
      expect(page).toContain('2026');
      expect(page).toContain('class="phone"');
    }
  });

  it('styles pin the approved grey-rose palette', () => {
    expect(css).toContain('--bg: #756E75');
    expect(css).toContain('--card: #827A82');
    expect(css).toContain('--accent: #E89AA4');
    expect(css).toContain('--wine: #693A42');
    expect(css).toContain('--light: #F4C6CC');
    expect(css).toContain('color-scheme: only light'); // Chrome не затемняет промо принудительно
  });
});

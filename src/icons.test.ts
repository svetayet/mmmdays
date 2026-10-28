import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Пин бренда: «календарик из точечек» в промо-палитре, квадратные размеры по IHDR. */
const icons: [file: string, size: number][] = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
];

function pngSize(path: string): { w: number; h: number } {
  const bytes = readFileSync(path);
  // 8 байт сигнатуры PNG, затем IHDR: длина(4) + тип(4) + width(4) + height(4)
  return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
}

describe('app icons: dot-calendar brand', () => {
  for (const [file, size] of icons) {
    it(`${file} exists and is a ${size}×${size} square`, () => {
      const path = `public/icons/${file}`;
      expect(existsSync(path)).toBe(true);
      expect(pngSize(path)).toEqual({ w: size, h: size });
    });
  }
});

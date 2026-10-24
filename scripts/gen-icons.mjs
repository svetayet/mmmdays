// Dependency-free PNG icon generator for MmmDays.
// Draws flat circles (#E89AA4) with a 1px antialiased edge and writes
// RGBA PNGs via zlib deflate + a hand-rolled CRC32. Self-checks the
// PNG signature of every file it writes and exits non-zero on failure.

import { deflateSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const ACCENT = [0xe8, 0x9a, 0xa4];
const BG = [0xf5, 0xf6, 0xf7];

// --- minimal PNG encoder ---------------------------------------------------

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let crc = -1;
  for (const byte of buf) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- drawing ---------------------------------------------------------------

/** Circle of `diameterRatio * size` centered in the tile, over `bg` (null = transparent). */
function drawIcon(size, diameterRatio, bg) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const radius = (size * diameterRatio) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cx);
      const coverage = Math.max(0, Math.min(1, radius + 0.5 - dist)); // 1px antialiased edge
      const i = (y * size + x) * 4;
      const [r, g, b] = ACCENT;
      rgba[i] = bg ? Math.round(r * coverage + bg[0] * (1 - coverage)) : r;
      rgba[i + 1] = bg ? Math.round(g * coverage + bg[1] * (1 - coverage)) : g;
      rgba[i + 2] = bg ? Math.round(b * coverage + bg[2] * (1 - coverage)) : b;
      rgba[i + 3] = bg ? 255 : Math.round(coverage * 255);
    }
  }
  return encodePng(size, size, rgba);
}

const ICONS = [
  ['icon-192.png', drawIcon(192, 0.84, null)],
  ['icon-512.png', drawIcon(512, 0.84, null)],
  ['maskable-512.png', drawIcon(512, 0.8, BG)],
  ['apple-touch-icon.png', drawIcon(180, 0.84, BG)],
  ['favicon-32.png', drawIcon(32, 0.84, null)],
];

mkdirSync(OUT_DIR, { recursive: true });
let failed = false;
for (const [name, png] of ICONS) {
  const path = join(OUT_DIR, name);
  writeFileSync(path, png);
  const sig = readFileSync(path).subarray(0, 4);
  if (!(sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47)) {
    console.error(`${name}: bad PNG signature ${sig.toString('hex')}`);
    failed = true;
  } else {
    console.log(`${name}: ${png.length} bytes, PNG ok`);
  }
}
process.exit(failed ? 1 : 0);

/**
 * Generates the PWA PNG icons (public/pwa-192.png, public/pwa-512.png) with no
 * external dependencies, so a fresh clone can `npm run icons` and get valid
 * maskable icons. A navy rounded square with a white circle mark.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const NAVY = [15, 23, 42]; // #0f172a
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const radius = size * 0.16; // corner rounding
  const circleR = size * 0.34;
  const cx = size / 2;
  const cy = size / 2;

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const i = y * stride + 1 + x * 4;
      const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= circleR ** 2;
      const [r, g, b] = inCircle ? WHITE : NAVY;
      // Rounded-corner transparency.
      const visible = insideRoundedSquare(x, y, size, radius);
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = visible ? 255 : 0;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

function insideRoundedSquare(x, y, size, r) {
  const minX = r;
  const maxX = size - r;
  const minY = r;
  const maxY = size - r;
  const dx = x < minX ? minX - x : x > maxX ? x - maxX : 0;
  const dy = y < minY ? minY - y : y > maxY ? y - maxY : 0;
  return dx * dx + dy * dy <= r * r;
}

mkdirSync(PUBLIC_DIR, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(PUBLIC_DIR, `pwa-${size}.png`), makePng(size));
  console.log(`wrote public/pwa-${size}.png`);
}

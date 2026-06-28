/**
 * Generates the PWA PNG icons (including the iOS home-screen touch icon) with
 * no external dependencies, so a fresh clone can `npm run icons` and get valid
 * install icons. A soccer ball (white with dark pentagons) on a green pitch.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const WHITE = [255, 255, 255];
const DARK = [15, 23, 42]; // #0f172a — ball spots + rim
const GREEN = [22, 163, 74]; // #16a34a — pitch background
const GREEN_DARK = [13, 110, 50]; // edge shading

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

/**
 * Draws a soccer ball (white with dark pentagons) on a green pitch background.
 * Full-bleed and opaque, so it works for Android maskable icons and the iOS
 * home-screen touch icon alike (each platform applies its own rounded mask).
 */
function makePng(size) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36; // ball radius
  const rim = size * 0.012; // crisp dark rim around the ball

  // A central pentagon plus five around it = the classic Telstar look.
  const spots = [polygon(cx, cy, R * 0.34, -90)];
  for (let k = 0; k < 5; k++) {
    const a = ((-90 + k * 72) * Math.PI) / 180;
    spots.push(
      polygon(cx + R * 0.66 * Math.cos(a), cy + R * 0.66 * Math.sin(a), R * 0.24, -90 + k * 72 + 180),
    );
  }

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const i = y * stride + 1 + x * 4;
      const dr = Math.hypot(x - cx, y - cy);

      let color;
      if (dr <= R) {
        if (dr >= R - rim) color = DARK;
        else if (spots.some((p) => inPolygon(x, y, p))) color = DARK;
        else color = WHITE;
      } else {
        const t = Math.min(1, Math.max(0, (dr - R) / (size * 0.45)));
        color = mix(GREEN, GREEN_DARK, t);
      }
      raw[i] = color[0];
      raw[i + 1] = color[1];
      raw[i + 2] = color[2];
      raw[i + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Vertices of a regular polygon (default pentagon), angles in degrees. */
function polygon(cx, cy, R, rotDeg, n = 5) {
  const verts = [];
  for (let k = 0; k < n; k++) {
    const a = ((rotDeg + (k * 360) / n) * Math.PI) / 180;
    verts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  return verts;
}

/** Convex point-in-polygon via consistent cross-product sign. */
function inPolygon(px, py, verts) {
  let sign = 0;
  for (let k = 0; k < verts.length; k++) {
    const [x1, y1] = verts[k];
    const [x2, y2] = verts[(k + 1) % verts.length];
    const cross = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
    if (cross !== 0) {
      const s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

mkdirSync(PUBLIC_DIR, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(PUBLIC_DIR, `pwa-${size}.png`), makePng(size));
  console.log(`wrote public/pwa-${size}.png`);
}
writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), makePng(180));
console.log('wrote public/apple-touch-icon.png');

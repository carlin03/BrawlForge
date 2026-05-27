/**
 * Generate PNG placeholders for every team missing a valid logo file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_TEAM_SLUGS, TEAM_TAGS } from "./catalog-logos.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "logos", "teams");
const SIZE = 256;

function isValidPng(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return buf.length > 800 && buf[0] === 0x89 && buf[1] === 0x50;
  } catch {
    return false;
  }
}

function slugColor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 55% 38%)`;
}

async function writePlaceholder(slug, tag) {
  const dest = path.join(OUT, `${slug}.png`);
  const label = (tag || slug.slice(0, 3)).toUpperCase().slice(0, 4);
  const bg = slugColor(slug);

  try {
    const sharp = (await import("sharp")).default;
    const svg = `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="18" fill="${bg}"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial,sans-serif" font-weight="800" font-size="36" fill="#ffffff">${label}</text>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(dest);
    return true;
  } catch {
    /* fallback below */
  }

  // Minimal PNG without sharp
  const zlib = await import("node:zlib");
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return ~c >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  const [r, g, b] = [40, 80, 140];
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    const row = y * (SIZE * 4 + 1) + 1;
    raw[row - 1] = 0;
    for (let x = 0; x < SIZE; x++) {
      const i = row + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(dest, png);
  return true;
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const slug of ALL_TEAM_SLUGS) {
  const dest = path.join(OUT, `${slug}.png`);
  if (isValidPng(dest)) continue;
  await writePlaceholder(slug, TEAM_TAGS[slug]);
  console.log(`  placeholder → ${slug}`);
  n++;
}
console.log(`\nGenerated ${n} placeholder PNGs (${ALL_TEAM_SLUGS.length} total teams).`);

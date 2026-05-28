/**
 * Logo BSC visible en /public/images/bsc-2026.png
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "public", "images", "bsc-2026.png");
const BSC = "https://taiyoro-prod-media.s3.amazonaws.com/game/mWB0X8mVG2.png";
const sharp = (await import("sharp")).default;

async function stripWhite(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i] >= 235 && data[i + 1] >= 235 && data[i + 2] >= 235) data[i + 3] = 0;
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

const res = await fetch(BSC, { headers: { "User-Agent": "BrawlForge/1.0" } });
const raw = Buffer.from(await res.arrayBuffer());
const png = await sharp(await stripWhite(raw)).resize(256, 256, { fit: "inside" }).png().toBuffer();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, png);
console.log(`✓ ${OUT} (${png.length}b)`);

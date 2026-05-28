/**
 * Logos torneos BSC — PNG transparente desde TAIYORO.
 * npm run logos:tournaments
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripWhite } from "./logo-process.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TOUR_DIR = path.join(root, "public", "logos", "tournaments");
const MANIFEST = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
const BSC_LOGO = "https://taiyoro-prod-media.s3.amazonaws.com/game/mWB0X8mVG2.png";

const bscTs = fs.readFileSync(path.join(root, "src", "lib", "data", "bsc-tournaments.ts"), "utf8");
const bscFromCurated = [...bscTs.matchAll(/slug:\s*["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((s) => s.startsWith("bsc-2026") || s === "world-finals-2026");

const sharp = (await import("sharp")).default;

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(TOUR_DIR, { recursive: true });
  const slugs = [...new Set(bscFromCurated)];

  console.log(`Descargando logo BSC transparente para ${slugs.length} torneos…\n`);
  const raw = await fetchBuf(BSC_LOGO);
  const stripped = await stripWhite(raw);
  const bscBuf = await sharp(stripped).resize(128, 128, { fit: "inside" }).png().toBuffer();

  for (const slug of slugs) {
    const dest = path.join(TOUR_DIR, `${slug}.png`);
    const existing = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
    if (existing && existing.length > 9000) continue;
    fs.writeFileSync(dest, bscBuf);
  }

  let manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  manifest.tournamentLocal = slugs.sort();
  manifest.logoCacheVersion = Date.now();
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`✓ ${slugs.length} torneos · ${bscBuf.length}b PNG sin fondo blanco`);
}

main().catch(console.error);

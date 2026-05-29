/**
 * Logos torneos BSC — PNG transparente (logo oficial BSC) por slug.
 * npm run logos:tournaments
 * npm run logos:tournaments -- --force
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripWhite } from "./logo-process.mjs";
import { collectBscTournamentLogoSlugs } from "./lib/bsc-tournament-slugs.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TOUR_DIR = path.join(root, "public", "logos", "tournaments");
const MANIFEST = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
const BSC_LOGO = "https://taiyoro-prod-media.s3.amazonaws.com/game/mWB0X8mVG2.png";
const MIN_BYTES = 2500;
const FORCE = process.argv.includes("--force");

const sharp = (await import("sharp")).default;

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.mkdirSync(TOUR_DIR, { recursive: true });
  const slugs = collectBscTournamentLogoSlugs();

  console.log(`Generando ${slugs.length} logos PNG de torneos BSC…\n`);
  const raw = await fetchBuf(BSC_LOGO);
  const stripped = await stripWhite(raw);
  const bscBuf = await sharp(stripped).resize(128, 128, { fit: "inside" }).png().toBuffer();

  const slugSet = new Set(slugs);
  let purged = 0;
  for (const f of fs.readdirSync(TOUR_DIR)) {
    if (!f.endsWith(".png")) continue;
    const s = f.replace(/\.png$/, "");
    if (!slugSet.has(s)) {
      fs.unlinkSync(path.join(TOUR_DIR, f));
      purged++;
    }
  }

  let written = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const dest = path.join(TOUR_DIR, `${slug}.png`);
    const existing = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
    if (!FORCE && existing && existing.length >= MIN_BYTES) {
      skipped++;
      continue;
    }
    fs.writeFileSync(dest, bscBuf);
    written++;
  }

  const onDisk = fs
    .readdirSync(TOUR_DIR)
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.replace(/\.png$/, ""))
    .filter((s) => slugs.includes(s));

  let manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  manifest.tournamentLocal = onDisk.sort();
  manifest.logoCacheVersion = Date.now();
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  console.log(`✓ ${onDisk.length} torneos en manifest`);
  console.log(`  escritos: ${written} · omitidos: ${skipped} · eliminados: ${purged} · ${bscBuf.length}b PNG`);
  console.log(`  carpeta: public/logos/tournaments/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

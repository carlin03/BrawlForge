/**
 * TAIYORO/RoyaleAPI → PNG transparente. Strip solo BORDES (no interior).
 * npm run logos:taiyoro
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TEAMS_DIR = path.join(root, "public", "logos", "teams");
const MANIFEST = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");

const sharp = (await import("sharp")).default;
const { TAIYORO_LOGOS, ROYALEAPI_LOGOS, ORG_OFFICIAL_LOGOS } = await import("./team-logo-urls.mjs");
const { applyLogoTreatment } = await import("./logo-process.mjs");

function sourcesForSlug(slug) {
  const out = [];
  if (TAIYORO_LOGOS[slug]) out.push(TAIYORO_LOGOS[slug]);
  if (ORG_OFFICIAL_LOGOS[slug]) out.push(ORG_OFFICIAL_LOGOS[slug]);
  if (ROYALEAPI_LOGOS[slug]) out.push(ROYALEAPI_LOGOS[slug]);
  return [...new Set(out)];
}

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function toOptimizedPng(buf, slug) {
  return applyLogoTreatment(buf, slug);
}

async function main() {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
  const slugs = [...new Set([...Object.keys(TAIYORO_LOGOS), ...Object.keys(ROYALEAPI_LOGOS)])];
  const taiyoroLocal = [];

  console.log(`TAIYORO/RoyaleAPI — ${slugs.length} equipos (strip solo bordes)\n`);

  for (const slug of slugs) {
    const urls = sourcesForSlug(slug);
    if (!urls.length) continue;
    process.stdout.write(`  ${slug}... `);
    let ok = false;
    for (const url of urls) {
      try {
        const raw = await fetchBuf(url);
        const png = await toOptimizedPng(raw, slug);
        if (png.length < 1500) continue;
        fs.writeFileSync(path.join(TEAMS_DIR, `${slug}.png`), png);
        taiyoroLocal.push(slug);
        console.log(`ok (${png.length}b)`);
        ok = true;
        break;
      } catch {
        /* next */
      }
    }
    if (!ok) console.log("FAIL");
    await new Promise((r) => setTimeout(r, 180));
  }

  let manifest = { generatedAt: new Date().toISOString(), blockedHashes: [], teamLocal: [], tournamentLocal: [], taiyoroLocal: [] };
  if (fs.existsSync(MANIFEST)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    } catch {
      /* fresh */
    }
  }
  manifest.processedTeamLogos = [...new Set(taiyoroLocal)].sort();
  manifest.taiyoroLocal = manifest.processedTeamLogos;
  manifest.logoCacheVersion = Date.now();
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ ${manifest.taiyoroLocal.length} logos TAIYORO`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Todos los equipos 2026 con logoFile — tratamiento por equipo.
 * npm run logos:2026
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLiquipediaApiUrl } from "./catalog-logos.mjs";
import { liquipediaCommonsUrl } from "./liquipedia-commons.mjs";
import { applyLogoTreatment } from "./logo-process.mjs";
import { TAIYORO_LOGOS, ROYALEAPI_LOGOS } from "./team-logo-urls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TEAMS_DIR = path.join(root, "public", "logos", "teams");
const MANIFEST = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
const teams2026 = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "data", "generated", "teams-2026.json"), "utf8"),
);

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

async function downloadForSlug(slug, team) {
  const urls = [];
  if (TAIYORO_LOGOS[slug]) urls.push(TAIYORO_LOGOS[slug]);
  if (ROYALEAPI_LOGOS[slug]) urls.push(ROYALEAPI_LOGOS[slug]);
  if (team.logoFile) {
    try {
      const api = await resolveLiquipediaApiUrl(team.logoFile);
      if (api) urls.push(api);
    } catch {
      /* */
    }
    const commons = liquipediaCommonsUrl(team.logoFile);
    if (commons) urls.push(commons);
  }

  for (const url of urls) {
    try {
      if (url.includes("liquipedia")) await new Promise((r) => setTimeout(r, 2200));
      else await new Promise((r) => setTimeout(r, 150));
      const raw = await fetchBuf(url);
      if (raw.length < 800) continue;
      return raw;
    } catch {
      /* */
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
  const withFile = teams2026.filter((t) => t.logoFile);
  const processed = new Set();

  console.log(`Equipos 2026: ${withFile.length}\n`);

  for (const team of withFile) {
    const { slug } = team;
    process.stdout.write(`  ${slug}... `);
    const raw = await downloadForSlug(slug, team);
    if (!raw) {
      console.log("skip");
      continue;
    }
    try {
      const png = await applyLogoTreatment(raw, slug);
      if (png.length < 1200) {
        console.log("small");
        continue;
      }
      fs.writeFileSync(path.join(TEAMS_DIR, `${slug}.png`), png);
      processed.add(slug);
      console.log(`ok (${png.length}b)`);
    } catch {
      console.log("err");
    }
  }

  let manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  const merged = [...new Set([...(manifest.processedTeamLogos ?? manifest.taiyoroLocal ?? []), ...processed])].sort();
  manifest.processedTeamLogos = merged;
  manifest.taiyoroLocal = merged;
  manifest.logoCacheVersion = Date.now();
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ ${processed.size} nuevos · ${merged.length} total en manifest`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Reprocesa logos con tratamiento por equipo (misma imagen en toda la web).
 * npm run logos:brand
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyLogoTreatment } from "./logo-process.mjs";
import { TEAM_LOGO_TREATMENT, getLogoTreatment } from "./logo-branding.mjs";
import { TAIYORO_LOGOS, ROYALEAPI_LOGOS, ORG_OFFICIAL_LOGOS } from "./team-logo-urls.mjs";
import { liquipediaCommonsUrl } from "./liquipedia-commons.mjs";
import { resolveLiquipediaApiUrl } from "./catalog-logos.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const TEAMS_DIR = path.join(root, "public", "logos", "teams");
const MANIFEST = path.join(root, "src", "lib", "data", "generated", "logo-manifest.json");
const teams2026 = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "data", "generated", "teams-2026.json"), "utf8"),
);

const ALIAS_WRITE = {
  "bc-gaming-sa": "bc-gaming",
  "tribe-gaming-eu": "tribe-gaming",
  "zeta-division-one": "zeta-division",
  "zeta-division-zero": "zeta-division",
  "only-realm-na": "only-realm",
};

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BrawlForge/1.0" } });
  if (!res.ok) throw new Error(String(res.status));
  return Buffer.from(await res.arrayBuffer());
}

function sourcesForSlug(slug, team) {
  const out = [];
  if (TAIYORO_LOGOS[slug]) out.push(TAIYORO_LOGOS[slug]);
  if (ORG_OFFICIAL_LOGOS[slug]) out.push(ORG_OFFICIAL_LOGOS[slug]);
  if (ROYALEAPI_LOGOS[slug]) out.push(ROYALEAPI_LOGOS[slug]);
  if (team?.logoFile) {
    const commons = liquipediaCommonsUrl(team.logoFile);
    if (commons) out.push(commons);
  }
  return [...new Set(out)];
}

async function downloadBest(slug, team) {
  const urls = sourcesForSlug(slug, team);
  for (const url of urls) {
    try {
      if (url.includes("liquipedia")) await new Promise((r) => setTimeout(r, 2200));
      else await new Promise((r) => setTimeout(r, 120));
      const raw = await fetchBuf(url);
      if (raw.length < 800) continue;
      return raw;
    } catch {
      /* next */
    }
  }
  if (team?.logoFile) {
    try {
      const api = await resolveLiquipediaApiUrl(team.logoFile);
      if (api) return await fetchBuf(api);
    } catch {
      /* */
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });

  const priority = new Set([
    ...Object.keys(TEAM_LOGO_TREATMENT),
    ...Object.keys(TAIYORO_LOGOS),
    ...Object.keys(ROYALEAPI_LOGOS),
    ...teams2026.filter((t) => t.logoFile).map((t) => t.slug),
  ]);

  const teamBySlug = new Map(teams2026.map((t) => [t.slug, t]));

  const processed = [];
  const slugs = [...priority].sort();

  console.log(`Reprocesando ${slugs.length} equipos (tratamiento por slug)\n`);

  for (const slug of slugs) {
    const team = teamBySlug.get(slug) ?? { slug };
    const treatment = getLogoTreatment(slug);
    process.stdout.write(`  ${slug} [${treatment}]... `);

    const existing = path.join(TEAMS_DIR, `${slug}.png`);
    let raw = await downloadBest(slug, team);
    if (!raw && fs.existsSync(existing)) {
      raw = fs.readFileSync(existing);
    }
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
      fs.writeFileSync(existing, png);
      processed.push(slug);

      const aliasSource = ALIAS_WRITE[slug];
      if (aliasSource && aliasSource !== slug) {
        fs.writeFileSync(path.join(TEAMS_DIR, `${aliasSource}.png`), png);
        if (!processed.includes(aliasSource)) processed.push(aliasSource);
      }
      for (const [alias, canonical] of Object.entries(ALIAS_WRITE)) {
        if (canonical === slug && alias !== slug) {
          fs.writeFileSync(path.join(TEAMS_DIR, `${alias}.png`), png);
          if (!processed.includes(alias)) processed.push(alias);
        }
      }

      console.log(`ok (${png.length}b)`);
    } catch (e) {
      console.log(`err ${e.message}`);
    }
  }

  let manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  manifest.processedTeamLogos = [...new Set(processed)].sort();
  manifest.taiyoroLocal = manifest.processedTeamLogos;
  manifest.logoCacheVersion = Date.now();
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ ${processed.length} logos procesados (misma fuente en toda la app)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

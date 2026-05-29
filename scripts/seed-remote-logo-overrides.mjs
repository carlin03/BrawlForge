/**
 * Genera logo-overrides.json con URLs CDN (Taiyoro, RoyaleAPI, Wikimedia)
 * para que Vercel muestre logos sin public/logos/.
 *
 * npm run logos:overrides:remote
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TAIYORO_LOGOS,
  ORG_OFFICIAL_LOGOS,
  ROYALEAPI_LOGOS,
  WIKIMEDIA_LOGOS,
  logoSourcesForSlug,
} from "./team-logo-urls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "src", "lib", "data", "generated", "logo-overrides.json");

const teams2026 = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "data", "generated", "teams-2026.json"), "utf8"),
);

const rosterSrc = fs.readFileSync(path.join(root, "src", "lib", "data", "bsc-2026-rosters.ts"), "utf8");
const bscActive = [...rosterSrc.matchAll(/^\s+"?([a-z0-9-]+)"?:\s*\[/gm)].map((m) => m[1]);
const bySlug = Object.fromEntries(teams2026.map((t) => [t.slug, t]));

function wikimediaFromLogoFile(filename) {
  const f = String(filename).trim().replace(/ /g, "_");
  if (!f) return "";
  return `https://upload.wikimedia.org/wikipedia/commons/${f[0].toLowerCase()}/${f.slice(0, 2).toLowerCase()}/${f}`;
}

/** Misma prioridad que buildUiRemoteLogoChain (sin Liquipedia hotlink). */
function bestUiUrl(slug, team) {
  const chain = [];
  if (TAIYORO_LOGOS[slug]) chain.push(TAIYORO_LOGOS[slug]);
  if (ORG_OFFICIAL_LOGOS[slug]) chain.push(ORG_OFFICIAL_LOGOS[slug]);
  if (ROYALEAPI_LOGOS[slug]) chain.push(ROYALEAPI_LOGOS[slug]);
  chain.push(`https://cdn.royaleapi.com/static/img/team/logo/${slug}.png`);
  if (WIKIMEDIA_LOGOS[slug]) chain.push(WIKIMEDIA_LOGOS[slug]);
  if (team?.logoFile) {
    const wiki = wikimediaFromLogoFile(team.logoFile);
    if (wiki) chain.push(wiki);
  }
  const legacy = logoSourcesForSlug(slug).filter((u) => !u.includes("liquipedia.net"));
  for (const u of legacy) {
    if (!chain.includes(u)) chain.push(u);
  }
  return [...new Set(chain)][0];
}

const targetSlugs = [...new Set(bscActive.filter((s) => bySlug[s]))];
const teams = {};
let ok = 0;
let miss = 0;

for (const slug of targetSlugs.sort()) {
  const url = bestUiUrl(slug, bySlug[slug]);
  if (!url) {
    miss++;
    continue;
  }
  teams[slug] = { url, treatment: "strip-white" };
  ok++;
}

const out = {
  teams,
  tournaments: {},
  generatedAt: new Date().toISOString(),
  note: "CDN remoto para Vercel — regenerar con npm run logos:overrides:remote",
};

fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`logo-overrides.json: ${ok} equipos con URL, ${miss} sin fuente (${targetSlugs.length} revisados)`);

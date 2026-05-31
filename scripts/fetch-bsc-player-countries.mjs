/**
 * Descarga país/nacionalidad de jugadores BSC desde Liquipedia (Infobox player).
 *   node scripts/fetch-bsc-player-countries.mjs
 *   node scripts/fetch-bsc-player-countries.mjs --write
 *   node scripts/fetch-bsc-player-countries.mjs --regions EMEA,EA --write
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchWikitextBatch, parseInfoboxFields, sleep } from "./liquipedia-api.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src", "lib", "data", "generated");
const WRITE = process.argv.includes("--write");
const BATCH = 40;
const DELAY_MS = 900;

const regionArg = process.argv.find((a) => a.startsWith("--regions="));
const TARGET_REGIONS = regionArg
  ? new Set(regionArg.split("=")[1].split(",").map((r) => r.trim().toUpperCase()))
  : new Set(["EMEA", "EA"]);

function loadTeamRegions() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-team-regions.ts"), "utf8");
  const map = {};
  for (const m of text.matchAll(/"([a-z0-9-]+)"\s*:\s*"(EMEA|EA|NA|SA|GLOBAL|CN)"/g)) {
    map[m[1]] = m[2];
  }
  return map;
}

function loadRosters() {
  const text = fs.readFileSync(path.join(root, "src/lib/data/bsc-2026-rosters.ts"), "utf8");
  const m = text.match(/BSC_2026_ROSTERS[^=]*=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error("BSC_2026_ROSTERS not found");
  const rosters = {};
  for (const line of m[1].split("\n")) {
    const tm = line.match(/^\s*"?([a-z0-9-]+)"?\s*:\s*\[([^\]]*)\]/);
    if (!tm) continue;
    rosters[tm[1]] = [...tm[2].matchAll(/"([a-z0-9-]+)"/g)].map((x) => x[1]);
  }
  return rosters;
}

function loadPlayers2026() {
  const p = path.join(outDir, "players-2026.json");
  return new Map(JSON.parse(fs.readFileSync(p, "utf8")).map((pl) => [pl.slug, pl]));
}

function liquipediaTitle(slug, base) {
  if (base?.liquipediaPage) return base.liquipediaPage.replace(/ /g, "_");
  const ign = base?.ign?.trim();
  if (ign && ign.length <= 24) return ign.replace(/ /g, "_");
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("_");
}

function cleanCountry(raw) {
  return String(raw || "")
    .replace(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")[0]
    .trim();
}

const teamRegions = loadTeamRegions();
const rosters = loadRosters();
const playerBySlug = loadPlayers2026();

const targets = [];
for (const [teamSlug, roster] of Object.entries(rosters)) {
  const region = teamRegions[teamSlug];
  if (!TARGET_REGIONS.has(region)) continue;
  for (const pl of roster) {
    targets.push({ slug: pl, teamSlug, region, title: liquipediaTitle(pl, playerBySlug.get(pl)) });
  }
}

const uniqueTitles = [...new Set(targets.map((t) => t.title))];
const byTitle = new Map();
for (let i = 0; i < uniqueTitles.length; i += BATCH) {
  const batch = uniqueTitles.slice(i, i + BATCH);
  const wikitext = await fetchWikitextBatch(batch);
  for (const title of batch) {
    const text = wikitext[title] ?? wikitext[title.replace(/_/g, " ")] ?? "";
    if (!text || !/\{\{Infobox player/i.test(text)) {
      byTitle.set(title, null);
      continue;
    }
    const f = parseInfoboxFields(text);
    const country = cleanCountry(f.country || f.nationality || f.location || "");
    byTitle.set(title, country || null);
  }
  console.log(`Liquipedia batch ${Math.min(i + BATCH, uniqueTitles.length)}/${uniqueTitles.length}`);
  if (i + BATCH < uniqueTitles.length) await sleep(DELAY_MS);
}

const countries = {};
let found = 0;
let missing = 0;
for (const t of targets) {
  const country = byTitle.get(t.title);
  if (country) {
    countries[t.slug] = { country, region: t.region, team_slug: t.teamSlug, source: "liquipedia" };
    found++;
  } else {
    missing++;
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  regions: [...TARGET_REGIONS],
  counts: { players: targets.length, withCountry: found, missing },
  countries,
};

console.log(`Países: ${found}/${targets.length} (${missing} sin dato en Liquipedia)`);
if (WRITE) {
  const outPath = path.join(outDir, "bsc-player-countries.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
}

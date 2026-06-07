/**
 * Añade a teams-discovered.json todos los slugs que aparecen en partidos tier B+ 2026.
 * Usa nombres del catálogo Liquipedia (teams.json / teams-2026.json) cuando existan.
 *
 *   node scripts/sync-match-teams-to-discovered.mjs
 *   node scripts/sync-match-teams-to-discovered.mjs --write
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
const WRITE = process.argv.includes("--write");

const INVALID = new Set(["", "tbd", "team", "por-definir"]);
const HIDDEN = new Set([".", "punto"]);

function slugToName(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function tagFromSlug(slug) {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length >= 2) return parts.map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  return slug.slice(0, 3).toUpperCase();
}

function okTeam(slug) {
  const k = (slug || "").trim().toLowerCase();
  if (!k || INVALID.has(k) || HIDDEN.has(k)) return false;
  if (k.startsWith("winner-")) return false;
  return true;
}

function loadCatalogTeams() {
  const bySlug = new Map();
  for (const file of ["teams.json", "teams-2026.json"]) {
    const p = resolve(gen, file);
    if (!existsSync(p)) continue;
    for (const t of JSON.parse(readFileSync(p, "utf8"))) {
      bySlug.set(t.slug, t);
    }
  }
  return bySlug;
}

const catalog = loadCatalogTeams();
const matches = JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8"));
const discoveredPath = resolve(gen, "teams-discovered.json");
const existing = existsSync(discoveredPath)
  ? JSON.parse(readFileSync(discoveredPath, "utf8"))
  : [];

const bySlug = new Map(existing.map((t) => [t.slug, t]));
const regionVotes = new Map();

for (const m of matches) {
  for (const slug of [m.teamASlug, m.teamBSlug]) {
    if (!okTeam(slug)) continue;
    const key = slug.trim().toLowerCase();
    if (!regionVotes.has(key)) regionVotes.set(key, new Map());
    const reg = m.region || "GLOBAL";
    const votes = regionVotes.get(key);
    votes.set(reg, (votes.get(reg) ?? 0) + 1);

    if (bySlug.has(key)) continue;

    const cat = catalog.get(key);
    bySlug.set(key, {
      slug: key,
      name: cat?.name || slugToName(key),
      tag: cat?.tag || tagFromSlug(key),
      region: cat?.region || m.region || "GLOBAL",
      source: cat ? "liquipedia-catalog-match" : "liquipedia-match-2026",
    });
  }
}

// Refinar región por mayoría de partidos
for (const [slug, team] of bySlug) {
  const votes = regionVotes.get(slug);
  if (!votes || team.region !== "GLOBAL") continue;
  const top = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) team.region = top[0];
}

const merged = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
const added = merged.length - existing.length;

console.log(`teams-discovered: ${existing.length} → ${merged.length} (+${added})`);

const addedSlugs = merged.filter((t) => !existing.some((e) => e.slug === t.slug)).map((t) => t.slug);
if (addedSlugs.length) {
  console.log("Nuevos slugs:", addedSlugs.join(", "));
}

if (!WRITE) {
  console.log("\nDry-run. Usa --write para guardar teams-discovered.json");
  process.exit(0);
}

writeFileSync(discoveredPath, JSON.stringify(merged, null, 2));
console.log(`Guardado ${discoveredPath}`);

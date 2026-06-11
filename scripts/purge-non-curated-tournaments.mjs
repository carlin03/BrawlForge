/**
 * Reduce torneos descubiertos y partidos a solo circuito BSC 2026 curado.
 *
 *   node scripts/purge-non-curated-tournaments.mjs
 *   node scripts/purge-non-curated-tournaments.mjs --write
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { isCuratedPublicTournamentSlug } from "./lib/curated-tournament-slugs.mjs";
import { shouldPublishMatch } from "./lib/match-publish-filter.mjs";
import { loadEnv } from "./lib/load-env.mjs";
import { getSupabaseRest } from "./lib/supabase-rest.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
const WRITE = process.argv.includes("--write");

loadEnv();

async function deleteTournamentsNotIn(keepSlugs) {
  const keep = new Set(keepSlugs);
  const { url, headers } = getSupabaseRest();
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/tournaments_catalog?select=slug&order=slug&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list tournaments: ${res.status}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  const toDelete = rows.map((r) => r.slug).filter((slug) => !keep.has(slug));
  if (!toDelete.length) return 0;
  let n = 0;
  for (let i = 0; i < toDelete.length; i += 40) {
    const batch = toDelete.slice(i, i + 40);
    const inList = batch.map((s) => encodeURIComponent(s)).join(",");
    const del = await fetch(`${url}/rest/v1/tournaments_catalog?slug=in.(${inList})`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) throw new Error(`delete tournaments: ${del.status} ${await del.text()}`);
    n += batch.length;
  }
  return n;
}

const matchesPath = resolve(gen, "matches-2026.json");
const discoveredPath = resolve(gen, "tournaments-discovered.json");
const matches = JSON.parse(readFileSync(matchesPath, "utf8"));
const discovered = JSON.parse(readFileSync(discoveredPath, "utf8"));

const keptMatches = matches.filter((m) => isCuratedPublicTournamentSlug(m.tournamentSlug));
const keptDiscovered = discovered.filter((t) => isCuratedPublicTournamentSlug(t.slug));

const tourSlugs = new Set(keptMatches.map((m) => m.tournamentSlug));
for (const t of keptDiscovered) tourSlugs.add(t.slug);

console.log(`Partidos:           ${matches.length} → ${keptMatches.length}`);
console.log(`tournaments-discovered: ${discovered.length} → ${keptDiscovered.length}`);
console.log(`Slugs únicos curados: ${tourSlugs.size}`);

if (!WRITE) {
  console.log("\nDry-run. Usa --write para guardar y purgar Supabase.");
  process.exit(0);
}

writeFileSync(matchesPath, JSON.stringify(keptMatches, null, 2));
writeFileSync(discoveredPath, JSON.stringify(keptDiscovered, null, 2));
console.log("\nGuardado matches-2026.json + tournaments-discovered.json");

try {
  const deleted = await deleteTournamentsNotIn([...tourSlugs]);
  console.log(`Supabase tournaments_catalog: eliminados ${deleted} torneos fuera de BSC`);
} catch (e) {
  console.warn("Supabase purge:", e.message);
}

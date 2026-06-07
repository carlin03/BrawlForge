/**
 * Elimina equipos sin ningún partido publicado (JSON local + Supabase).
 *
 *   node scripts/purge-teams-without-matches.mjs
 *   node scripts/purge-teams-without-matches.mjs --write
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./lib/load-env.mjs";
import { loadPlayedTeamSlugs } from "./lib/played-team-slugs.mjs";
import { getSupabaseRest } from "./lib/supabase-rest.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
const WRITE = process.argv.includes("--write");

loadEnv();

function filterDiscovered(list, played) {
  return list.filter((t) => played.has((t.slug || "").trim().toLowerCase()));
}

async function deleteTeamsNotIn(keepSlugs) {
  const keep = new Set(keepSlugs);
  const { url, headers } = getSupabaseRest();
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/teams_catalog?select=slug,circuit_status&order=slug&limit=1000&offset=${offset}`,
      { headers },
    );
    if (!res.ok) throw new Error(`list teams: ${res.status} ${await res.text()}`);
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
    const del = await fetch(`${url}/rest/v1/teams_catalog?slug=in.(${inList})`, {
      method: "DELETE",
      headers,
    });
    if (!del.ok) throw new Error(`delete teams: ${del.status} ${await del.text()}`);
    n += batch.length;
  }
  return n;
}

async function main() {
  const { played, matchCount } = loadPlayedTeamSlugs();
  const discoveredPath = resolve(gen, "teams-discovered.json");
  const discovered = JSON.parse(readFileSync(discoveredPath, "utf8"));
  const kept = filterDiscovered(discovered, played);
  const removed = discovered.length - kept.length;

  console.log(`Partidos publicables: ${matchCount}`);
  console.log(`Equipos con partido:  ${played.size}`);
  console.log(`teams-discovered:     ${discovered.length} → ${kept.length} (eliminar ${removed})`);

  const sample = discovered
    .filter((t) => !played.has(t.slug))
    .slice(0, 12)
    .map((t) => t.slug);
  if (sample.length) console.log(`Ej. sin partido: ${sample.join(", ")}`);

  if (!WRITE) {
    console.log("\nDry-run. Usa --write para guardar y purgar Supabase.");
    return;
  }

  writeFileSync(discoveredPath, JSON.stringify(kept, null, 2));
  writeFileSync(
    resolve(gen, "played-team-slugs.json"),
    JSON.stringify({ syncedAt: new Date().toISOString(), slugs: [...played].sort() }, null, 2),
  );
  console.log(`\nGuardado ${discoveredPath}`);

  try {
    const deleted = await deleteTeamsNotIn([...played]);
    console.log(`Supabase teams_catalog: eliminados ${deleted} equipos sin partidos`);
  } catch (e) {
    console.warn("Supabase purge:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

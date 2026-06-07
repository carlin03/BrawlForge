import { loadEnv } from "./lib/load-env.mjs";
import { getSupabaseRest } from "./lib/supabase-rest.mjs";

loadEnv();

const { url, headers } = getSupabaseRest();

async function fetchAll(table, select) {
  const rows = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=1000&offset=${offset}`, { headers });
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

const teams = new Set((await fetchAll("teams_catalog", "slug")).map((t) => t.slug));
const players = await fetchAll("players_catalog", "slug,ign,team_slug,status");
const orphans = players.filter((p) => p.team_slug && !teams.has(p.team_slug));
console.log(`Jugadores con equipo inexistente en DB: ${orphans.length}`);
for (const p of orphans.sort((a, b) => a.team_slug.localeCompare(b.team_slug))) {
  console.log(`  ${p.slug} (${p.ign}) → ${p.team_slug}`);
}

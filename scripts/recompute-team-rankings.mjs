/**
 * Recalcula rank + forma W/L de equipos desde partidos publicables 2025–2026.
 *
 *   node scripts/recompute-team-rankings.mjs
 *   node scripts/recompute-team-rankings.mjs --write
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { shouldPublishMatch } from "./lib/match-publish-filter.mjs";
import { dedupeMatchPool } from "./lib/match-dedupe-pool.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
const WRITE = process.argv.includes("--write");

function loadJson(name) {
  return JSON.parse(readFileSync(resolve(gen, name), "utf8"));
}

function main() {
  const raw = loadJson("matches-2026.json");
  const matches = dedupeMatchPool(raw.filter(shouldPublishMatch));
  const teams = loadJson("teams.json");
  const teams2026 = loadJson("teams-2026.json");

  const stats = new Map();

  const touch = (slug) => {
    if (!stats.has(slug)) stats.set(slug, { w: 0, l: 0, form: [] });
    return stats.get(slug);
  };

  const finished = matches
    .filter((m) => m.status === "finished" && m.scoreA !== m.scoreB)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const m of finished) {
    const a = touch(m.teamASlug);
    const b = touch(m.teamBSlug);
    if (m.scoreA > m.scoreB) {
      a.w++;
      b.l++;
      a.form.push("W");
      b.form.push("L");
    } else if (m.scoreB > m.scoreA) {
      b.w++;
      a.l++;
      b.form.push("W");
      a.form.push("L");
    }
  }

  for (const s of stats.values()) {
    s.form = s.form.slice(-5);
    s.pts = s.w * 3 + s.l * 0;
    s.wr = s.w + s.l > 0 ? s.w / (s.w + s.l) : 0;
  }

  const rankedSlugs = [...stats.entries()]
    .filter(([, s]) => s.w + s.l >= 1)
    .sort((a, b) => b[1].pts - a[1].pts || b[1].wr - a[1].wr || b[1].w - a[1].w)
    .map(([slug]) => slug);

  const rankMap = new Map();
  rankedSlugs.forEach((slug, i) => rankMap.set(slug, i + 1));

  function applyRanks(list, label) {
    let updated = 0;
    for (const t of list) {
      const s = stats.get(t.slug);
      const rank = rankMap.get(t.slug);
      if (rank != null) {
        t.rank = rank;
        updated++;
      }
      if (s?.form?.length) {
        t.form = s.form;
      }
    }
    console.log(`  ${label}: ${updated} equipos con rank por resultados (${finished.length} partidos)`);
    return list;
  }

  applyRanks(teams, "teams.json");
  applyRanks(teams2026, "teams-2026.json");

  console.log(`\nTop 15 power ranking (por victorias 2025–2026):`);
  rankedSlugs.slice(0, 15).forEach((slug, i) => {
    const s = stats.get(slug);
    const name = teams.find((t) => t.slug === slug)?.name ?? slug;
    console.log(`  ${i + 1}. ${name} — ${s.w}W ${s.l}L (${Math.round(s.wr * 100)}%)`);
  });

  if (!WRITE) {
    console.log("\nDry-run. Usa --write para guardar ranks.");
    return;
  }

  writeFileSync(resolve(gen, "teams.json"), JSON.stringify(teams));
  writeFileSync(resolve(gen, "teams-2026.json"), JSON.stringify(teams2026));
  console.log("\nGuardado teams.json + teams-2026.json");
}

main();

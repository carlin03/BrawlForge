/**
 * Auditoría: duplicados en partidos, torneos y jugadores multi-equipo.
 *
 *   node scripts/audit-data-duplicates.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { shouldPublishMatch } from "./lib/match-publish-filter.mjs";
import { dedupeMatchPool, matchContentKey, matchFixtureKey } from "./lib/match-dedupe-pool.mjs";

const gen = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src/lib/data/generated");

function main() {
  const matches = JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8")).filter(shouldPublishMatch);
  const tours = JSON.parse(readFileSync(resolve(gen, "tournaments-2026.json"), "utf8"));
  const players2026 = JSON.parse(readFileSync(resolve(gen, "players-2026.json"), "utf8"));

  const byContent = new Map();
  const byFixture = new Map();
  const dupContent = [];
  const dupFixture = [];

  for (const m of matches) {
    const ck = matchContentKey(m);
    const fk = matchFixtureKey(m);
    if (byContent.has(ck)) dupContent.push({ key: ck, a: byContent.get(ck).id, b: m.id });
    else byContent.set(ck, m);
    if (byFixture.has(fk)) dupFixture.push({ key: fk, a: byFixture.get(fk).id, b: m.id });
    else byFixture.set(fk, m);
  }

  const tourSlugs = new Map();
  const dupTours = [];
  for (const t of tours) {
    const k = t.slug?.trim().toLowerCase();
    if (!k) continue;
    if (tourSlugs.has(k)) dupTours.push(k);
    tourSlugs.set(k, (tourSlugs.get(k) || 0) + 1);
  }

  const playerTeams = new Map();
  for (const p of players2026) {
    if (!p.teamSlug) continue;
    const prev = playerTeams.get(p.slug);
    if (prev && prev !== p.teamSlug) {
      playerTeams.set(p.slug, `${prev},${p.teamSlug}`);
    } else {
      playerTeams.set(p.slug, p.teamSlug);
    }
  }
  const multiTeam = [...playerTeams.entries()].filter(([, v]) => v.includes(","));

  const deduped = dedupeMatchPool(matches);

  const report = {
    auditedAt: new Date().toISOString(),
    matchesRaw: matches.length,
    matchesDeduped: deduped.length,
    duplicateContentKeys: dupContent.length,
    duplicateFixtureKeys: dupFixture.length,
    duplicateTournamentSlugs: dupTours.length,
    playersOnMultipleTeams: multiTeam.length,
    contentSamples: dupContent.slice(0, 10),
    fixtureSamples: dupFixture.slice(0, 10),
    multiTeamSamples: multiTeam.slice(0, 15).map(([slug, teams]) => ({ slug, teams })),
  };

  writeFileSync(resolve(gen, "data-duplicates-audit.json"), JSON.stringify(report, null, 2));

  console.log("── Duplicados ──");
  console.log(`  Partidos publicables:     ${matches.length}`);
  console.log(`  Tras dedupe por cruce:    ${deduped.length} (−${matches.length - deduped.length})`);
  console.log(`  Cruces duplicados (día):  ${dupContent.length}`);
  console.log(`  Cruces duplicados (ronda):${dupFixture.length}`);
  console.log(`  Torneos slug repetido:    ${dupTours.length}`);
  console.log(`  Jugadores multi-equipo:   ${multiTeam.length}`);
  console.log(`  → src/lib/data/generated/data-duplicates-audit.json`);
}

main();

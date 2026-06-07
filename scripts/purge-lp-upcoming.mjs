/**
 * Filtra partidos: mantiene próximos Liquipedia con fecha real + BSC + resultados LP.
 *
 *   node scripts/purge-lp-upcoming.mjs
 *   node scripts/purge-lp-upcoming.mjs --write
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { shouldPublishMatch } from "./lib/match-publish-filter.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gen = resolve(root, "src/lib/data/generated");
const WRITE = process.argv.includes("--write");

const path = resolve(gen, "matches-2026.json");
const all = JSON.parse(readFileSync(path, "utf8"));

const kept = all.filter(shouldPublishMatch);
const removed = all.length - kept.length;

const byStatus = (list) => ({
  finished: list.filter((m) => m.status === "finished").length,
  upcoming: list.filter((m) => m.status === "upcoming").length,
  live: list.filter((m) => m.status === "live").length,
});

console.log(`matches-2026.json: ${all.length} → ${kept.length} (eliminados ${removed})`);
console.log("Antes:", byStatus(all));
console.log("Después:", byStatus(kept));

const up = kept.filter((m) => m.status === "upcoming");
console.log(`Próximos restantes: ${up.length}`);
up.slice(0, 12).forEach((m) =>
  console.log(`  ${m.date.slice(0, 10)} ${m.tournamentSlug} ${m.teamASlug} vs ${m.teamBSlug}`),
);

if (!WRITE) {
  console.log("\nDry-run. Usa --write para guardar.");
  process.exit(0);
}

writeFileSync(path, JSON.stringify(kept));
console.log(`\nGuardado ${path}`);

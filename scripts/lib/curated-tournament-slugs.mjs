/**
 * Torneos públicos curados (~52 BSC 2026) — excluye ligas tier B+ genéricas.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

let _slugs = null;

function loadBscCircuitSlugs() {
  const set = new Set();
  const bscTs = fs.readFileSync(path.join(root, "src/lib/data/bsc-tournaments.ts"), "utf8");
  for (const m of bscTs.matchAll(/slug:\s*["']([^"']+)["']/g)) set.add(m[1]);
  for (const m of bscTs.matchAll(/mf\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g)) {
    set.add(`bsc-2026-${m[1]}-${m[2].toLowerCase()}-mf`);
  }
  for (const month of ["february", "march", "april", "may"]) {
    set.add(`bsc-2026-cn-${month}-mf`);
  }
  const aliasBlock = bscTs.match(/BSC_TOURNAMENT_ALIASES[^=]*=\s*\{([\s\S]*?)\};/)?.[1] ?? "";
  for (const m of aliasBlock.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    set.add(m[1]);
    set.add(m[2]);
  }
  set.add("world-finals-2026");
  return set;
}

export function isCuratedPublicTournamentSlug(slug) {
  const s = (slug || "").trim().toLowerCase();
  if (!s) return false;
  if (!_slugs) _slugs = loadBscCircuitSlugs();
  if (_slugs.has(s)) return true;
  if (/^brawl-stars-championship-2026/i.test(s)) return true;
  if (/^brawl-stars-challengers/i.test(s)) return true;
  return false;
}

export function listCuratedTournamentSlugs() {
  if (!_slugs) _slugs = loadBscCircuitSlugs();
  return [..._slugs].sort();
}

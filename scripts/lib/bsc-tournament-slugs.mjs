/**
 * Slugs de torneos BSC 2026 + World Finals — misma lista que la app muestra.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function collectBscTournamentLogoSlugs() {
  const bscTs = fs.readFileSync(path.join(root, "src/lib/data/bsc-tournaments.ts"), "utf8");
  const catalogTs = fs.readFileSync(path.join(root, "src/lib/data/catalog.ts"), "utf8");
  const slugs = new Set();

  for (const m of bscTs.matchAll(/slug:\s*["']([^"']+)["']/g)) {
    slugs.add(m[1]);
  }

  for (const m of bscTs.matchAll(/mf\(\s*"([^"]+)"\s*,\s*"([^"]+)"/g)) {
    slugs.add(`bsc-2026-${m[1]}-${m[2].toLowerCase()}-mf`);
  }

  for (const month of ["february", "march", "april", "may"]) {
    slugs.add(`bsc-2026-cn-${month}-mf`);
  }

  for (const m of bscTs.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    if (!m[0].includes("bsc-2026")) continue;
    if (m[1].startsWith("bsc-2026")) slugs.add(m[1]);
    if (m[2].startsWith("bsc-2026")) slugs.add(m[2]);
  }

  const aliasBlock = catalogTs.match(/TOURNAMENT_SLUG_ALIASES[\s\S]*?\};/);
  if (aliasBlock) {
    for (const m of aliasBlock[0].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
      slugs.add(m[1]);
      slugs.add(m[2]);
    }
  }

  slugs.add("world-finals-2026");
  slugs.add("world-finals-2025");

  return [...slugs]
    .filter((s) => /^bsc-2026|^world-finals|^brawl-stars-championship-2026/i.test(s))
    .sort();
}

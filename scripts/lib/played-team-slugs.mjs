import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { shouldPublishMatch } from "./match-publish-filter.mjs";
import { dedupeMatchPool } from "./match-dedupe-pool.mjs";
import { loadBscUpcomingCalendar } from "./parse-bsc-upcoming-ts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const gen = resolve(root, "src/lib/data/generated");

/** Slugs con al menos un partido publicable (mismo pool que publish-everything). */
export function loadPlayedTeamSlugs(extraPaths = []) {
  const all = [];
  try {
    all.push(...JSON.parse(readFileSync(resolve(gen, "matches-2026.json"), "utf8")));
  } catch {
    /* skip */
  }
  try {
    const enriched = JSON.parse(readFileSync(resolve(gen, "bsc-tournaments-enriched.json"), "utf8"));
    all.push(...(enriched.matches ?? []));
  } catch {
    /* skip */
  }
  try {
    all.push(...loadBscUpcomingCalendar());
  } catch {
    /* skip */
  }
  for (const p of extraPaths) {
    try {
      all.push(...JSON.parse(readFileSync(p, "utf8")));
    } catch {
      /* skip */
    }
  }
  const matches = dedupeMatchPool(all.filter(shouldPublishMatch));
  const played = new Set();
  for (const m of matches) {
    if (m.teamASlug) played.add(m.teamASlug.trim().toLowerCase());
    if (m.teamBSlug) played.add(m.teamBSlug.trim().toLowerCase());
  }
  return { played, matchCount: matches.length };
}

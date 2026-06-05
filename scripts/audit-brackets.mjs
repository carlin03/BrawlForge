import { getMatchPool, getPickemBracketPool } from "../src/lib/data/match-pool.ts";
import { getPickemOpenMatches } from "../src/lib/data/pickem-open-matches.ts";
import { getMatchStageMeta } from "../src/lib/data/match-stage-meta.ts";
import { shouldHideIncompletePlayoffRound, countTournamentQuarters } from "../src/lib/data/bracket-playoff-sanitize.ts";
import { canonicalTournamentSlug } from "../src/lib/data/playoff-pool-normalize.ts";

const pool = getPickemBracketPool();
const open = getPickemOpenMatches();

function snap(matches) {
  const byTour = new Map();
  for (const x of matches) {
    const t = canonicalTournamentSlug(x.tournamentSlug);
    const o = byTour.get(t) || { qf: 0, sf: 0, gf: 0, other: 0 };
    const rk = getMatchStageMeta(x.stage).roundKey;
    if (rk === "quarter") o.qf++;
    else if (rk === "semi") o.sf++;
    else if (rk === "grand_final" || rk === "final") o.gf++;
    else o.other++;
    byTour.set(t, o);
  }
  return [...byTour.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const chal = open.filter((m) => m.tournamentSlug.includes("challengers-spain"));
console.log("Challengers Spain open:", chal.length, chal.map((m) => m.id).join(", "));
const chalPool = pool.filter((m) => m.tournamentSlug.includes("challengers-spain"));
console.log("Challengers Spain pool:", chalPool.length, chalPool.map((m) => m.id).join(", "));

console.log("PICKEM OPEN:", open.length);
for (const [t, o] of snap(open)) {
  if (!t.includes("bsc-2026")) continue;
  console.log(`  ${t}  qf=${o.qf} sf=${o.sf} gf=${o.gf} other=${o.other}`);
}

console.log("\nPOOL vs OPEN gaps (playoff):");
for (const [t, o] of snap(pool)) {
  if (!t.includes("bsc-2026")) continue;
  const openSnap = snap(open).find(([s]) => s === t)?.[1];
  const hidden = pool.filter(
    (m) =>
      canonicalTournamentSlug(m.tournamentSlug) === t &&
      shouldHideIncompletePlayoffRound(pool, m),
  );
  if (o.qf !== 4 && o.qf > 0) {
    console.log(`  INCOMPLETE QF: ${t} has ${o.qf} quarters in pool`);
  }
  if (openSnap && (openSnap.sf < o.sf || openSnap.gf < o.gf)) {
    console.log(`  HIDDEN: ${t} pool sf=${o.sf} gf=${o.gf} open sf=${openSnap.sf} gf=${openSnap.gf} hidden=${hidden.length}`);
  }
}

const juneEmea = "bsc-2026-june-emea-mf";
const marchSa = "bsc-2026-march-sa-mf";
console.log(`\n${marchSa} quarters in pool:`, countTournamentQuarters(pool, marchSa));
getMatchPool()
  .filter((m) => m.tournamentSlug === marchSa)
  .forEach((m) => console.log(" ", getMatchStageMeta(m.stage).roundKey, m.teamASlug, m.teamBSlug));

console.log(`\n${juneEmea} quarters in pool:`, countTournamentQuarters(pool, juneEmea));
console.log("June EMEA open matches:");
open
  .filter((m) => canonicalTournamentSlug(m.tournamentSlug) === juneEmea)
  .forEach((m) => {
    console.log(`  ${m.id} ${getMatchStageMeta(m.stage).roundKey} ${m.teamASlug} vs ${m.teamBSlug}`);
  });

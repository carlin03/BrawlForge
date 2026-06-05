import { getGeneratedMatches } from "../src/lib/data/catalog.ts";
import { getMatchPool, getPickemBracketPool } from "../src/lib/data/match-pool.ts";
import { getLiquipediaNonBscMatches, isLiquipediaNonBscTournament } from "../src/lib/data/liquipedia-matches.ts";
import { getPickemOpenMatches } from "../src/lib/data/pickem-open-matches.ts";
import { BSC_UPCOMING_PREDICTION_MATCHES } from "../src/lib/data/bsc-upcoming-predictions.ts";
import { getOfficialUpcomingCalendarMatches, getPickemCalendarMatches } from "../src/lib/data/bsc-calendar-upcoming.ts";
import { getBscEnrichedMatches } from "../src/lib/data/bsc-tournaments-enriched.ts";
import { isPublicScheduleMatch, isPublicUpcomingCalendarMatch, isPickemTemplateMatch } from "../src/lib/data/match-schedule-trust.ts";
import { isPickemMatchEligible } from "../src/lib/data/pickem-eligibility.ts";
import { isPickemMatchOpen } from "../src/lib/data/match-effective-status.ts";
import { shouldHideIncompletePlayoffRound } from "../src/lib/data/bracket-playoff-sanitize.ts";
import { getMatchStageMeta } from "../src/lib/data/match-stage-meta.ts";

const pool = getMatchPool();
const pickemPool = getPickemBracketPool();
const open = getPickemOpenMatches();
const lpNonBsc = getLiquipediaNonBscMatches();
const lpRaw = getGeneratedMatches();
const bscLp = getBscEnrichedMatches();
const calendar = getOfficialUpcomingCalendarMatches(pool);

function whyNotPickem(m, p) {
  const reasons = [];
  if (isPickemTemplateMatch(m)) reasons.push("template");
  if (!isPublicUpcomingCalendarMatch(m)) reasons.push("not-public-upcoming");
  if (!isPickemMatchEligible(m)) reasons.push("not-eligible");
  if (!isPickemMatchOpen(m)) reasons.push("not-open");
  if (shouldHideIncompletePlayoffRound(p, m)) reasons.push("incomplete-bracket-hide");
  const meta = getMatchStageMeta(m.stage || "");
  const fromAdmin = Boolean(m.stage?.trim());
  if (!(fromAdmin || meta.isPlayoff || meta.roundKey === "group")) reasons.push("not-playoff-or-group");
  return reasons;
}

console.log("=== SOURCES");
console.log("BSC enriched LP:", bscLp.length);
console.log("LP raw matches-2026:", lpRaw.length);
console.log("LP non-BSC parsed:", lpNonBsc.length);
console.log("BSC seed upcoming:", BSC_UPCOMING_PREDICTION_MATCHES.length);
console.log("Official calendar (future):", calendar.length);
console.log("Pickem calendar (open tour):", getPickemCalendarMatches(pool).length);
const chalPick = open.filter((m) => m.tournamentSlug.includes("challengers-spain"));
console.log("Challengers Spain in pickem:", chalPick.length, chalPick.map((m) => m.id).join(", "));

console.log("\n=== POOLS");
console.log("Match pool:", pool.length);
console.log("  public schedule:", pool.filter(isPublicScheduleMatch).length);
console.log("  public upcoming:", pool.filter(isPublicUpcomingCalendarMatch).length);
console.log("  LP non-BSC in pool:", pool.filter((m) => isLiquipediaNonBscTournament(m.tournamentSlug)).length);
console.log("Pickem bracket pool:", pickemPool.length);
console.log("Pickem OPEN:", open.length);
const lpOpen = open.filter((m) => m.id.startsWith("lp-"));
console.log("  LP in pickem:", lpOpen.length, lpOpen.map((m) => m.id.slice(0, 50)).join(" | "));

console.log("\n=== SEED vs POOL vs PICKEM");
const seedMissingPool = [];
const seedMissingPickem = [];
for (const m of BSC_UPCOMING_PREDICTION_MATCHES) {
  const inPool = pool.find((p) => p.id === m.id);
  const inOpen = open.find((p) => p.id === m.id);
  if (!inPool) seedMissingPool.push(m);
  else if (!inOpen) seedMissingPickem.push({ m: inPool, why: whyNotPickem(inPool, pickemPool) });
}
console.log("Seed missing from pool:", seedMissingPool.length);
seedMissingPool.slice(0, 8).forEach((m) =>
  console.log("  POOL-", m.id, m.tournamentSlug, m.stage, m.date.slice(0, 10)),
);
console.log("Seed in pool but NOT pickem:", seedMissingPickem.length);
seedMissingPickem.slice(0, 12).forEach(({ m, why }) =>
  console.log("  PICK-", m.id, why.join(", ")),
);

console.log("\n=== LP NON-BSC vs POOL");
const lpMissing = lpNonBsc.filter((m) => !pool.some((p) => p.id === m.id || (p.tournamentSlug === m.tournamentSlug && p.teamASlug === m.teamASlug && p.teamBSlug === m.teamBSlug && p.date.slice(0, 10) === m.date.slice(0, 10))));
console.log("LP non-BSC not in pool:", lpMissing.length);
lpMissing.slice(0, 10).forEach((m) =>
  console.log("  ", m.id, m.tournamentSlug, m.teamASlug, m.teamBSlug, m.status),
);

const lpInPoolNotPickem = pool.filter((m) => isLiquipediaNonBscTournament(m.tournamentSlug) && isPublicUpcomingCalendarMatch(m) && !open.some((o) => o.id === m.id));
console.log("LP non-BSC upcoming in pool but not pickem:", lpInPoolNotPickem.length);
lpInPoolNotPickem.forEach((m) => console.log("  ", m.id, whyNotPickem(m, pickemPool).join(", ")));

console.log("\n=== LP NON-BSC tournaments in pool");
const tourCounts = new Map();
for (const m of pool.filter((x) => isLiquipediaNonBscTournament(x.tournamentSlug))) {
  tourCounts.set(m.tournamentSlug, (tourCounts.get(m.tournamentSlug) || 0) + 1);
}
[...tourCounts.entries()].sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${t}: ${n}`));

const lpUp = pool.filter(
  (m) => isLiquipediaNonBscTournament(m.tournamentSlug) && isPublicUpcomingCalendarMatch(m),
);
console.log("\n=== LP NON-BSC UPCOMING", lpUp.length);
for (const m of lpUp) {
  const inO = open.some((o) => o.id === m.id);
  const rk = getMatchStageMeta(m.stage).roundKey;
  console.log(
    inO ? "OK" : "MISS",
    m.id.slice(0, 55),
    rk,
    m.teamASlug,
    "vs",
    m.teamBSlug,
    isPickemMatchEligible(m) ? "elig" : "NO-ELIG",
    whyNotPickem(m, pickemPool).join(","),
  );
}

console.log("\n=== UPCOMING NOT IN PICKEM (any source)");
const upcomingNotPickem = pool.filter(
  (m) =>
    isPublicUpcomingCalendarMatch(m) &&
    isPickemMatchEligible(m) &&
    isPickemMatchOpen(m) &&
    !open.some((o) => o.id === m.id),
);
console.log("Count:", upcomingNotPickem.length);
upcomingNotPickem.slice(0, 15).forEach((m) =>
  console.log("  ", m.id, m.tournamentSlug, getMatchStageMeta(m.stage).roundKey, whyNotPickem(m, pickemPool).join(", ")),
);

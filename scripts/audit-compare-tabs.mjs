import { getMatchPool } from "../src/lib/data/match-pool.ts";
import { getPickemOpenMatches } from "../src/lib/data/pickem-open-matches.ts";
import { isPublicUpcomingCalendarMatch, isPublicScheduleMatch } from "../src/lib/data/match-schedule-trust.ts";
import { getEffectiveMatchStatus, isPickemMatchOpen } from "../src/lib/data/match-effective-status.ts";
import { getMatchStageMeta } from "../src/lib/data/match-stage-meta.ts";
import { buildPredictionEvents } from "../src/lib/data/predictions-build.ts";
import { buildAllPlayoffBrackets } from "../src/lib/data/predictions-ui.ts";
import { enrichPrediction } from "../src/lib/data/predictions-ui.ts";

const pool = getMatchPool();
const open = getPickemOpenMatches();
const matchesUp = pool.filter(
  (m) => isPublicUpcomingCalendarMatch(m) && getEffectiveMatchStatus(m) === "upcoming",
);
const results = pool.filter(
  (m) => isPublicScheduleMatch(m) && getEffectiveMatchStatus(m) === "finished",
);

function byStage(list, label) {
  const c = { quarter: 0, semi: 0, grand_final: 0, group: 0, other: 0 };
  for (const m of list) {
    const rk = getMatchStageMeta(m.stage).roundKey;
    if (rk === "quarter") c.quarter++;
    else if (rk === "semi") c.semi++;
    else if (rk === "grand_final" || rk === "final") c.grand_final++;
    else if (rk === "group") c.group++;
    else c.other++;
  }
  console.log(label, list.length, c);
}

byStage(matchesUp, "PARTIDOS próximos");
byStage(open, "PICKEM open");

const inMatchesNotPickem = matchesUp.filter((m) => !open.some((o) => o.id === m.id));
const inPickemNotMatches = open.filter((m) => !matchesUp.some((o) => o.id === m.id));
console.log("\nEn Partidos próximos pero NO pickem:", inMatchesNotPickem.length);
inMatchesNotPickem.forEach((m) =>
  console.log(" ", m.id, getMatchStageMeta(m.stage).roundKey, isPickemMatchOpen(m)),
);
console.log("En pickem pero NO partidos próximos:", inPickemNotMatches.length);
inPickemNotMatches.forEach((m) => console.log(" ", m.id, getMatchStageMeta(m.stage).roundKey));

const { open: predOpen } = buildPredictionEvents({}, {});
const enriched = predOpen.map((e) => enrichPrediction(e, {}));
const brackets = buildAllPlayoffBrackets(enriched);
console.log("\nBRACKETS en predictions UI:", brackets.length);
for (const b of brackets) {
  console.log(`  ${b.tournamentSlug}: qf=${b.quarters.length} sf=${b.semis.length} gf=${b.final ? 1 : 0}`);
}

console.log("\nRESULTADOS partidos:", results.length);
const badResults = results.filter((m) => m.scoreA === 0 && m.scoreB === 0);
console.log("  finished 0-0 (sospechosos):", badResults.length);

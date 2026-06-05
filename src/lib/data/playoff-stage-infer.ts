import type { EsportsMatch } from "./esports-match-types";
import { getMatchStageMeta } from "./match-stage-meta";
import { canonicalTournamentSlug } from "./playoff-pool-normalize";

const STAGE_QF = "Quarterfinal";
const STAGE_SF = "Semifinal";
const STAGE_GF = "Grand Final";

function isGenericStage(stage: string): boolean {
  const s = (stage || "").trim().toLowerCase();
  return !s || s === "match" || s === "series" || s === "bracket";
}

function needsStageInference(m: EsportsMatch): boolean {
  if (!isGenericStage(m.stage)) return false;
  return getMatchStageMeta(m.stage).roundKey === "other";
}

/** Asigna cuartos / semis / final cuando Liquipedia solo trae stage "Match". */
function inferBracketStages(sorted: EsportsMatch[]): EsportsMatch[] {
  const n = sorted.length;
  if (n === 0) return sorted;

  let qf = 0;
  let sf = 0;
  let gf = 0;

  if (n >= 7) {
    qf = 4;
    sf = 2;
    gf = 1;
  } else if (n === 6) {
    qf = 4;
    sf = 2;
  } else if (n === 5) {
    qf = 4;
    sf = 1;
  } else if (n === 4) {
    qf = 4;
  } else if (n === 3) {
    sf = 2;
    gf = 1;
  } else if (n === 2) {
    sf = 2;
  } else if (n === 1) {
    gf = 1;
  } else {
    return sorted;
  }

  return sorted.map((m, i) => {
    let stage = m.stage;
    if (i < qf) stage = STAGE_QF;
    else if (i < qf + sf) stage = STAGE_SF;
    else stage = STAGE_GF;
    return stage === m.stage ? m : { ...m, stage };
  });
}

function inferTournamentMatches(matches: EsportsMatch[]): EsportsMatch[] {
  const generic = matches.filter(needsStageInference);
  if (generic.length === 0) return matches;

  const labeled = matches.filter((m) => !needsStageInference(m));
  const slug = canonicalTournamentSlug(matches[0]?.tournamentSlug ?? "");
  const isMonthlyFinals = slug.includes("-mf") || slug.includes("monthly-finals");

  const sorted = [...generic].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let toInfer = sorted;
  if (labeled.length > 0 || sorted.length > 7) {
    const bracketSizes = [7, 6, 5, 4, 3, 2, 1];
    const pick = bracketSizes.find((n) => sorted.length >= n && (isMonthlyFinals ? n === 7 || n === 3 : true));
    if (pick && sorted.length > pick) {
      toInfer = sorted.slice(-pick);
    } else if (!pick) {
      return matches;
    }
  } else if (!isMonthlyFinals && sorted.length > 4) {
    return matches;
  }

  const inferred = inferBracketStages(toInfer);

  return matches.map((m) => {
    const hit = inferred.find((x) => x.id === m.id);
    return hit ?? m;
  });
}

/** Inferencia por torneo antes de normalizar el pool público. */
export function inferPlayoffStagesInPool(pool: EsportsMatch[]): EsportsMatch[] {
  const byTour = new Map<string, EsportsMatch[]>();
  for (const m of pool) {
    const key = canonicalTournamentSlug(m.tournamentSlug);
    const list = byTour.get(key) ?? [];
    list.push(m);
    byTour.set(key, list);
  }

  const out: EsportsMatch[] = [];
  for (const [, tourMatches] of byTour) {
    out.push(...inferTournamentMatches(tourMatches));
  }
  return out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function mergeMatchStagePreferExplicit(
  primary: EsportsMatch,
  secondary: EsportsMatch,
): EsportsMatch {
  const pri = getMatchStageMeta(primary.stage).roundKey;
  const sec = getMatchStageMeta(secondary.stage).roundKey;
  if (pri === "other" && sec !== "other") {
    return { ...primary, stage: secondary.stage };
  }
  return primary;
}

/**
 * Deduplicación de partidos por cruce (torneo + equipos + día), alineado con match-pool.ts.
 */

const BSC_TOURNAMENT_ALIASES = {
  "bsc-2026-s3-emea-mf": "bsc-2026-april-emea-mf",
  "bsc-2026-s3-ea-mf": "bsc-2026-april-ea-mf",
  "bsc-2026-s3-na-mf": "bsc-2026-april-na-mf",
  "bsc-2026-s3-sa-mf": "bsc-2026-april-sa-mf",
  "world-finals-2026-may": "bsc-2026-brawl-cup",
};

const ROUND_PATTERNS = [
  [/grand\s*final|gran\s*final/i, "grand_final"],
  [/\bsf\b|semifinal|semi-?final/i, "semi"],
  [/\bqf\b|quarter|cuartos/i, "quarter"],
  [/final/i, "final"],
  [/group/i, "group"],
];

function canonicalTournamentSlug(slug) {
  return BSC_TOURNAMENT_ALIASES[slug] ?? slug;
}

function roundKey(stage) {
  const s = String(stage || "").trim();
  if (!s || /^match$/i.test(s)) return "other";
  for (const [re, key] of ROUND_PATTERNS) {
    if (re.test(s)) return key;
  }
  return "other";
}

export function matchFixtureKey(m) {
  const tour = canonicalTournamentSlug(m.tournamentSlug);
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  const day = (m.date || "").slice(0, 10);
  const rk = roundKey(m.stage);
  return `${tour}|${rk}|${pair}|${day}`;
}

export function matchContentKey(m) {
  const tour = canonicalTournamentSlug(m.tournamentSlug);
  const a = m.teamASlug;
  const b = m.teamBSlug;
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  const day = (m.date || "").slice(0, 10);
  return `${tour}|${pair}|${day}`;
}

function mergeStage(winner, other) {
  if (roundKey(winner.stage) === "other" && roundKey(other.stage) !== "other") {
    return { ...winner, stage: other.stage };
  }
  return winner;
}

/** Prefiere terminado, marcador mayor, id lp- sobre seeds. */
export function pickBetterMatch(a, b) {
  const sa = a.status || "upcoming";
  const sb = b.status || "upcoming";
  if (sa === "finished" && sb !== "finished") return mergeStage(a, b);
  if (sb === "finished" && sa !== "finished") return mergeStage(b, a);
  const scoreA = (a.scoreA ?? 0) + (a.scoreB ?? 0);
  const scoreB = (b.scoreA ?? 0) + (b.scoreB ?? 0);
  if (scoreA !== scoreB) return scoreA > scoreB ? mergeStage(a, b) : mergeStage(b, a);
  const aLp = String(a.id || "").startsWith("lp-");
  const bLp = String(b.id || "").startsWith("lp-");
  if (aLp && !bLp) return mergeStage(a, b);
  if (bLp && !aLp) return mergeStage(b, a);
  const aSeed = /^(mf26-|chal-|bc26-)/.test(String(a.id || ""));
  const bSeed = /^(mf26-|chal-|bc26-)/.test(String(b.id || ""));
  if (aSeed && !bSeed) return mergeStage(b, a);
  if (bSeed && !aSeed) return mergeStage(a, b);
  return mergeStage(a, b);
}

/** Elimina duplicados por cruce (contenido); conserva el mejor registro. */
export function dedupeMatchPool(matches) {
  const byContent = new Map();
  const byId = new Map();

  for (const m of matches) {
    const ck = matchContentKey(m);
    const prev = byContent.get(ck);
    const best = prev ? pickBetterMatch(prev, m) : m;
    byContent.set(ck, best);
    byId.set(best.id, best);
  }

  // Segunda pasada: misma id distinta tras merge de contenido
  const out = [...byContent.values()];
  const finalById = new Map();
  for (const m of out) {
    finalById.set(m.id, m);
  }
  return [...finalById.values()];
}

import type { Region } from "../types";
import type { EsportsMatch } from "./matches";
import type { PredictionEvent } from "./predictions";
import { getTournament } from "./matches";
import { getMatchStageMeta, getPredictDisplayStatus } from "./match-stage-meta";
import type { EnrichedPrediction } from "./predictions-ui";
import {
  parseMatchMeta,
  type MatchDisplayStatus,
  type MatchImportance,
  type MatchMeta,
  type MatchPredictionPoints,
  type MatchPredictionsConfig,
} from "./match-meta";

/** Estado del formulario de partidos en admin (StudioMatchesPanel). */
export type AdminMatchFormState = {
  team_a_slug: string;
  team_b_slug: string;
  tournament_slug: string;
  scheduled_at: string;
  status: string;
  stage: string;
  format: string;
  score_a: number;
  score_b: number;
  importance: MatchImportance;
  display_status: MatchDisplayStatus;
  featured_label: string;
  pred_winner: boolean;
  pred_exact: boolean;
  pred_mvp: boolean;
  pred_first_map: boolean;
  pred_decisive_map: boolean;
  pred_brawler_used: boolean;
  pred_brawler_mvp: boolean;
  pred_brawler_most_banned: boolean;
  pred_brawler_lowest_wr: boolean;
  pred_map_winners: boolean;
  pred_map_picks: boolean;
  pred_advanced: boolean;
  points_winner: number;
  points_exact: number;
  points_mvp: number;
  points_map_winner: number;
  points_map_pick: number;
  points_brawler_ban: number;
  points_brawler_mvp: number;
  points_brawler_used: number;
  points_brawler_most_banned: number;
  points_brawler_lowest_wr: number;
  points_participation: number;
  points_perfect_bonus: number;
  result_mvp_player: string;
  result_brawler_wr: string;
  result_brawler_used: string;
  result_brawler_banned: string;
  result_brawler_low_wr: string;
  map_pool: string[];
  map_order: string[];
  map_current: string;
  map_decisive: string;
  bans_maps_a: string[];
  bans_maps_b: string[];
  brawlers_meta: string[];
  brawlers_recommended: string[];
  brawlers_banned_a: string[];
  brawlers_banned_b: string[];
};

export function buildMatchMetaFromForm(form: AdminMatchFormState): MatchMeta {
  const predictions: MatchPredictionsConfig = {
    winner: form.pred_winner,
    exact_score: form.pred_exact,
    mvp: form.pred_mvp,
    first_map: form.pred_first_map,
    decisive_map: form.pred_decisive_map,
    brawler_most_used: form.pred_brawler_used,
    brawler_mvp: form.pred_brawler_mvp,
    brawler_most_banned: form.pred_brawler_most_banned,
    brawler_lowest_wr: form.pred_brawler_lowest_wr,
    map_winners: form.pred_map_winners,
    map_brawler_picks: form.pred_map_picks,
    advanced: form.pred_advanced,
  };
  const prediction_points: MatchPredictionPoints = {
    winner: form.points_winner || undefined,
    exact_score: form.points_exact || undefined,
    mvp: form.points_mvp || undefined,
    map_winner: form.points_map_winner || undefined,
    map_pick: form.points_map_pick || undefined,
    brawler_ban: form.points_brawler_ban || undefined,
    brawler_mvp: form.points_brawler_mvp || undefined,
    brawler_most_used: form.points_brawler_used || undefined,
    brawler_most_banned: form.points_brawler_most_banned || undefined,
    brawler_lowest_wr: form.points_brawler_lowest_wr || undefined,
    participation: form.points_participation || undefined,
    perfect_bonus: form.points_perfect_bonus || undefined,
  };
  const hasPoints = Object.values(prediction_points).some((v) => v != null && v > 0);
  const adv: MatchMeta["advanced_predictions"] = {};
  if (form.result_mvp_player.trim()) adv.mvp_player_slug = form.result_mvp_player.trim();
  if (form.result_brawler_wr.trim()) adv.match_mvp_brawler = form.result_brawler_wr.trim();
  if (form.result_brawler_used.trim()) adv.most_used_brawler = form.result_brawler_used.trim();
  if (form.result_brawler_banned.trim()) adv.most_banned_brawler = form.result_brawler_banned.trim();
  if (form.result_brawler_low_wr.trim()) adv.lowest_wr_brawler = form.result_brawler_low_wr.trim();
  if (form.score_a > 0 || form.score_b > 0) {
    adv.exact_score = `${form.score_a}-${form.score_b}`;
  }
  const hasAdv = Object.keys(adv).length > 0;
  return {
    importance: form.importance,
    display_status: form.display_status,
    allow_exact_score: form.pred_exact,
    featured_label: form.featured_label.trim() || undefined,
    predictions,
    prediction_points: hasPoints ? prediction_points : undefined,
    advanced_predictions: hasAdv ? adv : undefined,
    maps: form.map_pool.length
      ? {
          possible: form.map_pool,
          order: form.map_order.length ? form.map_order : form.map_pool,
          current: form.map_current || undefined,
          decisive: form.map_decisive || undefined,
        }
      : undefined,
    bans: {
      maps_a: form.bans_maps_a,
      maps_b: form.bans_maps_b,
      brawlers_a: form.brawlers_banned_a,
      brawlers_b: form.brawlers_banned_b,
    },
    brawlers: {
      meta: form.brawlers_meta.length ? form.brawlers_meta : undefined,
      recommended: form.brawlers_recommended.length ? form.brawlers_recommended : undefined,
    },
  };
}

const MATCH_STATUSES = new Set(["live", "upcoming", "finished", "cancelled"]);

export function adminMatchFormToEsportsMatch(
  matchId: string | null,
  form: AdminMatchFormState,
): EsportsMatch | null {
  if (!form.team_a_slug?.trim() || !form.team_b_slug?.trim()) return null;
  const status = MATCH_STATUSES.has(form.status)
    ? (form.status as EsportsMatch["status"])
    : "upcoming";
  const date = form.scheduled_at
    ? new Date(form.scheduled_at).toISOString()
    : new Date().toISOString();
  return {
    id: matchId?.trim() || "vista-previa",
    teamASlug: form.team_a_slug.trim(),
    teamBSlug: form.team_b_slug.trim(),
    scoreA: Number(form.score_a) || 0,
    scoreB: Number(form.score_b) || 0,
    tournamentSlug: form.tournament_slug || "bsc-2026",
    stage: form.stage || "Group Stage",
    date,
    status,
    region: "GLOBAL" as Region,
    format: form.format || "Bo3",
    meta: buildMatchMetaFromForm(form),
  };
}

export function matchCatalogRowToForm(m: {
  id: string;
  team_a_slug: string;
  team_b_slug: string;
  tournament_slug: string;
  scheduled_at: string;
  status: string;
  stage?: string | null;
  format?: string | null;
  score_a: number;
  score_b: number;
  meta?: Record<string, unknown>;
}): AdminMatchFormState & { id: string } {
  const meta = parseMatchMeta(m.meta);
  const preds = meta.predictions ?? {};
  return {
    id: m.id,
    team_a_slug: m.team_a_slug,
    team_b_slug: m.team_b_slug,
    tournament_slug: m.tournament_slug,
    scheduled_at: m.scheduled_at.slice(0, 16),
    status: m.status,
    stage: m.stage ?? "Group Stage",
    format: m.format ?? "Bo3",
    score_a: m.score_a ?? 0,
    score_b: m.score_b ?? 0,
    importance: meta.importance ?? "normal",
    display_status: meta.display_status ?? "upcoming",
    featured_label: meta.featured_label ?? "",
    pred_winner: preds.winner !== false,
    pred_exact: !!preds.exact_score,
    pred_mvp: !!preds.mvp,
    pred_first_map: !!preds.first_map,
    pred_decisive_map: !!preds.decisive_map,
    pred_brawler_used: !!preds.brawler_most_used,
    pred_brawler_mvp: !!preds.brawler_mvp,
    pred_brawler_most_banned: !!preds.brawler_most_banned,
    pred_brawler_lowest_wr: !!preds.brawler_lowest_wr,
    pred_map_winners: !!preds.map_winners,
    pred_map_picks: !!preds.map_brawler_picks,
    pred_advanced: !!preds.advanced,
    points_winner: meta.prediction_points?.winner ?? 0,
    points_exact: meta.prediction_points?.exact_score ?? 0,
    points_mvp: meta.prediction_points?.mvp ?? 0,
    points_map_winner: meta.prediction_points?.map_winner ?? 0,
    points_map_pick: meta.prediction_points?.map_pick ?? 0,
    points_brawler_ban: meta.prediction_points?.brawler_ban ?? 0,
    points_brawler_mvp: meta.prediction_points?.brawler_mvp ?? 0,
    points_brawler_used: meta.prediction_points?.brawler_most_used ?? 0,
    points_brawler_most_banned: meta.prediction_points?.brawler_most_banned ?? 0,
    points_brawler_lowest_wr: meta.prediction_points?.brawler_lowest_wr ?? 0,
    points_participation: meta.prediction_points?.participation ?? 0,
    points_perfect_bonus: meta.prediction_points?.perfect_bonus ?? 0,
    result_mvp_player: meta.advanced_predictions?.mvp_player_slug ?? "",
    result_brawler_wr: meta.advanced_predictions?.match_mvp_brawler ?? "",
    result_brawler_used: meta.advanced_predictions?.most_used_brawler ?? "",
    result_brawler_banned: meta.advanced_predictions?.most_banned_brawler ?? "",
    result_brawler_low_wr: meta.advanced_predictions?.lowest_wr_brawler ?? "",
    map_pool: meta.maps?.possible ?? [],
    map_order: meta.maps?.order ?? meta.maps?.possible ?? [],
    map_current: meta.maps?.current ?? "",
    map_decisive: meta.maps?.decisive ?? "",
    bans_maps_a: meta.bans?.maps_a ?? [],
    bans_maps_b: meta.bans?.maps_b ?? [],
    brawlers_meta: meta.brawlers?.meta ?? [],
    brawlers_recommended: meta.brawlers?.recommended ?? [],
    brawlers_banned_a: meta.bans?.brawlers_a ?? [],
    brawlers_banned_b: meta.bans?.brawlers_b ?? [],
  };
}

/** Evento enriquecido para BracketMatchCard / vista previa admin (sin depender de getMatch). */
export function adminMatchToEnrichedPrediction(
  form: AdminMatchFormState & { id: string },
): EnrichedPrediction | null {
  const es = adminMatchFormToEsportsMatch(form.id, form);
  if (!es) return null;
  const tour = getTournament(es.tournamentSlug);
  const stageMeta = getMatchStageMeta(es.stage);
  const displayStatus = getPredictDisplayStatus({
    eventStatus: es.status === "finished" ? "closed" : "open",
    matchStatus: es.status,
  });
  const featured =
    form.importance === "week_featured" ||
    form.importance === "historic" ||
    form.importance === "featured";
  const base: PredictionEvent = {
    id: `admin-prev-${es.id}`,
    matchId: es.id,
    teamASlug: es.teamASlug,
    teamBSlug: es.teamBSlug,
    pickAPct: 50,
    pickBPct: 50,
    totalVotes: 0,
    rewardPoints: es.format?.includes("5") ? 75 : es.format?.includes("3") ? 50 : 35,
    deadline: es.date,
    stage: es.stage,
    tournamentSlug: es.tournamentSlug,
    featured,
    importance: form.importance,
    userPick: null,
    status: es.status === "finished" ? "closed" : "open",
  };
  return {
    ...base,
    outcome: "pending",
    pointsEarned: 0,
    matchDate: es.date,
    matchStatus: es.status,
    region: tour?.region ?? es.region,
    tournamentShortName: tour?.shortName ?? tour?.name ?? es.tournamentSlug,
    stageMeta,
    displayStatus,
  };
}

export function countEnabledPredictions(form: AdminMatchFormState): number {
  let n = 0;
  if (form.pred_winner) n++;
  if (form.pred_exact) n++;
  if (form.pred_mvp) n++;
  if (form.pred_first_map) n++;
  if (form.pred_decisive_map) n++;
  if (form.pred_brawler_used) n++;
  if (form.pred_brawler_mvp) n++;
  if (form.pred_brawler_most_banned) n++;
  if (form.pred_brawler_lowest_wr) n++;
  if (form.pred_map_winners) n++;
  if (form.pred_map_picks) n++;
  if (form.pred_advanced) n++;
  return n;
}

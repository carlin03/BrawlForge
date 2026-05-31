import type { MatchPredictionPoints, MatchPredictionsConfig } from "@/lib/data/match-meta";

/** Todas las categorías activas salvo que el admin ponga `false` explícito en meta. */
export const DEFAULT_MATCH_PREDICTIONS_CONFIG: MatchPredictionsConfig = {
  winner: true,
  exact_score: true,
  mvp: true,
  first_map: true,
  decisive_map: true,
  map_winners: true,
  map_brawler_picks: true,
  brawler_most_used: true,
  brawler_mvp: true,
  brawler_most_banned: true,
  brawler_lowest_wr: true,
  advanced: true,
};

/**
 * Puntos realistas por dificultad (no mezclar macro-serie con picks de brawler).
 * Tier 1: ganador / marcador exacto · Tier 2: MVP / mapas · Tier 3: brawlers · Bonus.
 */
export const DEFAULT_MATCH_PREDICTION_POINTS: Required<
  Pick<
    MatchPredictionPoints,
    | "winner"
    | "exact_score"
    | "mvp"
    | "map_winner"
    | "map_pick"
    | "brawler_ban"
    | "brawler_mvp"
    | "brawler_most_used"
    | "brawler_most_banned"
    | "brawler_lowest_wr"
    | "participation"
    | "perfect_bonus"
  >
> = {
  winner: 45,
  exact_score: 40,
  mvp: 28,
  map_winner: 16,
  map_pick: 8,
  brawler_ban: 10,
  brawler_mvp: 14,
  brawler_most_used: 10,
  brawler_most_banned: 10,
  brawler_lowest_wr: 8,
  participation: 5,
  perfect_bonus: 30,
};

export type PredictionPointTier = "serie" | "mapas" | "brawlers" | "bonus";

export const PREDICTION_POINTS_BAR_ROWS: {
  key: keyof MatchPredictionPoints;
  label: string;
  tier: PredictionPointTier;
  tierLabel: string;
}[] = [
  { key: "winner", label: "Ganador", tier: "serie", tierLabel: "Serie" },
  { key: "exact_score", label: "Resultado exacto", tier: "serie", tierLabel: "Serie" },
  { key: "mvp", label: "MVP jugador", tier: "serie", tierLabel: "Serie" },
  { key: "map_winner", label: "Mapa correcto", tier: "mapas", tierLabel: "Mapas" },
  { key: "map_pick", label: "Pick correcto", tier: "mapas", tierLabel: "Mapas" },
  { key: "brawler_ban", label: "Ban correcto", tier: "mapas", tierLabel: "Mapas" },
  { key: "brawler_mvp", label: "Brawler MVP", tier: "brawlers", tierLabel: "Meta brawlers" },
  { key: "brawler_most_used", label: "Brawler más usado", tier: "brawlers", tierLabel: "Meta brawlers" },
  {
    key: "brawler_most_banned",
    label: "Brawler más bloqueado",
    tier: "brawlers",
    tierLabel: "Meta brawlers",
  },
  { key: "brawler_lowest_wr", label: "Brawler menor WR", tier: "brawlers", tierLabel: "Meta brawlers" },
  { key: "participation", label: "Participar", tier: "bonus", tierLabel: "Bonus" },
  { key: "perfect_bonus", label: "Bonus perfecto", tier: "bonus", tierLabel: "Bonus" },
];

/** Activa predicciones por defecto en meta guardado (admin / import). */
export function buildDefaultPredictionsConfig(
  partial?: MatchPredictionsConfig | null,
): MatchPredictionsConfig {
  const p = partial ?? {};
  const on = (k: keyof MatchPredictionsConfig) => p[k] !== false;
  return {
    winner: on("winner"),
    exact_score: on("exact_score"),
    mvp: on("mvp"),
    first_map: on("first_map"),
    decisive_map: on("decisive_map"),
    map_winners: on("map_winners"),
    map_brawler_picks: on("map_brawler_picks"),
    brawler_most_used: on("brawler_most_used"),
    brawler_mvp: on("brawler_mvp"),
    brawler_most_banned: on("brawler_most_banned"),
    brawler_lowest_wr: on("brawler_lowest_wr"),
    advanced: on("advanced"),
  };
}

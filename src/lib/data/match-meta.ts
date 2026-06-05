import type { BrawlerOverride, MapStrategicOverride } from "./game-assets-catalog";
import type { EsportsMatch } from "./matches";
import { getTeamDisplayName } from "./team-display-resolve";

function teamDisplayName(slug: string): string {
  return getTeamDisplayName(slug);
}

const DEMO_MVP_IGN: Record<string, string> = {
  moya: "Moya",
  yoshi: "Yoshi",
  lukii: "Lukii",
  boss: "Boss",
  levi: "Levi",
};
import { resolveMatchPoints } from "@/lib/predictions/default-points";
import {
  buildDefaultPredictionsConfig,
  DEFAULT_MATCH_PREDICTION_POINTS,
} from "@/lib/predictions/match-prediction-defaults";

/** Enriquecimiento visual para hub de partidos (demo / derivado). */
export interface MatchEnrichment {
  map: string;
  bans: string[];
  mvpSlug: string | null;
  communityPickA: number;
  quickStat: string;
}

const MAPS = ["Hot Zone", "Bounty", "Knockout", "Gem Grab", "Heist", "Basket Brawl"];
const BRAWLERS = ["Kit", "Cordelius", "Mico", "Surge", "Charlie", "Gray", "Buster", "Melodie"];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function getMatchEnrichment(match: EsportsMatch): MatchEnrichment {
  const meta = parseMatchMeta(match.meta);
  if (meta.maps?.current) {
    return {
      map: meta.maps.current,
      bans: [...(meta.bans?.brawlers_a ?? []), ...(meta.bans?.brawlers_b ?? [])].slice(0, 3),
      mvpSlug: null,
      communityPickA: 50,
      quickStat: meta.maps.current,
    };
  }
  const h = hashId(match.id);
  const map = MAPS[h % MAPS.length];
  const bans = [
    BRAWLERS[h % BRAWLERS.length],
    BRAWLERS[(h + 3) % BRAWLERS.length],
    BRAWLERS[(h + 5) % BRAWLERS.length],
  ];
  const communityPickA = 38 + (h % 25);
  const mvpCandidates = ["moya", "yoshi", "lukii", "boss", "levi"];
  const mvpSlug = match.status !== "upcoming" ? mvpCandidates[h % mvpCandidates.length] : null;

  let quickStat = `${communityPickA}% vota ${teamDisplayName(match.teamASlug)}`;
  if (match.status === "finished" && mvpSlug) {
    quickStat = `MVP · ${DEMO_MVP_IGN[mvpSlug] ?? mvpSlug}`;
  } else if (match.status === "live") {
    quickStat = `Set ${1 + (h % 3)} · ${map}`;
  }

  return { map, bans, mvpSlug, communityPickA, quickStat };
}

/** Metadatos extendidos del partido (matches_catalog.meta jsonb). */

export type MatchImportance = "normal" | "featured" | "week_featured" | "historic";

export type MatchDisplayStatus =
  | "upcoming"
  | "live"
  | "finished"
  | "cancelled"
  | "postponed";

export type MatchMapEntry = {
  name: string;
  played?: boolean;
  order?: number;
  decisive?: boolean;
  mvp_player?: string;
  current?: boolean;
};

export type MatchMapsMeta = {
  possible?: string[];
  played?: MatchMapEntry[];
  order?: string[];
  decisive?: string;
  current?: string;
  /** Sobrescritura opcional por nombre de mapa (solo este partido). */
  map_overrides?: Record<string, MapStrategicOverride>;
};

export type MatchBansMeta = {
  maps_a?: string[];
  maps_b?: string[];
  brawlers_a?: string[];
  brawlers_b?: string[];
};

export type MatchBrawlersMeta = {
  most_used?: string[];
  recommended?: string[];
  meta?: string[];
  featured?: string[];
  overrides?: Record<string, BrawlerOverride>;
};

/** Flags de predicción (admin + UI). `allow_exact_score` se mantiene por compatibilidad. */
export type MatchPredictionsConfig = {
  winner?: boolean;
  exact_score?: boolean;
  mvp?: boolean;
  first_map?: boolean;
  decisive_map?: boolean;
  map_winners?: boolean;
  map_brawler_picks?: boolean;
  brawler_most_used?: boolean;
  brawler_mvp?: boolean;
  brawler_most_banned?: boolean;
  brawler_lowest_wr?: boolean;
  advanced?: boolean;
};

/** Puntos por acierto en este partido (admin). */
export type MatchPredictionPoints = {
  winner?: number;
  exact_score?: number;
  mvp?: number;
  map_winner?: number;
  map_pick?: number;
  brawler_ban?: number;
  brawler_mvp?: number;
  brawler_most_used?: number;
  brawler_most_banned?: number;
  brawler_lowest_wr?: number;
  participation?: number;
  perfect_bonus?: number;
};

/** Resultado real de un mapa (admin al cerrar partido). */
export type MatchMapResultMeta = {
  winner?: "A" | "B";
  picks_a?: string[];
  picks_b?: string[];
  central_bans?: string[];
  team_bans_a?: string[];
  team_bans_b?: string[];
};

/** Reservado para predicciones avanzadas y resultados reales (admin). */
export type MatchAdvancedPredictionsMeta = {
  mvp_player_slug?: string;
  first_map_winner?: "A" | "B";
  most_used_brawler?: string;
  match_mvp_brawler?: string;
  most_banned_brawler?: string;
  lowest_wr_brawler?: string;
  exact_score?: string;
  /** Índice 0-based → resultado del mapa jugado. */
  map_results?: Record<string, MatchMapResultMeta>;
};

export type MatchMeta = {
  /** confirmed = calendario real; template = seed pick'em BSC; generated = bracket admin. */
  schedule_trust?: "confirmed" | "template" | "generated";
  /** Nombres Liquipedia cuando el slug aún no está en catálogo. */
  team_display?: { a?: string; b?: string };
  /** Si true, no aparece en /matches ni home. */
  pickem_only?: boolean;
  importance?: MatchImportance;
  display_status?: MatchDisplayStatus;
  allow_exact_score?: boolean;
  featured_label?: string;
  round_type?: string;
  /** Orden en bracket (qf1→0, sf2→1) para emparejar rondas en pick'em. */
  bracket_slot?: number;
  predictions?: MatchPredictionsConfig;
  prediction_points?: MatchPredictionPoints;
  advanced_predictions?: MatchAdvancedPredictionsMeta;
  maps?: MatchMapsMeta;
  bans?: MatchBansMeta;
  brawlers?: MatchBrawlersMeta;
  notes?: string;
};

export const DEFAULT_MAP_POOL = [
  "Belle's Rock",
  "Bridge Too Far",
  "Center Stage",
  "Double Swoosh",
  "Flaring Phoenix",
  "Gem Fort",
  "Hard Rock Mine",
  "Hot Potato",
  "Kaboom Canyon",
  "Layer Cake",
  "Pinhole Punt",
  "Safe Zone",
  "Shooting Star",
  "Sneaky Fields",
  "Triple Dribble",
] as const;

export const DEFAULT_BRAWLER_POOL = [
  "Kit",
  "Cordelius",
  "Mico",
  "Surge",
  "Charlie",
  "Gray",
  "Buster",
  "Melodie",
  "Angelo",
  "Lily",
  "Kenji",
  "Draco",
] as const;

export const MATCH_IMPORTANCE_OPTIONS: { id: MatchImportance; label: string; featuredLabel: string }[] = [
  { id: "normal", label: "Normal", featuredLabel: "" },
  { id: "featured", label: "Destacado", featuredLabel: "Partido destacado" },
  { id: "week_featured", label: "Partido de la semana", featuredLabel: "Partido de la semana" },
  { id: "historic", label: "Partido histórico", featuredLabel: "Partido histórico" },
];

export const MATCH_DISPLAY_STATUS_OPTIONS: { id: MatchDisplayStatus; label: string }[] = [
  { id: "upcoming", label: "Próximo" },
  { id: "live", label: "En vivo" },
  { id: "finished", label: "Finalizado" },
  { id: "cancelled", label: "Cancelado" },
  { id: "postponed", label: "Pospuesto" },
];

export const BO3_EXACT_SCORES = ["2-0", "2-1", "1-2", "0-2"] as const;
export const BO5_EXACT_SCORES = ["3-0", "3-1", "3-2", "2-3", "1-3", "0-3"] as const;

export function parseMatchMeta(raw: unknown): MatchMeta {
  if (!raw || typeof raw !== "object") return {};
  return raw as MatchMeta;
}

export function getMatchPredictionsConfig(meta: MatchMeta): MatchPredictionsConfig {
  const cfg = buildDefaultPredictionsConfig(meta.predictions);
  const pts = resolveMatchPoints(meta.prediction_points ?? {});
  if (cfg.brawler_most_used === false && (pts.brawler_most_used ?? 0) > 0) {
    return { ...cfg, brawler_most_used: true };
  }
  return cfg;
}

function hasStoredPredictionPoints(meta: MatchMeta): boolean {
  const p = meta.prediction_points;
  if (!p || typeof p !== "object") return false;
  return Object.values(p).some((v) => typeof v === "number" && v > 0);
}

/** Fusiona meta con predicciones completas (para guardar/importar partidos predecibles). */
export function applyDefaultPredictionsToMeta(meta: MatchMeta): MatchMeta {
  const predictions = buildDefaultPredictionsConfig(meta.predictions);
  const prediction_points = hasStoredPredictionPoints(meta)
    ? resolveMatchPoints(meta.prediction_points ?? {})
    : { ...DEFAULT_MATCH_PREDICTION_POINTS };
  return {
    ...meta,
    allow_exact_score: meta.allow_exact_score !== false,
    predictions,
    prediction_points,
  };
}

export function hasAdvancedPredictionOptions(cfg: MatchPredictionsConfig): boolean {
  return Boolean(
    cfg.exact_score ||
      cfg.mvp ||
      cfg.first_map ||
      cfg.decisive_map ||
      cfg.map_winners ||
      cfg.map_brawler_picks ||
      cfg.brawler_most_used ||
      cfg.brawler_mvp ||
      cfg.brawler_most_banned ||
      cfg.brawler_lowest_wr,
  );
}

export function getMatchPredictionPoints(meta: MatchMeta): MatchPredictionPoints {
  return resolveMatchPoints(meta.prediction_points ?? {});
}

export function exactScoresForFormat(format: string): readonly string[] {
  const f = format.toLowerCase();
  if (f.includes("7")) return ["4-0", "4-1", "4-2", "4-3", "3-4", "2-4", "1-4", "0-4"];
  if (f.includes("5")) return BO5_EXACT_SCORES;
  if (f.includes("1")) return ["1-0", "0-1"];
  return BO3_EXACT_SCORES;
}

export function displayStatusLabel(status: MatchDisplayStatus | undefined, matchStatus?: string): string {
  const id = status ?? (matchStatus as MatchDisplayStatus | undefined);
  return MATCH_DISPLAY_STATUS_OPTIONS.find((o) => o.id === id)?.label ?? "Próximo";
}

export function featuredLabelFromMeta(meta: MatchMeta | undefined): string {
  if (!meta) return "Partido destacado";
  if (meta.featured_label?.trim()) return meta.featured_label.trim();
  const imp = MATCH_IMPORTANCE_OPTIONS.find((o) => o.id === meta.importance);
  return imp?.featuredLabel || "Partido destacado";
}

export function isPendingTeamSlug(slug: string | null | undefined): boolean {
  if (!slug) return true;
  const s = slug.toLowerCase();
  if (s === "tbd" || s === "team" || s === "por-definir") return true;
  if (s.startsWith("winner-")) return true;
  return false;
}

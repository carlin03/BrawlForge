import type { EsportsMatch } from "./matches";
import { getPlayer, teamName } from "./index";

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

  let quickStat = `${communityPickA}% vota ${teamName(match.teamASlug)}`;
  if (match.status === "finished" && mvpSlug) {
    const mvp = getPlayer(mvpSlug);
    quickStat = `MVP · ${mvp?.ign ?? mvpSlug}`;
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
  perfect_bonus?: number;
};

/** Reservado para predicciones avanzadas (MVP, primer mapa, etc.). */
export type MatchAdvancedPredictionsMeta = {
  mvp_player_slug?: string;
  first_map_winner?: "A" | "B";
  most_used_brawler?: string;
  match_mvp_brawler?: string;
};

export type MatchMeta = {
  importance?: MatchImportance;
  display_status?: MatchDisplayStatus;
  allow_exact_score?: boolean;
  featured_label?: string;
  round_type?: string;
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
  const p = meta.predictions ?? {};
  const advanced = p.advanced === true;
  return {
    winner: p.winner !== false,
    exact_score: p.exact_score === true || meta.allow_exact_score === true || advanced,
    mvp: p.mvp === true || advanced,
    first_map: p.first_map === true || advanced,
    decisive_map: p.decisive_map === true || advanced,
    map_winners: p.map_winners === true || advanced,
    map_brawler_picks: p.map_brawler_picks === true || advanced,
    brawler_most_used: p.brawler_most_used === true || advanced,
    brawler_mvp: p.brawler_mvp === true || advanced,
    advanced,
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
      cfg.brawler_mvp,
  );
}

export function getMatchPredictionPoints(meta: MatchMeta): MatchPredictionPoints {
  return meta.prediction_points ?? {};
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

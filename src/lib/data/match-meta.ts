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

export type MatchMeta = {
  importance?: MatchImportance;
  display_status?: MatchDisplayStatus;
  allow_exact_score?: boolean;
  featured_label?: string;
  maps?: MatchMapsMeta;
  bans?: MatchBansMeta;
  brawlers?: MatchBrawlersMeta;
  notes?: string;
};

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

export function featuredLabelFromMeta(meta: MatchMeta | undefined): string {
  if (!meta) return "Partido destacado";
  if (meta.featured_label?.trim()) return meta.featured_label.trim();
  const imp = MATCH_IMPORTANCE_OPTIONS.find((o) => o.id === meta.importance);
  return imp?.featuredLabel || "Partido destacado";
}

export function isPendingTeamSlug(slug: string | null | undefined): boolean {
  if (!slug) return true;
  const s = slug.toLowerCase();
  return s === "tbd" || s === "team" || s === "por-definir";
}

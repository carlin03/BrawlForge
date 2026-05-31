const KEY = "bf_match_predictions";

export type MapTeamPicks = { a: string[]; b: string[] };

export type MatchExtendedPrediction = {
  exactScore?: string;
  mvpPlayerSlug?: string;
  firstMapWinner?: "A" | "B";
  decisiveMapWinner?: "A" | "B";
  brawlerMostUsed?: string;
  brawlerMvp?: string;
  /** Brawler más bloqueado en el partido (predicción). */
  brawlerMostBanned?: string;
  brawlerPick?: string;
  /** Ganador por mapa (índice 0-based → A | B). */
  mapWinners?: Record<number, "A" | "B">;
  /** Picks por mapa y equipo (3 por lado). */
  mapBrawlerPicks?: Record<number, MapTeamPicks>;
  /** Bans centrales por mapa (2). */
  mapBrawlerBans?: Record<number, string[]>;
  /** Bans por equipo bajo los picks (3 + 3). */
  mapTeamBans?: Record<number, MapTeamPicks>;
  /** @deprecated Migrado a mapBrawlerBans */
  brawlerBansA?: string[];
  /** @deprecated Migrado a mapBrawlerBans */
  brawlerBansB?: string[];
};

export function normalizeMapBans(ext: MatchExtendedPrediction): Record<number, string[]> {
  return { ...(ext.mapBrawlerBans ?? {}) };
}

export function normalizeMapTeamBans(ext: MatchExtendedPrediction): Record<number, MapTeamPicks> {
  return { ...(ext.mapTeamBans ?? {}) };
}

function norm(name: string): string {
  return name.trim().toLowerCase();
}

/** Todos los bans del mapa (centrales + equipo A + equipo B). */
export function allMapBans(
  index: number,
  ext: MatchExtendedPrediction,
  matchBans: string[] = [],
): string[] {
  const central = ext.mapBrawlerBans?.[index] ?? [];
  const team = ext.mapTeamBans?.[index] ?? { a: [], b: [] };
  return [...matchBans, ...central, ...(team.a ?? []), ...(team.b ?? [])];
}

/** Brawlers que no pueden elegirse como pick en este mapa. */
export function blockedForPick(
  index: number,
  ext: MatchExtendedPrediction,
  side: "a" | "b",
  matchBans: string[] = [],
): string[] {
  const row = ext.mapBrawlerPicks?.[index];
  const otherPicks = side === "a" ? (row?.b ?? []) : (row?.a ?? []);
  return [...otherPicks, ...allMapBans(index, ext, matchBans)];
}

/** Brawlers ya usados en slot central (no repetir entre los 2). */
export function usedCentralBans(index: number, ext: MatchExtendedPrediction): string[] {
  return ext.mapBrawlerBans?.[index] ?? [];
}

/** Brawlers no válidos para ban de equipo (incluye centrales + ya elegidos en ese equipo). */
export function blockedForTeamBan(
  index: number,
  ext: MatchExtendedPrediction,
  side: "a" | "b",
): string[] {
  const central = ext.mapBrawlerBans?.[index] ?? [];
  const team = ext.mapTeamBans?.[index] ?? { a: [], b: [] };
  const sameTeam = side === "a" ? (team.a ?? []) : (team.b ?? []);
  return [...central, ...sameTeam];
}

/** @deprecated Usar helpers específicos arriba. */
export function usedBrawlersOnMap(
  index: number,
  ext: MatchExtendedPrediction,
  exclude?: "a" | "b" | "bans",
): string[] {
  const row = ext.mapBrawlerPicks?.[index];
  const central = ext.mapBrawlerBans?.[index] ?? [];
  const team = ext.mapTeamBans?.[index] ?? { a: [], b: [] };
  const names: string[] = [];
  if (exclude !== "a") names.push(...(row?.a ?? []));
  if (exclude !== "b") names.push(...(row?.b ?? []));
  if (exclude !== "bans") {
    names.push(...central, ...(team.a ?? []), ...(team.b ?? []));
  }
  return names;
}

export function isSameBrawler(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

export function readMatchPredictions(): Record<string, MatchExtendedPrediction> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MatchExtendedPrediction>;
  } catch {
    return {};
  }
}

export function getMatchPrediction(matchId: string): MatchExtendedPrediction {
  return readMatchPredictions()[matchId] ?? {};
}

export function patchMatchPrediction(
  matchId: string,
  patch: Partial<MatchExtendedPrediction>,
): MatchExtendedPrediction {
  const all = readMatchPredictions();
  const next = { ...all[matchId], ...patch };
  if (Object.keys(next).length === 0) delete all[matchId];
  else all[matchId] = next;
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}

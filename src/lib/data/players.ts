import type { Region } from "../types";
import players2026Data from "./generated/players-2026.json";
import { getGeneratedPlayers, toLiquipediaUrl, TEAM_ROSTER_ALIASES, isPlayerActive } from "./catalog";
import { CURATED_PLAYERS } from "./teams-curated";
import { teams, getTeam } from "./teams";
import { getBsc2026PlayedTeamSlugs } from "./bsc-teams-played-2026";
import { BSC_2026_ROSTERS, BSC_2026_EXCLUDED_PLAYERS, BSC_2026_PLAYER_SLUGS } from "./bsc-2026-rosters";
import type { GeneratedPlayer } from "./catalog-types";

export type PlayerStatus = "active" | "inactive" | "retired";

export interface EsportsPlayer {
  slug: string;
  ign: string;
  realName?: string;
  teamSlug: string;
  region: Region;
  role: string;
  status: PlayerStatus;
  joinDate?: string;
  liquipediaUrl?: string;
  fantasyPoints: number;
  fantasyOwnership: number;
  rating: number;
}

const KNOWN_TEAMS = getBsc2026PlayedTeamSlugs();
const PLAYERS_2026 = players2026Data as GeneratedPlayer[];

const PLAYER_BSC_TEAM = new Map<string, string>();
for (const [teamSlug, roster] of Object.entries(BSC_2026_ROSTERS)) {
  for (const slug of roster) {
    if (!PLAYER_BSC_TEAM.has(slug)) PLAYER_BSC_TEAM.set(slug, teamSlug);
  }
}

function rosterTeamForPlayer(slug: string, fallback?: string): string | undefined {
  return PLAYER_BSC_TEAM.get(slug) ?? fallback;
}

const ROSTER_TEAM_INDEX = new Map<string, string>();
for (const t of teams) {
  for (const pl of t.roster ?? []) {
    if (pl && !ROSTER_TEAM_INDEX.has(pl)) ROSTER_TEAM_INDEX.set(pl, t.slug);
  }
}

function normalizeStatus(raw?: string): PlayerStatus {
  const s = (raw ?? "Active").toLowerCase();
  if (s === "inactive") return "inactive";
  if (s === "retired") return "retired";
  return "active";
}

function normalizeSlug(slug: string, liquipediaPage: string, ign: string): string | null {
  const s = slug?.trim();
  if (s) return s;
  const fromPage = liquipediaPage
    ?.replace(/\[\[|\]\]/g, "")
    .split("|")[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (fromPage) return fromPage;
  const fromIgn = ign
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return fromIgn || null;
}

export function resolvePlayerTeamSlug(playerSlug: string, rawTeamSlug?: string): string {
  const raw = (rawTeamSlug ?? "").trim();
  if (raw && KNOWN_TEAMS.has(raw)) return raw;
  if (raw && TEAM_ROSTER_ALIASES[raw] && KNOWN_TEAMS.has(TEAM_ROSTER_ALIASES[raw])) {
    return TEAM_ROSTER_ALIASES[raw];
  }
  const fromRoster = ROSTER_TEAM_INDEX.get(playerSlug);
  if (fromRoster && KNOWN_TEAMS.has(fromRoster)) return fromRoster;
  return raw;
}

function pushPlayer(
  list: EsportsPlayer[],
  seen: Set<string>,
  raw: GeneratedPlayer & { liquipediaPage?: string },
  fallbackTeam?: string,
) {
  const slug = normalizeSlug(raw.slug, raw.liquipediaPage ?? "", raw.ign);
  if (!slug || seen.has(slug) || BSC_2026_EXCLUDED_PLAYERS.has(slug)) return;
  const curated = CURATED_PLAYERS[slug];
  const teamSlug = resolvePlayerTeamSlug(
    slug,
    curated?.teamSlug ?? rosterTeamForPlayer(slug) ?? raw.teamSlug ?? fallbackTeam,
  );
  if (!teamSlug || !KNOWN_TEAMS.has(teamSlug)) return;
  const status = normalizeStatus(raw.status);
  if (status === "retired" && !rosterTeamForPlayer(slug)) return;
  seen.add(slug);
  const base: EsportsPlayer = {
    slug,
    ign: raw.ign.replace(/<!--[\s\S]*?-->/g, "").split("\n")[0].trim(),
    realName: raw.realName,
    teamSlug,
    region: raw.region,
    role: raw.role || "Player",
    status,
    liquipediaUrl: toLiquipediaUrl(raw.liquipediaPage),
    fantasyPoints: raw.fantasyPoints ?? 70,
    fantasyOwnership: raw.fantasyOwnership ?? 20,
    rating: raw.rating ?? 1.08,
  };
  list.push(curated ? { ...base, ...curated, liquipediaUrl: base.liquipediaUrl, status: base.status } : base);
}

function buildPlayers(): EsportsPlayer[] {
  const seen = new Set<string>();
  const list: EsportsPlayer[] = [];
  const pool = [...PLAYERS_2026];

  for (const p of pool) {
    if (!BSC_2026_PLAYER_SLUGS.has(p.slug) && !rosterTeamForPlayer(p.slug)) continue;
    pushPlayer(list, seen, p);
  }

  for (const [teamSlug, roster] of Object.entries(BSC_2026_ROSTERS)) {
    if (!KNOWN_TEAMS.has(teamSlug)) continue;
    for (const pl of roster) {
      const existing = pool.find((x) => x.slug === pl) ?? getGeneratedPlayers().find((x) => x.slug === pl);
      if (existing) {
        pushPlayer(list, seen, existing, teamSlug);
      } else {
        pushPlayer(
          list,
          seen,
          {
            slug: pl,
            ign: pl.replace(/-/g, " "),
            teamSlug,
            region: teams.find((t) => t.slug === teamSlug)?.region ?? "GLOBAL",
            role: "Player",
            status: "Active",
            liquipediaPage: pl.replace(/-/g, "_"),
            fantasyPoints: 70,
            fantasyOwnership: 15,
            rating: 1.06,
          },
          teamSlug,
        );
      }
    }
  }

  for (const t of teams) {
    if (!KNOWN_TEAMS.has(t.slug)) continue;
    for (const pl of t.roster ?? []) {
      const existing = pool.find((x) => x.slug === pl) ?? getGeneratedPlayers().find((x) => x.slug === pl);
      if (existing) {
        pushPlayer(list, seen, existing, t.slug);
      } else {
        pushPlayer(
          list,
          seen,
          {
            slug: pl,
            ign: pl.replace(/-/g, " "),
            teamSlug: t.slug,
            region: t.region,
            role: "Player",
            status: "Active",
            liquipediaPage: pl.replace(/-/g, "_"),
            fantasyPoints: 70,
            fantasyOwnership: 15,
            rating: 1.06,
          },
          t.slug,
        );
      }
    }
  }

  return list.sort((a, b) => {
    const sa = a.status === "active" ? 0 : a.status === "inactive" ? 1 : 2;
    const sb = b.status === "active" ? 0 : b.status === "inactive" ? 1 : 2;
    if (sa !== sb) return sa - sb;
    return b.fantasyPoints - a.fantasyPoints;
  });
}

export const players: EsportsPlayer[] = buildPlayers();

export function getPlayer(slug: string): EsportsPlayer | undefined {
  return players.find((p) => p.slug === slug);
}

export function getPlayersByTeam(teamSlug: string): EsportsPlayer[] {
  const resolved = resolvePlayerTeamSlug("", teamSlug) || teamSlug;
  const rosterSlugs = new Set((getTeam(resolved) ?? getTeam(teamSlug))?.roster ?? []);
  return players.filter(
    (p) =>
      p.teamSlug === resolved ||
      p.teamSlug === teamSlug ||
      ROSTER_TEAM_INDEX.get(p.slug) === resolved ||
      rosterSlugs.has(p.slug),
  );
}

export function getPlayerTeam(playerSlug: string) {
  const p = getPlayer(playerSlug);
  if (!p?.teamSlug) return undefined;
  return getTeam(p.teamSlug);
}

export function getActivePlayers(): EsportsPlayer[] {
  return players.filter((p) => p.status === "active");
}

export function getPlayersWithTeam(): EsportsPlayer[] {
  return players.filter((p) => p.teamSlug && KNOWN_TEAMS.has(p.teamSlug));
}

export function getTopFantasyPlayers(limit = 5): EsportsPlayer[] {
  return [...players].sort((a, b) => b.fantasyPoints - a.fantasyPoints).slice(0, limit);
}

export function getTopActivePlayers(limit = 5): EsportsPlayer[] {
  return getActivePlayers()
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, limit);
}

export function searchPlayers(query: string, limit = 80): EsportsPlayer[] {
  const q = query.trim().toLowerCase();
  if (!q) return players.slice(0, limit);
  return players
    .filter(
      (p) =>
        p.ign.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.realName?.toLowerCase().includes(q) ||
        getTeam(p.teamSlug)?.name.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function getTeamsWithPlayers(): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of players) {
    if (!p.teamSlug || !KNOWN_TEAMS.has(p.teamSlug)) continue;
    counts.set(p.teamSlug, (counts.get(p.teamSlug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

export { isPlayerActive };

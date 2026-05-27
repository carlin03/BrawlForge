import type { Region } from "../types";
import { getGeneratedPlayers, getGeneratedTeams, toLiquipediaUrl, isPlayerActive, TEAM_ROSTER_ALIASES } from "./catalog";
import { CURATED_PLAYERS } from "./teams-curated";
import { teams, getTeam } from "./teams";

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

const KNOWN_TEAMS = new Set(getGeneratedTeams().map((t) => t.slug));

/** jugador → equipo según roster Liquipedia */
const ROSTER_TEAM_INDEX = new Map<string, string>();
for (const t of getGeneratedTeams()) {
  for (const pl of t.roster ?? []) {
    if (pl && !ROSTER_TEAM_INDEX.has(pl)) ROSTER_TEAM_INDEX.set(pl, t.slug);
  }
}
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

function buildPlayers(): EsportsPlayer[] {
  const seen = new Set<string>();
  const list: EsportsPlayer[] = [];

  for (const p of getGeneratedPlayers()) {
    const slug = normalizeSlug(p.slug, p.liquipediaPage, p.ign);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const curated = CURATED_PLAYERS[slug];
    const teamSlug = resolvePlayerTeamSlug(slug, curated?.teamSlug ?? p.teamSlug);
    const status = normalizeStatus(p.status);

    const base: EsportsPlayer = {
      slug,
      ign: p.ign.replace(/<!--[\s\S]*?-->/g, "").split("\n")[0].trim(),
      realName: p.realName,
      teamSlug,
      region: p.region,
      role: p.role || "Player",
      status,
      liquipediaUrl: toLiquipediaUrl(p.liquipediaPage),
      fantasyPoints: p.fantasyPoints,
      fantasyOwnership: p.fantasyOwnership,
      rating: p.rating,
    };
    list.push(curated ? { ...base, ...curated, liquipediaUrl: base.liquipediaUrl, status: base.status } : base);
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
  return players.filter(
    (p) => p.teamSlug === resolved || p.teamSlug === teamSlug || ROSTER_TEAM_INDEX.get(p.slug) === resolved,
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

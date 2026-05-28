import type { Region } from "../types";
import allTeams from "./generated/teams.json";
import allPlayers from "./generated/players.json";
import allTournaments from "./generated/tournaments.json";
import catalogMeta from "./generated/catalog.json";
import tournaments2026 from "./generated/tournaments-2026.json";
import players2026 from "./generated/players-2026.json";
import matches2026 from "./generated/matches-2026.json";
import type { GeneratedTeam, GeneratedPlayer, GeneratedTournament } from "./catalog-types";
import { MAX_DISPLAY_TIER } from "../app-config";
import { isTeam2026, TEAMS_2026_SLUGS } from "./teams-2026";

export type { GeneratedTeam, GeneratedPlayer, GeneratedTournament };

/** Mismo org, slug distinto en Liquipedia vs plantilla */
export const TEAM_ROSTER_ALIASES: Record<string, string> = {
  "bc-gaming-sa": "bc-gaming",
  "tribe-gaming-eu": "tribe-gaming",
  "skcalalas-ea": "skcalalas",
  "skcalalas-na": "skcalalas",
  "only-realm-na": "only-realm",
  "zeta-division-one": "zeta-division",
  "zeta-division-zero": "zeta-division",
  "oddyssey-eu": "oddyssey",
  oddyssey: "oddyssey",
};

const KNOWN_TEAM_SLUGS = new Set((allTeams as GeneratedTeam[]).map((t) => t.slug));
const INVALID_PARTICIPANT = new Set(["tbd", "team", ""]);

/** Normaliza slugs rotos del enrich (teamfoo → foo) */
export function normalizeParticipantSlug(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s || INVALID_PARTICIPANT.has(s)) return null;
  if (KNOWN_TEAM_SLUGS.has(s)) return s;

  const stripped = s.replace(/^team/, "");
  if (KNOWN_TEAM_SLUGS.has(stripped)) return stripped;

  for (const [alias, canonical] of Object.entries(TEAM_ROSTER_ALIASES)) {
    if (s === alias && KNOWN_TEAM_SLUGS.has(canonical)) return alias;
  }

  for (const slug of KNOWN_TEAM_SLUGS) {
    if (s === slug || s.endsWith(slug) || slug.endsWith(stripped)) return slug;
  }
  return null;
}

export function normalizeParticipantList(raw: string[]): string[] {
  const out: string[] = [];
  for (const r of raw) {
    const n = normalizeParticipantSlug(r);
    if (n && !out.includes(n)) out.push(n);
  }
  return out;
}

export interface GeneratedMatch {
  id: string;
  teamASlug: string;
  teamBSlug: string;
  scoreA: number;
  scoreB: number;
  tournamentSlug: string;
  stage: string;
  date: string;
  status: "live" | "upcoming" | "finished";
  region: Region;
  format: string;
}

export interface GeneratedTournament2026 extends GeneratedTournament {
  participantSlugs?: string[];
}

const is2026 = (d: string) => Boolean(d && d.startsWith("2026"));

export const catalogSyncedAt: string | null = catalogMeta.syncedAt ?? null;
const isActiveStatus = (status?: string) => {
  const s = (status ?? "Active").toLowerCase();
  return s !== "inactive" && s !== "retired";
};

export const CATALOG_STATS = {
  teams: TEAMS_2026_SLUGS.size,
  players: (players2026 as GeneratedPlayer[]).length,
  playersActive: (players2026 as GeneratedPlayer[]).filter((p) => isActiveStatus(p.status)).length,
  tournaments2026:
    (tournaments2026 as GeneratedTournament2026[]).length ||
    (allTournaments as GeneratedTournament[]).filter((t) => is2026(t.startDate) || is2026(t.endDate)).length,
};

/** Todos los equipos Liquipedia (201+) */
export function getGeneratedTeams(): GeneratedTeam[] {
  return allTeams as GeneratedTeam[];
}

/** Catálogo completo — 486 jugadores Liquipedia */
export function getGeneratedPlayers(): GeneratedPlayer[] {
  return (allPlayers as GeneratedPlayer[]).sort((a, b) => {
    const aa = isActiveStatus(a.status) ? 0 : 1;
    const bb = isActiveStatus(b.status) ? 0 : 1;
    if (aa !== bb) return aa - bb;
    return b.fantasyPoints - a.fantasyPoints;
  });
}

export function isPlayerActive(slug: string): boolean {
  const p = (allPlayers as GeneratedPlayer[]).find((x) => x.slug === slug);
  return p ? isActiveStatus(p.status) : false;
}

/** Torneos 2026 con participantes enriquecidos */
export function getGeneratedTournaments(): GeneratedTournament2026[] {
  if (Array.isArray(tournaments2026) && tournaments2026.length > 0) {
    return tournaments2026 as GeneratedTournament2026[];
  }
  return (allTournaments as GeneratedTournament[]).filter(
    (t) => is2026(t.startDate) || is2026(t.endDate),
  ) as GeneratedTournament2026[];
}

export function getGeneratedMatches(): GeneratedMatch[] {
  return Array.isArray(matches2026) ? (matches2026 as GeneratedMatch[]) : [];
}

export function toLiquipediaUrl(page: string): string {
  return `https://liquipedia.net/brawlstars/${page.replace(/ /g, "_")}`;
}

export const LIQUIPEDIA_TIER = { S: 1, A: 2, B: 3, C: 4 } as const;

/** Tier B and above (S / A / B) */
export function isTierBPlus(t: { tier?: number }): boolean {
  return t.tier != null && t.tier <= MAX_DISPLAY_TIER;
}

export function tierLabel(tier?: number): string {
  switch (tier) {
    case 1:
      return "S-Tier";
    case 2:
      return "A-Tier";
    case 3:
      return "B-Tier";
    case 4:
      return "C-Tier";
    default:
      return "Circuito";
  }
}

export function tierBadgeClass(tier?: number): string {
  switch (tier) {
    case 1:
      return "bf-tier-s";
    case 2:
      return "bf-tier-a";
    case 3:
      return "bf-tier-b";
    default:
      return "bf-tier-c";
  }
}

const BSC_CORE_SLUGS = [
  "crazy-raccoon",
  "sk-gaming",
  "team-heretics",
  "fut-esports",
  "tribe-gaming",
  "loud",
  "zeta-division",
  "hmble",
  "spacestation-gaming",
  "natus-vincere",
  "revenant-xspark",
  "totem-esports",
  "stmn-esports",
  "novo-esports",
  "papara-supermassive",
  "toxic-lotus",
  "bc-gaming-sa",
  "qlash",
  "skcalalas",
];

export { getCompetitiveTeamSlugs } from "./bsc-teams-played-2026";

export function isFeaturedTournament(t: GeneratedTournament): boolean {
  const n = `${t.name} ${t.shortName} ${t.liquipediaPage}`.toLowerCase();
  if (isTierBPlus(t)) return true;
  const prizeNum = parseInt(t.prizePool.replace(/\D/g, ""), 10) || 0;
  return (
    /bsc|brawl cup|world finals|challengers|supremacy|labs|liga argentina|smcy|esports kings|nfa|bsen/.test(n) ||
    prizeNum >= 5000
  );
}

export function sortTournaments(list: GeneratedTournament[]): GeneratedTournament[] {
  const statusOrder: Record<GeneratedTournament["status"], number> = { live: 0, upcoming: 1, finished: 2 };
  return [...list].sort((a, b) => {
    const sa = statusOrder[a.status] - statusOrder[b.status];
    if (sa !== 0) return sa;
    if (a.status === "finished") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}

export function getTournamentParticipants(slug: string): string[] {
  const raw = getTournamentParticipantsRaw(slug);
  return normalizeParticipantList(raw);
}

function getTournamentParticipantsRaw(slug: string): string[] {
  const t = getGeneratedTournaments().find((x) => x.slug === slug);
  return t?.participantSlugs ?? [];
}

export function getTournamentLogoFile(slug: string): string | null {
  const t = getGeneratedTournaments().find((x) => x.slug === slug);
  return t?.logoFile ?? null;
}

/** Alias slug → canonical Liquipedia slug */
export const TOURNAMENT_SLUG_ALIASES: Record<string, string> = {
  "bsc-2026-brawl-cup": "brawl-stars-championship-2026-brawl-cup",
  "bsc-2026-s3-emea-mf": "bsc-2026-april-emea-mf",
  "bsc-2026-s3-ea-mf": "bsc-2026-april-ea-mf",
  "bsc-2026-s3-na-mf": "bsc-2026-april-na-mf",
};

export function resolveTournamentSlug(slug: string): string {
  return TOURNAMENT_SLUG_ALIASES[slug] ?? slug;
}

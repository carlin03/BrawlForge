import type { EsportsPlayer } from "@/lib/data/players";
import type { EsportsTeam } from "@/lib/data/teams";
import { getPlayer } from "@/lib/data/players";
import { getTeam } from "@/lib/data/teams";
import type { CatalogPlayerRow, CatalogTeamRow, CatalogMarketRow, CatalogTournamentRow } from "@/lib/supabase/catalog-types";
import type { EsportsTournament } from "@/lib/data/matches";
import { getTournament } from "@/lib/data/matches";
import type { Region } from "@/lib/types";
import { parseAchievements } from "@/lib/data/profile-wiki";
import { sanitizePublicText, sanitizeSocialRecord } from "@/lib/sanitize-liquipedia";

export type PlayerExtras = {
  bio: string | null;
  country: string | null;
  nationality: string | null;
  photoUrl: string | null;
  joinDate?: string;
  isCaptain: boolean;
  previousTeams: string[];
  primaryBrawler: string | null;
  social: Record<string, unknown>;
  meta: Record<string, unknown>;
};

export type TeamExtras = {
  description: string | null;
  circuitSummary: string | null;
  coach: string | null;
  foundedYear: number | null;
  social: Record<string, unknown>;
  meta: Record<string, unknown>;
  logoUrl: string | null;
};

export function mergeCatalogPlayer(
  local: EsportsPlayer | undefined,
  row: CatalogPlayerRow | undefined,
): (EsportsPlayer & PlayerExtras) | undefined {
  if (!local && !row) return undefined;
  const base: EsportsPlayer = local ?? {
    slug: row!.slug,
    ign: row!.ign,
    realName: row!.real_name ?? undefined,
    teamSlug: row!.team_slug ?? "",
    region: (row!.region as Region) || "GLOBAL",
    role: row!.role,
    status: (row!.status as EsportsPlayer["status"]) || "active",
    fantasyPoints: row!.fantasy_points,
    fantasyOwnership: row!.fantasy_ownership,
    rating: Number(row!.rating),
  };
  if (!row) {
    return {
      ...base,
      bio: null,
      country: null,
      nationality: null,
      photoUrl: null,
      joinDate: base.joinDate,
      isCaptain: false,
      previousTeams: [],
      primaryBrawler: null,
      social: {},
      meta: {},
    };
  }
  const rowExtra = row as CatalogPlayerRow & {
    is_captain?: boolean;
    previous_teams?: string[];
    primary_brawler?: string | null;
  };
  const photoFromMeta =
    typeof row.meta?.photo_url === "string" && row.meta.photo_url.trim()
      ? row.meta.photo_url.trim()
      : null;
  const photoUrl = row.photo_url?.trim() || photoFromMeta || null;
  return {
    ...base,
    ign: sanitizePublicText(row.ign) || base.ign,
    realName: row.real_name ?? base.realName,
    teamSlug: row.team_slug ?? base.teamSlug,
    region: (row.region as Region) || base.region,
    role: row.role || base.role,
    status: (row.status as EsportsPlayer["status"]) || base.status,
    fantasyPoints: row.fantasy_points ?? base.fantasyPoints,
    fantasyOwnership: row.fantasy_ownership ?? base.fantasyOwnership,
    rating: Number(row.rating ?? base.rating),
    bio: sanitizePublicText(row.bio),
    nationality: row.nationality?.trim() || row.country?.trim() || null,
    country: row.country?.trim() || row.nationality?.trim() || null,
    photoUrl,
    joinDate: row.join_date ?? base.joinDate,
    isCaptain: Boolean(rowExtra.is_captain),
    previousTeams: Array.isArray(rowExtra.previous_teams) ? rowExtra.previous_teams : [],
    primaryBrawler: rowExtra.primary_brawler ?? null,
    social: sanitizeSocialRecord((row.social ?? {}) as Record<string, unknown>),
    meta: row.meta ?? {},
  };
}

export function mergeCatalogTeam(
  local: EsportsTeam | undefined,
  row: CatalogTeamRow | undefined,
): (EsportsTeam & TeamExtras) | undefined {
  if (!local && !row) return undefined;
  const base: EsportsTeam = local ?? {
    slug: row!.slug,
    name: row!.name,
    tag: row!.tag,
    region: (row!.region as Region) || "GLOBAL",
    country: row!.country ?? "",
    earnings: Number(row!.earnings),
    rank: row!.rank ?? 0,
    rankChange: row!.rank_change ?? 0,
    form: (row!.form ?? []).filter((f): f is "W" | "L" => f === "W" || f === "L"),
    roster: row!.roster_slugs ?? [],
    achievements: [],
  };
  if (!row) {
    return {
      ...base,
      description: null,
      circuitSummary: null,
      coach: null,
      foundedYear: null,
      social: {},
      meta: {},
      logoUrl: null,
    };
  }
  const form = (row.form ?? []).filter((f): f is "W" | "L" => f === "W" || f === "L");
  const dbAchievements = parseAchievements(row.achievements);
  return {
    ...base,
    name: row.name || base.name,
    tag: row.tag || base.tag,
    region: (row.region as Region) || base.region,
    country: row.country ?? base.country,
    earnings: Number(row.earnings ?? base.earnings),
    rank: row.rank ?? base.rank,
    rankChange: row.rank_change ?? base.rankChange,
    form: form.length ? form : base.form,
    roster: row.roster_slugs?.length ? row.roster_slugs : base.roster,
    achievements: dbAchievements.length ? dbAchievements : base.achievements,
    description: sanitizePublicText(row.description),
    circuitSummary: sanitizePublicText(row.circuit_summary),
    coach: row.coach ?? (typeof row.meta?.coach === "string" ? row.meta.coach : null),
    foundedYear: row.founded_year ?? null,
    social: sanitizeSocialRecord((row.social ?? {}) as Record<string, unknown>),
    meta: row.meta ?? {},
    logoUrl: row.logo_url,
  };
}

export function resolvePlayer(slug: string, row?: CatalogPlayerRow): (EsportsPlayer & PlayerExtras) | undefined {
  return mergeCatalogPlayer(getPlayer(slug), row);
}

export function resolveTeam(slug: string, row?: CatalogTeamRow): (EsportsTeam & TeamExtras) | undefined {
  return mergeCatalogTeam(getTeam(slug), row);
}

const TOUR_STATUSES = new Set(["live", "upcoming", "finished"]);

export function mergeCatalogTournament(
  local: EsportsTournament | undefined,
  row: CatalogTournamentRow | undefined,
): EsportsTournament | undefined {
  if (!local && !row) return undefined;
  const base: EsportsTournament = local ?? {
    slug: row!.slug,
    name: row!.name,
    shortName: row!.short_name?.trim() || row!.name,
    region: (row!.region as EsportsTournament["region"]) || "GLOBAL",
    prizePool: row!.prize_pool?.trim() || "TBA",
    teams: row!.teams_count || row!.participant_slugs?.length || 0,
    status: TOUR_STATUSES.has(row!.status) ? (row!.status as EsportsTournament["status"]) : "upcoming",
    startDate: row!.start_date?.trim() || "",
    endDate: row!.end_date?.trim() || row!.start_date?.trim() || "",
    location: row!.location?.trim() || "Online",
    stage: row!.stage?.trim() || "",
    tier: row!.tier ?? undefined,
    participantSlugs: row!.participant_slugs ?? [],
    logoFile: row!.logo_file ?? null,
    featured: row!.tier != null ? row!.tier <= 3 : true,
  };
  if (!row) return base;
  const status = TOUR_STATUSES.has(row.status) ? (row.status as EsportsTournament["status"]) : base.status;
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  return {
    ...base,
    name: row.name?.trim() || base.name,
    shortName: row.short_name?.trim() || base.shortName,
    region: (row.region as EsportsTournament["region"]) || base.region,
    prizePool: row.prize_pool?.trim() || base.prizePool,
    teams: row.teams_count || row.participant_slugs?.length || base.teams,
    status,
    startDate: row.start_date?.trim() || base.startDate,
    endDate: row.end_date?.trim() || row.start_date?.trim() || base.endDate,
    location: row.location?.trim() || base.location,
    stage: row.stage?.trim() || base.stage,
    tier: row.tier ?? base.tier,
    participantSlugs: row.participant_slugs?.length ? row.participant_slugs : base.participantSlugs,
    logoFile: row.logo_file ?? base.logoFile,
    featured: row.tier != null ? row.tier <= 3 : base.featured,
    organizer: (meta.organizer as string) || base.organizer,
    venue: (meta.venue as string) || base.venue,
    eventType: (meta.event_type as string) || base.eventType,
    series: (meta.series as string) || base.series,
    website: (meta.website as string) || base.website,
    format: (meta.format as string) || base.format,
    prizeBreakdown: Array.isArray(meta.prize_breakdown)
      ? (meta.prize_breakdown as { place: string; prize: string }[])
      : base.prizeBreakdown,
    winnerSlug: (meta.winner_slug as string) || base.winnerSlug,
  };
}

export function resolveTournament(slug: string, row?: CatalogTournamentRow): EsportsTournament | undefined {
  return mergeCatalogTournament(getTournament(slug), row);
}

export function marketKey(tournament: string, playerSlug: string): string {
  return `${tournament}:${playerSlug}`;
}

export function buildMarketMap(rows: CatalogMarketRow[]): Map<string, CatalogMarketRow> {
  const m = new Map<string, CatalogMarketRow>();
  for (const r of rows) m.set(marketKey(r.tournament_slug, r.player_slug), r);
  return m;
}

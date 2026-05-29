import type { EsportsPlayer } from "@/lib/data/players";
import type { EsportsTeam } from "@/lib/data/teams";
import { getPlayer } from "@/lib/data/players";
import { getTeam } from "@/lib/data/teams";
import type { CatalogPlayerRow, CatalogTeamRow, CatalogMarketRow } from "@/lib/supabase/catalog-types";
import type { Region } from "@/lib/types";
import { parseAchievements } from "@/lib/data/profile-wiki";

export type PlayerExtras = {
  bio: string | null;
  country: string | null;
  photoUrl: string | null;
  joinDate?: string;
  liquipediaUrl?: string;
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
      photoUrl: null,
      joinDate: base.joinDate,
      liquipediaUrl: base.liquipediaUrl,
      isCaptain: false,
      previousTeams: [],
      primaryBrawler: null,
      social: {},
      meta: {},
    };
  }
  const rowExtra = row as CatalogPlayerRow & {
    liquipedia_url?: string | null;
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
    ign: row.ign || base.ign,
    realName: row.real_name ?? base.realName,
    teamSlug: row.team_slug ?? base.teamSlug,
    region: (row.region as Region) || base.region,
    role: row.role || base.role,
    status: (row.status as EsportsPlayer["status"]) || base.status,
    fantasyPoints: row.fantasy_points ?? base.fantasyPoints,
    fantasyOwnership: row.fantasy_ownership ?? base.fantasyOwnership,
    rating: Number(row.rating ?? base.rating),
    bio: row.bio,
    country: row.country,
    photoUrl,
    joinDate: row.join_date ?? base.joinDate,
    liquipediaUrl:
      rowExtra.liquipedia_url ??
      (row.liquipedia_page
        ? `https://liquipedia.net/brawlstars/${row.liquipedia_page.replace(/ /g, "_")}`
        : undefined) ??
      base.liquipediaUrl,
    isCaptain: Boolean(rowExtra.is_captain),
    previousTeams: Array.isArray(rowExtra.previous_teams) ? rowExtra.previous_teams : [],
    primaryBrawler: rowExtra.primary_brawler ?? null,
    social: row.social ?? {},
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
    liquipediaUrl: "",
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
    description: row.description,
    circuitSummary: row.circuit_summary ?? null,
    coach: row.coach ?? (typeof row.meta?.coach === "string" ? row.meta.coach : null),
    foundedYear: row.founded_year ?? null,
    social: row.social ?? {},
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

export function marketKey(tournament: string, playerSlug: string): string {
  return `${tournament}:${playerSlug}`;
}

export function buildMarketMap(rows: CatalogMarketRow[]): Map<string, CatalogMarketRow> {
  const m = new Map<string, CatalogMarketRow>();
  for (const r of rows) m.set(marketKey(r.tournament_slug, r.player_slug), r);
  return m;
}

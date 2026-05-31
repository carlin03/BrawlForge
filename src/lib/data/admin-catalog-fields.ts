/** Campos extra del catálogo Supabase (admin + CSV). */

import type { SocialLinks, WikiAchievement } from "./profile-wiki";
import { parseTeamSponsors, type TeamSponsorEntry } from "./team-page-stats";

export type AdminTeamCatalogRow = {
  slug: string;
  name: string;
  tag: string;
  region: string;
  country: string;
  earnings: number;
  rank: number | null;
  rank_change: number;
  form: string[];
  roster_slugs: string[];
  logo_url: string | null;
  description: string | null;
  coach?: string | null;
  manager?: string | null;
  captain_slug?: string | null;
  peak_rank?: number | null;
  founded_year?: number | null;
  headquarters?: string | null;
  website?: string | null;
  liquipedia_url?: string | null;
  circuit_status?: string;
  bsc_qualified_2026?: boolean;
  circuit_summary?: string | null;
  achievements: WikiAchievement[];
  sponsors_json?: TeamSponsorEntry[];
  social: SocialLinks;
  meta: Record<string, unknown>;
};

export type AdminPlayerCatalogRow = {
  slug: string;
  ign: string;
  real_name: string | null;
  team_slug: string | null;
  region: string;
  role: string;
  status: string;
  fantasy_points: number;
  fantasy_ownership: number;
  rating: number;
  bio: string | null;
  photo_url: string | null;
  country?: string | null;
  nationality?: string | null;
  join_date?: string | null;
  primary_brawler?: string | null;
  secondary_brawler?: string | null;
  is_captain?: boolean;
  previous_teams?: string[];
  social: SocialLinks;
  meta: Record<string, unknown>;
};

export function pickTeamFromDb(row: Record<string, unknown>): Partial<AdminTeamCatalogRow> {
  return {
    coach: row.coach ? String(row.coach) : null,
    manager: row.manager ? String(row.manager) : null,
    captain_slug: row.captain_slug ? String(row.captain_slug) : null,
    peak_rank: row.peak_rank != null ? Number(row.peak_rank) : null,
    founded_year: row.founded_year != null ? Number(row.founded_year) : null,
    headquarters: row.headquarters ? String(row.headquarters) : null,
    website: row.website ? String(row.website) : null,
    liquipedia_url: row.liquipedia_url ? String(row.liquipedia_url) : null,
    circuit_status: row.circuit_status ? String(row.circuit_status) : "active",
    bsc_qualified_2026: row.bsc_qualified_2026 !== false,
    circuit_summary: row.circuit_summary ? String(row.circuit_summary) : null,
    sponsors_json: parseTeamSponsors(row.sponsors_json),
  };
}

export function pickPlayerFromDb(row: Record<string, unknown>): Partial<AdminPlayerCatalogRow> {
  const prev = row.previous_teams;
  return {
    country: row.country ? String(row.country) : null,
    nationality: row.nationality ? String(row.nationality) : null,
    join_date: row.join_date ? String(row.join_date) : null,
    primary_brawler: row.primary_brawler ? String(row.primary_brawler) : null,
    secondary_brawler: row.secondary_brawler ? String(row.secondary_brawler) : null,
    is_captain: Boolean(row.is_captain),
    previous_teams: Array.isArray(prev)
      ? (prev as string[])
      : String(row.previous_teams ?? "")
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean),
  };
}

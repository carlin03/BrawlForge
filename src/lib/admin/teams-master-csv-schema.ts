/** Esquema Teams Master CSV v2 (+ alias v1). */

export const TEAM_MASTER_SCHEMA_VERSION = "teams-master-v2";

export const TEAM_MASTER_V2_COLUMNS = [
  "slug",
  "name",
  "tag",
  "region",
  "country",
  "global_rank",
  "rank_change",
  "earnings",
  "form",
  "phase_tagline",
  "circuit_summary",
  "coach",
  "manager",
  "ceo",
  "founded_year",
  "headquarters",
  "status",
  "bsc_qualified",
  "main_description",
  "club_slogan",
  "history_content",
  "fun_facts",
  "historic_rivals",
  "roster_slugs",
  "captain_slug",
  "trophies_json",
  "sponsors_json",
  "twitter_url",
  "youtube_url",
  "twitch_url",
  "discord_url",
  "instagram_url",
  "tiktok_url",
  "website_url",
  "logo_url",
  "banner_url",
  "gallery_urls",
  "card_theme_json",
  "peak_rank",
  "aliases",
  "wiki_url",
  "liquipedia_slug",
  "source_notes",
] as const;

export type TeamMasterV2Column = (typeof TEAM_MASTER_V2_COLUMNS)[number];

export const TEAM_MASTER_V2_HEADER = TEAM_MASTER_V2_COLUMNS.join(",");

/** Columnas del CSV v1 (sigue soportado). */
export const TEAM_MASTER_V1_COLUMNS = [
  "slug",
  "name",
  "tag",
  "region",
  "country",
  "global_rank",
  "earnings",
  "phase_tagline",
  "circuit_summary",
  "coach",
  "founded_year",
  "city",
  "status",
  "main_description",
  "club_slogan",
  "history_content",
  "fun_facts",
  "historic_rivals",
  "roster_slugs",
  "trophies_json",
  "twitter_url",
  "youtube_url",
  "twitch_url",
  "discord_url",
  "instagram_url",
  "tiktok_url",
  "website_url",
  "logo_url",
  "banner_url",
  "gallery_urls",
] as const;

/** Alias v1 → clave canónica v2. */
export const TEAM_MASTER_CSV_ALIASES: Record<string, TeamMasterV2Column | "global_rank" | "headquarters" | "bsc_qualified"> = {
  city: "headquarters",
  rank: "global_rank",
  bsc_qualified_2026: "bsc_qualified",
};

export const TEAM_REGIONS = ["GLOBAL", "EMEA", "EA", "NA", "SA", "CN"] as const;
export const TEAM_STATUSES = ["active", "inactive", "disbanded"] as const;

export function detectTeamsMasterSchema(headers: string[]): "v2" | "v1" | "unknown" {
  const set = new Set(headers.map((h) => h.trim().toLowerCase()));
  if (set.has("manager") || set.has("captain_slug") || set.has("sponsors_json")) return "v2";
  if (set.has("slug") && set.has("name") && (set.has("headquarters") || set.has("city"))) return "v1";
  if (set.has("slug") && set.has("name")) return "v1";
  return "unknown";
}

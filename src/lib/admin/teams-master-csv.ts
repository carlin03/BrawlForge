import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";
import {
  parseAchievements,
  parseSocial,
  parseTeamMeta,
  type TeamProfileMeta,
  type WikiAchievement,
  type WikiSection,
} from "@/lib/data/profile-wiki";
import { csvToObjects } from "@/lib/admin/catalog-csv";

function escCsv(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function splitPipeList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function jsonCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value) && !Object.keys(value as object).length) {
    return "";
  }
  if (Array.isArray(value) && !value.length) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export const TEAM_MASTER_CSV_COLUMNS = [
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

export const TEAM_MASTER_CSV_HEADER = TEAM_MASTER_CSV_COLUMNS.join(",");

/** Serializa secciones wiki → columna history_content (soporta textos largos con comillas CSV). */
export function serializeWikiSectionsToHistory(sections: WikiSection[] | undefined): string {
  if (!sections?.length) return "";
  return sections
    .map((s) => {
      const title = s.title?.trim() || "Historia";
      const body = (s.paragraphs ?? []).map((p) => p.trim()).filter(Boolean).join("\n\n");
      return body ? `## ${title}\n\n${body}` : `## ${title}`;
    })
    .join("\n\n---\n\n");
}

/** history_content → wiki_sections para pestaña Historia. */
export function parseHistoryContentToWikiSections(raw: string, slug: string): WikiSection[] {
  const text = raw.trim();
  if (!text) return [];

  const blocks = text.includes("\n\n---\n\n") ? text.split("\n\n---\n\n") : [text];
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    let title = "Historia";
    let body = trimmed;
    if (trimmed.startsWith("## ")) {
      const nl = trimmed.indexOf("\n");
      if (nl === -1) {
        title = trimmed.slice(3).trim() || title;
        body = "";
      } else {
        title = trimmed.slice(3, nl).trim() || title;
        body = trimmed.slice(nl + 1).trim();
      }
    }
    const paragraphs = body
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return {
      id: `sec-${slug}-${i}`,
      title,
      paragraphs: paragraphs.length ? paragraphs : [""],
    };
  });
}

function parseTrophiesJson(raw: string | undefined): WikiAchievement[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseAchievements(parsed);
  } catch {
    return [];
  }
}

export function teamToMasterCsvLine(team: AdminTeamCatalogRow): string {
  const profile = parseTeamMeta(team.meta);
  const social = parseSocial(team.social);

  return [
    team.slug,
    team.name,
    team.tag,
    team.region,
    team.country ?? "",
    team.rank ?? "",
    team.earnings ?? 0,
    profile.tagline ?? "",
    team.circuit_summary ?? "",
    team.coach ?? "",
    team.founded_year ?? "",
    team.headquarters ?? "",
    team.circuit_status ?? "active",
    team.description ?? "",
    profile.motto ?? "",
    serializeWikiSectionsToHistory(profile.wiki_sections),
    (profile.fun_facts ?? []).join("|"),
    (profile.rivals ?? []).join("|"),
    (team.roster_slugs ?? []).join("|"),
    jsonCell(team.achievements),
    social.twitter ?? "",
    social.youtube ?? "",
    social.twitch ?? "",
    social.discord ?? "",
    social.instagram ?? "",
    social.tiktok ?? "",
    social.website ?? team.website ?? "",
    team.logo_url ?? "",
    profile.banner_url ?? "",
    (profile.gallery_urls ?? []).join("|"),
  ]
    .map(escCsv)
    .join(",");
}

export function buildTeamsMasterCsv(teams: AdminTeamCatalogRow[]): string {
  const lines = [
    "# Equipos maestro — BrawlForge Admin (una fila = todas las pestañas del editor)",
    TEAM_MASTER_CSV_HEADER,
    ...teams.map(teamToMasterCsvLine),
  ];
  return `${lines.join("\n")}\n`;
}

/** Fila CSV maestro → payload listo para upsert (reemplaza por slug). */
export function masterCsvObjectToAdminRecord(o: Record<string, string>): Record<string, unknown> {
  const slug = String(o.slug ?? "")
    .trim()
    .toLowerCase();
  const profile: TeamProfileMeta = {
    tagline: o.phase_tagline?.trim() || undefined,
    motto: o.club_slogan?.trim() || undefined,
    banner_url: o.banner_url?.trim() || undefined,
    gallery_urls: splitPipeList(o.gallery_urls),
    wiki_sections: parseHistoryContentToWikiSections(o.history_content ?? "", slug),
    fun_facts: splitPipeList(o.fun_facts),
    rivals: splitPipeList(o.historic_rivals),
  };

  const social = {
    twitter: o.twitter_url?.trim() || undefined,
    youtube: o.youtube_url?.trim() || undefined,
    twitch: o.twitch_url?.trim() || undefined,
    discord: o.discord_url?.trim() || undefined,
    instagram: o.instagram_url?.trim() || undefined,
    tiktok: o.tiktok_url?.trim() || undefined,
    website: o.website_url?.trim() || undefined,
  };

  const rankRaw = o.global_rank?.trim();
  const foundedRaw = o.founded_year?.trim();

  return {
    slug,
    name: o.name?.trim() || slug,
    tag: o.tag?.trim() || "",
    region: o.region?.trim() || "GLOBAL",
    country: o.country?.trim() || "",
    earnings: Number(o.earnings || 0) || 0,
    rank: rankRaw ? Number(rankRaw) : null,
    rank_change: 0,
    form: [],
    roster_slugs: splitPipeList(o.roster_slugs),
    logo_url: o.logo_url?.trim() || null,
    description: o.main_description?.trim() || null,
    coach: o.coach?.trim() || null,
    founded_year: foundedRaw ? Number(foundedRaw) : null,
    headquarters: o.city?.trim() || null,
    website: o.website_url?.trim() || null,
    circuit_status: o.status?.trim() || "active",
    circuit_summary: o.circuit_summary?.trim() || null,
    achievements: parseTrophiesJson(o.trophies_json),
    social,
    profile,
  };
}

export function parseTeamsMasterCsv(text: string): Record<string, unknown>[] {
  return csvToObjects(text).map(masterCsvObjectToAdminRecord);
}

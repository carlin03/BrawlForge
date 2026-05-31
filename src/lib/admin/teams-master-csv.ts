import type { AdminTeamCatalogRow } from "@/lib/data/admin-catalog-fields";
import {
  parseAchievements,
  parseSocial,
  parseTeamMeta,
  type TeamProfileMeta,
  type WikiAchievement,
  type WikiSection,
} from "@/lib/data/profile-wiki";
import { parseCardThemeMeta, type CardThemeMeta } from "@/lib/data/card-theme-meta";
import { parseTeamSponsors } from "@/lib/data/team-page-stats";
import { csvToObjects, parseCsv, shouldSkipCatalogCsvRow } from "@/lib/admin/catalog-csv";
import {
  TEAM_MASTER_SCHEMA_VERSION,
  TEAM_MASTER_V2_HEADER,
} from "@/lib/admin/teams-master-csv-schema";

export { TEAM_MASTER_V2_COLUMNS, TEAM_MASTER_V2_HEADER, TEAM_MASTER_SCHEMA_VERSION } from "@/lib/admin/teams-master-csv-schema";
export { validateTeamsMasterCsvRows, type TeamMasterCsvRowIssue, type TeamMasterCsvValidationResult } from "@/lib/admin/teams-master-csv-validate";
export { mergeMasterCsvWithExisting } from "@/lib/admin/teams-master-csv-merge";

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

function parseFormCell(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[|,]/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s === "W" || s === "L" || s === "D");
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

function parseTrophiesJson(raw: string | undefined): WikiAchievement[] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return parseAchievements(JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

function parseSponsorsJson(raw: string | undefined) {
  if (!raw?.trim()) return undefined;
  try {
    return parseTeamSponsors(JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

function parseCardThemeJson(raw: string | undefined): CardThemeMeta | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return parseCardThemeMeta(JSON.parse(raw) as unknown) ?? undefined;
  } catch {
    return undefined;
  }
}

function boolCell(raw: string | undefined): boolean | undefined {
  if (raw == null || !String(raw).trim()) return undefined;
  const x = String(raw).trim().toLowerCase();
  return x === "1" || x === "true" || x === "sí" || x === "si" || x === "yes";
}

export type MasterCsvPartialRecord = {
  slug: string;
  name?: string;
  tag?: string;
  region?: string;
  country?: string;
  earnings?: number;
  rank?: number | null;
  rank_change?: number;
  form?: string[];
  roster_slugs?: string[];
  logo_url?: string | null;
  description?: string | null;
  coach?: string | null;
  manager?: string | null;
  captain_slug?: string | null;
  peak_rank?: number | null;
  founded_year?: number | null;
  headquarters?: string | null;
  website?: string | null;
  circuit_status?: string;
  bsc_qualified_2026?: boolean;
  circuit_summary?: string | null;
  achievements?: WikiAchievement[];
  sponsors_json?: ReturnType<typeof parseTeamSponsors>;
  social?: ReturnType<typeof parseSocial>;
  profile?: TeamProfileMeta;
  card_theme?: CardThemeMeta;
  metaExtras?: { aliases?: string[]; source_notes?: string; wiki_url?: string; liquipedia_slug?: string };
};

/** Serializa secciones wiki → columna history_content. */
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

/** CSV → valores extraídos (puede tener campos vacíos). */
export function masterCsvObjectToPartialRecord(o: Record<string, string>): MasterCsvPartialRecord {
  const slug = String(o.slug ?? "")
    .trim()
    .toLowerCase();
  const headquarters = (o.headquarters ?? o.city ?? "").trim();
  const rankRaw = (o.global_rank ?? o.rank ?? "").trim();
  const foundedRaw = o.founded_year?.trim();
  const peakRaw = o.peak_rank?.trim();
  const rankChangeRaw = o.rank_change?.trim();
  const historyRaw = o.history_content?.trim();

  const profile: TeamProfileMeta = {};
  const tagline = o.phase_tagline?.trim();
  if (tagline) profile.tagline = tagline;
  const motto = o.club_slogan?.trim();
  if (motto) profile.motto = motto;
  const banner = o.banner_url?.trim();
  if (banner) profile.banner_url = banner;
  const gallery = splitPipeList(o.gallery_urls);
  if (gallery.length) profile.gallery_urls = gallery;
  if (historyRaw) profile.wiki_sections = parseHistoryContentToWikiSections(historyRaw, slug);
  const facts = splitPipeList(o.fun_facts);
  if (facts.length) profile.fun_facts = facts;
  const rivals = splitPipeList(o.historic_rivals);
  if (rivals.length) profile.rivals = rivals;
  const manager = o.manager?.trim();
  if (manager) profile.manager = manager;
  const ceo = o.ceo?.trim();
  if (ceo) profile.ceo = ceo;
  if (peakRaw) profile.peak_rank = Number(peakRaw);

  const sponsors = parseSponsorsJson(o.sponsors_json);
  if (sponsors?.length) profile.sponsors = sponsors;

  const social = {
    twitter: o.twitter_url?.trim() || undefined,
    youtube: o.youtube_url?.trim() || undefined,
    twitch: o.twitch_url?.trim() || undefined,
    discord: o.discord_url?.trim() || undefined,
    instagram: o.instagram_url?.trim() || undefined,
    tiktok: o.tiktok_url?.trim() || undefined,
    website: o.website_url?.trim() || undefined,
  };

  const card_theme = parseCardThemeJson(o.card_theme_json);
  const aliases = splitPipeList(o.aliases);
  const metaExtras: MasterCsvPartialRecord["metaExtras"] = {};
  if (aliases.length) metaExtras.aliases = aliases;
  if (o.source_notes?.trim()) metaExtras.source_notes = o.source_notes.trim();
  if (o.wiki_url?.trim()) metaExtras.wiki_url = o.wiki_url.trim();
  if (o.liquipedia_slug?.trim()) metaExtras.liquipedia_slug = o.liquipedia_slug.trim();

  return {
    slug,
    name: o.name?.trim() || undefined,
    tag: o.tag?.trim() || undefined,
    region: o.region?.trim().toUpperCase() || undefined,
    country: o.country?.trim() || undefined,
    earnings: o.earnings?.trim() ? Number(o.earnings) : undefined,
    rank: rankRaw ? Number(rankRaw) : rankRaw === "" ? null : undefined,
    rank_change: rankChangeRaw ? Number(rankChangeRaw) : undefined,
    form: o.form?.trim() ? parseFormCell(o.form) : undefined,
    roster_slugs: o.roster_slugs?.trim() ? splitPipeList(o.roster_slugs) : undefined,
    logo_url: o.logo_url?.trim() || null,
    description: o.main_description?.trim() || null,
    coach: o.coach?.trim() || null,
    manager: manager || null,
    captain_slug: o.captain_slug?.trim() || null,
    peak_rank: peakRaw ? Number(peakRaw) : undefined,
    founded_year: foundedRaw ? Number(foundedRaw) : undefined,
    headquarters: headquarters || null,
    website: o.website_url?.trim() || null,
    circuit_status: o.status?.trim().toLowerCase() || undefined,
    bsc_qualified_2026: boolCell(o.bsc_qualified ?? o.bsc_qualified_2026),
    circuit_summary: o.circuit_summary?.trim() || null,
    achievements: parseTrophiesJson(o.trophies_json),
    sponsors_json: sponsors,
    social: parseSocial(social),
    profile: Object.keys(profile).length ? profile : undefined,
    card_theme,
    metaExtras: Object.keys(metaExtras).length ? metaExtras : undefined,
  };
}

export function teamToMasterCsvLine(team: AdminTeamCatalogRow): string {
  const profile = parseTeamMeta(team.meta);
  const social = parseSocial(team.social);
  const sponsors = parseTeamSponsors(
    team.sponsors_json ?? profile.sponsors ?? (team.meta as Record<string, unknown>)?.sponsors,
  );
  const cardTheme = parseCardThemeMeta(team.meta);
  const meta = team.meta as Record<string, unknown>;
  const aliases = Array.isArray(meta.aliases) ? (meta.aliases as string[]).join("|") : "";

  return [
    team.slug,
    team.name,
    team.tag,
    team.region,
    team.country ?? "",
    team.rank ?? "",
    team.rank_change ?? 0,
    team.earnings ?? 0,
    (team.form ?? []).join("|"),
    profile.tagline ?? "",
    team.circuit_summary ?? "",
    team.coach ?? "",
    team.manager ?? profile.manager ?? "",
    profile.ceo ?? "",
    team.founded_year ?? "",
    team.headquarters ?? "",
    team.circuit_status ?? "active",
    team.bsc_qualified_2026 === false ? "0" : "1",
    team.description ?? "",
    profile.motto ?? "",
    serializeWikiSectionsToHistory(profile.wiki_sections),
    (profile.fun_facts ?? []).join("|"),
    (profile.rivals ?? []).join("|"),
    (team.roster_slugs ?? []).join("|"),
    team.captain_slug ?? "",
    jsonCell(team.achievements),
    jsonCell(sponsors.length ? sponsors : undefined),
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
    cardTheme ? jsonCell({ primary: cardTheme.primary, secondary: cardTheme.secondary, glow: cardTheme.glow }) : "",
    team.peak_rank ?? profile.peak_rank ?? "",
    aliases,
    team.liquipedia_url ?? "",
    meta.liquipedia_slug ? String(meta.liquipedia_slug) : "",
    typeof meta.source_notes === "string" ? meta.source_notes : "",
  ]
    .map(escCsv)
    .join(",");
}

export function buildTeamsMasterCsv(teams: AdminTeamCatalogRow[]): string {
  const lines = [
    `# schema=${TEAM_MASTER_SCHEMA_VERSION}`,
    TEAM_MASTER_V2_HEADER,
    ...teams.map(teamToMasterCsvLine),
  ];
  return `${lines.join("\n")}\n`;
}

function findMasterCsvHeaderIndex(parsed: string[][]): number {
  for (let i = 0; i < parsed.length; i++) {
    const cells = parsed[i].map((c) => String(c).trim().toLowerCase());
    if (cells[0] === "slug" || cells.includes("slug")) return i;
  }
  return 0;
}

export function parseTeamsMasterCsvObjects(text: string): {
  headers: string[];
  rows: { raw: Record<string, string>; line: number }[];
} {
  const cleaned = text.replace(/^\uFEFF/, "");
  const parsed = parseCsv(cleaned);
  if (!parsed.length) return { headers: [], rows: [] };
  const headerIdx = findMasterCsvHeaderIndex(parsed);
  const headers = parsed[headerIdx].map((h) => String(h).trim().toLowerCase());
  const rows: { raw: Record<string, string>; line: number }[] = [];
  for (let i = headerIdx + 1; i < parsed.length; i++) {
    const cells = parsed[i];
    if (!cells.some((c) => String(c).trim())) continue;
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = String(cells[idx] ?? "").trim();
    });
    if (shouldSkipCatalogCsvRow(raw)) continue;
    rows.push({ raw, line: i + 1 });
  }
  return { headers, rows };
}

/** @deprecated Usar parseTeamsMasterCsvObjects + validación + merge */
export function parseTeamsMasterCsv(text: string): Record<string, unknown>[] {
  return csvToObjects(text).map((o) => {
    const partial = masterCsvObjectToPartialRecord(o);
    return {
      slug: partial.slug,
      name: partial.name ?? partial.slug,
      tag: partial.tag ?? "",
      region: partial.region ?? "GLOBAL",
      country: partial.country ?? "",
      earnings: partial.earnings ?? 0,
      rank: partial.rank,
      rank_change: partial.rank_change ?? 0,
      form: partial.form ?? [],
      roster_slugs: partial.roster_slugs ?? [],
      logo_url: partial.logo_url,
      description: partial.description,
      coach: partial.coach,
      manager: partial.manager,
      captain_slug: partial.captain_slug,
      peak_rank: partial.peak_rank,
      founded_year: partial.founded_year,
      headquarters: partial.headquarters,
      website: partial.website,
      circuit_status: partial.circuit_status ?? "active",
      bsc_qualified_2026: partial.bsc_qualified_2026,
      circuit_summary: partial.circuit_summary,
      achievements: partial.achievements ?? [],
      sponsors_json: partial.sponsors_json ?? [],
      social: partial.social ?? {},
      profile: partial.profile ?? {},
      meta: {
        ...(partial.metaExtras?.aliases ? { aliases: partial.metaExtras.aliases } : {}),
        ...(partial.metaExtras?.source_notes ? { source_notes: partial.metaExtras.source_notes } : {}),
      },
      card_theme: partial.card_theme,
      liquipedia_url: partial.metaExtras?.wiki_url ?? partial.metaExtras?.liquipedia_slug,
    };
  });
}

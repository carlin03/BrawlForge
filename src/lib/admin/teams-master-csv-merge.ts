import { parseAchievements, parseSocial, parseTeamMeta, type SocialLinks } from "@/lib/data/profile-wiki";
import { parseCardThemeMeta } from "@/lib/data/card-theme-meta";
import { parseTeamSponsors } from "@/lib/data/team-page-stats";
import {
  masterCsvObjectToPartialRecord,
  type MasterCsvPartialRecord,
} from "@/lib/admin/teams-master-csv";

function hasCell(raw: Record<string, string>, keys: string[]): boolean {
  return keys.some((k) => k in raw);
}

function cell(raw: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    if (k in raw) return String(raw[k] ?? "").trim();
  }
  return "";
}

function pick<T>(provided: boolean, incoming: T | null | undefined, existing: T): T {
  if (!provided) return existing;
  if (incoming === null || incoming === undefined) return existing;
  if (typeof incoming === "string" && !incoming.trim()) return existing;
  if (Array.isArray(incoming) && incoming.length === 0) return existing;
  return incoming as T;
}

const SOCIAL_CSV_KEYS: { key: keyof SocialLinks; col: string }[] = [
  { key: "twitter", col: "twitter_url" },
  { key: "youtube", col: "youtube_url" },
  { key: "twitch", col: "twitch_url" },
  { key: "discord", col: "discord_url" },
  { key: "instagram", col: "instagram_url" },
  { key: "tiktok", col: "tiktok_url" },
  { key: "website", col: "website_url" },
];

function mergeSocialFromCsv(
  existing: SocialLinks,
  incoming: SocialLinks,
  raw: Record<string, string>,
): SocialLinks {
  const out = { ...existing };
  let touched = false;
  for (const { key, col } of SOCIAL_CSV_KEYS) {
    if (!(col in raw)) continue;
    touched = true;
    const v = raw[col]?.trim();
    if (v) out[key] = v;
  }
  return touched ? { ...out, ...incoming } : existing;
}

/** Fusiona fila CSV con registro existente en DB (vacío en CSV = conservar valor anterior). */
export function mergeMasterCsvWithExisting(
  existing: Record<string, unknown> | undefined,
  partial: MasterCsvPartialRecord,
  raw: Record<string, string>,
): Record<string, unknown> {
  const ex = existing ?? {};
  const exMeta =
    ex.meta && typeof ex.meta === "object" && !Array.isArray(ex.meta)
      ? (ex.meta as Record<string, unknown>)
      : {};
  const exProfile = parseTeamMeta(exMeta);
  const exSocial = parseSocial(ex.social ?? {});
  const exAchievements = parseAchievements(ex.achievements ?? []);
  const exSponsors = parseTeamSponsors(ex.sponsors_json ?? exMeta.sponsors ?? []);
  const exForm = Array.isArray(ex.form) ? (ex.form as string[]) : [];
  const exRoster = Array.isArray(ex.roster_slugs) ? (ex.roster_slugs as string[]) : [];

  const p = partial;
  const slug = String(p.slug ?? ex.slug ?? "");

  const mergedProfile = {
    tagline: pick(hasCell(raw, ["phase_tagline"]), p.profile?.tagline, exProfile.tagline),
    motto: pick(hasCell(raw, ["club_slogan"]), p.profile?.motto, exProfile.motto),
    banner_url: pick(hasCell(raw, ["banner_url"]), p.profile?.banner_url, exProfile.banner_url),
    gallery_urls: pick(
      hasCell(raw, ["gallery_urls"]),
      p.profile?.gallery_urls,
      exProfile.gallery_urls ?? [],
    ),
    wiki_sections: pick(
      hasCell(raw, ["history_content"]),
      p.profile?.wiki_sections,
      exProfile.wiki_sections ?? [],
    ),
    fun_facts: pick(hasCell(raw, ["fun_facts"]), p.profile?.fun_facts, exProfile.fun_facts ?? []),
    rivals: pick(hasCell(raw, ["historic_rivals"]), p.profile?.rivals, exProfile.rivals ?? []),
    manager: pick(
      hasCell(raw, ["manager"]),
      p.profile?.manager ?? p.manager,
      exProfile.manager ?? (typeof ex.manager === "string" ? ex.manager : undefined),
    ),
    ceo: pick(hasCell(raw, ["ceo"]), p.profile?.ceo, exProfile.ceo),
    peak_rank: pick(
      hasCell(raw, ["peak_rank"]),
      p.profile?.peak_rank ?? p.peak_rank,
      exProfile.peak_rank ??
        (typeof ex.peak_rank === "number" ? ex.peak_rank : undefined),
    ),
    sponsors: pick(
      hasCell(raw, ["sponsors_json"]),
      p.profile?.sponsors,
      exSponsors.length ? exSponsors : exProfile.sponsors,
    ),
  };

  const cardThemeProvided = hasCell(raw, ["card_theme_json"]);
  const cardTheme = cardThemeProvided
    ? p.card_theme ?? parseCardThemeMeta(exMeta)
    : parseCardThemeMeta(exMeta);

  const meta: Record<string, unknown> = { ...exMeta };
  if (hasCell(raw, ["aliases"])) {
    const aliases = p.metaExtras?.aliases;
    if (aliases?.length) meta.aliases = aliases;
  }
  if (hasCell(raw, ["source_notes"]) && p.metaExtras?.source_notes) {
    meta.source_notes = p.metaExtras.source_notes;
  }
  if (hasCell(raw, ["captain_slug"]) && p.captain_slug) {
    meta.captain_slug = p.captain_slug;
  }
  if (cardThemeProvided && cardTheme) meta.card_theme = cardTheme;
  if (mergedProfile.tagline) meta.tagline = mergedProfile.tagline;
  if (mergedProfile.motto) meta.motto = mergedProfile.motto;
  if (mergedProfile.banner_url) meta.banner_url = mergedProfile.banner_url;
  if (mergedProfile.gallery_urls?.length) meta.gallery_urls = mergedProfile.gallery_urls;
  if (mergedProfile.wiki_sections?.length) meta.wiki_sections = mergedProfile.wiki_sections;
  if (mergedProfile.fun_facts?.length) meta.fun_facts = mergedProfile.fun_facts;
  if (mergedProfile.rivals?.length) meta.rivals = mergedProfile.rivals;
  if (mergedProfile.manager) meta.manager = mergedProfile.manager;
  if (mergedProfile.ceo) meta.ceo = mergedProfile.ceo;
  if (mergedProfile.peak_rank != null) meta.peak_rank = mergedProfile.peak_rank;
  if (mergedProfile.sponsors?.length) meta.sponsors = mergedProfile.sponsors;

  const liquipediaProvided = hasCell(raw, ["wiki_url", "liquipedia_slug"]);
  const liquipedia =
    cell(raw, ["liquipedia_slug"]) ||
    cell(raw, ["wiki_url"]) ||
    (typeof ex.liquipedia_url === "string" ? ex.liquipedia_url : "");

  return {
    slug,
    name: pick(hasCell(raw, ["name"]), p.name, String(ex.name ?? slug)),
    tag: pick(hasCell(raw, ["tag"]), p.tag, String(ex.tag ?? "")),
    region: pick(hasCell(raw, ["region"]), p.region, String(ex.region ?? "GLOBAL")),
    country: pick(hasCell(raw, ["country"]), p.country, String(ex.country ?? "")),
    earnings: pick(hasCell(raw, ["earnings"]), p.earnings, Number(ex.earnings ?? 0)),
    rank: pick(
      hasCell(raw, ["global_rank", "rank"]),
      p.rank,
      ex.rank != null ? Number(ex.rank) : null,
    ),
    rank_change: pick(
      hasCell(raw, ["rank_change"]),
      p.rank_change,
      Number(ex.rank_change ?? 0),
    ),
    form: pick(hasCell(raw, ["form"]), p.form, exForm),
    roster_slugs: pick(hasCell(raw, ["roster_slugs"]), p.roster_slugs, exRoster),
    logo_url: pick(hasCell(raw, ["logo_url"]), p.logo_url, ex.logo_url ? String(ex.logo_url) : null),
    description: pick(
      hasCell(raw, ["main_description"]),
      p.description,
      ex.description ? String(ex.description) : null,
    ),
    coach: pick(hasCell(raw, ["coach"]), p.coach, ex.coach ? String(ex.coach) : null),
    manager: pick(
      hasCell(raw, ["manager"]),
      p.manager ?? mergedProfile.manager,
      typeof ex.manager === "string" ? ex.manager : mergedProfile.manager ?? null,
    ),
    captain_slug: pick(
      hasCell(raw, ["captain_slug"]),
      p.captain_slug,
      typeof ex.captain_slug === "string" ? ex.captain_slug : null,
    ),
    peak_rank: pick(
      hasCell(raw, ["peak_rank"]),
      p.peak_rank ?? mergedProfile.peak_rank,
      typeof ex.peak_rank === "number"
        ? ex.peak_rank
        : mergedProfile.peak_rank ?? null,
    ),
    founded_year: pick(
      hasCell(raw, ["founded_year"]),
      p.founded_year,
      ex.founded_year != null ? Number(ex.founded_year) : null,
    ),
    headquarters: pick(
      hasCell(raw, ["headquarters", "city"]),
      p.headquarters,
      ex.headquarters ? String(ex.headquarters) : null,
    ),
    website: pick(
      hasCell(raw, ["website_url"]),
      p.website,
      ex.website ? String(ex.website) : null,
    ),
    circuit_status: pick(
      hasCell(raw, ["status"]),
      p.circuit_status,
      String(ex.circuit_status ?? "active"),
    ),
    bsc_qualified_2026: pick(
      hasCell(raw, ["bsc_qualified", "bsc_qualified_2026"]),
      p.bsc_qualified_2026,
      ex.bsc_qualified_2026 !== false,
    ),
    circuit_summary: pick(
      hasCell(raw, ["circuit_summary"]),
      p.circuit_summary,
      ex.circuit_summary ? String(ex.circuit_summary) : null,
    ),
    achievements: pick(
      hasCell(raw, ["trophies_json"]),
      p.achievements,
      exAchievements,
    ),
    sponsors_json: pick(
      hasCell(raw, ["sponsors_json"]),
      p.sponsors_json,
      ex.sponsors_json ?? mergedProfile.sponsors ?? [],
    ),
    social: mergeSocialFromCsv(exSocial, p.social ?? {}, raw),
    liquipedia_url: pick(liquipediaProvided, liquipedia || null, ex.liquipedia_url ? String(ex.liquipedia_url) : null),
    profile: mergedProfile,
    meta,
    card_theme: cardTheme,
  };
}

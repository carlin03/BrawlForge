/** Contenido enriquecido tipo Wikipedia — guardado en social / meta / achievements del catálogo. */

import { isLiquipediaReference, sanitizePublicText } from "@/lib/sanitize-liquipedia";

export type WikiAchievement = {
  place: string;
  tournament: string;
  prize: string;
  date: string;
};

export type WikiSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type SocialLinks = {
  twitter?: string;
  youtube?: string;
  discord?: string;
  twitch?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
};

export type CareerHighlight = {
  year: string;
  title: string;
  detail: string;
};

export type TeamProfileMeta = {
  tagline?: string;
  motto?: string;
  banner_url?: string;
  gallery_urls?: string[];
  wiki_sections?: WikiSection[];
  fun_facts?: string[];
  rivals?: string[];
  sponsors?: string[] | { name: string; category?: string; logo_url?: string }[];
  manager?: string;
  ceo?: string;
  peak_rank?: number;
};

export type PlayerProfileMeta = {
  tagline?: string;
  nickname?: string;
  banner_url?: string;
  gallery_urls?: string[];
  wiki_sections?: WikiSection[];
  fun_facts?: string[];
  playstyle?: string;
  peak_rating?: number;
  main_brawlers?: string[];
  career_highlights?: CareerHighlight[];
};

export function newSectionId(): string {
  return `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyAchievement(): WikiAchievement {
  return { place: "", tournament: "", prize: "", date: new Date().getFullYear().toString() };
}

export function emptySection(): WikiSection {
  return { id: newSectionId(), title: "Nueva sección", paragraphs: [""] };
}

export function parseAchievements(raw: unknown): WikiAchievement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      if (!a || typeof a !== "object") return null;
      const o = a as Record<string, unknown>;
      return {
        place: String(o.place ?? o.name ?? ""),
        tournament: String(o.tournament ?? ""),
        prize: String(o.prize ?? ""),
        date: String(o.date ?? o.year ?? ""),
      };
    })
    .filter((x): x is WikiAchievement => Boolean(x?.tournament || x?.place));
}

export function parseWikiSections(raw: unknown): WikiSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const o = s as Record<string, unknown>;
      const paragraphs = Array.isArray(o.paragraphs)
        ? (o.paragraphs as string[])
            .map((p) => sanitizePublicText(String(p)))
            .filter((p): p is string => Boolean(p))
        : o.content
          ? String(o.content)
              .split("\n\n")
              .map((p) => sanitizePublicText(p.trim()))
              .filter((p): p is string => Boolean(p))
          : [""];
      return {
        id: String(o.id ?? newSectionId()),
        title: String(o.title ?? "Sección"),
        paragraphs: paragraphs.length ? paragraphs : [""],
      };
    })
    .filter((x): x is WikiSection => Boolean(x));
}

export function parseSocial(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: SocialLinks = {};
  for (const k of ["twitter", "youtube", "discord", "twitch", "instagram", "tiktok", "website"] as const) {
    const v = sanitizePublicText(o[k] ? String(o[k]) : "");
    if (v && !isLiquipediaReference(v)) out[k] = v;
  }
  return out;
}

export function parseTeamMeta(raw: unknown): TeamProfileMeta {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    tagline: o.tagline ? String(o.tagline) : undefined,
    motto: o.motto ? String(o.motto) : undefined,
    banner_url: o.banner_url ? String(o.banner_url) : undefined,
    gallery_urls: Array.isArray(o.gallery_urls) ? (o.gallery_urls as string[]).map(String) : [],
    wiki_sections: parseWikiSections(o.wiki_sections),
    fun_facts: Array.isArray(o.fun_facts)
      ? (o.fun_facts as string[])
          .map((f) => sanitizePublicText(String(f)))
          .filter((f): f is string => Boolean(f))
      : [],
    rivals: Array.isArray(o.rivals) ? (o.rivals as string[]).map(String) : [],
    sponsors: Array.isArray(o.sponsors) ? (o.sponsors as TeamProfileMeta["sponsors"]) : [],
    manager: o.manager ? String(o.manager) : undefined,
    ceo: o.ceo ? String(o.ceo) : undefined,
    peak_rank: typeof o.peak_rank === "number" ? o.peak_rank : typeof o.best_rank === "number" ? o.best_rank : undefined,
  };
}

export function parsePlayerMeta(raw: unknown): PlayerProfileMeta {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const highlights = Array.isArray(o.career_highlights)
    ? (o.career_highlights as CareerHighlight[])
    : [];
  return {
    tagline: o.tagline ? String(o.tagline) : undefined,
    nickname: o.nickname ? String(o.nickname) : undefined,
    banner_url: o.banner_url ? String(o.banner_url) : undefined,
    gallery_urls: Array.isArray(o.gallery_urls) ? (o.gallery_urls as string[]).map(String) : [],
    wiki_sections: parseWikiSections(o.wiki_sections),
    fun_facts: Array.isArray(o.fun_facts)
      ? (o.fun_facts as string[])
          .map((f) => sanitizePublicText(String(f)))
          .filter((f): f is string => Boolean(f))
      : [],
    playstyle: o.playstyle ? String(o.playstyle) : undefined,
    peak_rating: typeof o.peak_rating === "number" ? o.peak_rating : undefined,
    main_brawlers: Array.isArray(o.main_brawlers) ? (o.main_brawlers as string[]).map(String) : [],
    career_highlights: highlights,
  };
}

export function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function listToLines(items: string[]): string {
  return items.join("\n");
}

export function buildTeamMeta(profile: TeamProfileMeta, extras?: { coach?: string | null }): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (profile.tagline) out.tagline = profile.tagline;
  if (profile.motto) out.motto = profile.motto;
  if (profile.banner_url) out.banner_url = profile.banner_url;
  if (profile.gallery_urls?.length) out.gallery_urls = profile.gallery_urls;
  if (profile.wiki_sections?.length) out.wiki_sections = profile.wiki_sections;
  if (profile.fun_facts?.length) out.fun_facts = profile.fun_facts;
  if (profile.rivals?.length) out.rivals = profile.rivals;
  if (extras?.coach) out.coach = extras.coach;
  return out;
}

export function buildPlayerMeta(
  profile: PlayerProfileMeta,
  photoUrl?: string | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (photoUrl?.trim()) out.photo_url = photoUrl.trim();
  if (profile.tagline) out.tagline = profile.tagline;
  if (profile.nickname) out.nickname = profile.nickname;
  if (profile.banner_url) out.banner_url = profile.banner_url;
  if (profile.gallery_urls?.length) out.gallery_urls = profile.gallery_urls;
  if (profile.wiki_sections?.length) out.wiki_sections = profile.wiki_sections;
  if (profile.fun_facts?.length) out.fun_facts = profile.fun_facts;
  if (profile.playstyle) out.playstyle = profile.playstyle;
  if (profile.peak_rating != null) out.peak_rating = profile.peak_rating;
  if (profile.main_brawlers?.length) out.main_brawlers = profile.main_brawlers;
  if (profile.career_highlights?.length) out.career_highlights = profile.career_highlights;
  return out;
}

const SOCIAL_KEYS = ["twitter", "youtube", "discord", "twitch", "instagram", "tiktok", "website"] as const;

export function pruneSocial(social: SocialLinks): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of SOCIAL_KEYS) {
    const v = sanitizePublicText(social[k]?.trim());
    if (v && !isLiquipediaReference(v)) out[k] = v;
  }
  return out;
}

import userLogos from "./generated/tournament-logos-user.json";

const TOURNAMENT_SLUG_ALIASES: Record<string, string> = {
  "bsc-2026-brawl-cup": "brawl-stars-championship-2026-brawl-cup",
  "bsc-2026-s3-emea-mf": "bsc-2026-april-emea-mf",
  "bsc-2026-s3-ea-mf": "bsc-2026-april-ea-mf",
  "bsc-2026-s3-na-mf": "bsc-2026-april-na-mf",
};

const SEASON_TO_MONTH: Record<number, string> = {
  1: "february",
  2: "march",
  3: "april",
  4: "may",
  5: "june",
  6: "july",
  7: "august",
};

const LP_REGION: Record<string, string> = {
  emea: "emea",
  "east-asia": "ea",
  "north-america": "na",
  "south-america": "sa",
};

const LOGO_SLUGS = new Set(userLogos.slugs.map((s) => s.trim().toLowerCase()));

/** Resuelve slug Liquipedia/partido → slug BSC con logo manual. */
export function resolveLogoTournamentSlug(slug: string): string | null {
  const s = slug.trim().toLowerCase();
  if (!s || !LOGO_SLUGS.size) return null;
  if (LOGO_SLUGS.has(s)) return s;

  const aliasCanon = Object.entries(TOURNAMENT_SLUG_ALIASES).find(([, alias]) => alias === s)?.[0];
  if (aliasCanon && LOGO_SLUGS.has(aliasCanon)) return aliasCanon;

  if (s === "brawl-stars-championship-2026-brawl-cup" && LOGO_SLUGS.has("bsc-2026-brawl-cup")) {
    return "bsc-2026-brawl-cup";
  }

  const mf = s.match(
    /^brawl-stars-championship-2026-season-(\d+)-(emea|east-asia|north-america|south-america)-monthly-finals$/,
  );
  if (mf) {
    const month = SEASON_TO_MONTH[Number(mf[1])];
    const region = LP_REGION[mf[2]];
    if (month && region) {
      const bsc = `bsc-2026-${month}-${region}-mf`;
      if (LOGO_SLUGS.has(bsc)) return bsc;
    }
  }

  if (/^brawl-stars-championship-2026-road-to-brawl-cup-sa-west/.test(s) && LOGO_SLUGS.has("bsc-2026-rtbc-sa-west")) {
    return "bsc-2026-rtbc-sa-west";
  }
  if (/^brawl-stars-championship-2026-road-to-brawl-cup-sesa/.test(s) && LOGO_SLUGS.has("bsc-2026-rtbc-sesa")) {
    return "bsc-2026-rtbc-sesa";
  }

  if (s === "brawl-stars-challengers-brasil-finals" && LOGO_SLUGS.has("bsc-2026-challengers-brasil")) {
    return "bsc-2026-challengers-brasil";
  }
  if (s === "brawl-stars-challengers-north-america-finals" && LOGO_SLUGS.has("bsc-2026-challengers-na")) {
    return "bsc-2026-challengers-na";
  }

  if (s.startsWith("bsc-2026-") && LOGO_SLUGS.has(s)) return s;

  return null;
}

/** Solo torneos con logo subido manualmente. */
export function isCuratedPublicTournamentSlug(slug: string): boolean {
  return resolveLogoTournamentSlug(slug) != null;
}

export const USER_LOGO_TOURNAMENT_COUNT = LOGO_SLUGS.size;

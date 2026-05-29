const KEY = "brawlforge_favorite_team";

/** Club favorito en caché — mismo aspecto en localhost y Vercel si Supabase tarda. */
export function getCachedFavoriteTeamSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY)?.trim();
    return v && v.length >= 2 ? v : null;
  } catch {
    return null;
  }
}

export function setCachedFavoriteTeamSlug(slug: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!slug) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, slug);
  } catch {
    /* ignore */
  }
}

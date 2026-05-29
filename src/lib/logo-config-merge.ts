import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import { logoOverrides as bundledOverrides } from "@/lib/data/logo-overrides";
import { isLiquipediaImageUrl } from "@/lib/data/team-logo-urls";

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isSupabaseStorageUrl(url: string): boolean {
  const host = hostOf(url);
  return !!host && (host.endsWith(".supabase.co") || host.endsWith(".supabase.in"));
}

/** No sustituir CDN empaquetado por Liquipedia roto en producción. */
export function shouldApplyDbLogoUrl(existingUrl: string | undefined, dbUrl: string): boolean {
  const next = dbUrl.trim();
  if (!next) return false;
  const prev = existingUrl?.trim();
  if (!prev) return true;
  if (isSupabaseStorageUrl(next)) return true;
  if (isLiquipediaImageUrl(next) && !isLiquipediaImageUrl(prev)) return false;
  if (isLiquipediaImageUrl(prev) && !isLiquipediaImageUrl(next)) return true;
  return false;
}

export function bundledLogoOverrides(): LogoOverridesFile {
  return {
    teams: { ...bundledOverrides.teams },
    tournaments: { ...bundledOverrides.tournaments },
  };
}

export function mergeLogoOverridesFile(base: LogoOverridesFile, extra: LogoOverridesFile): LogoOverridesFile {
  const out: LogoOverridesFile = {
    teams: { ...base.teams },
    tournaments: { ...base.tournaments },
  };
  for (const [slug, entry] of Object.entries(extra.teams ?? {})) {
    const url = entry?.url?.trim();
    if (!url) continue;
    const prev = out.teams[slug]?.url;
    if (shouldApplyDbLogoUrl(prev, url)) {
      out.teams[slug] = { url, treatment: entry.treatment ?? out.teams[slug]?.treatment ?? "strip-white" };
    }
  }
  for (const [slug, entry] of Object.entries(extra.tournaments ?? {})) {
    const url = entry?.url?.trim();
    if (!url) continue;
    const prev = out.tournaments[slug]?.url;
    if (shouldApplyDbLogoUrl(prev, url)) {
      out.tournaments[slug] = { url };
    }
  }
  return out;
}

import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import { logoOverrides as bundledOverrides } from "@/lib/data/logo-overrides";
import { isPublicImageFetchUrl } from "@/lib/image-fetch-url";

/** Admin / Supabase: cualquier URL pública https válida sustituye la anterior. */
export function shouldApplyDbLogoUrl(_existingUrl: string | undefined, dbUrl: string): boolean {
  const next = dbUrl.trim();
  return !!next && isPublicImageFetchUrl(next);
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
      out.teams[slug] = {
        url,
        customOnly: entry.customOnly ?? true,
        treatment: entry.treatment ?? "raw",
      };
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

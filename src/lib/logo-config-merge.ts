import type { LogoOverridesFile } from "@/lib/data/logo-overrides";
import { isPublicImageFetchUrl } from "@/lib/image-fetch-url";

/** Admin / Supabase: cualquier URL pública https válida sustituye la anterior. */
export function shouldApplyDbLogoUrl(_existingUrl: string | undefined, dbUrl: string): boolean {
  const next = dbUrl.trim();
  return !!next && isPublicImageFetchUrl(next);
}

/** En producción los logos vienen de Supabase; no empaquetar overrides antiguos con filtros. */
export function bundledLogoOverrides(): LogoOverridesFile {
  return { teams: {}, tournaments: {} };
}

/** Elige la URL de logo de equipo más reciente entre catálogo y overrides. */
export function pickNewerTeamLogoUrl(
  catalogUrl: string | null | undefined,
  catalogAt: string | null | undefined,
  overrideUrl: string | null | undefined,
  overrideAt: string | null | undefined,
): string | null {
  const cUrl = catalogUrl?.trim() || null;
  const oUrl = overrideUrl?.trim() || null;
  if (!cUrl && !oUrl) return null;
  if (!cUrl) return oUrl;
  if (!oUrl) return cUrl;
  const cTs = catalogAt ? new Date(catalogAt).getTime() : 0;
  const oTs = overrideAt ? new Date(overrideAt).getTime() : 0;
  return oTs >= cTs ? oUrl : cUrl;
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
      out.teams[slug] = { url, customOnly: true, treatment: "raw" };
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

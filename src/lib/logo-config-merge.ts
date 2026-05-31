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

/**
 * URL activa para un equipo: `team_logo_overrides` (Admin → Logos) gana siempre
 * sobre `teams_catalog`, para que un sync del catálogo no revierta el logo guardado.
 */
export function pickNewerTeamLogoUrl(
  catalogUrl: string | null | undefined,
  _catalogAt: string | null | undefined,
  overrideUrl: string | null | undefined,
  _overrideAt: string | null | undefined,
): string | null {
  const oUrl = overrideUrl?.trim() || null;
  if (oUrl) return oUrl;
  const cUrl = catalogUrl?.trim() || null;
  return cUrl;
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

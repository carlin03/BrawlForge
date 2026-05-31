"use client";

import { useMemo } from "react";
import { buildTeamLogoSources, prependTeamLogoSources } from "@/lib/data/png-logo-urls";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { useResolvedTeam } from "@/hooks/useResolvedEntity";
import { resolveLogoTreatment } from "@/lib/data/logo-branding";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { getTeam } from "@/lib/data/teams";
import { LogoFrame } from "@/components/ui/LogoFrame";
import { useLogoImage } from "@/components/ui/useLogoImage";
import { usesRemoteLogoPipeline } from "@/lib/data/local-logos";
import { teamLogoProxyUrl } from "@/lib/team-logo-server";

export const LOGO_SIZES = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 52,
  xl: 64,
  "2xl": 80,
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

interface TeamLogoProps {
  slug: string;
  name?: string;
  tag?: string;
  size?: number | LogoSize;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}

/** Fuentes de imagen: en producción el endpoint por slug es la fuente de verdad (Supabase). */
function buildTeamLogoImageSources(
  key: string,
  logoConfig: ReturnType<typeof useLogoConfig>,
  cacheVersion: string,
  manualUrl?: string | null,
): string[] {
  const overrideUrl = logoConfig.overrides?.teams[key]?.url?.trim();
  const manual = manualUrl?.trim();
  const direct = prependTeamLogoSources([], [overrideUrl, manual], cacheVersion);

  if (usesRemoteLogoPipeline()) {
    const api = teamLogoProxyUrl(key, cacheVersion);
    const out = [api];
    for (const u of direct) {
      if (u && !out.includes(u)) out.push(u);
    }
    return out;
  }

  const base = buildTeamLogoSources(key, logoConfig);
  const merged = prependTeamLogoSources(base, [overrideUrl, manual], cacheVersion);
  const seen = new Set<string>();
  return merged.filter((u) => {
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

export function TeamLogo({
  slug,
  name,
  tag,
  size = "md",
  className = "",
  glow = true,
  priority = false,
}: TeamLogoProps) {
  const pixelSize = typeof size === "number" ? size : LOGO_SIZES[size];
  const key = slug.trim().toLowerCase();
  const valid = isValidLogoSlug(key);
  const logoConfig = useLogoConfig();
  const cacheVersion = logoConfig.cacheVersion ?? LOGO_CACHE_VERSION;
  const catalogTeam = useResolvedTeam(key);
  const team = valid ? getTeam(key) : undefined;

  const sources = useMemo(
    () =>
      valid
        ? buildTeamLogoImageSources(key, logoConfig, cacheVersion, catalogTeam?.logoUrl)
        : [],
    [key, valid, cacheVersion, logoConfig.cacheVersion, logoConfig.overrides, catalogTeam?.logoUrl],
  );

  const { src, status, onLoad, onError, imgRef } = useLogoImage(sources);
  const displayName = name || team?.name || (valid ? key : "TBD");
  const loaded = status === "ready" && !!src;
  const overrideEntry = logoConfig.overrides?.teams[key];
  const treatment = valid ? resolveLogoTreatment(key, overrideEntry) : "border-only";

  if (!valid || status === "failed" || !src) {
    return (
      <LogoFrame size={pixelSize} kind="team" glow={false} className={`logo-missing ${className}`.trim()} title={displayName}>
        <span className="logo-missing-tag">{tag ?? team?.tag ?? displayName.slice(0, 2).toUpperCase()}</span>
      </LogoFrame>
    );
  }

  return (
    <LogoFrame
      size={pixelSize}
      kind="team"
      glow={glow && loaded}
      className={`${className} ${loaded ? "is-loaded" : ""} logo-treatment-${treatment}`.trim()}
      title={displayName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${key}-${src}`}
        ref={imgRef}
        src={src}
        alt={displayName}
        width={pixelSize - 6}
        height={pixelSize - 6}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        className="logo-img"
      />
    </LogoFrame>
  );
}

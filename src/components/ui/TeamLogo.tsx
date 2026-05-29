"use client";

import { useMemo } from "react";
import {
  buildTeamLogoSources,
  prependTeamLogoSources,
  resolveTeamLogoSlug,
} from "@/lib/data/png-logo-urls";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { useResolvedTeam } from "@/hooks/useResolvedEntity";
import { getLogoTreatment } from "@/lib/data/logo-branding";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { getTeam } from "@/lib/data/teams";
import { LogoFrame } from "@/components/ui/LogoFrame";
import { useLogoImage } from "@/components/ui/useLogoImage";
import { isRemoteLogoSrc } from "@/lib/data/logo-client-url";
import { usesRemoteLogoPipeline } from "@/lib/data/local-logos";

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
}

export function TeamLogo({ slug, name, tag, size = "md", className = "", glow = true }: TeamLogoProps) {
  const pixelSize = typeof size === "number" ? size : LOGO_SIZES[size];
  const valid = isValidLogoSlug(slug);
  const resolvedSlug = valid ? resolveTeamLogoSlug(slug) : slug;
  const team = valid ? (getTeam(slug) ?? getTeam(resolvedSlug)) : undefined;
  const catalogTeam = useResolvedTeam(slug);
  const logoConfig = useLogoConfig();
  const cacheVersion = logoConfig.cacheVersion ?? LOGO_CACHE_VERSION;
  const sources = useMemo(() => {
    if (!valid) return [];
    const base = buildTeamLogoSources(slug, logoConfig);
    return prependTeamLogoSources(base, [catalogTeam?.logoUrl], cacheVersion);
  }, [slug, valid, cacheVersion, logoConfig.cacheVersion, logoConfig.overrides, catalogTeam?.logoUrl]);
  const { src, status, onLoad, onError, imgRef } = useLogoImage(sources);
  const displayName = name || team?.name || (valid ? slug : "TBD");
  const loaded = status === "ready" && !!src;
  const treatment = valid ? getLogoTreatment(resolvedSlug) : "border-only";
  const remoteLogo = usesRemoteLogoPipeline() && isRemoteLogoSrc(src);

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
      className={`${className} ${loaded ? "is-loaded" : ""} logo-treatment-${treatment} ${remoteLogo ? "logo-remote" : ""}`.trim()}
      title={displayName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={displayName}
        width={pixelSize - 6}
        height={pixelSize - 6}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        className="logo-img"
      />
    </LogoFrame>
  );
}

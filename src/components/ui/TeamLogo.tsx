"use client";

import { useMemo } from "react";
import { buildTeamLogoSources, resolveTeamLogoSlug } from "@/lib/data/png-logo-urls";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { getLogoTreatment } from "@/lib/data/logo-branding";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { getTeam } from "@/lib/data/teams";
import { LogoFrame } from "@/components/ui/LogoFrame";
import { useLogoImage } from "@/components/ui/useLogoImage";

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
  const logoConfig = useLogoConfig();
  const sources = useMemo(
    () => (valid ? buildTeamLogoSources(slug, logoConfig) : []),
    [slug, valid, logoConfig.cacheVersion, logoConfig.overrides],
  );
  const { src, status, onLoad, onError, imgRef } = useLogoImage(sources);
  const displayName = name || team?.name || (valid ? slug : "TBD");
  const loaded = status === "ready" && !!src;
  const treatment = valid ? getLogoTreatment(resolvedSlug) : "border-only";

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

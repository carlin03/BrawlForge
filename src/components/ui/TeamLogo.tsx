"use client";

import { useMemo, useState } from "react";
import {
  buildTeamLogoSources,
  prependTeamLogoSources,
  resolveTeamLogoSlug,
} from "@/lib/data/png-logo-urls";
import { LOGO_CACHE_VERSION } from "@/lib/data/logo-manifest";
import { teamLogoOverrideUrl } from "@/lib/data/logo-overrides";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { useResolvedTeam } from "@/hooks/useResolvedEntity";
import { resolveLogoTreatment } from "@/lib/data/logo-branding";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { getTeam } from "@/lib/data/teams";
import { LogoFrame } from "@/components/ui/LogoFrame";
import { useLogoImage } from "@/components/ui/useLogoImage";
import { usesRemoteLogoPipeline } from "@/lib/data/local-logos";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";
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

function TeamLogoRemote({
  slug,
  name,
  tag,
  pixelSize,
  className,
  glow,
  priority,
  cacheVersion,
  logoConfig,
}: {
  slug: string;
  name?: string;
  tag?: string;
  pixelSize: number;
  className: string;
  glow: boolean;
  priority: boolean;
  cacheVersion: string;
  logoConfig: ReturnType<typeof useLogoConfig>;
}) {
  const resolvedSlug = resolveTeamLogoSlug(slug);
  const team = getTeam(slug) ?? getTeam(resolvedSlug);
  const displayName = name || team?.name || slug;
  const overrideEntry =
    logoConfig.overrides?.teams[resolvedSlug] ?? logoConfig.overrides?.teams[slug];
  const treatment = resolveLogoTreatment(resolvedSlug, overrideEntry);
  const overrideUrl =
    overrideEntry?.url?.trim() ||
    teamLogoOverrideUrl(resolvedSlug) ||
    teamLogoOverrideUrl(slug);
  const [src, setSrc] = useState(() => teamLogoProxyUrl(resolvedSlug, cacheVersion));
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
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
      glow={glow}
      className={`${className} logo-treatment-${treatment} logo-remote is-loaded`.trim()}
      title={displayName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={displayName}
        width={pixelSize - 6}
        height={pixelSize - 6}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="logo-img"
        onError={() => {
          if (!overrideUrl) {
            setFailed(true);
            return;
          }
          const fallback = teamLogoProxyUrl(resolvedSlug, cacheVersion);
          if (src !== fallback) {
            setSrc(fallback);
            return;
          }
          setFailed(true);
        }}
      />
    </LogoFrame>
  );
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
  const valid = isValidLogoSlug(slug);
  const remote = usesRemoteLogoPipeline();
  const logoConfig = useLogoConfig();
  const cacheVersion = logoConfig.cacheVersion ?? LOGO_CACHE_VERSION;

  if (valid && remote) {
    return (
      <TeamLogoRemote
        slug={slug}
        name={name}
        tag={tag}
        pixelSize={pixelSize}
        className={className}
        glow={glow}
        priority={priority}
        cacheVersion={cacheVersion}
        logoConfig={logoConfig}
      />
    );
  }

  const resolvedSlug = valid ? resolveTeamLogoSlug(slug) : slug;
  const team = valid ? (getTeam(slug) ?? getTeam(resolvedSlug)) : undefined;
  const catalogTeam = useResolvedTeam(slug);
  const sources = useMemo(() => {
    if (!valid) return [];
    const manual = catalogTeam?.logoUrl?.trim();
    if (manual) {
      return prependTeamLogoSources([], [manual], cacheVersion);
    }
    const base = buildTeamLogoSources(slug, logoConfig);
    return prependTeamLogoSources(base, [], cacheVersion);
  }, [slug, valid, cacheVersion, logoConfig.cacheVersion, logoConfig.overrides, catalogTeam?.logoUrl]);
  const { src, status, onLoad, onError, imgRef } = useLogoImage(sources);
  const displayName = name || team?.name || (valid ? slug : "TBD");
  const loaded = status === "ready" && !!src;
  const overrideEntry =
    logoConfig.overrides?.teams[resolvedSlug] ?? logoConfig.overrides?.teams[slug];
  const treatment = valid ? resolveLogoTreatment(resolvedSlug, overrideEntry) : "border-only";

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

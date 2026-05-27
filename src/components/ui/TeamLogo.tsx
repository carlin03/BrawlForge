"use client";

import { useEffect, useState } from "react";
import { buildTeamLogoSources, resolveTeamLogoSlug } from "@/lib/data/logo-sources";
import { isValidLogoSlug } from "@/lib/data/logo-slugs";
import { getTeam } from "@/lib/data/teams";
import { LogoFrame } from "@/components/ui/LogoFrame";

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
  const sources = valid ? buildTeamLogoSources(slug) : [];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = sources[sourceIndex];
  const displayName = name || team?.name || (valid ? slug : "TBD");
  const displayTag = tag ?? team?.tag ?? (valid ? displayName.slice(0, 3).toUpperCase() : "TBD");

  useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [slug]);

  if (!valid || !src || sourceIndex >= sources.length) {
    return (
      <LogoFrame size={pixelSize} kind="team" glow={glow} className={className} title={displayName}>
        <div className="logo-box logo-box-fallback" style={{ width: "100%", height: "100%", fontSize: Math.max(9, pixelSize * 0.26) }}>
          {displayTag}
        </div>
      </LogoFrame>
    );
  }

  return (
    <LogoFrame size={pixelSize} kind="team" glow={glow && loaded} className={`${className} ${loaded ? "is-loaded" : ""}`.trim()} title={displayName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={displayName}
        width={pixelSize - 8}
        height={pixelSize - 8}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setSourceIndex((i) => i + 1);
        }}
        className="logo-img"
      />
    </LogoFrame>
  );
}

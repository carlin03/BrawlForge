"use client";

import { useMemo } from "react";
import { buildTournamentLogoSources } from "@/lib/data/png-logo-urls";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { LOGO_SIZES, type LogoSize } from "@/components/ui/TeamLogo";
import { LogoFrame } from "@/components/ui/LogoFrame";
import { useLogoImage } from "@/components/ui/useLogoImage";

interface TournamentLogoProps {
  slug: string;
  name: string;
  size?: number | LogoSize;
  className?: string;
  glow?: boolean;
}

export function TournamentLogo({ slug, name, size = "md", className = "", glow = true }: TournamentLogoProps) {
  const pixelSize = typeof size === "number" ? size : LOGO_SIZES[size];
  const logoConfig = useLogoConfig();
  const sources = useMemo(
    () => buildTournamentLogoSources(slug, logoConfig),
    [slug, logoConfig.cacheVersion, logoConfig.overrides],
  );
  const { src, status, onLoad, onError, imgRef } = useLogoImage(sources);
  const cleanName = name.replace(/<!--[\s\S]*?-->/g, "").trim() || slug;
  const loaded = status === "ready" && !!src;

  if (status === "failed" || !src) {
    return (
      <LogoFrame size={pixelSize} kind="tournament" glow={false} className={`logo-missing ${className}`.trim()} title={cleanName}>
        <span className="logo-missing-tag">BSC</span>
      </LogoFrame>
    );
  }

  return (
    <LogoFrame
      size={pixelSize}
      kind="tournament"
      glow={glow && loaded}
      className={`${className} ${loaded ? "is-loaded" : ""}`.trim()}
      title={cleanName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={cleanName}
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

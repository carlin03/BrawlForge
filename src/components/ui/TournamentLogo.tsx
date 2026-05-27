"use client";

import { useEffect, useState } from "react";
import { buildTournamentLogoSources } from "@/lib/data/logo-sources";
import { LOGO_SIZES, type LogoSize } from "@/components/ui/TeamLogo";
import { LogoFrame } from "@/components/ui/LogoFrame";

interface TournamentLogoProps {
  slug: string;
  name: string;
  size?: number | LogoSize;
  className?: string;
  glow?: boolean;
}

function initials(name: string): string {
  const clean = name.replace(/<!--[\s\S]*?-->/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 3).toUpperCase();
}

export function TournamentLogo({ slug, name, size = "md", className = "", glow = true }: TournamentLogoProps) {
  const pixelSize = typeof size === "number" ? size : LOGO_SIZES[size];
  const sources = buildTournamentLogoSources(slug);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = sources[sourceIndex];
  const label = initials(name || slug);

  useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [slug]);

  if (!src || sourceIndex >= sources.length) {
    return (
      <LogoFrame size={pixelSize} kind="tournament" glow={glow} className={className} title={name}>
        <div className="logo-box logo-box-fallback logo-box-tournament" style={{ width: "100%", height: "100%", fontSize: Math.max(9, pixelSize * 0.22) }}>
          {label}
        </div>
      </LogoFrame>
    );
  }

  return (
    <LogoFrame size={pixelSize} kind="tournament" glow={glow && loaded} className={`${className} ${loaded ? "is-loaded" : ""}`.trim()} title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name || "Torneo"}
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

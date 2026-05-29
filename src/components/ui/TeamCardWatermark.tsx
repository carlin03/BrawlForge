"use client";

import { useMemo } from "react";
import { buildTeamLogoSources } from "@/lib/data/png-logo-urls";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
import { useLogoImage } from "@/components/ui/useLogoImage";

/** Logo enorme de fondo en cartas fantasy (sin marco ni glow) */
export function TeamCardWatermark({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const logoConfig = useLogoConfig();
  const sources = useMemo(
    () => buildTeamLogoSources(slug, logoConfig),
    [slug, logoConfig.cacheVersion, logoConfig.overrides],
  );
  const { src, status, onLoad, onError, imgRef } = useLogoImage(sources);
  const tag = (name || slug).replace(/<!--[\s\S]*?-->/g, "").trim().slice(0, 3).toUpperCase() || "—";

  if (status === "failed" || !src) {
    return (
      <span className={`bf-card-watermark-fallback ${className}`.trim()} aria-hidden>
        {tag}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={onError}
      className={`bf-card-watermark-img ${className}`.trim()}
    />
  );
}

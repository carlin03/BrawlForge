"use client";

import { useEffect, useState } from "react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";

type PlayerNationalityBadgeProps = {
  country: string;
  customFlagUrl?: string | null;
  size?: number;
  className?: string;
};

export function PlayerNationalityBadge({
  country,
  customFlagUrl,
  size = 18,
  className = "",
}: PlayerNationalityBadgeProps) {
  const custom = customFlagUrl?.trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [country, custom]);

  if (custom && !failed) {
    const src = toClientLogoUrl(custom);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={src}
        src={src}
        alt={`${country} flag`}
        width={size}
        height={Math.round(size * 0.75)}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`inline-block shrink-0 rounded-sm object-cover shadow-sm ${className}`.trim()}
        style={{ width: size, height: Math.round(size * 0.75) }}
        title={country}
      />
    );
  }

  return <CountryFlag country={country} size={size} className={className} />;
}

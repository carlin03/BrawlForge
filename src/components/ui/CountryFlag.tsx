"use client";

import { useState } from "react";
import { flagUrl } from "@/lib/data/countries";

interface CountryFlagProps {
  country: string;
  size?: number;
  className?: string;
}

export function CountryFlag({ country, size = 16, className = "" }: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const src = flagUrl(country, size <= 20 ? 20 : 40);

  if (failed) {
    return (
      <span
        className={`inline-block shrink-0 rounded-sm bg-bg-hover ${className}`}
        style={{ width: size, height: Math.round(size * 0.75) }}
        title={country}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${country} flag`}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`inline-block shrink-0 rounded-sm object-cover shadow-sm ${className}`}
      style={{ width: size, height: Math.round(size * 0.75) }}
      title={country}
    />
  );
}

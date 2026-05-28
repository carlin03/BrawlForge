"use client";

import { useState } from "react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getPlayerPhotoUrl } from "@/lib/data/player-photo";
import { useResolvedPlayer } from "@/hooks/useResolvedEntity";
import { teamName } from "@/lib/data";

type PlayerPhotoProps = {
  playerSlug: string;
  teamSlug?: string;
  name?: string;
  size?: number;
  className?: string;
  fallbackLogo?: boolean;
  /** Vista previa en admin antes de guardar */
  photoUrlOverride?: string | null;
};

export function PlayerPhoto({
  playerSlug,
  teamSlug,
  name,
  size = 64,
  className = "",
  fallbackLogo = true,
  photoUrlOverride,
}: PlayerPhotoProps) {
  const player = useResolvedPlayer(playerSlug);
  const photoUrl = photoUrlOverride?.trim() || getPlayerPhotoUrl(player);
  const club = teamSlug ?? player?.teamSlug;
  const label = name ?? player?.ign ?? playerSlug;
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <span
        className={`bf-player-photo ${className}`.trim()}
        style={{ width: size, height: size }}
        title={label}
      >
        <img
          src={photoUrl}
          alt={label}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  if (fallbackLogo && club) {
    return <TeamLogo slug={club} name={teamName(club)} size={size} className={className} />;
  }

  return (
    <span
      className={`bf-player-photo bf-player-photo-fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.28) }}
      title={label}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  );
}

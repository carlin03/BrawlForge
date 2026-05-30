"use client";

import { useEffect, useState } from "react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getPlayerPhotoUrl } from "@/lib/data/player-photo";
import { toClientLogoUrl } from "@/lib/data/logo-client-url";
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
  /** Admin: solo foto del formulario + club explícito (no mezclar con catálogo en cliente) */
  skipCatalogPhoto?: boolean;
};

function PlayerPhotoView({
  playerSlug,
  teamSlug,
  name,
  size = 64,
  className = "",
  fallbackLogo = true,
  photoUrlOverride,
  skipCatalogPhoto = false,
}: PlayerPhotoProps) {
  const resolved = useResolvedPlayer(playerSlug);
  const player = skipCatalogPhoto ? null : resolved;
  const rawPhoto = photoUrlOverride?.trim() || (!skipCatalogPhoto && getPlayerPhotoUrl(player)) || null;
  const photoUrl = rawPhoto ? toClientLogoUrl(rawPhoto) : undefined;
  const club =
    teamSlug !== undefined && teamSlug !== null
      ? teamSlug || undefined
      : skipCatalogPhoto
        ? undefined
        : player?.teamSlug;
  const label = name ?? player?.ign ?? playerSlug;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [playerSlug, teamSlug, photoUrlOverride, photoUrl, skipCatalogPhoto]);

  if (photoUrl && !failed) {
    return (
      <span
        className={`bf-player-photo ${className}`.trim()}
        style={{ width: size, height: size }}
        title={label}
      >
        <img
          key={`${playerSlug}-${photoUrl}`}
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
    return (
      <TeamLogo
        key={`club-${playerSlug}-${club}`}
        slug={club}
        name={teamName(club)}
        size={size}
        className={className}
      />
    );
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

export function PlayerPhoto(props: PlayerPhotoProps) {
  const mountKey = `${props.playerSlug}-${props.teamSlug ?? ""}-${props.photoUrlOverride ?? ""}-${props.skipCatalogPhoto ? "a" : "c"}`;
  return <PlayerPhotoView key={mountKey} {...props} />;
}

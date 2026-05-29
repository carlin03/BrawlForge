"use client";

import { TeamLogo } from "@/components/ui/TeamLogo";
import { getTeam, teamName } from "@/lib/data";

export function ProfileClubAvatar({
  teamSlug,
  avatarUrl,
  initials,
  size = 40,
  className = "",
  title,
}: {
  teamSlug?: string | null;
  avatarUrl?: string | null;
  initials: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const team = teamSlug ? getTeam(teamSlug) : null;
  const label = title ?? (team ? team.name : initials);

  return (
    <div
      className={`bf-profile-club-avatar ${teamSlug ? "has-team" : ""} ${className}`.trim()}
      style={{ width: size, height: size }}
      title={label}
      aria-hidden={title ? undefined : true}
    >
      <span className="bf-profile-club-avatar-ring" aria-hidden />
      <span className="bf-profile-club-avatar-glow" aria-hidden />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="bf-profile-club-avatar-img" width={size} height={size} />
      ) : teamSlug ? (
        <span className="bf-profile-club-avatar-logo">
          <TeamLogo slug={teamSlug} name={teamName(teamSlug)} size={Math.round(size * 0.88)} glow={false} />
        </span>
      ) : (
        <span className="bf-profile-club-avatar-initials">{initials}</span>
      )}
    </div>
  );
}

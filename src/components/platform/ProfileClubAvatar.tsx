"use client";

import { TeamLogo } from "@/components/ui/TeamLogo";
import { useLogoConfig } from "@/contexts/LogoConfigContext";
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
  const logoConfig = useLogoConfig();
  const team = teamSlug ? getTeam(teamSlug) : null;
  const label = title ?? (team ? team.name : initials);
  const logoSize = Math.round(size * 0.88);
  const logoKey = teamSlug ? `${teamSlug}-${logoConfig.cacheVersion}` : "no-team";

  return (
    <div
      className={`bf-profile-club-avatar ${teamSlug ? "has-team" : ""} ${className}`.trim()}
      style={{ width: size, height: size, ["--bf-club-avatar-size" as string]: `${size}px` }}
      title={label}
      aria-hidden={title ? undefined : true}
    >
      <span className="bf-profile-club-avatar-ring" aria-hidden />
      <span className="bf-profile-club-avatar-glow" aria-hidden />
      {teamSlug ? (
        <span className="bf-profile-club-avatar-logo">
          <TeamLogo
            key={logoKey}
            slug={teamSlug}
            name={teamName(teamSlug)}
            tag={team?.tag}
            size={logoSize}
            glow={false}
            priority
          />
        </span>
      ) : avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="bf-profile-club-avatar-img" width={size} height={size} />
      ) : (
        <span className="bf-profile-club-avatar-initials">{initials}</span>
      )}
    </div>
  );
}

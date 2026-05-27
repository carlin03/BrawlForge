"use client";

import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { getTeam } from "@/lib/data";

interface TeamBlockCardProps {
  teamSlug: string;
  selected?: boolean;
  pickedCount?: number;
  onClick: () => void;
}

export function TeamBlockCard({ teamSlug, selected, pickedCount = 0, onClick }: TeamBlockCardProps) {
  const team = getTeam(teamSlug);
  if (!team) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`ff-team-block ${selected ? "ff-team-block-selected" : ""}`}
    >
      {pickedCount > 0 && <span className="ff-team-block-picked">{pickedCount} en plantilla</span>}
      <div className="ff-team-block-logo">
        <TeamLogo slug={team.slug} name={team.name} size={72} />
      </div>
      <div className="ff-team-block-tag">{team.tag}</div>
      <div className="ff-team-block-name">{team.name}</div>
      <div className="ff-team-block-meta">
        <RegionBadge region={team.region} />
        <span className="ff-team-block-rank">#{team.rank}</span>
      </div>
      <div className="ff-team-block-form">
        {team.form.map((f, i) => (
          <span key={i} className={`ff-form-${f.toLowerCase()}`}>{f}</span>
        ))}
      </div>
    </button>
  );
}

import Link from "next/link";
import type { EsportsTeam } from "@/lib/data/teams";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";

interface TeamTileProps {
  team: EsportsTeam;
}

export function TeamTile({ team }: TeamTileProps) {
  return (
    <Link href={`/teams/${team.slug}`} className="es-team-tile">
      <span className="es-team-tile-rank">#{team.rank}</span>
      <TeamLogo slug={team.slug} name={team.name} size={48} />
      <span className="es-team-tile-tag">{team.tag}</span>
      <span className="es-team-tile-name">{team.name}</span>
      <div className="es-team-tile-foot">
        <RegionBadge region={team.region} />
        <span>${(team.earnings / 1000).toFixed(0)}K</span>
      </div>
    </Link>
  );
}

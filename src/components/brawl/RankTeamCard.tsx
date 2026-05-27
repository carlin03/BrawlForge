import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { EsportsTeam } from "@/lib/data/teams";

function rankCardClass(rank: number): string {
  if (rank === 1) return "bf-rank-card bf-rank-card-1";
  if (rank === 2) return "bf-rank-card bf-rank-card-2";
  if (rank === 3) return "bf-rank-card bf-rank-card-3";
  const alt = (rank - 4) % 3;
  if (alt === 0) return "bf-rank-card bf-rank-card-alt-blue";
  if (alt === 1) return "bf-rank-card bf-rank-card-alt-yellow";
  return "bf-rank-card bf-rank-card-alt-red";
}

interface RankTeamCardProps {
  team: EsportsTeam;
  showChange?: boolean;
}

export function RankTeamCard({ team, showChange = true }: RankTeamCardProps) {
  return (
    <Link href={`/teams/${team.slug}`} className={rankCardClass(team.rank)}>
      <div className="bf-rank-card-pos">#{team.rank}</div>
      <TeamLogo slug={team.slug} name={team.name} size={team.rank <= 3 ? 64 : 52} />
      <div className="bf-rank-card-body">
        <div className="flex items-center gap-2">
          <CountryFlag country={team.country} size={18} />
          <span className="bf-display text-lg truncate">{team.name}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <RegionBadge region={team.region} />
          {showChange && (
            <span
              className={`bf-badge ${team.rankChange >= 0 ? "bf-badge-blue" : "bf-badge-red"}`}
            >
              {team.rankChange >= 0 ? "+" : ""}
              {team.rankChange}
            </span>
          )}
        </div>
      </div>
      <div className="bf-rank-card-meta">
        <div className="bf-display text-xl text-[var(--bf-yellow)]">
          ${(team.earnings / 1000).toFixed(0)}K
        </div>
        <div className="mt-2 flex justify-end gap-1">
          {team.form.map((f, i) => (
            <span key={i} className={`bf-form-pill bf-form-${f.toLowerCase()}`}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

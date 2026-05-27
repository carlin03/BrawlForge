import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import type { EsportsTeam } from "@/lib/data/teams";

const PODIUM_ORDER = [2, 1, 3] as const;

export function TeamsPodium({ teams }: { teams: EsportsTeam[] }) {
  const top3 = teams.filter((t) => t.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return null;

  const byRank = Object.fromEntries(top3.map((t) => [t.rank, t]));

  return (
    <div className="tm-podium">
      {PODIUM_ORDER.map((rank) => {
        const team = byRank[rank];
        if (!team) return null;
        return (
          <Link
            key={team.slug}
            href={`/teams/${team.slug}`}
            className={`tm-podium-slot tm-podium-${rank}`}
          >
            <div className="tm-podium-card">
              <span className="tm-podium-rank">#{rank}</span>
              <TeamLogo slug={team.slug} name={team.name} size={rank === 1 ? 88 : 72} />
              <div className="tm-podium-tag">{team.tag}</div>
              <div className="tm-podium-name">{team.name}</div>
              <div className="tm-podium-prize">${(team.earnings / 1000).toFixed(0)}K</div>
            </div>
            <div className="tm-podium-bar">{rank}</div>
          </Link>
        );
      })}
    </div>
  );
}

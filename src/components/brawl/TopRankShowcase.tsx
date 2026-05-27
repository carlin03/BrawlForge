import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import type { EsportsTeam } from "@/lib/data/teams";

const TOP_STYLE: Record<number, { card: string; label: string }> = {
  1: { card: "bf-top-rank-1", label: "bf-top-label-yellow" },
  2: { card: "bf-top-rank-2", label: "bf-top-label-blue" },
  3: { card: "bf-top-rank-3", label: "bf-top-label-red" },
};

interface TopRankShowcaseProps {
  teams: EsportsTeam[];
}

export function TopRankShowcase({ teams }: TopRankShowcaseProps) {
  const top3 = teams.filter((t) => t.rank <= 3).sort((a, b) => a.rank - b.rank);
  if (top3.length === 0) return null;

  return (
    <div className="bf-top-rank-grid">
      {top3.map((team) => {
        const style = TOP_STYLE[team.rank];
        return (
          <Link key={team.slug} href={`/teams/${team.slug}`} className={`bf-top-rank-card ${style.card}`}>
            <div className={`bf-top-rank-label ${style.label}`}>#{team.rank}</div>
            <TeamLogo slug={team.slug} name={team.name} size={80} />
            <div className="bf-top-rank-name">{team.name}</div>
            <div className="flex items-center gap-2 text-sm">
              <CountryFlag country={team.country} size={18} />
              <span>{team.region}</span>
            </div>
            <div className="bf-top-rank-prize">${(team.earnings / 1000).toFixed(0)}K</div>
            <div className="flex gap-1">
              {team.form.map((f, i) => (
                <span key={i} className={`bf-form-pill bf-form-${f.toLowerCase()}`}>{f}</span>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { EsportsTeam } from "@/lib/data/teams";

function stripeClass(rank: number): string {
  if (rank === 1) return "tm-club-stripe-1";
  if (rank === 2) return "tm-club-stripe-2";
  if (rank === 3) return "tm-club-stripe-3";
  return "tm-club-stripe-default";
}

function changeClass(change: number): string {
  if (change > 0) return "tm-club-change-up";
  if (change < 0) return "tm-club-change-down";
  return "tm-club-change-flat";
}

function changeLabel(change: number): string {
  if (change > 0) return `+${change}`;
  if (change < 0) return String(change);
  return "—";
}

interface TeamClubCardProps {
  team: EsportsTeam;
}

export function TeamClubCard({ team }: TeamClubCardProps) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className={`tm-club-card ${team.rank <= 3 ? "tm-club-card-top3" : ""}`}
    >
      <div className={`tm-club-stripe ${stripeClass(team.rank)}`} />
      <span className="tm-club-rank">#{team.rank}</span>
      <span className={`tm-club-change ${changeClass(team.rankChange)}`}>
        {changeLabel(team.rankChange)}
      </span>
      <div className="tm-club-logo">
        <TeamLogo slug={team.slug} name={team.name} size={team.rank <= 3 ? 72 : 64} />
      </div>
      <div className="tm-club-tag">{team.tag}</div>
      <div className="tm-club-name">{team.name}</div>
      <div className="tm-club-meta">
        <CountryFlag country={team.country} size={14} />
        <RegionBadge region={team.region} />
      </div>
      <div className="tm-club-form">
        {team.form.map((f, i) => (
          <span key={i} className={`ff-form-${f.toLowerCase()}`}>
            {f}
          </span>
        ))}
      </div>
      <div className="tm-club-foot">
        <span className="tm-club-prize">${(team.earnings / 1000).toFixed(0)}K</span>
        <span className="tm-club-roster">{team.roster.length} pros</span>
      </div>
    </Link>
  );
}

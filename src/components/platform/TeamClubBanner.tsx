import Link from "next/link";
import type { EsportsTeam } from "@/lib/data/teams";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { FormDots } from "@/components/platform/ui";
import { getTeamPlatformMeta, getPlayersByTeam } from "@/lib/data";
import { PlayerCardMini } from "@/components/platform/PlayerCard";

const REGION_GLOW: Record<string, string> = {
  EMEA: "bf-club-emea",
  NA: "bf-club-na",
  SA: "bf-club-sa",
  EA: "bf-club-ea",
};

export function TeamClubBanner({ team, variant = "default" }: { team: EsportsTeam; variant?: "default" | "champion" }) {
  const meta = getTeamPlatformMeta(team.slug);
  const stars = getPlayersByTeam(team.slug)
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, 2);
  const wins = team.form.filter((f) => f === "W").length;

  return (
    <div className={`bf-club ${REGION_GLOW[team.region] ?? ""} ${variant === "champion" ? "bf-club-champion" : ""}`}>
      <Link href={`/teams/${team.slug}`} className="bf-club-main">
        <div className="bf-club-glow" aria-hidden />
        <div className="bf-club-head">
          <span className="bf-club-rank">#{team.rank}</span>
          {meta.trending === "hot" && <span className="bf-club-hot">HOT</span>}
        </div>
        <TeamLogo slug={team.slug} name={team.name} size={variant === "champion" ? 64 : 48} />
        <div className="bf-club-name">{team.name}</div>
        <div className="bf-club-tag">{team.tag} · {wins}W forma</div>
        <FormDots form={team.form} />
        <div className="bf-club-meta">
          <span>{meta.fantasyPick}% fantasy</span>
          <span>{meta.votePct}% fan vote</span>
        </div>
      </Link>
      {stars.length > 0 && (
        <div className="bf-club-stars">
          {stars.map((p) => (
            <PlayerCardMini key={p.slug} playerSlug={p.slug} />
          ))}
        </div>
      )}
    </div>
  );
}

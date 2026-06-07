import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam, teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

function tag(slug: string) {
  return getTeam(slug)?.tag ?? teamName(slug).slice(0, 3);
}

export function PulseMatchRow({ match }: { match: EsportsMatch }) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const winA = finished && match.scoreA > match.scoreB;
  const winB = finished && match.scoreB > match.scoreA;
  const a = teamName(match.teamASlug, match);
  const b = teamName(match.teamBSlug, match);

  return (
    <Link href={`/matches/${match.id}`} className={`pl-match ${live ? "pl-match-live" : ""}`}>
      <div className="pl-match-top">
        {live && (
          <span className="pl-match-live-tag">
            <span className="pl-live-dot" style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
            Live
          </span>
        )}
        {!live && (
          <span>
            {finished ? "Final" : new Date(match.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </span>
        )}
        <span>{tournamentName(match.tournamentSlug)}</span>
        <span>{match.format}</span>
      </div>

      <div className="pl-match-clash">
        <div className="pl-match-team">
          <TeamLogo slug={match.teamASlug} name={a} size={40} />
          <div>
            <div className={`pl-match-name ${winA ? "pl-gold" : ""}`}>{a}</div>
            <div className="pl-match-tag">{tag(match.teamASlug)}</div>
          </div>
        </div>

        <div className="pl-match-score">
          {match.status === "upcoming" ? (
            <span className="pl-match-vs">VS</span>
          ) : (
            <>
              <span className={winA ? "pl-gold" : "pl-dim"}>{match.scoreA}</span>
              <span className="pl-dim">–</span>
              <span className={winB ? "pl-gold" : "pl-dim"}>{match.scoreB}</span>
            </>
          )}
        </div>

        <div className="pl-match-team right">
          <TeamLogo slug={match.teamBSlug} name={b} size={40} />
          <div>
            <div className={`pl-match-name ${winB ? "pl-gold" : ""}`}>{b}</div>
            <div className="pl-match-tag">{tag(match.teamBSlug)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PulseCard({
  title,
  href,
  linkText = "Ver todo →",
  children,
  tabs,
}: {
  title: string;
  href?: string;
  linkText?: string;
  children: React.ReactNode;
  tabs?: React.ReactNode;
}) {
  return (
    <section className="pl-card">
      <div className="pl-card-head">
        <span className="pl-card-title">{title}</span>
        {href && (
          <Link href={href} className="pl-card-link">
            {linkText}
          </Link>
        )}
      </div>
      {tabs}
      <div className="pl-card-body">{children}</div>
    </section>
  );
}

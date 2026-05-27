import Link from "next/link";
import type { EsportsMatch } from "@/lib/data/matches";
import { getTeam, teamName, tournamentName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

function teamTag(slug: string): string {
  return getTeam(slug)?.tag ?? teamName(slug).slice(0, 3).toUpperCase();
}

function formatWhen(m: EsportsMatch): string {
  if (m.status === "live") return "LIVE";
  if (m.status === "finished") return "FT";
  return new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function HomeMatchFeed({ matches }: { matches: EsportsMatch[] }) {
  if (!matches.length) {
    return (
      <div className="mc-empty">
        <p>No hay partidos con equipos confirmados en esta pestaña.</p>
        <Link href="/matches" className="nv-btn nv-btn-line">Ver calendario completo</Link>
      </div>
    );
  }

  return (
    <div className="mc-feed">
      {matches.map((m) => {
        const live = m.status === "live";
        const finished = m.status === "finished";
        const winA = finished && m.scoreA > m.scoreB;
        const winB = finished && m.scoreB > m.scoreA;
        const nameA = teamName(m.teamASlug);
        const nameB = teamName(m.teamBSlug);

        return (
          <Link key={m.id} href={`/matches/${m.id}`} className={`mc-row ${live ? "mc-row-live" : ""}`}>
            <div className="mc-row-meta">
              <span className={`mc-row-time ${live ? "c-red" : ""}`}>{formatWhen(m)}</span>
              <span className="mc-row-event">{tournamentName(m.tournamentSlug)}</span>
              <span className="mc-row-stage">{m.stage}</span>
              <span className="mc-row-fmt">{m.format}</span>
            </div>

            <div className="mc-row-clash">
              <div className={`mc-side ${winA ? "mc-side-win" : ""}`}>
                <TeamLogo slug={m.teamASlug} name={nameA} tag={teamTag(m.teamASlug)} size={36} />
                <span className="mc-side-tag">{teamTag(m.teamASlug)}</span>
                <span className="mc-side-name">{nameA}</span>
              </div>

              <div className="mc-center">
                {m.status === "upcoming" ? (
                  <span className="mc-vs">VS</span>
                ) : (
                  <span className="mc-score">
                    <span className={winA ? "c-yellow" : "nv-dim"}>{m.scoreA}</span>
                    <span className="nv-dim">:</span>
                    <span className={winB ? "c-yellow" : "nv-dim"}>{m.scoreB}</span>
                  </span>
                )}
              </div>

              <div className={`mc-side mc-side-right ${winB ? "mc-side-win" : ""}`}>
                <TeamLogo slug={m.teamBSlug} name={nameB} tag={teamTag(m.teamBSlug)} size={36} />
                <span className="mc-side-tag">{teamTag(m.teamBSlug)}</span>
                <span className="mc-side-name">{nameB}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

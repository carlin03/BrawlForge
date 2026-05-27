import Link from "next/link";
import {
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  teamName,
} from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function LiveTicker() {
  const live = getLiveMatches();
  const upcoming = getUpcomingMatches().slice(0, 6);
  const recent = getRecentMatches(4);
  const items = [...live, ...upcoming, ...recent];
  const doubled = [...items, ...items];

  if (items.length === 0) return null;

  return (
    <div className="es-ticker">
      <div className={`es-ticker-label ${live.length > 0 ? "is-live" : ""}`}>
        {live.length > 0 && <span className="es-live-dot" />}
        {live.length > 0 ? `${live.length} LIVE` : "PARTIDOS"}
      </div>
      <div className="es-ticker-track-wrap">
        <div className="es-ticker-track">
          {doubled.map((match, i) => (
            <Link key={`${match.id}-${i}`} href={`/matches/${match.id}`} className="es-ticker-item">
              <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug)} size={16} />
              <span>{teamName(match.teamASlug)}</span>
              {match.status === "finished" || match.status === "live" ? (
                <span className="es-ticker-score">
                  {match.scoreA}–{match.scoreB}
                </span>
              ) : (
                <span>vs</span>
              )}
              <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug)} size={16} />
              <span>{teamName(match.teamBSlug)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

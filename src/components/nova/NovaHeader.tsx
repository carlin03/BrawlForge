import Link from "next/link";
import { getLiveMatches, getUpcomingMatches, getRecentMatches, teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function NovaHeader() {
  const live = getLiveMatches();
  const items = [...live, ...getUpcomingMatches().slice(0, 6), ...getRecentMatches(3)];
  const loop = [...items, ...items];

  return (
    <header className="nv-header">
      <span className="nv-header-title">
        BRAWL<strong>FORGE</strong>
      </span>
      {live.length > 0 && <span className="nv-live-dot" />}
      <div className="nv-ticker">
        {items.length > 0 ? (
          <div className="nv-ticker-inner">
            {loop.map((m, i) => (
              <Link key={`${m.id}-${i}`} href={`/matches/${m.id}`} className="nv-ticker-item">
                <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={14} />
                {teamName(m.teamASlug)}
                {m.status === "upcoming" ? (
                  " vs "
                ) : (
                  <span className="nv-ticker-score">
                    {" "}
                    {m.scoreA}-{m.scoreB}{" "}
                  </span>
                )}
                <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={14} />
                {teamName(m.teamBSlug)}
              </Link>
            ))}
          </div>
        ) : (
          <span style={{ padding: "0 12px", color: "var(--nv-dim)", fontSize: 11 }}>Sin partidos</span>
        )}
      </div>
      <span className="nv-user">2340 pts</span>
    </header>
  );
}

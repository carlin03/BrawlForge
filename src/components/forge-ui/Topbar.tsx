import Link from "next/link";
import {
  getLiveMatches,
  getUpcomingMatches,
  getRecentMatches,
  teamName,
} from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function Topbar() {
  const live = getLiveMatches();
  const items = [...live, ...getUpcomingMatches().slice(0, 8), ...getRecentMatches(4)];
  const loop = [...items, ...items];

  return (
    <header className="x-topbar">
      <div className={`x-ticker-badge ${live.length ? "live" : ""}`}>
        {live.length > 0 && <span className="x-live-pip" />}
        {live.length ? `${live.length} LIVE` : "SCORES"}
      </div>
      <div className="x-ticker-scroll">
        {items.length > 0 ? (
          <div className="x-ticker-inner">
            {loop.map((m, i) => (
              <Link key={`${m.id}-${i}`} href={`/matches/${m.id}`} className="x-ticker-hit">
                <TeamLogo slug={m.teamASlug} name={teamName(m.teamASlug)} size={14} />
                <span>{teamName(m.teamASlug)}</span>
                {m.status === "upcoming" ? (
                  <span className="x-td-dim">vs</span>
                ) : (
                  <span className="x-td-mono x-td-gold">
                    {m.scoreA}-{m.scoreB}
                  </span>
                )}
                <TeamLogo slug={m.teamBSlug} name={teamName(m.teamBSlug)} size={14} />
                <span>{teamName(m.teamBSlug)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <span style={{ padding: "0 14px", color: "var(--x-dim)", fontSize: 11 }}>Sin partidos</span>
        )}
      </div>
      <div className="x-topbar-user">ForgeManager · 2340 pts</div>
    </header>
  );
}

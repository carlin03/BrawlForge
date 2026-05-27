import Link from "next/link";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { ProRow } from "@/components/esports/ProRow";
import {
  getTournamentHub,
  getStandingTeamName,
  type TournamentHubData,
} from "@/lib/data/tournament-hub";

interface TournamentHubProps {
  slug: string;
  data?: TournamentHubData;
}

export function TournamentHub({ slug, data }: TournamentHubProps) {
  const hub = data ?? getTournamentHub(slug);
  const maxMapPlays = Math.max(...hub.maps.map((m) => m.plays), 1);
  const maxBans = Math.max(...hub.bans.map((b) => b.bans), 1);

  return (
    <div className="th-hub">
      <div className="mb-6 flex flex-wrap gap-2">
        {hub.regions.map((r) => (
          <span key={r} className="bf-badge bf-badge-blue">
            {r}
          </span>
        ))}
        <span className="text-sm text-[var(--bf-muted)] ml-auto">{hub.scheduleNote}</span>
      </div>

      <div className="th-grid">
        <div className="space-y-4">
          {hub.standings.length > 0 && (
            <div className="th-panel">
              <div className="th-panel-title">Clasificación</div>
              {hub.standings.map((row) => (
                <div key={row.teamSlug} className="th-standing-row">
                  <span className="bf-display text-lg text-[var(--bf-yellow)]">{row.rank}</span>
                  <Link href={`/teams/${row.teamSlug}`} className="flex items-center gap-2 font-bold hover:text-[var(--bf-blue)]">
                    <TeamLogo slug={row.teamSlug} name={getStandingTeamName(row.teamSlug)} size={28} />
                    {getStandingTeamName(row.teamSlug)}
                  </Link>
                  <span className="text-[var(--bf-muted)]">{row.w}W</span>
                  <span className="text-[var(--bf-muted)]">{row.l}L</span>
                  <span className="font-bold">{row.diff}</span>
                </div>
              ))}
            </div>
          )}

          <div className="th-panel">
            <div className="th-panel-title">Mapas más jugados</div>
            {hub.maps.map((m) => (
              <div key={m.map} className="th-bar-row">
                <span>{m.map}</span>
                <div className="th-bar">
                  <div className="th-bar-fill" style={{ width: `${(m.plays / maxMapPlays) * 100}%` }} />
                </div>
                <span className="text-right text-[var(--bf-blue)]">{m.plays}</span>
              </div>
            ))}
          </div>

          <div className="th-panel">
            <div className="th-panel-title">Bans más usados</div>
            {hub.bans.map((b) => (
              <div key={b.brawler} className="th-bar-row">
                <span>{b.brawler}</span>
                <div className="th-bar">
                  <div
                    className="th-bar-fill"
                    style={{
                      width: `${(b.bans / maxBans) * 100}%`,
                      background: "linear-gradient(90deg, var(--bf-red), #ff6b6b)",
                    }}
                  />
                </div>
                <span className="text-right text-[var(--bf-red)]">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="th-panel">
            <div className="th-panel-title">MVPs del evento</div>
            {hub.mvps.map((mvp) => (
              <div key={mvp.playerSlug} className="th-mvp-row">
                <TeamLogo slug={mvp.teamSlug} name={getStandingTeamName(mvp.teamSlug)} size={36} />
                <div className="flex-1 min-w-0">
                  <Link href={`/players/${mvp.playerSlug}`} className="font-bold hover:text-[var(--bf-yellow)]">
                    {mvp.ign}
                  </Link>
                  <div className="text-xs text-[var(--bf-muted)]">{getStandingTeamName(mvp.teamSlug)}</div>
                </div>
                <div className="text-right">
                  <div className="bf-display text-lg text-[var(--bf-yellow)]">{mvp.value}</div>
                  <div className="text-[10px] uppercase text-[var(--bf-muted)]">{mvp.stat}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="th-panel">
            <div className="th-panel-title">Top picks del torneo</div>
            <table className="es-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Rating</th>
                  <th>Pick%</th>
                </tr>
              </thead>
              <tbody>
                {hub.fantasyPicks.map((fp) => (
                  <ProRow
                    key={fp.playerSlug}
                    playerSlug={fp.playerSlug}
                    pickRate={fp.pickRate}
                    showForm={false}
                    showRating
                    showPick
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="th-panel">
            <div className="th-panel-title">Premios</div>
            {hub.prizeBreakdown.map((p) => (
              <div key={p.place} className="flex justify-between py-2 border-b border-white/5 text-sm">
                <span className="text-[var(--bf-muted)]">{p.place}</span>
                <span className="font-bold text-[var(--bf-yellow)]">{p.prize}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/fantasy" className="bf-btn bf-btn-yellow">
              Pro Picks del torneo
            </Link>
            <Link href="/predictions" className="bf-btn bf-btn-red">
              Vota
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

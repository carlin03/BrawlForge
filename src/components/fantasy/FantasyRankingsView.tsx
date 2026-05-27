"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArenaPanel } from "@/components/arena/ArenaUI";
import { TournamentFantasyBar } from "@/components/fantasy/TournamentFantasyBar";
import { FantasyNav } from "@/components/fantasy/FantasyNav";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getTournamentFantasyProfile,
  getTournamentLeaderboard,
  getUserSquad,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { hasFantasyForTournament } from "@/lib/data/fantasy-rosters";
import { getPlayer, tournamentName } from "@/lib/data";

function resolveTournamentParam(param: string | null, validSlugs: string[]): string | null {
  if (!param) return null;
  if (validSlugs.includes(param)) return param;
  if (hasFantasyForTournament(param)) return param;
  return null;
}

export function FantasyRankingsView() {
  const searchParams = useSearchParams();
  const tournaments = getFantasyTournaments(false);
  const validSlugs = tournaments.map((t) => t.slug);
  const paramTournament = searchParams.get("tournament");
  const initial = resolveTournamentParam(paramTournament, validSlugs) ?? DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);

  useEffect(() => {
    const resolved = resolveTournamentParam(paramTournament, validSlugs);
    if (resolved) setActiveTournament(resolved);
  }, [paramTournament, validSlugs]);

  const profile = getTournamentFantasyProfile(activeTournament);
  const leaderboard = getTournamentLeaderboard(activeTournament);
  const squad = getUserSquad(activeTournament);
  const captain = squad.find((s) => s.isCaptain);
  const captainPlayer = captain ? getPlayer(captain.playerSlug) : null;

  function handleSelect(slug: string) {
    setActiveTournament(slug);
    const params = new URLSearchParams();
    params.set("tournament", slug);
    window.history.replaceState(null, "", `/fantasy/rankings?${params.toString()}`);
  }

  return (
    <>
      <h1 className="ar-h1">Clasificación</h1>
      <p className="ar-lead">{tournamentName(activeTournament)} · {profile.participants.toLocaleString()} participantes</p>

      <div className="ar-meta-row">
        <div className="ar-meta-item">
          <strong style={{ color: "var(--ar-pick)" }}>{profile.totalPoints || "—"}</strong>
          <span>Tus puntos</span>
        </div>
        <div className="ar-meta-item">
          <strong>{profile.rank > 0 ? `#${profile.rank.toLocaleString()}` : "—"}</strong>
          <span>Posición</span>
        </div>
        {captainPlayer && (
          <div className="ar-meta-item">
            <strong>{captainPlayer.ign}</strong>
            <span>Tu capitán</span>
          </div>
        )}
      </div>

      <FantasyNav />
      <TournamentFantasyBar activeSlug={activeTournament} onSelect={handleSelect} />

      {profile.rank > 0 && (
        <div className="bc-user-strip">
          <div>
            <div className="bc-user-strip-name">{profile.teamName}</div>
            <div className="bc-user-strip-meta">Tu entrada en este evento</div>
          </div>
          <div className="bc-user-strip-stats">
            <div className="bc-metric">
              <span className="bc-metric-val c-yellow">#{profile.rank.toLocaleString()}</span>
              <span className="bc-metric-lbl">Rank</span>
            </div>
            <div className="bc-metric">
              <span className="bc-metric-val">{profile.totalPoints}</span>
              <span className="bc-metric-lbl">Puntos</span>
            </div>
          </div>
        </div>
      )}

      <ArenaPanel title="Ranking">
        <table className="es-table es-table-premium">
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>MVP</th>
              <th>Ronda</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr
                key={entry.rank}
                className={`es-pro-row ${entry.rank <= 3 ? `es-pro-row-${entry.rank === 1 ? "gold" : entry.rank === 2 ? "silver" : "bronze"}` : ""}`}
              >
                <td className={`es-pro-rank ${entry.rank <= 3 ? "es-pro-rank-top" : ""}`}>{entry.rank}</td>
                <td className="es-pro-main">
                  <div className="es-pro-name">{entry.username}</div>
                </td>
                <td className="es-pro-cell">
                  <span className="es-pro-mvp" style={{ marginLeft: 0 }}>{entry.captainIgn}</span>
                </td>
                <td className="es-pro-cell es-pro-num c-blue">+{entry.roundPoints}</td>
                <td className="es-pro-cell es-pro-num c-yellow" style={{ textAlign: "right" }}>{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ArenaPanel>

      <Link href={`/fantasy?tournament=${activeTournament}`} className="ar-btn ar-btn-pick" style={{ marginTop: 16, display: "inline-flex" }}>
        Editar alineación
      </Link>
    </>
  );
}

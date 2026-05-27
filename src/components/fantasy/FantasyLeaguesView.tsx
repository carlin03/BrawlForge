"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaUI";
import { TournamentFantasyBar } from "@/components/fantasy/TournamentFantasyBar";
import { FantasyNav } from "@/components/fantasy/FantasyNav";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getFantasyLeaguesForTournament,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { tournamentName } from "@/lib/data";

const leagueTypeLabel = {
  global: "Global",
  pro: "Pro",
  social: "Social",
  regional: "Regional",
} as const;

export function FantasyLeaguesView() {
  const searchParams = useSearchParams();
  const tournaments = getFantasyTournaments(true);
  const validSlugs = tournaments.map((t) => t.slug);
  const paramTournament = searchParams.get("tournament");
  const initial =
    paramTournament && validSlugs.includes(paramTournament)
      ? paramTournament
      : DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);

  useEffect(() => {
    if (paramTournament && validSlugs.includes(paramTournament)) {
      setActiveTournament(paramTournament);
    }
  }, [paramTournament, validSlugs]);

  const leagues = getFantasyLeaguesForTournament(activeTournament);

  function handleSelect(slug: string) {
    setActiveTournament(slug);
    const params = new URLSearchParams();
    params.set("tournament", slug);
    window.history.replaceState(null, "", `/fantasy/leagues?${params.toString()}`);
  }

  return (
    <>
      <h1 className="ar-h1">Ligas</h1>
      <p className="ar-lead">Compite con amigos en {tournamentName(activeTournament)}.</p>

      <FantasyNav />
      <TournamentFantasyBar activeSlug={activeTournament} onSelect={handleSelect} />

      <ArenaPanel title="Tus ligas">
        {leagues.length > 0 ? (
          <table className="bc-league-table">
            <thead>
              <tr>
                <th>Liga</th>
                <th>Miembros</th>
                <th>Tus pts</th>
                <th>Líder</th>
                <th style={{ textAlign: "right" }}>Posición</th>
              </tr>
            </thead>
            <tbody>
              {leagues.map((league) => (
                <tr key={league.id} className="bc-league-row">
                  <td>
                    <div className="bc-league-name">{league.name}</div>
                    <span className={`bc-league-type bc-league-type-${league.type}`}>
                      {leagueTypeLabel[league.type]}
                    </span>
                  </td>
                  <td className="nv-dim">{league.members.toLocaleString()}</td>
                  <td className="bc-league-pts">{league.yourPoints}</td>
                  <td className="nv-dim">{league.leaderName}</td>
                  <td className="bc-league-rank">
                    {league.yourRank > 0 ? `#${league.yourRank.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: 24, textAlign: "center", margin: 0, color: "var(--ar-dim)" }}>
            Aún no hay ligas para este evento.
          </p>
        )}
      </ArenaPanel>

      <div className="bc-create-bar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 8, background: "var(--ar-vote-soft)", color: "var(--ar-vote)", flexShrink: 0 }}>
          <Plus size={22} />
        </div>
        <div className="bc-create-bar-text" style={{ flex: 1 }}>
          <h3>Crear liga</h3>
          <p>Invita amigos con un código y compite en {tournamentName(activeTournament)}.</p>
        </div>
        <button type="button" className="ar-btn ar-btn-vote">Crear liga</button>
      </div>
    </>
  );
}

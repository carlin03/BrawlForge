"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import type { EsportsTeam } from "@/lib/data/teams";
import type { Region } from "@/lib/types";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getPlayersByTeam,
  getTournamentFantasyProfile,
} from "@/lib/data";
import type { FantasyLeaderboardRow } from "@/lib/supabase/game-types";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

const REGIONS: (Region | "all")[] = ["all", "EMEA", "NA", "SA", "EA"];
type RankTab = "teams" | "fantasy";

export function RankingsView({ teams }: { teams: EsportsTeam[] }) {
  const { isLoggedIn, profile } = useAuth();
  const { game } = useGame();
  const [tab, setTab] = useState<RankTab>("teams");
  const [region, setRegion] = useState<Region | "all">("all");
  const [fantasyBoard, setFantasyBoard] = useState<FantasyLeaderboardRow[]>([]);

  const ranked = useMemo(() => {
    const filtered = region === "all" ? teams : teams.filter((t) => t.region === region);
    return [...filtered].sort((a, b) => a.rank - b.rank);
  }, [teams, region]);

  const fantasyMeta = getTournamentFantasyProfile(DEFAULT_FANTASY_TOURNAMENT);

  useEffect(() => {
    if (tab !== "fantasy") return;
    fetch(`/api/fantasy/leaderboard?tournament=${DEFAULT_FANTASY_TOURNAMENT}&limit=100`)
      .then((r) => r.json())
      .then((d) => setFantasyBoard(d.leaderboard ?? []))
      .catch(() => setFantasyBoard([]));
  }, [tab]);

  const myRank = game?.fantasyRank ?? null;
  const myPoints = game?.fantasyPoints ?? 0;

  const podium = ranked.slice(0, 3);

  return (
    <PageUltraShell className="bf-rankings-page">
      <PageUltraHero
        kicker={
          <>
            <BarChart3 size={14} /> Rankings BSC
          </>
        }
        title={
          <>
            Clasificación <em>elite</em>
          </>
        }
        lead="Power ranking de clubes y tabla fantasy del torneo principal."
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{ranked.length}</b>
              <span>Equipos</span>
            </div>
            <div className="fu-stat">
              <b>{fantasyBoard.length || "—"}</b>
              <span>Managers</span>
            </div>
            <div className="fu-stat">
              <b>{isLoggedIn && myRank != null ? `#${myRank}` : "—"}</b>
              <span>Tu puesto</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href={tab === "teams" ? "/teams" : "/fantasy"} className="fu-btn fu-btn-gold">
              {tab === "teams" ? "Clubes" : "Mi plantilla"}
            </Link>
            <Link href="/predictions" className="fu-btn fu-btn-red">
              Predicciones
            </Link>
          </>
        }
        showcase={
          tab === "teams" && podium.length >= 3 ? (
            <div className="fu-cards-showcase" style={{ minHeight: 240 }}>
              {[podium[1], podium[0], podium[2]].map((t, i) => (
                <Link
                  key={t.slug}
                  href={`/teams/${t.slug}`}
                  className={`fu-card-float fu-card-float-${i === 1 ? 2 : i === 0 ? 1 : 3}`}
                  style={{ textDecoration: "none" }}
                >
                  <TeamLogo slug={t.slug} name={t.name} size={i === 1 ? 80 : 64} glow />
                  <span style={{ fontWeight: 800, fontSize: 11 }}>#{i === 1 ? 1 : i === 0 ? 2 : 3}</span>
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />

      <div className="fu-tabs">
        <button
          type="button"
          className={`fu-tab ${tab === "teams" ? "is-on" : ""}`}
          onClick={() => setTab("teams")}
        >
          Equipos <span className="bf-home-tab-count">{ranked.length}</span>
        </button>
        <button
          type="button"
          className={`fu-tab ${tab === "fantasy" ? "is-on" : ""}`}
          onClick={() => setTab("fantasy")}
        >
          Fantasy <span className="bf-home-tab-count">{fantasyBoard.length}</span>
        </button>
      </div>

      {tab === "teams" && (
        <>
          <div className="fu-tabs">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`fu-tab ${region === r ? "is-on" : ""}`}
                onClick={() => setRegion(r)}
              >
                {r === "all" ? "Global" : r}
              </button>
            ))}
          </div>
          <div className="bf-rank-table-wrap fu-panel fu-panel-glow">
            <table className="bf-rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>Región</th>
                  <th>Roster</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ranked.map((t, i) => {
                  const roster = getPlayersByTeam(t.slug).length;
                  const pos = i + 1;
                  return (
                    <tr key={t.slug} className={pos <= 3 ? `is-top-${pos}` : ""}>
                      <td className="bf-rank-pos">
                        <span className="bf-rank-num">{pos}</span>
                      </td>
                      <td>
                        <Link href={`/teams/${t.slug}`} className="bf-rank-team">
                          <TeamLogo slug={t.slug} name={t.name} size={40} />
                          <div>
                            <strong>{t.tag}</strong>
                            <span>{t.name}</span>
                          </div>
                        </Link>
                      </td>
                      <td>
                        <RegionBadge region={t.region} />
                      </td>
                      <td className="bf-rank-roster">{roster} jugadores</td>
                      <td>
                        <Link href={`/teams/${t.slug}`} className="bf-rank-link">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ranked.length === 0 && <p className="bf-home-empty">No hay equipos en esta región.</p>}
        </>
      )}

      {tab === "fantasy" && (
        <>
          <p className="bf-rankings-fantasy-meta">
            Torneo: <strong>{fantasyMeta.teamName}</strong>
            {isLoggedIn && myRank != null && (
              <>
                {" "}
                · Tu posición #{myRank.toLocaleString()} · {myPoints} pts
              </>
            )}
            {!isLoggedIn && (
              <>
                {" "}
                · <Link href="/login?next=/rankings">Inicia sesión</Link> para ver tu puesto
              </>
            )}
          </p>
          <div className="bf-rank-table-wrap fu-panel fu-panel-glow">
            <table className="bf-rank-table bf-rank-table-fantasy">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Manager</th>
                  <th>IGN</th>
                  <th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {fantasyBoard.map((row) => (
                  <tr key={row.user_id} className={row.rank <= 3 ? `is-top-${row.rank}` : ""}>
                    <td className="bf-rank-pos">
                      <span className="bf-rank-num">{row.rank}</span>
                    </td>
                    <td>
                      <strong>{row.team_name || row.display_name}</strong>
                    </td>
                    <td>{row.ign}</td>
                    <td className="bf-rank-points">{row.total_points.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fantasyBoard.length === 0 && (
            <p className="bf-home-empty">Aún no hay managers en este torneo. Sé el primero en /fantasy.</p>
          )}
          <div className="bf-rankings-fantasy-cta">
            <Link href="/fantasy" className="bp-btn bp-btn-gold">
              Ir a Fantasy
            </Link>
          </div>
        </>
      )}
    </PageUltraShell>
  );
}

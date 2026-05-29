"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Crown, Medal, Trophy } from "lucide-react";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { SectionTabsBar } from "@/components/platform/SectionTabsBar";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { FormDots } from "@/components/platform/ui";
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
  const rest = ranked.slice(3);

  return (
    <PageUltraShell className="bf-rankings-hub">
      <header className="bf-rankings-hub-hero">
        <div>
          <p className="bf-rankings-hub-kicker">
            <BarChart3 size={14} aria-hidden /> Rankings BSC
          </p>
          <h1>
            Clasificación <em>elite</em>
          </h1>
          <p>Power ranking de clubes y managers fantasy del circuito 2026.</p>
        </div>
        <div className="bf-rankings-hub-stats">
          <div>
            <b>{ranked.length}</b>
            <span>Clubes</span>
          </div>
          <div>
            <b>{fantasyBoard.length || "—"}</b>
            <span>Managers</span>
          </div>
          <div>
            <b>{isLoggedIn && myRank != null ? `#${myRank}` : "—"}</b>
            <span>Tu puesto</span>
          </div>
        </div>
        <div className="bf-rankings-hub-actions">
          <Link href={tab === "teams" ? "/teams" : "/fantasy"} className="fu-btn fu-btn-gold">
            {tab === "teams" ? "Ver clubes" : "Mi plantilla"}
          </Link>
          <Link href="/predictions" className="fu-btn fu-btn-red">
            Predicciones
          </Link>
        </div>
      </header>

      <SectionTabsBar entityLogo={<TournamentLogo slug="bsc-2026-brawl-cup" name="BSC 2026" size={44} glow />}>
        <div className="bf-rankings-hub-tabs">
          <button type="button" className={`bf-rankings-hub-tab ${tab === "teams" ? "is-on" : ""}`} onClick={() => setTab("teams")}>
            Equipos <span>{ranked.length}</span>
          </button>
          <button type="button" className={`bf-rankings-hub-tab ${tab === "fantasy" ? "is-on" : ""}`} onClick={() => setTab("fantasy")}>
            Fantasy <span>{fantasyBoard.length}</span>
          </button>
        </div>
      </SectionTabsBar>

      {tab === "teams" && (
        <>
          <div className="bf-rankings-hub-regions">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`bf-rankings-region-chip ${region === r ? "is-on" : ""}`}
                onClick={() => setRegion(r)}
              >
                {r === "all" ? "Global" : r}
              </button>
            ))}
          </div>

          {podium.length >= 3 && (
            <div className="bf-rankings-podium">
              {[podium[1], podium[0], podium[2]].map((t, i) => {
                const pos = i === 1 ? 1 : i === 0 ? 2 : 3;
                const Icon = pos === 1 ? Crown : pos === 2 ? Medal : Trophy;
                return (
                  <Link
                    key={t.slug}
                    href={`/teams/${t.slug}`}
                    className={`bf-rankings-podium-slot pos-${pos} ${pos === 1 ? "is-champ" : ""}`}
                  >
                    <Icon size={pos === 1 ? 22 : 16} className="bf-rankings-podium-icon" aria-hidden />
                    <span className="bf-rankings-podium-num">#{pos}</span>
                    <TeamLogo slug={t.slug} name={t.name} size={pos === 1 ? 96 : 72} glow />
                    <strong>{t.tag}</strong>
                    <span>{t.name}</span>
                    <RegionBadge region={t.region} />
                    {t.form && <FormDots form={t.form} />}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="bf-rankings-list">
            {rest.map((t, i) => {
              const pos = i + 4;
              const roster = getPlayersByTeam(t.slug).length;
              return (
                <Link key={t.slug} href={`/teams/${t.slug}`} className="bf-rankings-row">
                  <span className="bf-rankings-row-pos">{pos}</span>
                  <TeamLogo slug={t.slug} name={t.name} size={44} glow={false} />
                  <div className="bf-rankings-row-main">
                    <strong>{t.tag}</strong>
                    <span>{t.name}</span>
                  </div>
                  <RegionBadge region={t.region} />
                  {t.form && <FormDots form={t.form} />}
                  <span className="bf-rankings-row-meta">{roster} jugadores</span>
                </Link>
              );
            })}
          </div>
          {ranked.length === 0 && <p className="bf-home-empty">No hay equipos en esta región.</p>}
        </>
      )}

      {tab === "fantasy" && (
        <>
          <p className="bf-rankings-fantasy-banner">
            Torneo: <strong>{fantasyMeta.teamName}</strong>
            {isLoggedIn && myRank != null && (
              <>
                {" "}
                · Tu posición <strong>#{myRank.toLocaleString()}</strong> · {myPoints} pts
              </>
            )}
            {!isLoggedIn && (
              <>
                {" "}
                · <Link href="/login?next=/rankings">Inicia sesión</Link>
              </>
            )}
          </p>
          <div className="bf-rankings-fantasy-list">
            {fantasyBoard.map((row) => (
              <div key={row.user_id} className={`bf-rankings-fantasy-row ${row.rank <= 3 ? `is-top-${row.rank}` : ""}`}>
                <span className="bf-rankings-row-pos">{row.rank}</span>
                <div className="bf-rankings-fantasy-main">
                  <strong>{row.team_name || row.display_name}</strong>
                  <span>{row.ign}</span>
                </div>
                <span className="bf-rankings-fantasy-pts">{row.total_points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          {fantasyBoard.length === 0 && (
            <p className="bf-home-empty">
              Aún no hay managers en el ranking. Regístrate o ejecuta la migración fantasy en Supabase.
            </p>
          )}
          <Link href="/fantasy" className="fu-btn fu-btn-gold bf-rankings-fantasy-cta">
            Ir a Fantasy
          </Link>
        </>
      )}
    </PageUltraShell>
  );
}

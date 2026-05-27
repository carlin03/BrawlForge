"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NovaPageHero } from "@/components/nova/NovaPageHero";
import { NovaBlock } from "@/components/nova/NovaBlock";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TournamentFantasyBar } from "@/components/fantasy/TournamentFantasyBar";
import { FantasyArena } from "@/components/fantasy/FantasyArena";
import { FantasyMarket } from "@/components/fantasy/FantasyMarket";
import { FantasyNav } from "@/components/fantasy/FantasyNav";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  FANTASY_BUDGET,
  FANTASY_SQUAD_SIZE,
  getSquadValue,
  getTournamentFantasyProfile,
  getUserSquad,
  getPlayerPrice,
  isPlayerInTournament,
  userSquadsByTournament,
  type FantasySquadSlot,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getFantasyMarketByTeam } from "@/lib/data/fantasy-rosters";
import { tournamentName } from "@/lib/data";

function cloneSquads(): Record<string, FantasySquadSlot[]> {
  const out: Record<string, FantasySquadSlot[]> = {};
  for (const [slug, squad] of Object.entries(userSquadsByTournament)) {
    out[slug] = squad.map((s) => ({ ...s }));
  }
  return out;
}

export function FantasyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournaments = getFantasyTournaments(true);

  const paramTournament = searchParams.get("tournament");
  const validSlugs = tournaments.map((t) => t.slug);
  const initialTournament =
    paramTournament && validSlugs.includes(paramTournament)
      ? paramTournament
      : DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initialTournament);
  const [squads, setSquads] = useState<Record<string, FantasySquadSlot[]>>(cloneSquads);

  const activeConfig = tournaments.find((t) => t.slug === activeTournament);
  const profile = getTournamentFantasyProfile(activeTournament);
  const squad = squads[activeTournament] ?? getUserSquad(activeTournament);
  const teamGroups = useMemo(() => getFantasyMarketByTeam(activeTournament), [activeTournament]);
  const spent = getSquadValue(squad);
  const budgetLeft = FANTASY_BUDGET - spent;
  const inSquad = squad.map((s) => s.playerSlug);
  const isLocked = profile.isLocked;
  const totalPros = teamGroups.reduce((n, g) => n + g.players.length, 0);
  const capPct = Math.round((spent / FANTASY_BUDGET) * 100);

  const updateUrl = useCallback(
    (tournament: string) => {
      router.replace(`/fantasy?tournament=${tournament}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (paramTournament && validSlugs.includes(paramTournament)) {
      setActiveTournament(paramTournament);
    }
  }, [paramTournament, validSlugs]);

  function setSquadForTournament(next: FantasySquadSlot[]) {
    setSquads((prev) => ({ ...prev, [activeTournament]: next }));
  }

  function handleTournamentChange(slug: string) {
    setActiveTournament(slug);
    updateUrl(slug);
  }

  function handlePick(playerSlug: string) {
    if (isLocked) return;
    if (squad.length >= FANTASY_SQUAD_SIZE) return;
    if (inSquad.includes(playerSlug)) return;
    if (!isPlayerInTournament(playerSlug, activeTournament)) return;
    const price = getPlayerPrice(playerSlug);
    if (price > budgetLeft) return;
    setSquadForTournament([...squad, { playerSlug, isCaptain: squad.length === 0, eventPoints: 0 }]);
  }

  function handleRemove(playerSlug: string) {
    if (isLocked) return;
    const next = squad.filter((s) => s.playerSlug !== playerSlug);
    if (next.length > 0 && !next.some((s) => s.isCaptain)) {
      next[0] = { ...next[0], isCaptain: true };
    }
    setSquadForTournament(next);
  }

  function handleSetCaptain(playerSlug: string) {
    if (isLocked) return;
    setSquadForTournament(squad.map((s) => ({ ...s, isCaptain: s.playerSlug === playerSlug })));
  }

  return (
    <>
      <div className="fx-premium-head">
        <NovaPageHero
          kicker="Pro Picks · BSC"
          title={profile.teamName}
          accent={activeConfig?.tournament.shortName ?? tournamentName(activeTournament)}
          subtitle={`${totalPros} pros · ${teamGroups.length} orgs · cap $${FANTASY_BUDGET}M`}
          tone="yellow"
          actions={
            <div className="fx-head-event">
              <TournamentLogo slug={activeTournament} name={activeConfig?.tournament.shortName ?? "BSC"} size={52} />
            </div>
          }
        />
      </div>

      <div className="nv-kpis bc-kpis">
        <div className="nv-kpi"><div className="nv-kpi-val c-yellow">{profile.totalPoints || "—"}</div><div className="nv-kpi-lbl">Pts evento</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-blue">{profile.rank > 0 ? `#${profile.rank.toLocaleString()}` : "—"}</div><div className="nv-kpi-lbl">Standing</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val c-red">${budgetLeft.toFixed(0)}M</div><div className="nv-kpi-lbl">Cap libre</div></div>
        <div className="nv-kpi"><div className="nv-kpi-val">{squad.length}/{FANTASY_SQUAD_SIZE}</div><div className="nv-kpi-lbl">Lineup</div></div>
      </div>

      <div className="fx-cap-bar">
        <div className="fx-cap-label"><span>Salary cap</span><span className="c-yellow">${spent.toFixed(1)}M / ${FANTASY_BUDGET}M</span></div>
        <div className="nv-progress fx-cap-progress"><div style={{ width: `${capPct}%` }} /></div>
      </div>

      <FantasyNav />
      <TournamentFantasyBar activeSlug={activeTournament} onSelect={handleTournamentChange} />

      <div className="fx-premium-layout">
        <NovaBlock title="Alineación">
          <FantasyArena
            squad={squad}
            tournamentSlug={activeTournament}
            locked={isLocked}
            onRemove={handleRemove}
            onSetCaptain={handleSetCaptain}
          />
        </NovaBlock>

        <div id="pool" className="fx-pool-panel">
          <NovaBlock title="Pool de pros">
            <FantasyMarket
              tournamentSlug={activeTournament}
              inSquad={inSquad}
              budgetLeft={budgetLeft}
              squadFull={squad.length >= FANTASY_SQUAD_SIZE}
              locked={isLocked}
              onPick={handlePick}
              compact
            />
          </NovaBlock>
        </div>
      </div>
    </>
  );
}

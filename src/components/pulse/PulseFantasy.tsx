"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PulseCard } from "./PulseUI";
import { SquadRoster } from "@/components/esports/SquadRoster";
import { ProRow } from "@/components/esports/ProRow";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { TournamentFantasyBar } from "@/components/fantasy/TournamentFantasyBar";
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
  getTournamentMarket,
  type FantasySquadSlot,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getFantasyMarketByTeam } from "@/lib/data/fantasy-rosters";
import { getPlayer, getTeam, tournamentName } from "@/lib/data";
import { getPickRate } from "@/lib/data/fantasy-meta";

function cloneSquads() {
  const out: Record<string, FantasySquadSlot[]> = {};
  for (const [slug, squad] of Object.entries(userSquadsByTournament)) {
    out[slug] = squad.map((s) => ({ ...s }));
  }
  return out;
}

export function PulseFantasy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournaments = getFantasyTournaments(true);
  const validSlugs = tournaments.map((t) => t.slug);
  const initial = paramValid(searchParams.get("tournament"), validSlugs) ?? DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);
  const [squads, setSquads] = useState(cloneSquads);
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");

  const profile = getTournamentFantasyProfile(activeTournament);
  const squad = squads[activeTournament] ?? getUserSquad(activeTournament);
  const teamGroups = useMemo(() => getFantasyMarketByTeam(activeTournament), [activeTournament]);
  const market = useMemo(() => getTournamentMarket(activeTournament), [activeTournament]);
  const marketMap = useMemo(() => new Map(market.map((m) => [m.playerSlug, m])), [market]);
  const spent = getSquadValue(squad);
  const budgetLeft = FANTASY_BUDGET - spent;
  const inSquad = squad.map((s) => s.playerSlug);
  const locked = profile.isLocked;
  const capPct = Math.round((spent / FANTASY_BUDGET) * 100);

  const updateUrl = useCallback((t: string) => router.replace(`/fantasy?tournament=${t}`, { scroll: false }), [router]);

  useEffect(() => {
    const p = searchParams.get("tournament");
    if (p && validSlugs.includes(p)) setActiveTournament(p);
  }, [searchParams, validSlugs]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamGroups
      .filter((g) => teamFilter === "all" || g.teamSlug === teamFilter)
      .map((g) => ({
        ...g,
        players: g.players.filter((slug) => {
          const p = getPlayer(slug);
          const team = getTeam(g.teamSlug);
          if (!p) return false;
          if (!q) return true;
          return p.ign.toLowerCase().includes(q) || team?.name.toLowerCase().includes(q);
        }),
      }))
      .filter((g) => g.players.length > 0);
  }, [teamGroups, teamFilter, query]);

  function pick(slug: string) {
    if (locked || squad.length >= FANTASY_SQUAD_SIZE || inSquad.includes(slug)) return;
    if (!isPlayerInTournament(slug, activeTournament)) return;
    const price = getPlayerPrice(slug);
    if (price > budgetLeft) return;
    setSquads((prev) => ({
      ...prev,
      [activeTournament]: [...squad, { playerSlug: slug, isCaptain: squad.length === 0, eventPoints: 0 }],
    }));
  }

  function remove(slug: string) {
    if (locked) return;
    let next = squad.filter((s) => s.playerSlug !== slug);
    if (next.length && !next.some((s) => s.isCaptain)) next = [{ ...next[0], isCaptain: true }, ...next.slice(1)];
    setSquads((prev) => ({ ...prev, [activeTournament]: next }));
  }

  function setCaptain(slug: string) {
    if (locked) return;
    setSquads((prev) => ({
      ...prev,
      [activeTournament]: squad.map((s) => ({ ...s, isCaptain: s.playerSlug === slug })),
    }));
  }

  return (
    <>
      <header className="pl-hero">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="pl-hero-badge" style={{ background: "var(--pl-gold-soft)", color: "var(--pl-gold)", borderColor: "rgba(245,197,24,0.2)" }}>
              Pro Picks
            </div>
            <h1 className="pl-page-title">{profile.teamName}</h1>
            <p className="pl-page-sub" style={{ marginBottom: 0 }}>{tournamentName(activeTournament)}</p>
          </div>
          <TournamentLogo slug={activeTournament} name="BSC" size={56} />
        </div>
      </header>

      <div className="pl-stats">
        <div className="pl-stat"><div className="pl-stat-val pl-gold">{profile.totalPoints || "—"}</div><div className="pl-stat-lbl">Puntos</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-blue">{profile.rank ? `#${profile.rank.toLocaleString()}` : "—"}</div><div className="pl-stat-lbl">Rank</div></div>
        <div className="pl-stat"><div className="pl-stat-val pl-red">${budgetLeft.toFixed(0)}M</div><div className="pl-stat-lbl">Libre</div></div>
        <div className="pl-stat"><div className="pl-stat-val">{squad.length}/{FANTASY_SQUAD_SIZE}</div><div className="pl-stat-lbl">Lineup</div></div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--pl-dim)", marginBottom: 8 }}>
          <span>Salary cap</span>
          <span className="pl-gold">${spent.toFixed(1)}M / ${FANTASY_BUDGET}M</span>
        </div>
        <div className="pl-progress"><div style={{ width: `${capPct}%` }} /></div>
      </div>

      <div className="pl-filters" style={{ marginBottom: 16 }}>
        <Link href="/fantasy" className="pl-chip is-on">Alineación</Link>
        <Link href="/fantasy/rankings" className="pl-chip">Standings</Link>
        <Link href="/fantasy/leagues" className="pl-chip">Ligas</Link>
      </div>

      <div style={{ marginBottom: 20 }}>
        <TournamentFantasyBar activeSlug={activeTournament} onSelect={(s) => { setActiveTournament(s); updateUrl(s); }} />
      </div>

      <div className="pl-grid-main">
        <PulseCard title="Tu alineación">
          <SquadRoster
            squad={squad}
            tournamentSlug={activeTournament}
            locked={locked}
            onRemove={remove}
            onSetCaptain={setCaptain}
          />
        </PulseCard>

        <PulseCard title="Pool de jugadores" linkText="">
          <div className="pl-filters" style={{ padding: "16px 22px 0", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
              <Search size={16} className="pl-dim" />
              <input className="pl-input" placeholder="Buscar pro..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="pl-filters" style={{ padding: "0 22px 12px" }}>
            <button type="button" className={`pl-chip ${teamFilter === "all" ? "is-on" : ""}`} onClick={() => setTeamFilter("all")}>Todos</button>
            {teamGroups.map((g) => {
              const team = getTeam(g.teamSlug);
              if (!team) return null;
              return (
                <button key={g.teamSlug} type="button" className={`pl-chip ${teamFilter === g.teamSlug ? "is-on-blue" : ""}`} onClick={() => setTeamFilter(g.teamSlug)}>
                  {team.tag}
                </button>
              );
            })}
          </div>
          {filteredGroups.map((group) => {
            const team = getTeam(group.teamSlug);
            if (!team) return null;
            return (
              <div key={group.teamSlug} className="pl-org-block">
                <div className="pl-org-head">
                  <TeamLogo slug={group.teamSlug} name={team.name} size={28} />
                  <span className="pl-org-name">{team.name}</span>
                </div>
                <table className="es-table" style={{ width: "100%" }}>
                  <tbody>
                    {group.players.map((slug) => {
                      const price = getPlayerPrice(slug);
                      const mp = marketMap.get(slug);
                      const can = !locked && !inSquad.includes(slug) && squad.length < FANTASY_SQUAD_SIZE && price <= budgetLeft;
                      return (
                        <ProRow
                          key={slug}
                          playerSlug={slug}
                          price={price}
                          pickRate={getPickRate(slug)}
                          form={mp?.form}
                          inSquad={inSquad.includes(slug)}
                          showForm
                          showRating
                          showPrice
                          showPick
                          onPick={can ? () => pick(slug) : undefined}
                          pickDisabled={!can}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </PulseCard>
      </div>
    </>
  );
}

function paramValid(p: string | null, valid: string[]) {
  return p && valid.includes(p) ? p : null;
}

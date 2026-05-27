"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ArenaPanel, FormDots, PriceChange, ArenaBadge } from "./ArenaUI";
import { TeamLogo } from "@/components/ui/TeamLogo";
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
  getTournamentPlayerPool,
  type FantasySquadSlot,
} from "@/lib/data/fantasy";
import { getFantasyTournaments } from "@/lib/data/fantasy-tournaments";
import { getFantasyMarketByTeam, getFantasyTournamentStats, hasFantasyForTournament } from "@/lib/data/fantasy-rosters";
import {
  getPlayer,
  getTeam,
  tournamentName,
  teamName,
  getFantasyRole,
  getPickRate,
} from "@/lib/data";

type SortKey = "price" | "rating" | "pick" | "change";

function cloneSquads() {
  const out: Record<string, FantasySquadSlot[]> = {};
  for (const [slug, squad] of Object.entries(userSquadsByTournament)) {
    const pool = new Set(getTournamentPlayerPool(slug));
    out[slug] = squad.filter((s) => pool.has(s.playerSlug)).map((s) => ({ ...s }));
  }
  return out;
}

function resolveTournamentParam(param: string | null, validSlugs: string[]): string | null {
  if (!param) return null;
  if (validSlugs.includes(param)) return param;
  if (hasFantasyForTournament(param)) return param;
  return null;
}

export function ArenaFantasy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournaments = getFantasyTournaments(false);
  const validSlugs = tournaments.map((t) => t.slug);
  const initial = resolveTournamentParam(searchParams.get("tournament"), validSlugs) ?? DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);
  const [squads, setSquads] = useState(cloneSquads);
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("pick");

  const profile = getTournamentFantasyProfile(activeTournament);
  const squad = squads[activeTournament] ?? getUserSquad(activeTournament);
  const teamGroups = useMemo(() => getFantasyMarketByTeam(activeTournament), [activeTournament]);
  const market = useMemo(() => getTournamentMarket(activeTournament), [activeTournament]);
  const marketMap = useMemo(() => new Map(market.map((m) => [m.playerSlug, m])), [market]);
  const tournamentStats = useMemo(() => getFantasyTournamentStats(activeTournament), [activeTournament]);
  const spent = getSquadValue(squad, activeTournament);
  const budgetLeft = FANTASY_BUDGET - spent;
  const inSquad = squad.map((s) => s.playerSlug);
  const locked = profile.isLocked;
  const capPct = Math.round((spent / FANTASY_BUDGET) * 100);
  const transfersLeft = profile.transfersAllowed - profile.transfersUsed;

  const updateUrl = useCallback((t: string) => router.replace(`/fantasy?tournament=${t}`, { scroll: false }), [router]);

  useEffect(() => {
    const p = searchParams.get("tournament");
    const resolved = resolveTournamentParam(p, validSlugs);
    if (resolved) setActiveTournament(resolved);
  }, [searchParams, validSlugs]);

  useEffect(() => {
    setTeamFilter("all");
    setQuery("");
    setSquads((prev) => {
      const pool = new Set(getTournamentPlayerPool(activeTournament));
      const current = prev[activeTournament] ?? getUserSquad(activeTournament);
      const filtered = current.filter((s) => pool.has(s.playerSlug));
      if (filtered.length === current.length && prev[activeTournament]) return prev;
      return { ...prev, [activeTournament]: filtered };
    });
  }, [activeTournament]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamGroups
      .filter((g) => teamFilter === "all" || g.teamSlug === teamFilter)
      .map((g) => {
        let players = g.players.filter((slug) => {
          const p = getPlayer(slug);
          const team = getTeam(g.teamSlug);
          if (!p) return false;
          if (!q) return true;
          return p.ign.toLowerCase().includes(q) || team?.name.toLowerCase().includes(q);
        });
        players = [...players].sort((a, b) => {
          const pa = getPlayer(a);
          const pb = getPlayer(b);
          const ma = marketMap.get(a);
          const mb = marketMap.get(b);
          if (sortBy === "price") return getPlayerPrice(b, activeTournament) - getPlayerPrice(a, activeTournament);
          if (sortBy === "rating") return (pb?.rating ?? 0) - (pa?.rating ?? 0);
          if (sortBy === "change") return (mb?.priceChange ?? 0) - (ma?.priceChange ?? 0);
          return getPickRate(b) - getPickRate(a);
        });
        return { ...g, players };
      })
      .filter((g) => g.players.length > 0);
  }, [teamGroups, teamFilter, query, sortBy, marketMap, activeTournament]);

  function pick(slug: string) {
    if (locked || squad.length >= FANTASY_SQUAD_SIZE || inSquad.includes(slug)) return;
    if (!isPlayerInTournament(slug, activeTournament)) return;
    const price = getPlayerPrice(slug, activeTournament);
    if (price > budgetLeft) return;
    setSquads((prev) => ({
      ...prev,
      [activeTournament]: [...squad, { playerSlug: slug, isCaptain: squad.length === 0, eventPoints: 0 }],
    }));
  }

  function remove(slug: string) {
    if (locked) return;
    let next = squad.filter((s) => s.playerSlug !== slug);
    if (next.length && !next.some((s) => s.isCaptain)) {
      next = [{ ...next[0], isCaptain: true }, ...next.slice(1)];
    }
    setSquads((prev) => ({ ...prev, [activeTournament]: next }));
  }

  function setCaptain(slug: string) {
    if (locked) return;
    setSquads((prev) => ({
      ...prev,
      [activeTournament]: squad.map((s) => ({ ...s, isCaptain: s.playerSlug === slug })),
    }));
  }

  const slots = Array.from({ length: FANTASY_SQUAD_SIZE }, (_, i) => squad[i] ?? null);

  return (
    <>
      <section className="ar-hero">
        <div className="ar-hero-inner">
          <div className="ar-hero-kicker" style={{ background: "var(--ar-pick-soft)", color: "var(--ar-pick)", borderColor: "var(--ar-line-strong)" }}>
            Fantasy · {profile.teamName} · {profile.participants.toLocaleString()} managers
          </div>
          <h1 className="ar-h1">
            Tu trío<br /><span className="ar-h1-gold">campeón.</span>
          </h1>
          <p className="ar-lead" style={{ marginBottom: 0 }}>
            {FANTASY_SQUAD_SIZE} jugadores · {FANTASY_BUDGET}M cap · MVP ×2 pts
            {!locked && ` · ${transfersLeft} fichajes restantes`}
          </p>
        </div>
      </section>

      <div className="ar-subnav">
        <Link href="/fantasy" className="is-on">Plantilla</Link>
        <Link href="/fantasy/rankings">Clasificación</Link>
        <Link href="/fantasy/leagues">Ligas</Link>
      </div>

      <div className="ar-events">
        {tournaments.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={`ar-event ${activeTournament === t.slug ? "is-on" : ""}`}
            onClick={() => { setActiveTournament(t.slug); updateUrl(t.slug); }}
          >
            <span className="ar-event-name">{t.tournament.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</span>
            <span className="ar-event-status">
              {t.teamCount} equipos · {t.playerCount} jugadores
              {t.tournament.status === "live" ? " · En curso" : t.tournament.status === "upcoming" ? " · Próximo" : " · Finalizado"}
            </span>
          </button>
        ))}
      </div>

      <div
        className="ar-panel-pad"
        style={{
          marginBottom: "var(--ar-gap-lg)",
          borderRadius: "var(--ar-r)",
          border: "1px solid var(--ar-line-strong)",
          background: "linear-gradient(90deg, var(--ar-pick-soft), transparent)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ArenaBadge variant="gold">Mercado exclusivo</ArenaBadge>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {tournamentName(activeTournament)} — solo jugadores de {tournamentStats.teamCount} equipos participantes
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginLeft: "auto" }}>
          {tournamentStats.teamSlugs.slice(0, 8).map((ts) => {
            const team = getTeam(ts);
            if (!team) return null;
            return (
              <button
                key={ts}
                type="button"
                className={`ar-filter ${teamFilter === ts ? "is-on" : ""}`}
                style={{ padding: "4px 10px", fontSize: 10 }}
                onClick={() => setTeamFilter(teamFilter === ts ? "all" : ts)}
              >
                {team.tag}
              </button>
            );
          })}
          {tournamentStats.teamCount > 8 && (
            <span className="ar-pill" style={{ fontSize: 10 }}>+{tournamentStats.teamCount - 8}</span>
          )}
        </div>
      </div>

      <div className="ar-meta-row">
        <div className="ar-meta-item">
          <strong className="gold">{profile.totalPoints || "—"}</strong>
          <span>Puntos</span>
        </div>
        <div className="ar-meta-item">
          <strong>{profile.rank ? `#${profile.rank.toLocaleString()}` : "—"}</strong>
          <span>Posición</span>
        </div>
        <div className="ar-meta-item">
          <strong className="gold">${budgetLeft.toFixed(0)}M</strong>
          <span>Libre</span>
        </div>
        <div className="ar-meta-item">
          <strong>{transfersLeft}</strong>
          <span>Fichajes</span>
        </div>
        <div className="ar-meta-item">
          <strong>{squad.length}/{FANTASY_SQUAD_SIZE}</strong>
          <span>Plantilla</span>
        </div>
      </div>

      <div className="ar-cap">
        <span>{tournamentName(activeTournament)}</span>
        <span>${spent.toFixed(1)}M / ${FANTASY_BUDGET}M</span>
      </div>
      <div className="ar-cap-bar" style={{ marginBottom: 16 }}>
        <div className="ar-cap-fill" style={{ width: `${capPct}%` }} />
      </div>

      <div className="ar-lineup">
        {slots.map((slot, i) => {
          if (!slot) {
            return (
              <div key={i} className="ar-slot">
                <span className="ar-slot-empty">Hueco {i + 1}</span>
              </div>
            );
          }
          const p = getPlayer(slot.playerSlug);
          const mp = marketMap.get(slot.playerSlug);
          if (!p?.teamSlug) return <div key={i} className="ar-slot" />;
          return (
            <div key={slot.playerSlug} className={`ar-slot filled ${slot.isCaptain ? "captain" : ""}`}>
              <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={36} />
              <div className="ar-slot-name">
                {p.ign}
                {slot.isCaptain && <span className="ar-mvp">MVP</span>}
              </div>
              <div className="ar-slot-meta">
                <span className="ar-player-role">{getFantasyRole(p.slug)}</span>
                {" · "}{getPlayerPrice(p.slug, activeTournament)}M
              </div>
              {mp?.form && <FormDots form={mp.form} />}
              {!locked && (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {!slot.isCaptain && (
                    <button type="button" className="ar-filter" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => setCaptain(slot.playerSlug)}>
                      Capitán
                    </button>
                  )}
                  <button type="button" className="ar-filter" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => remove(slot.playerSlug)}>
                    Quitar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="ar-filters">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ color: "var(--ar-dim)", flexShrink: 0 }} />
          <input className="ar-input" placeholder="Buscar jugador o club..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "var(--ar-dim)", cursor: "pointer" }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button type="button" className={`ar-filter ${teamFilter === "all" ? "is-on" : ""}`} onClick={() => setTeamFilter("all")}>
          Todos
        </button>
        {teamGroups.map((g) => {
          const team = getTeam(g.teamSlug);
          if (!team) return null;
          return (
            <button key={g.teamSlug} type="button" className={`ar-filter ${teamFilter === g.teamSlug ? "is-on" : ""}`} onClick={() => setTeamFilter(g.teamSlug)}>
              {team.tag}
            </button>
          );
        })}
      </div>

      <ArenaPanel title="Mercado">
        <div className="ar-sort-bar">
          <span>Ordenar:</span>
          {([
            ["pick", "Popularidad"],
            ["price", "Precio"],
            ["rating", "Rating"],
            ["change", "Cambio"],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" className={`ar-filter ${sortBy === key ? "is-on" : ""}`} style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setSortBy(key)}>
              {label}
            </button>
          ))}
        </div>
        {filteredGroups.map((group) => {
          const team = getTeam(group.teamSlug);
          if (!team) return null;
          return (
            <div key={group.teamSlug}>
              <div className="ar-org-head">
                <TeamLogo slug={group.teamSlug} name={team.name} size={22} />
                {team.name}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ar-dim)", fontWeight: 600 }}>{group.players.length} jugadores</span>
              </div>
              {group.players.map((slug) => {
                const p = getPlayer(slug);
                if (!p) return null;
                const price = getPlayerPrice(slug, activeTournament);
                const mp = marketMap.get(slug);
                const eligible = isPlayerInTournament(slug, activeTournament);
                const picked = inSquad.includes(slug);
                const can = eligible && !locked && !picked && squad.length < FANTASY_SQUAD_SIZE && price <= budgetLeft;
                const inactive = p.status !== "active";
                if (!eligible) return null;
                return (
                  <div key={slug} className={`ar-player ${picked ? "in-squad" : ""}`}>
                    <TeamLogo slug={group.teamSlug} name={team.name} size={30} />
                    <div className="ar-player-main">
                      <div className="ar-player-name" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {p.ign}
                        <span className="ar-player-role">{getFantasyRole(slug)}</span>
                        {mp?.trending === "hot" && <ArenaBadge variant="red">Hot</ArenaBadge>}
                        {mp?.trending === "value" && <ArenaBadge variant="green">Value</ArenaBadge>}
                        {inactive && <ArenaBadge variant="dim">Inactivo</ArenaBadge>}
                        {picked && <ArenaBadge variant="gold">En plantilla</ArenaBadge>}
                      </div>
                      <div className="ar-player-sub" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {p.rating.toFixed(2)} · {getPickRate(slug)}% prop.
                        {mp?.form && <FormDots form={mp.form} />}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 56 }}>
                      <div className="ar-player-stat">{price}M</div>
                      {mp && <PriceChange change={mp.priceChange} />}
                    </div>
                    {!locked && (
                      <button type="button" className="ar-player-add" disabled={!can} onClick={() => pick(slug)} title={picked ? "Ya en plantilla" : can ? "Fichar" : "Sin presupuesto"}>
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        {!filteredGroups.length && <div className="ar-empty">Ningún jugador coincide con el filtro.</div>}
      </ArenaPanel>
    </>
  );
}

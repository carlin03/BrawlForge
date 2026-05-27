"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { Block, Chip, FormDots, PriceDelta, StatStrip } from "./ui";
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
  getTournamentLeaderboard,
  getFantasyLeaguesForTournament,
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

type Tab = "squad" | "market" | "rankings" | "leagues";
type SortKey = "pick" | "price" | "rating" | "change";

function cloneSquads() {
  const out: Record<string, FantasySquadSlot[]> = {};
  for (const [slug, squad] of Object.entries(userSquadsByTournament)) {
    const pool = new Set(getTournamentPlayerPool(slug));
    out[slug] = squad.filter((s) => pool.has(s.playerSlug)).map((s) => ({ ...s }));
  }
  return out;
}

function resolveTournament(param: string | null, slugs: string[]) {
  if (!param) return null;
  if (slugs.includes(param)) return param;
  if (hasFantasyForTournament(param)) return param;
  return null;
}

export function ForgeFantasy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournaments = getFantasyTournaments(false);
  const validSlugs = tournaments.map((t) => t.slug);
  const initial = resolveTournament(searchParams.get("tournament"), validSlugs) ?? DEFAULT_FANTASY_TOURNAMENT;

  const [activeTournament, setActiveTournament] = useState(initial);
  const [squads, setSquads] = useState(cloneSquads);
  const [pageTab, setPageTab] = useState<Tab>("squad");
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("pick");

  const profile = getTournamentFantasyProfile(activeTournament);
  const squad = squads[activeTournament] ?? getUserSquad(activeTournament);
  const teamGroups = useMemo(() => getFantasyMarketByTeam(activeTournament), [activeTournament]);
  const market = useMemo(() => getTournamentMarket(activeTournament), [activeTournament]);
  const marketMap = useMemo(() => new Map(market.map((m) => [m.playerSlug, m])), [market]);
  const stats = useMemo(() => getFantasyTournamentStats(activeTournament), [activeTournament]);
  const spent = getSquadValue(squad, activeTournament);
  const budgetLeft = FANTASY_BUDGET - spent;
  const locked = profile.isLocked;
  const capPct = Math.round((spent / FANTASY_BUDGET) * 100);
  const leaderboard = getTournamentLeaderboard(activeTournament);
  const leagues = getFantasyLeaguesForTournament(activeTournament);

  const updateUrl = useCallback((t: string) => router.replace(`/fantasy?tournament=${t}`, { scroll: false }), [router]);

  useEffect(() => {
    const r = resolveTournament(searchParams.get("tournament"), validSlugs);
    if (r) setActiveTournament(r);
  }, [searchParams, validSlugs]);

  useEffect(() => {
    setTeamFilter("all");
    setSquads((prev) => {
      const pool = new Set(getTournamentPlayerPool(activeTournament));
      const current = prev[activeTournament] ?? getUserSquad(activeTournament);
      return { ...prev, [activeTournament]: current.filter((s) => pool.has(s.playerSlug)) };
    });
  }, [activeTournament]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamGroups
      .filter((g) => teamFilter === "all" || g.teamSlug === teamFilter)
      .map((g) => {
        let players = g.players.filter((slug) => {
          const p = getPlayer(slug);
          if (!p) return false;
          if (!q) return true;
          return p.ign.toLowerCase().includes(q) || getTeam(g.teamSlug)?.name.toLowerCase().includes(q);
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
    if (locked || squad.length >= FANTASY_SQUAD_SIZE || squad.some((s) => s.playerSlug === slug)) return;
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

  const slots = Array.from({ length: FANTASY_SQUAD_SIZE }, (_, i) => squad[i] ?? null);

  return (
    <>
      <h1 className="fg-h1">Fantasy</h1>
      <p className="fg-lead">Mercado de fichajes, plantilla y clasificación por torneo — cada evento con sus propios equipos.</p>

      <div className="fg-events-scroll">
        {tournaments.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={`fg-event-pill ${activeTournament === t.slug ? "is-on" : ""}`}
            onClick={() => { setActiveTournament(t.slug); updateUrl(t.slug); }}
          >
            <span className="fg-event-pill-name">{t.tournament.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</span>
            <span className="fg-event-pill-sub">{t.teamCount} equipos · {t.playerCount} jugadores</span>
          </button>
        ))}
      </div>

      <StatStrip
        items={[
          { label: "Puntos", value: String(profile.totalPoints || "—"), accent: "var(--fg-gold)" },
          { label: "Posición", value: profile.rank ? `#${profile.rank.toLocaleString()}` : "—" },
          { label: "Presupuesto", value: `$${budgetLeft.toFixed(0)}M`, accent: "var(--fg-gold)" },
          { label: "Fichajes", value: String(profile.transfersAllowed - profile.transfersUsed) },
        ]}
      />

      <div className="fg-tabs">
        {([
          ["squad", "Plantilla"],
          ["market", "Mercado"],
          ["rankings", "Clasificación"],
          ["leagues", "Ligas"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={`fg-tab gold ${pageTab === id ? "is-on" : ""}`} onClick={() => setPageTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {(pageTab === "squad" || pageTab === "market") && (
        <div className="fg-fantasy-layout">
          <aside className="fg-roster-dock">
            <div className="fg-label" style={{ marginBottom: 10 }}>{tournamentName(activeTournament)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-muted)", marginBottom: 6 }}>
              <span>Presupuesto</span>
              <span>${spent.toFixed(1)}M / ${FANTASY_BUDGET}M</span>
            </div>
            <div className="fg-budget-bar"><div className="fg-budget-fill" style={{ width: `${capPct}%` }} /></div>
            <div style={{ marginTop: 16 }}>
              {slots.map((slot, i) => {
                if (!slot) {
                  return (
                    <div key={i} className="fg-roster-slot">
                      <span style={{ color: "var(--fg-dim)", fontSize: 12 }}>Hueco {i + 1}</span>
                    </div>
                  );
                }
                const p = getPlayer(slot.playerSlug);
                const mp = marketMap.get(slot.playerSlug);
                if (!p?.teamSlug) return null;
                return (
                  <div key={slot.playerSlug} className={`fg-roster-slot filled ${slot.isCaptain ? "captain" : ""}`}>
                    <TeamLogo slug={p.teamSlug} name={teamName(p.teamSlug)} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.ign}{slot.isCaptain && " · C"}</div>
                      <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{getFantasyRole(p.slug)} · {getPlayerPrice(p.slug, activeTournament)}M</div>
                      {mp?.form && <FormDots form={mp.form} />}
                    </div>
                    {!locked && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {!slot.isCaptain && (
                          <button type="button" className="fg-filter" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => setCaptain(slot.playerSlug)}>C</button>
                        )}
                        <button type="button" className="fg-filter" style={{ fontSize: 10, padding: "2px 6px" }} onClick={() => remove(slot.playerSlug)}>×</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="fg-chip fg-chip-blue" style={{ marginTop: 12, display: "inline-flex" }}>
              {stats.teamCount} equipos del torneo
            </span>
          </aside>

          {pageTab === "market" && (
            <div>
              <div className="fg-filters">
                <Search size={14} style={{ color: "var(--fg-dim)" }} />
                <input className="fg-input" placeholder="Buscar jugador..." value={query} onChange={(e) => setQuery(e.target.value)} />
                {query && <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "var(--fg-dim)", cursor: "pointer" }}><X size={14} /></button>}
                <button type="button" className={`fg-filter ${teamFilter === "all" ? "is-on" : ""}`} onClick={() => setTeamFilter("all")}>Todos</button>
                {teamGroups.map((g) => {
                  const team = getTeam(g.teamSlug);
                  if (!team) return null;
                  return (
                    <button key={g.teamSlug} type="button" className={`fg-filter ${teamFilter === g.teamSlug ? "is-on" : ""}`} onClick={() => setTeamFilter(g.teamSlug)}>
                      {team.tag}
                    </button>
                  );
                })}
              </div>
              <Block title="Mercado de fichajes">
                <div style={{ display: "flex", gap: 6, padding: "8px 14px", borderBottom: "1px solid var(--fg-line)", flexWrap: "wrap" }}>
                  <span className="fg-label">Ordenar</span>
                  {([["pick", "Popular"], ["price", "Precio"], ["rating", "Rating"], ["change", "Δ"]] as const).map(([k, l]) => (
                    <button key={k} type="button" className={`fg-filter ${sortBy === k ? "is-on" : ""}`} onClick={() => setSortBy(k)}>{l}</button>
                  ))}
                </div>
                {filteredGroups.map((group) => {
                  const team = getTeam(group.teamSlug);
                  if (!team) return null;
                  return (
                    <div key={group.teamSlug}>
                      <div style={{ padding: "8px 14px", background: "var(--fg-surface-2)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--fg-line)" }}>
                        <TeamLogo slug={group.teamSlug} name={team.name} size={18} />
                        {team.tag}
                      </div>
                      {group.players.map((slug) => {
                        const p = getPlayer(slug);
                        if (!p || !isPlayerInTournament(slug, activeTournament)) return null;
                        const price = getPlayerPrice(slug, activeTournament);
                        const mp = marketMap.get(slug);
                        const picked = squad.some((s) => s.playerSlug === slug);
                        const can = !locked && !picked && squad.length < FANTASY_SQUAD_SIZE && price <= budgetLeft;
                        return (
                          <div key={slug} className="fg-market-row" style={{ opacity: picked ? 0.45 : 1 }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.ign} <span style={{ fontSize: 10, color: "var(--fg-blue-bright)" }}>{getFantasyRole(slug)}</span></div>
                              <div style={{ fontSize: 11, color: "var(--fg-dim)" }}>{getPickRate(slug)}% · {p.rating.toFixed(2)}{mp?.form && " · "}{mp?.form && <FormDots form={mp.form} />}</div>
                            </div>
                            <span style={{ fontWeight: 700, color: "var(--fg-gold)" }}>{price}M</span>
                            {mp && <PriceDelta change={mp.priceChange} />}
                            {!locked && (
                              <button type="button" className="fg-market-add" disabled={!can} onClick={() => pick(slug)}>+</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {!filteredGroups.length && <div className="fg-empty">Sin jugadores.</div>}
              </Block>
            </div>
          )}

          {pageTab === "squad" && (
            <Block title="Próximos partidos del torneo">
              <div className="fg-empty" style={{ padding: 24 }}>
                Los puntos fantasy se calculan según el rendimiento en partidos de {tournamentName(activeTournament)}.
                <br /><br />
                <Link href="/matches" className="fg-block-link">Ver calendario →</Link>
              </div>
            </Block>
          )}
        </div>
      )}

      {pageTab === "rankings" && (
        <Block title={`Clasificación · ${tournamentName(activeTournament)}`}>
          {leaderboard.map((e) => (
            <div key={e.rank} className="fg-row" style={{ cursor: "default" }}>
              <span className={`fg-rank ${e.rank <= 3 ? "top" : ""}`}>{e.rank}</span>
              <div className="fg-row-main">
                <div className="fg-row-title">{e.username}</div>
                <div className="fg-row-sub">Cap: {e.captainIgn} · +{e.roundPoints} esta jornada</div>
              </div>
              <span className="fg-row-stat" style={{ color: "var(--fg-gold)" }}>{e.points}</span>
            </div>
          ))}
        </Block>
      )}

      {pageTab === "leagues" && (
        <Block title="Tus ligas">
          {leagues.length ? leagues.map((l) => (
            <div key={l.id} className="fg-row" style={{ cursor: "default" }}>
              <div className="fg-row-main">
                <div className="fg-row-title">{l.name}</div>
                <div className="fg-row-sub">{l.members.toLocaleString()} miembros · líder: {l.leaderName}</div>
              </div>
              <span className="fg-row-stat">#{l.yourRank || "—"}</span>
            </div>
          )) : (
            <div className="fg-empty">No hay ligas para este torneo.</div>
          )}
        </Block>
      )}
    </>
  );
}

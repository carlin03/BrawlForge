"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProRow } from "@/components/esports/ProRow";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getPlayer, getTeam, tournamentName } from "@/lib/data";
import { getPlayerPrice, getTournamentMarket } from "@/lib/data/fantasy";
import { getFantasyMarketByTeam } from "@/lib/data/fantasy-rosters";
import { getPickRate } from "@/lib/data/fantasy-meta";

interface FantasyMarketProps {
  tournamentSlug: string;
  inSquad: string[];
  budgetLeft: number;
  squadFull: boolean;
  locked?: boolean;
  onPick: (slug: string) => void;
  compact?: boolean;
}

export function FantasyMarket({
  tournamentSlug,
  inSquad,
  budgetLeft,
  squadFull,
  locked = false,
  onPick,
  compact = false,
}: FantasyMarketProps) {
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const market = getTournamentMarket(tournamentSlug);
  const marketMap = useMemo(() => new Map(market.map((m) => [m.playerSlug, m])), [market]);
  const byTeam = getFantasyMarketByTeam(tournamentSlug);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return byTeam
      .filter((g) => teamFilter === "all" || g.teamSlug === teamFilter)
      .map((g) => {
        const team = getTeam(g.teamSlug);
        const players = g.players.filter((slug) => {
          const p = getPlayer(slug);
          if (!p) return false;
          if (!q) return true;
          return (
            p.ign.toLowerCase().includes(q) ||
            team?.name.toLowerCase().includes(q) ||
            team?.tag.toLowerCase().includes(q)
          );
        });
        return { ...g, players };
      })
      .filter((g) => g.players.length > 0);
  }, [byTeam, teamFilter, query]);

  const totalPlayers = byTeam.reduce((n, g) => n + g.players.length, 0);

  const canPick = (slug: string, price: number) =>
    !locked && !inSquad.includes(slug) && !squadFull && price <= budgetLeft;

  return (
    <div id="pool" className={`fx-market-unified ${compact ? "fx-market-unified-compact" : ""}`}>
      {!compact && (
        <div className="nv-page-hd" style={{ marginBottom: 12, paddingBottom: 10, border: "none" }}>
          <h2 style={{ fontFamily: "var(--nv-display)", fontSize: "1.1rem", margin: 0, textTransform: "uppercase" }}>
            Mercado · {tournamentName(tournamentSlug)}
          </h2>
          <p className="nv-dim" style={{ marginTop: 4 }}>
            {byTeam.length} equipos · {totalPlayers} jugadores · {budgetLeft.toFixed(1)}M libres
            {locked && " · Cerrado"}
          </p>
        </div>
      )}

      <div className="fx-market-toolbar nv-filters-bar">
        <div className="fx-vault-search fx-market-search">
          <Search className="h-4 w-4 text-[var(--bf-muted)]" />
          <input
            type="search"
            placeholder="Buscar jugador o equipo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="fx-vault-search-input"
          />
        </div>
        <div className="fx-market-team-filters">
          <button
            type="button"
            className={`fx-vault-filter ${teamFilter === "all" ? "fx-vault-filter-active" : ""}`}
            onClick={() => setTeamFilter("all")}
          >
            Todos ({byTeam.length})
          </button>
          {byTeam.map((g) => {
            const team = getTeam(g.teamSlug);
            if (!team) return null;
            return (
              <button
                key={g.teamSlug}
                type="button"
                className={`fx-market-team-chip ${teamFilter === g.teamSlug ? "fx-market-team-chip-active" : ""}`}
                onClick={() => setTeamFilter(g.teamSlug)}
                title={team.name}
              >
                <TeamLogo slug={g.teamSlug} name={team.name} size={20} />
                <span>{team.tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredGroups.map((group) => {
        const team = getTeam(group.teamSlug);
        if (!team) return null;
        return (
          <section key={group.teamSlug} className="es-market-group">
            <header className="es-market-group-hd">
              <TeamLogo slug={group.teamSlug} name={team.name} size={28} />
              <span className="es-market-group-name">{team.name}</span>
              <span className="es-market-group-meta">{group.players.length} jugadores</span>
            </header>
            <table className="es-table es-table-premium">
              <thead>
                <tr>
                  <th>Pro</th>
                  <th>Form</th>
                  <th>Rating</th>
                  <th>Val</th>
                  <th>Pick%</th>
                  {!locked && <th />}
                </tr>
              </thead>
              <tbody>
                {group.players.map((slug) => {
                  const mp = marketMap.get(slug);
                  const price = getPlayerPrice(slug);
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
                      onPick={!locked && canPick(slug, price) ? () => onPick(slug) : undefined}
                      pickDisabled={!canPick(slug, price)}
                    />
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      {filteredGroups.length === 0 && (
        <p className="nv-dim" style={{ textAlign: "center", padding: "32px 0" }}>
          {market.length === 0
            ? "No hay jugadores para este torneo."
            : "Sin resultados para esa búsqueda."}
        </p>
      )}
    </div>
  );
}

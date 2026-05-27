"use client";

import Link from "next/link";
import { ArenaPanel } from "@/components/arena/ArenaUI";
import { ProRow } from "@/components/esports/ProRow";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { getPlayer, getPlayerTeam, getPlayersByTeam } from "@/lib/data";
import { getPlayerPrice, transferMarket } from "@/lib/data/fantasy";
import { getFantasyRole, getPickRate } from "@/lib/data/fantasy-meta";

interface PlayerShowcaseProps {
  playerSlug: string;
}

export function PlayerShowcase({ playerSlug }: PlayerShowcaseProps) {
  const player = getPlayer(playerSlug);
  if (!player) return null;

  const team = getPlayerTeam(playerSlug);
  const teammates = team
    ? getPlayersByTeam(team.slug)
        .filter((p) => p.slug !== playerSlug && p.status === "active")
        .slice(0, 8)
    : [];
  const price = getPlayerPrice(playerSlug);
  const market = transferMarket.find((m) => m.playerSlug === playerSlug);
  const role = getFantasyRole(playerSlug);
  const form = market?.form ?? [];

  return (
    <div className="es-profile">
      <aside className="es-profile-side">
        <div className="es-profile-logo">
          {team ? (
            <TeamLogo slug={team.slug} name={team.name} size={88} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: 8, background: "var(--nv-panel)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--nv-display)", fontSize: 28, fontWeight: 700, color: "var(--nv-dim)" }}>
              {player.ign.slice(0, 2)}
            </div>
          )}
        </div>
        <h1 className="es-profile-ign">{player.ign}</h1>
        {player.realName && <p className="es-profile-real">{player.realName}</p>}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          <span className="bf-badge bf-badge-blue">{role}</span>
          <RegionBadge region={player.region} />
          <span className={`bf-badge ${player.status === "active" ? "bf-badge-yellow" : "bf-badge-red"}`}>{player.status}</span>
        </div>
        {team ? (
          <Link href={`/teams/${team.slug}`} className="es-profile-club">
            <TeamLogo slug={team.slug} name={team.name} size={24} />
            {team.tag} · {team.name}
          </Link>
        ) : (
          <p className="nv-dim" style={{ marginTop: 14 }}>Agente libre</p>
        )}
        <div className="es-profile-stats">
          <div className="es-profile-stat">
            <div className="es-profile-stat-val c-blue">{player.rating.toFixed(2)}</div>
            <div className="es-profile-stat-lbl">Rating</div>
          </div>
          <div className="es-profile-stat">
            <div className="es-profile-stat-val c-yellow">{player.fantasyPoints}</div>
            <div className="es-profile-stat-lbl">Pts evento</div>
          </div>
          <div className="es-profile-stat">
            <div className="es-profile-stat-val">{price.toFixed(1)}M</div>
            <div className="es-profile-stat-lbl">Valor</div>
          </div>
          <div className="es-profile-stat">
            <div className="es-profile-stat-val">{getPickRate(playerSlug)}%</div>
            <div className="es-profile-stat-lbl">Pick rate</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
          <Link href="/fantasy" className="ar-btn ar-btn-pick">Alineación</Link>
          <Link href="/players" className="ar-btn ar-btn-ghost">Catálogo</Link>
        </div>
      </aside>

      <div className="es-profile-main">
        <ArenaPanel title="Forma reciente">
          <div style={{ padding: "14px 16px", display: "flex", gap: 4, alignItems: "center" }}>
            {form.length > 0 ? form.map((r, i) => (
              <span key={i} className={r === "W" ? "es-form-w" : "es-form-l"} style={{ width: 12, height: 12 }} />
            )) : <span className="pl-dim">Sin datos de forma</span>}
            <span className="pl-dim" style={{ marginLeft: 8 }}>Ownership {player.fantasyOwnership}%</span>
          </div>
        </ArenaPanel>

        {teammates.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <ArenaPanel title={`Compañeros en ${team?.tag}`}>
              <table className="es-table">
                <thead>
                  <tr>
                    <th>Jugador</th>
                    <th>Forma</th>
                    <th>Rating</th>
                    <th>Pts evento</th>
                  </tr>
                </thead>
                <tbody>
                  {teammates.map((p) => {
                    const mp = transferMarket.find((m) => m.playerSlug === p.slug);
                    return (
                      <ProRow
                        key={p.slug}
                        playerSlug={p.slug}
                        form={mp?.form}
                        showForm
                        showRating
                        showFantasy
                      />
                    );
                  })}
                </tbody>
              </table>
            </ArenaPanel>
          </div>
        )}
      </div>
    </div>
  );
}

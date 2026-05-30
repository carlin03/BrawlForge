"use client";

import type { MatchMeta } from "@/lib/data/match-meta";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teamName } from "@/lib/data";

export function MatchMapsVisual({
  meta: rawMeta,
  teamASlug,
  teamBSlug,
}: {
  meta: unknown;
  teamASlug: string;
  teamBSlug: string;
}) {
  const meta = parseMatchMeta(rawMeta);
  const pool = meta.maps?.possible ?? [];
  const playedOrder = meta.maps?.played?.map((e) => e.name) ?? [];
  const order =
    meta.maps?.order?.length ? meta.maps.order : playedOrder.length ? playedOrder : pool;
  const current = meta.maps?.current ?? meta.maps?.played?.find((e) => e.current)?.name;
  const decisive = meta.maps?.decisive ?? meta.maps?.played?.find((e) => e.decisive)?.name;

  if (!pool.length && !order.length && !meta.bans?.maps_a?.length && !meta.bans?.maps_b?.length) {
    return null;
  }

  return (
    <section className="bf-match-esports-panel">
      <h2 className="bf-match-esports-h2">Mapas</h2>

      {pool.length > 0 && (
        <div className="bf-match-maps-block">
          <h3>Map pool</h3>
          <div className="bf-map-asset-grid">
            {pool.map((name) => (
              <MapAssetCard key={name} name={name} variant="pool" />
            ))}
          </div>
        </div>
      )}

      {order.length > 0 && (
        <div className="bf-match-maps-block">
          <h3>Orden de juego</h3>
          <div className="bf-map-asset-grid is-order">
            {order.map((name, i) => (
              <MapAssetCard
                key={`${name}-${i}`}
                name={name}
                variant="order"
                index={i}
                isCurrent={current === name}
                isDecisive={decisive === name}
              />
            ))}
          </div>
        </div>
      )}

      {(meta.bans?.maps_a?.length || meta.bans?.maps_b?.length) && (
        <div className="bf-match-maps-bans">
          <h3>Baneos</h3>
          <div className="bf-match-maps-bans-row">
            <div>
              <TeamLogo slug={teamASlug} name={teamName(teamASlug)} size={32} />
              <div className="bf-map-asset-grid is-ban">
                {(meta.bans?.maps_a ?? []).map((n) => (
                  <MapAssetCard key={n} name={n} variant="ban" />
                ))}
              </div>
            </div>
            <div>
              <TeamLogo slug={teamBSlug} name={teamName(teamBSlug)} size={32} />
              <div className="bf-map-asset-grid is-ban">
                {(meta.bans?.maps_b ?? []).map((n) => (
                  <MapAssetCard key={n} name={n} variant="ban" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

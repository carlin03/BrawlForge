"use client";

import { useMemo } from "react";
import type { MatchMeta } from "@/lib/data/match-meta";
import { parseMatchMeta } from "@/lib/data/match-meta";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teamName } from "@/lib/data";
import { mapOrderWithDecisive } from "@/lib/data/series-map-utils";

export function MatchMapsVisual({
  meta: rawMeta,
  format = "Bo3",
  teamASlug,
  teamBSlug,
}: {
  meta: unknown;
  format?: string;
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

  const orderSlots = useMemo(
    () => mapOrderWithDecisive(order, null, decisive, format),
    [order, decisive, format],
  );

  if (!pool.length && !order.length && !meta.bans?.maps_a?.length && !meta.bans?.maps_b?.length) {
    return null;
  }

  return (
    <section className="bf-match-esports-panel bf-match-maps-premium">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Mapas</h2>
        <p className="bf-match-section-lead">Pool, orden de juego, baneos y mapa decisivo del set.</p>
      </header>

      {pool.length > 0 && (
        <div className="bf-match-maps-block is-pool">
          <h3>Map pool</h3>
          <div className="bf-map-asset-grid is-pool-large">
            {pool.map((name) => (
              <MapAssetCard key={name} name={name} variant="pool" size="lg" />
            ))}
          </div>
        </div>
      )}

      {orderSlots.length > 0 && (
        <div className="bf-match-maps-block is-order">
          <h3>Orden de juego</h3>
          <div className="bf-map-series-order-strip">
            {orderSlots.map((slot) => (
              <MapAssetCard
                key={`${slot.name}-${slot.index}`}
                name={slot.name}
                variant="order"
                index={slot.index}
                isCurrent={current === slot.name}
                isDecisive={slot.decisive}
                size={slot.decisive ? "lg" : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {decisive && (
        <div className="bf-match-maps-block is-decisive-highlight">
          <h3>Mapa decisivo</h3>
          <p className="bf-match-maps-decisive-lead">El mapa que puede decidir la serie.</p>
          <div className="bf-map-asset-grid is-decisive-single">
            <MapAssetCard name={decisive} variant="order" isDecisive size="lg" />
          </div>
        </div>
      )}

      {(meta.bans?.maps_a?.length || meta.bans?.maps_b?.length) && (
        <div className="bf-match-maps-block is-bans">
          <h3>Mapas baneados</h3>
          <div className="bf-match-maps-bans-row">
            <div className="bf-match-maps-ban-col is-team-a">
              <TeamLogo slug={teamASlug} name={teamName(teamASlug)} size={36} />
              <span className="bf-match-maps-ban-team">{teamName(teamASlug)}</span>
              <div className="bf-map-asset-grid is-ban">
                {(meta.bans?.maps_a ?? []).map((n) => (
                  <MapAssetCard key={n} name={n} variant="ban" />
                ))}
              </div>
            </div>
            <div className="bf-match-maps-ban-col is-team-b">
              <TeamLogo slug={teamBSlug} name={teamName(teamBSlug)} size={36} />
              <span className="bf-match-maps-ban-team">{teamName(teamBSlug)}</span>
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

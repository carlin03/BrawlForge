"use client";

import type { EsportsMatch } from "@/lib/data/matches";
import type { MatchMeta } from "@/lib/data/match-meta";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { MapAssetCard } from "@/components/match-esports/MapAssetCard";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { playedMapSlotsForFinished } from "@/lib/data/match-results-display";
import { resolveMapForMatch } from "@/lib/data/resolve-match-assets";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";

function BrawlerChipList({ items, variant = "pick" }: { items: string[]; variant?: "pick" | "ban" }) {
  if (!items.length) return <span className="bf-series-muted">—</span>;
  return (
    <div className={`bf-series-brawler-chips is-${variant}`}>
      {items.map((name) => (
        <div key={name} className="bf-series-brawler-chip">
          <BrawlerAssetIcon name={name} size={32} variant="pick" />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
}

export function MatchFinishedSeriesStats({
  match,
  meta,
}: {
  match: EsportsMatch;
  meta: MatchMeta;
}) {
  if (match.status !== "finished") return null;

  const { maps: mapCatalog } = useGameAssetsCatalog();
  const slots = playedMapSlotsForFinished(match, meta);
  const mapResults = meta.advanced_predictions?.map_results ?? {};
  const adv = meta.advanced_predictions;

  if (!slots.length) return null;

  return (
    <section className="bf-match-esports-panel bf-match-finished-series" id="match-series-stats">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Estadísticas del partido</h2>
        <p className="bf-match-section-lead">
          Mapas jugados, picks, baneos y meta de brawlers — estilo recap pro.
        </p>
      </header>

      <div className="bf-series-score-strip">
        <div className="bf-series-score-team">
          <TeamLogo slug={match.teamASlug} name={teamName(match.teamASlug, match)} size={40} />
          <span>{teamName(match.teamASlug, match)}</span>
          <strong>{match.scoreA}</strong>
        </div>
        <span className="bf-series-score-mid">Serie · {match.format}</span>
        <div className="bf-series-score-team">
          <TeamLogo slug={match.teamBSlug} name={teamName(match.teamBSlug, match)} size={40} />
          <span>{teamName(match.teamBSlug, match)}</span>
          <strong>{match.scoreB}</strong>
        </div>
      </div>

      <div className="bf-series-maps-list">
        {slots.map((slot) => {
          const row = mapResults[String(slot.index)];
          const winnerSlug =
            row?.winner === "A"
              ? match.teamASlug
              : row?.winner === "B"
                ? match.teamBSlug
                : null;
          const mapEntry = resolveMapForMatch(slot.name, meta, mapCatalog);

          return (
            <article
              key={`${slot.name}-${slot.index}`}
              className={`bf-series-map-card ${slot.decisive ? "is-decisive" : ""}`}
            >
              <header className="bf-series-map-head">
                <div>
                  <span className="bf-series-map-num">Mapa {slot.index + 1}</span>
                  <h3>{slot.name}</h3>
                  {mapEntry.mode && <span className="bf-map-meta-mode-pill">{mapEntry.mode}</span>}
                  {slot.decisive && <span className="bf-map-series-decisive-badge">Decisivo</span>}
                </div>
                {winnerSlug && (
                  <div className="bf-series-map-winner">
                    <TeamLogo slug={winnerSlug} name={teamName(winnerSlug)} size={36} />
                    <span>{teamName(winnerSlug)}</span>
                  </div>
                )}
              </header>

              <div className="bf-series-map-body">
                <div className="bf-series-map-art">
                  <MapAssetCard
                    name={slot.name}
                    variant="order"
                    index={slot.index}
                    isDecisive={slot.decisive}
                    meta={meta}
                    size="md"
                  />
                </div>

                <div className="bf-series-map-picks">
                  <div className="bf-series-pick-col">
                    <span className="bf-series-pick-label">{teamName(match.teamASlug, match)}</span>
                    <BrawlerChipList items={row?.picks_a ?? []} />
                    {row?.team_bans_a?.length ? (
                      <div className="bf-series-team-bans">
                        <span>Bans equipo</span>
                        <BrawlerChipList items={row.team_bans_a} variant="ban" />
                      </div>
                    ) : null}
                  </div>
                  <div className="bf-series-pick-col is-center">
                    {row?.central_bans?.length ? (
                      <>
                        <span className="bf-series-pick-label">Bans centrales</span>
                        <BrawlerChipList items={row.central_bans} variant="ban" />
                      </>
                    ) : null}
                  </div>
                  <div className="bf-series-pick-col">
                    <span className="bf-series-pick-label">{teamName(match.teamBSlug, match)}</span>
                    <BrawlerChipList items={row?.picks_b ?? []} />
                    {row?.team_bans_b?.length ? (
                      <div className="bf-series-team-bans">
                        <span>Bans equipo</span>
                        <BrawlerChipList items={row.team_bans_b} variant="ban" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {(adv?.most_used_brawler ||
        adv?.match_mvp_brawler ||
        adv?.most_banned_brawler ||
        adv?.lowest_wr_brawler) && (
        <div className="bf-series-brawler-summary">
          <h3>Resumen brawlers</h3>
          <div className="bf-series-brawler-summary-grid">
            {adv.most_used_brawler && (
              <div>
                <span>Más usado</span>
                <BrawlerAssetIcon name={adv.most_used_brawler} size={52} variant="meta" />
                <strong>{adv.most_used_brawler}</strong>
              </div>
            )}
            {adv.match_mvp_brawler && (
              <div>
                <span>MVP partido</span>
                <BrawlerAssetIcon name={adv.match_mvp_brawler} size={52} variant="meta" />
                <strong>{adv.match_mvp_brawler}</strong>
              </div>
            )}
            {adv.most_banned_brawler && (
              <div>
                <span>Más baneado</span>
                <BrawlerAssetIcon name={adv.most_banned_brawler} size={52} variant="ban" />
                <strong>{adv.most_banned_brawler}</strong>
              </div>
            )}
            {adv.lowest_wr_brawler && (
              <div>
                <span>Menor WR</span>
                <BrawlerAssetIcon name={adv.lowest_wr_brawler} size={52} variant="meta" />
                <strong>{adv.lowest_wr_brawler}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {(meta.bans?.maps_a?.length || meta.bans?.maps_b?.length) && (
        <div className="bf-series-map-bans">
          <h3>Baneos de mapas (serie)</h3>
          <div className="bf-series-map-bans-row">
            <div>
              <span>{teamName(match.teamASlug, match)}</span>
              <div className="bf-map-asset-grid is-ban">
                {(meta.bans?.maps_a ?? []).map((n) => (
                  <MapAssetCard key={n} name={n} variant="ban" />
                ))}
              </div>
            </div>
            <div>
              <span>{teamName(match.teamBSlug, match)}</span>
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

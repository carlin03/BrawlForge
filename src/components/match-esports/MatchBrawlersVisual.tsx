"use client";

import { parseMatchMeta } from "@/lib/data/match-meta";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { teamName } from "@/lib/data";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function MatchBrawlersVisual({
  meta: rawMeta,
  teamASlug,
  teamBSlug,
}: {
  meta: unknown;
  teamASlug: string;
  teamBSlug: string;
}) {
  const meta = parseMatchMeta(rawMeta);
  const has =
    meta.brawlers?.meta?.length ||
    meta.brawlers?.recommended?.length ||
    meta.brawlers?.most_used?.length ||
    meta.bans?.brawlers_a?.length ||
    meta.bans?.brawlers_b?.length;

  if (!has) return null;

  return (
    <section className="bf-match-esports-panel">
      <h2 className="bf-match-esports-h2">Brawlers</h2>
      <div className="bf-brawler-sections">
        {meta.brawlers?.meta?.length ? (
          <div>
            <h3>Meta actual</h3>
            <div className="bf-brawler-pick-row">
              {meta.brawlers.meta.map((n) => (
                <BrawlerAssetIcon key={n} name={n} variant="meta" />
              ))}
            </div>
          </div>
        ) : null}
        {meta.brawlers?.recommended?.length ? (
          <div>
            <h3>Recomendados</h3>
            <div className="bf-brawler-pick-row">
              {meta.brawlers.recommended.map((n) => (
                <BrawlerAssetIcon key={n} name={n} variant="default" />
              ))}
            </div>
          </div>
        ) : null}
        {meta.brawlers?.most_used?.length ? (
          <div>
            <h3>Más usados</h3>
            <div className="bf-brawler-pick-row">
              {meta.brawlers.most_used.map((n) => (
                <BrawlerAssetIcon key={n} name={n} variant="default" />
              ))}
            </div>
          </div>
        ) : null}
        {(meta.bans?.brawlers_a?.length || meta.bans?.brawlers_b?.length) && (
          <div className="bf-brawler-bans-row">
            <div>
              <TeamLogo slug={teamASlug} name={teamName(teamASlug)} size={28} />
              <div className="bf-brawler-pick-row">
                {(meta.bans?.brawlers_a ?? []).map((n) => (
                  <BrawlerAssetIcon key={n} name={n} variant="ban" />
                ))}
              </div>
            </div>
            <div>
              <TeamLogo slug={teamBSlug} name={teamName(teamBSlug)} size={28} />
              <div className="bf-brawler-pick-row">
                {(meta.bans?.brawlers_b ?? []).map((n) => (
                  <BrawlerAssetIcon key={n} name={n} variant="ban" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

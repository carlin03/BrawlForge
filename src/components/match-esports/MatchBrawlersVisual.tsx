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
    <section className="bf-match-esports-panel bf-match-brawlers-premium">
      <header className="bf-match-section-head">
        <h2 className="bf-match-esports-h2">Brawlers</h2>
        <p className="bf-match-section-lead">Meta, picks recomendados, más usados y baneos del set.</p>
      </header>

      <div className="bf-brawler-sections">
        {meta.brawlers?.meta?.length ? (
          <div className="bf-brawler-block is-meta">
            <h3>Meta recomendada</h3>
            <div className="bf-brawler-icon-row is-large">
              {meta.brawlers.meta.map((n) => (
                <BrawlerAssetIcon key={n} name={n} variant="meta" size={88} hideName />
              ))}
            </div>
            <div className="bf-brawler-name-row" aria-hidden>
              {meta.brawlers.meta.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        ) : null}

        {meta.brawlers?.recommended?.length ? (
          <div className="bf-brawler-block">
            <h3>Recomendados</h3>
            <div className="bf-brawler-icon-row">
              {meta.brawlers.recommended.map((n) => (
                <BrawlerAssetIcon key={n} name={n} variant="default" size={80} hideName />
              ))}
            </div>
          </div>
        ) : null}

        {meta.brawlers?.most_used?.length ? (
          <div className="bf-brawler-block">
            <h3>Más usados</h3>
            <div className="bf-brawler-icon-row">
              {meta.brawlers.most_used.map((n) => (
                <BrawlerAssetIcon key={n} name={n} variant="default" size={80} hideName />
              ))}
            </div>
          </div>
        ) : null}

        {(meta.bans?.brawlers_a?.length || meta.bans?.brawlers_b?.length) && (
          <div className="bf-brawler-block is-bans">
            <h3>Baneados</h3>
            <div className="bf-brawler-bans-row">
              <div className="bf-brawler-ban-col">
                <TeamLogo slug={teamASlug} name={teamName(teamASlug)} size={32} />
                <div className="bf-brawler-icon-row">
                  {(meta.bans?.brawlers_a ?? []).map((n) => (
                    <BrawlerAssetIcon key={n} name={n} variant="ban" size={72} hideName />
                  ))}
                </div>
              </div>
              <div className="bf-brawler-ban-col">
                <TeamLogo slug={teamBSlug} name={teamName(teamBSlug)} size={32} />
                <div className="bf-brawler-icon-row">
                  {(meta.bans?.brawlers_b ?? []).map((n) => (
                    <BrawlerAssetIcon key={n} name={n} variant="ban" size={72} hideName />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

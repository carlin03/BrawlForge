import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { tournaments, teamName } from "@/lib/data";
import { loadMergedNews } from "@/lib/news-loader";

export async function NewsPanel() {
  const articles = (await loadMergedNews()).slice(0, 4);
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Esports News</h3>
        <Link href="/news" className="link-more">All news →</Link>
      </div>
      {featured && (
        <Link href={`/news/${featured.slug}`} className="news-card-featured m-3 block">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-text-muted">{featured.category}</span>
            {featured.hot && <span className="badge-live">Hot</span>}
          </div>
          <h4 className="font-display text-lg font-bold leading-snug">{featured.title}</h4>
          <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{featured.excerpt}</p>
        </Link>
      )}
      <div className="divide-y divide-border-subtle border-t border-border-subtle">
        {rest.map((article) => (
          <Link key={article.slug} href={`/news/${article.slug}`} className="block px-4 py-3 hover:bg-bg-hover">
            <div className="mb-1 text-[10px] font-semibold uppercase text-text-muted">{article.category}</div>
            <h4 className="text-sm font-semibold leading-snug">{article.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TournamentsPanel() {
  const active = tournaments.filter((t) => t.status !== "finished").slice(0, 3);
  const recent = tournaments.filter((t) => t.status === "finished").slice(0, 2);

  return (
    <Panel title="Tournaments" href="/tournaments" className="panel-accent-top">
      <div className="divide-y divide-border-subtle">
        {[...active, ...recent].map((t) => (
          <Link key={t.slug} href={`/tournaments/${t.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover">
            <TournamentLogo slug={t.slug} name={t.shortName} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{t.shortName}</div>
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-text-muted">
                <span>{t.location} · {t.prizePool}</span>
                {t.winnerSlug && (
                  <>
                    <span>·</span>
                    <TeamLogo slug={t.winnerSlug} name={teamName(t.winnerSlug)} size={14} />
                    <span>{teamName(t.winnerSlug)}</span>
                  </>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase ${
              t.status === "live" ? "text-accent-red" : t.status === "upcoming" ? "text-accent-yellow" : "text-text-muted"
            }`}>
              {t.status}
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}


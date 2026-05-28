import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsCover } from "@/components/news/NewsCover";
import { getNews, getLatestNews, teamName } from "@/lib/data";
import { formatNewsDate } from "@/lib/news-ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { tournamentName } from "@/lib/data";

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getNews(slug);
  if (!article) notFound();

  const related = getLatestNews(6).filter((a) => a.slug !== slug).slice(0, 4);

  return (
    <article className="bf-news-article">
      <NewsCover article={article} size="large" />
      <div className="bf-news-article-hd">
        <span className="bp-chip bp-chip-gold">{article.category}</span>
        {article.hot && <span className="bp-chip bp-chip-live">Hot</span>}
        <h1 className="bf-news-article-title">{article.title}</h1>
        <p className="bf-news-article-meta">
          {article.author} · {formatNewsDate(article.date)} · {article.readMinutes} min lectura
        </p>
        <p className="bf-news-article-lead">{article.excerpt}</p>
      </div>

      {article.keyStats && article.keyStats.length > 0 && (
        <div className="bf-news-stats-bar">
          {article.keyStats.map((s) => (
            <div key={s.label} className="bf-news-stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {article.highlights && article.highlights.length > 0 && (
        <aside className="bf-news-highlights-box">
          <h2>Claves</h2>
          <ul>
            {article.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </aside>
      )}

      <div className="bf-news-article-body">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {(article.relatedTeams?.length || article.relatedTournament) && (
        <footer className="bf-news-article-footer">
          {article.relatedTeams && article.relatedTeams.length > 0 && (
            <div>
              <h3>Equipos</h3>
              <div className="bf-news-related-chips">
                {article.relatedTeams.map((ts) => (
                  <Link key={ts} href={`/teams/${ts}`} className="bf-news-chip">
                    <TeamLogo slug={ts} name={teamName(ts)} size={28} />
                    {teamName(ts)}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {article.relatedTournament && (
            <div>
              <h3>Torneo</h3>
              <Link href={`/tournaments/${article.relatedTournament}`} className="bf-news-chip">
                <TournamentLogo
                  slug={article.relatedTournament}
                  name={tournamentName(article.relatedTournament)}
                  size={32}
                />
                {tournamentName(article.relatedTournament)}
              </Link>
            </div>
          )}
        </footer>
      )}

      {related.length > 0 && (
        <section className="bf-news-related">
          <h2>Más noticias</h2>
          <div className="bf-news-related-grid">
            {related.map((a) => (
              <Link key={a.slug} href={`/news/${a.slug}`} className="bp-news-card-md">
                <span className={`bp-chip bp-chip-blue`}>{a.category}</span>
                <div className="bp-news-card-md-title">{a.title}</div>
                <div className="bp-news-card-md-meta">{formatNewsDate(a.date)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

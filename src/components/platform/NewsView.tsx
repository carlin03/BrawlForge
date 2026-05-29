"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Flame, Newspaper, Zap } from "lucide-react";
import { NewsCover } from "@/components/news/NewsCover";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { TournamentLogo } from "@/components/ui/TournamentLogo";
import { getLatestNews, teamName, tournamentName, type NewsArticle } from "@/lib/data";

const CATEGORIES = ["Todo", "Resultados", "Torneos", "Fichajes", "Fantasy", "Esports"] as const;
type Category = (typeof CATEGORIES)[number];

const accentClass = {
  gold: "is-gold",
  yellow: "is-gold",
  blue: "is-blue",
  red: "is-hot",
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function NewsView() {
  const articles = getLatestNews(32);
  const [category, setCategory] = useState<Category>("Todo");

  const filtered = useMemo(() => {
    if (category === "Todo") return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  const featured = filtered.find((a) => a.hot) ?? filtered[0];
  const rest = filtered.filter((a) => a.slug !== featured?.slug);
  const breaking = articles.filter((a) => a.hot || a.coverAccent === "red").slice(0, 8);

  return (
    <PageUltraShell className="bf-news-hub">
      <header className="bf-news-hub-hero">
        <div className="bf-news-hub-hero-copy">
          <p className="bf-news-hub-kicker">
            <Newspaper size={14} aria-hidden /> Noticias BSC
          </p>
          <h1>
            Cobertura <em>en vivo</em>
          </h1>
          <p>Resultados, torneos, fichajes y fantasy — el pulso del circuito pro.</p>
          <div className="bf-news-hub-stats">
            <span>
              <b>{articles.length}</b> historias
            </span>
            <span>
              <b>{breaking.length}</b> breaking
            </span>
          </div>
        </div>
        {featured && (
          <Link href={`/news/${featured.slug}`} className="bf-news-hub-hero-card">
            <div className="bf-news-hub-hero-cover">
              <NewsCover article={featured} size="large" />
              <span className={`bf-news-hub-badge ${featured.hot ? "is-hot" : accentClass[featured.coverAccent]}`}>
                {featured.hot ? (
                  <>
                    <Flame size={12} /> Hot
                  </>
                ) : (
                  featured.category
                )}
              </span>
            </div>
            <div className="bf-news-hub-hero-body">
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <span className="bf-news-hub-meta">
                <Clock size={12} aria-hidden />
                {featured.readMinutes} min · {formatDate(featured.date)}
              </span>
            </div>
          </Link>
        )}
      </header>

      {breaking.length > 0 && (
        <div className="bf-news-hub-ticker">
          <span className="bf-news-hub-ticker-label">
            <Zap size={14} aria-hidden /> Breaking
          </span>
          <div className="bf-news-hub-ticker-track">
            {[...breaking, ...breaking].map((a, i) => (
              <Link key={`${a.slug}-${i}`} href={`/news/${a.slug}`}>
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bf-news-hub-filters">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`bf-news-hub-filter ${category === c ? "is-on" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bf-news-hub-layout">
        <main className="bf-news-hub-main">
          {rest.length === 0 && !featured ? (
            <p className="bf-home-empty">No hay noticias en esta categoría.</p>
          ) : (
            <div className="bf-news-hub-grid">
              {rest.map((a, i) => (
                <NewsCard key={a.slug} article={a} wide={i === 0 && category === "Todo"} />
              ))}
            </div>
          )}
        </main>

        <aside className="bf-news-hub-aside">
          <div className="bf-news-hub-aside-block">
            <h3>Trending</h3>
            <ol>
              {articles.slice(0, 6).map((a, i) => (
                <li key={a.slug}>
                  <Link href={`/news/${a.slug}`}>
                    <span className="bf-news-hub-rank">{i + 1}</span>
                    <span>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <div className="bf-news-hub-aside-block">
            <h3>Fichajes</h3>
            {articles
              .filter((a) => a.category === "Fichajes")
              .slice(0, 4)
              .map((a) => (
                <Link key={a.slug} href={`/news/${a.slug}`} className="bf-news-hub-aside-mini">
                  <strong>{a.title}</strong>
                  <span>{formatDate(a.date)}</span>
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </PageUltraShell>
  );
}

function NewsCard({ article, wide }: { article: NewsArticle; wide?: boolean }) {
  return (
    <Link href={`/news/${article.slug}`} className={`bf-news-hub-card ${wide ? "is-wide" : ""}`}>
      <div className="bf-news-hub-card-cover">
        <NewsCover article={article} size="card" />
      </div>
      <div className="bf-news-hub-card-body">
        <span className={`bf-news-hub-badge ${article.hot ? "is-hot" : accentClass[article.coverAccent]}`}>
          {article.category}
        </span>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        {article.highlights && article.highlights.length > 0 && (
          <ul className="bf-news-hub-highlights">
            {article.highlights.slice(0, 2).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <footer className="bf-news-hub-card-foot">
          <span>
            {article.author} · {article.readMinutes} min
          </span>
          <span className="bf-news-hub-card-date">{formatDate(article.date)}</span>
        </footer>
        {(article.relatedTeams?.length || article.relatedTournament) && (
          <div className="bf-news-hub-card-tags">
            {article.relatedTeams?.slice(0, 3).map((slug) => (
              <TeamLogo key={slug} slug={slug} name={teamName(slug)} size={24} glow={false} />
            ))}
            {article.relatedTournament && (
              <TournamentLogo
                slug={article.relatedTournament}
                name={tournamentName(article.relatedTournament)}
                size={24}
                glow={false}
              />
            )}
          </div>
        )}
        <span className="bf-news-hub-read">
          Leer <ArrowRight size={14} aria-hidden />
        </span>
      </div>
    </Link>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/platform/ui";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getLatestNews, teamName, type NewsArticle } from "@/lib/data";

const accentMap = {
  gold: "bp-chip-gold",
  yellow: "bp-chip-gold",
  blue: "bp-chip-blue",
  red: "bp-chip-live",
} as const;

const heroTone = {
  gold: "",
  yellow: "",
  blue: "blue",
  red: "red",
} as const;

const CATEGORIES = ["Todo", "Resultados", "Torneos", "Fichajes", "Fantasy", "Esports"] as const;
type Category = (typeof CATEGORIES)[number];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function NewsView() {
  const articles = getLatestNews(12);
  const [category, setCategory] = useState<Category>("Todo");

  const filtered = useMemo(() => {
    if (category === "Todo") return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  const featured = filtered.find((a) => a.hot) ?? filtered[0];
  const secondary = filtered.filter((a) => a.slug !== featured?.slug).slice(0, 2);
  const trending = [...articles].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0)).slice(0, 5);
  const moves = articles.filter((a) => a.category === "Fichajes").slice(0, 3);
  const rest = filtered.filter((a) => a.slug !== featured?.slug && !secondary.some((s) => s.slug === a.slug));
  const breaking = articles.filter((a) => a.hot || a.coverAccent === "red").slice(0, 4);

  return (
    <>
      <h1 className="bp-h1">Noticias</h1>
      <p className="bp-lead">Competitivo, fantasy y mercado — cobertura en directo del circuito BSC.</p>

      {breaking.length > 0 && (
        <div className="bp-breaking-strip">
          <span className="bp-breaking-label">Breaking</span>
          <div className="bp-breaking-scroll">
            {breaking.map((a) => (
              <Link key={a.slug} href={`/news/${a.slug}`} className="bp-breaking-item">
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bp-news-categories">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`bp-news-cat ${category === c ? "is-on" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {featured && (
        <div className="bp-news-editorial">
          <Link
            href={`/news/${featured.slug}`}
            className={`bp-news-hero-lg ${heroTone[featured.coverAccent]}`}
          >
            <span className={`bp-chip ${featured.hot ? "bp-chip-break" : accentMap[featured.coverAccent]}`}>
              {featured.hot ? "Destacado" : featured.category}
            </span>
            <h2 className="bp-news-hero-lg-title">{featured.title}</h2>
            <p className="bp-news-hero-lg-excerpt">{featured.excerpt}</p>
            <div className="bp-news-hero-lg-meta">
              {featured.author} · {featured.readMinutes} min · {formatDate(featured.date)}
            </div>
          </Link>

          <div className="bp-news-stack">
            {secondary.map((a) => (
              <Link key={a.slug} href={`/news/${a.slug}`} className="bp-news-card-md">
                <span className={`bp-chip ${accentMap[a.coverAccent]}`}>{a.category}</span>
                <div className="bp-news-card-md-title">{a.title}</div>
                <div className="bp-news-card-md-meta">{formatDate(a.date)} · {a.readMinutes} min</div>
              </Link>
            ))}
          </div>

          <div>
            <div className="bp-news-sidebar-block">
              <h3>Trending ahora</h3>
              {trending.map((a, i) => (
                <Link key={a.slug} href={`/news/${a.slug}`} className="bp-news-trend-item">
                  <span className="bp-news-trend-num">{i + 1}</span>
                  {a.title}
                </Link>
              ))}
            </div>
            <div className="bp-news-sidebar-block">
              <h3>Reacción comunidad</h3>
              <div className="bp-feed-item bp-feed-item-dense" style={{ border: "none", padding: "4px 0" }}>
                <span className="bp-feed-dot gold" />
                <span className="bp-feed-text">2.4K managers comentaron el mercado</span>
              </div>
              <div className="bp-feed-item bp-feed-item-dense" style={{ border: "none", padding: "4px 0" }}>
                <span className="bp-feed-dot blue" />
                <span className="bp-feed-text">68% acertó la sorpresa CR vs HMBLE</span>
              </div>
              <div className="bp-feed-item bp-feed-item-dense" style={{ border: "none", padding: "4px 0" }}>
                <span className="bp-feed-dot red" />
                <span className="bp-feed-text">Fichaje Joker — trending #1 fantasy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {moves.length > 0 && category !== "Resultados" && (
        <>
          <h2 className="bp-h2" style={{ marginBottom: 10 }}>Movimientos de roster</h2>
          <div className="bp-news-moves">
            {moves.map((a) => (
              <MoveCard key={a.slug} article={a} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="bp-h2" style={{ marginBottom: 10 }}>Más historias</h2>
          <div className="bp-news-grid-mixed">
            {rest.map((a, i) => (
              <Link
                key={a.slug}
                href={`/news/${a.slug}`}
                className={`bp-news-grid-item ${i === 0 ? "wide" : ""}`}
              >
                <span className={`bp-chip ${accentMap[a.coverAccent]}`}>{a.category}</span>
                <div className="bp-news-grid-item-title">{a.title}</div>
                {i === 0 && <p className="bp-news-grid-item-excerpt">{a.excerpt}</p>}
                <div className="bp-news-card-md-meta">{formatDate(a.date)} · {a.readMinutes} min</div>
                {a.relatedTeams?.[0] && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    {a.relatedTeams.slice(0, 2).map((slug) => (
                      <TeamLogo key={slug} slug={slug} name={teamName(slug)} size={20} />
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      <Panel title="Archivo reciente" flush className="bp-panel-quiet">
        {articles.slice(0, 6).map((a) => (
          <Link key={a.slug} href={`/news/${a.slug}`} className="bp-row">
            <span className={`bp-chip ${accentMap[a.coverAccent]}`}>{a.category}</span>
            <div className="bp-row-main">
              <div className="bp-row-title">{a.title}</div>
              <div className="bp-row-sub">{a.excerpt.slice(0, 90)}…</div>
            </div>
            <span className="bp-feed-ago">{formatDate(a.date)}</span>
          </Link>
        ))}
      </Panel>
    </>
  );
}

function MoveCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="bp-news-move-card">
      <span className="bp-chip bp-chip-live">Fichaje</span>
      <div className="bp-news-move-card-title">{article.title}</div>
      <div className="bp-news-move-card-meta">{formatDate(article.date)} · {article.readMinutes} min</div>
      {article.relatedTeams && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          {article.relatedTeams.map((slug) => (
            <TeamLogo key={slug} slug={slug} name={teamName(slug)} size={24} />
          ))}
        </div>
      )}
    </Link>
  );
}

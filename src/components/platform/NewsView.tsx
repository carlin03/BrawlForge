"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Newspaper, Zap } from "lucide-react";
import { NewsCover } from "@/components/news/NewsCover";
import { PageUltraShell } from "@/components/platform/PageUltraShell";
import { PageUltraHero } from "@/components/platform/PageUltraHero";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { getLatestNews, teamName, type NewsArticle } from "@/lib/data";

const accentMap = {
  gold: "bp-chip-gold",
  yellow: "bp-chip-gold",
  blue: "bp-chip-blue",
  red: "bp-chip-live",
} as const;

const CATEGORIES = ["Todo", "Resultados", "Torneos", "Fichajes", "Fantasy", "Esports"] as const;
type Category = (typeof CATEGORIES)[number];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function NewsView() {
  const articles = getLatestNews(24);
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
  const breaking = articles.filter((a) => a.hot || a.coverAccent === "red").slice(0, 6);

  return (
    <PageUltraShell className="bf-news-ultra">
      <PageUltraHero
        kicker={
          <>
            <Newspaper size={14} /> Noticias BSC
          </>
        }
        title={
          <>
            Cobertura <em>pro</em>
          </>
        }
        lead="Competitivo, fantasy y mercado de fichajes — el pulso del circuito en tiempo real."
        stats={
          <div className="fu-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="fu-stat">
              <b>{articles.length}</b>
              <span>Historias</span>
            </div>
            <div className="fu-stat">
              <b>{breaking.length}</b>
              <span>Breaking</span>
            </div>
            <div className="fu-stat">
              <b>{moves.length}</b>
              <span>Fichajes</span>
            </div>
          </div>
        }
        actions={
          <>
            <Link href="/matches" className="fu-btn fu-btn-ghost">
              Partidos
            </Link>
            <Link href="/predictions" className="fu-btn fu-btn-red">
              Predicciones
            </Link>
          </>
        }
        showcase={
          featured ? (
            <div className="fu-cards-showcase" style={{ minHeight: 260 }}>
              <Link href={`/news/${featured.slug}`} className="fu-card-float fu-card-float-2" style={{ textDecoration: "none" }}>
                <div className="fu-news-feature" style={{ width: 220, padding: 0 }}>
                  <div className="fu-news-feature-cover" style={{ height: 140 }}>
                    <NewsCover article={featured} size="card" />
                  </div>
                  <div className="fu-news-feature-body" style={{ padding: "12px 14px" }}>
                    <span className={`bp-chip ${featured.hot ? "bp-chip-break" : accentMap[featured.coverAccent]}`}>
                      {featured.hot ? "Hot" : featured.category}
                    </span>
                    <div className="fu-news-feature-title" style={{ fontSize: 13, margin: "8px 0 0" }}>
                      {featured.title.slice(0, 72)}
                      {featured.title.length > 72 ? "…" : ""}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ) : undefined
        }
      />

      {breaking.length > 0 && (
        <div className="fu-news-breaking">
          <span className="bp-chip bp-chip-live">
            <Zap size={12} /> Breaking
          </span>
          <div className="fu-news-breaking-scroll">
            {[...breaking, ...breaking].map((a, i) => (
              <Link key={`${a.slug}-${i}`} href={`/news/${a.slug}`} className="fu-news-breaking-item">
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="fu-tabs" style={{ flexWrap: "wrap" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={`fu-tab ${category === c ? "is-on" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {featured && (
        <div className="fu-news-hero-grid">
          <Link href={`/news/${featured.slug}`} className="fu-news-feature">
            <div className="fu-news-feature-cover">
              <NewsCover article={featured} size="card" />
            </div>
            <div className="fu-news-feature-body">
              <span className={`bp-chip ${featured.hot ? "bp-chip-break" : accentMap[featured.coverAccent]}`}>
                {featured.hot ? "Destacado" : featured.category}
              </span>
              <h2 className="fu-news-feature-title">{featured.title}</h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--bp-muted)", lineHeight: 1.5 }}>{featured.excerpt}</p>
              {featured.highlights && featured.highlights.length > 0 && (
                <ul className="bp-news-highlights">
                  {featured.highlights.slice(0, 3).map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              <div className="bp-news-hero-lg-meta" style={{ marginTop: 12 }}>
                {featured.author} · {featured.readMinutes} min · {formatDate(featured.date)}
              </div>
            </div>
          </Link>

          <div className="fu-news-stack-ultra">
            {secondary.map((a) => (
              <Link key={a.slug} href={`/news/${a.slug}`} className="fu-news-mini">
                <div className="fu-news-mini-cover">
                  <NewsCover article={a} size="card" />
                </div>
                <div>
                  <span className={`bp-chip ${accentMap[a.coverAccent]}`}>{a.category}</span>
                  <div style={{ fontWeight: 800, fontSize: 13, marginTop: 6, lineHeight: 1.25 }}>{a.title}</div>
                  <div className="bp-news-card-md-meta">
                    {formatDate(a.date)} · {a.readMinutes} min
                  </div>
                </div>
              </Link>
            ))}

            <div className="fu-panel fu-panel-glow">
              <div className="fu-panel-head">
                <h2>Trending</h2>
              </div>
              {trending.map((a, i) => (
                <Link key={a.slug} href={`/news/${a.slug}`} className="bp-news-trend-item">
                  <span className="bp-news-trend-num">{i + 1}</span>
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {moves.length > 0 && category !== "Resultados" && (
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Movimientos de roster</h2>
            <Link href="/news">Archivo</Link>
          </div>
          <div className="bp-news-moves">
            {moves.map((a) => (
              <MoveCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="fu-panel fu-panel-glow">
          <div className="fu-panel-head">
            <h2>Más historias</h2>
          </div>
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
                <div className="bp-news-card-md-meta">
                  {formatDate(a.date)} · {a.readMinutes} min
                </div>
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
        </section>
      )}
    </PageUltraShell>
  );
}

function MoveCard({ article }: { article: NewsArticle }) {
  return (
    <Link href={`/news/${article.slug}`} className="bp-news-move-card">
      <span className="bp-chip bp-chip-live">Fichaje</span>
      <div className="bp-news-move-card-title">{article.title}</div>
      <div className="bp-news-move-card-meta">
        {formatDate(article.date)} · {article.readMinutes} min
      </div>
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

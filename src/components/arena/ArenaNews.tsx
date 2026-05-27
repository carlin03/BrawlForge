import Link from "next/link";
import { ArenaPanel, ArenaBadge } from "./ArenaUI";
import { news, getFeaturedTournaments } from "@/lib/data";
import { formatNewsDate } from "@/lib/news-ui";

export function ArenaNews() {
  const sorted = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [featured, ...rest] = sorted;
  const categories = [...new Set(sorted.map((a) => a.category))];
  const trending = sorted.slice(0, 5);
  const tournaments = getFeaturedTournaments(3);

  return (
    <>
      <div className="ar-page-head">
        <h1 className="ar-h1">Noticias</h1>
        <p className="ar-lead">Cobertura editorial del competitivo BSC — análisis, resultados y contexto.</p>
      </div>

      <div className="ar-news-layout">
        <div>
          {featured && (
            <Link href={`/news/${featured.slug}`} className="ar-panel" style={{ display: "block", padding: 20, marginBottom: "var(--ar-gap-lg)", textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <ArenaBadge variant="blue">Destacado</ArenaBadge>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ar-vote)" }}>{featured.category}</span>
                <span style={{ fontSize: 11, color: "var(--ar-dim)" }}>{formatNewsDate(featured.date)}</span>
              </div>
              <h2 style={{ fontFamily: "var(--ar-head)", fontSize: "1.35rem", fontWeight: 800, margin: "0 0 10px", lineHeight: 1.2, textTransform: "uppercase" }}>{featured.title}</h2>
              <p style={{ color: "var(--ar-muted)", margin: 0, lineHeight: 1.55, fontSize: 14 }}>{featured.excerpt}</p>
            </Link>
          )}

          <ArenaPanel title="Últimas noticias">
            {rest.map((a) => (
              <Link key={a.slug} href={`/news/${a.slug}`} className="ar-compact-row">
                <div className="ar-compact-main">
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                    <ArenaBadge variant="dim">{a.category}</ArenaBadge>
                    <span style={{ fontSize: 10, color: "var(--ar-dim)" }}>{formatNewsDate(a.date)}</span>
                  </div>
                  <div className="ar-compact-title" style={{ whiteSpace: "normal", lineHeight: 1.35 }}>{a.title}</div>
                </div>
              </Link>
            ))}
          </ArenaPanel>
        </div>

        <aside>
          <div className="ar-sidebar-widget">
            <ArenaPanel title="Trending" compact>
              {trending.map((a) => (
                <Link key={a.slug} href={`/news/${a.slug}`} className="ar-compact-row">
                  <div className="ar-compact-main">
                    <div className="ar-compact-title" style={{ whiteSpace: "normal", fontSize: 12, lineHeight: 1.35 }}>{a.title}</div>
                  </div>
                </Link>
              ))}
            </ArenaPanel>
          </div>

          <div className="ar-sidebar-widget">
            <ArenaPanel title="Categorías" compact>
              {categories.map((cat) => {
                const count = sorted.filter((a) => a.category === cat).length;
                return (
                  <div key={cat} className="ar-compact-row" style={{ cursor: "default" }}>
                    <div className="ar-compact-main">
                      <div className="ar-compact-title">{cat}</div>
                    </div>
                    <span className="ar-compact-stat" style={{ color: "var(--ar-dim)", fontSize: 12 }}>{count}</span>
                  </div>
                );
              })}
            </ArenaPanel>
          </div>

          <div className="ar-sidebar-widget">
            <ArenaPanel title="Torneos relacionados" href="/tournaments" linkLabel="Ver" compact>
              {tournaments.map((t) => (
                <Link key={t.slug} href="/tournaments" className="ar-compact-row">
                  <div className="ar-compact-main">
                    <div className="ar-compact-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                    <div className="ar-compact-sub">{t.region} · {t.prizePool}</div>
                  </div>
                  <ArenaBadge variant={t.status === "live" ? "red" : "dim"}>{t.status}</ArenaBadge>
                </Link>
              ))}
            </ArenaPanel>
          </div>
        </aside>
      </div>
    </>
  );
}

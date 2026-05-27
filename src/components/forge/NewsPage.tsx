import Link from "next/link";
import { Block, Chip } from "./ui";
import { news, getFeaturedTournaments } from "@/lib/data";
import { formatNewsDate } from "@/lib/news-ui";

export function ForgeNews() {
  const sorted = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [featured, ...rest] = sorted;
  const categories = [...new Set(sorted.map((a) => a.category))];
  const tournaments = getFeaturedTournaments(3);

  return (
    <>
      <h1 className="fg-h1">Noticias</h1>
      <p className="fg-lead">Cobertura del competitivo, transfers y contexto fantasy.</p>

      {featured && (
        <Link href={`/news/${featured.slug}`} className="fg-news-feature">
          <Chip variant="blue">{featured.category}</Chip>
          <span style={{ fontSize: 11, color: "var(--fg-dim)", marginLeft: 8 }}>{formatNewsDate(featured.date)}</span>
          <h2>{featured.title}</h2>
          <p style={{ color: "var(--fg-muted)", margin: 0, lineHeight: 1.55, fontSize: 14 }}>{featured.excerpt}</p>
        </Link>
      )}

      <div className="fg-news-layout">
        <Block title="Recientes">
          {rest.map((a) => (
            <Link key={a.slug} href={`/news/${a.slug}`} className="fg-row">
              <div className="fg-row-main">
                <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <Chip>{a.category}</Chip>
                  <span style={{ fontSize: 10, color: "var(--fg-dim)" }}>{formatNewsDate(a.date)}</span>
                </div>
                <div className="fg-row-title" style={{ whiteSpace: "normal", lineHeight: 1.35 }}>{a.title}</div>
              </div>
            </Link>
          ))}
        </Block>

        <aside style={{ display: "flex", flexDirection: "column", gap: "var(--fg-gap-lg)" }}>
          <Block title="Categorías">
            {categories.map((cat) => (
              <div key={cat} className="fg-row" style={{ cursor: "default" }}>
                <div className="fg-row-main">
                  <div className="fg-row-title">{cat}</div>
                </div>
                <span className="fg-row-stat" style={{ color: "var(--fg-dim)", fontSize: 12 }}>
                  {sorted.filter((a) => a.category === cat).length}
                </span>
              </div>
            ))}
          </Block>
          <Block title="Torneos en curso">
            {tournaments.map((t) => (
              <div key={t.slug} className="fg-row" style={{ cursor: "default" }}>
                <div className="fg-row-main">
                  <div className="fg-row-title">{t.shortName.replace(/<!--[\s\S]*?-->/g, "").trim()}</div>
                  <div className="fg-row-sub">{t.region}</div>
                </div>
                <Chip variant={t.status === "live" ? "live" : "blue"}>{t.status}</Chip>
              </div>
            ))}
          </Block>
        </aside>
      </div>
    </>
  );
}

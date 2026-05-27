import Link from "next/link";
import { PulseCard } from "./PulseUI";
import { news } from "@/lib/data";
import { formatNewsDate } from "@/lib/news-ui";

export function PulseNews() {
  const sorted = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [featured, ...rest] = sorted;

  return (
    <>
      <header className="pl-hero">
        <h1 className="pl-page-title">Noticias</h1>
        <p className="pl-page-sub">Cobertura BSC en español</p>
      </header>

      {featured && (
        <Link href={`/news/${featured.slug}`} className="pl-card" style={{ display: "block", padding: 28, marginBottom: 20, textDecoration: "none", color: "inherit" }}>
          <div className="pl-news-cat">{featured.category}</div>
          <h2 style={{ fontFamily: "var(--pl-display)", fontSize: "1.5rem", fontWeight: 700, margin: "10px 0" }}>{featured.title}</h2>
          <p className="pl-muted" style={{ margin: 0, lineHeight: 1.55 }}>{featured.excerpt}</p>
        </Link>
      )}

      <PulseCard title="Recientes">
        {rest.map((a) => (
          <Link key={a.slug} href={`/news/${a.slug}`} className="pl-news">
            <div className="pl-news-cat">{a.category}</div>
            <div className="pl-news-title">{a.title}</div>
            <div className="pl-news-date">{formatNewsDate(a.date)}</div>
          </Link>
        ))}
      </PulseCard>
    </>
  );
}

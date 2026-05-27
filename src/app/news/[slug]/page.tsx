import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsCover } from "@/components/news/NewsCover";
import { getNews, teamName } from "@/lib/data";
import { formatNewsDate } from "@/lib/news-ui";
import { TeamLogo } from "@/components/ui/TeamLogo";

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getNews(slug);
  if (!article) notFound();

  return (
    <article className="pl-article">
      <NewsCover article={article} size="large" />
      <div className="pl-article-hd">
        <span className="pl-news-cat">{article.category}</span>
        <h1 className="pl-article-title">{article.title}</h1>
        <p className="pl-dim">{article.author} · {formatNewsDate(article.date)} · {article.readMinutes} min</p>
      </div>
      <div className="pl-article-body">
        {article.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {article.relatedTeams && article.relatedTeams.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 className="pl-card-title" style={{ marginBottom: 12 }}>Equipos</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {article.relatedTeams.map((ts) => (
              <Link key={ts} href={`/teams/${ts}`} className="pl-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
                <TeamLogo slug={ts} name={teamName(ts)} size={24} />
                {teamName(ts)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

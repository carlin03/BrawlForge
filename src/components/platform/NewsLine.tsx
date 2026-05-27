import Link from "next/link";
import type { NewsArticle } from "@/lib/data/news";
import { NewsCover } from "@/components/news/NewsCover";

interface NewsLineProps {
  article: NewsArticle;
}

export function NewsLine({ article }: NewsLineProps) {
  return (
    <Link href={`/news/${article.slug}`} className="es-news-line">
      <div className="es-news-thumb">
        <NewsCover article={article} size="card" />
      </div>
      <div>
        <div className="es-news-title">{article.title}</div>
        <div className="es-news-meta">
          {new Date(article.date).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })}
          {article.category && ` · ${article.category}`}
        </div>
      </div>
    </Link>
  );
}

import type { NewsArticle } from "@/lib/data/news";
import { getAllNews } from "@/lib/data/news";

export type NewsCatalogRow = {
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string[] | unknown;
  category?: string | null;
  published_at?: string | null;
  author?: string | null;
  read_minutes?: number | null;
  cover_accent?: string | null;
  related_teams?: string[] | null;
  related_tournament?: string | null;
  hot?: boolean | null;
};

const NEWS_CATEGORIES = new Set<NewsArticle["category"]>([
  "Resultados",
  "Torneos",
  "Fichajes",
  "Fantasy",
  "Esports",
]);

function normalizeCategory(raw: string | null | undefined): NewsArticle["category"] {
  const c = String(raw ?? "Esports").trim();
  if (NEWS_CATEGORIES.has(c as NewsArticle["category"])) return c as NewsArticle["category"];
  return "Esports";
}

function normalizeCoverAccent(raw: string | null | undefined): NewsArticle["coverAccent"] {
  const a = String(raw ?? "gold").toLowerCase();
  if (a === "red" || a === "yellow" || a === "blue" || a === "gold") return a;
  if (a === "green") return "blue";
  return "gold";
}

function normalizeBody(body: NewsCatalogRow["body"]): string[] {
  if (Array.isArray(body)) return body.map((p) => String(p)).filter(Boolean);
  if (typeof body === "string") return body.split("\n").map((s) => s.trim()).filter(Boolean);
  return [];
}

export function catalogRowToNewsArticle(row: NewsCatalogRow): NewsArticle {
  const date =
    row.published_at?.slice(0, 10) ??
    new Date().toISOString().slice(0, 10);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: String(row.excerpt ?? ""),
    body: normalizeBody(row.body),
    category: normalizeCategory(row.category),
    date,
    author: String(row.author ?? "BrawlForge"),
    readMinutes: Number(row.read_minutes ?? 3),
    coverAccent: normalizeCoverAccent(row.cover_accent),
    relatedTeams: row.related_teams?.length ? row.related_teams : undefined,
    relatedTournament: row.related_tournament ?? undefined,
    hot: Boolean(row.hot),
  };
}

/** Supabase gana sobre artículos estáticos con el mismo slug. */
export function mergeNewsArticles(
  staticArticles: NewsArticle[],
  dbArticles: NewsArticle[],
): NewsArticle[] {
  const bySlug = new Map<string, NewsArticle>();
  for (const a of staticArticles) bySlug.set(a.slug, a);
  for (const a of dbArticles) bySlug.set(a.slug, a);
  return [...bySlug.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getStaticNewsArticles(): NewsArticle[] {
  return getAllNews();
}

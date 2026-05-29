import type { NewsArticle } from "@/lib/data/news";
import { createClient } from "@/lib/supabase/server";
import {
  catalogRowToNewsArticle,
  getStaticNewsArticles,
  mergeNewsArticles,
  type NewsCatalogRow,
} from "@/lib/news-merge";

export async function loadMergedNews(): Promise<NewsArticle[]> {
  const staticArticles = getStaticNewsArticles();
  const supabase = await createClient();
  if (!supabase) return staticArticles;

  const { data, error } = await supabase
    .from("news_catalog")
    .select("*")
    .order("published_at", { ascending: false });

  if (error?.code === "42P01" || error) return staticArticles;

  const dbArticles = (data ?? []).map((row) =>
    catalogRowToNewsArticle(row as NewsCatalogRow),
  );
  return mergeNewsArticles(staticArticles, dbArticles);
}

export async function getMergedNews(slug: string): Promise<NewsArticle | undefined> {
  const all = await loadMergedNews();
  return all.find((n) => n.slug === slug);
}

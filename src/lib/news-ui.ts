import type { NewsArticle } from "@/lib/data/news";

const CATEGORY_BADGE: Record<NewsArticle["category"], string> = {
  Resultados: "bf-badge-red",
  Torneos: "bf-badge-yellow",
  Fantasy: "bf-badge-blue",
  Fichajes: "bf-badge-red",
  Esports: "bf-badge-blue",
};

const CATEGORY_ACCENT: Record<NewsArticle["category"], string> = {
  Resultados: "nw-cover-red",
  Torneos: "nw-cover-yellow",
  Fantasy: "nw-cover-blue",
  Fichajes: "nw-cover-red",
  Esports: "nw-cover-blue",
};

const COVER_GRADIENT: Record<NewsArticle["coverAccent"], string> = {
  red: "linear-gradient(135deg, #FF1A2E 0%, #070B14 70%)",
  yellow: "linear-gradient(135deg, #FDCB2D 0%, #070B14 70%)",
  blue: "linear-gradient(135deg, #3B82F6 0%, #070B14 70%)",
  gold: "linear-gradient(135deg, #FDCB2D 0%, #FF1A2E 50%, #070B14 100%)",
};

export function newsCategoryBadge(category: NewsArticle["category"]): string {
  return CATEGORY_BADGE[category] ?? "bf-badge-blue";
}

export function newsCategoryAccent(category: NewsArticle["category"]): string {
  return CATEGORY_ACCENT[category] ?? "nw-cover-blue";
}

export function newsCoverGradient(accent: NewsArticle["coverAccent"]): string {
  return COVER_GRADIENT[accent] ?? COVER_GRADIENT.blue;
}

export function formatNewsDate(date: string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

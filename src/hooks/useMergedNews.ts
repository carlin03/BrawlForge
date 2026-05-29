"use client";

import { useMemo } from "react";
import { useNewsArticles } from "@/contexts/NewsContext";
import type { NewsArticle } from "@/lib/data/news";

export function useLatestNewsMerged(limit = 24): NewsArticle[] {
  const articles = useNewsArticles();
  return useMemo(
    () => [...articles].slice(0, limit),
    [articles, limit],
  );
}

export function useNewsMerged(slug: string): NewsArticle | undefined {
  const articles = useNewsArticles();
  return useMemo(() => articles.find((a) => a.slug === slug), [articles, slug]);
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NewsArticle } from "@/lib/data/news";
import { getLatestNews } from "@/lib/data/news";

type NewsState = {
  ready: boolean;
  fromDb: boolean;
  articles: NewsArticle[];
  refresh: () => Promise<void>;
};

const NewsContext = createContext<NewsState>({
  ready: false,
  fromDb: false,
  articles: [],
  refresh: async () => {},
});

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<NewsArticle[]>(() => getLatestNews(64));
  const [ready, setReady] = useState(true);
  const [fromDb, setFromDb] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.articles)) {
        setArticles(data.articles);
        setFromDb(true);
      }
    } catch {
      /* mantener estáticas */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const run = () => void refresh();
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 2000);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const value = useMemo(
    () => ({ ready, fromDb, articles, refresh }),
    [ready, fromDb, articles, refresh],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNewsArticles(): NewsArticle[] {
  return useContext(NewsContext).articles;
}

export function useNewsReady(): boolean {
  return useContext(NewsContext).ready;
}

export function useNewsArticle(slug: string): NewsArticle | undefined {
  const { articles } = useContext(NewsContext);
  return useMemo(() => articles.find((a) => a.slug === slug), [articles, slug]);
}

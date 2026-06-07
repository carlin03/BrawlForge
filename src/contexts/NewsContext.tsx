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
import { getPrefetched, prefetchJson } from "@/lib/prefetch-cache";

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
      const data =
        getPrefetched<{ ok?: boolean; articles?: NewsArticle[] }>("/api/news") ??
        ((await prefetchJson("/api/news")) as { ok?: boolean; articles?: NewsArticle[] });
      if (data?.ok && Array.isArray(data.articles)) {
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
    void refresh();
    const onResume = () => void refresh();
    window.addEventListener("bf-resume-background-load", onResume);
    return () => window.removeEventListener("bf-resume-background-load", onResume);
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

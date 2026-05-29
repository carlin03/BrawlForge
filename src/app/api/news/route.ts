import { NextResponse } from "next/server";
import { getMergedNews, loadMergedNews } from "@/lib/news-loader";

export const dynamic = "force-dynamic";

/** Noticias públicas: JSON local + news_catalog (misma fuente en localhost y Vercel). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();

  if (slug) {
    const article = await getMergedNews(slug);
    if (!article) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, article });
  }

  const articles = await loadMergedNews();
  return NextResponse.json({ ok: true, articles });
}

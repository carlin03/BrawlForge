"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ExternalLink,
  Globe,
  MessageCircle,
  Share2,
  Trophy,
  Video,
} from "lucide-react";
import type { CareerHighlight, WikiAchievement, WikiSection } from "@/lib/data/profile-wiki";

export type InfoboxRow = { label: string; value: ReactNode; highlight?: boolean };

const SOCIAL_META: Record<
  string,
  { label: string; icon: typeof Globe; short: string }
> = {
  twitter: { label: "X / Twitter", icon: MessageCircle, short: "X" },
  youtube: { label: "YouTube", icon: Video, short: "YT" },
  discord: { label: "Discord", icon: MessageCircle, short: "DC" },
  twitch: { label: "Twitch", icon: Video, short: "TW" },
  instagram: { label: "Instagram", icon: Share2, short: "IG" },
  tiktok: { label: "TikTok", icon: Globe, short: "TT" },
  website: { label: "Web", icon: Globe, short: "WEB" },
};

function slugifyTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProfileCinematicBanner({ url, accent }: { url?: string; accent?: string }) {
  if (!url?.trim()) {
    return (
      <div
        className="bf-ep-banner bf-ep-banner--fallback"
        style={accent ? { ["--ep-accent" as string]: accent } : undefined}
        aria-hidden
      />
    );
  }
  return (
    <div className="bf-ep-banner">
      <img src={url.trim()} alt="" className="bf-ep-banner-img" />
      <div className="bf-ep-banner-overlay" aria-hidden />
    </div>
  );
}

export function ProfileInfobox({
  title,
  subtitle,
  rows,
  footer,
}: {
  title: string;
  subtitle?: string;
  rows: InfoboxRow[];
  footer?: ReactNode;
}) {
  const visible = rows.filter((r) => r.value != null && r.value !== "" && r.value !== "—");
  if (!visible.length && !footer) return null;
  return (
    <aside className="bf-ep-infobox">
      <header className="bf-ep-infobox-head">
        <span className="bf-ep-infobox-kicker">Ficha</span>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <dl className="bf-ep-infobox-rows">
        {visible.map((row) => (
          <div key={row.label} className={row.highlight ? "is-highlight" : undefined}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="bf-ep-infobox-foot">{footer}</div>}
    </aside>
  );
}

export function ProfileLead({ children }: { children: ReactNode }) {
  return <p className="bf-ep-lead">{children}</p>;
}

export function ProfileArticleShell({
  toc,
  main,
  aside,
}: {
  toc?: ReactNode;
  main: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="bf-ep-article">
      {toc}
      <div className="bf-ep-article-grid">
        <div className="bf-ep-article-main">{main}</div>
        {aside && <div className="bf-ep-article-aside">{aside}</div>}
      </div>
    </div>
  );
}

export function ProfileTableOfContents({ sections }: { sections: WikiSection[] }) {
  const items = sections.filter((s) => s.title.trim());
  if (items.length < 2) return null;
  return (
    <nav className="bf-ep-toc" aria-label="Índice del artículo">
      <span className="bf-ep-toc-label">
        <BookOpen size={14} /> En esta ficha
      </span>
      <ol>
        {items.map((s) => (
          <li key={s.id}>
            <a href={`#wiki-${slugifyTitle(s.title)}`}>{s.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ProfileWikiArticle({ sections }: { sections: WikiSection[] }) {
  if (!sections?.length) return null;
  return (
    <article className="bf-ep-wiki-article">
      {sections.map((sec) => {
        const id = `wiki-${slugifyTitle(sec.title)}`;
        const paragraphs = sec.paragraphs.filter((p) => p.trim());
        if (!paragraphs.length) return null;
        return (
          <section key={sec.id} id={id} className="bf-ep-wiki-section">
            <h2>{sec.title}</h2>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        );
      })}
    </article>
  );
}

export function ProfileFactsGrid({ facts, title = "Datos clave" }: { facts: string[]; title?: string }) {
  if (!facts?.length) return null;
  return (
    <section className="bf-ep-facts">
      <h3>{title}</h3>
      <div className="bf-ep-facts-grid">
        {facts.map((f, i) => (
          <div key={i} className="bf-ep-fact-card">
            <span className="bf-ep-fact-num">{String(i + 1).padStart(2, "0")}</span>
            <p>{f}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProfileRivalsStrip({ rivals }: { rivals: string[] }) {
  if (!rivals?.length) return null;
  return (
    <section className="bf-ep-rivals">
      <h3>Rivales históricos</h3>
      <div className="bf-ep-rivals-row">
        {rivals.map((r) => (
          <span key={r} className="bf-ep-rival-chip">
            {r}
          </span>
        ))}
      </div>
    </section>
  );
}

function achievementTier(place: string): "gold" | "silver" | "bronze" | "default" {
  const p = place.toLowerCase();
  if (p.includes("1") || p.includes("campe") || p.includes("winner") || p.includes("gold")) return "gold";
  if (p.includes("2") || p.includes("sub") || p.includes("silver")) return "silver";
  if (p.includes("3") || p.includes("bronce") || p.includes("bronze")) return "bronze";
  return "default";
}

export function ProfileAchievementsShowcase({
  achievements,
  compact,
}: {
  achievements: WikiAchievement[];
  compact?: boolean;
}) {
  if (!achievements?.length) return null;
  return (
    <div className={`bf-ep-achievements ${compact ? "is-compact" : ""}`}>
      {achievements.map((a, i) => (
        <div key={i} className={`bf-ep-ach-card tier-${achievementTier(a.place)}`}>
          <span className="bf-ep-ach-medal" aria-hidden>
            <Trophy size={compact ? 18 : 22} />
          </span>
          <div className="bf-ep-ach-body">
            <span className="bf-ep-ach-place">{a.place || "—"}</span>
            <strong>{a.tournament}</strong>
            <span>
              {a.prize}
              {a.date ? ` · ${a.date}` : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSocialHub({ social, liquipediaUrl }: { social: Record<string, string>; liquipediaUrl?: string | null }) {
  const entries = Object.entries(social).filter(([, v]) => v?.trim());
  if (!entries.length && !liquipediaUrl) return null;
  return (
    <section className="bf-ep-social-hub">
      <h3>Enlaces</h3>
      <div className="bf-ep-social-grid">
        {entries.map(([key, href]) => {
          const meta = SOCIAL_META[key] ?? { label: key, icon: Globe, short: key.slice(0, 2).toUpperCase() };
          const Icon = meta.icon;
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="bf-ep-social-btn"
              title={meta.label}
            >
              <Icon size={18} />
              <span>{meta.label}</span>
            </a>
          );
        })}
        {liquipediaUrl?.trim() && (
          <a
            href={liquipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bf-ep-social-btn is-liquipedia"
          >
            <ExternalLink size={18} />
            <span>Liquipedia</span>
          </a>
        )}
      </div>
    </section>
  );
}

export function ProfileBrawlerPool({ brawlers }: { brawlers: string[] }) {
  if (!brawlers?.length) return null;
  return (
    <section className="bf-ep-brawlers">
      <h3>Pool competitivo</h3>
      <div className="bf-ep-brawler-pills">
        {brawlers.map((b, i) => (
          <span key={b} className={i === 0 ? "is-main" : undefined}>
            {b}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ProfilePlaystyleCard({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <section className="bf-ep-playstyle">
      <h3>Estilo de juego</h3>
      <p>{text}</p>
    </section>
  );
}

export function ProfileCareerTimeline({ items }: { items: CareerHighlight[] }) {
  if (!items?.length) return null;
  return (
    <section className="bf-ep-career">
      <h3>Trayectoria</h3>
      <div className="bf-ep-career-track">
        {items.map((h, i) => (
          <div key={i} className="bf-ep-career-node">
            <span className="bf-ep-career-year">{h.year || "—"}</span>
            <div className="bf-ep-career-dot" aria-hidden />
            <div className="bf-ep-career-content">
              <strong>{h.title}</strong>
              {h.detail && <p>{h.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProfileGallery({ urls, title = "Galería" }: { urls: string[]; title?: string }) {
  const list = (urls ?? []).filter((u) => u?.trim());
  const [active, setActive] = useState(0);
  const safeActive = list.length ? Math.min(active, list.length - 1) : 0;

  if (!list.length) return null;

  return (
    <section className="bf-ep-gallery">
      <h3>{title}</h3>
      <div className="bf-ep-gallery-hero">
        <img src={list[safeActive]} alt="" />
      </div>
      {list.length > 1 && (
        <div className="bf-ep-gallery-thumbs">
          {list.map((url, i) => (
            <button
              key={i}
              type="button"
              className={i === safeActive ? "is-on" : undefined}
              onClick={() => setActive(i)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function ProfileHistoryTab({
  sections,
  facts,
  rivals,
  galleryUrls,
  achievements,
  career,
  social,
  liquipediaUrl,
  playstyle,
  brawlers,
  emptyHint,
}: {
  sections: WikiSection[];
  facts: string[];
  rivals?: string[];
  galleryUrls: string[];
  achievements?: WikiAchievement[];
  career?: CareerHighlight[];
  social: Record<string, string>;
  liquipediaUrl?: string | null;
  playstyle?: string;
  brawlers?: string[];
  emptyHint: string;
}) {
  const hasContent =
    sections.length > 0 ||
    facts.length > 0 ||
    (rivals?.length ?? 0) > 0 ||
    galleryUrls.length > 0 ||
    (achievements?.length ?? 0) > 0 ||
    (career?.length ?? 0) > 0 ||
    playstyle?.trim() ||
    (brawlers?.length ?? 0) > 0 ||
    Object.keys(social).length > 0 ||
    liquipediaUrl;

  const aside = (
    <>
      <ProfileSocialHub social={social} liquipediaUrl={liquipediaUrl} />
      <ProfileBrawlerPool brawlers={brawlers ?? []} />
      <ProfilePlaystyleCard text={playstyle ?? ""} />
      {achievements && achievements.length > 0 && (
        <section className="bf-ep-side-block">
          <h3>Palmarés destacado</h3>
          <ProfileAchievementsShowcase achievements={achievements.slice(0, 4)} compact />
        </section>
      )}
    </>
  );

  if (!hasContent) {
    return (
      <div className="bf-ep-empty-history">
        <BookOpen size={32} />
        <p>{emptyHint}</p>
      </div>
    );
  }

  return (
    <ProfileArticleShell
      toc={<ProfileTableOfContents sections={sections} />}
      main={
        <>
          <ProfileWikiArticle sections={sections} />
          <ProfileCareerTimeline items={career ?? []} />
          <ProfileFactsGrid facts={facts} />
          <ProfileRivalsStrip rivals={rivals ?? []} />
          <ProfileGallery urls={galleryUrls} />
          {achievements && achievements.length > 4 && (
            <section className="bf-ep-side-block">
              <h3>Palmarés completo</h3>
              <ProfileAchievementsShowcase achievements={achievements} />
            </section>
          )}
        </>
      }
      aside={aside}
    />
  );
}

export function ProfileSectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="bf-ep-section-head">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

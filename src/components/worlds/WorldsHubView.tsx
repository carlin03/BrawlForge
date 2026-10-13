"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Swords, Sparkles, Target, MapPin, Landmark } from "lucide-react";
import { WorldsQuiz } from "@/components/worlds/WorldsQuiz";
import { useWorldsMode } from "@/contexts/WorldsModeContext";
import { BSC_TOURNAMENT_PARTICIPANTS } from "@/lib/data/bsc-tournament-participants";
import { getTeamDisplayName } from "@/lib/data/team-display-resolve";

const ROADMAP = [
  {
    when: "Ahora",
    title: "Monthly Finals",
    detail: "Clasificación regional hacia el Mundial",
    href: "/tournaments/bsc-2026-june-emea-mf",
  },
  {
    when: "Verano",
    title: "LCQ + Challengers",
    detail: "Últimas plazas para Tokio",
    href: "/tournaments",
  },
  {
    when: "Tokio",
    title: "World Finals 2026",
    detail: "Japón · el campeón del mundo",
    href: "/tournaments/world-finals-2026",
  },
] as const;

const QUICK = [
  { href: "/predictions", label: "Predicciones", icon: Target, hint: "Vota los cruces" },
  { href: "/fantasy", label: "Fantasy", icon: Sparkles, hint: "Tu plantilla" },
  { href: "/matches", label: "Partidos", icon: Swords, hint: "Calendario vivo" },
  { href: "/tournaments/world-finals-2026", label: "Ficha Mundial", icon: Trophy, hint: "Tokio 2026" },
] as const;

export function WorldsHubView() {
  const { setExperience, ready } = useWorldsMode();
  const contenders = BSC_TOURNAMENT_PARTICIPANTS["world-finals-2026"] ?? [];

  useEffect(() => {
    if (ready) setExperience("worlds");
    document.documentElement.dataset.bfExperience = "worlds";
    document.documentElement.dataset.wfTheme = "tokyo";
    return () => {
      delete document.documentElement.dataset.wfTheme;
    };
  }, [ready, setExperience]);

  return (
    <div className="wf-hub wf-hub-tokyo">
      <section className="wf-hero wf-hero-tokyo">
        <div className="wf-hero-shine" aria-hidden />
        <div className="wf-hero-tori" aria-hidden />
        <p className="wf-kicker">
          <MapPin size={14} aria-hidden /> World Finals 2026 · 東京 · Tokio, Japón
        </p>
        <h1 className="wf-hero-title">
          <span className="wf-jp">世界決勝</span>
          <span className="wf-hero-line">World Finals</span>
          <span className="wf-year">2026</span>
        </h1>
        <p className="wf-hero-lead">
          El Mundial de Brawl Stars aterriza en <strong>Japón</strong>. Experiencia premium: camino a Tokio,
          equipos aspirantes, predicciones y trivia — sin tocar el admin ni el Classic.
        </p>
        <div className="wf-venue">
          <Landmark size={16} aria-hidden />
          <div>
            <strong>Tokyo, Japan</strong>
            <span>World Championship · sede prevista Japón</span>
          </div>
        </div>
        <div className="wf-hero-cta">
          <Link href="/predictions" className="wf-btn wf-btn-gold">
            Predice el Mundial
          </Link>
          <Link href="/tournaments/world-finals-2026" className="wf-btn wf-btn-ink">
            Ver World Finals
          </Link>
          <button type="button" className="wf-btn wf-btn-ghost" onClick={() => setExperience("classic")}>
            Classic
          </button>
        </div>
      </section>

      <section className="wf-section" aria-labelledby="wf-road-title">
        <div className="wf-section-head">
          <Calendar size={18} aria-hidden />
          <h2 id="wf-road-title">Camino a Tokio</h2>
        </div>
        <ol className="wf-roadmap">
          {ROADMAP.map((step, i) => (
            <li key={step.title} style={{ animationDelay: `${0.08 * (i + 1)}s` }}>
              <Link href={step.href} className="wf-road-card">
                <span className="wf-road-when">{step.when}</span>
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="wf-section" aria-labelledby="wf-quick-title">
        <div className="wf-section-head">
          <Swords size={18} aria-hidden />
          <h2 id="wf-quick-title">Atajos premium</h2>
        </div>
        <div className="wf-quick-grid">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.href} href={q.href} className="wf-quick-card">
                <Icon size={18} aria-hidden />
                <strong>{q.label}</strong>
                <span>{q.hint}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="wf-section" aria-labelledby="wf-field-title">
        <div className="wf-section-head">
          <Trophy size={18} aria-hidden />
          <h2 id="wf-field-title">Campo aspirante · Tokio</h2>
        </div>
        <p className="wf-muted">
          Lista provisional de World Finals. Se actualizará con clasificados reales del circuito BSC.
        </p>
        <ul className="wf-field">
          {contenders.map((slug) => (
            <li key={slug}>
              <Link href={`/teams/${slug}`}>{getTeamDisplayName(slug)}</Link>
            </li>
          ))}
        </ul>
      </section>

      <WorldsQuiz />

      <p className="wf-foot">
        東京 World Finals 2026 · BrawlForge Worlds. Classic y admin siguen disponibles cuando quieras.
      </p>
    </div>
  );
}

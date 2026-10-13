"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Swords, Sparkles, Target } from "lucide-react";
import { WorldsQuiz } from "@/components/worlds/WorldsQuiz";
import { useWorldsMode } from "@/contexts/WorldsModeContext";
import { BSC_TOURNAMENT_PARTICIPANTS } from "@/lib/data/bsc-tournament-participants";
import { getTeamDisplayName } from "@/lib/data/team-display-resolve";

const ROADMAP = [
  { when: "Ahora", title: "Monthly Finals junio", detail: "EMEA en curso · EA ya jugado · NA/SA próximos", href: "/tournaments/bsc-2026-june-emea-mf" },
  { when: "Jul–Ago", title: "Cierre de temporada", detail: "Últimos MF + Challengers / LCQ", href: "/tournaments" },
  { when: "Mundial", title: "World Finals 2026", detail: "El evento cumbre — hub, predicciones y trivia", href: "/tournaments/world-finals-2026" },
] as const;

const QUICK = [
  { href: "/predictions", label: "Predicciones", icon: Target, hint: "Vota partidos vivos" },
  { href: "/fantasy", label: "Fantasy", icon: Sparkles, hint: "Plantilla del circuito" },
  { href: "/matches", label: "Partidos", icon: Swords, hint: "Calendario completo" },
  { href: "/tournaments/world-finals-2026", label: "Ficha WF", icon: Trophy, hint: "Detalle del Mundial" },
] as const;

export function WorldsHubView() {
  const { setExperience, ready } = useWorldsMode();
  const contenders = BSC_TOURNAMENT_PARTICIPANTS["world-finals-2026"] ?? [];

  useEffect(() => {
    if (ready) setExperience("worlds");
  }, [ready, setExperience]);

  return (
    <div className="wf-hub">
      <section className="wf-hero">
        <div className="wf-hero-glow" aria-hidden />
        <p className="wf-kicker">
          <Trophy size={14} aria-hidden /> BrawlForge · Experiencia Worlds
        </p>
        <h1 className="wf-hero-title">
          World Finals <span>2026</span>
        </h1>
        <p className="wf-hero-lead">
          El modo especial del Mundial: camino al título, equipos aspirantes, predicciones y un trivia para calentar.
          El sitio Classic y el admin siguen intactos — solo cambias de experiencia.
        </p>
        <div className="wf-hero-cta">
          <Link href="/predictions" className="wf-btn wf-btn-gold">
            Predice el circuito
          </Link>
          <Link href="/tournaments/world-finals-2026" className="wf-btn wf-btn-ghost">
            Ver ficha World Finals
          </Link>
          <button type="button" className="wf-btn wf-btn-ghost" onClick={() => setExperience("classic")}>
            Volver a Classic
          </button>
        </div>
      </section>

      <section className="wf-section" aria-labelledby="wf-road-title">
        <div className="wf-section-head">
          <Calendar size={18} aria-hidden />
          <h2 id="wf-road-title">Camino al Mundial</h2>
        </div>
        <ol className="wf-roadmap">
          {ROADMAP.map((step) => (
            <li key={step.title}>
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
          <h2 id="wf-quick-title">Atajos Worlds</h2>
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
          <h2 id="wf-field-title">Campo aspirante (provisional)</h2>
        </div>
        <p className="wf-muted">
          Lista de referencia World Finals — se actualizará con clasificados reales del circuito.
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
        Admin, Fantasy, logos y todo el CMS siguen disponibles. Este hub es una capa Worlds encima del BrawlForge
        de siempre.
      </p>
    </div>
  );
}

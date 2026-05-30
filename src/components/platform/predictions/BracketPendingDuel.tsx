"use client";

import { Hourglass, Trophy } from "lucide-react";

/** Card premium cuando el cruce aún no está definido (bracket progresivo). */
export function BracketPendingDuel({
  title = "Pendiente de clasificación",
  subtitle = "Por determinar — vota las rondas anteriores para desbloquear el cruce.",
  featured = false,
}: {
  title?: string;
  subtitle?: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`bf-bracket-pending-duel ${featured ? "is-featured" : ""}`}
      aria-label={title}
    >
      <div className="bf-bracket-pending-glow" aria-hidden />
      <div className="bf-bracket-pending-inner">
        <span className="bf-bracket-pending-icon" aria-hidden>
          <Trophy size={featured ? 36 : 28} />
        </span>
        <h3 className="bf-bracket-pending-title">{title}</h3>
        <p className="bf-bracket-pending-sub">{subtitle}</p>
        <span className="bf-bracket-pending-badge">
          <Hourglass size={12} aria-hidden /> Por determinar
        </span>
      </div>
    </article>
  );
}

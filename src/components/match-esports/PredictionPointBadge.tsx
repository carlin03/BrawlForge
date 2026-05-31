"use client";

/** Chip dorado de puntos (+N), mismo estilo que la barra de predicciones. */
export function PredictionPointBadge({
  label,
  points,
  className,
}: {
  label?: string;
  points?: number;
  className?: string;
}) {
  if (points == null || points <= 0) return null;
  return (
    <span className={`bf-predict-points-chip is-inline ${className ?? ""}`.trim()}>
      {label ? <span className="bf-predict-points-label">{label}</span> : null}
      <span className="bf-predict-points-value">+{points}</span>
    </span>
  );
}

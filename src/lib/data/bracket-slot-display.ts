import { getTeamDisplayName } from "./team-display-resolve";

/** Slugs especiales en bracket (no son equipos reales). */
export function isBracketPlaceholderSlug(slug: string | null | undefined): boolean {
  if (!slug?.trim()) return true;
  const s = slug.trim().toLowerCase();
  if (s === "tbd" || s === "team" || s === "por-definir") return true;
  return s.startsWith("winner-");
}

/** Etiqueta legible para preview y /predictions. */
export function bracketSlotDisplayLabel(slug: string | null | undefined): string {
  if (!slug?.trim()) return "Pendiente de clasificación";
  const s = slug.trim().toLowerCase();
  if (s === "tbd" || s === "por-definir") return "Pendiente de clasificación";

  const qf = /^winner-qf-(\d+)$/.exec(s);
  if (qf) return `Ganador Cuartos ${Number(qf[1]) + 1}`;

  const sf = /^winner-sf-(\d+)$/.exec(s);
  if (sf) return `Ganador Semifinal ${Number(sf[1]) + 1}`;

  if (s === "winner-final-a" || s === "winner-sf-0") return "Ganador Semifinal 1";
  if (s === "winner-final-b" || s === "winner-sf-1") return "Ganador Semifinal 2";

  const match = /^winner-match-([a-z])$/i.exec(s);
  if (match) return `Ganador partido ${match[1].toUpperCase()}`;

  if (s.startsWith("winner-")) {
    return s
      .replace(/^winner-/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return getTeamDisplayName(slug);
}

export type BracketRoundKind = "quarter" | "semi" | "final" | "third";

export function bracketRefOptions(round: BracketRoundKind): { id: string; label: string }[] {
  const base = [{ id: "", label: "Pendiente / TBD" }];
  if (round === "quarter") {
    return [...base, { id: "__team__", label: "— Equipo fijo —" }];
  }
  if (round === "semi") {
    return [
      ...base,
      { id: "winner-qf-0", label: "Ganador Cuartos 1" },
      { id: "winner-qf-1", label: "Ganador Cuartos 2" },
      { id: "winner-qf-2", label: "Ganador Cuartos 3" },
      { id: "winner-qf-3", label: "Ganador Cuartos 4" },
      { id: "__team__", label: "— Equipo fijo —" },
    ];
  }
  return [
    ...base,
    { id: "winner-sf-0", label: "Ganador Semifinal 1" },
    { id: "winner-sf-1", label: "Ganador Semifinal 2" },
    { id: "__team__", label: "— Equipo fijo —" },
  ];
}

export function isFixedTeamRef(slug: string): boolean {
  return Boolean(slug?.trim()) && !isBracketPlaceholderSlug(slug);
}

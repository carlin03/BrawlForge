/** Configuración de playoff guardada en site_settings (playoff_brackets). */

export type BracketLayoutMode = "auto" | "1" | "2";

/** Resuelve layout guardado en CMS a 1 o 2 columnas en la UI. */
export function resolveBracketLayout(layout: BracketLayoutMode, matchCount: number): "1" | "2" {
  if (layout === "1") return "1";
  if (layout === "2") return "2";
  return matchCount <= 1 ? "1" : "2";
}

export type BracketSlot = {
  team_a_slug: string;
  team_b_slug: string;
  match_id?: string;
  stage?: string;
};

export type PlayoffBracketConfig = {
  tournament_slug: string;
  layout: BracketLayoutMode;
  rounds: {
    quarters: boolean;
    semis: boolean;
    final: boolean;
    third_place: boolean;
  };
  slots: {
    quarters: BracketSlot[];
    semis: BracketSlot[];
    final: BracketSlot | null;
    third_place: BracketSlot | null;
  };
  format?: string;
  updated_at?: string;
};

export type PlayoffBracketsStore = Record<string, PlayoffBracketConfig>;

export function emptyBracketConfig(tournamentSlug: string): PlayoffBracketConfig {
  return {
    tournament_slug: tournamentSlug,
    layout: "auto",
    rounds: { quarters: true, semis: true, final: true, third_place: false },
    slots: {
      quarters: [
        { team_a_slug: "", team_b_slug: "" },
        { team_a_slug: "", team_b_slug: "" },
        { team_a_slug: "", team_b_slug: "" },
        { team_a_slug: "", team_b_slug: "" },
      ],
      semis: [
        { team_a_slug: "", team_b_slug: "" },
        { team_a_slug: "", team_b_slug: "" },
      ],
      final: { team_a_slug: "", team_b_slug: "" },
      third_place: null,
    },
    format: "Bo5",
  };
}

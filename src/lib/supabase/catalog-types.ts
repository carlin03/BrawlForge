export interface CatalogTeamRow {
  slug: string;
  name: string;
  tag: string;
  region: string;
  country: string;
  earnings: number;
  rank: number | null;
  rank_change: number;
  form: string[];
  liquipedia_page: string | null;
  logo_file: string | null;
  logo_url: string | null;
  roster_slugs: string[];
  achievements: unknown[];
  description: string | null;
  circuit_summary: string | null;
  coach: string | null;
  founded_year: number | null;
  social: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export interface CatalogPlayerRow {
  slug: string;
  ign: string;
  real_name: string | null;
  team_slug: string | null;
  region: string;
  role: string;
  status: string;
  liquipedia_page: string | null;
  liquipedia_url?: string | null;
  is_captain?: boolean;
  previous_teams?: string[];
  primary_brawler?: string | null;
  secondary_brawler?: string | null;
  fantasy_points: number;
  fantasy_ownership: number;
  rating: number;
  country: string | null;
  nationality?: string | null;
  join_date: string | null;
  bio: string | null;
  photo_url: string | null;
  social: Record<string, unknown>;
  meta: Record<string, unknown>;
}

export interface CatalogTournamentRow {
  slug: string;
  name: string;
  short_name: string | null;
  region: string;
  prize_pool: string | null;
  teams_count: number;
  status: string;
  participant_slugs: string[];
  meta: Record<string, unknown>;
}

export interface CatalogMarketRow {
  tournament_slug: string;
  player_slug: string;
  team_slug: string;
  price: number;
  price_change: number;
  pick_rate: number;
  form: string[];
  meta: Record<string, unknown>;
}

export interface CatalogSnapshot {
  teams: CatalogTeamRow[];
  players: CatalogPlayerRow[];
  tournaments: CatalogTournamentRow[];
  market: CatalogMarketRow[];
  syncedAt: string | null;
}

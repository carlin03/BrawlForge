/** Curated BSC top-tier overrides — merged over Liquipedia sync for fantasy accuracy. */
export const CURATED_TEAMS: Record<
  string,
  Partial<{
    earnings: number;
    rank: number;
    rankChange: number;
    form: ("W" | "L")[];
    roster: string[];
    achievements: { place: string; tournament: string; prize: string; date: string }[];
  }>
> = {
  "crazy-raccoon": {
    earnings: 874750,
    rank: 1,
    form: ["W", "W", "L", "W", "W"],
    roster: ["moya", "tensai", "milkreo"],
    achievements: [
      { place: "1st", tournament: "Brawl Stars World Finals 2025", prize: "$400,000", date: "2025-11-30" },
    ],
  },
  "sk-gaming": {
    earnings: 873081,
    rank: 2,
    form: ["W", "W", "L", "W", "W"],
    roster: ["yoshi", "ope", "joker"],
  },
  hmble: { earnings: 428000, rank: 3, form: ["W", "L", "W", "W", "L"], roster: ["lukii", "boss", "symantec"] },
  "tribe-gaming": { earnings: 274199, rank: 4, roster: ["lxffy", "rbm", "zeus"] },
  "fut-esports": { rank: 5, roster: ["nowy297", "meow", "guesti"] },
  "totem-esports": { rank: 6, roster: ["zhar", "ikaoss", "lenain"] },
  "revenant-xspark": { rank: 7, roster: ["response", "sergeant-clash", "prozy"] },
  loud: { rank: 8, roster: ["levi", "kaiodog", "prozy"] },
};

export const CURATED_PLAYERS: Record<
  string,
  Partial<{ fantasyPoints: number; fantasyOwnership: number; rating: number; realName: string; teamSlug: string }>
> = {
  moya: { fantasyPoints: 94, fantasyOwnership: 72, rating: 1.28 },
  yoshi: { fantasyPoints: 91, fantasyOwnership: 68, rating: 1.24, realName: "David Cayetano Gómez" },
  tensai: { fantasyPoints: 88, fantasyOwnership: 65, rating: 1.22 },
  lukii: { fantasyPoints: 86, fantasyOwnership: 58, rating: 1.2 },
  boss: { fantasyPoints: 84, fantasyOwnership: 52, rating: 1.17 },
  lxffy: { fantasyPoints: 85, fantasyOwnership: 61, rating: 1.19 },
  ope: { fantasyPoints: 82, fantasyOwnership: 54, rating: 1.18, realName: "Alexis Mangelle" },
  response: { fantasyPoints: 81, fantasyOwnership: 48, rating: 1.16 },
  symantec: { fantasyPoints: 80, fantasyOwnership: 47, rating: 1.13 },
  joker: { fantasyPoints: 79, fantasyOwnership: 38, rating: 1.15 },
  rbm: { fantasyPoints: 78, fantasyOwnership: 44, rating: 1.12 },
  engine: { fantasyPoints: 78, fantasyOwnership: 44, rating: 1.13 },
};

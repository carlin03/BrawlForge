export type FantasySquadSlotRow = {
  player_slug: string;
  is_captain: boolean;
  event_points: number;
};

export type FantasyEntryRow = {
  id: string;
  user_id: string;
  tournament_slug: string;
  team_name: string;
  total_points: number;
  transfers_used: number;
};

export type PredictionVoteRow = {
  match_id: string;
  pick: "A" | "B";
  reward_points: number;
  points_awarded: number;
};

export type VoteAggregate = {
  match_id: string;
  votes_a: number;
  votes_b: number;
  total_votes: number;
};

export type FantasyLeaderboardRow = {
  rank: number;
  user_id: string;
  team_name: string;
  total_points: number;
  display_name: string;
  ign: string;
};

export type UserGameState = {
  votes: Record<string, "A" | "B">;
  fantasy: Record<
    string,
    {
      entryId: string;
      teamName: string;
      totalPoints: number;
      transfersUsed: number;
      squad: { playerSlug: string; isCaptain: boolean; eventPoints: number }[];
    }
  >;
  predictPoints: number;
  predictStreak: number;
  predictCorrect: number;
  predictAttempts: number;
  fantasyPoints: number;
  fantasyRank: number | null;
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FantasySquadSlot } from "@/lib/data/fantasy";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import type { UserGameState, VoteAggregate } from "@/lib/supabase/game-types";
import { useAuth } from "@/contexts/AuthContext";

type GameContextValue = {
  ready: boolean;
  aggregates: Record<string, VoteAggregate>;
  game: UserGameState | null;
  refresh: () => Promise<void>;
  saveFantasy: (
    tournamentSlug: string,
    teamName: string,
    squad: FantasySquadSlot[],
  ) => Promise<{ error?: string }>;
  castVote: (matchId: string, pick: "A" | "B", rewardPoints: number) => Promise<{ error?: string }>;
  saveExactScore: (matchId: string, exactScore: string | null) => Promise<{ error?: string }>;
  saveMatchPicks: (matchId: string, picks: MatchExtendedPrediction) => Promise<{ error?: string }>;
};

const GameContext = createContext<GameContextValue | null>(null);

function aggregatesEqual(
  a: Record<string, VoteAggregate>,
  b: Record<string, VoteAggregate>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    const x = a[k];
    const y = b[k];
    if (!y) return false;
    if (x.votes_a !== y.votes_a || x.votes_b !== y.votes_b || x.total_votes !== y.total_votes) {
      return false;
    }
  }
  return true;
}

function gameStateEqual(a: UserGameState | null, b: UserGameState | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.predictPoints === b.predictPoints &&
    a.predictStreak === b.predictStreak &&
    a.predictCorrect === b.predictCorrect &&
    a.predictAttempts === b.predictAttempts &&
    a.fantasyPoints === b.fantasyPoints &&
    a.fantasyRank === b.fantasyRank &&
    JSON.stringify(a.votes) === JSON.stringify(b.votes) &&
    JSON.stringify(a.exactScores) === JSON.stringify(b.exactScores) &&
    JSON.stringify(a.matchPicks ?? {}) === JSON.stringify(b.matchPicks ?? {})
  );
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [aggregates, setAggregates] = useState<Record<string, VoteAggregate>>({});
  const [game, setGame] = useState<UserGameState | null>(null);
  const isLoggedInRef = useRef(isLoggedIn);
  isLoggedInRef.current = isLoggedIn;

  const loadAggregates = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions/aggregates");
      const json = await res.json();
      const next = json.aggregates ?? {};
      setAggregates((prev) => (aggregatesEqual(prev, next) ? prev : next));
    } catch {
      setAggregates((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadAggregates();
    if (!isLoggedInRef.current) {
      setGame((prev) => (prev === null ? prev : null));
      setReady(true);
      return;
    }
    try {
      const res = await fetch("/api/me/game");
      if (res.ok) {
        const next = (await res.json()) as UserGameState;
        setGame((prev) => (gameStateEqual(prev, next) ? prev : next));
      } else {
        setGame((prev) => (prev === null ? prev : null));
      }
    } catch {
      setGame((prev) => (prev === null ? prev : null));
    }
    setReady(true);
  }, [loadAggregates]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const lastUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const uid = user?.id;
    const userChanged = lastUserIdRef.current !== uid;
    lastUserIdRef.current = uid;
    if (userChanged) setReady(false);

    let active = true;
    const run = () => {
      void refreshRef.current().finally(() => {
        if (active) setReady(true);
      });
    };
    const t = window.setTimeout(run, 1100);
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [user?.id]);

  const saveFantasy = useCallback(
    async (tournamentSlug: string, teamName: string, squad: FantasySquadSlot[]) => {
      const res = await fetch("/api/me/fantasy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentSlug,
          teamName,
          squad: squad.map((s) => ({ playerSlug: s.playerSlug, isCaptain: s.isCaptain })),
        }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "No se pudo guardar" };
      await refresh();
      return {};
    },
    [refresh],
  );

  const castVote = useCallback(
    async (matchId: string, pick: "A" | "B", rewardPoints: number) => {
      let previousVotes: UserGameState["votes"] | undefined;
      setGame((prev) => {
        if (!prev) return prev;
        previousVotes = prev.votes;
        return { ...prev, votes: { ...prev.votes, [matchId]: pick } };
      });

      const res = await fetch("/api/me/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, pick, rewardPoints }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (previousVotes !== undefined) {
          setGame((prev) => (prev ? { ...prev, votes: previousVotes! } : prev));
        }
        return { error: json.error ?? "No se pudo votar" };
      }
      await refresh();
      return {};
    },
    [refresh],
  );

  const saveExactScore = useCallback(
    async (matchId: string, exactScore: string | null) => {
      const res = await fetch("/api/me/predictions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, exactScore }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "No se pudo guardar" };
      await refresh();
      return {};
    },
    [refresh],
  );

  const saveMatchPicks = useCallback(
    async (matchId: string, picks: MatchExtendedPrediction) => {
      const res = await fetch("/api/me/predictions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, picks }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "No se pudo guardar" };
      await refresh();
      return {};
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ ready, aggregates, game, refresh, saveFantasy, castVote, saveExactScore, saveMatchPicks }),
    [ready, aggregates, game, refresh, saveFantasy, castVote, saveExactScore, saveMatchPicks],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame dentro de GameProvider");
  return ctx;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FantasySquadSlot } from "@/lib/data/fantasy";
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
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [ready, setReady] = useState(false);
  const [aggregates, setAggregates] = useState<Record<string, VoteAggregate>>({});
  const [game, setGame] = useState<UserGameState | null>(null);

  const loadAggregates = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions/aggregates");
      const json = await res.json();
      setAggregates(json.aggregates ?? {});
    } catch {
      setAggregates({});
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadAggregates();
    if (!isLoggedIn) {
      setGame(null);
      setReady(true);
      return;
    }
    try {
      const res = await fetch("/api/me/game");
      if (res.ok) {
        setGame(await res.json());
      } else {
        setGame(null);
      }
    } catch {
      setGame(null);
    }
    setReady(true);
  }, [isLoggedIn, loadAggregates]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [user?.id, refresh]);

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
      const res = await fetch("/api/me/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, pick, rewardPoints }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? "No se pudo votar" };
      await refresh();
      return {};
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ ready, aggregates, game, refresh, saveFantasy, castVote }),
    [ready, aggregates, game, refresh, saveFantasy, castVote],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame dentro de GameProvider");
  return ctx;
}

"use client";

import { SquadRoster } from "@/components/esports/SquadRoster";
import type { FantasySquadSlot } from "@/lib/data/fantasy";

interface FantasyArenaProps {
  squad: FantasySquadSlot[];
  tournamentSlug: string;
  locked?: boolean;
  onRemove: (slug: string) => void;
  onSetCaptain: (slug: string) => void;
}

export function FantasyArena(props: FantasyArenaProps) {
  return <SquadRoster {...props} />;
}

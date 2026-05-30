"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import {
  isBrawlerBanned,
  MAX_BRAWLER_BANS_CENTRAL,
  MAX_BRAWLER_PICKS_PER_MAP,
} from "@/lib/data/game-assets-catalog";
import { usedBrawlersOnMap, type MatchExtendedPrediction } from "@/lib/match-predictions-storage";

function emptySlots(max: number, filled: string[]): (string | null)[] {
  const slots: (string | null)[] = [...filled];
  while (slots.length < max) slots.push(null);
  return slots.slice(0, max);
}

export function MapBrawlerDraftRow({
  mapIndex,
  ext,
  teamAName,
  teamBName,
  picksA,
  picksB,
  centralBans,
  matchBans = [],
  onPicksA,
  onPicksB,
  onCentralBans,
  interactive,
}: {
  mapIndex: number;
  ext: MatchExtendedPrediction;
  teamAName: string;
  teamBName: string;
  picksA: string[];
  picksB: string[];
  centralBans: string[];
  matchBans?: string[];
  onPicksA: (next: string[]) => void;
  onPicksB: (next: string[]) => void;
  onCentralBans: (next: string[]) => void;
  interactive?: boolean;
}) {
  const { brawlers: catalog } = useGameAssetsCatalog();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const globalBanned = useMemo(
    () => [...matchBans, ...centralBans],
    [matchBans, centralBans],
  );

  const searchList = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let base = catalog;
    if (needle) {
      base = catalog.filter(
        (b) => b.name.toLowerCase().includes(needle) || b.slug.includes(needle),
      );
    } else {
      base = catalog.slice(0, 24);
    }
    return base;
  }, [catalog, q]);

  function applySlot(
    slotIndex: number,
    name: string | null,
    max: number,
    current: string[],
    onChange: (n: string[]) => void,
  ) {
    const slots = emptySlots(max, current);
    slots[slotIndex] = name;
    onChange(slots.filter((s): s is string => s != null));
  }

  function pickForSlot(
    kind: "a" | "b" | "ban",
    slotIndex: number,
    name: string,
    max: number,
    current: string[],
    onChange: (n: string[]) => void,
  ) {
    const used = usedBrawlersOnMap(mapIndex, ext, kind === "a" ? "a" : kind === "b" ? "b" : "bans");
    if (kind !== "ban" && isBrawlerBanned(name, globalBanned)) return;
    if (used.some((u) => u.toLowerCase() === name.toLowerCase())) return;
    applySlot(slotIndex, name, max, current, onChange);
    setActiveSlot(null);
    setQ("");
  }

  function renderSlots(
    kind: "a" | "b" | "ban",
    max: number,
    filled: string[],
    onChange: (n: string[]) => void,
    variant: "pick" | "ban",
  ) {
    const slots = emptySlots(max, filled);
    return (
      <div className={`bf-draft-slots is-${variant}`}>
        {slots.map((name, i) => {
          const key = `${kind}-${i}`;
          const isActive = activeSlot === key;
          return (
            <div key={key} className="bf-draft-slot-wrap">
              {name ? (
                <BrawlerAssetIcon
                  name={name}
                  variant={variant}
                  size={variant === "ban" ? 72 : 80}
                  hideName
                  selected
                  onClick={
                    interactive
                      ? () => applySlot(i, null, max, filled, onChange)
                      : undefined
                  }
                />
              ) : interactive ? (
                <button
                  type="button"
                  className={`bf-draft-slot-empty ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveSlot(isActive ? null : key)}
                  aria-label="Añadir brawler"
                >
                  <Plus size={22} />
                </button>
              ) : (
                <span className="bf-draft-slot-empty is-readonly" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const showSearch = interactive && activeSlot;

  return (
    <div className="bf-map-draft-row">
      <div className="bf-map-draft-col is-team-a">
        <span className="bf-map-draft-label">{teamAName}</span>
        <span className="bf-map-draft-sublabel">Picks</span>
        {renderSlots("a", MAX_BRAWLER_PICKS_PER_MAP, picksA, onPicksA, "pick")}
      </div>

      <div className="bf-map-draft-col is-center">
        <span className="bf-map-draft-label is-center">Bloqueos</span>
        <span className="bf-map-draft-sublabel">{MAX_BRAWLER_BANS_CENTRAL} bans</span>
        {renderSlots("ban", MAX_BRAWLER_BANS_CENTRAL, centralBans, onCentralBans, "ban")}
      </div>

      <div className="bf-map-draft-col is-team-b">
        <span className="bf-map-draft-label">{teamBName}</span>
        <span className="bf-map-draft-sublabel">Picks</span>
        {renderSlots("b", MAX_BRAWLER_PICKS_PER_MAP, picksB, onPicksB, "pick")}
      </div>

      {showSearch && activeSlot && (
        <div className="bf-draft-search-panel">
          <div className="bf-brawler-search-bar">
            <Search size={18} aria-hidden />
            <input
              type="search"
              placeholder="Buscar brawler…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="bf-brawler-pick-row is-search-results">
            {searchList.map((b) => {
              const kind = activeSlot.startsWith("ban")
                ? "ban"
                : activeSlot.startsWith("a")
                  ? "a"
                  : "b";
              const slotIndex = Number(activeSlot.split("-")[1] ?? 0);
              const used = usedBrawlersOnMap(
                mapIndex,
                ext,
                kind === "a" ? "a" : kind === "b" ? "b" : "bans",
              );
              const blocked =
                kind !== "ban" &&
                (isBrawlerBanned(b.name, globalBanned) ||
                  used.some((u) => u.toLowerCase() === b.name.toLowerCase()));
              const onChange =
                kind === "a"
                  ? onPicksA
                  : kind === "b"
                    ? onPicksB
                    : onCentralBans;
              const current =
                kind === "a" ? picksA : kind === "b" ? picksB : centralBans;
              const max =
                kind === "ban" ? MAX_BRAWLER_BANS_CENTRAL : MAX_BRAWLER_PICKS_PER_MAP;
              return (
                <BrawlerAssetIcon
                  key={b.name}
                  name={b.name}
                  variant={blocked ? "ban" : kind === "ban" ? "ban" : "pick"}
                  size={56}
                  hideName
                  onClick={
                    blocked
                      ? undefined
                      : () => pickForSlot(kind, slotIndex, b.name, max, current, onChange)
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

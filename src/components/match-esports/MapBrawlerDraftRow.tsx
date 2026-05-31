"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import {
  isBrawlerBanned,
  MAX_BRAWLER_BANS_CENTRAL,
  MAX_BRAWLER_BANS_PER_TEAM,
  MAX_BRAWLER_PICKS_PER_MAP,
} from "@/lib/data/game-assets-catalog";
import {
  blockedForPick,
  blockedForTeamBan,
  isSameBrawler,
  usedCentralBans,
  type MatchExtendedPrediction,
} from "@/lib/match-predictions-storage";

function emptySlots(max: number, filled: string[]): (string | null)[] {
  const slots: (string | null)[] = [...filled];
  while (slots.length < max) slots.push(null);
  return slots.slice(0, max);
}

type SlotKind = "pick-a" | "pick-b" | "cban" | "tban-a" | "tban-b";

function parseActiveSlot(key: string): { kind: SlotKind; index: number } | null {
  const m = key.match(/^(pick-a|pick-b|cban|tban-a|tban-b)-(\d+)$/);
  if (!m) return null;
  return { kind: m[1] as SlotKind, index: Number(m[2]) };
}

export function MapBrawlerDraftRow({
  mapIndex,
  ext,
  teamAName,
  teamBName,
  picksA,
  picksB,
  centralBans,
  teamBansA,
  teamBansB,
  matchBans = [],
  onPicksA,
  onPicksB,
  onCentralBans,
  onTeamBansA,
  onTeamBansB,
  interactive,
  compact,
}: {
  mapIndex: number;
  ext: MatchExtendedPrediction;
  teamAName: string;
  teamBName: string;
  picksA: string[];
  picksB: string[];
  centralBans: string[];
  teamBansA: string[];
  teamBansB: string[];
  matchBans?: string[];
  onPicksA: (next: string[]) => void;
  onPicksB: (next: string[]) => void;
  onCentralBans: (next: string[]) => void;
  onTeamBansA: (next: string[]) => void;
  onTeamBansB: (next: string[]) => void;
  interactive?: boolean;
  compact?: boolean;
}) {
  const { brawlers: catalog } = useGameAssetsCatalog();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const searchList = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? catalog.filter(
          (b) =>
            b.name.toLowerCase().includes(needle) || b.slug.toLowerCase().includes(needle),
        )
      : catalog;
    const seen = new Set<string>();
    const unique: typeof catalog = [];
    for (const b of filtered) {
      const key = b.slug.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(b);
    }
    return unique;
  }, [catalog, q]);

  const pickSize = compact ? 52 : 64;
  const banSize = compact ? 48 : 56;
  const slotSize = compact ? 52 : 72;

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

  function isBlockedForSlot(kind: SlotKind, name: string): boolean {
    if (kind === "pick-a") {
      return blockedForPick(mapIndex, ext, "a", matchBans).some((u) => isSameBrawler(u, name));
    }
    if (kind === "pick-b") {
      return blockedForPick(mapIndex, ext, "b", matchBans).some((u) => isSameBrawler(u, name));
    }
    if (kind === "cban") {
      return usedCentralBans(mapIndex, ext).some((u) => isSameBrawler(u, name));
    }
    if (kind === "tban-a") {
      return blockedForTeamBan(mapIndex, ext, "a").some((u) => isSameBrawler(u, name));
    }
    if (kind === "tban-b") {
      return blockedForTeamBan(mapIndex, ext, "b").some((u) => isSameBrawler(u, name));
    }
    return false;
  }

  function pickForSlot(
    kind: SlotKind,
    slotIndex: number,
    name: string,
    max: number,
    current: string[],
    onChange: (n: string[]) => void,
  ) {
    if (isBlockedForSlot(kind, name)) return;
    if ((kind === "pick-a" || kind === "pick-b") && isBrawlerBanned(name, matchBans)) return;
    applySlot(slotIndex, name, max, current, onChange);
    setActiveSlot(null);
    setQ("");
  }

  function slotHandlers(kind: SlotKind): {
    max: number;
    filled: string[];
    onChange: (n: string[]) => void;
    variant: "pick" | "ban";
  } {
    switch (kind) {
      case "pick-a":
        return { max: MAX_BRAWLER_PICKS_PER_MAP, filled: picksA, onChange: onPicksA, variant: "pick" };
      case "pick-b":
        return { max: MAX_BRAWLER_PICKS_PER_MAP, filled: picksB, onChange: onPicksB, variant: "pick" };
      case "cban":
        return { max: MAX_BRAWLER_BANS_CENTRAL, filled: centralBans, onChange: onCentralBans, variant: "ban" };
      case "tban-a":
        return {
          max: MAX_BRAWLER_BANS_PER_TEAM,
          filled: teamBansA,
          onChange: onTeamBansA,
          variant: "ban",
        };
      case "tban-b":
        return {
          max: MAX_BRAWLER_BANS_PER_TEAM,
          filled: teamBansB,
          onChange: onTeamBansB,
          variant: "ban",
        };
    }
  }

  function renderSlots(kind: SlotKind) {
    const { max, filled, onChange, variant } = slotHandlers(kind);
    const slots = emptySlots(max, filled);
    const iconSize = variant === "ban" ? banSize : slotSize;
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
                  size={iconSize}
                  hideName
                  selected
                  onClick={
                    interactive ? () => applySlot(i, null, max, filled, onChange) : undefined
                  }
                />
              ) : interactive ? (
                <button
                  type="button"
                  className={`bf-draft-slot-empty ${isActive ? "is-active" : ""}`}
                  style={{ width: iconSize, height: iconSize }}
                  onClick={() => setActiveSlot(isActive ? null : key)}
                  aria-label="Añadir brawler"
                >
                  <Plus size={compact ? 18 : 22} />
                </button>
              ) : (
                <span
                  className="bf-draft-slot-empty is-readonly"
                  style={{ width: iconSize, height: iconSize }}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const parsed = activeSlot ? parseActiveSlot(activeSlot) : null;
  const showSearch = interactive && parsed;

  const rowClass = `bf-map-draft-grid${compact ? " is-compact" : ""}`;

  return (
    <div className={rowClass}>
      <div className="bf-map-draft-row is-picks">
        <div className="bf-map-draft-col is-team-a">
          <span className="bf-map-draft-label">{teamAName}</span>
          <span className="bf-map-draft-sublabel">Jugar · {MAX_BRAWLER_PICKS_PER_MAP}</span>
          {renderSlots("pick-a")}
        </div>
        <div className="bf-map-draft-col is-center">
          <span className="bf-map-draft-label is-center">Bloqueos</span>
          <span className="bf-map-draft-sublabel">{MAX_BRAWLER_BANS_CENTRAL}</span>
          {renderSlots("cban")}
        </div>
        <div className="bf-map-draft-col is-team-b">
          <span className="bf-map-draft-label">{teamBName}</span>
          <span className="bf-map-draft-sublabel">Jugar · {MAX_BRAWLER_PICKS_PER_MAP}</span>
          {renderSlots("pick-b")}
        </div>
      </div>

      <div className="bf-map-draft-row is-team-bans">
        <div className="bf-map-draft-col is-team-a">
          <span className="bf-map-draft-sublabel">Bloqueos · {MAX_BRAWLER_BANS_PER_TEAM}</span>
          {renderSlots("tban-a")}
        </div>
        <div className="bf-map-draft-col is-center is-spacer" aria-hidden />
        <div className="bf-map-draft-col is-team-b">
          <span className="bf-map-draft-sublabel">Bloqueos · {MAX_BRAWLER_BANS_PER_TEAM}</span>
          {renderSlots("tban-b")}
        </div>
      </div>

      {showSearch && parsed && (
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
              const { kind, index: slotIndex } = parsed;
              const { max, filled, onChange, variant } = slotHandlers(kind);
              const blocked = isBlockedForSlot(kind, b.name);
              return (
                <BrawlerAssetIcon
                  key={b.slug}
                  name={b.name}
                  variant={variant}
                  size={pickSize}
                  hideName
                  disabled={blocked}
                  onClick={
                    blocked
                      ? undefined
                      : () => pickForSlot(kind, slotIndex, b.name, max, filled, onChange)
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

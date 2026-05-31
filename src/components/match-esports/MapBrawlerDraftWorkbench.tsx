"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BrawlerAssetIcon } from "@/components/match-esports/BrawlerAssetIcon";
import { useGameAssetsCatalog } from "@/hooks/useGameAssetsCatalog";
import {
  isBrawlerBanned,
  MAX_BRAWLER_BANS_CENTRAL,
  MAX_BRAWLER_PICKS_PER_MAP,
} from "@/lib/data/game-assets-catalog";
import { usedBrawlersOnMap, type MatchExtendedPrediction } from "@/lib/match-predictions-storage";
import type { MatchMeta } from "@/lib/data/match-meta";

function nextEmptyIndex(filled: string[], max: number): number | null {
  if (filled.length >= max) return null;
  return filled.length;
}

export function MapBrawlerDraftWorkbench({
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
  meta,
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
  meta?: MatchMeta;
}) {
  const { brawlers: catalog } = useGameAssetsCatalog();
  const [qA, setQA] = useState("");
  const [qB, setQB] = useState("");
  const [qBan, setQBan] = useState("");

  const globalBanned = useMemo(
    () => [...matchBans, ...centralBans],
    [matchBans, centralBans],
  );

  function filterList(q: string) {
    const needle = q.trim().toLowerCase();
    let base = catalog;
    if (needle) {
      return catalog.filter(
        (b) => b.name.toLowerCase().includes(needle) || b.slug.includes(needle),
      );
    }
    return catalog;
  }

  function addPick(
    side: "a" | "b",
    name: string,
    current: string[],
    onChange: (n: string[]) => void,
  ) {
    const used = usedBrawlersOnMap(mapIndex, ext, side);
    if (isBrawlerBanned(name, globalBanned)) return;
    if (used.some((u) => u.toLowerCase() === name.toLowerCase())) return;
    const idx = nextEmptyIndex(current, MAX_BRAWLER_PICKS_PER_MAP);
    if (idx == null) return;
    onChange([...current, name]);
  }

  function removePick(side: "a" | "b", name: string, current: string[], onChange: (n: string[]) => void) {
    onChange(current.filter((n) => n.toLowerCase() !== name.toLowerCase()));
  }

  function addBan(name: string) {
    const used = usedBrawlersOnMap(mapIndex, ext, "bans");
    if (used.some((u) => u.toLowerCase() === name.toLowerCase())) return;
    if (centralBans.length >= MAX_BRAWLER_BANS_CENTRAL) return;
    onCentralBans([...centralBans, name]);
  }

  function removeBan(name: string) {
    onCentralBans(centralBans.filter((n) => n.toLowerCase() !== name.toLowerCase()));
  }

  function renderPickRow(
    side: "a" | "b",
    picks: string[],
    onChange: (n: string[]) => void,
  ) {
    const slots: (string | null)[] = [...picks];
    while (slots.length < MAX_BRAWLER_PICKS_PER_MAP) slots.push(null);
    return (
      <div className="bf-workbench-pick-row">
        {slots.slice(0, MAX_BRAWLER_PICKS_PER_MAP).map((name, i) =>
          name ? (
            <BrawlerAssetIcon
              key={`${side}-pick-${name}-${i}`}
              name={name}
              variant="pick"
              size={72}
              hideName
              selected
              meta={meta}
              onClick={
                interactive ? () => removePick(side, name, picks, onChange) : undefined
              }
            />
          ) : (
            <span key={`${side}-empty-${i}`} className="bf-workbench-pick-empty" aria-hidden />
          ),
        )}
      </div>
    );
  }

  function renderBanRow() {
    const slots: (string | null)[] = [...centralBans];
    while (slots.length < MAX_BRAWLER_BANS_CENTRAL) slots.push(null);
    return (
      <div className="bf-workbench-ban-row">
        {slots.slice(0, MAX_BRAWLER_BANS_CENTRAL).map((name, i) =>
          name ? (
            <BrawlerAssetIcon
              key={`ban-${name}-${i}`}
              name={name}
              variant="ban"
              size={64}
              hideName
              meta={meta}
              onClick={interactive ? () => removeBan(name) : undefined}
            />
          ) : (
            <span key={`ban-empty-${i}`} className="bf-workbench-ban-empty" aria-hidden />
          ),
        )}
      </div>
    );
  }

  function renderTeamColumn(
    side: "a" | "b",
    teamLabel: string,
    picks: string[],
    onChange: (n: string[]) => void,
    q: string,
    setQ: (v: string) => void,
    accent: "blue" | "red",
  ) {
    const list = filterList(q);
    return (
      <div className={`bf-workbench-team is-${accent}`}>
        <h5 className="bf-workbench-team-title">{teamLabel}</h5>
        <p className="bf-workbench-team-sub">Picks · {MAX_BRAWLER_PICKS_PER_MAP}</p>
        {renderPickRow(side, picks, onChange)}
        {interactive && (
          <>
            <label className="bf-workbench-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Busca brawler…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="bf-workbench-brawler-grid">
              {list.map((b) => {
                const used = usedBrawlersOnMap(mapIndex, ext, side);
                const blocked =
                  isBrawlerBanned(b.name, globalBanned) ||
                  used.some((u) => u.toLowerCase() === b.name.toLowerCase()) ||
                  picks.some((p) => p.toLowerCase() === b.name.toLowerCase());
                return (
                  <BrawlerAssetIcon
                    key={b.name}
                    name={b.name}
                    variant={blocked ? "ban" : "pick"}
                    size={52}
                    hideName
                    meta={meta}
                    onClick={
                      blocked ? undefined : () => addPick(side, b.name, picks, onChange)
                    }
                  />
                );
              })}
            </div>
          </>
        )}
        {!interactive && picks.length > 0 && (
          <div className="bf-workbench-brawler-grid is-readonly">
            {picks.map((n) => (
              <BrawlerAssetIcon key={n} name={n} size={52} hideName meta={meta} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bf-map-draft-workbench">
      <div className="bf-workbench-bans-block">
        <h5 className="bf-workbench-bans-title">Bloqueos · {MAX_BRAWLER_BANS_CENTRAL}</h5>
        {renderBanRow()}
        {interactive && centralBans.length < MAX_BRAWLER_BANS_CENTRAL && (
          <>
            <label className="bf-workbench-search is-ban">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Busca brawler para ban…"
                value={qBan}
                onChange={(e) => setQBan(e.target.value)}
                autoComplete="off"
              />
            </label>
            <div className="bf-workbench-brawler-grid is-ban-grid">
              {filterList(qBan).map((b) => {
                const used = usedBrawlersOnMap(mapIndex, ext, "bans");
                const blocked =
                  used.some((u) => u.toLowerCase() === b.name.toLowerCase()) ||
                  centralBans.some((x) => x.toLowerCase() === b.name.toLowerCase());
                return (
                  <BrawlerAssetIcon
                    key={b.name}
                    name={b.name}
                    variant="ban"
                    size={48}
                    hideName
                    meta={meta}
                    onClick={blocked ? undefined : () => addBan(b.name)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="bf-workbench-teams">
        {renderTeamColumn("a", teamAName, picksA, onPicksA, qA, setQA, "blue")}
        {renderTeamColumn("b", teamBName, picksB, onPicksB, qB, setQB, "red")}
      </div>
    </div>
  );
}

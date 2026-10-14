"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, MapPin, Trophy, Users, Swords } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  WORLDS_2026_VENUE,
  WORLDS_PICKEM_QF,
  getWorlds2026Players,
  getWorlds2026Teams,
} from "@/lib/data/worlds-2026-field";

const STORAGE_KEY = "bf-worlds-2026-pickem-v1";

type Picks = {
  qf: Record<string, string>;
  sf: Record<string, string>;
  final: string | null;
  champion: string | null;
};

const EMPTY: Picks = { qf: {}, sf: {}, final: null, champion: null };

function loadPicks(): Picks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function teamName(slug: string, teams: ReturnType<typeof getWorlds2026Teams>) {
  return teams.find((t) => t.slug === slug)?.name ?? slug;
}

export function WorldsPickemsHome() {
  const teams = useMemo(() => getWorlds2026Teams(), []);
  const players = useMemo(() => getWorlds2026Players(), []);
  const [picks, setPicks] = useState<Picks>(EMPTY);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"pickem" | "teams" | "players">("pickem");

  useEffect(() => {
    setPicks(loadPicks());
    setReady(true);
    document.documentElement.dataset.bfExperience = "worlds";
    document.documentElement.dataset.wfTheme = "tokyo";
  }, []);

  const save = useCallback((next: Picks) => {
    setPicks(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const pickQf = (id: string, winner: string) => {
    const qf = { ...picks.qf, [id]: winner };
    // reset later rounds if dependent
    save({ qf, sf: {}, final: null, champion: null });
  };

  const sfPairs = useMemo(() => {
    const w = WORLDS_PICKEM_QF.map((m) => picks.qf[m.id]).filter(Boolean) as string[];
    if (w.length < 8) return [] as { id: string; a: string; b: string }[];
    return [
      { id: "sf1", a: w[0], b: w[1] },
      { id: "sf2", a: w[2], b: w[3] },
      { id: "sf3", a: w[4], b: w[5] },
      { id: "sf4", a: w[6], b: w[7] },
    ];
  }, [picks.qf]);

  const pickSf = (id: string, winner: string) => {
    const sf = { ...picks.sf, [id]: winner };
    save({ ...picks, sf, final: null, champion: null });
  };

  const sfWinners = useMemo(
    () => ["sf1", "sf2", "sf3", "sf4"].map((id) => picks.sf[id]).filter(Boolean) as string[],
    [picks.sf],
  );

  const progress = useMemo(() => {
    const qfDone = Object.keys(picks.qf).length;
    const sfDone = Object.keys(picks.sf).length;
    const champ = picks.champion ? 1 : 0;
    return Math.round(((qfDone + sfDone + champ) / (8 + 4 + 1)) * 100);
  }, [picks]);

  if (!ready) {
    return (
      <div className="wc-boot">
        <p>Cargando World Finals 2026…</p>
      </div>
    );
  }

  return (
    <div className="wc-app">
      <header className="wc-hero">
        <p className="wc-kicker">
          <MapPin size={14} aria-hidden /> {WORLDS_2026_VENUE.labelJp} · {WORLDS_2026_VENUE.label}
        </p>
        <h1>
          <span className="wc-jp">世界決勝</span>
          Brawl Stars World Finals <em>2026</em>
        </h1>
        <p className="wc-lead">
          Pick&apos;ems estilo Mundial: elige ganadores del cuadro, corona al campeón y explora cada
          equipo y jugador del campo de Tokio.
        </p>
        <div className="wc-progress" aria-label="Progreso pickem">
          <div style={{ width: `${progress}%` }} />
        </div>
        <p className="wc-progress-label">{progress}% del bracket rellenado</p>
        {picks.champion && (
          <p className="wc-champ-banner">
            <Crown size={16} aria-hidden /> Tu campeón:{" "}
            <strong>{teamName(picks.champion, teams)}</strong>
          </p>
        )}
      </header>

      <nav className="wc-tabs" aria-label="Secciones Mundial">
        {(
          [
            ["pickem", "Pick'ems", Trophy],
            ["teams", "Equipos", Users],
            ["players", "Jugadores", Swords],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "is-on" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={16} aria-hidden /> {label}
          </button>
        ))}
      </nav>

      {tab === "pickem" && (
        <section className="wc-panel">
          <h2>Cuartos de final</h2>
          <p className="wc-hint">Elige el ganador de cada cruce (Bo5).</p>
          <div className="wc-match-grid">
            {WORLDS_PICKEM_QF.map((m) => (
              <div key={m.id} className="wc-match">
                <span className="wc-match-id">{m.id.toUpperCase()}</span>
                {[m.a, m.b].map((slug) => {
                  const on = picks.qf[m.id] === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      className={`wc-team-pick ${on ? "is-on" : ""}`}
                      onClick={() => pickQf(m.id, slug)}
                    >
                      <TeamLogo slug={slug} name={teamName(slug, teams)} size={28} />
                      <span>{teamName(slug, teams)}</span>
                      {on && <Crown size={14} aria-hidden />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <h2 className="wc-h2">Semifinales</h2>
          {sfPairs.length === 0 ? (
            <p className="wc-hint">Completa los 8 cuartos para desbloquear semis.</p>
          ) : (
            <div className="wc-match-grid">
              {sfPairs.map((m) => (
                <div key={m.id} className="wc-match">
                  <span className="wc-match-id">{m.id.toUpperCase()}</span>
                  {[m.a, m.b].map((slug) => {
                    const on = picks.sf[m.id] === slug;
                    return (
                      <button
                        key={slug}
                        type="button"
                        className={`wc-team-pick ${on ? "is-on" : ""}`}
                        onClick={() => pickSf(m.id, slug)}
                      >
                        <TeamLogo slug={slug} name={teamName(slug, teams)} size={28} />
                        <span>{teamName(slug, teams)}</span>
                        {on && <Crown size={14} aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <h2 className="wc-h2">Campeón de Tokio</h2>
          {sfWinners.length < 4 ? (
            <p className="wc-hint">Elige las 4 semis para coronar al campeón.</p>
          ) : (
            <div className="wc-champ-grid">
              {sfWinners.map((slug) => {
                const on = picks.champion === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    className={`wc-champ-pick ${on ? "is-on" : ""}`}
                    onClick={() => save({ ...picks, champion: slug })}
                  >
                    <TeamLogo slug={slug} name={teamName(slug, teams)} size={40} />
                    <strong>{teamName(slug, teams)}</strong>
                    {on && <span>Campeón</span>}
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="wc-reset"
            onClick={() => save(EMPTY)}
          >
            Reiniciar pick&apos;em
          </button>
        </section>
      )}

      {tab === "teams" && (
        <section className="wc-panel">
          <h2>Campo · 16 equipos</h2>
          <div className="wc-team-grid">
            {teams.map((t) => (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="wc-team-card">
                <TeamLogo slug={t.slug} name={t.name} size={44} />
                <div>
                  <strong>{t.name}</strong>
                  <span>
                    {t.region} · {t.roster.length} jugadores
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tab === "players" && (
        <section className="wc-panel">
          <h2>Jugadores del Mundial</h2>
          <div className="wc-player-grid">
            {players.map((p) => (
              <Link key={p.slug} href={`/players/${p.slug}`} className="wc-player-card">
                <strong>{p.ign}</strong>
                <span>
                  {p.teamName} · {p.region}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

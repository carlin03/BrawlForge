"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crown, MapPin, Trophy, Users, Swords, Layers } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PlayerCard } from "@/components/platform/PlayerCard";
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

function labelTeam(slug: string, teams: ReturnType<typeof getWorlds2026Teams>) {
  return teams.find((t) => t.slug === slug)?.name ?? slug;
}

export function WorldsPickemsHome() {
  const teams = useMemo(() => getWorlds2026Teams(), []);
  const players = useMemo(() => getWorlds2026Players(), []);
  const [picks, setPicks] = useState<Picks>(EMPTY);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"pickem" | "teams" | "players" | "cards">("cards");
  const [openTeam, setOpenTeam] = useState<string | null>(teams[0]?.slug ?? null);

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
    save({ qf: { ...picks.qf, [id]: winner }, sf: {}, final: null, champion: null });
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
    save({ ...picks, sf: { ...picks.sf, [id]: winner }, final: null, champion: null });
  };

  const sfWinners = useMemo(
    () => ["sf1", "sf2", "sf3", "sf4"].map((id) => picks.sf[id]).filter(Boolean) as string[],
    [picks.sf],
  );

  const progress = useMemo(() => {
    const qfDone = Object.keys(picks.qf).length;
    const sfDone = Object.keys(picks.sf).length;
    const champ = picks.champion ? 1 : 0;
    return Math.round(((qfDone + sfDone + champ) / 13) * 100);
  }, [picks]);

  const spotlight = useMemo(() => players.slice(0, 12).map((p) => p.slug), [players]);
  const activeTeam = teams.find((t) => t.slug === openTeam) ?? teams[0];

  if (!ready) {
    return (
      <div className="wc-boot">
        <p>Cargando cartas World Finals 2026…</p>
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
          World Finals <em>2026</em>
        </h1>
        <p className="wc-lead">
          Cartas de cada pro, plantillas de los 16 equipos y pick&apos;ems del cuadro. Todo el Mundial
          en Tokio — sin el resto del circuito.
        </p>
        <div className="wc-hero-stats">
          <div>
            <b>{teams.length}</b>
            <span>Equipos</span>
          </div>
          <div>
            <b>{players.length}</b>
            <span>Jugadores</span>
          </div>
          <div>
            <b>{progress}%</b>
            <span>Tu pick&apos;em</span>
          </div>
        </div>
        {picks.champion && (
          <p className="wc-champ-banner">
            <Crown size={16} aria-hidden /> Tu campeón:{" "}
            <strong>{labelTeam(picks.champion, teams)}</strong>
          </p>
        )}
      </header>

      <nav className="wc-tabs" aria-label="Secciones Mundial">
        {(
          [
            ["cards", "Cartas", Layers],
            ["teams", "Equipos", Users],
            ["players", "Jugadores", Swords],
            ["pickem", "Pick'ems", Trophy],
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

      {tab === "cards" && (
        <section className="wc-panel">
          <h2>Cartas del Mundial</h2>
          <p className="wc-hint">
            Cartas premium de los pros del campo de Tokio. Pulsa una para abrir su ficha.
          </p>
          <div className="wc-cards-rail">
            {spotlight.map((slug) => (
              <div key={slug} className="wc-card-slot">
                <PlayerCard playerSlug={slug} size="lg" href={`/players/${slug}`} showExtended />
              </div>
            ))}
          </div>
          <h2 className="wc-h2">Todas las cartas ({players.length})</h2>
          <div className="wc-cards-grid">
            {players.map((p) => (
              <div key={p.slug} className="wc-card-slot">
                <PlayerCard
                  playerSlug={p.slug}
                  clubSlug={p.teamSlug}
                  size="md"
                  href={`/players/${p.slug}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "teams" && (
        <section className="wc-panel">
          <h2>Equipos · plantilla con cartas</h2>
          <p className="wc-hint">Elige un club para ver sus 3 cartas de roster.</p>
          <div className="wc-team-chips">
            {teams.map((t) => (
              <button
                key={t.slug}
                type="button"
                className={`wc-team-chip ${openTeam === t.slug ? "is-on" : ""}`}
                onClick={() => setOpenTeam(t.slug)}
              >
                <TeamLogo slug={t.slug} name={t.name} size={22} />
                {t.name}
              </button>
            ))}
          </div>
          {activeTeam && (
            <div className="wc-team-focus">
              <div className="wc-team-focus-head">
                <TeamLogo slug={activeTeam.slug} name={activeTeam.name} size={52} />
                <div>
                  <strong>{activeTeam.name}</strong>
                  <span>
                    {activeTeam.region} · {activeTeam.roster.length} jugadores
                  </span>
                </div>
                <Link href={`/teams/${activeTeam.slug}`} className="wc-link-btn">
                  Ficha equipo
                </Link>
              </div>
              <div className="wc-cards-grid wc-cards-grid-3">
                {activeTeam.roster.map((p) => (
                  <div key={p.slug} className="wc-card-slot">
                    <PlayerCard
                      playerSlug={p.slug}
                      clubSlug={activeTeam.slug}
                      size="lg"
                      href={`/players/${p.slug}`}
                      showExtended
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "players" && (
        <section className="wc-panel">
          <h2>Jugadores ({players.length})</h2>
          <p className="wc-hint">Todas las cartas del Mundial, ordenadas por IGN.</p>
          <div className="wc-cards-grid">
            {players.map((p) => (
              <div key={p.slug} className="wc-card-slot">
                <PlayerCard
                  playerSlug={p.slug}
                  clubSlug={p.teamSlug}
                  size="md"
                  href={`/players/${p.slug}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "pickem" && (
        <section className="wc-panel">
          <h2>Pick&apos;ems · cuadro Tokio</h2>
          <p className="wc-hint">Elige ganadores. Progreso: {progress}%.</p>
          <div className="wc-progress" aria-hidden>
            <div style={{ width: `${progress}%` }} />
          </div>

          <h3 className="wc-h3">Cuartos</h3>
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
                      <TeamLogo slug={slug} name={labelTeam(slug, teams)} size={28} />
                      <span>{labelTeam(slug, teams)}</span>
                      {on && <Crown size={14} aria-hidden />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <h3 className="wc-h3">Semis</h3>
          {sfPairs.length === 0 ? (
            <p className="wc-hint">Completa los 8 cuartos.</p>
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
                        <TeamLogo slug={slug} name={labelTeam(slug, teams)} size={28} />
                        <span>{labelTeam(slug, teams)}</span>
                        {on && <Crown size={14} aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <h3 className="wc-h3">Campeón</h3>
          {sfWinners.length < 4 ? (
            <p className="wc-hint">Termina las semis para coronar.</p>
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
                    <TeamLogo slug={slug} name={labelTeam(slug, teams)} size={40} />
                    <strong>{labelTeam(slug, teams)}</strong>
                    {on && <span>Campeón</span>}
                  </button>
                );
              })}
            </div>
          )}

          <button type="button" className="wc-reset" onClick={() => save(EMPTY)}>
            Reiniciar pick&apos;em
          </button>
        </section>
      )}
    </div>
  );
}

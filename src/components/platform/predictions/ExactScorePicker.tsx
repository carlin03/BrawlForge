"use client";

import { useCallback, useEffect, useState } from "react";
import { exactScoresForFormat } from "@/lib/data/match-meta";
import { writeExactScore } from "@/lib/exact-score-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

export function ExactScorePicker({
  matchId,
  format,
  teamAName,
  teamBName,
  disabled,
  initialScore,
}: {
  matchId: string;
  format: string;
  teamAName: string;
  teamBName: string;
  disabled?: boolean;
  initialScore?: string | null;
}) {
  const { isLoggedIn } = useAuth();
  const { game, saveExactScore } = useGame();
  const options = exactScoresForFormat(format);
  const fromGame = game?.exactScores?.[matchId] ?? null;
  const [picked, setPicked] = useState<string | null>(initialScore ?? fromGame);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (fromGame) setPicked(fromGame);
  }, [fromGame]);

  const display = picked ?? fromGame;

  const persist = useCallback(
    async (score: string | null) => {
      setPicked(score);
      writeExactScore(matchId, score);
      if (!isLoggedIn) return;
      setSaving(true);
      setErr("");
      const res = await saveExactScore(matchId, score);
      setSaving(false);
      if (res.error) setErr(res.error);
    },
    [isLoggedIn, matchId, saveExactScore],
  );

  function select(score: string) {
    if (disabled || saving) return;
    const next = display === score ? null : score;
    void persist(next);
  }

  return (
    <div className="bf-exact-score" aria-label="Predicción de resultado exacto">
      <p className="bf-exact-score-lead">
        Resultado exacto · {format} ({teamAName} vs {teamBName})
      </p>
      <div className="bf-exact-score-grid">
        {options.map((score) => (
          <button
            key={score}
            type="button"
            className={`bf-exact-score-btn ${display === score ? "is-on" : ""}`}
            onClick={() => select(score)}
            disabled={disabled || saving}
          >
            {score}
          </button>
        ))}
      </div>
      {display && (
        <p className="bf-exact-score-saved">
          {isLoggedIn ? "Guardado en tu cuenta" : "Guardado en este dispositivo"}: {display}
        </p>
      )}
      {!isLoggedIn && (
        <p className="bf-exact-score-hint">Inicia sesión para sincronizar el marcador exacto.</p>
      )}
      {saving && <p className="bf-exact-score-hint">Guardando…</p>}
      {err && <p className="bf-auth-error">{err}</p>}
    </div>
  );
}

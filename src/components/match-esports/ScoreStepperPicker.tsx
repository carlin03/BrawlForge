"use client";

import { useCallback, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  getSeriesRules,
  isValidSeriesScore,
  parseExactScore,
  scoreToExactString,
} from "@/lib/data/match-format-rules";
import { patchMatchPrediction } from "@/lib/match-predictions-storage";
import { writeExactScore } from "@/lib/exact-score-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";

export function ScoreStepperPicker({
  matchId,
  format,
  teamASlug,
  teamBSlug,
  teamAName,
  teamBName,
  initialScore,
  disabled,
}: {
  matchId: string;
  format: string;
  teamASlug: string;
  teamBSlug: string;
  teamAName: string;
  teamBName: string;
  initialScore?: string | null;
  disabled?: boolean;
}) {
  const rules = getSeriesRules(format);
  const { isLoggedIn } = useAuth();
  const { saveExactScore } = useGame();
  const parsed = parseExactScore(initialScore);
  const [scoreA, setScoreA] = useState(parsed?.a ?? 0);
  const [scoreB, setScoreB] = useState(parsed?.b ?? 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const p = parseExactScore(initialScore);
    if (p) {
      setScoreA(p.a);
      setScoreB(p.b);
    }
  }, [initialScore]);

  const valid = isValidSeriesScore(scoreA, scoreB, format);

  const persist = useCallback(
    async (a: number, b: number) => {
      const exact = isValidSeriesScore(a, b, format) ? scoreToExactString(a, b) : null;
      patchMatchPrediction(matchId, { exactScore: exact ?? undefined });
      writeExactScore(matchId, exact);
      if (!isLoggedIn || !exact) return;
      setSaving(true);
      setErr("");
      const res = await saveExactScore(matchId, exact);
      setSaving(false);
      if (res.error) setErr(res.error);
    },
    [format, isLoggedIn, matchId, saveExactScore],
  );

  function bump(side: "A" | "B", delta: number) {
    if (disabled || saving) return;
    let a = scoreA;
    let b = scoreB;
    if (side === "A") a = Math.max(0, Math.min(rules.maxScoreA, a + delta));
    else b = Math.max(0, Math.min(rules.maxScoreB, b + delta));
    setScoreA(a);
    setScoreB(b);
    void persist(a, b);
  }

  return (
    <div className="bf-score-stepper" aria-label="Resultado exacto">
      <p className="bf-score-stepper-kicker">
        Resultado exacto · {rules.label}
        <span className="bf-score-stepper-hint">Gana con {rules.winsNeeded} mapas</span>
      </p>

      <div className="bf-score-stepper-duel">
        <div className="bf-score-stepper-side is-blue">
          <TeamLogo slug={teamASlug} name={teamAName} size={56} />
          <span className="bf-score-stepper-team">{teamAName}</span>
          <div className="bf-score-stepper-controls">
            <button type="button" className="bf-score-step-btn" onClick={() => bump("A", -1)} disabled={scoreA <= 0 || disabled}>
              <Minus size={18} />
            </button>
            <span className="bf-score-stepper-num">{scoreA}</span>
            <button
              type="button"
              className="bf-score-step-btn"
              onClick={() => bump("A", 1)}
              disabled={scoreA >= rules.maxScoreA || disabled}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <span className="bf-score-stepper-vs">VS</span>

        <div className="bf-score-stepper-side is-red">
          <TeamLogo slug={teamBSlug} name={teamBName} size={56} />
          <span className="bf-score-stepper-team">{teamBName}</span>
          <div className="bf-score-stepper-controls">
            <button type="button" className="bf-score-step-btn" onClick={() => bump("B", -1)} disabled={scoreB <= 0 || disabled}>
              <Minus size={18} />
            </button>
            <span className="bf-score-stepper-num">{scoreB}</span>
            <button
              type="button"
              className="bf-score-step-btn"
              onClick={() => bump("B", 1)}
              disabled={scoreB >= rules.maxScoreB || disabled}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className={`bf-score-stepper-result ${valid ? "is-valid" : "is-invalid"}`}>
        {valid ? (
          <>
            Marcador predicho: <strong>{scoreToExactString(scoreA, scoreB)}</strong>
            {isLoggedIn ? " · guardado en tu cuenta" : " · guardado en este dispositivo"}
          </>
        ) : (
          <>Ajusta un resultado válido para {rules.label} (ej. {rules.winsNeeded}-{rules.maxMapsLosers})</>
        )}
      </div>
      {saving && <p className="bf-score-stepper-note">Guardando…</p>}
      {err && <p className="bf-auth-error">{err}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import type { MatchExtendedPrediction } from "@/lib/match-predictions-storage";

export function MatchPredictionSaveBar({
  matchId,
  winnerPick,
  ext,
  disabled,
}: {
  matchId: string;
  winnerPick: "A" | "B" | null;
  ext: MatchExtendedPrediction;
  disabled?: boolean;
}) {
  const { isLoggedIn } = useAuth();
  const { saveMatchPicks } = useGame();
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function handleSave() {
    if (!isLoggedIn) return;
    if (!winnerPick) {
      setMsg("Elige el ganador del partido primero.");
      setStatus("err");
      return;
    }
    setStatus("saving");
    setMsg("");
    const res = await saveMatchPicks(matchId, ext);
    if (res.error) {
      setStatus("err");
      setMsg(res.error);
      return;
    }
    setStatus("ok");
    setMsg("Predicción guardada.");
    setTimeout(() => {
      setStatus("idle");
      setMsg("");
    }, 3000);
  }

  if (disabled) return null;

  return (
    <div className="bf-prediction-save-bar">
      {!isLoggedIn ? (
        <p className="bf-match-predict-hint">
          <Link href={`/login?next=/matches/${matchId}`}>Inicia sesión</Link> para guardar tu predicción.
        </p>
      ) : (
        <>
          <button
            type="button"
            className="bf-btn bf-btn-yellow bf-prediction-save-btn"
            disabled={status === "saving" || !winnerPick}
            onClick={() => void handleSave()}
          >
            <Save size={18} aria-hidden />
            {status === "saving" ? "Guardando…" : "Guardar predicción"}
          </button>
          {msg && (
            <p className={`bf-prediction-save-msg ${status === "err" ? "is-err" : "is-ok"}`}>{msg}</p>
          )}
        </>
      )}
    </div>
  );
}

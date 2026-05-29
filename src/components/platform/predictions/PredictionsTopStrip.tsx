"use client";

import { Trophy } from "lucide-react";
import type { PredictionLeaderboardRow } from "@/lib/supabase/game-types";
import { predictAccuracy } from "@/lib/data/predictions-ui";

export function PredictionsTopStrip({
  leaderboard,
  myRank,
  myUserId,
}: {
  leaderboard: PredictionLeaderboardRow[];
  myRank: number | null;
  myUserId?: string;
}) {
  const top = leaderboard.slice(0, 5);
  if (!top.length) return null;

  return (
    <section className="bf-predict-top-strip" aria-labelledby="predict-top-title">
      <div className="bf-predict-top-strip-head">
        <h2 id="predict-top-title" className="bf-predict-v2-section-title">
          <Trophy size={14} aria-hidden /> Top predictores
        </h2>
        {myRank != null && (
          <span className="bf-predict-top-strip-you">
            Tu posición: <strong>#{myRank}</strong>
          </span>
        )}
      </div>
      <ol className="bf-predict-top-strip-list">
        {top.map((row) => {
          const isMe = myUserId && row.user_id === myUserId;
          return (
            <li key={row.user_id} className={`is-r${row.rank}${isMe ? " is-me" : ""}`}>
              <span className="bf-predict-top-rank">#{row.rank}</span>
              <div className="bf-predict-top-body">
                <strong>{row.display_name || row.ign}</strong>
                <span>
                  {row.predict_points} pts · {predictAccuracy(row.predict_correct, row.predict_attempts)}%
                  {row.predict_streak >= 2 ? ` · ×${row.predict_streak}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

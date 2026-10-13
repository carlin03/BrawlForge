"use client";

import { useMemo, useState } from "react";
import { pickWorldsQuizRound, type WorldsQuizQuestion } from "@/lib/data/worlds-quiz";

type Phase = "idle" | "playing" | "done";

export function WorldsQuiz() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<WorldsQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const current = questions[index];
  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((index + (picked != null ? 1 : 0)) / questions.length) * 100);
  }, [index, picked, questions.length]);

  function start() {
    setQuestions(pickWorldsQuizRound(8));
    setIndex(0);
    setScore(0);
    setPicked(null);
    setStreak(0);
    setPhase("playing");
  }

  function answer(optionIndex: number) {
    if (!current || picked != null) return;
    setPicked(optionIndex);
    const ok = optionIndex === current.correctIndex;
    if (ok) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  const title =
    phase === "done"
      ? score >= 7
        ? "Campeón del trivia"
        : score >= 5
          ? "Casi World Finals"
          : "Sigue entrenando"
      : "Worlds Trivia";

  return (
    <section className="wf-quiz" aria-labelledby="wf-quiz-title">
      <div className="wf-quiz-head">
        <div>
          <p className="wf-kicker">Minijuego</p>
          <h2 id="wf-quiz-title">{title}</h2>
          <p className="wf-quiz-sub">8 preguntas del circuito BSC · sin spoilers de resultados en vivo</p>
        </div>
        {phase === "playing" && (
          <div className="wf-quiz-meta" aria-live="polite">
            <span>{index + 1}/{questions.length}</span>
            <span>{score} pts</span>
            {streak > 1 && <span className="wf-streak">×{streak}</span>}
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="wf-quiz-idle">
          <p>Pon a prueba lo que sabes de Championship, regiones y World Finals.</p>
          <button type="button" className="wf-btn wf-btn-gold" onClick={start}>
            Empezar trivia
          </button>
        </div>
      )}

      {phase === "playing" && current && (
        <div className="wf-quiz-play">
          <div className="wf-quiz-bar" aria-hidden>
            <div style={{ width: `${progress}%` }} />
          </div>
          <p className="wf-quiz-prompt">{current.prompt}</p>
          <div className="wf-quiz-options" role="list">
            {current.options.map((opt, i) => {
              let cls = "wf-quiz-opt";
              if (picked != null) {
                if (i === current.correctIndex) cls += " is-correct";
                else if (i === picked) cls += " is-wrong";
                else cls += " is-dim";
              }
              return (
                <button
                  key={opt}
                  type="button"
                  className={cls}
                  onClick={() => answer(i)}
                  disabled={picked != null}
                >
                  <span className="wf-quiz-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          {picked != null && (
            <div className="wf-quiz-feedback">
              {current.explain && <p>{current.explain}</p>}
              <button type="button" className="wf-btn wf-btn-gold" onClick={next}>
                {index + 1 >= questions.length ? "Ver resultado" : "Siguiente"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="wf-quiz-done">
          <p className="wf-quiz-score">
            <strong>{score}</strong> / {questions.length}
          </p>
          <p>
            {score >= 7
              ? "Listo para el Mundial. Ahora ve a Predicciones y Pick'ems."
              : "Repasa torneos y vuelve a intentarlo."}
          </p>
          <div className="wf-quiz-actions">
            <button type="button" className="wf-btn wf-btn-gold" onClick={start}>
              Otra ronda
            </button>
            <a href="/predictions" className="wf-btn wf-btn-ghost">
              Ir a predicciones
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

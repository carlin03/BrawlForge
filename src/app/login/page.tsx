"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function authErrorMessage(code: string | null): string {
  if (code === "auth") return "No se pudo confirmar la sesión. Vuelve a intentar.";
  if (code === "config") return "Servicio no disponible. Inténtalo más tarde.";
  return "";
}

function LoginForm() {
  const { signIn, signUp, signInWithGoogle, supabaseReady, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const errorFromUrl = authErrorMessage(searchParams.get("error"));
  const [mode, setMode] = useState<"in" | "up">(() => (tabFromUrl === "registro" ? "up" : "in"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(() => errorFromUrl);
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!supabaseReady) {
      setError("No se puede registrar ahora. Comprueba la conexión e inténtalo de nuevo.");
      return;
    }

    if (mode === "up" && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const res =
      mode === "in"
        ? await signIn(email, password)
        : await signUp(email, password, displayName || email.split("@")[0]);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if ("needsEmailConfirmation" in res && res.needsEmailConfirmation) {
      setInfo("Cuenta creada. Revisa tu email y confirma el enlace antes de entrar.");
      setMode("in");
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function google() {
    setError("");
    setInfo("");
    if (!supabaseReady) {
      setError("Inicio con Google no disponible ahora.");
      return;
    }
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className="bf-auth-page">
      <div className="bf-auth-card">
        <h1>BrawlForge</h1>
        <p className="bf-auth-lead">
          {mode === "in" ? "Entra con tu cuenta" : "Crea tu cuenta"}
        </p>

        <div className="bf-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={mode === "in" ? "is-on" : ""}
            onClick={() => {
              setMode("in");
              setError("");
              setInfo("");
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            className={mode === "up" ? "is-on" : ""}
            onClick={() => {
              setMode("up");
              setError("");
              setInfo("");
            }}
          >
            Crear cuenta
          </button>
        </div>

        {info && <p className="bf-auth-success">{info}</p>}

        <form onSubmit={submit} className="bf-auth-form">
          {mode === "up" && (
            <label>
              Nombre de jugador
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nick"
                autoComplete="nickname"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@gmail.com"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              placeholder={mode === "up" ? "Mínimo 6 caracteres" : ""}
            />
          </label>
          {error && <p className="bf-auth-error">{error}</p>}
          <button type="submit" className="bp-btn bp-btn-gold bf-auth-submit" disabled={loading}>
            {loading ? "…" : mode === "in" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <div className="bf-auth-divider">
          <span>o</span>
        </div>

        <button
          type="button"
          className="bf-auth-google"
          disabled={loading || !supabaseReady}
          onClick={() => void google()}
        >
          Continuar con Google
        </button>

        <Link href="/" className="bf-home-link" style={{ display: "block", marginTop: 16, textAlign: "center" }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bf-auth-page">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}

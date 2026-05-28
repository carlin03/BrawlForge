"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseStatus } from "@/components/auth/SupabaseStatus";

function authErrorMessage(code: string | null): string {
  if (code === "auth") return "No se pudo confirmar la sesión. Vuelve a intentar entrar.";
  if (code === "config") return "Falta configurar Supabase en .env.local";
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
      setError("Supabase no está configurado. Revisa .env.local y reinicia npm run dev.");
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
      setInfo(
        "Cuenta creada. Revisa tu email y pulsa el enlace de confirmación. Luego podrás entrar con tu contraseña.",
      );
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
      setError("Supabase no configurado.");
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
          {mode === "in" ? "Entra con tu cuenta" : "Crea tu cuenta de jugador"}
        </p>
        <p className="bf-auth-hint" style={{ marginTop: 0 }}>
          El SQL en Supabase prepara la base de datos. Aquí registras <strong>tu</strong> usuario (email y contraseña).
        </p>

        {!supabaseReady && (
          <p className="bf-auth-warn">
            Falta <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en{" "}
            <code>brawlforge/.env.local</code>. Reinicia <code>npm run dev</code> después de guardar.
          </p>
        )}

        <SupabaseStatus />

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
              Nombre de jugador (IGN)
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nick en la app"
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
        <p className="bf-auth-hint">
          En Supabase → Authentication → URL Configuration, añade{" "}
          <code>http://localhost:3000/auth/callback</code> como redirect. Para Google, activa el proveedor
          Google en el mismo panel.
        </p>

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

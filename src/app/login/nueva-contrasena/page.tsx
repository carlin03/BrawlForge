"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/contexts/AuthContext";

function ResetPasswordForm() {
  const { updatePassword, supabaseReady, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && supabaseReady) {
      setInfo("Abre el enlace del email de recuperación para poder crear una contraseña nueva.");
    }
  }, [authLoading, user, supabaseReady]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!user) {
      setError("Sesión no válida. Usa el enlace del email de recuperación.");
      return;
    }

    setSubmitting(true);
    const res = await updatePassword(password);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setInfo("Contraseña actualizada. Redirigiendo…");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="bf-auth-page">
      <div className="bf-auth-card">
        <div className="bf-auth-brand">
          <BrandMark size={48} />
          <h1>BrawlForge</h1>
        </div>
        <p className="bf-auth-lead">Crea una contraseña nueva</p>

        {info && <p className="bf-auth-success">{info}</p>}

        <form onSubmit={submit} className="bf-auth-form">
          <label>
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </label>
          <label>
            Repetir contraseña
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="bf-auth-error">{error}</p>}
          <button type="submit" className="bp-btn bp-btn-gold bf-auth-submit" disabled={submitting || !user}>
            {submitting ? "…" : "Guardar contraseña"}
          </button>
        </form>

        <Link href="/login" className="bf-home-link" style={{ display: "block", marginTop: 16, textAlign: "center" }}>
          Volver a entrar
        </Link>
      </div>
    </div>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <Suspense fallback={<div className="bf-auth-page">Cargando…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

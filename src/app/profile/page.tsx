"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teams } from "@/lib/data";
import { isOwnerEmail } from "@/lib/admin-access";

export default function ProfilePage() {
  const { profile, user, loading, isAdmin, refreshProfile } = useAuth();
  const [claimMsg, setClaimMsg] = useState("");
  const [claiming, setClaiming] = useState(false);
  const { game } = useGame();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/profile");
    }
  }, [loading, user, router]);

  if (loading || !user || !profile) {
    return <div className="bf-auth-page">Cargando…</div>;
  }

  return (
    <div className="bf-profile-page">
      <header className="bf-fantasy-gate">
        <div className="bf-fantasy-gate-left">
          <span className="bf-home-gate-badge">Jugador</span>
          <div>
            <h1 className="bf-fantasy-title">{profile.displayName}</h1>
            <p className="bf-fantasy-sub">IGN: {profile.ign}</p>
          </div>
        </div>
        {profile.favoriteTeamSlug && <TeamLogo slug={profile.favoriteTeamSlug} size={72} />}
      </header>

      <div className="bf-profile-stats-grid">
        <div className="bf-profile-stat-card">
          <b>{game?.fantasyPoints ?? 0}</b>
          <span>Puntos fantasy</span>
        </div>
        <div className="bf-profile-stat-card">
          <b>{game?.fantasyRank ? `#${game.fantasyRank.toLocaleString()}` : "—"}</b>
          <span>Ranking fantasy</span>
        </div>
        <div className="bf-profile-stat-card">
          <b>{game?.predictPoints ?? profile.predictPoints}</b>
          <span>Puntos votos</span>
        </div>
        <div className="bf-profile-stat-card">
          <b>{game?.predictStreak ?? profile.predictStreak}W</b>
          <span>Racha predicciones</span>
        </div>
      </div>

      <section className="bf-panel">
        <h2 className="bf-home-block-title">Club favorito</h2>
        <p className="bf-fantasy-sub">
          {profile.favoriteTeamSlug
            ? teams.find((t) => t.slug === profile.favoriteTeamSlug)?.name
            : "Sin club asignado"}
        </p>
        <div className="bf-profile-clubs">
          {teams.slice(0, 12).map((t) => (
            <Link key={t.slug} href={`/teams/${t.slug}`} className="bf-profile-club-chip">
              <TeamLogo slug={t.slug} name={t.name} size={36} glow={false} />
              <span>{t.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link href="/fantasy" className="bp-btn bp-btn-gold">
        Gestionar plantilla
      </Link>

      {isAdmin ? (
        <section className="bf-panel bf-admin-profile-panel">
          <h2 className="bf-home-block-title">
            <Shield size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Panel de administración
          </h2>
          <p className="bf-fantasy-sub">Edita equipos, jugadores, logos y noticias.</p>
          <Link href="/admin" className="bp-btn bp-btn-gold" style={{ marginTop: 12 }}>
            Abrir admin
          </Link>
        </section>
      ) : (
        <section className="bf-panel bf-admin-profile-panel">
          <h2 className="bf-home-block-title">Activar admin</h2>
          <p className="bf-fantasy-sub">
            Cuenta: <strong>{user.email}</strong>
            <br />
            ID: <code style={{ fontSize: 11 }}>{user.id}</code>
          </p>
          {isOwnerEmail(user.email) ? (
            <p className="bf-fantasy-sub" style={{ marginTop: 8 }}>
              Tu email está en la lista de dueño. Pulsa el botón para guardar permisos en Supabase.
            </p>
          ) : (
            <p className="bf-fantasy-sub" style={{ marginTop: 8 }}>
              En Vercel añade <code>ADMIN_EMAILS</code> y <code>NEXT_PUBLIC_ADMIN_EMAILS</code> con este email,
              haz Redeploy, o ejecuta <code>MAKE_ME_ADMIN.sql</code>.
            </p>
          )}
          <button
            type="button"
            className="bp-btn bp-btn-gold"
            style={{ marginTop: 12 }}
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              setClaimMsg("");
              const res = await fetch("/api/admin/claim", { method: "POST", credentials: "include" });
              const json = await res.json().catch(() => ({}));
              setClaiming(false);
              if (res.ok) {
                setClaimMsg("Admin activado. Recargando…");
                await refreshProfile();
                window.location.href = "/admin";
              } else {
                setClaimMsg(json.error ?? "No se pudo activar");
              }
            }}
          >
            {claiming ? "Activando…" : "Activar panel admin"}
          </button>
          {claimMsg && <p className="bf-auth-error" style={{ marginTop: 10 }}>{claimMsg}</p>}
        </section>
      )}
    </div>
  );
}

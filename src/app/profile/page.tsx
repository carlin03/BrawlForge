"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { teams } from "@/lib/data";

export default function ProfilePage() {
  const { profile, user, loading } = useAuth();
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
    </div>
  );
}

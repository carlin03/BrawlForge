"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  ChevronRight,
  Flame,
  LogOut,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { PlayerCardMini } from "@/components/platform/PlayerCard";
import { RegionBadge } from "@/components/ui/RegionBadge";
import { isBuiltinOwnerEmail, isOwnerEmail } from "@/lib/admin-access";
import { buildFallbackProfile } from "@/lib/profile-fallback";
import {
  DEFAULT_FANTASY_TOURNAMENT,
  getCompetitiveTeamSlugs,
  getTeam,
  teams,
} from "@/lib/data";

export function ProfileView() {
  const { profile, user, loading, isAdmin, refreshProfile, signOut } = useAuth();
  const { game } = useGame();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [ign, setIgn] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [profileError, setProfileError] = useState("");

  const effectiveProfile = profile ?? (user ? buildFallbackProfile(user) : null);
  const profilePending = Boolean(user && !profile && !loading);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/profile");
  }, [loading, user, router]);

  useEffect(() => {
    if (effectiveProfile) {
      setDisplayName(effectiveProfile.displayName);
      setIgn(effectiveProfile.ign);
    }
  }, [effectiveProfile?.displayName, effectiveProfile?.ign]);

  const clubOptions = useMemo(() => {
    const slugs = new Set(getCompetitiveTeamSlugs());
    const list = teams.filter((t) => slugs.has(t.slug));
    const q = clubSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.slug.includes(q),
    );
  }, [clubSearch]);

  const favoriteTeam = effectiveProfile?.favoriteTeamSlug
    ? getTeam(effectiveProfile.favoriteTeamSlug)
    : null;
  const fantasyEntry = game?.fantasy?.[DEFAULT_FANTASY_TOURNAMENT];
  const squad = fantasyEntry?.squad ?? [];
  const predictAttempts = game?.predictAttempts ?? 0;
  const predictCorrect = game?.predictCorrect ?? 0;
  const accuracy =
    predictAttempts > 0 ? Math.round((predictCorrect / predictAttempts) * 100) : null;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : null;

  async function saveProfile(patch: { displayName?: string; ign?: string; favoriteTeamSlug?: string | null }) {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      const msg = json.error ?? "No se pudo guardar";
      setSaveMsg(msg);
      setProfileError(msg);
      return;
    }
    setSaveMsg("Guardado");
    setProfileError("");
    await refreshProfile();
    setTimeout(() => setSaveMsg(""), 2500);
  }

  async function saveIdentity() {
    await saveProfile({ displayName, ign });
  }

  async function pickClub(slug: string) {
    const next = effectiveProfile?.favoriteTeamSlug === slug ? null : slug;
    await saveProfile({ favoriteTeamSlug: next });
  }

  if (loading || !user) {
    return (
      <div className="bf-profile-page bf-page-ultra bf-profile-premium">
        <div className="bf-profile-skeleton">
          <div className="bf-profile-skeleton-hero" />
          <div className="bf-profile-skeleton-stats" />
          <div className="bf-profile-skeleton-panel" />
        </div>
      </div>
    );
  }

  if (!effectiveProfile) {
    return (
      <div className="bf-profile-page bf-page-ultra bf-profile-premium">
        <div className="bf-profile-error-panel">
          <p>No se pudo cargar tu perfil.</p>
          <button type="button" className="bf-profile-btn is-gold" onClick={() => void refreshProfile()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const initials = (effectiveProfile.ign || effectiveProfile.displayName).slice(0, 2).toUpperCase();
  const rankLabel =
    game?.fantasyRank && game.fantasyRank > 0
      ? game.fantasyRank <= 100
        ? "Élite BSC"
        : game.fantasyRank <= 500
          ? "Competitivo"
          : "En ascenso"
      : "Rookie";

  return (
    <div className="bf-profile-page bf-page-ultra bf-motion-page bf-profile-premium">
      {profilePending && (
        <p className="bf-profile-sync-banner" role="status">
          Sincronizando tu cuenta con el servidor…
        </p>
      )}
      {profileError && <p className="bf-profile-sync-banner is-err">{profileError}</p>}

      <header className="bf-profile-hero bf-profile-hero-premium">
        <div className="bf-profile-hero-bg" aria-hidden>
          <span className="bf-profile-hero-orb bf-profile-hero-orb-gold" />
          <span className="bf-profile-hero-orb bf-profile-hero-orb-blue" />
          <span className="bf-profile-hero-orb bf-profile-hero-orb-red" />
        </div>
        <div className="bf-profile-hero-inner">
          <div className="bf-profile-identity">
            <div className="bf-profile-avatar-wrap">
              {effectiveProfile.favoriteTeamSlug ? (
                <TeamLogo slug={effectiveProfile.favoriteTeamSlug} size={88} glow />
              ) : (
                <span className="bf-profile-avatar-lg">{initials}</span>
              )}
              {isAdmin && (
                <span className="bf-profile-admin-badge" title="Administrador">
                  <Shield size={12} />
                </span>
              )}
            </div>
            <div className="bf-profile-identity-copy">
              <p className="bf-profile-kicker">
                <Sparkles size={14} aria-hidden />
                Perfil BrawlForge
              </p>
              <h1 className="bf-profile-name">{effectiveProfile.displayName}</h1>
              <p className="bf-profile-meta">
                <span className="bf-profile-ign-tag">@{effectiveProfile.ign}</span>
                {memberSince && <span> · Desde {memberSince}</span>}
              </p>
              <span className="bf-profile-tier-badge">{rankLabel}</span>
              <p className="bf-profile-email">{user.email}</p>
              {favoriteTeam && (
                <Link href={`/teams/${favoriteTeam.slug}`} className="bf-profile-fav-club">
                  <TeamLogo slug={favoriteTeam.slug} size={28} glow={false} />
                  <span>{favoriteTeam.name}</span>
                  <RegionBadge region={favoriteTeam.region} />
                </Link>
              )}
            </div>
          </div>
          <div className="bf-profile-hero-actions">
            <Link href="/fantasy" className="bf-profile-btn is-gold">
              <Sparkles size={16} />
              Mi plantilla
            </Link>
            <Link href="/predictions" className="bf-profile-btn is-blue">
              <Target size={16} />
              Predicciones
            </Link>
            <button type="button" className="bf-profile-btn is-ghost" onClick={() => signOut()}>
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <section className="bf-profile-stats" aria-label="Estadísticas">
        <article className="bf-profile-stat is-gold">
          <Trophy size={18} className="bf-profile-stat-icon" aria-hidden />
          <b>{game?.fantasyPoints ?? 0}</b>
          <span>Puntos fantasy</span>
        </article>
        <article className="bf-profile-stat is-blue">
          <Users size={18} className="bf-profile-stat-icon" aria-hidden />
          <b>{game?.fantasyRank ? `#${game.fantasyRank.toLocaleString()}` : "—"}</b>
          <span>Ranking global</span>
        </article>
        <article className="bf-profile-stat is-red">
          <Target size={18} className="bf-profile-stat-icon" aria-hidden />
          <b>{game?.predictPoints ?? effectiveProfile.predictPoints}</b>
          <span>Puntos votos</span>
        </article>
        <article className="bf-profile-stat is-fire">
          <Flame size={18} className="bf-profile-stat-icon" aria-hidden />
          <b>{game?.predictStreak ?? effectiveProfile.predictStreak}</b>
          <span>Racha actual</span>
        </article>
        {accuracy !== null && (
          <article className="bf-profile-stat is-neutral bf-profile-stat-wide">
            <Check size={18} className="bf-profile-stat-icon" aria-hidden />
            <b>{accuracy}%</b>
            <span>
              Aciertos ({predictCorrect}/{predictAttempts})
            </span>
          </article>
        )}
      </section>

      <div className="bf-profile-grid">
        <section className="bf-profile-panel">
          <div className="bf-profile-panel-head">
            <h2>Datos del jugador</h2>
            <p>Nombre visible en rankings y fantasy</p>
          </div>
          <div className="bf-profile-form">
            <label className="bf-profile-field">
              <span>Nombre</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={48}
                autoComplete="nickname"
              />
            </label>
            <label className="bf-profile-field">
              <span>IGN</span>
              <input
                type="text"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                maxLength={32}
                autoComplete="username"
              />
            </label>
            <div className="bf-profile-form-actions">
              <button
                type="button"
                className="bf-profile-btn is-gold"
                disabled={saving}
                onClick={() => void saveIdentity()}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              {saveMsg && <span className={`bf-profile-save-msg ${saveMsg === "Guardado" ? "is-ok" : "is-err"}`}>{saveMsg}</span>}
            </div>
          </div>
        </section>

        <section className="bf-profile-panel">
          <div className="bf-profile-panel-head">
            <h2>Plantilla BSC</h2>
            <p>{fantasyEntry?.teamName ?? "Sin equipo registrado"}</p>
          </div>
          {squad.length > 0 ? (
            <>
              <div className="bf-profile-squad">
                {squad.map((slot) => (
                  <PlayerCardMini
                    key={slot.playerSlug}
                    playerSlug={slot.playerSlug}
                    isCaptain={slot.isCaptain}
                  />
                ))}
              </div>
              <p className="bf-profile-squad-pts">
                <strong>{fantasyEntry?.totalPoints ?? 0}</strong> pts en el torneo
              </p>
            </>
          ) : (
            <p className="bf-profile-empty">
              Aún no tienes plantilla. Arma tu trio para el circuito BSC 2026.
            </p>
          )}
          <Link href="/fantasy" className="bf-profile-link-row">
            Gestionar plantilla
            <ChevronRight size={16} />
          </Link>
        </section>

        <section className="bf-profile-panel bf-profile-panel-wide">
          <div className="bf-profile-panel-head">
            <h2>Club favorito</h2>
            <p>Aparece en tu avatar y en el menú superior</p>
          </div>
          <input
            type="search"
            className="bf-profile-club-search"
            placeholder="Buscar equipo BSC…"
            value={clubSearch}
            onChange={(e) => setClubSearch(e.target.value)}
            aria-label="Buscar club"
          />
          <div className="bf-profile-club-grid">
            {clubOptions.map((t) => {
              const selected = effectiveProfile.favoriteTeamSlug === t.slug;
              return (
                <button
                  key={t.slug}
                  type="button"
                  className={`bf-profile-club-tile ${selected ? "is-selected" : ""}`}
                  disabled={saving}
                  onClick={() => void pickClub(t.slug)}
                  title={t.name}
                >
                  <TeamLogo slug={t.slug} name={t.name} size={44} glow={selected} />
                  <span className="bf-profile-club-tag">{t.tag}</span>
                  {selected && <span className="bf-profile-club-check"><Check size={12} /></span>}
                </button>
              );
            })}
          </div>
          {effectiveProfile.favoriteTeamSlug && (
            <button
              type="button"
              className="bf-profile-clear-club"
              disabled={saving}
              onClick={() => void pickClub(effectiveProfile.favoriteTeamSlug!)}
            >
              Quitar club favorito
            </button>
          )}
        </section>

        <section className="bf-profile-panel">
          <div className="bf-profile-panel-head">
            <h2>Accesos rápidos</h2>
          </div>
          <nav className="bf-profile-quick">
            <Link href="/rankings" className="bf-profile-quick-item">
              <Trophy size={18} />
              <span>Rankings</span>
              <ChevronRight size={16} />
            </Link>
            <Link href="/matches" className="bf-profile-quick-item">
              <Calendar size={18} />
              <span>Partidos</span>
              <ChevronRight size={16} />
            </Link>
            <Link href="/teams" className="bf-profile-quick-item">
              <Users size={18} />
              <span>Equipos</span>
              <ChevronRight size={16} />
            </Link>
            <Link href="/predictions" className="bf-profile-quick-item">
              <Target size={18} />
              <span>Predicciones</span>
              <ChevronRight size={16} />
            </Link>
          </nav>
        </section>

        {isAdmin ? (
          <section className="bf-profile-panel bf-profile-panel-admin">
            <div className="bf-profile-panel-head">
              <h2>
                <Shield size={18} />
                Administración
              </h2>
              <p>Catálogo, logos y noticias</p>
            </div>
            <div className="bf-profile-admin-actions">
              <Link href="/admin?tab=logos" className="bf-profile-btn is-gold">
                Editar logos
              </Link>
              <Link href="/admin" className="bf-profile-btn is-ghost">
                Panel completo
              </Link>
            </div>
          </section>
        ) : (
          <section className="bf-profile-panel bf-profile-panel-admin">
            <div className="bf-profile-panel-head">
              <h2>Activar admin</h2>
              <p className="bf-profile-admin-email">{user.email}</p>
            </div>
            {isBuiltinOwnerEmail(user.email) ? (
              <p className="bf-profile-admin-hint">
                Cuenta de dueño. Usa el botón o el SQL en Supabase si Vercel aún no tiene la última versión.
              </p>
            ) : isOwnerEmail(user.email) ? (
              <p className="bf-profile-admin-hint">Tu email está autorizado. Pulsa para guardar permisos.</p>
            ) : (
              <p className="bf-profile-admin-hint">
                Añade tu email en <code>ADMIN_EMAILS</code> (Vercel) o ejecuta el SQL en Supabase.
              </p>
            )}
            {isBuiltinOwnerEmail(user.email) && (
              <details className="bf-profile-sql-details">
                <summary>Atajo SQL (Supabase)</summary>
                <pre>{`update public.profiles\nset is_admin = true\nwhere id = '${user.id}';`}</pre>
              </details>
            )}
            <button
              type="button"
              className="bf-profile-btn is-gold"
              disabled={claiming}
              onClick={async () => {
                setClaiming(true);
                setClaimMsg("");
                const res = await fetch("/api/admin/claim", { method: "POST", credentials: "include" });
                const json = await res.json().catch(() => ({}));
                setClaiming(false);
                if (res.ok) {
                  setClaimMsg("Admin activado. Redirigiendo…");
                  await refreshProfile();
                  window.location.href = "/admin";
                } else {
                  setClaimMsg(json.error ?? "No se pudo activar");
                }
              }}
            >
              {claiming ? "Activando…" : "Activar panel admin"}
            </button>
            {claimMsg && <p className="bf-profile-save-msg is-err">{claimMsg}</p>}
          </section>
        )}
      </div>
    </div>
  );
}

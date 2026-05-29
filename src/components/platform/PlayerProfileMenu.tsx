"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, LogOut, Shield, Sparkles, Target, Trophy, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { buildFallbackProfile } from "@/lib/profile-fallback";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function PlayerProfileMenu() {
  const { profile, user, signOut, loading, isAdmin } = useAuth();
  const { game } = useGame();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 16 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const effectiveProfile = profile ?? (user ? buildFallbackProfile(user) : null);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({
      top: r.bottom + 8,
      right: Math.max(12, window.innerWidth - r.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function goProfile() {
    setOpen(false);
    if (pathname !== "/profile") router.push("/profile");
  }

  if (loading) {
    return <div className="bf-nav-auth bf-nav-auth-loading" aria-hidden>…</div>;
  }

  if (!user) {
    return (
      <div className="bf-nav-auth">
        <Link href="/login" className="bf-nav-auth-btn">
          Entrar
        </Link>
        <Link href="/registro" className="bf-nav-auth-btn is-primary">
          Crear cuenta
        </Link>
      </div>
    );
  }

  const display = effectiveProfile?.displayName ?? user.email?.split("@")[0] ?? "Jugador";
  const fantasyPts = game?.fantasyPoints ?? effectiveProfile?.fantasyPoints ?? 0;
  const fantasyRank = game?.fantasyRank ?? effectiveProfile?.fantasyRank ?? 0;
  const predictPts = game?.predictPoints ?? effectiveProfile?.predictPoints ?? 0;
  const initials = (effectiveProfile?.ign || display).slice(0, 2).toUpperCase();
  const onProfilePage = pathname === "/profile";

  const dropdown = open ? (
    <div
      ref={menuRef}
      className="bf-profile-dropdown bf-profile-dropdown-fixed bf-profile-dropdown-premium"
      role="menu"
      style={{ top: coords.top, right: coords.right }}
    >
      <button type="button" className="bf-profile-dropdown-cta" onClick={goProfile}>
        <span className="bf-profile-dropdown-cta-icon">
          <User size={18} />
        </span>
        <span className="bf-profile-dropdown-cta-copy">
          <strong>Ver tu perfil</strong>
          <span>Estadísticas, club y datos</span>
        </span>
        <ChevronRight size={18} aria-hidden />
      </button>

      <div className="bf-profile-dropdown-head">
        <div className="bf-profile-dropdown-head-row">
          {effectiveProfile?.favoriteTeamSlug ? (
            <TeamLogo slug={effectiveProfile.favoriteTeamSlug} size={40} glow={false} />
          ) : (
            <span className="bf-profile-dropdown-avatar">{initials}</span>
          )}
          <div>
            <strong>{effectiveProfile?.ign ?? display}</strong>
            <span>{display}</span>
            {user.email && <span className="bf-profile-hint">{user.email}</span>}
          </div>
        </div>
      </div>

      <div className="bf-profile-dropdown-stats">
        <div className="bf-profile-dropdown-stat">
          <b>{fantasyPts}</b>
          <span>Fantasy pts</span>
        </div>
        <div className="bf-profile-dropdown-stat">
          <b>{fantasyRank ? `#${fantasyRank.toLocaleString()}` : "—"}</b>
          <span>Ranking</span>
        </div>
        <div className="bf-profile-dropdown-stat">
          <b>{predictPts}</b>
          <span>Votos pts</span>
        </div>
        <div className="bf-profile-dropdown-stat">
          <b>{effectiveProfile?.predictStreak ?? 0}</b>
          <span>Racha</span>
        </div>
      </div>

      <div className="bf-profile-dropdown-divider" />

      <Link href="/profile" className="bf-profile-dropdown-item" onClick={() => setOpen(false)}>
        <User size={16} /> Mi perfil
      </Link>
      <Link href="/fantasy" className="bf-profile-dropdown-item" onClick={() => setOpen(false)}>
        <Sparkles size={16} /> Mi plantilla
      </Link>
      <Link href="/predictions" className="bf-profile-dropdown-item" onClick={() => setOpen(false)}>
        <Target size={16} /> Predicciones
      </Link>

      {isAdmin && (
        <Link href="/admin?tab=logos" className="bf-profile-dropdown-item is-admin" onClick={() => setOpen(false)}>
          <Shield size={16} /> Editar logos
        </Link>
      )}

      <div className="bf-profile-dropdown-divider" />

      <button type="button" className="bf-profile-dropdown-item is-danger" onClick={() => signOut()}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  ) : null;

  return (
    <div className="bf-profile-menu">
      <div
        ref={triggerRef}
        className={`bf-profile-trigger-wrap ${open ? "is-open" : ""} ${onProfilePage ? "is-on-page" : ""}`}
      >
        <button
          type="button"
          className="bf-profile-trigger-main"
          onClick={goProfile}
          aria-label="Ver tu perfil"
          title="Ver tu perfil"
        >
          {effectiveProfile?.favoriteTeamSlug ? (
            <TeamLogo slug={effectiveProfile.favoriteTeamSlug} size={32} glow={false} />
          ) : (
            <span className="bf-profile-avatar">{initials}</span>
          )}
          <span className="bf-profile-trigger-text">
            <span className="bf-profile-ign">{effectiveProfile?.ign ?? display}</span>
            <span className="bf-profile-sub">
              {fantasyPts} pts · #{fantasyRank ? fantasyRank.toLocaleString() : "—"}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="bf-profile-trigger-chevron"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => {
              if (!v) requestAnimationFrame(updatePosition);
              return !v;
            });
          }}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Opciones de cuenta"
        >
          <ChevronDown size={16} className={open ? "is-open" : ""} />
        </button>
      </div>

      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

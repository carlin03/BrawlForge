"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { TeamLogo } from "@/components/ui/TeamLogo";

export function PlayerProfileMenu() {
  const { profile, user, signOut, loading } = useAuth();
  const { game } = useGame();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 16 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const display = profile?.displayName ?? user.email?.split("@")[0] ?? "Jugador";
  const fantasyPts = game?.fantasyPoints ?? profile?.fantasyPoints ?? 0;
  const fantasyRank = game?.fantasyRank ?? profile?.fantasyRank ?? 0;
  const predictPts = game?.predictPoints ?? profile?.predictPoints ?? 0;
  const initials = display.slice(0, 2).toUpperCase();

  const dropdown = open ? (
    <div
      ref={menuRef}
      className="bf-profile-dropdown bf-profile-dropdown-fixed"
      role="menu"
      style={{ top: coords.top, right: coords.right }}
    >
      <div className="bf-profile-dropdown-head">
        <strong>{display}</strong>
        <span>
          Fantasy #{profile?.fantasyRank.toLocaleString() ?? "—"} · Votos {profile?.predictPoints ?? 0} pts
        </span>
      </div>

      <Link href="/profile" className="bf-profile-dropdown-item" onClick={() => setOpen(false)}>
        <User size={16} /> Mi perfil
      </Link>
      <Link href="/fantasy" className="bf-profile-dropdown-item" onClick={() => setOpen(false)}>
        <Settings size={16} /> Mi plantilla
      </Link>

      {profile?.isAdmin && (
        <Link href="/admin" className="bf-profile-dropdown-item is-admin" onClick={() => setOpen(false)}>
          <Shield size={16} /> Panel admin
        </Link>
      )}

      <button type="button" className="bf-profile-dropdown-item" onClick={() => signOut()}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  ) : null;

  return (
    <div className="bf-profile-menu">
      <button
        ref={triggerRef}
        type="button"
        className={`bf-profile-trigger ${open ? "is-open" : ""}`}
        onClick={() => {
          setOpen((v) => {
            if (!v) requestAnimationFrame(updatePosition);
            return !v;
          });
        }}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {profile?.favoriteTeamSlug ? (
          <TeamLogo slug={profile.favoriteTeamSlug} size={32} glow={false} />
        ) : (
          <span className="bf-profile-avatar">{initials}</span>
        )}
        <span className="bf-profile-trigger-text">
          <span className="bf-profile-ign">{profile?.ign ?? display}</span>
          <span className="bf-profile-sub">{fantasyPts} pts</span>
        </span>
        <ChevronDown size={16} className={open ? "is-open" : ""} />
      </button>

      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

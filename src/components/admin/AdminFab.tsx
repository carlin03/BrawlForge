"use client";

import Link from "next/link";
import { Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Botón flotante solo para administradores (logueado + isAdmin) */
export function AdminFab() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading || !isLoggedIn || !isAdmin) return null;

  return (
    <Link
      href="/admin?tab=logos"
      className="bf-admin-fab"
      title="Editar logos y panel admin"
      aria-label="Editar logos — panel de administración"
    >
      <Image size={20} aria-hidden />
      <span>Logos</span>
    </Link>
  );
}

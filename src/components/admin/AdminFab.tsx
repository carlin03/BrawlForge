"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Botón flotante solo para administradores (logueado + isAdmin) */
export function AdminFab() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading || !isLoggedIn || !isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="bf-admin-fab"
      title="Panel de administración"
      aria-label="Abrir panel de administración"
    >
      <Shield size={20} aria-hidden />
      <span>Admin</span>
    </Link>
  );
}

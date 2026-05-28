"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Botón flotante solo para administradores */
export function AdminFab() {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn || !isAdmin) return null;

  return (
    <Link href="/admin" className="bf-admin-fab" title="Panel de administración">
      <Shield size={20} />
      <span>Admin</span>
    </Link>
  );
}

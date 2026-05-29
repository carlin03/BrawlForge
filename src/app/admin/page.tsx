import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdmin } from "@/lib/admin-access";

export const metadata = {
  title: "Admin — BrawlForge",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const demoAdmin = process.env.NEXT_PUBLIC_DEMO_ADMIN === "true";

  if (!supabase && !demoAdmin) {
    redirect("/login");
  }

  let isAdmin = demoAdmin;
  let userEmail: string | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !demoAdmin) redirect("/login?next=/admin");
    if (user) {
      userEmail = user.email ?? null;
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      isAdmin = resolveIsAdmin(userEmail, Boolean(profile?.is_admin));
    }
  }

  if (!isAdmin) {
    return (
      <div className="bf-auth-page">
        <div className="bf-auth-card" style={{ maxWidth: 480 }}>
          <h1>Sin acceso admin</h1>
          <p className="bf-auth-lead">
            Inicia sesión con tu cuenta y activa admin en Supabase o en Vercel.
          </p>
          {userEmail && (
            <p className="bf-fantasy-sub" style={{ marginTop: 12 }}>
              Tu email: <strong>{userEmail}</strong>
            </p>
          )}
          <ol className="bf-fantasy-rules" style={{ textAlign: "left", marginTop: 16 }}>
            <li>
              Vercel → <code>ADMIN_EMAILS</code> y <code>NEXT_PUBLIC_ADMIN_EMAILS</code> = tu email → Redeploy
            </li>
            <li>
              Entra de nuevo y visita <a href="/profile">/profile</a> → Activar panel admin
            </li>
            <li>O ejecuta <code>supabase/MAKE_ME_ADMIN.sql</code> en SQL Editor</li>
          </ol>
          <a href="/profile" className="bp-btn bp-btn-gold" style={{ display: "inline-block", marginTop: 16 }}>
            Ir a mi perfil
          </a>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="bf-auth-page">Cargando panel…</div>}>
      <AdminConsole />
    </Suspense>
  );
}

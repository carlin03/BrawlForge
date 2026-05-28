import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { createClient } from "@/lib/supabase/server";

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

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !demoAdmin) redirect("/login");
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      isAdmin = Boolean(profile?.is_admin) || demoAdmin;
    }
  }

  if (!isAdmin) {
    return (
      <div className="bf-auth-page">
        <p className="bf-auth-warn">No tienes permisos de administrador.</p>
        <p className="bf-fantasy-sub">
          Contacta al administrador del sitio para activar permisos en tu cuenta.
        </p>
      </div>
    );
  }

  return <AdminConsole />;
}

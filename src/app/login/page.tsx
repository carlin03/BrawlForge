import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export default function LoginPage() {
  if (!hasSupabaseConfig()) redirect("/?preview=public");

  return (
    <Suspense fallback={<div className="bf-auth-page">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isOwnerEmail, resolveIsAdmin } from "@/lib/admin-access";
import { getCachedFavoriteTeamSlug, setCachedFavoriteTeamSlug } from "@/lib/profile-club-storage";

export interface PlayerProfile {
  id: string;
  displayName: string;
  ign: string;
  favoriteTeamSlug: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  fantasyPoints: number;
  fantasyRank: number;
  predictPoints: number;
  predictStreak: number;
}

type AuthContextValue = {
  user: User | null;
  profile: PlayerProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  supabaseReady: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Actualiza perfil en memoria al instante (p. ej. club favorito en nav). */
  patchProfile: (patch: Partial<PlayerProfile>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(user: User, row: Record<string, unknown> | null): PlayerProfile {
  return {
    id: user.id,
    displayName: (row?.display_name as string) || user.email?.split("@")[0] || "Jugador",
    ign: (row?.ign as string) || (row?.display_name as string) || "Player",
    favoriteTeamSlug: (row?.favorite_team_slug as string) || null,
    avatarUrl: (row?.avatar_url as string) || null,
    isAdmin: Boolean(row?.is_admin),
    fantasyPoints: 0,
    fantasyRank: 0,
    predictPoints: Number(row?.predict_points ?? 0),
    predictStreak: Number(row?.predict_streak ?? 0),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const supabaseReady = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(supabaseReady);
  const adminClaimAttempted = useRef(false);

  const loadProfile = useCallback(
    async (u: User | null) => {
      if (!supabase || !u) {
        setProfile(null);
        return;
      }

      const meta = u.user_metadata as Record<string, string> | undefined;
      const displayName = meta?.display_name || u.email?.split("@")[0] || "Jugador";
      const ign = meta?.ign || displayName;

      const fullSelect =
        "id, display_name, ign, favorite_team_slug, avatar_url, is_admin, predict_points, predict_streak, predict_correct, predict_attempts";
      let { data, error } = await supabase.from("profiles").select(fullSelect).eq("id", u.id).maybeSingle();

      if (error?.message?.includes("predict_")) {
        ({ data, error } = await supabase
          .from("profiles")
          .select("id, display_name, ign, favorite_team_slug, avatar_url, is_admin")
          .eq("id", u.id)
          .maybeSingle());
      }

      if (error) {
        console.error("[auth] profiles select:", error.message);
      }

      if (!data) {
        const { data: created, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: u.id, display_name: displayName, ign })
          .select()
          .single();

        if (insertError) {
          console.error("[auth] profiles insert:", insertError.message);
        } else {
          data = created;
        }
      }

      let mapped = mapProfile(u, data as Record<string, unknown> | null);
      const cachedClub = getCachedFavoriteTeamSlug();
      if (!mapped.favoriteTeamSlug && cachedClub) {
        mapped = { ...mapped, favoriteTeamSlug: cachedClub };
      }
      if (mapped.favoriteTeamSlug) {
        setCachedFavoriteTeamSlug(mapped.favoriteTeamSlug);
      }
      setProfile(mapped);

      if (!mapped.isAdmin && isOwnerEmail(u.email) && !adminClaimAttempted.current) {
        adminClaimAttempted.current = true;
        void fetch("/api/admin/claim", { method: "POST", credentials: "include" })
          .then(async (res) => {
            if (res.ok) await loadProfile(u);
          })
          .catch(() => {
            adminClaimAttempted.current = false;
          });
      }
    },
    [supabase],
  );

  const syncSession = useCallback(
    async (sessionUser: User | null) => {
      setUser(sessionUser);
      if (sessionUser) {
        await loadProfile(sessionUser);
      } else {
        setProfile(null);
      }
    },
    [loadProfile],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      await syncSession(session?.user ?? null);
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      void syncSession(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, syncSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Supabase no configurado. Añade las variables en .env.local" };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) await loadProfile(data.user);
      return {};
    },
    [supabase, loadProfile],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) return { error: "Supabase no configurado" };
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim(), ign: displayName.trim() },
          emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
        },
      });
      if (error) return { error: error.message };
      if (data.session?.user) await loadProfile(data.session.user);
      return data.session ? {} : { needsEmailConfirmation: true };
    },
    [supabase, loadProfile],
  );

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Supabase no configurado" };
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: origin ? `${origin}/auth/callback?next=/login/nueva-contrasena` : undefined,
      });
      return error ? { error: error.message } : {};
    },
    [supabase],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (!supabase) return { error: "Supabase no configurado" };
      if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
      const { error } = await supabase.auth.updateUser({ password });
      return error ? { error: error.message } : {};
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    adminClaimAttempted.current = false;
    setCachedFavoriteTeamSlug(null);
  }, [supabase]);

  const patchProfile = useCallback((patch: Partial<PlayerProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const isAdmin = resolveIsAdmin(user?.email ?? null, Boolean(profile?.isAdmin));

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoggedIn: Boolean(user),
      isAdmin,
      loading,
      supabaseReady,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshProfile: async () => {
        if (user) await loadProfile(user);
      },
      patchProfile,
    }),
    [user, profile, isAdmin, loading, supabaseReady, signIn, signUp, requestPasswordReset, updatePassword, signOut, loadProfile, patchProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth dentro de AuthProvider");
  return ctx;
}

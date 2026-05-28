# Desplegar BrawlForge

## 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (BrawlForge usa `bkxxykztewquhnimpjgc`).
2. SQL Editor → pega y ejecuta **`supabase/ALL_IN_ONE_SETUP.sql`** (recomendado; incluye perfiles, catálogo, fantasy, predicciones y RLS). Alternativa: cada archivo en `supabase/migrations/` en orden.
3. Authentication → activa Email (y Google si quieres “Continuar con Google”).
4. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (en producción, tu dominio).
   - Redirect URLs: `http://localhost:3000/auth/callback` y `https://tu-dominio.vercel.app/auth/callback`.
5. Para probar registro rápido en local: Authentication → Providers → Email → desactiva **Confirm email** (opcional en producción).
6. Storage (opcional): bucket público `logos` para overrides.
7. Dashboard → **API** → copia **Project URL** y clave **anon / publishable** (`sb_publishable_...` o `eyJ...`) a `.env.local`. No uses `sb_secret_` en el front.
8. `npm run supabase:check` en local para validar.

Hacerte admin:

```sql
update public.profiles set is_admin = true where id = 'TU-USER-UUID';
```

## 2. Variables locales

```bash
cp .env.example .env.local
```

## 3. Logos

```bash
npm run logos:bsc
npm run logos:brand
npm run logos:tournaments
```

## 4. Vercel

1. Importa el repo en [vercel.com](https://vercel.com).
2. Root: vacío si el repo es solo BrawlForge (package.json en la raíz).
3. Añade las variables de `.env.example`.
4. Deploy.

Si falla con **"Function exceeds 300mb"**: sube el commit que **elimina** `src/app/api/logos/tournaments/[slug]` y `teams/[slug]`. En Vercel → Deployments → **Redeploy** del último commit (no el fallido). `.vercelignore` excluye `public/logos`.

## 5. Panel admin

- Con `NEXT_PUBLIC_DEMO_ADMIN=true` → `/admin` sin login.
- Con Supabase + `is_admin` → `/admin` tras iniciar sesión en `/login` o `/registro`.

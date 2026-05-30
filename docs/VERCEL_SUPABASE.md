# Vercel + Supabase (producción)

Si en **https://brawlforge.vercel.app/login** aparece error de conexión o no deja iniciar sesión, casi siempre faltan variables en Vercel (no en tu PC).

## 1. Comprobar

Abre: `https://brawlforge.vercel.app/api/supabase/status`

- `"message":"Servicio no configurado"` → **no hay** `NEXT_PUBLIC_SUPABASE_*` en Vercel.
- `"connected":true` y tablas OK → el problema es otro (redirect URL, contraseña, etc.).

## 2. Añadir variables en Vercel

Dashboard → proyecto **brawlforge** → **Settings** → **Environment Variables**

Copia desde tu `.env.local` (mismos valores):

| Variable | Entornos |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |
| `NEXT_PUBLIC_DEMO_ADMIN` | Production (`false`) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Production |
| `ADMIN_EMAILS` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (solo servidor, **no** marcar como expuesta) |

## 3. Redeploy obligatorio

Las variables `NEXT_PUBLIC_*` se embeben en el **build**. Después de guardarlas:

**Deployments** → último deploy → **Redeploy** (o `npx vercel deploy --prod --yes`).

## 4. Supabase Auth (redirects)

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://brawlforge.vercel.app`
- **Redirect URLs:**  
  `https://brawlforge.vercel.app/auth/callback`  
  `https://brawlforge.vercel.app/**`  
  (y `http://localhost:3000/auth/callback` para desarrollo local)

## 5. SQL en Supabase

Ejecuta en el SQL Editor (en orden si hace falta):

1. `supabase/APPLY_CMS_ALL.sql`
2. `supabase/ACTIVATE_CMS_PRODUCTION.sql`

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

Si ves **`infinite recursion detected in policy for relation "profiles"`** o el admin no carga jugadores/logs:

1. **`supabase/FIX_RLS_RECURSION_AND_ADMIN.sql`** — pégalo entero en SQL Editor y Run (arregla RLS + admin).

Luego, si aún faltan módulos CMS:

2. `supabase/APPLY_CMS_ALL.sql`
3. `supabase/ACTIVATE_CMS_PRODUCTION.sql`

## 6. APIs admin (no todo es manual)

| Recurso | API | Importar desde código local |
|---------|-----|------------------------------|
| **Partidos** | `GET/POST/PATCH /api/cms/admin/matches` · `PUT` importa calendario web | Admin → Partidos → «Importar partidos de la web» |
| **Equipos** | `GET/POST/DELETE /api/admin/teams` · `PUT` importa 50 clubes BSC | Admin → Equipos → botón si hay pendientes |
| **Jugadores** | `GET/POST/DELETE /api/admin/players` · `PUT` importa plantillas BSC | Admin → Jugadores → botón si hay pendientes |
| Torneos / noticias | `/api/admin/catalog` (global, solo esos tipos) | CSV o edición manual |

Servicios en `src/lib/services/catalog/` (`teams-catalog-svc`, `players-catalog-svc`, `matches-catalog-svc`).

## 7. Automatización Supercell (partidos en vivo)

| Variable | Uso |
|----------|-----|
| `CRON_SECRET` | Bearer para `/api/cron/sync-matches` (cada 3 min en Vercel si `vercel.json` tiene cron) |

Admin → Partidos → **Sincronizar Supercell** llama `POST /api/cms/admin/matches/sync-supercell`.

Reglas: mismo torneo + equipos + día → **UPDATE** (no duplica). Mapas/brawlers/predicciones del admin **no se sobrescriben**. Solo estado, marcador y meta `sync`.

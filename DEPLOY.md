# BrawlForge — Vercel + Supabase (siempre al día)

Producción: **https://brawl-forge-delta.vercel.app**  
Repo: **carlin03/BrawlForge** · Supabase: **bkxxykztewquhnimpjgc**

---

## Checklist después de cada cambio de código

1. En local: `npm run build` (y `npm run supabase:check` si tocaste SQL o auth).
2. Commit + push a `main`:
   ```bash
   git add -A
   git commit -m "tu mensaje"
   git push origin main
   ```
3. Vercel despliega solo al recibir el push (1–3 min). Revisa **Deployments** → último = **Ready**.
4. Si cambiaste variables en Vercel o Supabase Auth → **Redeploy** manual (Settings no redeployan solas).
5. Prueba producción: `/`, `/login`, `/fantasy`, `/teams`, `/admin` (con admin activo).

---

## 1. Supabase (una vez + cuando falten tablas)

1. [supabase.com](https://supabase.com) → proyecto `bkxxykztewquhnimpjgc`.
2. **SQL Editor** → ejecuta todo **`supabase/ALL_IN_ONE_SETUP.sql`** (idempotente).
3. **Authentication** → Email (+ Google opcional).
4. **URL Configuration**:
   - Site URL: `https://brawl-forge-delta.vercel.app`
   - Redirect URLs:
     - `https://brawl-forge-delta.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
5. **API** → copia URL + clave **anon** (`eyJ...`) — nunca `sb_secret_` en el front.

### Hacerte admin (solo tú)

Edita y ejecuta **`supabase/MAKE_ME_ADMIN.sql`** con tu email, o:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'tu@email.com' limit 1);
```

Tras eso: cerrar sesión y volver a entrar → botón **Admin** abajo a la derecha y en el menú del avatar.

### Comprobar en local

```bash
cp .env.example .env.local   # rellena ANON_KEY
npm run supabase:check
```

---

## 2. Vercel — variables obligatorias

Copia desde **`VERCEL_ENV.txt`** → Vercel → **Settings → Environment Variables** (Production + Preview):

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bkxxykztewquhnimpjgc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave **anon** `eyJ...` de Supabase |
| `NEXT_PUBLIC_DEMO_ADMIN` | `false` |

`vercel.json` ya define `SKIP_LOGO_DOWNLOAD=1` (sin descargar miles de PNG en build).

Tras cambiar cualquier `NEXT_PUBLIC_*` → **Deployments → Redeploy**.

---

## 3. Local

```bash
npm install
npm run dev
```

Logos locales (opcional, no van a Git): `npm run logos:bsc`

---

## 4. Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| Build 506 MB / función enorme | Último `main` sin rutas `api/logos/*/[*]`; `.vercelignore` excluye `public/logos` |
| Login / invalid supabaseUrl | URL = `https://bkxxykztewquhnimpjgc.supabase.co`, no la URL de Vercel |
| Sin botón Admin | `is_admin = true` en `profiles` + sesión nueva |
| Fantasy no guarda | Ejecutar `ALL_IN_ONE_SETUP.sql` (tablas `fantasy_entries`, `fantasy_squad_slots`) |
| Logos vacíos en Vercel | Normal sin PNG locales; usan CDN (Taiyoro/Wikimedia) |
| Deploy viejo | Redeploy del último commit **Ready**, no uno fallido |

---

## 5. Catálogo en Supabase (opcional)

```bash
SUPABASE_SERVICE_ROLE_KEY=... npm run supabase:seed:catalog
```

Solo en tu PC; la service role no va a Vercel.

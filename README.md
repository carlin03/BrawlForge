# BrawlForge

Fantasy, predicciones y datos BSC 2026 (Next.js 16 + Supabase).

## Supabase (obligatorio para auth y datos de usuario)

1. Proyecto: `bkxxykztewquhnimpjgc` (o el tuyo).
2. **SQL Editor** → pega y ejecuta todo `supabase/ALL_IN_ONE_SETUP.sql` (idempotente).
3. **Authentication** → Email (y Google opcional). Redirect: `http://localhost:3000/auth/callback` y tu URL de Vercel `/auth/callback`.
4. Copia variables a `.env.local` desde `.env.example` (anon key desde Dashboard → API).
5. Comprobar: `npm run supabase:check`
6. Volcar catálogo JSON a DB (opcional): `SUPABASE_SERVICE_ROLE_KEY=... npm run supabase:seed:catalog`
7. Hacerte admin: ver `supabase/RUN_IN_SUPABASE_admin.sql`

Migraciones individuales en `supabase/migrations/` si prefieres aplicar por partes.

## Local

```bash
npm install
cp .env.example .env.local   # rellena NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Logos locales (opcional, no van a Git): `npm run logos:bsc`

Móvil en la misma red: `npm run dev:mobile` → `http://<tu-ip>:3000/m`

## Deploy

Ver [DEPLOY.md](./DEPLOY.md). Repo: `carlin03/BrawlForge`.

`public/logos/` está en `.gitignore` (miles de PNG); la app usa URLs remotas (Liquipedia, etc.).

## Estructura útil (Cursor / móvil)

| Ruta | Qué es |
|------|--------|
| `src/app/` | Páginas App Router |
| `src/lib/supabase/` | Cliente, middleware, game server |
| `src/lib/data/` | JSON BSC 2026, equipos, fantasy |
| `supabase/` | SQL todo-en-uno + migraciones |
| `scripts/` | sync Liquipedia, seed, check Supabase |

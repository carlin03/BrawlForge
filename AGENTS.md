<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BrawlForge — guía para agentes (Cursor IA)

Proyecto Next.js en `brawlforge/`. Producción: https://brawl-forge-delta.vercel.app

## Partidos (`/matches`)

- **Siempre** `getMatchPool()` o `cms.matchPool` en componentes cliente; no usar solo `import { matches }`.
- Próximos del calendario: `src/lib/data/bsc-upcoming-predictions.ts` (cuartos, semis, gran final June MF, Challengers, etc.).
- Histórico: `generated/bsc-tournaments-enriched.json` (todo `finished`).
- Filtros hub: `src/lib/data/matches-hub.ts` — alias torneo, orden por ronda, secciones playoff.
- Admin/CMS: tabla `matches_catalog`, flag `cms.matches.enabled`.

## Predicciones / bracket

- Cuartos → semis → final: `buildPlayoffBracket` + `PredictionsRoundSections.tsx`.
- Stages: `getMatchStageMeta` en `match-stage-meta.ts`.

## Equipos

- Catálogo activo: `bsc-2026-active-teams.ts` + Supabase `teams_catalog` si CMS equipos activo.
- Si un equipo no está en catálogo, sus partidos **no salen** en listados públicos.

## Deploy

Ver `.cursor/rules/deploy-vercel-supabase.mdc`: build, commit y push a `main` tras cambios de código (salvo que el usuario diga lo contrario).

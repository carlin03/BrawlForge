# Si ves muchos errores — lista rápida

## 1. Supabase incompleto (lo más habitual)

**Síntomas:** registro falla, votos/fantasy no guardan, aviso amarillo en `/login`.

**Solución:**

1. [SQL Editor](https://supabase.com/dashboard) → New query.
2. Copia **todo** [ALL_IN_ONE_SETUP.sql](https://raw.githubusercontent.com/carlin03/BrawlForge/main/supabase/ALL_IN_ONE_SETUP.sql) → Run.
3. En el PC: `npm run supabase:check` (debe salir todo OK).
4. Recarga la web.

## 2. Claves mal puestas

| Correcto | Incorrecto |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` = `https://bkxxykztewquhnimpjgc.supabase.co` | `brawl-forge-delta.ve`, sin `https://`, con comillas |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` = publishable / anon | `sb_secret_` o service_role en Vercel |

Si el log dice **Invalid supabaseUrl**: edita la variable URL en Vercel (sin comillas, URL completa).

Tras cambiar `.env.local`: **reinicia** `npm run dev`.

## 3. Vercel no despliega / 506 MB

- Variables iguales que arriba en Vercel → Settings → Environment Variables.
- Deploy del **último** commit en `main`, no un deploy viejo en rojo.

## 4. Logos rotos en local

Normal si no descargaste PNG. La web usa URLs remotas. Opcional: `npm run logos:bsc`.

## 5. Comprobar la web en el PC

```bash
cd brawlforge
npm run build
npm run supabase:check
npm run dev
```

Si `build` y `supabase:check` pasan, el código está bien; lo que falla suele ser configuración (pasos 1–2).

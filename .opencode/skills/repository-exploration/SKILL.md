---
name: repository-exploration
description: Exploración del repositorio de Pineda y Asociados. Usar para mapear rutas App Router, localizar fuentes de verdad (data/, lib/), encontrar imports, rutas dinámicas, cron, webhooks, scripts o verificar qué tocar antes de eliminar/mover archivos (R19). No usar para editar.
---

# Exploración del repositorio

Mapeo canónico:

```
app/(public)/   Web pública (blog, FAQ, landings)
app/intranet/   Panel privado SGIE + Admin (auth JWT)
app/api/        Endpoints REST (auth, contacto, chat, SGIE, cron)
lib/            Motor de cálculo (rules/v1), DB, auth, seo, rag, chat
components/     UI pública + admin + blog
data/           Fuentes canónicas (delitos, códigos, categorías, landings)
scripts/        Scripts operativos
tools/          CI + herramientas de validación
tests/          Vitest + Playwright
drizzle/        Migraciones + seeds
docs/           Documentación técnica
```

## Fuentes de verdad (AGENTS.md §2)

- Blog → `lib/blog-db.ts` · Categorías → `data/blog/categories.ts`
- FAQ → `lib/faq-db.ts` · Delitos CP → `data/delitos.json`
- Schema DB → `lib/schema.ts` · Config sitio → `lib/site.ts`
- Códigos → `data/codigo_trabajo.json` etc. · Áreas → `data/areas-juridicas.ts`

## Procedimiento

1. Identificar el archivo o subsistema objetivo.
2. Leer el archivo (nunca asumir contenido).
3. Buscar imports, rutas dinámicas (`[slug]`), cron (`api/cron`), webhooks y
   referencias en scripts/tests antes de eliminar o mover (R19).
4. Verificar si existe un índice derivado (p. ej. `embeddings`) que dependa de
   la fuente primaria.

## Validaciones

- `grep` de rutas y símbolos; lectura de `package.json` para scripts.
- `git log --oneline -10` para contexto reciente.

## Anti-patrones

- Asumir contenido por el nombre del archivo.
- Borrar código muerto sin verificar imports/rutas/scripts/tests.

## Detenerse y pedir intervención

- Estructura ambigua o fuente de verdad duplicada sin confirmar.

---
name: neon-drizzle
description: Base de datos Neon PostgreSQL + Drizzle del proyecto. Usar para cambios de schema, migraciones aditivas, consultas, índices, transacciones, concurrencia, aislamiento staging/production y rollback. No ejecuta migraciones ni escribe en bases remotas.
---

# Neon PostgreSQL + Drizzle — Pineda y Asociados

## Fuente de verdad

Schema en `lib/schema.ts`; migraciones en `drizzle/migrations/`. El journal y
checksums están versionados; no ignorar metadatos.

## Reglas

- Cambios aditivos y reversibles; `IF NOT EXISTS` donde aplique.
- Concurrencia: `FOR UPDATE SKIP LOCKED` para colas/jobs (patrón del proyecto).
- Aislamiento: staging (`APP_ENV=staging`, Neon staging) separado de producción.
- Nunca ejecutar migraciones de producción ni seeds sin autorización expresa.

## Procedimiento

1. Leer `lib/schema.ts` y las migraciones relacionadas.
2. Proponer/implementar el cambio aditivo.
3. Generar migración con `npx drizzle-kit generate` (solo generación).
4. Validar: `npm run db:migrations:validate` (checksums) + typecheck.

## Validaciones

- `npm run db:migrations:validate`
- `npx tsc --noEmit`
- Para cambios transversales: suite completa (`AGENTS.md` §4).

## Anti-patrones

- `drizzle-kit push` contra producción.
- Migración destructiva sin revisión.
- Confundir índice (`embeddings`) con fuente primaria (R2).

## Detenerse y pedir intervención

- Necesidad de aplicar migración en entorno remoto o de escritura en Neon.

---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Validación en staging — Fase 4B-1 (P2-07)

## Prerrequisitos
- Rama Neon aislada con migraciones 0038–0044 aplicadas.
- Variables en memoria (no en `.env`): `ALLOW_TEST_DATABASE=true`, `E2E_ENV=staging`, `E2E_NEON_BRANCH_*`, `DATABASE_URL` al endpoint aislado.

## Aplicación de migraciones

```bash
# SGIE 0038-0044 (incluye 0044 de P2-07) vía aplicador idempotente:
DATABASE_URL=<aislada> E2E_SKIP_DOTENV=1 node scripts/e2e/apply-fase4-migrations.mjs
# Segunda ejecución: 0 cambios (idempotente).
```

## E2E Fase 4B-1

```bash
node scripts/e2e/fase4b1-e2e.mjs   # requiere guard (rama aislada verificada)
# 16 assertions: setup, flag apagada, activación scoped, preview, confirmación
# parcial, persistencia, idempotencia, conflicto concurrente, readiness,
# resumen invalidado, undo permitido, undo bloqueado, aislamiento, kill switch,
# reconexión, cleanup cero residuos.
```

## Resultado verificado (20-07-2026)

- Rama aislada efímera `fase4b1-cert-validation-20260720` (`br-fancy-glitter-apto74uh`), endpoint `ep-steep-poetry-apijdwfu`. **Eliminada tras la certificación.**
- Migraciones 0038–0044: 7 aplicadas, idempotentes (2ª ejecución 0 cambios).
- E2E Fase 4B-1: **16/16 assertions**, EXIT 0. Cleanup 16 filas, cero residuos.
- Suite local: lint 0, tsc 0, **1113/1113** (3 corridas paralelas estables), build OK, drizzle OK.
- `app/(public)/` y `public/` intactos.

## Resolución de incidencias

- **Preview expirada (409)**: regenerar preview (10 min de caducidad).
- **Conflicto de versión (409)**: otro proceso mutó el documento; regenerar preview y reconfirmar.
- **Idempotency mismatch (409)**: la `idempotencyKey` se reutilizó con una preview distinta; usar key nueva.
- **Reversión denegada**: ventana 72h superada, o hubo cambios posteriores, o el expediente avanzó.
- **Flag apagada (403)**: activar `sgie.documents.bulk_approve` en el scope del expediente.

## Rollback

- Migración 0044: `DROP TABLE document_bulk_approval_items CASCADE; DROP TABLE document_bulk_approvals CASCADE; DROP INDEX documentos_expediente_id_version_idx; ALTER TABLE documentos_expediente DROP COLUMN version; DELETE FROM feature_flags WHERE flag_key='sgie.documents.bulk_approve';` (los enum values no se eliminan sin recrear el type).

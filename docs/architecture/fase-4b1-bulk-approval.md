---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Arquitectura — Fase 4B-1: Aprobación documental en bloque (P2-07)

**Fecha:** 2026-07-20. **Estado:** Implementado y validado (suite 1113/1113 serial + paralela 3×, E2E Neon 16/16, build verde, lint/tsc/drizzle limpios).

## Objetivo

Permitir que un abogado autorizado apruebe varios documentos de un expediente en una operación segura, explicable, idempotente, auditable y parcialmente reversible. El lote no es "todo o nada".

## Componentes

### BulkApprovalService (`lib/sgie/bulk-approval-service.ts`)
- `generarPreview({expedienteId, documentIds}, ctx)`: sin mutaciones. Valida flag, autorización (`documents.approve` + `canAccessCase`), y por documento: estado aprobable, contradicción bloqueante, procesamiento pendiente, confianza crítica. Devuelve `{batchId, previewHash, caducidad, items, totalElegibles, totalNoElegibles}`.
- `confirmarAprobacion({batchId, idempotencyKey, previewHash}, ctx)`: idempotencia por `(expediente, idempotencyKey)`; valida hash + caducidad; re-valida por item; ejecuta cada doc en su propio `UPDATE ... WHERE version=$snapshot` (control optimista). Cascadas: readiness + invalidar resumen + next-action. Auditoría + outbox.
- `consultarResultado(batchId, ctx)`: lee estado + items.
- `revertirAprobacion({batchId, motivo, documentIds?}, ctx)`: solo si segura (< 72h, sin cambios posteriores, expediente no avanzó). No borra historial.

### Feature flag
`sgie.documents.bulk_approve` (deny-by-default, 11ª flag canónica). Activable por scope. Kill switch vía `activateKillSwitch`.

### Migración 0044
- `documentos_expediente.version` (integer, default 1) — control optimista.
- `document_bulk_approvals` + `document_bulk_approval_items`.
- Enum auditoría `documento_bulk_approved`/`documento_bulk_reverted`.
- Seed flag global `false`.

### API
`app/api/sgie/expedientes/[id]/documentos/bulk-approval/`:
- `POST /preview` (Zod body, CSRF, rate-limit 20/min)
- `POST /confirm` (Zod body, rate-limit 10/min)
- `GET /:batchId` (consulta)
- `POST /:batchId/revert` (Zod body, rate-limit 10/min)

Errores HTTP: 400/422 validación, 401 auth, 403 autorización/flag, 404 lote, 409 conflicto/idempotency mismatch/preview stale/expirada, 429 rate-limit, 500 interno.

### UI
`app/intranet/sgie/revision-documental/page.tsx` extendida: agrupación por expediente, checkbox por fila (solo elegibles), "seleccionar todos los elegibles", botón "Aprobar N en bloque" → modal preview → confirmación → resultado individual → deshacer cuando permitido. Respeta flag (oculta selección si no disponible). Accesible por teclado (Escape cierra modal, ARIA).

## Reglas de aprobabilidad

| Condición | Resultado |
|---|---|
| `pendiente_abogado`/`clasificado`/`ia_procesada` | aprobable |
| ya `aprobado` | `ya_aprobado` (informativo) |
| contradicción `bloqueante` activa | `bloque_contradiccion` |
| `procesado_en IS NULL` o `clasificando`/`ocr_pendiente` | `procesamiento_pendiente` |
| tipo crítico + confianza < 60 | `requiere_revision_humana` |
| no pertenece al expediente | `no_encontrado` |
| versión cambió entre preview y confirm | `conflicto_version` |

## Integración con Fase 4A

Tras aprobar/revertir: `recalcularReadinessSiProcede(expedienteId)`, invalidar `case_summary_checkpoints` vigente, `recomendarNextAction({expedienteId})`. Respeta flags y kill switch. Sin llamadas externas en transacciones.

## Validación

- Tests servicio: 31 escenarios (preview, elegibilidad, control optimista, idempotencia, cascadas, reversión).
- Tests API: 10 contrato (HTTP codes, Zod, CSRF, rate-limit).
- Tests UI: 7 (selección, estados aprobables, aislamiento).
- E2E Neon: 16 assertions sobre rama aislada efímera (eliminada, cero residuos).
- Suite completa: 1113/1113 (3 corridas paralelas estables).

## Pendiente Fase 4B (no incluido)

- P2-08 paquete firma + P2-09 firma electrónica (la reversión ya contempla verificar dependencia de firma cuando exista).
- P2-10 calendario externo.
- Retrieval FTS/pg_trgm, copiloto, base de conocimiento.

## Referencias

- [ADR-013: Aprobación documental en bloque](../adr/ADR-013-bulk-document-approval.md)
- [Validación staging Fase 4B-1](../ops/fase-4b1-staging-validation.md)
- [Handoff Fase 4B-1](../handoffs/fase-4b1-bulk-approval.md)

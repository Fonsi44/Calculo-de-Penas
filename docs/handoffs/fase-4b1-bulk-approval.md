# Handoff técnico — Fase 4B-1 P2-07 Aprobación documental en bloque

**Fecha:** 2026-07-20. Commit: `feat(sgie): add safe bulk document approval`.

## Estado

**P2-07 implementado y validado.** Aprobación documental en bloque segura, idempotente, auditable y parcialmente reversible. Deny-by-default vía flag. No es firma electrónica.

## También corregido en esta sesión

- **Test inestable Fase 3**: `tests/fase3-experiencia-operativa.test.ts > WorkQueueService > returns array sorted by priority` fallaba por timeout bajo paralelización. Causa raíz: `await import()` de `lib/schema.ts`+`drizzle-orm` dentro del timer del test (5s) pagaba el coste de carga bajo carga paralela. **Fix**: `beforeAll` precarga los 9 módulos fuera del timer. Suite paralela ahora estable 3×.

## Componentes

- **Migración 0044** (`drizzle/migrations/0044_fase4b1_bulk_approval.sql`): `documentos_expediente.version`, tablas `document_bulk_approvals` + `document_bulk_approval_items`, enum auditoría, seed flag. Idempotente.
- **Schema** (`lib/schema.ts`): `version`, `bulkApprovalEstadoEnumValues`, `bulkApprovalItemResultadoEnumValues`, `documentBulkApprovals`, `documentBulkApprovalItems`.
- **Feature flag**: `sgie.documents.bulk_approve` (11ª flag canónica).
- **Outbox**: `DOCUMENT_APPROVED`, `DOCUMENT_APPROVAL_REVERTED`.
- **Servicio** (`lib/sgie/bulk-approval-service.ts`): `generarPreview`, `confirmarAprobacion`, `consultarResultado`, `revertirAprobacion` + `BulkApprovalError`, `bulkApprovalErrorResponse`.
- **API** (`app/api/sgie/expedientes/[id]/documentos/bulk-approval/`): preview/confirm/status/revert.
- **UI** (`app/intranet/sgie/revision-documental/page.tsx`): selección múltiple + modal.

## Validación

- Tests: servicio 31/31, API 10/10, UI 7/7.
- E2E Neon aislado: 16/16, rama efímera eliminada, cero residuos.
- Suite completa: 1113/1113 (3× paralela), lint 0, tsc 0, build OK, drizzle OK.
- Web pública intacta.

## Pendiente Fase 4B (no iniciado)

- P2-08 paquete firma + P2-09 firma electrónica (la reversión ya contempla verificar dependencia de firma cuando exista).
- P2-10 calendario externo.
- Retrieval FTS/pg_trgm, copiloto, base de conocimiento.

## Referencias

- [ADR-013](../adr/ADR-013-bulk-document-approval.md)
- [Arquitectura Fase 4B-1](../architecture/fase-4b1-bulk-approval.md)
- [Validación staging Fase 4B-1](../operations/fase-4b1-staging-validation.md)

---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# ADR-013: Aprobación documental en bloque (P2-07)

**Fecha:** 2026-07-20. **Estado:** Aceptado.

## Contexto

La revisión documental de un expediente suele implicar varios documentos a la vez (identidad, RTN, comprobante, poder, etc.). Aprobarlos uno por uno es tedioso y propenso a inconsistencias. Se necesita una operación de **aprobación en bloque** que sea segura, explicable, idempotente, auditable y parcialmente reversible.

Requisitos clave (prompt Fase 4B-1):

- El lote **no** es "todo o nada": cada documento se valida y ejecuta individualmente; un documento inválido no impide aprobar los válidos.
- Preview sin mutaciones, con hash/token de confirmación que caduca.
- Validación individual en servidor (acceso, capacidad, estado, contradicciones, procesamiento, confianza, control optimista de versión).
- Idempotencia por `(expediente, idempotencyKey)` con detección de reutilización con payload distinto.
- Reversión segura solo cuando sea jurídicamente posible (sin borrar historial).
- Integración con readiness, resumen incremental y next-action.
- Deny-by-default vía feature flag; kill switch.

## Decisión

Implementar `BulkApprovalService` (`lib/sgie/bulk-approval-service.ts`) con cuatro operaciones: `generarPreview`, `confirmarAprobacion`, `consultarResultado`, `revertirAprobacion`.

### Entidades (migración 0044)

- **`documentos_expediente.version`** (integer, default 1): control optimista por documento. Cada mutación (aprobar/revertir) incrementa la versión; el `UPDATE` condicional `WHERE version=$snapshot` detecta conflictos concurrentes.
- **`document_bulk_approvals`**: cabecera del lote. `idempotency_key` UNIQUE por expediente, `preview_hash`, `estado` (pendiente/confirmada/parcial/revertida/fallida/expirada), `preview_caducidad` (10 min), `correlation_id`, contadores y `resultados` jsonb.
- **`document_bulk_approval_items`**: resultados individuales por documento. `version_snapshot` (capturada en preview), `resultado` (aprobado/ya_aprobado/rechazado_validacion/conflicto_version/no_autorizado/no_encontrado/bloque_contradiccion/procesamiento_pendiente/requiere_revision_humana/error_tecnico/revertido), `motivo`.
- **Feature flag `sgie.documents.bulk_approve`**: deny-by-default global (seed false), activable por scope. Kill switch vía `activateKillSwitch`.
- **Enum auditoría**: `documento_bulk_approved`, `documento_bulk_reverted`.
- **Outbox events**: `document.approved`, `document.approval.reverted`.

### Flujo

```
selección → generarPreview (sin mutar, hash + caducidad)
  → confirmarAprobacion (idempotencia, re-validación, control optimista por doc)
    → por cada doc: UPDATE ... WHERE version=$snapshot
    → auditoría (logSgie + historial) + outbox
    → cascadas: recalcularReadiness + invalidar resumen + recomendarNextAction
  → consultarResultado / revertirAprobacion
```

### Reglas de aprobabilidad

Un documento es **aprobable** si:
- el actor tiene `documents.approve` + `canAccessCase` (re-validado en confirmación);
- su estado es `pendiente_abogado`, `clasificado` o `ia_procesada` (o ya `aprobado` → informativo);
- no está implicado en una contradicción `bloqueante` activa;
- no tiene procesamiento pendiente (`procesado_en IS NULL` o estado `clasificando`/`ocr_pendiente`);
- no es tipo crítico (`demanda`, `poder`, `escrito_inicial`, `querella`, `sentencia`) con confianza IA < 60.

### Reversión segura

Solo si: ventana < 72h, sin cambios posteriores (`version ≤ snapshot+1`), expediente no avanzó de estado, y sin dependencia de firma/paquete (cuando P2-08 exista). No borra historial: inserta decisión compensatoria con `version+1`.

## Consecuencias

- **Positivas**: el abogado aprueba varios documentos en una operación con resultado individual claro; un documento inválido no bloquea el lote; control optimista robusto; idempotencia real; auditoría completa; integración con Fase 4A.
- **Negativas**: la preview caduca a 10 min (debe regenerarse si el usuario tarda); la reversión tiene ventana de 72h.
- **Riesgo**: la flag está deny-by-default; fuera de staging/test no se activa globalmente. El kill switch corta de inmediato.

## Alternativas descartadas

1. **Aprobación uno a uno**: tediosa, sin trazabilidad de lote. Descartada.
2. **Lote transaccional "todo o nada"**: un documento inválido abortaría todo el lote, frustrando al usuario. Descartada por requisito explícito.
3. **Sin control optimista**: dos lotes concurrentes sobre el mismo doc generarían inconsistencias. Descartada.
4. **Tabla de ledger separada (estilo comunicaciones_aprobaciones)**: innecesaria; los resultados viven en `document_bulk_approval_items` y la decisión en `documentos_expediente`. Descartada por simplicidad.

## Referencias

- Implementación: `lib/sgie/bulk-approval-service.ts`
- API: `app/api/sgie/expedientes/[id]/documentos/bulk-approval/`
- UI: `app/intranet/sgie/revision-documental/page.tsx`
- Migración: `drizzle/migrations/0044_fase4b1_bulk_approval.sql`
- Feature flags: `lib/sgie/feature-flags.ts` (`sgie.documents.bulk_approve`)
- Esquema: `document_bulk_approvals`, `document_bulk_approval_items` en `lib/schema.ts`

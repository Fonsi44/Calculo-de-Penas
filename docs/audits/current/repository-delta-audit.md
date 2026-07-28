---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-08-04
supersedes: docs/audits/archive/2026-07-27/repository/auditoria-integral.md
superseded_by: null
---

# Auditoría delta del repositorio

## Estado de referencia

- Rama: `refactor/repository-professionalization`
- HEAD local/remoto y PR #20 al último lote: `ab88a1bf4db89711b5fedb4fc0b84d349a636c07`
- PR #20: abierto, Draft, mergeable; checks remotos verdes para este HEAD.
- Árbol local: contiene cambios SEO preexistentes y evidencias de auditoría sin versionar; se preservan.

## Delta cuantitativo reproducido

| Métrica | Snapshot 2026-07-27 | HEAD actual |
|---|---:|---:|
| Archivos | 3197 | 3199 |
| Carpetas | 722 | 740 |
| Markdown | 286 | 298 |
| Scripts bajo `scripts/` | 268 (243 activos + 25 archivados) | 117 |
| Migraciones SQL | 56 | 60 |
| Journal Drizzle | 39 | 39 |
| Migraciones manuales manifestadas | 0 | 21 |
| Grupos duplicados exactos | 39 | 62 |
| Espacio duplicado | 3.49 MiB | 49.79 MiB |

Contra el inventario histórico: **240 rutas añadidas**, **238 ausentes**, **52 modificadas** y **2907 byte-idénticas**. Las evidencias entregadas sin versionar no entran en estos conteos.

## Reconciliación por prioridad histórica

| Prioridad | Snapshot | Sin cambio de bytes | Modificada | Ausente |
|---|---:|---:|---:|---:|
| P0 | 23 | 17 | 5 | 1 |
| P1 | 190 | 96 | 6 | 88 |
| P2 | 226 | 172 | 8 | 46 |
| P3 | 2758 | 2622 | 33 | 103 |

“Modificada” o “ausente” no equivale a resuelta. El ledger exige commit, evidencia actual y prueba reproducible antes de `DONE_VERIFIED`.

## Evidencia ejecutable inicial

- `npm run check:fast`: pasa; higiene emite 6 advertencias por las evidencias suministradas y `test-results/`; lint registra 2 warnings en `.local/`; TypeScript pasa.
- Suite focalizada P0: 11 archivos, 209 tests, todos verdes.
- Migraciones: 39 Drizzle + 21 manuales = 60; manifiesto y checksums presentes.
- DB preflight: `publicDrift=0`, seeds contractuales equivalentes, baseline
  39+21 aplicado y segunda ejecución idempotente.
- Checks remotos del PR #20: GitGuardian, CI completa, Lighthouse y Vercel Preview verdes sobre el mismo HEAD.

## Pendiente de recalcular antes del cierre de Fase 0

- reachability runtime/test/script con resolución actual;
- controles de las rutas API y clasificación completa;
- referencias de assets incluyendo DB autorizada;
- enlaces Markdown vivos;
- dependencias/exports mediante knip;
- imports no resueltos de tooling;
- clasificación contractual de las divergencias de schema y seeds.

El JSON reproducible detallado está en `.local/repository-delta-audit.json`. Esta auditoría es incremental y se actualizará tras cada lote.

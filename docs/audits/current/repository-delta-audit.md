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
- HEAD local/remoto y PR #20 al último lote técnico: `f59b0597bebdaf67c8292d43f0a5a242659bd2fb`.
- PR #20: abierto y Draft; los checks remotos se vuelven a ejecutar por cada lote.
- Árbol local: conserva únicamente los dos cambios SEO preexistentes del usuario.

## Delta cuantitativo reproducido

| Métrica | Snapshot 2026-07-27 | HEAD actual |
|---|---:|---:|
| Archivos | 3197 | 3206 |
| Carpetas | 722 | 710 |
| Markdown | 286 | 304 |
| Scripts bajo `scripts/` | 268 (243 activos + 25 archivados) | 97 activos + 24 archivados |
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

## Evidencia ejecutable actual

- `npm run verify`: pasa; 107 archivos y 1.932 tests, build de 350 rutas,
  gobernanza sobre 564 fuentes y Knip por debajo del baseline.
- E2E staging Neon: 111/111; cleanup posterior eliminó 7 usuarios y todas las
  referencias sintéticas.
- Migraciones: 39 Drizzle + 21 manuales = 60; manifiesto y checksums presentes.
- DB preflight: `publicDrift=0`, seeds contractuales equivalentes, baseline
  39+21 aplicado y segunda ejecución idempotente.
- Checks remotos del PR #20: GitGuardian, CI completa, Lighthouse y Vercel Preview verdes sobre el mismo HEAD.

## Cierre de Fase 0

- Matriz de depuración: 280/280 decisiones verificadas.
- Documentación viva: 54 archivos, 0 enlaces locales rotos.
- Assets: 24 referencias DB, 2 contratos URL externos y 14 retirados.
- Knip: 58 archivos, 206 exports, 109 tipos, 0 dependencias no usadas/no
  listadas y 0 imports no resueltos; el baseline no puede aumentar.
- Schema: barrel por dominios, 0 ciclos prohibidos y Drizzle conforme.
- Dependencias: 0 críticas; deuda transitiva documentada en
  `docs/security/dependency-risks.md`.

El JSON reproducible detallado está en `.local/repository-delta-audit.json`. Esta auditoría es incremental y se actualizará tras cada lote.

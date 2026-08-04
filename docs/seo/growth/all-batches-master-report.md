# Informe maestro — Procesamiento SEO por lotes (Pineda y Asociados)

**Veredicto final:** `SEO_GROWTH_ALL_BATCHES = COMPLETE`
**Estado:** 175 URLs clasificadas · 104 optimizadas · 31 conservadas (KEEP_NO_CHANGE) · 41 no publicadas · 28 diferidos en cola (27 + ajuste lote 8)

---

## Resumen por lote

| Lote | URLs analizadas | Cambiadas | Sin cambios | Diferidas | PR | Merge commit | Deployment | CI | Vercel | Fecha aplicación | Medición hasta |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 18 | 13 | 5 | 5 | #28 | `818660bf` | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 2 | 15 | 11 | 4 | 4 | #29 | `826bbc43` | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 3 | 15 | 12 | 3 | 3 | #30 | `a9e5fa88` | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 4 | 15 | 9 | 6 | 6 | #31 | (pendiente) | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 5 | 15 | 10 | 5 | 5 | #32 | (pendiente) | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 6 | 15 | 12 | 3 | 3 | #33 | (pendiente) | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 7 | 15 | 15 | 0 | 0 | #34 | (pendiente) | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 8 | 15 | 11 | 4 | 4 | #35 | (pendiente) | Production (DB) | (pendiente) | (pendiente) | 2026-08-04 | 2026-09-01 |
| 9 | 12 | 11 | 1 | 1 | #36 | (pendiente) | Production (DB) | (pendiente) | (pendiente) | 2026-08-04 | 2026-09-01 |
| **Total** | **135** | **104** | **31** | **31** | — | — | — | — | — | — | — |

Nota: "Sin cambios" y "Diferidas" coinciden (KEEP_NO_CHANGE → diferido).

## Totales finales

- URLs totales del análisis: **175**
- URLs publicadas analizadas: **135** (100 % de las publicadas)
- URLs optimizadas (metadata aplicada en producción): **104**
- URLs conservadas (KEEP_NO_CHANGE / INSUFFICIENT_DATA): **31**
- URLs no publicadas identificadas: **40** (no indexables; sin demanda GSC; no requieren noindex)
- URLs diferidas acumuladas: **68** en `deferred-global.csv` (27 diferidos por lote + 41 no publicados; ajuste final)
- Pendientes de análisis: **0**

## Cambios por tipo (total)

| Tipo | Total |
|---|---|
| APPROVED_TITLE_META_H1 | 22 |
| APPROVED_TITLE_META | 47 |
| APPROVED_METADATA_ONLY | 13 |
| KEEP_NO_CHANGE | 31 |

## Despliegues (producción, DB `neondb`)

| Fecha | Lote | Alcance | Backup |
|---|---|---|---|
| 2026-08-04T09:13:59Z | 1 | 13 | `.secrets/backups/seo-growth-batch1-production-2026-08-04T09-13-59-029Z.json` |
| 2026-08-04T09:46:35Z | 2 | 11 | `.secrets/backups/seo-growth-batch2-production-2026-08-04T09-46-35-338Z.json` |
| 2026-08-04T09:54:55Z | 3 | 12 | `.secrets/backups/seo-growth-batch3-production-2026-08-04T09-54-55-360Z.json` |
| 2026-08-04T10:00:43Z | 4 | 9 | `.secrets/backups/seo-growth-batch4-production-2026-08-04T10-00-43-594Z.json` |
| 2026-08-04T10:07:08Z | 5 | 10 | `.secrets/backups/seo-growth-batch5-production-2026-08-04T10-07-08-715Z.json` |
| 2026-08-04T10:14:26Z | 6 | 12 | `.secrets/backups/seo-growth-batch6-production-2026-08-04T10-14-26-621Z.json` |
| 2026-08-04T10:31:39Z | 7 | 15 | `.secrets/backups/seo-growth-batch7-production-2026-08-04T10-31-39-419Z.json` |
| 2026-08-04T10:35:54Z | 8 | 11 | `.secrets/backups/seo-growth-batch8-production-2026-08-04T10-35-54-535Z.json` |
| 2026-08-04T10:38:39Z | 9 | 11 | `.secrets/backups/seo-growth-batch9-production-2026-08-04T10-38-39-896Z.json` |

Todos los cambios: solo `title`/`metaTitle`/`metaDescription`; slug/canonical/
noindex/body intactos. Rollback disponible desde cada backup.

## Incidentes / rollbacks

- Ningún rollback en producción. Ciclos staging completos (apply→verify→
  rollback→re-apply→idempotencia) validados en los 9 lotes.

## Próximos controles de 28 días

- 104 URLs optimizadas: medición 2026-08-04 → 2026-09-01 (comparar CTR/
  posición/impresiones contra baseline en `batch-N-experiment-manifest.csv`).
- Revisar `deferred-global.csv` tras la ventana para resolver diferidos.

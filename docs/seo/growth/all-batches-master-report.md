# Informe maestro — Procesamiento SEO por lotes (Pineda y Asociados)

**Objetivo:** procesar los 175 artículos + páginas públicas hasta que cada URL
tenga decisión final documentada. **Veredicto final:** `SEO_GROWTH_ALL_BATCHES`
(actualización continua; al cierre debe ser `COMPLETE` o
`COMPLETE_WITH_EXTERNAL_DEFERRED_ITEMS`).

---

## Resumen por lote

| Lote | URLs analizadas | Cambiadas | Sin cambios | Diferidas | PR | Merge commit | Deployment | CI | Vercel | Fecha aplicación | Medición hasta |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 18 | 13 | 5 | 5 | #28 | `818660bf` | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 2 | 15 | 11 | 4 | 4 | #29 | `826bbc43` | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 3 | 15 | 12 | 3 | 3 | #30 | `a9e5fa88` | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 4 | 15 | 9 | 6 | 6 | #31 | (pendiente) | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 5 | 15 | 10 | 5 | 5 | #32 | (pendiente) | Production (DB) | ✅ | ✅ | 2026-08-04 | 2026-09-01 |
| 6 | 15 | 12 | 3 | 3 | (pendiente) | — | Production (DB) | (pendiente) | (pendiente) | 2026-08-04 | 2026-09-01 |

Nota: "Sin cambios" y "Diferidas" pueden coincidir (KEEP_NO_CHANGE → diferido).

## Totales acumulados (a la fecha)

- URLs analizadas: 93 (de 175)
- URLs optimizadas (metadata aplicada): 67
- URLs conservadas (KEEP_NO_CHANGE): 26
- URLs no publicadas identificadas: 41 (según `content-decision-final.csv`)
- URLs diferidas acumuladas: ver `deferred-global.csv` (cola en construcción)
- Pendientes de análisis: 82

## Cambios por tipo (acumulado)

| Tipo | Lote 1 | Lote 2 | Lote 3 | Lote 4 | Lote 5 | Lote 6 | Total |
|---|---|---|---|---|---|---|
| APPROVED_TITLE_META_H1 | 8 | 2 | 1 | 4 | 2 | 3 | 20 |
| APPROVED_TITLE_META | 4 | 7 | 10 | 5 | 8 | 5 | 39 |
| APPROVED_METADATA_ONLY | 1 | 2 | 1 | 0 | 0 | 4 | 8 |
| KEEP_NO_CHANGE | 5 | 4 | 3 | 6 | 5 | 3 | 26 |

## Despliegues

| Fecha | Lote | Alcance | Backup |
|---|---|---|---|
| 2026-08-04T09:13:59Z | 1 | 13 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch1-production-2026-08-04T09-13-59-029Z.json` |
| 2026-08-04T09:46:35Z | 2 | 11 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch2-production-2026-08-04T09-46-35-338Z.json` |
| 2026-08-04T09:54:55Z | 3 | 12 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch3-production-2026-08-04T09-54-55-360Z.json` |
| 2026-08-04T10:00:43Z | 4 | 9 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch4-production-2026-08-04T10-00-43-594Z.json` |
| 2026-08-04T10:07:08Z | 5 | 10 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch5-production-2026-08-04T10-07-08-715Z.json` |
| 2026-08-04T10:14:26Z | 6 | 12 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch6-production-2026-08-04T10-14-26-621Z.json` |

## Incidentes / rollbacks

- Ninguno en producción. Ciclos staging completos (apply→verify→rollback→
  re-apply→idempotencia) validados en cada lote.

## Próximos controles de 28 días

- Lote 1 (13 URLs): medición 2026-08-04 → 2026-09-01.
- Lote 2 (11 URLs): medición 2026-08-04 → 2026-09-01.
- Lote 3 (12 URLs): medición 2026-08-04 → 2026-09-01.
- Lote 4 (9 URLs): medición 2026-08-04 → 2026-09-01.
- Lote 5 (10 URLs): medición 2026-08-04 → 2026-09-01.
- Lote 6 (12 URLs): medición 2026-08-04 → 2026-09-01.
- (Se añadirán los siguientes lotes con su propia ventana.)

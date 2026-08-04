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
| 2 | 15 | 11 | 4 | 4 | (pendiente) | — | Production (DB) | (pendiente) | (pendiente) | 2026-08-04 | 2026-09-01 |

Nota: "Sin cambios" y "Diferidas" pueden coincidir (KEEP_NO_CHANGE → diferido).

## Totales acumulados (a la fecha)

- URLs analizadas: 33 (de 175)
- URLs optimizadas (metadata aplicada): 24
- URLs conservadas (KEEP_NO_CHANGE): 9
- URLs no publicadas identificadas: 41 (según `content-decision-final.csv`)
- URLs diferidas acumuladas: ver `deferred-global.csv` (cola en construcción)
- Pendientes de análisis: 142

## Cambios por tipo (acumulado)

| Tipo | Lote 1 | Lote 2 | Total |
|---|---|---|---|
| APPROVED_TITLE_META_H1 | 8 | 2 | 10 |
| APPROVED_TITLE_META | 4 | 7 | 11 |
| APPROVED_METADATA_ONLY | 1 | 2 | 3 |
| KEEP_NO_CHANGE | 5 | 4 | 9 |

## Despliegues

| Fecha | Lote | Alcance | Backup |
|---|---|---|---|
| 2026-08-04T09:13:59Z | 1 | 13 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch1-production-2026-08-04T09-13-59-029Z.json` |
| 2026-08-04T09:46:35Z | 2 | 11 posts (title/metaTitle/metaDescription) | `.secrets/backups/seo-growth-batch2-production-2026-08-04T09-46-35-338Z.json` |

## Incidentes / rollbacks

- Ninguno en producción. Ciclos staging completos (apply→verify→rollback→
  re-apply→idempotencia) validados en cada lote.

## Próximos controles de 28 días

- Lote 1 (13 URLs): medición 2026-08-04 → 2026-09-01.
- Lote 2 (11 URLs): medición 2026-08-04 → 2026-09-01.
- (Se añadirán los siguientes lotes con su propia ventana.)

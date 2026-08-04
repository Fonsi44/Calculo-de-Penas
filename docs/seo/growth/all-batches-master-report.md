# Informe maestro — Procesamiento SEO por lotes (Pineda y Asociados)

**Veredicto final:** `SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED`
**Estado (reconciliado):** 175 URLs únicas · 135 publicadas analizadas · 104 optimizadas · 23 conservadas (KEEP_NO_CHANGE) · 8 INSUFFICIENT_DATA · 40 no publicadas · 71 filas en cola diferida

> Reconciliación definitiva (2026-08-04): `npm run seo:growth:reconcile` (determinista,
> `SECOND_RUN_DIFF = 0`). Entregables en `docs/seo/growth/final-reconciliation.{json,csv}`,
> `final-duplicate-analysis.csv`, `final-classification-map.csv` y
> `final-reconciliation-report.md`.

---

## Resumen por lote

| Lote      | URLs analizadas | Cambiadas | Sin cambios | Diferidas | PR  | Merge commit | Deployment      | CI  | Vercel | Fecha aplicación | Medición hasta |
| --------- | --------------- | --------- | ----------- | --------- | --- | ------------ | --------------- | --- | ------ | ---------------- | -------------- |
| 1         | 18              | 13        | 5           | 5         | #28 | `818660bf`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 2         | 15              | 11        | 4           | 4         | #29 | `826bbc43`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 3         | 15              | 12        | 3           | 3         | #30 | `a9e5fa88`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 4         | 15              | 9         | 6           | 6         | #31 | `ad6d825f`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 5         | 15              | 10        | 5           | 5         | #32 | `cfcafcda`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 6         | 15              | 12        | 3           | 3         | #33 | `17f1e11d`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 7         | 15              | 15        | 0           | 0         | #34 | `8e9a1ad3`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 8         | 15              | 11        | 4           | 4         | #35 | `6d354f73`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| 9         | 12              | 11        | 1           | 1         | #36 | `27ec1b59`   | Production (DB) | ✅  | ✅     | 2026-08-04       | 2026-09-01     |
| **Total** | **135**         | **104**   | **23**      | **31**    | —   | —            | —               | —   | —      | —                | —              |

Nota: "Sin cambios" = KEEP_NO_CHANGE (23) + INSUFFICIENT_DATA (8) = 31 diferidos
de lote; "Diferidas" = 31 (23 + 8).

## Ecuación de inventario (reconciliada)

```
TOTAL (175) = PUBLISHED (135) + UNPUBLISHED (40)
PUBLISHED (135) = OPTIMIZED (104) + KEEP_NO_CHANGE (23) + INSUFFICIENT_DATA (8) + EXTERNAL_DEFERRED (0)
OPTIMIZED (104) = APPROVED_TITLE_META_H1 (30) + APPROVED_TITLE_META (61) + APPROVED_METADATA_ONLY (13)
```

## Totales finales (reconciliados)

- URLs únicas del análisis: **175** (derivado de identificadores únicos, no de línea de encabezado)
- URLs publicadas analizadas: **135** (100 % de las publicadas)
- URLs optimizadas (metadata aplicada en producción): **104**
- URLs conservadas (KEEP_NO_CHANGE): **23** (metadata alineada y de calidad; sin acción)
- URLs con datos insuficientes (INSUFFICIENT_DATA): **8** (se revisa tras la ventana de 28 días)
- URLs no publicadas: **40** (no indexables; sin demanda GSC; no requieren noindex)
- URLs en cola diferida (`deferred-global.csv`): **71** filas únicas (23 KEEP_NO_CHANGE + 8 INSUFFICIENT_DATA + 40 UNPUBLISHED)
- Pendientes de análisis: **0**
- Duplicados entre lotes: **0** · Solapamientos aprobado/diferido: **0** · Publicado/no publicado: **0** · Sin clasificar: **0**

## Causa del desfase 175/176

La suma errónea **176** = 135 analizadas + 41 no publicadas era un doble conteo de
`empleador-no-paga-salario-honduras`: analizada en el lote 1 **y** marcada
`published=false` en `content-decision-final.csv`, aunque está publicada y optimizada
en producción (201 impresiones GSC). Corregido el flag a `published=true`, el inventario
cierra en **175**: 135 publicadas + 40 no publicadas. El desglose de optimizadas del
informe previo (22+47+13=82) también era erróneo; el correcto derivado de los patches es
30+61+13=104.

## Cambios por tipo (total reconciliado)

| Tipo                   | Total |
| ---------------------- | ----- |
| APPROVED_TITLE_META_H1 | 30    |
| APPROVED_TITLE_META    | 61    |
| APPROVED_METADATA_ONLY | 13    |
| KEEP_NO_CHANGE         | 23    |
| INSUFFICIENT_DATA      | 8     |

## Despliegues (producción, DB `neondb`)

| Fecha                | Lote | Alcance | Backup                                                                        |
| -------------------- | ---- | ------- | ----------------------------------------------------------------------------- |
| 2026-08-04T09:13:59Z | 1    | 13      | `.secrets/backups/seo-growth-batch1-production-2026-08-04T09-13-59-029Z.json` |
| 2026-08-04T09:46:35Z | 2    | 11      | `.secrets/backups/seo-growth-batch2-production-2026-08-04T09-46-35-338Z.json` |
| 2026-08-04T09:54:55Z | 3    | 12      | `.secrets/backups/seo-growth-batch3-production-2026-08-04T09-54-55-360Z.json` |
| 2026-08-04T10:00:43Z | 4    | 9       | `.secrets/backups/seo-growth-batch4-production-2026-08-04T10-00-43-594Z.json` |
| 2026-08-04T10:07:08Z | 5    | 10      | `.secrets/backups/seo-growth-batch5-production-2026-08-04T10-07-08-715Z.json` |
| 2026-08-04T10:14:26Z | 6    | 12      | `.secrets/backups/seo-growth-batch6-production-2026-08-04T10-14-26-621Z.json` |
| 2026-08-04T10:31:39Z | 7    | 15      | `.secrets/backups/seo-growth-batch7-production-2026-08-04T10-31-39-419Z.json` |
| 2026-08-04T10:35:54Z | 8    | 11      | `.secrets/backups/seo-growth-batch8-production-2026-08-04T10-35-54-535Z.json` |
| 2026-08-04T10:38:39Z | 9    | 11      | `.secrets/backups/seo-growth-batch9-production-2026-08-04T10-38-39-896Z.json` |

Todos los cambios: solo `title`/`metaTitle`/`metaDescription`; slug/canonical/
noindex/body intactos. Rollback disponible desde cada backup.

## Incidentes / rollbacks

- Ningún rollback en producción. Ciclos staging completos (apply→verify→
  rollback→re-apply→idempotencia) validados en los 9 lotes.

## Próximos controles de 28 días

- 104 URLs optimizadas: medición 2026-08-04 → 2026-09-01 (comparar CTR/
  posición/impresiones contra baseline en `batch-N-experiment-manifest.csv`).
- Revisar `deferred-global.csv` (71 filas) tras la ventana: resolver 8
  INSUFFICIENT_DATA y confirmar 40 no publicadas.

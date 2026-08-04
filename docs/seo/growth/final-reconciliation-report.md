# Reconciliación final del inventario SEO (lotes 1–9)

**Veredicto:** `SEO_GROWTH_ALL_BATCHES = COMPLETE_RECONCILED`
**Generado:** 2026-08-04T00:00:00.000Z

## Identidad canónica

- Unidad de conteo: `normalized_slug` (minúsculas, sin barras, sin query/fragmento).
- Comprobación secundaria: `canonical_url` (sin protocolo/www, sin barra final).
- Host canónico derivado de `.env.example`: `www.pinedayasociadoshn.com`.

## Ecuaciones verificadas

```
TOTAL (175) = PUBLISHED (135) + UNPUBLISHED (40)
PUBLISHED (135) = OPTIMIZED (104) + KEEP_NO_CHANGE (23) + INSUFFICIENT_DATA (8) + EXTERNAL_DEFERRED (0)
OPTIMIZED (104 = 104) = APPROVED_TITLE_META_H1 (30) + APPROVED_METADATA_ONLY (13) + APPROVED_TITLE_META (61)
```

## Conteos definitivos

| Concepto | Conteo |
|---|---|
| total_unique | 175 |
| published_analyzed | 135 |
| optimized_unique | 104 |
| keep_no_change_unique | 23 |
| insufficient_data_unique | 8 |
| external_deferred_unique | 0 |
| unpublished_unique | 40 |
| measurement_pending_unique | 104 |
| manual_ga4_pending_unique | 0 |
| duplicate_slugs_across_batches | 0 |
| approved_and_deferred_overlap | 0 |
| published_and_unpublished_overlap | 0 |
| unclassified_unique | 0 |

## Desglose de optimización (aprobados)

| Clasificación canónica | Conteo |
|---|---|
| APPROVED_METADATA_ONLY | 13 |
| APPROVED_TITLE_META | 61 |
| APPROVED_TITLE_META_H1 | 30 |

## Desglose de diferidos

| Clasificación canónica | Conteo |
|---|---|
| INSUFFICIENT_DATA | 8 |
| KEEP_NO_CHANGE | 23 |

## Investigación del desfase 175/176

El inventario original declara 175 artículos. La suma errónea "176" aparece si se suma
`135 analizadas + 41 no publicadas`, porque `empleador-no-paga-salario-honduras` estaba
doble-contado: analizada en el lote 1 **y** marcada `published=false` en
`content-decision-final.csv` (aunque está publicada y optimizada en producción, con 201
impresiones GSC). Corregido el flag a `published=true`, el inventario cierra en **175**:
135 publicadas analizadas + 40 no publicadas. El desglose anterior de optimizadas
(22+47+13=82) también era erróneo; el correcto derivado de los patches es
30+61+13=104.

## Duplicados y solapamientos

Ninguno. Todos los slugs son únicos y no hay solapamientos entre aprobado/diferido,
publicado/no publicado ni seleccionado/no publicado.

## Fuentes de verdad

- `batch-1-selection.csv`
- `batch-2-selection.csv`
- `batch-3-selection.csv`
- `batch-4-selection.csv`
- `batch-5-selection.csv`
- `batch-6-selection.csv`
- `batch-7-selection.csv`
- `batch-8-selection.csv`
- `batch-9-selection.csv`
- `batch-1-editorial-review.csv`
- `batch-2-editorial-review.csv`
- `batch-3-editorial-review.csv`
- `batch-4-editorial-review.csv`
- `batch-5-editorial-review.csv`
- `batch-6-editorial-review.csv`
- `batch-7-editorial-review.csv`
- `batch-8-editorial-review.csv`
- `batch-9-editorial-review.csv`
- `batch-1-approved-patch.json`
- `batch-2-approved-patch.json`
- `batch-3-approved-patch.json`
- `batch-4-approved-patch.json`
- `batch-5-approved-patch.json`
- `batch-6-approved-patch.json`
- `batch-7-approved-patch.json`
- `batch-8-approved-patch.json`
- `batch-9-approved-patch.json`
- `batch-1-deferred-patch.json`
- `batch-2-deferred-patch.json`
- `batch-3-deferred-patch.json`
- `batch-4-deferred-patch.json`
- `batch-5-deferred-patch.json`
- `batch-6-deferred-patch.json`
- `batch-7-deferred-patch.json`
- `batch-8-deferred-patch.json`
- `batch-9-deferred-patch.json`
- `batch-1-experiment-manifest.csv`
- `batch-2-experiment-manifest.csv`
- `batch-3-experiment-manifest.csv`
- `batch-4-experiment-manifest.csv`
- `batch-5-experiment-manifest.csv`
- `batch-6-experiment-manifest.csv`
- `batch-7-experiment-manifest.csv`
- `batch-8-experiment-manifest.csv`
- `batch-9-experiment-manifest.csv`
- `content-decision-final.csv`
- `processed-slugs.json`
- `cross-platform-url-analysis.csv`
- `all-batches-master-report.md`


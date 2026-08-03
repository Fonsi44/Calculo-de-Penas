---
status: current
owner: engineering
created: 2026-08-03
last_reviewed: 2026-08-03
review_due: 2026-11-03
supersedes: docs/seo/current/content-roadmap.md
superseded_by: null
---
# Implementación de crecimiento SEO/GEO basado en datos — v1

**Rama:** `feat/seo-growth-data-driven-v1` · **Dominio:** `https://www.pinedayasocioshn.com/`

## Veredicto

```
SEO_GROWTH_IMPLEMENTATION = PARTIAL
```

Análisis completo y decisiones documentadas para los 175 artículos, con lote de
18 URLs priorizado y patch on-page (title/meta/H1) propuesto y validado contra
Production (GET). **No se aplicó escritura en Production DB** (contenido del
blog en `blog_posts`): la aplicación editorial del patch queda pendiente de
flujo YMYL + revisión jurídica y autorización, por regla AGENTS.md §7 y §24.

## Fuentes analizadas

| Fuente | Período | Filas | Estado | Limitaciones |
| --- | --- | --- | --- | --- |
| GSC (collect fresh) | 28/90/180d | 621 clics · 26.491 impresiones (90d) | ok | 180d ≈ 90d (retención de datos) |
| GA4 (collect fresh) | 90d | 883 usuarios | ok | key events no disponibles por URL en el CSV de sesiones |
| Bing (collect fresh) | 54d rastreo | 41 queries oportunidad | ok | CTR/posición no reportados por Bing |
| content-action-plan.csv | 180d | 175 artículos | ok | títulos del plan (DB) |
| gsc-opportunities / cannibalization / ga4-organic | 90/180d | 27/9/141 | ok | — |
| CrUX | — | 0 | SKIPPED_WITH_REASON | sin muestra suficiente |

Se corrigió además un bug del CLI `seo:data collect` (double-parse de
`readLastJson` → GSC reportaba FAIL falsamente).

## Resultados principales

- **CTR:** clusters con CTR < 4% en posición 4–10: pensión alimenticia (pos 4.9),
  sobreseimiento (pos 4–10), nacionalidad (pos 8–10), habeas corpus (pos 10),
  divorcio (pos 10.4, CTR 0.54 %), poder legal (pos 5.5, CTR 1.68 %).
- **Posición:** oportunidades 4–20 en custodia (pos 7.5), reclamar deuda (8.0),
  expropiación (8.3), licencia ambiental (9.6), estafa (9.0).
- **Conversión:** páginas con tráfico orgánico alto y conversión por medir
  (key events por URL pendientes): `/`, `/solicitar-consulta`,
  `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`,
  `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026`.
- **Google/Bing overlap:** rtn honduras, central de riesgo, derecho penal
  (detención/flagrancia) presentes en Bing sin URL dominante clara en Google.
- **Hallazgo:** `empleador-no-paga-salario-honduras` tiene title/meta de
  "Despido Injustificado" (intención desalineada → 0 clics / 201 impresiones).

## URLs modificadas (on-page propuesto, ver batch-1-title-meta-patch.json)

| url | problema | evidencia | cambio | prueba | baseline |
| --- | --- | --- | --- | --- | --- |
| `/blog/derecho-laboral/empleador-no-paga-salario-honduras` | Title desalineado | 201 imp, 0 clics, pos 10.8 | Title/meta/H1 alineados a "no paga salario" | patch manifest + GET 200 | manifest |
| `/blog/derecho-de-familia/divorcio-honduras-guia-completa` | CTR 0.54 % | 1286 imp, pos 10.4 | Title/meta con tipos+requisitos | idem | idem |
| `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` | CTR 1.68 % | 2205 imp, pos 5.5 | Title/meta con tipos y cuándo | idem | idem |
| `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras` | CTR 1.75 % | 913 imp, pos 9.0 | Title/meta con tipos+denuncia | idem | idem |
| `/blog/derecho-de-familia/custodia-hijos-honduras-juez` | CTR 1.86 % | 1293 imp, pos 7.5 | Title/meta con decisión del juez | idem | idem |
| + 13 URLs más del lote | CTR/posición | ver manifest | Title/meta/H1 | idem | idem |

> La aplicación a `blog_posts` (DB) requiere flujo editorial + revisión
> jurídica (YMYL). Se entrega el patch validado listo para aplicar.

## Clasificación final de los 175 artículos

`KEEP` · `UPDATE_COMPLETED` (propuesto) · `EXPAND_COMPLETED` (propuesto) ·
`MERGE_PROPOSED` · `NOINDEX_CONFIRMED` · `KEEP_INDEXABLE` ·
`INSUFFICIENT_TRAFFIC_HISTORY` — ver `content-decision-final.csv`.

## Canibalización

- 9 clusters evaluados (ver `cannibalization-decisions.csv`). Los 3 `MERGE`
  originales (pensión alimenticia, nacionalidad) se clasifican
  `PRIMARY_SECONDARY`/`REPOSITION` **sin redirects** (requieren autorización
  editorial y equivalencia semántica). Canibalización por anclas del mismo
  artículo = `PRIMARY_SECONDARY` (sin acción).

## NOINDEX y DATA_REQUIRED

- 33 `NOINDEX` revisados: la mayoría son artículos **no publicados**
  (no indexables) → `KEEP_INDEXABLE`/`INSUFFICIENT_TRAFFIC_HISTORY`; ninguno
  se aplica a la DB. Ver `noindex-review.csv`.
- 66 `DATA_REQUIRED` reclasificados con datos fresh (demanda, publicación):
  `UPDATE_COMPLETED`/`KEEP_INDEXABLE`/`INSUFFICIENT_TRAFFIC_HISTORY`. Ver
  `content-decision-final.csv`.

## Contenido nuevo

Solo 3 oportunidades con demanda demostrada (ver `new-content-opportunities.csv`):
central de riesgo, RTN/registro tributario, facturación electrónica. No se crean
piezas por volumen ni landings municipales.

## Validaciones

| comando | exit | resultado |
| --- | --- | --- |
| `npm run seo:canonical:check` | 0 | PASS |
| `npm test` (tests nuevos) | 0 | canonical-domain-enforce 4/4 |
| `node scripts/seo-growth-analysis.mjs` | 0 | 175 URLs, lote 18 |
| `node scripts/seo-growth-decisions.mjs` | 0 | CSVs generados |
| `node scripts/seo-growth-onpage-patch.mjs` | 0 | 18 URLs, GET 200 |

(Se ejecutarán lint/typecheck/tests/build/contracts completos en validación
final.)

## Pendientes

- Aplicación editorial del patch a `blog_posts` (YMYL + revisión jurídica +
  autorización).
- Key event `email_click` en GA4 (`REQUIRES_DASHBOARD_ACTION`).
- Medición 28 días del lote tras aplicar (2026-08-03 → 2026-08-31).
- Autorización para posibles redirects/merge (ninguno aplicado).

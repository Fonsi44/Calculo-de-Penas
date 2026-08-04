---
status: current
owner: engineering
created: 2026-08-03
last_reviewed: 2026-08-03
review_due: 2026-11-03
supersedes: docs/audits/seo-data-intelligence-2026-08-03.md
superseded_by: null
---
# Auditoría de crecimiento SEO/GEO basado en datos — v1

**Rama:** `feat/seo-growth-data-driven-v1` · **PR:** draft vs `main`

## Objetivo

Convertir los datos reales de GSC/GA4/Bing en mejoras de alta confianza, sin
auditoría descriptiva sin cambios.

## Datos analizados (fresh 2026-08-03)

- GSC 90d: 621 clics · 26.491 impresiones · pos media 6.2 (28d: 472 clics).
- GA4 90d: 883 usuarios · 1.128 sesiones · 14 key events.
- Bing: 375 consultas · 41 queries con oportunidad.
- Plan de contenido: 175 artículos (KEEP 43 · UPDATE 29 · EXPAND 1 · MERGE 3 ·
  NOINDEX 33 · DATA_REQUIRED 66).

## Hallazgos principales

1. **Desalineación title/URL** en `empleador-no-paga-salario-honduras`
   (title de "Despido Injustificado") → 0 clics / 201 impresiones.
2. **CTR bajo en posición 4–10** en clusters YMYL de alta demanda:
   pensión alimenticia, sobreseimiento, nacionalidad, poder legal, divorcio,
   custodia, estafa.
3. **Canibalización** en 9 clusters; los 3 `MERGE` se mantienen sin redirect
   (decisión editorial).
4. **33 NOINDEX** son mayoritariamente artículos no publicados → no requieren
   noindex; ninguno se aplica a la DB.
5. **66 DATA_REQUIRED** reclasificados con datos fresh.
6. **Bug de tooling corregido:** `seo:data collect` reportaba FAIL para GSC por
   double-parse de `readLastJson`.
7. **Dominio canónico protegido:** gate `seo:canonical:check` + test; se
   corrigieron 49 apariciones del typo en 13 archivos operativos.

## Decisiones clave

- Lote 1: **18 URLs** priorizadas (ver `docs/seo/growth/batch-1-selection.csv`)
  con `priority_score` reproducible (fórmula documentada en
  `scripts/seo-growth-analysis.mjs`).
- Patch on-page propuesto (title/meta/H1) en
  `batch-1-title-meta-patch.json` — **no aplicado a `blog_posts`** (DB
  Production; YMYL; requiere flujo editorial + revisión jurídica).
- Sin redirects, sin noindex aplicado, sin landings municipales nuevas, sin
  contenido nuevo por volumen (solo 3 oportunidades con demanda).
- Autoría corporativa preservada.

## Resultado

```
SEO_GROWTH_IMPLEMENTATION = PARTIAL
```

Capa de análisis, decisión y patch 100 % entregada y validada; la aplicación a
Production DB queda pendiente de autorización editorial/jurídica (regla §24).

## Entregables

`docs/seo/growth/` → cross-platform-url-analysis.csv, batch-1-selection.csv,
batch-1-experiment-manifest.csv, content-decision-final.csv,
cannibalization-decisions.csv, noindex-review.csv,
new-content-opportunities.csv, batch-1-title-meta-patch.json,
implementation-report.md · `docs/audits/seo-growth-data-driven-v1.md`.

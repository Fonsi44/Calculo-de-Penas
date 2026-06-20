# Lighthouse CI — Baseline y thresholds

> **Estado:** thresholds iniciales conservadores (assertion level `warn`, no `error`).
> Se rellenará con valores reales tras los primeros runs en GitHub Actions.

## Propósito

Vigilar Core Web Vitals y scores de Lighthouse en 4 páginas públicas
estratégicas, en cada PR que toque el frontend y diariamente en producción.
Detecta regresiones de performance/accesibilidad/SEO antes de merge.

## Configuración

- **Workflow**: `.github/workflows/lighthouse.yml`
- **Config LHCI**: `lighthouserc.json`
- **Páginas auditadas**: `/`, `/servicios-juridicos`, `/derecho-penal`, `/abogados-en-nacaome`
- **Preset**: `desktop` (las páginas son server-rendered; mobile se audita
  por separado vía los screenshots de `scripts/screenshot-audit.cjs`)
- **Runs por URL**: 3 (estabiliza LCP/CLS)

## Thresholds actuales (escalado de warn → error, 2026-06-20)

> **Política:** tras confirmar el baseline holgado (Performance 100/100, CWV en
> verde), se han escalado `performance`, `seo`, `first-contentful-paint` y
> `cumulative-layout-shift` a `error` para bloquear regresiones reales.
> `largest-contentful-paint` y `total-blocking-time` quedan en `warn` por
> sensibilidad a latencia de red en runners de CI.

| Métrica | Threshold | Nivel | Origen del valor |
|---|---|---|---|
| `categories:performance` | minScore 0.9 | **error** | Baseline 100/100 |
| `categories:accessibility` | minScore 0.9 | warn | Estándar a11y |
| `categories:best-practices` | minScore 0.9 | warn | Estándar |
| `categories:seo` | minScore 0.95 | **error** | Baseline 100/100 |
| `first-contentful-paint` | ≤ 1800ms | **error** | CWV "bueno" Lighthouse |
| `largest-contentful-paint` | ≤ 2500ms | warn | CWV "bueno" Google (era 4000ms) |
| `cumulative-layout-shift` | ≤ 0.1 | **error** | CWV "bueno" Google (era 0.25) |
| `total-blocking-time` | ≤ 600ms | warn | CWV "necesita mejora" |

## Baseline real

Medido en GitHub Actions (run [#27838400980](https://github.com/Fonsi44/Calculo-de-Penas/actions/runs/27838400980), 2026-06-19) contra `localhost:3100` (build de producción local en el runner, sin latencia de red ni TLS).

| Página | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | 100 | 96 | 96 | 100 | 336ms | 740ms | 0.000 | 0ms |
| `/servicios-juridicos` | 100 | 96 | 96 | 100 | 331ms | 705ms | 0.000 | 0ms |
| `/derecho-penal` | 100 | 96 | 96 | 100 | 331ms | 703ms | 0.000 | 0ms |
| `/abogados-en-nacaome` | 100 | 91 | 96 | 100 | 331ms | 660ms | 0.000 | 0ms |

_Última actualización: 2026-06-19 (run #27838400980)._

### Observaciones del baseline

- **Performance 100/100 en las 4 páginas** — el código del sitio es óptimo en local.
- **FCP ~330ms, LCP ~700ms, CLS 0.000, TBT 0ms** — todos muy por debajo de los
  thresholds conservadores definidos. En producción los valores serán ligeramente
  peores por latencia de red, TLS y cold starts de Vercel, pero el margen es amplio.
- **Accessibility 91-96** — hay margen de mejora (el umbral `warn` es 90).
- **Best Practices 96/100** — estable.
- **SEO 100/100** — confirmando que la optimización SEO del sitio es correcta.

### Recomendación de escalado

Dado el baseline tan holgado, **se puede escalar `performance`, `seo` y los CWV
críticos a `error`** en el próximo commit sin riesgo de bloquear PRs:

```json
"categories:performance": ["error", { "minScore": 0.9 }],
"categories:seo": ["error", { "minScore": 0.95 }],
"largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
"first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
"cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
```

Mantener `accessibility` y `best-practices` en `warn` (más sensibles a cambios de
audit entre versiones de Lighthouse).

## Cómo escalar thresholds a `error`

Cuando 3 runs consecutivos en producción pasen el threshold con margen:

1. Editar `lighthouserc.json` → cambiar `"warn"` por `"error"` en la métrica.
2. Ejecutar el workflow manualmente (`workflow_dispatch`) para confirmar.
3. Documentar el cambio aquí con fecha.

## Artefactos

Cada run de CI sube un artifact `lighthouse-report` (retención 14 días) con:
- Reportes HTML de Lighthouse en `.lighthouseci/`
- Log del server (`server.log`) para diagnóstico si algo falla

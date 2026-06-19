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

## Thresholds actuales (assertion level: `warn`)

> **Política:** los thresholds empiezan en `warn` para no bloquear PRs mientras
> recogemos datos reales. Tras 2-3 runs estables en producción, se escalará
> `performance` y los CWV críticos a `error`.

| Métrica | Threshold | Nivel | Origen del valor |
|---|---|---|---|
| `categories:performance` | score | warn | Recolección de baseline |
| `categories:accessibility` | minScore 0.9 | warn | Estándar a11y |
| `categories:best-practices` | minScore 0.9 | warn | Estándar |
| `categories:seo` | minScore 0.9 | warn | El sitio está optimizado SEO |
| `first-contentful-paint` | ≤ 1800ms | warn | CWV "bueno" Lighthouse |
| `largest-contentful-paint` | ≤ 4000ms | warn | CWV "necesita mejora" (conservador) |
| `cumulative-layout-shift` | ≤ 0.25 | warn | CWV "necesita mejora" |
| `total-blocking-time` | ≤ 600ms | warn | CWV "necesita mejora" |

> **Nota sobre LCP ≤ 4000ms:** el umbral oficial "bueno" de Google es ≤ 2500ms.
> Empezamos conservadores (≤ 4000ms = "necesita mejora") porque el sitio
> tiene tráfico bajo y sin datos CrUX reales aún. Escalaremos a 2500ms tras
> confirmar que el baseline lo permite.

## Baseline real (se rellena tras primer run)

| Página | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | _pendiente_ | | | | | | | |
| `/servicios-juridicos` | _pendiente_ | | | | | | | |
| `/derecho-penal` | _pendiente_ | | | | | | | |
| `/abogados-en-nacaome` | _pendiente_ | | | | | | | |

_Última actualización: pendiente de primer run de GitHub Actions._

## Cómo escalar thresholds a `error`

Cuando 3 runs consecutivos en producción pasen el threshold con margen:

1. Editar `lighthouserc.json` → cambiar `"warn"` por `"error"` en la métrica.
2. Ejecutar el workflow manualmente (`workflow_dispatch`) para confirmar.
3. Documentar el cambio aquí con fecha.

## Artefactos

Cada run de CI sube un artifact `lighthouse-report` (retención 14 días) con:
- Reportes HTML de Lighthouse en `.lighthouseci/`
- Log del server (`server.log`) para diagnóstico si algo falla

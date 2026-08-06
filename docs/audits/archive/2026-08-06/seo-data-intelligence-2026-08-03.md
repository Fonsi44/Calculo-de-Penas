# Auditoría SEO/GEO/Datos V2 — Sistema de inteligencia de datos SEO

**Fecha:** 2026-08-03 · **Rama:** `feat/seo-data-intelligence-v2` ·
**Modo:** `AUDITORÍA`/`IMPLEMENTACIÓN` (solo lectura de producción, sin
despliegues, sin merge)

## Veredicto

```
SEO_DATA_INTELLIGENCE = PARTIAL
```

Infraestructura reproducible y 3/4 fuentes con datos reales (GSC, GA4, Bing).
**CrUX sin datos** por volumen insuficiente del origen y la conversión principal
(`contact_form_submit`) no instrumentada. El sistema queda operativo para
medición continua y como base de la estrategia de contenido.

## 1. Objetivo

Instalar una CLI reproducible (`seo:data`) para extraer y consolidar
GSC + GA4 + Bing (+ CrUX cuando haya volumen), verificar el dominio canónico,
auditar producción y producir una estrategia de contenido **basada en datos
reales**, con commits y PR draft. Sin merge a `main`, sin escrituras en
producción, sin IndexNow real, sin borrado de artículos.

## 2. Estado de cada fuente (verificado)

| Fuente | Estado                | Período                        | Datos reales                                                         |
| ------ | --------------------- | ------------------------------ | -------------------------------------------------------------------- |
| GSC    | `ok`                  | 180d (2026-02-04 → 2026-08-03) | 621 clics · 26.491 impresiones · 1.369 filas                         |
| GA4    | `baseline`            | 90d (2026-05-05 → 2026-08-03)  | 881 usuarios · 1.128 sesiones · 14 key events · 141 landing pages    |
| Bing   | `ok` (API Key)        | rastreo 54d                    | 375 consultas · 7.885 páginas rastreadas · 4xx=1.042                 |
| CrUX   | `SKIPPED_WITH_REASON` | 202603–202606                  | 0 filas: origen sin datos en Chrome UX Report (tráfico insuficiente) |

Archivo de estado: `docs/seo/current/data-source-status.json` (regenerable).

## 3. Verificación del dominio canónico

- Canónico: `https://www.pinedayasociadoshn.com` (**con "asociados"**).
- Variante `la variante sin "da" en "asociados"` (typo "asocios") **no resuelve en DNS**
  (NXDOMAIN en 8.8.8.8); se eliminaron los literales con typo del código.
- `scripts/seo-data-config.mjs` exporta `canonicalOrigin()` (lee
  `NEXT_PUBLIC_SITE_URL` de `.env.local` con fallback a `.env.example`) y lo
  reutilizan los colectores y el CLI. Evita regresión del typo.
- Detalle: `docs/seo/current/domain-canonical-audit.md`.

## 4. Auditoría de producción (crawl)

Resultado: **PARTIAL**. 14 URL comprobadas: estado HTTP, canonical, robots,
title, H1.

- 5 segmentos de sitemap OK (pages 6, services 26, blog 155, authors 3,
  local 12).
- 2 avisos de longitud de title (> 60 chars), sin errores críticos.
- Artefactos: `.secrets/seo-data/production-audit.json` +
  `docs/seo/current/production-audit.csv`.

## 5. Auditoría de contenido y estrategia

- Inventario: **175 artículos** clasificados.
- Acciones: **UPDATE 29** · **KEEP 43** · **NOINDEX 33** · **DATA_REQUIRED 66**
  · **MERGE 3** · **EXPAND 1**.
- Oportunidades reales: **27** en GSC (`gsc-opportunities.csv`) · **41** en
  Bing (`bing-opportunities.csv`).
- Entregables: `content-action-plan.csv`, `content-roadmap.md`,
  `ga4-organic-conversions.csv` (141 landings), `gsc-cannibalization.csv` (9).
- Priorización por datos, no por intuición (depende de keyEvents en GA4, ver
  `measurement-plan.md`).

## 6. Plan de medición (hallazgo crítico)

- `contact_form_submit` (conversión principal) **no llega a GA4**: el
  formulario no dispara evento de éxito client-side. `form_start` (67) sí llega.
- Eventos observados reales: `form_start` 67 · `faq_open` 11 ·
  `whatsapp_click` 9 · `consultation_form_view` 3 · `phone_click` 3.
- Plan completo: `docs/seo/current/measurement-plan.md`.

## 7. Infraestructura creada

| Artefacto                                | Descripción                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `scripts/seo-data-config.mjs`            | Config canónica (`canonicalOrigin`, `mask`, `readEnvExampleValue`)                               |
| `scripts/seo-data-cli.mjs`               | CLI `npm run seo:data -- [doctor\|auth\|collect\|audit\|report]`                                 |
| `scripts/seo-data-audit.mjs`             | Crawl de producción (status/canonical/robots/title/H1)                                           |
| `scripts/seo-data-report.mjs`            | Genera CSVs consolidados + `data-source-status.json`                                             |
| `scripts/seo-content-action-plan.mjs`    | Clasifica inventario → plan de acción                                                            |
| `docs/analytics/sql/*.sql` (9)                | Consultas BigQuery versionadas (GSC/GA4/join/decay)                                              |
| `scripts/google-analytics-live.mjs`      | Auth vía service account (`.secrets/ga4-service-account.json`) + autodescubrimiento de propiedad |
| `scripts/bing-webmaster-live.mjs`        | Usa `BING_WEBMASTER_API_KEY` (separada de `INDEXNOW_KEY`)                                        |
| `scripts/google-search-console-live.mjs` | `resolveSiteUrl()` desde `sites.list` (sin literales)                                            |
| `scripts/oauth-url.mjs`                  | Usa `canonicalOrigin()`                                                                          |
| `tests/seo-data-cli.test.ts`             | Tests de config/mask/estados                                                                     |
| `package.json`                           | Scripts `seo:data:*`                                                                             |

## 8. Credenciales y seguridad

- `BING_WEBMASTER_API_KEY` en `.env.local` (no versionado). `INDEXNOW_KEY`
  queda deprecada como credencial Bing (log de advertencia).
- Service account GA4 en `.secrets/ga4-service-account.json` (**gitignored**),
  tipo `service_account`, con clave privada presente. Nunca se imprime su
  contenido.
- Sin valores de secretos en código, commits ni este informe.

## 9. Validación (por ejecutar al cierre del bloque)

- `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
- `npm run seo:data:doctor` · `seo:public-contract` · `seo:runtime-contract`

## 10. Riesgos y limitaciones

- **CrUX:** sin datos del origen → Core Web Vitals por BigQuery público no
  verificable hasta ganar volumen. Clasificar `NO VALIDADO`.
- **GA4 `baseline`:** `measurementId` no poblado en extracción (informativo) y
  conversión principal sin instrumentar (sección 6).
- **Bing 4xx=1.042 / crawlErrors=1.238:** pendiente de clasificar qué URLs
  devuelven error; candidato a informe de seguimiento.
- **Sin merge ni push:** la rama queda lista para PR draft; el merge requiere
  autorización del propietario.

## 11. Siguientes pasos recomendados

1. Instrumentar `contact_form_submit` y marcar eventos clave en GA4.
2. Clasificar los 1.042 errores 4xx de Bing (posible lote de 301/404).
3. Re-optimizar UPDATE/EXPAND con datos de oportunidades (27 GSC + 41 Bing).
4. Mantener ventana de 28 días y revisar `data-source-status.json` en cada
   corrida.

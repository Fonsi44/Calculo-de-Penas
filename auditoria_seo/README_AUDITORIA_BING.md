# Auditoría y Recrawling SEO Bing

Este directorio contiene los reportes, listados de URLs y comprobantes de ejecución correspondientes a la fase de saneamiento y **recrawling en Bing WMT** (y Google Search Console), tras la corrección de errores 4xx.

## Contenido del directorio `recrawl_bing`

- `urls-para-recrawl.csv`: Resultado completo de la validación técnica HTTP. Contiene todas las URLs candidatas y su estatus.
- `urls-no-enviadas.csv`: Subconjunto de URLs que fueron descartadas (por ej. 404 intencionales, meta robots noindex, discrepancias canónicas).
- `urls-enviadas-indexnow.csv`: Subconjunto de URLs que superaron la validación (HTTP 200, indexables) y fueron enviadas a IndexNow.
- `urls-enviadas-indexnow-dryrun.csv`: Versión de prueba previa al envío real.
- `indexnow-submission-log.md`: Registro de los lotes enviados a la API de IndexNow, incluyendo status HTTP 202 (Accepted) y timestamps.
- `checklist-post-recrawl.md`: Tareas de monitoreo programadas a 24h, 72h, 7 días y 14 días.

## Fase de Ejecución: 2026-07-10
Se ejecutaron los scripts `seo-validate-recrawl.mjs` y `seo-submit-indexnow.mjs` para validar y enviar 127 URLs saneadas a IndexNow, mitigando 511 errores 4xx reportados por Bing previamente.

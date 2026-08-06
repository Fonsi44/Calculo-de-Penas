---
status: current
owner: seo
created: 2026-07-09
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Ciclo Mensual de Operaciones SEO (Monthly Ops)

Este documento detalla el procedimiento estándar y repetible para el mantenimiento, medición y optimización mensual del SEO técnico y de contenidos en Pineda y Asociados. Cualquier desarrollador o consultor debe poder ejecutar este ciclo.

## Requisitos Previos
- Estar autenticado con Google y Bing (`npm run auth:google:status` y `npm run auth:bing:status` en verde).
- Si no estás autenticado, corre `npm run auth:google` y `npm run auth:bing`.
- Tener conexión directa a la base de datos de producción (variable `DATABASE_URL` configurada).

## Pasos del Ciclo Mensual

### 1. Extracción y Congelamiento de Datos
1. **Ejecutar `npm run seo:collect`**: Recopila los últimos 28 días de datos vivos desde Google Search Console, Google Analytics 4, Bing Webmaster Tools y herramientas de Health.
2. **Ejecutar `npm run seo:snapshot`**: Congela el estado actual. Este comando automáticamente archivará el snapshot previo en el histórico y calculará las diferencias (Deltas) del periodo actual contra el anterior (crecimiento o caída).

### 2. Análisis del Snapshot (Comparativa)
Abre el archivo `data/seo/seo-snapshot-current.md` y revisa:
- **Google Search Console (GSC)**: ¿Han subido o bajado los clics, las impresiones, el CTR y la posición media? Analiza las top queries y top URLs.
- **Google Analytics 4 (GA4)**: Revisa el flujo de usuarios, las vistas de página y las conversiones orgánicas.
- **Eventos Clave**: Evalúa la interacción con los CTAs orgánicos a través del evento personalizado `seo_blog_cta_click` en GA4 (si ya existe ventana suficiente).

### 3. Saneamiento de Rastreo e Indexación (Bing & Indexability)
1. **Errores de Bing (WMT)**:
   - Ingresa a [Bing Webmaster Tools](https://www.bing.com/webmasters) > SEO > Crawl Information.
   - Exporta el reporte de URLs rotas o con errores (4xx, 5xx) en formato CSV.
   - Guarda el archivo crudo en `data/bing/bing-crawl-errors.csv`.
   - Ejecuta `npm run seo:bing-errors`.
   - Revisa las recomendaciones en `data/seo/bing-crawl-errors-imported.md` y decide qué redirecciones (301) o estados (410) aplicar. Nunca redirijas masivamente a la home.
2. **Auditoría de Indexabilidad**:
   - Ejecuta `npm run seo:indexability`.
   - Revisa `data/seo/url-indexability-audit.md` prestando atención a las "URLs Revisables".
   - Identifica si hay nuevos falsos positivos técnicos, assets mal documentados o URLs que requieren redirección.

### 4. Definición de Acciones
Con base en los datos, define acciones correctivas puntuales:
- **Mejoras de CTR**: Si una URL tiene muchas impresiones y CTR bajo (< 1%), reescribe el `title` o la `metaDescription` para esa página en la base de datos o en `lib/seo.ts`.
- **Contenido**: Si una query empieza a ganar impresiones, asegúrate de que el post correspondiente aborde bien esa intención de búsqueda.
- **Redirecciones**: Aplica los 301s seguros en `next.config.ts`.
- **Enlazado Interno**: Conecta posts relacionados para pasar autoridad.

### 5. Documentación y Cierre
1. Asegúrate de que el proyecto siga sano ejecutando `npm run lint` y `npm run build`.
2. Documenta las decisiones clave, los deltas importantes y las redirecciones ejecutadas en el `CHANGELOG.md` o en un reporte interno de la intranet.
3. Haz un commit atómico con los cambios técnicos y las nuevas configuraciones.

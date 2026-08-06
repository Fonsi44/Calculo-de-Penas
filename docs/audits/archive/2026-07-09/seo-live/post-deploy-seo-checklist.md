# Checklist Post-Deploy SEO

Este checklist es de uso obligatorio inmediatamente después de desplegar en producción las implementaciones de crecimiento orgánico y medición SEO.

## 1. Verificación de Disponibilidad (Status 200)
Comprobar manualmente o vía curl que las siguientes páginas críticas están en línea y no devuelven 404, 500 ni redirects infinitos:
- [ ] Home (`/`)
- [ ] `/servicios-juridicos`
- [ ] `/hondurenos-en-espana`
- [ ] `/solicitar-consulta`
- [ ] `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026`
- [ ] `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`
- [ ] `/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras`

## 2. Archivos Críticos de Rastreo
- [ ] **robots.txt**: Visitar `https://www.pinedayasociadoshn.com/robots.txt`. Verificar que permita el rastreo público (`User-Agent: * Allow: /`) y que `/api`, `/admin`, `/intranet` sigan en `Disallow`.
- [ ] **sitemap.xml**: Visitar `https://www.pinedayasociadoshn.com/sitemap.xml`. Confirmar que carga correctamente (sin errores XML) y contiene las rutas públicas actualizadas.

## 3. Integridad de Metadatos
- [ ] **Canonicals**: Inspeccionar el código fuente (Ctrl+U) en las páginas prioritarias. Confirmar que la etiqueta `<link rel="canonical" href="...">` apunta a `https://www.pinedayasociadoshn.com/...` (sin duplicidades de dominio, sin HTTP plano, usando www).

## 4. Medición y Analítica
- [ ] **Test de CTA SEO**: 
  1. Ingresar a uno de los 3 posts prioritarios.
  2. Hacer clic en el CTA internacional añadido ("¿Necesitas resolver este tema legal desde el extranjero?").
  3. Revisar en **Google Analytics 4 > Admin > DebugView** (o Realtime) que el evento `seo_blog_cta_click` se dispara correctamente.
  4. Validar que viajen los parámetros: `cta_location`, `destination_url`, `source_url`, `cta_topic`.

## 5. Acciones en Consolas de Búsqueda
- [ ] **Google Search Console (GSC)**: Re-enviar el `sitemap.xml` si hubo cambios drásticos de estructura.
- [ ] **Bing Webmaster Tools (WMT)**: Re-enviar el `sitemap.xml` para acelerar el discovery.
- [ ] **Inspección de URL**: Someter las 3 URLs de posts prioritarios a la herramienta "Inspeccionar URL" en GSC y solicitar indexación si la fecha de último rastreo es antigua.

## 6. Monitoreo Diferido
- [ ] **A las 48-72 horas**: Revisar GSC > "Páginas" y Bing WMT > "Crawl Errors" para confirmar que no han aparecido nuevos errores 4xx o 5xx derivados del despliegue.
- [ ] **A los 28 días**: Ejecutar el pipeline mensual:
  ```bash
  npm run seo:doctor
  npm run seo:collect
  npm run seo:snapshot
  ```
  Comparar el delta de `seo-snapshot-current.md` con el histórico para evaluar el impacto real (GSC Clicks/Impressions, GA4 Views) de las optimizaciones implementadas.

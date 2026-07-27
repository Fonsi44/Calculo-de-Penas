# Checklist Post-Recrawl Bing (IndexNow)

**Fecha de ejecución:** 2026-07-10
**URLs enviadas:** 127
**Método:** IndexNow API (`api.indexnow.org`)

Este documento detalla los pasos de control y validación técnica que deben seguirse para confirmar que Bing ha procesado correctamente las señales de recrawling.

## Control a las 24-72 horas (Revisión rápida)

- [ ] Entrar a **Bing Webmaster Tools > IndexNow**.
- [ ] Verificar que el dashboard de IndexNow muestra actividad reciente (picos de URLs enviadas que correspondan a la cantidad de 127 URLs).
- [ ] Entrar a **Bing Webmaster Tools > URL Inspection**.
- [ ] Inspeccionar 3-5 URLs de muestra que antes eran 404 (ej. `/blog/tributario/abogados-en-choluteca` que ya no se enviaron pero fueron detectadas, y las redirecciones nuevas si aplicaron).
- [ ] Inspeccionar 3-5 URLs de muestra que fueron corregidas.
- [ ] **Acción:** No reenviar nada. Solo observar si el estado pasó de "Error" a "Descubierta" o "Rastreada".

## Control a los 7 días (Revisión seria)

- [ ] Ejecutar el comando local `npm run seo:collect` para refrescar los datos live de la API de Bing WMT.
- [ ] Revisar el archivo `data/bing/bing-live.json`.
- [ ] Verificar si la métrica de **`crawlErrors`** (errores de rastreo) ha disminuido significativamente respecto al valor base (780).
- [ ] Verificar si los **`code4xx`** (errores 404) han disminuido respecto al valor base (511).
- [ ] **Acción:** Si algunas URLs clave siguen marcadas con error en WMT pero devuelven HTTP 200 real, enviarlas manualmente a través de la sección **Submit URLs** en el panel de Bing (límite diario).

## Control a los 14-21 días (Validación consolidada)

- [ ] Ejecutar una re-auditoría completa del estado de indexación.
- [ ] Exportar nuevamente desde el dashboard de Bing WMT los reportes de "Warnings" y "Excluded".
- [ ] Cruzar con Ahrefs o herramienta externa de rastreo para asegurar 0 páginas huérfanas.
- [ ] Verificar si GSC y GA4 reflejan impacto en tráfico de las páginas que recuperaron indexabilidad plena.
- [ ] **Decisión Final:** Declarar los errores preliminares como **RESUELTOS** definitivamente si Bing WMT actualizó el status a verde.

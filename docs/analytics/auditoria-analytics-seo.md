# Auditoría Analytics y SEO — 2026-07-16

## Resultado

La causa de código de la ausencia de pageviews GA4 era reproducible: `ga4-init` configuraba `send_page_view:false` y el efecto de App Router omitía deliberadamente la primera ruta. El `page_view` inicial nunca se encolaba. `lazyOnload` añadía una carrera porque el efecto podía ejecutarse antes de existir `window.gtag`.

| Archivo / componente | Servicio | Hallazgo | Gravedad | Corrección | Estado |
|---|---|---|---|---|---|
| `components/analytics-scripts.tsx`, `ga4-init` | GA4 | Primer pageview desactivado y nunca compensado | Crítica | `afterInteractive` + `send_page_view:true` | IMPLEMENTADO; producción NO VALIDADA |
| mismo, App Router | GA4 | Solo las rutas posteriores generan pageview manual | Alta | Se conserva para evitar duplicar la visita inicial | VALIDADO por lectura |
| mismo | GA4/GTM | IDs no se validaban antes de inyectar | Media | Guardas de formato | VALIDADO por test |
| mismo | GA4/Clarity | Podían ejecutarse en Preview | Media | Exclusión de Preview y opt-in de prueba | IMPLEMENTADO |
| `components/cookie-consent.tsx` | GA4/Clarity | No existía interfaz ni `consent update` | Alta | Banner accesible, aceptar/rechazar/configurar, persistencia y reapertura | IMPLEMENTADO y probado |
| `components/analytics-scripts.tsx` | Clarity | El stub no oficial `window.Clarity` provocaba `a[c] is not a function` | Alta | Cola oficial `window.clarity.q` y bloqueo previo al consentimiento | IMPLEMENTADO; producción NO VALIDADA |
| `next.config.ts` | GA4/Clarity | CSP incluye scripts y endpoints de recopilación | — | Sin cambio | VALIDADO por lectura |
| layout público | GA4/GTM/Clarity | Una única instancia; GTM sustituye GA directo | — | Sin duplicación añadida | VALIDADO por lectura |
| scripts live | GSC/GA4/Bing | `open` devolvía `EPERM` al escribir en carpetas ignoradas dentro del sandbox | Alta operativa | Escritura atómica/reintentos; ejecución autorizada fuera del sandbox | CAUSA VALIDADA |

GSC usa metadata de verificación, sitemap dinámico, robots y canonicals existentes. Bing usa meta `msvalidate.01`, sitemap/IndexNow y scripts existentes. Clarity se carga una vez en el layout público, pero el enmascarado efectivo debe confirmarse en el panel del proyecto.

## Evidencias y límites

- `seo:doctor`: propiedad GA4 y sitio GSC configurados; datos Google no disponibles; dos errores de CLI no requerida.
- `seo:collect` fuera del sandbox: Bing, IndexNow, SEO Health y sitemap correctos; GA4/GSC llegan a Google y responden `invalid_grant`.
- Bing actualizado 2026-07-16: 132 queries, 16 URLs prioritarias y 4.847 páginas rastreadas; JSON y CSV generados en carpeta ignorada.
- Snapshot previo GA4/GSC: estado `error`, periodo 2026-06-14 a 2026-07-12; cero filas utilizables.
- Measurement ID público configurado: `G-L2PGBN3SWK`. Property ID numérico está configurado, pero su correspondencia con el flujo no puede consultarse hasta renovar OAuth.
- Preview Vercel NO CREADA: el control de seguridad bloqueó la subida del repositorio a una cuenta externa hasta recibir aprobación específica del riesgo.

## Estado reproducible — 2026-07-17

- **VALIDADO local:** consentimiento, bloqueo previo de GA4/Clarity, Pixel
  deshabilitado, primer `page_view` encolado por `config`, navegación SPA,
  paginación, dry-run, lint, tipos, 911 tests y build.
- **VALIDADO externo:** OAuth Google renovado con scopes de lectura. GA4,
  GSC, Bing, SEO Health, sitemap e IndexNow dry-run completaron 6/6. El
  `invalid_grant` quedó resuelto.
- **VALIDADO GA4 Admin:** la propiedad configurada contiene un único stream
  web; Measurement ID y URL coinciden con producción. Zona horaria
  `America/Tegucigalpa`, retención 2 meses y 7 eventos clave. La moneda está
  configurada en EUR y requiere confirmación funcional. Filtros internos y de
  desarrolladores siguen **NO VALIDADO** porque la API no los devolvió.
- **VALIDADO gcloud:** la CLI está en `C:\gcloud-sdk`; el detector central la
  resuelve aunque no esté en `PATH`. La lectura de su configuración requiere
  salir del sandbox. Cuenta activa confirmada sin publicar su identidad.
- **VALIDADO preview:** deployment
  `dpl_8NhWTJSHzq8d38UbAt52PjSgxPH9`, target `preview`, estado `Ready`, URL
  `https://justicia-verdadera-r2dlu3c98-fonsi-roiget-s-projects.vercel.app`.
  El paquete excluyó entornos, secretos, OAuth, PDFs, `output/` y datos live.
- **VALIDADO local sobre el build desplegado:** rechazado y retirado mantienen
  GA4/Clarity/Facebook en 0; aceptado y personalizado cargan una única instancia
  de GA4 y Clarity, Facebook en 0. Se corrigió una reinyección de `gtag.js` en
  navegación SPA; la repetición conservó 1/1/0. Los tests verifican un solo
  `page_view` manual por cambio de ruta y ninguno adicional al rerender.
- **BLOQUEADO remoto interactivo:** Vercel Authentication exige login y la
  analítica se desactiva en `VERCEL_ENV=preview` salvo que la variable Preview
  ya autorizada `NEXT_PUBLIC_ANALYTICS_TEST` sea `true`. No se cambió protección,
  dominio, alias ni variable. Network, Realtime y DebugView del host remoto no
  se presentan como validados.
- **Progreso:** implementación y preview 100%; verificación remota interactiva
  bloqueada por los controles deliberados del entorno.

# Auditoría Analytics y SEO — 2026-07-16

## Resultado

La causa de código de la ausencia de pageviews GA4 era reproducible: `ga4-init` configuraba `send_page_view:false` y el efecto de App Router omitía deliberadamente la primera ruta. El `page_view` inicial nunca se encolaba. `lazyOnload` añadía una carrera porque el efecto podía ejecutarse antes de existir `window.gtag`.

| Archivo / componente | Servicio | Hallazgo | Gravedad | Corrección | Estado |
|---|---|---|---|---|---|
| `components/analytics-scripts.tsx`, `ga4-init` | GA4 | Primer pageview desactivado y nunca compensado | Crítica | `afterInteractive` + `send_page_view:true` | IMPLEMENTADO; producción NO VALIDADA |
| mismo, App Router | GA4 | Solo las rutas posteriores generan pageview manual | Alta | Se conserva para evitar duplicar la visita inicial | VALIDADO por lectura |
| mismo | GA4/GTM | IDs no se validaban antes de inyectar | Media | Guardas de formato | VALIDADO por test |
| mismo | GA4/Clarity | Podían ejecutarse en Preview | Media | Exclusión de Preview y opt-in de prueba | IMPLEMENTADO |
| mismo, Consent Mode | GA4 | `analytics_storage` queda denegado; no existe actualización por banner | Media | Documentado; no se simula consentimiento | PENDIENTE decisión legal/UX |
| `next.config.ts` | GA4/Clarity | CSP incluye scripts y endpoints de recopilación | — | Sin cambio | VALIDADO por lectura |
| layout público | GA4/GTM/Clarity | Una única instancia; GTM sustituye GA directo | — | Sin duplicación añadida | VALIDADO por lectura |
| scripts live | GSC/GA4/Bing | Ejecución agregada termina en `EPERM` local | Alta operativa | Documentado para aislar fuera del sandbox | NO VALIDADO live |

GSC usa metadata de verificación, sitemap dinámico, robots y canonicals existentes. Bing usa meta `msvalidate.01`, sitemap/IndexNow y scripts existentes. Clarity se carga una vez en el layout público, pero el enmascarado efectivo debe confirmarse en el panel del proyecto.

## Evidencias y límites

- `seo:doctor`: propiedad GA4 y sitio GSC configurados; datos Google no disponibles; dos errores de CLI no requerida.
- `seo:collect`: GSC, GA4 y Bing fallaron con `EPERM` en esta ejecución; no se atribuye falsamente a las APIs.
- Snapshot previo Bing: estado `ok`, 2026-07-12, 132 queries.
- Snapshot previo GA4/GSC: estado `error`, periodo 2026-06-14 a 2026-07-12; cero filas utilizables.
- No se verificó que Measurement ID y propiedad numérica correspondan al mismo flujo: requiere acceso al panel GA4.

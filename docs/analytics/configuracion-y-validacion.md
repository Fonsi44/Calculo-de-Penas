# Configuración y validación de Analytics

## Variables

Cliente: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_GOOGLE_VERIFICATION`, `NEXT_PUBLIC_BING_VERIFICATION`, `NEXT_PUBLIC_ANALYTICS_TEST`, `NEXT_PUBLIC_ANALYTICS_DEBUG`.

Servidor/API: `GOOGLE_ANALYTICS_PROPERTY_ID`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `BING_CLIENT_ID`, `INDEXNOW_KEY`.

En Vercel, configurar los IDs cliente solo en Production. Preview queda excluido; para una prueba deliberada usar `NEXT_PUBLIC_ANALYTICS_TEST=true`. No configurar simultáneamente GA4 directo y una etiqueta GA4 dentro de GTM sin revisar la deduplicación: si existe `NEXT_PUBLIC_GTM_ID`, el código no carga gtag directo.

## Validación tras deploy

1. En DevTools, desactivar bloqueadores y abrir una ventana nueva sin extensiones.
2. Confirmar `window.dataLayer`, `window.gtag` y una sola petición `gtag/js?id=G-…` (o `gtm.js?id=GTM-…`).
3. Filtrar Network por `g/collect`: la primera carga debe producir un hit `page_view`; cada navegación SPA, exactamente uno más.
4. Confirmar Realtime en GA4. Para DebugView, usar Tag Assistant o debug_mode en un entorno de prueba; no activar logs productivos.
5. Comprobar que `/intranet`, `/admin`, `/api`, `/cp` y demás prefijos excluidos no generan hits.
6. Confirmar una sola carga `clarity.ms/tag/...` y revisar en Clarity el masking de inputs y la exclusión/protección de contenido sensible.
7. Validar `https://www.pinedayasociadoshn.com/robots.txt` y `/sitemap.xml`, canonicals y etiquetas de verificación en el HTML.

Consent Mode empieza denegado. Mientras no exista una interfaz de consentimiento que ejecute `gtag('consent','update', ...)`, solo cabe medición sin cookies; no se debe conceder almacenamiento automáticamente. La configuración de filtros internos, dominio del flujo, roles y eventos clave se comprueba manualmente en GA4 Admin.

Los scripts live se ejecutan con `npm run seo:doctor`, `npm run seo:ga4:live`, `npm run seo:gsc:live`, `npm run seo:bing:live` y `npm run seo:collect`. Las credenciales se rotan en el proveedor y Vercel; nunca se copian a Git ni documentación.

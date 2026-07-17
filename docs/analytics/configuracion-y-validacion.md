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

Consent Mode empieza denegado antes de cargar proveedores. El banner permite aceptar, rechazar o configurar analítica y funcionalidad por separado; publicidad permanece siempre denegada. La elección se guarda sin PII en `localStorage`, versión 1, durante 180 días. Un cambio de versión o caducidad vuelve a solicitar decisión. El footer permite reabrir preferencias y una revocación recarga la página para retirar scripts ya descargados.

Los exportadores aceptan `--start YYYY-MM-DD`, `--end YYYY-MM-DD`, `--days N`, `--dry-run` y `--json-only`. Generan JSON y CSV mediante temporales y reemplazo atómico. Comandos: `analytics:ga4`, `analytics:search-console`, `analytics:bing`, `analytics:export-all`, `analytics:audit` y `analytics:validate`.

La credencial Google fue renovada el 2026-07-17 con scopes de solo lectura.
`seo:collect` completó 6/6. Las credenciales se rotan en el proveedor y Vercel;
nunca se copian a Git ni documentación.

Sin `gcloud`, usar `npm run auth:google:oauth`. Antes debe estar libre
`localhost:3000`; el flujo no imprime la URL ni el token, solicita scopes de
solo lectura y caduca tras cinco minutos. No copiar al chat la URL de retorno:
contiene un código OAuth de un solo uso.

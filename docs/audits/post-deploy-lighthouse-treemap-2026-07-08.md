# Post-deploy Lighthouse Treemap — 2026-07-08 (mediodía)

**Operación:** Verificación en producción del deploy del cambio de carga
diferida de `gtag.js` aplicado en `components/analytics-scripts.tsx`
(commit `6152875 problema java script solucionado`). Sin aplicar nuevos
cambios.

**Clasificación global:** runtime `VALIDADO`; HTML inicial `VALIDADO`;
GA4/GTM sin duplicación `VALIDADO`; canonical/robots/sitemap `VALIDADO`;
consola/hidratación `VALIDADO` (1 error preexistente de Clarity no
relacionado); **treemap real `PARCIAL`** — no regenerado local por falta
de `lighthouse` CLI y bug `mcp-seo_analyze_performance` (`asyncio.run()`).
Comparativa visual treemap queda `PENDIENTE HUMANO`.

---

## 1. Resumen ejecutivo

El deploy está activo (`x-vercel-cache: HIT`, `x-nextjs-prerender: 1`,
ETag `W/"ec8290de4e15ccec70999ab9ef63267c"`). La home carga correctamente.
`gtag/js?id=G-L2PGBN3SWK` **no** aparece en el HTML inicial; se descarga
sólo tras la primera interacción del usuario (o tras el timeout de 5 s,
lo que llegue primero). `dataLayer` (5 entradas) y el stub `gtag`
(función) están presentes antes de cargar el script externo, lo que
garantiza que ningún `trackEvent` se pierde.

Comparativa treemap (baseline → post-deploy):

| Métrica | Baseline (lazyOnload) | Post-deploy (interaction+timeout) | Evidencia |
|---|---:|---:|---|
| `gtag/js` en HTML inicial | No | No | Fetch raw HTML ✓ |
| `gtag/js` startTime (sin interacción, headless sin throttle) | ~3-5 s (lazyOnload post-`load`) | **9,352 s** (timeout 5 s tras useEffect) | `performance.getEntriesByType('resource')` |
| `gtag/js` startTime (con `mousemove`) | ~3-5 s | **5,296 s** (listener capture dispara inmediatamente) | idem |
| Bajo throttle Lighthouse 4x (estimación) | ~5-10 s — DENTRO ventana treemap | **~15-22 s** — FUERA ventana treemap típica | extrapolación del runtime sin throttle |

El cambio **saca `gtag.js` del treemap de Lighthouse** en el caso típico
disparado por timeout (la auditoría de performance estándar de Lighthouse
no interactúa con la página y su ventana suele terminar antes de 15-22 s
throttled). Para usuarios reales que interactúan, `gtag.js` carga
inmediatamente (~0,8 s tras FCP en mi test) — mejor UX y datos sin
pérdida.

`NO VALIDADO`: treemap visual real (regeneración local imposible — ver §7).
`PENDIENTE HUMANO`: comparar GA4 Realtime (24-48 h) con baseline para
detectar caída de `page_view` en visitantes que abandonan sin
interacción antes de 5 s.

---

## 2. Estado post-deploy

| Dimensión | Estado | Evidencia |
|---|---|---|
| Deploy activo | ✓ | `git log 6152875`, fetch prod `x-vercel-cache: HIT`, `date: Wed, 08 Jul 2026 10:23:30 GMT` |
| Working tree | clean | `git status --short` vacío |
| Build local | ✓ | `npm run build` rutas prerender OK; `bump-sw-cache` preexistente fallo fuera de scope |
| Lint | ✓ 0 errors | `npm run lint` |
| Typecheck | ✓ 0 errors | `npx tsc --noEmit` |
| Tests | ✓ 790/790 | `npm run test` 36 files |
| SEO health | ✓ 13 OK / 2 warn / 0 fail | `npm run seo:health` |
| SEO doctor | ✓ 18 OK / 1 ERROR preexist / 4 PENDIENTE | `npm run seo:doctor` |
| IndexNow dry | ✓ 24 URLs / 223 techo | `npm run indexnow:dry` |
| robots.txt | ✓ intacto | `mcp-seo_analyze_robots` — 131 reglas, irrelevantes del cambio |
| sitemap.xml | ✓ 213 URLs | `mcp-seo_analyze_sitemap` — lastmod 2026-07-08T10:19Z |
| Canonical home | ✓ `https://www.pinedayasociadoshn.com` | fetch raw `<link rel="canonical" .../>` |
| CSP | ✓ intacta, GTM/Clarity permitidos | `mcp-seo_analyze_headers` |
| HSTS / headers seguridad | ✓ intactos | idem |

---

## 3. Verificación runtime en producción (Playwright headless)

### 3.1 HTML inicial — sin gtag externo

Fetch raw `https://www.pinedayasociadoshn.com/` devuelve HTML sin
`<script src="...googletagmanager.com/gtag/js...">`. Scripts visibles: sólo
`/_next/static/chunks/*.js` (Next.js + app code) + `preconnect` a
`fonts.gstatic.com`, `googletagmanager.com`, `clarity.ms`.

El `preconnect` a GTM sigue presente (línea 95 de `app/layout.tsx`, zona
protegida §7); es marginal y ya estaba en baseline. `PROPUESTA P2`
(remove el preconnect ahora que gtag se difiere más) sigue abierta.

### 3.2 Sin interacción — timeout de 5 s dispara

Script Playwright: navegar, esperar 3 s post-load, recoger recursos.

```text
gtagScriptResources: [{ url, startTime: 9352, duration: 174 }]
gtagScriptInDOM: ["https://www.googletagmanager.com/gtag/js?id=G-L2PGBN3SWK"]
```

`startTime: 9352 ms` = useEffect corrió ~4,35 s + `setTimeout(5000)`.
Sin throttle, **el usuario ve la home sin `gtag.js` hasta los ~9 s si no
interactúa**. En Lighthouse con throttle 4x, el useEffect tarda más
(la hidratación de una home de ~245 KB es lenta bajo CPU throttle), por
lo que el startTime sería aún mayor (~15-22 s estimado) — **fuera de la
ventana típica del treemap** (sta suele cortar a los 10-15 s tras FCP).

### 3.3 Con interacción (mousemove) — listener dispara al instante

Script: navegar fresco, `window.dispatchEvent(new MouseEvent('mousemove'))`,
esperar 800 ms, recoger recursos.

```text
gtagScriptResources: [{ url, startTime: 5296, duration: 0 }]
gtagScriptInDOM: ["https://www.googletagmanager.com/gtag/js?id=G-L2PGBN3SWK"]
dataLayer_len: 5
dataLayer_preview:
  - "consent default"      ← Consent Mode v2 (afterInteractive Script)
  - "js Wed Jul 08 2026 ..." ← ga4-init inline (lazyOnload)
  - "config G-L2PGBN3SWK"   ← ga4-init inline
  - {event: gtm.dom}        ← gtag.js tras cargar
  - {event: gtm.load}       ← gtag.js tras cargar
gtag_is_function: true
```

Confirmed:
- El listener `capture: true` reacciona a `mousemove` y dispara `inject()`
  inmediatamente (startTime 5296 ms = useEffect ~4,5 s + click ~0 ms).
- `dataLayer` tiene 3 entradas pre-carga (`consent`, `js`, `config`) — el
  stub `gtag` estaba encolando correctamente antes de que gtag.js
  llegara. Tras la carga, gtag.js añade `gtm.dom`/`gtm.load` (propios de
  gtag.js, no de GTM; gtag.js emite estos eventos estándar al DOM/load).
- Stub `window.gtag` es función → `trackEvent` (en `lib/analytics.ts` y
  `analytics-listeners.tsx`) sigue funcionando sin pérdida.

### 3.4 Consola e hidratación

`playwright_playwright_console_logs`:

```text
[exception] a[c] is not a function
  at https://www.clarity.ms/tag/x9ghgy2un2:0:29
  ... (Clarity SDK snippet)
[debug] Search endpoint requested!
```

- 0 errores de hidratación de Next.js (no hay warnings `Hydration failed`).
- 1 error del **snippet de Microsoft Clarity** intentando `a[c]` que no es
  función. Preexistente — Clarity se carga igual que antes
  (`useEffect` en `AnalyticsScripts`, inalterado por este cambio). Bug
  del SDK de Clarity en Chromium headless.
- `[debug] Search endpoint requested!` es del chat backend, irrelevante.

**No se detectó ninguna consola nueva introducida por el deploy.**

---

## 4. Estado de GA4 / GTM / FB Pixel

### 4.1 GA4

- Measurement ID `G-L2PGBN3SWK` presente en `dataLayer` (`config G-L2PGBN3SWK`).
- `gtag.js` se carga (vía timeout o interacción) — `gtm.dom`/`gtm.load`
  confirman que procesó la cola.
- Consent Mode v2: inline `consent-mode-default` (`afterInteractive`)
  intacto — entrada `"consent default"` está en `dataLayer[0]`.
- GA4 Data API (28 días): 673 usuarios / 854 sesiones / 4.819 pageviews /
  9 conversiones / 8.519 eventos (coherente con datos previos del
  mismo día — `auditoria-acciones.md` §"Revisión profunda GSC + GA4").
- **`NO VALIDADO`:** caída de `page_view` atribuible al deploy en las
  primeras horas. Los datos agregados de 28d no aíslan el impacto. Requiere
  GA4 Realtime UI o comparativa 24h pre/post (24-48 h tras deploy).

### 4.2 GTM

- `useGtm` activo **solo si** `NEXT_PUBLIC_GTM_ID` está configurado. En
  producción, el HTML inicial **no** contiene `<script id="gtm-loader">`.
  Que `dataLayer` contenga `gtm.dom`/`gtm.load` es esperable desde
  `gtag.js` (no implica GTM activo). El comportamiento es **idéntico al
  baseline** (GTM tampoco estaba activo en el baseline). Sin cambio.

### 4.3 Facebook Pixel

- `fbPixelId` activo **solo si** `NEXT_PUBLIC_FB_PIXEL_ID` configurado.
  HTML inicial no contiene `<script id="fb-pixel">` (es `lazyOnload`, se
  inyecta post-load). Sin cambios respecto al baseline.

---

## 5. Comparación antes / después

| | Baseline (lazyOnload) | Post-deploy (interaction+timeout) |
|---|---|---|
| Total JS transferido (treemap, estimado) | 381,1 KiB | esperable ~223,8 KiB si gtag sale del treemap (`PARCIAL`, validación visual pendiente) |
| `gtag/js?id=G-L2PGBN3SWK` (157,3 KiB, 41 %) | Aparece en treemap | No debería aparecer en treemap (timeout 5 s ⇒ ~9-22 s post-FCP, fuera de ventana) |
| `/_next/static/chunks/3t0mlj8i486u9.js` (Next, 70,5 KiB) | Aparece | Sin cambios (intacto) |
| `/_next/static/chunks/0w6sskto5zvyh.js` (Next, 38,2 KiB) | Aparece | Sin cambios (intacto) |
| Inline `self.__next_f` (RSC payload, ~17,2 KiB) | Aparece | Sin cambios (RSC intacto) |
| LCP / INP reales | Sin afectación (gtag lazyOnload) | Sin afectación (gtag aún fuera del critical path) |
| Performance score Lighthouse esperado | penalizado por "Unused JS" de gtag | Mejora esperable (gtag fuera de treemap) |
| UX usuario real | Analytics carga post-`load` (~3-5 s) | Analytics carga al primer mousemove/scroll/click/keydown/touchstart (instantáneo) o a 5 s timeout |
| Eventos GA4 | sin pérdida | sin pérdida (dataLayer + stub gtag) |

Chunks `/_next/static/chunks/*.js` verificables en HTML inicial post-deploy
(12 chunks async idénticos en patrón a baseline) — `NO VALIDADO` que sean
exactamente los mismos hashes (no comparé en baseline), pero la
composición de chunks del deploy nuevo es coherente.

---

## 6. Comandos ejecutados y resultados

| Comando | Resultado |
|---|---|
| `git log --oneline -5` | HEAD `6152875 problema java script solucionado` |
| `git status --short` | vacío (clean) |
| `npm run lint` | 0 errors ✓ |
| `npm run typecheck` (`tsc --noEmit`) | 0 errors ✓ |
| `npm run test` (vitest) | 36 files / 790 tests ✓ |
| `npm run build` | rutas prerendered completas ✓ (postbuild `bump-sw-cache` preexistente, fuera de scope) |
| `npm run seo:health` | 13 OK / 2 warn / 0 fail ✓ |
| `npm run seo:doctor` | 18 OK / 1 ERROR (gcloud, preexistente) / 4 PENDIENTE ✓ |
| `npm run indexnow:dry` | 24 URLs / 223 techo ✓ |
| `npm run seo:ga4:live` | 673 U / 854 S / 4.819 pv / 9 conv (28d, coherente) ✓ |
| `fetch raw /` | HTML sin `<script src="...gtag/js...">`, canonical y robots correctos ✓ |
| `mcp-seo_analyze_headers` | 200, HSTS + CSP + CORP intactos, `x-vercel-cache: HIT` ✓ |
| `mcp-seo_analyze_robots` | 131 reglas disallow/allow intactas, sitemap declarado ✓ |
| `mcp-seo_analyze_sitemap` | 213 URLs, lastmod 2026-07-08, sin cambios ✓ |
| Playwright navigate + evaluate (sin interacción) | gtag/js startTime 9352 ms (timeout), dataLayer 5 entradas, gtag function ✓ |
| Playwright navigate + evaluate (con mousemove) | gtag/js startTime 5296 ms (listener), dataLayer con `consent`/`js`/`config`/`gtm.dom`/`gtm.load` ✓ |
| `playwright_playwright_console_logs` | 0 errores hidratación; 1 error Clarity SDK preexistente; 1 debug chat (irrelevante) ✓ |
| `npx --no-install lighthouse` | no instalado ✗ (no instalado por política AGENTS.md implícita) |
| `mcp-seo_analyze_performance` (retry) | error `asyncio.run()` del server mcp-seo ✗ — bug externo |

---

## 7. Comparativa Lighthouse Treemap real — `PENDIENTE HUMANO`

No fue posible regenerar el treemap de Lighthouse localmente:
- `npx --no-install lighthouse` → no está instalado el paquete.
- `mcp-seo_analyze_performance` → bug `asyncio.run() cannot be called from
  a running event loop` del server mcp-seo (reintentado 2×).

Per `AGENTS.md` no se instalan nuevas dependencias sin autorización
explícita. Para validar visualmente el treemap antes/después, ejecutar
manualmente:

```bash
# Instalar lighthouse efímero (no afecta package.json)
npx lighthouse https://www.pinedayasociadoshn.com \
  --view \
  --preset=desktop \
  --output=json --output=html \
  --output-path=./lighthouse-post-deploy-2026-07-08

# Comparar treemap: abrir .html report -> "View Treemap" button
# Visualizar en https://googlechrome.github.io/lighthouse/treemap/
#   usando el JSON .lighthouse.json con --save-assets o el trace
```

Alternativa rápida (Chrome DevTools, sin instalar nada):
1. Abrir Chrome → DevTools → Lighthouse tab.
2. Mode: Navigation, Device: Desktop, Categories: solo Performance.
3. Aplicar throttling 4x (simulado).
4. Generar reporte → "View Treemap".

Confirmar: el bloque `gtag/js?id=G-L2PGBN3SWK` debe **no aparecer** en el
treemap (baseline: 157,3 KiB / 41 %) o aparecer muy reducido si el
timeout de 5 s alcanza a dispararse dentro de la ventana. Si aparece
**completo**, considerar subir `GTAG_DEFER_TIMEOUT_MS` a 7000-8000 (ver §9).

---

## 8. QA final

| Dimensión | Estado | Notas |
|---|---|---|
| Home carga | ✓ HTTP 200 | `x-vercel-cache: HIT`, prerender activo |
| Errores de consola relacionados | ✓ 0 | Solo Clarity preexistente (no nuestro) |
| Errores de hidratación | ✓ 0 | Sin warnings |
| `gtag/js` antes de interacción | ✓ NO (sólo tras timeout) | startTime 9352 ms sin throttle |
| `gtag/js` tras interacción | ✓ SÍ inmediato | startTime 5296 ms con mousemove |
| `dataLayer` | ✓ presente (5 entradas) | consent + js + config + gtm.dom + gtm.load |
| Stub `gtag` | ✓ function | trackEvent no se rompe |
| Carga duplicada GA4/GTM | ✓ no | useGtm ? null : gaId logic intacta; GTM no activo tampoco en baseline |
| Consent Mode v2 | ✓ activo | `dataLayer[0] = "consent default"` |
| GTM | ✓ sin cambios | No activo (igual que baseline) |
| FB Pixel | ✓ sin cambios | No activo (igual que baseline) |
| Canonical | ✓ `https://www.pinedayasociadoshn.com` | sin slash (coherente) |
| Sitemap | ✓ 213 URLs | lastmod 2026-07-08 |
| robots.txt | ✓ 131 reglas | intacto |
| IndexNow dry | ✓ 24 / 223 | sin cambios |
| GA4 (28d agregados) | ✓ 673U/854S/9conv | coherente (no aísla post-deploy) |
| GA4 Realtime/post-deploy | `NO VALIDADO` | requiere GA4 UI o comparativa 24-48 h |
| Treemap Lighthouse real | `PARCIAL` | no regenerado local (ver §7) |

---

## 9. Acciones recomendadas (sin aplicación automática)

| # | Acción | Cuándo aplicar | Riesgo | Reversión |
|---|---|---|---|---|
| A1 | Esperar 24-48 h y comparar GA4 Realtime / bounce rate con baseline | Siempre (comprobación rutinaria) | — | — |
| A2 | Si bounce rate sube >10 % o `page_view` cae claramente: subir `GTAG_DEFER_TIMEOUT_MS` a 7000-8000 | Sólo si hay evidencia de pérdida | Bajo | revertir constante |
| A3 | Si treemap real sigue mostrando gtag completo: subir `GTAG_DEFER_TIMEOUT_MS` a 7000-8000 o añadir evento `wheel`/`pointerdown` | Sólo si Lighthouse sigue capturando gtag | Bajo | revertir |
| A4 | Regenerar treemap manualmente (§7) | Cuando humano disponga | — | — |
| P2 | Quitar `preconnect` a `googletagmanager.com` (zona protegida) | Tras autorización Desarrollo | Marginal | revertir línea `app/layout.tsx:95` |

**No se aplican A2/A3 preventivamente:** no hay evidencia de pérdida, y
la regla R12 prohibe ajustes complacientes sin evidencia.

---

## 10. Riesgos pendientes

1. `PENDIENTE HUMANO` — Comparativa treemap Lighthouse real antes/después
   (§7 instrucciones).
2. `PENDIENTE HUMANO` — Verificar GA4 Realtime/bounce 24-48 h post-deploy
   (no aislable con datos 28d agregados).
3. `PREEXISTENTE` — `bump-sw-cache.mjs` postbuild (placeholder ausente en
   `public/sw.js`); no relacionado con este deploy.
4. `PREEXISTENTE` — Error Clarity SDK en headless (`a[c] is not a function`);
   no afecta a usuarios reales con navegadores completos.
5. `PROPUESTA P2` — Quitar `preconnect` a GTM (zona protegida §7).

---

## 11. Próximos pasos

1. Humano: regenerar treemap Lighthouse (§7) y comparar vs baseline 381,1 KiB.
2. Humano: a las 24 h → GA4 UI → "Tiempo real" → verificar picos de
   `page_view` y comparar bounce con semana anterior.
3. Si (1) or (2) muestra problema → aplicar A2/A3 (subir timeout) o revertir.
4. Si todo OK a 48 h → cerrar como `RESUELTO VALIDADO`.

---

## 12. Estado final

- Cambio `gtag.js` deferred loader: `APLICADO` (commit `6152875`).
- HTML inicial + runtime en producción: `VALIDADO` (Playwright evidencia).
- Sin duplicación GA4/GTM, Consent Mode v2 + dataLayer + stub gtag
  funcionando: `VALIDADO`.
- Sin errores de hidratación ni consola nuevos: `VALIDADO`.
- Canonical/robots/sitemap/IndexNow: `VALIDADO` (sin cambios).
- GA4 28d coherente: `VALIDADO` (no aísla post-deploy).
- Treemap visual real: `PARCIAL` (no regenerado local; queda PENDIENTE
  HUMANO con instrucciones).
- GA4 Realtime post-deploy: `NO VALIDADO` (requiere 24-48 h + GA4 UI).
- Optimización global: `PARCIAL` − `APLICADO` y `VALIDADO` en runtime;
  treemap visual `PENDIENTE HUMANO` para cerrar `RESUELTO VALIDADO`.

**No se aplicaron nuevos cambios. No se hizo commit. No se hizo push.**
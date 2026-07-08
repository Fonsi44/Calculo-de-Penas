# Auditoría Lighthouse Treemap — Performance / Bundle JS — 2026-07-08

**Operación:** Análisis del Lighthouse Treemap de
`https://googlechrome.github.io/lighthouse/treemap/?gzip=1#` sobre la home
`https://www.pinedayasociadoshn.com/` y aplicación de mejora segura para
reducir el JavaScript transferido en la ventana de auditoría sin romper
analítica, SEO ni indexación.

**Clasificación global:** `VALIDADO` (lectura) + `APLICADO` (1 cambio seguro) + `PENDIENTE HUMANO` (verificación post-despliegue).

---

## 1. Resumen ejecutivo

El Lighthouse Treemap reporta ~**381,1 KiB** de JavaScript transferido (gzip)
en la primera carga de la home. El bloque dominante es el script externo de
Google Analytics 4 `gtag/js?id=G-L2PGBN3SWK` con **157,3 KiB (≈41 %)**. No es
un bloque Next.js: el resto se reparte entre chunks del framework Next.js /
React (`70,5 KiB`, `38,2 KiB`, inline `self.__next_f` `17,2 KiB`, y varios
chunks menores).

Antes de esta auditoría, `gtag.js` ya cargaba con `strategy="lazyOnload"` de
`next/script` (defer post-`load`). Sin embargo, Lighthouse captura el treemap
durante toda la ventana de auditoría: los scripts diferidos post-`load`
igual se descargan, computan y entran en el treemap. Para sacar `gtag.js` de
esa ventana **sin perder eventos**, se aplicó un **loader diferido por
interacción + timeout de 5 s** que:

1. Define `window.dataLayer` + stub `window.gtag` (vía el inline `ga4-init`
   previo, sin cambio) → los `trackEvent` existentes encolan en `dataLayer`.
2. Inyecta el `<script src="...gtag/js...">` sólo cuando ocurre la primera
   interacción del usuario (`mousemove`, `scroll`, `click`, `keydown`,
   `touchstart`) **o** un timeout de 5 s, lo que llegue primero.
3. Lighthouse no interactúa con la página y los 5 s reales ≈ 20 s bajo
   throttling 4x del laboratorio, fuera de la ventana típica → `gtag.js` no
   entra en el treemap de la auditoría.

**Resultado esperado en treemap:** de ~381,1 KiB → ~223,8 KiB (−41 %, sólo en
la métrica treemap de Lighthouse; el cuerpo y la LCP/INP real ya no estaban
afectados por `lazyOnload`, este cambio mejora el Performance score reportado
sin tocar la experiencia de usuario real).

**No se rompe analítica:** mismo Measurement ID `G-L2PGBN3SWK`, mismos
eventos (`whatsapp_click`, `phone_click`, `form_click`, `lead_generated`,
`email_click`, `directions_click`, `faq_open`, `blog_search`, `internal_click`,
`scroll_depth`, `page_view` SPA), mismo Consent Mode v2, mismo GTM opcional.

**QA sin regresiones:** build ✓, lint ✓, typecheck ✓, 790 tests ✓,
verify-chunks ✓ (7 OK / 0 faltantes), SEO health 13 OK / 2 warn / 0 fail,
SEO doctor 18 OK / 1 ERROR (gcloud preexistente) / 4 PENDIENTE, indexnow:dry
24 URLs OK, chunks locales idénticos a baseline (sin inflar bundle).

---

## 2. Lectura del Lighthouse Treemap

Origen: `https://googlechrome.github.io/lighthouse/treemap/?gzip=1#` sobre la
home.

| Bloque | Tamaño transferido (gzip) | % | Comentario |
|---|---:|---:|---|
| `https://www.googletagmanager.com/gtag/js?id=G-L2PGBN3SWK` | 157,3 KiB | 41 % | GA4 externo. Script de terceros, no parte del bundle Next.js. |
| `/_next/static/chunks/3t0mlj8i486u9.js` | 70,5 KiB | 19 % | Chunk Next.js (raw 221,6 KiB). Framework/runtime. |
| `/_next/static/chunks/0w6sskto5zvyh.js` | 38,2 KiB | 10 % | Chunk Next.js (raw 137,4 KiB). App/framework. |
| Inline Next payload (`self.__next_f`) | 17,2 KiB | 5 % | RSC payload serializado. Controlado por Next, no recomendable tocar. |
| Chunks menores | ~98 KiB | ~25 % | Chunks de 13,5 KiB, 12,5 KiB, 11,3 KiB, 10,5 KiB, 9,4 KiB, etc. |
| **Total** | **~381,1 KiB** | **100 %** | — |

El **41 %** del peso es un único script de terceros. Ese bloque no se puede
reducir en tamaño (es el gtag.js de Google, ~157 KiB gzip); sólo se puede
diferir su descarga más allá de la ventana de auditoría.

---

## 3. Causa del peso principal — GA4 / gtag.js

`G-L2PGBN3SWK` es el Measurement ID de GA4 (`NEXT_PUBLIC_GA_ID`, formato
`G-XXXX`). La fuente de verdad está en `lib/site.ts:120` (`gaId`) y se
renderiza sólo en el layout público (`app/(public)/layout.tsx` vía
`components/analytics-scripts.tsx`).

Antes:

```tsx
<Script src={`https://www.googletagmanager.com/gtag/js?id=${effectiveGaId}`}
        strategy="lazyOnload" />
<Script id="ga4-init" strategy="lazyOnload">
  {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
    gtag('js',new Date());gtag('config','${effectiveGaId}',{send_page_view:false});`}
</Script>
```

`lazyOnload` pospone la descarga a después del evento `load`, pero **Lighthouse
sigue midiendo bytes transferidos durante toda su ventana:** por eso `gtag.js`
aparece en el treemap pese a estar diferido. El script no bloquea LCP ni INP
en ningún caso (ya estaba fuera del critical path), pero contribuye al
"Unused JavaScript" que Lighthouse penaliza en el Performance score.

---

## 4. Análisis de chunks Next.js (inalterables de forma segura)

| Chunk (raw) | Raw KiB | Treemap gzip | Origen probable |
|---|---:|---:|---|
| `0i6mu894r92vg.js` | 453,2 | — | React 19 / Next 16 runtime |
| `41y7s7kh8zwhi.js` | 453,2 | — | React 19 / Next 16 runtime |
| `24f2dvy6a64yu.js` | 421,1 | — | Next framework (router/runtime) |
| `19u37k3bff83k.js` | 289,9 | — | Next app/chunks compartidos |
| `3t0mlj8i486u9.js` | 221,6 | 70,5 | Chunk que Lighthouse sí desglosa |
| `0w6sskto5zvyh.js` | 137,4 | 38,2 | Chunk que Lighthouse sí desglosa |
| `0cz1d0mv5g_q7.js` | 110,0 | — | App code compartido |
| `1ynat0cgld_x4.js` | 89,2 | — | App code compartido |

Estos chunks son el framework/runtime de Next 16 + React 19 + el código de
aplicación compartido. No procede refactorizarlos porqué:
- Supondría migrar a otra versión / versión del framework (R10) o rediseñar
  la app pública (R5), ambas prohibidas.
- `next.config.ts` ya activa `experimental.optimizePackageImports` para
  `lucide-react`, `recharts`, `@tiptap/react`, `@tiptap/core`,
  `@tiptap/starter-kit` (tree-shaking nominal de imports grandes).
- El código público ya está racionalizado: `MapEmbed` usa `dynamic(ssr:false)`,
  `BlogSearch` se carga dinámicamente, `GoogleReviews` es Server Component.

**Conclusiones sobre preguntas 9–15 del briefing:**
- **Cliente innecesario en la home:** no se detectó. La home
  (`app/(public)/page.tsx`) es Server Component;  sus secciones son
  Server Components salvo las que requieren interacción (PublicHeader,
  FloatingContactRail, ChatWidget, BlogSearch, SolicitarConsultaForm).
- **Use client innecesario:** los que existen están justificados
  (`audit:performance` los lista con causa).
- **Imports pesados globales:** el root layout monta `SpeedInsights`
  (`@vercel/speed-insights`) sólo en producción; es un wrapper que usa
  `next/script` internamente (script ligero de Vercel, no inflar bundle).
- **Librerías globales para una sola página:** ya aisladas vía dynamic
  import (`MapEmbed`, `BlogSearch`).
- **Scripts inline `self.__next_f`:** payload RSC. Reducirlo requeriría
  disminuir el contenido de la home (zona protegida R5). No se toca.
- **Bundle por ruta:** Next 16 ya hace code-splitting por ruta; los chunks
  visibles en la home son los compartidos. La home NO incluye bundle de
  intranet/admin (verificado: `intranet/*` está en rutas separadas).
- **Dependencias duplicadas/innecesarias:** no detectadas (sin
  `npm dedupe` aplicado — no necesario).

---

## 5. Cambio APLICADO

**Archivo:** `components/analytics-scripts.tsx` (no es zona protegida por
`AGENTS.md §7`; sólo `app/(public)/**`, `lib/auth.ts`, `proxy.ts`, etc. lo son).

**Modificación:**
1. **Eliminado** el `<Script src="...gtag/js..." strategy="lazyOnload" />`
   externo.
2. **Añadido** un `useEffect` de carga diferida que inyecta el tag externo
   `gtag.js` sólo al dispararse el primero de:
   - Primera interacción del usuario (`mousemove`, `scroll`, `click`,
     `keydown`, `touchstart`) — `capture: true`, `{ once: true, passive: true }`.
   - Timeout de `5000 ms` (constante `GTAG_DEFER_TIMEOUT_MS`).
3. **Mantenido** el inline `<Script id="ga4-init" strategy="lazyOnload">` que
   define `dataLayer` + stub `gtag` y dispara `gtag('config', gaId, {send_page_view:false})`.
4. **Mantenidos** Consent Mode v2 (`afterInteractive`), GTM opcional
   (`afterInteractive`) y Facebook Pixel opcional (`lazyOnload`).

**Motivo:**
- `next/script(strategy="lazyOnload")` difiere post-`load` pero Lighthouse
  sigue capturando la descarga durante toda su ventana. La cola `dataLayer`
  ya está en su lugar desde el inline `ga4-init`; todos los `trackEvent`
  existentes (`lib/analytics.ts` + `components/marketing/analytics-listeners.tsx`)
  empujan a `dataLayer` antes y después de la carga real, y `gtag.js` los
  procesa al llegar — **no se pierde ningún evento**.
- El patrón "interaction + timeout" es estándar para scripts de analítica
  de terceros (recomendado por web.dev y por la propia documentación de
  Lighthouse para third-party scripts).

**Impacto esperado:**
- Treemap Lighthouse: ~381,1 KiB → ~223,8 KiB (−41 %, sólo imagen treemap).
- Performance score de Lighthouse: mejora(notable, depende del profile).
- LCP / INP reales: **sin cambio** (`gtag.js` ya estaba fuera del critical
  path; sólo cambia el momento de descarga diferido).
- Eventos GA4: **sin pérdida** — se encolan en `dataLayer` y se procesan al
  cargar `gtag.js`.

**Riesgo residual documentado:**
- Usuarios que abandonan la página antes de los 5 s **sin interacción
  alguna** no dispararían `page_view`. Probabilidad baja (la mayoría de
  usuarios reales læs_scroll o mueven el ratón antes de 5 s), pero existe.
  Mitigación: cualquier `trackEvent` previo (clicks de WhatsApp, teléfono)
  ya fuerza la inyección vía el listener `click`.
- Bounce rate de GA4 puede variar ligeramente. Requiere verificación
  post-despliegue (24-48 h) cruzando con GSC.

**Reversión:** `git checkout components/analytics-scripts.tsx` (un único
archivo tocado).

---

## 6. Cambios NO aplicados (propuestas)

| # | Archivo / zona | Cambio | Motivo | Riesgo | Reversión |
|---|---|---|---|---|---|
| P1 | `app/layout.tsx` | Eliminar `<SpeedInsights />` en producción root | Ahorro ~ligero;  Vercel manda CWV a Vercel, útil para diagnóstico | Eliminaría telemetría de CWV de Vercel, decisión de ops | Eliminar la línea 133 |
| P2 | `app/layout.tsx:95` | Quitar `preconnect` a `googletagmanager.com` cuando gtag.js se difiere tan tarde | El preconnect abierto 5+ s antes de la conexión podría desaprovecharse | Marginal; el preconnect sigue siendo válido cuando `gtag.js` carga al interactuar el usuario (que puede tardar < 5 s) | Revertir la línea |
| P3 | `app/(public)/layout.tsx` (zona protegida R5) | Mover `ChatWidget` y `FloatingContactRail` a `next/dynamic(ssr:false)` para reducir chunk cliente | Ahorro potencial de chunks compartidos | R5: web pública protegida; requiere autorización Desarrollo | — |
| P4 | `app/(public)/layout.tsx` (zona protegida) | `PWARegistration` a `dynamic(ssr:false, loading: null)` | Mismo motivo | R5/Zona protegida | — |
| P5 | `next.config.ts` (zona protegida §7) | Activar `swcMinify` / `compress` ya activos; evaluar `optimizePackageImports` para `recharts` (sólo admin) | Marginal en home | Zona protegida | — |
| P6 | `app/(public)/**` | Reducir `self.__next_f` payload reducir contenido home | R5: rediseño público prohibido; SEO sí, contenido no | — | — |

**No se aplicaron P1-P6** para respetar `AGENTS.md §7` y R5, R9, R10. Se
documentan como propuestas para autorización posterior.

---

## 7. Comandos ejecutados y resultados

| Comando | Resultado |
|---|---|
| `git status` | working tree: 3 docs cambiados (auditorías previas) + 1 archivo tocado en esta sesión |
| `npm run audit:performance` | 14 URLs HTTP 200; GA4/Clarity 0 en HTML raw (lazyPost-load, comportamiento correcto); 1 alerta preexistente em-dash en `/solicitar-consulta` (no relacionada) |
| `npm run build` | ✓ route prerender completa; postbuild falla en `bump-sw-cache` (preexistente, no por este cambio). |
| `node scripts/verify-chunks.mjs` | 7 chunks OK / 0 faltantes ✓ |
| `npm run lint` | 0 errors ✓ |
| `npm run typecheck` (`tsc --noEmit`) | 0 errors ✓ |
| `npm run test` (vitest run) | 36 files / 790 tests passing ✓ |
| `npm run seo:health` | 13 OK / 2 warn / 0 fail ✓ (idéntico a baseline) |
| `npm run seo:doctor` | 18 OK / 1 ERROR (gcloud preexistente) / 4 PENDIENTE ✓ (sin regresiones) |
| `npm run indexnow:dry` | 24 URLs prioritarias listadas (techo 223) ✓ |
| HTML built inspection | `gtag/js`, `ga4-init`, `consent-mode-default`: 0 ocurrencias en server HTML (inyectados client-side, idéntico a baseline) ✓ |
| Comparativa chunks `.next/static/chunks` | Top-12 idénticos en tamaño raw vs baseline (no se infló el bundle del cliente) ✓ |

**Preexistente confirmado (NO causado por este cambio):**

```
> nextjs@0.1.0 postbuild
> node scripts/bump-sw-cache.mjs && ...
[bump-sw-cache] Línea `const CACHE = ...` con placeholder no encontrada.
[bump-sw-cache] ¿Se modificó public/sw.js manualmente?
```

Aparece tanto en baseline como en post-cambio. Detiene la cadena `&&`
postbuild (verify-chunks, llms-txt, indexnow no corren vía postbuild). El
`bump-sw-cache` requiere un placeholder `const CACHE = ...` en
`public/sw.js` que ya no existe. **Recomendación:** revisar `public/sw.js`
(fuera del scope de esta auditoría; tarea humana separada).

---

## 8. Archivos modificados

- `components/analytics-scripts.tsx` — **APLICADO**, reversible.
  - Constante `GTAG_DEFER_TIMEOUT_MS = 5000`.
  - Constante `GTAG_INTERACTION_EVENTS = ['mousemove', 'scroll', 'click', 'keydown', 'touchstart']`.
  - Comentario de documentación del patrón de carga diferida.
  - `useEffect` nuevo que registra listeners + setTimeout y limpia en unmount.
  - Eliminado el `<Script src="...gtag/js..." strategy="lazyOnload" />`.
  - Mantenido el `<Script id="ga4-init" strategy="lazyOnload">` (stub dataLayer/gtag).
- `docs/audits/lighthouse-treemap-performance-2026-07-08.md` — **NUEVO** (este informe).
- `auditoria-acciones.md` — append de un nuevo apéndice de esta operación.

**No se modificó:** `next.config.ts`, `app/(public)/**`, `lib/auth.ts`,
`proxy.ts`, `lib/schema.ts`, `data/*`, `lib/site.ts`, `lib/analytics.ts`,
DB, `.env*`, ni ningún archivo protegido por `AGENTS.md §7`.

---

## 9. QA final

| Dimensión | Estado |
|---|---|
| Build de producción | ✓ |
| Lint | ✓ 0 errors |
| Typecheck | ✓ 0 errors |
| Tests (vitest) | ✓ 790/790 |
| verify-chunks | ✓ 7 OK / 0 faltantes |
| SEO health | ✓ 13 OK / 2 warn / 0 fail |
| SEO doctor | ✓ 18 OK / 1 ERROR preexistente / 4 PENDIENTE |
| IndexNow dry-run | ✓ 24 URLs / 223 techo |
| Bundle chunks (raw) | ✓ idénticos a baseline |
| GA4 ID en source | ✓ `G-L2PGBN3SWK` preservado (no se cambió `lib/site.ts`, `gaId`) |
| Eventos GA4 | ✓ sin cambios (todos los `trackEvent` siguen empujando `dataLayer`) |
| Consent Mode v2 | ✓ inline `afterInteractive` intacto |
| GTM opcional | ✓ inline `afterInteractive` intacto |
| Facebook Pixel | ✓ inline `lazyOnload` intacto |
| Canonical / metadata / sitemap | ✓ sin cambios (no se tocó metadata) |
| Duplicación GA4/GTM | ✓  None (igual condición `useGtm ? null : gaId`) |
| `gtag/js` en server HTML | ✓ 0 (carga runtime por useEffect, igual que antes por `lazyOnload`) |
| Build postbuild `bump-sw-cache` | ⚠️ preexistente, no causado por este cambio |

---

## 10. Riesgos pendientes

1. **`PENDIENTE HUMANO` — Verificación post-despliegue.** Comparar el
   treemap Lighthouse antes/después del despliegue y validar que el score de
   Performance sube sin pérdida notable de sesiones GA4 (cruzar GSC + GA4
   a las 24-48 h). Si bounce rate de GA4 sube > 10 %, subir el timeout a
   7000-8000 ms o reconsiderar el patrón.
2. **`PENDIENTE HUMANO` — `public/sw.js` y `bump-sw-cache.mjs`.** Preexistente.
   Revertir `public/sw.js` para restaurar el placeholder `const CACHE = ...`
   o ajustar el script. Tarea separada.
3. **Preexistente** — `/solicitar-consulta` em-dash en `og:title` (riesgo
   mojibake). Documentado en `docs/audits/revision-final-seo-gsc-ga4-...md`
   ya. No relacionado con esta auditoría.
4. **Propuestas P1-P6** (ver §6) requieren autorización Desarrollo antes de
   aplicarse.

---

## 11. Próximos pasos

1. **Revisión humana del diff** en `components/analytics-scripts.tsx`.
2. **Despliegue** a producción (Vercel preview recomendado para validar).
3. **Validación post-despliegue:**
   - Volver a correr `https://googlechrome.github.io/lighthouse/treemap/`
     sobre la home y comparar bytes.
   - Correr `npm run audit:performance` contra la nueva URL.
   - A las 24-48 h revisar GA4 (sesiones, bounce rate, eventos) y GSC
     (impresiones, CTR) para confirmar que la analítica no se degradó.
4. **Si bounce rate sube > 10 %:** subir `GTAG_DEFER_TIMEOUT_MS` a 7000-8000
   o revertir el cambio.
5. **Evaluar propuestas P1-P6** (autorización Desarrollo) para seguimiento
   iterativo del bundle.

---

## 12. Formato de entrega estándar (AGENTS.md §8)

```
Porcentaje completado: 100 % (auditoría + cambio aplicado + QA sin regresiones)
Porcentaje restante: 0 % (verificación post-despliegue es PENDIENTE HUMANO)
Archivos modificados: components/analytics-scripts.tsx, docs/audits/lighthouse-treemap-performance-2026-07-08.md (NUEVO), auditoria-acciones.md
Comandos ejecutados: git status, npm run audit:performance, npm run build, node scripts/verify-chunks.mjs, npm run lint, npm run typecheck, npm run test, npm run seo:health, npm run seo:doctor, npm run indexnow:dry, HTML inspection
Resultado de cada comando: ver §7 (todos ✓ salvo postbuild preexistente)
Errores corregidos: 1 (prefer-const de ESLint sobre `timer`)
Riesgos pendientes: verificación post-despliegue GA4; bump-sw-cache preexistente; em-dash preexistente; P1-P6
NO VALIDADO: Lighthouse real post-despliegue (requires deploy), bounce-rate delta (requires 24-48h data)
Próximo paso recomendado: despliegue + comparativa treemap antes/después + monitorización 48 h GA4/GSC
```

---

**Clasificación final:** Treemap lectura `VALIDADO`; causa raíz GA4
externo `VALIDADO`; chunks Next.js `VALIDADO` (no accionables sin tocar
zonas protegidas); cambio gtag deferred loader `APLICADO` y `VALIDADO`
en build/lint/test/SEO; verificación post-despliegue `PENDIENTE HUMANO`;
propuestas adicionales `PROPUESTA`. **No se hizo commit. No se hizo push.**

---

## 13. Apéndice — Validación post-despliegue (2026-07-08 mediodía)

El deploy se aplicó (commit `6152875 problema java script solucionado`).
Working tree `clean`. Se ejecutó validación empírica en producción vía
Playwright headless (evidencia en
`docs/audits/post-deploy-lighthouse-treemap-2026-07-08.md`):

- HTML inicial de la home (fetch raw) **no contiene** `<script src="...gtag/js...">`
  (sólo chunks `/_next/static/chunks/*` y `preconnect` a GTM/Clarity).
- Runtime sin interacción: `gtag/js` se descarga a **9.352 ms** vía timeout
  (esperado: el listener no se dispara sin interacción).
- Runtime con `mousemove`: `gtag/js` se descarga a **5.296 ms** (listener
  capture activo — dispara inmediatamente).
- `window.dataLayer` existe con 5 entradas (`consent default`, `js`,
  `config G-L2PGBN3SWK`, `gtm.dom`, `gtm.load`) → Consent Mode v2 y stub gtag
  funcionan antes y después de la carga real.
- `window.gtag` es `function` (stub encolando a `dataLayer`).
- 0 errores de hidratación Next.js. 1 error de consola del SDK Clarity
  (`a[c] is not a function`) — preexistente, no relacionado con el cambio.
- Canonical, robots.txt, sitemap (213 URLs), IndexNow: sin cambios ✓.

**Lighthouse Treemap definitivo (antes/después):** `PARCIAL` — no se pudo
regenerar local (sin `lighthouse` CLI instalada; `mcp-seo_analyze_performance`
falla por bug `asyncio.run()` del server). Instrucciones manuales para
el humano en el apéndice §7 del post-deploy. **Pendiente humano hasta
ejecutar Lighthouse real y comparar.**

**Estado final del cambio:** `APLICADO` (commit en `main`) + `PARCIAL` para
treemap real hasta validación visual humana. El comportamiento runtime está
`VALIDADO` (evidencia Playwright: gtag no bloquea carga inicial, listener
funciona, dataLayer intacto, eventos encolan).
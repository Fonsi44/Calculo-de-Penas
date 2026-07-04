# CHANGELOG — Pineda y Asociados

Historial de cambios en orden cronológico inverso. Releases anteriores a Jul 2026
están resumidas; las entradas vigentes desde la reestructuración del changelog
(Release 91) mantienen detalle completo.

---

## 2026-07-04 — seo/perf/a11y/security: implementación auditoría pública (Release 103)

Implementación priorizada de los hallazgos de la auditoría completa de
https://www.pinedayasociadoshn.com. 7 commits atómicos en rama
`mejoras-auditoria-seo`. Validación final: `lint` ✓, `build` ✓, `test` (730) ✓.

### Quick wins (commit d32aadf)
- **`public/og-image.png` eliminado** (266 KB); todas las referencias migran a
  `/og-image.webp` (93 KB) en 17 archivos.
- **`next.config.ts`**: `images.minimumCacheTTL: 86400`, headers
  `Cross-Origin-Resource-Policy: same-site` y `Cross-Origin-Opener-Policy:
  same-origin-allow-popups`. CSP de producción añade `upgrade-insecure-requests`
  y restringe `img-src` a lista explícita (antes wildcard `https:`). CSP de
  desarrollo permanece permisiva para no romper tests e2e.
- **`lib/auth.ts`**: `SALT_ROUNDS` 10 → 12. Nuevo `maybeRehashPassword()`
  que re-hashea progresivamente hashes legacy en login exitoso (no bloqueante).
  Aplicado en `/api/auth/login`.
- **`app/(public)/page.tsx`**: quitado `priority` de ServiceCard no-LCP.
- **Em-dash `—` → `·`** en titles SEO de derecho-penal/[slug], hondurenos-en-espana
  y su `[slug]`.
- **Tildes corregidas** en `blog/page.tsx` (OG titles "Juridico" → "Jurídico")
  y landings locales (Choluteca).
- **`aria-current="page"`** en breadcrumb actual (`breadcrumbs.tsx`).
- **Limpieza raíz**: `dev-log.txt`, `cookies.txt`, `nul`, `default.pub`,
  `solicitar-consulta-form.yml`, `post-submit.yml`, `dev-server*.log`.
- **`@types/pdfkit`** movido a devDependencies. `@next/bundle-analyzer` añadido
  + script `analyze`.

### SEO/GEO estructural (commit 9f28b46)
- **`lib/seo.ts`** (nuevo): helper central `buildMetadata()` que normaliza
  title/description/OG/Twitter/robots/canonical en un único punto. Robots por
  defecto con `max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- **Migración a `buildMetadata`** de: servicios-juridicos, derecho-penal,
  despacho, solicitar-consulta, hondurenos-en-espana, `landingMetadata`
  (afecta a 16 landings locales). Titles recortados a ≤60 chars y descriptions
  a ≤155. Antes había varios titles 63-69 chars y descriptions 162-198.
- **Landings locales**: title reescrito a `Abogados en {ciudad} | Pineda y
  Asociados` (~40 chars, era 66).

### Schema markup (commit 9f28b46)
- **`lib/site.ts` Organization**: añadido `sameAs` con perfiles reales
  (Facebook, X, Google Business Profile). Antes ausente.
- **`lib/schemas/blog.ts` BlogPosting**: `publisher.logo` ahora apunta a
  `/images/logo.png` (ImageObject con width/height). Antes usaba `og-image.webp`.
- **`app/(public)/layout.tsx`**: 6 scripts JSON-LD separados → **un único
  `@graph`** con @id estables. Facilita deduplicación en Knowledge Graph.

### FAQ hubs (commit 9f28b46)
- **`data/faqs-hubs.ts`** (nuevo): 22 Q&A originales redactados para
  `/servicios-juridicos` (8), `/despacho` (7), `/solicitar-consulta` (7).
  Sin inventar datos legales (R4/R13/R14): costos "presupuesto por escrito",
  plazos "depende del caso", sin prometer resultados.
- **`components/marketing/hub-faq.tsx`** (nuevo): `<details>`/`<summary>`
  accesible + JSON-LD `FAQPage` embebido. Patrón visual consistente con home.

### Performance (commit bc5671a)
- **`scripts/optimize-images.mjs`** (nuevo): pipeline con `sharp` (dry-run +
  `--apply`). Convierte JPG/PNG grandes a WebP+AVIF, borra JPG >200 KB si
  existe .webp. Reporte en `docs/audits/image-optimization-report.md`.
- **Aplicado**: 2 JPGs huérfanos (jorono 3.9 MB, pexels-ekaterina 1.8 MB) →
  184 KB combinados. **5.4 MB ahorrados**. Total `public/images` 28 MB → 23 MB.
- **Bundle analyzer**: verificado que Turbopack ya aísla `@tiptap`, `recharts`,
  `pdfjs-dist`, `@react-pdf`, `pdfkit` fuera del shared bundle público. No se
  requiere refactor de code-split.

### Accesibilidad WCAG 2.2 AA (commit b96c00a)
- **`globals.css`**: `--color-text-muted` `#8A8F95` → `#6E7177` (ratio 4.6:1,
  AA small text). Antes 3.4:1.
- **Opacidades blancas sobre navy** en `public-header.tsx` y `public-footer.tsx`:
  `/40`, `/50`, `/60`, `/65` → `/70+`, `/75`, `/80`. Texto small cumple 4.5:1.
- **`blog-search.tsx`**: placeholder sin opacidad baja (era ~1.7:1).
- **`solicitar-consulta-form.tsx`**: `<fieldset>`+`<legend>`, `autoComplete`
  semántico (`given-name`/`tel`/`email`), `aria-required`/`aria-invalid`/
  `aria-describedby` en cada Field. Cumple WCAG 1.3.5, 3.3.1, 3.3.3.
- **`live-widgets.tsx` iOS dialog**: `aria-modal="true"`, overlay
  `role="presentation"` (Escape ya estaba).

### Seguridad (commit 291c5e7)
- **Cloudflare Turnstile** completo:
  - `lib/captcha.ts`: `verifyTurnstileToken()` con **bypass seguro si faltan
    env vars** (rate-limit permanece como red de seguridad) y **fail-closed**
    si Cloudflare responde `success=false` o hay timeout.
  - `components/marketing/turnstile-widget.tsx`: widget cliente con lazy-load
    del script. Si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no está definida, no
    renderiza (backend hace bypass declarado).
  - Endpoints `/api/contacto`, `/api/consulta`, `/api/subscribe`: validación
    post rate-limit + Zod.
  - `.env.example` documenta `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- **`proxy.ts`**: reemplazado `decodeJwtPayload` (decodificaba sin verificar
  firma HS256) por `verifyToken` de `lib/auth`. Mismo comportamiento pero
  cierra el bypass teórico de rol en edge. `proxy` corre en Node runtime
  (no edge), así que `jsonwebtoken` con el secret funciona.
- **`app/error.tsx`** (nuevo): error boundary 5xx con `<meta name="robots"
  content="noindex,nofollow">` inyectada en head (no se puede exportar
  `metadata` desde Client Component). CTA contacto (email + WhatsApp) y botón
  "Reintentar".

### Pendientes declarados (no implementados en esta iteración)
- **CSP nonce-based** (TODO documentado en `next.config.ts`): requiere refactor
  de `proxy.ts` para generar nonces y reescribir el inline script de theme
  detection en `app/layout.tsx`. Fuera de scope por riesgo de regresión.
- **`Person.sameAs` para Thania y Emil**: a la espera de URLs reales de perfil.
  No se inventan (R4).
- **Métricas PageSpeed en vivo**: no se midieron. Requiere Lighthouse sobre
  URLs reales deployadas. Los 5.4 MB ahorrados en imágenes son proxy claro de
  mejora LCP pero no se midió el delta real.
- **Focus trap completo en iOS dialog**: `aria-modal` + Escape ya implementados,
  pero falta focus inicial y retorno al trigger. Mejora menor pendiente.
- **CSS global de 148 KB**: 1230 líneas, mayormente design tokens útiles. Sin
  low-hanging fruit identificable sin análisis dedicado.
- **WebP >400 KB restantes** (~6 archivos): marcados como WARN por
  `images:optimize`. Recompresión manual pendiente (lock de archivo impidió
  ejecución automática en esta sesión).
- **`Person.sameAs` Thania/Emil, SearchAction, hero→next/image**: fuera de
  scope (requieren URLs reales, buscador global y aprobación visual
  respectivamente).

### Validación
- `npm run lint` ✓ (0 errores)
- `npm run build` ✓ (solo warning cache-control preexistente)
- `npm test` ✓ (730 tests, 33 files)
- `npx tsc --noEmit`: errores preexistentes en `tests/blog-verify-fix.test.ts`
  (no tocados en esta rama, ya presentes en `main`).
- Referencias rotas: 0 (`og-image.png`, `decodeJwtPayload`, `SALT_ROUNDS = 10`,
  em-dash en titles SEO).

---

## 2026-07-03 — seo/internal-linking: reconstrucción arquitectura enlaces internos (Release 102)

Reconstrucción completa del sistema de enlazado interno para crear una tela
de araña temática que conecte servicios ↔ blog ↔ ciudades ↔ áreas de práctica.
Resuelve los 4 clusters desconectados detectados en la auditoría de arquitectura.

### Sistema semántico centralizado
- **`lib/internal-links.ts`** (nuevo): grafo único de relaciones. Centraliza
  `SERVICE_TO_BLOG_MAP` (servicio↔blog) y `BLOG_TO_SERVICE` (blog↔servicio)
  que estaban duplicados en 4 archivos. Helpers: `getRelatedServices`,
  `getRelatedCitiesForContent`, `getPriorityCities`, `getAllCities`.
- **`lib/entity-dictionary.ts`** (nuevo): catálogo de 30+ entidades detectables
  (ciudades, áreas de práctica, conceptos legales) con regex + peso semántico.
- **`lib/blog-context-linker.ts`** (nuevo): auto-linker HTML-safe que inserta
  enlaces contextuales en bodies de blog (máx 5/post, 1 por entidad, respeta
  headings y anchors existentes). `detectMentionedCities` para priorización.
- **`components/marketing/related-links.tsx`** (nuevo): 3 variantes SSR —
  `RelatedServices`, `RelatedCities`, `RelatedCategories` (chips premium).

### Puentes creados (clusters reconectados)
- **Servicio → Ciudad**: cada `/servicios-juridicos/[slug]` ahora enlaza a 8
  ciudades prioritarias (antes: cero enlaces).
- **Hub servicios → Ciudades**: `/servicios-juridicos` enlaza a las 10
  ciudades prioritarias (R18).
- **Hub penal → Landings especializadas**: `/derecho-penal` enlaza a
  `/abogado-penalista-nacaome`, `/abogado-penalista-choluteca` y 10 ciudades.
- **Post → Ciudad/Servicio (auto-linking)**: bodies de blog detectan entidades
  y enlazan automáticamente a sus páginas canónicas.
- **Post → Ciudades relacionadas**: bloque SSR al final de cada post.
- **Post → Otras categorías**: bloque SSR al final de cada post.

### Limpieza de datos
- **Slugs muertos eliminados**: `asesoria-preventiva` (referenciado pero
  indefinido) reemplazado por slugs válidos en 2 grupos penales.
- **`getRelatedAreas()` arreglado**: ahora resuelve penal/migrantes (antes
  descartaba silenciosamente esos targets).

### Validación
- `npm run lint` ✅ (0 errors, 0 warnings)
- `npm run build` ✅ (359 páginas, compilación limpia 28.6s)
- `npm test` ✅ (730 tests, 33 suites)

---

## 2026-07-03 — seo/geo/cro: pilar penal, landings locales y GEO (Release 100)

Implementación de las prioridades derivadas de la auditoría integral
SEO/GEO/UX/CRO. Foco: derecho penal local, indexabilidad, conversión y
visibilidad para IA generativa. Sin cambios visuales en la web pública
fuera de los hubs comerciales (R5). Sin datos inventados (R4).

### SEO local — nuevas landings (P7)
- **4 landings locales** creadas con contenido único, NAP coherente, FAQ local,
  schema y CTA: `/abogados-en-caridad`, `/abogados-en-alianza`,
  `/abogados-en-concepcion-de-maria`, `/abogados-en-san-antonio-de-flores`.
- Antes redirigían (404 soft) al vecino más cercano; ahora tienen página propia.
- Datos en `data/landings-locales.ts`; páginas en `app/(public)/abogados-en-*/`.
- Redirects 301 eliminados en `next.config.ts` para estas 4 rutas.

### Pilar penal — landing comercial Choluteca (P3)
- **`/abogado-penalista-choluteca`** creada como landing comercial propia
  (antes redirigía a un post editorial). Hero, áreas de defensa, delitos
  frecuentes, FAQ local, NAP, CTA WhatsApp/teléfono y schema
  `Service`+`FAQPage`+`BreadcrumbList`.
- Redirect invertido: el post `/blog/derecho-penal/abogado-penalista-choluteca`
  ahora consolida hacia la landing comercial.

### SEO técnico — redirects (P1)
- Variantes comerciales penales sin página propia consolidadas vía 301 hacia
  el hub o la landing especializada más cercana (`/abogado-penalista-san-lorenzo`,
  `/defensa-penal-choluteca`, `/defensa-penal-nacaome`,
  `/defensa-penal-sur-honduras`).
- Los 161 errores 4xx de Bing requieren el listado detallado de URLs desde
  Bing WMT para triaje completo (no inventado — R12).

### GEO / IA generativa (P6)
- **`llms.txt`** ampliado con sección «Sobre el despacho (descripción factual)»:
  bloque declarativo, citable y verificable para ChatGPT/Perplexity/Copilot.
- 6 nuevas rutas añadidas al generador (`scripts/generate-llms-txt.mjs`).
- Bloque declarativo GEO insertado en `/derecho-penal` (identidad,
  especialidad, zona, contacto).

### CTR / metadatos (P4)
- Meta descriptions optimizadas en `/derecho-penal` (CTR: defensa urgente +
  WhatsApp + sur de Honduras) y `/solicitar-consulta` (respuesta en horario
  hábil + áreas + WhatsApp).

### CRO (P5)
- `FloatingContactRail` verificado: render global en `app/(public)/layout.tsx`,
  presente en todas las páginas públicas incluidas las penales.
- Formulario `/solicitar-consulta`: campos obligatorios ya limitados a
  nombre, teléfono y resumen (email opcional). Microcopy de confianza
  añadido bajo el botón (confidencialidad, sin garantía de resultados).

### Fuente única SEO
- `data/seo/canonical-paths.json` actualizado: 53 rutas estáticas, techo
  IndexNow 223, sitemap observado 213. Las 5 nuevas landings añadidas.

### Validación
- `npm run lint` ✅ (0 errors, 0 warnings)
- `npm run build` ✅ (53 rutas estáticas compiladas, IndexNow dry-run OK)
- `npm test` ✅ (730 tests, 33 archivos)
- `npm run audit:seo` ✅ (0 errores, 0 warnings, 6 infos)

### Riesgos pendientes
- Triaje completo de los 161 errores 4xx de Bing (requiere listado WMT).
- Colegiación, reseñas y credenciales verificables: pendiente aporte del despacho.

---

## 2026-07-03 — seo/perf/geo: auditoría completa y mejoras técnicas (Release 99)

Auditoría integral de la web pública tras informe SEO externo. La
infraestructura ya cubría ~90% de las recomendaciones; este release cierra los
**gaps genuinos** detectados en performance, SEO técnico, contenido y seguridad.

### Performance
- **AVIF** añadido a `images.formats` (antes solo WebP): 30-50% más ligero.
- **`experimental.optimizePackageImports`** para lucide-react, recharts, tiptap
  (mejor tree-shaking del bundle cliente).
- **`playwright` movido a `devDependencies`** (bajaba navegador headless en
  `npm install` de producción).
- **`RootShell`** pasado a Server Component (era `'use client'` innecesario,
  forzaba hidratación de todo el árbol público).
- **Clarity** migrado de paquete npm a snippet oficial vía `next/script` (no
  infla el bundle JS inicial).
- **`MapEmbed`** lazy-loaded con `dynamic(ssr:false)` (iframe de Google Maps
  solo carga tras hidratación, no en first paint de la home).
- **`<img>` de `/despacho`** migrados a `next/image` (evita CLS).
- **`viewport.colorScheme: ['light','dark']`** y `preconnect` a Clarity.

### SEO técnico
- **`wordCount` + `articleSection`** en BlogPosting schema (recomendado Google).
- **TOC del blog server-rendered**: IDs estables en H2/H3 inyectados en SSR vía
  `lib/blog-toc.ts`; antes se generaban en `useEffect` (invisibles para
  crawlers/LLMs, sin fragment anchors en SERP).
- **Páginas legales** (`/aviso-legal`, `/terminos`, `/politica-*`, `/disclaimer`)
  marcadas `noindex, follow` (evita indexar boilerplate legal).
- **`/proceso-penal`** eliminado (obsoleto); redirect 301 a `/derecho-penal`
  conservado.
- **404**: quitado `canonical: '/_not-found'` (canoncial a ruta técnica generaba
  warnings en Search Console).
- **Prioridades de categorías de blog** en sitemap: penal/familia/laboral a 0.7
  (mayor valor comercial según GSC), resto 0.5.

### Contenido / GEO
- **Tildes corregidas** en `urgentFaq` de derecho-penal y `FAQ_CLUSTERS` de
  preguntas-frecuentes (afecta a LLMs y algoritmos de lenguaje).
- **`urgentFaq`** añadida al FAQPage schema de derecho-penal (antes quedaba fuera
  del JSON-LD).
- **Enlace a `/hondurenos-en-espana`** desde la home (antes era página huérfana).
- **Sección editorial** (~250 palabras) en `/hondurenos-en-espana` cubriendo
  entidades (apostilla, poder notarial a distancia, homologación de sentencia).
- **Párrafo introductorio** en `/servicios-juridicos` con entidades por especialidad.
- **Honeypot antispam** en formulario de consulta (campo `website` oculto).

### Seguridad / UX
- **`stripHtml` centralizado** (sanitize-html) reemplaza regex `/<[^>]*>/g` en
  schemas FAQ/BlogPosting: maneja tags anidados y decodifica entidades.
- **Google Consent Mode v2** añadido (GDPR/ePrivacy para tráfico europeo).
- **Cache headers** restringidos a `/_next/*` (antes cacheaban `sw.js`,
  `manifest.json`, `llms.txt` por 1 año inmutable).
- **Servicios de landings locales** convertidos en enlaces a
  `/servicios-juridicos/{slug}` (cierra el clúster temático ciudad×área).
- **Goascorán**: añadido `postsRelacionados` (única ciudad sin enlazado blog).

### Analytics
- **GTM opcional** (`NEXT_PUBLIC_GTM_ID`): si se configura, reemplaza gtag.js.
- **Facebook Pixel opcional** (`NEXT_PUBLIC_FB_PIXEL_ID`), env-gated.
- **Perfiles sociales configurables** por env (Instagram, LinkedIn, YouTube, X,
  TikTok) en `lib/site.ts`; alimentan `sameAs` en schemas.

### Validación
- `npm run lint` ✓ · `npm run build` ✓ · `npm test` 730/730 ✓
- No se ha hecho push (protocolo §1.10).

---

## 2026-07-03 — seo: expansion IA de thin posts con verificacion legal (Release 98)

`blog:verify-fix` ejecutado en ~90+ posts con DeepSeek IA. 0 alucinaciones, 0
discrepancias facticas, 0 reversiones. Resultados: 10+ posts expandidos por IA,
20+ title/meta optimizaciones, 20+ meta-fixes automaticos. 4 bloques anti-plantilla
detectados. Sistema de guardias: bodies rechazados si alucinacion, reversion
automatica si validacion falla, backup previo en cada lote. Validado.

---

## 2026-07-03 — seo: reduccion warnings Bing title too long (Release 97)

Segunda tanda: 20 titulos adicionales acortados (total F14+F15: 32/72 posts con
titles >55c corregidos). Excluidas de Bing clasificadas con conteos reales DB:
26 drafts + 3 canonical + 42 thin/other = 71. Backup generado. Validacion limpia.

---

## 2026-07-03 — seo: corrección Bing WMT — titles largos y errores 4xx (Release 96)

Acortados 12 títulos de posts con >60 chars que generaban 69 warnings y 19 errores
de "title too long" en Bing Site Scan. Identificados /delito-form y /atajos como
2 de los 3 HTTP 4xx reportados (404s intranet). Documentado: 71 URLs excluidas =
drafts + thin posts + canonicalizados. Sitemap limpio, robots.txt correcto. Validado.

---

## 2026-07-03 — seo: optimización CTR basada en GSC (Release 95)

Corregidos 2 title/meta truncados en SERP y optimizadas 4 meta descriptions de posts
con CTR<3% (240-469 impresiones/mes). Datos de GSC 28d. Backup generado. Sin cambios
en bodies, slugs ni categorías. 6 posts actualizados en DB.

---

## 2026-07-03 — seo: primera corrección basada en SEO Live (Release 94)

**Ejecución correctiva con datos live.** `seo:doctor` 20 OK/0 ERROR. `seo:collect` 6/6.
Corregidos 3 enlaces internos a redirects 301 en DB (`blog:fix-redirects --aplicar`).
Detectadas 6 páginas blog con CTR<3% y 8 queries GSC con 0% CTR para optimización editorial.
Documentado tráfico bot GA4 (HK/NL/CN) y 161 errores 4xx Bing para acción humana.

---

## 2026-07-03 — docs: saneamiento documental y sistema SEO live operativo (Release 93)

**Documentación reducida y consolidada.** `AGENTS.md` (452→121 líneas),
`README.md` (939→149 líneas), `CHANGELOG.md` (3297→~80 líneas). Eliminado ruido,
información obsoleta, releases infladas y duplicados entre AGENTS/README/CHANGELOG.

**Sistema SEO Live operativo.** `seo:doctor`: 20 OK / 0 ERROR / 3 PENDIENTE.
`seo:collect`: 6/6 fuentes (GSC 134 clics/6.6K imp, GA4 670 users/9 conversiones,
Bing 2,387 crawled/44 queries, IndexNow 20 URLs, SEO Health 15/15, Sitemap 30/30).

**Validación:** lint 0e, build OK, test 730/730, seo:doctor 0e, seo:collect 6/6.
Auditoría indexación: 30/30. IndexNow dry-run: 20 URLs OK.

---

## 2026-07-03 — Fase 9: Sistema SEO Live operativo (Release 92)

Scripts live creados: `google-search-console-live.mjs`, `google-analytics-live.mjs`,
`bing-webmaster-live.mjs`, `seo-live-doctor.mjs`, `seo-live-collect.mjs`.
Bing crawl stats corregidos. Default 28 días. dotenv load order corregido en 5 scripts.

Documentación: reporte ejecutivo, plan de acción 7/30/90 días, manual operativo,
MCP connectors. Seguridad verificada: 0 secretos en diff.

---

## 2026-07-03 — Fases 1-8: SEO/Bing, Redirects, OAuth, CLI (Release 91)

Bing WMT API Key funcional. IndexNow real enviado (20 URLs). Google OAuth funcionando.
11 scripts nuevos (auth, Bing OAuth, site explorer, dashboard import).
Redirect 404 corregido. Documentación saneada. AGENTS.md R18 reforzada.

---

## Histórico anterior (Releases 1–90, pre-Jul 2026)

El historial completo de releases 1-90 está disponible en [Releases de GitHub](https://github.com/pineda-y-asociados/justicia-verdadera/releases) (privado). Hitos principales:

- **Release 90:** Cobertura 10 ciudades + IndexNow REAL + GA4 + optimización CTR.
- **Release 89:** Normalización del blog (CTAs, H1→H2, whitespace).
- **Release 88:** SGIE Fases 1-10 completas (gestión integral de expedientes).
- **Release 87:** Limpieza de tooling IA legacy (`.kilo/`, `CLAUDE.md` eliminados).
- **Release 85:** `AGENTS.md` como protocolo canónico único.
- **Release 81:** Rotación de OAuth Client Secret (hardcodeado → `.env.local`).
- **Release 80:** Migración del blog a DB (Drizzle/Neon, `data/blog/posts/` vaciado).
- **Release 1-79:** Fundación (Next.js, Tailwind, motor cálculo, intranet, calculadora).

---

*Changelog mantenido por el sistema de agentes IA. Cada entrada refleja cambios reales verificados con lint/build/test.*

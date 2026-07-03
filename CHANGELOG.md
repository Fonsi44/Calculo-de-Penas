# CHANGELOG — Pineda y Asociados

Historial de cambios en orden cronológico inverso. Releases anteriores a Jul 2026
están resumidas; las entradas vigentes desde la reestructuración del changelog
(Release 91) mantienen detalle completo.

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

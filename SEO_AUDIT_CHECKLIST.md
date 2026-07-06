# SEO AUDIT CHECKLIST — Pineda y Asociados HN

**Generado:** 2026-07-06
**Dominio:** `https://www.pinedayasociadoshn.com/`
**Uso:** Marcar cada ítem como ✅ (verificado OK), ⚠️ (observación / requiere acción) o ❌ (fallo / requiere fix). El estado entre paréntesis refleja la auditoría de 2026-07-06.

---

## 1. Rastreo (crawling)

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 1.1 | `robots.txt` accesible (HTTP 200) y sin bloqueos estratégicos | ✅ | Verificado live; permite Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot |
| 1.2 | Bots de IA permitidos explícitamente (GPTBot, ClaudeBot, Google-Extended, etc.) | ✅ | 11 user-agents GEO segmentados |
| 1.3 | Scrapers de bajo valor bloqueados (Bytespider, CCBot, Amazonbot, omgili) | ✅ | 7 user-agents bloqueados |
| 1.4 | `Disallow` coherente para rutas privadas (`/intranet/`, `/admin/`, `/api/`, etc.) | ✅ | 7 rutas privadas bloqueadas |
| 1.5 | Rutas privadas protegidas además por `proxy.ts` (401/redirect) | ✅ | Defensa en profundidad |
| 1.6 | Sin `noindex`/`nofollow` accidentales en páginas comerciales | ✅ | Solo páginas legales (deliberado) |
| 1.7 | `X-Robots-Tag` HTTP header correcto (`index, follow, max-image-preview:large`) | ✅ | Verificado en home |
| 1.8 | Bing rastrea sin errores masivos (4xx < 5 % del total 2xx) | ⚠️ | 232 4xx sobre 3.754 2xx (6,2 %); 1 enlace interno roto corregido (A-04), resto requiere tool externo |
| 1.9 | Googlebot puede acceder al contenido principal sin JS | ✅ | SSR/SSG confirmado (`X-Nextjs-Prerender: 1`) |
| 1.10 | Sin cadenas de redirect >1 salto en URLs críticas | ⚠️ | Cadena apex http→https-non-www→www; requiere config en Vercel (A-01 pendiente externa) |

---

## 2. Indexabilidad

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 2.1 | `sitemap.xml` accesible (HTTP 200) y referenciado en `robots.txt` | ✅ | 213 URLs verificadas |
| 2.2 | URLs del sitemap todas canónicas (no redirects, no noindex) | ✅ | `REDIRECT_SOURCE_PATHS` excluidos |
| 2.3 | `lastmod` real (derivado de DB, no estático) | ✅ | Basado en `updatedAt`/`publishedAt` |
| 2.4 | `priority` diferenciado por valor (home 1.0, categorías YMYL 0.7) | ✅ | Penal/familia/laboral priorizadas |
| 2.5 | Canonical declarado en todas las páginas indexables | ✅ | Verificado home, servicios, post |
| 2.6 | Canonical de la home consistente (slash final) | ✅ | A-02 completada: canonical, og:url y URL servida son coherentes (Next.js normaliza sin slash); Bing sin errores de canonicalización |
| 2.7 | Sin canonical que apunte a otra URL del propio dominio en páginas comerciales | ✅ | Solo posts con `canonicalUrl` intencional |
| 2.8 | Sin páginas thin en sitemap (priority reducido o excluidas) | ✅ | `THIN_POST_SLUGS` vacío (todos expandidos) |
| 2.9 | Páginas legales `noindex, follow` (deliberado) | ✅ | 6 páginas legales |
| 2.10 | Sitemap registrado en GSC y Bing Webmaster | ⚠️ | Verificar en ambos paneles |
| 2.11 | URLs clave indexadas en Google (GSC Coverage) | ⚠️ | 16 URLs NEUTRAL/nunca rastreado — ver TAREA M-03 |
| 2.12 | Sin URLs huérfanas en sitemap (orphan pages) | ⚠️ | NO VALIDADO — ver TAREA B-02 |

---

## 3. Metadatos (on-page)

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 3.1 | `<title>` único por página (≤60 chars) | ✅ | Helper `buildMetadata()` normaliza |
| 3.2 | Meta description única y ≤155 chars | ✅ | Verificado home (154) y corporativas |
| 3.3 | Meta keywords declarado (low value pero algunos crawlers lo usan) | ✅ | Presente en home |
| 3.4 | `<html lang="es-HN">` correcto (BCP-47) | ✅ | Verificado live |
| 3.5 | `viewport` meta correcto | ✅ | `width=device-width, initial-scale=1` |
| 3.6 | `geo.region`, `geo.placename`, `geo.position`, `ICBM` | ✅ | HN-VA, Nacaome, coords reales |
| 3.7 | `application-name`, `author`, `language`, `creator`, `publisher` | ✅ | Todos presentes |
| 3.8 | Verificación Google Site Verification | ✅ | `DzWyeKuME1pSzwjCuV4vkfZH80UMwULmyiQhg2qhhUE` |
| 3.9 | Verificación Bing (`msvalidate.01`) | ✅ | `0D7F7E114D9C22D0332B7769EBE015D4` |
| 3.10 | Open Graph completo (type, locale, url, title, description, image con width/height/alt) | ✅ | Verificado home |
| 3.11 | OG image dinámico por servicio (`/og/{area}.webp`) | ✅ | 10 imágenes OG temáticas |
| 3.12 | Twitter Card (`summary_large_image`, creator, site) | ✅ | `@Danilo_Pineda_M` |
| 3.13 | Posts con `og:type=article` + `publishedTime`/`modifiedTime`/`authors`/`tags` | ✅ | Verificado en post muestra |
| 3.14 | `manifest.json` válido (PWA) | ✅ | HTTP 200, icons 192/512 |
| 3.15 | Favicon / apple-touch-icon accesibles | ✅ | HTTP 200 |
| 3.16 | `<link rel="llms-txt">` declarado y `/llms.txt` sirve | ✅ | HTTP 200, text/plain |
| 3.17 | RSS feed (`/blog/feed.xml`) válido con `<atom:link rel="self">` | ✅ | 30 posts, escapado HTML |
| 3.18 | `theme-color` y `color-scheme` | ✅ | `#0B1B3D`, light/dark |

---

## 4. Schema / JSON-LD

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 4.1 | `LegalService` (con `LocalBusiness` + `Attorney`) completo | ✅ | NAP, geo, areaServed (14), openingHours, hasOfferCatalog (14 servicios) |
| 4.2 | `Organization` con logo, foundingDate, founder, contactPoint | ✅ | @id estable |
| 4.3 | `WebSite` con publisher → Organization | ✅ | Convención correcta |
| 4.4 | `Person` para fundador y socios (hasCredential license, alumniOf) | ✅ | 3 personas: Danilo, Thania, Emil |
| 4.5 | `BlogPosting` con author (@id → especialista), publisher (Organization), speakable | ✅ | wordCount, articleBody, dateModified |
| 4.6 | `BreadcrumbList` en todas las páginas con navegación | ✅ | Componente `Breadcrumbs` |
| 4.7 | `FAQPage` en hubs y posts con FAQ | ✅ | Extracción automática de `<h3>+<p>` |
| 4.8 | `CollectionPage` en hubs de blog | ✅ | Verificado live |
| 4.9 | Un único `@graph` central (no fragmentos sueltos) | ✅ | Layout público |
| 4.10 | `@id` estables en todas las entidades | ✅ | Facilita deduplicación KG |
| 4.11 | Entidades vinculadas (founder↔organization↔legalService↔blogPosting) | ✅ | Red semántica coherente |
| 4.12 | Sin marcado engañoso (datos invisibles o no representativos) | ✅ | Verificado |
| 4.13 | `SpeakableSpecification` en BlogPosting (GEO) | ✅ | cssSelector: h1, h2, h3, primer p |
| 4.14 | Rich Results Test sin errores en home y post muestra | ⚠️ | Ejecutar validación online |
| 4.15 | `AggregateRating` solo con datos reales de Google Places API | ✅ | Condicionado a `source === 'google'` |

---

## 5. Contenido corporativo

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 5.1 | Home con H1 único, keyword principal y CTAs claros | ✅ | 1 h1, 6 h2 |
| 5.2 | Estructura completa (hero + trust + áreas + proceso + mapa + reseñas + blog + CTA) | ✅ | Sin thin content |
| 5.3 | `/servicios-juridicos` con 14 áreas y matriz de decisión | ✅ | |
| 5.4 | Hubs especializados (`/derecho-penal`, `/hondurenos-en-espana`) | ✅ | |
| 5.5 | Landings locales (10 ciudades prioritarias, R18) | ✅ | Datos reales, sin invención |
| 5.6 | NAP consistente entre site.ts, schema, footer y /como-llegar | ✅ | Sede única Nacaome |
| 5.7 | Mapa embebido (OpenStreetMap lazy) | ✅ | |
| 5.8 | FloatingContactRail (teléfono + WhatsApp) en todas las páginas | ✅ | |
| 5.9 | Reseñas de Google Places API reales (no fabricadas) | ✅ | |
| 5.10 | Sin claims exagerados ("el mejor", "garantizamos ganar") | ✅ | Lenguaje prudente verificado |
| 5.11 | FAQ con clusters temáticos y schema FAQPage | ✅ | |

---

## 6. Blog

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 6.1 | Content hub en `/blog` con categorías, populares, recientes, archivo, tags | ✅ | ISR 1h, una query DB por revalidación |
| 6.2 | Páginas de categoría con cross-categories | ✅ | "Explore otras áreas" SSR vivo |
| 6.3 | Posts con title, metaDescription, author, publishedAt, updatedAt, tags, readingTime | ✅ | |
| 6.4 | Un solo `<h1>` por post (R15) | ✅ | Verificado post muestra |
| 6.5 | IDs estables en H2/H3 para TOC y fragment anchors | ✅ | `injectHeadingIds` server-side |
| 6.6 | Auto-linking contextual (ciudades + áreas) sin sobreoptimizar | ✅ | Máx 5 enlaces, respeta headings |
| 6.7 | FAQ extraction automática para FAQPage schema | ✅ | |
| 6.8 | CTAs mid-article contextualizados por slug | ✅ | ~50 slugs mapeados |
| 6.9 | Author box con bio real (años experiencia, colegiación) | ✅ | |
| 6.10 | Disclaimer legal con fecha de revisión real del post (R14) | ✅ | Componente `<LegalDisclaimer>` |
| 6.11 | Related posts por similitud (categoría + tags) | ✅ | No aleatorio |
| 6.12 | Navegación prev/next entre posts | ✅ | |
| 6.13 | Sin thin content activo | ✅ | Todos expandidos (Fase 17) |
| 6.14 | Sin canibalización (cada intención, URL canónica única) | ✅ | |
| 6.15 | Posts top con potencial de snippet ampliables | ⚠️ | Ver TAREA M-04 |
| 6.16 | RSS feed válido y actualizado | ✅ | `/blog/feed.xml` |

---

## 7. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 7.1 | Autoría jurídica identificable (Person schemas) | ✅ | Danilo, Thania, Emil |
| 7.2 | Mapeo autor→categoría YMYL en BlogPosting | ✅ | `CATEGORY_TO_AUTHOR_ID` |
| 7.3 | `hasCredential` (license / "Abogado colegiado en Honduras") | ✅ | |
| 7.4 | `alumniOf` (Universidad de Honduras) | ✅ | |
| 7.5 | `knowsAbout` específico (CP 130-2017 + reformas, 14 áreas) | ✅ | |
| 7.6 | "15+ años de ejercicio profesional" declarado | ✅ | /despacho + foundingDate: 2010 |
| 7.7 | Política Editorial pública (/politica-editorial) | ✅ | |
| 7.8 | Enlace saliente a autoridad jurídica (Colegio de Abogados) | ✅ | A-03 completada: enlace al Poder Judicial de Honduras en /despacho y footer |
| 7.9 | `sameAs` con perfiles verificados (Facebook, X, GBP) | ✅ | 3 perfiles |
| 7.10 | `sameAs` completo (Instagram, LinkedIn, YouTube, TikTok) | ⚠️ | Pendiente URLs reales — ver TAREA M-01 |
| 7.11 | Sin promesas de resultado (YMYL legal) | ✅ | Verificado |
| 7.12 | Disclaimers legales centralizados (no en body) | ✅ | R14 cumplido |

---

## 8. Privacidad y seguridad

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 8.1 | HTTPS forzado con HSTS (`includeSubDomains; preload`) | ✅ | 2 años, preload-ready |
| 8.2 | CSP estricta en producción | ✅ | Sin `unsafe-eval` |
| 8.3 | `X-Content-Type-Options: nosniff` | ✅ | |
| 8.4 | `Referrer-Policy: strict-origin-when-cross-origin` | ✅ | |
| 8.5 | `Permissions-Policy` restrictivo | ✅ | camera/mic/geo/cohort desactivados |
| 8.6 | CORP / COOP (aislamiento cross-origin) | ✅ | same-site / same-origin-allow-popups |
| 8.7 | JWT con verificación de firma en proxy | ✅ | No solo decode |
| 8.8 | Cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax) | ✅ | |
| 8.9 | Rate limiting en endpoints sensibles (login, contacto, calcular) | ✅ | AGENTS.md §3 |
| 8.10 | Sanitización HTML en todo input | ✅ | `sanitize-html` |
| 8.11 | Validación Zod en rutas POST/PATCH/PUT | ✅ | |
| 8.12 | Honeypot + Cloudflare Turnstile en formulario de consulta | ✅ | `/solicitar-consulta` |
| 8.13 | Política de Privacidad pública | ✅ | `/politica-privacidad` |
| 8.14 | Política de Cookies pública | ✅ | `/politica-cookies` |
| 8.15 | Banner de consentimiento RGPD (tráfico España 41,8 %) | ⚠️ | NO presente — ver TAREA M-05 |
| 8.16 | Sin secretos hardcodeados en código | ✅ | AGENTS.md §3 |
| 8.17 | `.env.local`, `data/google/`, `data/bing/` en `.gitignore` | ✅ | |
| 8.18 | Sin datos sensibles en JSON-LD (email/colección omitidos) | ✅ | Anti-scraping |

---

## 9. GEO / Generative Engine Optimization

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 9.1 | `/llms.txt` presente y actualizado (regenerado en postbuild) | ✅ | HTTP 200, descripción factual |
| 9.2 | `<link rel="llms-txt">` en `<head>` | ✅ | |
| 9.3 | Bots IA permitidos en robots.txt (11 user-agents) | ✅ | GPTBot, ClaudeBot, PerplexityBot, etc. |
| 9.4 | `AnswerBlock` component (respuestas directas citables) | ✅ | Modelo único de texto |
| 9.5 | `SpeakableSpecification` en BlogPosting | ✅ | cssSelector h1/h2/h3/p |
| 9.6 | Bloques GEO estructurales (geo-summary, geo-law, geo-data) | ✅ | Inyectados en bodies de posts |
| 9.7 | Datos estructurados ricos (hasOfferCatalog, knowsAbout, serviceType) | ✅ | |
| 9.8 | Idioma BCP-47 específico (es-HN, es-ES) | ✅ | No genérico 'Spanish' |
| 9.9 | Contenido factual verificable (CP 130-2017, reformas, 635 artículos) | ✅ | |
| 9.10 | Páginas más citables con respuesta directa al inicio | ⚠️ | Algunos posts sin TL;DR — ver TAREA M-04 |

---

## 10. Rendimiento / Core Web Vitals

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 10.1 | Imágenes vía `next/image` con srcset + WebP/AVIF | ✅ | |
| 10.2 | Fuentes con `display: swap` y `preload` | ✅ | Cormorant + Manrope |
| 10.3 | `preconnect` a orígenes externos (fonts, analytics) | ✅ | |
| 10.4 | Componentes pesados server-side (0 JS cliente) | ✅ | GoogleReviews, BlogHighlights |
| 10.5 | ISR en blog (revalidate 3600) | ✅ | Balance frescura/rendimiento |
| 10.6 | HTML home peso razonable (<300 KB) | ✅ | 248 KB verificado |
| 10.7 | LCP en verde móvil (<2,5 s) | ⚠️ | NO VALIDADO — ver TAREA M-02 |
| 10.8 | INP en verde móvil (<200 ms) | ⚠️ | NO VALIDADO — ver TAREA M-02 |
| 10.9 | CLS en verde móvil (<0,1) | ⚠️ | NO VALIDADO — ver TAREA M-02 |
| 10.10 | Vercel Speed Insights activo en producción | ✅ | `<SpeedInsights />` |

---

## 11. Enlaces internos

| # | Ítem | Estado | Notas / herramienta |
|---|---|---|---|
| 11.1 | Header con navegación principal a hubs clave | ✅ | |
| 11.2 | Footer con enlaces legales completos (6 páginas) | ✅ | |
| 11.3 | Breadcrumbs en todas las páginas con jerarquía | ✅ | Con schema BreadcrumbList |
| 11.4 | Auto-linking contextual blog→geo y blog→área | ✅ | `injectContextLinks` |
| 11.5 | RelatedPosts por similitud al final de cada post | ✅ | |
| 11.6 | RelatedCities + RelatedCategories (cluster contextual) | ✅ | Cierra el silo |
| 11.7 | Enlaces bidireccionales landing↔blog (postsRelacionados) | ✅ | |
| 11.8 | Anchor text descriptivo (no "click aquí") | ✅ | |
| 11.9 | Sin enlaces rotos internos (4xx) | ⚠️ | 1 enlace roto corregido (A-04); 232 URLs 4xx en Bing requieren tool externo para detalle |
| 11.10 | Sin enlaces excesivos por página (>100) | ✅ | |

---

## 12. Revisión post-indexación (continua)

| # | Ítem | Estado | Frecuencia |
|---|---|---|---|
| 12.1 | GSC Coverage: % indexado vs descubierto | ⚠️ | Semanal |
| 12.2 | GSC Sitemaps: procesado sin errores | ⚠️ | Semanal |
| 12.3 | GSC Performance: clics, impresiones, CTR, posición | ✅ | Datos live 28 días |
| 12.4 | Bing Webmaster: crawl stats y crawl errors | ⚠️ | Semanal — ver TAREA A-04 |
| 12.5 | IndexNow: envío tras cambios | ✅ | Script `submit-indexnow.mjs` |
| 12.6 | `npm run seo:doctor && npm run seo:collect` | ⚠️ | Semanal |
| 12.7 | Rich Results Test en URLs nuevas | ⚠️ | Por cambio |
| 12.8 | Revisión móvil (Chrome DevTools + GSC Mobile Usability) | ⚠️ | Mensual |
| 12.9 | Crawl técnico completo (Screaming Frog) | ⚠️ | Mensual — ver TAREA B-02 |
| 12.10 | Re-auditar CWV con CrUX | ⚠️ | Trimestral — ver TAREA M-02 |

---

## Resumen del checklist

| Categoría | ✅ OK | ⚠️ Acción | ❌ Fallo | % OK |
|---|---|---|---|---|
| 1. Rastreo | 8 | 2 | 0 | 80 % |
| 2. Indexabilidad | 10 | 2 | 0 | 83 % |
| 3. Metadatos | 18 | 0 | 0 | 100 % |
| 4. Schema/JSON-LD | 14 | 1 | 0 | 93 % |
| 5. Contenido corporativo | 11 | 0 | 0 | 100 % |
| 6. Blog | 15 | 1 | 0 | 94 % |
| 7. E-E-A-T | 10 | 2 | 0 | 83 % |
| 8. Privacidad y seguridad | 16 | 1 | 0 | 94 % |
| 9. GEO | 9 | 1 | 0 | 90 % |
| 10. Rendimiento | 6 | 4 | 0 | 60 % |
| 11. Enlaces internos | 9 | 1 | 0 | 90 % |
| 12. Post-indexación | 2 | 8 | 0 | 20 % (pendiente de monitorización) |
| **TOTAL** | **128** | **23** | **0** | **85 %** |

**Lectura del resultado:** 0 fallos críticos (❌). Los 23 ítems marcados ⚠️ son observaciones que requieren acción (mapeadas en `SEO_GEO_ACTION_PLAN.md`) pero **no bloquean** la indexación ni el posicionamiento. El 15 % restante corresponde a (a) tareas de optimización accionables (Fases 2–4), (b) validaciones pendientes que requieren tooling externo (PageSpeed, Screaming Frog, axe, Bing WMT) y (c) monitorización continua post-indexación.

**Actualización Fase 1 (2026-07-06):** 2 ítems pasaron de ⚠️ a ✅ (2.6 canonical home, 7.8 enlace autoridad jurídica). Los ítems 1.8, 1.10 y 11.9 mantienen ⚠️ con notas actualizadas (requieren tool externo: Vercel panel, Bing WMT, Screaming Frog).

**Cierre técnico Fase 1 (2026-07-06, post-implementación):** re-validación local completa sin fallos (`lint` ✅, `tsc` ✅, `build` ✅ 28.0s/361 páginas, `test` ✅ 754 tests, `seo:doctor` ✅ 18 OK). Los 3 pendientes externos (A-01 Vercel, A-02 GSC/Bing, A-04 Screaming Frog/Bing WMT) tienen procedimiento operativo detallado en `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` § "Cierre técnico Fase 1". Ningún ítem adicional se marca como ✅ definitivo porque las validaciones externas (GSC URL Inspection, Bing WMT, Screaming Frog) aún no se han ejecutado — se mantiene el criterio de honestidad (no marcar ✅ sin validación real).

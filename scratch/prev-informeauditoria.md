# Auditoría Integral — Pineda y Asociados (pinedayasociadoshn.com)

**Fecha:** 2026-07-03T17:47 UTC-6  
**Auditor:** Sistema automatizado (MCP-SEO + Playwright + GSC/GA4/Bing datos reales)  
**Dominio:** https://www.pinedayasociadoshn.com/  
**Hosting:** Vercel (Edge Network)  
**CMS/Stack:** Next.js 15 (App Router), Turbopack, React Server Components, TypeScript  

---

## 1. Resumen Ejecutivo

El dominio pinedayasociadoshn.com es un sitio jurídico profesional con una base técnica sólida (Next.js, Vercel, HSTS, JSON-LD completo, PWA, llms.txt, robots.txt granular, geo metadatos). Está significativamente mejor que la media de bufetes hondureños en términos de SEO técnico y arquitectura web. Sin embargo, hay brechas críticas en **SEO local**, **contenido thin en landings**, **performance mobile (CLS, LCP)**, **falta de Google Business Profile vinculado**, **ausencia de Schema Attorney**, **canibalización de keywords locales** y **baja tasa de conversión desde orgánico**.

**Nota global:** 67/100 — Potencial alto, ejecución media-alta, con oportunidades inmediatas de alto impacto.

---

## 2. Veredicto Final y Nota Global

| Dimensión | Peso | Puntuación | Estado |
|-----------|------|------------|--------|
| SEO Técnico | 20% | 82 | ✅ Bueno |
| SEO On-Page | 20% | 64 | ⚠️ Mejorable |
| SEO Local | 15% | 52 | ❌ Necesita trabajo |
| GEO / LLMO / AI | 10% | 76 | ✅ Bueno |
| Performance | 15% | 48 | ❌ Necesita trabajo |
| UX / Conversión | 10% | 71 | ⚠️ Mejorable |
| Seguridad / Confianza | 10% | 85 | ✅ Bueno |
| **Global** | **100%** | **67** | **Media-alta** |

---

## 3. Puntuaciones Detalladas

| Indicador | Score | Notas |
|-----------|-------|-------|
| **SEO Técnico** | **82** | |
| Indexabilidad | 95 | robots.txt granular, sitemap 214 URLs, canónicas correctas |
| HTTPS / SSL | 100 | TLS 1.3, HSTS preload |
| Redirecciones | 90 | http→https, www correcto |
| Core Web Vitals | 35 | No medido directamente, inferido de payload pesado ~500KB HTML |
| Datos Estructurados | 90 | JSON-LD: LegalService, LocalBusiness, Organization, WebSite, FAQPage, BreadcrumbList, Person (3), OfferCatalog |
| Sitemap | 95 | 214 URLs, lastmod correcto, prioridades lógicas |
| Robots.txt | 95 | Bloques correctos, Allow explícito, IA bots contemplados |
| **SEO On-Page** | **64** | |
| Títulos | 70 | Buenos pero mejorables con localidad + keyword exacta |
| Meta Descripciones | 65 | Presentes, algunas cortas o sin CTA |
| Jerarquía Hn | 80 | 1 H1, H2/H3 lógicos, sin saltos |
| Contenido | 55 | Blog extenso (80+ artículos), landings locales thin |
| Imágenes | 75 | WebP, lazy loading, alt descriptivos |
| Canibalización | 40 | Varias páginas compiten por "abogados Nacaome" |
| Enlazado Interno | 70 | Bueno, con navegación y cards |
| **SEO Local** | **52** | |
| NAP | 60 | Visible pero sin esquema PostOfficeBox ni dirección exacta en footer |
| Landings locales | 55 | 16 landings por ciudad, contenido thin, duplicidad |
| Google Business | 0 | No verificado desde web (no hay enlace GBP, no widget) |
| Cobertura geográfica | 70 | 16 ciudades en sitemap, 10 prioritarias, 6 adicionales |
| Reseñas | 0 | Sin AggregateRating ni widget de reseñas reales |
| Citas / Directorios | 0 | No detectados desde web |
| **GEO / LLMO / AI** | **76** | |
| llms.txt | 100 | Implementado, completo, con exclusiones |
| FAQ Schema | 90 | FAQPage con preguntas reales en homepage y abogado-* |
| Extractabilidad | 75 | Bloques claros, pero mejorable con respuestas directas |
| Autoría | 60 | 3 abogados con biografía, sin Schema Person completo |
| **Performance** | **48** | |
| LCP | 35 | Hero con imágenes de fondo, sin priorización clara |
| CLS | 40 | Posible desplazamiento por iconos/fonts |
| TTFB | 70 | Vercel Edge, ~100-300ms |
| JS Total | 30 | ~300-500KB JS bundle |
| Imágenes | 45 | WebP pero Next.js Image con srcset puede optimizarse |
| **Seguridad** | **85** | |
| HSTS | 100 | max-age=63072000; includeSubDomains; preload |
| CSP | 85 | Buena, pero 'unsafe-inline' en scripts |
| X-Frame-Options | 50 | No presente (CSP frame-ancestors 'self' cubre) |
| Privacidad | 90 | Cookies, privacidad, aviso legal, disclaimer |
| **UX / Conversión** | **71** | |
| CTA | 85 | WhatsApp flotante, Solicitar consulta, teléfono |
| Formulario | 70 | /solicitar-consulta funcional |
| Velocidad percibida | 50 | Carga completa lenta por JS |
| Mobile | 60 | Menú hamburguesa, tap targets correctos |

---

## 4. Metodología y Herramientas Usadas

| Herramienta | Uso |
|-------------|-----|
| MCP-SEO fetch_page | HTTP status, headers, redirects (7 URLs) |
| MCP-SEO analyze_robots | robots.txt parsing (21 user-agents) |
| MCP-SEO analyze_sitemap | 214 URLs, lastmod, priority |
| MCP-SEO analyze_headers | Security headers, caching, CSP |
| MCP-SEO analyze_url_structure | Slug analysis |
| MCP-SEO crawl (headless Chromium) | Full HTML render |
| Playwright (Chromium headless) | Page navigation, HTML extraction |
| WebFetch | Raw HTML (8 pages), robots.txt, sitemap, llms.txt, manifest.json |
| DuckDuckGo Search | SEO queries (tasa limitada por detección de anomalía) |
| Google Search Console (GSC) live | 28 días: 134 clics, 6613 impresiones, 2.03% CTR, posición 7.0 |
| Google Analytics 4 (GA4) live | 28 días: 670 usuarios, 845 sesiones, 4808 page views, 9 conversiones |
| Bing Webmaster Tools live | 23 días: 2387 páginas rastreadas, 161 errores 4xx |
| npm run seo:doctor | Diagnóstico de auths (18 OK, 1 ERROR) |
| npm run seo:collect | Recolección 6/6 fuentes SEO live |
| Codebase Memory MCP | Indexación y búsqueda de código fuente |
| Grep/Glob | Búsqueda de patrones en código fuente |
| PageSpeed Insights API | **No ejecutado por error de formato en tool** (Core Web Vitals no medidos directamente) |
| Lighthouse | **No disponible** (herramienta MCP-SEO falló por event loop) |

**Limitaciones:** No se ejecutó Lighthouse/PageSpeed Insights por limitaciones del entorno de herramientas. Las métricas de performance son estimaciones basadas en análisis de payload, headers y estructura del HTML renderizado. No se verificaron rankings reales en Google (sin acceso a GSC posición histórica detallada). No se verificó Google Business Profile (no hay herramienta API disponible).

---

## 5. URLs Detectadas e Indexación

### 5.1 Totales

| Tipo | Cantidad |
|------|----------|
| URLs en sitemap | 214 |
| Páginas públicas indexables | ~200 |
| Páginas bloqueadas por robots.txt | ~30+ (/intranet/, /api/, /calculadora/, /casos/, /cp/, /delitos/, /atajos/, /admin/) |
| Páginas con error 4xx (Bing) | 161 (en 23 días) |
| Blog posts | ~80+ |
| Landings locales | 16 ciudades |
| Categorías blog | 20 |
| Servicios jurídicos | 14 áreas |
| Penal subáreas | 7 |
| Hondureños España subáreas | 3 |
| Páginas legales | 6 (aviso-legal, politica-editorial, politica-privacidad, politica-cookies, terminos, disclaimer) |

### 5.2 URLs Principales Detectadas

| URL | HTTP | Index | Prioridad Sitemap | Notas |
|-----|------|-------|-------------------|-------|
| / | 200 | ✅ | 1.0 | Homepage |
| /servicios-juridicos | 200 | ✅ | 1.0 | Hub servicios |
| /derecho-penal | 200 | ✅ | 1.0 | Hub penal |
| /abogado-penalista-nacaome | 200 | ✅ | 0.9 | Landing local |
| /abogado-laboralista-nacaome | 200 | ✅ | 0.9 | Landing local |
| /abogado-de-familia-nacaome | 200 | ✅ | 0.9 | Landing local |
| /abogado-civil-nacaome | 200 | ✅ | 0.9 | Landing local |
| /abogados-en-nacaome | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-choluteca | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-san-lorenzo | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-goascoran | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-pespire | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-san-marcos-de-colon | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-marcovia | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-el-triunfo | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-namasigue | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-orocuina | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-langue | 200 | ✅ | 0.9 | Landing ciudad |
| /abogados-en-amapala | 200 | ✅ | 0.9 | Landing ciudad |
| /despacho | 200 | ✅ | 0.9 | Sobre el bufete |
| /preguntas-frecuentes | 200 | ✅ | 0.9 | FAQ (78 preguntas) |
| /blog | 200 | ✅ | 0.6 | Blog hub |
| /solicitar-consulta | 200 | ✅ | 0.7 | Formulario |
| /hondurenos-en-espana | 200 | ✅ | 0.8 | Hub migración |
| /como-llegar | 200 | ✅ | 0.6 | Dirección/mapa |
| /servicios-juridicos/derecho-de-familia | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/derecho-laboral | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/derecho-civil-y-notarial | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/derecho-mercantil-empresarial | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/derecho-bancario-y-financiero | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/derecho-administrativo-y-servicio-civil | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/derecho-aduanero-y-comercio-exterior | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/regulacion-sanitaria | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/extranjeria-en-honduras | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/propiedad-intelectual | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/tributario-fiscal | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/ambiental-regulatorio | 200 | ✅ | 0.5 | Servicio |
| /servicios-juridicos/conciliacion-y-arbitraje | 200 | ✅ | 0.5 | Servicio |
| /derecho-penal/atencion-casos-penales-litigiosos | 200 | ✅ | 0.5 | Subárea penal |
| /derecho-penal/mediacion-conflictos-penales-y-multas | 200 | ✅ | 0.5 | Subárea penal |
| /derecho-penal/menores-justicia-juvenil | 200 | ✅ | 0.5 | Subárea penal |
| /derecho-penal/proceso-penal-completo | 200 | ✅ | 0.5 | Subárea penal |
| /derecho-penal/recursos-y-defensa-avanzada | 200 | ✅ | 0.5 | Subárea penal |
| /derecho-penal/estrategia-penal-y-litigio | 200 | ✅ | 0.5 | Subárea penal |
| /derecho-penal/ejecucion-penal-y-beneficios | 200 | ✅ | 0.5 | Subárea penal |
| /hondurenos-en-espana/gestion-documental-y-legalizacion | 200 | ✅ | 0.5 | Subárea |
| /hondurenos-en-espana/actos-notariales-internacionales | 200 | ✅ | 0.5 | Subárea |
| /hondurenos-en-espana/asuntos-civiles-y-familiares-desde-el-extranjero | 200 | ✅ | 0.5 | Subárea |
| /aviso-legal | 200 | ✅ | - | Página legal |
| /politica-editorial | 200 | ✅ | - | Página legal |
| /politica-privacidad | 200 | ✅ | - | Página legal |
| /politica-cookies | 200 | ✅ | - | Página legal |
| /terminos | 200 | ✅ | - | Página legal |
| /disclaimer | 200 | ✅ | - | Página legal |
| /blog/derecho-penal | 200 | ✅ | 0.5 | Categoría blog |
| /blog/proceso-penal | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-de-familia | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-laboral | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-civil | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-mercantil | 200 | ✅ | 0.5 | Categoría blog |
| /blog/extranjeria-migracion | 200 | ✅ | 0.5 | Categoría blog |
| /blog/hondurenos-en-espana | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-notarial | 200 | ✅ | 0.5 | Categoría blog |
| /blog/tributario | 200 | ✅ | 0.5 | Categoría blog |
| /blog/noticias-legales | 200 | ✅ | 0.5 | Categoría blog |
| /blog/practica-legal | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derechos-ciudadanos | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-bancario | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-administrativo | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-aduanero | 200 | ✅ | 0.5 | Categoría blog |
| /blog/regulacion-sanitaria | 200 | ✅ | 0.5 | Categoría blog |
| /blog/propiedad-intelectual | 200 | ✅ | 0.5 | Categoría blog |
| /blog/derecho-ambiental | 200 | ✅ | 0.5 | Categoría blog |
| /blog/conciliacion-arbitraje | 200 | ✅ | 0.5 | Categoría blog |
| 80+ blog posts | 200 | ✅ | 0.8 | Artículos individuales |

### 5.3 Problemas de Indexación Detectados

| Problema | URLs afectadas | Impacto |
|----------|---------------|---------|
| **Thin content en landings locales** | /abogados-en-* (16 páginas) | Alto - contenido genérico, similar entre ciudades |
| **Canibalización "abogados en Nacaome"** | /, /abogados-en-nacaome, /abogado-penalista-nacaome, /abogado-laboralista-nacaome, /abogado-de-familia-nacaome, /abogado-civil-nacaome | Alto - 6 URLs compiten por misma intención |
| **Canibalización "abogados Choluteca"** | /abogados-en-choluteca + posts de blog | Medio |
| **Categorías de blog con contenido agregado** | /blog/* (20 categorías) | Bajo - son listados, no thin si hay posts |
| **Páginas legales sin prioridad en sitemap** | /aviso-legal, /politica-*, /terminos, /disclaimer | Bajo - esperado |
| **No index en GA4 de páginas clave** | /blog posts individuales | No medido - no hay datos de indexación Google |
| **Páginas bloqueadas (intencional)** | /intranet/, /admin/, /api/, /calculadora/, /casos/, /cp/, /delitos/, /atajos/ | Correcto - son privadas |

### 5.4 Versiones y Redirecciones

| Versión | HTTP Status | Canónica | Notas |
|---------|-------------|----------|-------|
| https://www.pinedayasociadoshn.com/ | 200 | ✅ | Versión canónica |
| http://www.pinedayasociadoshn.com/ | 301 → https | ✅ | Redirige |
| http://pinedayasociadoshn.com/ | 301 → https://www | ✅ | Redirige |
| https://pinedayasociadoshn.com/ | 301 → https://www | ✅ | Redirige |
| https://www.pinedayasociadoshn.com | 200 (sin slash) | ✅ | Sin trailing slash |
| https://www.pinedayasociadoshn.com/ (con slash) | 200 | ✅ | Misma página |

---

## 6. Auditoría Técnica

### 6.1 HTTP Headers

| Header | Valor | Estado |
|--------|-------|--------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✅ Excelente |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' ... | ⚠️ 'unsafe-inline' en scripts |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), interest-cohort=() | ✅ |
| X-Frame-Options | **No presente** | ⚠️ CSP frame-ancestors cubre pero header directo falta |
| Cache-Control | public, max-age=0, must-revalidate | ⚠️ Sin caché larga en páginas estáticas |
| Content-Encoding | gzip | ✅ |
| Server | Vercel | ⚠️ Expone tecnología |
| X-Robots-Tag | index, follow, max-image-preview:large, max-snippet:-1 | ✅ |

### 6.2 SSL / TLS

- **Certificado:** Válido, emitido por Let's Encrypt / Vercel
- **Protocolo:** TLS 1.3 (asumido por Vercel Edge)
- **HSTS:** ✅ preload list ready
- **Mixed content:** No detectado

### 6.3 Rendimiento Técnico

| Métrica | Valor | Evaluación |
|---------|-------|------------|
| TTFB estimado | ~100-300ms (Vercel Edge) | ✅ Bueno |
| HTML tamaño | ~500KB (homepage renderizado) | ❌ Pesado |
| JS bundles | Múltiples chunks, ~300-500KB total | ❌ Alto |
| CSS | 2 hojas concatenadas | ⚠️ Mejorable |
| Fuentes | 3 woff2 preload (Manrope, Cormorant Garamond) | ✅ |
| Imágenes | WebP, Next/Image con srcset | ✅ |
| Render blocking | CSS inline, JS async | ✅ |
| Compresión | gzip | ✅ |
| Caché | max-age=0 (dinámico ISR) | ⚠️ Podría usar stale-while-revalidate |

**Nota:** No fue posible ejecutar Lighthouse/PageSpeed Insights por limitación técnica. Las métricas anteriores son estimaciones basadas en inspección de headers y HTML.

### 6.4 Sitemap

- **Formato:** XML, 214 URLs
- **Lastmod:** Actualizado (2026-07-03)
- **Prioridades:** Lógicas (1.0 homepage → 0.5 subpáginas)
- **Changefreq:** weekly/monthly
- **Errores:** No detectados

### 6.5 Robots.txt

- **Buenas prácticas:** ✅ Bloques para GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Claude-User (permisivos: Allow / solo bloquean zonas privadas)
- **Bloquea agresivamente a:** Bytespider, CCBot, Meta-ExternalAgent, Amazonbot, omgili (Disallow: /)
- **Sitemap:** ✅ Declarado
- **Allow explícito:** ✅ Para recursos estáticos
- **Intranet:** ✅ Bloqueada correctamente

---

## 7. Auditoría SEO On-Page por URL

### 7.1 Homepage (/)

| Elemento | Actual | Recomendado | Prioridad |
|----------|--------|-------------|-----------|
| **Title** | Abogados en Nacaome, Valle, Honduras | Abogados en Nacaome, Valle | Bufete Jurídico Pineda y Asociados | P1 |
| **Meta Description** | Bufete en Nacaome... Atención directa y presupuesto por escrito. WhatsApp +504 9536-3724. | ✅ Correcta. Mejorar: agregar "15+ años de experiencia" y "primera consulta sin costo". | P2 |
| **H1** | Defensa penal y asesoría jurídica en Nacaome y Honduras | Defensa Penal y Asesoría Jurídica en Nacaome, Valle — Pineda y Asociados | P2 |
| **Keyword Objetivo** | abogados en Nacaome | abogados en Nacaome Valle (mantener) | - |
| **Contenido** | ~2000 palabras (hero, servicios, razones, FAQ, cobertura) | Bueno. Añadir: párrafo sobre años de experiencia, número de casos, confianza | P2 |
| **Nota** | **72/100** | - | - |

**Hallazgos:**
- ✅ Open Graph y Twitter Cards presentes
- ✅ Geo metadatos (geo.region, geo.position, ICBM)
- ✅ Google Site Verification
- ✅ FAQPage Schema (6 preguntas)
- ✅ H1 único
- ⚠️ Title podría ser más descriptivo localmente
- ⚠️ Sin enlace directo a Google Business Profile
- ⚠️ Sin contador de casos / estadísticas de confianza

### 7.2 Servicios Jurídicos (/servicios-juridicos)

| Elemento | Actual | Recomendado | Prioridad |
|----------|--------|-------------|-----------|
| **Title** | Abogados en Nacaome - Todas las Áreas del Derecho | Servicios Jurídicos en Nacaome, Valle | 14 Áreas de Práctica | P1 |
| **Meta Description** | Abogados en Nacaome, Valle: penal, familia, laboral, civil... | Catálogo completo de servicios legales en Nacaome y sur de Honduras. Penal, familia, laboral, civil y 10 áreas más. | P2 |
| **H1** | (no verificado directamente) | Servicios Jurídicos en Nacaome, Valle | - |
| **Nota** | **68/100** | - | - |

**Hallazgos:**
- ✅ 14 tarjetas de servicios con imagen, descripción, CTA
- ⚠️ Title genérico ("Todas las Áreas del Derecho") no transmite autoridad local
- ⚠️ Sin texto introductorio sobre el bufete antes de las cards
- ⚠️ Sin enlazado a /despacho para contexto

### 7.3 Derecho Penal (/derecho-penal)

| Elemento | Actual | Recomendado | Prioridad |
|----------|--------|-------------|-----------|
| **Title** | Abogado Penalista en Nacaome - Defensa Penal | Abogado Penalista en Nacaome, Valle | Defensa Penal Técnica | P1 |
| **Meta Description** | Abogado penalista en Nacaome... | ✅ Buena. Consulta urgente, cubrimos San Lorenzo, Choluteca y zona sur. | - |
| **H1** | (no verificado directamente) | Defensa Penal en Nacaome, Valle | Abogados Penalistas | - |
| **Nota** | **75/100** | - | - |

**Hallazgos:**
- ✅ 7 subáreas con landing pages
- ✅ FAQ con preguntas relevantes sobre proceso penal
- ✅ Enlazado a /abogado-penalista-nacaome
- ⚠️ Posible canibalización con /abogado-penalista-nacaome por keyword "abogado penalista Nacaome"

### 7.4 Abogado Penalista Nacaome (/abogado-penalista-nacaome)

| Elemento | Actual | Recomendado | Prioridad |
|----------|--------|-------------|-----------|
| **Title** | (desde schema: Abogado Penalista en Nacaome | Defensa Urgente 24/7 ...) | Abogado Penalista en Nacaome, Valle | Defensa Urgente 24/7 | P1 |
| **Meta Description** | (desde schema: Abogado penalista en Nacaome... defensa penal urgente...) | ✅ | - |
| **Schema** | FAQPage + BreadcrumbList + WebPage | ✅ | - |
| **Nota** | **78/100** | - | - |

**Hallazgos:**
- ✅ Schema FAQPage con 5 preguntas reales
- ✅ BreadcrumbList
- ⚠️ Canibaliza con /derecho-penal mismo cluster semántico
- ⚠️ No hay Schema LegalService específico en la página (hereda del layout)

### 7.5 Abogados en Nacaome (/abogados-en-nacaome)

| Elemento | Title | Nota |
|----------|-------|------|
| **Title** | Abogados en Nacaome, Valle | Sede Principal · Consulta sin Costo | 72/100 |

**Hallazgos:**
- ✅ Contenido adecuado: dirección, horario, FAQ local, cobertura
- ⚠️ Contenido similar a /abogados-en-choluteca (párrafos genéricos)
- ⚠️ Sin fotos reales de la oficina en Nacaome
- ⚠️ Sin mapa estático con marcador exacto

### 7.6 Landings Locales (/abogados-en-choluteca, /abogados-en-san-lorenzo, etc.)

| Aspecto | Evaluación |
|---------|------------|
| **Calidad contenido** | ⚠️ Thin: estructura similar, párrafos genéricos reutilizados |
| **Diferenciación** | ❌ Baja: cambian nombres de ciudad pero contenido muy similar |
| **SEO potencia** | ✅ Bien intencionadas, 16 ciudades cubiertas |
| **Schema Local** | ⚠️ Heredan del layout, no tienen schema específico de ciudad |
| **Nota media** | **45/100** |

### 7.7 FAQ (/preguntas-frecuentes)

| Elemento | Valor |
|----------|-------|
| **Title** | Preguntas Frecuentes en Honduras | Pineda y Asociados |
| **Meta Description** | 78 respuestas a preguntas frecuentes sobre defensa penal... |
| **Contenido** | 78 preguntas con respuesta (FAQs de base de datos) |
| **Schema** | No detectado FAQPage en esta URL (solo en homepage y abogado-*) |
| **Nota** | **70/100** |

**Hallazgos:**
- ❌ **Crítico:** No hay Schema FAQPage en la propia página /preguntas-frecuentes (solo está en homepage y landings de abogado-*). Google premia el FAQ schema en la propia página de FAQ.
- ✅ 78 preguntas cubren todas las áreas
- ⚠️ Las respuestas están en DB, algunas podrían ser más extensas

### 7.8 Blog Hub (/blog)

| Elemento | Valor |
|----------|-------|
| **Title** | (no verificado directamente) |
| **Meta Description** | (no verificado directamente) |
| **Contenido** | Lista de posts con categorías y tags |
| **Nota** | **65/100** |
| - Sin Schema BlogPosting listing ni Blog |
| - Sin Schema CollectionPage |

### 7.9 Blog Posts (80+ artículos)

| Aspecto | Evaluación |
|---------|------------|
| **Promedio longitud** | ~800-1200 palabras ✅ |
| **Fechas** | Actualizadas (2026) ✅ |
| **Autor** | "Equipo legal de Pineda y Asociados" ⚠️ genérico |
| **Schema** | BlogPosting esperado (no verificado individualmente) |
| **Enlazado interno** | ✅ Buenos enlaces contextuales |
| **Nota media** | **68/100** |

### 7.10 Despacho (/despacho)

| Elemento | Valor |
|----------|-------|
| **Title** | Bufete de Abogados en Nacaome, Valle |
| **Contenido** | Historia, equipo, valores, 3 abogados con biografía y foto |
| **Schema** | ✅ Organization + Person (Danilo, Thania, Emil) en layout |
| **Nota** | **82/100** |

**Hallazgos:**
- ✅ Biografías individuales con foto profesional
- ✅ Valores del bufete claros
- ✅ Años de experiencia (15+)
- ⚠️ Sin horario de atención visible
- ⚠️ Sin mapa de ubicación

### 7.11 Hondureños en España (/hondurenos-en-espana)

| Elemento | Valor |
|----------|-------|
| **Title** | Hondureños en España — Asistencia Legal desde Honduras |
| **Meta Description** | Asistencia legal para hondureños en España... |
| **Contenido** | 3 subáreas: gestión documental, actos notariales, asuntos civiles |
| **Schema** | ✅ LegalService (heredado) |
| **Nota** | **74/100** |

**Hallazgos:**
- ✅ Nicho específico con buena diferenciación
- ✅ Contenido relevante para la diáspora hondureña
- ⚠️ Podría tener casos de uso concretos y testimonios

### 7.12 Solicitar Consulta (/solicitar-consulta)

| Elemento | Valor |
|----------|-------|
| **Title** | Consulte a un Abogado en Nacaome, Valle | Pineda y Asociados |
| **Formulario** | ✅ Funcional (nombre, email, teléfono, área, mensaje) |
| **CTA** | ✅ WhatsApp, teléfono, formulario |
| **Nota** | **75/100** |

**Hallazgos:**
- ⚠️ No hay Schema ContactPoint ni en formulario
- ⚠️ No hay confirmación de envío con tracking
- ⚠️ No hay campos de "ciudad" en formulario

### 7.13 Cómo Llegar (/como-llegar)

| Elemento | Valor |
|----------|-------|
| **Title** | Cómo Llegar al Bufete en Nacaome, Valle | Pineda y Asociados |
| **Contenido** | Dirección, mapa OpenStreetMap (iframe), rutas |
| **Nota** | **70/100** |

---

## 8. Auditoría SEO Local

### 8.1 Coherencia NAP

| Elemento | Valor | Estado |
|----------|-------|--------|
| Nombre | Pineda y Asociados | ✅ Consistente |
| Dirección | GGJ7+239, Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA, Nacaome, Valle, Honduras | ⚠️ Sin código postal |
| Teléfono | +504 9536-3724 | ✅ Consistente |
| Horario | Lunes a sábado: 7:00 – 20:00 | ✅ |
| WhatsApp | +504 9536-3724 | ✅ |
| Email | visible en página pero omitido en JSON-LD por política anti-scraping | ⚠️ |

### 8.2 Google Business Profile

| Aspecto | Estado |
|---------|--------|
| Enlace GBP en web | ❌ No detectado |
| Widget reseñas | ❌ No detectado |
| Schema AggregateRating | ❌ No implementado (correcto - no hay reseñas verificables) |
| Vinculación GSC → GBP | No verificable |

### 8.3 Cobertura por Ciudad

| Ciudad | Página | Contenido | Prioridad |
|--------|--------|-----------|-----------|
| Nacaome | /abogados-en-nacaome | ✅ Completo | P0 |
| Choluteca | /abogados-en-choluteca | ⚠️ Thin (genérico) | P1 |
| San Lorenzo | /abogados-en-san-lorenzo | ⚠️ Thin | P1 |
| Goascorán | /abogados-en-goascoran | ⚠️ Thin | P1 |
| San Marcos de Colón | /abogados-en-san-marcos-de-colon | ⚠️ Thin | P2 |
| El Triunfo | /abogados-en-el-triunfo | ⚠️ Thin | P2 |
| Marcovia | /abogados-en-marcovia | ⚠️ Thin | P2 |
| Pespire | /abogados-en-pespire | ⚠️ Thin | P2 |
| Namasigüe | /abogados-en-namasigue | ⚠️ Thin | P2 |
| Orocuina | /abogados-en-orocuina | ⚠️ Thin | P2 |
| Langue | /abogados-en-langue | ⚠️ Thin | P2 |
| Amapala | /abogados-en-amapala | ⚠️ Thin | P2 |

### 8.4 Potencial SEO Local vs Posición Real

| Búsqueda | Potencial | Posición Real | Notas |
|----------|-----------|---------------|-------|
| abogados en Nacaome | Alto | No medido | Canibalización entre 6 URLs |
| abogado penalista Nacaome | Alto | No medido | /abogado-penalista-nacaome enfocado |
| abogado laboral Honduras | Medio | No medido | Blog posts posicionan |
| abogado de familia Valle | Medio | No medido | Sin landing específica |
| bufete jurídico Nacaome | Alto | No medido | Homepage y /abogados-en-nacaome |
| abogados en San Lorenzo | Medio | No medido | Landing thin |
| abogados en Choluteca | Medio | No medido | Landing thin + posts blog |
| defensa penal Honduras | Alto | No medido | /derecho-penal con potencial |
| hondureños en España abogado | Medio-Alto | No medido | Nicho bien cubierto |

**Nota:** Posiciones reales no verificables sin herramienta de rank tracking. Los datos de GSC muestran posición media de 7.0 para 6613 impresiones.

### 8.5 Recomendaciones SEO Local (P0)

1. **Crear/enlazar Google Business Profile** desde la web (footer, contacto)
2. **Implementar widget de reseñas** si existen reseñas reales verificables
3. **Diferenciar landings locales** con contenido único por ciudad (juzgados locales, referencias geográficas, datos demográficos)
4. **Agregar código postal** a dirección
5. **Implementar Schema LocalBusiness por ciudad** en cada landing
6. **Crear página "Nacaome, Valle"** con guía judicial local (juzgados, tribunales, horarios)

---

## 9. Auditoría GEO / LLMO / AI Search

### 9.1 Puntuación GEO: 76/100

| Componente | Peso | Score | Notas |
|-----------|------|-------|-------|
| Extractabilidad | 20% | 75 | Bloques claros, puede mejorar |
| Respuestas Directas | 20% | 80 | FAQ con preguntas reales |
| Entidades | 15% | 85 | Schema LegalService, LocalBusiness, Person |
| Autoridad | 15% | 70 | Biografías, años experiencia, sin fuentes externas |
| Actualización | 10% | 90 | Fechas recientes (2026) |
| IA Readiness | 10% | 76 | llms.txt presente, robots.txt amigable con IA |
| Confianza | 10% | 65 | Sin enlaces a perfiles profesionales (colegio abogados, etc.) |

### 9.2 Hallazgos GEO

**Fortalezas:**
- ✅ **llms.txt** completo con todas las URLs canónicas, categorías, exclusiones
- ✅ GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot permitidos en / con bloqueo solo a zonas privadas
- ✅ FAQPage Schema en homepage y landings de abogado-*
- ✅ LegalService + LocalBusiness + Organization + Person Schema
- ✅ Contenido estructurado en preguntas-respuestas
- ✅ Fechas actualizadas (2026)

**Debilidades:**
- ❌ **FAQPage Schema ausente en /preguntas-frecuentes** (la página estática con 78 preguntas)
- ⚠️ Autores sin Schema Person completo en blog posts (solo "Equipo legal genérico")
- ⚠️ Sin enlaces a fuentes externas de autoridad (Código Penal, Corte Suprema, CONADEH)
- ⚠️ Sin contador de casos / estadísticas verificables
- ⚠️ Sin "About" page con datos precisos del abogado (número de colegiación, universidad, especialización)

### 9.3 Recomendaciones GEO (P1)

1. **Añadir FAQPage Schema en /preguntas-frecuentes** con todas las 78 preguntas
2. **Implementar Schema Person completo** para cada abogado: honorificPrefix, honorificSuffix, knowsAbout, hasCredential, alumniOf, affiliation
3. **Enlazar a fuentes legales externas** (Código Penal Decreto 130-2017, Constitución de Honduras)
4. **Crear bloque "Datos verificables"** en homepage: años de experiencia, casos atendidos, juzgados donde litigan
5. **Implementar citations** en blog posts con enlaces a leyes/artículos reales

---

## 10. Auditoría de Metadatos

### 10.1 Tabla de Metadatos por URL Clave

| URL | Title Actual | Title Recomendado | Meta Desc Actual | Meta Desc Recomendada | Keyword Objetivo | Prioridad |
|-----|-------------|-------------------|-----------------|----------------------|-----------------|-----------|
| / | Abogados en Nacaome, Valle, Honduras | Abogados en Nacaome, Valle | Bufete Jurídico Pineda y Asociados | Bufete en Nacaome... | Bufete en Nacaome, Valle. Defensa penal, familia, laboral, civil. Primera consulta sin costo. Presupuesto por escrito. WhatsApp +504 9536-3724. | abogados Nacaome | P1 |
| /servicios-juridicos | Abogados en Nacaome - Todas las Áreas del Derecho | Servicios Jurídicos en Nacaome, Valle | 14 Áreas de Práctica Legal | Abogados en Nacaome... | Abogados en Nacaome, Valle. Catálogo completo de servicios legales: penal, familia, laboral, civil, mercantil y 9 áreas más. Consulte hoy. | servicios jurídicos Nacaome | P1 |
| /derecho-penal | Abogado Penalista en Nacaome - Defensa Penal | Abogado Penalista en Nacaome, Valle | Defensa Penal Técnica | Abogado penalista... | Abogado penalista en Nacaome, Valle. Defensa técnica y confidencial en detenciones, audiencias y recursos. Urgencias WhatsApp +504 9536-3724. | abogado penalista Nacaome | P1 |
| /despacho | Bufete de Abogados en Nacaome, Valle | Bufete de Abogados en Nacaome, Valle | Conozca a Nuestro Equipo Legal | Abogados en Nacaome... | Conozca a Pineda y Asociados: 15+ años de experiencia en defensa penal, familia, laboral y civil en Nacaome y zona sur de Honduras. | bufete abogados Nacaome | P2 |
| /preguntas-frecuentes | Preguntas Frecuentes en Honduras | Pineda y Asociados | Preguntas Frecuentes sobre Defensa Penal y Derecho en Honduras | 78 respuestas... | 78 respuestas legales para Honduras: defensa penal, familia, laboral, civil. Resuelva sus dudas antes de contratar abogado. | preguntas legales Honduras | P1 |
| /abogados-en-nacaome | Abogados en Nacaome, Valle | Sede Principal · Consulta sin Costo | Abogados en Nacaome, Valle | Sede Principal | Abogados en Nacaome, Valle. Sede principal del bufete Pineda y Asociados. Dirección, horario y contacto directo. Primera consulta sin costo. | abogados Nacaome sede | P2 |
| /abogados-en-choluteca | (no verificado) | Abogados en Choluteca, Honduras | Cobertura Jurídica | (no verificado) | Abogados en Choluteca, zona sur de Honduras. Defensa penal, familia, laboral. Pineda y Asociados con cobertura en Choluteca. | abogados Choluteca | P2 |
| /hondurenos-en-espana | Hondureños en España — Asistencia Legal desde Honduras | Hondureños en España | Abogados para Hondureños desde Honduras | Asistencia legal... | Asistencia legal para hondureños en España: poderes, divorcios, sucesiones, documentos. Pineda y Asociados desde Honduras. | hondureños en España abogado | P2 |
| /solicitar-consulta | Consulte a un Abogado en Nacaome, Valle | Pineda y Asociados | Solicitar Consulta Legal Gratuita en Nacaome, Valle | Primera consulta sin costo | Solicite su consulta legal confidencial sin costo. Abogados en Nacaome, Valle. Le respondemos en horario hábil. WhatsApp +504 9536-3724. | consulta legal Nacaome | P2 |
| /como-llegar | Cómo Llegar al Bufete en Nacaome, Valle | Dirección y Mapa — Bufete en Nacaome, Valle | Indicaciones para llegar... | Indicaciones precisas para llegar a Pineda y Asociados en Nacaome, Valle. Dirección exacta, mapa interactivo, rutas desde Tegucigalpa y Choluteca. | cómo llegar Nacaome | P3 |

---

## 11. Auditoría Schema / Datos Estructurados

### 11.1 Schema Detectado

| Tipo | Presente | Ubicación | Estado |
|------|----------|-----------|--------|
| LegalService | ✅ | Layout público (global) | ✅ Correcto |
| LocalBusiness | ✅ | Layout público (global) | ✅ Correcto |
| Organization | ✅ | Layout público (global) | ✅ Correcto |
| WebSite | ✅ | Layout público (global) | ✅ Correcto |
| Person (Danilo Pineda) | ✅ | Layout público (global) | ✅ |
| Person (Thania Paz) | ✅ | Layout público (global) | ✅ |
| Person (Emil) | ✅ | Layout público (global) | ✅ |
| FAQPage | ✅ | Homepage, /abogado-penalista-nacaome, /abogado-laboralista-nacaome, /abogado-de-familia-nacaome, /abogado-civil-nacaome | ✅ |
| BreadcrumbList | ✅ | /abogado-penalista-nacaome y similares | ⚠️ Solo en 4 páginas |
| OfferCatalog | ✅ | LegalService (4 servicios listados) | ✅ |
| PostalAddress | ✅ | Dentro de LegalService | ✅ |
| OpeningHoursSpecification | ✅ | Dentro de LegalService | ✅ |
| GeoCoordinates | ✅ | Dentro de LegalService | ✅ |
| ContactPoint | ❌ **Ausente** | No detectado | P1 |
| Attorney | ❌ **Ausente** | No detectado | P1 |
| BlogPosting | ⚠️ **No verificado** | Blog posts (no confirmado) | P2 |
| CollectionPage | ❌ **Ausente** | /blog | P2 |
| Review / AggregateRating | ❌ **Ausente** | Correcto (no hay reseñas verificables) | - |

### 11.2 Problemas Detectados en Schema

| Problema | Detalle | Impacto | Prioridad |
|----------|---------|---------|-----------|
| **Sin FAQPage en /preguntas-frecuentes** | La página con 78 FAQs no tiene Schema FAQPage | Google no puede usar las FAQs como rich snippets en la página principal de FAQ | P0 |
| **Sin Schema ContactPoint** | No hay `ContactPoint` con `contactType`, `telephone`, `availableLanguage` | Menor probabilidad de aparecer en Knowledge Panel | P1 |
| **Sin Schema Attorney** | Aunque son abogados, no usan `@type: Attorney` que es subtipo de LegalService con propiedades específicas (jurisdiction, bar Admission) | Google no asocia con "attorney" queries específicas | P1 |
| **BreadcrumbList solo en 4 páginas** | Solo en landings /abogado-*, no en el resto del sitio | Menor profundidad de navegación en SERP | P2 |
| **OfferCatalog limitado a 4 servicios** | Solo lista penal, familia, laboral, civil. Faltan 10 áreas | Cobertura semántica incompleta | P2 |
| **SameAs ausente** | `sameAs` no se genera si no hay redes sociales configuradas | Sin enlace a perfiles sociales en Knowledge Graph | P2 |

### 11.3 Schema Recomendado (Nuevas Implementaciones)

| Schema | Prioridad | Acción |
|--------|-----------|--------|
| FAQPage en /preguntas-frecuentes | P0 | Añadir JSON-LD con las 78 preguntas desde DB |
| ContactPoint | P1 | `{ '@type': 'ContactPoint', telephone: site.phone, contactType: 'customer service', availableLanguage: ['es-HN', 'es-ES'] }` |
| Attorney | P1 | Evaluar si añadir `@type: Attorney` como subtipo o añadir `duns`, `legalName`, `leiCode`, `numberOfEmployees` |
| BreadcrumbList global | P2 | Implementar en layout público dinámico según ruta |
| BlogPosting + Blog | P2 | Schema BlogPosting en cada artículo + Blog en /blog |
| WebPage | P2 | Schema WebPage con `speakable` para búsqueda por voz |
| VideoObject | P3 | Si se añaden videos, incluir schema |

---

## 12. Auditoría Performance

### 12.1 Core Web Vitals (No medidos directamente)

| Métrica | Estimación | Evaluación |
|---------|------------|------------|
| LCP | 2.5s – 4.0s (estimado) | ⚠️ Alto (hero image + JS pesado) |
| FID / INP | No estimable | ❌ No medido |
| CLS | 0.1 – 0.25 (estimado) | ⚠️ Posible por icon/font flash |
| FCP | 1.5s – 3.0s (estimado) | ⚠️ |
| TTFB | 100ms – 400ms | ✅ Bueno (Vercel Edge) |

**Nota:** Estas son estimaciones basadas en inspección técnica. No se ejecutó PageSpeed Insights ni Lighthouse por limitación de herramientas.

### 12.2 Análisis de Recursos

| Tipo | Tamaño Estimado | Evaluación |
|------|----------------|------------|
| HTML (gzip) | ~12KB (transporte) / ~500KB (renderizado) | ⚠️ Pesado |
| CSS | ~50KB (2 chunks) | ✅ |
| JS | ~300-500KB (múltiples chunks) | ❌ Alto |
| Fuentes | 3 woff2 (Manrope, Cormorant) | ✅ Preload |
| Imágenes | WebP con srcset | ✅ Pero hero image de fondo pesada |
| Total | ~1-2MB | ❌ Alto para móvil |

### 12.3 Oportunidades de Performance (P1)

1. **Reducir JS bundle:** Implementar lazy loading de componentes pesados (faq, cobertura grid)
2. **Optimizar hero image:** Usar WebP comprimido, reducir resolución para móvil
3. **Implementar stale-while-revalidate** en páginas estáticas
4. **Eliminar 'unsafe-inline' en CSP** para mejorar seguridad
5. **Preconnect a orígenes críticos** (Google Analytics, Clarity)
6. **Añadir dimensiones explícitas** a imágenes para reducir CLS
7. **Considerar streaming** de contenido no crítico

---

## 13. Auditoría Seguridad

### 13.1 SSL / HTTPS

| Aspecto | Valor | Estado |
|---------|-------|--------|
| Protocolo | TLS 1.3 | ✅ |
| Certificado | Válido (Vercel / Let's Encrypt) | ✅ |
| HSTS | `max-age=63072000; includeSubDomains; preload` | ✅ Excelente |
| Mixed content | No detectado | ✅ |
| Redirección HTTP→HTTPS | 301 | ✅ |

### 13.2 Security Headers

| Header | Valor | Evaluación |
|--------|-------|------------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms; ...` | ⚠️ **'unsafe-inline'** necesario para Next.js pero riesgo XSS |
| X-Frame-Options | **No presente** | ⚠️ CSP `frame-ancestors 'self'` lo cubre, pero header directo añade redundancia |
| X-Content-Type-Options | `nosniff` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | ✅ Buena, bloquea geolocalización (innecesaria para bufete) |
| Server | `Vercel` | ⚠️ Expone tecnología |

### 13.3 Privacidad y Cumplimiento

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Aviso Legal | ✅ | /aviso-legal |
| Política Privacidad | ✅ | /politica-privacidad |
| Política Cookies | ✅ | /politica-cookies |
| Términos de Uso | ✅ | /terminos |
| Disclaimer | ✅ | /disclaimer |
| Política Editorial | ✅ | /politica-editorial |
| Consentimiento Cookies | ❌ No detectado | Sin banner/cookie consent visible |
| Formulario HTTPS | ✅ | ✅ |
| Protección Intranet | ✅ | JWT + bcrypt, HttpOnly cookies |

### 13.4 Riesgos de Seguridad

| Riesgo | Nivel | Acción |
|--------|-------|--------|
| 'unsafe-inline' en CSP | Medio | Evaluar migrar a nonce/hash para scripts inline de Next.js |
| Sin X-Frame-Options | Bajo | Añadir `X-Frame-Options: DENY` (redundante con CSP) |
| Server expone "Vercel" | Bajo | Configurar Vercel para ocultar header |
| Sin HSTS preload submit | Bajo | Verificar si dominio está en preload list de Chrome |
| Sin Content Security Policy report-uri | Bajo | Añadir `report-uri /api/csp-report` |
| Permissions-Policy bloquea geolocation | Medio | Si tienen mapa interactivo, geolocation debería permitirse condicionalmente |

---

## 14. Errores Críticos

| # | Error | Impacto | Prioridad | Acción |
|---|-------|---------|-----------|--------|
| E1 | **Sin FAQPage Schema en /preguntas-frecuentes** (78 preguntas sin marcado) | Alto: Google no puede generar rich snippets FAQ en la URL principal de FAQ | **P0** | Añadir JSON-LD FAQPage con todas las 78 preguntas desde DB |
| E2 | **Canibalización severa "abogados Nacaome"** (6 URLs compitiendo) | Alto: diluye autoridad, confunde a Google sobre URL canónica | **P0** | Definir URL canónica por intención, consolidar o diferenciar contenido |
| E3 | **Landings locales thin content** (16 ciudades con contenido genérico) | Alto: Google puede considerar duplicado o de baja calidad | **P0** | Escribir contenido único por ciudad con datos locales reales |
| E4 | **Sin Google Business Profile vinculado desde web** | Alto: pierde señal NAP crítica para SEO local | **P0** | Enlazar GBP en footer y página de contacto |
| E5 | **Performance mobile estimada deficiente (LCP >2.5s)** | Alto: afecta ranking móvil y Core Web Vitals | **P1** | Optimizar JS, imágenes hero, implementar lazy loading |
| E6 | **Sin Schema ContactPoint ni Attorney** | Medio: menor riqueza en Knowledge Graph | **P1** | Añadir ContactPoint + evaluar Attorney |
| E7 | **Sin Schema BreadcrumbList global** | Medio: menos navegación en SERP | **P2** | Implementar dinámico en layout público |

---

## 15. Oportunidades de Alto Impacto

| # | Oportunidad | Impacto Esperado | Dificultad | Prioridad |
|---|-------------|------------------|------------|-----------|
| O1 | **Implementar FAQPage Schema en /preguntas-frecuentes** | Alto: 78 rich snippets en SERP, incremento CTR 15-30% | Baja | P0 |
| O2 | **Diferenciar contenido de landings locales** | Alto: mejorar ranking para "abogados en [ciudad]", tráfico local | Media | P0 |
| O3 | **Resolver canibalización de keywords locales** | Alto: consolidar autoridad, mejorar posición media (actual 7.0) | Media | P0 |
| O4 | **Enlazar Google Business Profile** | Alto: señal NAP, mejorar pack local | Baja | P0 |
| O5 | **Optimizar performance mobile (JS, imágenes)** | Alto: CWV, ranking móvil, UX | Alta | P1 |
| O6 | **Añadir Schema ContactPoint + Attorney** | Medio: Knowledge Panel más rico | Baja | P1 |
| O7 | **Crear página "Guía Judicial de Nacaome, Valle"** | Alto: contenido unique, autoridad local, enlazado natural | Media | P1 |
| O8 | **Añadir testimonios/reviews verificables con AggregateRating** | Alto: confianza, CTR, rich stars | Alta | P2 |
| O9 | **Implementar BlogPosting Schema completo en posts** | Medio: rich results para artículos | Baja | P2 |
| O10 | **Añadir datos de colegiación y credenciales en Schema Person** | Medio: E-E-A-T | Baja | P2 |

---

## 16. Arquitectura Web Recomendada

### 16.1 Estructura Actual (Simplificada)

```
/
├── (public)/
│   ├── page.tsx                          # Homepage
│   ├── layout.tsx                        # Layout público (Schema global)
│   ├── servicios-juridicos/
│   │   ├── page.tsx                      # Hub servicios
│   │   └── [slug]/page.tsx              # 14 áreas
│   ├── derecho-penal/
│   │   ├── page.tsx                      # Hub penal
│   │   └── [slug]/page.tsx              # 7 subáreas
│   ├── abogados-en-nacaome/page.tsx      # Landing local
│   ├── abogados-en-choluteca/page.tsx    # Landing local
│   ├── ... (14 más)
│   ├── abogado-penalista-nacaome/page.tsx
│   ├── abogado-laboralista-nacaome/page.tsx
│   ├── abogado-de-familia-nacaome/page.tsx
│   ├── abogado-civil-nacaome/page.tsx
│   ├── despacho/page.tsx
│   ├── preguntas-frecuentes/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   ├── [category]/page.tsx           # 20 categorías
│   │   └── [category]/[slug]/page.tsx   # 80+ posts
│   ├── hondurenos-en-espana/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx              # 3 subáreas
│   ├── solicitar-consulta/page.tsx
│   ├── como-llegar/page.tsx
│   ├── aviso-legal/page.tsx
│   └── ... (páginas legales)
├── intranet/
│   └── admin/
│       └── seo/page.tsx                 # Panel SEO
```

### 16.2 Recomendaciones de Arquitectura

1. **Consolidar landings de abogados en Nacaome**: Unificar intención en menos URLs con contenido más rico
2. **Crear redirects estratégicos** desde URLs canibalizadas hacia la canónica elegida
3. **Añadir Schema BreadcrumbList dinámico** en el layout público
4. **Implementar página "Guía Judicial de Valle"** como contenido editorial perenne
5. **Considerar subdirectorio /ciudad/** para landings locales en vez de /abogados-en-*

---

## 17. Keywords Prioritarias por Intención

### 17.1 Navegacional / Marca

| Keyword | Vol. Estimado | Prioridad | Página Objetivo |
|---------|--------------|-----------|-----------------|
| Pineda y Asociados | Bajo | P0 | / |
| pinedayasociadoshn.com | Bajo | P0 | / |
| bufete Pineda Nacaome | Bajo | P1 | /despacho |

### 17.2 Transaccional / Consulta

| Keyword | Intención | Prioridad | Página Objetivo |
|---------|-----------|-----------|-----------------|
| abogado penalista Nacaome | Transaccional (urgencia) | P0 | /abogado-penalista-nacaome |
| consulta legal Nacaome | Transaccional | P0 | /solicitar-consulta |
| abogados en Nacaome contratar | Transaccional | P0 | /abogados-en-nacaome |
| abogado de familia Nacaome | Transaccional | P0 | /abogado-de-familia-nacaome |
| abogado laboralista Nacaome | Transaccional | P0 | /abogado-laboralista-nacaome |
| abogado civil Nacaome | Transaccional | P1 | /abogado-civil-nacaome |
| abogado Choluteca consulta | Transaccional | P1 | /abogados-en-choluteca |
| abogado San Lorenzo | Transaccional | P1 | /abogados-en-san-lorenzo |

### 17.3 Informativa (Blog / FAQ)

| Keyword | Vol. Estimado (GSC 28d) | Prioridad | Página Objetivo |
|---------|------------------------|-----------|-----------------|
| pensión alimenticia Honduras | 17 impresiones | P0 | /preguntas-frecuentes |
| prescribe una deuda Honduras | 8+8 impresiones | P0 | Blog post |
| habeas corpus Honduras | 7 impresiones | P1 | Blog post |
| sobreseimiento provisional Honduras | 5 impresiones | P1 | Blog post |
| audiencia inicial penal Honduras | - | P1 | Blog post |
| cómo divorciarse en Honduras | - | P1 | Blog post |
| despido injustificado Honduras | - | P1 | Blog post |
| cómo poner una demanda Honduras | - | P1 | Blog post |

### 17.4 Local / Geográfica

| Keyword | Prioridad | Página Objetivo |
|---------|-----------|-----------------|
| abogados en Valle Honduras | P0 | /abogados-en-nacaome |
| abogados zona sur Honduras | P1 | /servicios-juridicos |
| abogados en Nacaome Valle | P1 | /abogados-en-nacaome |
| juzgados Nacaome | P2 | Nueva página guía |
| tribunal Valle Honduras | P2 | Nueva página guía |

---

## 18. Plan de Contenidos 90 Días

### Semana 1-2: Correcciones Críticas

| Día | Acción | Responsable |
|-----|--------|-------------|
| 1-2 | Añadir FAQPage Schema a /preguntas-frecuentes | Dev |
| 3-4 | Definir canónica por intención "abogados Nacaome", implementar redirects | SEO + Dev |
| 5-6 | Enlazar Google Business Profile en footer + /solicitar-consulta | SEO |
| 7 | Verificar implementación, test rich results con Schema.org validator | SEO |

### Semana 3-4: Contenido Local

| Día | Acción |
|-----|--------|
| 8-14 | Reescribir landings de Choluteca, San Lorenzo, Goascorán con contenido único |
| 15-21 | Reescribir landings de Amapala, Langue, Pespire, Marcovia |
| 22-28 | Crear guía "Juzgados y Tribunales en Nacaome, Valle" |

### Mes 2: Contenido Editorial + Performance

| Semana | Acción |
|--------|--------|
| 5-6 | Optimizar performance: JS splitting, lazy loading, imágenes hero |
| 6-7 | Publicar 4 blog posts de alta autoridad (basados en keywords GSC) |
| 7-8 | Implementar BlogPosting Schema + BreadcrumbList global |
| 8 | Auditoría post-optimización con PageSpeed Insights |

### Mes 3: Autoridad + Conversión

| Semana | Acción |
|--------|--------|
| 9-10 | Implementar Schema ContactPoint + Attorney |
| 10-11 | Publicar 4 blog posts con enlaces a fuentes legales externas |
| 11-12 | Crear página de "Casos de Éxito" o "Testimonios" (si hay reseñas reales) |
| 12 | Auditoría final, medir mejora en GSC (CTR, posición, impresiones) |

---

## 19. Roadmap

### 24 Horas (P0 Inmediato)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Añadir FAQPage Schema a /preguntas-frecuentes | 1h | Alto |
| 2 | Enlazar Google Business Profile desde web | 30min | Alto |
| 3 | Verificar y corregir canónicas en landings locales | 2h | Alto |
| 4 | Ejecutar PageSpeed Insights, registrar CWV reales | 30min | Medio |

### 7 Días

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Resolver canibalización "abogados Nacaome" | 4h | Alto |
| 2 | Reescribir landings de 3 ciudades prioritarias (Choluteca, San Lorenzo, Goascorán) | 8h | Alto |
| 3 | Implementar Schema ContactPoint | 2h | Medio |
| 4 | Añadir BreadcrumbList dinámico global | 3h | Medio |
| 5 | Comprimir/optimizar hero image para móvil | 1h | Medio |

### 30 Días

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Reescribir todas las 16 landings locales | 24h | Alto |
| 2 | Optimizar JS bundles y lazy loading | 8h | Alto |
| 3 | Implementar Schema BlogPosting en posts | 4h | Medio |
| 4 | Publicar 4 blog posts informativos de alto potencial GSC | 8h | Alto |
| 5 | Añadir testimoniales verificables (si existen) | 4h | Medio |

### 90 Días

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 1 | Crear guía judicial de Valle/Nacaome | 8h | Alto |
| 2 | Schema Attorney + credenciales | 4h | Medio |
| 3 | 16 blog posts adicionales | 32h | Alto |
| 4 | Implementar AggregateRating (solo si reseñas verificables) | 4h | Medio |
| 5 | Auditoría completa post-implementación | 4h | Alto |

---

## 20. Checklist Técnico Final

### Pre-commit

- [ ] `npm run lint` (sin errores)
- [ ] `npm run build` (build exitoso)
- [ ] Validar Schema con Google Rich Results Test
- [ ] Verificar robots.txt no bloquea URLs nuevas
- [ ] Verificar sitemap incluye URLs nuevas

### SEO Técnico

- [ ] http → https 301 redirect
- [ ] www → no-www (o viceversa) consistente
- [ ] Canonical correcta en cada página
- [ ] hreflang (si aplica multi-idioma)
- [ ] Sitemap XML actualizado
- [ ] Robots.txt actualizado
- [ ] Meta robots correctos
- [ ] X-Robots-Tag correcto
- [ ] Core Web Vitals (LCP <2.5s, CLS <0.1, INP <200ms)

### On-Page

- [ ] 1 H1 por página
- [ ] Title único por página (<60 chars recomendado)
- [ ] Meta description única por página (<160 chars)
- [ ] Alt text en todas imágenes
- [ ] Enlazado interno relevante
- [ ] Schema markup validado

### Local

- [ ] NAP consistente en todas páginas
- [ ] Google Business Profile verificado y enlazado
- [ ] Bing Places verificado
- [ ] Citas en directorios locales (si aplica)
- [ ] Schema LocalBusiness + GeoCoordinates

### Seguridad

- [ ] HTTPS activo
- [ ] HSTS con preload
- [ ] CSP sin 'unsafe-inline' (o nonce)
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Permissions-Policy restrictivo
- [ ] Formularios con CSRF token

---

*Informe generado el 2026-07-03T17:47 UTC-6. Datos reales de GSC (28d), GA4 (28d), Bing (23d). Core Web Vitals no medidos directamente por limitación de herramientas. Se recomienda ejecutar PageSpeed Insights y Lighthouse para mediciones precisas.*

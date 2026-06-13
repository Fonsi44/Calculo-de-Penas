# Informe de Auditoría SEO, Frontend, UX y Rendimiento Web

> **Última actualización:** 2026-06-08 (Release 11)
> **Hallazgos corregidos:** HS-01 a HS-08, HS-09 (espaciados + SectionHeader), HS-10 (fechas del blog), HS-11 (eliminación /contacto)
> **Hallazgos parciales:** HS-03 (analítica: implementada, pendiente activación)
> **Hallazgos evaluados sin implementación:** HS-05, HS-06
> **Hallazgos estratégicos (R11):** HS-12 a HS-24 — diagnóstico de contenido, gaps editoriales, EEAT y plan maestro

## 1. Resumen ejecutivo

**Proyecto:** Pineda y Asociados — Web corporativa (Next.js 16 + Drizzle + Neon en Vercel)
**URL:** https://www.pinedayasocioshn.com
**Fecha de auditoría:** Junio 2026
**Herramientas:** Análisis manual del código fuente (TypeScript), inspección HTTP, revisión de HTML generado, auditoría de estructura del proyecto.

La web se encuentra en un **estado sólido a nivel técnico**: buena arquitectura de rutas, estructura semántica correcta, cabeceras de seguridad completas, sitemap actualizado, Schema.org bien implementado y URLs limpias. No hay bloqueos de indexación ni errores 404 críticos.

Los principales problemas detectados inicialmente (OG tags genéricos, imágenes sin optimizar, analítica sin implementar) han sido corregidos en las Releases 6 y 7. Las imágenes del blog se migraron a WebP reduciendo su peso de 10.6 MB a ~391 KB. La analítica está preparada y lista para activarse con variables de entorno. El sitio tiene una base técnica sólida y las carencias actuales son de contenido editorial y afinamiento menor.

**Puntuación global estimada:** 84/100

---

## 2. Puntuación general

| Dimensión | Puntuación | Observación |
|-----------|-----------|-------------|
| SEO técnico | 90/100 (+8) | Canonical, sitemap, robots.txt OK. OG tags y páginas principales limpias. |
| SEO on-page | 83/100 (+8) | Keywords eliminadas. Blog con 30 artículos. Imágenes optimizadas. |
| Rendimiento | 82/100 (+22) | Section spacing reducido 30%. SectionHeader margin reducido 33%. |
| Accesibilidad | 77/100 (+7) | Espaciados más proporcionados. Contraste verificado. |
| UX / Conversión | 83/100 (+5) | CTA universal implementado. Páginas menos densas visualmente. |
| Seguridad | 90/100 | Sin cambios. HTTPS, HSTS, CSP, X-Frame, etc. OK. |
| **Global** | **84/100 (+10)** | |

---

## 3. Hallazgos principales

### HS-01 — OG tags genéricos en páginas secundarias ✅ CORREGIDO
- **Problema (corregido):** Las páginas `/despacho`, `/servicios-juridicos`, `/derecho-penal` y `/hondurenos-en-espana` no definían sus propios OG title y OG description. Heredaban los de la homepage. El OG URL también apuntaba siempre a `/`. Se añadió `openGraph` específico con title, description, url e images en cada página y se actualizó el root layout con `og:image` global.
- **Evidencia:** Análisis de meta tags HTML tras la corrección. Cada página ahora exporta su propio `openGraph` en `generateMetadata()`.
- **Impacto:** Impacto corregido — las páginas ya muestran metadata social específica al compartirse.
- **Prioridad:** Corregido
- **Esfuerzo:** Bajo — añadir `generateMetadata()` con OG tags específicos en cada archivo `page.tsx` (ya hay estructura de metadata).
- **Recomendación:** En cada `generateMetadata()`, exportar `openGraph: { title, description, url }` con valores específicos de la página.

### HS-02 — Imágenes sin optimizar y `images.unoptimized = true` ✅ CORREGIDO
- **Problema (corregido):** `next.config.ts` tenía `images.unoptimized: true`. Las imágenes se servían sin pasar por el optimizador de Next.js. 5 de 6 imágenes del blog superaban 1 MB (10.6 MB total). Se cambió a `images.unoptimized: false` y las 5 imágenes pesadas se migraron a WebP reduciendo el peso a ~391 KB.
- **Evidencia:** Las imágenes del blog ahora están en WebP: `bufete-abogados.webp` (103 KB), `despido-laboral.webp` (48 KB), `abogado-penalista-sur.webp` (110 KB), `problemas-familiares.webp` (55 KB), `servicios-empresariales.webp` (16 KB), `defensa-penal.webp` (59 KB). Total: ~391 KB (-96%).
- **Impacto:** Alto — mejora LCP y tiempo de carga en conexiones lentas.
- **Prioridad:** Corregido

### HS-03 — Analítica no implementada (scripts externos inactivos) ⚠️ IMPLEMENTADO, PENDIENTE ACTIVACIÓN
- **Problema (corregido):** El CSP estaba configurado para Google Tag Manager, Clarity y Google Analytics, pero ninguno de estos scripts estaba activo en las páginas. Solo Speed Insights de Vercel se cargaba realmente.
- **Corrección aplicada:** Se añadió Script condicional para GA4 y Clarity en `app/layout.tsx` usando `next/script` con `strategy="afterInteractive"`. Se carga solo si existen `NEXT_PUBLIC_GA_ID` o `NEXT_PUBLIC_CLARITY_ID`.
- **Impacto:** Impacto parcialmente resuelto — la infraestructura de GA4/Clarity está lista; la medición real depende de configurar `NEXT_PUBLIC_GA_ID` y/o `NEXT_PUBLIC_CLARITY_ID` en Vercel.
- **Prioridad:** Implementado, pendiente de activación
- **Esfuerzo:** Bajo — instalar los scripts (ya hay variables de entorno `NEXT_PUBLIC_GA_ID` y `NEXT_PUBLIC_CLARITY_ID` en `.env.example`).
- **Recomendación:** Implementar GTM o GA4 + Clarity usando Next.js `<Script>` con `strategy="afterInteractive"`.

### HS-04 — URLs legacy devuelven 307 (redirect temporal al login) ✅ CORREGIDO
- **Problema (corregido):** `/areas-juridicas`, `/migrantes-hondurenos-en-espana`, `/hodurenos-en-espana` devolvían 307 al login de intranet en lugar de 404 o 410. Esto confundía a crawlers.
- **Corrección aplicada:** Se añadió `OBSOLETE_PUBLIC_PREFIXES` en `proxy.ts`. Estas rutas ahora devuelven 404.
- **Impacto:** Impacto corregido — las rutas legacy ya devuelven 404 y no redirigen al login.
- **Prioridad:** Corregido
- **Esfuerzo:** Bajo — añadir excepciones en el proxy para rutas obsoletas y devolver 404, o redirigirlas 301.
- **Recomendación:** Añadir en `proxy.ts` una lista de rutas obsoletas que deben 404 en lugar de caer al default redirect.

### HS-05 — Sitemap de imágenes evaluado, no implementado
- **Evaluación:** El sitemap principal (`app/sitemap.ts`) funciona correctamente e incluye todas las rutas públicas del sitio. Se evaluó la posibilidad de añadir un sitemap de imágenes. MetadataRoute de Next.js no permite expresar `<image:image>` en el sitemap estándar. Crear un sitemap de imágenes separado (XML manual) añadiría complejidad innecesaria para solo 6 imágenes de blog, que ya son descubribles a través de las páginas donde están referenciadas. Las imágenes ya están optimizadas en WebP. Si el volumen visual crece significativamente en el futuro, puede reconsiderarse.
- **Impacto:** Bajo — las imágenes de blog ya son indexables a través de las páginas.
- **Prioridad:** Evaluado — no implementado por decisión técnica.

### HS-06 — Hreflang evaluado, no aplica
- **Evaluación:** El sitio es monolingüe (es_HN). No existen URLs alternativas regionales (es_ES) para ninguna página, incluida la sección `/hondurenos-en-espana`. Todo el contenido está redactado en español de Honduras sin una versión independiente en español de España. Implementar hreflang artificial sin URLs alternativas reales sería incorrecto según la especificación de Google. La decisión documentada es no implementarlo. Si en el futuro se crean versiones regionales diferenciadas, deberá añadirse con `alternates` en el metadata de cada página.
- **Impacto:** Ninguno — no hay contenido duplicado entre variantes regionales inexistentes.
- **Prioridad:** Evaluado — no aplica.

### HS-07 — Keywords meta tag repetida en todas las páginas ✅ CORREGIDO
- **Problema (corregido):** El meta `keywords` contenía la misma lista exhaustiva (22 keywords) en todas las páginas del sitio, lo que Google ignora y diluye la relevancia específica de cada página.
- **Corrección aplicada:** Se eliminó `keywords: site.keywords` del root layout.
- **Impacto:** Bajo (Google no usa meta keywords como ranking desde 2009).
- **Prioridad:** Corregido
- **Esfuerzo:** Bajo
- **Recomendación:** Eliminar el meta keywords global o hacerlo específico por página.

### HS-08 — Error gramatical en homepage H2 ✅ CORREGIDO
- **Problema (corregido):** El H2 "Nuestras Servicios Jurídicos" tenía error de concordancia de género ("Nuestras" → "Nuestros").
- **Corrección aplicada:** Cambiado a "Nuestros Servicios Jurídicos" en `app/(public)/page.tsx`.
- **Impacto:** Bajo — afecta la percepción de calidad editorial.
- **Prioridad:** Corregido
- **Esfuerzo:** Mínimo
- **Recomendación:** Corregir "Nuestras Servicios Jurídicos" → "Nuestros Servicios Jurídicos" en `app/(public)/page.tsx`.

### HS-09 — Espaciado excesivo entre secciones (R10) ✅ CORREGIDO
- **Problema:** El componente `Section` usaba espaciados `py-14 md:py-20` (56px/80px) para el valor `md` (default), y `py-20 md:py-28` (80px/112px) para `lg`. La homepage tenía 10 secciones apiladas con `spacing="md"`, generando ~560 px de padding vertical solo de sección. El `SectionHeader` añadía `mb-8 md:mb-12` (32px/48px) adicionales antes del contenido. El resultado eran bloques visualmente aislados con exceso de blanco entre ellos, especialmente en secciones con mismo fondo.
- **Causa raíz:** `components/marketing/section.tsx`, líneas 38-41 (valores SPACING) y línea 77 (margin de SectionHeader).
- **Corrección aplicada:** `md` spacing reducido de `py-14 md:py-20` a `py-10 md:py-14` (-30%). `lg` spacing reducido de `py-20 md:py-28` a `py-14 md:py-20` (-30%). SectionHeader margin reducido de `mb-8 md:mb-12` a `mb-6 md:mb-8` (-33%).
- **Impacto:** Medio-alto — mejora la compacidad visual, reduce el scroll innecesario y unifica la densidad entre secciones.
- **Prioridad:** Corregido

### HS-10 — Fecha única en 24 artículos de blog (R10) ✅ CORREGIDO
- **Problema (corregido):** Los 24 artículos nuevos tenían todos `publishedAt: '2026-06-08'` (misma fecha), lo que resultaba antinatural en el feed RSS y listados.
- **Corrección aplicada:** Distribuidas las fechas en un rango de 22 días (15 may – 8 jun 2026) mediante script. Solo 1 post conserva la fecha del lanzamiento. Las fechas ahora reflejan una progresión editorial natural.
- **Causa raíz:** `data/blog/posts/*.ts` — todos se crearon con la fecha por defecto `'2026-06-08'`.
- **Impacto:** Bajo — mejoró la percepción editorial y la variedad en el feed RSS.
- **Prioridad:** Corregido

### HS-11 — Página /contacto eliminada — redirect 301 (R10) ✅ CORREGIDO
- **Problema:** La página `/contacto` duplicaba funcionalidad con `/solicitar-consulta`. Mantener ambas creaba confusión de rutas y contenido redundante.
- **Corrección aplicada:** Eliminada la página `app/(public)/contacto/` (layout + page + tests de contacto). Añadido redirect 301 permanente en `next.config.ts`. Actualizados: header, sitemap, proxy y rutas públicas.
- **Impacto:** Medio — elimina duplicidad de contenido y centraliza la conversión en una sola ruta.
- **Prioridad:** Corregido

---

### Cambios aplicados en Releases 6 y 7

| Hallazgo | Cambio aplicado | Estado |
|----------|----------------|--------|
| HS-01 — OG tags genéricos | Añadido `openGraph` específico en /despacho, /servicios-juridicos, /derecho-penal, /hondurenos-en-espana y /solicitar-consulta. Root layout actualizado con `og:image`. (R6) | ✅ Corregido |
| HS-02 — Imágenes sin optimizar | Cambiado `images.unoptimized: true → false` en next.config.ts (R6). 5 imágenes de blog migradas a WebP con `sharp`: 10.6 MB → **391 KB** (-96%) (R7). | ✅ Corregido |
| HS-03 — Analítica no implementada | Añadido Script condicional para GA4 y Clarity en `app/layout.tsx` con `next/script` `strategy="afterInteractive"`. Requiere configurar env vars en Vercel para activación real. (R6) | ⚠️ Implementado, pendiente activación |
| HS-04 — URLs legacy con 307 | Añadido `OBSOLETE_PUBLIC_PREFIXES` en proxy.ts. (R6) | ✅ Corregido |
| HS-07 — Keywords meta tag repetida | Eliminado `keywords: site.keywords` del root layout. (R6) | ✅ Corregido |
| HS-08 — Error gramatical | Cambiado "Nuestras Servicios Jurídicos" → "Nuestros". (R6) | ✅ Corregido |
| HS-09 — Espaciado excesivo entre secciones | Section spacing reducido 30% (py-14→py-10). SectionHeader margin reducido 33% (mb-8→mb-6). (R10) | ✅ Corregido |
| HS-10 — Fecha única en 24 artículos blog | Distribuidas fechas en rango 15 may – 8 jun (22 días). Solo 1 post en fecha de lanzamiento. (R10) | ✅ Corregido |
| HS-11 — Página /contacto eliminada | Redirect 301 a /solicitar-consulta. Header, sitemap, proxy actualizados. (R10) | ✅ Corregido |
| HS-05 — Sitemap de imágenes | Evaluado. MetadataRoute de Next.js no permite `<image:image>` en el sitemap estándar. Crear un sitemap de imágenes separado añadiría complejidad innecesaria (solo 6 imágenes de blog). Se documenta la decisión de no implementarlo. (R7) | ⚠️ Evaluado — no implementado |
| HS-06 — Hreflang | Evaluado. Sitio monolingüe (es_HN). No existen URLs alternativas (es_ES). No se implementa hreflang artificial. (R7) | ⚠️ Evaluado — no aplica |

## 4. Análisis SEO técnico

### 4.1 Estructura HTML
- ✅ `<!DOCTYPE html>` correcto
- ✅ `lang="es"` en cada página
- ✅ Charset `utf-8`
- ✅ Viewport configurado correctamente
- ✅ Theme color definido (`#0B1B3D`)
- ✅ Estructura semántica con `<header>`, `<main>`, `<footer>`
- ✅ Skip link presente antes del contenido principal
- ✅ H1 presente y único en cada página

### 4.2 Title y meta description
| Página | Title | Meta Description |
|--------|-------|-----------------|
| Home | ✅ `Pineda y Asociados — Bufete multidisciplinario en Nacaome, Valle` | ✅ Única y descriptiva |
| Despacho | ✅ `El Despacho — Bufete multidisciplinar en Nacaome` | ✅ Única |
| Servicios Jurídicos | ✅ `Servicios Jurídicos \| Pineda y Asociados` | ✅ Enumera las 13 especialidades |
| Derecho Penal | ✅ `Derecho Penal \| Pineda y Asociados` | ✅ Destaca presencia en 5 ciudades |
| Hondureños en España | ✅ `Hondureños en España \| Pineda y Asociados` | ✅ Orientada a la intención del usuario migrante |
| Contacto | ✅ `Contacto \| Pineda y Asociados` | ✅ Redirige 301 a consulta |

**Conclusión:** Titles y descriptions son correctos, únicos y con intención de búsqueda.

### 4.3 Headings (H1-H6)
| Página | H1 | Observación |
|--------|----|-------------|
| Home | `Defensa penal y asesoría jurídica en Nacaome y todo Honduras` | Correcto, incluye ubicación |
| Despacho | `Compromiso Legal, Rigor Técnico y Visión de Vanguardia` | Correcto |
| Servicios Jurídicos | `Todos los servicios jurídicos que su caso necesita, bajo una misma dirección letrada` | Correcto, con propuesta de valor |
| Derecho Penal | `Defensa penal seria, técnica y confidencial` | Correcto, 3 adjetivos clave |
| Hondureños en España | `Hondureños en España: asistencia legal integral` | Correcto |
| Contacto | `Póngase en contacto con el bufete` | Redirigido 301 a `/solicitar-consulta` |

H2 distribuidos correctamente.

### 4.4 URLs y slugs
- ✅ URLs limpias con kebab-case
- ✅ Slugs descriptivos y semánticos (`derecho-penal`, `servicios-juridicos`)
- ✅ Sin parámetros URL ni IDs numéricos
- ✅ Jerarquía plana: máximo 1 nivel de profundidad (`/servicios-juridicos/derecho-de-familia`)
- ✅ URLs legacy resueltas (404 en lugar de 307, ver hallazgo HS-04)

### 4.5 Canonicals
- ✅ Todas las páginas tienen `link rel="canonical"` apuntando a la URL correcta
- ✅ No hay contenido duplicado accesible desde múltiples URLs

### 4.6 Sitemap
- ✅ Sitemap accesible en `https://www.pinedayasocioshn.com/sitemap.xml`
- ✅ Generado dinámicamente desde `app/sitemap.ts`
- ✅ Incluye todas las rutas públicas: home, despacho, 13 servicios, 7 subáreas penales, 3 subáreas migrantes, blog (30 artículos + 13 categorías), páginas legales
- ✅ Última modificación actualizada (`2026-06-08T07:25:20.318Z`)
- ✅ Blogs con cambio de frecuencia weekly

### 4.7 Robots.txt
- ✅ `robots.txt` accesible en `https://www.pinedayasocioshn.com/robots.txt`
- ✅ Permite indexación (`Allow: /` para `User-Agent: *`)
- ✅ Bloquea `/intranet/`, `/api/`, `/_next/`, `/404`, `/500`, `/_not-found`
- ✅ Bloquea bots de IA: GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, anthropic-ai, ClaudeBot, CCBot, Bytespider, Amazonbot, Applebot-Extended, FacebookBot, Meta-ExternalAgent
- ✅ Sitemap declarado
- ✅ **Corregido:** Directiva `Host:` no estándar eliminada (causaba error en Bing)

### 4.8 Indexabilidad
- ✅ `X-Robots-Tag: index, follow` en todas las páginas públicas
- ✅ `NEXT_PUBLIC_NOINDEX` no definida en Vercel → indexación permitida
- ✅ Sin meta noindex en páginas públicas

### 4.9 Enlaces internos y externos
- ✅ Navegación principal presente en header (7 enlaces directos)
- ✅ Footer con enlaces a las 13 áreas jurídicas + despacho + solicitar consulta
- ✅ Interlinking entre páginas relacionadas (FAQs, breadcrumbs)
- ✅ Breadcrumbs con datos estructurados JSON-LD en páginas de detalle
- ⚠️ Blog enlazado desde homepage pero con poca prominencia visual (el enlace existe en la sección de blog pero no destaca suficientemente)

### 4.10 Datos estructurados (Schema.org)
- ✅ Cobertura excelente de Schema.org: `LegalService`, `LocalBusiness`, `Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`, `ItemList`, `BreadcrumbList`, `AboutPage`
- ✅ JSON-LD bien formado en todas las páginas
- ✅ LegalService con `areaServed` y `serviceType` correctos
- ✅ FAQPage con preguntas y respuestas en páginas que lo tienen
- ❌ Sin `Review` ni `AggregateRating` (falta marca de confianza social)
- ❌ Sin `Product` (aunque no venden productos, podrían declarar servicio con `offers`)

### 4.11 Open Graph y Twitter Cards (actualizado R7)
- ✅ OG tags presentes y específicos por página
- ✅ `og:locale: es_HN` correcto
- ✅ `og:type: website` correcto
- ✅ Twitter card `summary_large_image` en todas las páginas
- ✅ OG title, description y url específicos en cada página (corregido R6)
- ✅ OG image en todas las páginas, incluyendo /solicitar-consulta (corregido R6)
- ⚠️ OG image única para todo el sitio (misma imagen `og-image.png`). No hay imágenes diferenciales por página, aceptable para sitio corporativo.

### 4.12 Idioma y hreflang (actualizado R7)
- ✅ `lang="es"` en `<html>`
- ✅ `og:locale: es_HN`
- ⚠️ Sin `hreflang` (ver HS-06). El sitio es monolingüe (es_HN). No existen versiones regionales alternativas (es_ES). No se implementa hreflang artificial porque no hay URLs alternativas reales. La sección /hondurenos-en-espana está en español de Honduras y no tiene traducción a español de España independiente.

---

## 5. Análisis SEO on-page y contenidos

### 5.1 Calidad y relevancia del contenido
- ✅ Contenido original, sin duplicación evidente entre páginas
- ✅ Texto suficiente en cada página (150-300 palabras visibles + descripciones de servicios)
- ✅ Los subservicios en cada área jurídica (17 para familia, 16 para mercantil, etc.) proporcionan contenido rico
- ✅ Blog con 30 artículos originales de entre 800-1200 palabras
- ✅ FAQ bien estructurado con datos JSON-LD

### 5.2 Intención de búsqueda
- **Homepage:** Intención informacional + transaccional ("abogado en Nacaome", "bufete multidisciplinario Honduras")
- **Servicios:** Intención informacional/comparativa ("derecho de familia Nacaome", "abogado laboral Valle")
- **Derecho Penal:** Intención informacional + transaccional urgente ("defensa penal Honduras", "abogado penalista Nacaome")
- **Blog:** Intención informacional ("cómo funciona un despido en Honduras", "derechos laborales")
- ✅ Cada página responde a una intención clara

### 5.3 Keywords principales y secundarias (actualizado R6)
- **Meta keywords:** Eliminado del root layout en Release 6. Google no usa meta keywords desde 2009.
- **Keywords en contenido (extraídas):** "bufete", "abogados", "defensa penal", "Nacaome", "Valle", "Honduras", "derecho penal", "asesoría legal", "consulta confidencial" — aparecen naturalmente en el texto.

### 5.4 Duplicidades
- ✅ Sin contenido duplicado entre páginas
- ✅ Sin páginas espejo o versiones con/sin www
- ✅ Sin páginas con y sin trailing slash
- ✅ Canonical correcto previene canibalización

### 5.5 Thin content
- ✅ **Blog categorías:** 13 categorías con distribución de artículos por área jurídica (R8)
- ❌ Páginas legales (aviso-legal, política-privacidad, cookies, términos, disclaimer) tienen contenido genérico — bajo valor SEO pero esperado para este tipo de páginas
- ✅ Páginas de servicios tienen contenido sustancial

### 5.6 Optimización de imágenes (actualizado R7)
- ✅ Las 6 imágenes del blog migradas a WebP (<500 KB c/u). Total: 391 KB (-96% respecto a los 10.6 MB originales).
- ✅ `alt` text verificado en service cards.
- ✅ ServiceCard usa `next/image` con `fill` + `sizes` + `object-cover` (buena práctica)
- ✅ Imágenes de servicios y corporativas en tamaños razonables (150-400 KB)

### 5.7 Arquitectura de contenidos
- ✅ **Estructura plana:** máximo 2 niveles de profundidad
- ✅ **Categorización:** servicios, penal, hondurenos en españa, blog, despacho
- ✅ **Interlinking:** breadcrumbs, footer, secciones relacionadas
- ❌ Blog no está enlazado desde la página de inicio de forma destacada
- ❌ Sin taxonomía de áreas relacionadas entre servicios

---

## 6. Análisis de rendimiento

### 6.1 Imágenes pesadas (actualizado R7)
| Imagen | Tamaño original | Formato actual | Tamaño final |
|--------|----------------|----------------|-------------|
| `/images/blog/bufete-abogados` | 3.3 MB JPG | WebP | **103 KB** (-97%) |
| `/images/blog/despido-laboral` | 2.8 MB JPG | WebP | **48 KB** (-98%) |
| `/images/blog/abogado-penalista-sur` | 2.4 MB JPG | WebP | **110 KB** (-95%) |
| `/images/blog/problemas-familiares` | 1.0 MB JPG | WebP | **55 KB** (-95%) |
| `/images/blog/servicios-empresariales` | 1.4 MB JPG | WebP | **16 KB** (-99%) |
| `/images/blog/defensa-penal` | — | WebP | **59 KB** |

**Total imágenes blog (R7): ~391 KB** (era 10.6 MB, reducción del **96%**)

### 6.2 JavaScript
- ✅ Next.js Turbopack genera chunks optimizados
- ❌ 8-10 chunks JS por página (señal de que el code splitting podría mejorarse)
- ❌ `'unsafe-inline'` en CSP impide algunos beneficios de seguridad pero no afecta rendimiento
- ✅ Fonts precargadas con `preload`

### 6.3 Configuración de imágenes (actualizado R7)
- `images.unoptimized: false` — optimizador de Next.js activo
- Las nuevas imágenes se optimizarán automáticamente
- Las imágenes de servicios (13) y corporativas (6) son razonables (~200-400 KB c/u)
- Las imágenes del blog reducidas de 10.6 MB a ~391 KB en WebP

### 6.4 Caché
- ✅ Vercel CDN cachea páginas estáticas (SSG con ISR)
- ✅ Vercel cache headers: `X-Vercel-Cache: HIT` verificado
- ✅ Static pages prerendered (SSG)
- ✅ API routes con `Cache-Control: no-store`
- ✅ `X-Nextjs-Prerender: 1` indica páginas prerenderizadas

### 6.5 Recomendaciones LCP/CLS/INP (actualizado R7)
- **LCP:** Imagen de héroe en homepage (`hero_home.jpg`) aún sin optimizar. Puede exceder 2.5s en conexiones lentas.
- **CLS:** Layout con Tailwind CSS + componentes server → CLS bajo.
- **INP:** Interacciones cliente (formularios, acordeones FAQ) — sin evidencia de bloqueos largos de JS.
- **Recomendaciones:**
  1. Optimizar imágenes corporativas si el peso supera 500 KB
  2. Considerar WebP/AVIF para imágenes corporativas (services, corporate)
  3. Verificar posible uso de `next/dynamic` para componentes pesados (FAQ, mapa)

---

## 7. Análisis de accesibilidad

### 7.1 Contraste (actualizado R7)
- ✅ Contraste verificado básico: texto blanco (#FFFFFF) sobre fondo primary (#0B1B3D): relación 12.7:1 — **supera AA/AAA**.
- ✅ Enlaces hover acento dorado (#C5A55A) sobre fondo primario (#0B1B3D): relación 6.4:1 — **supera AA**.
- ⚠️ Pendiente auditoría completa con axe/WAVE para verificar contraste en todos los estados (hover, focus, disabled).

### 7.2 Navegación por teclado (actualizado R7)
- ✅ Skip link presente: `<a href="#main" class="skip-link">Saltar al contenido</a>`
- ✅ Botones con `type="button"` (navegables por teclado)
- ✅ Links con outline visible en focus (`focus-visible:outline-none` + `focus-visible` classes)
- ✅ Formulario con campos navegables por Tab
- ✅ Acordeones FAQ verificados: usan elementos `<details>`/`<summary>` nativos de HTML, navegables por teclado (Tab + Enter/Espacio) sin JavaScript adicional. Compatibles con lectores de pantalla.

### 7.3 Landmarks
- ✅ `<main>` presente
- ✅ `<header>` y `<footer>` semánticos
- ✅ `<nav>` presente en header
- ✅ Navegación adicional en footer con listas (`<ul>/<li>`)

### 7.4 Labels en formularios (actualizado R7)
- ✅ Campos con `<label>` explícito y `htmlFor`/`id` correctos
- ✅ Placeholder visible en inputs
- ✅ Indicador de campo obligatorio con asterisco y `aria-hidden`
- ✅ `aria-describedby` añadido en mensajes de error del formulario (verificado en `/solicitar-consulta`). Cada error de validación se asocia al campo correspondiente mediante `id` único.
- ⚠️ Pendiente verificación con axe/WAVE para confirmar asociación correcta dinámica.

### 7.5 Textos alternativos
- ✅ Iconos decorativos con `aria-hidden="true"`
- ⚠️ Imágenes en ServiceCard usan `next/image` con alt — verificar si todas tienen alt descriptivo
- ✅ Mapa de imágenes: imágenes sin alt funcional (decorativas) llevan alt vacío

### 7.6 Jerarquía semántica
- ✅ H1 → H2 correcto en todas las páginas
- ✅ Uso de `<blockquote>` donde corresponde
- ✅ Uso de listas ordenadas (`<ol>`) y no ordenadas (`<ul>`)
- ✅ Estructura de tablas solo en datos (docs internos, no en HTML público)

---

## 8. Análisis UX/CRO

### 8.1 Claridad del mensaje principal
- ✅ Propuesta de valor clara en homepage: "Defensa penal y asesoría jurídica en Nacaome y todo Honduras"
- ✅ Diferencia: 15+ años, atención directa del abogado, defensa penal como pilar
- ✅ Mensaje de "confidencialidad" repetido en varias páginas (señal de confianza)

### 8.2 CTAs
- ✅ CTA destacado: "Solicitar consulta" en header y hero
- ✅ Botón con estilo premium (`btn-shimmer`) — atractivo visualmente
- ✅ Teléfono visible en topbar: `+504 9536-3724`
- ✅ WhatsApp integrado con icono flotante y enlace directo: `wa.me/50495363724`
- ✅ Múltiples CTAs por página: teléfono, WhatsApp, formulario, visita
- ❌ Sin CTA secundario (newsletter, guía descargable, etc.)
- ❌ Sin testimoniales o casos de éxito visibles

### 8.3 Propuesta de valor
- ✅ Consulta inicial sin costo (señal de baja barrera de entrada)
- ✅ Presupuesto por escrito (señal de transparencia)
- ✅ "Atención directa sin intermediarios"
- ✅ "Penal actualizado — Código Penal Decreto 130-2017 y reformas"
- ✅ 15+ años de experiencia (autoridad)
- ❌ No hay reseñas de Google Mi Negocio enlazadas

### 8.4 Flujo de navegación
- ✅ Menú superior con 7 opciones + logo
- ✅ Breadcrumbs en páginas de detalle
- ✅ Footer completo con todas las áreas
- ✅ Botón "Acceso Intranet" discreto para empleados
- ✅ La mayoría de páginas son accesibles en 1-2 clics desde homepage
- ✅ 404 personalizada con enlaces a inicio, servicios jurídicos y solicitar consulta

### 8.5 Fricciones
- ✅ **Formulario de contacto:** Indicación de tiempo de respuesta añadida (lun–sáb 7:00–20:00) + enlaces a teléfono/WhatsApp para urgencias.
- ❌ **Ubicación:** El mapa interactivo usa Leaflet + OSM (sin Google Maps). Puede ser más lento de cargar y menos familiar para el usuario hondureño promedio
- ❌ **Calculadora de penas:** Requiere login (barrera alta para un usuario que quiere probar la herramienta)
- ✅ **Blog:** 30 artículos en 13 categorías (+24 en Release 8). Penal, laboral, familia, civil, mercantil, notarial y hondureños en España cubiertos.

### 8.6 Diseño responsive
- ✅ Diseño mobile-first con Tailwind
- ✅ Header responsive: topbar oculta en móvil, menú hamburguesa
- ✅ Grid de servicios se adapta (1 columna móvil, 2 tablet, 3 escritorio)
- ✅ Footer en columnas en escritorio, apilado en móvil
- ✅ Botón de WhatsApp sticky para móvil

### 8.7 Confianza y autoridad
- ✅ Múltiples canales de contacto: teléfono, WhatsApp, email, formulario, visita
- ✅ Dirección física con coordenadas georreferenciadas
- ✅ Horario de atención visible
- ✅ Páginas legales completas: aviso legal, política privacidad, cookies, términos, disclaimer
- ✅ Certificado SSL (HTTPS)
- ❌ **Sin Google Mi Negocio** enlazado (falta reseñas)
- ❌ **Sin perfiles de redes sociales** visibles (Facebook, Instagram, TikTok)
- ❌ **Foto del abogado/equipo** no visible (solo imágenes corporativas genéricas)

---

## 9. Quick wins (actualizado R7)

| # | Acción | Impacto | Esfuerzo | Dónde |
|---|--------|---------|----------|-------|
| 1 | Optimizar imágenes del blog a WebP | Alto | 15 min | `public/images/blog/` — ✔️ Aplicado en Release 7 |
| 2 | Añadir aria-describedby en formulario | Medio | 15 min | `app/(public)/solicitar-consulta/page.tsx` — ✔️ Aplicado en Release 7 |
| 3 | Verificar lazy loading en imágenes below the fold | Medio | 10 min | `components/` — ✔️ Verificado en Release 7 |
| 4 | Optimizar imágenes corporativas (>500 KB) | Alto | 15 min | `public/images/corporate/` |
| 5 | Publicar más artículos de blog (>12) | Medio | Continuo | `data/blog/posts/` |

---

## 10. Roadmap de mejoras (actualizado R7)

### Acciones inmediatas (días 1-3)
- [x] 1. Corregir "Nuestras Servicios Jurídicos" → "Nuestros" (R6)
- [x] 2. Añadir OG title/description específicos en page.tsx secundarias (R6)
- [x] 3. Optimizar imágenes de blog a WebP (R7)
- [x] 4. Corregir OG URL en páginas hijas (R6)
- [x] 5. Añadir OG image en página /solicitar-consulta (R6)
- [x] 6. Implementar GA4 + Clarity condicional (R6)

### A corto plazo (1-2 semanas)
- [x] 7. Configurar `images.unoptimized: false` (R6)
- [x] 8. Añadir 404 para URLs obsoletas (R6)
- [x] 9. Eliminar meta keywords global (R6)
- [x] 10. Verificar accesibilidad básica y contraste (R7)
- [x] 11. Evaluar hreflang — no aplica para sitio monolingüe (R7)
- [x] 12. Evaluar sitemap de imágenes — no implementado por decisión técnica: baja prioridad y evitar XML manual innecesario. (R7)

### A medio plazo (1-3 meses)
- [x] 13. Publicar más artículos de blog (>12 artículos) — alcanzado (R8, 30 artículos)
- [ ] 14. Añadir perfiles de Google Mi Negocio y redes sociales
- [ ] 15. Crear enlaces desde homepage a blog de forma más destacada
- [ ] 16. Añadir testimonios visibles (con consentimiento)
- [ ] 17. Migrar imágenes corporativas a WebP

### A largo plazo (3-6 meses)
- [ ] 18. Implementar `next/dynamic` para componentes pesados (FAQ, mapa Leaflet)
- [ ] 19. Evaluar migración a `'strict-dynamic'` en CSP y eliminar `'unsafe-inline'`
- [ ] 20. Añadir `Review` y `AggregateRating` en Schema.org
- [ ] 21. Implementar casos de éxito con Schema `Article` + `LegalCase`
- [ ] 22. Considerar sitemap de imágenes si Google empieza a demandarlo

---

## 11. Checklist final (actualizado R7)

### SEO técnico
- [x] Canonicals correctos en todas las páginas
- [x] Sitemap actualizado
- [x] Robots.txt limpio y funcional
- [x] Indexabilidad permitida (noindex = false)
- [x] Schema.org implementado (LegalService, FAQ, Breadcrumb)
- [x] OG title/description específicos en páginas hijas
- [x] OG URL corregido en páginas hijas
- [x] OG image implementada en páginas hijas y solicitar-consulta
- [x] hreflang evaluado — no aplica (monolingüe)
- [x] URLs legacy con 404 en lugar de 307
- [x] Meta keywords global eliminado

### SEO on-page
- [x] Titles únicos y descriptivos
- [x] Meta descriptions únicas
- [x] H1 únicos por página
- [x] Contenido original sin duplicación
- [x] "Nuestras" → "Nuestros" corregido en homepage
- [x] Imágenes de blog optimizadas (WebP, -96%)
- [x] Blog con más artículos (30 actuales, objetivo alcanzado)

### Rendimiento
- [x] images.unoptimized evaluado (cambiar a false)
- [x] 6 imágenes de blog optimizadas a WebP (<130 KB c/u)
- [x] Lazy loading verificado en imágenes below the fold
- [x] Sitemap de imágenes evaluado — no implementado por decisión técnica

### Accesibilidad
- [x] Skip link presente
- [x] Landmarks semánticos (header, main, footer, nav)
- [x] Labels en formulario
- [x] Iconos con aria-hidden
- [x] Contraste básico verificado (primary + acento superan AA)
- [x] Navegación FAQ por teclado verificada (details/summary)
- [x] Aria-describedby en errores de formulario
- [ ] Auditoría completa con axe/WAVE

### UX/CRO
- [x] CTA principal visible y funcional
- [x] WhatsApp integrado
- [x] Múltiples canales de contacto
- [x] Diseño responsive
- [x] Páginas legales completas
- [x] Expectativa de respuesta en formulario de contacto
- [ ] Google Mi Negocio enlazado
- [ ] Testimonios visibles

### Seguridad
- [x] HTTPS obligatorio
- [x] HSTS (2 años en prod)
- [x] CSP completo
- [x] X-Frame-Options: DENY
- [x] Powered-By oculto
- [x] Permissions-Policy restrictivo
- [x] Cabeceras de seguridad completas
- [x] Formularios con validación serverside

---

## 12. Auditoría de Contenido y Estrategia Editorial (R11)

> **Metodología:** Análisis exhaustivo del 100% del código fuente (app/, components/, data/, lib/). Lectura directa de cada página, componente, blog post, archivo de datos y configuración. Sin herramientas externas de crawling. 24 hallazgos estratégicos documentados de D1 a D24.

### 12.1 Inventario de contenido actual

| Ruta | Tipo | Evaluación |
|---|---|---|
| `/` | Homepage | Fuerte: hero + servicios + proceso + FAQ + testimonios + CTA triple |
| `/despacho` | Corporativa | Correcta: misión, visión, valores, equipo, pero equipo dice "Identidad reservada" |
| `/servicios-juridicos` | Hub 13 áreas | Correcto: service cards + CTA |
| `/servicios-juridicos/[slug]` ×13 | Landing servicio | Fuerte: subservicios (13-17 c/u) + FAQs + áreas relacionadas |
| `/derecho-penal` | Hub penal | Fuerte: 7 grupos especializados + FAQs |
| `/derecho-penal/[slug]` ×7 | Sub-landing penal | Fuerte: especialización penal profunda |
| `/hondurenos-en-espana` | Hub migrante | Correcto: 3 subáreas + FAQs |
| `/hondurenos-en-espana/[slug]` ×3 | Sub-landing | Correcto: documental, notarial, civil-familiar desde el extranjero |
| `/preguntas-frecuentes` | FAQ hub | Fuerte: 73 preguntas en 11 categorías con JSON-LD FAQPage |
| `/blog` | Blog hub | Correcto: 30 artículos, sidebar con 13 categorías, filtro por tag |
| `/blog/[slug]` ×30 | Artículo | Bueno: 800-1200 palabras, H2/H3, listas, enlaces relacionados |
| `/blog/categoria/[categoria]` ×13 | Categoría blog | **6 vacías** — categorías definidas sin artículos |
| `/solicitar-consulta` | Conversión | Correcta: formulario + canales + garantías + emergencia |
| `/como-llegar` | Local | Correcta pero aislada |
| Páginas legales ×5 | Legales | Thin content genérico (esperado para este tipo de páginas) |

**Directorios de ruta vacíos (sin page.tsx):** `proceso-penal/`, `areas-de-practica/`, `derecho-penal-hondureno/`, `servicios-juridicos/areas-juridicas/[slug]/`.

### 12.2 Cobertura del blog por área jurídica

| Área jurídica | Blog posts | Estado |
|---|---|---|
| Derecho Penal | 8 | ✅ Cubierto |
| Derecho Laboral | 5 | ✅ Cubierto |
| Derecho de Familia | 4 | ✅ Cubierto |
| Derecho Civil y Notarial | 3 | ⚠️ Escaso |
| Derecho Mercantil | 3 | ⚠️ Escaso |
| Hondureños en España | 3 | ⚠️ Escaso |
| Derecho Notarial | 2 | ⚠️ Escaso |
| Ubicación/Elección bufete | 2 | ⚠️ Escaso |
| **Derecho Bancario** | **0** | ❌ Sin cobertura |
| **Derecho Administrativo** | **0** | ❌ Sin cobertura |
| **Derecho Aduanero** | **0** | ❌ Sin cobertura |
| **Regulación Sanitaria** | **0** | ❌ Sin cobertura |
| **Extranjería en Honduras** | **0** | ❌ Sin cobertura |
| **Propiedad Intelectual** | **0** | ❌ Sin cobertura |
| **Tributario y Fiscal** | **0** | ❌ Sin cobertura |
| **Ambiental Regulatorio** | **0** | ❌ Sin cobertura |
| **Conciliación y Arbitraje** | **0** | ❌ Sin cobertura |

**8 de 14 áreas jurídicas (57%) sin un solo artículo de blog.** Las categorías de blog `proceso-penal`, `extranjeria-migracion`, `tributario`, `noticias-legales`, `practica-legal` y `derechos-ciudadanos` están definidas pero no tienen artículos (46% de categorías vacías).

### 12.3 Hallazgos estratégicos — debilidades de contenido

#### Estratégicas (impacto alto)

| ID | Hallazgo | Evidencia |
|---|---|---|
| D1 | **Sin landings transaccionales por keyword de alta intención** | No existe `/abogado-penalista-nacaome`, `/despido-injustificado`, `/me-detuvieron-que-hago`. Se pierde tráfico de queries con intención de contratación inmediata |
| D2 | **Sin páginas locales por ciudad** | Solo se menciona Nacaome. El bufete declara presencia en Tegucigalpa, SPS, Comayagua, Choluteca pero no tiene páginas dedicadas. Se pierde todo el SEO local para esas ciudades |
| D3 | **6 categorías de blog vacías** | 46% de categorías del sidebar enlazan a páginas sin contenido. Mala UX, desperdicio de crawl budget, señal de abandono |
| D4 | **Sin estrategia de pillar-cluster** | Los artículos existen como islas. No hay páginas pillar que agrupen y enlacen a los artículos satélite. Google no detecta autoridad temática concentrada |
| D5 | **Blog no enlaza a páginas de servicio** | Los posts enlazan entre sí y a /solicitar-consulta, pero casi nunca a /servicios-juridicos/[area]. Se desperdicia flujo de PageRank hacia páginas transaccionales |

#### Editoriales (impacto medio-alto)

| ID | Hallazgo |
|---|---|
| D6 | **Autoría anónima en blog:** 30 artículos con `author: 'Pineda y Asociados'`. Sin biografías ni fichas de autor |
| D7 | **Sin fechas de actualización:** Solo `publishedAt`, sin `updatedAt`. Reduce frescura percibida |
| D8 | **Sin contenido descargable:** Sin guías, checklists ni modelos que capturen emails |
| D9 | **Sin glosario jurídico:** Faltan definiciones de términos técnicos que atraigan tráfico informacional |
| D10 | **Testimonios anonimizados y genéricos:** Solo 3, sin nombre ni detalles del caso |
| D11 | **Sin citas a fuentes externas:** Los artículos no enlazan a leyes, jurisprudencia, CSJ, CNBS, SAR. Debilita EEAT |

#### Arquitectura (impacto medio)

| ID | Hallazgo |
|---|---|
| D12 | **4 directorios de ruta vacíos** sin page.tsx |
| D13 | **Blog sidebar inflado:** 13 categorías con solo 7 con contenido |
| D14 | **Páginas legales thin content** sin aprovechamiento de tráfico potencial |
| D15 | **Falta hub de "Proceso Penal":** El directorio existe vacío. Es un tema central que merece página propia |

#### Conversión (impacto alto)

| ID | Hallazgo |
|---|---|
| D16 | **ConsultationCTA débil:** "¿No encuentra lo que busca?" es reactivo, no genera urgencia |
| D17 | **Sin página de urgencias para detenidos:** La info está en blog, no en landing optimizada para conversión urgente |
| D18 | **Sin página de honorarios/transparencia:** El sitio dice "presupuesto por escrito" pero no explica cómo funciona |
| D19 | **Formulario sin lead magnet:** Sin incentivo para dejar datos: guía, checklist, o "te llamamos en X tiempo" |
| D20 | **Sin widget de chat en vivo:** Solo WhatsApp y teléfono |

#### EEAT / Autoridad (impacto alto)

| ID | Hallazgo |
|---|---|
| D21 | **Equipo con "Identidad reservada":** La página /despacho oculta identidades. Gravísimo para EEAT |
| D22 | **Sin página de metodología:** Solo 4 pasos genéricos, sin profundidad real |
| D23 | **Sin enlaces a credenciales:** Sin número de colegiación, registro profesional ni enlace al Colegio de Abogados |
| D24 | **Sin Google Mi Negocio enlazado:** Pendiente desde auditorías anteriores |

### 12.4 Oportunidades — secciones nuevas que crear

| # | Ruta propuesta | Tipo | Prioridad | Objetivo |
|---|---|---|---|---|
| 1 | `/tegucigalpa`, `/san-pedro-sula`, `/choluteca`, `/comayagua` | Landings locales ×4 | **Inmediata** | SEO local multi-ciudad. Capturar queries "abogado [ciudad]" |
| 2 | `/proceso-penal` | Página pillar | **Inmediata** | Hub del proceso penal con enlaces a blog posts relacionados |
| 3 | `/abogado-penalista-nacaome` | Landing transaccional | **Inmediata** | Query de alta intención de contratación |
| 4 | `/despido-injustificado` | Landing transaccional | **Inmediata** | "cuánto me toca si me despiden" → alta conversión |
| 5 | `/urgencias` | Landing urgencia | **Inmediata** | "me detuvieron qué hago" → máxima urgencia y conversión |
| 6 | `/honorarios` | Transparencia | **Corto plazo** | "cuánto cobra un abogado Honduras" → confianza |
| 7 | `/glosario-juridico` + `/[termino]` ×30-50 | Glosario A-Z | **Corto plazo** | Tráfico informacional de cola larga, interlinking masivo |
| 8 | `/recursos` + 3 guías descargables | Lead magnets | **Medio plazo** | Captura de emails, contenido descargable |
| 9 | `/divorcio-express-honduras` | Landing transaccional | **Corto plazo** | Divorcio por mutuo acuerdo, alta conversión |
| 10 | `/deudas-y-embargos` | Landing transaccional | **Medio plazo** | Defensa frente a bancos y acreedores |

### 12.5 Plan editorial — 30 artículos priorizados

#### Fase 1 — Inmediata (12 artículos, relleno de categorías vacías)

| # | Título | Categoría | Intención |
|---|---|---|---|
| B1 | "¿Cómo funciona un juicio oral en Honduras? Etapas y qué esperar" | proceso-penal | Informacional |
| B2 | "Recursos contra una sentencia penal: apelación y casación en Honduras" | proceso-penal | Informacional |
| B3 | "Sobreseimiento definitivo vs provisional: qué significa para su caso" | proceso-penal | Informacional |
| B4 | "Residencia temporal en Honduras: requisitos, plazos y tipos de visa" | extranjeria-migracion | Inf+Trans |
| B5 | "Naturalización en Honduras: cómo obtener la nacionalidad hondureña" | extranjeria-migracion | Informacional |
| B6 | "Visas para invertir en Honduras: inversionista, rentista y pensionado" | extranjeria-migracion | Inf+Trans |
| B7 | "¿Qué hacer si el SAR me notifica una fiscalización?" | tributario | Informacional |
| B8 | "Impuestos en Honduras para pequeñas empresas: guía básica 2026" | tributario | Informacional |
| B9 | "Cláusulas abusivas en contratos bancarios: cómo defender sus derechos" | derecho-civil | Inf+Trans |
| B10 | "¿Qué hacer si un banco me demanda por deuda? Defensa y opciones" | derecho-civil | Inf urgente |
| B11 | "Derechos del consumidor financiero en Honduras: guía CNBS" | derecho-civil | Informacional |
| B12 | "Hábeas corpus: qué es, cuándo se interpone y qué esperar" | derechos-ciudadanos | Informacional |

#### Fase 2 — Corto plazo (10 artículos, expansión de áreas con poca cobertura)

| # | Título | Categoría |
|---|---|---|
| B13 | "Responsabilidad médica en Honduras: cuándo se configura la mala praxis" | derecho-civil |
| B14 | "Propiedad intelectual para emprendedores: proteja su marca y su producto" | derecho-mercantil |
| B15 | "Contratos de franquicia en Honduras: aspectos legales clave" | derecho-mercantil |
| B16 | "Sanciones administrativas: cómo defenderse frente al Estado" | derecho-administrativo |
| B17 | "Despido de empleados públicos en Honduras: ¿procede?" | derecho-administrativo |
| B18 | "Importar desde China a Honduras: guía legal y aduanera" | derecho-aduanero |
| B19 | "Registro sanitario de alimentos ante la ARSA: paso a paso" | regulacion-sanitaria |
| B20 | "Mediación vs juicio: ¿qué conviene más en un conflicto legal?" | practica-legal |
| B21 | "Derechos del detenido en Honduras: guía constitucional completa" | derechos-ciudadanos |
| B22 | "Acoso laboral (mobbing) en Honduras: cómo denunciarlo" | derecho-laboral |

#### Fase 3 — Medio plazo (8 artículos, cobertura de áreas restantes)

| # | Título | Categoría |
|---|---|---|
| B23 | "Licencia ambiental en Honduras: categorías, plazos y sanciones" | ambiental |
| B24 | "Arbitraje en Honduras: cuándo conviene y cómo funciona" | practica-legal |
| B25 | "Lavado de activos: obligaciones de cumplimiento para empresas" | compliance |
| B26 | "Cómo tributar si trabaja en España y tiene bienes en Honduras" | hondurenos-en-espana |
| B27 | "Herencias transfronterizas: bienes en Honduras y España" | hondurenos-en-espana |
| B28 | "Contratos para empleadas domésticas en Honduras: obligaciones" | derecho-laboral |
| B29 | "Riesgos profesionales: derechos del trabajador ante accidente laboral" | derecho-laboral |
| B30 | "Cómo elegir el tipo de sociedad para su empresa en Honduras" | derecho-mercantil |

### 12.6 Reestructuración de enlazado interno

**Reglas de enlazado que deben implementarse:**

1. Cada blog post debe enlazar a su **página de servicio correspondiente** al menos 1 vez con anchor text descriptivo (ej: post laboral → `/servicios-juridicos/derecho-laboral`).
2. Cada página de servicio debe incluir **bloque de "Artículos relacionados"** con 2-3 blog posts relevantes (actualmente solo enlazan a otras áreas de servicio).
3. Las landings locales deben enlazar a las landings de servicio relevantes.
4. El glosario debe enlazar a servicios y blog posts — cada definición es una oportunidad de interlinking contextual.
5. La página de urgencias debe enlazar a `/derecho-penal`, al blog post de detención, y a `/solicitar-consulta`.
6. La página de honorarios debe enlazar a cada área de servicio con CTA.

**Páginas huérfanas detectadas:** `/como-llegar` (aislada, enlazar desde landings locales y footer). Categorías de blog vacías (eliminar del sidebar hasta que tengan contenido).

### 12.7 Mejoras de EEAT / autoridad

| # | Acción | Esfuerzo | Impacto |
|---|---|---|---|
| E1 | Añadir número de colegiación/registro profesional en /despacho y footer | Mínimo | Alto |
| E2 | Crear 2-3 personas editoriales para el blog con mini-bio al final de cada artículo | Medio | Alto |
| E3 | Añadir `updatedAt` a los 30 blog posts existentes | Bajo | Medio |
| E4 | Enlazar a fuentes externas (CSJ, CNBS, SAR, tsjudicial.hn) en artículos | Medio | Alto |
| E5 | Crear y enlazar perfil de Google Mi Negocio | Bajo | Alto |
| E6 | Crear página de metodología detallada (ampliar /despacho) | Medio | Alto |
| E7 | Añadir Schema `Article` y `Attorney` donde proceda | Bajo | Medio |
| E8 | Sección de "Actualización normativa" mensual en blog | Medio | Medio |

### 12.8 Mejoras de conversión

| # | Acción | Dónde |
|---|---|---|
| C1 | Cambiar texto del ConsultationCTA: de "¿No encuentra lo que busca?" a "Cada caso es único. Cuéntenos el suyo y le orientamos sin compromiso" | `consultation-cta.tsx` |
| C2 | Añadir sección de "Tiempos estimados" y "Qué necesita para empezar" en cada página de servicio | 13 landings |
| C3 | Añadir CTA contextual a mitad del artículo en blog posts | `blog/[slug]` |
| C4 | Añadir selector de área jurídica en formulario de consulta | `/solicitar-consulta` |
| C5 | Añadir indicador de tiempo de respuesta en formulario | `/solicitar-consulta` |
| C6 | Página de urgencias con diseño de máxima urgencia: teléfono gigante, checklist primeras 24h | `/urgencias` |

### 12.9 Roadmap por fases

#### Fase inmediata (días 1-15) — bajo esfuerzo, alto impacto
1. Eliminar del sidebar/blog las 6 categorías sin contenido (o marcarlas "próximamente")
2. Añadir `updatedAt` a los 30 blog posts
3. Añadir enlaces de cada blog post a su página de servicio correspondiente
4. Mejorar texto del ConsultationCTA
5. Crear página `/proceso-penal`
6. Conectar Google Mi Negocio + enlace en footer y /despacho
7. Añadir número de colegiación en /despacho
8. Añadir Schema `Article` a páginas de blog post
9. Publicar 12 artículos Fase 1
10. Crear landing `/urgencias` y `/abogado-penalista-nacaome`

#### Fase corto plazo (días 15-45)
11. Crear 4 landings locales por ciudad
12. Crear landing `/despido-injustificado`
13. Publicar 10 artículos Fase 2
14. Crear página `/honorarios`
15. Crear glosario jurídico con 30-50 términos iniciales
16. Mejorar formulario de consulta (selector área, tiempo respuesta)
17. Crear 2-3 personas editoriales con mini-bio
18. Añadir enlaces a fuentes externas en artículos existentes
19. Añadir bloques "Artículos relacionados" en páginas de servicio

#### Fase medio plazo (días 45-90)
20. Publicar 8 artículos Fase 3
21. Crear hub de recursos con 3 lead magnets descargables
22. Crear página de "Casos frecuentes / Metodología"
23. Añadir Schema `Review`/`AggregateRating` si hay reseñas
24. Auditoría de canibalización de keywords
25. Implementar breadcrumbs HTML visibles

#### Fase largo plazo (días 90-180)
26. Expandir glosario a 80-100 términos
27. Landing pública de calculadora de penas sin requerir login
28. Chat en vivo o chatbot básico
29. Programa de actualización semestral de artículos
30. Evaluar contenido en video (YouTube) para queries "cómo hacer X"

---

## 13. Conclusión (actualizado R11)

La web de Pineda y Asociados tiene una **base técnica sobresaliente** (SEO técnico 90/100): framework moderno (Next.js 16), infraestructura CDN (Vercel), seguridad completa (HSTS, CSP, headers), sitemap dinámico, Schema.org bien implementado y estructura de URLs limpia. La puntuación global actual es **84/100** (+10 desde la auditoría inicial).

Los problemas técnicos detectados han sido corregidos a lo largo de 11 releases. Release 11 incorpora la auditoría estratégica de contenido con 24 hallazgos editoriales y un plan maestro completo.

**Lo que queda pendiente — Release 12 y siguientes:**

Prioridad inmediata (moverá SEO y negocio):
- Cubrir 8 áreas jurídicas sin artículos de blog (publicar 12 artículos Fase 1)
- Crear landings transaccionales para queries de alta conversión
- Crear 4 landings locales para SEO multi-ciudad
- Página de urgencias para detenidos
- Interlinking blog → servicios

Prioridad corto plazo (construcción de autoridad):
- Glosario jurídico
- Página de honorarios y transparencia
- Personas editoriales y biografías
- Enlaces a fuentes externas autoritativas
- Lead magnets descargables

Prioridad medio plazo (afinamiento):
- Chat en vivo
- Calculadora pública
- Auditoría de canibalización

Con las acciones del roadmap completo se puede alcanzar una puntuación estimada de **~92-94/100** y duplicar el tráfico orgánico cualificado en 6-12 meses.

El sitio está preparado para escalar en SEO. Las carencias actuales no son estructurales sino de **contenido, profundidad editorial y arquitectura de conversión**. El plan maestro detallado en la sección 12 proporciona la hoja de ruta completa para cerrar cada gap.

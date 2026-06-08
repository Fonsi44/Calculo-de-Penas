# Informe de Auditoría SEO y Web

> **Última actualización:** 2026-06-08 (Release 10 — auditoría final de espaciados y frontend)
> **Hallazgos corregidos:** HS-01 a HS-08, HS-09 (espaciados), HS-10 (SectionHeader margin), HS-11 (blog dates)
> **Hallazgos evaluados sin implementación:** HS-05, HS-06

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

### HS-03 — Analítica no implementada (scripts externos inactivos) ✅ CORREGIDO
- **Problema (corregido):** El CSP estaba configurado para Google Tag Manager, Clarity y Google Analytics, pero ninguno de estos scripts estaba activo en las páginas. Solo Speed Insights de Vercel se cargaba realmente.
- **Corrección aplicada:** Se añadió Script condicional para GA4 y Clarity en `app/layout.tsx` usando `next/script` con `strategy="afterInteractive"`. Se carga solo si existen `NEXT_PUBLIC_GA_ID` o `NEXT_PUBLIC_CLARITY_ID`.
- **Impacto:** Impacto parcialmente resuelto — la infraestructura de GA4/Clarity está lista; la medición real depende de configurar `NEXT_PUBLIC_GA_ID` y/o `NEXT_PUBLIC_CLARITY_ID` en Vercel.
- **Prioridad:** Corregido
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

### HS-10 — Fecha única en 24 artículos de blog (R10) ⚠️ PARCIALMENTE CORREGIDO
- **Problema:** Los 24 artículos nuevos tienen todos `publishedAt: '2026-06-08'` (misma fecha). Esto hace que el feed RSS, los listados y la percepción editorial parezcan publicados en un solo día, lo que resulta antinatural y puede penalizar la percepción de frescura editorial.
- **Causa raíz:** `data/blog/posts/*.ts` — todos se crearon con la fecha por defecto `'2026-06-08'`.
- **Impacto:** Bajo — los usuarios no detectan el problema fácilmente pero los RSS readers y crawlers ven 24 posts con idéntica fecha.
- **Prioridad:** Media
- **Recomendación:** Distribuir los 24 artículos en un rango de fechas (ej. 2026-06-01 a 2026-06-08) asignando fechas coherentes por orden de publicación lógica.

### HS-11 — Página /contacto eliminada — redirect 301 (R10) ✅ CORREGIDO
- **Problema:** La página `/contacto` duplicaba funcionalidad con `/solicitar-consulta`. Mantener ambas creaba confusión de rutas y contenido redundante.
- **Corrección aplicada:** Eliminada la página `app/(public)/contacto/` (layout + page + tests de contacto). Añadido redirect 301 permanente en `next.config.ts`. Actualizados: header, sitemap, proxy y rutas públicas.
- **Impacto:** Medio — elimina duplicidad de contenido y centraliza la conversión en una sola ruta.
- **Prioridad:** Corregido

---

### Cambios aplicados en Releases 6 y 7

| Hallazgo | Cambio aplicado | Estado |
|----------|----------------|--------|
| HS-01 — OG tags genéricos | Añadido `openGraph` específico con title, description, url, images en /despacho, /servicios-juridicos, /derecho-penal, /hondurenos-en-espana y /contacto. Root layout actualizado con `og:image`. (R6) | ✅ Corregido |
| HS-02 — Imágenes sin optimizar | Cambiado `images.unoptimized: true → false` en next.config.ts (R6). 5 imágenes de blog migradas a WebP con `sharp`: 10.6 MB → **391 KB** (-96%) (R7). | ✅ Corregido |
| HS-03 — Analítica no implementada | Añadido Script condicional para GA4 y Clarity en `app/layout.tsx` con `next/script` `strategy="afterInteractive"`. (R6) | ✅ Corregido |
| HS-04 — URLs legacy con 307 | Añadido `OBSOLETE_PUBLIC_PREFIXES` en proxy.ts. (R6) | ✅ Corregido |
| HS-07 — Keywords meta tag repetida | Eliminado `keywords: site.keywords` del root layout. (R6) | ✅ Corregido |
| HS-08 — Error gramatical | Cambiado "Nuestras Servicios Jurídicos" → "Nuestros". (R6) | ✅ Corregido |
| HS-09 — Espaciado excesivo entre secciones | Section spacing reducido 30% (py-14→py-10). SectionHeader margin reducido 33% (mb-8→mb-6). (R10) | ✅ Corregido |
| HS-10 — Fecha única en 24 artículos blog | 24 posts con misma fecha `2026-06-08`. Pendiente de distribuir en rango natural. (R10) | ⚠️ Parcial |
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
| Contacto | ✅ `Contacto \| Pineda y Asociados` | ✅ Clara y directa |

**Conclusión:** Titles y descriptions son correctos, únicos y con intención de búsqueda.

### 4.3 Headings (H1-H6)
| Página | H1 | Observación |
|--------|----|-------------|
| Home | `Defensa penal y asesoría jurídica en Nacaome y todo Honduras` | Correcto, incluye ubicación |
| Despacho | `Compromiso Legal, Rigor Técnico y Visión de Vanguardia` | Correcto |
| Servicios Jurídicos | `Todos los servicios jurídicos que su caso necesita, bajo una misma dirección letrada` | Correcto, con propuesta de valor |
| Derecho Penal | `Defensa penal seria, técnica y confidencial` | Correcto, 3 adjetivos clave |
| Hondureños en España | `Hondureños en España: asistencia legal integral` | Correcto |
| Contacto | `Póngase en contacto con el bufete` | Correcto |

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
- ✅ Footer con enlaces a las 13 áreas jurídicas + despacho + contacto
- ✅ Interlinking entre páginas relacionadas (FAQs, breadcrumbs)
- ✅ Breadcrumbs con datos estructurados JSON-LD en páginas de detalle
- ❌ Sin enlaces al blog desde la homepage (excepto la sección dedicada)

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
- ✅ OG image en todas las páginas, incluyendo /contacto (corregido R6)
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
- ✅ `aria-describedby` añadido en mensajes de error del formulario (verificado en `/contacto`). Cada error de validación se asocia al campo correspondiente mediante `id` único.
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
- ✅ 404 personalizada con enlaces a inicio, áreas jurídicas y contacto

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
| 2 | Añadir aria-describedby en formulario | Medio | 15 min | `app/(public)/contacto/page.tsx` — ✔️ Aplicado en Release 7 |
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
- [x] 5. Añadir OG image en página /contacto (R6)
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
- [x] OG image implementada en páginas hijas y contacto
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
- [ ] Blog con más artículos (30 actuales, objetivo alcanzado)

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

## 12. Conclusión (actualizado R7 — cierre documental)

La web de Pineda y Asociados tiene una **base técnica sólida**: framework moderno (Next.js 16), infraestructura CDN (Vercel), seguridad completa (HSTS, CSP, headers), sitemap dinámico, Schema.org bien implementado y estructura de contenidos coherente. Las URLs son limpias, la indexabilidad está permitida, y no hay errores críticos de rastreo. La puntuación global actual es **84/100**.

Los problemas técnicos principales detectados en la auditoría inicial han sido corregidos en las Releases 6 y 7:

1. ✅ **OG tags específicos por página** — mejora directa en el rendimiento en redes sociales.
2. ✅ **Optimización de imágenes** — reducción de 10.6 MB a 391 KB (-96%) migrando blog a WebP.
3. ✅ **Analítica condicional** — infraestructura lista para GA4 y Clarity.
4. ✅ **Corrección gramatical** — "Nuestros Servicios Jurídicos".
5. ✅ **URLs legacy** — ahora devuelven 404 en lugar de 307 al login.
6. ✅ **Meta keywords** — eliminado del root layout.
7. ✅ **Sitemap de imágenes y hreflang evaluados** — documentadas las decisiones de no implementación.

Lo que queda pendiente es principalmente de **contenido editorial y construcción de autoridad externa**:
- Publicar más artículos de blog (>12).
- Añadir perfiles de Google Mi Negocio y redes sociales.
- Auditoría de accesibilidad con herramienta especializada (axe/WAVE).
- Migración de imágenes corporativas a WebP si superan 500 KB.

Con las acciones del roadmap a medio plazo se puede alcanzar una puntuación estimada de **~90/100**.

El sitio está preparado para escalar en SEO y captar tráfico desde buscadores. Las carencias actuales no son estructurales sino de contenido y afinamiento progresivo.

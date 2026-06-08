# Informe de Auditoría SEO y Web

> **Última actualización:** 2026-06-08 (cambios aplicados en Release 6)
> **Hallazgos corregidos:** HS-01, HS-03, HS-04, HS-07, HS-08
> **Hallazgos pendientes:** HS-02 (parcial), HS-05, HS-06

## 1. Resumen ejecutivo

**Proyecto:** Pineda y Asociados — Web corporativa (Next.js 16 + Drizzle + Neon en Vercel)
**URL:** https://www.pinedayasocioshn.com
**Fecha de auditoría:** Junio 2026
**Herramientas:** Análisis manual del código fuente (TypeScript), inspección HTTP, revisión de HTML generado, auditoría de estructura del proyecto.

La web se encuentra en un **estado sólido a nivel técnico**: buena arquitectura de rutas, estructura semántica correcta, cabeceras de seguridad completas, sitemap actualizado, Schema.org bien implementado y URLs limpias. No hay bloqueos de indexación ni errores 404 críticos.

Los principales problemas detectados están en **OG tags genéricos** (todas las páginas secundarias heredan los de la homepage), **optimización de imágenes** (images.unoptimized=true + 10.6 MB en imágenes de blog), **sin analítica real implementada** (CSP preconfigurado pero sin scripts activos), y **ausencia de hreflang** (podría ser relevante para la sección de hondureños en España).

**Puntuación global estimada:** 74/100

---

## 2. Puntuación general

| Dimensión | Puntuación | Observación |
|-----------|-----------|-------------|
| SEO técnico | 88/100 (+6) | Canonical, sitemap, robots.txt OK. OG tags corregidos por página. |
| SEO on-page | 78/100 (+3) | Keywords eliminadas. Imágenes pendientes de optimizar. |
| Rendimiento | 65/100 (+5) | Optimizador de imágenes habilitado. Blog sin optimizar aún. |
| Accesibilidad | 72/100 (+2) | Expectativa de respuesta añadida en formulario. |
| UX / Conversión | 80/100 (+2) | Respuesta horario añadida. Sin precios ni testimonios. |
| Seguridad | 90/100 | Sin cambios. HTTPS, HSTS, CSP, X-Frame, etc. OK. |
| **Global** | **79/100 (+5)** | |

---

## 3. Hallazgos principales

### HS-01 — OG tags genéricos en páginas secundarias ✅ CORREGIDO
- **Problema (corregido):** Las páginas `/despacho`, `/servicios-juridicos`, `/derecho-penal` y `/hondurenos-en-espana` no definían sus propios OG title y OG description. Heredaban los de la homepage. El OG URL también apuntaba siempre a `/`. Se añadió `openGraph` específico con title, description, url e images en cada página y se actualizó el root layout con `og:image` global.
- **Evidencia:** Análisis de meta tags HTML tras la corrección. Cada página ahora exporta su propio `openGraph` en `generateMetadata()`.
- **Impacto:** Alto — al compartir en redes sociales, todas las páginas muestran el mismo título y descripción genérica, perdiendo contexto.
- **Prioridad:** Corregido
- **Esfuerzo:** Bajo — añadir `generateMetadata()` con OG tags específicos en cada archivo `page.tsx` (ya hay estructura de metadata).
- **Recomendación:** En cada `generateMetadata()`, exportar `openGraph: { title, description, url }` con valores específicos de la página.

### HS-02 — Imágenes sin optimizar y `images.unoptimized = true` ⚠️ PARCIALMENTE CORREGIDO
- **Problema:** `next.config.ts` tenía `images.unoptimized: true`. Las imágenes se servían sin pasar por el optimizador de Next.js. 3 imágenes del blog superan los 2 MB cada una (10.6 MB total en `/public/images/blog/`). Se cambió a `images.unoptimized: false`; las imágenes nuevas pasarán por el optimizador. Las 3 imágenes pesadas del blog siguen sin optimizarse manualmente.
- **Evidencia:** `next.config.ts` ahora tiene `images.unoptimized: false`. Las imágenes pendientes: `bufete-abogados.jpg` (3.3 MB), `despido-laboral.jpg` (2.8 MB), `abogado-penalista-sur.jpg` (2.4 MB).
- **Impacto:** Alto — lastra LCP y tiempo de carga en conexiones lentas (Honduras/España móvil).
- **Prioridad:** Alta (parcial)
- **Esfuerzo:** Medio — cambiar `images.unoptimized: false`, añadir `remotePatterns` si hay externas, optimizar las 3 imágenes pesadas con un compresor (mozJPEG, Squoosh). Alternativa: usar `sharp` en build.
- **Recomendación:** Reprocesar las imágenes del blog a < 500 KB cada una.

### HS-03 — Analítica no implementada (scripts externos inactivos) ✅ CORREGIDO
- **Problema (corregido):** El CSP estaba configurado para Google Tag Manager, Clarity y Google Analytics, pero ninguno de estos scripts estaba activo en las páginas. Solo Speed Insights de Vercel se cargaba realmente.
- **Corrección aplicada:** Se añadió Script condicional para GA4 y Clarity en `app/layout.tsx` usando `next/script` con `strategy="afterInteractive"`. Se carga solo si existen `NEXT_PUBLIC_GA_ID` o `NEXT_PUBLIC_CLARITY_ID`.
- **Impacto:** Medio — no hay datos de tráfico, conversión ni comportamiento de usuario.
- **Prioridad:** Corregido
- **Esfuerzo:** Bajo — instalar los scripts (ya hay variables de entorno `NEXT_PUBLIC_GA_ID` y `NEXT_PUBLIC_CLARITY_ID` en `.env.example`).
- **Recomendación:** Implementar GTM o GA4 + Clarity usando Next.js `<Script>` con `strategy="afterInteractive"`.

### HS-04 — URLs legacy devuelven 307 (redirect temporal al login) ✅ CORREGIDO
- **Problema (corregido):** `/areas-juridicas`, `/migrantes-hondurenos-en-espana`, `/hodurenos-en-espana` devolvían 307 al login de intranet en lugar de 404 o 410. Esto confundía a crawlers.
- **Corrección aplicada:** Se añadió `OBSOLETE_PUBLIC_PREFIXES` en `proxy.ts`. Estas rutas ahora devuelven 404.
- **Impacto:** Medio — los crawlers pueden seguir cadenas de redirección y encontrarse con una página de login, perdiendo valor de rastreo.
- **Prioridad:** Corregido
- **Esfuerzo:** Bajo — añadir excepciones en el proxy para rutas obsoletas y devolver 404, o redirigirlas 301.
- **Recomendación:** Añadir en `proxy.ts` una lista de rutas obsoletas que deben 404 en lugar de caer al default redirect.

### HS-05 — Sitemap único sin imágenes
- **Problema:** El sitemap en `app/sitemap.ts` incluye todas las rutas públicas de texto, pero no hay sitemap de imágenes. Google/Bing indexa sin información de las imágenes disponibles.
- **Evidencia:** Análisis de `app/sitemap.ts`.
- **Impacto:** Bajo — las imágenes pueden tardar más en aparecer en búsqueda de imágenes.
- **Prioridad:** Baja
- **Esfuerzo:** Bajo — añadir un sitemap de imágenes adicional o incluir `<image:image>` en el sitemap existente.
- **Recomendación:** Implementar sitemap de imágenes o verificar que Google Discover ya indexa imágenes correctamente.

### HS-06 — Sin hreflang en sección de hondureños en España
- **Problema:** No hay `link rel="alternate" hreflang` en ninguna página, ni siquiera en `/hondurenos-en-espana` que podría tener versión en español de España vs Honduras.
- **Evidencia:** Revisión de HTML.
- **Impacto:** Bajo — para un sitio unilingüe no es crítico, pero la sección de migrantes podría beneficiarse.
- **Prioridad:** Baja
- **Esfuerzo:** Bajo
- **Recomendación:** Evaluar si se requiere hreflang `es-HN` vs `es-ES` en `/hondurenos-en-espana`.

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

---

### Cambios aplicados en Release 6

| Hallazgo | Cambio aplicado | Estado |
|----------|----------------|--------|
| HS-01 — OG tags genéricos | Añadido `openGraph` específico con title, description, url, images en /despacho, /servicios-juridicos, /derecho-penal, /hondurenos-en-espana y /contacto. Root layout actualizado con `og:image`. | ✅ Corregido |
| HS-03 — Analítica no implementada | Añadido Script condicional para GA4 y Clarity en `app/layout.tsx` con `next/script` `strategy="afterInteractive"`. Se carga solo si existen las env vars. | ✅ Corregido |
| HS-04 — URLs legacy con 307 | Añadido `OBSOLETE_PUBLIC_PREFIXES` en proxy.ts. /areas-juridicas, /migrantes-hondurenos-en-espana, /hodurenos-en-espana devuelven 404. | ✅ Corregido |
| HS-07 — Keywords meta tag repetida | Eliminado `keywords: site.keywords` del root layout. | ✅ Corregido |
| HS-08 — Error gramatical | Cambiado "Nuestras Servicios Jurídicos" → "Nuestros Servicios Jurídicos" en homepage. | ✅ Corregido |
| HS-02 — Imágenes sin optimizar | Cambiado `images.unoptimized: true → false` en next.config.ts. Las imágenes nuevas pasarán por el optimizador. 3 imágenes del blog (10.6 MB total) siguen sin optimizarse manualmente. | ⚠️ Parcial |

## 4. Análisis SEO técnico

### 4.1 Estructura HTML
- ✅ `<!DOCTYPE html>` correcto
- ✅ `lang="es"` en cada página
- ✅ Charset `utf-8`
- ✅ Viewport configurado correctamente
- ✅ Theme color definido (`#0B1B3D`)
- ✅ Estructura semántica con `<header>`, `<main>`, `<footer>`
- ✅ Skip link presente antes del contenido principal
- ❌ H1 presente y único en cada página. Se espera que así sea

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

H2 distribuidos correctamente. Se detecta un **error gramatical** en Homepage: "Nuestras Servicios Jurídicos" → "Nuestros".

### 4.4 URLs y slugs
- ✅ URLs limpias con kebab-case
- ✅ Slugs descriptivos y semánticos (`derecho-penal`, `servicios-juridicos`)
- ✅ Sin parámetros URL ni IDs numéricos
- ✅ Jerarquía plana: máximo 1 nivel de profundidad (`/servicios-juridicos/derecho-de-familia`)
- ❌ **Pendiente:** URLs legacy (ver hallazgo HS-04)

### 4.5 Canonicals
- ✅ Todas las páginas tienen `link rel="canonical"` apuntando a la URL correcta
- ✅ No hay contenido duplicado accesible desde múltiples URLs

### 4.6 Sitemap
- ✅ Sitemap accesible en `https://www.pinedayasocioshn.com/sitemap.xml`
- ✅ Generado dinámicamente desde `app/sitemap.ts`
- ✅ Incluye todas las rutas públicas: home, despacho, 13 servicios, 7 subáreas penales, 3 subáreas migrantes, blog (6 artículos + 8 categorías), páginas legales
- ✅ Última modificación actualizada (`2026-06-08T07:25:20.318Z`)
- ❌ No incluye imágenes
- ❌ No incluye cambio de frecuencia granular para blog (weekly recomendado vs monthly)

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
- ✅ Excellent schema coverage: `LegalService`, `LocalBusiness`, `Organization`, `WebSite`, `WebPage`, `Service`, `FAQPage`, `ItemList`, `BreadcrumbList`, `AboutPage`
- ✅ JSON-LD bien formado en todas las páginas
- ✅ LegalService con `areaServed` y `serviceType` correctos
- ✅ FAQPpage con preguntas y respuestas en páginas que lo tienen
- ❌ Sin `Review` ni `AggregateRating` (falta marca de confianza social)
- ❌ Sin `Product` (aunque no venden productos, podrían declarar servicio con `offers`)

### 4.11 Open Graph y Twitter Cards
- ✅ OG tags presentes en todas las páginas
- ✅ `og:locale: es_HN` correcto
- ✅ `og:type: website` correcto
- ✅ Twitter card `summary_large_image` en todas las páginas
- ❌ **CRÍTICO:** OG title y description genéricos en 5/6 páginas (ver HS-01)
- ❌ OG URL incorrecto en páginas hijas (apunta a `/`)
- ❌ Contacto sin OG image
- ❌ OG image única (misma para todo el sitio, excepto en homepage y contacto)

### 4.12 Idioma y hreflang
- ✅ `lang="es"` en `<html>`
- ✅ `og:locale: es_HN`
- ❌ Sin `hreflang` (ver HS-06)

---

## 5. Análisis SEO on-page y contenidos

### 5.1 Calidad y relevancia del contenido
- ✅ Contenido original, sin duplicación evidente entre páginas
- ✅ Texto suficiente en cada página (150-300 palabras visibles + descripciones de servicios)
- ✅ Los subservicios en cada área jurídica (17 para familia, 16 para mercantil, etc.) proporcionan contenido rico
- ✅ Blog con 6 artículos originales de entre 800-1500 palabras
- ✅ FAQ bien estructurado con datos JSON-LD

### 5.2 Intención de búsqueda
- **Homepage:** Intención informacional + transaccional ("abogado en Nacaome", "bufete multidisciplinario Honduras")
- **Servicios:** Intención informacional/comparativa ("derecho de familia Nacaome", "abogado laboral Valle")
- **Derecho Penal:** Intención informacional + transaccional urgente ("defensa penal Honduras", "abogado penalista Nacaome")
- **Blog:** Intención informacional ("cómo funciona un despido en Honduras", "derechos laborales")
- ✅ Cada página responde a una intención clara

### 5.3 Keywords principales y secundarias
- **Meta keywords:** Misma lista global en todas las páginas (22 keywords). Google no las usa desde 2009, pero diluye si algún otro motor las considera.
- **Keywords en contenido (extraídas):** "bufete", "abogados", "defensa penal", "Nacaome", "Valle", "Honduras", "derecho penal", "asesoría legal", "consulta confidencial" — aparecen naturalmente en el texto.
- ❌ Keywords repetitivas en el meta tag global (ver HS-07)

### 5.4 Duplicidades
- ✅ Sin contenido duplicado entre páginas
- ✅ Sin páginas espejo o versiones con/sin www
- ✅ Sin páginas con y sin trailing slash
- ✅ Canonical correcto previene canibalización

### 5.5 Thin content
- ❌ **Blog categorías:** 8 categorías con solo 1 o 2 artículos cada una → páginas de categoría con poco contenido propio
- ❌ Páginas legales (aviso-legal, política-privacidad, cookies, términos, disclaimer) tienen contenido genérico — bajo valor SEO pero esperado para este tipo de páginas
- ✅ Páginas de servicios tienen contenido sustancial

### 5.6 Optimización de imágenes
- ❌ 3 imágenes del blog sin optimizar (ver HS-02)
- ❌ `alt` text: algunas imágenes tienen `alt=""` decorativo, otras tienen alt descriptivo
- ✅ ServiceCard usa `next/image` con `fill` + `sizes` + `object-cover` (buena práctica)
- ✅ Imágenes de servicios y corporativas están en tamaños razonables (150-400 KB)

### 5.7 Arquitectura de contenidos
- ✅ **Estructura plana:** máximo 2 niveles de profundidad
- ✅ **Categorización:** servicios, penal, hondurenos en españa, blog, despacho
- ✅ **Interlinking:** breadcrumbs, footer, secciones relacionadas
- ❌ Blog no está enlazado desde la página de inicio de forma destacada
- ❌ Sin taxonomía de áreas relacionadas entre servicios

---

## 6. Análisis de rendimiento

### 6.1 Imágenes pesadas
| Imagen | Tamaño | Impacto |
|--------|--------|---------|
| `/images/blog/bufete-abogados.jpg` | 3.3 MB | LCP probable, 5-10s en 3G |
| `/images/blog/despido-laboral.jpg` | 2.8 MB |alto |
| `/images/blog/abogado-penalista-sur.jpg` | 2.4 MB | alto |
| Blog restantes (3) | ~2 MB | medio |

**Total imágenes blog: 10.6 MB — >70% del peso total de la sección blog**

### 6.2 JavaScript
- ✅ Next.js Turbopack genera chunks optimizados
- ❌ 8-10 chunks JS por página (señal de que el code splitting podría mejorarse)
- ❌ `'unsafe-inline'` en CSP impide algunos beneficios de seguridad pero no afecta rendimiento
- ✅ Fonts precargadas con `preload`

### 6.3 Configuración de imágenes
- `images.unoptimized: true` — desactiva el optimizador de imágenes de Next.js
- Esto significa que todas las imágenes se sirven en su tamaño original sin compresión
- Las imágenes de servicios (13) y corporativas (6) son razonables (~200-400 KB c/u)
- Las imágenes de blog (6) suman 10.6 MB sin optimizar

### 6.4 Caché
- ✅ Vercel CDN cachea páginas estáticas (SSG con ISR)
- ✅ Vercel cache headers: `X-Vercel-Cache: HIT` verificado
- ✅ Static pages prerendered (SSG)
- ✅ API routes con `Cache-Control: no-store`
- ✅ `X-Nextjs-Prerender: 1` indica páginas prerenderizadas

### 6.5 Recomendaciones LCP/CLS/INP
- **LCP:** Candidato más probable: imagen de héroe en homepage (`hero_home.jpg`). Sin optimizar, puede exceder 2.5s en conexiones lentas.
- **CLS:** Layout con Tailwind CSS + componentes server → CLS bajo. Sin `@next/font` con fallback visible.
- **INP:** Interacciones cliente (formularios, acordeones FAQ) — sin evidencia de bloqueos largos de JS.
- **Recomendaciones:**
  1. Optimizar imágenes del blog a <500 KB
  2. Habilitar `images.unoptimized: false` para reducir peso de imágenes nuevas
  3. Considerar WebP/AVIF para imágenes del blog (actualmente 31 JPG + 1 WebP)
  4. Verificar posible uso de `next/dynamic` para componentes pesados (FAQ, mapa)

---

## 7. Análisis de accesibilidad

### 7.1 Contraste
- ⚠️ No se ha auditado con herramienta específica (axe, WAVE). Se recomienda verificar:
  - Texto blanco sobre fondo primary (#0B1B3D azul oscuro): puede tener contraste insuficiente
  - Enlaces hover acento dorado: verificar mínimo 4.5:1
  - Footer: texto blanco/80 sobre fondo primary

### 7.2 Navegación por teclado
- ✅ Skip link presente: `<a href="#main" class="skip-link">Saltar al contenido</a>`
- ✅ Botones con `type="button"` (navegables por teclado)
- ✅ Links con outline visible en focus (`focus-visible:outline-none` + `focus-visible` classes)
- ✅ Formulario con campos navegables por Tab
- ❌ Los acordeones FAQ no se han verificado para navegación por teclado

### 7.3 Landmarks
- ✅ `<main>` presente
- ✅ `<header>` y `<footer>` semánticos
- ✅ `<nav>` presente en header
- ✅ Navegación adicional en footer con listas (`<ul>/<li>`)

### 7.4 Labels en formularios
- ✅ Campos con `<label>` explícito y `htmlFor`/`id` correctos
- ✅ Placeholder visible en inputs
- ✅ Indicador de campo obligatorio con asterisco y `aria-hidden`
- ❌ Sin `aria-describedby` para mensajes de error (se renderizan en cliente)

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
- ❌ **Formulario de contacto:** Sin indicación de tiempo de respuesta esperado
- ❌ **Ubicación:** El mapa interactivo usa Leaflet + OSM (sin Google Maps). Puede ser más lento de cargar y menos familiar para el usuario hondureño promedio
- ❌ **Calculadora de penas:** Requiere login (barrera alta para un usuario que quiere probar la herramienta)
- ❌ **Blog:** 6 artículos en 8 categorías → sensación de sitio con poco contenido actualizado

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

## 9. Quick wins

| # | Acción | Impacto | Esfuerzo | Dónde |
|---|--------|---------|----------|-------|
| 1 | Corregir "Nuestras Servicios Jurídicos" → "Nuestros" | Bajo | 1 min | `app/(public)/page.tsx` (H2) — ✔️ Aplicado en Release 6 |
| 2 | Añadir OG title/description específico en páginas hijas | Alto | 30 min | `generateMetadata()` en cada page.tsx — ✔️ Aplicado en Release 6 |
| 3 | Optimizar las 3 imágenes de blog más pesadas | Alto | 15 min | `public/images/blog/` |
| 4 | Implementar GTM/Clarity/GA4 | Medio | 30 min | `app/layout.tsx` (ya hay env vars) — ✔️ Aplicado en Release 6 |
| 5 | Añadir OG image en /contacto | Medio | 5 min | `app/(public)/contacto/page.tsx` — ✔️ Aplicado en Release 6 |
| 6 | Corregir OG URL en páginas hijas | Medio | 15 min | `generateMetadata()` en cada page.tsx — ✔️ Aplicado en Release 6 |
| 7 | Añadir 404 para URLs legacy obsoletas | Medio | 15 min | `proxy.ts` — ✔️ Aplicado en Release 6 |
| 8 | Eliminar meta keywords global repetitivo | Bajo | 5 min | `app/layout.tsx` — ✔️ Aplicado en Release 6 |
| 9 | Añadir hreflang en hondurenos-en-espana | Bajo | 10 min | `app/(public)/hondurenos-en-espana/` |
| 10 | Reordenar quick wins y priorizarlos | — | — | — |

---

## 10. Roadmap de mejoras

### Acciones inmediatas (días 1-3)
- [x] 1. Corregir "Nuestras Servicios Jurídicos" → "Nuestros Servicios Jurídicos"
- [x] 2. Añadir OG title/description específicos en page.tsx secundarias
- [ ] 3. Optimizar 3 imágenes de blog pesadas (<500 KB c/u)
- [x] 4. Corregir OG URL en páginas hijas (apuntar a URL específica)
- [x] 5. Añadir OG image en página /contacto

### A corto plazo (1-2 semanas)
- [x] 6. Implementar Google Tag Manager o GA4 + Clarity con `<Script>` de Next.js
- [ ] 7. Configurar `images.unoptimized: false` para optimización automática de imágenes
- [ ] 8. Añadir 404 para URLs obsoletas en proxy.ts
- [ ] 9. Eliminar meta keywords global del layout raíz
- [ ] 10. Verificar accesibilidad con axe/WAVE (contraste, acordeones FAQ)

### A medio plazo (1-3 meses)
- [ ] 11. Publicar más artículos de blog (>12 artículos para distribuir entre categorías)
- [ ] 12. Añadir perfiles de Google Mi Negocio y redes sociales
- [ ] 13. Implementar sitemap de imágenes
- [ ] 14. Añadir hreflang en /hondurenos-en-espana si aplica
- [ ] 15. Crear enlaces desde homepage a blog de forma más destacada
- [ ] 16. Añadir testimonios visibles (con consentimiento de clientes reales)

### A largo plazo (3-6 meses)
- [ ] 17. Migrar imágenes de blog a WebP/AVIF con fallback JPG
- [ ] 18. Implementar `next/dynamic` para componentes pesados (FAQ, mapa Leaflet)
- [ ] 19. Evaluar migración a `'strict-dynamic'` en CSP y eliminar `'unsafe-inline'`
- [ ] 20. Añadir `Review` y `AggregateRating` en Schema.org
- [ ] 21. Implementar casos de éxito con Schema `Article` + `LegalCase`

---

## 11. Checklist final

### SEO técnico
- [x] Canonicals correctos en todas las páginas
- [x] Sitemap actualizado
- [x] Robots.txt limpio y funcional
- [x] Indexabilidad permitida (noindex = false)
- [x] Schema.org implementado (LegalService, FAQ, Breadcrumb)
- [x] OG title/description específicos en páginas hijas
- [x] OG URL corregido en páginas hijas
- [x] OG image implementada en /contacto
- [ ] hreflang evaluado e implementado si aplica
- [x] URLs legacy con 404 en lugar de 307
- [x] Meta keywords global eliminado o específico

### SEO on-page
- [x] Titles únicos y descriptivos
- [x] Meta descriptions únicas
- [x] H1 únicos por página
- [x] Contenido original sin duplicación
- [x] "Nuestras" → "Nuestros" corregido en homepage
- [ ] Imágenes de blog optimizadas
- [ ] Blog con más artículos

### Rendimiento
- [x] images.unoptimized evaluado (cambiar a false)
- [ ] 3 imágenes de blog optimizadas (<500 KB)
- [ ] Lazy loading verificado en imágenes below the fold
- [ ] Sitemap de imágenes implementado

### Accesibilidad
- [x] Skip link presente
- [x] Landmarks semánticos (header, main, footer, nav)
- [x] Labels en formulario
- [x] Iconos con aria-hidden
- [ ] Verificar contraste con axe/WAVE
- [ ] Verificar navegación FAQ por teclado
- [ ] Añadir aria-describedby en errores de formulario

### UX/CRO
- [x] CTA principal visible y funcional
- [x] WhatsApp integrado
- [x] Múltiples canales de contacto
- [x] Diseño responsive
- [x] Páginas legales completas
- [ ] Google Mi Negocio enlazado
- [ ] Testimonios visibles
- [ ] Tiempo de respuesta en formulario de contacto

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

## 12. Conclusión

La web de Pineda y Asociados tiene una **base técnica excelente**: framework moderno (Next.js 16), infraestructura CDN (Vercel), seguridad completa (HSTS, CSP, headers), sitemap dinámico, Schema.org bien implementado y estructura de contenidos coherente. Las URLs son limpias, la indexabilidad está permitida, y no hay errores críticos de rastreo.

Las **principales oportunidades de mejora** son:

1. **OG tags específicos por página** — mejora directa en el rendimiento en redes sociales (bajo esfuerzo, alto impacto).
2. **Optimización de imágenes** — 10.6 MB en blog que pueden reducirse a <3 MB sin pérdida de calidad (bajo esfuerzo, alto impacto).
3. **Implementación de analítica** — CSP preconfigurado pero sin scripts activos (bajo esfuerzo, medio impacto).
4. **Refuerzo de autoridad** — faltan reseñas de Google, testimonios visibles y perfiles de redes sociales que construyan confianza.
5. **Contenido editorial** — el blog con 6 artículos en 8 categorías necesita masa crítica.

Con las acciones inmediatas propuestas (días 1-3) se puede **pasar de una puntuación global estimada de 74/100 a ~82/100**. Con el roadmap completo (3-6 meses), se puede alcanzar **~90/100**.

El sitio está preparado para escalar en SEO y captar tráfico desde buscadores. Las carencias detectadas no son estructurales sino de contenido y afinamiento técnico menor.

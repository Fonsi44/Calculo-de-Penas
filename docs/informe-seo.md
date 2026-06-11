# Informe SEO

**Proyecto:** Pineda y Asociados — Bufete jurídico (Next.js 16.2.7 + React 19)  
**URL canónica:** `https://www.pinedayasociadoshn.com`  
**Dominio de despliegue:** `calculo-de-penas-nextjs.vercel.app` (preview)  
**Fecha de auditoría:** 2026-06-10  
**Última actualización:** 2026-06-10 (Iteración 3 — correcciones IMP-1, IMP-6, IMP-7, IMP-8)  
**Alcance:** Auditoría técnica, on-page, contenido, rendimiento y accesibilidad desde el código fuente.

---

## Estado de correcciones

| ID | Descripción | Estado |
|----|------------|--------|
| CRIT-1 | `manifest.json` incorrecto | ✅ Corregido (Iter 1) |
| CRIT-2 | Imágenes sin optimizar | ✅ Corregido (Iter 1) |
| IMP-1 | Metadatos duplicados entre layouts | ✅ Parcial — `metadataBase` agregado a root layout. Consolidación completa diferida por riesgo. |
| IMP-2 | Sin `hreflang` | ✅ Corregido (Iter 2) |
| IMP-3 | `lang="es"` en HTML | ✅ Corregido (Iter 2) |
| IMP-4 | Títulos genéricos | ✅ Corregido (Iter 2) |
| IMP-5 | Robots en 404 | ✅ Corregido (Iter 2) |
| IMP-6 | Paginación blog sin `rel=prev/next` | ✅ Corregido — `<link rel="prev/next">` en blog hub y categorías |
| IMP-7 | OG images relativas vs absolutas | ✅ Corregido — todas las URLs OG son ahora absolutas en public layout |
| IMP-8 | RSS feed no verificado | ✅ Verificado — `app/(public)/blog/feed.xml/route.ts` genera RSS 2.0 válido |

---

## 1. Resumen ejecutivo

El proyecto presenta una base SEO técnica **sólida y profesional**. La configuración de metadatos (Next.js Metadata API), JSON-LD, sitemap dinámico, robots.txt, CSP, headers HTTP de seguridad e indexabilidad, y la infraestructura de IndexNow están implementadas correctamente y con atención al detalle. La arquitectura de rutas, enlaces internos y la estructura de contenido del blog están bien diseñadas para SEO.

Se detectan **2 problemas críticos** y **8 problemas importantes** que requieren corrección. El resto son mejoras incrementales que elevarían la puntuación global pero no bloquean la indexabilidad.

**Puntuación global estimada:** 78/100

---

## 2. Puntuación global estimada

| Dimensión | Puntaje | Peso | Ponderado |
|-----------|---------|------|-----------|
| Técnica SEO (metadatos, indexabilidad, rastreo) | 82/100 | 30% | 24.6 |
| SEO On-page (headings, enlaces, semántica) | 78/100 | 25% | 19.5 |
| Contenido (calidad, duplicidad, intención) | 72/100 | 15% | 10.8 |
| Rendimiento (Core Web Vitals, carga) | 70/100 | 15% | 10.5 |
| Accesibilidad relacionada con SEO | 85/100 | 10% | 8.5 |
| Seguridad y configuración general | 88/100 | 5% | 4.4 |
| **TOTAL** | | | **78.3** |

**Motivo:** La puntuación refleja una implementación técnica muy cuidada (JSON-LD, sitemap, robots, CSP, headers) pero penalizada por la falta de optimización de imágenes (`images.unoptimized: true`), inconsistencia de metadatos entre layouts, y ausencia de hreflang para español de Honduras. El contenido del blog es sólido pero las páginas de servicio necesitan más profundidad.

---

## 3. Hallazgos críticos

### CRIT-1: `manifest.json` con datos incorrectos (PWA inconsistente)
**Archivo:** `public/manifest.json`  
**Problema:** El `name` es `"LEX HONDURAS"` y el `short_name` es `"LEX"`. La `description` dice `"Motor jurídico de cálculo de penas"`. Estos valores no corresponden al sitio público `"Pineda y Asociados"`. El `theme_color: "#1A2B4A"` no coincide con el `themeColor: "#0B1B3D"` del layout.
```json
// ACTUAL (incorrecto)
"name": "LEX HONDURAS",
"short_name": "LEX",
"description": "Motor jurídico de cálculo de penas — Código Penal de Honduras (Decreto 130-2017)"
```
**Impacto:** Si un usuario instala la PWA, verá "LEX HONDURAS" en lugar del nombre real del bufete. Google puede indexar este nombre como `alternateName`. La descripción habla de un "motor de cálculo de penas" que no es el propósito del sitio público.
**Solución:** Sincronizar con `site.name` y `site.description` desde `lib/site.ts`.

### CRIT-2: Imágenes no optimizadas (`images.unoptimized: true`)
**Archivo:** `next.config.ts:54-56`  
**Problema:** Todas las imágenes se sirven sin optimización (sin redimensionado, sin conversión a WebP/AVIF, sin srcset responsivo). Esto afecta directamente a **LCP (Largest Contentful Paint)** y al ancho de banda del usuario, especialmente en dispositivos móviles con conexiones lentas (común en Honduras).
```typescript
images: {
  unoptimized: true,
},
```
**Impacto:** Las 13 imágenes JPG de servicios y 7 de penal se sirven en su tamaño original. Las 74 imágenes de blog son WebP (bueno) pero también sin redimensionado responsivo. Core Web Vitals penalizados, especialmente en móviles 3G/4G.
**Solución:** Cambiar a `unoptimized: false` o configurar `remotePatterns` + `deviceSizes`/`imageSizes`. Si el motivo es evitar latencia del optimizador, usar `sharp` con `next/image` en lugar de servir imágenes crudas.

---

## 4. Hallazgos importantes

### IMP-1: Metadatos duplicados entre root layout y public layout
**Archivos:** `app/layout.tsx:34-74` y `app/(public)/layout.tsx:9-80`  
**Estado:** ✅ Corregido parcialmente.  
**Corrección aplicada:** `metadataBase: new URL(site.url)` agregado al root layout (`app/layout.tsx:35`). Esto garantiza que todas las URLs relativas en metadatos (OG, canonical, alternates) se resuelvan correctamente desde el nivel raíz. La consolidación completa (mover OG del root al public layout) se difiere por riesgo de afectar rutas heredadas. El comportamiento actual es funcionalmente correcto: el public layout sobrescribe `title`, `robots`, `openGraph`, `twitter` y `alternates.canonical` para páginas públicas; las rutas de intranet heredan solo del root (sin OG, sin canonical público).

### IMP-2: Sin etiquetas `hreflang`
**Archivos:** Revisado todo el proyecto — sin resultados.  
**Problema:** El sitio está en español de Honduras (`es-HN`). No hay etiquetas `<link rel="alternate" hreflang="es-HN">` ni `x-default`. Aunque el contenido es monolingüe, Google recomienda declarar explícitamente el idioma para evitar confusiones con `es-ES`, `es-MX`, etc.
**Solución:** Agregar en el root layout:
```tsx
<link rel="alternate" href="https://www.pinedayasociadoshn.com" hreflang="es-HN" />
<link rel="alternate" href="https://www.pinedayasociadoshn.com" hreflang="x-default" />
```

### IMP-3: `lang="es"` en HTML debería ser `lang="es-HN"`
**Archivo:** `app/layout.tsx:80`  
**Problema:** `<html lang="es">` es correcto pero impreciso. Los datos estructurados usan `"inLanguage": "es-HN"`. Esta inconsistencia puede confundir a motores de búsqueda sobre la variante regional.
**Solución:** Cambiar a `<html lang="es-HN">`.

### IMP-4: Títulos de página inconsistentes (sin localización/empresa)
**Archivos:** Varias páginas.  
**Problema:** Algunas páginas tienen títulos genéricos:
| Página | Título actual | Sugerido |
|--------|--------------|----------|
| FAQ | `Preguntas Frecuentes` | `Preguntas Frecuentes — Abogados en Nacaome, Valle` |
| Contacto | `Solicitar consulta` | `Solicitar Consulta Legal — Pineda y Asociados` |
| Cómo llegar | `Cómo llegar al bufete` | `Cómo Llegar al Bufete en Nacaome, Valle` |
| 404 | `Página no encontrada` | Correcto (página de error) |
**Impacto:** Menor CTR en SERP y menor relevancia geolocalizada.

### IMP-5: 404 con `follow: true` en meta robots
**Archivo:** `app/not-found.tsx:9`  
**Problema:** `robots: { index: false, follow: true }`. Las páginas de error 404 no deben tener `follow` porque los enlaces internos de páginas inexistentes no deben seguirse.
**Solución:** Cambiar a `robots: { index: false, follow: false }`.

### IMP-6: Sin `<link rel="prev/next">` en paginación del blog
**Archivos:** `app/(public)/blog/page.tsx:56-57`, `app/(public)/blog/[categoria]/page.tsx:55-56`  
**Estado:** ✅ Corregido.  
**Corrección aplicada:** Se agregaron etiquetas `<link rel="prev">` y `<link rel="next">` en el renderizado de ambos componentes de paginación. Las URLs usan `site.url + buildPageUrl()` para generar enlaces absolutos. En el blog hub, los enlaces se omiten cuando hay filtro de tags activo (páginas `noindex`). Las etiquetas `<link>` se renderizan antes del contenido y Next.js las eleva automáticamente al `<head>`.

### IMP-7: OpenGraph images con URLs inconsistentes (relativas vs absolutas)
**Archivos:** `app/(public)/layout.tsx:32,43`  
**Estado:** ✅ Corregido.  
**Corrección aplicada:** Las dos referencias relativas (`url: '/og-image.png'` en OG images y `images: ['/og-image.png']` en Twitter card) se cambiaron a URLs absolutas (`${site.url}/og-image.png`), consistentes con el resto del proyecto (root layout, despacho, derecho-penal, servicios-juridicos, hondurenos-en-espana). El `metadataBase` existente en el public layout ya resolvía las URLs relativas, pero la unificación elimina la dependencia y la inconsistencia.

### IMP-8: RSS feed referenciado pero no verificado desde código
**Archivo:** `app/(public)/blog/feed.xml/route.ts`  
**Estado:** ✅ Verificado.  
**El feed existe y funciona:** Ruta `GET /blog/feed.xml` genera RSS 2.0 con namespaces `content`, `dc` y `atom`. Incluye los últimos 30 posts con `title`, `description`, `link`, `guid`, `pubDate` (RFC 822) y `category`. El canal incluye `atom:link self`, `language: es-hn`, `lastBuildDate` e `image`. Headers de caché: `s-maxage=3600, stale-while-revalidate`.

---

## 5. Mejoras recomendadas (por impacto)

1. **Optimizar imágenes (CRIT-2):** ✅ Corregido — `images.unoptimized: true` → WebP + deviceSizes.
2. **Corregir manifest.json (CRIT-1):** ✅ Corregido — sincronizado con `lib/site.ts`.
3. **Agregar hreflang (IMP-2):** ✅ Corregido — `es-HN` + `x-default` en `<head>`.
4. **Corregir `lang="es-HN"` en HTML (IMP-3):** ✅ Corregido.
5. **Consolidar metadatos de layouts (IMP-1):** ✅ Parcial — `metadataBase` agregado al root layout.
6. **Corregir títulos de página (IMP-4):** ✅ Corregido — FAQ, Contacto, Cómo llegar actualizados.
7. **Corregir robots en 404 (IMP-5):** ✅ Corregido — `follow: true` → `follow: false`.
8. **Agregar rel=prev/next en paginación del blog (IMP-6):** ✅ Corregido.
9. **Unificar URLs OG a absolutas (IMP-7):** ✅ Corregido.
10. **Verificar y documentar el RSS feed (IMP-8):** ✅ Verificado — feed.xml funcional.

---

## 6. Auditoría técnica SEO

### 6.1 Metadatos globales

| Elemento | Estado | Detalle |
|----------|--------|---------|
| `<title>` | Correcto | Template: `%s · Pineda y Asociados` |
| `<meta description>` | Correcto | Descripción de 150-160 caracteres |
| `<meta keywords>` | Mejorable | Presente pero Google no lo usa para ranking |
| `<meta robots>` | Correcto | `index, follow, max-image-preview:large, max-snippet:-1` en prod |
| `<meta viewport>` | No encontrado | Solo en root layout, no exportado explícitamente |
| `<meta theme-color>` | Correcto | `#0B1B3D` |
| `<meta author>` | Correcto | `Pineda y Asociados` |
| `<link rel="canonical">` | Correcto | Configurado vía `metadata.alternates.canonical` |
| `<html lang>` | Mejorable | `es` debería ser `es-HN` |
| `hreflang` | **Crítico** | No implementado |
| Favicon | Correcto | `/favicon.ico` + `/icon-192.svg` |
| Apple Touch Icon | Correcto | `/icon-192.svg` |
| Web manifest | **Crítico** | Datos incorrectos (LEX HONDURAS en vez de Pineda y Asociados) |

### 6.2 Indexabilidad y rastreo

| Elemento | Estado | Detalle |
|----------|--------|---------|
| `robots.txt` | Correcto | Dinámico vía `app/robots.ts`. Producción: allow `/`, disallow `/intranet/`, `/api/`, `/_next/`. |
| `sitemap.xml` | Correcto | Dinámico vía `app/sitemap.ts`. 38+ rutas estáticas + blog posts + categorías. |
| `X-Robots-Tag` | Correcto | Header HTTP con `index, follow` en prod. `noindex` para staging y rutas intranet. |
| `meta robots` | Correcto | Coincide con `X-Robots-Tag` y `robots.txt`. |
| Noindex en staging | Correcto | Controlado por `NEXT_PUBLIC_NOINDEX=true`. |
| IndexNow | Correcto | Script `scripts/submit-indexnow.mjs` + `postbuild`. Clave en `.well-known/`. |
| BingSiteAuth | Correcto | `BingSiteAuth.xml` presente. |
| Google Search Console | Parcial | Token de verificación referenciado en metadata pero depende de `NEXT_PUBLIC_GOOGLE_VERIFICATION`. |
| `noindex` en intranet | Correcto | Header `X-Robots-Tag: noindex, nofollow, noarchive`. |
| Bloqueo de IA bots | Correcto | 18 bots bloqueados en `robots.txt` (GPTBot, ClaudeBot, PerplexityBot, etc.). |

### 6.3 Sitemap (detalle)

**Archivo:** `app/sitemap.ts`

| Aspecto | Evaluación |
|---------|-----------|
| Rutas estáticas | 36 rutas públicas mapeadas con prioridad y changeFrequency |
| Blog posts | Cada post incluido con `lastModified` real de `publishedAt` |
| Categorías blog | Cada categoría incluida |
| Prioridades | Bien diferenciadas: home 1.0, consulta 0.95, servicios 0.8-0.9, legales 0.2 |
| changeFrequency | Correcto: `weekly` para blog/home, `monthly` para servicios, `yearly` para legales |
| Fechas estáticas | Usa `STATIC_REF_DATE` fija para evitar recrawleo innecesario |
| Modo noindex | Sitemap vacío (correcto) |
| URLs absolutas | Sí, vía `absoluteUrl()` |

### 6.4 Canonical y duplicados

| Elemento | Estado |
|----------|--------|
| Canónicas en todas las páginas | Correcto — cada página tiene `alternates.canonical` |
| Parámetros de query | Blog paginado usa `?page=N` con canonical a la URL con page. Tags usan `noindex` (correcto para thin content). |
| www vs apex | Gestionado por Vercel a nivel dominio (redirección). |
| Redirecciones legacy | Correcto: `/home→/`, `/areas-de-practica→/servicios-juridicos`, etc. |
| Rewrites intranet | Correcto: `/intranet/calculadora→/calculadora` con `noindex` en header. |
| Rutas obsoletas | Devuelven 404 (no redirigen al login). Correcto. |

### 6.5 Datos estructurados (Schema.org / JSON-LD)

| Schema | Ubicación | Estado |
|--------|-----------|--------|
| `LegalService` + `LocalBusiness` | `app/(public)/layout.tsx` (global en páginas públicas) | Correcto: address, geo, openingHours, areaServed, knowsAbout, sameAs |
| `Organization` | `app/(public)/layout.tsx` (global en páginas públicas) | Correcto: logo, contactPoint, address |
| `WebSite` | `app/(public)/layout.tsx` (global en páginas públicas) | Correcto: inLanguage, publisher. SearchAction comentado (OK, no hay /buscar). |
| `Service` | `lib/schemas/legal-page.ts` → páginas de área | Correcto: provider, areaServed, keywords, inLanguage |
| `FAQPage` | Home (`app/(public)/page.tsx`) y páginas de área | Correcto: Question + Answer con mainEntity |
| `WebPage` | Home (`app/(public)/page.tsx`) | Correcto |
| `BreadcrumbList` | `lib/schemas/legal-page.ts` → páginas de área | Correcto |
| `ItemList` | `lib/schemas/legal-page.ts` → página de servicios | Correcto |
| `BlogPosting` | `lib/schemas/blog.ts` → posts individuales | Correcto: headline, datePublished, dateModified, author, publisher, mainEntityOfPage |
| `CollectionPage` | `lib/schemas/blog.ts` → blog hub y categorías | Correcto |

**Evaluación global de datos estructurados:** Excelente. Cobertura completa de schemas relevantes para un bufete jurídico. La propiedad `@id` permite interconectar entidades. `sameAs` se omite condicionalmente si no hay redes sociales (correcto).

**Pendiente:** `hasMap` en `LocalBusiness` (vincular al mapa de la página `/como-llegar` o a Google Maps).

### 6.6 Configuración técnica general

| Elemento | Estado | Detalle |
|----------|--------|---------|
| CSP | Correcto | Política completa con fuentes específicas para GTM, GA, Clarity, OpenStreetMap |
| HSTS | Correcto | `max-age=63072000; includeSubDomains; preload` en producción |
| X-Frame-Options | Correcto | `DENY` |
| X-Content-Type-Options | Correcto | `nosniff` |
| Referrer-Policy | Correcto | `strict-origin-when-cross-origin` |
| Permissions-Policy | Correcto | camera, microphone, geolocation restringidos |
| X-DNS-Prefetch-Control | Correcto | `on` |
| `poweredByHeader` | Correcto | `false` (elimina X-Powered-By) |
| HTTPS | Correcto | Gestionado por Vercel |
| Mixed content | Correcto | CSP `img-src https:` permite solo imágenes HTTPS |
| `preconnect` a Google Fonts | Correcto | En `<head>` del root layout |
| `dns-prefetch` a Google Fonts | Correcto | En `<head>` del root layout |
| Google Analytics (GA4) | Correcto | Condicional (`NEXT_PUBLIC_GA_ID`), `afterInteractive` |
| Microsoft Clarity | Correcto | Condicional (`NEXT_PUBLIC_CLARITY_ID`), `afterInteractive` |
| Vercel Speed Insights | Correcto | Componente `<SpeedInsights />` presente |

---

## 7. Auditoría SEO on-page

### 7.1 Jerarquía de headings

| Página | H1 | H2 | H3 | Evaluación |
|--------|----|----|-----|------------|
| **Home** (`/`) | "Defensa penal y asesoría jurídica en Nacaome y todo Honduras" | ~8 H2 (secciones) | ~15 H3 (tarjetas, FAQ) | Correcta: H1 único, jerarquía coherente |
| **Servicios** (`/servicios-juridicos`) | "Todos los servicios jurídicos..." | "Cobertura legal completa en Honduras" | ~13 H3 (ServiceCard titles) | Correcta |
| **Derecho Penal** (`/derecho-penal`) | Vía PageHero (dinámico) | "Grupos especializados", "Resolvemos sus dudas..." | H3 de FAQ y blog | Correcta |
| **Blog post** (`/blog/:cat/:slug`) | Título del artículo | ~2 H2 (relacionados, consulta) | H3 en TOC y contenido | Correcta: H1 único = post title |
| **Servicio individual** (`/servicios-juridicos/:slug`) | Nombre del área | 4-5 H2 (servicios, FAQ, relacionados) | H3 en cards y FAQ | Correcta |
| **Páginas legales** (aviso-legal, etc.) | Título de la página | Secciones de contenido | Sub-secciones | Correcta |

**Evaluación:** La jerarquía de headings es correcta en todas las páginas públicas. No se detectaron H1 duplicados ni saltos de nivel. Los H1 son descriptivos y contienen keywords relevantes.

**Nota:** El componente `PageHero` renderiza un `<h1>` internamente (`page-hero.tsx:90`). Esto es correcto siempre que se use una sola vez por página.

### 7.2 Enlaces internos

| Aspecto | Evaluación |
|---------|-----------|
| Navegación principal | 7 enlaces bien definidos (Despacho, Servicios, Penal, Honduras-España, FAQ, Blog, Contacto) |
| Footer | Enlaces a 13 servicios, 5 páginas de despacho, 5 páginas legales |
| Enlaces contextuales | Abundantes en blog posts, páginas de servicio (servicios relacionados) |
| CTA (consultas) | Presente en cada página (WhatsApp, teléfono, formulario) |
| Breadcrumbs | En blog, blog categorías, blog posts y página de solicitar consulta |
| Navegación entre posts | Artículo anterior/siguiente en blog posts |
| Artículos relacionados | Sistema de scoring por categoría y tags en blog posts |
| **Enlaces rotos** | No verificable desde código (requiere crawler en producción) |

### 7.3 Imágenes

| Aspecto | Evaluación |
|---------|-----------|
| `alt` en imágenes | Correcto: ServiceCard usa `alt={label ?? title}`, BlogCard usa `alt={post.title}` |
| `next/image` con `fill` | Correcto en ServiceCard y BlogCard |
| `priority` en LCP | Correcto: imagen de portada del blog tiene `priority` |
| `sizes` responsivo | Correcto: ServiceCard usa `(min-width: 1024px) 33vw...` |
| Formatos | **Mejorable:** 26 imágenes JPG (services/penal/corporate). 74 imágenes blog en WebP (correcto). |
| Dimensiones | **Mejorable:** Imágenes no redimensionadas en build (`unoptimized: true`). |
| Lazy loading | Nativo de `next/image` (correcto) |
| Imagen OG | `/og-image.png` (1200×630). Genérica para todas las páginas. **Mejorable:** crear OG images específicas por página. |

### 7.4 Semántica HTML

| Elemento | Evaluación |
|----------|-----------|
| `<header>` | Correcto en `PublicHeader` + `<header>` semántico |
| `<nav>` | Correcto: `aria-label="Navegación principal"`, `aria-label="Navegación móvil"` |
| `<main>` | Correcto: `id="main"` para skip-link |
| `<footer>` | Correcto en `PublicFooter` |
| `<article>` | Correcto en blog posts |
| `<section>` | Correcto, con `ariaLabel` en componentes `Section` |
| `<time>` | Correcto en blog posts (`dateTime={post.publishedAt}`) |
| `<details>` / `<summary>` | Correcto en FAQ de home |
| Skip link | Correcto: `<a href="#main" class="skip-link">Saltar al contenido</a>` |

---

## 8. Auditoría de contenido

### 8.1 Evaluación general

| Dimensión | Evaluación |
|-----------|-----------|
| **Intención de búsqueda** | Correcta. Home cubre búsquedas de "abogado Nacaome", páginas de servicio cubren "[área] Honduras", blog cubre consultas informacionales. |
| **Profundidad** | Páginas de servicio: adecuadas (descripción + subservicios + FAQ + blog posts relacionados). Blog: artículos extensos con TOC. |
| **Originalidad** | Contenido del blog es original (escrito por el equipo). Páginas de servicio generadas desde catálogos de datos. |
| **Thin content** | Páginas legales (aviso-legal, política-privacidad, términos, disclaimer, política-cookies) tienen contenido mínimo generado. Riesgo de thin content si no se expanden con información sustancial. |
| **Duplicados** | Riesgo bajo. Cada página tiene canonical. Blog con tags tiene `noindex`. Intranet bloqueada. |

### 8.2 Canibalización potencial

| Riesgo | Evaluación |
|--------|-----------|
| `/derecho-penal` vs `/servicios-juridicos/derecho-penal` | No existe la ruta `/servicios-juridicos/derecho-penal`. Penal tiene hub propio. **Sin riesgo.** |
| Páginas de área similares | Cada área jurídica cubre temas distintos. Palabras clave diferenciadas. **Riesgo bajo.** |
| Blog vs páginas de servicio | Blog cubre contenido informacional, páginas de servicio cubren intención comercial. Diferenciación clara. **Riesgo bajo.** |

### 8.3 Metadescripciones

| Estado | Cantidad |
|--------|----------|
| Correctas (130-160 caracteres) | ~90% de las páginas |
| Genéricas (sin localización) | Páginas legales, FAQ, Solicitar consulta |
| Duplicadas | No detectado |

### 8.4 Blog

| Aspecto | Evaluación |
|---------|-----------|
| Categorías | 11 categorías bien definidas |
| Posts | Sistema MDX con frontmatter (title, description, author, tags, publishedAt, updatedAt, coverImage, readingTime) |
| TOC (Table of Contents) | Componente BlogTOC en cada post — bueno para UX y fragmentos enriquecidos |
| Compartir en redes | ShareButtons (Twitter/X, Facebook, WhatsApp, LinkedIn) en cada post |
| Newsletter | Sección NewsletterSection en blog hub |
| RSS | Referenciado en `alternates.types` del layout — **no verificado si existe** |
| Imágenes de portada | WebP con `next/image` y `priority` |
| Etiquetas (tags) | Soporte de filtrado por tag con `noindex` para evitar thin content |
| Paginación | 12 posts por página con navegación UI |

---

## 9. Auditoría de rendimiento

### 9.1 Core Web Vitals — estimación desde código

| Métrica | Estimación | Riesgo |
|---------|------------|--------|
| **LCP** (Largest Contentful Paint) | ⚠️ Medio-Alto | Imágenes sin optimizar (`unoptimized: true`). Hero sin imagen de fondo (usa gradientes CSS). La imagen de portada del blog es la más pesada. |
| **FID** (First Input Delay) | ✅ Bajo | React 19 + pocos JS pesados. GA y Clarity cargan `afterInteractive`. |
| **CLS** (Cumulative Layout Shift) | ✅ Bajo | Tailwind, fuentes con `display:swap`, imágenes con `fill` y relación de aspecto fija. |
| **TTFB** (Time to First Byte) | ✅ Bajo | Vercel edge + Next.js SSR/SSG. API routes con caché `no-store`. |

### 9.2 Recursos

| Recurso | Detalle | Evaluación |
|---------|---------|-----------|
| **JavaScript** | Next.js bundle (~100-150KB gzip estimado). React 19. Sin jQuery ni librerías legacy. | Correcto |
| **CSS** | Tailwind v4 con PostCSS. ~30-50KB gzip estimado con purging. | Correcto |
| **Fuentes** | 2 Google Fonts (Cormorant Garamond + Manrope) con `display:swap`. Preconnect y dns-prefetch configurados. | Correcto |
| **Imágenes** | 26 JPG (50-500KB c/u). 74 WebP blog (30-200KB c/u). Sin redimensionado. | ⚠️ Mejorable |
| **Terceros** | GA4 (condicional), Clarity (condicional), OpenStreetMap tiles (en /como-llegar). Leaflet (49KB gzip). | Correcto |

### 9.3 Imágenes — análisis detallado

| Categoría | Cantidad | Formato | Tamaño estimado | Optimización |
|-----------|----------|---------|-----------------|--------------|
| Corporate | 6 | JPG | 100-500KB c/u | Sin WebP, sin responsive |
| Services | 13 | JPG | 100-400KB c/u | Sin WebP, sin responsive |
| Penal | 7 | JPG | 100-400KB c/u | Sin WebP, sin responsive |
| Blog | 74 | WebP | 30-200KB c/u | WebP (correcto), sin responsive |

**Recomendación prioritaria:** Convertir las 26 imágenes JPG a WebP (reducción 30-50%) y generar tamaños responsive (640w, 1024w, 1440w). Con `next/image` esto es automático si `unoptimized: false`.

### 9.4 Lighthouse estimado (basado en configuración)

| Categoría | Puntaje estimado |
|-----------|-----------------|
| Performance | 65-75 (lastrado por imágenes) |
| Accessibility | 85-95 |
| Best Practices | 90-100 |
| SEO | 85-95 |

---

## 10. Auditoría de accesibilidad relacionada con SEO

### 10.1 Elementos evaluados

| Elemento | Estado | Detalle |
|----------|--------|---------|
| Skip link | ✅ Correcto | `Saltar al contenido` apuntando a `#main` |
| Landmarks | ✅ Correcto | `<header>`, `<nav>`, `<main>`, `<footer>` semánticos |
| ARIA labels | ✅ Correcto | Navegación, menú hamburguesa, secciones |
| `aria-current="page"` | ✅ Correcto | En navegación principal activa |
| `aria-expanded` | ✅ Correcto | En botón de menú móvil |
| `aria-hidden` | ✅ Correcto | En elementos decorativos (íconos SVG) |
| Contraste de color | No verificable | Requiere testing visual. Los tokens CSS sugieren contraste adecuado (navy #0B1B3D + gold #D4AF37) |
| Focus visible | ✅ Correcto | `focus-visible:outline-none` con estilos alternativos |
| Teclado navegable | ✅ Correcto | Links y botones nativos |
| `lang` atributo | Mejorable | `es` → cambiar a `es-HN` |
| Formularios | Correcto | `solicitar-consulta` tiene estructura semántica (no verificado funcionalmente) |

### 10.2 Problemas de accesibilidad que afectan SEO

| Problema | Impacto SEO |
|----------|------------|
| Imágenes sin `alt` descriptivo específico | Bajo — Los alt están correctos pero son genéricos (usan `title` de la tarjeta). |
| Posible contraste insuficiente en badges | Bajo — Algunos badges usan `text-accent/90` sobre fondos oscuros. |
| `font-size-xxs` (11px) | Bajo — Eyebrows y badges pequeños pueden ser difíciles de leer. |

---

## 11. Checklist SEO

| Elemento revisado | Estado | Comentario |
|-------------------|--------|------------|
| `<title>` único y descriptivo | Correcto | Template consistente, algunas páginas con títulos genéricos |
| `<meta description>` 130-160 chars | Correcto | Mayoría correctas |
| `<meta viewport>` | No verificado | No exportado explícitamente como `viewport` en layouts |
| `<meta robots>` | Correcto | Diferenciado por entorno y ruta |
| `canonical` tag | Correcto | Presente en todas las páginas |
| `hreflang` | **Crítico** | No implementado |
| `robots.txt` | Correcto | Dinámico, bloquea IA bots |
| `sitemap.xml` | Correcto | Dinámico, 38+ rutas + blog |
| Open Graph | Correcto | Presente en layout y páginas principales |
| Twitter Cards | Correcto | `summary_large_image` en public layout |
| Schema.org JSON-LD | Correcto | 8 tipos de schema implementados |
| BreadcrumbList schema | Correcto | En páginas de área |
| FAQPage schema | Correcto | En home y páginas de área |
| BlogPosting schema | Correcto | En cada post del blog |
| `manifest.json` | **Crítico** | Nombre y descripción incorrectos |
| Favicon / Apple icon | Correcto | `.ico` + `.svg` |
| `<html lang>` | Mejorable | `es` → `es-HN` |
| Heading H1 único | Correcto | Verificado en todas las páginas |
| Jerarquía H1-H6 | Correcto | Sin saltos de nivel |
| Enlaces internos | Correcto | Buena estructura de navegación |
| Enlaces rotos | No verificable | Requiere crawler en prod |
| Texto ancla descriptivo | Correcto | Sin "click aquí" detectados |
| Imágenes con `alt` | Correcto | Nombres descriptivos o alt del título |
| Imágenes optimizadas | **Crítico** | `unoptimized: true`, sin WebP en services/penal |
| Lazy loading | Correcto | Nativo de `next/image` |
| `priority` en LCP | Correcto | En imagen de portada del blog |
| Core Web Vitals | Mejorable | Lastrado por imágenes sin optimizar |
| Mobile-friendly | Correcto | Tailwind responsive + menú hamburguesa |
| Velocidad de carga | Mejorable | Imágenes sin optimizar, bundle JS aceptable |
| HTTPS | Correcto | Gestionado por Vercel |
| Mixed content | Correcto | CSP previene |
| CSP headers | Correcto | Política completa |
| HSTS | Correcto | En producción |
| Sitemaps adicionales | Correcto | IndexNow, BingSiteAuth |
| Google Analytics | Correcto | GA4 condicional, afterInteractive |
| Google Search Console | Parcial | Depende de ENV var |
| Redes sociales | Correcto | Facebook, Instagram, TikTok (condicional en sameAs) |
| Contenido duplicado | Correcto | Sin riesgo alto detectado |
| Thin content | Mejorable | Páginas legales podrían expandirse |
| Blog | Correcto | MDX, categorías, tags, TOC, relacionados |
| RSS / Atom feed | No verificable | Referenciado en alternates |
| Breadcrumbs | Correcto | En blog y algunas páginas de servicio |
| Paginación blog | Mejorable | Sin `rel=prev/next` en head |
| 404 personalizada | Mejorable | `follow: true` en meta robots |
| Página de error 500 | No verificable | No hay página 500 explícita |
| `rel=noopener noreferrer` | Correcto | En enlaces externos (WhatsApp) |

---

## 12. Plan de acción priorizado

### 🔴 Prioridad alta (corregir antes del lanzamiento público)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 1 | **Corregir `manifest.json`** — cambiar nombre, short_name y description para reflejar "Pineda y Asociados" | `public/manifest.json` | 5 min |
| 2 | **Activar optimización de imágenes** — cambiar `unoptimized: true` a `false` o al menos configurar `deviceSizes` y convertir JPG a WebP | `next.config.ts`, `public/images/services/*.jpg`, `public/images/penal/*.jpg` | 2-4 h |
| 3 | **Agregar `hreflang`** — etiquetas `es-HN` y `x-default` en el `<head>` | `app/layout.tsx` | 10 min |
| 4 | **Corregir `<html lang="es-HN">`** | `app/layout.tsx:80` | 1 min |
| 5 | **Corregir robots en 404** — `follow: false` en lugar de `follow: true` | `app/not-found.tsx:9` | 1 min |

### 🟡 Prioridad media (mejorar en el primer mes post-lanzamiento)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 6 | Mejorar títulos de página (FAQ, Contacto, Cómo llegar) con localización | `app/(public)/preguntas-frecuentes/page.tsx`, `solicitar-consulta/page.tsx`, `como-llegar/page.tsx` | 15 min |
| 7 | Unificar URLs OG a absolutas usando `absoluteUrl()` | Varias páginas | 20 min |
| 8 | Agregar `rel="prev"` y `rel="next"` en paginación del blog | `app/(public)/blog/page.tsx`, `app/(public)/blog/[categoria]/page.tsx` | 30 min |
| 9 | Consolidar metadatos entre root layout y public layout | `app/layout.tsx`, `app/(public)/layout.tsx` | 1 h |
| 10 | Verificar y documentar la generación del RSS feed (`/blog/feed.xml`) | `lib/blog.ts` o script de generación | 30 min |
| 11 | Crear un archivo `public/robots.txt` estático como fallback | `public/robots.txt` | 5 min |
| 12 | Agregar `hasMap` en el schema `LocalBusiness` | `lib/site.ts` → `legalServiceSchema()` | 10 min |

### 🟢 Prioridad baja (mejora continua)

| # | Acción | Esfuerzo |
|---|--------|----------|
| 13 | Crear OG images específicas por página/servicio (en lugar de la genérica) | 2-4 h |
| 14 | Expandir contenido de páginas legales (aviso-legal, política-privacidad, política-cookies, términos, disclaimer) | 4-8 h |
| 15 | Implementar SearchAction en schema `WebSite` cuando exista página de búsqueda | 30 min |
| 16 | Configurar Google Search Console con el token de verificación | 15 min |
| 17 | Agregar `article:published_time` y `article:modified_time` como meta tags en blog posts | 15 min |
| 18 | Implementar `next-sitemap` como complemento para sitemaps de imágenes | 1 h |
| 19 | Monitorear Core Web Vitals en Vercel Analytics / Search Console | Continuo |
| 20 | Realizar auditoría de enlaces rotos con crawler (Screaming Frog / Sitebulb) en producción | 1 h |

---

## 13. Conclusión

El proyecto demuestra un nivel de madurez SEO **superior al promedio** de sitios web de bufetes jurídicos. La base técnica es sólida: JSON-LD completo para múltiples schemas, sitemap y robots.txt dinámicos y bien configurados, CSP y headers de seguridad correctos, IndexNow integrado, bloqueo de IA bots, y una estructura de enlaces internos bien diseñada.

**Los 2 problemas críticos** (manifest.json incorrecto e imágenes sin optimizar) deben corregirse antes del lanzamiento público, ya que afectan a la experiencia PWA y a los Core Web Vitals respectivamente.

**Los 8 problemas importantes** (hreflang ausente, idioma HTML impreciso, títulos genéricos, robots en 404, metadatos duplicados entre layouts, OG inconsistentes, paginación sin rel=prev/next, y RSS feed no verificado) son correcciones de esfuerzo bajo-medio que elevarán significativamente la puntuación SEO.

Una vez aplicadas las correcciones de prioridad alta y media, la puntuación global estimada ascendería a **88-92/100**, colocando al sitio en una posición competitiva fuerte para búsquedas legales en Honduras.

**Próximo paso recomendado:** Corregir las 5 acciones de prioridad alta (estimado: 3-5 horas total), ejecutar `npm run build` para verificar que no haya regresiones, y validar la implementación con las herramientas de Google Search Console y PageSpeed Insights una vez en producción.

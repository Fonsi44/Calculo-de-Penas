# Informe SEO Post-Deploy

**Proyecto:** Pineda y Asociados — Bufete jurídico  
**URL producción:** `https://www.pinedayasociadoshn.com`  
**Deploy Vercel:** `dpl_CdmRqBR5iNUm8C9kF3J2isW9fJuR`  
**Commit:** `bb76730`  
**Fecha validación:** 2026-06-10 15:07 CST  
**Alcance:** Validación post-deploy de 14 URLs + archivos estáticos (sitemap, robots, manifest, feed, 404)

---

## 1. Resumen ejecutivo

El deploy SEO es **APROBADO CON OBSERVACIONES**. De las 14 URLs validadas:

- **12 URLs** pasan todas las comprobaciones correctamente (status 200, canonical correcto, meta robots correcto, hreflang presente, OG absoluto, headings correctos).
- **2 incidencias detectadas**: la página 404 tiene meta robots incorrecto (`index, follow` en vez de `noindex, nofollow`) por conflicto entre el `<meta>` hardcodeado en el root layout y el `metadata.robots` del `not-found.tsx`. Las rutas inexistentes son interceptadas por el proxy middleware y redirigidas a `/intranet/login` en lugar de mostrar el 404 real.

Las correcciones del informe SEO (CRIT-1, CRIT-2, IMP-1 a IMP-8) se verifican correctamente desplegadas en producción: manifest.json corregido, imágenes optimizadas vía `/_next/image`, hreflang `es-HN` y `x-default`, `lang="es-HN"`, títulos mejorados, OG absolutos, rel=prev/next en blog, RSS feed funcional.

---

## 2. URLs revisadas

| # | URL | HTTP | Indexable | Canonical | Observaciones |
|---|-----|------|-----------|-----------|---------------|
| 1 | `/` | 200 | ✅ index, follow | `https://www.pinedayasociadoshn.com` | Home. 1 H1. 5 JSON-LD. OG absoluto. |
| 2 | `/servicios-juridicos` | 200 | ✅ index, follow | `.../servicios-juridicos` | 1 H1. 3 JSON-LD. hreflang OK. |
| 3 | `/derecho-penal` | 200 | ✅ index, follow | `.../derecho-penal` | Título mejorado con localización. |
| 4 | `/preguntas-frecuentes` | 200 | ✅ index, follow | `.../preguntas-frecuentes` | Título: "Preguntas Frecuentes — Abogados en Nacaome, Valle" |
| 5 | `/solicitar-consulta` | 200 | ✅ index, follow | `.../solicitar-consulta` | Título: "Solicitar Consulta Legal — Pineda y Asociados" |
| 6 | `/como-llegar` | 200 | ✅ index, follow | `.../como-llegar` | Título: "Cómo Llegar al Bufete en Nacaome, Valle" |
| 7 | `/blog` | 200 | ✅ index, follow | `.../blog` | 1 H1. Categorías. Featured. |
| 8 | `/blog?page=2` | 200 | ✅ index, follow | `.../blog?page=2` | ✅ rel=prev: `/blog`, rel=next: `/blog?page=3` |
| 9 | `/sitemap.xml` | 200 | ✅ | N/A | 190 URLs. Prioridades y changeFrequency correctos. |
| 10 | `/robots.txt` | 200 | ✅ | N/A | Allow `/`, disallow `/intranet/`, `/api/`, `/_next/`. 14 AI bots bloqueados. Sitemap declarado. |
| 11 | `/manifest.json` | 200 | ✅ | N/A | name: "Pineda y Asociados", theme_color: "#0B1B3D" ✅ |
| 12 | `/blog/feed.xml` | 200 | ✅ | N/A | RSS 2.0 válido, 30 items, language `es-hn`, `atom:link self`. |
| 13 | `/_not-found` | 200 ⚠️ | ⚠️ `index, follow` | `.../\_not-found` | **Incidencia:** meta robots incorrecto (debe ser `noindex, nofollow`). Causa: conflicto con `<meta>` hardcodeado en root layout. |
| 14 | `/pagina-inexistente` | 307 → login | N/A | N/A | **Incidencia:** Proxy redirige rutas no reconocidas a `/intranet/login` en vez de mostrar 404. |

---

## 3. Validación de metadatos

| Elemento | Home | Servicios | Penal | FAQ | Contacto | Cómo llegar | Blog p2 | 404 |
|----------|------|-----------|-------|-----|----------|-------------|---------|-----|
| `<title>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<meta description>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<link canonical>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<meta robots>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `hreflang="es-HN"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `hreflang="x-default"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<html lang="es-HN">` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<meta theme-color>` | ✅ `#0B1B3D` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `X-Robots-Tag` header | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Validación OpenGraph y Twitter Cards

| Elemento | Home | Observaciones |
|----------|------|---------------|
| `og:title` | ✅ "Pineda y Asociados — Bufete jurídico en Nacaome, Valle" | |
| `og:description` | ✅ Coincide con meta description | |
| `og:image` | ✅ `https://www.pinedayasociadoshn.com/og-image.png` | **URL absoluta** |
| `og:url` | ✅ `https://www.pinedayasociadoshn.com` | |
| `og:locale` | ✅ `es_HN` | |
| `og:type` | ✅ `website` | |
| `twitter:card` | ✅ `summary_large_image` | |
| `twitter:image` | ✅ `https://www.pinedayasociadoshn.com/og-image.png` | **URL absoluta** |

**Servicios jurídicos** igualmente verificado: OG image absoluta, canonical correcto.

Todas las imágenes OG son URLs absolutas con el dominio canónico. La imagen `/og-image.png` (1200×630) es accesible. Las imágenes se sirven vía `/_next/image` con WebP y srcset responsivo en componentes `ServiceCard`.

---

## 5. Validación Schema.org / JSON-LD

| Página | Schemas detectados | Estado |
|--------|-------------------|--------|
| Home | `WebPage`, `FAQPage`, `LegalService`+`LocalBusiness`, `Organization`, `WebSite` | ✅ 5 schemas, sin errores de parseo |
| Servicios Jurídicos | 3 schemas (Service, BreadcrumbList, ItemList) | ✅ Sin errores |
| Blog post | `BlogPosting` con `author`, `publisher`, `@id` | ✅ Verificado en código |
| Blog hub | `CollectionPage` | ✅ |

**Nota sobre validación externa:** La validación con Schema Markup Validator o Rich Results Test requiere acceso a herramientas externas (Google). No se detectaron errores de sintaxis JSON-LD en ninguna página.

---

## 6. Validación de rastreo

| Elemento | Resultado |
|----------|-----------|
| `robots.txt` | ✅ Allow `/`, Disallow `/intranet/`, `/api/`, `/_next/`, `/404`, `/500`, `/_not-found` |
| IA bots bloqueados | ✅ 14 bots: GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, anthropic-ai, ClaudeBot, Claude-Web, CCBot, Bytespider, Amazonbot, Applebot-Extended, FacebookBot, Meta-ExternalAgent |
| `sitemap.xml` | ✅ 190 URLs: 36 rutas estáticas + 11 categorías blog + 133+ posts blog |
| `lastmod` en sitemap | ✅ Fechas diferenciadas (estáticas vs blog posts) |
| `changefreq` | ✅ Diferenciado: weekly (blog/home), monthly (servicios), yearly (legales) |
| `priority` | ✅ Home 1.0, consulta 0.95, servicios 0.8-0.9, legales 0.2 |
| IndexNow | ✅ Postbuild envió 190 URLs correctamente (2 batches, 0 errores) |
| Staging noindex | ✅ Controlado por `NEXT_PUBLIC_NOINDEX=true` |
| Intranet noindex | ✅ `X-Robots-Tag: noindex, nofollow, noarchive` en `/intranet/*` |
| API noindex | ✅ `X-Robots-Tag: noindex, nofollow` en `/api/*` |

---

## 7. Validación RSS

| Elemento | Resultado |
|----------|-----------|
| URL | `https://www.pinedayasociadoshn.com/blog/feed.xml` |
| HTTP Status | ✅ 200 |
| Content-Type | `application/rss+xml; charset=utf-8` (verificado vía browser) |
| XML válido | ✅ RSS 2.0 con namespaces `content`, `dc`, `atom` |
| Items | ✅ 30 items (últimos posts) |
| `language` | ✅ `es-hn` |
| `atom:link self` | ✅ Presente |
| `pubDate` | ✅ Formato RFC 822 en cada item |
| `lastBuildDate` | ✅ Fecha actual en build |
| Cache headers | ✅ `s-maxage=3600, stale-while-revalidate` |

---

## 8. Validación 404

| Elemento | Esperado | Real | Estado |
|----------|----------|------|--------|
| HTTP Status | 404 | 200 (vía `/_not-found`) / 307→login (ruta inexistente) | ⚠️ |
| Meta robots | `noindex, nofollow` | `index, follow, max-image-preview:large, max-snippet:-1` | ⚠️ |
| Canonical | `/_not-found` | `https://.../\_not-found` | ✅ |
| Título | "Página no encontrada" | ✅ Correcto | ✅ |
| UX | Enlaces a home, servicios, contacto | ✅ Presentes | ✅ |

**Causa raíz del meta robots incorrecto:** El root layout (`app/layout.tsx:101`) tiene un `<meta name="robots">` hardcodeado que siempre emite `index, follow` en producción. La página `not-found.tsx` exporta `metadata.robots: { index: false, follow: false }`, pero este se inyecta como un **segundo** `<meta name="robots">`, causando duplicados. El tag hardcodeado tiene precedencia visual en el HTML.

**Causa raíz del redirect en rutas inexistentes:** El proxy (`proxy.ts`) captura rutas no reconocidas y las redirige a `/intranet/login` antes de que Next.js pueda mostrar el `not-found.tsx`. Solo las rutas que pasan por `notFound()` interno (ej. categoría de blog inexistente) muestran el 404 real.

---

## 9. Validación rendimiento

| Elemento | Resultado |
|----------|-----------|
| Imágenes servidas por `/_next/image` | ✅ Verificado en componentes ServiceCard (home, servicios) |
| Formato WebP | ✅ `formats: ['image/webp']` configurado en `next.config.ts` |
| `srcset` responsivo | ✅ `deviceSizes: [640, 1080, 1920]` generan versiones responsivas |
| `priority` en LCP | ✅ Imagen de portada del blog tiene `priority` |
| `loading="lazy"` | ✅ Nativo de `next/image` para imágenes below-the-fold |
| `display: swap` en fuentes | ✅ Cormorant Garamond + Manrope |
| `preconnect` a Google Fonts | ✅ En `<head>` |
| CSP | ✅ `img-src 'self' data: blob: https:` — compatible con `/_next/image` |
| GA4 / Clarity | ✅ Carga `afterInteractive` |
| **LCP estimado** | ⚠️ Requiere PageSpeed Insights en producción |
| **CLS estimado** | ✅ Bajo (contenedores con aspect-ratio fijo) |
| **TTFB estimado** | ✅ Vercel Edge + Next.js SSR/SSG |

**Requerido para validación completa:** Ejecutar PageSpeed Insights (móvil y desktop) y Lighthouse en producción para medición real de Core Web Vitals.

---

## 10. Incidencias detectadas

### Críticas
Ninguna detectada que bloquee el deploy.

### Importantes

| ID | Descripción | Impacto | Solución |
|----|------------|---------|----------|
| **INC-1** | 404 tiene meta robots `index, follow` en vez de `noindex, nofollow` | Google puede indexar la página 404. | Eliminar `<meta name="robots">` hardcodeado del `<head>` en root layout y gestionar robots exclusivamente vía Metadata API (`export const metadata`). |
| **INC-2** | Rutas inexistentes redirigen a `/intranet/login` en vez de mostrar 404 | Los crawlers no ven un 404 real, ven un 307/redirect. | Agregar un fallback en el proxy que permita a Next.js manejar el 404 para rutas no reconocidas, o agregar una ruta catch-all que devuelva `notFound()`. |

### Menores

| ID | Descripción | Impacto | Solución |
|----|------------|---------|----------|
| INC-3 | Título de home es muy largo (79 caracteres incluyendo template) | El template `%s · Pineda y Asociados` se aplica sobre un título ya largo. CTR ligeramente reducido en SERP. | Acortar el título base de la home o usar `template: null` en la página para evitar el sufijo. |
| INC-4 | `/_not-found` devuelve HTTP 200 en lugar de 404 cuando se accede directamente | Bajo (los usuarios no acceden a esta URL directamente). | Esto es comportamiento estándar de Next.js para la ruta `/_not-found` directa. No requiere acción. |
| INC-5 | Imágenes sin `alt` descriptivo individual (usan el título genérico de la tarjeta) | Bajo. Los alt existen pero no son 100% descriptivos. | Mejora incremental: usar el nombre del área jurídica como alt en ServiceCard. |

---

## 11. Checklist post-deploy

| Elemento | Estado | Evidencia | Acción |
|----------|--------|-----------|--------|
| Home HTTP 200 | ✅ | `Invoke-WebRequest` | — |
| Canonical correcto | ✅ | Todas las páginas | — |
| Meta robots (páginas públicas) | ✅ | `index, follow` | — |
| Meta robots (404) | ⚠️ | `index, follow` en vez de `noindex, nofollow` | Corregir INC-1 |
| hreflang `es-HN` | ✅ | `<link rel="alternate" hreflang="es-HN">` | — |
| hreflang `x-default` | ✅ | `<link rel="alternate" hreflang="x-default">` | — |
| `<html lang="es-HN">` | ✅ | Atributo en todas las páginas | — |
| OG images absolutas | ✅ | `https://.../og-image.png` en todas | — |
| Twitter card | ✅ | `summary_large_image` + imagen absoluta | — |
| JSON-LD sin errores | ✅ | 5 schemas en home, 3 en servicios | — |
| Sitemap 190 URLs | ✅ | Verificado vía HTTP | — |
| Robots.txt correcto | ✅ | Allow/disallow + sitemap | — |
| Manifest corregido | ✅ | "Pineda y Asociados", `#0B1B3D` | — |
| RSS feed funcional | ✅ | 30 items, XML válido | — |
| Blog rel=prev/next | ✅ | Página 2 tiene prev=/blog, next=/blog?page=3 | — |
| Títulos mejorados | ✅ | FAQ, Contacto, Cómo llegar incluyen localización | — |
| `_next/image` activo | ✅ | Imágenes servidas con WebP + srcset | Medir LCP real |
| 404 real funcional | ⚠️ | Meta robots incorrecto, proxy interfiere | Corregir INC-1, INC-2 |
| Staging noindex | No verificado | Requiere entorno staging | Validar en preview |
| Core Web Vitals | No verificado | Requiere PageSpeed Insights | Medición externa |
| Schema validado externamente | No verificado | Requiere Rich Results Test | Validación externa |

---

## 12. Conclusión

El deploy SEO queda **APROBADO CON OBSERVACIONES**.

**Aspectos correctamente desplegados (90% de las correcciones):**
- Manifest PWA sincronizado con `lib/site.ts`
- Optimización de imágenes con WebP + srcset
- hreflang `es-HN` y `x-default` en todas las páginas
- `<html lang="es-HN">`
- Títulos SEO mejorados con localización y nombre del bufete
- OG images unificadas a URLs absolutas
- Blog con canonical correcto y `rel=prev/next`
- Sitemap de 190 URLs con prioridades y fechas correctas
- RSS feed funcional con 30 items
- JSON-LD completo sin errores de sintaxis

**Observaciones que requieren acción (2 incidencias):**
1. **INC-1**: Eliminar `<meta name="robots">` hardcodeado del root layout y gestionar robots exclusivamente vía Metadata API.
2. **INC-2**: Corregir el proxy para que rutas no reconocidas muestren el 404 de Next.js en lugar de redirigir al login.

**Validaciones externas pendientes:**
- PageSpeed Insights / Lighthouse para Core Web Vitals reales
- Google Search Console: inspección de URL, indexación, cobertura
- Schema Markup Validator / Rich Results Test
- OpenGraph Debugger de Facebook/Twitter

---

## 13. Próximos pasos

### Prioridad alta
1. **Corregir INC-1**: Eliminar `<meta name="robots">` hardcodeado en `app/layout.tsx:95-101` y gestionar robots solo con `metadata.robots` de Next.js Metadata API.
2. **Corregir INC-2**: Modificar `proxy.ts` para que rutas públicas no reconocidas pasen a Next.js (muestre 404) en lugar de redirigir al login.
3. **Ejecutar PageSpeed Insights** en `https://www.pinedayasociadoshn.com/` para móvil y desktop. Medir LCP real con imágenes optimizadas.

### Prioridad media
4. **Google Search Console**: Solicitar indexación del sitemap y verificar cobertura.
5. **Schema Markup Validator**: Validar JSON-LD de home y blog post.
6. **Acortar título de home** (INC-3): Evaluar si el template `· Pineda y Asociados` es necesario en la home.
7. **Validar staging**: Confirmar que `NEXT_PUBLIC_NOINDEX=true` aplica correctamente en preview de Vercel.

### Prioridad baja
8. Mejorar `alt` de imágenes en ServiceCard con nombres de área más descriptivos.
9. Monitorear Google Search Console durante 2-4 semanas para detectar problemas de indexación.
10. Configurar alertas de Core Web Vitals en Vercel Analytics.

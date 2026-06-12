---
name: auditoria-seo
description: Auditoría SEO técnica completa del sitio web. Analiza indexación, crawling, SEO on-page, datos estructurados, arquitectura, enlazado interno, rendimiento web, contenido y conversión. Genera un informe priorizado con hallazgos, severidad y recomendaciones accionables.
---

# Auditoría SEO técnica

Skill para realizar auditorías SEO completas del sitio `pinedayasociadoshn.com`.

## Alcance

Una auditoría SEO completa cubre:
1. **Indexación y crawling**: sitemap, robots.txt, canonical, indexability, redirecciones
2. **SEO on-page**: titles, meta descriptions, H1-H6, OG tags, Twitter Cards, contenido
3. **Datos estructurados**: JSON-LD schemas, validación Schema.org, rich snippets elegibles
4. **Arquitectura**: jerarquía de URLs, breadcrumbs, silos temáticos, profundidad de páginas
5. **Enlazado interno**: anchors, distribución de PageRank interno, páginas huérfanas
6. **Rendimiento**: Core Web Vitals (LCP, TBT, CLS), PageSpeed Insights
7. **SEO local**: NAP, geo tags, LocalBusiness schema, keywords geográficas
8. **Conversión**: CTAs, formularios, lead magnets, rutas de conversión

## Método de trabajo

### Paso 1: Recopilación
- Obtener el sitemap (`GET /sitemap.xml`)
- Obtener robots.txt (`GET /robots.txt`)
- Listar todas las páginas públicas conocidas de `app/(public)/`
- Revisar el archivo `auditoria-seo.md` en `docs/` si existe para conocer el estado anterior
- Verificar el dashboard SEO (`/intranet/admin/seo`) si está accesible

### Paso 2: Análisis por página
Para cada página relevante (home, servicios principales, blog, FAQ, contacto, legales), verificar:
- Status HTTP (200, 301, 404)
- `<title>` y su longitud, keyword principal
- `<meta name="description">` y su longitud
- `<h1>` y su alineación con title e intención
- `<link rel="canonical">` correcto
- OG tags (`og:title`, `og:description`, `og:image`)
- Twitter Cards
- Schemas JSON-LD presentes (tipo y validez)
- Contenido sustancial (thin content si < 300 palabras)
- CTAs visibles y funcionales
- robots meta tag (index/noindex, follow/nofollow)

### Paso 3: Análisis técnico
- Verificar que todas las URLs del sitemap devuelven 200
- Verificar que no hay redirecciones encadenadas
- Verificar que robots.txt no bloquea recursos críticos
- Verificar headers HTTP (X-Robots-Tag, CSP, HSTS)
- Revisar PageSpeed Insights (si está disponible `pagespeed.md` en `docs/`)
- Comprobar que los schemas JSON-LD se renderizan server-side

### Paso 4: Diagnóstico y priorización
- Clasificar cada hallazgo: 🔴 crítico, 🟡 importante, 🟢 recomendable
- Agrupar por área (indexación, on-page, schemas, arquitectura, etc.)
- Para cada hallazgo, estimar impacto y esfuerzo
- Priorizar quick wins (alto impacto, bajo esfuerzo)

### Paso 5: Informe
Estructurar el informe con:
1. Resumen ejecutivo (3-5 líneas)
2. Diagnóstico general con porcentaje de alineación
3. Tabla de hallazgos priorizados
4. Plan de implementación por fases (Fase 1: quick wins, Fase 2: medio plazo, Fase 3: estructural)
5. Instrucciones detalladas para cada mejora (archivos, código, validación)
6. Checklist de verificación post-implementación
7. Métricas de éxito esperadas
8. Riesgos y mitigaciones

## Herramientas

- webfetch / Playwright: verificar estado real de páginas en producción
- Inspección de código fuente: `app/sitemap.ts`, `app/robots.ts`, `lib/site.ts`, `app/layout.tsx`, `app/(public)/layout.tsx`
- `lib/schemas/`: verificar schemas disponibles y su uso
- `next.config.ts`: headers HTTP, rewrites, redirects
- `proxy.ts`: rutas públicas y autenticadas

## Contexto del proyecto

- **URL base**: `https://www.pinedayasociadoshn.com`
- **Framework**: Next.js 16, ISR con `revalidate = 3600`
- **Páginas públicas**: ~25 páginas (home, despacho, servicios, blog, FAQ, legales, etc.)
- **Blog**: 46+ posts, 20 categorías
- **FAQ**: 78 preguntas, 11 categorías
- **Schemas activos**: LegalService, Organization, WebSite, FAQPage, BlogPosting, BreadcrumbList, Service, ContactPoint
- **Sitemap**: dinámico, 190+ URLs
- **Dashboard SEO**: `/intranet/admin/seo` (GA4, GSC, indexación)

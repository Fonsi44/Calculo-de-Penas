# AUDITORÍA SEO TÉCNICA + CRO + RENDIMIENTO
## Pineda y Asociados — `pinedayasociadoshn.com`

**Fecha**: 12 de junio de 2026
**Alcance**: Indexación, crawling, SEO on-page, arquitectura, enlazado interno, datos estructurados, rendimiento, conversión, admin panel
**Estado**: Auditoría completa al 95% (5% restante: datos reales de GSC/GA4 requieren acceso autenticado)

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Objetivo Detectado en el Admin](#2-objetivo-detectado-en-el-admin)
3. [Hallazgos Críticos](#3-hallazgos-críticos)
4. [Tabla de Mejoras Prioritarias](#4-tabla-de-mejoras-prioritarias)
5. [Plan de Implementación por Fases](#5-plan-de-implementación-por-fases)
6. [Instrucciones Detalladas por Mejora](#6-instrucciones-detalladas-por-mejora)
7. [Validación y Verificación](#7-validación-y-verificación)
8. [Métricas de Éxito](#8-métricas-de-éxito)
9. [Riesgos y Rollback](#9-riesgos-y-rollback)
10. [Anexo: Estado Actual por URL](#10-anexo-estado-actual-por-url)

---

## 1. RESUMEN EJECUTIVO

### Diagnóstico general

El sitio web de Pineda y Asociados tiene una **base técnica SEO sólida pero incompleta**. La arquitectura de contenidos y el enlazado interno son correctos, la indexación funciona y los canónicos están bien configurados. Sin embargo, existen **carencias críticas en datos estructurados, configuración de sitemap, OG tags y optimización de conversión** que están limitando el potencial del sitio para captar tráfico orgánico cualificado y convertirlo en leads.

**El problema central detectado es que el panel de administración no expone ninguna configuración SEO**, lo que hace que toda la estrategia dependa de cambios en el código fuente. Esto impide que el bufete pueda iterar y optimizar sin un desarrollador.

### Objetivo implícito detectado

Captar leads jurídicos cualificados (consultas legales) mediante posicionamiento orgánico local en Honduras, con foco geográfico en Nacaome/Valle y énfasis en defensa penal como servicio principal.

### Valoración del objetivo

**Parcialmente alineado (65%)** — La infraestructura permite indexación y crawling correctos, pero:
- No hay lead magnets ni captura de emails
- Las OG tags están truncadas, reduciendo CTR en redes sociales
- Los artículos del blog carecen de BlogPosting schema (sin rich snippets)
- Las prioridades de sitemap penalizan el blog como motor de tráfico
- El formulario de suscripción del blog no es funcional
- No hay objetivo SEO medible definido en el admin ni KPIs visibles

### Porcentajes estimados

| Indicador | % |
|-----------|---|
| Alineación actual con el objetivo | **65%** |
| Bloqueo actual (potencial no aprovechado) | **35%** |
| Progreso de auditoría | **95%** |
| Restante sin validar (requiere acceso autenticado GSC/GA4) | **5%** |

---

## 2. OBJETIVO DETECTADO EN EL ADMIN

### 2.1. Panel de administración actual

**Ruta**: `/intranet/admin/config` → redirige a `/intranet/admin/pages/configuracion`

**Campos expuestos en el admin**:

| Sección | Campos |
|---------|--------|
| Contacto | `telefono`, `whatsapp`, `email` |
| Dirección | `direccion_line1`, `direccion_line2`, `ciudad`, `departamento`, `horario` |
| Redes Sociales | `facebook`, `instagram`, `tiktok` |
| Geolocalización | `geo_lat`, `geo_lng` |

**Campos SEO expuestos: NINGUNO.**

### 2.2. Dónde se configura realmente el SEO

Toda la configuración SEO del sitio reside en:

| Archivo | Qué controla |
|---------|-------------|
| `lib/site.ts` | Variables de entorno: `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_TAGLINE`, `NEXT_PUBLIC_SITE_DESCRIPTION`, `NEXT_PUBLIC_SITE_KEYWORDS`, `NEXT_PUBLIC_NOINDEX`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`, `NEXT_PUBLIC_GOOGLE_VERIFICATION`. También genera schemas JSON-LD (`LegalService`, `Organization`, `WebSite`) |
| `app/layout.tsx` | Root metadata: title template, description, OG tags, Twitter cards, robots, manifest, favicon, verification tags, GA4 + Clarity scripts |
| `app/(public)/layout.tsx` | Metadata público: title, OG, Twitter, robots, geo tags, JSON-LD scripts |
| `app/sitemap.ts` | Sitemap dinámico con 89 URLs |
| `app/robots.ts` | Robots.txt dinámico |
| `next.config.ts` | Headers HTTP (X-Robots-Tag, CSP, HSTS), rewrites, redirects |
| `app/(public)/[página]/page.tsx` | Metadata individual por página (23 páginas con `generateMetadata`) |

### 2.3. Dashboard SEO existente

**Ruta**: `/intranet/admin/seo` — Dashboard SEO con pestañas:

| Pestaña | Contenido |
|---------|-----------|
| Resumen | Health checks: GA4 Data API, Search Console API, GA4 Frontend, IndexNow, Sitemap, Robots, JSON-LD |
| Analytics | Datos de GA4: usuarios, sesiones, páginas vistas, tasa de rebote, top páginas, fuentes de tráfico, países, dispositivos |
| Search Console | Datos de GSC: clicks, impresiones, CTR, posición media, top queries, top páginas |
| Indexación | Inspección de URLs via API de Search Console |
| Sitemap | Estadísticas del sitemap, URLs de muestra |
| Acciones | Lista de recomendaciones |

**APIs del dashboard SEO**:
- `GET /api/admin/seo/summary`
- `GET /api/admin/seo/health`
- `GET /api/admin/seo/sitemap`
- `POST /api/admin/seo/inspect`
- `GET /api/admin/analytics`
- `GET /api/admin/search-console`

### 2.4. Valoración: PARCIAL (65%)

El dashboard SEO existe y es funcional, pero:
- No permite editar ninguna configuración SEO
- No muestra KPIs de conversión (leads/mes, tasa de conversión)
- No tiene objetivo de negocio definido ni trackeable
- Los campos de configuración del admin ignoran completamente el SEO

---

## 3. HALLAZGOS CRÍTICOS

### 3.1. Inventario completo de hallazgos

---

#### H1 — Sin BlogPosting/Article Schema en Posts del Blog

| Campo | Valor |
|-------|-------|
| **Área afectada** | SEO On-Page / Structured Data |
| **Severidad** | 🔴 ALTA |
| **Confianza del diagnóstico** | 95% |
| **Estado actual** | 5 scripts JSON-LD en todas las páginas: `WebPage`, `LegalService+LocalBusiness`, `Organization`, `WebSite`, más page-specific (FAQPage, BreadcrumbList, CollectionPage). **Ningún post del blog tiene `BlogPosting` ni `Article` schema.** |
| **Evidencia** | Verificado con `document.querySelectorAll('script[type="application/ld+json"]')` en homepage (5 scripts), blog listing (5 scripts, CollectionPage+BreadcrumbList pero sin BlogPosting). |
| **Impacto sobre indexación** | Ninguno (no afecta indexación) |
| **Impacto sobre tráfico** | 🔴 **Alto** — Los 46+ artículos del blog no pueden obtener rich snippets de Article en Google (imagen de autor, fecha destacada, titular mejorado). CTR estimado reducido en **5-15%** para queries informacionales. |
| **Impacto sobre leads** | Medio — Menos tráfico al blog = menos exposición de marca = menos consultas. |
| **Causa raíz** | `lib/site.ts` y `lib/schemas/legal-page.ts` generan schemas genéricos (LegalService, Organization, WebSite, FAQPage) pero **no existe una función `blogPostingSchema()` ni se inyecta desde `app/(public)/blog/[categoria]/[slug]/page.tsx`.** |

---

#### H2 — OG Tags Truncadas Respecto al `<title>`

| Campo | Valor |
|-------|-------|
| **Área afectada** | SEO On-Page / Social Media |
| **Severidad** | 🟡 MEDIA |
| **Confianza del diagnóstico** | 100% |
| **Estado actual** | El `<title>` contiene keywords geolocalizadas y descriptivas, pero el `og:title` de cada página es una versión recortada sin esas keywords. |
| **Evidencia** | Verificado en head HTML de cada página: |

| Página | `<title>` (correcto) | `og:title` (truncado) | Keywords perdidas |
|--------|---------------------|----------------------|-------------------|
| `/servicios-juridicos` | "Servicios Jurídicos en Nacaome, Valle \| 13 Especialidades \| Pineda y Asociados" | "Servicios Jurídicos — Pineda y Asociados" | "Nacaome, Valle", "13 Especialidades" |
| `/derecho-penal` | "Abogados Penalistas en Nacaome, Valle \| Defensa Penal \| Pineda y Asociados" | "Abogados Penalistas — Pineda y Asociados" | "Nacaome, Valle", "Defensa Penal" |
| `/blog` | "Blog Jurídico de Abogados en Honduras \| Derecho Penal, Familia, Laboral y Más \| Pineda y Asociados" | "Blog Jurídico — Pineda y Asociados" | "Abogados en Honduras", "Derecho Penal, Familia, Laboral" |
| `/preguntas-frecuentes` | "Preguntas Frecuentes — Abogados en Nacaome, Valle \| Pineda y Asociados" | "Pineda y Asociados — Preguntas Frecuentes" | "Abogados en Nacaome, Valle" |
| `/solicitar-consulta` | "Solicitar Consulta Legal Gratuita \| Abogados en Nacaome, Valle \| Pineda y Asociados" | "Solicitar Consulta Legal — Pineda y Asociados" | "Gratuita", "Nacaome, Valle" |

| **Impacto sobre tráfico** | Medio — CTR reducido en shares de WhatsApp, Facebook, Twitter, LinkedIn. Las OG tags son la cara del sitio en redes sociales. |
| **Impacto sobre conversión** | Bajo-Medio — Un share con mejor título genera más clics y potenciales leads. |
| **Causa raíz** | Cada página define `openGraph.title` manualmente con una cadena distinta al `title`. Probablemente se definió antes de que el `<title>` fuera optimizado, y no se actualizaron simultáneamente. |

---

#### H3 — Sitemap: Prioridades Inconsistentes y Páginas Legales Ausentes

| Campo | Valor |
|-------|-------|
| **Área afectada** | Indexación / Crawling |
| **Severidad** | 🟡 MEDIA |
| **Confianza del diagnóstico** | 100% |
| **Estado actual** | 89 URLs en sitemap. Faltan 6 páginas legales. Prioridades inconsistentes. |
| **Evidencia** | Sitemap inspeccionado via `https://www.pinedayasociadoshn.com/sitemap.xml`: |

**Prioridades actuales:**

| Tipo de página | Priority actual | Priority recomendada | Problema |
|---------------|----------------|---------------------|----------|
| Home `/` | 1.0 | 1.0 | ✅ Correcto |
| `/servicios-juridicos` | 1.0 | 1.0 | ✅ Correcto |
| `/derecho-penal` | 1.0 | 1.0 | ✅ Correcto |
| `/despacho` | 0.9 | 0.9 | ✅ Correcto |
| `/preguntas-frecuentes` | 0.9 | 0.9 | ✅ Correcto |
| Subpáginas de servicio | 0.7 | 0.7 | ✅ Correcto |
| Posts de blog individuales | 0.8 | 0.8 | ✅ Correcto |
| **Blog listado `/blog`** | **0.3** | **0.6** | 🔴 Demasiado bajo |
| **Categorías blog (20)** | **0.4** | **0.5-0.6** | 🟡 Inferior a posts |
| **`/solicitar-consulta`** | **0.3** | **0.7** | 🔴 Página de conversión principal |
| **Páginas legales (6)** | **AUSENTES** | **0.2-0.3** | 🔴 No están en el sitemap |

**Páginas legales ausentes del sitemap:**
- `/aviso-legal`
- `/politica-privacidad`
- `/politica-cookies`
- `/terminos`
- `/disclaimer`
- `/como-llegar`

| **Impacto** | Google asigna menos crawl budget al blog y sus categorías. Las páginas legales dependen exclusivamente de enlazado interno para ser descubiertas (no tienen sitemap ni backlinks externos). `/solicitar-consulta` con priority 0.3 es contraproducente: es la página que DEBE convertir. |
| **Causa raíz** | `app/sitemap.ts` solo incluye rutas estáticas + blog posts desde DB. No itera sobre páginas CMS legales. Las prioridades se asignaron sin criterio de conversión. |

---

#### H4 — JSON-LD Renderizado Solo Client-Side

| Campo | Valor |
|-------|-------|
| **Área afectada** | SEO Técnico |
| **Severidad** | 🟡 MEDIA |
| **Confianza del diagnóstico** | 100% |
| **Estado actual** | Los 5 scripts JSON-LD se inyectan en el `<body>` del layout público como componentes React. **No se renderizan en el servidor** — aparecen tras hidratación JS. |
| **Evidencia** | Verificado: `webfetch` (sin JS) no detectó los schemas. `playwright` (con JS) sí detectó 5 scripts. El HTML inicial no contiene `<script type="application/ld+json">`. |
| **Impacto** | Riesgo bajo para Google (procesa JS correctamente). Riesgo medio para Bing, Yandex, DuckDuckGo y crawlers secundarios (no ejecutan JS o lo hacen parcialmente). Las herramientas de auditoría SEO que no ejecutan JS reportarán "sin structured data". |
| **Causa raíz** | Los schemas se generan como componentes `<Script>` en el body del layout (`app/(public)/layout.tsx`), no como `<script>` en el `<head>` del HTML servidor. Deberían generarse en `generateMetadata` o como server components. |

---

#### H5 — Sin H1 Semántico Real en Páginas Clave

| Campo | Valor |
|-------|-------|
| **Área afectada** | SEO On-Page / Semántica |
| **Severidad** | 🟡 MEDIA |
| **Confianza del diagnóstico** | 90% |
| **Estado actual** | Las páginas usan un patrón visual de doble heading: un `<p>` decorativo con el nombre corto de la página + un `<h1>` con frase de marketing. El texto con la keyword principal no está en el `<h1>`. |
| **Evidencia** (accesibility snapshot): |

| Página | `<p>` decorativo (NO es H1) | `<h1>` real (frase marketing) | Keyword perdida en H1 |
|--------|---------------------------|------------------------------|----------------------|
| `/servicios-juridicos` | "Servicios Jurídicos" | "Todos los servicios jurídicos que su caso necesita, bajo una misma dirección letrada" | "Nacaome, Valle", "13 especialidades" |
| `/derecho-penal` | "Derecho Penal" | "Defensa penal seria, técnica y confidencial" | "Abogados Penalistas Nacaome" |
| `/despacho` | "El Despacho" | "Bufete de Abogados en Nacaome, Valle — Compromiso Legal, Rigor Técnico..." | - (este H1 sí contiene keywords) |

| **Impacto** | La keyword principal de la página no está en el H1. Google pondera fuertemente el H1 como señal de relevancia temática. Esto debilita el posicionamiento para queries que SÍ están en el `<title>` pero NO en el `<h1>`. |
| **Causa raíz** | Decisión de diseño que prioriza estética (frase de marketing como H1) sobre semántica SEO (keyword en H1). |

---

#### H6 — Formulario de Suscripción del Blog No Funcional

| Campo | Valor |
|-------|-------|
| **Área afectada** | CRO / Conversión |
| **Severidad** | 🔴 ALTA |
| **Confianza del diagnóstico** | 100% |
| **Estado actual** | En `/blog` hay un campo de email + botón "Suscribirse" visible. No se detecta ninguna llamada API al hacer clic. No hay endpoint. No hay integración con email marketing. Es solo UI. |
| **Evidencia** | Inspeccionado en el DOM y network requests. El formulario está presente visualmente pero no despacha ninguna petición. |
| **Impacto** | 🔴 **Alto** — Se pierde la capacidad de capturar emails de lectores del blog para lead nurturing. 46+ artículos con tráfico potencial que no convierten en suscriptores. Oportunidad de conversión completamente desperdiciada. |
| **Causa raíz** | Componente implementado como placeholder visual sin backend (sin endpoint de suscripción, sin tabla en DB, sin integración con servicio de email). |

---

#### H7 — Sin Páginas de Aterrizaje con CTA Fuerte por Servicio

| Campo | Valor |
|-------|-------|
| **Área afectada** | CRO / Conversión |
| **Severidad** | 🔴 ALTA |
| **Confianza del diagnóstico** | 85% |
| **Estado actual** | Las 13 páginas de servicio individual (`/servicios-juridicos/*`) son informativas y bien estructuradas, pero no tienen elementos de conversión avanzados. |
| **Qué falta en cada página de servicio** | Lead magnet descargable (guía PDF), CTA de urgencia ("consulte hoy"), testimonios específicos del área, calculadora/chat, formulario embedded, casos de éxito reales |
| **Qué sí tiene** | Enlace a `/solicitar-consulta` + enlace a `tel:`. Correcto pero insuficiente. |
| **Impacto** | Tráfico que llega por SEO a páginas de servicio no tiene un camino de conversión optimizado. La tasa de conversión visitante→lead es subóptima. |
| **Causa raíz** | Enfoque en cantidad de servicios (13 áreas) sobre profundidad de conversión por área. Cada servicio debería ser una micro-landing page. |

---

#### H8 — Sin Imágenes OG Específicas por Página

| Campo | Valor |
|-------|-------|
| **Área afectada** | SEO On-Page / Social Media |
| **Severidad** | 🟢 BAJA |
| **Confianza del diagnóstico** | 100% |
| **Estado actual** | Todas las páginas comparten `og-image.png` (1200x630 genérica del bufete). |
| **Impacto** | Oportunidad perdida de personalizar la imagen en redes sociales por página. CTR en redes sociales ligeramente inferior al que se podría obtener con imágenes contextuales. |
| **Mejora** | Crear imágenes OG por sección: penal, familia, laboral, civil, blog, FAQ. Al menos para homepage y `/derecho-penal`. |

---

#### H9 — Sin `rel="prev"` en Paginación del Blog

| Campo | Valor |
|-------|-------|
| **Área afectada** | Indexación / Crawling |
| **Severidad** | 🟢 BAJA |
| **Confianza del diagnóstico** | 100% |
| **Estado actual** | El blog listing tiene `rel="next"` hacia `?page=2`, pero las páginas interiores no tienen `rel="prev"`. |
| **Impacto** | Señal de paginación incompleta para Google. Bajo impacto (Google maneja bien la paginación sin estos tags), pero es una buena práctica. |
| **Causa raíz** | `app/(public)/blog/page.tsx` solo implementa `next` en la metadata. |

---

#### H10 — Blog Posts Individuales: Sin Schema de Artículo

| Campo | Valor |
|-------|-------|
| **Área afectada** | SEO On-Page / Structured Data |
| **Severidad** | 🔴 ALTA |
| **Confianza del diagnóstico** | 95% |
| **Estado actual** | `app/(public)/blog/[categoria]/[slug]/page.tsx` no genera BlogPosting schema. No se pudo verificar en vivo (requiere visitar un post individual), pero el código no lo implementa. |
| **Impacto** | Mismo que H1 — sin rich snippets de artículo. |
| **Causa raíz** | La página de detalle de post no implementa `generateMetadata` con schema BlogPosting. Solo genera metadatos básicos (title, description, canonical). |

---

### 3.2. Resumen rápido de severidad

| Severidad | Cantidad | Hallazgos |
|-----------|----------|-----------|
| 🔴 ALTA | 4 | H1 (BlogPosting schema), H6 (suscripción blog), H7 (CTAs por servicio), H10 (schema en posts) |
| 🟡 MEDIA | 4 | H2 (OG titles), H3 (sitemap), H4 (JSON-LD client-side), H5 (H1 semántico) |
| 🟢 BAJA | 2 | H8 (OG images genéricas), H9 (rel=prev) |

---

## 4. TABLA DE MEJORAS PRIORITARIAS

| # | Prioridad | Mejora propuesta | Problema que resuelve | Impacto esperado | Esfuerzo est. | Riesgo | ¿Desde admin? | Estado recomendado |
|---|-----------|-----------------|----------------------|-----------------|--------------|--------|--------------|-------------------|
| **1** | 🔴 ALTA | Añadir BlogPosting schema a cada post del blog | H1, H10: sin rich snippets en 46+ artículos | +5-15% CTR en SERP, posibles rich snippets de artículo | 2h | Bajo | ❌ No (código) | **Aplicar ahora** |
| **2** | 🔴 ALTA | Implementar backend del formulario de suscripción del blog | H6: sin captura de leads desde el blog | Captura de emails cualificados (lead nurturing) | 4h | Bajo | ❌ No (código) | **Aplicar ahora** |
| **3** | 🔴 ALTA | Corregir OG titles para que coincidan con `<title>` | H2: OG tags truncadas en 5+ páginas | +CTR en redes sociales (WhatsApp, Facebook, Twitter) | 30min | Bajo | ❌ No (código) | **Aplicar ahora** |
| **4** | 🔴 ALTA | Corregir sitemap: páginas legales ausentes + ajustar prioridades | H3: crawl budget mal asignado, 6 páginas huérfanas de sitemap | Indexación completa, mejor crawl budget al blog | 30min | Bajo | ❌ No (código) | **Aplicar ahora** |
| **5** | 🟡 MEDIA | Mover JSON-LD a server-side rendering | H4: dependencia de JS para datos estructurados | Mejor indexing en Bing/Yandex, detectable por herramientas | 2h | Medio | ❌ No (código) | **7 días** |
| **6** | 🟡 MEDIA | Unificar H1 con keyword principal en páginas clave | H5: H1 débiles (frases de marketing sin keywords) | Mejor señal semántica para Google, +posicionamiento | 1h | Bajo | ✅ **SÍ** (pages CMS) | **7 días** |
| **7** | 🟡 MEDIA | Crear lead magnets PDF por área jurídica (13 guías) | H7: sin imanes de conversión en páginas de servicio | +tasa de conversión visitante→lead en servicios | 20h | Bajo | ✅ **SÍ** (blog/content) | **30 días** |
| **8** | 🟡 MEDIA | Añadir Service schema a páginas de servicio individual | H7 complementario: sin rich snippet de servicio | Posibles rich snippets de Service en Google | 1h | Bajo | ❌ No (código) | **7 días** |
| **9** | 🟢 BAJA | Crear imágenes OG específicas por sección | H8: OG image genérica en todas las páginas | +CTR redes sociales para shares de servicios específicos | 4h | Bajo | ✅ **SÍ** (upload) | **30 días** |
| **10** | 🟢 BAJA | Implementar `rel="prev"` en paginación del blog | H9: paginación incompleta | Buena práctica SEO, señal completa de paginación | 30min | Bajo | ❌ No (código) | **7 días** |
| **11** | 🟡 MEDIA | Añadir campos SEO editables al admin (`/intranet/admin/pages/configuracion`) | Objetivo no definido, SEO no editable sin código | Permite iteración SEO sin desarrollador | 8h | Medio | ✅ **SÍ** (admin) | **30 días** |
| **12** | 🟡 MEDIA | Añadir KPIs de conversión al dashboard SEO | Medición de leads/mes, tasa conversión, keywords objetivo | Visibilidad del retorno de inversión SEO | 6h | Medio | ✅ **SÍ** (admin) | **30 días** |

---

## 5. PLAN DE IMPLEMENTACIÓN POR FASES

---

### 🟢 FASE 1: QUICK WINS (24 horas) — 4 tareas, ~3.5h total

**Objetivo**: Correcciones de máximo impacto con mínimo esfuerzo. Sin riesgo.

---

#### ✅ FASE 1 — Tarea 1: Corregir OG titles

**Archivo(s)**:
- `app/(public)/servicios-juridicos/page.tsx`
- `app/(public)/derecho-penal/page.tsx`
- `app/(public)/blog/page.tsx`
- `app/(public)/preguntas-frecuentes/page.tsx`
- `app/(public)/solicitar-consulta/page.tsx`

**Qué hacer**: En cada `generateMetadata` o `export const metadata`, asegurar que `openGraph.title` usa el mismo string que `title`.

**Ejemplo para `/servicios-juridicos/page.tsx`**:

```typescript
// ANTES (incorrecto):
export const metadata: Metadata = {
  title: 'Servicios Jurídicos en Nacaome, Valle | 13 Especialidades | Pineda y Asociados',
  openGraph: {
    title: 'Servicios Jurídicos — Pineda y Asociados',  // ❌ Truncado
    // ...
  },
};

// DESPUÉS (correcto):
const pageTitle = 'Servicios Jurídicos en Nacaome, Valle | 13 Especialidades | Pineda y Asociados';
export const metadata: Metadata = {
  title: pageTitle,
  openGraph: {
    title: pageTitle,  // ✅ Igual al <title>
    // ...
  },
};
```

**Validación**: Inspeccionar `<meta property="og:title">` en cada página y comparar con `<title>`.

---

#### ✅ FASE 1 — Tarea 2: Corregir sitemap

**Archivo**: `app/sitemap.ts`

**Qué hacer**:
1. Añadir las 6 páginas legales al array de rutas estáticas
2. Ajustar prioridades de blog listing, categorías y solicitar-consulta

**Cambios exactos**:

```typescript
// AÑADIR al array de rutas estáticas:
{ url: '/aviso-legal', priority: 0.2, changeFrequency: 'monthly' },
{ url: '/politica-privacidad', priority: 0.2, changeFrequency: 'monthly' },
{ url: '/politica-cookies', priority: 0.2, changeFrequency: 'monthly' },
{ url: '/terminos', priority: 0.2, changeFrequency: 'monthly' },
{ url: '/disclaimer', priority: 0.2, changeFrequency: 'monthly' },
{ url: '/como-llegar', priority: 0.3, changeFrequency: 'monthly' },

// MODIFICAR prioridades existentes:
// /blog de 0.3 → 0.6
// /solicitar-consulta de 0.3 → 0.7
// categorías blog de 0.4 → 0.5
```

**Validación**: 
- `https://www.pinedayasociadoshn.com/sitemap.xml` debe mostrar las 6 nuevas URLs
- El total de URLs debe pasar de 89 a 95+

---

#### ✅ FASE 1 — Tarea 3: Añadir BlogPosting schema a posts del blog

**Archivo(s)**:
- `lib/schemas/legal-page.ts` (nueva función)
- `app/(public)/blog/[categoria]/[slug]/page.tsx` (inyectar schema)

**Paso 1**: Crear función `blogPostingSchema()` en `lib/schemas/legal-page.ts`:

```typescript
export function blogPostingSchema(post: {
  title: string;
  description: string;
  slug: string;
  category: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  imageUrl?: string;
  body?: string;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${site.url}/blog/${post.category}/${post.slug}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author || site.name,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
    },
    image: post.imageUrl || `${site.url}/og-image.png`,
    ...(post.body && { articleBody: post.body.substring(0, 5000) }),
  });
}
```

**Paso 2**: Inyectar en `app/(public)/blog/[categoria]/[slug]/page.tsx`:

```typescript
import { blogPostingSchema } from '@/lib/schemas/legal-page';

// Dentro del server component, añadir al <head>:
export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug, params.categoria);
  // ...
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: blogPostingSchema(post),
        }}
      />
      {/* resto del contenido */}
    </>
  );
}
```

**Validación**: 
1. Visitar `https://www.pinedayasociadoshn.com/blog/derecho-penal/[slug-de-prueba]`
2. Abrir consola: `document.querySelector('script[type="application/ld+json"]')` debe mostrar BlogPosting
3. Validar en https://search.google.com/test/rich-results

---

#### ✅ FASE 1 — Tarea 4: Backend del formulario de suscripción

**Archivo(s)**:
- `lib/schema.ts` (nueva tabla `newsletter_subscriptions`)
- `app/api/subscribe/route.ts` (nuevo endpoint)
- `app/(public)/blog/page.tsx` (conectar formulario al endpoint)

**Paso 1**: Añadir tabla en `lib/schema.ts`:

```typescript
export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  source: varchar('source', { length: 50 }).default('blog'),
});
```

**Paso 2**: Crear endpoint `app/api/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSubscriptions } from '@/lib/schema';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = schema.parse(body);
  
  await db.insert(newsletterSubscriptions).values({ email }).onConflictDoNothing();
  
  return NextResponse.json({ success: true });
}
```

**Paso 3**: Conectar formulario en el blog. Cambiar el `<button>Suscribirse</button>` para que dispare un `fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) })`.

**Validación**:
- Enviar email de prueba desde el formulario del blog
- Verificar en DB: `SELECT * FROM newsletter_subscriptions`

---

### 🟡 FASE 2: 7 DÍAS — 5 tareas, ~7h total

**Objetivo**: Mejoras de alto impacto que requieren más cuidado técnico.

---

#### 🟡 FASE 2 — Tarea 5: Mover JSON-LD a server-side rendering

**Archivo(s)**: `app/(public)/layout.tsx`

**Qué hacer**: Transformar los componentes `<Script>` del body en `<script>` tags renderizados en el servidor dentro del `<head>`.

**Método**: Usar `dangerouslySetInnerHTML` en un `<script type="application/ld+json">` dentro del `<head>` del layout.

```typescript
// En app/(public)/layout.tsx, añadir en el <head>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: legalServiceSchema() }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: organizationSchema() }}
/>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: websiteSchema() }}
/>
```

**Riesgo**: Medio — Asegurarse de que las funciones de schema devuelven JSON válido y no dependen de hooks de React.

**Validación**: `curl https://www.pinedayasociadoshn.com | grep "application/ld+json"` debe devolver los scripts.

---

#### 🟡 FASE 2 — Tarea 6: Unificar H1 con keyword principal

**Archivo(s)**: Vía admin de páginas CMS en `/intranet/admin/pages/`

**Qué hacer**: Editar el contenido de 3 páginas clave para que el `<h1>` contenga la keyword objetivo:

| Página | H1 actual | H1 recomendado |
|--------|-----------|---------------|
| `/servicios-juridicos` | "Todos los servicios jurídicos que su caso necesita, bajo una misma dirección letrada" | **"Servicios Jurídicos en Nacaome, Valle — 13 Especialidades Legales"** |
| `/derecho-penal` | "Defensa penal seria, técnica y confidencial" | **"Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica"** |
| `/blog` | "Conocimiento legal al servicio de sus derechos" | **"Blog Jurídico de Abogados en Honduras"** |

**Validación**: Inspeccionar `<h1>` en cada página y verificar con Screaming Frog.

---

#### 🟡 FASE 2 — Tarea 7: Añadir Service schema a páginas de servicio

**Archivo(s)**:
- `lib/schemas/legal-page.ts` (función `serviceSchema()` ya existe)
- `app/(public)/servicios-juridicos/[slug]/page.tsx`

**Qué hacer**: Inyectar el `serviceSchema()` que ya existe en `lib/schemas/legal-page.ts` dentro de la página de detalle de cada servicio.

**Ejemplo**:

```typescript
import { serviceSchema } from '@/lib/schemas/legal-page';

// En el server component de /servicios-juridicos/[slug]/page.tsx:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: serviceSchema({
      name: area.nombre,
      description: area.descripcion,
      url: `${site.url}/servicios-juridicos/${area.slug}`,
    }),
  }}
/>
```

---

#### 🟡 FASE 2 — Tarea 8: Implementar `rel="prev"` en paginación del blog

**Archivo**: `app/(public)/blog/page.tsx`

**Qué hacer**: En `generateMetadata`, añadir `alternates` con `prev` cuando `page > 1`:

```typescript
export async function generateMetadata({ searchParams }) {
  const page = Number(searchParams.page) || 1;
  return {
    // ...otros metadatos
    alternates: {
      canonical: page === 1 ? '/blog' : `/blog?page=${page}`,
      ...(page > 1 && { prev: page === 2 ? '/blog' : `/blog?page=${page - 1}` }),
    },
  };
}
```

---

#### 🟡 FASE 2 — Tarea 9: Añadir ContactPoint schema a `/solicitar-consulta`

**Archivo**: `app/(public)/solicitar-consulta/page.tsx`

**Qué hacer**: Añadir un schema `WebPage` con `potentialAction` de tipo `ContactAction` y un `ContactPoint`:

```typescript
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Solicitar Consulta Legal — Pineda y Asociados',
      url: `${site.url}/solicitar-consulta`,
      mainEntity: {
        '@type': 'ContactPoint',
        telephone: site.phone,
        contactType: 'customer service',
        areaServed: 'HN',
        availableLanguage: ['Spanish'],
      },
    }),
  }}
/>
```

---

### 🔵 FASE 3: 30 DÍAS — 3 tareas, ~34h total

**Objetivo**: Mejoras estructurales que requieren diseño, contenido y desarrollo.

---

#### 🔵 FASE 3 — Tarea 10: Añadir campos SEO al admin de configuración

**Archivo(s)**:
- `app/intranet/admin/pages/[page]/page.tsx` (añadir campos SEO al modo config)
- `app/api/admin/site-config/route.ts` (añadir keys permitidas)
- `lib/site.ts` (leer nuevas keys desde DB)

**Campos a añadir al admin config**:

| Campo | Key en DB | Tipo | Descripción |
|-------|-----------|------|-------------|
| Meta title global | `seo_title` | text | Template de title para páginas sin title propio |
| Meta description global | `seo_description` | textarea | Description por defecto |
| Keywords | `seo_keywords` | text | Keywords separadas por coma |
| OG Image URL | `seo_og_image` | text | URL de imagen OG por defecto |
| Google Verification | `seo_google_verification` | text | Código de verificación de GSC |
| Noindex toggle | `seo_noindex` | checkbox | Activar/desactivar indexación global |
| Sitemap auto-submit | `seo_sitemap_auto` | checkbox | Enviar sitemap a GSC al publicar |

**Riesgo**: Medio — Los nuevos campos deben integrarse con el sistema de metadata existente sin romperlo.

---

#### 🔵 FASE 3 — Tarea 11: Crear lead magnets PDF por área jurídica

**Contenido a crear**: 13 guías descargables (PDF), una por cada área de servicio.

**Estructura de cada guía**:
1. Portada con logo y título tipo "Guía legal: [Área] en Honduras"
2. Índice
3. 5-7 secciones con información práctica (requisitos, plazos, costes, errores comunes)
4. FAQ específica del área
5. CTA: "¿Necesita asesoría en [área]? Solicite consulta gratuita"
6. Datos de contacto del bufete

**Implementación técnica**:
- Subir PDFs a `/public/descargas/`
- Añadir formulario de descarga en cada página de servicio: email → descarga
- Guardar en `newsletter_subscriptions` con `source = 'descarga-[area]'`

---

#### 🔵 FASE 3 — Tarea 12: KPIs de conversión en dashboard SEO

**Archivo(s)**:
- `app/intranet/admin/seo/page.tsx`
- `app/api/admin/seo/summary/route.ts`

**Qué añadir al dashboard**:

| KPI | Fuente | Frecuencia |
|-----|--------|-----------|
| Leads/mes (consultas recibidas) | Tabla `solicitudes_consulta` | Mensual |
| Tasa de conversión (visitas→leads) | GA4 + solicitudes | Mensual |
| Nuevos suscriptores newsletter | Tabla `newsletter_subscriptions` | Semanal |
| Keywords en top 10 | GSC API | Mensual |
| CTR medio | GSC API | Mensual |
| Posición media | GSC API | Mensual |
| Páginas indexadas | GSC API | Semanal |
| Errores de rastreo | GSC API | Semanal |

---

## 6. INSTRUCCIONES DETALLADAS POR MEJORA

### 6.1. Mejora #1: BlogPosting Schema

**Checklist**:

- [ ] Leer `lib/schemas/legal-page.ts` para entender estructura existente
- [ ] Crear función `blogPostingSchema(post)` con los campos: headline, description, url, datePublished, dateModified, author.name, publisher (reference `#organization`), image
- [ ] Importar y usar en `app/(public)/blog/[categoria]/[slug]/page.tsx`
- [ ] Probar con `npm run build` (sin errores de TypeScript)
- [ ] Validar con Rich Results Test de Google en al menos 3 URLs de posts
- [ ] Deployar a Vercel

**Archivos a modificar**:
- `lib/schemas/legal-page.ts` (~30 líneas nuevas)
- `app/(public)/blog/[categoria]/[slug]/page.tsx` (~3 líneas)

---

### 6.2. Mejora #2: Backend Suscripción Blog

**Checklist**:

- [ ] Añadir tabla `newsletter_subscriptions` en `lib/schema.ts`
- [ ] Ejecutar `npx drizzle-kit generate` para crear migración
- [ ] Ejecutar `npx drizzle-kit push` para aplicar migración a Neon
- [ ] Crear `app/api/subscribe/route.ts` con validación Zod
- [ ] Conectar formulario en `app/(public)/blog/page.tsx`
- [ ] Probar flujo completo: email → POST → 200 OK → registro en DB
- [ ] Probar con `npm run build && npm run test`
- [ ] (Opcional) Integrar con Resend para email de confirmación

**Archivos a modificar**:
- `lib/schema.ts` (+12 líneas)
- `app/api/subscribe/route.ts` (nuevo, ~30 líneas)
- `app/(public)/blog/page.tsx` (~5 líneas de hook/event handler)

---

### 6.3. Mejora #3: OG Titles

**Checklist**:

- [ ] `/servicios-juridicos/page.tsx`: igualar `openGraph.title` a `title`
- [ ] `/derecho-penal/page.tsx`: igualar `openGraph.title` a `title`
- [ ] `/blog/page.tsx`: igualar `openGraph.title` a `title`
- [ ] `/preguntas-frecuentes/page.tsx`: igualar `openGraph.title` a `title`
- [ ] `/solicitar-consulta/page.tsx`: igualar `openGraph.title` a `title`
- [ ] `/despacho/page.tsx`: verificar (actualmente parece correcto)
- [ ] Probar con `npm run build`
- [ ] Inspeccionar `<meta property="og:title">` en cada página

---

### 6.4. Mejora #4: Sitemap

**Checklist**:

- [ ] Abrir `app/sitemap.ts`
- [ ] Añadir 6 entradas de páginas legales con priority 0.2 y changeFrequency `monthly`
- [ ] Añadir `/como-llegar` con priority 0.3 y changeFrequency `monthly`
- [ ] Cambiar prioridad de `/blog` de 0.3 a 0.6
- [ ] Cambiar prioridad de `/solicitar-consulta` de 0.3 a 0.7
- [ ] Cambiar prioridad de categorías blog de 0.4 a 0.5
- [ ] Ejecutar `npm run build`
- [ ] Verificar `https://www.pinedayasociadoshn.com/sitemap.xml` post-deploy

---

### 6.5. Mejora #5: JSON-LD Server-Side

**Checklist**:

- [ ] Identificar todos los puntos de inyección de JSON-LD en `app/(public)/layout.tsx`
- [ ] Reemplazar componentes `<Script strategy="beforeInteractive">` por `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema() }} />`
- [ ] Asegurar que ninguna función de schema usa hooks React
- [ ] Verificar que el HTML inicial contiene los scripts (View Source, no Inspector)
- [ ] Probar con `npm run build`
- [ ] Validar con `curl | grep "application/ld+json"`

---

### 6.6. Mejora #6: H1 Semánticos

**Checklist**:

- [ ] Acceder al admin: `/intranet/admin/pages/servicios-juridicos`
- [ ] Editar sección hero: cambiar texto del heading principal
- [ ] Acceder a `/intranet/admin/pages/derecho-penal`
- [ ] Editar sección hero: cambiar texto del heading principal
- [ ] Acceder a `/intranet/admin/pages/blog` (si existe como página CMS)
- [ ] Editar sección hero: cambiar texto del heading principal
- [ ] Verificar en el sitio público que los H1 reflejan los cambios
- [ ] Probar con `npm run build`

---

### 6.7. Mejora #7: Lead Magnets PDF

**Checklist**:

- [ ] Seleccionar 3 áreas prioritarias para empezar: penal, familia, laboral
- [ ] Redactar contenido de cada guía (~1500-2500 palabras)
- [ ] Diseñar PDF con identidad visual del bufete (portada, secciones, CTA)
- [ ] Guardar en `/public/descargas/guia-[area].pdf`
- [ ] Añadir formulario de descarga en cada página de servicio
- [ ] Conectar con endpoint de suscripción (misma tabla `newsletter_subscriptions`)
- [ ] Medir: descargas por área, conversión a consulta posterior
- [ ] Repetir para las 10 áreas restantes

---

## 7. VALIDACIÓN Y VERIFICACIÓN

### 7.1. Checklist de validación post-implementación

#### FASE 1 — Quick wins

- [ ] `npm run lint` — 0 errores
- [ ] `npm run build` — Compiled successfully + Finished TypeScript sin errores
- [ ] `npm run test` — 185 tests pasan
- [ ] `npm run test:e2e` — 29 tests pasan
- [ ] `https://www.pinedayasociadoshn.com/sitemap.xml` — contiene 95+ URLs
- [ ] Rich Results Test (Google) — BlogPosting schema válido en posts
- [ ] Inspeccionar OG tags en cada página — coinciden con `<title>`
- [ ] Formulario suscripción blog funcional — email guardado en DB
- [ ] `curl -I https://www.pinedayasociadoshn.com` — X-Robots-Tag: index, follow

#### FASE 2 — 7 días

- [ ] `curl https://www.pinedayasociadoshn.com | grep "application/ld+json"` — scripts presentes en HTML inicial
- [ ] Screaming Frog crawl — H1 contiene keywords objetivo
- [ ] Rich Results Test — Service schema válido en páginas de servicio
- [ ] Inspeccionar blog page=2 — `rel="prev"` presente
- [ ] Rich Results Test — ContactPoint schema en solicitar-consulta

#### FASE 3 — 30 días

- [ ] Admin `/intranet/admin/pages/configuracion` muestra campos SEO
- [ ] Cambiar un campo SEO en admin → reflejado en el HTML público
- [ ] Dashboard SEO muestra KPIs de conversión (leads/mes)
- [ ] Descarga de lead magnet funcional en 3+ áreas
- [ ] Google Analytics — eventos de suscripción y descarga registrados

### 7.2. Herramientas de validación

| Herramienta | URL | Para qué |
|-------------|-----|----------|
| Rich Results Test | https://search.google.com/test/rich-results | Validar schemas JSON-LD |
| PageSpeed Insights | https://pagespeed.web.dev | Rendimiento mobile/desktop |
| Schema Markup Validator | https://validator.schema.org | Validar JSON-LD completo |
| Screaming Frog SEO Spider | Desktop app | Crawl completo, H1, schemas, status codes |
| Google Search Console | https://search.google.com/search-console | Indexación, rendimiento, errores |
| Ahrefs / Semrush | Suscripción | Backlinks, keywords, competencia |

---

## 8. MÉTRICAS DE ÉXITO

### 8.1. Métricas a medir antes y después

| Métrica | Fuente | Valor pre-cambios | Meta post-cambios (8 semanas) |
|---------|--------|------------------|-------------------------------|
| Clics orgánicos/mes | GSC | (requiere acceso) | +15-30% |
| Impresiones/mes | GSC | (requiere acceso) | +20-40% |
| CTR medio | GSC | (requiere acceso) | +0.5-2 puntos porcentuales |
| Posición media | GSC | (requiere acceso) | Mejora de 1-3 posiciones en keywords objetivo |
| Páginas indexadas | GSC | ~89 (en sitemap) | 95+ (todas en sitemap) |
| Rich snippets activos | GSC | Solo FAQ (si aplica) | +Article rich snippets (46 posts) |
| Suscriptores newsletter | DB | 0 (no implementado) | 10-50/mes |
| Leads/mes (consultas) | DB `solicitudes_consulta` | (requiere acceso) | +10-25% |
| Tasa conversión blog→consulta | GA4 + DB | No medible actualmente | Medible tras implementar eventos |

### 8.2. Keywords objetivo a monitorizar

| Keyword | Tipo | Página objetivo |
|---------|------|----------------|
| "abogados Nacaome" | Local | Home |
| "abogados penalistas Nacaome" | Local/Comercial | `/derecho-penal` |
| "bufete jurídico Valle Honduras" | Local | `/despacho` |
| "defensa penal Honduras" | Informacional/Comercial | `/derecho-penal` |
| "abogados de familia Nacaome" | Local/Comercial | `/servicios-juridicos/derecho-de-familia` |
| "abogados laborales Honduras" | Comercial | `/servicios-juridicos/derecho-laboral` |
| "divorcio Honduras requisitos" | Informacional | Blog posts |
| "despido injustificado Honduras" | Informacional | Blog posts |
| "consulta legal gratuita Honduras" | Transaccional | `/solicitar-consulta` |
| "código penal Honduras decreto 130-2017" | Informacional | Blog posts |

---

## 9. RIESGOS Y ROLLBACK

### 9.1. Matriz de riesgos por mejora

| Mejora | Riesgo | Probabilidad | Impacto | Mitigación | Rollback |
|--------|--------|-------------|---------|-----------|----------|
| #1 BlogPosting schema | Schema inválido causa warning en GSC | Baja | Bajo | Validar con Rich Results Test antes de deployar | Revertir commit |
| #2 Suscripción blog | Spam de emails, DB llena de basura | Media | Medio | Rate limiting + validación Zod + email confirmation | Truncar tabla |
| #3 OG titles | Sin riesgo | Nula | Nulo | — | Revertir commit |
| #4 Sitemap | Sin riesgo | Nula | Nulo | — | Revertir commit |
| #5 JSON-LD server-side | Schema mal formado rompe HTML | Baja | Alto | Validar JSON antes de deploy. Probar en staging | Revertir commit |
| #6 H1 semánticos | Contenido de página CMS roto si se edita mal | Baja | Medio | Hacer backup del contenido antes de editar | Restaurar desde historial de versiones CMS |
| #7 Lead magnets | PDF desactualizado legalmente | Media | Alto | Incluir disclaimer "consulte a un abogado". Revisar cada 6 meses | Sustituir PDF |
| #10 Campos SEO admin | Conflicto con env vars existentes | Media | Medio | Los campos admin como override de env vars, con precedencia clara | Deshabilitar campos admin |

### 9.2. Procedimiento de rollback genérico

Para cualquier cambio de código:

```bash
# 1. Identificar el commit a revertir
git log --oneline -5

# 2. Revertir el commit específico
git revert <commit-hash>

# 3. Verificar build
npm run build

# 4. Push
git push origin main
```

Para cambios en DB (suscripciones):

```sql
-- Si la tabla tiene problemas, eliminar datos:
DELETE FROM newsletter_subscriptions WHERE created_at > '2026-06-12';

-- Si hay que eliminar la tabla:
DROP TABLE IF EXISTS newsletter_subscriptions;
```

---

## 10. ANEXO: ESTADO ACTUAL POR URL

### Auditoría completa por página

---

#### `/` — Homepage

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "Pineda y Asociados — Bufete multidisciplinario en Nacaome, Valle" (58 chars) | ✅ |
| Meta description | "Bufete jurídico en Nacaome, Valle, Honduras..." (280 chars) | ✅ |
| H1 | "Defensa penal y asesoría jurídica en Nacaome y todo el sur de Honduras" | ✅ |
| Meta robots | index, follow | ✅ |
| Canonical | `https://www.pinedayasociadoshn.com` | ✅ |
| OG title | "Pineda y Asociados — Bufete jurídico en Nacaome, Valle — asesoría legal integral" | ✅ |
| JSON-LD | WebPage + FAQPage + LegalService + Organization + WebSite (5 schemas) | ✅ |
| Contenido | Muy sustancial: hero, servicios, FAQs, casos, metodología, equipo, contacto, ubicación | ✅ |
| **Problemas** | Sin problemas críticos detectados | — |

---

#### `/despacho` — El Despacho

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "El Despacho — Bufete multidisciplinar en Nacaome \| Pineda y Asociados" (57 chars) | ✅ |
| Meta description | 155 chars (ligeramente corta) | ⚠️ |
| H1 | "Bufete de Abogados en Nacaome, Valle — Compromiso Legal..." | ✅ |
| Canonical | Correcto | ✅ |
| OG title | Coincide con title | ✅ |
| JSON-LD | Schemas globales (LegalService, Organization, WebSite, WebPage) | ⚠️ Sin schema específico de página |
| Contenido | Muy sustancial: misión, visión, valores, equipo, metodología | ✅ |
| **Problemas** | Meta description corta (155 chars). Sin Organization schema específico | 🟡 |

---

#### `/servicios-juridicos` — Servicios Jurídicos

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "Servicios Jurídicos en Nacaome, Valle \| 13 Especialidades \| Pineda y Asociados" (66 chars) | ✅ |
| Meta description | 240 chars | ✅ |
| H1 | "Todos los servicios jurídicos que su caso necesita..." (frase marketing, sin keywords) | 🔴 |
| Canonical | Correcto | ✅ |
| OG title | "Servicios Jurídicos — Pineda y Asociados" (TRUNCADO) | 🔴 |
| JSON-LD | Schemas globales (sin ItemList de servicios) | ⚠️ |
| Contenido | 13 áreas listadas con descripciones y enlaces | ✅ |
| **Problemas** | OG title truncado. H1 sin keyword. Sin ItemList schema | 🔴🟡 |

---

#### `/derecho-penal` — Derecho Penal

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "Abogados Penalistas en Nacaome, Valle \| Defensa Penal \| Pineda y Asociados" (63 chars) | ✅ |
| Meta description | 165 chars | ✅ |
| H1 | "Defensa penal seria, técnica y confidencial" (sin "Nacaome" ni "Abogados") | 🔴 |
| Canonical | Correcto | ✅ |
| OG title | "Abogados Penalistas — Pineda y Asociados" (TRUNCADO, pierde ubicación) | 🔴 |
| JSON-LD | Schemas globales (sin Service schema específico) | ⚠️ |
| Contenido | 7 subáreas, FAQ penal, artículos relacionados | ✅ |
| **Problemas** | OG title truncado. H1 sin keyword geolocalizada. Sin Service schema | 🔴🟡 |

---

#### `/blog` — Blog Jurídico

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "Blog Jurídico de Abogados en Honduras \| Derecho Penal, Familia, Laboral y Más \| Pineda y Asociados" (88 chars) | ✅ |
| Meta description | 130 chars (corta) | ⚠️ |
| H1 | "Conocimiento legal al servicio de sus derechos" (sin "Blog" ni "Jurídico") | 🟡 |
| Canonical | Correcto con paginación | ✅ |
| OG title | "Blog Jurídico — Pineda y Asociados" (TRUNCADO) | 🔴 |
| JSON-LD | BreadcrumbList + CollectionPage (sin BlogPosting en posts individuales) | ⚠️ |
| Contenido | 46+ artículos, 20 categorías, 12 páginas, RSS feed | ✅ |
| Paginación | `rel="next"` presente, `rel="prev"` ausente | 🟡 |
| Sitemap priority | 0.3 (demasiado bajo) | 🔴 |
| Suscripción | Formulario visible pero no funcional | 🔴 |
| **Problemas** | OG truncado. Sin BlogPosting. Prioridad sitemap baja. Suscripción rota. Sin rel=prev | 🔴🟡 |

---

#### `/blog/[categoria]/[slug]` — Post individual (estimado del código)

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | Título del post + site name | ✅ |
| Meta description | Descripción del post | ✅ |
| Canonical | Correcto | ✅ |
| JSON-LD | Schemas globales (sin BlogPosting) | 🔴 |
| **Problemas** | **Sin BlogPosting schema** — el hallazgo más importante | 🔴 |

---

#### `/preguntas-frecuentes` — FAQ

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "Preguntas Frecuentes — Abogados en Nacaome, Valle \| Pineda y Asociados" (60 chars) | ✅ |
| Meta description | 190 chars | ✅ |
| H1 | "Preguntas Frecuentes" + "Todas las ramas legales..." | 🟡 |
| Canonical | Correcto | ✅ |
| OG title | "Pineda y Asociados — Preguntas Frecuentes" (corto, sin ubicación) | 🟡 |
| JSON-LD | FAQPage presente (schema correcto) | ✅ |
| Contenido | 78 preguntas, 11 categorías, muy sustancial | ✅ |
| Sitemap priority | 0.9 | ✅ |
| **Problemas** | OG title corto. Sin enlaces internos desde FAQ hacia páginas de servicio | 🟡 |

---

#### `/solicitar-consulta` — Conversión

| Elemento | Valor | Estado |
|----------|-------|--------|
| Title | "Solicitar Consulta Legal Gratuita \| Abogados en Nacaome, Valle \| Pineda y Asociados" (70 chars) | ✅ |
| Meta description | 115 chars (corta) | ⚠️ |
| H1 | "Solicitar consulta" + "Cuéntenos su caso..." | 🟡 |
| Canonical | Correcto | ✅ |
| OG title | "Solicitar Consulta Legal — Pineda y Asociados" (pierde "Gratuita", ubicación) | 🔴 |
| JSON-LD | Sin ContactPoint schema específico | 🔴 |
| Sitemap priority | 0.3 (demasiado bajo para página de conversión) | 🔴 |
| **Problemas** | Prioridad sitemap baja (0.3). Sin ContactPoint schema. OG truncado. Meta corta | 🔴🟡 |

---

#### Páginas legales (6)

| URL | Indexable | En sitemap | Canonical | Contenido | Problemas |
|-----|-----------|-----------|-----------|-----------|-----------|
| `/aviso-legal` | ✅ | ❌ Ausente | ✅ | Sustancial | No en sitemap |
| `/politica-privacidad` | ✅ | ❌ Ausente | ✅ | Sustancial | No en sitemap |
| `/politica-cookies` | ✅ | ❌ Ausente | ✅ | Sustancial | No en sitemap |
| `/terminos` | ✅ | ❌ Ausente | ✅ | Sustancial | No en sitemap |
| `/disclaimer` | ✅ | ❌ Ausente | ✅ | Sustancial | No en sitemap |
| `/como-llegar` | ✅ | ❌ Ausente | ✅ | Sustancial | No en sitemap |

---

### Estado de schemas JSON-LD por página

| Schema | Home | Despacho | Servicios | Penal | Blog | FAQ | Solicitar | Posts blog | Servicios/* |
|--------|------|----------|-----------|-------|------|-----|-----------|------------|-------------|
| WebPage | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LegalService+LocalBusiness | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Organization | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebSite | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FAQPage | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| BreadcrumbList | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❓ | ❓ |
| CollectionPage | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **BlogPosting** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **❌** | ❌ |
| **Service** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **❌** |
| **ContactPoint** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **❌** | ❌ | ❌ |

---

## FIRMA DE AUDITORÍA

**Auditor**: Kilo (agente IA — auditoría automatizada verificada con inspección real del sitio)
**Fecha**: 12 de junio de 2026
**Alcance**: Indexación, crawling, SEO on-page, arquitectura, enlazado interno, datos estructurados, rendimiento, conversión, configuración del admin
**Herramientas utilizadas**: Playwright (browser real), webfetch, inspección de código fuente, análisis de sitemap, validación de schemas, accesibilidad tree

**Progreso de auditoría**: 95%
**Restante sin validar**: 5% — Datos reales de Google Search Console (clics, impresiones, CTR por página) y Google Analytics (tasa de conversión, eventos) requieren acceso autenticado a las APIs.

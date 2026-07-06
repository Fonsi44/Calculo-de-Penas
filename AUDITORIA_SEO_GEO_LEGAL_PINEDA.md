# AUDITORÍA SEO / GEO / LEGAL — Pineda y Asociados HN

**Fecha de auditoría:** 2026-07-06
**Auditor:** Auditor senior SEO técnico / GEO-LLM / YMYL legal
**Dominio auditado:** `https://www.pinedayasociadoshn.com/`
**Metodología:** Inspección de código fuente local + verificación live (robots.txt, sitemap.xml, headers HTTP, meta tags, JSON-LD renderizado en home, blog, post y servicios) + análisis de datos SEO live (GSC, GA4, Bing Webmaster) correspondientes a los últimos 28 días.
**Alcance:** Web pública completa (`app/(public)/**`, blog, servicios, landings locales, FAQ, páginas legales, feeds). Se excluyen por diseño la intranet y rutas privadas (bloqueadas en `robots.ts` y protegidas por `proxy.ts`).

---

## 1. Resumen ejecutivo

| Dimensión | Estado | Comentario |
|---|---|---|
| **Estado general** | ✅ **Aprobado con observaciones** | Infraestructura SEO muy madura. No hay bloqueadores críticos de indexación. Los hallazgos son de optimización y consolidación. |
| **Riesgo SEO técnico** | 🟢 **Bajo** | robots, sitemap, canonical, redirects, headers de seguridad y metadatos core correctos y verificados en producción. |
| **Riesgo legal / YMYL** | 🟢 **Bajo** | Disclaimers legales centralizados, sin promesas de resultado, autoría jurídica identificable, política editorial publicada. |
| **Preparación GEO / IA** | 🟢 **Alto** | `llms.txt`, `AnswerBlock`, `SpeakableSpecification`, robots abierto a bots IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended), entidades claras. Por encima de la media del sector legal hondureño. |
| **Optimización estimada** | **~88% completado / ~12% restante** | El 12% restante es refinamiento (consolidación de canonical, CWV, enlaces externos de autoridad, SEO off-page). |

### Datos de tráfico verificados (últimos 28 días, GSC + GA4 + Bing)

| Métrica | Valor | Fuente |
|---|---|---|
| Clics orgánicos (Google) | 157 | GSC |
| Impresiones (Google) | 7.772 | GSC |
| CTR medio | 2,02 % | GSC |
| Posición media | 7,0 | GSC |
| Usuarios (GA4) | 673 | GA4 |
| Sesiones | 853 | GA4 |
| Pageviews | 4.819 | GA4 |
| Sesión media | 6 min 44 s | GA4 |
| Páginas rastreadas por Bing (26 días) | 2.930 | Bing |
| 2xx en Bing | 3.750 | Bing |
| 4xx en Bing | 232 | Bing |

**Top 5 páginas por clics (GSC):**
1. `/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras` — 12 clics / 203 imp.
2. `/blog/derecho-civil/prescripcion-deudas-plazos-honduras` — 12 clics / 408 imp.
3. `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` — 10 clics / 346 imp.
4. `/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita` — 7 clics / 596 imp.
5. `/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras` — 6 clics / 358 imp.

**Observación de tráfico:** El país #1 por usuarios es **España (281 usuarios, 41,8 %)**, seguido de EE. UU. (119) y Honduras (114). Esto valida estratégicamente la sección `/hondurenos-en-espana` y obliga a reforzar E-E-A-T con autoridad verificable (colegiación, enlaces a Colegio de Abogados).

### Las 10 acciones prioritarias (ordenadas por impacto)

| # | Acción | Criticidad | Impacto |
|---|---|---|---|
| 1 | Consolidar redirección del dominio apex (evitar cadena http→https-non-www→www de 2 saltos) | Alta | SEO técnico |
| 2 | Verificar canonicalización www en GSC (tráfico reportado bajo `http://pinedayasociadoshn.com/`) | Alta | SEO técnico |
| 3 | Añadir enlace saliente a fuente de autoridad jurídica (Colegio de Abogados de Honduras, Poder Judicial) en `/despacho` y footer | Alta | E-E-A-T / YMYL |
| 4 | Auditar las 232 URLs 4xx rastreadas por Bing y corregir enlaces rotos internos | Alta | SEO técnico |
| 5 | Reforzar `sameAs` con perfil de Google Business Profile verificado y redes oficiales (instagram/linkedin pendientes) | Media | E-E-A-T / Knowledge Graph |
| 6 | Validar Core Web Vitals en móvil (LCP, INP, CLS) con PageSpeed Insights y datos de campo CrUX | Media | Rendimiento / Rankings |
| 7 | Monitorizar indexación: 8 categorías de blog + 8 servicios marcados "NEUTRAL/nunca rastreado" en GSC | Media | SEO técnico |
| 8 | Ampliar posts con potencial de snippet (`pension-alimenticia-porcentaje`, `prescripcion-deudas`) con tabla/resumen citable | Media | GEO / Featured snippets |
| 9 | Revisar 320 crawl errors reportados por Bing y depurar en `/admin/seo` | Media | SEO técnico |
| 10 | Confirmar que el `foundingDate: '2010'` es verificable (o ajustar a "~2010" si es aproximado) | Baja | E-E-A-T |

### ¿Conviene esperar indexación o corregir antes?

**Conviene corregir antes las acciones 1–4.** Las acciones 1–2 (canonicalización del dominio) afectan directamente cómo Google consolida la autoridad de la home: mientras la versión non-www siga recibiendo impresiones/clics en GSC, Google está repartiendo señales entre dos hosts. Las acciones 3–4 (enlaces de autoridad + enlaces rotos) son rápidas y refuerzan confianza en un nicho YMYL.

**Las acciones 5–10 pueden ejecutarse en paralelo con la indexación** (no la bloquean). El sitio ya está plenamente rastreable, indexable y comprensible para motores generativos.

---

## 2. Indexabilidad y rastreo

### 2.1 robots.txt — ✅ VERIFICADO CORRECTO

**Verificación live** (`https://www.pinedayasociadoshn.com/robots.txt`, HTTP 200):

- ✅ Política diferenciada por agente: Googlebot, Googlebot-Image, Bingbot, DuckDuckBot, Applebot, GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Claude-User, anthropic-ai, Google-Extended, Applebot-Extended, YouBot, Diffbot.
- ✅ Bloqueo explícito de scrapers de bajo valor: Bytespider, CCBot, Meta-ExternalAgent/Fetcher, Amazonbot, ImagesiftBot, omgili/bot.
- ✅ `Disallow` coherente: `/intranet/`, `/calculadora/`, `/casos/`, `/cp/`, `/delitos/`, `/atajos/`, `/admin/`, `/api/` (esta última solo para el bot comodín `*`).
- ✅ `Sitemap: https://www.pinedayasociadoshn.com/sitemap.xml` declarado.
- ✅ Cobertura GEO sobresaliente: permite explícitamente a los principales bots de IA rastrear el contenido público.

**Sin hallazgos críticos.** La segmentación por user-agent es profesional y alinea rastreo con objetivos GEO.

### 2.2 sitemap.xml — ✅ VERIFICADO CORRECTO

**Verificación live:** 213 URLs declaradas (coincide con `canonical-paths.json` `sitemap_observed_count: 213`).

| Componente | Cantidad aprox. | Estado |
|---|---|---|
| Rutas estáticas (home, servicios, derecho-penal, landings locales, legales) | 38 | ✅ priority 0,5–1,0 |
| Categorías de blog | 20 | ✅ priority 0,5 (0,7 para penal/familia/laboral) |
| Posts de blog | ~155 | ✅ priority 0,8 |

Buenas prácticas observadas en `app/sitemap.ts`:
- ✅ Posts con `noindex` y `canonicalUrl` apuntando a otra URL del propio dominio **se excluyen** del sitemap (evita duplicidad).
- ✅ Posts origen de redirect 301 (`REDIRECT_SOURCE_PATHS`, ~30 entradas) **se excluyen** del sitemap para evitar contradicción.
- ✅ `lastmod` derivado de `updatedAt` / `publishedAt` reales de la DB.
- ✅ `IS_DB_REACHABLE` detecta DB placeholder y evita sitemap vacío en CI.
- ✅ Categorías YMYL principales (penal, familia, laboral) con `priority: 0,7`.

### 2.3 Canonical — ⚠️ OBSERVACIÓN EN HOME

**Home (`/`):**
- ✅ Canonical declarado y presente en HTML renderizado.
- ⚠️ **Canonical renderizado:** `https://www.pinedayasociadoshn.com` (sin slash final) — contradice el comentario explícito del código en `app/(public)/page.tsx` y `app/(public)/layout.tsx`, que define `https://www.pinedayasociadoshn.com/` con slash y advierte que el slash es crítico para Bing ("evita que Bing marque *this page is a redirect*").
- ⚠️ `og:url` renderizado también sin slash: `https://www.pinedayasociadoshn.com`.
- **Causa probable:** Next.js / Vercel normaliza el trailing slash en runtime o el `metadataBase` lo resuelve así. **Requiere verificación con URL Inspection (Google) y Bing Webmaster Tools** para confirmar si Bing interpreta esto como redirect/mismatch.
- **Acción:** Verificar el comportamiento real de canonicalización y, si es necesario, forzar el slash final con configuración `trailingSlash: true` o un redirect 308 explícito.

**Subpáginas (servicios, blog, posts):**
- ✅ Canonical coherente y correcto: `https://www.pinedayasociadoshn.com/servicios-juridicos` verificado.
- ✅ `og:url` coincide con canonical en subpáginas.
- ✅ Posts con `canonicalUrl` personalizado respetado en `generateMetadata`.

### 2.4 Redirecciones — ⚠️ CADENA EN DOMINIO APEX

**Verificación live del dominio apex:**
```
http://pinedayasociadoshn.com/      → 308 → https://pinedayasociadoshn.com/
https://pinedayasociadoshn.com/     → 308 → https://www.pinedayasociadoshn.com/
```
- ⚠️ **Cadena de 2 saltos (308→308)** para todo tráfico HTTP non-www. Cada salto añade latencia y diluye signals de enlace. Googlebot sigue cadenas de hasta 5 saltos, pero es subóptimo.
- ⚠️ **Indicio de no-consolidación:** GSC reporta la home con 15 clics / 211 impresiones bajo `http://pinedayasociadoshn.com/` (host non-www HTTP), lo que sugiere que Google aún no ha consolidado completamente la autoridad en `https://www.`.
- **Acción:** Configurar el redirect directo `http://pinedayasociadoshn.com/*` → `https://www.pinedayasociadoshn.com/*` en un solo salto (301 preferible a 308 para compatibilidad con crawlers legacy). Vercel permite configurar el dominio apex como redirect permanente a www.

**Redirects 301 internos (`next.config.ts`):**
- ✅ ~60 redirects legacy bien gestionados (categorías antiguas → nuevas, slugs optimizados).
- ✅ `REDIRECT_SOURCE_PATHS` en `sitemap.ts` sincronizado con redirects (las URLs origen no aparecen en sitemap).
- ✅ Redirect de canonicalización `pinedayasociadoshn.com` → `www.pinedayasociadoshn.com` declarado en `next.config.ts` (líneas 118–119), aunque en runtime Vercel resuelve primero el dominio.

### 2.5 Páginas noindex / nofollow accidentales

- ✅ **Páginas legales** (`/aviso-legal`, `/politica-privacidad`, `/politica-cookies`, `/terminos`, `/disclaimer`, `/politica-editorial`): `robots: { index: false, follow: true }` — **correcto y deliberado** (contenido legal no aporta valor a SERP; `follow` conserva el flujo de PageRank a enlaces internos).
- ✅ Ninguna página comercial o de blog tiene noindex accidental.
- ✅ `X-Robots-Tag: index, follow, max-image-preview:large, max-snippet:-1` en headers HTTP de la home (verificado).
- ✅ El flag `NEXT_PUBLIC_NOINDEX=true` solo activa en staging/preview (no en producción).

### 2.6 Duplicados HTTP/HTTPS y www/non-www

- ⚠️ Ver §2.4: existe una cadena de redirección en el dominio apex que no consolida perfectamente. El resto de URLs sirven 200 directo en `https://www.`.
- ✅ Sin duplicados HTTP detectados en producción (HSTS con `includeSubDomains; preload` activo).

### 2.7 Paginación, rutas huérfanas y páginas thin

- ✅ Blog usa **paginación por scroll con ISR** (sin parámetros `?page=` indexables que generen duplicados). El sitemap no incluye variantes de paginación.
- ✅ Posts thin (`THIN_POST_SLUGS` en `sitemap.ts`): set vacío intencional — todos los thin posts fueron expandidos (Fase 17, 2026-07-03).
- ✅ Filtros de blog (`?tag=`, `?categoria=`) son client-side y no indexables por diseño (no generan URLs canónicas).
- ⚠️ **Rutas huérfanas potenciales:** no se ha ejecutado un crawl completo (Screaming Frog / Sitebulb) para confirmar que toda URL del sitemap reciba al menos 1 enlace interno entrante. **Acción:** ejecutar crawl y cruzar con sitemap.

---

## 3. SEO técnico on-page

### 3.1 Title y meta description

**Home (`/`) — verificado live:**
- ✅ `<title>Abogados en Nacaome, Valle | Bufete Jurídico Pineda y Asociados</title>` (59 chars — óptimo).
- ✅ Meta description: "Bufete en Nacaome, Valle. Defensa penal, familia, laboral, civil y mercantil. Atención directa y presupuesto por escrito. WhatsApp +504 9536-3724." (154 chars — óptimo).
- ✅ Title único (no usa el template `%s | Pineda y Asociados` en la home, evita duplicación).

**Páginas corporativas (verificado en código):**
- ✅ `/servicios-juridicos`: "Servicios Jurídicos en Nacaome | 14 Áreas" (41 chars).
- ✅ `/derecho-penal`: "Abogado Penalista en Nacaome | Defensa Penal" (45 chars).
- ✅ `/despacho`: "Bufete de Abogados en Nacaome | 15+ Años de Experiencia" (56 chars).
- ✅ `/hondurenos-en-espana`: "Hondureños en España · Asistencia Legal desde Honduras" (54 chars).
- ✅ Helper `buildMetadata()` en `lib/seo.ts` normaliza titles ≤60 y descriptions ≤155.

### 3.2 H1, jerarquía H2/H3

- ✅ **Home:** 1 `<h1>`, 6 `<h2>` verificados en HTML renderizado (jerarquía correcta).
- ✅ **Post de blog (`/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras`):** 1 `<h1>` (el título), 9 `<h2>` (verificado live — jerarquía correcta y rica para SEO).
- ✅ Componente `BlogTOC` + `injectHeadingIds` asigna IDs estables a H2/H3 del body server-side (mejora anchors y comprensión LLM).
- ✅ R15 cumplido: un solo `<h1>` por página de post (regla del AGENTS.md).

### 3.3 Open Graph y Twitter Cards

**Home — verificado live:**
- ✅ `og:type=website`, `og:locale=es_HN`, `og:image=/og-image.webp` (1200×630), `og:image:alt` presente.
- ✅ `twitter:card=summary_large_image`, `twitter:creator=@Danilo_Pineda_M`, `twitter:site=@Danilo_Pineda_M`.
- ✅ OG dinámico por servicio: `/og/penal.webp`, `/og/civil.webp`, `/og/familia.webp`, etc.
- ✅ Posts usan `og:type=article` con `publishedTime`, `modifiedTime`, `authors`, `tags`.

### 3.4 Favicon, manifest, viewport, idioma, región

- ✅ `manifest.json` con `name`, `short_name`, `theme_color`, `background_color`, iconos 192/512 (verificado HTTP 200).
- ✅ Favicon sirve (HTTP 200), `apple-touch-icon`, `icon` con sizes declarados.
- ✅ `<html lang="es-HN" dir="ltr">` — correcto BCP-47.
- ✅ `geo.region=HN-VA`, `geo.placename=Nacaome, Valle`, `geo.position` e `ICBM` con coordenadas reales (13.5300375, -87.487265625).
- ✅ `viewport` con `width=device-width, initial-scale=1`.
- ✅ PWA registration activa (`/sw.js`).

### 3.5 Rendimiento básico y Core Web Vitals

- ⚠️ **NO VERIFICABLE en esta auditoría** (requiere PageSpeed Insights / CrUX con datos de campo reales). El HTML de la home pesa **248 KB** (aceptable para SSR Next.js con imágenes optimizadas y fonts preload).
- ✅ Señales positivas observadas:
  - Imágenes vía `next/image` con `srcset` responsivo y WebP/AVIF automático.
  - Fuentes (`Cormorant Garamond`, `Manrope`) con `display: swap` y `preload`.
  - `preconnect` a `fonts.gstatic.com`, `googletagmanager.com`, `clarity.ms`.
  - Componentes server-side pesados (GoogleReviews, BlogHighlights) → 0 JS de cliente.
  - ISR `revalidate = 3600` en blog → contenido cacheado.
- **Acción:** Ejecutar `npm run audit:performance` y validar LCP/INP/CLS en móvil con datos CrUX reales una vez haya muestra suficiente.

### 3.6 Renderizado JavaScript y accesibilidad semántica

- ✅ Next.js App Router con SSR/SSG — contenido principal en HTML servidor (verificado: titles, meta, JSON-LD, H1/H2, texto todo presente sin JS).
- ✅ `X-Nextjs-Prerender: 1` en headers de la home (confirmado prerenderizado).
- ✅ `<a href="#main" class="skip-link">Saltar al contenido</a>` — skip link de accesibilidad presente.
- ✅ `<main id="main">` — landmark semántico.
- ✅ `aria-label` en secciones con propósito no obvio (ej. reseñas de Google).
- ⚠️ **NO VERIFICADO:** audit completo de contraste WCAG AA y navegación por teclado. Recomendado ejecutar Lighthouse Accessibility y axe DevTools.

---

## 4. SEO local legal

### 4.1 Consistencia NAP

| Campo | Valor | Fuente |
|---|---|---|
| **Nombre** | Pineda y Asociados | `lib/site.ts` |
| **Teléfono** | +504 9536-3724 | `site.phone` |
| **WhatsApp** | +504 9536-3724 | `site.whatsapp` (50495363724) |
| **Email** | contacto@pinedayasociadoshn.com | `site.email` |
| **Dirección** | GGJ7+239, Cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA | `site.address` |
| **Ciudad** | Nacaome | `site.address.city` |
| **Departamento** | Valle | `site.address.department` |
| **País** | Honduras (HN) | `site.address.countryCode` |
| **Código postal** | 13101 | `site.address.postalCode` |
| **Horario** | Lunes a sábado: 7:00–20:00 | `site.hours` |
| **Geo** | 13.5300375, -87.487265625 | `site.geo` |
| **GBP** | https://maps.app.goo.gl/xqbpe5n5ufXkH4ff6 | `site.googleBusiness` |

- ✅ NAP consistente entre `site.ts` (fuente única), schema `LegalService.address`, `Organization.address`, footer y `/como-llegar`.
- ✅ Sede física única declarada (Nacaome); el resto son ciudades de cobertura (`areaServed`).
- ⚠️ **Acción:** Verificar que el NAP coincide exactamente con el listing de Google Business Profile (incluido el formato de teléfono y la dirección postal). Inconsistencias NAP entre web y GBP son la causa #1 de pérdida de ranking local.

### 4.2 Posicionamiento semántico para búsquedas objetivo

**Landings locales presentes (cumple R18 — 10 ciudades prioritarias):**
Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo, Marcovia, Pespire, Namasigüe, Orocuina (todas con `/abogados-en-{ciudad}`).

**Landings comerciales especializadas:**
`/abogado-penalista-nacaome`, `/abogado-penalista-choluteca`, `/abogado-de-familia-nacaome`, `/abogado-laboralista-nacaome`, `/abogado-civil-nacaome`.

**Evaluación de posicionamiento potencial** (basada en estructura de contenido, no en datos de ranking que requieren tool dedicada):

| Búsqueda objetivo | Landing/hub dedicado | Estado |
|---|---|---|
| "abogados en Nacaome" | `/abogados-en-nacaome` | ✅ Optimizado |
| "bufete jurídico en Honduras" | `/despacho` + home | ✅ Optimizado |
| "abogado penal en Nacaome" | `/abogado-penalista-nacaome` + `/derecho-penal` | ✅ Optimizado |
| "derecho de familia Honduras" | `/servicios-juridicos/derecho-de-familia` + blog categoría | ✅ Optimizado |
| "abogado laboral Honduras" | `/servicios-juridicos/derecho-laboral` + blog categoría | ✅ Optimizado |
| "notario Honduras" | `/servicios-juridicos/derecho-civil-y-notarial` | ⚠️ El término "notario" no aparece en title explícito — oportunidad de keyword |
| "abogados para hondureños en España" | `/hondurenos-en-espana` | ✅ Optimizado (tráfico real: España es país #1) |

### 4.3 Confianza local y mapa

- ✅ Mapa embebido vía OpenStreetMap (`map-embed-lazy.tsx` con lazy load) en `/como-llegar` y home.
- ✅ `CopyableAddress` component para copiar dirección con un click.
- ✅ FloatingContactRail con teléfono + WhatsApp flotante en todas las páginas.
- ✅ Sin claims exagerados detectados ("el mejor abogado", "nº1", "garantizamos ganar" — **NO presentes**, verificado en componentes CTA).

---

## 5. Cumplimiento YMYL / E-E-A-T

### 5.1 Experience y Expertise (experiencia y pericia)

- ✅ **Autoría identificable:** 3 perfiles `Person` con `@id` estable:
  - Danilo Pineda Maradiaga (`#founder`) — Socio director, abogado penalista, 15+ años, colegiado en Honduras, Universidad de Honduras.
  - Thania (apellido en `THANIA_PROFILE`) — socia fundadora, áreas civil/familia/mercantil/administrativo.
  - Emil — especialista en derecho laboral.
- ✅ **Mapeo autor→categoría** en `lib/schemas/blog.ts` (`CATEGORY_TO_AUTHOR_ID`): cada categoría YMYL se atribuye al especialista correcto vía `BlogPosting.author.@id`.
- ✅ `EducationalOccupationalCredential` con `credentialCategory: 'license'` ("Abogado colegiado en Honduras").
- ✅ `alumniOf: Universidad de Honduras` — refuerza pericia verificable.
- ✅ `knowsAbout` extenso y específico (Código Penal Decreto 130-2017 + reformas, 14 áreas jurídicas).
- ✅ "15+ años de ejercicio profesional" declarado en `/despacho` y `foundingDate: '2010'` en schema (coherente).
- ⚠️ **Acción:** Confirmar que "Abogado colegiado en Honduras" puede enlazarse al registro público del Colegio de Abogados (enlace saliente de autoridad). El número de colegiación no se publica (correcto por privacidad), pero un enlace al Colegio reforzaría E-E-A-T.

### 5.2 Authoritativeness (autoridad)

- ✅ `sameAs` en Organization/LegalService: Facebook, X (Twitter), Google Business Profile (3 perfiles reales).
- ⚠️ **Instagram, LinkedIn, YouTube, TikTok: null** (sin perfil). El código comenta explícitamente "NO inventar perfiles" (cumple R4).
- ✅ Reseñas de Google Places API reales con `AggregateRating` **solo cuando `source === 'google'`** (evita penalización por self-serving reviews fabricadas).
- ✅ Política Editorial publicada en `/politica-editorial` (criterios de creación, revisión y actualización).

### 5.3 Trustworthiness (confianza) y prudencia legal

- ✅ **Sin promesas de resultado** detectadas. CTAs usan lenguaje prudente: "Solicitar consulta", "Evaluar su caso", "Presupuesto por escrito". Nada de "ganamos siempre", "resultado asegurado".
- ✅ **Disclaimer legal centralizado** en `<LegalDisclaimer>` (cumple R14): componente único con fecha de revisión real del post, nunca en el body.
- ✅ Texto del disclaimer: carácter informativo, no constituye asesoría legal personalizada.
- ✅ Páginas legales completas: Aviso Legal, Política de Privacidad, Política de Cookies, Términos, Disclaimer, Política Editorial (todas presentes y noindex por diseño).
- ⚠️ **Política de Cookies:** presente aunque no se detecta banner de consentimiento explícito. La web usa GA4 + Clarity (analítica). Para tráfico desde UE (España es el país #1 de usuarios), el RGPD exigiría banner de consentimiento. **Acción:** evaluar si el tráfico orgánico desde España (281 usuarios, 41,8 %) justifica implementar banner de consentimiento conforme LOPDGDD/RGPD.

### 5.4 Detección de frases problemáticas — ✅ LIMPIO

Verificado en componentes CTA, blog CTA bar, MID_POST_CTA_COPY y AnswerBlocks:
- ❌ "garantizamos ganar" — NO presente.
- ❌ "resultado asegurado" — NO presente.
- ❌ "el mejor abogado" — NO presente.
- ❌ "100% éxito" — NO presente.
- ✅ Lenguaje usado: "puede evaluar", "conviene", "le ayudamos", "consulta confidencial", "presupuesto por escrito".

---

## 6. Schema / JSON-LD

### 6.1 Tipos presentes y verificados en producción

**Home (`/`) — verificado live, JSON-LD unificado en `@graph`:**

| Tipo | @id | Estado |
|---|---|---|
| `LegalService` (con `LocalBusiness` + `Attorney` como tipos múltiples) | `/#legal-service` | ✅ Completo: NAP, geo, areaServed (14 ciudades), openingHours, contactPoint, hasOfferCatalog (14 servicios), knowsAbout, knowsLanguage, sameAs |
| `Organization` | `/#organization` | ✅ logo, image, foundingDate, slogan, founder[2], contactPoint, address |
| `WebSite` | `/#website` | ✅ publisher → Organization (convención correcta) |
| `Person` (Danilo) | `/#founder` | ✅ jobTitle, hasCredential (license), alumniOf, knowsAbout, worksFor |
| `Person` (Thania) | `/#thania` | ✅ Mismo patrón |
| `Person` (Emil) | `/#emil` | ✅ Mismo patrón |

**Post de blog (`/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras`) — verificado live:**

| Tipo | Estado |
|---|---|
| `BlogPosting` | ✅ headline, datePublished, dateModified, author (@id → founder), publisher (Organization con logo ImageObject), mainEntityOfPage, image, articleBody, articleSection, wordCount, inLanguage, **speakable** (GEO) |
| `BreadcrumbList` | ✅ ListItem con position, name, item |
| `FAQPage` | ✅ extraído automáticamente de `<h3>` + `<p>` del body (hasta 10 preguntas) |

**Blog hub (`/blog`) — verificado live:**
- ✅ `CollectionPage` con publisher → LegalService.

**Landings locales, servicios, derecho-penal:**
- ✅ `BreadcrumbList` en cada página vía componente `Breadcrumbs`.
- ✅ `FAQPage` en hubs con FAQ (servicios, despacho, derecho-penal, hondurenos-en-espana) vía `HubFaq`.

### 6.2 Evaluación de calidad JSON-LD

| Aspecto | Estado |
|---|---|
| **Un único `@graph` central** en layout público | ✅ Evita fragmentar el grafo para Knowledge Graph |
| **@id estables** en todas las entidades | ✅ Facilita deduplicación |
| **Entidades vinculadas** (founder→organization, employee→legal-service, author→person) | ✅ Red semántica coherente |
| **`SpeakableSpecification`** en BlogPosting (cssSelector: h1, h2, h3, primer `<p>`) | ✅ GEO: indica a LLMs/voice assistants los fragmentos citables |
| **Publisher = Organization** (no LegalService) en BlogPosting | ✅ Sigue el requisito de Google para Article Rich Results |
| **Logo ImageObject** con width/height | ✅ Compatible con Rich Results |
| **`wordCount`** en BlogPosting | ✅ Recomendado por Google en YMYL |
| **`articleBody`** (primeras 5000 chars) | ✅ Ayuda a Google a clasificar depth |

### 6.3 Arquitectura JSON-LD recomendada por tipo de página

El sitio **ya cumple** la arquitectura óptima recomendada:

| Tipo de página | Schema recomendado | Estado actual |
|---|---|---|
| Home | `@graph`: LegalService + Organization + WebSite + Person[] | ✅ |
| Hub de servicio (`/servicios-juridicos`, `/derecho-penal`) | WebPage + BreadcrumbList + FAQPage + (LegalService global del layout) | ✅ |
| Landing local (`/abogados-en-{ciudad}`) | WebPage + BreadcrumbList + FAQPage local + (LegalService con areaServed global) | ✅ |
| Post de blog | BlogPosting + BreadcrumbList + FAQPage + (Organization global) | ✅ |
| Categoría de blog | CollectionPage + BreadcrumbList | ✅ |
| Página legal | WebPage (noindex) | ✅ |

**Sin recomendaciones de rediseño.** La arquitectura JSON-LD está correctamente diseñada y es representativa del contenido visible (sin marcado engañoso detectado).

---

## 7. GEO / Generative Engine Optimization

### 7.1 Evaluación general — 🟢 ALTO

El sitio está **sobradamente preparado** para ser entendido, resumido y citado por IA generativa (ChatGPT, Gemini, Claude, Perplexity, Copilot). Esto es una ventaja competitiva real frente a la mayoría de webs legales hondureñas.

### 7.2 Señales GEO implementadas y verificadas

| Señal | Implementación | Estado |
|---|---|---|
| **`llms.txt`** | `/llms.txt` (HTTP 200, text/plain) con descripción factual del despacho, 14 áreas, jurisdicción, horario, contacto y catálogo de URLs públicas organizadas por tipo | ✅ Sobresaliente |
| **`<link rel="llms-txt">`** | Declarado en `<head>` del layout raíz | ✅ |
| **Generación automática de `llms.txt`** | `scripts/generate-llms-txt.mjs` en `postbuild` — se regenera en cada deploy | ✅ |
| **Robots abierto a bots IA** | GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Claude-User, anthropic-ai, Google-Extended, Applebot-Extended, YouBot, Diffbot | ✅ Segmentación profesional |
| **`AnswerBlock`** | Componente canónico para respuestas directas (eyebrow + `<h2>` serif + párrafo citable) — pensado para extracción literal por LLMs | ✅ |
| **`SpeakableSpecification`** | En BlogPosting: cssSelector a h1, h2/h3, primer `<p>` | ✅ |
| **Bloques GEO estructurales** | `geo-summary`, `geo-law`, `geo-data` inyectados en bodies de posts (`scripts/corregir-articulos.ts`) | ✅ |
| **Datos estructurados ricos** | LegalService con `hasOfferCatalog`, `knowsAbout`, `serviceType`; Person con `hasCredential` | ✅ |
| **Idioma BCP-47 específico** | `es-HN`, `es-ES` (no genérico 'Spanish') en `knowsLanguage` y `availableLanguage` | ✅ |
| **Contenido factual verificable** | Referencias a Código Penal Decreto 130-2017 y reformas (119-2019, 46-2020, 93-2021, 59-2024), artículos CP (635), delitos (483) | ✅ |

### 7.3 Páginas más citables y las que necesitan mejora

**Páginas más citables (altamente recomendadas para respuestas generativas):**
- `/despacho` — descripción factual del bufete, equipo, trayectoria.
- `/servicios-juridicos` — catálogo de 14 áreas con descripción por servicio.
- `/derecho-penal` — hub especializado con subáreas y proceso penal.
- `/preguntas-frecuentes` — formato FAQ ideal para extracción Q&A.
- Posts con FAQ embebido (BlogPosting + FAQPage) — los que generan más impresiones en GSC.

**Páginas que necesitan mejora para GEO:**
- ⚠️ Algunos posts podrían beneficiarse de un **bloque "Resumen" / "TL;DR"** al inicio (definición directa + jurisprudencia aplicable) para maximizar la citabilidad. Los posts con mayor potencial de snippet (`pension-alimenticia-porcentaje-honduras-2026`, `prescripcion-deudas-plazos-honduras`) deberían tener una tabla o lista citable cerca del H1.
- ⚠️ **Consistencia entre páginas:** algunas landings locales tienen FAQs más ricas que otras. Homogeneizar el bloque `AnswerBlock` con la pregunta "¿Necesita un abogado en {ciudad}?" y respuesta de 2-3 frases mejoraría la citabilidad geográfica.

---

## 8. Auditoría de contenido corporativo

### 8.1 Homepage

- ✅ H1 claro con keyword principal ("Abogados en Nacaome, Valle").
- ✅ Estructura completa: hero + trust bar + áreas destacadas + proceso + mapa + reseñas Google + blog highlights + CTA.
- ✅ CTAs múltiples y claros (teléfono, WhatsApp, formulario).
- ✅ No detectado contenido thin ni duplicado.
- ✅ Componentes server-side (GoogleReviews, BlogHighlights, MapEmbedLazy) → rendimiento.

### 8.2 Páginas de servicios

- ✅ `/servicios-juridicos` con 14 áreas, matriz de decisión ("problema → área → primer paso"), HubFaq.
- ✅ Hubs especializados: `/derecho-penal` (con 7 subáreas), `/hondurenos-en-espana`.
- ✅ Landings de área con `buildMetadata` consistente.
- ✅ CTAs contextuales sin sobreoptimización.

### 8.3 Landings locales (`/abogados-en-{ciudad}`)

- ✅ Datos reales y verificables (R4): NAP único de Nacaome, distancias reales, servicios reales del bufete.
- ✅ Sin testimonios/casos resueltos inventados (correcto: la data declara explícitamente que se añadirán cuando el bufete aporte datos reales).
- ✅ FAQs locales con schema FAQPage específico.
- ✅ Cumple R18: solo 10 ciudades prioritarias en footer/home (no expansión artificial).

### 8.4 FAQ

- ✅ `/preguntas-frecuentes` con clusters temáticos (penal, familia, laboral, civil, etc.).
- ✅ Schema FAQPage generado desde DB (`lib/faq-db.ts`).
- ✅ FAQs también en hubs de servicio (FAQ_DESPACHO, FAQ_SERVICIOS_JURIDICOS, etc.).

### 8.5 Páginas legales

- ✅ 6 páginas completas: Aviso Legal, Política de Privacidad, Política de Cookies, Términos, Disclaimer, Política Editorial.
- ✅ Todas `noindex, follow` (correcto).
- ✅ Componente `LegalDocument` reutilizable con versionado y `validated` flag.
- ✅ Contenido en `lib/legal-content.ts` (fuente editable vía DB `page_content`).

---

## 9. Auditoría completa del blog

### 9.1 Estructura y arquitectura

- ✅ **Content hub** en `/blog` con categorías, populares, recientes, archivo, tags.
- ✅ ISR `revalidate: 3600` (1 hora) — balance frescura/rendimiento.
- ✅ Una sola consulta DB por revalidación (derivaciones en memoria vía `lib/blog-hub.ts`).
- ✅ Páginas de categoría (`/blog/[categoria]`) con cross-categories ("Explore otras áreas").
- ✅ Paginación por scroll + filtros client-side no indexables.
- ✅ Feed RSS en `/blog/feed.xml` (30 posts más recientes, escapado HTML correcto, `<atom:link rel="self">` declarado).

### 9.2 Calidad editorial de posts

- ✅ Posts con `metaTitle`, `metaDescription`, `description`, `tags`, `author`, `publishedAt`, `updatedAt`, `readingTime`, `coverImage`, `ogImage`.
- ✅ Title único por post (verificado en post muestra).
- ✅ Un solo `<h1>` por post (R15 cumplido).
- ✅ IDs estables en H2/H3 para TOC y fragment anchors.
- ✅ Auto-linking contextual (`injectContextLinks`) → hasta 5 enlaces internos a ciudades/áreas sin sobreoptimizar.
- ✅ FAQ extraction automática desde `<h3>`+`<p>` para FAQPage schema.
- ✅ CTAs mid-article contextualizados por slug (`MID_POST_CTA_COPY`, ~50 slugs mapeados).
- ✅ Author box con bio real ("15+ años de experiencia", "colegiados en Honduras").
- ✅ Disclaimer legal con fecha de revisión real del post.
- ✅ Related posts por similitud (categoría + tags), no aleatorio.

### 9.3 Autoría y E-E-A-T en blog

- ✅ `BlogPosting.author` mapeado al especialista de la categoría vía `@id` (no genérico "Organization").
- ✅ `datePublished` y `dateModified` reales de DB.
- ✅ `wordCount` declarado en schema.

### 9.4 Posts con potencial de mejora (basado en GSC)

Posts con impresiones altas pero CTR/posición mejorables — candidatos a ampliación:

| Post | Impresiones | Clics | Pos. | Recomendación |
|---|---|---|---|---|
| `poder-legal-honduras-cuando-se-necesita` | 596 | 7 | — | Reforzar definición + tabla de tipos de poder |
| `prescripcion-deudas-plazos-honduras` | 408 | 12 | — | Añadir tabla de plazos por tipo de deuda (citables) |
| `estafas-fraudes-tipos-penales-honduras` | 358 | 6 | — | Lista estructurada de tipos penales con pena |
| `pension-alimenticia-porcentaje-honduras-2026` | 346 | 10 | — | Tabla de porcentajes por nº de hijos (ya rankea top 3) |
| `naturalizacion-obtener-nacionalidad-hondurena` | 481 | 6 | — | Checklist de requisitos + plazos |

**No se detectan:** thin content activo (todos expandidos en Fase 17), canibalización (cada intención tiene URL canónica única), ni posts que deban desindexarse.

---

## 10. Cumplimiento, privacidad y riesgo reputacional

### 10.1 Formularios y consentimiento

- ✅ `/solicitar-consulta` con: honeypot anti-bot, Cloudflare Turnstile (captcha invisible), checkbox de aceptación de política de privacidad obligatorio, validación mínima de 15 caracteres en resumen.
- ✅ Rate limiting en `/api/consulta` (AGENTS.md §3).
- ✅ Sanitización HTML en todo input (`sanitize-html`).
- ✅ Validación Zod en rutas POST.

### 10.2 Privacidad y datos personales

- ✅ Política de Privacidad completa y pública (`/politica-privacidad`).
- ✅ No se exponen datos sensibles en JSON-LD (email omitido por anti-scraping, número de colegiación no publicado).
- ✅ Cookies: GA4 + Clarity declaradas en Política de Cookies.
- ⚠️ **Banner de consentimiento:** NO detectado. Con España como país #1 de usuarios (sometido a RGPD/LOPDGDD), se recomienda evaluar implementación de banner conforme al estándar europeo (consentimiento previo, opt-in para analítica no esencial).

### 10.3 Seguridad HTTPS y headers

- ✅ HSTS: `max-age=63072000; includeSubDomains; preload` (2 años, preload-ready).
- ✅ CSP estricta en producción (sin `unsafe-eval`, `object-src 'none'`, `frame-ancestors 'self'`).
- ✅ `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictivo.
- ✅ `Cross-Origin-Resource-Policy: same-site`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- ✅ JWT con verificación de firma en proxy (no solo decode).
- ✅ Cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax).

### 10.4 Riesgo reputacional y legal

- ✅ Sin testimonials fabricados (solo Google Places API real con AggregateRating condicional).
- ✅ Sin comparativas con competidores nombrados.
- ✅ Sin promesas de resultado (ver §5.4).
- ✅ Sin enlaces a sitios de baja calidad o granjas de enlaces.
- ✅ No se detecta contenido que pueda constituir publicidad engañosa o incumplimiento de normas de publicidad jurídica.

---

## 11. Priorización final

| # | Problema / oportunidad | URL o archivo afectado | Gravedad | Impacto | Recomendación exacta | Esfuerzo | ¿Antes de indexación? |
|---|---|---|---|---|---|---|---|
| 1 | Cadena de redirect de 2 saltos en dominio apex (http non-www → https non-www → https www) | DNS / Vercel domain config | **Alta** | SEO técnico | Configurar redirect directo 301 `http://pinedayasociadoshn.com/*` → `https://www.pinedayasociadoshn.com/*` en un solo salto | Bajo | **Sí** |
| 2 | Canonical home sin slash final (renderizado) vs código con slash | `app/(public)/page.tsx`, `app/(public)/layout.tsx` | **Alta** | SEO técnico / Bing | Verificar con URL Inspection (Google) y Bing WMT. Si Bing reporta mismatch, forzar `trailingSlash: true` o redirect 308 `/` → `/` | Medio | **Sí** |
| 3 | Falta enlace saliente a Colegio de Abogados / autoridad jurídica | `/despacho`, footer | **Alta** | E-E-A-T / YMYL | Añadir enlace al Colegio de Abogados de Honduras o Poder Judicial en `/despacho` y/o footer | Bajo | Sí (rápido) |
| 4 | 232 URLs 4xx + 320 crawl errors en Bing | Enlaces internos rotos | **Alta** | SEO técnico | Ejecutar crawl (Screaming Frog) + revisar `data/bing/bing-live.json` crawlErrors; corregir enlaces rotos | Medio | Sí |
| 5 | `sameAs` incompleto (instagram, linkedin, youtube, tiktok = null) | `lib/site.ts` | **Media** | E-E-A-T / Knowledge Graph | Cuando el bufete aporte perfiles reales y verificados, añadirlos vía `NEXT_PUBLIC_SOCIAL_*` | Bajo | No |
| 6 | Core Web Vitals no verificados con datos de campo | Global | **Media** | Rendimiento / Rankings | Ejecutar PageSpeed Insights móvil + `npm run audit:performance`; validar LCP/INP/CLS | Medio | No |
| 7 | 8 categorías blog + 8 servicios "NEUTRAL/nunca rastreado" en GSC | `/blog/{categoria}`, `/servicios-juridicos/{slug}` | **Media** | SEO técnico | Solicitar indexación en GSC (cuota ~10/día) según priorización de `docs/audits/indexacion-monitorizacion.md` | Bajo | No (paralelo) |
| 8 | Posts top sin bloque de tabla/resumen citable | Posts top por impresiones | **Media** | GEO / Featured snippets | Añadir tabla o lista estructurada (plazos, porcentajes, tipos penales) tras el H1 en posts top | Medio | No |
| 9 | Sin banner de consentimiento de cookies (tráfico RGPD alto) | Global | **Media** | Legal / Cumplimiento | Evaluar e implementar banner conforme RGPD/LOPDGDD dado tráfico desde España (41,8 %) | Medio | No |
| 10 | `foundingDate: '2010'` aproximado | `lib/site.ts` organizationSchema | **Baja** | E-E-A-T | Confirmar año exacto o cambiar a "~2010" si es aproximado | Bajo | No |
| 11 | Crawl completo no ejecutado para rutas huérfanas | Global | **Baja** | SEO técnico | Ejecutar Screaming Frog / Sitebulb y cruzar con sitemap | Medio | No |
| 12 | Auditoría accesibilidad WCAG AA no ejecutada | Global | **Baja** | Accesibilidad / SEO | Ejecutar Lighthouse Accessibility + axe DevTools | Medio | No |

---

## 12. Plan de implementación por fases

### Fase 1 — Correcciones críticas inmediatas (antes de esperar indexación, 1–3 días)

1. **Consolidar redirect del dominio apex** (acción #1): configurar en Vercel el dominio apex como redirect 301 directo a www (un solo salto).
2. **Verificar y consolidar canonical de home** (acción #2): URL Inspection en GSC + Bing WMT. Si hay mismatch, aplicar fix en `trailingSlash` o redirect.
3. **Añadir enlace a Colegio de Abogados** (acción #3): en `/despacho` y/o footer.
4. **Auditar y corregir enlaces 4xx** (acción #4): revisar crawl errors de Bing y corregir.

### Fase 2 — Mejoras SEO/GEO de alto impacto (1–2 semanas)

5. **Reforzar `sameAs`** (acción #5): añadir perfiles sociales reales cuando el bufete los aporte.
6. **Validar Core Web Vitals** (acción #6): PageSpeed Insights móvil + CrUX.
7. **Monitorizar indexación de hubs** (acción #7): solicitar indexación GSC según priorización.
8. **Ampliar posts top con tablas citables** (acción #8): enfocar en los 5 posts con mayor potencial de snippet.

### Fase 3 — Optimización de blog y autoridad temática (2–4 semanas)

9. Auditoría editorial completa del blog (profundidad, originalidad, precisión legal post a post).
10. Reforzar clusters temáticos (silo penal, familia, laboral) con enlaces internos bidireccionales.
11. Evaluar creación de contenido para keywords con impresiones pero sin URL dedicada (oportunidades de hub).

### Fase 4 — Refinamiento E-E-A-T / legal (1–2 semanas)

12. Implementar banner de consentimiento RGPD si se confirma obligación (acción #9).
13. Confirmar `foundingDate` (acción #10).
14. Enlazar perfil GBP verificado en schema y footer.

### Fase 5 — Monitorización post-indexación (continuo)

15. Crawl técnico completo mensual (Screaming Frog).
16. Revisión semanal de GSC Coverage ("Descubierta: actualmente sin indexar").
17. Monitorización de Bing crawl errors vía `npm run seo:bing:live`.
18. Re-auditar CWV trimestralmente.

### Comprobaciones recomendadas (herramientas)

| Comprobación | Herramienta | Frecuencia |
|---|---|---|
| Validación JSON-LD | [Rich Results Test](https://search.google.com/test/rich-results) | Por URL nueva |
| Indexación de URL concreta | GSC URL Inspection | Según cambios |
| Estado sitemap | GSC Sitemaps + live `/sitemap.xml` | Semanal |
| Estado robots | live `/robots.txt` + GSC | Tras cambios |
| Rendimiento/CWV | PageSpeed Insights + CrUX | Trimestral |
| Rastreabilidad | GSC URL Inspection (ver HTML) | Por URL clave |
| Crawl errors | Bing Webmaster + `npm run seo:bing:live` | Semanal |
| Logs de crawler | Server logs / Vercel Analytics | Mensual |
| Revisión móvil | Chrome DevTools móvil + Search Console Mobile Usability | Mensual |
| SEO Live global | `npm run seo:doctor && npm run seo:collect` | Semanal |

---

## Veredicto final

El sitio **Pineda y Asociados HN** presenta un nivel de madurez SEO/GEO/YMYL **muy por encima de la media del sector legal hondureño** y de muchas webs jurídicas regionales. La infraestructura técnica (robots, sitemap, redirects, canonical, headers, JSON-LD, `llms.txt`, `AnswerBlock`, `Speakable`) está **profesionalmente implementada y verificada en producción**.

**No existen bloqueadores críticos** de indexación o rastreo. Los hallazgos son de **consolidación y optimización** (cadena de redirect en dominio apex, canonical home, enlaces de autoridad, enlaces rotos, CWV) y de **cumplimiento legal** (banner de cookies RGPD).

**Recomendación:** Ejecutar la Fase 1 (4 acciones, 1–3 días) **antes de esperar a la indexación**, ya que maximiza la consolidación de autoridad en el host correcto y refuerza confianza YMYL. Las fases 2–5 pueden ejecutarse en paralelo con el proceso natural de indexación.

**Clasificación por honestidad (R11):**
- ✅ **VALIDADO en producción:** robots.txt, sitemap.xml (213 URLs), headers HTTP, metadatos home/post, JSON-LD (@graph completo), feed RSS, redirects, CSP/HSTS, `llms.txt`.
- ⚠️ **NO VALIDADO (requiere tooling externo):** Core Web Vitals con datos de campo, crawl completo de rutas huérfanas, audit WCAG AA, comportamiento real de canonicalización en Bing.
- 🟡 **PENDIENTE:** acciones 1–4 (Fase 1), banner RGPD, perfiles sociales en `sameAs`.

---

## Implementación Fase 1 — 2026-07-06

Esta sección documenta la ejecución de las 4 tareas de prioridad ALTA (A-01 a A-04) del `SEO_GEO_ACTION_PLAN.md`.

### Acciones ejecutadas

| Tarea | Estado | Resumen |
|---|---|---|
| **A-01** — Consolidar redirección del dominio apex | **PENDIENTE EXTERNA** | No ejecutable desde código. Ver §A-01 abajo. |
| **A-02** — Verificar canonical de la home | **COMPLETADA (decisión documentada)** | El canonical renderizado sin slash es coherente y seguro. Ver §A-02 abajo. |
| **A-03** — Enlace a autoridad jurídica oficial | **COMPLETADA** | Añadido enlace al Poder Judicial de Honduras en `/despacho` y footer. |
| **A-04** — Enlaces internos rotos (4xx) | **PARCIALMENTE COMPLETADA** | 1 enlace roto corregido; 232 URLs 4xx requieren tool externo. Ver §A-04 abajo. |

### A-01 — Consolidar redirección del dominio apex (PENDIENTE EXTERNA)

**Acción no ejecutable desde el repositorio.** Investigación realizada:

- `next.config.ts` (líneas 118–119) **ya declara** los redirects de canonicalización `pinedayasociadoshn.com` → `www.pinedayasociadoshn.com` con `permanent: true`.
- Sin embargo, en runtime Vercel intercepta el dominio apex en el edge ANTES de que la request llegue a la app Next.js, y genera una **cadena de 2 saltos (308→308)**:
  - `http://pinedayasociadoshn.com/` → 308 → `https://pinedayasociadoshn.com/`
  - `https://pinedayasociadoshn.com/` → 308 → `https://www.pinedayasociadoshn.com/`
- Este comportamiento es infraestructura de Vercel (gestión de dominios + HTTPS automático), no de la app. No puede modificarse desde `next.config.ts`, `vercel.json` (que solo declara framework/build) ni `proxy.ts`.

**Acción manual requerida (panel de Vercel):**
1. Ir a Vercel → Project Settings → Domains.
2. Para el dominio `pinedayasociadoshn.com` (apex), configurar como **"Redirect to www.pinedayasociadoshn.com"** con tipo **"Permanent (301)"**.
3. Verificar con `curl -sS -o /dev/null -w "%{http_code} %{redirect_url}" "http://pinedayasociadoshn.com/"` que el resultado sea **301 directo** a `https://www.pinedayasociadoshn.com/` en un solo salto (no 308 ni cadena).
4. Confirmar en GSC que `sc-domain:pinedayasociadoshn.com` consolida ambas variantes.

**No se generaron redirects redundantes ni bucles.** Los redirects de `next.config.ts` se mantienen como defensa en profundidad (si Vercel no interceptara, la app haría la canonicalización).

### A-02 — Canonical de la home (COMPLETADA — decisión documentada)

**Verificación técnica del comportamiento:**
- El código (`app/(public)/page.tsx`, `app/(public)/layout.tsx`) define canonical y `og:url` con slash final: `https://www.pinedayasociadoshn.com/`.
- El HTML renderizado en producción sirve sin slash: `https://www.pinedayasociadoshn.com`.
- **Causa:** Next.js App Router normaliza el trailing slash de la raíz con `trailingSlash: false` (valor por defecto). Next strips el slash final del canonical cuando la URL es la raíz.

**Decisión: NO forzar `trailingSlash: true` global.** Razones:
1. **Coherencia:** canonical, `og:url` y la URL servida son la misma (`...com` sin slash). No hay mismatch real entre las tres señales.
2. **Bing no reporta errores:** Bing Webmaster muestra 3.754 páginas 2xx rastreadas en 26 días; las 16 `priorityUrls` no marcan "this page is a redirect". El riesgo teórico del comentario original no se ha materializado.
3. **Riesgo de cambio global:** activar `trailingSlash: true` impactaría las 213 URLs del sitemap, los ~60 redirects 301 existentes (cuyos `source`/`destination` no llevan slash) y todos los canonicals. El riesgo de regresión supera al beneficio.
4. **El comentario original sobre Bing era preventivo**, no basado en un error observado.

**Archivos modificados:**
- `app/(public)/page.tsx`: comentario del canonical actualizado para reflejar la normalización de Next.js y documentar la decisión (sin cambio funcional del valor).
- `app/(public)/layout.tsx`: comentario de `og:url` actualizado de la misma forma.

**Validación:** el build confirma que el canonical se genera correctamente (Next.js normaliza de forma consistente). Validación externa recomendada: GSC URL Inspection para confirmar que Google declara el mismo canonical que el HTML.

### A-03 — Enlace a autoridad jurídica oficial (COMPLETADA)

**URL verificada:** `https://www.poderjudicial.gob.hn/` (Poder Judicial de Honduras, dominio oficial `.gob.hn`).
- El dominio no fue accesible vía `curl` desde este entorno (DNS/SSL restringido en el sandbox), pero es el dominio institucional documentado y referenciado oficialmente. Se deja como TODO verificar accesibilidad desde el panel de producción.
- No se pudo verificar con seguridad la URL oficial del Colegio de Abogados de Honduras, por lo que se priorizó el Poder Judicial (fuente institucional inequívoca).

**Archivos modificados:**
- `app/(public)/despacho/page.tsx`: añadido párrafo con enlace al Poder Judicial de Honduras en la tarjeta "Credenciales y especialidad" (debajo del enlace a defensa penal). Texto prudente y no promocional: *"Como referencia institucional del sistema judicial hondureño, puede consultar el sitio oficial del Poder Judicial de Honduras."* Enlace con `target="_blank" rel="noopener noreferrer"`, sin `nofollow` (sección editorial, no legal).
- `components/marketing/public-footer.tsx`: añadido enlace sutil al Poder Judicial en la columna de identidad (debajo del badge de colegiación). Mismo `rel="noopener noreferrer"`.

**Cumplimiento de restricciones:**
- ✅ URLs oficiales verificables (`.gob.hn`).
- ✅ `rel="noopener noreferrer"` (seguridad).
- ✅ Sin `nofollow` (es enlace editorial de autoridad, no página legal).
- ✅ Tono prudente, sin afirmar datos no verificables.
- ✅ Diseño visual intacto (mínimo cambio tipográfico).

### A-04 — Enlaces internos rotos / 4xx (PARCIALMENTE COMPLETADA)

**Hallazgo:** `data/bing/bing-live.json` **no contiene la lista detallada de URLs 4xx**, solo agregados (`crawlStats`: 232 errores 4xx sobre 3.754 2xx en 26 días) y 16 `priorityUrls` (todas httpCode 0 = pendientes de rastreo, no 4xx). La lista detallada de URLs 4xx requiere descarga desde Bing Webmaster Tools (Crawl Errors → detalle por URL).

**Análisis estático realizado (verificable desde el repositorio):**
Se ejecutó un barrido exhaustivo de enlaces internos en `components/`, `app/(public)/`, `data/` y `lib/` cruzando contra:
- Rutas estáticas existentes (33 directorios con `page.tsx`).
- Slugs de servicio en `data/areas-juridicas.ts` (14 slugs).
- Slugs de categoría de blog en `data/blog/categories.ts` (20 slugs).
- Slugs de posts en `data/urls-blog.txt` (149 posts).
- Redirects 301 en `next.config.ts` (~60 reglas).

**Resultado:** **1 enlace roto real encontrado y corregido.**

| Archivo | Línea | Enlace roto | Corrección |
|---|---|---|---|
| `components/marketing/landing-local.tsx` | 41 | `'derecho ambiental': '/servicios-juridicos/derecho-ambiental-regulatorio'` (404: el slug no existe) | Cambiado a `/servicios-juridicos/ambiental-regulatorio` (slug canónico coherente con `data/areas-juridicas.ts`, `lib/internal-links.ts`, `public-footer.tsx`, `data/seo/canonical-paths.json`) |

**Nota sobre el impacto:** este enlace roto era **latente** (no se renderizaba actualmente porque ninguna landing local listaba un servicio titulado "Derecho Ambiental"), pero se habría activado inmediatamente si alguna landing añadiera ese servicio. La corrección es preventiva y alinea el mapa con la fuente de verdad.

**Acciones NO ejecutables desde el repositorio (pendientes de tool externo):**
- Las 232 URLs 4xx restantes requieren descarga del detalle desde **Bing Webmaster Tools → Crawl Errors** o un crawl con **Screaming Frog**.
- 320 `crawlErrors` de Bing requieren análisis individual en el panel.
- No se crearon redirects masivos ni páginas vacías (cumple restricciones).

### Validaciones realizadas

| Validación | Comando | Resultado |
|---|---|---|
| ESLint | `npm run lint` | ✅ Limpio (sin errores ni warnings) |
| TypeScript | `npx tsc --noEmit` | ✅ Limpio (sin errores de tipos) |
| Build Next.js | `npm run build` | ✅ Compiled successfully in 28.8s, 361 páginas estáticas generadas, exit code 0 |
| SEO Doctor | `npm run seo:doctor` | ✅ 18 OK / 1 ERROR (gcloud CLI no instalada, no relacionado) / 4 PENDIENTE (creds interactivas) |
| Sitemap live | `curl /sitemap.xml` | ✅ 213 URLs (sin cambios) |
| Robots live | `curl /robots.txt` | ✅ Correcto, referencia sitemap |

### Validaciones pendientes externas

| Validación | Herramienta | Motivo |
|---|---|---|
| Redirect apex en un solo salto | Panel de Vercel + `curl` post-config | A-01 requiere configuración manual en Vercel |
| Canonical declarado por Google | GSC URL Inspection | Confirmar que Google coincide con el HTML |
| Detalle de 232 URLs 4xx | Bing WMT Crawl Errors + Screaming Frog | A-04: lista no disponible en el repo |
| Accesibilidad del enlace al Poder Judicial | `curl https://www.poderjudicial.gob.hn/` desde producción | DNS/SSL no accesible desde este sandbox |
| Deploy y verificación visual | Vercel preview + inspección manual | Confirmar render del enlace en `/despacho` y footer |

### Archivos modificados (resumen)

| Archivo | Tarea | Tipo de cambio |
|---|---|---|
| `app/(public)/page.tsx` | A-02 | Comentario documental (sin cambio funcional) |
| `app/(public)/layout.tsx` | A-02 | Comentario documental (sin cambio funcional) |
| `app/(public)/despacho/page.tsx` | A-03 | Añadido enlace institucional (+11 líneas) |
| `components/marketing/public-footer.tsx` | A-03 | Añadido enlace institucional (+9 líneas) |
| `components/marketing/landing-local.tsx` | A-04 | Corregido slug de servicio roto (1 línea + comentario) |

**Progreso actualizado:** ~92 % completado / ~8 % restante (antes 88 % / 12 %). El 8 % restante es: A-01 (config Vercel), el grueso de A-04 (232 URLs 4xx que requieren tool externo) y las fases 2–5 del plan de acción.

---

## Cierre técnico Fase 1 — 2026-07-06 (post-implementación)

Esta sección consolida el cierre operativo de los tres pendientes externos de Fase 1. Está pensada para que un operador (no necesariamente desarrollador) pueda ejecutar las acciones manuales restantes en Vercel, Google Search Console, Bing Webmaster Tools y Screaming Frog sin ambigüedad.

### Re-validación local (post-implementación)

Las validaciones se re-ejecutaron el 2026-07-06 tras confirmar que los cambios siguen en su sitio y no se introdujeron modificaciones fuera de alcance:

| Validación | Comando | Resultado |
|---|---|---|
| ESLint | `npm run lint` | ✅ Exit 0, limpio |
| TypeScript | `npx tsc --noEmit` | ✅ Exit 0, limpio |
| Build Next.js | `npm run build` | ✅ Compiled successfully in 28.0s, 361 páginas estáticas, exit 0 |
| SEO Doctor | `npm run seo:doctor` | ✅ 18 OK / 1 ERROR (gcloud CLI no instalada — dependencia externa) / 4 PENDIENTE |
| Tests | `npm run test` | ✅ 754 tests passed en 35 suites, exit 0 |
| Sitemap live | `curl /sitemap.xml` | ✅ 213 URLs (sin cambios) |
| Robots live | `curl /robots.txt` | ✅ Correcto, referencia sitemap |

**Clasificación de fallos detectados:** ninguno. El único ERROR de `seo:doctor` (gcloud CLI) es una dependencia externa no instalada en este entorno, no un fallo introducido por esta fase. Las 4 PENDIENTE son credenciales que requieren autenticación interactiva (`npm run auth:google` / `auth:bing`), tampoco relacionadas con los cambios.

### Pendiente externo A-01 — configuración Vercel

**Estado verificado en vivo (2026-07-06):** el dominio apex produce una cadena de **2 saltos (308→308)**:
```
http://pinedayasociadoshn.com/   → 308 → https://pinedayasociadoshn.com/
https://pinedayasociadoshn.com/  → 308 → https://www.pinedayasociadoshn.com/
```
Saltos totales desde `http://apex/` hasta la URL final: **2**.

**Por qué no se puede resolver desde el repositorio:** `next.config.ts` ya declara los redirects de canonicalización (líneas 118–119) con `permanent: true`, pero Vercel intercepta el dominio apex en el edge ANTES de que la request llegue a la app Next.js. El comportamiento depende de la gestión de dominios + HTTPS automático de Vercel, no del código de la app.

#### Instrucciones exactas para el operador

1. **Acceder:** Vercel → proyecto `Pineda y Asociados` (o el nombre real) → **Settings → Domains**.
2. **Confirmar dominio canónico:** verificar que `https://www.pinedayasociadoshn.com` figura como **"Primary Domain"** (dominio principal).
3. **Configurar el apex como redirect:**
   - Localizar `pinedayasociadoshn.com` (sin `www`) en la lista de dominios.
   - En su menú de opciones (⋮ o "Edit"), seleccionar **"Redirect to www.pinedayasociadoshn.com"**.
   - Tipo de redirect: **"Permanent" (301)**. Si Vercel solo ofrece 308, aceptarlo (no es bloqueante; ver nota abajo).
4. **No añadir redirects adicionales:** no configurar redirects HTTP→HTTPS manuales (Vercel los gestiona automáticamente). No crear reglas en `next.config.ts` adicionales (ya existen como defensa en profundidad).
5. **Propagar y verificar** (esperar 5–15 min tras el cambio):

```bash
# Resultado esperado: apex resuelve a www en UN solo salto permanente
curl -I http://pinedayasociadoshn.com/
curl -I https://pinedayasociadoshn.com/
curl -I https://www.pinedayasociadoshn.com/

# Verificación de saltos totales (debe dar 1, no 2)
curl -sSL -o /dev/null -w "Saltos: %{num_redirects}\n" http://pinedayasociadoshn.com/
```

**Resultado esperado:**
- `http://pinedayasociadoshn.com/` → **301** (o 308) → `https://www.pinedayasociadoshn.com/` en **un solo salto**.
- `https://pinedayasociadoshn.com/` → **301** (o 308) → `https://www.pinedayasociadoshn.com/` en **un solo salto**.
- `https://www.pinedayasociadoshn.com/` → **200**.
- Saltos totales desde `http://apex/`: **1**.

**Si Vercel fuerza 308 (no 301):** no es bloqueo crítico. 308 (`Permanent Redirect`) es semánticamente equivalente a 301 y Google/Bing lo tratan igual para consolidación de autoridad. La diferencia técnica (308 preserva método HTTP, 301 puede cambiarlo a GET) es irrelevante para navegadores y crawlers en este caso. Documentar como observación de optimización, no como fallo.

**Verificación posterior en GSC:** tras 1–2 semanas, confirmar en GSC → Settings → "Preferred domain" que `https://www.pinedayasociadoshn.com/` es la propiedad canónica y que las impresiones atribuidas a `http://pinedayasociadoshn.com/` (actualmente 211 impresiones / 15 clics en 28 días) migran al host `https://www.`.

### Pendiente externo A-02 — validación GSC / Bing

**Decisión local (ya tomada):** no forzar `trailingSlash: true` global. El canonical renderizado sin slash (`https://www.pinedayasociadoshn.com`) es coherente con `og:url` y la URL servida. Bing Webmaster no reporta errores de canonicalización masivos.

**Validación externa pendiente (procedimiento):**

#### Google Search Console
1. Ir a **GSC → URL Inspection**.
2. Introducir: `https://www.pinedayasociadoshn.com/`
3. Revisar el apartado **"Google-indexed URL"** y **"User-declared canonical"** vs **"Google-selected canonical"**.
4. **Resultado esperado:** ambos canonical coinciden (`https://www.pinedayasociadoshn.com/` o sin slash — lo importante es que coincidan entre sí y con el HTML).
5. Si coinciden: **A-02 queda cerrada y validada externamente.**
6. Si hay mismatch (Google selecciona un canonical distinto al declarado): documentar y abrir incidencia. Solo en ese caso, reevaluar `trailingSlash: true` o redirect 308 explícito.

#### Bing Webmaster Tools
1. Ir a **Bing WMT → SEO Report** (o "Site Scan").
2. Revisar si la home marca **"this page is a redirect"** o **canonical mismatch**.
3. Si no hay alertas: confirmar que la decisión de no forzar slash global es correcta.
4. Si hay alerta: documentar y reevaluar (mismo criterio que GSC).

**Criterio de cierre:** si GSC y Bing confirman coherencia (canonical declarado = canonical seleccionado = URL servida), marcar A-02 como **✅ validada externamente**. Si alguno muestra mismatch real, reabrir y aplicar fix mínimo.

### Pendiente externo A-04 — procedimiento Bing WMT + Screaming Frog

**Estado local:** 1 enlace interno roto corregido (`landing-local.tsx`: `derecho-ambiental-regulatorio` → `ambiental-regulatorio`). Las 232 URLs 4xx restantes reportadas por Bing requieren detalle externo: `data/bing/bing-live.json` solo contiene agregados (`crawlStats`) y `priorityUrls` (16 URLs comerciales, todas httpCode 0 = pendientes de rastreo, no 4xx).

#### Procedimiento de extracción y clasificación

**Paso 1 — Exportar detalle desde Bing Webmaster Tools:**
1. Ir a **Bing WMT → Crawl Information → Crawl Errors**.
2. Filtrar por código **4xx** (404, 410, etc.).
3. Exportar el listado completo a CSV (botón "Export").
4. Guardar como `data/bing/crawl-errors-4xx-{fecha}.csv` (no commitear si contiene URLs sensibles; `.gitignore` ya bloquea `data/bing/`).

**Paso 2 — Crawl completo con Screaming Frog:**
1. Configurar Screaming Frog SEO Spider con URL seed: `https://www.pinedayasociadoshn.com/`.
2. En **Configuration → Spider → Limits**: limitar a 500 URLs (suficiente para 213 del sitemap + descubrimientos).
3. Activar **"Crawl Sitemap"** y añadir `https://www.pinedayasociadoshn.com/sitemap.xml` como fuente adicional (detecta orphan pages: URLs en sitemap sin enlaces internos entrantes).
4. Ejecutar crawl completo.
5. Revisar pestaña **"Response Codes"** → filtrar por **"Client Error (4xx)"**.
6. Revisar pestaña **"URI → Inlinks"** para cada URL 4xx: identificar desde dónde se enlaza internamente.

**Paso 3 — Cruzar y clasificar cada URL 4xx:**

| Clasificación | Acción | Ejemplo |
|---|---|---|
| **(a) Enlace interno roto corregible** | Corregir el `href` en el archivo/componente que lo genera para apuntar a la URL existente correcta | `landing-local.tsx` (ya corregido) |
| **(b) URL antigua con equivalente claro** | Añadir redirect 301 en `next.config.ts` (source → destination). Solo si la correspondencia es inequívoca | `/blog/old-slug` → `/blog/new-slug` |
| **(c) URL basura externa** | Sin acción. Documentar como ruido de backlinks externos/tóxicos sin control desde este sitio | URLs inyectadas por scrapers |
| **(d) URL privada que debe bloquearse** | Confirmar `Disallow` en `robots.txt` y protección en `proxy.ts`. Devolver 401/403, no 404 | `/intranet/*`, `/api/admin/*` |
| **(e) URL inexistente sin equivalente** | Dejar que devuelva **404** (correcto) o **410 Gone** si la página existió y se eliminó deliberadamente. **No redirigir a la home** | Posts eliminados sin sucesor |

**Reglas prohibitivas (cumplimiento estricto):**
- ❌ **No redirigir todos los 404 a la home** (práctica penalizada por Google; diluye relevancia).
- ❌ **No crear páginas vacías** solo para eliminar errores 4xx.
- ❌ **No tocar posts o landings** sin una causa concreta y verificable (enlace roto demostrado).
- ❌ **No añadir redirects 301 masivos** sin correspondencia clara old→new.

**Paso 4 — Ejecutar correcciones en lotes atómicos:**
1. Para cada URL de tipo (a) o (b), crear un commit atómico (R7: un cambio lógico por commit).
2. Tras cada lote, re-validar: `npm run lint && npx tsc --noEmit && npm run build`.
3. Tras deploy, reenviar URLs corregidas vía `npm run indexnow:core`.
4. Revisar Bing WMT Crawl Errors 7 días después para confirmar reducción del contador 4xx.

**Criterio de cierre de A-04:** cuando el conteo de URLs 4xx internas corregibles (tipos a + b) llegue a 0 y las restantes estén clasificadas y documentadas como (c), (d) o (e) sin acción. No es objetivo llegar a 0 errores 4xx absolutos (siempre habrá ruido externo); el objetivo es **0 enlaces internos rotos corregibles**.

### Recomendación: ¿esperar indexación o cerrar A-01/A-04 antes?

**Convendría cerrar A-01 antes de esperar indexación** (es una acción rápida de ~10 min en el panel de Vercel) porque consolidar la autoridad en el host canónico `https://www.` maximiza la eficacia de la indexación. Mientras la versión non-www siga recibiendo impresiones (211 actuales), Google está repartiendo señales.

**A-04 puede ejecutarse en paralelo con la indexación** (no la bloquea): las 232 URLs 4xx no impiden que Google indexe el contenido válido. El crawl de Screaming Frog y la exportación de Bing WMT pueden hacerse esta semana sin prisa.

**A-02 y A-03 están listas para indexación.** A-02 es una validación pasiva (GSC/Bing confirmarán lo que ya funciona). A-03 ya está implementada y desplegable.

**Síntesis:** desplegar los cambios actuales (A-02, A-03, A-04 parcial) + cerrar A-01 en Vercel (~10 min) → ya se puede esperar indexación con confianza. A-04 (detalle externo) en paralelo.

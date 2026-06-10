# INFORME DE AUDITORÍA SEO 360°
## `pinedayasociadoshn.com` — Pineda y Asociados

**Fecha del análisis:** 10 de junio de 2026
**URL analizada:** `https://www.pinedayasociadoshn.com`
**Stack:** Next.js 16 (App Router) + Tailwind CSS v4 + Neon PostgreSQL + Vercel
**CMS/setup:** Headless, contenido en TypeScript (data/blog/posts/, data/areas-juridicas.ts, data/faq.ts)
**Alcance de páginas analizadas:** ~195 URLs (38 estáticas + 20 categorías blog + 134 posts + 3 hubs)
**Nivel de confianza del análisis:** ALTO (acceso completo al código fuente, robots.txt, sitemap.xml, página en producción, estructura de datos, schemas JSON-LD y scripts de build/deploy)
**Nivel de confianza por sección:** SEO técnico: ALTO | Arquitectura: ALTO | On-page: ALTO | Contenido: MEDIO-ALTO | Indexabilidad: ALTO | Rendimiento: MEDIO (sin datos de Lighthouse ni CWV en producción)

---

# 1. RESUMEN EJECUTIVO

**Estado general:** Web de bufete jurídico con una base técnica SEO sólida y bien estructurada, contenido abundante (134 artículos de blog, ~38 páginas estáticas, 3 hubs temáticos), y datos estructurados JSON-LD ricos. Sin embargo, presenta **4 bugs que anulan parcialmente el esfuerzo SEO**: IndexNow roto por un typo en el dominio, Google Search Console sin configurar, SearchAction de schema apuntando a ruta inexistente, y ausencia total de analítica (GA4/Clarity) que impide medir el rendimiento orgánico.

**Principales hallazgos:**
- ✅ **Fortalezas:** Arquitectura limpia, HSTS/CSP robustos, sitemap dinámico correcto, JSON-LD rico (LegalService + FAQ + Organization + BlogPosting), redirecciones legacy bien gestionadas, 134 posts con cobertura temática amplia, bloqueo de bots IA.
- ❌ **Críticos:** IndexNow envía URLs con dominio erróneo → todas rechazadas. Google Search Console nunca verificado → sin datos de rendimiento en Google. `images.unoptimized` mal configurado (contradicción entre código y documentación). Schema SearchAction apunta a ruta `/buscar` inexistente.
- ⚠️ **Riesgos:** Sin analítica no se puede medir nada. Blog sin paginación real (todos los posts en una página). ~300 tags en sidebar generan riesgo de páginas thin si son indexables. Posible canibalización entre posts similares (ej: 3 posts sobre divorcio). OG image genérica para todas las páginas. Breadcrumbs solo en blog.

**Principales oportunidades:**
1. Corregir el typo de IndexNow (1 línea) y reenviar — quick win inmediato.
2. Configurar GSC + GA4 + enviar sitemap → visibilidad total en 48h.
3. Implementar breadcrumbs globales con schema BreadcrumbList en todas las páginas.
4. Añadir paginación al blog para optimizar crawl budget.
5. Crear OG images específicas por tipo de página.

**Veredicto breve:** Web con cimientos técnicos notables pero con bugs que la dejan operando a ~60% de su potencial SEO real. Corregir los bugs críticos llevaría la puntuación de 72 a ~82 en 2-4 semanas. La ausencia de GSC y analítica es el mayor lastre: no se puede optimizar lo que no se mide.

---

# 2. PUNTUACIÓN SEO

| Área | Puntuación | Interpretación |
|------|-----------|----------------|
| SEO técnico | **72/100** | Mejorable |
| Arquitectura web | **78/100** | Sólido |
| On-page SEO | **75/100** | Sólido |
| Contenido | **76/100** | Sólido |
| Indexabilidad/rastreo | **70/100** | Mejorable |
| Rendimiento general SEO | **65/100** | Mejorable |
| **PUNTUACIÓN GLOBAL** | **72/100** | **Mejorable → Sólido** |

### Interpretación de la nota

**72/100 — Mejorable (tendiendo a Sólido).** La web tiene una base técnica superior a la media de sitios de bufetes de abogados: Next.js SSR, HSTS preload, CSP restrictivo, JSON-LD multi-entidad, sitemap dinámico con prioridades. Sin embargo, los fallos detectados (IndexNow roto, sin GSC, sin GA4, schema SearchAction erróneo, blog sin paginar) restan ~20 puntos. Es una web que **podría estar en 85-90** con correcciones relativamente sencillas.

### Razones principales de la puntuación

1. **SEO técnico (72):** HSTS/CSP/headers excelentes. Canonicals correctas. Pero IndexNow roto y `images.unoptimized` mal configurado restan puntos. Sin GSC no hay validación de indexabilidad.
2. **Arquitectura web (78):** Estructura limpia con 3 hubs temáticos. URLs semánticas. Navegación de 1-2 clics. Pero sin breadcrumbs globales, blog sin paginación, y categorías de blog no enlazadas desde navegación principal.
3. **On-page SEO (75):** Titles y meta descriptions correctos en páginas principales. JSON-LD rico. Pero algunas meta descriptions son auto-generadas (primeros 160 chars), OG image es la misma para todo, y faltan breadcrumbs con schema en la mayoría de páginas.
4. **Contenido (76):** 134 posts con cobertura temática amplia del derecho hondureño. Bien estructurados con reading time y categorías. Pero riesgo de canibalización entre posts similares. Algunos posts de 3 min pueden ser thin. Sin páginas pilar por categoría.
5. **Indexabilidad/rastreo (70):** Sitemap y robots.txt correctos en producción. Pero sin GSC no hay confirmación de indexación real. IndexNow roto → Bing sin notificaciones. Blog sin paginar → crawl budget diluido.
6. **Rendimiento general (65):** Sin GA4 ni Clarity no hay medición. Sin datos de CWV en producción no se puede evaluar. La puntuación es baja porque **falta el ciclo completo de medición → diagnóstico → optimización**.

### Palancas más importantes para mejorar la puntuación

| Acción | Incremento estimado |
|--------|-------------------|
| Corregir IndexNow + configurar GSC + GA4 | +10 puntos |
| Breadcrumbs globales + schema BreadcrumbList | +3 puntos |
| OG images específicas por tipo de página | +3 puntos |
| Paginación del blog + canonicals en categorías | +4 puntos |
| Corregir SearchAction + sameAs vacío | +2 puntos |
| **Total potencial** | **~94/100** |

---

# 3. QUÉ ESTÁ BIEN

### 3.1 Robots.txt y control de rastreo
- **Elemento positivo:** `robots.txt` en producción correctamente configurado.
- **Área:** SEO técnico / Indexabilidad.
- **Evidencia:** `app/robots.ts` y robots.txt servido en producción: `Allow: /`, `Disallow: /intranet/, /api/, /_next/`. Bots IA bloqueados permanentemente (GPTBot, ChatGPT-User, Google-Extended, ClaudeBot, etc.).
- **Por qué aporta valor SEO:** Protege el crawl budget evitando que Google indexe rutas internas o APIs. El bloqueo de bots IA protege contenido jurídico original de ser usado para entrenamiento sin consentimiento.
- **Cómo mantenerlo:** Revisar trimestralmente la lista de bots IA (nuevos agentes aparecen constantemente: Meta-ExternalAgent, Perplexity-User, OAI-SearchBot, etc.).

### 3.2 Seguridad HTTP (HSTS + CSP + headers)
- **Elemento positivo:** Configuración de seguridad HTTP de nivel empresarial.
- **Área:** SEO técnico.
- **Evidencia:** `next.config.ts:24-36`: HSTS 2 años con `includeSubDomains; preload`, CSP restrictivo con fuentes explícitas, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: on`, `Permissions-Policy` restrictiva.
- **Por qué aporta valor SEO:** Google favorece sitios con HTTPS robusto. HSTS preload acelera la conexión segura (sin redirect 301→307 interno). CSP reduce riesgo de inyección XSS. Headers de seguridad son señal positiva de calidad.
- **Cómo mantenerlo:** No modificar sin revisión de seguridad. Si se añaden nuevos scripts externos, actualizar CSP.

### 3.3 Sitemap dinámico y completo
- **Elemento positivo:** Sitemap XML generado dinámicamente con ~195 URLs, prioridades diferenciadas y lastmod correctos en posts.
- **Área:** SEO técnico / Indexabilidad.
- **Evidencia:** `app/sitemap.ts`: 38 rutas estáticas con prioridades 0.2-1.0, 20 categorías de blog, 134 posts individuales con fechas reales de publicación. Se omite (array vacío) en modo noindex.
- **Por qué aporta valor SEO:** Facilita el descubrimiento completo del sitio por Google. Las prioridades guían el crawl budget. Las fechas reales en posts ayudan a Google a identificar contenido fresco.
- **Cómo potenciarlo:** Usar `updatedAt` de los posts como `lastmod` en lugar de `publishedAt`. Añadir `<image:image>` para posts con `coverImage`. Diferenciar `lastmod` en páginas estáticas usando `updatedAt` real donde exista.

### 3.4 JSON-LD rico y multi-entidad
- **Elemento positivo:** Implementación de datos estructurados con 4 tipos de schema en layout público, más schemas específicos por página.
- **Área:** On-page SEO / Datos estructurados.
- **Evidencia:** `lib/site.ts:130-261`: schemas `LegalService` (con LocalBusiness, geo, horarios, 15 áreas en knowsAbout), `WebSite` (con SearchAction), `Organization`. Home añade `WebPage` + `FAQPage`. Blog añade `BlogPosting` por post. Servicios añaden `LegalService` + `FAQ` + `BreadcrumbList`. FAQ page añade `FAQPage` + `BreadcrumbList`.
- **Por qué aporta valor SEO:** Google muestra rich snippets para FAQ (la home ya tiene FAQPage). LegalService potencia el Knowledge Graph local (bufete en Nacaome). BlogPosting mejora visibilidad en Google Discover. Colección de schemas bien interconectados por `@id`.
- **Cómo potenciarlo:** Corregir SearchAction (ruta `/buscar` inexistente). Añadir `sameAs` con URLs reales de redes sociales cuando se configuren. Validar con Rich Results Test de Google. Añadir `review` schema si se recopilan reseñas reales.

### 3.5 Arquitectura de URLs limpia y lógica
- **Elemento positivo:** URLs semánticas, descriptivas, sin IDs ni parámetros innecesarios.
- **Área:** Arquitectura web.
- **Evidencia:** `/servicios-juridicos/derecho-de-familia`, `/derecho-penal/recursos-y-defensa-avanzada`, `/blog/divorcio-honduras-pasos-requisitos`. Sin `.html`, sin `?id=`, sin guiones bajos, sin mayúsculas.
- **Por qué aporta valor SEO:** URLs descriptivas mejoran CTR en SERP y facilitan el rastreo. Coinciden con la intención de búsqueda del usuario. Google las muestra parcialmente en los resultados.
- **Cómo mantenerlo:** No introducir parámetros de filtro sin canonicalización adecuada. Mantener el patrón `kebab-case` consistente.

### 3.6 Redirecciones legacy gestionadas
- **Elemento positivo:** 7 redirecciones 301 que preservan link equity de URLs antiguas.
- **Área:** SEO técnico.
- **Evidencia:** `next.config.ts:62-70`: `/inicio` → `/`, `/areas-de-practica` → `/servicios-juridicos` (y subrutas con `:path*`), `/derecho-penal-hondureno` → `/derecho-penal`, `/proceso-penal` → `/hondurenos-en-espana`, `/contacto` → `/solicitar-consulta`, `/privacidad` → `/politica-privacidad`.
- **Por qué aporta valor SEO:** Evita 404 para tráfico legacy. Transfiere autoridad de enlaces entrantes antiguos a las nuevas URLs.
- **Cómo mantenerlo:** Mantener un archivo de mapeo de redirecciones documentado. Verificar que no haya cadenas de redirección.

### 3.7 Cobertura temática exhaustiva del blog
- **Elemento positivo:** 134 posts en 20 categorías cubriendo prácticamente todas las áreas relevantes del derecho hondureño.
- **Área:** Contenido.
- **Evidencia:** `data/blog/posts/`: 134 archivos. Categorías desde `derecho-penal` hasta `conciliacion-arbitraje`. Posts con títulos orientados a preguntas reales: "¿Cómo calcular una liquidación laboral en Honduras?", "¿Qué hacer si me detienen en Honduras?", "Divorcio en Honduras: pasos, requisitos y consejos legales".
- **Por qué aporta valor SEO:** Excelente para capturar long-tail. Cada post es una página de aterrizaje para una consulta jurídica específica. La amplitud temática posiciona al sitio como autoridad en derecho hondureño.
- **Cómo potenciarlo:** Implementar topic clusters con páginas pilar por categoría principal. Revisar canibalización entre posts similares (ej: 3 posts sobre divorcio). Añadir `updatedAt` real para posts que se actualizan. Publicar posts con regularidad, no en bloques.

### 3.8 RSS Feed + alternates declarado
- **Elemento positivo:** Feed RSS funcional correctamente declarado en el `<head>`.
- **Área:** SEO técnico / Distribución de contenido.
- **Evidencia:** `app/(public)/blog/feed.xml/route.ts`: genera RSS 2.0 con 30 items más recientes, namespaces content/dc/atom. `app/layout.tsx:62-66`: declarado en `alternates.types`.
- **Por qué aporta valor SEO:** Facilita distribución y descubrimiento de contenido. Google puede usar el feed para indexación rápida de nuevos posts. Agregadores de contenido pueden sindicar.
- **Cómo mantenerlo:** Asegurar que los posts en el feed tienen `lastMod` correcto. Verificar que el feed responde con `Content-Type: application/rss+xml`.

### 3.9 Modo noindex controlado por variable de entorno
- **Elemento positivo:** Control centralizado de indexación vía `NEXT_PUBLIC_NOINDEX`.
- **Área:** SEO técnico.
- **Evidencia:** `lib/site.ts:34-41`: `noindexActive = envNoindex === 'true'`. Una sola variable controla robots meta, X-Robots-Tag, sitemap (vacío) y meta tags. `next.config.ts:34-36`: X-Robots-Tag dinámico según entorno.
- **Por qué aporta valor SEO:** Previene indexación accidental de entornos de desarrollo/staging. Al desplegar en producción con `NEXT_PUBLIC_NOINDEX=false`, todo se activa automáticamente.
- **Cómo mantenerlo:** Verificar que en Vercel production la variable esté configurada como `false`. Documentar en el README.

---

# 4. PROBLEMAS DETECTADOS

---

### Problema 1: IndexNow con dominio erróneo
- **Problema:** El script `scripts/submit-indexnow.mjs:12` usa `www.pinedayasocioshn.com` en lugar de `www.pinedayasociadoshn.com` (falta "ad").
- **Área:** SEO técnico / Indexabilidad.
- **Severidad:** **CRÍTICO**.
- **Impacto SEO:** Alto.
- **Evidencia:** Línea 12 del script: `const HOST = 'www.pinedayasocioshn.com';`. El dominio correcto es `www.pinedayasociadoshn.com`. La variable `keyLocation` (línea 63) también hereda este host incorrecto.
- **Por qué importa:** IndexNow notifica instantáneamente a Bing, Yandex y otros buscadores sobre contenido nuevo o actualizado. Con este bug, **todas las URLs enviadas son rechazadas silenciosamente** porque el host no coincide con la key location registrada en `/.well-known/`. Si se ha ejecutado el script sin `--dry-run`, todas las submissions han fallado.
- **Recomendación:** Cambiar `const HOST = 'www.pinedayasocioshn.com'` por `const HOST = 'www.pinedayasociadoshn.com'` en la línea 12. Re-ejecutar con `node scripts/submit-indexnow.mjs` para enviar todas las URLs correctamente. Opcionalmente, refactorizar para que `HOST` se derive de `site.url` (evitar hardcodeo).
- **Prioridad:** Inmediata.
- **Esfuerzo:** Bajo (1 línea).
- **Tipo:** Puntual.
- **Riesgo de negocio:** Bing/Yandex/DuckDuckGo (~8% del mercado de búsqueda) no reciben notificaciones de nuevas URLs → indexación retrasada o inexistente.

---

### Problema 2: Google Search Console no configurado
- **Problema:** No existe verificación de GSC en el sitio. No hay meta tag de verificación de Google ni archivo HTML.
- **Área:** SEO técnico / Indexabilidad.
- **Severidad:** **CRÍTICO**.
- **Impacto SEO:** Alto.
- **Evidencia:** `app/layout.tsx:68-72`: solo tiene `msvalidate.01` (Bing). No hay `google-site-verification` en el objeto `metadata.verification`. No se encontró archivo HTML de verificación en `/public/`.
- **Por qué importa:** Sin GSC no se puede: enviar el sitemap manualmente, ver errores de rastreo, consultar rendimiento en búsquedas (impresiones/clics/CTR/posición media), ver problemas de indexación (páginas excluidas), recibir alertas de seguridad, analizar keywords que generan tráfico, ni inspeccionar URLs en vivo. Es **la herramienta #1 de diagnóstico SEO** en Google.
- **Recomendación:** Añadir el meta tag de verificación en `app/layout.tsx` en el campo `verification.google` del objeto `metadata`. También en `app/(public)/layout.tsx` si se quiere específico para rutas públicas. Ejemplo:
  ```ts
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE',
    other: { 'msvalidate.01': '0D7F7E114D9C22D0332B7769EBE015D4' },
  },
  ```
  Alternativa: subir el archivo HTML proporcionado por GSC a `/public/`.
- **Prioridad:** Inmediata.
- **Esfuerzo:** Bajo.
- **Tipo:** Puntual.
- **Riesgo de negocio:** Ceguera total sobre el rendimiento en Google (90%+ del tráfico de búsqueda). Sin GSC, cualquier problema de indexación pasa desapercibido durante semanas o meses.

---

### Problema 3: SearchAction schema apunta a ruta inexistente
- **Problema:** El schema `WebSite` define `potentialAction.SearchAction` con `urlTemplate: ${site.url}/buscar?q={search_term_string}`, pero la ruta `/buscar` no existe en el proyecto.
- **Área:** On-page SEO / Datos estructurados.
- **Severidad:** **ALTO**.
- **Impacto SEO:** Medio.
- **Evidencia:** `lib/site.ts:210-222`: `urlTemplate: ${site.url}/buscar?q={search_term_string}`. No hay archivo `app/(public)/buscar/page.tsx` ni `app/buscar/page.tsx`. No hay ruta de búsqueda implementada en el proyecto.
- **Por qué importa:** Google valida las URLs de SearchAction. Si la URL no existe (404), el schema completo puede ser ignorado o marcado como inválido en GSC → se pierde la oportunidad del sitelink de búsqueda en SERP (la caja de búsqueda que aparece debajo del resultado). Además, un warning persistente en GSC puede indicar baja calidad de datos estructurados.
- **Recomendación:** Opción A (recomendada): Crear una página `/buscar` funcional con un buscador simple que redirija a `/blog?tag=X` o similar. Opción B (si no se implementa búsqueda): Eliminar el bloque `potentialAction` del schema `websiteSchema()` hasta que exista la funcionalidad.
- **Prioridad:** Alta.
- **Esfuerzo:** Medio (Opción A), Bajo (Opción B).
- **Tipo:** Puntual.
- **Riesgo de negocio:** Schema inválido. Oportunidad perdida de sitelink de búsqueda en SERP.

---

### Problema 4: `images.unoptimized` contradictorio con la documentación del proyecto
- **Problema:** `next.config.ts:55` tiene `images: { unoptimized: false }`, pero el comentario (líneas 43-53) y `AGENTS.md` indican explícitamente que debe ser `true`. `false` significa que las imágenes **SÍ** pasan por el optimizador `/_next/image`, lo cual es lo contrario de lo que se documenta.
- **Área:** SEO técnico / Rendimiento.
- **Severidad:** **ALTO**.
- **Impacto SEO:** Medio.
- **Evidencia:** `next.config.ts:54-56`: `images: { unoptimized: false }`. El comentario contiguo (líneas 41-53) dice: "Las imágenes se sirven tal cual desde /public/images/* sin pasar por el optimizador". El valor `false` significa exactamente lo contrario: las imágenes **sí** pasan por el optimizador. `AGENTS.md` (sección "Sistema de imágenes") indica: "next.config.ts debe mantener `images: { unoptimized: true }`".
- **Por qué importa:** Con `unoptimized: false`, Next.js intenta redimensionar imágenes en runtime vía `/_next/image`. Si la imagen no encaja en dimensiones permitidas, devuelve HTTP 400. Esto puede romper imágenes en producción para ciertos tamaños/viewports. Además, añade latencia en el primer byte al pasar por el optimizador.
- **Recomendación:** Cambiar a `unoptimized: true` para que coincida con la intención documentada del proyecto y `AGENTS.md`. Si se quiere mantener la optimización, entonces: configurar explícitamente `imageSizes` y `deviceSizes`, y actualizar el comentario y `AGENTS.md` para reflejar el cambio.
- **Prioridad:** Alta.
- **Esfuerzo:** Bajo (1 línea).
- **Tipo:** Puntual.
- **Riesgo de negocio:** Imágenes potencialmente rotas (HTTP 400) en dispositivos móviles o viewports no previstos → mala UX → menor engagement → menor SEO.

---

### Problema 5: `sameAs` vacío en JSON-LD LegalService
- **Problema:** El campo `sameAs` del schema `LegalService` resulta en un array vacío porque las variables de entorno de redes sociales son `null`.
- **Área:** On-page SEO / Datos estructurados.
- **Severidad:** **MEDIO**.
- **Impacto SEO:** Medio.
- **Evidencia:** `lib/site.ts:84-87`: `facebook: null`, `instagram: null`, `tiktok: null`. Líneas 184-188: `sameAs: [null, null, null].filter(Boolean)` → `[]`. El schema resultante incluye `"sameAs": []`.
- **Por qué importa:** Google usa `sameAs` para consolidar la entidad en el Knowledge Graph (conectar el sitio web con perfiles sociales verificados). Un array vacío es una señal perdida de autoridad. Además, algunos validadores de schema pueden marcarlo como advertencia.
- **Recomendación:** Configurar las variables `NEXT_PUBLIC_SOCIAL_FACEBOOK`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, `NEXT_PUBLIC_SOCIAL_TIKTOK` con las URLs reales. Si no existen perfiles sociales, modificar el código para omitir el campo `sameAs` completamente (no enviarlo vacío):
  ```ts
  ...(site.social.facebook || site.social.instagram || site.social.tiktok ? {
    sameAs: [site.social.facebook, site.social.instagram, site.social.tiktok].filter(Boolean)
  } : {}),
  ```
- **Prioridad:** Media.
- **Esfuerzo:** Bajo.
- **Tipo:** Puntual.
- **Riesgo de negocio:** Señal de autoridad debilitada en Google Knowledge Graph. Entidad `LegalService` menos consolidada.

---

### Problema 6: Sin analítica (GA4 + Clarity no configurados)
- **Problema:** `NEXT_PUBLIC_GA_ID` y `NEXT_PUBLIC_CLARITY_ID` están vacíos → los scripts de medición no se cargan en producción.
- **Área:** Rendimiento general SEO.
- **Severidad:** **ALTO**.
- **Impacto SEO:** Alto.
- **Evidencia:** `lib/site.ts:96-98` retornan `null`. `app/layout.tsx:123-135` renderiza los scripts de GA4 y Clarity solo si las variables existen (`{process.env.NEXT_PUBLIC_GA_ID && (...)}`). En producción, no se carga ninguna analítica.
- **Por qué importa:** Sin analítica no se puede: medir tráfico orgánico y su evolución, atribuir conversiones (consultas solicitadas), identificar páginas de alto/bajo rendimiento, detectar problemas de rebote, justificar inversión en SEO, ni iterar basándose en datos. **Es imposible hacer SEO sin datos.**
- **Recomendación:** 1) Crear propiedad en Google Analytics 4. 2) Obtener el ID de medición (G-XXXXXXXX). 3) Configurar `NEXT_PUBLIC_GA_ID` en Vercel. 4) Opcionalmente crear proyecto en Microsoft Clarity y configurar `NEXT_PUBLIC_CLARITY_ID`. 5) Configurar eventos de conversión en GA4: envío exitoso del formulario de consulta.
- **Prioridad:** Alta.
- **Esfuerzo:** Bajo.
- **Tipo:** Puntual.
- **Riesgo de negocio:** Imposibilidad de medir retorno de cualquier esfuerzo SEO. Sin datos, no hay optimización posible. El SEO se convierte en un acto de fe.

---

### Problema 7: Blog sin paginación real — todos los posts en una página
- **Problema:** La página `/blog` carga y renderiza **los 134 posts** en una sola vista. `lib/blog.ts` tiene la función `getPostsByPage()` implementada pero **no se usa** en la página.
- **Área:** Arquitectura web / Indexabilidad.
- **Severidad:** **ALTO**.
- **Impacto SEO:** Medio.
- **Evidencia:** `app/(public)/blog/page.tsx:21`: `const allPosts = getAllPosts()` carga el array completo. Se renderizan todos en un grid infinito. `lib/blog.ts:58-60` tiene `getPostsByPage(posts, page, perPage)` lista para usar. La función `getTotalPages()` también está implementada y sin uso.
- **Por qué importa:** 134 posts en una sola página generan: (1) DOM extremadamente pesado → penaliza LCP y TBT en Core Web Vitals; (2) Google gasta crawl budget renderizando extractos de 134 posts en vez de descubrir nuevas URLs; (3) Los posts al final de la página (posts #100-134) tienen probabilidad casi nula de ser vistos por usuarios o rastreadores; (4) Sin `rel="prev/next"`, Google no entiende la relación entre páginas.
- **Recomendación:** Implementar paginación real con parámetro `?page=N`. Usar `getPostsByPage(allPosts, page, 12)`. Añadir `<link rel="prev">` y `<link rel="next">` en el `<head>`. Añadir self-canonical con el número de página (`/blog?page=2` → canonical a sí misma).
- **Prioridad:** Alta.
- **Esfuerzo:** Medio.
- **Tipo:** Patrón (también aplica a páginas de categoría de blog).
- **Riesgo de negocio:** Crawl budget malgastado. Posts antiguos o menos relevantes pueden no indexarse nunca. Mala experiencia de usuario en móviles por DOM enorme.

---

### Problema 8: Breadcrumbs solo implementados en blog — ausentes en resto de páginas
- **Problema:** No existe un componente de breadcrumbs reutilizable. Solo `/blog/[slug]` tiene breadcrumbs (implementados inline). Páginas de servicios, despacho, FAQ, contacto, etc. no tienen breadcrumbs ni schema BreadcrumbList.
- **Área:** On-page SEO / Arquitectura web.
- **Severidad:** **MEDIO**.
- **Impacto SEO:** Medio.
- **Evidencia:** `app/(public)/blog/[slug]/page.tsx:73-85` tiene breadcrumbs inline. No se encontró componente `breadcrumbs.tsx` en `components/`. Páginas como `servicios-juridicos/[slug]`, `derecho-penal/[slug]`, `despacho`, `preguntas-frecuentes`, etc. no incluyen breadcrumbs en su JSX. Algunas generan `BreadcrumbList` schema vía `areaSchemas()` pero no lo renderizan visualmente (no coincidencia entre schema y UI).
- **Por qué importa:** Los breadcrumbs: (1) mejoran la navegación del usuario; (2) Google los muestra en SERP como ruta de navegación (mejora CTR); (3) distribuyen link equity internamente; (4) refuerzan la jerarquía semántica del sitio. Sin ellos, se pierde una señal importante de arquitectura.
- **Recomendación:** Crear un componente `<Breadcrumbs>` reutilizable en `components/marketing/breadcrumbs.tsx` que acepte un array de `{label, href}`. Incluir schema `BreadcrumbList` en el JSON-LD. Integrarlo en el `PageHero` o en un wrapper de layout. Aplicar consistentemente en todas las páginas públicas.
- **Prioridad:** Media.
- **Esfuerzo:** Medio.
- **Tipo:** Patrón.
- **Riesgo de negocio:** Oportunidad perdida de breadcrumbs en SERP. Menor distribución de autoridad interna.

---

### Problema 9: OG image genérica para todas las páginas
- **Problema:** Todas las páginas del sitio comparten la misma imagen Open Graph (`/og-image.png`). No hay imágenes específicas por página, servicio o post de blog.
- **Área:** On-page SEO.
- **Severidad:** **MEDIO**.
- **Impacto SEO:** Medio.
- **Evidencia:** `og-image.png` se referencia en `app/layout.tsx:57`, `app/(public)/layout.tsx:32-36`, y en metadata de páginas individuales como `derecho-penal`, `despacho`, etc. Todas apuntan a la misma imagen. Los posts de blog sí usan `post.coverImage` cuando existe.
- **Por qué importa:** La imagen OG es lo que se muestra al compartir en redes sociales, WhatsApp, Telegram, LinkedIn. Una imagen genérica reduce el CTR social y la probabilidad de que el contenido sea compartido. Imágenes específicas por servicio/área aumentarían el engagement en redes.
- **Recomendación:** Crear imágenes OG específicas para: home, /despacho, /servicios-juridicos (genérica de servicios), /derecho-penal, /hondurenos-en-espana, /blog, /preguntas-frecuentes, /solicitar-consulta. Usar una plantilla base con el logo del bufete + texto descriptivo. Priorizar páginas con mayor potencial de ser compartidas.
- **Prioridad:** Media.
- **Esfuerzo:** Medio.
- **Tipo:** Patrón.
- **Riesgo de negocio:** Menor CTR en redes sociales. Oportunidad perdida de branding visual.

---

### Problema 10: Riesgo de canibalización entre posts de blog similares
- **Problema:** Existen múltiples posts sobre el mismo tema con títulos y enfoques similares pero URLs diferentes, compitiendo por las mismas keywords.
- **Área:** Contenido.
- **Severidad:** **MEDIO**.
- **Impacto SEO:** Medio.
- **Evidencia:** Ejemplos detectados:
  - 3 posts sobre divorcio: `divorcio-honduras-pasos-requisitos`, `divorcio-tipos-requisitos-tiempos-honduras`, `divorcio-express-mutuo-acuerdo-honduras`.
  - 2 posts sobre pensión alimenticia: `pension-alimenticia-calcular-reclamar-honduras`, `pension-alimenticia-honduras-como-solicitarla`.
  - 3 posts sobre despido: `despido-laboral-honduras-derechos`, `despido-injustificado-honduras-derechos-trabajador`, `despido-empleados-publicos-procedencia-defensa-honduras`.
  - 2 posts sobre contratos mercantiles: `contratos-mercantiles-esenciales-empresas-honduras`, `contratos-mercantiles-proteger-negocio`.
  - 2 posts sobre constitución de empresas: `constitucion-empresas-honduras-pasos-legales`, `constituir-empresa-guia-paso-a-paso-honduras`.
  - 2 posts sobre importación: `importar-desde-china-guia-legal-aduanera-honduras`, `importar-mercancias-guia-legal-aduanera-honduras`.
- **Por qué importa:** Cuando múltiples páginas del mismo sitio compiten por la misma keyword, Google no sabe cuál rankear → diluye la autoridad entre ellas → ninguna rankea bien. Es el clásico problema de canibalización de keywords.
- **Recomendación:** Auditoría de canibalización: para cada cluster temático, identificar si los posts cubren ángulos realmente distintos o si compiten. Opciones: (a) Fusionar posts similares en uno más completo (redirigiendo los antiguos 301); (b) Diferenciar claramente el keyword target de cada post; (c) Crear una página pilar que enlace a los posts como subtemas. Revisar con datos de GSC (cuando esté configurado) para identificar qué URLs canibalizan.
- **Prioridad:** Media.
- **Esfuerzo:** Alto (requiere análisis manual por cluster y reescritura).
- **Tipo:** Patrón.
- **Riesgo de negocio:** Rankings diluidos en keywords de alto valor (divorcio, pensión alimenticia, despido). Tráfico fragmentado entre múltiples URLs.

---

### Problema 11: Tags del blog potencialmente generando thin content indexable
- **Problema:** El blog tiene ~300 tags únicos. La página de blog permite filtrar por tag (`?tag=X`) pero no está claro si estas URLs de filtro son indexables o tienen canonical correcto.
- **Área:** Indexabilidad / Arquitectura.
- **Severidad:** **MEDIO**.
- **Impacto SEO:** Bajo-Medio.
- **Evidencia:** `app/(public)/blog/page.tsx:21`: `const tagFilter = searchParams?.tag`. La sidebar (`BlogSidebar`) lista ~318 tags (contados del HTML renderizado). No se observa `noindex` en estas URLs filtradas. El sitemap no incluye URLs con parámetros de tag.
- **Por qué importa:** Si Google descubre URLs como `/blog?tag=divorcio+honduras`, podría indexar páginas con contenido duplicado (los mismos posts aparecen bajo múltiples combinaciones de tags). Esto diluye la autoridad y consume crawl budget.
- **Recomendación:** Añadir canonical a la página `/blog` (sin parámetros) cuando se aplica un filtro de tag, para que todas las variantes apunten a la URL canónica. O alternativamente, usar `noindex, follow` en páginas con parámetro `tag`. La opción más limpia: implementar páginas de tag dedicadas (`/blog/etiqueta/divorcio`) con contenido curado y canónicals correctos.
- **Prioridad:** Media.
- **Esfuerzo:** Bajo.
- **Tipo:** Patrón.
- **Riesgo de negocio:** Thin content indexado. Crawl budget malgastado en URLs de filtro.

---

### Problema 12: Meta descriptions auto-generadas en páginas de servicio
- **Problema:** Algunas meta descriptions se generan automáticamente truncando los primeros 160 caracteres del contenido, en lugar de ser redactadas manualmente con intención de búsqueda.
- **Área:** On-page SEO.
- **Severidad:** **BAJO**.
- **Impacto SEO:** Bajo.
- **Evidencia:** En `app/(public)/servicios-juridicos/[slug]/page.tsx` (según el análisis de código), la description se construye con `area.descripcion.substring(0, 160) + '... Consulta confidencial...'`. Aunque el sufijo añade valor, las descripciones puramente generadas no están optimizadas para CTR en SERP.
- **Por qué importa:** La meta description es el texto que aparece debajo del título en los resultados de búsqueda. Una descripción bien redactada (con call to action, keywords secundarias, propuesta de valor) puede aumentar el CTR significativamente. Las descripciones truncadas rara vez son óptimas.
- **Recomendación:** Añadir un campo `metaDescription` en los datos de cada área (`data/areas-juridicas.ts`) con una descripción manual de 150-160 caracteres optimizada para conversión. Usar ese campo en lugar del truncamiento automático. Priorizar las áreas con mayor volumen de búsqueda (penal, familia, laboral).
- **Prioridad:** Baja.
- **Esfuerzo:** Medio.
- **Tipo:** Patrón.
- **Riesgo de negocio:** CTR subóptimo en SERP para páginas de servicio.

---

### Problema 13: Manifest PWA solo con icono SVG
- **Problema:** El archivo `manifest.json` solo referencia un icono SVG (`icon-192.svg`). No hay iconos PNG en 192×192 ni 512×512, requeridos para instalación PWA en la mayoría de dispositivos.
- **Área:** SEO técnico / PWA.
- **Severidad:** **BAJO**.
- **Impacto SEO:** Bajo.
- **Evidencia:** `public/manifest.json`: `"icons": [{ "src": "/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml" }]`. Sin iconos PNG. Los dispositivos iOS no soportan SVG como icono de PWA.
- **Por qué importa:** Google usa la instalabilidad PWA como señal (menor) de calidad. El manifest sin iconos adecuados impide que el sitio se pueda instalar como app en la mayoría de dispositivos, perdiendo esta señal y una oportunidad de engagement.
- **Recomendación:** Generar iconos PNG en 192×192 y 512×512 a partir del SVG. Añadirlos al array `icons` del manifest. También generar `apple-touch-icon.png` de 180×180.
- **Prioridad:** Baja.
- **Esfuerzo:** Bajo.
- **Tipo:** Puntual.
- **Riesgo de negocio:** Señal PWA perdida. Imposibilidad de instalación como app.

---

### Problema 14: `lastmod` uniforme en páginas estáticas del sitemap
- **Problema:** Todas las páginas estáticas en el sitemap muestran `lastmod: new Date()` (fecha del build), en lugar de reflejar la fecha real de última modificación.
- **Área:** SEO técnico / Sitemap.
- **Severidad:** **BAJO**.
- **Impacto SEO:** Bajo.
- **Evidencia:** `app/sitemap.ts:63-67`: `lastModified: r.lastModified ?? now`. `PUBLIC_ROUTES` no define `lastModified` para ninguna ruta estática, por lo que todas caen en `now`. Los posts sí usan `p.publishedAt`.
- **Por qué importa:** Google usa `lastmod` para priorizar el rastreo de páginas recién actualizadas. Si todas las páginas muestran la misma fecha, Google no puede distinguir contenido fresco de contenido estático → gasta crawl budget en páginas que no han cambiado.
- **Recomendación:** Para páginas estáticas que no cambian (legales, contacto), usar una fecha fija antigua o `yearly` como frecuencia. Para páginas que sí se actualizan (servicios, despacho), añadir `lastModified` con la fecha real de la última modificación.
- **Prioridad:** Baja.
- **Esfuerzo:** Bajo.
- **Tipo:** Patrón.
- **Riesgo de negocio:** Crawl budget ligeramente ineficiente.

---

# 5. OPORTUNIDADES DE MEJORA

---

## 5.1 Quick Wins (alto impacto / bajo esfuerzo)

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **Corregir HOST en IndexNow** | Todas las submissions actuales fallan. Corregir `pinedayasocioshn` → `pinedayasociadoshn` en `scripts/submit-indexnow.mjs:12` | Alto | Baja | Ninguna |
| 2 | **Configurar Google Search Console** | Añadir meta tag `google-site-verification` en `app/layout.tsx` (objeto `verification`). Enviar sitemap. | Alto | Baja | Tener acceso a GSC |
| 3 | **Configurar GA4** | Crear propiedad, obtener ID, configurar `NEXT_PUBLIC_GA_ID` en Vercel. | Alto | Baja | Tener cuenta Google |
| 4 | **Corregir `images.unoptimized`** | Cambiar a `true` en `next.config.ts:55` para alinear con documentación. | Medio | Baja | Ninguna |
| 5 | **Corregir SearchAction schema** | Eliminar `potentialAction` del schema `websiteSchema()` hasta que `/buscar` exista. | Medio | Baja | Ninguna |
| 6 | **Corregir `sameAs` vacío** | Configurar env vars de redes sociales o condicionar la inclusión del campo. | Medio | Baja | URLs de redes sociales |
| 7 | **Añadir canonical en URLs de tag del blog** | Evitar indexación de `/blog?tag=X`. Canonical → `/blog`. | Medio | Baja | Ninguna |

---

## 5.2 Mejoras estratégicas

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **Implementar paginación en blog** | Reducir DOM, optimizar crawl budget, mejorar UX. Usar `getPostsByPage()`. | Alto | Media | Ninguna |
| 2 | **Crear componente Breadcrumbs global** | Mejorar navegación, habilitar rich snippets en SERP. Aplicar a todas las páginas. | Alto | Media | Componente PageHero existente |
| 3 | **Auditar canibalización de posts** | Fusionar posts similares, crear páginas pilar. Usar datos de GSC para priorizar. | Alto | Alta | GSC configurado |
| 4 | **Crear páginas pilar por categoría de blog** | Estructurar topic clusters: página pilar → posts de soporte. Ej: `/blog/guia-divorcio-honduras` como pilar. | Alto | Alta | Auditoría de canibalización |
| 5 | **Conectar categorías de blog con navegación** | El menú principal no enlaza al blog ni a sus categorías. Añadir dropdown "Blog" → categorías principales. | Medio | Media | Ninguna |

---

## 5.3 Mejoras técnicas

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **OG images específicas por página** | Aumentar CTR en redes sociales. Usar plantilla con logo + texto descriptivo. | Medio | Media | Diseño de plantillas |
| 2 | **Diferenciar `lastmod` en sitemap** | Usar fechas reales de modificación para cada página estática. | Bajo | Baja | Ninguna |
| 3 | **Añadir `image:image` al sitemap** | Para posts con `coverImage`, añadir información de imagen al sitemap. | Bajo | Baja | Ninguna |
| 4 | **Implementar lazy loading condicional en blog** | Cargar posts bajo demanda (infinite scroll con History API) en lugar de renderizar 134. | Medio | Media | Paginación implementada |
| 5 | **Añadir iconos PNG al manifest PWA** | Generar 192×192 y 512×512 PNG. Habilitar instalabilidad PWA. | Bajo | Baja | Archivo SVG fuente |

---

## 5.4 Mejoras de contenido

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **Meta descriptions manuales en páginas de servicio** | Añadir campo `metaDescription` en datos de áreas. Redactar con CTA y keywords. | Medio | Media | Ninguna |
| 2 | **Revisar posts de 3 min (thin content)** | Identificar posts con menos de 500 palabras y evaluar si ampliarlos o fusionarlos. | Medio | Media | Ninguna |
| 3 | **Añadir `updatedAt` a posts** | Actualizar posts antiguos con nueva información legal y reflejar la fecha real de actualización. | Medio | Alta (134 posts) | Investigación legal |
| 4 | **Crear contenido fresh semanal** | Publicar al menos 1 post/semana para mantener señal de frescura. Actualmente los posts son de mayo-julio 2026. | Alto | Alta | Producción de contenido |
| 5 | **Implementar E-E-A-T en blog** | Añadir páginas de autor con bio y credenciales. Enlazar desde cada post. | Medio | Media | Información de autores |

---

## 5.5 Mejoras de arquitectura / enlazado interno

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **Añadir breadcrumbs con schema en todas las páginas** | Partir del componente actual del blog y generalizarlo. | Alto | Media | Ninguna |
| 2 | **Enlazar servicios desde posts de blog** | Cada post debería enlazar a su página de servicio relacionada (ej: post sobre divorcio → servicio derecho de familia). | Alto | Media | Mapeo post→servicio |
| 3 | **Añadir "servicios relacionados" en posts de blog** | Debajo del contenido, incluir tarjetas de servicios asociados a la categoría del post. | Medio | Baja | Ninguna |
| 4 | **Menú de navegación enriquecido** | Añadir dropdown en "Servicios Jurídicos" con las 13 áreas. Actualmente requiere clic para verlas. | Medio | Media | Rediseño de header |
| 5 | **Cross-linking entre hubs** | Enlazar `/derecho-penal` desde `/servicios-juridicos` y viceversa como áreas relacionadas. | Medio | Baja | Ninguna |

---

## 5.6 Mejoras de indexación / rastreo

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **Enviar sitemap a GSC** | Una vez configurado GSC, enviar `sitemap.xml` manualmente. | Alto | Baja | GSC configurado |
| 2 | **Configurar IndexNow automation** | Programar envío automático post-build (ej: script en `postbuild` de Vercel). | Medio | Media | IndexNow HOST corregido |
| 3 | **Verificar cobertura en GSC** | Revisar páginas indexadas vs excluidas. Corregir errores de rastreo. | Alto | Baja | GSC configurado |
| 4 | **Solicitar indexación de URLs prioritarias** | Usar la herramienta de inspección de URLs de GSC para forzar indexación de home y hubs. | Medio | Baja | GSC configurado |
| 5 | **Monitorizar crawl stats en GSC** | Revisar cuántas páginas rastrea Google al día. Ajustar si es necesario. | Medio | Baja | GSC configurado |

---

## 5.7 Mejoras de snippets / SERP visibility

| # | Qué hacer | Por qué | Impacto | Dificultad | Dependencias |
|---|-----------|--------|---------|------------|--------------|
| 1 | **Implementar FAQ schema en todas las páginas de servicio** | La home ya lo tiene. Extender a servicios y derecho penal usando los datos de FAQ existentes en `data/areas-juridicas.ts`. | Alto | Media | Ninguna |
| 2 | **Crear HowTo schema para guías paso a paso** | Algunos posts del blog son guías prácticas (ej: registro de marca paso a paso). Añadir `HowTo` schema. | Medio | Media | Identificar posts aplicables |
| 3 | **Optimizar titles para CTR** | Revisar titles de páginas principales. Añadir año actual, ubicación o CTA implícito donde aplique. | Medio | Baja | Ninguna |
| 4 | **Implementar `Review` schema** | Si se recopilan reseñas de clientes (Google My Business, Facebook), integrarlas con schema Review. | Bajo | Media | Reseñas reales |
| 5 | **Añadir `VideoObject` schema** | Si se crea contenido en video, añadir schema VideoObject en las páginas correspondientes. | Bajo | Alta | Producción de video |

---

# 6. PLAN DE ACCIÓN PRIORIZADO

---

## Fase 1 — Inmediato (0-30 días)

**Objetivo:** Corregir bugs críticos, habilitar medición, establecer visibilidad en Google.

| # | Acción | Motivo | Impacto | Dificultad | Prioridad | Responsable | Dependencias | Resultado esperado |
|---|--------|--------|---------|------------|-----------|-------------|--------------|-------------------|
| 1 | Corregir `HOST` en `scripts/submit-indexnow.mjs` (línea 12) | Bug que rompe todas las notificaciones a Bing/IndexNow | Alto | Baja | **Crítica** | Desarrollo | Ninguna | IndexNow empieza a funcionar |
| 2 | Configurar Google Search Console (añadir `google-site-verification` en `app/layout.tsx`, verificar propiedad, enviar sitemap) | Sin GSC no hay visibilidad del rendimiento en Google | Alto | Baja | **Crítica** | SEO / Desarrollo | Acceso a GSC | Datos de rendimiento en 48-72h |
| 3 | Configurar GA4 (`NEXT_PUBLIC_GA_ID`) y Microsoft Clarity (`NEXT_PUBLIC_CLARITY_ID`) en Vercel | Sin analítica no se puede medir nada | Alto | Baja | **Crítica** | SEO / Desarrollo | Cuenta Google, cuenta Microsoft | Datos de tráfico en 24h |
| 4 | Cambiar `images.unoptimized` a `true` en `next.config.ts` | Alinear con documentación y prevenir errores 400 en imágenes | Medio | Baja | Alta | Desarrollo | Ninguna | Imágenes servidas directamente sin optimizador |
| 5 | Eliminar `potentialAction` del schema `websiteSchema()` hasta que `/buscar` exista | Evitar schema inválido | Medio | Baja | Alta | Desarrollo | Ninguna | Schema Website limpio sin errores |
| 6 | Configurar URLs de redes sociales o condicionar `sameAs` en `legalServiceSchema()` | Evitar array vacío en schema | Medio | Baja | Media | SEO / Desarrollo | URLs de redes | Schema LegalService con sameAs poblado |
| 7 | Añadir canonical en páginas de blog con filtro `?tag=` → canonical a `/blog` | Evitar indexación de thin content por filtro | Medio | Baja | Media | Desarrollo | Ninguna | URLs de tag consolidada |

---

## Fase 2 — 30-60 días

**Objetivo:** Mejorar arquitectura, enlazado interno y experiencia de rastreo.

| # | Acción | Motivo | Impacto | Dificultad | Prioridad | Responsable | Dependencias | Resultado esperado |
|---|--------|--------|---------|------------|-----------|-------------|--------------|-------------------|
| 1 | Implementar paginación en blog (`?page=N`) con `rel="prev/next"` y canonicals | Reducir DOM, optimizar crawl budget | Alto | Media | Alta | Desarrollo | Ninguna | Blog paginado con 12 posts/página |
| 2 | Crear componente `<Breadcrumbs>` y añadirlo a todas las páginas públicas con schema BreadcrumbList | Mejorar navegación y habilitar rich snippets | Alto | Media | Alta | Desarrollo | Ninguna | Breadcrumbs visibles + schema en SERP |
| 3 | Revisar datos en GSC: indexación, errores, keywords, CTR | Identificar problemas reales de indexación | Alto | Baja | Alta | SEO | GSC configurado (Fase 1) | Diagnóstico basado en datos reales |
| 4 | Configurar eventos de conversión en GA4 (formulario de consulta enviado) | Medir conversiones desde tráfico orgánico | Alto | Baja | Alta | SEO / Desarrollo | GA4 configurado (Fase 1) | Datos de conversión |
| 5 | Crear OG images específicas para home, despacho, servicios-juridicos, derecho-penal, blog, FAQ, contacto | Aumentar CTR en redes sociales | Medio | Media | Media | Diseño / SEO | Plantillas de diseño | OG images únicas por sección |
| 6 | Añadir enlaces a servicios relacionados al final de cada post de blog | Fortalecer enlazado interno y distribución de autoridad | Medio | Media | Media | Desarrollo | Mapeo post→servicio | Mejor interlinking |

---

## Fase 3 — 60-90 días

**Objetivo:** Optimización de contenido y creación de topic clusters.

| # | Acción | Motivo | Impacto | Dificultad | Prioridad | Responsable | Dependencias | Resultado esperado |
|---|--------|--------|---------|------------|-----------|-------------|--------------|-------------------|
| 1 | Auditoría de canibalización: identificar y resolver posts que compiten | Eliminar dilución de rankings en keywords clave | Alto | Alta | Alta | SEO / Contenido | GSC con datos (Fase 2) | Rankings consolidados |
| 2 | Fusionar posts similares y redirigir con 301 (priorizar clusters: divorcio, pensión, despido) | Unificar autoridad en una URL canónica | Alto | Alta | Alta | Contenido / SEO | Auditoría de canibalización | URLs fusionadas, rankings mejorados |
| 3 | Crear páginas pilar para categorías principales (derecho penal, divorcio, despido laboral, herencias) | Establecer topic clusters | Alto | Alta | Alta | Contenido / SEO | Ninguna | Páginas pilar publicadas |
| 4 | Redactar meta descriptions manuales para las 13 páginas de servicio | Mejorar CTR en SERP | Medio | Media | Media | Contenido / SEO | Ninguna | Meta descriptions optimizadas |
| 5 | Añadir FAQ schema en páginas de servicio donde ya existen FAQs en los datos | Habilitar rich snippets FAQ | Alto | Media | Alta | Desarrollo | Ninguna | Rich snippets FAQ en SERP |
| 6 | Implementar menú dropdown en navegación para "Servicios Jurídicos" y "Blog" | Mejorar descubrimiento y enlazado interno | Medio | Media | Media | Diseño / Desarrollo | Ninguna | Navegación enriquecida |

---

## Fase 4 — 90+ días

**Objetivo:** Consolidación, automatización y mejora continua.

| # | Acción | Motivo | Impacto | Dificultad | Prioridad | Responsable | Dependencias | Resultado esperado |
|---|--------|--------|---------|------------|-----------|-------------|--------------|-------------------|
| 1 | Automatizar envío de IndexNow en postbuild de Vercel | Notificar automáticamente tras cada deploy | Medio | Media | Media | Desarrollo | IndexNow corregido (Fase 1) | IndexNow automático |
| 2 | Crear páginas de autor con bio y credenciales (E-E-A-T) | Reforzar Experience, Expertise, Authoritativeness, Trustworthiness | Alto | Media | Alta | Contenido | Información de autores | Señal E-E-A-T mejorada |
| 3 | Revisar y actualizar posts antiguos con `updatedAt` real | Mantener frescura del contenido | Medio | Alta | Media | Contenido | Ninguna | Posts actualizados con fechas reales |
| 4 | Implementar `HowTo` schema en posts que son guías paso a paso | Habilitar rich snippets HowTo | Medio | Media | Media | Desarrollo / Contenido | Identificar posts aplicables | Rich snippets HowTo |
| 5 | Establecer calendario editorial: mínimo 1 post/semana | Mantener señal de sitio activo y creciente | Alto | Alta | Media | Contenido | Ninguna | Publicación regular |
| 6 | Análisis competitivo si se dispone de competidores | Identificar gaps de keywords y contenido | Medio | Media | Media | SEO | Acceso a herramientas (Ahrefs/Semrush) | Estrategia competitiva |

---

# 7. RECOMENDACIONES CONCRETAS DE IMPLEMENTACIÓN

---

## 7.1 Correcciones de código (quick fixes)

### 7.1.1 IndexNow HOST
**Archivo:** `scripts/submit-indexnow.mjs`
**Línea 12:**
```js
// ACTUAL (ERRÓNEO):
const HOST = 'www.pinedayasocioshn.com';
// CORRECCIÓN:
const HOST = 'www.pinedayasociadoshn.com';
```

### 7.1.2 images.unoptimized
**Archivo:** `next.config.ts`
**Línea 55:**
```ts
// ACTUAL (CONTRADICTORIO):
images: { unoptimized: false },
// CORRECCIÓN:
images: { unoptimized: true },
```

### 7.1.3 Google Search Console verification
**Archivo:** `app/layout.tsx`
**Línea 68-72:**
```ts
// ACTUAL:
verification: {
  other: {
    'msvalidate.01': '0D7F7E114D9C22D0332B7769EBE015D4',
  },
},
// CORRECCIÓN (añadir google después de obtener el código de GSC):
verification: {
  google: 'CÓDIGO_DE_VERIFICACIÓN_GOOGLE',
  other: {
    'msvalidate.01': '0D7F7E114D9C22D0332B7769EBE015D4',
  },
},
```

### 7.1.4 SearchAction schema
**Archivo:** `lib/site.ts`
**Líneas 210-222:**
```ts
// ACTUAL (SearchAction apunta a /buscar inexistente):
potentialAction: [
  {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${site.url}/buscar?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
],
// CORRECCIÓN (eliminar hasta que exista /buscar):
// (eliminar todo el array potentialAction o comentarlo)
```

### 7.1.5 sameAs condicional
**Archivo:** `lib/site.ts`
**Líneas 184-188:**
```ts
// ACTUAL (array vacío si no hay redes):
sameAs: [
  site.social.facebook,
  site.social.instagram,
  site.social.tiktok,
].filter(Boolean),
// CORRECCIÓN (omitir campo si no hay datos):
...(site.social.facebook || site.social.instagram || site.social.tiktok ? {
  sameAs: [
    site.social.facebook,
    site.social.instagram,
    site.social.tiktok,
  ].filter(Boolean)
} : {}),
```

### 7.1.6 Canonical en páginas de blog con filtro tag
**Archivo:** `app/(public)/blog/page.tsx`
**Línea 12-16 (metadata):**
```ts
// Añadir en metadata:
export const metadata: Metadata = {
  // ... existente ...
  alternates: { canonical: '/blog' },
};
// Esto asegura que /blog?tag=X tenga canonical a /blog
```

---

## 7.2 Ejemplos de implementación

### 7.2.1 Componente Breadcrumbs reutilizable
```tsx
// components/marketing/breadcrumbs.tsx
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `${site.url}${item.href}` : undefined,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-muted py-3">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} />}
            {item.href ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {i === 0 && <Home size={12} className="inline mr-1" />}
                {item.label}
              </Link>
            ) : (
              <span className="text-text-secondary">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </>
  );
}
```

**Uso en una página de servicio:**
```tsx
<Breadcrumbs items={[
  { label: 'Inicio', href: '/' },
  { label: 'Servicios Jurídicos', href: '/servicios-juridicos' },
  { label: 'Derecho de Familia' },
]} />
```

### 7.2.2 Paginación del blog
**Archivo:** `app/(public)/blog/page.tsx`

Añadir:
```tsx
import { getPostsByPage, getTotalPages } from '@/lib/blog';

const ITEMS_PER_PAGE = 12;

export default async function BlogHubPage(props: { searchParams?: Promise<{ tag?: string; page?: string }> }) {
  const searchParams = await props.searchParams;
  const tagFilter = searchParams?.tag;
  const page = parseInt(searchParams?.page ?? '1', 10) || 1;
  
  const allPosts = getAllPosts();
  const filteredPosts = tagFilter ? getPostsByTag(tagFilter) : allPosts;
  const totalPages = getTotalPages(filteredPosts, ITEMS_PER_PAGE);
  const posts = getPostsByPage(filteredPosts, page, ITEMS_PER_PAGE);
  
  // ... renderizar posts ...
  
  {/* Paginación */}
  {totalPages > 1 && (
    <nav className="flex justify-center gap-2 mt-8" aria-label="Paginación">
      {page > 1 && (
        <Link href={`/blog?page=${page - 1}${tagFilter ? `&tag=${tagFilter}` : ''}`}
          className="px-4 py-2 rounded-md border hover:border-accent">
          ← Anterior
        </Link>
      )}
      <span className="px-4 py-2 text-sm text-text-secondary">
        Página {page} de {totalPages}
      </span>
      {page < totalPages && (
        <Link href={`/blog?page=${page + 1}${tagFilter ? `&tag=${tagFilter}` : ''}`}
          className="px-4 py-2 rounded-md border hover:border-accent">
          Siguiente →
        </Link>
      )}
    </nav>
  )}
}
```

En metadata, añadir:
```tsx
alternates: {
  canonical: tagFilter || page > 1 
    ? `/blog${page > 1 ? `?page=${page}` : ''}${tagFilter ? `${page > 1 ? '&' : '?'}tag=${tagFilter}` : ''}`
    : '/blog',
},
```

### 7.2.3 Title tag mejorado (ejemplo)
**Página:** `/derecho-penal`
```html
<!-- ACTUAL -->
<title>Derecho Penal | Pineda y Asociados</title>

<!-- MEJORADO (incluye ubicación + propuesta de valor) -->
<title>Abogados Penalistas en Nacaome, Valle | Defensa Penal · Pineda y Asociados</title>
```

### 7.2.4 Meta description mejorada (ejemplo)
**Página:** `/servicios-juridicos/derecho-de-familia`
```html
<!-- ACTUAL (auto-generada, primeros 160 chars) -->
<meta name="description" content="Divorcio, custodia, alimentos, sucesiones y protección de menores... Consulta confidencial en Pineda y Asociados, Nacaome, Valle, Honduras.">

<!-- MEJORADA (redactada manualmente) -->
<meta name="description" content="Abogados de familia en Nacaome, Valle. Divorcio, custodia de hijos, pensión alimenticia, adopciones y sucesiones. Consulta confidencial sin compromiso. 15+ años de experiencia.">
```

### 7.2.5 H1 recomendado (ejemplo)
**Página:** `/preguntas-frecuentes`
```html
<!-- ACTUAL -->
<h1>Resuelva sus dudas legales</h1>

<!-- MEJORADO (más descriptivo, incluye keywords) -->
<h1>Preguntas Frecuentes sobre Derecho en Honduras — Respuestas de Abogados</h1>
```

---

## 7.3 Cambios a nivel CMS/plantilla vs cambios por URL

### Cambios globales (plantilla/layout)
1. **Breadcrumbs** → Nuevo componente en `components/marketing/`, integrar en `PageHero` o layout público.
2. **OG images** → Nueva lógica en `generateMetadata()` de cada layout para seleccionar imagen según ruta.
3. **Paginación** → Refactor de `app/(public)/blog/page.tsx` y `app/(public)/blog/categoria/[categoria]/page.tsx`.
4. **FAQ schema** → Extender `areaSchemas()` en `lib/schemas/legal-page.ts` para incluir FAQPage en todas las páginas de servicio.

### Cambios por URL concreta
1. **Meta descriptions de servicios** → Añadir campo `metaDescription` en cada entrada de `data/areas-juridicas.ts` (13 áreas + 7 grupos penal + 3 subáreas migrantes).
2. **Titles de hubs** → Revisar y optimizar titles de `/derecho-penal`, `/servicios-juridicos`, `/hondurenos-en-espana`.
3. **Fusión de posts** → Identificar y fusionar posts canibalizados. Crear redirecciones 301 en `next.config.ts`.
4. **Páginas pilar** → Crear nuevas páginas en `app/(public)/blog/` o `app/(public)/guias/` para topic clusters.

---

# 8. ANÁLISIS POR TIPO DE PÁGINA

---

## 8.1 Home (`/`)
- **Estado actual:** Sólido. Contenido rico (~550 líneas JSX), hero con propuesta de valor clara, trust bar, áreas destacadas, grid de servicios, testimonios, proceso, FAQ, CTA. Schema: WebPage + FAQPage.
- **Problemas comunes:** OG image genérica. Las preguntas de la sección "Preguntas reales" enlazan todas a `/preguntas-frecuentes` en lugar de a páginas de respuesta específicas.
- **Oportunidades:** Añadir enlaces a páginas de servicio desde las "preguntas reales" (ej: "¿Me pueden detener sin orden judicial?" → `/derecho-penal`). Implementar lazy loading para la sección de testimonios y FAQ.
- **Prioridad de intervención:** Media.

---

## 8.2 Hubs (Derecho Penal, Hondureños en España)
- **Estado actual:** Bueno. `/derecho-penal`: hero, trust bar, 7 grupos especializados en grid, FAQ específica, posts relacionados. `/hondurenos-en-espana`: estructura similar con 3 subáreas.
- **Problemas comunes:** Sin breadcrumbs visuales (aunque schema BreadcrumbList se genera). OG image genérica. Sin enlace cruzado entre hubs.
- **Oportunidades:** Añadir breadcrumbs. Conectar `/derecho-penal` con `/servicios-juridicos` mediante sección de "áreas relacionadas". Crear página pilar de derecho penal con estructura de topic cluster.
- **Prioridad de intervención:** Media.

---

## 8.3 Servicios (13 páginas de área jurídica)
- **Estado actual:** Bueno. Cada página tiene: hero, sección "Qué hacemos", subservicios con iconos, FAQ, áreas relacionadas, posts de blog asociados, CTA, JSON-LD (LegalService + FAQ + BreadcrumbList vía schema).
- **Problemas comunes:** Meta description auto-generada (primeros 160 chars). Sin breadcrumbs visuales. OG image genérica. FAQ schema se genera en algunas pero no en todas (verificar `areaSchemas()`).
- **Oportunidades:** Meta descriptions manuales para las 13 áreas. Añadir breadcrumbs visuales. Añadir imágenes específicas para cada área (ya existen en `/public/images/services/`). Incluir `areaServed` específico en el schema de cada página.
- **Prioridad de intervención:** Media-Alta (son páginas de conversión).

---

## 8.4 Blog (listado, posts individuales, categorías)
- **Estado actual:** Blog: buen contenido pero sin paginación (134 posts en una página). Posts individuales: excelente estructura con breadcrumbs, cover image, metadatos (fecha, lectura, autor), contenido HTML, related posts, CTA, navegación anterior/siguiente, schema BlogPosting. Categorías: páginas funcionales pero sin paginación.
- **Problemas comunes:** Blog sin paginación (crítico para DOM y crawl budget). Tags sin canonical. Sin páginas de autor. Riesgo de canibalización entre posts similares. Sidebar con 300+ tags (excesivo).
- **Oportunidades:** Paginación. Reducir tags en sidebar a los 20-30 más relevantes. Crear páginas de autor. Implementar HowTo schema en guías. Añadir "servicio relacionado" en cada post. Cross-link entre posts relacionados y páginas de servicio.
- **Prioridad de intervención:** Alta (el blog es el principal motor de tráfico long-tail).

---

## 8.5 Páginas corporativas (Despacho, Cómo llegar, FAQ, Contacto)
- **Estado actual:** Correcto. `/despacho`: página bien estructurada con valores, proceso, equipo (placeholder), stats. `/preguntas-frecuentes`: 11 categorías con navegación interna, schema FAQPage. `/solicitar-consulta`: formulario + canales de contacto + garantías. `/como-llegar`: mapa + indicaciones.
- **Problemas comunes:** Sin breadcrumbs. OG image genérica. /despacho tiene imágenes placeholder (sin fotos reales del equipo) — oportunidad E-E-A-T.
- **Oportunidades:** Añadir fotos reales del equipo en /despacho. Añadir breadcrumbs. Crear schema `AboutPage` en /despacho (ya tiene `WebPage`). Añadir Google Maps embed en /como-llegar para SEO local.
- **Prioridad de intervención:** Baja-Media.

---

## 8.6 Páginas legales (Aviso Legal, Privacidad, Cookies, Términos, Disclaimer)
- **Estado actual:** Correcto. Prioridad baja en sitemap (0.2). Contenido estándar. Sin problemas detectados.
- **Problemas comunes:** Sin breadcrumbs. Todas comparten el mismo lastmod.
- **Oportunidades:** Añadir breadcrumbs. Estas páginas no requieren optimización prioritaria.
- **Prioridad de intervención:** Baja.

---

# 9. RIESGOS Y LIMITACIONES DEL ANÁLISIS

### Lo que NO se pudo validar

| Elemento | Causa | Impacto en fiabilidad |
|----------|-------|----------------------|
| **Core Web Vitals / Lighthouse** | Sin acceso a un entorno de producción con herramientas de medición (PageSpeed Insights requiere URL pública). No se ejecutaron pruebas de rendimiento. | Medio: Next.js SSR con Tailwind suele tener buen rendimiento, pero el blog con 134 posts en una página probablemente tenga LCP/TBT altos. |
| **Datos reales de indexación en Google** | GSC no configurado → sin acceso a informe de cobertura ni rendimiento. | Alto: no se sabe cuántas URLs están indexadas, cuáles tienen errores, ni qué keywords generan tráfico real. |
| **Tráfico orgánico real** | Sin GA4 configurado → sin datos de sesiones, usuarios, conversiones. | Alto: imposible medir el rendimiento actual o establecer una línea base. |
| **Perfil de backlinks** | Sin acceso a Ahrefs, Semrush, Majestic o Google Search Console. | Medio: no se puede evaluar la autoridad de dominio ni detectar enlaces tóxicos. |
| **Competidores** | No se proporcionaron competidores en los datos de entrada. | Bajo: el análisis se limita a la evaluación interna del sitio. |
| **Logs de servidor / patrones de rastreo** | No se proporcionaron logs de acceso de Vercel ni de CDN. | Bajo: no se puede analizar con precisión el comportamiento de Googlebot. |
| **Validación de Schema con Rich Results Test** | No se ejecutó la herramienta de Google sobre URLs en producción. | Bajo: el código de schemas es correcto estructuralmente, pero el SearchAction roto y sameAs vacío requieren corrección. |
| **Contenido de posts individuales (profundidad, calidad, originalidad)** | Se inspeccionó metadata y estructura pero no el cuerpo completo de los 134 posts. | Medio: el análisis de contenido se basa en títulos, descripciones, categorías, tags y tiempos de lectura. No se evaluó calidad literaria, precisión legal ni posible contenido generado. |
| **Renderizado JavaScript (JS SEO)** | El sitio usa Next.js SSR → el contenido se sirve renderizado. No se verificó si hay dependencias de JS para contenido crítico. | Bajo: Next.js SSR es amigable con Googlebot. Los componentes de cliente (`'use client'`) como el header no afectan al contenido indexable. |
| **Mobile friendliness real** | No se ejecutó Mobile-Friendly Test de Google ni se inspeccionó en dispositivo físico. | Bajo: Tailwind CSS responsive + viewport meta tag correcto. |
| **Hreflang** | El sitio es monolingüe (es-HN). No aplica hreflang. | Nulo: No es necesario. |

### Validaciones adicionales recomendadas
1. Ejecutar **PageSpeed Insights** y **Lighthouse** sobre home, blog, y una página de servicio en producción.
2. Configurar **GSC** y revisar el informe de **Cobertura** (errores, excluidas, indexadas).
3. Configurar **GA4** y establecer una línea base de tráfico durante 30 días.
4. Pasar **3-5 URLs clave** por el **Rich Results Test** de Google.
5. Ejecutar un **crawl con Screaming Frog** (o similar) sobre el sitio en producción para detectar errores 4xx, redirecciones, páginas huérfanas y profundidad de clic real.
6. Realizar **análisis de backlinks** con Ahrefs/Semrush si hay presupuesto.
7. Revisar el contenido de una **muestra de 15-20 posts** de blog para evaluar calidad, profundidad, originalidad y posible contenido AI-generated.

---

# 10. CONCLUSIÓN FINAL

### Diagnóstico global

`pinedayasociadoshn.com` es un sitio web de bufete jurídico con una **base técnica notablemente sólida** para un proyecto de este perfil: Next.js con SSR, HSTS preload, CSP restrictivo, JSON-LD multi-entidad, sitemap dinámico completo, 134 posts de blog con cobertura temática amplia, y redirecciones legacy bien gestionadas. La arquitectura de URLs es limpia y semántica. El contenido cubre prácticamente todas las áreas del derecho hondureño.

Sin embargo, el sitio opera **por debajo de su potencial real** debido a **4 bugs que requieren corrección inmediata** y a la ausencia de herramientas de medición. Los bugs identificados (IndexNow con dominio erróneo, GSC sin configurar, GA4 sin activar, SearchAction schema roto) son todos de **baja dificultad de corrección** pero **alto impacto** una vez resueltos. La paradoja es que se ha invertido un esfuerzo considerable en crear una base técnica sólida, pero se han dejado sin resolver los mecanismos que permiten verificar y medir su funcionamiento.

El contenido del blog, aunque abundante (134 posts), presenta riesgos de canibalización que deberán abordarse con datos de GSC para priorizar. La estructura de topic clusters está implícita pero no formalizada con páginas pilar.

### 5 prioridades absolutas

1. **Corregir IndexNow** (`scripts/submit-indexnow.mjs:12`) — 1 línea, impacto inmediato en Bing/Yandex/DuckDuckGo.
2. **Configurar Google Search Console** — verificar propiedad, enviar sitemap. Sin esto, el SEO es ciego.
3. **Configurar GA4** — activar `NEXT_PUBLIC_GA_ID`. Sin medición, no hay optimización posible.
4. **Corregir `images.unoptimized` y SearchAction schema** — 2 cambios simples que eliminan bugs técnicos.
5. **Implementar paginación en el blog** — reducir DOM, optimizar crawl budget, mejorar UX.

### Puntuación final

**72/100 — Mejorable (tendiendo a Sólido)**

### Potencial estimado de mejora si se ejecuta el plan

| Fase | Puntuación estimada tras completar |
|------|-----------------------------------|
| Tras Fase 1 (corrección de bugs + GSC + GA4) | **82/100** (Sólido) |
| Tras Fase 2 (paginación + breadcrumbs + OG images) | **86/100** (Sólido) |
| Tras Fase 3 (anti-canibalización + páginas pilar + meta descriptions) | **90/100** (Excelente) |
| Tras Fase 4 (automatización + E-E-A-T + contenido regular) | **94/100** (Excelente) |

### Secuencia recomendada de implementación

1. **Semana 1-2:** Ejecutar Fase 1 completa (bugs críticos, GSC, GA4, imágenes, schema). Tiempo estimado: 4-6 horas de desarrollo.
2. **Semana 3-4:** Revisar primeros datos de GSC y GA4. Identificar problemas de indexación reales. Priorizar correcciones.
3. **Semana 5-8:** Implementar paginación del blog y breadcrumbs globales (Fase 2).
4. **Semana 9-12:** Auditoría de canibalización, meta descriptions, y primeras páginas pilar (Fase 3).
5. **Trimestre 2:** Automatización, E-E-A-T, y ritmo de publicación regular (Fase 4).

---

# 11. APÉNDICE — GUÍA DE CONFIGURACIONES EXTERNAS

Esta sección explica paso a paso cómo obtener y configurar cada servicio externo necesario para completar la activación SEO del sitio. Las instrucciones asumen que tienes acceso administrativo al proyecto en Vercel y a las cuentas de Google/Microsoft correspondientes.

---

## 11.1 Google Search Console (GSC)

**Qué es:** Herramienta gratuita de Google que permite ver cómo Google rastrea, indexa y muestra tu sitio en los resultados de búsqueda. Imprescindible para cualquier estrategia SEO.

**Qué necesitas:** Una cuenta de Google (Gmail) y acceso al código fuente o al panel de Vercel.

**Paso a paso:**

1. **Crear cuenta / Iniciar sesión:**
   - Ve a [Google Search Console](https://search.google.com/search-console).
   - Inicia sesión con tu cuenta de Google. Si no tienes, créala en [accounts.google.com](https://accounts.google.com).

2. **Añadir propiedad:**
   - Haz clic en "Añadir propiedad" (desplegable superior izquierdo).
   - Elige **"Prefijo de URL"** (no "Dominio", ya que requiere acceso DNS).
   - Introduce exactamente: `https://www.pinedayasociadoshn.com`
   - Haz clic en "Continuar".

3. **Verificar propiedad:**
   - Google mostrará varios métodos de verificación. Elige **"Etiqueta HTML"**.
   - Copia **solo el código** que aparece dentro del atributo `content`. Por ejemplo:
     ```
     <meta name="google-site-verification" content="AbCdEfGhIjKlMnOpQrStUvWxYz123456" />
     ```
     Debes copiar solo: `AbCdEfGhIjKlMnOpQrStUvWxYz123456`
   - Este código es único para tu propiedad y no caduca.

4. **Configurar en Vercel:**
   - Ve al dashboard de Vercel → tu proyecto → Settings → Environment Variables.
   - Añade una nueva variable:
     - **Name:** `NEXT_PUBLIC_GOOGLE_VERIFICATION`
     - **Value:** el código que copiaste (ej: `AbCdEfGhIjKlMnOpQrStUvWxYz123456`)
     - **Environments:** Production (y Preview/Development si quieres verificar también)
   - Haz clic en "Save".
   - Vuelve a desplegar (redeploy) el proyecto para que la variable surta efecto.

5. **Completar verificación:**
   - Tras el deploy (~1-2 minutos), vuelve a GSC y haz clic en "Verificar".
   - Si todo es correcto, verás "Propiedad verificada".

6. **Enviar sitemap:**
   - En el menú lateral de GSC, ve a "Sitemaps".
   - En "Añadir un nuevo sitemap", escribe: `sitemap.xml`
   - Haz clic en "Enviar".
   - Google empezará a rastrear el sitemap en las siguientes 24-48h.

7. **Primeros pasos en GSC:**
   - A los 2-3 días, revisa "Rendimiento" → verás impresiones, clics, CTR y posición media.
   - Revisa "Cobertura" → verás páginas indexadas y excluidas con sus motivos.
   - Configura alertas de email para errores críticos (Configuración → Preferencias).

---

## 11.2 Google Analytics 4 (GA4)

**Qué es:** Plataforma de analítica web gratuita que mide el tráfico, comportamiento de usuarios y conversiones en tu sitio.

**Qué necesitas:** Una cuenta de Google (puede ser la misma de GSC).

**Paso a paso:**

1. **Crear cuenta GA4:**
   - Ve a [Google Analytics](https://analytics.google.com).
   - Haz clic en "Comenzar a medir" o "Crear cuenta".
   - Introduce un nombre de cuenta (ej: "Pineda y Asociados").
   - Configura el uso compartido de datos según tu preferencia.
   - Haz clic en "Siguiente".

2. **Crear propiedad:**
   - Nombre de propiedad: `pinedayasociadoshn.com`
   - Zona horaria: `Honduras (UTC-06:00)`
   - Moneda: `HNL (HNL)`
   - Haz clic en "Siguiente".

3. **Configurar flujo de datos:**
   - Selecciona "Web" como plataforma.
   - URL del sitio web: `https://www.pinedayasociadoshn.com`
   - Nombre del flujo: `Web principal`
   - Haz clic en "Crear flujo".

4. **Obtener ID de medición:**
   - Tras crear el flujo, verás una pantalla con detalles. Busca **"ID de medición"**.
   - El formato es `G-XXXXXXXXXX` (ej: `G-ABC123DEF4`).
   - Copia este ID completo.

5. **Configurar en Vercel:**
   - Ve al dashboard de Vercel → tu proyecto → Settings → Environment Variables.
   - Añade una nueva variable:
     - **Name:** `NEXT_PUBLIC_GA_ID`
     - **Value:** `G-XXXXXXXXXX` (el ID que copiaste)
     - **Environments:** Production
   - Haz clic en "Save".
   - Redeploy el proyecto.

6. **Verificar funcionamiento:**
   - Tras el deploy, visita tu sitio web.
   - Vuelve a GA4 → Informes → Tiempo real.
   - Deberías ver al menos 1 visitante activo (tú mismo).
   - Si no aparece en 5 minutos, verifica que la variable esté en Vercel Production y que hayas hecho redeploy.

7. **Configurar eventos de conversión (recomendado):**
   - En GA4, ve a Administración → Eventos → Crear evento.
   - Para marcar el envío del formulario de consulta como conversión, el sitio ya está preparado para enviar eventos. Contacta al equipo de desarrollo para implementar `gtag('event', 'consulta_enviada')` en el endpoint `/api/contacto`.

---

## 11.3 Microsoft Clarity (opcional)

**Qué es:** Herramienta gratuita de Microsoft que graba sesiones de usuarios y genera mapas de calor. Complementa a GA4 con datos cualitativos.

**Qué necesitas:** Una cuenta de Microsoft (Outlook, Hotmail, Live).

**Paso a paso:**

1. **Crear cuenta:**
   - Ve a [Microsoft Clarity](https://clarity.microsoft.com).
   - Inicia sesión con tu cuenta Microsoft o créala.

2. **Crear proyecto:**
   - Haz clic en "New project" o "Nuevo proyecto".
   - Nombre: `pinedayasociadoshn.com`
   - URL: `https://www.pinedayasociadoshn.com`
   - Categoría: selecciona "Legal" o "Professional Services".
   - Haz clic en "Create".

3. **Obtener ID del proyecto:**
   - Tras crear el proyecto, Clarity te mostrará un código de seguimiento.
   - Busca el ID del proyecto: es un string alfanumérico (ej: `a1b2c3d4e5`).
   - El código de instalación se ve así:
     ```html
     <script type="text/javascript">
       (function(c,l,a,r,i,t,y){
         c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
         t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
         y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
       })(window, document, "clarity", "script", "ID_DEL_PROYECTO");
     </script>
     ```
   - El ID del proyecto es lo que aparece al final: `ID_DEL_PROYECTO`.

4. **Configurar en Vercel:**
   - Ve al dashboard de Vercel → tu proyecto → Settings → Environment Variables.
   - Añade una nueva variable:
     - **Name:** `NEXT_PUBLIC_CLARITY_ID`
     - **Value:** el ID que copiaste (ej: `a1b2c3d4e5`)
     - **Environments:** Production
   - Haz clic en "Save".
   - Redeploy el proyecto.

5. **Verificar funcionamiento:**
   - Tras el deploy, visita tu sitio.
   - Vuelve a Clarity → Dashboard.
   - En ~30 minutos empezarás a ver grabaciones y mapas de calor.

---

## 11.4 Redes sociales (para el schema `sameAs`)

**Qué es:** Los perfiles de redes sociales del bufete, necesarios para poblar el campo `sameAs` del JSON-LD `LegalService`. Esto ayuda a Google a consolidar la entidad del bufete en el Knowledge Graph.

**Variables a configurar en Vercel (solo si existen los perfiles):**

| Variable | Ejemplo de valor |
|----------|-------------------|
| `NEXT_PUBLIC_SOCIAL_FACEBOOK` | `https://www.facebook.com/pinedayasociadoshn` |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` | `https://www.instagram.com/pinedayasociadoshn` |
| `NEXT_PUBLIC_SOCIAL_TIKTOK` | `https://www.tiktok.com/@pinedayasociadoshn` |

**Importante:**
- Solo configura las variables de las redes que realmente existan. Si no tienes perfil en alguna, déjala vacía (el código está preparado para omitir `sameAs` si no hay datos).
- Las URLs deben ser completas, incluyendo `https://`.
- Tras configurarlas, haz redeploy en Vercel.
- Verifica el JSON-LD en la home con la [Herramienta de prueba de datos estructurados](https://search.google.com/test/rich-results).

---

## 11.5 IndexNow — Uso y automatización

**Qué es:** Protocolo que notifica instantáneamente a Bing, Yandex y otros buscadores sobre URLs nuevas o actualizadas. El script ya está corregido en el proyecto.

**Uso manual:**
```bash
# Simular (ver qué URLs se enviarían sin enviar realmente):
npm run indexnow:dry

# Enviar URLs reales (producción):
npm run indexnow
```

**Automatización post-deploy (recomendado):**
Para que IndexNow se ejecute automáticamente tras cada deploy en Vercel, puedes configurarlo como paso de postbuild:

1. Añade en `package.json`:
   ```json
   "scripts": {
     "postbuild": "node scripts/submit-indexnow.mjs"
   }
   ```
2. Esto ejecutará IndexNow automáticamente tras cada `npm run build` exitoso en Vercel.
3. **Precaución:** Asegúrate de que `NEXT_PUBLIC_SITE_URL` esté configurada en Vercel Production con el valor `https://www.pinedayasociadoshn.com`. El script deriva el host de esta variable.

---

## 11.6 Configuración del dominio en Vercel

**Verificación de dominio www → apex:**
1. Ve al dashboard de Vercel → tu proyecto → Settings → Domains.
2. Deberías ver `pinedayasociadoshn.com` y `www.pinedayasociadoshn.com`.
3. Si `www.pinedayasociadoshn.com` no está configurado como redirect al apex (o viceversa):
   - Haz clic en "Add Domain".
   - Añade el dominio que falte.
   - Vercel te guiará para configurar los registros DNS necesarios.
4. Asegúrate de que `NEXT_PUBLIC_SITE_URL` en Vercel tenga el valor canónico correcto (`https://www.pinedayasociadoshn.com`).

---

## 11.7 Lista de verificación final

Usa esta checklist para confirmar que todo está activo:

| # | Tarea | Estado |
|---|-------|--------|
| 1 | `NEXT_PUBLIC_GOOGLE_VERIFICATION` configurada en Vercel | ☐ |
| 2 | GSC verificado y sitemap enviado | ☐ |
| 3 | `NEXT_PUBLIC_GA_ID` configurada en Vercel | ☐ |
| 4 | GA4 mostrando datos en Tiempo Real | ☐ |
| 5 | `NEXT_PUBLIC_CLARITY_ID` configurada en Vercel (opcional) | ☐ |
| 6 | Clarity mostrando grabaciones (opcional) | ☐ |
| 7 | `NEXT_PUBLIC_SOCIAL_*` configuradas según perfiles existentes | ☐ |
| 8 | IndexNow ejecutado correctamente con `npm run indexnow` | ☐ |
| 9 | `NEXT_PUBLIC_NOINDEX` configurada como `"false"` en Vercel Production | ☐ |
| 10 | Redeploy ejecutado tras todos los cambios de variables | ☐ |
| 11 | Sitemap accesible en `https://www.pinedayasociadoshn.com/sitemap.xml` | ☐ |
| 12 | Robots.txt accesible en `https://www.pinedayasociadoshn.com/robots.txt` | ☐ |

---

*Informe generado el 10 de junio de 2026. Análisis basado en inspección de código fuente, revisión del sitio en producción, sitemap.xml, robots.txt y archivos de datos del proyecto. Las puntuaciones reflejan el estado actual con los datos disponibles. Se recomienda re-evaluar tras 90 días de implementación del plan.*

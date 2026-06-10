# Plan de Implementación WordPress — Blog Pineda y Asociados
## Documento maestro técnico

---

### 1. Resumen ejecutivo de implementación

Migrar el blog jurídico actual (Next.js + TypeScript) a WordPress implica **no tocar el resto del sitio**. El blog se independiza como una instalación WordPress separada, en un subdirectorio (`/blog/`) o subdominio (`blog.pinedayasociadoshn.com`). El WordPress existente en Next.js se sustituye por una instalación WordPress nativa con tema GeneratePress, Rank Math SEO, WP Rocket y contenido migrado desde los archivos TypeScript (`data/blog/posts/`).

La migración se hace en 3 fases: (1) limpieza y estructura taxonómica, (2) plantillas y bloques Gutenberg, (3) contenido y conversión. No se requiere CPT. Todo se resuelve con taxonomías nativas, un child theme minimalista y bloques reutilizables Gutenberg.

**Decisión crítica:** el blog se sirve desde `/blog/` como instalación WordPress separada. El resto del sitio (calculadora, intranet, servicios) sigue en Next.js. La comunicación entre ambos se hace mediante enlaces y un header/footer consistente vía iframe o web component compartido, o manteniendo un theme WordPress que emule visualmente el diseño Next.js.

---

### 2. Arquitectura WordPress recomendada

**Post Types:**
- `post` — nativo de WordPress. No se crea ningún Custom Post Type.
- Justificación: el blog solo contiene artículos. No hay tipos de contenido adicionales (casos de éxito, glosario, etc.) que justifiquen un CPT. Si en el futuro se necesitan guías o landing pages, se usa `page` o un CPT específico entonces.

**Taxonomías:**
- `category` — 9 categorías principales (jerárquica, con subcategorías donde aplique).
- `post_tag` — ~40 etiquetas planas (no jerárquicas).

**Estructura de URLs:**

```
/blog/                                    → Front Page (posts page)
/blog/categoria/derecho-penal/            → Categoría principal
/blog/categoria/derecho-penal/proceso-penal/  → Subcategoría (hija de penal)
/blog/divorcio-honduras/                  → Post individual
/blog/tag/divorcio/                       → Página de tag
/blog/author/pineda/                      → Página de autor
```

**Reglas de categorización:**

| Categoría | Slug | Padre | Posts | Descripción |
|-----------|------|-------|-------|-------------|
| Derecho Penal | `derecho-penal` | — | ~24 | Categoría raíz |
| ├ Proceso Penal | `proceso-penal` | derecho-penal | ~13 | Subcategoría de penal |
| ├ Defensa y Recursos | `defensa-recursos` | derecho-penal | ~6 | Recursos, casación, apelación |
| Derecho de Familia | `derecho-familia` | — | ~18 | Sin subcategorías |
| Derecho Laboral | `derecho-laboral` | — | ~14 | Sin subcategorías |
| Derecho Civil y Notarial | `derecho-civil` | — | ~14 | Fusión civil + notarial |
| Derecho Mercantil | `derecho-mercantil` | — | ~10 | Fusión mercantil + bancario + aduanero + PI + ambiental + arbitraje |
| Hondureños en España | `hondurenos-espana` | — | ~9 | Fusión con extranjería |
| Derecho Tributario | `derecho-tributario` | — | ~6 | Sin subcategorías |
| Guías y Tutoriales | `guias-legales` | — | ~10 | Fusión práctica-legal + derechos-ciudadanos |
| Actualidad Legal | `actualidad-legal` | — | ~5 | Noticias y reformas |

**Reglas de etiquetado:**
- Máximo 40 etiquetas en total.
- Cada post recibe 2-4 etiquetas como máximo.
- Las etiquetas son sustantivos de tema transversal, no keywords geolocalizadas.
- Las etiquetas con menos de 3 posts se marcan como `noindex, follow`.
- No repetir la categoría como etiqueta.

**Lista definitiva de etiquetas (40):**

```
divorcio, custodia, pension-alimenticia, herencias, sucesiones,
testamentos, despido, liquidacion-laboral, contratos-laborales,
derechos-trabajador, accidentes-laborales, detencion,
audiencia-inicial, prision-preventiva, medidas-cautelares,
recursos-penales, proceso-penal, defensa-penal,
constitucion-empresas, contratos-mercantiles, propiedad-intelectual,
marcas, patentes, deudas-bancarias, central-riesgos,
ejecucion-hipotecaria, importacion-exportacion, aduanas,
registro-sanitario, licencia-ambiental, arbitraje, mediacion,
hondurenos-espana, nacionalidad-espanola, arraigo, residencia,
asilo, impuestos, sar, facturacion-electronica, compliance
```

---

### 3. Estructura técnica por plantilla

Todas las plantillas residen en el child theme (`/wp-content/themes/generatepress-child/`).

#### 3.1 Blog Home (`front-page.php` o `home.php`)

```
Archivo: home.php
Propósito: Página principal del blog (no confundir con la home del sitio)

Estructura:
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumbs] Rank Math (Inicio › Blog Jurídico)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ <!-- Hero Section -->                                       │
│ <section class="blog-hero">                                 │
│   <h1>Blog Jurídico de Pineda y Asociados</h1>             │
│   <p class="subtitle">Análisis, guías y recursos...</p>    │
│   [Botón RSS] [Botón Suscripción]                          │
│ </section>                                                  │
│                                                             │
│ <!-- Category Filter -->                                    │
│ <nav class="category-filter">                               │
│   [Todos] [Penal] [Familia] [Laboral] ...                   │
│   (scroll horizontal en mobile)                             │
│ </nav>                                                      │
│                                                             │
│ <!-- Featured Post (sticky) -->                             │
│ <article class="featured-post">                             │
│   the_post_thumbnail('large')                               │
│   <span class="cat-badge">categoría</span>                 │
│   <h2><a href="permalink">the_title</a></h2>               │
│   the_excerpt()                                             │
│   <time>fecha</time> · <span>tiempo de lectura</span>      │
│ </article>                                                  │
│                                                             │
│ <!-- Post Grid (2 columnas) -->                             │
│ <div class="post-grid grid-2">                              │
│   while (have_posts()): the_post()                          │
│     <article class="grid-item">                             │
│       the_post_thumbnail('medium')                          │
│       <span class="cat-badge">categoría</span>             │
│       <h3><a href="permalink">the_title</a></h3>           │
│       the_excerpt()                                         │
│       <time>fecha</time> · <span>tiempo de lectura</span>  │
│     </article>                                              │
│   endwhile                                                  │
│ </div>                                                      │
│                                                             │
│ <!-- Pagination -->                                         │
│ <nav class="pagination">                                    │
│   paginate_links()                                          │
│ </nav>                                                      │
│                                                             │
│ <!-- Lead Capture -->                                       │
│ <section class="newsletter-section">                        │
│   <h3>Reciba nuestros artículos</h3>                        │
│   [formulario Fluent Forms]                                 │
│   <p class="disclaimer">Sin spam...</p>                     │
│ </section>                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Hooks usados: generate_after_main_content (para lead capture)
Modo: Sin sidebar. full-width layout.
```

#### 3.2 Archivo de Categoría (`category.php`)

```
Archivo: category.php
Propósito: Listado de posts por categoría con paginación.

Estructura:
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumbs] Inicio › Blog › [Categoría]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ <header class="category-header">                            │
│   <h1>single_cat_title()</h1>                               │
│   <p>category_description()</p>                             │
│ </header>                                                   │
│                                                             │
│ [Back link] ← Volver al blog                                │
│                                                             │
│ <!-- Post Grid (3 columnas si hay >6 posts, 2 si menos) -->│
│ <div class="post-grid grid-3">                              │
│   while (have_posts()): the_post()                          │
│     <article> ... </article>                                │
│   endwhile                                                  │
│ </div>                                                      │
│                                                             │
│ <!-- Pagination -->                                         │
│ <nav class="pagination">                                    │
│   paginate_links()                                          │
│ </nav>                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Layout: full-width. Sin sidebar.
SEO: <meta robots="index, follow">. Canonical self.
Schema: CollectionPage + BreadcrumbList.
```

#### 3.3 Post Individual (`single.php`)

```
Archivo: single.php
Propósito: Post completo optimizado para lectura, conversión y SEO.

Estructura:
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumbs] Inicio › Blog › [Categoría] › [Título]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ <!-- Hero -->                                               │
│ <header class="post-hero">                                  │
│   <span class="cat-badge">the_category()</span>             │
│   <h1>the_title()</h1>                                      │
│   <p class="excerpt">$post->post_excerpt</p>                │
│   <div class="post-meta">                                   │
│     <time>get_the_date()</time>                             │
│     <span>tiempo de lectura</span>                          │
│     <span>Por <a href="author_url">author_name</a></span>   │
│     [si updatedAt] <span class="updated">Actualizado: ...</span>│
│   </div>                                                    │
│ </header>                                                   │
│                                                             │
│ <!-- Social Share Bar -->                                   │
│ <div class="share-bar">                                     │
│   [Twitter] [LinkedIn] [WhatsApp] [Facebook] [Copiar]       │
│ </div>                                                      │
│                                                             │
│ <!-- Cover Image -->                                        │
│ the_post_thumbnail('full', ['class' => 'post-cover'])        │
│                                                             │
│ <!-- Table of Contents (solo si >5 min) -->                 │
│ [if reading_time > 5]                                       │
│ <nav class="toc">                                           │
│   <h3>📑 Tabla de contenidos</h3>                           │
│   <ul id="toc-list"></ul>                                   │
│   (generado por JS al vuelo desde los H2 del contenido)     │
│ </nav>                                                      │
│                                                             │
│ <!-- Article Body -->                                       │
│ <article class="entry-content">                             │
│   the_content()                                             │
│   (parseada con bloques Gutenberg)                          │
│ </article>                                                  │
│                                                             │
│ <!-- In-article CTA (bloque Gutenberg) -->                  │
│ <section class="cta-block">                                 │
│   [Llamar] [WhatsApp] [Solicitar consulta]                  │
│ </section>                                                  │
│                                                             │
│ <!-- Related Service -->                                    │
│ <section class="related-service">                           │
│   (bloque Gutenberg con enlace manual al servicio)          │
│ </section>                                                  │
│                                                             │
│ <!-- FAQ Section (schema FAQPage) -->                       │
│ <section class="post-faq">                                  │
│   (bloque Gutenberg con <details> + schema inline)          │
│ </section>                                                  │
│                                                             │
│ <!-- Author Box -->                                         │
│ <section class="author-box">                                │
│   [avatar]  get_avatar($author_id)                          │
│   <h4>the_author_meta('display_name')</h4>                   │
│   <p>the_author_meta('description')</p>                     │
│   <a href="author_posts_url">Ver todos los artículos →</a>  │
│ </section>                                                  │
│                                                             │
│ <!-- Tags -->                                               │
│ <div class="post-tags">                                     │
│   the_tags()                                                │
│ </div>                                                      │
│                                                             │
│ <!-- Prev / Next -->                                        │
│ <nav class="prev-next">                                     │
│   previous_post_link()  next_post_link()                    │
│ </nav>                                                      │
│                                                             │
│ <!-- Related Posts (Rank Math o WP Query) -->               │
│ <section class="related-posts">                             │
│   <h3>También puede interesarle</h3>                        │
│   <div class="grid-3">                                      │
│     WP_Query(category__in, post__not_in, posts_per_page=3)  │
│   </div>                                                    │
│ </section>                                                  │
│                                                             │
│ <!-- Final CTA -->                                          │
│ <section class="final-cta">                                 │
│   [Teléfono] [WhatsApp] [Formulario consulta]               │
│ </section>                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Layout: full-width sin sidebar. Máximo ancho de lectura: 720px.
Schema: Article + FAQPage + BreadcrumbList generados por Rank Math.
```

#### 3.4 Página de Autor (`author.php`)

```
Archivo: author.php
Propósito: Perfil público del autor con listado de sus posts.

Estructura:
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumbs] Inicio › Blog › Autores › [Nombre]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ <header class="author-header">                              │
│   [avatar 150x150]                                          │
│   <h1>the_author_meta('display_name')</h1>                  │
│   <p>the_author_meta('description')</p>                      │
│   <span>X artículos publicados</span>                       │
│ </header>                                                   │
│                                                             │
│ <!-- Post Grid -->                                          │
│ <div class="post-grid grid-3">                              │
│   while (have_posts()): the_post()                          │
│     <article> ... </article>                                │
│   endwhile                                                  │
│ </div>                                                      │
│                                                             │
│ <!-- Pagination -->                                         │
│ <nav class="pagination">                                    │
│   paginate_links()                                          │
│ </nav>                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SEO: <meta robots="index, follow"> si el autor tiene >3 posts. Si no, noindex.
Schema: ProfilePage + BreadcrumbList.
```

#### 3.5 Página de Tag (`tag.php`)

```
Archivo: tag.php
Propósito: Listado de posts por etiqueta.

Estructura:
Ídem category.php pero con:
- <h1>Tag: single_tag_title()</h1>
- <meta robots="noindex, follow"> SIEMPRE (a menos que el tag tenga >10 posts y se decida lo contrario)
- Canonical: self (con ?page=N si aplica)

NO renderizar si no hay posts (404).
```

#### 3.6 Buscador Interno (`search.php`)

```
Archivo: search.php
Propósito: Resultados de búsqueda interna.

Estructura:
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumbs] Inicio › Blog › Búsqueda: [término]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ <header class="search-header">                              │
│   <h1>Resultados para: get_search_query()</h1>              │
│   [Formulario de búsqueda con get_search_form()]            │
│ </header>                                                   │
│                                                             │
│ <!-- Post Grid -->                                          │
│ <div class="post-grid grid-2">                              │
│   while (have_posts()): the_post()                          │
│     <article> ... </article>                                │
│   endwhile                                                  │
│ </div>                                                      │
│                                                             │
│ <!-- Empty State -->                                        │
│ [if no results] Mensaje + enlace a categorías principales.  │
│                                                             │
│ <!-- Pagination -->                                         │
│ <nav class="pagination">                                    │
│   paginate_links()                                          │
│ </nav>                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SEO: <meta robots="noindex, follow"> en todas las páginas de búsqueda.
```

---

### 4. Componentes reutilizables

Todos se implementan como **bloques Gutenberg personalizados** (via ACF Blocks o registro nativo `register_block_type`). No se usan bloques de terceros.

| Bloque | Slug | Archivo template | Propósito |
|--------|------|-----------------|-----------|
| CTA Contacto | `cta-contacto` | `block-cta-contacto.php` | Teléfono + WhatsApp + formulario |
| Autor Box | `autor-box` | `block-autor-box.php` | Avatar + nombre + bio del autor |
| Tabla de Contenidos | `tabla-contenidos` | `block-toc.php` | Genera TOC desde H2 con JS |
| Posts Relacionados | `posts-relacionados` | `block-related.php` | Query por categoría (3 posts) |
| Suscripción Newsletter | `suscripcion` | `block-newsletter.php` | Formulario email + lead magnet |
| Servicio Relacionado | `servicio-relacionado` | `block-related-service.php` | Enlace manual a página de servicio |
| Share Buttons | `share-buttons` | `block-share.php` | Twitter/LinkedIn/WhatsApp/Facebook/Copy |
| FAQ Schema | `faq-schema` | `block-faq.php` | <details> + schema FAQPage |
| Aviso Legal Post | `aviso-legal-post` | `block-legal-notice.php` | Disclaimer al final de contenido legal |
| Reading Time | `reading-time` | función helper | Calcula minutos de lectura desde word count |

**Implementación de bloques:**
- Registrar vía `register_block_type()` con `render_callback`.
- Los bloques se insertan manualmente en los posts donde apliquen (CTA, FAQ, Servicio Relacionado) o automáticamente via `the_content` filter (Autor Box, Share, Related, TOC).
- Usar ACF Pro **solo si** se necesita interfaz visual para los campos del bloque. Si no, registro nativo sin ACF.

**Orden de inyección automática via `the_content` filter:**
```php
// En functions.php del child theme
add_filter('the_content', 'insertar_autor_box', 20);     // Después del contenido
add_filter('the_content', 'insertar_faq_schema', 25);    // Después del autor
add_filter('the_content', 'insertar_cta_final', 30);     // Después de FAQ
add_filter('the_content', 'insertar_share_bar', 35);     // Al final
```

---

### 5. Stack técnico recomendado

**Tema:**

| Elemento | Elección | Motivo |
|----------|----------|--------|
| Tema padre | **GeneratePress** (free) | <50 KB, 0 dependencias, rendimiento top, Gutenberg-ready, hooks limpios, accesible |
| Child theme | GeneratePress Child | Personalizaciones sin perder actualizaciones del padre |

**Plugins (5, no más):**

| Plugin | Versión | Función | Alternativa descartada |
|--------|---------|---------|----------------------|
| **Rank Math SEO** | Free | SEO on-page, schema, sitemap, breadcrumbs, redirecciones, meta robots, OG | Yoast (más pesado, schema menos flexible) |
| **WP Rocket** | Premium | Caché, minificación, lazy loading, preload, critical CSS | W3 Total Cache (configuración más compleja, menos eficiente) |
| **Fluent Forms** | Free | Formulario newsletter y lead capture | Contact Form 7 (interfaz pobre, sin integraciones) |
| **ShortPixel** | Free (200 créditos/mes) | Compresión WebP automática al subir imágenes | Smush (más lento, menor compresión) |
| **UpdraftPlus** | Free | Backups automáticos diarios a Google Drive | — |

**Plugine a evitar explícitamente:**
- Elementor, Divi, WPBakery — bloat innecesario para un blog
- Yoast SEO — Rank Math es más ligero y flexible
- Jetpack — sobredimensionado, añade 20 módulos que no se usan
- Social media share plugins — implementar manual con SVG + enlaces directos
- Related posts plugins — usar WP_Query manual en el theme (3 líneas de código)
- Table of contents plugins — implementar con 30 líneas de JS vanilla
- Breadcrumb plugins — los genera Rank Math
- Google Analytics plugins — añadir manual en header.php o via Insert Headers and Footers

**Funcionalidades sin plugin:**

| Funcionalidad | Cómo se resuelve |
|--------------|-----------------|
| Breadcrumbs | Rank Math (shortcode `[rank_math_breadcrumb]`) |
| Sitemap | Rank Math (XML generado automáticamente) |
| Schema Article/FAQ/Breadcrumb | Rank Math (schema dinámico por tipo de contenido) |
| Canonicals | Rank Math (automático) |
| Redirecciones 301 | Rank Math (gestor de redirecciones) |
| Meta robots | Rank Math (por post, categoría, tag) |
| Open Graph | Rank Math (automático) |
| Tiempo de lectura | Función PHP en `functions.php` |
| Tabla de contenidos | JavaScript vanilla en `assets/js/toc.js` |
| Share buttons | HTML + SVG en template o bloque Gutenberg |
| Posts relacionados | `WP_Query` en `single.php` o bloque Gutenberg |
| Autor box | Bloque Gutenberg o inyección via filter |
| Newsletter form | Fluent Forms (shortcode o widget) |
| Lazy loading | WP Rocket (activado por defecto) |

---

### 6. Plan de implementación por fases

#### Fase 1 — Limpieza y cimientos (semanas 1-2, prioridad máxima)

| # | Acción | Dificultad | Impacto | Dependencias |
|---|--------|-----------|---------|-------------|
| 1.1 | Instalar WordPress en `/blog/` con GeneratePress + Child Theme | Baja | Alto | Servidor web |
| 1.2 | Instalar y configurar Rank Math SEO (sitemap, breadcrumbs, schema, OG, meta robots) | Baja | Alto | Tema instalado |
| 1.3 | Reducir categorías de 20 a 9. Crear estructura jerárquica. Asignar cada post a su categoría. | Media | Alto | Contenido migrado |
| 1.4 | Limpiar etiquetas: merge de ~300 a ~40 usando herramienta de Rank Math o SQL directo | Alta | Alto | Categorías definidas |
| 1.5 | Identificar y marcar posts canibalizados (divorcio×3, despido×3, etc.). Elegir 1 canónico por grupo. | Media | Alto | Datos de GSC (si existen) o decisión editorial |
| 1.6 | Configurar WP Rocket: caché página, minificación, lazy loading, critical CSS | Baja | Alto | Plugins instalados |
| 1.7 | Migrar posts desde TypeScript a WordPress manualmente o vía script | Alta | Alto | Script de migración |
| 1.8 | Crear redirecciones 301 en Rank Math para las 11 categorías eliminadas | Baja | Medio | Categorías nuevas creadas |

#### Fase 2 — Plantillas y diseño (semanas 3-4)

| # | Acción | Dificultad | Impacto | Dependencias |
|---|--------|-----------|---------|-------------|
| 2.1 | Crear `home.php` con hero, category filter, featured post, grid 2 cols, pagination, lead capture | Media | Alto | Fase 1 completa |
| 2.2 | Crear `category.php` con breadcrumbs, header, grid 3 cols, pagination | Media | Alto | Fase 1 completa |
| 2.3 | Crear `single.php` con hero, share bar, TOC, body, CTA, related service, FAQ, author box, tags, prev/next, related posts, final CTA | Alta | Alto | Bloques reutilizables creados |
| 2.4 | Crear `author.php` con avatar, bio, grid de posts, pagination | Baja | Medio | |
| 2.5 | Crear `tag.php` con `noindex,follow`, grid, pagination | Baja | Bajo | |
| 2.6 | Crear `search.php` con resultados, empty state, pagination, `noindex,follow` | Baja | Medio | |
| 2.7 | Implementar tabla de contenidos dinámica (JS vanilla → `assets/js/toc.js`) | Media | Medio | |
| 2.8 | Implementar barra de compartir (HTML + SVG + JS para copiar enlace) | Baja | Medio | |
| 2.9 | Implementar función de tiempo de lectura en `functions.php` | Baja | Medio | |
| 2.10 | Implementar inyección automática de autor box, CTA final, share bar via `the_content` filter | Media | Alto | Bloque CTA y Autor creados |

#### Fase 3 — Contenido y conversión (semanas 5-8)

| # | Acción | Dificultad | Impacto | Dependencias |
|---|--------|-----------|---------|-------------|
| 3.1 | Redirigir 301 los posts canibalizados no canónicos al canónico de su grupo | Baja | Alto | Fase 1.5 completa |
| 3.2 | Expandir 10 posts estratégicos a 2000+ palabras con TOC, FAQs, ejemplos y referencias legales | Alta | Alto | Datos de GSC o criterio editorial |
| 3.3 | Añadir enlaces internos contextuales en todos los posts (mínimo 3/post: 1 a servicio, 2 a otros posts) | Alta | Alto | Páginas de servicio definidas |
| 3.4 | Crear 4-5 páginas pilar (guías) y conectar posts como cluster via enlaces internos | Alta | Alto | Posts expandidos |
| 3.5 | Configurar lead capture: formulario Fluent Forms + lead magnet (PDF guía) | Media | Alto | Lead magnet creado |
| 3.6 | Crear imágenes OG por defecto por categoría (9 imágenes base) | Media | Medio | Diseñador o template |
| 3.7 | Configurar y verificar Google Search Console + GA4 para el blog | Baja | Alto | Acceso a GSC y GA4 |
| 3.8 | Validar schema con Rich Results Test de Google | Baja | Medio | Fase 2 completa |
| 3.9 | Ejecutar crawl con Screaming Frog para detectar errores | Baja | Medio | Blog publicado |

---

### 7. Reglas SEO técnicas

**Canonicals:**
- Posts: `self` (generado por Rank Math, formato `/%postname%/`)
- Categorías: `self` con `?page=N` si aplica paginación
- Tags: `self` pero con `noindex, follow`
- Búsqueda: `self` con `noindex, follow`
- Autor: `self` con `index, follow` (si >3 posts) o `noindex, follow` (si ≤3)

**Index/Noindex:**
| Tipo | Robots | Motivo |
|------|--------|--------|
| Posts individuales | `index, follow` | Contenido único |
| Página 1 de categoría | `index, follow` | Página de entrada |
| Página 2+ de categoría | `index, follow` | Contenido válido, con canonical a self |
| Tags con ≤3 posts | `noindex, follow` | Evitar thin content |
| Tags con >3 posts | `index, follow` | Si se decide habilitarlos (por defecto: noindex) |
| Búsqueda | `noindex, follow` | Evitar contenido duplicado |
| Página de autor con >3 posts | `index, follow` | Señal E-E-A-T |
| Página de autor con ≤3 posts | `noindex, follow` | Evitar thin content |
| Posts duplicados (no canónicos) | Se redirigen 301, no existen | |

**Sitemap:**
- Generado por Rank Math.
- Incluir: posts, categorías (solo las 9 principales, no tags).
- Excluir: tags, búsqueda, autores.
- Prioridades: posts 0.6, categorías 0.4, páginas pilar 0.8.

**Schema (todos generados por Rank Math):**
- `Article` — en todos los posts (con `headline`, `description`, `datePublished`, `dateModified`, `author`, `publisher`)
- `FAQPage` — en posts que usen el bloque FAQ (detectado automáticamente por Rank Math si se marcan correctamente)
- `BreadcrumbList` — en todas las páginas (vía Rank Math breadcrumb)
- `CollectionPage` — en categorías y blog home
- `ProfilePage` — en páginas de autor
- `WebSite` — con `SearchAction` apuntando a `/?s={search_term_string}` (configurado en Rank Math)

**Breadcrumbs:**
- Generados por Rank Math.
- Formato: `Inicio › Blog › [Categoría] › [Título del post]`
- En blog home: `Inicio › Blog Jurídico`
- En categoría: `Inicio › Blog › [Categoría]`
- Schema: `BreadcrumbList` automático.

**Redirecciones 301:**
- Las 11 categorías eliminadas redirigen a su categoría padre más cercana.
- Los posts canibalizados no canónicos redirigen al post canónico del mismo tema.
- Las URLs legacy del blog (si existían en Next.js) se redirigen a la nueva URL en WordPress.
- Gestionadas por Rank Math (gestor de redirecciones integrado).

**Meta Titles (formato, configurado en Rank Math):**
- Blog home: `Blog Jurídico de Pineda y Asociados | [Site Name]`
- Categoría: `[Category Name] — Blog Jurídico | [Site Name]`
- Post: `[Post Title] | [Site Name]`
- Autor: `Artículos de [Author Name] | [Site Name]`
- Tag: `[Tag Name] — Blog Jurídico | [Site Name]`

**Meta Descriptions (manuales, no auto-generadas):**
- Los 30 posts con mayor potencial de tráfico reciben meta description manual en Rank Math.
- Para el resto, Rank Math usa el excerpt del post como fallback.
- Cada meta description debe incluir: keyword principal + propuesta de valor + CTA implícita.

**Enlazado interno (reglas obligatorias):**
1. Cada post enlaza a la página de servicio del bufete correspondiente (mínimo 1 enlace).
2. Cada post enlaza a 2-3 posts relacionados del blog.
3. La página pilar enlaza a todos los posts de su cluster.
4. Los posts del cluster enlazan de vuelta a la página pilar.
5. No más de 5 enlaces internos por cada 500 palabras.

**Optimización de imágenes:**
- Subir en WebP (ShortPixel convierte automáticamente al subir).
- Tamaño máximo: 1200px de ancho para cover images.
- Compresión: 80-90% (ShortPixel lossy).
- Alt text: descriptivo, con keyword natural (ej: "Abogado penalista en Nacaome durante audiencia inicial").
- Lazy loading: WP Rocket lo activa por defecto.

**Open Graph:**
- Generado por Rank Math.
- Imagen OG por defecto: diferente por cada categoría (9 imágenes).
- En posts con cover image: usar la cover image como OG.
- En posts sin cover: usar la imagen OG de la categoría.
- Twitter Card: `summary_large_image`.

---

### 8. Riesgos y decisiones críticas

**Riesgos:**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Pérdida de autoridad SEO al migrar URLs | Alta | Alto | Redirigir 301 todas las URLs antiguas (Next.js) a las nuevas (WordPress). Mantener misma estructura de slugs en lo posible. |
| Indexación duplicada durante migración | Alta | Medio | Configurar `noindex` en el WordPress durante el desarrollo. Quitar solo cuando el DNS apunte al nuevo servidor. |
| Inconsistencia visual entre el blog (WordPress) y el resto del sitio (Next.js) | Alta | Medio | El child theme debe emular fielmente la identidad visual del Next.js (tipografía, colores, espaciados, header/footer). Usar las mismas variables CSS. |
| Redirecciones 301 mal implementadas | Media | Alto | Probar cada redirección con `curl -I` antes de la publicación. Rank Math permite testeo previo. |
| Lead magnet (PDF) no genera conversiones | Media | Bajo | Probar sin lead magnet primero (solo formulario newsletter). Añadir lead magnet en Fase 3 si los datos lo justifican. |
| Autores genéricos sin foto ni bio | Alta | Medio | Si no hay fotos reales, usar iniciales con círculo de color + bio textual. No usar fotos de stock. |

**Decisiones críticas:**

1. **¿WordPress en subdirectorio o subdominio?** → Subdirectorio (`/blog/`). El link juice fluye mejor al dominio principal. SEO más limpio.

2. **¿Instalación independiente o integrada en el Next.js?** → Independiente. Mantener el blog separado evita complejidad técnica y permite administrarlo sin tocar código Next.js. La integración visual se resuelve con un child theme que imite el diseño del Next.js.

3. **¿Migrar posts manualmente o con script?** → Script para la estructura (título, contenido, categoría, fecha, imagen). Los posts están en TypeScript (`data/blog/posts/`) con frontmatter. Se puede escribir un script Node.js que convierta cada archivo `.ts` a un archivo XML de importación de WordPress (WXR). El contenido HTML se migra tal cual (ya está en HTML). Las imágenes se copian de `/public/images/blog/` a la carpeta de uploads de WordPress.

4. **¿Gutenberg o Classic Editor?** → Gutenberg. Es el futuro de WordPress. Los posts actuales ya tienen contenido HTML semántico que se pega perfectamente en un bloque "HTML personalizado" de Gutenberg.

5. **¿ACF Pro para bloques?** → Solo si se necesita interfaz visual para los campos. Si no, registrar bloques nativamente con `register_block_type()` y `render_callback`. Sin ACF si no es imprescindible.

6. **¿Páginas pilar como `page` o `post`?** → Como `page`. Las páginas pilar son contenido perenne, no se ordenan por fecha. Usar `page` con template personalizado `page-pilar.php` y asignarlas como estáticas.

7. **¿Categorías o subcategorías para penal?** → Jerárquico. Derecho Penal tiene 2 subcategorías (Proceso Penal, Defensa y Recursos). El resto de categorías son planas. Esto permite navegación drill-down en penal (que es el área principal del bufete).

8. **¿Tags indexables o no?** → No indexables por defecto (noindex, follow). Solo si un tag acumula >10 posts y se demuestra tráfico orgánico relevante, se cambia a index. Riesgo de thin content es alto con 40 tags.

---

### 9. Checklist final de ejecución

**Pre-migración (semana 0):**
- [ ] Instalar WordPress en `/blog/`
- [ ] Instalar GeneratePress + Child Theme
- [ ] Instalar Rank Math SEO, WP Rocket, Fluent Forms, ShortPixel, UpdraftPlus
- [ ] Configurar Rank Math: sitemap, breadcrumbs, schema, OG, meta robots, redirecciones
- [ ] Configurar WP Rocket: caché, minificación, lazy loading, critical CSS, preload
- [ ] Configurar Fluent Forms: formulario newsletter
- [ ] Configurar ShortPixel: compresión WebP automática
- [ ] Configurar UpdraftPlus: backups diarios a Google Drive
- [ ] Añadir `noindex` global en Rank Math (para evitar indexación durante desarrollo)

**Migración de datos (semana 1-2):**
- [ ] Ejecutar script de migración de posts (TS → WXR)
- [ ] Importar posts en WordPress
- [ ] Verificar que los 134 posts se importaron correctamente
- [ ] Asignar cada post a su nueva categoría (9 categorías)
- [ ] Fusionar etiquetas de ~300 a ~40
- [ ] Verificar que las imágenes migraron correctamente
- [ ] Crear redirecciones 301 para las 11 categorías eliminadas
- [ ] Crear redirecciones 301 para posts canibalizados no canónicos
- [ ] Verificar todas las redirecciones con `curl -I`

**Implementación de plantillas (semana 3):**
- [ ] `functions.php` del child theme: funciones helper, scripts, estilos, soporte de bloques
- [ ] `home.php`: hero, category filter, featured post, grid 2 cols, pagination, lead capture
- [ ] `category.php`: breadcrumbs, header, grid 3 cols, pagination
- [ ] `single.php`: hero, share bar, TOC, body, CTA, related service, FAQ, author box, tags, prev/next, related posts, final CTA
- [ ] `author.php`: avatar, bio, grid, pagination
- [ ] `tag.php`: noindex, grid, pagination
- [ ] `search.php`: results, empty state, pagination, noindex
- [ ] `assets/js/toc.js`: generación dinámica de tabla de contenidos
- [ ] `assets/css/blog.css`: estilos del blog (o en style.css del child theme)
- [ ] Inyección automática de autor box, CTA final, share bar via `the_content` filter

**Bloques Gutenberg (semana 3-4):**
- [ ] Registrar bloque `cta-contacto`
- [ ] Registrar bloque `autor-box`
- [ ] Registrar bloque `tabla-contenidos`
- [ ] Registrar bloque `posts-relacionados`
- [ ] Registrar bloque `suscripcion`
- [ ] Registrar bloque `servicio-relacionado`
- [ ] Registrar bloque `share-buttons`
- [ ] Registrar bloque `faq-schema`
- [ ] Registrar bloque `aviso-legal-post`
- [ ] Registrar helper `reading-time`

**Contenido y SEO (semana 5-6):**
- [ ] Redirigir 301 posts canibalizados no canónicos
- [ ] Expandir 10 posts estratégicos a 2000+ palabras
- [ ] Añadir meta descriptions manuales a 30 posts principales
- [ ] Añadir enlaces internos contextuales (mínimo 3/post)
- [ ] Crear 4-5 páginas pilar (guías completas)
- [ ] Conectar posts como cluster a cada página pilar
- [ ] Crear 9 imágenes OG por categoría
- [ ] Crear lead magnet (PDF guía)
- [ ] Configurar formulario de newsletter con lead magnet

**Pre-lanzamiento (semana 7):**
- [ ] Quitar `noindex` global
- [ ] Verificar sitemap XML en Rank Math
- [ ] Verificar schema con Rich Results Test (5 URLs)
- [ ] Verificar breadcrumbs visuales y schema
- [ ] Verificar Open Graph con Facebook Sharing Debugger
- [ ] Ejecutar PageSpeed Insights (móvil >85, escritorio >90)
- [ ] Ejecutar Screaming Frog crawl (0 errores 4xx/5xx)
- [ ] Verificar redirecciones 301
- [ ] Verificar mobile friendly
- [ ] Verificar que el header/footer del Next.js se replica en WordPress

**Lanzamiento (semana 8):**
- [ ] Apuntar DNS `/blog/` a la instalación WordPress
- [ ] Configurar Google Search Console para el blog
- [ ] Configurar GA4 para el blog
- [ ] Enviar sitemap a GSC
- [ ] Solicitar indexación de URLs prioritarias en GSC
- [ ] Monitorizar 404s en GSC durante los primeros 7 días

---

### 10. Cambios a documentar

**README.md (añadir sección):**

```markdown
## Blog (WordPress)

El blog del sitio se sirve desde `/blog/` como una instalación WordPress independiente.

### Stack
- Tema: GeneratePress + Child Theme
- Plugins: Rank Math SEO, WP Rocket, Fluent Forms, ShortPixel, UpdraftPlus
- Bloques: 10 bloques Gutenberg personalizados (ver `/wp-content/themes/generatepress-child/blocks/`)

### Migración
Los posts se migraron desde los archivos TypeScript (`data/blog/posts/`) mediante script.
Las categorías se redujeron de 20 a 9. Las etiquetas se fusionaron de ~300 a ~40.

### Redirecciones 301
Gestionadas por Rank Math. Incluyen:
- 11 categorías eliminadas → categorías activas
- Posts canibalizados → post canónico del mismo tema
- URLs legacy Next.js → nueva estructura WordPress

### SEO
- Todos los tags están configurados como `noindex, follow`
- Las categorías con paginación tienen `index, follow`
- Schema: Article, FAQPage, BreadcrumbList, CollectionPage, ProfilePage
- Open Graph: imagen por defecto por categoría
```

**CHANGELOG.md (añadir entrada):**

```markdown
## Release 14 — Migración del blog a WordPress (2026-06-10)

### Arquitectura
- Blog migrado de Next.js a WordPress independiente en `/blog/`
- Nuevo child theme GeneratePress con 10 bloques Gutenberg personalizados
- Categorías reducidas de 20 a 9 (jerarquía en penal)
- Etiquetas reducidas de ~300 a ~40

### Plantillas creadas
- `home.php` — blog home con hero, category filter, featured post, grid, lead capture
- `category.php` — archivo de categoría con breadcrumbs, grid, pagination
- `single.php` — post individual con hero, share bar, TOC, author box, CTAs, related
- `author.php` — perfil de autor con avatar, bio, grid de posts
- `tag.php` — listado de tags con noindex, follow
- `search.php` — resultados de búsqueda con noindex, follow

### Plugins instalados
- Rank Math SEO (sitemap, schema, breadcrumbs, OG, redirects, meta robots)
- WP Rocket (caché, minificación, lazy loading, critical CSS)
- Fluent Forms (lead capture newsletter)
- ShortPixel (compresión WebP automática)
- UpdraftPlus (backups diarios)

### SEO
- Redirecciones 301: 11 categorías eliminadas + posts canibalizados
- Schema: Article + FAQPage + BreadcrumbList + CollectionPage + ProfilePage
- Open Graph: imagen por categoría + cover image por post
- Tags: noindex, follow por defecto
- Meta descriptions manuales en 30 posts principales
- Enlaces internos obligatorios: 3/post (1 a servicio + 2 a posts)

### Dependencias externas pendientes
- Lead magnet PDF (guía legal) pendiente de crear
- 9 imágenes OG por categoría pendientes de diseñar
- Fotos de autor pendientes de proporcionar
```

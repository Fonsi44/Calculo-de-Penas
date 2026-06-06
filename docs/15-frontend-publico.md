# 15 — Frontend público: arquitectura y contenido

## Rutas públicas

| Ruta | Tipo | Contenido |
|---|---|---|
| / | Home | Hero penalista, preguntas reales, áreas, proceso, FAQ, CTA, JSON-LD |
| /despacho | Static | Timeline bufete 2010-2026, valores, compromisos |
| /contacto | Static | Formulario contacto + datos |
| /solicitar-consulta | Static | Formulario consulta |
| /como-llegar | Static | Dirección + mapa placeholder |
| /preguntas-frecuentes | Static | 73 preguntas en 11 categorías, acordeones, FAQPage JSON-LD |
| /areas-juridicas | Hub SSG | 13 áreas con ServiceCardPhoto grid, JSON-LD ItemList |
| /areas-juridicas/[slug] | SSG | 13 áreas standalone con hero, subservicios, FAQ, relacionadas |
| /derecho-penal | Hub SSG | 7 grupos penales, FAQ, JSON-LD |
| /derecho-penal/[slug] | SSG | 7 grupos penales con hero, subservicios, FAQ |
| /migrantes-hondurenos-en-espana | Hub SSG | 3 subáreas transnacionales |
| /migrantes-hondurenos-en-espana/[slug] | SSG | 3 subáreas con hero, subservicios, FAQ |
| /blog | Hub SSG | Featured + grid + sidebar |
| /blog/[slug] | SSG | Artículo con metadata, tags, JSON-LD BlogPosting |
| /blog/categoria/[categoria] | SSG | 11 categorías, hero + grid + sidebar |
| /blog/feed.xml | Dynamic | RSS 2.0 feed |

## Estructura de datos

- data/areas-juridicas.ts: Taxonomía legal con 13 áreas, 7 grupos penales, 3 subáreas migrantes. Incluye subservicios, FAQs, keywords, áreas relacionadas.
- data/faq.ts: 73 FAQ items en 11 categorías.
- data/blog/: Tipos (Post, PostFrontmatter), 11 categorías, posts en .ts (NO MDX).
- data/blog/posts/defensa-penal-honduras.ts: Post piloto.

## Librerías

- lib/site.ts: Configuración central del sitio (URL, teléfono, dirección, SEO, JSON-LD helpers).
- lib/icon-map.ts: Mapeo string→LucideIcon + PlaceholderTone.
- lib/blog.ts: Helpers getAllPosts, getPostBySlug, getPostsByCategory, etc.
- lib/schemas/legal-page.ts: Helpers JSON-LD serviceSchema, faqPageSchema, breadcrumbsSchema.
- lib/schemas/blog.ts: blogPostSchema, blogCollectionSchema.

## Componentes marketing

- section.tsx: Container, Section, SectionHeader con variants.
- cta-buttons.tsx: CTAGroup, UrgencyCallout, ContactStrip.
- public-header.tsx: NAV con Inicio, Áreas Jurídicas, Derecho Penal, Migrantes, FAQ, Blog, Contacto. Barra superior con teléfono + Acceso Intranet.
- public-footer.tsx: 4 columnas (identidad, áreas, despacho, contacto). Legales en barra inferior.
- placeholder-photo.tsx: Rectángulo gradiente con paleta por área.
- circular-icon.tsx: Círculo con borde dorado, LucideIcon.
- service-card-photo.tsx, specialists-grid.tsx, two-column-image-text.tsx, commitments-grid.tsx, testimonials-section.tsx.

## Componentes blog

- blog-card.tsx: Card con gradient header, badge categoría, metadata.
- blog-sidebar.tsx: Categorías, recientes, tags.

## SEO

- app/sitemap.ts: 40+ rutas dinámicas (incluye blog posts y categorías).
- app/robots.ts: Dev bloquea 20+ bots IA. Prod permite rastreo salvo /intranet/, /api/, etc.
- app/(public)/layout.tsx: Metadata global (OG, Twitter, robots).
- JSON-LD en todas las páginas públicas (WebPage, FAQPage, BlogPosting, Service, ItemList, BreadcrumbList).

## Redirects 301 (next.config.ts)

- /areas-de-practica → /areas-juridicas
- /areas-de-practica/:path* → /areas-juridicas/:path*
- /derecho-penal-hondureno → /derecho-penal
- /proceso-penal → /migrantes-hondurenos-en-espana
- /inicio → /
- /home → /

## Convenciones

- Sin imágenes reales (placeholders CSS hasta que el bufete las proporcione).
- Sin MDX (blog en TypeScript puro).
- Sin nuevas dependencias de framework.
- Sin enlaces /intranet/ en componentes públicos (salvo botón Acceso Intranet en header).
- es-HN como locale.
- Commits atómicos, push a main, deploy Vercel automático.

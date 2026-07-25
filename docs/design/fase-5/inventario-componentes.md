# FASE 5 — Inventario de componentes públicos

> **Ámbito:** `components/marketing/` (47 archivos), más los `components/blog/*` consumidos
> por la web pública y los pocos puentes con `components/ui/*`.
> **Clasificación:** A=Mantener · B=Simplificar · C=Fusionar · D=Reemplazar · E=Eliminar ·
> F=Solo uso excepcional.
> **Decisiones detalladas (con file:line de origen) en `matriz-migracion-componentes.md`.**

La columna "Usos" se obtuvo por `grep -r "from '@/components/marketing/<file>"` sobre
`app/(public)/**`. La columna "Duplicidad" indica el componente canónico alternativo.

---

## 1. Canónicos (punto de anclaje — no tocar)

| Componente | Archivo | Función | Clasificación |
| ---------- | ------- | ------- | ------------- |
| `Container` | `section.tsx:4,17` | Wrapper de ancho con `size: 'sm'\|'md'\|'lg'\|'xl'` | **A** |
| `Section` | `section.tsx:21,45` | `<section>` con fondo/padding controlados + Container interno | **A** (extender con `variant`) |
| `SectionHeader` | `section.tsx:65,74` | Eyebrow + título serif + subtítulo, alineable, invertible | **A** |
| `PageHero` | `page-hero.tsx:4,36` | Hero de página (10 usos) | **A** |
| `IconBadge` | `icon-badge.tsx:20` | Contenedor de icono R16 (`w-11 h-11 rounded-lg` + tint) | **A** |
| `ServiceCard` | `service-card.tsx:12` | Tarjeta de área jurídica navegable | **A** |
| `CTAGroup` | `cta-buttons.tsx:9` | Par Teléfono+WhatsApp+Consulta | **A** |
| `ConsultationCTA` | `consultation-cta.tsx:25` | Banda CTA cierre (variantes closing/inline/footer) | **A** |
| `Breadcrumbs` | `breadcrumbs.tsx` | Migas estructuradas + JSON-LD | **A** |
| `EditorialBlock` | `editorial-block.tsx:35` | Bloque editorial (eyebrow+title+intro+points+cta) | **A** |
| `AnswerBlock` | `answer-block.tsx:19` | Respuesta directa AEO/GEO | **A** (absorbe `RespuestaDirecta`) |
| `LegalDisclaimer` | `legal-disclaimer.tsx:28` | Disclaimer legal canónico | **A** (R14) |
| `LegalDocument` | `legal-document.tsx:34` | Plantilla unificada para docs legales (5 páginas) | **A** |
| `LegalReviewNotice` | `legal-review-notice.tsx:27` | Atribución condicional de revisión jurídica | **A** (R17) |
| `CopyableAddress` | `copyable-address.tsx:12` | Copiar dirección al portapapeles | **A** |
| `MapEmbedLazy` | `map-embed-lazy.tsx:28` | Mapa con `dynamic(ssr:false)` | **A** |
| `LeadMagnetCTA` | `lead-magnet-cta.tsx:7` | Captura email + PDF | **A** |
| `HubFaq` | `hub-faq.tsx:4` | FAQ acordeón + JSON-LD `FAQPage` | **A** (absorbe FAQ manual de `landing-local`) |
| `BlogHighlights` | `blog-highlights.tsx:37` | Sección de posts por slug/count + 3 layouts | **A** (delegar tarjeta a `BlogCard`) |
| `BlogCard` | `components/blog/blog-card.tsx` | Tarjeta de post (variantes) | **A** (absorbe card interno de `BlogHighlights`) |
| `PublicHeader` | `public-header.tsx` | Header + nav + drawer móvil | **A** (ajustes de densidad) |
| `PublicFooter` | `public-footer.tsx` | Footer con 5 columnas + 10 ciudades | **A** (compactación visual) |

---

## 2. Componentes con decisión de migración

| Componente | Archivo | Clasificación | Acción | Destino |
| ---------- | ------- | ------------- | ------ | ------- |
| `coverage-city-card.tsx` + `CoverageCityCard` + `CoverageCityGrid` + `getRelatedCities` | `coverage-city-card.tsx:68,158,193` | **E** | Eliminar | — (código muerto, 0 usos en `app/`) |
| `coverage-city-grid.tsx` + `CoverageCityCard` (interna) + `CoverageCityGrid` + `getRelatedCities` | `coverage-city-grid.tsx:8,15,105` | **E** | Eliminar | — (código muerto, 0 usos en `app/`) |
| `CtaSpain` | `cta-spain.tsx:17` | **D** | Reemplazar por `ContextualCta` | `hondurenos-en-espana/page.tsx:283` |
| `RespuestaDirecta` | `service-detail-blocks.tsx:52` | **D** | Reemplazar por `AnswerBlock` | `servicios-juridicos/[slug]:257` |
| Card interno de `BlogHighlights layout='cards'` | `blog-highlights.tsx:121-141` | **D** | Reemplazar por `<BlogCard>` | interno |
| Badges inline `w-11 h-11 rounded-lg` | 7 sitios (ver matriz) | **D** | Reemplazar por `<IconBadge>` | `coverage-city-card`(eliminado), `service-blocks:129`, `trust-bar:80`, `local-context-blocks:83`, `landing-local:213`, `problem-selector:101`, `service-detail-blocks:202` |
| `TestimonialsSection` (tarjeta interna) | `testimonials-section.tsx:69-119` | **C** | Fusionar con `ReviewCard` en `TestimonialCard` compartida | — |
| `ReviewCard` (interna de `GoogleReviews`) | `google-reviews.tsx:102-172` | **C** | Fusionar con tarjeta de `TestimonialsSection` | — |
| `ServiceBlocks` | `service-blocks.tsx:116` | **C** | Fusionar con `ProblemSelector` en `<NavCardGrid>` | HOME, servicios |
| `ProblemSelector` | `problem-selector.tsx:76` | **C** | Fusionar con `ServiceBlocks` (reimplementa IconBadge inline en `:101`) | HOME |
| `ProcessList` (en service-detail-blocks) | `service-detail-blocks.tsx:227` | **C** | Fusionar con `ProcessStepper` (variante layout) | `servicios-juridicos/[slug]` |
| `ProcessStepper` | `process-stepper.tsx:23` | **A** (absorbe) | Añadir `variant: 'grid'\|'list'` | HOME, despacho, slugs |
| `InstitutionsBlock` | `service-detail-blocks.tsx:280` | **C** | Fusionar con `LocalInstitutionsBlock` | slugs |
| `LocalInstitutionsBlock` | `local-context-blocks.tsx:69` | **C** | Fusionar con `InstitutionsBlock` (items tipados) | locales B |
| `LocalAtencionBlock` | `local-context-blocks.tsx:21` | **B** | Simplificar (densidad) | locales B |
| `LocalDocumentLogistics` | `local-context-blocks.tsx:100` | **A** | Mantener | locales B |
| `LandingLocalView` (hero + FAQ + blog internos) | `landing-local.tsx:129-173, 251-265, 268-297` | **D** | Refactor: delegar a `PageHero`/`HubFaq`/`BlogHighlights` | 12 locales |
| `ContextualCta` | `service-detail-blocks.tsx:474` | **A** (absorbe) | Mantener; absorbe caso `CtaSpain` | slugs, españa |
| `ConsultationCTA variant='footer'` | `consultation-cta.tsx:48-66` | **B** | Simplificar o documentar diferencia vs `ContextualCta` | n usos |
| `TrustBar` | `trust-bar.tsx:34` | **A** | Mantener (strip canónico) | n páginas |
| `TrustLimits` | `trust-limits.tsx:68` | **A** | Mantener (bloque dual confianza/límites, sólo `/despacho`) | despacho, home |
| `UrgencyCallout` | `cta-buttons.tsx:114` | **A** | Mantener (callout danger con CTAGroup compact) | n páginas |
| `ContactStrip` | `cta-buttons.tsx:145` | **A** | Mantener (grid 4 contactos) | slugs |
| `IntroEditorial` | `intro-editorial.tsx:4` | **B** | Simplificar o consolidar con `EditorialBlock variant='warm'` | n páginas |
| `ServiceBlocks` (ya en C arriba) | — | — | — | — |
| `ServiceDetailBlocks` (los 10 exports restantes: `SituacionesHabituales`, `SeparacionAudiencias`, `DocumentChecklist`, `FactorsThatVary`, `CommonMistakes`, `SourcesAndDisclaimer`, `ViewServiceTracker`) | `service-detail-blocks.tsx` | **A** | Mantener (bloques editoriales específicos) | `servicios-juridicos/[slug]` |
| `SpainJurisdictionNotice` | `spain-jurisdiction-notice.tsx:19` | **B** | Rediseñar como "información importante" (no alerta error) | españa hub + [slug] |
| `GoogleReviews` (wrapper async) | `google-reviews.tsx:24` | **A** | Mantener; usar `TestimonialCard` compartida | HOME |
| `TestimonialsSection` (wrapper) | `testimonials-section.tsx:25` | **A** | Mantener; usar `TestimonialCard` compartida | HOME |
| `LegalSection`, `LegalSubsection`, `LegalList`, `LegalCallout` | `legal-document.tsx:124,140,159,176` | **A** | Mantener (subpiezas de `LegalDocument`) | docs legales |
| `MapEmbed` (client) | `map-embed.tsx:22` | **A** | Mantener (lo envuelve `MapEmbedLazy`) | interno |
| `PlaceholderPhoto` | `placeholder-photo.tsx` | **A** | Mantener (fallback imágenes) | varios |
| `AnalyticsScripts`, `AnalyticsListeners` | `components/analytics-scripts.tsx`, `marketing/analytics-listeners.tsx` | **A** | Intocable (R: analítica) | layout |
| `ViewLocalPageTracker`, `ViewServiceTracker`, `ViewSpainServiceTracker` | `marketing/view-*-tracker.tsx` | **A** | Intocable (eventos analítica) | n páginas |
| `Reveal` | `reveal.tsx` | **A** | Mantener (entrada IntersectionObserver) | n páginas |
| `ScrollToTop`, `FloatingContactRail`, `HeroOfficeBadge`, `LiveOfficeStatus`, `StatsCounter` | `live-widgets.tsx`, `scroll-to-top.tsx` | **A** | Mantener | n páginas |
| `RssButton`, `SocialShare` | `rss-button.tsx`, `social-share.tsx` | **A** | Mantener | blog |
| `TrackedMapsLink` | `tracked-maps-link.tsx` | **A** | Mantener | locales |
| `TurnstileWidget` | `turnstile-widget.tsx` | **A** | Intocable (Cloudflare Turnstile) | formulario |
| `SolicitarConsultaForm` | `solicitar-consulta-form.tsx` | **B** | Simplificar densidad del rail | `/solicitar-consulta` |
| `CookieConsent` | `components/cookie-consent.tsx` | **A** | Intocable | layout |
| `ChatWidget` | `components/chat/chat-widget.tsx` | **A** | Intocable (chat reglas) | layout |

---

## 3. Componentes `components/blog/*` consumidos por la pública

| Componente | Archivo | Clasificación | Nota |
| ---------- | ------- | ------------- | ---- |
| `BlogCard` | `blog/blog-card.tsx:184` | **A** (absorbe) | Recibe `variant` ya; `BlogHighlights layout='cards'` debe delegar en él |
| `BlogExplorer`, `BlogHero`, `BlogSearch`, `BlogSidebar`, `BlogTOC`, `CategoryFilter`, `FeaturedPosts`, `NewsletterSection`, `BlogCtaBar` | `components/blog/*` | **A** | Intocables (R: blog es subsistema con fuente en DB) |

---

## 4. Resumen de recuento

| Clasificación | Cantidad | Impacto |
| ------------- | -------- | ------- |
| **A** Mantener | 32 | Canónicos, no se tocan |
| **B** Simplificar | 4 | Ajustes de densidad/patrón |
| **C** Fusionar | 6 (3 pares) | Reducción de variantes |
| **D** Reemplazar | 5 grupos | Migración al canónico |
| **E** Eliminar | 2 | Código muerto |
| **F** Excepcional | 0 | — |

**Total analizado:** 47 archivos en `components/marketing/` + ~10 puentes `blog/` y `ui/`.

Resultado neto esperado: **-2 archivos eliminados**, **3 pares fusionados en 3 componentes**,
**5 migraciones al canónico**, **0 componentes nuevos de tarjeta/sección/botón** (los canónicos
absorben los casos). Esto cumple el principio del brief: "máximo 5 familias de tarjeta, 5
variantes de sección, 5 botones" — porque **esas familias ya existen** y solo hay que dejar
de duplicarlas.

---
status: current
owner: analytics
created: 2026-07-04
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Eventos de analítica — Pineda y Asociados

Inventario de eventos GA4/GTM implementados en el sitio público. Última actualización: Fase 2 (Jul 2026).

## Eventos activos

| Evento GA4 | Disparador | Ubicación | Helper |
|---|---|---|---|
| `whatsapp_click` | Clic en botón/enlace de WhatsApp | CTAs, blog-cta-bar, floating rail, contact strip | `trackWhatsAppClick` |
| `phone_click` | Clic en botón/enlace de teléfono | CTAs, blog-cta-bar, floating rail | `trackPhoneClick` |
| `form_click` | Clic en CTA de formulario | CTAs, blog-cta-bar | `trackFormClick` |
| `lead_generated` | Envío exitoso de formulario de consulta | `solicitar-consulta-form`, `lead-magnet-cta` | `trackLeadGenerated` |
| `email_click` | Clic en enlace de correo (footer) | Footer (vía `data-internal-link="email_click"`) | `trackInternalClick` |
| `directions_click` | Clic en CTA de cómo llegar | CTAs | `trackDirectionsClick` |
| `faq_open` | Expansión de cualquier `<details>` con `data-faq-question` | HubFaq (3 hubs + pilar), landings locales, home | `trackFaqOpen` (vía listener global) |
| `blog_search` | Clic en resultado de búsqueda de blog | `blog-search.tsx` | `trackBlogSearch` |
| `internal_click` | Clic en enlace con `data-internal-link` | Footer mailto, search results | `trackInternalClick` (vía listener global) |

## Eventos automáticos de GA4 (Enhanced Measurement)

Estos eventos los mide GA4 automáticamente si GTM tiene "Enhanced Measurement" activo (configuración por defecto en la propiedad del sitio):

- `page_view` — cada vista de página.
- `scroll` — cuando el usuario supera el 90% de la página.
- `click` (outbound) — clics en enlaces externos.
- `view_search_results` — si se configura la búsqueda interna como parámetro.
- `engagement_time_msec` — tiempo de engagement.
- `video_progress` / `video_complete` — si hubiera vídeos (no aplicable actualmente).

## Listener global

`components/marketing/analytics-listeners.tsx` es un Client Component montado una sola vez en `app/(public)/layout.tsx`. Escucha:

- `toggle` (evento nativo de `<details>`) → si el target tiene `data-faq-question`, dispara `trackFaqOpen`.
- `click` → si el target o ancestro es `<a data-internal-link>`, dispara `trackInternalClick`.

## Configuración necesaria en GA4/GTM

1. **Confirmar Enhanced Measurement activo** en la propiedad GA4 (Admin → Data streams → Web → Configure tag settings → Enhanced measurement).
2. **Marcar eventos personalizados como conversiones** si se desea (`lead_generated` es el principal candidato a conversión).
3. **Definir audiencias** basadas en `whatsapp_click` + `phone_click` (alta intención).
4. **Consent Mode v2** ya configurado en `components/analytics-scripts.tsx`.

## Eventos NO implementados (pendientes)

- `view_faq` (impresión, no apertura) — GA4 no lo mide por defecto; requeriría IntersectionObserver.
- `form_abandon` — requiere tracking de campos no completados (Crazy Egg/Hotjar o custom).
- `breadcrumb_click` — los breadcrumbs no tienen `data-internal-link` todavía. Añadir si se quiere trackear.

## CSP

Todos los eventos usan `dataLayer.push` (GTM) o `gtag` ya autorizados por la CSP en `next.config.ts` (`https://www.googletagmanager.com`, `https://*.google-analytics.com`). Sin scripts adicionales.

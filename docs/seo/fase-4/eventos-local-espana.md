# FASE 4 — Eventos analíticos (locales y Honduras–España)

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN

## Eventos nuevos (FASE 4)

Definidos en `lib/analytics.ts`. Reutilizan el helper `trackEvent` y respetan
las reglas de privacidad de Fases 1–3 (sin PII).

| Función | Evento GA4 | Parámetros | Disparador |
| ------- | ---------- | ---------- | ---------- |
| `trackViewLocalPage(locationSlug?)` | `view_local_page` | `value:1`, `location_slug` (slug, ≤60) | `ViewLocalPageTracker` al montar una página `/abogados-en-{slug}` |
| `trackViewSpainService(serviceSlug?)` | `view_spain_service` | `value:1`, `service_slug` (slug, ≤60) | `ViewSpainServiceTracker` al montar una subpágina `/hondurenos-en-espana/[slug]` |
| `trackCtaLocal(location?)` | `cta_local` | `value:1`, `cta_location` (slug, ≤60) | Clic en CTA de página local (reservado para uso futuro) |
| `trackCtaSpain()` | `cta_spain` | `value:1` | `CtaSpain` al clic |

## Eventos reutilizados de fases anteriores

| Evento | Uso en Fase 4 |
| ------ | ------------- |
| `click_maps` | Enlaces a Google Maps en `/como-llegar` (vía `TrackedMapsLink`) y en `LocalAtencionBlock` (enlace a cómo llegar). |
| `consultation_form_*` | Formulario de consulta (vista/inicio/error/submit), heredados de Fase 2. |
| `whatsapp_click`, `phone_click`, `form_click` | CTAs compartidos (`CTAGroup`, `ConsultationCTA`, `ContactStrip`). |
| `view_service` | Páginas de servicio prioritario (Fase 3), intactas. |

## Parámetros permitidos

```
page_path
location_slug
service_slug
cta_location
origen (click_maps)
```

## Prohibido enviar (PII)

- Nombre, correo, teléfono.
- Ciudad exacta del cliente si puede identificarlo.
- Descripción del caso, documentos, datos de menores.
- Cualquier dato personal.

Todos los valores string se truncan con `.slice()` (40/60/100) por seguridad.

## Exclusiones

- `/preview` y `/intranet` siguen excluidos vía `ANALYTICS_EXCLUDED_PREFIXES`
  (verificado por test §17).
- GA4 solo en producción; logs de diagnóstico fuera de producción.
- Consentimiento y modo solo-producción respetados.

## Marcado como eventos clave en GA4 (recomendación)

- `view_local_page` y `view_spain_service`: marcar como eventos de engagement.
- `cta_spain`: marcar como conversión (alta intención comercial desde España).
- `contact_form_submit`: ya marcado como evento clave en Fase 1.

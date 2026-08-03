# Eventos de conversión — FASE 2

**Fecha:** 2026-07-25
**Fuente de los helpers:** `lib/analytics.ts`.
**Componente de captura:** `components/analytics-scripts.tsx` (layout público).
**Reglas globales:** AGENTS.md §3 y §6 (sin PII, sin descripciones del caso,
sin nombre/correo/teléfono en parámetros, excluidos en preview e intranet).

---

## 1. Eventos preexistentes (no modificados en FASE 2)

| Evento | Helper | Parámetros | Disparo |
| ------ | ------ | ---------- | ------- |
| `whatsapp_click` | `trackWhatsAppClick` | `value` | Clic en botón WhatsApp (CTAGroup, contacto) |
| `phone_click` | `trackPhoneClick` | `value` | Clic en botón de llamada |
| `form_click` | `trackFormClick` | `value`, `cta_location`, `source_path` | Clic en CTA de formulario genérico |
| `consultation_cta_click` | `trackConsultationCtaClick` | `value`, `cta_location`, `source_path` | Clic en el CTA principal de consulta ("Solicitar evaluación confidencial") |
| `email_click` | `trackEmailClick` | `value`, `cta_location`, `source_path` | Clic en enlace mailto |
| `directions_click` | `trackDirectionsClick` | `value` | Clic en indicaciones |
| `contact_form_submit` | `trackContactFormSubmit` | `value`, `form_name`, `page_path`, `service_area` (categoría), `submission_status`, `transport` | Envío exitoso del formulario de consulta (HTTP 2xx) |
| `lead_generated` | `trackLeadGenerated` | `value` | Conversión genérica de lead |
| `faq_open` | `trackFaqOpen` | `question` (≤100), `page?` | Apertura de FAQ |
| `blog_search` | `trackBlogSearch` | `query` (≤100) | Búsqueda en blog |
| `internal_click` | `trackInternalClick` | `target` (≤100) | Clic en enlace interno |
| `scroll_depth` | `trackScrollDepth` | `percent`, `value` | Profundidad de scroll |

`contact_form_submit` **solo** recibe datos no personales: `form_name`
("consulta"), `page_path`, `service_area` (categoría amplia derivada del
motivo: penal/laboral/familia/civil-notarial/espana/otro), `submission_status`
("success" solo tras confirmación del servidor) y `transport` (medio preferido
seleccionado). **No** recibe nombre, teléfono, email, resumen del caso ni
contenido jurídico.

---

## 2. Eventos añadidos en FASE 2

| Evento | Helper | Parámetros (sin PII) | Disparo | Ubicación |
| ------ | ------ | -------------------- | ------- | --------- |
| `contact_form_view` | `trackContactFormView` | `value`, `page_path?` | Montaje del formulario de consulta | `solicitar-consulta-form.tsx` (useEffect) |
| `contact_form_start` | `trackContactFormStart` | `value`, `page_path?` | Primer campo editado del formulario (una sola vez) | `solicitar-consulta-form.tsx` (onText) |
| `contact_form_error` | `trackContactFormError` | `value`, `category` (validation\|turnstile\|rate_limit\|network\|server\|delivery\|unknown), `field?` (identificador), `page_path?` | Error de validación o envío (sin el valor del campo) | `solicitar-consulta-form.tsx` |
| `click_maps` | `trackClickMaps` | `value`, `origen?` (≤40) | Clic en enlace a Google Maps/indicaciones | `tracked-maps-link.tsx` (/como-llegar) |
| `view_service` | `trackViewService` | `value`, `servicio?` (≤60, slug/identificador) | Vista de página o tarjeta de servicio | Disponible para uso en ServiceCard/áreas (no aplica PII) |
| `view_team_section` | `trackViewTeamSection` | `value`, `ruta?` (≤100) | Vista de la sección de equipo | Disponible para uso en /despacho y home |

> **2026-08-03:** los eventos `consultation_form_view/start/error` se
> renombraron a `contact_form_view/start/error` para unificar la familia de
> conversión del formulario (§9 del cierre PR26). Se añadió
> `consultation_cta_click` para el CTA principal.

### 2.1. Embudo de conversión del formulario

```
contact_form_view  →  contact_form_start  →  contact_form_error*
                                                   │
                                                   └→ (corrección) → contact_form_submit / lead_generated
```

- `contact_form_view`: el usuario llegó al formulario (oportunidad de conversión).
- `contact_form_start`: el usuario interactuó (intentó completar).
- `contact_form_error`: fricción detectable por categoría controlada **sin exponer el valor**.
- `contact_form_submit` + `lead_generated`: conversión confirmada tras HTTP 2xx.

### 2.2. Reglas de PII aplicadas

| Campo del formulario | ¿Se envía a analítica? | Justificación |
| -------------------- | --------------------- | ------------- |
| `nombre` | **No** | PII directo |
| `telefono` | **No** | PII directo |
| `email` | **No** | PII directo |
| `resumen` | **No** | Puede contener descripción del caso |
| `motivo` | **Sí** (catálogo cerrado) | No es PII; es categoría |
| `medioPreferido`, `urgencia`, `localidad` | **No** vía analytics | Se guardan en DB/email; no se exponen en gtag |
| `ruta` | **Sí** (pathname sin query) | No es PII |

`consultation_form_error` reporta el **identificador** del campo (`resumen`,
`acepta`, etc.) y el **tipo** de error (`minlength`, `consent`, `submit`), nunca
el valor introducido.

---

## 3. Exclusión de rutas privadas y preview

`ANALYTICS_EXCLUDED_PREFIXES` (fuente única en `lib/analytics.ts`) excluye:

```
/intranet  /preview  /api  /cp  /calculadora  /casos
/delitos  /atajos  /admin  /_next  /404  /500
```

Una ruta se excluye si `pathname === prefijo` o empieza por `prefijo + '/'`.
Así `/preview/abc` y `/intranet/dashboard` no disparan GA4; `/` sí.

Cobertura de tests: `tests/fase2-paginas-centrales.test.ts` valida que
`/preview` y `/intranet` están en la lista y que la home pública no se excluye.

---

## 4. Marcado como evento clave en GA4

`contact_form_submit` y `lead_generated` deben marcarse como **conversiones
clave** en la configuración de GA4 (interfaz de administrador). Esta acción es
operativa en GA4, no en código, y queda fuera del alcance de FASE 2 (no se
tocan IDs ni configuración de proveedor — R10).

---

## 5. Consentimiento

No se añade banner de consentimiento nuevo en FASE 2. Los eventos se sujetan al
consentimiento existente (configuración de analytics-scripts). No se envían PII,
consultas legales, nombres, correos, teléfonos ni identificadores de expedientes.

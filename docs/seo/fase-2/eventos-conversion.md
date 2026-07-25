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
| `form_click` | `trackFormClick` | `value` | Clic en CTA de formulario |
| `email_click` | `trackEmailClick` | `value` | Clic en enlace mailto |
| `directions_click` | `trackDirectionsClick` | `value` | Clic en indicaciones |
| `contact_form_submit` | `trackContactFormSubmit` | `value`, `motivo` (catálogo, ≤40), `ruta` (≤100) | Envío exitoso del formulario de consulta |
| `lead_generated` | `trackLeadGenerated` | `value` | Conversión genérica de lead |
| `faq_open` | `trackFaqOpen` | `question` (≤100), `page?` | Apertura de FAQ |
| `blog_search` | `trackBlogSearch` | `query` (≤100) | Búsqueda en blog |
| `internal_click` | `trackInternalClick` | `target` (≤100) | Clic en enlace interno |
| `scroll_depth` | `trackScrollDepth` | `percent`, `value` | Profundidad de scroll |

`contact_form_submit` **solo** recibe `motivo` (categoría del desplegable, no
texto libre) y `ruta`. **No** recibe nombre, teléfono, email ni resumen del caso.

---

## 2. Eventos añadidos en FASE 2

| Evento | Helper | Parámetros (sin PII) | Disparo | Ubicación |
| ------ | ------ | -------------------- | ------- | --------- |
| `consultation_form_view` | `trackConsultationFormView` | `value`, `ruta?` (≤100) | Montaje del formulario de consulta | `solicitar-consulta-form.tsx` (useEffect) |
| `consultation_form_start` | `trackConsultationFormStart` | `value`, `ruta?` (≤100) | Primer campo editado del formulario | `solicitar-consulta-form.tsx` (onText) |
| `consultation_form_error` | `trackConsultationFormError` | `value`, `campo?` (≤40, identificador), `tipo?` (≤40), `ruta?` (≤100) | Error de validación o envío | `solicitar-consulta-form.tsx` |
| `click_maps` | `trackClickMaps` | `value`, `origen?` (≤40) | Clic en enlace a Google Maps/indicaciones | `tracked-maps-link.tsx` (/como-llegar) |
| `view_service` | `trackViewService` | `value`, `servicio?` (≤60, slug/identificador) | Vista de página o tarjeta de servicio | Disponible para uso en ServiceCard/áreas (no aplica PII) |
| `view_team_section` | `trackViewTeamSection` | `value`, `ruta?` (≤100) | Vista de la sección de equipo | Disponible para uso en /despacho y home |

### 2.1. Embudo de conversión del formulario

```
consultation_form_view  →  consultation_form_start  →  consultation_form_error*
                                                        │
                                                        └→ (corrección) → contact_form_submit / lead_generated
```

- `consultation_form_view`: el usuario llegó al formulario (oportunidad de conversión).
- `consultation_form_start`: el usuario interactuó (intentó completar).
- `consultation_form_error`: fricción detectable por campo/tipo **sin exponer el valor**.
- `contact_form_submit` + `lead_generated`: conversión confirmada tras HTTP 200.

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

# 07 — Auditoría de CTA y conversión

## Inventario actual

Se identifican **13 patrones de CTA**:

- `CTAGroup`: `primary`, `inline`, `compact`, `inverse`.
- `ConsultationCTA`: `closing`, `inline`, `footer`.
- `UrgencyCallout`.
- `ContactStrip`: horizontal y stacked.
- `ContextualCta`.
- `CtaSpain`.
- CTA custom del perfil/contexto de abogado.

A ello se añaden enlaces de texto con flecha, botones de mapa y CTAs internos de formularios.

## Fricciones por recorrido

### Familiar detenido

Entrada probable: `/derecho-penal` o landing penal local. Encuentra CTA del hero, perfil con WhatsApp, `UrgencyCallout`, tarjetas de urgencia, `ContactStrip`/CTA contextual y cierre. La urgencia está diferenciada, pero compite con demasiadas acciones equivalentes.

**Ruta propuesta:** entrada → aviso urgente con llamada/WhatsApp → información mínima → formulario opcional. Un solo CTA urgente persistente.

### Divorcio, despido, propiedad o empresa

Entrada probable: servicio específico. La persona puede atravesar respuesta, listas, documentos, proceso, autoridades, factores, errores, abogado, FAQ, relacionados, guías, lead magnet y varios CTAs.

**Ruta propuesta:** hero → respuesta → situaciones/qué incluye → documentos/proceso → abogado breve → FAQ específica → CTA final.

### Usuario que no sabe qué abogado necesita

Entrada: portada. El selector por problema funciona, pero después aparecen catálogo reducido, razones, equipo y proceso. Debe llegar a una recomendación antes de consumir prueba institucional extensa.

### Dirección o teléfono

La navegación, footer, barra móvil y `/como-llegar` resuelven la intención. En `/solicitar-consulta`, tres tarjetas de visita más un botón adicional son redundantes.

## Sistema máximo recomendado

| Tipo | Función | Máximo por página |
|---|---|---:|
| Primario | Solicitar evaluación confidencial | 1 persistente por zona visible |
| Secundario | Llamar o WhatsApp según contexto | 1 junto al primario |
| Urgencia | Detención/citación inmediata | 1, solo penal/consulta |
| Final | Cierre de página | 1 |
| Contextual | Acción ligada a un bloque concreto | 1–2 en toda la página |

## Reglas

- Máximo dos acciones visuales agrupadas.
- El CTA final no debe repetir lista de ciudades, secreto profesional, presupuesto y «cada caso es único» si ya se mostraron antes.
- WhatsApp verde se reserva a contacto directo; burdeos/rojo solo a urgencia real.
- `CtaSpain` y `ContextualCta` deben ser variantes semánticas del sistema canónico, no componentes paralelos.
- El texto comercial debe usar «Evaluación inicial confidencial» hasta confirmación expresa de precio.

## Medición

No cambiar orden, copy o HTML de CTA en URLs experimentales antes del **2026-09-01** sin autorización SEO. Incluso cambios “visuales” pueden contaminar conversión si alteran prominencia, posición o scroll.

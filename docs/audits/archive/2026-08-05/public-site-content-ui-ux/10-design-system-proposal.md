# 10 — Propuesta de sistema de diseño

## Dirección

No se propone un rediseño genérico. Se preservan la identidad navy/dorado, Cormorant Garamond, Manrope, fotografías reales y el tono jurídico sobrio. La intervención consiste en **reducir variantes y documentar límites de uso**.

## Tokens

| Grupo | Regla propuesta |
|---|---|
| Primario | navy existente; fondos de marca solo en hero, footer y énfasis |
| Dorado | acento, foco, línea y CTA; no fondo dominante repetido |
| Superficies | `default`, `subtle`, `warm`, `brand`, `editorial` |
| Bordes | uno suave, uno fuerte, uno semántico; no variar por página |
| Radio | `sm` 8, `md` 12, `lg` 16 canónico, `pill` 9999 |
| Sombra | `card`, `card-hover`, botones tokenizados, focus tokenizado |
| Espaciado | escala 4/8/12/16/24/32/48/64; sección compacta 40–56, estándar 64–80 |
| Contenedor | lectura 720–800 px; contenido 1120–1280 px |
| H1 | 32–48 desktop; 30–38 móvil según variante |
| H2 | 28–38 desktop; 24–32 móvil |
| Cuerpo | 16–18; línea 1.55–1.7; máximo 70 caracteres |
| Iconos | 20 px dentro de caja 44 px; 16 px/36 px solo compacto |
| Movimiento | 150/220/320 ms; respetar reduced motion; sin animación imprescindible |

## Componentes y variantes permitidas

| Componente | Variantes | Contenido máximo | No usar para |
|---|---|---|---|
| `Hero` | home, hub, service, profile, local, conversion | eyebrow, H1, 1 párrafo, 2 CTA, badge opcional | listas largas, cuatro claims, catálogo |
| `Section` | default, subtle, warm, brand, editorial | 1 objetivo | agrupar temas no relacionados |
| `SectionHeader` | left, center, inverse | eyebrow + H2 + 1 subtítulo | repetir eyebrow y título |
| `Card` | navigation, feature, information, profile, urgency | título 2 líneas, 45–80 palabras | prosa extensa |
| `TeamCard` | compact, full | según 06 | perfiles completos fuera de `/equipo` |
| `ServiceCard` | featured, standard, compact | título + 35–55 palabras | procesos o garantías |
| `ProblemCard` | standard | situación + resultado | segundo catálogo de servicios |
| `TrustBlock` | strip, limits | 3–4 señales | repetir hero/CTA |
| `CTA` | primary, secondary, urgency, final, contextual | título corto + 40–70 palabras | contar toda la historia del despacho |
| `Process` | steps, timeline, table | 3–6 items | mezclar método general con etapas legales |
| `FAQ` | compact, grouped | 4–6 por página | añadir longitud SEO genérica |
| `ContactBlock` | compact, full | 2–4 canales | aparecer junto a otro CTA final |
| `LocationBlock` | summary, full | NAP o mapa completo | repetir mapa en servicios |
| `Notice` | info, legal, warning, urgency | 1 mensaje | usar rojo para información neutral |
| `Testimonial` | quote, review | solo datos reales | activar sin evidencia/consentimiento |

## Componentes existentes a reutilizar

`Section`, `Container`, `SectionHeader`, `PageHero`, `IconBadge`, `ServiceCard`, `CTAGroup`, `ConsultationCTA`, `Breadcrumbs`, `EditorialBlock`, `AnswerBlock`, `HubFaq`, `LegalDocument`, `LegalDisclaimer`, `CopyableAddress`, `MapEmbedLazy` y `BlogHighlights`.

## Duplicados a retirar o absorber

- Hero inline de servicio y local → variantes de `PageHero`.
- `RespuestaDirecta` → `AnswerBlock` con variante semántica.
- `ProcessList` y tabla penal → un `Process` con layouts.
- `InstitutionsBlock` y variante local → un bloque tipado.
- Tarjetas custom de blog en páginas no-blog → `BlogHighlights`/`BlogCard` sin tocar el blog.
- `CtaSpain` y `ContextualCta` → variantes contextuales de CTA.
- `coverage-city-card/grid` → retirar solo tras verificación de imports/tests.

# FASE 5 — Auditoría visual actual (baseline)

> **Fecha:** 2026-07-25
> **Estado del código:** `main` @ `40ab9b1a` (cierre SEO/GEO).
> **Método:** capturas Playwright locales contra `next dev -p 3178` con `DATABASE_URL` de
> producción-apuntada (Neon) y `prefers-reduced-motion: reduce` para determinismo.
> **Anchos:** 375 / 768 / 1280 / 1440 px.
> **Rutas:** 14 (ver índice más abajo).
> **Capturas:** `docs/design/fase-5/baseline/{375,768,1280,1440}/*.png` (56 archivos).

Las observaciones de este documento se extraen **directamente de las capturas**, no de
inspección de código en solitario. La inspección de código complementa y precisa el origen
(`file:line`) pero no sustituye la evidencia visual.

---

## 1. Dirección visual observada

La web actual tiene **identidad clara y coherente** en lo macro: paleta navy (#0F1D3A) +
dorado (#D4AF37), tipografía serif (Cormorant Garamond) para titulares y sans (Manrope)
para cuerpo, fondos cálidos (#F9F8F5). Es legible, profesional y se reconoce como bufete
jurídico de provincia con vocación tecnológica.

El problema **no es de identidad**, es de **ejecución**:

- Cada página resuelve los mismos bloques (eyebrow + título, hero, CTA, FAQ) con variantes
  ligeramente distintas, lo que produce la sensación de "parches sucesivos" que el brief
  quiere eliminar.
- Hay **3 implementaciones de hero**, **4 de header de sección**, **2 de tarjeta de
  testimonio/reseña**, **2 de bloque de instituciones**, **2 de FAQ accordion**,
  **2 de bloque de procesos**, repartidas entre páginas y componentes.
- Varias páginas acumulan secciones hasta alturas excesivas (ver §3) sin pausas visuales.

---

## 2. Inventario de rutas capturadas

| Slug | Ruta | 375 | 768 | 1280 | 1440 |
| ---- | ---- | --- | --- | ---- | ---- |
| `home` | `/` | ✓ | ✓ | ✓ | ✓ |
| `despacho` | `/despacho` | ✓ | ✓ | ✓ | ✓ |
| `servicios` | `/servicios-juridicos` | ✓ | ✓ | ✓ | ✓ |
| `derecho-penal` | `/derecho-penal` | ✓ | ✓ | ✓ | ✓ |
| `servicio-familia` | `/servicios-juridicos/derecho-de-familia` | ✓ | ✓ | ✓ | ✓ |
| `servicio-laboral` | `/servicios-juridicos/derecho-laboral` | ✓ | ✓ | ✓ | ✓ |
| `servicio-civil` | `/servicios-juridicos/derecho-civil-y-notarial` | ✓ | ✓ | ✓ | ✓ |
| `consulta` | `/solicitar-consulta` | ✓ | ✓ | ✓ | ✓ |
| `faq` | `/preguntas-frecuentes` | ✓ | ✓ | ✓ | ✓ |
| `como-llegar` | `/como-llegar` | ✓ | ✓ | ✓ | ✓ |
| `espana-hub` | `/hondurenos-en-espana` | ✓ | ✓ | ✓ | ✓ |
| `local-nacaome` | `/abogados-en-nacaome` | ✓ | ✓ | ✓ | ✓ |
| `local-choluteca` | `/abogados-en-choluteca` | ✓ | ✓ | ✓ | ✓ |
| `local-san-lorenzo` | `/abogados-en-san-lorenzo` | ✓ | ✓ | ✓ | ✓ |

Las rutas dinámicas (`servicios-juridicos/[slug]`, `derecho-penal/[slug]`,
`hondurenos-en-espana/[slug]`) se representan con su caso más común; la estructura es
compartida dentro de cada ruta.

---

## 3. Problemas visuales confirmados (con evidencia)

### 3.1 Alturas de página excesivas (densidad vertical)

| Ruta | Altura 1440 (px) | Altura 375 (px) | Observación |
| ---- | ---------------- | --------------- | ----------- |
| `home` | 7 116 | **11 761** | 12 secciones sin pausas claras entre navegación y conversión |
| `despacho` | 8 491 | — | 3 bloques consecutivos de tarjetas-con-icono (Valores, Equipo, Asignación) |
| `servicios` | 8 788 | **15 873** | Catálogo de 14 áreas + matriz + 3 destacadas = 3 bloques de "navegación por problema" |
| `servicio-familia` | **10 238** | — | 22 elementos condicionales encadenados en `servicios-juridicos/[slug]` |
| `faq` | **11 693** | — | 8 clusters apilados, cada uno con `<Section>` propia |
| `espana-hub` | 6 265 | — | Hub con 12 secciones (lo más razonable del conjunto) |
| `consulta` | 4 290 | — | Rail derecho con **6 tarjetas apiladas** en col-span-2 |
| `local-nacaome` | 4 508 | — | Hero local distinto del canónico |

> Cifras tomadas de las dimensiones reales de los PNG `fullPage`.

### 3.2 Fragmentación de patrones comunes

| Patrón | Implementaciones paralelas | Origen |
| ------ | -------------------------- | ------ |
| Hero | (a) `<PageHero>` canónico · (b) hero custom HOME `app/(public)/page.tsx:171-273` · (c) hero custom `servicios-juridicos/[slug]:231-252` · (d) hero inline `landing-local.tsx:129-173` | 4 variantes |
| Header de sección | (a) `<SectionHeader eyebrow title subtitle align>` · (b) `eyebrow-rule` + `<h2 className="font-serif font-extrabold">` inline · (c) `text-xxs font-bold uppercase tracking-widest text-accent-dark` + `<h2>` · (d) `<EditorialBlock>` con su propia cabecera | 4 variantes |
| Tarjeta testimonio/reseña | (a) `TestimonialsSection` interna · (b) `ReviewCard` en `GoogleReviews` | 2 variantes, misma estructura |
| Bloque instituciones | (a) `InstitutionsBlock` (`service-detail-blocks.tsx:280`) · (b) `LocalInstitutionsBlock` (`local-context-blocks.tsx:69`) | 2 variantes, mismo concepto |
| Bloque procesos | (a) `ProcessStepper` (grid horizontal) · (b) `ProcessList` (`service-detail-blocks.tsx:227`, lista vertical) | 2 variantes, mismo dato |
| FAQ acordeón | (a) `<HubFaq>` con `<details>` + JSON-LD · (b) `<details>` manual en `landing-local.tsx:251-265` · (c) `<details>` manual en `preguntas-frecuentes/page.tsx:288-377` · (d) FAQ cards `border-l-accent` en los 3 `[slug]` | 4 variantes |
| Navegación "por problema" | (a) `<ProblemSelector>` (6 entradas) · (b) `<ServiceBlocks>` (grid por necesidad) · (c) matriz decisión `servicios-juridicos/page.tsx:54-109` (tabla) · (d) 3 destacadas transversales `:294-322` | 4 variantes |
| Tarjeta icono-contenedor (R16) | `<IconBadge>` canónico + **~7 clones inline** `w-11 h-11 rounded-lg` en `coverage-city-card.tsx:80`, `service-blocks.tsx:129`, `trust-bar.tsx:80`, `local-context-blocks.tsx:83`, `landing-local.tsx:213`, `problem-selector.tsx:101`, `service-detail-blocks.tsx:202` | 1 canónico + 7 divergentes |
| CTA "cierra con consulta" | (a) `<ConsultationCTA variant='closing'>` · (b) `<ContextualCta>` (`service-detail-blocks.tsx:474`) · (c) `<CtaSpain>` (casi idéntico a ContextualCta) | 3 variantes |
| Respuesta directa AEO | (a) `<AnswerBlock>` (6 páginas) · (b) `RespuestaDirecta` (`service-detail-blocks.tsx:52`, docstring admite "Reutiliza el patrón visual del AnswerBlock") | 2 variantes |

### 3.3 Páginas de servicio con jerarquía visual plana

En `/servicios-juridicos` las **14 áreas se muestran con `tone="primary"` idéntico** para
todas (`app/(public)/servicios-juridicos/page.tsx:193`). No hay diferenciación visual entre
**penal/familia/laboral/civil-y-notarial** (las cuatro prioritarias según `HIGHLIGHTED_AREAS`
en `app/(public)/page.tsx:93`) y las 10 complementarias.

El selector por problema se presenta además **tres veces** en la misma página con
formatos distintos:

1. `<ServiceBlocks>` (grid por necesidad) — `:168-176`
2. Catálogo completo de `ServiceCard` (14) — `:178-197`
3. Matriz de decisión (tabla 6 entradas) + 3 destacadas — `:199-322`

### 3.4 `SpainJurisdictionNotice` se lee como alerta de error

En `/hondurenos-en-espana` y `/hondurenos-en-espana/[slug]`, el aviso jurisdiccional
(`spain-jurisdiction-notice.tsx`) utiliza la paleta `danger` (rojo #B22234) y se distingue
visualmente como un **estado de error**, no como información profesional importante. El brief
pide explícitamente: *"No diseñar el aviso jurisdiccional como alerta de error. Debe sentirse
como información profesional importante."*

### 3.5 `LandingLocalView` reimplementa tres canónicos

El componente que pinta las 12 páginas `/abogados-en-*` (`landing-local.tsx:56`)
**no usa** `PageHero`, `HubFaq` ni `BlogHighlights`. Genera:

- Hero propio inline (`:129-173`)
- FAQ como tarjetas planas (`:251-265`)
- Blog como grid manual (`:268-297`)

Resultado: las 12 landings locales tienen una identidad visual **ligeramente distinta** del
resto del sitio, sin razón funcional.

### 3.6 `preguntas-frecuentes`: redundancia y clusters vacíos

En `preguntas-frecuentes/page.tsx`:

- Cada cluster recibe **el mismo string como `eyebrow` y como `title`** (`:296-297`).
- 2 de los 8 clusters (`honorarios`, `atencion-local-y-tramites`) tienen `categorySlugs: []`
  → solo muestran el `SectionHeader` + una tarjeta inline, sin preguntas FAQ reales.

### 3.7 Código muerto visible en componentes

`coverage-city-card.tsx` y `coverage-city-grid.tsx` **definen ambos** `CoverageCityCard`,
`CoverageCityGrid` y `getRelatedCities`, pero **ninguno se importa en `app/`** (grep retorna
0 usos fuera de `components/marketing/`). Mantienen clases `.city-card` en `globals.css`
asociadas que ya no se ejercen.

### 3.8 `prefers-reduced-motion` duplicado

El bloque global `app/globals.css:399-406` ya fuerza `animation/transition-duration: 0.01ms`.
Aun así, la media query se repite **6 veces más** (`:528-530, :1052-1056, :1069-1071,
:1123-1126, :1250-1252, :1273-1275`) para anular `transform` en hovers. Funciona pero es
difícil de mantener.

### 3.9 Divergencia del token de focus ring

La utilidad `.focus-ring` (`globals.css:1279-1285`) usa `0 0 0 3px rgba(212,175,55,0.40)`,
pero **21 ocurrencias inline** en `components/ui/{input,filter-bar,prompt-dialog}.tsx`,
`components/sgie/*` y `components/marketing/*` usan `shadow-[0_0_0_3px_rgba(212,175,55,0.18)]`
(opacidad 0.18). No existe `--shadow-focus-ring`.

### 3.10 Duraciones de transición dispersas

7 duraciones distintas hardcodeadas en utilidades CSS: 150/200/220/240/280/300/320 ms. No
hay tokens `--duration-*`.

---

## 4. Lo que SÍ funciona (preservar)

- **Paleta y tokens de color**: completa, con dark mode paralelo consistente.
- **Tipografía**: Cormorant + Manrope autohospedadas vía `next/font`. Legible y reconocible.
- **Sistema de sombras de botón**: tokenizado en `--shadow-btn-{primary,secondary,accent,
  success}[-hover]` y expuesto como `.btn-shadow-*` (R16).
- **Tres clases de prosa editorial**: `.article-body`, `.prose-editorial`, `.prose-pilar`
  (hechas a mano porque no se usa `@tailwindcss/typography`).
- **Easings**: `--ease-spring` y `--ease-soft` tokenizados y consumidos.
- **10 ciudades del footer**: correctas y completas (`public-footer.tsx:39-48`, cumple R18).
- **Canónicos existentes**: `Section`, `Container`, `SectionHeader`, `PageHero`, `IconBadge`,
  `ServiceCard`, `CTAGroup`, `ConsultationCTA`. **No hay que rediseñarlos**: hay que migrar
  los duplicados hacia ellos.

---

## 5. Conclusión visual preliminar

La web se siente como un único producto en cada página individualmente, pero al comparar
páginas entre sí aparecen las costuras. La intervención de FASE 5 no debe tocar paleta,
tipografía ni estructura de información: debe **consolidar las variantes divergentes** hacia
los canónicos existentes y **reducir la densidad vertical** de las páginas más largas.

Los cambios por página se detallan en `cambios-por-pagina.md`. La matriz de migración de
componentes en `matriz-migracion-componentes.md`. La validación visual antes/después en
`validacion-visual.md`.

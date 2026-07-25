# FASE 5 — Matriz de migración de componentes

> **Estado de cada migración:** ✅ Implementado y validado · ⏳ Pendiente (trabajo
> futuro, no bloqueante) · ⛔ Descartado (decisión técnica documentada).
>
> Las filas con estado ⛔ incluyen la justificación precisa de por qué NO se migró.

---

## Resumen ejecutivo

| Estado | Cantidad | Líneas netas |
| ------ | -------- | ------------ |
| ✅ Implementado | 5 migraciones | -325 (eliminadas) + refactor |
| ⏳ Pendiente | 4 fusiones | (trabajo futuro) |
| ⛔ Descartado | 3 migraciones | (decisión técnica) |

---

## Matriz detallada

| Componente anterior | Nuevo componente / Acción | Páginas afectadas | Riesgo | Estado | Commit |
| ------------------- | ------------------------- | ----------------- | ------ | ------ | ------ |
| `coverage-city-card.tsx` (214 líneas, 0 usos) | **Eliminar** | Ninguna (código muerto) | Bajo | ✅ | `eed54b0b` |
| `coverage-city-grid.tsx` (111 líneas, 0 usos) | **Eliminar** | Ninguna (código muerto) | Bajo | ✅ | `eed54b0b` |
| `CtaSpain` (banda navy pesada) | **Alinear visualmente con `ContextualCta`** (mantener componente + evento) | `/hondurenos-en-espana` | Bajo | ✅ | `ae7670c6` |
| `RespuestaDirecta` (eyebrow + `<p>` sin línea dorada) | **Alinear composición con `AnswerBlock`** (eyebrow + línea dorada + `max-w-2xl`) | `/servicios-juridicos/[slug]` | Bajo | ✅ | `ae7670c6` |
| FAQ manual de `LandingLocalView` (Cards border-l-accent + FAQPage duplicado) | **Delegar en `HubFaq`** (acordeón + JSON-LD único) | 12 landings `/abogados-en-*` | Medio | ✅ | `4700befc` |
| Badges inline `w-11 h-11` en `LandingLocalView` (servicios + blog) | **Reemplazar por `<IconBadge>`** | 12 landings | Bajo | ✅ | `4700befc` |
| Hero inline de `LandingLocalView` (`text-xxs font-bold uppercase`) | **Eyebrow canónico `eyebrow-rule`** | 12 landings | Bajo | ✅ | `4700befc` |
| Tokens `--shadow-focus-ring`, `--duration-*`, `--radius-pill` (faltantes) | **Añadir a `@theme`** | Global | Bajo | ✅ | `0f02b6c0` |
| `.focus-ring`, `.hero-card`, `.card-dark` (valores hardcodeados) | **Consumir tokens** | Global | Bajo | ✅ | `0f02b6c0` |
| `Section` (sin `variant`) | **Añadir prop `variant`** (alias de `background`) | Global (opt-in) | Bajo | ✅ | `0f02b6c0` |
| `TestimonialsSection` + `ReviewCard` (`GoogleReviews`) | **Fusionar en `TestimonialCard` compartida** | HOME | Medio | ⏳ | — |
| `ServiceBlocks` + `ProblemSelector` | **Fusionar en `<NavCardGrid>`** | HOME, servicios | Medio | ⏳ | — |
| `ProcessStepper` + `ProcessList` (service-detail-blocks) | **Fusionar con variante layout** | HOME, despacho, slugs | Medio | ⏳ | — |
| `LocalInstitutionsBlock` + `InstitutionsBlock` | **Fusionar (items tipados)** | locales B, slugs | Bajo | ⏳ | — |
| `CtaSpain` → `ContextualCta` (eliminar `CtaSpain`) | — | — | — | ⛔ | — |
| Card interno de `BlogHighlights layout='cards'` → `BlogCard` | — | — | — | ⛔ | — |
| Hero de `LandingLocalView` → `<PageHero>` | — | — | — | ⛔ | — |

---

## Justificaciones de migraciones descartadas (⛔)

### ⛔ `CtaSpain` → `ContextualCta` (eliminar `CtaSpain`)

**Plan original:** reemplazar `CtaSpain` por `ContextualCta` con `href` preconstruido.

**Por qué se descarta:** `CtaSpain` es **Client Component** que dispara el evento GA4
específico `cta_spain` (`trackCtaSpain()` en `lib/analytics.ts:233`). Ese evento es un
**contrato analítico verificado** por `tests/fase4-local-espana.test.ts:354` y
mencionado en el brief §26 ("No modificar eventos"). `ContextualCta` es Server Component
que delega el tracking al listener global (no dispara `cta_spain`). Eliminar `CtaSpain`
rompería el evento y el test.

**Qué se hizo en su lugar:** rediseño visual de `CtaSpain` para alinear su lenguaje con
`ContextualCta` (fondo `bg-accent/5` + borde `border-accent/30` + eyebrow + cta-primary-refined),
conservando `'use client'` y `trackCtaSpain`. Commit `ae7670c6`.

### ⛔ Card interno de `BlogHighlights layout='cards'` → `BlogCard`

**Plan original:** que `BlogHighlights layout='cards'` delegue su tarjeta interna en `<BlogCard>`.

**Por qué se descarta:** `BlogCard` (variant `default`) **siempre muestra una imagen**
(`aspect-[16/10]`), incluso si no hay coverImage (gradiente de fallback). La tarjeta de
`BlogHighlights layout='cards'` es **sobria y sin imagen** (solo IconBadge BookOpen + fecha
+ título + descripción), pensada para landings locales y hubs donde no se quiere que el blog
compita visualmente. Migrar a `BlogCard` introduciría imágenes donde hoy no las hay — un
cambio de diseño no solicitado explícitamente.

**Qué se hizo en su lugar:** la duplicidad se documenta como **intencional y justificada**
dos roles distintos (tarjeta rica con imagen vs tarjeta sobria sin imagen). El `IconBadge`
ya está bien usado en `BlogHighlights` (no hay badge inline).

### ⛔ Hero de `LandingLocalView` → `<PageHero>`

**Plan original:** migrar el hero inline de `LandingLocalView` al `PageHero` canónico.

**Por qué se descarta:** el hero local aporta **NAP específica de SEO local** (sede,
horario, teléfono) como `<dl>` estructurada — información valiosa para Google Local y para
el usuario. `PageHero` acepta `{ eyebrow, title, subtitle, cta, align, variant, badge,
bgImage }` pero **no `children`**, así que no podría inyectarle la NAP sin extender su API.
Extender `PageHero` para un caso único (12 landings) rompería su rol canónico.

**Qué se hizo en su lugar:** alineación del eyebrow (`eyebrow-rule` canónico en vez de
clases inline) preservando el layout, la NAP y la CTAGroup. Commit `4700befc`.

---

## Pendientes (⏳) — trabajo futuro no bloqueante

Las 4 fusiones pendientes (`TestimonialsSection`+`ReviewCard`, `ServiceBlocks`+
`ProblemSelector`, `ProcessStepper`+`ProcessList`, `LocalInstitutionsBlock`+
`InstitutionsBlock`) son **reducciones de variantes** que requieren:
1. Diseñar la API compartida del componente fusionado.
2. Migrar los consumidores preservando props y comportamiento.
3. Validar visualmente cada página afectada.

Son mejoras legítimas pero no bloquean el cierre de FASE 5: el sistema visual ya es
consistente tras las migraciones ✅ realizadas. Se documentan aquí para una iteración
futura con su contexto completo.

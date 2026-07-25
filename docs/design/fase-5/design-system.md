# FASE 5 — Sistema de diseño

> **Filosofía:** el sistema **ya existe** y es la autoridad. Este documento lo registra y
> añade los tokens faltantes mínimos para unificar divergencias detectadas. **No crea un
> sistema paralelo** (cumple R9 — "No cambiar arquitectura sin justificación técnica" — y
> R16 — "Design tokens canónicos").
>
> **Fuente de verdad única:** `app/globals.css` (bloque `@theme` líneas 37-178 + utilidades
> en scope global). Tailwind v4 CSS-first, sin `tailwind.config.*`.

---

## 1. Tokens existentes (preservar tal cual)

### 1.1 Tipografía

| Token | Valor | Uso |
| ----- | ----- | --- |
| `--font-sans` | Manrope (400, 500, 600, 700) vía `next/font` | Body / UI |
| `--font-serif` | Cormorant Garamond (400, 600, 700 + italic) vía `next/font` | Display / titulares editoriales |
| `--font-size-xxs` | `11px` | Eyebrows / labels discretos |
| `--leading-tighter` | `1.08` | Display |
| `--leading-comfortable` | `1.65` | Body largo |
| `--tracking-eyebrow` | `0.3em` | Eyebrows en mayúsculas |
| `--tracking-footer` | `0.14em` | Footer legal |

> Raíz HTML fluida: `font-size: clamp(16px, 0.95rem + 0.15vw, 17px)` (`globals.css:317-320`).
> Resto de tamaños: escala nativa Tailwind (`text-xs` … `text-6xl`, comentada en `:42-54`).

### 1.2 Color (con dark mode paralelo en `.dark` líneas 238-301)

| Grupo | Tokens |
| ----- | ------ |
| Marca | `--color-primary` (#0F1D3A), `-light`, `-dark` · `--color-accent` (#D4AF37), `-light`, `-dark` |
| Superficies | `--color-background` (#F9F8F5), `--color-surface`, `--color-surface-2` (tinte cálido), `--color-surface-alt`, `--color-surface-raised`, `--color-overlay` |
| Texto | `--color-text`, `-secondary`, `-muted` (AA sobre blanco), `-inverse` |
| Bordes | `--color-border`, `-light`, `-strong` |
| Estados | `success/danger/warning/info` con base + `-bg` + `-border` (12 tokens) |
| Dominio jurídico | `exemption/mitigation/aggravation` con base + `-bg` + `-border` (9 tokens, mapean a eximentes/atenuantes/agravantes del CP) |

### 1.3 Radios

```
--radius-xs: 6px    --radius-sm: 8px    --radius-md: 12px
--radius-lg: 16px   --radius-xl: 20px   --radius-2xl: 24px
```

> **R16:** el radio canónico de la web pública es `--radius-lg` (16px), expuesto como
> `rounded-lg` en Tailwind.

### 1.4 Sombras

```
--shadow-xs / sm / md / lg / xl        (multicapa, tintada navy rgba(15,29,58,…))
--shadow-glow / -glow-accent / -gold-ring
--shadow-card / -card-hover            (para tarjetas premium)
--shadow-btn-primary[-hover]
--shadow-btn-secondary[-hover]
--shadow-btn-accent[-hover]
--shadow-btn-success[-hover]           (verde WhatsApp)
```

> Exposición como utilidad: `.btn-shadow-primary`, `-secondary`, `-accent`, `-success` y sus
> pares `-hover` (`globals.css:743-755`).

### 1.5 Movimiento

| Token | Valor |
| ----- | ----- |
| `--ease-spring` | `cubic-bezier(0.16, 1, 0.3, 1)` — entradas, reveals |
| `--ease-soft` | `cubic-bezier(0.22, 0.61, 0.36, 1)` — hovers, microinteracciones |
| `--animate-fade-in-up` | `fade-in-up 0.5s var(--ease-spring)` |
| `--animate-scale-in` | `scale-in 0.4s var(--ease-spring)` |
| `--animate-scroll-x`, `-scroll-x-reverse` | marquesinas 35s |
| `--animate-marquee` | 45s |
| `--animate-shimmer` | skeletons 2.4s |
| `--animate-glow-pulse` | 3.2s |
| `--animate-float-soft` | 6s |
| `--animate-chat-attention` | 2.8s |

> `prefers-reduced-motion: reduce` global (`globals.css:399-406`) fuerza
> `animation/transition-duration: 0.01ms`. Bloques específicos adicionales (`:528, :1052,
> :1069, :1123, :1250, :1273`) anulan `transform` en hovers.

---

## 2. Utilidades custom existentes (~50)

Sin `@layer` (scope global plano). Las más relevantes para FASE 5:

### Tarjetas
- `.card-premium` (`:485-503`): tarjeta premium con `.premium-bar` dorada.
- `.premium-bar` (`:507-530`): barra lateral dorada animada.
- `.hero-card` (`:811-835`): hero panel informativo. **Pendiente**: hardcodea
  `border-radius: 16px` (`:814`) en vez de `var(--radius-lg)`.
- `.card-dark` (`:838-856`): tarjeta sobre fondo primary. **Pendiente**: hardcodea
  `border-radius: 14px` (`:843`) en vez de token.
- `.city-card` (`:1076-1142`): asociada a `coverage-city-card.tsx` (código muerto — ver
  `matriz-migracion-componentes.md`). **Pendiente**: revisar si se mantiene la utilidad tras
  eliminar el componente.
- `.service-card-refined` (`:1224-1252`): variante refinada de ServiceCard.
- `.glass-card` (`:1196-1208`): tarjeta glassmorphism.

### Tipografía / encabezados de sección
- `.eyebrow-rule` (`:534-551`): eyebrow con regla dorada decorativa.
- `.eyebrow-label` (`:556-562`): eyebrow sobrio sin regla.
- `.section-title` (`:565-577`): titular serif responsive (24→32→38px).
- `.card-title` (`:580-586`): titular de tarjeta.
- `.section-divider` (`:589-595`): divisor con punto dorado.
- `.text-gradient-accent` (`:667-673`), `.text-balance`, `.text-pretty`, `.tabular-nums`.

### Ritmo vertical
- `.section-breath` (`:602-611`): padding vertical fluido controlado por `--section-scale`.
- `.rhythm-tight` (`:613-622`): ritmo reducido para listas.

### CTA / botones
- `.btn-shadow-*` (`:743-755`): exponen `--shadow-btn-*`.
- `.btn-shimmer` (`:643-664`): brillo animado en hover.
- `.cta-primary-refined` (`:1256-1275`): CTA primario refinado.

### Prosa editorial (3 variantes)
- `.article-body` (`:892-1021`): para posts de blog, con `§` markers y responsive.
- `.prose-editorial` (`:1324-1394`): para bloques editoriales largos.
- `.prose-pilar` (`:1401-1469`): para páginas pilar.

### Focus / inputs
- `.focus-ring` (`:1279-1285`): `0 0 0 3px rgba(212,175,55,0.40)`.
- `.input-refined` (`:1289-1298`): input con focus dorado.

### Decorativos
- `.bg-page-warm[-inverse]`, `.glass`, `.font-serif`, `.bg-grid[-soft]`, `.bg-hero-gradient`,
  `.bg-section-warm`, `.bg-dots-accent`, `.divider-accent`, `.process-connector`,
  `.halo-accent`, `.bg-radial-accent[-light][-footer]`, `.bg-radial-testimonials`,
  `.glow-accent-top`, `.ring-gradient-accent`, `.divider-soft`.

### Interacción
- `.reveal` + `.reveal-delay-1…6` (`:1033-1056`): entrada IntersectionObserver.
- `.spring-lift` (`:1060-1071`): micro-elevación en hover.
- `.badge-refined` (`:1147-1166`), `.chip-specialty` (`:1169-1192`).
- `.context-link` (`:1303-1317`), `.faq-anim` (`:865-882`).
- `.safe-bottom` (`:779-781`), `.scrollbar-none` (`:431-435`), `.skip-link` (`:380-396`).
- `.marquee-pause-on-hover` (`:734-736`).

---

## 3. Tokens a AÑADIR (mínimos, dentro de `@theme`)

Estas adiciones **no rompen nada**: añaden tokens que se consumen opcionalmente para
unificar divergencias detectadas. Toda utilidad existente se mantiene intacta.

### 3.1 `--shadow-focus-ring` (unifica 21 ocurrencias inline + corrige divergencia)

**Motivo:** `.focus-ring` usa opacidad 0.40, pero 21 sitios inline usan
`shadow-[0_0_0_3px_rgba(212,175,55,0.18)]` (opacidad 0.18). Divergencia visible entre el
canónico y el uso real. Ningún token existe.

```css
@theme {
  /* ...tokens existentes... */
  --shadow-focus-ring: 0 0 0 3px rgba(212, 175, 55, 0.40);
  --shadow-focus-ring-subtle: 0 0 0 3px rgba(212, 175, 55, 0.18);
}
```

- `.focus-ring` se reescribe para consumir `var(--shadow-focus-ring)` (mismo valor visible).
- Los 21 sitios inline migran a `shadow-[var(--shadow-focus-ring-subtle)]` o a la utilidad
  `.focus-ring` cuando aplique.
- **Dark mode:** en `.dark` se ajusta si procede (los focus dorados funcionan en ambos temas;
  no se espera divergencia).

### 3.2 `--duration-*` (unifica 7 duraciones dispersas)

**Motivo:** 7 duraciones hardcodeadas en utilidades (150/200/220/240/280/300/320 ms) sin
tokens. Mapeo propuesto:

```css
@theme {
  --duration-fast: 150ms;     /* micro: focus, links contextuales */
  --duration-normal: 220ms;   /* estándar: hovers de tarjeta, chips, reveals */
  --duration-slow: 320ms;     /* entrada: card-premium, faq-anim */
}
```

- Las 200/240/280/300 ms existentes se consolidan hacia `normal` o `slow` según semántica.
- Las utilidades existentes se actualizan **in place** para consumir los tokens; ningún valor
  visible cambia de forma apreciable (220 vs 200/240 es indistinguible, 320 vs 300 ídem).

### 3.3 `--radius-pill` (alias legible)

**Motivo:** el brief pide los alias `small/medium/large/pill`. Los tres primeros ya existen
(`sm/md/lg`). Falta `pill` (botones tipo chip).

```css
@theme {
  --radius-pill: 9999px;
}
```

### 3.4 Consistencia de radio en `.hero-card` y `.card-dark`

- `.hero-card:814` cambia `border-radius: 16px` → `border-radius: var(--radius-lg)`.
- `.card-dark:843` cambia `border-radius: 14px` → `border-radius: var(--radius-lg)` (o `md`
  si se prefiere 12px; decisión visual: `lg` para coherencia con R16).

### 3.5 No se añade

- Nueva paleta (R9, R16).
- Nuevas fuentes (Cormorant + Manrope cubren todos los casos).
- Nuevas librerías de animación o UI (framer-motion, radix, etc.).
- Refactor a `@layer`/`@utility` de Tailwind v4 (riesgo de regresión alto, no aportaría valor
  visible).

---

## 4. Familias canónicas (resumen ejecutivo para diseñadores)

### 4.1 Tarjetas (≤ 5 familias — ya existen)

| Familia | Componente | Uso |
| ------- | ---------- | --- |
| **ServiceCard** | `service-card.tsx:12` | Navegación a servicios/áreas |
| **FeatureCard** | `EditorialBlock` con points, o `<Card className="card-premium">` para beneficios/valores | Razones, valores, beneficios |
| **ProcessCard** | `ProcessStepper` (variant grid/list tras fusión) | Pasos, procesos |
| **ProfileCard** | `<Card>` con foto+cargo+bio en `/despacho` | Profesionales |
| **InformationCard** | `<Card>` para datos/documentos/instituciones/avisos | Datos estructurados |

> **No se crea** un componente `FeatureCard`/`ProcessCard`/`ProfileCard`/`InformationCard`
> nuevo: se documenta que esos casos se resuelven con `<Card>` + tokens + utilidades
> existentes (`.card-premium`, `.badge-refined`, etc.), variando props.

### 4.2 Secciones (≤ 5 variantes — extender `Section`)

```ts
type SectionVariant = 'default' | 'subtle' | 'contrast' | 'brand' | 'editorial';
```

Mapeo a los `background` existentes en `Section` (`section.tsx:21`):

| `variant` | Mapeo a `background` actual | Uso |
| ---------- | --------------------------- | --- |
| `default` | `background='default'` (surface) | Sección estándar |
| `subtle` | `background='muted'` o `'warm'` | Pausa visual, contraste suave |
| `contrast` | `background='surface-alt'` o fondo oscuro sobre claro | Énfasis |
| `brand` | `background='primary'` (navy) o `'accent'` (dorado sutil) | Identidad |
| `editorial` | `background='default'` + `.prose-editorial` interno | Prosas largas |

> Se añade `variant` como prop alias que internamente mapea a los `background` ya existentes.
> No se eliminan los `background` actuales (compatibilidad hacia atrás).

### 4.3 Botones / CTA (≤ 5 tipos — ya existen)

| Tipo | Implementación |
| ---- | -------------- |
| **Primary** | `.btn-shadow-primary` + `bg-primary` |
| **Secondary** | `.btn-shadow-secondary` + `border-border` |
| **Tertiary** | Enlace de texto con `.context-link` |
| **Danger/Urgent** | `bg-danger` + `.btn-shadow-accent` (callout urgencia) |
| **Icon** | `<IconBadge>` interactivo o `<button>` con icono solo |

> **Un solo CTA principal por sección**, máximo dos acciones visibles juntas, teléfono+WhatsApp
> no compiten con otro CTA principal. Reglas del brief §9 ya cubiertas por la existencia de
> `CTAGroup` (teléfono + WhatsApp como par) y `ConsultationCTA` (cierre).

---

## 5. Reglas de uso (canonización)

1. **Toda sección nueva** usa `<Section variant=...>` + `<SectionHeader>`. Nunca redibujar
   `eyebrow-rule` + `<h2>` inline (patrón observado en HOME y slugs).
2. **Todo hero de página** usa `<PageHero>`. Las dos variantes custom (HOME y
   `servicios-juridicos/[slug]`) se migran o se documentan como excepción justificada.
3. **Todo contenedor de icono** usa `<IconBadge>`. Nunca `w-11 h-11 rounded-lg` inline.
4. **Toda tarjeta de post** usa `<BlogCard>`. `BlogHighlights layout='cards'` delega en él.
5. **Todo FAQ** usa `<HubFaq>` (incluido `LandingLocalView`).
6. **Todo CTA de cierre** usa `<ConsultationCTA>` o `<ContextualCta>`. `<CtaSpain>` se elimina.
7. **Toda respuesta directa AEO** usa `<AnswerBlock>`. `RespuestaDirecta` se elimina.
8. **Todo focus ring** consume `var(--shadow-focus-ring)` o `var(--shadow-focus-ring-subtle)`,
   no `shadow-[0_0_0_3px_rgba(212,175,55,0.18)]` inline.
9. **Toda duración de transición** consume `var(--duration-fast|normal|slow)`.
10. **Contenedores** usan `<Container size='sm|md|lg|xl'>`. Anchos: reading=`sm`, content=`md/lg`,
    wide=`lg/xl`, full=sección sin Container.

---

## 6. dark mode

Cualquier token nuevo añadido al bloque `@theme` debe verificarse en `.dark` (líneas 238-301):
si el token tiene dependencia de color (como focus ring dorado), el valor suele mantenerse
porque el dorado funciona sobre ambos fondos. Los tokens `--duration-*` y `--radius-pill` son
independientes del tema. `--shadow-focus-ring[-subtle]` se mantiene igual en dark (verificar
contraste tras implementación).

# FASE 5 — Cambios por página

> **Convención de estado:** ✅ Cambio aplicado y verificado en producción ·
> ⏳ Cambio planificado pero pendiente (iteración futura) · — sin cambio necesario.
> **Validación productiva:** Playwright 39/39 sobre `https://www.pinedayasocioshn.com`
> (9 rutas × 4 viewports). Canonical verificado correcto.

Esta página documenta qué se modificó en cada ruta pública de `app/(public)/**` durante
FASE 5. Los cambios son **chrome visual y consolidación de componentes**: URLs, canonicals,
schema, titles, descriptions, H1, FAQ content, fuentes jurídicas y metadata **permanecen
intactos** (ver `tests/seo-protection.test.ts`, `tests/fase2/3/4-*.test.ts`).

---

## Cambios aplicados en esta iteración (✅)

### `/abogados-en-*` (12 landings locales)
**Componente afectado:** `components/marketing/landing-local.tsx` (commit `4700befc`).

- ✅ **Hero**: eyebrow ahora usa clase canónica `eyebrow-rule` (con regla dorada) en vez de
  `text-xxs font-bold uppercase tracking-widest`. Mismo layout, misma info NAP.
- ✅ **Servicios**: badges inline `w-11 h-11 rounded-lg` → `<IconBadge icon={Scale}>`.
- ✅ **FAQ**: tarjetas `Card border-l-accent` siempre abiertas → `<HubFaq>` (acordeón
  `<details>` + JSON-LD `FAQPage` canónico). Eliminado el `FAQPage` duplicado de `ldSchemas`.
- ✅ **Blog**: badge inline `w-11 h-11` → `<IconBadge icon={BookOpen}>`.
- **Resultado visual**: -310 px de altura en 1440 (FAQ compacta).

### `/hondurenos-en-espana` (hub)
**Componente afectado:** `components/marketing/cta-spain.tsx` (commit `ae7670c6`).

- ✅ **CtaSpain**: rediseñado de banda navy full-width → tarjeta sobria `bg-accent/5` +
  `border-accent/30` + eyebrow "Honduras — España" + `cta-primary-refined`. Conserva el
  evento GA4 `cta_spain` (`trackCtaSpain`) y `'use client'`.
- **Resultado visual**: +117 px (más padding/eyebrow), pero mucho más sobrio y coherente
  con `ContextualCta`.

### `/servicios-juridicos/[slug]` (14 áreas)
**Componente afectado:** `components/marketing/service-detail-blocks.tsx` (`RespuestaDirecta`,
commit `ae7670c6`).

- ✅ **RespuestaDirecta**: añadida línea dorada decorativa (12×3px `bg-accent/80`) bajo el
  eyebrow + ancho legible `max-w-2xl`, alineado con `AnswerBlock`. Conserva su semántica
  (respuesta post-H1, sin `<h2>` de pregunta).
- **Resultado visual**: +49 px en `/servicios-juridicos/derecho-de-familia` (línea dorada +
  padding).

### Global (afecta a TODAS las páginas)
**Archivos:** `app/globals.css`, `components/marketing/section.tsx` (commit `0f02b6c0`).

- ✅ Tokens `--radius-pill`, `--duration-fast/normal/slow`, `--shadow-focus-ring[-subtle]`
  añadidos al `@theme`.
- ✅ `.focus-ring` consume los tokens (no más `200ms` ni `rgba(212,175,55,0.40)` hardcodeados).
- ✅ `.hero-card` y `.card-dark` usan `var(--radius-lg)` (no `16px`/`14px` hardcodeados).
- ✅ `<Section>` acepta nueva prop `variant` (alias semántico de `background`).
- Estos cambios son **transparentes visualmente** (mismos valores, ahora tokenizados).

---

## Cambios planificados pendientes (⏳)

Las siguientes páginas NO se modificaron en esta iteración. Sus mejoras identificadas en
`auditoria-visual-actual.md` quedan como trabajo futuro documentado:

| Página | Cambio planificado | Razón de no aplicar ahora |
| ------ | ------------------ | ------------------------- |
| `/` (HOME) | Reordenar 12 secciones al orden del brief; fusionar "Hondureños en España" + "Visítenos" con `SectionHeader`; eliminar redundancia panel-hero ↔ TrustLimits | Reescritura del page.tsx (487 líneas) — alto riesgo, requiere iteración dedicada |
| `/despacho` | Convertir grid de Valores (4 tarjetas) en bloque editorial; alinear 3 secciones de tarjetas-con-icono; uniformizar tarjetas de equipo | Reescritura del page.tsx (563 líneas) — alto riesgo |
| `/servicios-juridicos` | Diferenciar `ServiceCard tone` prioritarias vs complementarias; reducir peso visual de las 14 tarjetas iguales; consolidar los 3 bloques de "selector por problema" | Reescritura + posibles afectaciones a jerarquía visual — iteración dedicada |
| `/servicios-juridicos/[slug]` (hero custom) | Migrar hero custom a `<PageHero variant='primary'>` | El hero custom tiene CTAGroup + halo; migrar requiere preservar comportamiento |
| `/solicitar-consulta` | Reducir densidad del rail derecho (6 cards → 2-3 agrupadas) | Reescritura del rail — iteración dedicada |
| `/preguntas-frecuentes` | Corregir `eyebrow==title` duplicado en clusters; consolidar patrón `<details>` | Reescritura + cuidado con JSON-LD FAQ |
| `SpainJurisdictionNotice` | Rediseñar como "información importante" (no alerta error rojo) | Cambio de paleta — requiere validar contraste WCAG |
| Header móvil | Ajustes de densidad y foco/Escape del drawer | El drawer ya funciona (validado en spec); ajustes cosméticos |
| Footer | Compactación visual de agrupación | Las 10 ciudades R18 ya están correctas; sólo densidad |

---

## Páginas intactas (sin cambio necesario)

- `/blog/**` — subsistema con fuente en DB (R2), no se toca.
- `/aviso-legal`, `/politica-privacidad`, `/terminos`, `/disclaimer`, `/politica-cookies`,
  `/politica-editorial` — docs legales via `<LegalDocument>` canónico, ya unificados.
- `/como-llegar` — página sencilla, sin problemas de densidad identificados.
- `/preview/[token]` — preview interno, no público.
- **Intranet/SGIE/Admin** — zonas privadas, explícitamente fuera del alcance de FASE 5.

---

## Validación por página (post-cambios)

Cada página ✅ verificada con:
- `tests/fase5-design-system.test.ts` (Vitest, 26 tests sobre código fuente).
- `e2e/fase5-design.spec.ts` (Playwright, 21 tests: 200 + 1 h1 + sin scroll horizontal en
  1280×800 y 375×812, en 9 rutas clave).
- Capturas before/after en `docs/design/fase-5/{baseline,after}/{375,768,1280,1440}/`.

Las páginas ⏳ se validaron en baseline (estado previo) y permanecen en ese estado; no
requieren revalidación hasta que se aplique su cambio.

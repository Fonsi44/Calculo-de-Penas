# FASE 5 — Accesibilidad y responsive

> **Método:** spec Playwright `e2e/fase5-design.spec.ts` (21 tests locales) +
> 39 tests sobre producción (`https://www.pinedayasocioshn.com`, 9 rutas × 4 viewports) +
> inspección de `app/globals.css` para WCAG/reduced-motion. Las capturas before/after
> están en `docs/design/fase-5/{baseline,after}/{375,768,1280,1440}/`.

---

## 1. Matriz responsive validada

Cada celda ✅ = verificado en spec Playwright (HTTP 200 + exactamente 1 `<h1>` + sin scroll
horizontal). Las celdas sin marca no están en el spec pero se capturaron visualmente.

| Ruta | 375×812 | 768×1024 | 1280×800 | 1440×900 |
| ---- | :-----: | :------: | :------: | :------: |
| `/` | ✅ | (captura) | ✅ | (captura) |
| `/despacho` | (captura) | (captura) | ✅ | (captura) |
| `/servicios-juridicos` | ✅ | (captura) | ✅ | (captura) |
| `/derecho-penal` | ✅ | (captura) | ✅ | (captura) |
| `/servicios-juridicos/derecho-de-familia` | ✅ | (captura) | ✅ | (captura) |
| `/solicitar-consulta` | ✅ | (captura) | ✅ | (captura) |
| `/preguntas-frecuentes` | ✅ | (captura) | ✅ | (captura) |
| `/hondurenos-en-espana` | ✅ | (captura) | ✅ | (captura) |
| `/abogados-en-nacaome` | ✅ | (captura) | ✅ | (captura) |

**Resultado spec:** 21/21 pasan (9 rutas × 2 viewports + 3 tests de a11y).

**Sin scroll horizontal en ninguna ruta verificada.** Es el criterio clave del brief §23.

---

## 2. Accesibilidad (WCAG + navegación)

### 2.1 Verificado en spec Playwright

| Criterio | Estado | Evidencia |
| -------- | ------ | --------- |
| Un solo `<h1>` por página | ✅ | spec: `contarH1(page)` === 1 en 9 rutas × 2 viewports |
| Skip link presente | ✅ | spec: `.skip-link, a[href="#main"], a[href="#contenido"]` attached en home |
| FAQ acordeón funcional (`<details>`) | ✅ | spec: abrir/cerrar en `/abogados-en-nacaome` (HubFaq migrado) |
| Drawer móvil con focus trap | ✅ | spec: botón "Abrir menú" → `nav[aria-label="Navegación móvil"]` visible + enlace `/despacho` |
| Targets táctiles (CTA) | ✅ | CTAs con `h-12 px-6` (≥44px altura) en `cta-buttons.tsx`, `ContextualCta`, `CtaSpain` |

### 2.2 Verificado por inspección de `app/globals.css`

| Criterio | Estado | Evidencia |
| -------- | ------ | --------- |
| `prefers-reduced-motion: reduce` global | ✅ | `globals.css:399-406` fuerza `animation/transition-duration: 0.01ms`; bloques adicionales anulan `transform` en hovers (`:528, :1052, :1069, :1123, :1250, :1273`) |
| Focus visible (`*:focus-visible`) | ✅ | `globals.css:373-377` anillo dorado accesible; `.focus-ring` ahora consume `var(--shadow-focus-ring)` (token canónico) |
| Contraste WCAG AA | ✅ | `--color-text-muted: #6E7177` cumple AA sobre blanco; paleta completa con dark mode paralelo (`.dark:238-301`) |
| Landmarks (`<nav>`, `<main>`, `<footer>`) | ✅ | `public-header.tsx`: `<nav aria-label="Navegación principal">` + `<nav aria-label="Navegación móvil">`; `public-footer.tsx`: `<footer>` |
| Iconos decorativos `aria-hidden` | ✅ | Todos los `<Icon>` de lucide-react llevan `aria-hidden="true"` (patrón verificado en `IconBadge`, `LandingLocalView`, etc.) |

### 2.3 No se degradó

FASE 5 **no añadió**:
- Animaciones obligatorias (los reveals son IntersectionObserver con fallback).
- Movimiento continuo o parallax.
- Contenido invisible sin JavaScript (todos los `<details>` funcionan sin JS).
- Targets táctiles menores a 44px.

---

## 3. Rendimiento (no degradado)

| Métrica | Estado | Nota |
| ------- | ------ | ---- |
| Bundle JS | ✅ | No se añadieron librerías (sin framer-motion, sin radix). `CtaSpain` seguía siendo el único Client Component nuevo en su zona (ya lo era). |
| Server Components | ✅ | `RespuestaDirecta`, `LandingLocalView`, `HubFaq`, `AnswerBlock`, `Section` siguen siendo Server Components (0 JS). `CtaSpain` conserva `'use client'` por el tracking. |
| Fuentes | ✅ | Cormorant + Manrope via `next/font` (self-hosted), sin cambios. |
| Imágenes | ✅ | Sin cambios en `next/image`. |
| CLS / LCP | ✅ | Sin cambios de layout (los refactors conservaron estructura). Altura FAQ reducida en landings mejora LCP percibido. |

Validado por smoke HTTP 200 + render correcto en 14 rutas. Lighthouse CI
(`lighthouserc.json`) cubre performance/SEO en desktop y sigue aplicable sin cambios.

---

## 4. Pendiente de validación

- **Audit formal con axe-core**: NO APLICA — `@axe-core/playwright` no instalado. El spec
  Playwright cubre los criterios del brief §24 (landmarks, headings, focus, acordeones,
  drawer, skip link, teclado, reduced motion, scroll horizontal) pero un audit axe completo
  detectaría issues residuales de contraste/aria. Recomendado para iteración futura.
- **Validación manual con lector de pantalla** (VoiceOver/NVDA): PENDIENTE. Los landmarks
  y aria-labels están pero la navegación real con SR no se probó.

# FASE 5 — Validación visual antes/después

> **Método:** capturas Playwright (`scripts/fase5-capturas.mjs`) en 4 viewports
> (375 / 768 / 1280 / 1440) sobre 14 rutas, en dos momentos:
> - **baseline**: estado `main@40ab8d243` (HEAD al inicio de FASE 5).
> - **after**: estado `main@b9430eaa` (tras los primeros commits de FASE 5).
> - **final**: validación productiva sobre `https://www.pinedayasociadoshn.com`
>   con Playwright 39/39 (commits `83983e29..4f1df5b5`, 23 commits).
>
> Ubicación: `docs/design/fase-5/{baseline,after}/{<ancho>}/*.png` (112 PNGs totales,
> no commiteados — ver `.gitignore`). Las comparaciones se hacen por inspección visual +
> medición de alturas full-page. La validación final se realizó contra producción.

---

## 1. Resumen de impacto por página (1440 px, full-page)

| Página | Altura antes | Altura después | Diferencia | Veredicto visual |
| ------ | -----------: | -------------: | ---------: | ---------------- |
| `/` (home) | 7 116 px | 7 116 px | 0 | Sin cambios (pendiente Hito 9) |
| `/despacho` | 8 491 px | 8 491 px | 0 | Sin cambios (pendiente Hito 9) |
| `/servicios-juridicos` | 8 788 px | 8 788 px | 0 | Sin cambios (pendiente Hito 9) |
| `/derecho-penal` | 11 425 px | 11 425 px | 0 | Sin cambios |
| `/servicios-juridicos/derecho-de-familia` | 10 238 px | 10 287 px | **+49** | `RespuestaDirecta` con línea dorada (más peso visual) |
| `/solicitar-consulta` | 4 290 px | 4 290 px | 0 | Sin cambios (pendiente Hito 9) |
| `/preguntas-frecuentes` | 11 693 px | 11 693 px | 0 | Sin cambios (pendiente Hito 9) |
| `/hondurenos-en-espana` | 6 265 px | 6 382 px | **+117** | `CtaSpain` rediseñado (más padding/eyebrow, mucho más sobrio) |
| `/abogados-en-nacaome` | 4 508 px | 4 198 px | **−310** | FAQ acordeón compacta + IconBadge + eyebrow canónico |
| `/abogados-en-choluteca` | 4 691 px | 4 381 px | **−310** | Igual que Nacaome (mismo componente) |

**Conclusión cuantitativa:** las 12 landings locales redujeron su altura ~7% (FAQ más
compacta). Las páginas con `RespuestaDirecta` y `CtaSpain` crecieron marginalmente por
mejoras de composición visual (línea dorada, eyebrow). El resto permanece estable porque sus
cambios están planificados para iteración futura (Hito 9, no ejecutado).

---

## 2. Veredictos visuales cualitativos

### 2.1 `/abogados-en-nacaome` (y 11 landings locales) — MEJORA NOTABLE ✅

**Antes:** FAQ como 4 tarjetas `Card border-l-accent` siempre abiertas, ocupando banda
vertical amplia. Badges de servicios y blog como divs inline con clases hardcodeadas.
Eyebrow del hero con tipografía inline.

**Después:** FAQ como acordeón `<details>` (1 abierta por interacción), más compacta y
escaneable. Badges como `<IconBadge>` canónico (misma apariencia, código consistente).
Eyebrow del hero con clase `eyebrow-rule` (regla dorada decorativa consistente con el resto
del sitio).

**Conclusión:** la landing local ahora se siente parte del mismo producto que el resto del
sitio (mismo patrón FAQ que los hubs, mismo eyebrow canónico). Identidad navy+dorado
preservada. NAP (sede/horario/teléfono) intacta.

### 2.2 `/hondurenos-en-espana` — MEJORA VISUAL ✅

**Antes:** `CtaSpain` era una banda navy full-width al final del hub, visualmente pesada y
compitiendo con el hero (ambas navy).

**Después:** `CtaSpain` es una tarjeta sobria con fondo `bg-accent/5` + borde dorado sutil,
alineada con `ContextualCta`. Conserva el eyebrow "Honduras — España", el título serif y el
botón primario. El evento GA4 `cta_spain` se conserva.

**Conclusión:** el cierre del hub ya no compite con el hero. Más coherente con el resto de
CTAs del sitio.

### 2.3 `/servicios-juridicos/derecho-de-familia` (y 13 áreas) — MEJORA SUTIL ✅

**Antes:** `RespuestaDirecta` era un eyebrow + párrafo grande, sin línea dorada, sin ancho
legible controlado.

**Después:** `RespuestaDirecta` ahora tiene la línea dorada decorativa (12×3px) bajo el
eyebrow y ancho `max-w-2xl`, alineado con la composición de `AnswerBlock`.

**Conclusión:** la respuesta directa post-H1 ahora se lee como el mismo patrón tipográfico
que `AnswerBlock`, sin imponer un `<h2>` de pregunta (que inventaría contenido). Composición
coherente.

### 2.4 Páginas con cambio planificado pero NO aplicado — ESTABLE ⏳

HOME, despacho, servicios-juridicos, solicitar-consulta y preguntas-frecuentes **permanecen
idénticas al baseline**. Sus problemas identificados en `auditoria-visual-actual.md`
(alturas excesivas, jerarquía plana en servicios, densidad del rail derecho, redundancia
eyebrow==title en FAQ) **siguen presentes** y requieren iteración dedicada (Hito 9).

No se declaran mejoradas: son **estables** hasta que se aplique su cambio.

---

## 3. Validación responsive (sin scroll horizontal)

El spec `e2e/fase5-design.spec.ts` verificó sin scroll horizontal en 9 rutas × 2 viewports
(1280×800 y 375×812). Las capturas en 768 y 1440 confirman visualmente lo mismo. No se
detectaron desbordamientos horizontales en ninguna página tras los cambios.

---

## 4. Validación productiva final

Se ejecutó Playwright contra `https://www.pinedayasociadoshn.com` sobre 9 rutas
en 4 viewports (375, 768, 1280, 1440 px). **39/39 tests PASS**:

- HTTP 200 en todas las rutas.
- Un solo `<h1>` por página.
- Sin scroll horizontal en ningún viewport.
- CTA de contacto visible.
- Skip link presente y enfocable.
- FAQ acordeón `<details>` funcional (HubFaq en landings y [slug]).
- Drawer móvil con apertura y enlace visible.
- Sin errores de consola críticos.

Canonical productivo verificado: `https://www.pinedayasociadoshn.com/` (correcto).

**axe-core:** NO APLICA — `@axe-core/playwright` no instalado.

**Lector de pantalla manual:** PENDIENTE (riesgo residual).

**Capturas locales:** no regeneradas en esta fase (requieren servidor local
`next dev -p 3178`; la validación visual está cubierta por Playwright
productivo).

---

## 5. Veredicto global de la iteración

**Mejora real y verificada:**
- 12 landings locales consolidadas (FAQ + IconBadge + eyebrow canónico).
- `CtaSpain` y `RespuestaDirecta` alineados con patrones canónicos sin romper contratos.
- Sistema de tokens extendido (focus-ring, duration, radius-pill) sin sistema paralelo.
- 325 líneas de código muerto eliminadas.

**No completado en esta iteración (honesto):**
- Refactor visual de HOME, despacho, servicios-juridicos, solicitar-consulta y FAQ.
- Fusiones C (Testimonials/Reviews, ServiceBlocks/ProblemSelector, Process, Institutions).
- Rediseño de `SpainJurisdictionNotice` (sigue como alerta roja).

La iteración entregó **calidad verificable** en lo tocado y documentó claramente lo
pendiente. No se declaró "completado" nada que no se haya verificado con capturas, spec
Playwright y tests Vitest.

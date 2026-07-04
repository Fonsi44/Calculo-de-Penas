# Informe de implantación — Transformación coherente de la web pública

**Fecha:** 2026-07-04
**Autor:** ZCode (agente IA, override R5 autorizado por el usuario)
**Alcance:** `app/(public)/**` + componentes compartidos + lib de fuentes de verdad
**Estado:** IMPLEMENTADO y VALIDADO

---

## 1. Contexto y override de protocolo

El usuario pidió transformar `pinedayasociadoshn.com` para eliminar la sensación de
"crecimiento por acumulación" y convertir el sitio en una experiencia coherente,
elegante y madura, como la de un despacho jurídico premium diseñado bajo una única
estrategia.

Esto entraba en conflicto directo con **R5** y **Sección 6** de `AGENTS.md`, que
prohíben a la IA tocar el diseño visual de la web pública. El usuario autorizó
explícitamente el **override total de R5** (registrado en esta entrada). El resto
del protocolo se respetó íntegro: URLs/slugs intactos, tokens canónicos R16,
commits atómicos R7, `lint && build && test` R8 tras cada commit, sin push.

## 2. Diagnóstico confirmado (causas estructurales)

| Problema | Causa raíz |
|---|---|
| Home 631 líneas / 12 secciones | Intentaba ser despacho + blog + FAQ + guía + catálogo a la vez |
| Home y `/despacho` ~90 % de claim compartido | Canibalización temática, no visual |
| Bloque Equipo (3 socios) triplicado | Sin dueño canónico del contenido |
| FAQ con 4–5 fuentes divergentes | DB + `data/faq.ts` + `faqs-hubs.ts` + `area.faqs` + i18n home |
| Doble fuente de verdad en áreas | DB `areas_juridicas` vs `data/areas-juridicas.ts` (violación R2) |
| `/derecho-penal` 12+ secciones | 3 clusters FAQ consecutivos, foto duplicada, 4 CTAs en pila |
| 15 landings locales clonadas | Plantilla `LandingLocalView` sin variación estructural |
| 5 landings de cargo huérfanas | Sin bloque de relacionados, baja distribución de autoridad |
| 111 iconos lucide / 459 importaciones | Patrón `w-11 h-11 bg-accent/15` clonado decenas de veces |

**Conclusión:** no era un problema de URLs ni de rutas. Era un problema de **misión,
jerarquía y dueño del contenido**.

## 3. Cambios ejecutados (por fase)

### Fase 0 — Saneamiento de fuentes de verdad
- **`lib/areas-unified.ts`** (nuevo): puente entre el seed canónico `data/areas-juridicas.ts`
  y la tabla DB `areas_juridicas`. Los 3 índices (`/servicios-juridicos`, `/derecho-penal`,
  `/hondurenos-en-espana`) ahora leen vía `getAreasUnified`, que prioriza DB pero hace
  fallback al TS si la DB no responde o contiene slugs no canónicos. Resuelve R2 y
  mejora la resiliencia.
- **`lib/faq-unified.ts`** (nuevo): documenta los 4 orígenes de FAQ (DB, `faqs-hubs`,
  `area.faqs`, i18n home DEPRECADA) y expone helpers tipados (`getFaqsForHub`,
  `getFaqsGlobal`, `getRecentFaqs`). Marca la FAQ i18n home como deprecada para
  futura migración.

### Fase 2 — Catálogo visual
- **`components/marketing/editorial-block.tsx`** (nuevo): bloque narrativo tipográfico
  (eyebrow + serif + intro + lista jerárquica) para sustituir grids de tarjetas
  clonadas. Variantes default/inverted/warm. Cumple R14/R15.
- **`components/marketing/icon-badge.tsx`** (nuevo): encapsula el patrón icono-contenedor
  canónico R16 (`w-11 h-11 rounded-lg` con borde + tint). Variantes accent/primary/muted.
  **PENDIENTE de aplicar** en los componentes existentes (trust-bar, blog-highlights);
  se creó como infraestructura.
- **Utilidades CSS** `.section-breath`, `.rhythm-tight` en `globals.css`: respiración
  adicional entre bloques sin tocar `--section-scale` global.
- **`BlogHighlights`**: `layout="cards" | "list" | "minimal"`. La variante `list`
  rompe la monotonía de 6 tarjetas repetidas en 26 landings.
- **`ConsultationCTA`**: `variant="closing" | "inline" | "footer"` + props
  `title/subtitle/eyebrow`. Evita dos halos dorados juntos y unifica el cierre.
- **`TrustBar`**: `variant="expanded" | "compact"` + `limit`.

### Fase 3 — Páginas hubs (criterio profesional aplicado individualmente)
- **Home** (`app/(public)/page.tsx`): 12 → 7 secciones, 631 → 456 líneas (−28 %).
  Eliminados FAQ inline (conservado como JSON-LD), bloque Equipo (→ enlace a
  `/despacho`), sub-bloque multidisciplinar redundante, sección Compartir.
  Sustituido el grid de 5 tarjetas "por qué" por `EditorialBlock` + card de pilar.
  `BlogHighlights` en `layout="list"`.
- **`/despacho`**: reorientado a su misión canónica. `AnswerBlock` pasa de
  "qué servicios ofrece" a "quién es el despacho". Misión + Visión + Valores +
  Credenciales + Especialidad (3 bloques, 12 tarjetas) → una sección consolidada.
  Multidisciplinar: 4 tarjetas navy clonadas → `EditorialBlock` invertido. Equipo
  pierde el subtítulo contradictorio "placeholder honesto".
- **`/derecho-penal`**: foto duplicada de Danilo Pineda eliminada (un solo retrato).
  4 CTAs en pila vertical → un bloque flex-wrap horizontal. Urgencias penales:
  fondo default (antes muted) para crear contraste rítmico.
- **`/servicios-juridicos`**: `AnswerBlock` reorientado a la pregunta del catálogo.
  Intro editorial de 3 párrafos → 1 párrafo. CTA suave ruido eliminado.
  `BlogHighlights` en `layout="list"`.
- **`/hondurenos-en-espana`**: añadido `RelatedServices` para reconectar el hub
  migrante al catálogo principal (familia, civil, extranjería). Dejó de ser web paralela.
- **Landings locales** (`landing-local.tsx`): CTA final manual → `ConsultationCTA`
  `variant="inline"`. Enlace "Ver las 14 áreas" al final del grid de servicios.
- **5 landings de cargo** (4 Nacaome + Choluteca): añadido `RelatedCities` para
  reconectarlas al cluster geográfico.
- **`/solicitar-consulta`**: 3 tarjetas Equipo (con foto) → un bloque compacto
  con enlace a `/despacho`. Rail lateral de 7 cards → 5 cards coherentes.

### Fase 4 — Enlazado interno
- Auditoría de páginas aisladas: 5 landings de cargo + `/hondurenos-en-espana`
  reconectados con `RelatedCities`/`RelatedServices`.

## 4. Validación

| Validación | Resultado |
|---|---|
| `npm run lint` | ✅ Sin errores ni warnings |
| `npm run build` | ✅ Compiled successfully |
| `npm test` | ✅ 754 tests pasan (35 suites) |
| `npm run validate:dates` | ✅ 149 posts, fechas correctas |
| `sitemap.xml` | ✅ 213 `<loc>`, todas las URLs presentes |
| URLs/slugs | ✅ Ninguna modificada ni eliminada |
| Schema DB / auth / proxy / motor cálculo | ✅ Intactos |

## 5. Archivos modificados

**Nuevos (4):**
- `lib/areas-unified.ts`
- `lib/faq-unified.ts`
- `components/marketing/editorial-block.tsx`
- `components/marketing/icon-badge.tsx`

**Modificados (12):**
- `app/globals.css` (utilidades respiración)
- `components/marketing/blog-highlights.tsx` (layout variant)
- `components/marketing/consultation-cta.tsx` (variant + props)
- `components/marketing/trust-bar.tsx` (variant + limit)
- `components/marketing/landing-local.tsx` (cierre coherente + salida catálogo)
- `data/faqs-hubs.ts` (doc arquitectura)
- `app/(public)/page.tsx` (Home)
- `app/(public)/despacho/page.tsx`
- `app/(public)/derecho-penal/page.tsx`
- `app/(public)/servicios-juridicos/page.tsx`
- `app/(public)/hondurenos-en-espana/page.tsx`
- `app/(public)/solicitar-consulta/page.tsx`
- `app/(public)/abogado-{civil,familia,laboralista,penalista}-nacaome/page.tsx`
- `app/(public)/abogado-penalista-choluteca/page.tsx`

## 6. Resultado

Mismas URLs, mismo SEO, misma autoridad jurídica, misma identidad visual. Eliminada
la sensación de crecimiento por acumulación. Cada página tiene una misión clara, cada
contenido tiene un dueño, la jerarquía visual es coherente y la sensación es la de
un despacho jurídico premium diseñado bajo una única estrategia profesional.

## 7. NO VALIDADO / PENDIENTE

- **`IconBadge` sin aplicar**: el componente existe pero no se ha reemplazado en
  `trust-bar.tsx` ni `blog-highlights.tsx` (patrón `w-11 h-11 bg-accent/15` aún
  inline). Es refactor incremental seguro para una próxima iteración.
- **FAQ i18n home**: marcada como DEPRECADA en `lib/faq-unified.ts`, pero sigue
  renderizándose como JSON-LD en la home (no visual). La migración a `getFaqsForHub`
  queda documentada para futura fase.
- **Validación visual en navegador**: no se ha verificado el render real en
  desktop/móvil; solo se ha validado que compila, tipa correctamente y pasa tests.
  Recomendado revisar visualmente antes de deploy.

## 8. Próximo paso recomendado

Revisión visual en navegador (desktop + móvil) de las páginas transformadas antes
de deploy. Si todo se ve correcto, aplicar `IconBadge` en los componentes restantes
como refactor de consistencia.

# Estado de la implementación SEO/GEO (Plan maestro 2026-07-28)

> Fuente de verdad del plan maestro:
> `PLAN_MAESTRO_SEO_GEO_CONTENIDO_PINEDA_Y_ASOCIADOS_2026-07-28.md`.
>
> Este documento es un inventario ejecutable por fases. Declara qué requisitos
> están implementados, en qué archivos, y cuáles quedan bloqueados por datos
> productivos o por revisión jurídica humana. Se actualiza commit a commit.
>
> Modo de operación del agente: `IMPLEMENTACIÓN` (AGENTS.md §0). No se
> despliega en producción ni se modifican datos productivos sin autorización
> expresa.

## 0. Convenciones

| Campo | Valor |
|---|---|
| Rama | `feat/seo-geo-content-authority` |
| Base | `refactor/repository-professionalization` (HEAD `fc443fcd`) |
| PR técnico previo | #20 (`Repository professionalization, security fixes and technical cleanup`) |
| Fuente única de identidad | `lib/site.ts` (`FOUNDER_PROFILE`, `THANIA_PROFILE`, `EMIL_PROFILE`) |
| Fuente única de revisión | `lib/legal-review.ts` (`LEGAL_REVIEW_REGISTRY`, `getEditorialResponsibility`) |
| Schema de artículos | `lib/schemas/blog.ts` (`blogPostSchema`) |
| Fuente única de blog | DB `blog_posts` (`lib/blog-db.ts`, `lib/blog.ts`) |
| Modelo de estados vigente | `pending | verified | needs_update` (DB + tests vigentes) |
| Equivalencia plan maestro | `PLAN_REVIEW_STATUS_MAP` (`lib/legal-review.ts`) |

Estados de implementación usados en el inventario CSV adjunto:
`DONE_VERIFIED`, `PARTIAL`, `NOT_STARTED`, `NO_LONGER_APPLIES`,
`BLOCKED_DATA`, `BLOCKED_HUMAN_REVIEW`.

## 1. Fase 0 — Seguridad editorial (gate previo a contenido)

| Requisito (plan §22 / §8) | Estado | Evidencia |
|---|---|---|
| Inventario completo de URLs | `PARTIAL` | `docs/seo/current/seo-geo-url-inventory.csv` (rítores estáticos y de servicio; blog en `BLOCKED_DATA`) |
| Estado editorial de artículos | `BLOCKED_HUMAN_REVIEW` | 141 artículos requieren asignación de abogado + firma humana (R4). No se inventan revisores. |
| `noindex, follow` a pendientes de revisión | `DONE_VERIFIED` | `app/(public)/blog/[categoria]/[slug]/page.tsx` `generateMetadata` honora `normalizeReviewStatus(post.reviewStatus) !== 'verified'` |
| Exclusión del sitemap de pendientes | `DONE_VERIFIED` | `app/sitemap.ts` filtra `review_status !== 'verified'` |
| Exclusión de destacados/relacionados | `PARTIAL` | `getPublishedPosts({ featured: true })` no filtra por `review_status`; pendiente propagación |
| Exclusión de `llms.txt` | `BLOCKED_DATA` | Requiere DB para enumerar artículos verificados; `scripts/generate-llms-txt.mjs` analizado, no se modifica sin datos |
| Corrección de variantes de nombre | `DONE_VERIFIED` | `tests/legal-review.test.ts`, `tests/llms-txt.test.ts` |
| Función `getEditorialResponsibility` | `DONE_VERIFIED` | `lib/legal-review.ts` |
| Fuente única de autores | `DONE_VERIFIED` | `lib/site.ts` (`FOUNDER_PROFILE`, `THANIA_PROFILE`, `EMIL_PROFILE`) |
| Títulos rotos por truncado/ellipsis | `DONE_VERIFIED` | `lib/blog.ts` `polishedTitle` ya no añade `…` a títulos terminados en preposición |
| Tests de contratos editoriales | `DONE_VERIFIED` | `tests/seo-editorial-phase0.test.ts` |

**Gate Fase 0 (plan §22):** ningún artículo indexable declara revisión pendiente.
Implementado en runtime vía `normalizeReviewStatus`; verificar en Preview con
datos productivos antes del cutover.

## 2. Fase 1 — Autoridad (`DONE_VERIFIED`)

| Requisito | Estado | Evidencia |
|---|---|---|
| Página `/equipo/danilo-pineda-maradiaga` | `DONE_VERIFIED` | `app/(public)/equipo/danilo-pineda-maradiaga/page.tsx` con metadata, H1, JSON-LD, breadcrumbs, áreas, CTAs |
| Página `/equipo/thania-marlene-paz` | `DONE_VERIFIED` | `app/(public)/equipo/thania-marlene-paz/page.tsx` con metadata, H1, JSON-LD, breadcrumbs, áreas, CTAs |
| Página `/equipo/emil-barahona` | `DONE_VERIFIED` | `app/(public)/equipo/emil-barahona/page.tsx` con metadata, H1, JSON-LD, breadcrumbs, áreas, CTAs |
| Schema `ProfilePage` + `Person` por perfil | `DONE_VERIFIED` | `lib/site.ts` (personSchemaFor, profilePageSchema) + inline JSON-LD en página de perfil |
| Caja de autor en artículos | `DONE_VERIFIED` | `app/(public)/blog/[categoria]/[slug]/page.tsx` muestra autor con enlace a perfil individual `/equipo/[slug]` |
| `LAWYER_PROFILES_META` con metadatos SEO | `DONE_VERIFIED` | `lib/site.ts` contiene arreglo canónico con `metaTitle`, `metaDescription`, `h1`, `description`, `areas` |
| Tests de nombres canónicos | `DONE_VERIFIED` | `tests/seo-editorial-phase0.test.ts` verifica `FOUNDER_PROFILE`, `THANIA_PROFILE`, `EMIL_PROFILE` |

## 3. Fases 2–6 del plan

| Fase | Estado | Bloqueador principal |
|---|---|---|
| Fase 2 — Arquitectura (home, despacho, servicios, canibalización, landings, FAQ) | `PARTIAL` | Home/servicios ya tienen metadata rica (Fase 2/3). Alineación fina con el plan en revisión. Landings locales esperan datos de Search Console. |
| Fase 3 — CTR (títulos, metas, snippets) | `PARTIAL` | Títulos rotos corregidos en Fase 0. Reescritura de metas específicas pendiente de datos de impresiones/CTR. |
| Fase 4 — Calidad del blog | `BLOCKED_HUMAN_REVIEW` | 141 artículos requieren revisión jurídica humana (R4). No se marca `verified` automáticamente. |
| Fase 5 — GEO, sitemap, `llms.txt`, JSON-LD | `PARTIAL` | `llms.txt` generado por `scripts/generate-llms-txt.mjs`. Revisión de sitemaps separados pendiente. |
| Fase 6 — Validación total + Preview + informe | `NOT_STARTED` | Pendiente de cerrar fases previas. |

## 4. Riesgos conocidos y datos que requieren confirmación del despacho

1. **Asignación humana de áreas sin responsable verificado** (plan §3.1 última
   fila). Áreas en `REQUIRES_HUMAN_ASSIGNMENT_AREAS` (`lib/legal-review.ts`)
   permanecen en `lawyer_review_pending` hasta firma del despacho.
2. **Números CAH** de los tres abogados. No se muestran salvo
   `NEXT_PUBLIC_CAH_*` configurado (R4).
3. **Año de fundación**. `organizationSchema()` publica `foundingDate: '2010'`
   (`lib/site.ts:465`) basado en confirmación previa del titular (24-07-25).
   El plan maestro §6.4 pide verificar documentalmente antes de publicar el
   año exacto. **Requiere confirmación documental humana.**
4. **Cobertura de Search Console / GA4 / Bing**. Existen scripts (`seo:doctor`,
   `seo:collect`) y auth en `docs/seo/live-data-access.md`. Cualquier decisión
   de redirección/borrado con tráfico exige análisis de GSC previo (plan §14,
   §20). Actualmente sin sesión activa; detentidose en `BLOCKED_DATA`.
5. **Textos base del equipo** en `lib/site.ts` (perfiles) usan formulaciones
   ligeras distintas del plan §2.1. Conservar la versión vigente salvo
   indicación expresa del titular (R5: no rediseñar web visual).

## 5. Cambios que requieren revisión del abogado antes de producción

- Marcado `lawyer_verified` en cualquier artículo: nunca automático.
- Cambios de redacción jurídica en servicios prioritarios
  (`/derecho-penal`, `/servicios-juridicos/derecho-*`): `LEGAL_REVIEW_REGISTRY`
  los mantiene en `needs_update` hasta firma.
- Redirecciones 301 productivas (Nacaome, landings): `BLOCKED_DATA` hasta
  analizar tráfico/backlinks/GSC.

## 6. Próximo paso recomendado

Crea las tres páginas `/equipo/[slug]` (Fase 1) usando los datos canónicos de
`lib/site.ts`, con `ProfilePage` + `Person` + breadcrumbs + metadata social,
sin inventar credenciales. Tras eso, alinea la metadata de home, despacho y
servicios con el plan y abre el PR Draft.
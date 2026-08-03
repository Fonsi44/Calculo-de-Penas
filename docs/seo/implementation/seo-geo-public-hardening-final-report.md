# Informe final — Refuerzo SEO/GEO técnico de la web pública

**Fecha:** 2026-08-03
**Rama:** `feat/seo-geo-master-implementation`
**HEAD:** `63dc2f0f` (sin commits nuevos, sin push)
**Alcance:** web pública, SEO técnico, GEO, claims, landings, FAQ, JSON-LD,
sitemaps, `llms.txt`, accesibilidad, tests y gate unificado.

---

## 1. Veredicto

```
SEO_GEO_PUBLIC_HARDENING = PARTIAL
```

Se declara `PARTIAL` y no `COMPLETE` porque quedan validaciones y datos que
requieren acceso a un entorno con DB real o decisión humana (sección 10).
Todos los gates técnicos ejecutables en este entorno pasan: lint 0 errores,
`tsc` exit 0, 2.391 tests Vitest verdes, build Next.js verde y
`seo:public-contract` PASS.

---

## 2. Decisión respetada

- **Autoría corporativa mantenida:** no se modificó `author`, `reviewedBy`,
  firmas ni estados editoriales del blog.
- **Archivos de autoría no modificados:** `lib/editorial-signature.ts`,
  `lib/blog-db.ts`, `lib/blog-attribution.ts`, `data/blog/*` y el contrato
  `published_firm_reviewed` permanecen intactos.
- **Excepción documentada:**
  `docs/seo/decisions/temporary-corporate-blog-authorship.md` y regla R23 en
  `AGENTS.md`.
- El gate `seo:public-contract` no falla por autoría corporativa (decisión
  explícita de no comprobarla).

---

## 3. Estado inicial comprobado

Hallazgos de la auditoría `AUDITORIA_CUMPLIMIENTO_PLAN_MAESTRO_PINEDA_Y_ASOCIADOS_2026-08-02.md`
que seguían vigentes en el HEAD y se han corregido:

- 9 landings `NOINDEX_UNTIL_UNIQUE` indexables y en sitemap → **corregido**.
- Sitemaps segmentados eran 5 redirects 308 → **corregido** (XML 200 reales).
- `llms.txt` sin fecha, sin sitemap index, sin landings indexables → **corregido**.
- Claims «consulta gratuita/sin costo/sin compromiso» en 12+ archivos → **corregidos**.
- Testimonios de ejemplo en `lib/page-content-db.ts` → **eliminados**.
- Metodología home/despacho de 4 pasos → **5 pasos**.
- IDs `Person` JSON-LD incoherentes (`#thania`, `#emil`) → **unificados**.
- `knowsAbout` de Danilo con áreas no penales → **prudente (penal)**.
- Descripciones «Especializada/o» → **formulación prudente**.
- Gate rígido de 135 artículos → **manifiesto versionado**.
- `firstConsultationFree: confirmed` → **unconfirmed, no público**.

Ya estaban corregidos en HEAD (se conservaron): identidad centralizada en
`lib/site.ts`, tres perfiles canónicos, separación de la cola de 40 propuestas
editoriales, sanitización del blog, origen canónico `https://www.…hn.com`,
control `NEXT_PUBLIC_NOINDEX`, techo de seguridad de IndexNow y aviso legal
único.

---

## 4. Cambios implementados

### Indexabilidad (fuente única)
- Nuevo `lib/seo/public-indexability.ts`: fuente tipada que determina URL,
  segmento, indexabilidad, decisión y motivo a partir de
  `data/seo/canonical-paths.json` + `data/seo/local-landing-indexability.json`.
- Nuevo `data/seo/local-landing-indexability.json` con las 16 decisiones
  (7 indexables, 9 `NOINDEX_UNTIL_UNIQUE`).

### Sitemap
- `app/sitemap.ts` eliminado. Nuevo `app/sitemap.xml/route.ts` (sitemap index)
  y 5 segmentos reales (`sitemap-pages/services/blog/authors/local.xml`) con
  XML 200 (helpers `sitemapIndexXml`/`sitemapIndexResponse` en
  `lib/sitemap-xml.ts`).
- Lógica centralizada en `lib/seo/sitemap.ts` (PUBLIC_ROUTES, techo IndexNow,
  `REDIRECT_SOURCE_PATHS`, `THIN_POST_SLUGS`, segment builders).
- Gate de inventario: `data/seo/sitemap-public-manifest.json`
  (`min_indexable: 100`, `allowed_withdrawn`) sustituye al conteo rígido 135.

### Claims (política única)
- Nuevo `lib/marketing-policy.ts` con «Evaluación inicial confidencial» y
  escáner de variantes prohibidas.
- `lib/public-claims.ts`: `firstConsultationFree` → `unconfirmed`, no público.
- Sustituidas ~40 ocurrencias en landings, FAQ, CTA, newsletter, lead magnet,
  footer, formulario, guía y defaults editables.

### Landings
- `landingMetadata()` emite `noindex, follow` (vía `buildMetadata(noindexFollow)`)
  en las 9 débiles; mantiene indexación en las 7 válidas.
- `TOP_COBERTURA_SLUGS` y footer de cobertura solo con landings indexables.
- `lib/internal-links.ts` filtra las ciudades noindex en `getPriorityCities`,
  `getAllCities` y `getRelatedCitiesForContent`.

### Home y despacho
- Metodología de 5 pasos (Evaluación inicial → Diagnóstico → Propuesta por
  escrito → Gestión y seguimiento → Cierre) en home y `/despacho`.
- Textos «Especializado/a» → formulación prudente; keywords sin claim gratuito.

### FAQ
- Nuevo `lib/faq-common.ts` (dedupe, respuestas no vacías, schema FAQPage desde
  las mismas parejas visibles, policy-safe) e integrado en `HubFaq`.
- FAQ corporativa forzada en `lib/faq-db.ts` pasa de «La primera consulta es
  gratuita» a «¿Cómo funciona la evaluación inicial?» (neutral).
- Fallback `data/faq.ts` alineado con la política.

### Enlazado interno
- `getRelatedCitiesForContent` reduce a ciudades indexables (no más 6 landings
  débiles por artículo).
- Nuevo `scripts/report-internal-link-gaps.ts` → genera
  `docs/seo/current/internal-link-action-report.csv` (53 casos) con servicio
  esperado, cluster recomendado, fuentes ausentes y acción; sin tocar datos
  productivos.

### JSON-LD
- IDs Person unificados: `#danilo-pineda-maradiaga`, `#thania-marlene-paz`,
  `#emil-barahona` en `lib/site.ts`, `lib/schemas/blog.ts` (incluido el
  `reviewedBy` con `@id` canónico).

### GEO
- `scripts/generate-llms-txt.mjs` reescrito: lee `canonical-paths.json` y
  `local-landing-indexability.json`, filtra noindex, añade `generated_at`,
  `generator` y `environment`, lista las 7 landings indexables y referencia el
  sitemap index + 5 segmentos. Regenerado `public/llms.txt`.

### Rendimiento / accesibilidad
- Skip link a `#main` en `app/(public)/layout.tsx`.
- Sin `priority` abusivo (solo header logo y cover del artículo, ambos
  above-the-fold). `prefers-reduced-motion` ya presente en `globals.css`.

### Tests
- Nuevos: `tests/seo-public-indexability.test.ts`,
  `tests/sitemap-segments.test.ts`, `tests/marketing-policy.test.ts`,
  `tests/faq-common.test.ts`, `tests/jsonld-entity-ids.test.ts`.
- Actualizados: `crawl-contract`, `seo-protection`, `public-claims`,
  `public-claims-contract`, `seo-lawyer-profiles`, `blog-route-contract`,
  `blog-metadata-only`, `blog-performance-contract`,
  `blog-verification-phase2`, `fase2-arquitectura-publica`,
  `fase3-servicios-prioritarios`, `fase5-design-system` y los specs Playwright
  `public-faq-contract`, `public-blog-mobile`.

---

## 5. Archivos modificados

| Archivo | Cambio | Motivo |
|---|---|---|
| `docs/seo/decisions/temporary-corporate-blog-authorship.md` | nuevo | Excepción temporal de autoría |
| `AGENTS.md` | reglas R18/R23/R24 + fuentes + gate | Gobernanza |
| `lib/seo/public-indexability.ts` | nuevo | Fuente única de indexabilidad |
| `data/seo/local-landing-indexability.json` | nuevo | Clasificación de 16 landings |
| `data/seo/sitemap-public-manifest.json` | nuevo | Manifiesto sitemap (sin gate 135) |
| `lib/seo/sitemap.ts` | nuevo | Segment builders + index |
| `lib/sitemap-xml.ts` | `sitemapIndexXml/Response` | Sitemap index real |
| `app/sitemap.xml/route.ts` + 5 segmentos | reescritos | XML 200, sin redirects |
| `app/sitemap.ts` | eliminado | Reemplazado por segmentos |
| `lib/marketing-policy.ts` | nuevo | Política única de evaluación |
| `lib/content-policy.ts` | nuevo | Validador Admin (claims/testimonios) |
| `lib/faq-common.ts` | nuevo | FAQ visible/schema desde la misma fuente |
| `lib/public-claims.ts` | `firstConsultationFree` unconfirmed | Política comercial |
| `lib/seo.ts` | `noindexFollow` | `noindex, follow` en landings débiles |
| `lib/site.ts` | IDs Person, knowsAbout, descripciones, keywords | JSON-LD y claims |
| `lib/schemas/blog.ts` | IDs Person/reviewedBy canónicos | JSON-LD |
| `lib/faq-db.ts`, `data/faqs-hubs.ts`, `data/faq.ts`, `data/pilar/faqs-guia.ts` | FAQ neutral | Claims |
| `lib/page-content-db.ts` | defaults 5 pasos, sin testimonios, validador | Claims + metodología |
| `lib/blog-generated-cta.ts`, `lib/lead-magnet-pdf.tsx` | CTA neutral | Claims |
| `lib/internal-links.ts` | filtro de ciudades noindex | Sobre-enlazado |
| `data/landings-locales.ts` | titles/FAQ neutrales, noindex, cobertura | Claims + landings |
| `components/marketing/{hub-faq,public-footer,consultation-cta,cta-spain,lead-magnet-cta,solicitar-consulta-form}.tsx` | FAQ/footer/CTA neutrales | Claims + landings |
| `components/blog/newsletter-section.tsx` | CTA neutral | Claims |
| `app/(public)/page.tsx`, `despacho`, `preguntas-frecuentes`, `solicitar-consulta`, `guia-legal…`, `abogado-{civil,de-familia,penalista-*}…` | 5 pasos + claims neutrales | Claims + metodología |
| `app/(public)/layout.tsx` | skip link | Accesibilidad |
| `public/llms.txt` | regenerado | GEO con fecha y filtro |
| `scripts/generate-llms-txt.mjs` | reescrito | Fuentes canónicas + fecha |
| `scripts/submit-indexnow.mjs` | excluye 9 landings noindex | IndexNow |
| `scripts/seo-public-contract.ts` | nuevo | Gate unificado |
| `scripts/report-internal-link-gaps.ts` | nuevo | Informe de 53 casos |
| `scripts/audit-faq-contract.ts`, `validate-generated-cta-copy.ts`, `audit-crawl-contract.ts`, `audit-blog-route-contract.ts`, `seo-indexability-audit.mjs` | actualizados | Nueva arquitectura/política |
| `package.json` | scripts `seo:public-contract`, `seo:internal-links-report` | Gates |
| `tests/*` (13 archivos) | actualizados | Nueva política/arquitectura |
| `tests/{seo-public-indexability,sitemap-segments,marketing-policy,faq-common,jsonld-entity-ids}.test.ts` | nuevos | Regresión |

---

## 6. Landings locales

| Slug | Decisión | robots | sitemap | IndexNow | llms.txt |
|---|---|---|---|---|---|
| nacaome | KEEP_SECONDARY_OPERATIONAL | index, follow | sí | sí | sí |
| choluteca | KEEP_AND_IMPROVE | index, follow | sí | sí | sí |
| san-lorenzo | KEEP_AND_IMPROVE | index, follow | sí | sí | sí |
| goascoran | KEEP_AND_IMPROVE | index, follow | sí | sí | sí |
| san-marcos-de-colon | KEEP_AND_IMPROVE | index, follow | sí | sí | sí |
| el-triunfo | KEEP_AND_IMPROVE | index, follow | sí | sí | sí |
| amapala | KEEP_AND_IMPROVE | index, follow | sí | sí | sí |
| pespire | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| marcovia | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| namasigue | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| orocuina | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| langue | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| caridad | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| alianza | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| concepcion-de-maria | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |
| san-antonio-de-flores | NOINDEX_UNTIL_UNIQUE | noindex, follow | no | no | no |

---

## 7. Sitemaps

- `/sitemap.xml` → sitemap index XML que referencia los 5 segmentos (200, no
  redirects). Verificado en runtime.
- Segmentos estáticos verificados: **pages 6, services 26, authors 3, local 12**
  (7 landings de ciudad indexables + 5 comerciales). Total estático 47 URLs,
  0 duplicados, 0 noindex, 0 privadas, origen canónico HTTPS.
- Segmento `blog` dinámico (fuerza la DB en runtime; contiene índice, 20
  categorías y artículos indexables con `lastmod` real).
- Exclusiones: admin, intranet, API, preview, búsquedas, drafts, `noindex`,
  landings no aprobadas, orígenes de redirect (`REDIRECT_SOURCE_PATHS`).
- Validación XML: `sitemapXml`/`sitemapIndexXml` pasan tests; los endpoints
  segmentados no usan `legacySitemapRedirectResponse`.
- Gate de inventario: manifiesto versionado (`min_indexable: 100`,
  `allowed_withdrawn`), sustituye al conteo rígido de 135.

---

## 8. Claims comerciales

- Ocurrencias localizadas en código ejecutable/datos: **~40 en 20+ archivos**
  antes → **0** después (verificado con escáner automático sobre todo el árbol,
  excluyendo códigos legales y backups).
- Formulación canónica final: **«Evaluación inicial confidencial»**
  (`lib/marketing-policy.ts`).
- El snapshot de DB en `.secrets/fase6-pre-rollback-neon-snapshot.json` (no
  versionable) conserva claims; requiere corrección en la DB productiva
  (pendiente, ver §10).
- Validador en `lib/content-policy.ts` conectado a `upsertPageContent` para
  bloquear claims y testimonios al escribir desde Admin.

---

## 9. Resultados de validación

| Comando | Resultado | Resumen |
|---|---|---|
| `npm ci` | NO EJECUTADO | node_modules presentes; no se re-instaló para no alterar el entorno |
| `npm run lint` | PASS | 0 errores (3 warnings preexistentes en `.local/`) |
| `npx tsc --noEmit` | PASS | exit 0 |
| `npm test` | PASS | 141 archivos / 2.391 tests verdes |
| `npm run build` | PASS | Next.js 16.2.12 compila; postbuild regenera `llms.txt`; IndexNow dry-run excluye 9 landings |
| `npm run seo:public-contract` | PASS | Gate unificado: 0 errores |
| `npm run seo:faq-contract` | PASS | FAQ CONTRACT: PASS |
| `npm run legal:generated-cta-copy` | PASS | CTA validado |
| `scripts/audit-faq-contract.ts` | PASS | FAQ CONTRACT: PASS |
| Sitemap segmentos (runtime) | PASS | 47 estáticas, 0 duplicados/noindex/privadas |
| Playwright / Lighthouse | NO EJECUTADO | requiere servidor + DB y navegador; specs actualizados |

---

## 10. Pendientes reales

### Requieren decisión humana
- Enriquecer o consolidar las 9 landings `NOINDEX_UNTIL_UNIQUE` (valor local
  único) para revertir su `noindex` con datos reales.
- Confirmar contractualmente si la evaluación inicial es gratuita; si se
  confirma, actualizar `firstConsultationFree` y la formulación canónica.
- Autorizar testimonios reales (con nombre, plataforma y enlace) antes de
  activar la sección `testimonials`.

### Requieren acceso a datos productivos
- Corregir en la DB `blog_posts`/`page_content` las variantes de
  «consulta gratuita/sin costo» que aún existen en contenido productivo
  (evidencia: snapshot en `.secrets/`; no modificable desde el código).
- Validar el segmento `blog` del sitemap contra la DB real (localmente
  `DATABASE_URL` está vacía en `.env.local`).
- Ejecutar Playwright/Lighthouse sobre Preview/Production con DB.

### Excluidos expresamente por la autoría corporativa
- Migración a autor individual del blog (excepción temporal documentada).
- `author`/`reviewedBy` en JSON-LD por motivos de autoría.

### Bloqueos externos
- Entorno de e2e (Playwright) y Lighthouse no disponibles en esta sesión.
- Datos GSC/GA4/Bing no consultados (no autorizados para esta intervención).

---

## 11. Estado Git

- **Rama:** `feat/seo-geo-master-implementation`
- **Commits de esta implementación (en orden):**
  1. `93802b26` `docs(seo): document public content governance decisions`
  2. `b410313c` `feat(seo): enforce public indexability and segmented sitemaps`
  3. `fb3c3b82` `feat(content): enforce verified commercial claims`
  4. `ec05c12d` `feat(public-site): strengthen trust schema and accessibility`
  5. `f43febb3` `feat(seo): audit and harden internal linking`
  6. `339a2b40` `test(seo): add public contract regression gates`
  7. *(este commit)* `docs(seo): record public hardening implementation results`
- **Árbol tras esta confirmación:** quedan sin confirmar, de forma justificada,
  archivos de una sesión de trabajo posterior e incompleta (scripts de auditoría
  de contenido dinámico que no compilan) y artefactos de orquestación en la
  raíz. Ver el informe de organización de commits
  (`docs/seo/implementation/seo-geo-commit-organization-report.md`).
- **Confirmación:** no se hizo push, no se desplegó, no se tocó Production, no
  se ejecutaron migraciones ni envíos IndexNow reales.

---

**Resumen:** se cerraron las brechas de indexabilidad, sitemap, claims,
landings, FAQ, JSON-LD, GEO y enlazado interno que la auditoría señalaba como
vigentes, se respetó la excepción temporal de autoría corporativa y todos los
gates ejecutables pasan. Queda pendiente la limpieza de claims en datos
productivos, la validación del sitemap de blog y de e2e con acceso a DB/entorno,
y las decisiones humanas indicadas en §10, por lo que el veredicto es PARTIAL.

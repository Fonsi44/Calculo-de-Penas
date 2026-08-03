# Informe final — Datos dinámicos, enlazado interno y validación E2E SEO/GEO

**Fecha:** 2026-08-03
**Rama:** `feat/seo-geo-master-implementation`
**HEAD de inicio de sesión:** `63dc2f0f`
**HEAD al cierre:** `400de83a`
**Alcance:** contenido público dinámico, claims comerciales en DB, enlazado
interno (53 casos), contrato del blog, sitemap runtime, E2E, accesibilidad,
rendimiento, scripts de datos seguros y gate unificado.

---

## 1. Veredicto

```
SEO_GEO_RUNTIME_DATA = READY_FOR_PRODUCTION_PATCH
```

No se declara `COMPLETE` porque quedan operaciones que requieren autorización
humana: la ejecución del patch de remediación de claims en producción y las
decisiones de contenido (enlaces en body de artículos jurídicos y fuentes
oficiales). Todo lo técnicamente ejecutable en este entorno está verde o está
clasificado con evidencia. El único gate que «falla» lo hace por una causa
verificada y preparada para su corrección autorizada (claims en bodies de
staging), no por un defecto de implementación.

---

## 2. Estado inicial

- Rama: `feat/seo-geo-master-implementation`.
- HEAD al iniciar: `63dc2f0f` (el informe previo concluyó
  `SEO_GEO_PUBLIC_HARDENING = PARTIAL`).
- Cambios preexistentes: ~50 archivos modificados + untracked
  (`.opencode/`, `docs/seo/decisions/`, `docs/seo/implementation/`,
  `lib/seo/`, `lib/content-policy.ts`, `lib/marketing-policy.ts`, etc.).
  Todos preservados íntegramente.
- Entorno de datos utilizado: **rama Neon de staging** `e2e_pr20`
  (`ep-bold-band-asjxcjyd…`, branch `br-orange-moon-ass3ksjl`), SOLO LECTURA
  para validaciones; el patch de datos se generó en dry-run sin escribir.
- Confirmación de no escritura productiva: ninguna escritura sobre
  `neondb` (producción) ni sobre staging. Todos los scripts de datos
  rechazan producción (fail-closed).

---

## 3. Autoría

No se modificó:

- `author` ni `reviewedBy` de ningún artículo;
- la decisión de autoría corporativa temporal
  (`docs/seo/decisions/temporary-corporate-blog-authorship.md`, R23);
- la cola de 40 propuestas editoriales por esta cuestión.

El contrato del blog valida la autoría corporativa canónica y NO exige autor
individual.

---

## 4. Auditoría de contenido dinámico

Inventario tipado: `docs/seo/current/dynamic-content-inventory.csv` (38 fuentes:
archivos versionados, seeds, fixtures y tablas administrables).

| Tipo                                           | Ocurrencias                        | Automáticas                  | Manuales                            | Fuente                                        |
| ---------------------------------------------- | ---------------------------------- | ---------------------------- | ----------------------------------- | --------------------------------------------- |
| Claims comerciales en bodies de blog (staging) | 12 violaciones OPEN en 9 artículos | 8 (frases nominales simples) | 1 (frase ambigua: «sin compromiso») | `blog_posts.body`                             |
| Claims en fixture de prueba (`fixture_only`)   | 1                                  | —                            | —                                   | `preview-blog-fixtures.json` (permitido §5.4) |
| Tests/ficheros versionados de contenido        | 0                                  | —                            | —                                   | archivos auditados                            |

Artículos con claims en staging (evidencia):
`abogados-en-amapala-valle`, `abogados-en-choluteca`,
`abogados-en-pespire-choluteca`, `abogados-en-san-lorenzo` (todos orígenes de
redirect 301), `arbitraje-honduras-guia-completa`, `cobro-deudas-choluteca`,
`pineda-asociados-bufete-multidisciplinario-honduras`,
`reformas-legales-recientes-honduras`, `tramites-legales-nacaome`.

Artefactos: `dynamic-content-policy-audit.csv`,
`dynamic-content-manual-review.csv`.

---

## 5. Patch de datos

- Script: `npm run content:remediate-commercial-claims` (default `--dry-run`).
- Ubicación: `scripts/remediate-commercial-claims.ts`.
- Tablas: `blog_posts` (body/title/description/meta\_\*), `faq_entries`,
  `page_content`, `configuracion_sitio` (whitelist de columnas).
- Filas: 9 (8 automáticas + 1 manual).
- Precondiciones: hash previo por fila; aborta si la fila cambió.
- Dry-run: no escribe nada; genera before/after con hashes.
- Respaldo: `dynamic-content-remediation-backup.json`.
- Rollback: `dynamic-content-remediation-rollback.json`.
- Protección de producción: `scripts/lib/environment-guard.ts` (fail-closed;
  detecta el endpoint productivo y entornos desconocidos).
- Idempotencia verificada: una segunda pasada no produce cambios.

**No se ejecutó escritura alguna.**

---

## 6. Enlazado interno (53 casos)

Fuente: `docs/seo/current/internal-link-action-report.csv` (53 `ACTION_REQUIRED`).

| Estado final                           | Cantidad |
| -------------------------------------- | -------- |
| REQUIRES_HUMAN_DECISION                | 53       |
| INVALID_OR_OBSOLETE                    | 0        |
| READY_FOR_PRODUCTION_PATCH             | 0        |
| RESOLVED_IN_CODE / RESOLVED_IN_STAGING | 0        |

Resumen de la clasificación (ver anexo `internal-link-resolution.csv`, 53 filas
con resolución individual):

- Verificado contra staging: los 53 artículos están `published_firm_reviewed`,
  publicados y sin `noindex` → el motivo «lawyer_review_pending» del informe
  anterior es **obsoleto** en el entorno validado.
- Déficit real: menos de 2 enlaces contextuales en el body y, en varios,
  ausencia de fuentes oficiales.
- Clasificación de causa: `AUTO_FIX_DATABASE` (53). La inserción de enlaces en
  el body de artículos jurídicos (YMYL) y la selección de fuentes oficiales son
  **decisiones de contenido humano** → `REQUIRES_HUMAN_DECISION`.

Entregables técnicos (listos, sin ejecutar):

- Estructura canónica `lib/seo/article-relations.ts` (valida slugs, rechaza
  autorreferencias, duplicados, rutas privadas/noindex; máx 2 relacionados;
  detecta enlaces rotos).
- Registro `data/seo/article-seo-relations.json` (53 relaciones, 0 violaciones
  de validación contra el catálogo de staging).
- Patch determinista `internal-links-patch.json` (precondiciones + hash del
  body por artículo; no ejecutado).
- El render ya enlaza servicio (RelatedService), relacionados (relaciones
  canónicas con fallback por similitud), ciudades y categorías; enlaces rotos
  de los 53: 0.

---

## 7. Blog y sitemap

- Artículos en staging: 141 (publicados 135, indexables 135).
- Sitemap `/sitemap-blog.xml`: 156 URLs (135 artículos + hubs de categoría).
- Altas/bajas: manifiesto `sitemap-public-manifest.json` (piso 100); inventario
  actual 135 ≥ piso. Sin retiradas autorizadas declaradas.
- Duplicados: 0. Canonical origen: 100 % `https://www.pinedayasocioshn.com`
  (canónico). URLs inexistentes: 0 (todas verificadas contra staging).
- Noindex excluidos: 0 landings `NOINDEX_UNTIL_UNIQUE` en sitemap/local.
- Resultado XML: válido (content-type XML, `<urlset>/<sitemapindex>` correctos).
- Diff: `docs/seo/current/blog-sitemap-diff.csv` (135 filas).
- Contrato del blog (`seo:blog-contract`): FAIL solo por los 5 claims en
  bodies (ver §4); el resto de invariantes (slug único, canonical, título,
  H1, meta description, autor corporativo, fecha, categoría, servicio, sin
  HTML peligroso, sin rutas privadas, sin enlaces rotos) pasan.

---

## 8. E2E

Spec: `tests/e2e/seo-runtime-contract.spec.ts` (31 tests). Resultado: **31/31
PASS** (desktop + mobile) sobre la app `next start` (puerto 3100) con staging.

| Ruta                                              | HTTP    | metadata       | schema | a11y | resultado |
| ------------------------------------------------- | ------- | -------------- | ------ | ---- | --------- |
| `/`                                               | 200     | ok             | ok     | ok   | PASS      |
| `/despacho`                                       | 200     | ok             | ok     | ok   | PASS      |
| `/servicios-juridicos`                            | 200     | ok             | ok     | ok   | PASS      |
| `/derecho-penal` + familia + laboral + civil      | 200     | ok             | ok     | ok   | PASS      |
| 3 perfiles `/equipo/*`                            | 200     | ok             | ok     | ok   | PASS      |
| `/preguntas-frecuentes`                           | 200     | ok             | ok     | ok   | PASS      |
| `/solicitar-consulta` (formulario sin envío real) | 200     | ok             | ok     | ok   | PASS      |
| 4 artículos (incl. 2 de los 53)                   | 200     | ok             | ok     | ok   | PASS      |
| landing indexable `/abogados-en-nacaome`          | 200     | index          | ok     | ok   | PASS      |
| landing NOINDEX `/abogados-en-pespire`            | 200     | noindex,follow | ok     | ok   | PASS      |
| sitemap index + 5 segmentos                       | 200 XML | —              | —      | —    | PASS      |
| robots.txt / llms.txt                             | 200     | —              | —      | —    | PASS      |
| 404                                               | 404     | —              | —      | —    | PASS      |

Defecto corregido durante las pruebas: la página `/blog/[categoria]` devolvía
**500** (`DYNAMIC_SERVER_USAGE` de Next 16 por combinar `searchParams` con
prerender ISR). Se corrigió con `export const dynamic = 'force-dynamic'`
(igual que `/blog`, que ya funcionaba). Verificado 200 tras el fix.

---

## 9. Rendimiento (Lighthouse 13.4.1, headless desktop, throttling simulado)

Resumen persistido: `docs/seo/current/performance-runtime-summary.json`.
JSON completos (no versionados): `test-results/lighthouse/`.

| Ruta                   | Performance | A11y | Best-Practices | SEO | LCP   | CLS | TBT   | FCP   |
| ---------------------- | ----------- | ---- | -------------- | --- | ----- | --- | ----- | ----- |
| `/`                    | 85          | 100  | 96             | 100 | 4.3 s | 0   | 11 ms | 1.2 s |
| `/servicios-juridicos` | 85          | 100  | 96             | 100 | 4.4 s | 0   | 4 ms  | 1.2 s |
| artículo penal         | 88          | 100  | 96             | 100 | 3.8 s | 0   | 5 ms  | 1.4 s |
| `/abogados-en-nacaome` | 88          | 100  | 96             | 100 | 3.8 s | 0   | 4 ms  | 1.2 s |
| `/solicitar-consulta`  | 90          | 100  | 96             | 100 | 3.7 s | 0   | 4 ms  | 1.2 s |

Observaciones: sin defecto claro de imagen (peso total ~500–570 KiB; las
imágenes ya se sirven optimizadas por `next/image`). La única oportunidad
significativa es `unused-javascript` (~150 ms) y el LCP está ligado al
rendering local bajo throttling simulado. No se realizó rediseño visual ni
cambios de riesgo.

---

## 10. Validaciones

| Comando                                                         | Exit | Resultado                   | Detalles                                                                                      |
| --------------------------------------------------------------- | ---- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run lint`                                                  | 0    | PASS                        | 0 errores (3 warnings preexistentes en `.local/`)                                             |
| `npx tsc --noEmit`                                              | 0    | PASS                        | —                                                                                             |
| `npm test`                                                      | 0    | PASS                        | 2435 tests / 144 archivos                                                                     |
| `npm run build`                                                 | 0    | PASS                        | env estándar y env staging                                                                    |
| `npm run seo:public-contract`                                   | 0    | PASS                        | —                                                                                             |
| `npm run seo:faq-contract`                                      | 0    | PASS                        | —                                                                                             |
| `npm run legal:generated-cta-copy`                              | 0    | PASS                        | 18 tests                                                                                      |
| `npm run seo:blog-contract -- --env-file .env.e2e.local`        | 1    | FAIL                        | 5 claims en bodies (remediación pendiente)                                                    |
| `npm run seo:sitemap:validate-runtime`                          | 0    | PASS                        | 135 artículos, 5 segmentos                                                                    |
| `npm run content:audit-dynamic -- --env-file .env.e2e.local`    | 0    | informe                     | 12 OPEN (evidencia)                                                                           |
| `npm run content:remediate-commercial-claims -- --dry-run`      | 0    | dry-run                     | 9 filas, 8 auto, 1 manual                                                                     |
| `npm run seo:internal-links:patch -- --env-file .env.e2e.local` | 0    | PASS                        | 53 clasificados                                                                               |
| Playwright E2E `seo-runtime-contract`                           | 0    | PASS                        | 31/31                                                                                         |
| axe `a11y-runtime-essentials`                                   | 0    | PASS                        | 14/14 sin críticas/serias                                                                     |
| axe `a11y-public-contract` (completo)                           | 0    | PASS                        | 67/67                                                                                         |
| Lighthouse (5 rutas)                                            | 0    | PASS                        | ver §9                                                                                        |
| `npm run seo:runtime-contract`                                  | 1    | 6 PASS / 2 FAIL / 1 SKIPPED | los 2 FAIL son los claims (remediación pendiente); lighthouse SKIPPED (ejecutado manualmente) |

---

## 11. Archivos modificados

| Archivo                                                        | Cambio                                                             | Motivo     |
| -------------------------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| `lib/content-policy.ts`                                        | motor común de política (violaciones estructuradas, reglas únicas) | §5.2       |
| `lib/marketing-policy.ts`                                      | `remediateProhibitedClaims` (idempotente)                          | §5.3       |
| `lib/seo/article-relations.ts`                                 | nuevo: relaciones canónicas + validación                           | §6.3       |
| `data/seo/article-seo-relations.json`                          | nuevo: 53 relaciones                                               | §6.3       |
| `scripts/lib/environment-guard.ts`                             | nuevo: detección/aborto de producción                              | §4.2/§11   |
| `scripts/lib/dynamic-content.ts`                               | nuevo: inventario, escaneo, lectura DB solo lectura                | §4/§5      |
| `scripts/audit-dynamic-content.ts`                             | nuevo: `content:audit-dynamic`                                     | §5.1       |
| `scripts/remediate-commercial-claims.ts`                       | nuevo: patch idempotente dry-run                                   | §5.3       |
| `scripts/internal-links-patch.ts`                              | nuevo: clasificación 53 + patch                                    | §6         |
| `scripts/audit-blog-contract.ts`                               | nuevo: contrato del blog vs datos                                  | §7.2       |
| `scripts/validate-sitemap-runtime.ts`                          | nuevo: sitemap runtime + diff                                      | §7.3       |
| `scripts/seo-runtime-contract.ts`                              | nuevo: gate unificado                                              | §13        |
| `app/(public)/blog/[categoria]/page.tsx`                       | `force-dynamic` (fix 500)                                          | §8 defecto |
| `app/(public)/blog/[categoria]/[slug]/page.tsx`                | relacionados canónicos con fallback                                | §6.2       |
| `tests/content-policy.test.ts`                                 | nuevo                                                              | regresión  |
| `tests/remediate-commercial-claims.test.ts`                    | nuevo (seguridad scripts)                                          | §11        |
| `tests/article-relations.test.ts`                              | nuevo                                                              | regresión  |
| `tests/e2e/seo-runtime-contract.spec.ts`                       | nuevo                                                              | §8         |
| `tests/e2e/a11y-runtime-essentials.spec.ts`                    | nuevo                                                              | §9         |
| `package.json`                                                 | 10 scripts nuevos                                                  | §12        |
| `AGENTS.md`                                                    | matriz de validación: gates dinámicos/runtime                      | gobernanza |
| `docs/seo/current/*`                                           | artefactos de auditoría y patches                                  | evidencia  |
| `docs/seo/current/performance-runtime-summary.json`            | resumen Lighthouse                                                 | §10        |
| `docs/seo/implementation/seo-geo-runtime-data-final-report.md` | este informe                                                       | —          |

---

## 12. Pendientes de producción (requieren autorización humana)

1. **Ejecutar el patch de remediación de claims** contra el entorno de
   producción tras verificar el entorno:
   `npm run content:remediate-commercial-claims -- --env-file <env-prod-autorizado> --apply`
   (antes, revisar la fila manual de `abogados-en-pespire-choluteca`).
2. **Decisión de enlazado interno (53)**: aprobar la inserción de enlaces
   contextuales en el body de los artículos jurídicos y la selección de
   fuentes oficiales (contenido YMYL), usando `internal-link-resolution.csv`
   y `internal-links-patch.json`.
3. **Testimonios reales** y enriquecimiento real de las 9 landings
   `NOINDEX_UNTIL_UNIQUE` (requieren evidencia y autorización).
4. Ejecutar `seo:runtime-contract` contra el entorno autorizado con
   `--run-lighthouse` para cerrar el SKIPPED.

---

## 13. Estado Git

- Rama: `feat/seo-geo-master-implementation`.
- HEAD: `400de83a` (avanzó durante la sesión por commits del propietario que
  consolidaron la intervención anterior; algunos incluyen partes tempranas de
  este trabajo, p. ej. `lib/content-policy.ts`, idéntico al working tree).
- Sin commits creados por el agente en esta intervención.
- Sin push. Sin deploy. Sin migraciones. Sin escrituras en producción.
- Árbol: cambios locales preexistentes y los de esta intervención preservados
  (modified + untracked).

---

## Conclusión

El sistema queda **preparado y validado**: claims dinámicos identificados con
evidencia y patch idempotente/reversible listo (sin ejecutar); seeds y defaults
no pueden reintroducir claims; los scripts rechazan producción; los 53 casos de
enlazado están clasificados individualmente; el blog y el sitemap están
validados contra datos reales de staging; Playwright (31), axe (14 + 67) y
Lighthouse están ejecutados; el gate `seo:runtime-contract` existe y reporta de
forma honesta (6 PASS / 2 FAIL atribuibles a la remediación pendiente /
1 SKIPPED). Se corrigió además un 500 latente en `/blog/[categoria]`. La base
de producción NO ha sido corregida: queda pendiente la ejecución autorizada del
patch y las decisiones humanas de contenido.

# Aplicación editorial del Lote SEO 1 — Informe final

**Rama:** `feat/seo-growth-batch1-editorial-apply` · **Veredicto:** `SEO_GROWTH_BATCH1 = COMPLETE`
**Fecha de aplicación (producción):** 2026-08-04T09:13:59Z · **Ventana de medición:** 2026-08-04 → 2026-09-01 (28 días)

---

## 1. Resumen

Se aplicó a producción (DB `neondb`) el lote SEO 1 de **13 entradas aprobadas**
sobre las 18 propuestas originales. El cambio es **exclusivamente de metadata**
(`title` + `metaTitle` + `metaDescription`) en `blog_posts`, sin tocar slug,
canonical, `noindex`, redirects ni cuerpo. Las otras **5 entradas** se clasifican
como `NO_CHANGE` y quedan diferidas.

El copy aprobado eliminó: lenguaje de plantilla ("Resuelve…", "Sin compromiso"),
años no verificados, cola de marca "| Pineda y Asociados", títulos truncados o
duplicados, y promesas ("Proteja su libertad", "¡Obtenga respuesta!"). No añade
hechos legales nuevos (cifras, plazos o porcentajes se mantienen fuera del copy;
revisión `METADATA_ONLY`).

## 2. Clasificación editorial (18)

| Clasificación | Cantidad | Detalle |
|---|---|---|
| `APPROVED_TITLE_META_H1` | 8 | title + metaTitle + metaDescription (H1 = title) |
| `APPROVED_TITLE_META` | 4 | metaTitle + metaDescription (H1 intacto) |
| `APPROVED_METADATA_ONLY` | 1 | solo metaTitle + metaDescription |
| `NO_CHANGE` (diferido) | 5 | sin cambios (datos bajos, precisión jurídica, canibalización) |

Artefactos: `batch-1-editorial-review.csv`, `batch-1-approved-patch.json`,
`batch-1-deferred-patch.json`.

## 3. Aplicación

Runner `scripts/apply-seo-growth-batch1.ts` (modos `dry-run | capture | apply |
verify | rollback`, `--only <slug>`).

### Ciclo staging (`e2e_pr20`)
- DB de staging **no es espejo fiel**: contiene 12/13 slugs y falta
  `empleador-no-paga-salario-honduras`. El ciclo se validó sobre los 12
  existentes con `--only`.
- `capture → apply (12) → verify (12 OK) → rollback (12) → re-apply (12) →
  verify (12 OK) → re-apply (idempotencia: 12 NOOP)`.

### Producción (`neondb`)
- `capture` (13 antes) → `apply` (13 aplicadas, 0 no-op) → `verify` (13/13 OK).
- Backup previo: `.secrets/backups/seo-growth-batch1-production-2026-08-04T09-13-59-029Z.json`
  (gitignored, no se versiona).
- Confirmado por backup que `after` solo contiene las 3 columnas permitidas;
  `updatedAt` no se modificó (no se altera la percepción de frescura).
- Dato relevante: `empleador-no-paga-salario-honduras` tenía en DB un `title`
  truncado ("¿Qué hacer si mi empleador no me paga en"); el nuevo copy lo corrige.

## 4. Validaciones

| Comando | Resultado |
|---|---|
| `npx tsx scripts/seo-growth-batch1-editorial.ts` | OK (validación content-policy R24 + límites title/meta) |
| `vitest run tests/apply-seo-growth-batch1.test.ts` | 27/27 PASS |
| `npx tsc --noEmit` | PASS |
| `eslint tests/apply-seo-growth-batch1.test.ts` | PASS (scripts `.ts` fuera del glob de lint del proyecto) |
| `node scripts/seo-canonical-domain-enforce.mjs` | PASS (exit 0, sin variante typo) |
| `apply --mode verify` (staging y producción) | 12/12 y 13/13 OK |

### No ejecutadas (limitación del entorno)
- **Verificación pública HTTP** (GET de las URLs en producción): el entorno de
  esta sesión no resuelve DNS (terminal y navegador devuelven
  `ERR_NAME_NOT_RESOLVED`). La fuente de verdad es la DB (verificada 13/13); las
  páginas públicas usan ISR `revalidate=3600`, por lo que el HTML cacheado
  reflejará los títulos nuevos en ≤1 h. Slug/canonical/robots no cambian por
  construcción (solo se escribieron las 3 columnas de metadata).
- Gates dependientes de red/app en ejecución (`seo:runtime-contract`,
  `seo:sitemap:validate-runtime`, `seo:internal-links:audit`, `test:a11y`): se
  ejecutan en CI del PR.

## 5. Baseline de medición (28 días)

Registrado en `batch-1-experiment-manifest.csv`: `measurement_start = 2026-08-04`,
`measurement_end = 2026-09-01` para las 13 URLs aplicadas. Las 5 diferidas quedan
marcadas `NO_CHANGE (diferido)` y sin ventana. El siguiente paso de medición es
ejecutar `npm run seo:growth:analyze` tras el 2026-09-01 y comparar CTR/posición/
impresiones por URL contra el baseline.

## 6. DoD (Definition of Done)

- [x] Auditoría editorial de las 18 propuestas con clasificación honesta.
- [x] Copy validado contra `lib/content-policy` (R24) y sin hechos legales nuevos.
- [x] Runner transaccional, idempotente y reversible (dry-run por defecto).
- [x] Backup previo y `--mode rollback` probado en staging.
- [x] Ciclo staging completo (capture/apply/verify/rollback/re-apply/idempotencia).
- [x] Aplicación a producción de solo APPROVED con `ALLOW_PRODUCTION_SEO_BATCH1=true`.
- [x] Verify de producción 13/13 en DB.
- [x] Sin cambios de slug, canonical, noindex, redirects ni cuerpo.
- [x] Baseline de medición 28 días registrado (2026-08-04 → 2026-09-01).
- [ ] Verificación pública HTTP (bloqueada por DNS del entorno; programada en CI).
- [ ] Medición post-28 días (≥ 2026-09-01) y comparación contra baseline.

## 7. Riesgos y notas

- `divorcio-honduras-guia-completa` y `pension-alimenticia-honduras-guia-completa`
  quedaron sin cambio (NO_CHANGE): el primero por calidad de título actual y
  CTR explicable por posición SERP; el segundo por canibalización con
  `pension-alimenticia-porcentaje-honduras-2026` (metadata no corrige
  canibalización; requiere decisión separada).
- `poder-legal-honduras-cuando-se-necesita`: se preserva "poder notarial"
  (precisión jurídica) sobre el match exacto de query "poder legal".
- Los backups de producción viven en `.secrets/backups/` (gitignored) para
  permitir `--mode rollback` si el propietario lo requiere.

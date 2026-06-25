# MANIFEST — Carpeta `basura/`

> Limpieza conservadora del repositorio (fecha de operación: 2026-06-24).
> **Nada se eliminó definitivamente.** Todos los elementos aquí listados fueron
> movidos con `git mv` (se conserva el historial Git) desde su ruta original,
> respetando la estructura relativa. Para recuperar cualquier elemento:
> `git mv basura/<ruta> <ruta>`.

**Total de elementos movidos:** 101 archivos.
**Criterio rector:** ante la duda, no se movió. Sección “Candidatos dudosos
no movidos” al final.

---

## Resumen por categoría

| Categoría | Archivos | Confianza |
|-----------|---------:|-----------|
| Backups manuales explícitos (`.backups/`) | 4 | Alto |
| Logs de build/ejecución commiteados (raíz) | 5 | Alto |
| Scripts temporales / one-shot ya ejecutados (raíz de `scripts/`) | 5 | Medio-Alto |
| Reportes/auditorías JSON generados o stale (`data/`) | 5 | Medio-Alto |
| Componentes muertos no referenciados (`components/marketing/_unused/`) | 8 | Alto |
| Scripts one-shot de migración ya ejecutada (`scripts/legacy/`) | 38 | Alto |
| Artefactos históricos de auditoría CP/delitos (`data/legacy/`) | 35 | Alto |

---

## Detalle elemento a elemento

Confianza: **Alto** = sin referencias activas en código/build/test/docs operativas.
**Medio** = one-shot ya ejecutado o reporte regenerable; mover no rompe nada pero
queda el cambio a criterio humano.

### 1. Backups manuales explícitos (confianza: Alto)

Copias de seguridad manuales con timestamp, ya reemplazadas por las versiones
vigentes. Referencias revisadas: sólo se mencionan históricamente en
`CHANGELOG.md` (registros de release); ningún código/build las consume.

| Ruta original | Nueva ruta | Motivo |
|---------------|------------|--------|
| `.backups/llms.txt.20260622-160617.backup` | `basura/.backups/llms.txt.20260622-160617.backup` | Backup puntual de `public/llms.txt` regenerable vía `npm run llms:generate` |
| `.backups/next.config.ts.2026-06-22_150931.bak` | `basura/.backups/next.config.ts.2026-06-22_150931.bak` | Backup de `next.config.ts` ya integrado |
| `.backups/robots.ts.2026-06-22_150931.bak` | `basura/.backups/robots.ts.2026-06-22_150931.bak` | Backup de `app/robots.ts` ya integrado |
| `.backups/seo-protection.test.ts.2026-06-22_150931.bak` | `basura/.backups/seo-protection.test.ts.2026-06-22_150931.bak` | Backup de `tests/seo-protection.test.ts` (test vigente sigue en `tests/`) |

### 2. Logs commiteados en raíz (confianza: Alto)

Outputs de build/ejecución que no deberían versionarse. La política de logs
ya ignora variantes locales (`.gitignore`); estos se habían commiteado.

| Ruta original | Nueva ruta | Motivo |
|---------------|------------|--------|
| `build.log` | `basura/build.log` | Log de build local |
| `dev-server2.log` | `basura/dev-server2.log` | Log de dev server |
| `dryrun-ctr.log` | `basura/dryrun-ctr.log` | Output dry-run de `run-blog-lotes` |
| `lote1-output.log` | `basura/lote1-output.log` | Output del lote 1 del blog |
| `lote1b-output.log` | `basura/lote1b-output.log` | Output del lote 1b del blog |

### 3. Scripts temporales / one-shot en `scripts/` (confianza: Medio-Alto)

No referenciados en `package.json`, ni importados por otro script, ni por CI.
Verificado con ripgrep (recursivo). `migrate-*` y `sql/fix-truncaa-meta-titles`
aplican los mismos cambios ya efectivos en DB (one-shot ya ejecutados).

| Ruta original | Nueva ruta | Motivo | Confianza |
|---------------|------------|--------|-----------|
| `scripts/_audit-temp.ts` | `basura/scripts/_audit-temp.ts` | Experimento temporal (verifica guardia anti-alucinación). Nombre `_temp` explícito | Alto |
| `scripts/migrate-meta-titles.ts` | `basura/scripts/migrate-meta-titles.ts` | One-shot de meta_titles ya aplicado en DB; duplica `sql/fix-truncaa-meta-titles.sql` | Medio |
| `scripts/migrate-slugs.ts` | `basura/scripts/migrate-slugs.ts` | One-shot de renombrado de slugs; los 301 viven en `next.config.ts` | Medio |
| `scripts/seo-apply-ctr-fixes.ts` | `basura/scripts/seo-apply-ctr-fixes.ts` | One-shot con sello de auditoría 2026-06-23 (crea post + aplica metas) | Medio |
| `scripts/sql/fix-truncaa-meta-titles.sql` | `basura/scripts/sql/fix-truncaa-meta-titles.sql` | SQL puntual ya ejecutado en producción | Medio-Alto |

### 4. Reportes / artefactos JSON en `data/` (confianza: Medio-Alto)

| Ruta original | Nueva ruta | Motivo | Confianza |
|---------------|------------|--------|-----------|
| `data/auditoria-cp-report.json` | `basura/data/auditoria-cp-report.json` | Output regenerable de `npm run audit:cp` (`scripts/auditar-cp.js`). Añadido a `.gitignore` | Alto |
| `data/auditoria-delitos-report.json` | `basura/data/auditoria-delitos-report.json` | Output regenerable de `npm run audit:delitos`. Añadido a `.gitignore` | Alto |
| `data/auditoria-completa-delitos.json` | `basura/data/auditoria-completa-delitos.json` | Auditoría puntual; 0 referencias en código. Ignorado en `.gitignore` | Medio |
| `data/auditoria-correcciones.json` | `basura/data/auditoria-correcciones.json` | Correcciones puntuales; 0 referencias. Ignorado en `.gitignore` | Medio |
| `data/analisis-penas.json` | `basura/data/analisis-penas.json` | Análisis puntual de penas; 0 referencias. Ignorado en `.gitignore` | Medio |

> **No movidos (referencias activas confirmadas):**
> - `data/seo/canonical-paths.json` → fuente única de rutas (sitemap, IndexNow, auditoría).
> - `data/delitos-validacion.json` / `.csv` → citados como fuente de `data/delitos-estados.json` y mostrados en `banner-calidad-datos.tsx`.
> - `data/codigo_trabajo_verificado.json` → cargado por `scripts/blog-verify-fix.ts`.

### 5. Componentes muertos `components/marketing/_unused/` (confianza: Alto)

8 componentes sin imports externos (sólo se referencian entre sí dentro de la
propia carpeta `_unused`). Verificado con ripgrep recusivo en `app/`, `lib/`,
`hooks/`, `components/`, `scripts/`.

| Ruta original | Nueva ruta |
|---------------|------------|
| `components/marketing/_unused/circular-icon.tsx` | `basura/components/marketing/_unused/circular-icon.tsx` |
| `components/marketing/_unused/commitments-grid.tsx` | `basura/components/marketing/_unused/commitments-grid.tsx` |
| `components/marketing/_unused/feature-grid.tsx` | `basura/components/marketing/_unused/feature-grid.tsx` |
| `components/marketing/_unused/features-bar.tsx` | `basura/components/marketing/_unused/features-bar.tsx` |
| `components/marketing/_unused/rss-sidebar.tsx` | `basura/components/marketing/_unused/rss-sidebar.tsx` |
| `components/marketing/_unused/service-card-photo.tsx` | `basura/components/marketing/_unused/service-card-photo.tsx` |
| `components/marketing/_unused/specialists-grid.tsx` | `basura/components/marketing/_unused/specialists-grid.tsx` |
| `components/marketing/_unused/two-column-image-text.tsx` | `basura/components/marketing/_unused/two-column-image-text.tsx` |

### 6. `scripts/legacy/` — one-shots de migración ya ejecutados (confianza: Alto)

38 scripts. Documentados en `README.md §"Estructura"` (`scripts/legacy/ — 38
one-shots de migración ya ejecutada`) y excluidos explícitamente del typecheck
(`tsconfig.json`) y de Vitest (`vitest.config.ts`). Ninguno aparece en
`package.json` ni es importado por código activo.

Inventario (todos movidos a `basura/scripts/legacy/<nombre>`):

`README.md`, `add-internal-links.ts`, `backup-posts.ts`,
`create-fase2-tables.mjs`, `editar-posts-plantilla.ts`,
`expandir-thin-posts.ts`, `fase1-thin-posts.ts`,
`fase2-ctas-enlaces-locales.ts`, `fase2-deploy-complete.ps1`,
`fase2-money-pages.ts`, `fase2-rollback.ps1`, `fase2-validate-deploy.ps1`,
`fase34-insertar-satelites-locales.ts`, `fase4-pilares-restantes.ts`,
`fase5-secundarios-formulario.ts`, `fix-blog-dates.mjs`,
`fix-canonical-canibalizacion.ts`, `fix-final-vacios.ts`,
`fix-internal-links.ts`, `fix-landing-metas.ts`, `fix-long-meta.ts`,
`fix-long-titles.ts`, `generate-blog-meta.ts`,
`insertar-posts-reescritos.ts`, `inventario.ts`, `limpiar-duplicados.ts`,
`migrate-seo-columns.ts`, `optimizar-metadescriptions.ts`,
`read-alto-posts.ts`, `resolve-cannibalization.ts`, `restore-thin-posts.ts`,
`rewrite-14-alto-posts.ts`, `rewrite-25-medio-posts.ts`, `run-migration.js`,
`sanear-posts-plantilla-residual.ts`, `seed-fase2-direct.mjs`,
`seed-seo-config.ts`, `vincular-coverimages.ts`,
`vincular-supuestos-penales.ts`.

### 7. `data/legacy/` — artefactos históricos de auditoría CP/delitos (confianza: Alto)

35 archivos. Documentados en `README.md §"Estructura"` (`data/legacy/ — 35
archivos históricos`). Excluidos del typecheck (`tsconfig.json`). Sin
referencias en código activo.

Fragmentos `art_*_curr.txt` / `art_*_ref.txt` (18), `fix_art_*.txt` (9),
`auditoria-inicial.txt`, `auditoria_completa.txt`, `cp_actualizado_text.txt`,
`cp_original_text.txt`, `cp_tsc_text.txt`, `articulos_cp.json.BACKUP_20260614_001713`,
`delitos-estados.json.BACKUP_20260614`, `delitos.json.BACKUP_20260614`.

Todos movidos a `basura/data/legacy/<nombre>`.

---

## Cambios de configuración y documentación (fuera de `basura/`)

- **`.gitignore`**: añadidos patrones para reportes regenerables
  (`/data/auditoria-cp-report.json`, `/data/auditoria-delitos-report.json` y
  stale `/data/auditoria-completa-delitos.json`, `/data/auditoria-correcciones.json`,
  `/data/analisis-penes.json`), backups locales de auditoría SEO
  (`auditoria-seo/backup-*.json`) y exportaciones puntuales (`docs/*.xlsx`).
- **`CHANGELOG.md`**: entrada bajo Unreleased describiendo la limpieza.
- **`README.md`**: §"Estructura" actualizada para reflejar que
  `data/legacy/`, `scripts/legacy/` y `components/marketing/_unused/` fueron
  consolidados en `basura/`.
- Las exclusiones en `tsconfig.json` (`scripts/legacy`, `data/legacy`,
  `_unused`, `**/_unused`) y `vitest.config.ts` (`scripts/legacy/**`) se
  mantienen: referencian rutas inexistentes pero son inofensivas (sólo
  excluyen). No se eliminan para no tocar configuración de build sin
  justificación funcional.

## Carpetas vacías residuales eliminadas

Tras mover su contenido se eliminaron las carpetas vacías no tracked:
`.backups/`, `scripts/legacy/`, `scripts/sql/`, `data/legacy/`,
`components/marketing/_unused/`. (Git no versiona carpetas vacías; el efecto
en el repo es el de los `git mv` ya reflejados.)

---

## Candidatos dudosos NO movidos

Mantener (conservador). Se anotan para decisión humana posterior:

- **`pinedayasociados.md`** (raíz): documento de planificación ("Plan de
  Acción SGIE Autopilot v3.0"). No referenciado por código, pero es
  documentación de diseño vigente. **No se mueve** (riesgo de pérdida de
  contexto estratégico). Confianza para mover: baja.
- **`scripts/check-delitos-articulos.mjs`, `scripts/check-info-items.ts`**:
  diagnósticos ad-hoc de DB no referenciados, pero reutilizables como
  utilidades de巡 inspección puntual. **No movidos**.
- **`scripts/test-service-account.mjs`**: utilidad de prueba de credenciales
  GSC/GA4. Reutilizable. **No movido**.
- **`scripts/_edit-post.cjs`**: editor manual puntual de posts (no masivo).
  Reutilizable. **No movido**.
- **`scripts/run-blog-lotes.cmd` / `.sh`**: wrappers de procesamiento por
  lotes documentados en sus cabeceras. Podrían seguir usándose. **No movidos**.
- **`docs/*.pdf`**: fuentes canónicas (CP, Constitución, Códigos) de las que
  se extrajeron los JSON de `data/`. Mantener como trazabilidad de origen.
- **`auditoria-seo/*.md` (17 tracked)**: registros de auditoría SEO trazables
  (política de `AGENTS.md §10`). **No movidos**; sólo se ignoraron los
  backups JSON por sesión.
- **`tsconfig.tsbuildinfo`, `next-env.d.ts`, `.indexnow-cache.json`** (raíz):
  no tracked (ya en `.gitignore`). Archivos locales, no se tocan.
- **`opencode.jsonc`, `opencode.jsonc.bak-*`**: no tracked (gitignored).
  Config del entorno; no mover desde disco.

## Cómo revertir

```bash
# Recuperar un elemento:
git mv basura/<ruta-relativa> <ruta-relativa>
# Ej: git mv basura/components/marketing/_unused/circular-icon.tsx components/marketing/_unused/circular-icon.tsx

# Recuperar toda una carpeta:
git mv basura/scripts/legacy scripts/legacy
git mv basura/data/legacy    data/legacy
```
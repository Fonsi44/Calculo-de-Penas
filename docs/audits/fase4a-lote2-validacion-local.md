# Fase 4A — Validación local del Lote 2

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Hash inicial (previo a commits Fase 4A):** `26e9ce15` (HEAD de origen Fase 3E)
**Hash intermedio detectado:** `3769416d` (commit ajeno, ver §5 — incidencia de gobernanza)
**Alcance:** hasta validación local inclusive. **NO** push, **NO** deploy, **NO** revalidación de producción.

---

## Matriz de validación local (§13 del enunciado)

| Comando | Resultado |
|---------|-----------|
| `npx eslint . --max-warnings=0` | 0 errores, 0 warnings |
| `npx tsc --noEmit` | 0 errores |
| `npx vitest run` | 1677/1677 pasan (92 archivos, +19 tests nuevos Fase 4A) |
| `npx next build` (×1) | exit 0 |
| `git status --short` (tras build 1) | sin side-effects en archivos versionados sensibles |
| `npx next build` (×2) | exit 0 |
| `git status --short` (tras build 2) | idéntico a build 1 (determinismo) |

## Condiciones verificadas

- ✓ lint: 0 errores y 0 warnings.
- ✓ TypeScript: 0 errores.
- ✓ todos los tests verdes.
- ✓ dos builds exit 0.
- ✓ Git sin side-effects del build en `lib/site.ts`, `scripts/validate-jsonld.mjs`, `tests/seo-protection.test.ts` u otros archivos versionados ajenos a Fase 4A.
- ✓ ningún secreto o temporal en artefactos Fase 4A (verificado con `grep`).
- ✓ ningún archivo versionado modificado por el build (determinismo del SW intacto).

## Artefactos generados (todos en `docs/audits/`)

| Archivo | Propósito |
|---------|-----------|
| `fase4a-lote2-seleccion.json` | 120 candidatos + top-15 con scoring determinista |
| `fase4a-lote2-priorizacion.md` | Justificación del top-15 y fórmula |
| `fase4a-lote2-estados-iniciales.json` | Backup de estados DB con hashes SHA-256 |
| `fase4a-lote2-inventario-claims.json` | Inventario de claims existentes (Lote 2 = 0) |
| `fase4a-lote2-claims-finales.json` | 68 claims extraídos y clasificados |
| `fase4a-lote2-fuentes.md` | Catálogo de fuentes oficiales + canónicos |
| `fase4a-lote2-correcciones-propuestas.md` | 3 correcciones con evidencia firme |
| `fase4a-lote2-aplicacion-correcciones.json` | Registro de aplicación (idempotente) |
| `fase4a-lote2-seo-geo.md` | Auditoría SEO/GEO de los 15 |
| `fase4a-lote2-enlazado-interno.md` | Enlazado interno y huérfanas |
| `fase4a-lote2-estados-finales.json` | 15 estados derivados (5 completed, 7 needs_human_review, 3 blocked) |
| `fase4a-lote2-matriz.json` | Estado esperado vs DB |
| `fase4a-lote2-revision-humana/index.md` + 7 archivos | Paquetes de revisión humana |
| `fase4a-lote2-validacion-local.md` | Este documento |
| `fase4a-lote2-validacion-final.md` | Informe global (47 puntos) |

## Scripts creados (en `scripts/`, patrón `fase3*` → `fase4a*`)

`fase4a-inventario-y-seleccion.ts`, `fase4a-exportar-lote2.ts`, `fase4a-extraer-claims.ts`,
`fase4a-aplicar-correcciones.ts`, `fase4a-auditar-seo.ts`, `fase4a-recalcular-estados.ts`,
`fase4a-generar-fuentes-correcciones.ts`, `fase4a-paquetes-revision-humana.ts`.

## Tests añadidos

`tests/fase4a-pipeline.test.ts` — 19 tests de integridad del pipeline Fase 4A
(selección determinista, backup con hashes, claims válidos, idempotencia,
estados + invariantes, paquetes revisión humana).

## Secciones del enunciado NO ejecutadas (PENDIENTE autorización de push)

Las siguientes secciones requieren `git push`, despliegue a Vercel y operaciones
outward-facing en producción. Quedan fuera del alcance de esta sesión (decisión
del usuario: "solo hasta validación local"):

| Sección | Estado |
|---------|--------|
| §14 Push + deploy + revalidación | **PENDIENTE** — hash final listo para cuando se autorice |
| §15 Validación de producción (15 URL) | **PENDIENTE** — requiere deploy |
| §16 Validación visual Playwright en prod | **PENDIENTE** — requiere deploy |
| §17 Rollback de deploy | **PENDIENTE** — aplica solo tras deploy |

## 5. Incidencia de gobernanza detectada

Durante el preflight (Fase 0) el `npx next build` generó side-effects en
`lib/site.ts`, `scripts/validate-jsonld.mjs` y `tests/seo-protection.test.ts`
(correcciones Schema.org). Esos cambios son **ajenos a la Fase 4A** y fueron
guardados en `git stash` para no commitearlos.

Posteriormente, un **hook automático** (no instrucción explícita del agente ni
del usuario) commiteó ese contenido como `3769416d fix(seo): corregir validación
Schema.org de Ahrefs`. Este commit:

- NO fue creado por la Fase 4A.
- NO incluye ningún archivo Fase 4A.
- NO daña el repositorio (son correcciones SEO válidas y autocontenidas).
- Permanece en `main` y no se ha revertido (no fue solicitado).

**Recomendación:** revisar la configuración de hooks de ZCode para evitar que
commiteen automáticamente side-effects del build sin autorización explícita.

# Scripts legacy (one-shot ya ejecutados)

Esta carpeta contiene **scripts puntuales de migración y corrección de datos
que ya se ejecutaron** y no forman parte del flujo operativo del repositorio.

Se conservan por trazabilidad (para saber qué se hizo y poder reproducirlo o
auditarlo), pero **no están referenciados** por `package.json`, los workflows
de CI ni el código de la aplicación.

## Criterio de inclusión

Un script se mueve aquí cuando cumple **todas** estas condiciones:

1. Fue un one-shot de migración o fix de datos ya aplicado a producción.
2. No aparece en `package.json` scripts ni en `.github/workflows/`.
3. No es importado por código de la aplicación (`app/`, `lib/`, `components/`).
4. No es un validador/auditor operativo que se ejecuta periódicamente.

## Scripts que NO van aquí (se quedan en `scripts/`)

- **Validadores**: `validar-fechas-blog.ts`, `validar-meta-seo.ts`, `content-audit.ts`.
- **IndexNow**: `submit-indexnow.mjs`.
- **Health checks**: `seo-health-check.mjs`, `auditar-indexacion-prioritaria.mjs`.
- **Diagnóstico GA/GSC**: `gsc-analytics.mjs`, `submit-sitemap-gsc.mjs`, `test-ga4.mjs`, `test-gsc.mjs`, `oauth-url.mjs`, `oauth-get-refresh-token.mjs`.
- **Auditores activos**: `audit-blog-seo.ts`, `audit-canibalizacion.ts`, `audit-internal-links.ts`, `detectar-posts-plantilla.ts`, `auditar-performance-publico.ts`, `auditar-cp.js`, `auditar-delitos.js`.
- **Utilidades de infra/e2e**: `load-env.cjs`, `check-db-state.ts`, `list-tables.mjs`, `cleanup-e2e-users.mjs`, `e2e-start.mjs`, `visual-regression.cjs`, `screenshot-audit.cjs`.

## Si necesitas re-ejecutar un script legacy

Léelo completo antes: muchos asumen un estado concreto de la DB o de los datos
en un momento dado y pueden no ser idempotentes. Haz **backup** antes
(`drizzle/` o export lógico) y verifica el resultado tras ejecutar.

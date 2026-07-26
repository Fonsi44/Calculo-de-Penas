# Fase 3E — Validación final

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Hash inicial:** `0a2f65fd`
**Hash final:** `455f87ca`
**Veredicto:** **CERRADO.** El 8% pendiente de Fase 3D quedó resuelto.

---

## Objetivos de Fase 3E (§Objetivo del enunciado)

| # | Objetivo | Estado |
|---|----------|--------|
| 1 | Build no modifica archivos versionados | ✓ CERRADO |
| 2 | Hash final validado tras todos los cambios | ✓ CERRADO |
| 3 | Despliegue Vercel exacto del último commit confirmado | ✓ CERRADO |
| 4 | Regeneración de los 15 artículos forzada/verificada | ✓ CERRADO |
| 5 | Bodies corregidos aparecen en producción | ✓ CERRADO |
| 6 | Validación visual real en escritorio y móvil | ✓ CERRADO |
| 7 | Git completamente limpio | ✓ CERRADO |

## 1. Service worker — determinismo del build

**Causa raíz definitiva:** `postbuild` ejecutaba `bump-sw-cache.mjs` que reescribía
`public/sw.js` (archivo versionado) para inyectar el BUILD_ID. Cada build dejaba el
árbol sucio.

**Solución:** route handler `app/sw.js/route.ts` que lee `public/sw.template.js`
(plantilla versionada) e inyecta `NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID` en runtime. La
plantilla nunca se modifica → árbol limpio.

**Verificación:**

```
build 1 → exit 0 → git status --short sin sw.js
build 2 → exit 0 → git status --short sin sw.js
```

En producción: `const CACHE = 'pineda-pwa-' + ('dpl_JDskHbv6...' === 'dpl_JDskHbv6...'`
— BUILD_ID real, sin placeholder, Content-Type correcto, protecciones R6 intactas.

Detalle: [`fase3e-service-worker-final.md`](./fase3e-service-worker-final.md)

## 2. Revalidación on-demand

**Hallazgos y soluciones:**

- `CRON_SECRET` no existía en Vercel → creado (tipo Sensitive, 64 chars hex).
- El proxy bloqueaba `/api/revalidate` → añadido a `PUBLIC_API_EXACT`.
- Refuerzos: allowlist de paths, rate-limit por IP (30/min), logging sin secretos.

**Revalidación de los 15 slugs:** HTTP 200, 42 paths revalidados, 0 rechazados, 1
landing revalidada vía `type:path`.

Detalle: [`fase3e-revalidacion-produccion.md`](./fase3e-revalidacion-produccion.md)

## 3. Validación de contenido en producción (15/15 pass)

Script `scripts/fase3e-validar-produccion.mjs` verificó para los 15 artículos:

- HTTP 200 + deployment que responde (`x-vercel-id`).
- Canonical correcto (`/blog/derecho-penal/<slug>` o landing).
- JSON-LD válido.
- Aviso `AiReviewNotice` coherente con `ai_review_status`.
- **9 correcciones textuales** verificadas en HTML público:
  - allanamiento (1), antejuicio (1), delitos-mas-comunes (3), derechos-detenido (1),
    estafas-fraudes (3).
  - Para cada una: texto NUEVO presente, texto ANTIGUO ausente.

Resultado: **15/15 pass**. Output: [`fase3e-validacion-15-articulos.json`](./fase3e-validacion-15-articulos.json)

## 4. Validación visual real (14/14 pass)

Playwright con Chromium contra producción:

- 6 artículos × 2 viewports (desktop 1280×800, móvil iPhone 13 390×844) = 12 tests.
- 2 tests de service worker (BUILD_ID real + registro/activación).

Checks: HTTP 200, canonical, h1 único, aviso coherente, sin avisos falsos, sin
overflow horizontal, sin errores de consola/pageerror, sin 4xx/5xx propios.

Detalle: [`fase3e-validacion-visual.md`](./fase3e-validacion-visual.md)

## 5. Matriz de validación final

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | 0 errores, 0 warnings |
| `npx tsc --noEmit` | 0 errores |
| `npm run test` | 1654/1654 pasan (91 archivos) |
| `npm run build` (×1) | exit 0, git limpio |
| `npm run build` (×2) | exit 0, git limpio |
| Playwright e2e (producción) | 14/14 pasan |
| Validación 15 artículos (producción) | 15/15 pass |

## 6. Commits de Fase 3E

1. `4d53d058` — `fix(sw)`: plantilla + build-sw.mjs + rewrite + postbuild
2. `f327ac60` — `fix(revalidacion)`: allowlist + rate-limit + logging
3. `3916ca2b` — `test(fase3e)`: scripts y e2e de validación
4. `96d362f4` — `fix(proxy)`: permitir /api/revalidate
5. `7cf18f08` — `fix(fase3e)`: rewrite beforeFiles + detección aviso + allowlist landings
6. `a7eea640` — `fix(sw)`: route handler runtime (solución definitiva)
7. `455f87ca` — `fix(fase3e)`: corregir aserción Content-Type e2e

Los 4 commits canónicos del enunciado (fix sw / fix revalidacion / test / docs) se
cubrieron, con commits adicionales por hallazgos durante la validación real (proxy,
rewrite, route handler).

## 7. Deployment final

- **Deployment:** `justicia-verdadera-r8kk2ubn4-fonsi-roiget-s-projects.vercel.app`
- **Commit:** `455f87ca` (HEAD de main)
- **Estado:** `READY`, target production
- **Alias:** `https://www.pinedayasociadoshn.com`

## 8. Secretos y temporales

- `CRON_SECRET` creado en Vercel production (tipo Sensitive). **Nunca** en Git ni logs.
- Archivo temporal `/tmp/.fase3e_cron_secret` (permisos 600) usado durante la
  revalidación. **Pendiente de eliminación** (ver informe final).
- `.env.fase3e` temporal (env pull): eliminado tras uso.
- No se commiteó ningún secreto ni archivo temporal.

## 9. Riesgos pendientes

- **Revisión jurídica humana NO realizada** (explícito: no marcar como hecha).
- **Lote 2 NO iniciado** (explícito).
- El `CRON_SECRET` es ahora operativo; rotar si se sospecha compromiso
  (ver [`fase3e-revalidacion-produccion.md`](./fase3e-revalidacion-produccion.md)).

Plan de rollback: [`fase3e-rollback.md`](./fase3e-rollback.md)

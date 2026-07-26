# Fase 3E — Plan de rollback

**Fecha:** 2026-07-26
**Hash final Fase 3E:** `455f87ca`
**Hash inicial Fase 3E:** `0a2f65fd`

---

## Punto de retorno seguro

El commit anterior a Fase 3E es `0a2f65fd` (Fase 3D cerrada). Si Fase 3E introdujera
una regresión crítica no detectada, el rollback consiste en volver a ese commit:

```bash
git checkout main
git reset --hard 0a2f65fd
git push --force origin main   # solo en caso de emergencia; normalmente prohibido
```

**Importante:** el `--force` está prohibido por R19 salvo emergencia crítica. Antes de
considerarlo, evaluar los commits intermedios (cada uno es atómico y reversible
individualmente).

## Commits de Fase 3E (orden cronológico)

| Commit | Descripción | Reversión |
|--------|-------------|-----------|
| `4d53d058` | `fix(sw)`: plantilla + build-sw.mjs + rewrite + postbuild | `git revert 4d53d058` |
| `f327ac60` | `fix(revalidacion)`: allowlist + rate-limit + logging | `git revert f327ac60` |
| `3916ca2b` | `test(fase3e)`: scripts y e2e de validación | `git revert 3916ca2b` |
| `96d362f4` | `fix(proxy)`: permitir /api/revalidate | `git revert 96d362f4` |
| `7cf18f08` | `fix(fase3e)`: rewrite beforeFiles + detección aviso + allowlist landings | `git revert 7cf18f08` |
| `a7eea640` | `fix(sw)`: route handler runtime (solución definitiva) | `git revert a7eea640` |
| `455f87ca` | `fix(fase3e)`: corregir aserción Content-Type e2e | `git revert 455f87ca` |

Cada commit es reversible individualmente con `git revert <sha>` (crea un commit
nuevo que deshace el cambio, sin reescribir historia).

## Componentes y su rollback

### Service worker

**Estado Fase 3E:** `/sw.js` servido por route handler (`app/sw.js/route.ts`) que lee
`public/sw.template.js` e inyecta `NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID` en runtime.

**Rollback al estado Fase 3D:** Revertir `a7eea640` y `4d53d058`. Esto restaura
`public/sw.js` como archivo servido directamente (con el problema de que el build lo
modificaba). **No recomendado**: reintroduce el bug de determinismo.

**Rollback seguro (manteniendo el fix):** Si la route handler fallara en producción,
revertir solo `a7eea640` vuelve al esquema plantilla + `build-sw.mjs` + rewrite, que
funciona en local pero no en Vercel CDN. En ese caso, mejor reinstaurar el esquema
Fase 3D aceptando el `git restore` manual post-build.

### Endpoint /api/revalidate

**Estado Fase 3E:** con allowlist, rate-limit, logging, y excepción en proxy.

**Rollback:** Revertir `f327ac60`, `96d362f4`, `7cf18f08`. Esto restaura el endpoint
Fase 3D (sin allowlist ni rate-limit) y quita la excepción del proxy (el endpoint
volvería a dar 401 desde el proxy — **no recomendado**).

### CRON_SECRET en Vercel

**Estado Fase 3E:** creado en Vercel production (tipo Sensitive).

**Rollback (eliminar):**

```bash
echo "y" | vercel env rm CRON_SECRET production
```

Tras eliminarlo, el endpoint `/api/revalidate` devolverá 401 (no hay secret que
comparar). La ISR natural (`revalidate = 3600`) seguirá propagando cambios en ≤1h.

## Riesgos pendientes tras rollback

- Volver al estado Fase 3D reintroduce el bug de determinismo del SW (árbol sucio
  tras build).
- Quitar la excepción del proxy deja `/api/revalidate` inutilizable hasta que se
  restaure.
- Eliminar `CRON_SECRET` fuerza dependencia de la ISR natural (1h de latencia).

## Confirmación de no-regresión

Antes de cualquier rollback, ejecutar:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
git status --short   # debe estar vacío
PLAYWRIGHT_BASE_URL=https://www.pinedayasociadoshn.com npx playwright test e2e/fase3e-visual.spec.ts
node scripts/fase3e-validar-produccion.mjs   # 15/15 pass
```

Si todos pasan, no hay necesidad de rollback.

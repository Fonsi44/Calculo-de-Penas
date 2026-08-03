---
description: Comprueba readiness de release del estado actual: lint, typecheck, tests, build y validaciones de migraciones. No hace merge ni deploy.
agent: qa-release
---

Comprueba el readiness de release del estado actual del repositorio.
**No hagas merge ni deploy.**

Procedimiento:

1. `git status --short --branch` y `git log --oneline -10` (contexto).
2. Ejecuta la validación completa para cambios transversales:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run test`
   - `npm run build`
3. Ejecuta validaciones de migraciones reproducibles:
   - `npm run db:migrations:validate`
4. Si existe, ejecuta `npm run verify` como referencia del CI.
5. Para cada comando reporta: exit code, resultado (PASS/WARN/FAIL) y warnings.
6. Concluye con una recomendación honesta: READY / NO_READY (motivo).
7. No reduzcas tests ni ignores errores; los fallos preexistentes deben
   demostrarse comparando con el estado inicial.

Prohibido: merge, deploy, push y ejecución de migraciones en entornos remotos.

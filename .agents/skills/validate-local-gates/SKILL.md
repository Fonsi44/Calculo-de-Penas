---
name: validate-local-gates
description: Ejecución de gates de validación local del proyecto (lint, typecheck, tests seguros, build:ci) sin postbuild remoto. Usar para verificar que un cambio pasa las validaciones antes de informar.
license: proprietary
compatibility: opencode-vscode
---
# Gates de validación local — Pineda y Asociados

Ejecuta solo gates locales y seguros. **No ejecutar postbuild remoto ni
acciones con efectos externos.**

## Procedimiento

1. Leer `package.json` y detectar el gestor real (lockfile: `package-lock.json`
   → npm). No cambiar gestor ni lockfile.
2. Ejecutar, cuando existan:
   - `npm run lint`
   - `npm run typecheck` (o `npx tsc --noEmit`)
   - tests unitarios seguros (`npm run test` o `npx vitest <ruta>`)
   - `npm run build:ci` (NO `npm run build` si dispara postbuild remoto)
3. Para cada comando reportar: comando, exit code, resultado
   (PASS/FAIL/BLOCKED) y advertencias.

## Anti-patrones

- `npm run build` si el postbuild envía a IndexNow/remoto sin `--dry-run`.
- Ejecutar E2E que envíen formularios, correos, escriban DB o muten
  Preview/Production.
- Modificar tests o código para "poner el verde".

## Detenerse y pedir intervención

- Fallo no atribuible al cambio: documentar como preexistente con evidencia
  del estado inicial de Git.
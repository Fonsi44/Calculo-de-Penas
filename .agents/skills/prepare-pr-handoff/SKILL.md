---
name: prepare-pr-handoff
description: Preparación de handoff de PR (revisar diff, checks, propuesta de commit/PR) sin ejecutar commit, push, merge ni deploy. Usar al terminar un bloque de trabajo para dejar lista la entrega.
license: proprietary
compatibility: opencode-vscode
---
# Preparación de handoff de PR — Pineda y Asociados

Prepara la entrega de un bloque de trabajo **sin ejecutar acciones remotas ni
Git de escritura**.

## Procedimiento

1. Revisar el estado:
   - `git status --short --branch`
   - `git diff --name-status` y `git diff --check`
   - `git log --oneline -10` (contexto)
2. Revisar el diff completo (cambios intencionados, sin secretos, sin
   artefactos).
3. Comprobar checks locales pendientes (referencia: `npm run verify` o los
   gates de `validate-local-gates`).
4. Proponer (solo proponer) el/los mensaje(s) de commit y la estructura del
   PR: título, rama, resumen, pruebas, riesgos.

## Prohibido

- `git add`, `git commit`, `git push`, `git merge`, `git rebase`.
- Crear/modificar PR remoto, "Ready for review", releases, deploys.
- Modificar código de aplicación.

## Detenerse y pedir intervención

- Ejecutar cualquier paso de escritura Git o remoto: pedir autorización
  expresa y detenerse.
---
name: audit-read-only
description: Auditoría de solo lectura del proyecto (Git, PR, checks, secretos sin imprimir valores, hashes, clasificación PASS/FAIL/BLOCKED/NOT_VERIFIED). Usar cuando se pida inspeccionar sin modificar nada.
license: proprietary
compatibility: opencode-vscode
---
# Auditoría read-only — Pineda y Asociados

Inspección estricta de solo lectura. **Nunca editar, escribir, instalar ni
ejecutar acciones remotas.**

## Procedimiento

1. Estado Git (solo lectura):
   - `git status --short --branch`
   - `git rev-parse HEAD`
   - `git diff --check`
   - `git diff --name-status`
2. PR y checks (si aplica, con GitHub read-only):
   - metadatos del PR, estado de checks, commits incluidos.
3. Secretos: buscar patrones de secretos sin imprimir valores. Reportar solo
   ubicación y tipo (PRESENT/ABSENT/EMPTY/PLACEHOLDER/AUTHENTICATED/
   NOT_AUTHENTICATED).
4. Clasificar cada hallazgo: `PASS` / `FAIL` / `BLOCKED` / `NOT_VERIFIED`.

## Validaciones

- `git diff --check` sin errores.
- Sin cambios en el árbol (el trabajo debe quedar inalterado).

## Anti-patrones

- Imprimir valores de `.env*`, tokens, cadenas de conexión o cabeceras.
- `git add`, `git commit`, `git push`, `git restore`, `git clean`.
- Modificar archivos o ejecutar instalaciones.

## Detenerse y pedir intervención

- Necesidad de escritura o acción remota: detenerse y reportar.
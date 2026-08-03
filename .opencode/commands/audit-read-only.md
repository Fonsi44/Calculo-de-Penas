---
description: Auditoría de solo lectura (Git, PR, checks, secretos sin imprimir valores, clasificación PASS/FAIL/BLOCKED/NOT_VERIFIED).
agent: audit-read-only
subtask: true
---

Ejecuta una auditoría de **solo lectura** del estado actual del repositorio
como `audit-read-only`.

<objetivo>
$ARGUMENTS
</objetivo>

Procedimiento:

1. `git status --short --branch`, `git rev-parse HEAD`, `git diff --check`.
2. Si aplica, GitHub read-only: metadatos del repositorio/PR y checks.
3. Búsqueda de secretos sin imprimir valores (solo ubicación y tipo).
4. Clasifica cada hallazgo: `PASS` / `FAIL` / `BLOCKED` / `NOT_VERIFIED`.

Prohibido: editar archivos, `git add`/`commit`/`push`/`merge`/`reset`/
`clean`/`restore`, instalar dependencias, imprimir secretos y acciones
remotas mutables.
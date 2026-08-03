---
description: Prepara handoff de PR (diff, checks, propuesta de commits/PR) sin commit, push, merge ni deploy.
agent: pr-handoff
subtask: true
---

Prepara el handoff de la entrega actual como `pr-handoff`.

<contexto>
$ARGUMENTS
</contexto>

Procedimiento:

1. Revisa `git status --short --branch`, `git diff --name-status`,
   `git diff --check` y `git log --oneline -10`.
2. Revisa el diff completo (sin secretos, sin artefactos, sin cambios fuera
   de alcance).
3. Verifica gates locales (referencia: `validate-local-gates`).
4. Propone (solo propone) commits atómicos en español con prefijo (R7) y
   estructura del PR: título, rama, resumen, pruebas, riesgos.

Prohibido: `git add`/`commit`/`push`/`merge`/`rebase`, crear/modificar PR
remoto, "Ready for review", releases, deploys y editar archivos.
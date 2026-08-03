---
description: Implementación segura: lee AGENTS.md, revisa Git, presenta plan, espera aprobación, implementa, valida, revisa diff y se detiene antes de commit.
agent: implementation
subtask: true
---

Implementa de forma segura el objetivo indicado como `implementation`.

<objetivo>
$ARGUMENTS
</objetivo>

Procedimiento obligatorio:

1. Lee `AGENTS.md` completo.
2. Ejecuta `git status --short --branch` y registra los cambios locales
   preexistentes (preservarlos siempre).
3. Inspecciona los archivos implicados antes de editarlos (R1).
4. **Presenta el plan** y espera aprobación explícita antes de editar.
5. Implementa únicamente el alcance autorizado, con cambios pequeños y
   trazables (R7). No avances a otra fase.
6. Valida según `AGENTS.md` §4 (lint, typecheck, tests, build:ci según el
   tipo de cambio). No ejecutes postbuild remoto.
7. Revisa el diff final; verifica que los cambios preexistentes sigan
   intactos.
8. Entrega el informe en formato `AGENTS.md` §9 y **detente antes de
   commit/push/deploy**.

Denegado: commit, push, merge, rebase, deploy, Production, DB writes,
formularios reales, emails, modificar `.env.local` y secretos.
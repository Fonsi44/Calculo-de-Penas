---
description: Ejecuta el bloque de trabajo ordenado por ChatGPT como task-executor. Requiere el prompt/bloque como argumento. No avanza a otra fase y entrega el informe final en formato AGENTS.md §9.
agent: task-executor
---

Ejecuta el siguiente bloque de trabajo ordenado por el orquestador externo
(ChatGPT) como `task-executor`:

<block>
$ARGUMENTS
</block>

Procedimiento obligatorio:

1. Lee `AGENTS.md` completo.
2. Declara el modo: `AUDITORÍA`, `IMPLEMENTACIÓN` o `VERIFICACIÓN`.
3. Ejecuta `git status --short --branch` y registra los cambios locales
   preexistentes (no mezclarlos con este trabajo).
4. Inspecciona los archivos implicados antes de editarlos (R1). Divide el
   análisis entre subagentes (`repo-auditor`, `security-reviewer`,
   `backend-engineer`, `frontend-engineer`, `database-engineer`,
   `seo-geo-content`, `qa-release`, `docs-governance`) cuando aporte valor.
5. Implementa únicamente el alcance autorizado, con cambios pequeños y
   trazables (R7).
6. Ejecuta la validación proporcional según `AGENTS.md` §4.
7. **No avances a otra fase.**
8. Entrega el informe final en el formato `AGENTS.md` §9.

Prohibido: commit, push, merge, deploy, migraciones de producción y cambios de
modelo/proveedor sin autorización expresa del usuario.

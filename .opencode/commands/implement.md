---
description: Implementa un cambio concreto con alcance declarado. Requiere describir exactamente qué implementar y en qué archivos. Valida proporcionalmente según AGENTS.md §4.
agent: task-executor
---

Implementa el siguiente cambio, solo dentro del alcance declarado. No amplíes
el alcance ni avances a otra fase.

<alcance>
$ARGUMENTS
</alcance>

Procedimiento:

1. Declara el modo `IMPLEMENTACIÓN`.
2. Ejecuta `git status --short --branch`; registra cambios preexistentes.
3. Lee los archivos que vas a modificar (R1). Delega en el subagente adecuado
   (`backend-engineer`, `frontend-engineer`, `database-engineer`,
   `seo-geo-content`, `docs-governance`) cuando corresponda.
4. Implementa cambios pequeños y trazables (R7), respetando fuentes de verdad
   (R2), la separación de subsistemas (R22) y los archivos sensibles
   (`AGENTS.md` §7).
5. Valida según la matriz `AGENTS.md` §4 (lint + typecheck + pruebas del módulo;
   suite completa para cambios transversales).
6. Entrega el informe con: archivos modificados, motivo, validación y riesgos.

Prohibido: commit, push, merge, deploy y migraciones sin autorización expresa.

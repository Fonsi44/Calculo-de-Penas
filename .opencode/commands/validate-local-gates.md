---
description: Ejecuta gates de validación local (lint, typecheck, tests seguros, build:ci) sin postbuild remoto ni modificación de tests.
agent: test-validator
subtask: true
---

Ejecuta los gates de validación local del proyecto como `test-validator`.

<objetivo>
$ARGUMENTS
</objetivo>

Procedimiento:

1. Lee `package.json` y detecta el gestor por lockfile (npm).
2. Ejecuta, cuando existan: `npm run lint`, `npm run typecheck`,
   `npm run test` (o `npx vitest <ruta>`), `npm run build:ci`.
   **Nunca** `npm run build` si dispara postbuild remoto.
3. Reporta por comando: exit code, resultado (PASS/FAIL/BLOCKED) y warnings.

Prohibido: modificar tests/código/config, E2E con formularios/emails/DB,
instalaciones y postbuild remoto.
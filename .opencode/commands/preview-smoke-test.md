---
description: Smoke test de navegación con Playwright en localhost o Preview (renderizado, responsive, accesibilidad, consola, enlaces). Sin formularios, DB ni email.
agent: preview-validator
subtask: true
---

Ejecuta un smoke test de navegación como `preview-validator`.

<url>
$ARGUMENTS
</url>

Procedimiento:

1. Carga la URL en localhost o Preview (nunca Production), con aprobación.
2. Verifica renderizado, responsive (varios viewports), accesibilidad
   básica, consola sin errores y enlaces internos.
3. Reporta PASS/FAIL/BLOCKED con evidencia (screenshots, errores de consola).

Prohibido: formularios reales, emails, DB writes, usuarios reales, acciones
mutables en Production/Preview y navegación con perfil personal.
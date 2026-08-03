---
description: Valida la UI pública (accesibilidad, rendimiento, consola, hidratación) de una ruta o componente. Usa frontend-engineer y las suites a11y/rendimiento del proyecto.
agent: frontend-engineer
---

Valida la interfaz indicada. No rediseñes la web pública; esta es una
verificación.

<target>
$ARGUMENTS
</target>

Procedimiento:

1. Localiza la ruta/componente objetivo y su contexto.
2. Revisa accesibilidad (teclado, foco, contraste, semántica), estados
   loading/error/empty, hidratación y consola.
3. Verifica tokens de diseño canónicos (R16) y las reglas R14/R15.
4. Ejecuta según aplica:
   - `npm run lint` + `npx tsc --noEmit`
   - `npm run a11y:public-contract` (si la ruta es pública)
   - `npm run verify:chunks` (si hay cambio de bundle)
5. Reporta PASS/WARN/FAIL y evidencia (errores de consola, warnings).

Prohibido: rediseño visual, introducir dependencias UI nuevas, mocks.

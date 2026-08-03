---
description: Verifica el estado de un cambio o del repositorio. Selecciona la validación proporcional según AGENTS.md §4; no ejecuta siempre la suite completa.
agent: qa-release
---

Verifica el estado solicitado usando la matriz de validación proporcional de
`AGENTS.md` §4. No ejecutes siempre la suite completa; elige la validación
mínima según el tipo de cambio.

<target>
$ARGUMENTS
</target>

Procedimiento:

1. Identifica el tipo de cambio (documentación / código localizado /
   transversal / SEO estático / datos live).
2. Ejecuta la validación mínima correspondiente:
   - Documentación: formato, enlaces (`npm run docs:links`), coherencia.
   - Código localizado: `npm run lint` + `npx tsc --noEmit` + pruebas del módulo.
   - Transversal/seguridad/auth/DB/config: lint + tsc + `npm run test` +
     `npm run build`.
   - SEO estático: `npm run build` + validadores locales.
3. Para cada comando reporta: comando, exit code, resultado (PASS/WARN/FAIL) y
   advertencias.
4. No reduzcas tests ni ignores errores. Los fallos preexistentes deben
   demostrarse comparando con el estado inicial.
5. No hagas merge, deploy ni modifiques código.

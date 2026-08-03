---
description: Ejecuta el doctor del entorno OpenCode (npm run opencode:doctor) y comprueba agentes, skills, comandos, configuración, MCP, LSP, binarios y scripts. Solo lectura.
agent: task-executor
---

Comprueba el estado del entorno OpenCode del proyecto. **Solo lectura.**

Procedimiento:

1. Ejecuta el doctor del entorno:
   - `npm run opencode:doctor`
   - Si falla, `node scripts/opencode-doctor.mjs` para ver el detalle.
2. Ejecuta diagnósticos de OpenCode:
   - `opencode --version`
   - `opencode debug config`
   - `opencode agent list`
   - `opencode mcp list`
   - `opencode debug skill`
3. Verifica agentes y skills en `.opencode/agents/` y `.opencode/skills/`
   (frontmatter válido, sin IDs duplicados).
4. Verifica comandos en `.opencode/commands/` (sin pisar built-ins).
5. Verifica binarios opcionales (`rg`, `fd`, `jq`, `gitleaks`, `actionlint`,
   `shellcheck`) y scripts npm requeridos.
6. Comprueba ausencia de secretos en `.opencode/**`.
7. Reporta por categoría: PASS / WARN / FAIL / NOT_APPLICABLE /
   RESTART_REQUIRED.

Prohibido: modificar configuración, instalar dependencias o ejecutar comandos
con efectos.

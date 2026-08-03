# OpenCode — Entorno del proyecto (Pineda y Asociados)

Guía operativa de la configuración de OpenCode para este repositorio. Para el
protocolo de trabajo, ver `AGENTS.md` (canónico).

## Arquitectura

```
opencode.jsonc            → configuración canónica (permisos, LSP, MCP)
.opencode/agents/         → agentes (task-executor + subagentes)
.opencode/skills/         → skills bajo demanda (cada una en su carpeta)
.opencode/commands/       → comandos reutilizables (/comando)
scripts/opencode-doctor.mjs → doctor del entorno (npm run opencode:doctor)
scripts/start-opencode.ps1  → wrapper PowerShell 7 (macOS) de arranque
```

Jerarquía de trabajo: **ChatGPT (orquestador) → usuario → task-executor
(ejecutor)**. El agente ejecuta el bloque recibido y **se detiene** sin avanzar
a otra fase; el informe final se devuelve a ChatGPT.

## Agentes

| Agente | Modo | Rol |
|--------|------|-----|
| `task-executor` | primary | Ejecuta el bloque ordenado por ChatGPT; declara modo; delega; valida; entrega informe. |
| `repo-auditor` | subagent | Auditoría de arquitectura/deuda (solo lectura). |
| `backend-engineer` | subagent | Rutas API, servicios, Zod, auth, seguridad. |
| `frontend-engineer` | subagent | UI Next.js/React/Tailwind, a11y, tokens canónicos. |
| `database-engineer` | subagent | Neon/Drizzle: schema, migraciones aditivas (sin ejecutarlas). |
| `seo-geo-content` | subagent | SEO/GEO/metadata/JSON-LD/contenido (jurídico: con fuentes + revisión humana). |
| `security-reviewer` | subagent | Revisión de seguridad (solo lectura). |
| `qa-release` | subagent | Validación proporcional; readiness (sin merge/deploy). |
| `docs-governance` | subagent | Documentación canónica (AGENTS, README, CHANGELOG, ADR). |

## Skills

Cargables bajo demanda desde `.opencode/skills/<nombre>/SKILL.md`:

`project-governance`, `repository-exploration`, `nextjs-frontend`,
`backend-api-security`, `neon-drizzle`, `testing-quality`, `seo-geo-jsonld`,
`legal-content-safety`, `performance-accessibility`, `git-release-safety`,
`documentation-governance`, `incident-debugging`.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `/task` | Ejecuta un bloque del orquestador como task-executor. |
| `/audit` | Auditoría read-only (repo-auditor + security-reviewer). |
| `/implement` | Implementa un cambio con alcance declarado. |
| `/verify` | Validación proporcional según `AGENTS.md` §4. |
| `/seo-check` | Valida SEO estático de una página/ruta. |
| `/ui-check` | Valida UI (a11y, rendimiento, consola, hidratación). |
| `/release-check` | Readiness de release (sin merge/deploy). |
| `/handoff` | Genera el informe para ChatGPT (formato `AGENTS.md` §9). |
| `/environment-check` | Doctor del entorno + diagnósticos OpenCode. |

## Permisos

Política en `opencode.jsonc` (`permission`): lectura y validación automáticas;
escritura/git/instalaciones con aprobación; push/merge/rebase/reset/clean/
deploy/migraciones denegados. Los agentes read-only (`repo-auditor`,
`security-reviewer`, `qa-release`) no editan. Sin `--auto` como comportamiento
normal.

## MCP

Siete servidores, todos **oficiales** (sin Playwright MCP, filesystem, git
genérico, postgres genérico, memory, sequential-thinking, puppeteer ni
servidores comunitarios). Política de mínimo contexto: las tools de
`github`, `neon`, `vercel`, `resend` y `semgrep` están **ocultas
globalmente** (`tools` en `opencode.jsonc`) y se re-habilitan solo en los
agentes autorizados (`.opencode/agents/*.md`, clave `tools`). `context7` y
`chrome-devtools` quedan disponibles globalmente.

| Servidor | Tipo | URL / comando | Estado | Read-only | OAuth |
|----------|------|---------------|--------|-----------|-------|
| `context7` | remote | `https://mcp.context7.com/mcp` | **habilitado** | sí (docs) | opcional |
| `chrome-devtools` | local | `npx --yes chrome-devtools-mcp@1.6.0 --slim --headless --isolated --no-usage-statistics --no-performance-crux` | **habilitado** | — | no |
| `github` | remote | `https://api.githubcopilot.com/mcp/` | **habilitado** | `X-MCP-Readonly` + denies | PAT (`oauth: false`) |
| `neon` | remote | `https://mcp.neon.tech/mcp?readonly=true` | **habilitado** | sí (`x-read-only` + `?readonly=true`) | **✓ completado** |
| `vercel` | remote | `https://mcp.vercel.com` | **habilitado** | denies por patrón | **✓ completado** |
| `resend` | remote | `https://mcp.resend.com/mcp` | **habilitado** | denies por patrón | **✓ completado** |
| `semgrep` | local | `semgrep mcp` | **habilitado** | escaneo, sin autofix | no |

Razones y decisiones:

- **`github`:** habilitado vía PAT personal — el servidor no soporta Dynamic
  Client Registration (RFC 7591) ni tiene cliente pre-registrado para
  OpenCode, así que se autentica con `oauth: false` + `Authorization: Bearer
  {env:GITHUB_PERSONAL_ACCESS_TOKEN}` (método oficial para OpenCode; el token
  vive solo en el entorno del usuario, nunca en el repo). Read-only reforzado:
  `X-MCP-Readonly` server-side + denies de escritura.
- **`neon`:** autenticado por OAuth (clientId pre-registrado de OpenCode
  aceptado). Read-only garantizado por `?readonly=true` + `x-read-only`
  server-side: las tools mutables no se registran (verificado en el endpoint
  oficial `/api/list-tools?readonly=true`, 21 tools, sin create/delete).
- **`vercel`:** autenticado por OAuth — el flujo oficial fue aceptado pese a
  que la doc pública no lista OpenCode. Inventario verificado (33 tools):
  lectura (`get_*`, `list_*`, `search_*`, `web_fetch_*`, `get_web_analytics`)
  permitida solo en agentes autorizados; **13 tools de escritura denegadas
  por patrón** (`vercel_buy_*`, `vercel_deploy_*`, `vercel_update_*`,
  `vercel_add_*`, `vercel_change_*`, `vercel_edit_*`, `vercel_import-*`,
  `vercel_reply_*`) — incluye compras, deploys y protección de deployment.
- **`resend`:** autenticado por OAuth y **habilitado** con política
  deny-by-default para envíos en despacho legal (revisión humana explícita
  realizada). Inventario verificado (91 tools): lectura `get_*`/`list_*`;
  **53 tools de escritura denegadas por patrón** (`resend_create-*`,
  `send-*`, `compose-*`, `cancel-*`, `add-*`, `batch-*`, `remove-*`,
  `update-*`, `connect-*`, `disconnect-*`, `duplicate-*`, `publish-*`,
  `manage-*`, `verify-*`, `revoke-*`).
- **`semgrep`:** instalado de forma aislada y segura con
  `uv tool install --python 3.12 semgrep` (v1.172.0 en `~/.local/bin/semgrep`;
  uv gestiona su propio Python 3.12, fuera del proyecto). Sin autofix y sin
  login (`SEMGREP_APP_TOKEN` no configurado). Es apoyo, no sustituye
  `npm run lint`/`typecheck`/`test`/`verify`.

### Reglas de uso

- **Context7:** úsalo cuando necesites documentación actual o específica de
  versión para una librería, framework o API. **No** lo uses para consultar
  código interno del repositorio.
- **GitHub:** solo lectura (server-side `X-MCP-Readonly`). Nunca crear
  issues/comentarios/PRs, nunca push, nunca editar archivos remotos, nunca
  releases ni cambios de workflows.
- **Neon:** solo lectura (dos vías server-side). Prohibido crear/eliminar
  proyectos, ramas, bases de datos, roles, migraciones, SQL de escritura,
  seeds, restauraciones o modificar producción. No mostrar cadenas de conexión
  completas ni credenciales.
- **Vercel:** solo consulta (equipos, proyectos, deployments, logs, errores,
  Web Analytics, docs). Denegado por patrón: compras, deploys, protección de
  deployment y mutaciones de toolbar.
- **Resend:** solo consulta de logs/dominios/plantillas/webhooks (get_*/list_*);
  denegado por patrón todo envío y toda creación/modificación.
- **Semgrep:** apoyo complementario; no sustituye `npm run lint`,
  `npm run typecheck`, `npm run test` ni `npm run verify`. Sin autofix.
- Verificación: `opencode mcp list`, `opencode mcp auth list`,
  `opencode mcp debug <servidor>`, `npm run opencode:doctor`.
- El CLI carga la configuración al invocarse; el **TUI de OpenCode** necesita
  **reinicio** para aplicar cambios de `opencode.jsonc`/agentes.

### Acceso por agente (matriz MCP)

`✓` = re-habilitado para ese agente (`tools` en frontmatter). `–` = oculto.
Los siete servidores están habilitados; las tools de github, neon, vercel,
resend y semgrep siguen ocultas globalmente (`tools` en `opencode.jsonc`) y
solo se activan por agente según la matriz.

| Agente | context7 | chrome-devtools | github | neon | vercel | resend | semgrep |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `task-executor` | ✓ | ✓ | ✓ | – | – | – | – |
| `repo-auditor` | ✓ | – | ✓ | ✓ | ✓ | – | ✓ |
| `backend-engineer` | ✓ | – | ✓ | ✓ | – | ✓ | ✓ |
| `frontend-engineer` | ✓ | ✓ | ✓ | – | ✓ | – | – |
| `database-engineer` | ✓ | – | ✓ | ✓ | – | – | ✓ |
| `security-reviewer` | – | ✓ | ✓ | ✓ | – | ✓ | ✓ |
| `qa-release` | – | ✓ | ✓ | – | ✓ | – | ✓ |
| `seo-geo-content` | ✓ | ✓ | – | – | ✓ | – | – |
| `docs-governance` | ✓ | – | ✓ | – | – | – | – |

No ampliar estos permisos sin una necesidad demostrada (regla del
orquestador).

## LSP

Built-ins habilitados para TypeScript y ESLint (usan las dependencias del
proyecto); deshabilitados `bash`, `yaml-ls`, `deno` y `oxlint` para evitar
auto-instalación de binarios extra. Estado real tras reiniciar OpenCode:
`opencode debug lsp diagnostics <archivo>`.

## Troubleshooting

- **Config inválida / OpenCode no arranca:** desde la raíz, ejecutar
  `OPENCODE_DISABLE_PROJECT_CONFIG=1 opencode` para arrancar solo con
  configuración global y corregir `opencode.jsonc`.
- **Cambios de config no efectivos:** reiniciar OpenCode (la configuración se
  carga una sola vez al arrancar).
- **Doctor:** `npm run opencode:doctor` (0 FAIL = entorno sano; WARN no falla).

## Actualización segura

- Modificar `opencode.jsonc`, agentes, skills y comandos con cambios pequeños.
- Validar con `npm run opencode:doctor` + `opencode debug config` +
  `git diff --check`.
- No duplicar configuración entre este proyecto y `~/.config/opencode`.
- No guardar secretos ni tokens en la configuración.

## Handoff a ChatGPT

Cuando termine un bloque, el agente entrega el informe en el formato de
`AGENTS.md` §9 y se detiene. El usuario envía ese informe a ChatGPT, que decide
el siguiente prompt.

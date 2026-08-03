# PROMPT MAESTRO — CONFIGURAR OPENCODE Y VS CODE PARA JUSTICIA VERDADERA

## Rol

Actúa como responsable senior de Developer Experience, seguridad y configuración de agentes.

Debes crear y dejar operativo todo el entorno de trabajo de **Justicia Verdadera** para trabajar principalmente con **OpenCode + DeepSeek V4** dentro de VS Code.

No te limites a explicar: inspecciona el sistema, instala únicamente lo que falte, fusiona configuraciones existentes, valida cada componente y entrega un informe reproducible.

---

## 1. Contexto

```text
Proyecto: Justicia Verdadera / Pineda y Asociados
Ruta: /Users/fonsi/Documents/Justicia Verdadera
Sistema: macOS
Shell obligatoria: PowerShell 7
Repositorio: Fonsi44/Calculo-de-Penas
Rama esperada: feat/seo-geo-master-implementation
Stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Neon PostgreSQL
- Drizzle ORM
- Vercel
- Resend
- Vercel Blob
- Vercel Cron
- Vitest
- Playwright
```

El propietario trabaja siempre con PowerShell, también en macOS.

Todos los comandos deben ejecutarse desde PowerShell o mediante:

```powershell
pwsh -NoProfile -Command '<comando>'
```

No entregues comandos escritos únicamente para Bash ni uses `export`, `source`, `[[ ]]`, `for ...; do`, `rm -rf` o tuberías Bash como interfaz principal.

---

## 2. Seguridad y límites

Antes de cambiar nada:

```powershell
Set-Location "/Users/fonsi/Documents/Justicia Verdadera"
git rev-parse HEAD
git rev-parse --abbrev-ref HEAD
git status --short --untracked-files=all
git diff --check
```

Preserva todos los cambios locales.

No modificar, descartar, restaurar, incluir en staging ni sobrescribir:

```text
app/(public)/blog/page.tsx
```

No borrar ni mover prompts, autorizaciones, informes, PDF, archivos no rastreados, documentación existente ni evidencias de auditorías anteriores.

No ejecutar:

```text
git reset --hard
git clean
git checkout -- .
git restore .
git add .
git add -A
git commit
git push
git merge
git rebase
```

No se autoriza:

```text
commit
push
merge
Ready for review
modificar PR
deployments
cambios en main
cambios en PR #23
```

### Secretos

No leas, imprimas, copies, registres ni resumas valores de:

```text
.env
.env.local
API keys
tokens
JWT secrets
cadenas de conexión
webhook secrets
credenciales OAuth
cookies
cabeceras Authorization
```

Solo puedes informar:

```text
PRESENT
ABSENT
EMPTY
PLACEHOLDER
AUTHENTICATED
NOT_AUTHENTICATED
```

No escribas credenciales en archivos del repositorio.

Las credenciales de DeepSeek se configuran mediante el almacenamiento oficial de autenticación de OpenCode.

Las credenciales OAuth de MCP se almacenan mediante OpenCode.

`.env.local` se considera `UNTRUSTED`: no modificarlo ni usarlo para conectarse a Production.

### Servicios

No realizar mutaciones en Vercel, Neon, Resend, Cloudflare, GitHub, Preview, Production, bases de datos, webhooks, formularios ni correo.

Neon solo puede orientarse a Preview/Staging. Production no debe quedar accesible para los agentes.

### MCP prohibidos

No instalar:

```text
Memory MCP
Filesystem MCP
Fetch MCP
Sequential Thinking MCP
MCP no oficiales
```

No instalar extensiones no oficiales de DeepSeek, GLM, Codex o “Copilot++”.

---

## 3. Documentación oficial obligatoria

Consulta y adapta la configuración a la versión instalada:

```text
https://opencode.ai/docs
https://opencode.ai/docs/config/
https://opencode.ai/docs/providers
https://opencode.ai/docs/permissions
https://opencode.ai/docs/agents
https://opencode.ai/docs/commands/
https://opencode.ai/docs/skills
https://opencode.ai/docs/mcp-servers/
https://opencode.ai/docs/rules/
https://github.com/upstash/context7
https://github.com/github/github-mcp-server
https://github.com/github/github-mcp-server/blob/main/docs/server-configuration.md
https://github.com/microsoft/playwright-mcp
https://vercel.com/docs/agent-resources/vercel-mcp
https://neon.com/docs/ai/neon-mcp-server
https://neon.com/docs/ai/connect-mcp-clients-to-neon
https://code.visualstudio.com/docs/agent-customization/agent-skills
```

OpenCode estable y OpenCode v2 pueden usar formatos distintos. Detecta la versión y usa exclusivamente su sintaxis válida.

---

## 4. Inventario inicial

Desde PowerShell, detecta:

```text
pwsh
code
opencode
node
npm
npx
git
gh
vercel
docker
```

Para cada herramienta informa:

```text
FOUND
PATH
VERSION
```

No actualices herramientas instaladas.

Si falta una imprescindible, usa solo el método oficial, sin `sudo`. Si requiere permisos administrativos, solicita intervención humana.

Ejecuta:

```powershell
opencode --version
opencode auth list
opencode models deepseek --refresh
opencode mcp list
opencode mcp auth list
```

No muestres credenciales.

Determina:

```text
OPENCODE_VERSION
OPENCODE_CONFIG_FORMAT
DEEPSEEK_AUTH_STATUS
DEEPSEEK_AVAILABLE_MODELS
CURRENT_DEFAULT_MODEL
CURRENT_MCP_SERVERS
```

No inventes el identificador de DeepSeek V4. Usa el que devuelva `opencode models deepseek --refresh`.

Si aparecen V4 Pro y V4 Flash:

```text
V4 Pro: implementación compleja
V4 Flash: documentación y tareas rápidas
```

Si DeepSeek no está autenticado, ejecuta `opencode auth login`, selecciona DeepSeek y detente para que el propietario introduzca la API key. No leas ni registres la pulsación.

Inspecciona:

```text
opencode.json
opencode.jsonc
AGENTS.md
CLAUDE.md
.vscode/settings.json
.vscode/extensions.json
.vscode/mcp.json
.github/copilot-instructions.md
.github/instructions/
.github/skills/
.agents/skills/
.opencode/agents/
.opencode/commands/
.opencode/skills/
~/.config/opencode/opencode.json
~/.config/opencode/opencode.jsonc
~/.config/opencode/AGENTS.md
```

No sobrescribas configuraciones existentes.

Antes de modificarlas crea una copia en:

```text
/tmp/justicia-verdadera-opencode-setup-<UTC_TIMESTAMP>/
```

No copies `.env*`, auth.json, mcp-auth.json, tokens ni historiales.

---

## 5. Extensiones de VS Code

Primero ejecuta:

```powershell
code --list-extensions
```

Instala solo las ausentes:

```text
GitHub.copilot
GitHub.copilot-chat
OpenAI.chatgpt
dbaeumer.vscode-eslint
esbenp.prettier-vscode
EditorConfig.EditorConfig
usernamehw.errorlens
eamodio.gitlens
bradlc.vscode-tailwindcss
ms-playwright.playwright
vitest.explorer
databricks.neon-local-connect
redhat.vscode-yaml
dotenv.dotenv-vscode
```

Usa:

```powershell
code --install-extension "<identificador>"
```

No reinstales extensiones presentes ni instales duplicados.

No instalar sin autorización separada:

```text
ms-ossdata.vscode-pgsql
```

Crea o fusiona `.vscode/extensions.json` con esas recomendaciones.

Crea o fusiona `.vscode/settings.json` sin borrar preferencias no relacionadas.

Configura solo claves confirmadas por la versión instalada:

```jsonc
{
  "terminal.integrated.defaultProfile.osx": "PowerShell",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "testing.automaticallyOpenTestResults": "openOnTestFailure",
  "neon.mcpServer.autoConfigEnabled": false,
  "neon.mcpServer.readOnlyMode": true
}
```

Configura también ocultación visual de secretos de Dotenv y exclusión de `.env*` de búsquedas, solo si verificas los nombres reales de las opciones.

No habilites auto-commit, auto-push ni auto-save agresivo.

Si `.editorconfig` no existe, créalo con:

```text
UTF-8
LF
final newline
2 espacios para JS/TS/JSON/YAML
4 espacios para PowerShell
sin espacios finales
```

No reformatees masivamente el repositorio.

---

## 6. Configuración central de OpenCode

Usa configuración específica del proyecto.

Prefiere `opencode.jsonc` si no existe una configuración previa. Si existe `opencode.json`, conserva el formato salvo migración justificada por la documentación oficial.

No mantengas dos configuraciones contradictorias.

Incluye:

```json
"$schema": "https://opencode.ai/config.json"
```

Configura como modelo predeterminado el identificador exacto de DeepSeek V4 detectado, con formato `provider/model`.

Si V4 no aparece:

```text
MODEL_CONFIGURATION = BLOCKED
```

No sustituyas silenciosamente por otro modelo.

Configura:

```json
"share": "disabled"
```

Configura `plan` como agente predeterminado read-only.

Configura instrucciones reutilizando:

```text
AGENTS.md
.github/copilot-instructions.md
.github/instructions/*.instructions.md
```

Solo añade rutas compatibles con la versión instalada.

---

## 7. Permisos de OpenCode

Usa la sintaxis oficial de `permission`.

Principio:

```text
lectura segura = allow
escritura local = ask
acción remota o destructiva = deny
```

Global:

```text
edit = ask
write = ask
webfetch = ask
skill = allow
```

Permite solo validaciones locales y Git read-only:

```text
git status*
git diff*
git log*
git show*
git rev-parse*
git branch --show-current*
git ls-files*
git check-ignore*
npm run lint*
npm run typecheck*
npm run build:ci*
npm test*
npx vitest*
opencode --version*
opencode models*
opencode mcp list*
opencode mcp auth list*
code --list-extensions*
```

Requiere aprobación:

```text
npm ci*
npm install*
npx ctx7 setup*
opencode auth login*
opencode mcp auth*
code --install-extension*
edición de archivos*
inicio de servidor local*
Playwright con navegación real*
```

Deniega:

```text
git commit*
git push*
git merge*
git rebase*
git reset --hard*
git clean*
git checkout -- *
git restore .*
vercel deploy*
vercel --prod*
vercel env add*
vercel env rm*
vercel env pull*
neonctl create*
neonctl delete*
resend*
rm -rf*
Remove-Item * -Recurse*
sudo*
chmod 777*
impresión de .env*
```

MCP:

```text
context7_* = allow
github_* = allow
playwright_* = ask
vercel_* = ask
neon_* = ask
```

GitHub debe ser read-only.

---

## 8. MCP oficiales

Configura solo:

```text
Context7
GitHub MCP oficial read-only
Playwright MCP oficial
Vercel MCP oficial
Neon MCP oficial
```

Usa la estructura exacta de la versión instalada de OpenCode.

### Context7

```text
URL: https://mcp.context7.com/mcp
```

Usa `CONTEXT7_API_KEY` externamente o:

```powershell
npx ctx7 setup --opencode
```

Antes de permitir que el instalador modifique configuración:

1. copia a `/tmp`;
2. inspecciona el diff;
3. fusiona solo la entrada necesaria;
4. elimina duplicados;
5. no dejes credenciales literales.

### GitHub MCP

Usa el servidor oficial y configura:

```text
read-only = true
toolsets:
- context
- repos
- pull_requests
- actions
- code_security
- secret_protection, si está disponible
```

No habilites escritura, releases, gists ni modificación de PR.

Autentica mediante:

```powershell
opencode mcp auth github
```

No introduzcas PAT en archivos.

### Playwright MCP

Servidor oficial local:

```text
npx -y @playwright/mcp@latest
```

Timeout:

```text
30000 ms
```

Uso permitido:

```text
localhost
Preview read-only
responsive
accesibilidad
consola
enlaces
```

Prohibido:

```text
formularios reales
emails
DB writes
usuarios reales
acciones mutables en Production
```

### Vercel MCP

```text
URL: https://mcp.vercel.com
OAuth: habilitado
```

Autentica:

```powershell
opencode mcp auth vercel
```

Permite solo lectura de documentación, proyectos, deployments existentes, logs y estado.

No permitir deploy, promote, rollback, variables, dominios ni Production.

### Neon MCP

```text
URL: https://mcp.neon.tech/mcp
OAuth: habilitado
```

Autentica:

```powershell
opencode mcp auth neon
```

Después:

1. lista proyectos sin cadenas de conexión;
2. identifica Preview/Staging;
3. no selecciones Production;
4. no ejecutes SQL;
5. no crees ramas;
6. no cambies esquema;
7. no leas PII.

Si no puedes garantizar separación:

```text
NEON_MCP_ENABLED = false
NEON_MCP_STATUS = BLOCKED_BY_SCOPE
```

Valida:

```powershell
opencode mcp list
opencode mcp auth list
```

Para cada MCP informa:

```text
CONFIGURED
ENABLED
AUTHENTICATED
CONNECTED
READ_ONLY_OR_APPROVAL_GATED
ERROR
```

---

## 9. AGENTS.md

Crea o mejora `AGENTS.md`, fusionando lo existente.

Incluye de forma concisa:

```text
- propósito de Justicia Verdadera;
- Next.js, TypeScript, Neon, Drizzle, Vercel y Resend;
- separación web pública / SGIE / Admin;
- scripts reales detectados en package.json;
- PowerShell siempre;
- no secretos;
- no modificar .env.local;
- no Production;
- no formularios reales;
- no emails;
- no DB writes;
- no commit/push/merge/deploy sin autorización literal;
- preservar cambios locales;
- no afectar la web pública al trabajar en SGIE/Admin;
- no registro público;
- alta de usuarios desde Admin;
- primera consulta del bufete realmente gratuita;
- usar “bufete”, nunca “buffet”;
- no enviar contratos automáticamente;
- cambios pequeños, verificables y con tests;
- no afirmar validaciones no ejecutadas.
```

Flujo:

```text
1. inspeccionar;
2. planificar;
3. pedir autorización;
4. implementar;
5. ejecutar gates;
6. revisar diff;
7. informar;
8. detenerse antes de commit/push/deploy.
```

No incluyas estados temporales que queden obsoletos.

---

## 10. Instrucciones para VS Code

Crea o fusiona:

```text
.github/copilot-instructions.md
```

Debe apuntar a `AGENTS.md`, reiterar PowerShell y seguridad, sin duplicar todo el contenido.

Crea:

```text
.github/instructions/typescript.instructions.md
.github/instructions/tests.instructions.md
.github/instructions/docs.instructions.md
.github/instructions/security.instructions.md
```

Usa frontmatter `applyTo` válido.

Alcances:

```text
TypeScript: **/*.{ts,tsx}
Tests: **/*.{test,spec}.{ts,tsx}
Docs: **/*.md
Security: app/api/**,lib/**,middleware.ts,next.config.*
```

---

## 11. Skills portables

Usa una única ubicación compatible con OpenCode y VS Code:

```text
.agents/skills/
```

No dupliques skills en `.github/skills` y `.opencode/skills`.

Crea:

```text
.agents/skills/audit-read-only/SKILL.md
.agents/skills/validate-local-gates/SKILL.md
.agents/skills/preview-smoke-test/SKILL.md
.agents/skills/prepare-pr-handoff/SKILL.md
```

Frontmatter:

```yaml
---
name: nombre-exacto
description: descripción clara
license: proprietary
compatibility: opencode-vscode
---
```

### audit-read-only

Inspección Git, PR, checks, secretos sin imprimir valores, hashes y clasificación PASS/FAIL/BLOCKED/NOT_VERIFIED.

### validate-local-gates

Leer `package.json`, detectar gestor, ejecutar lint, typecheck, tests seguros y build:ci; evitar postbuild remoto.

### preview-smoke-test

Playwright en localhost o Preview; navegación, responsive, accesibilidad, consola y enlaces; sin formularios, DB ni email.

### prepare-pr-handoff

Revisar diff, checks y preparar commit/PR propuestos; sin commit, push, Ready, merge ni deploy.

Valida que OpenCode descubra las cuatro.

---

## 12. Agentes de OpenCode

Crea:

```text
.opencode/agents/implementation.md
.opencode/agents/audit-read-only.md
.opencode/agents/test-validator.md
.opencode/agents/security-review.md
.opencode/agents/preview-validator.md
.opencode/agents/pr-handoff.md
```

Usa el ID real de DeepSeek V4.

### implementation

```text
mode: primary
edit: ask
terminal: ask
```

Presenta plan antes de editar. Deniega commit, push, merge, deploy, Production, DB writes, formularios y email.

### audit-read-only

```text
mode: subagent
edit: deny
write: deny
```

Puede usar GitHub read-only, Context7 y Git read-only.

### test-validator

```text
mode: subagent
edit: deny
```

Ejecuta gates seguros sin modificar tests.

### security-review

```text
mode: subagent
edit: deny
```

Revisa auth, CSRF, Turnstile, CSP, rate limit, logs, PII, secretos, webhooks y DB boundaries.

### preview-validator

```text
mode: subagent
edit: deny
```

Puede usar Playwright con aprobación, sin formularios ni emails.

### pr-handoff

```text
mode: subagent
edit: deny
```

Prepara handoff sin acciones remotas.

Valida:

```powershell
opencode agent list
```

---

## 13. Comandos de OpenCode

Crea:

```text
.opencode/commands/audit-read-only.md
.opencode/commands/validate-local-gates.md
.opencode/commands/preview-smoke-test.md
.opencode/commands/prepare-pr-handoff.md
.opencode/commands/safe-implement.md
```

Usa frontmatter oficial:

```yaml
---
description: ...
agent: ...
subtask: true
---
```

Comandos:

```text
/audit-read-only
/validate-local-gates
/preview-smoke-test
/prepare-pr-handoff
/safe-implement <objetivo>
```

`/safe-implement` debe leer AGENTS.md, revisar Git, presentar plan, esperar aprobación, implementar, validar, revisar diff y detenerse antes de commit.

No uses interpolación shell automática en los prompts.

---

## 14. Dependencias

Detecta el gestor mediante lockfiles.

No cambies el gestor ni el lockfile.

Si `node_modules` está presente y el proyecto compila, no reinstales.

Si falta, informa y solicita aprobación antes de usar una instalación reproducible (`npm ci`, `pnpm install --frozen-lockfile` o equivalente).

No ejecutes postbuild remoto. Usa `build:ci` cuando exista.

---

## 15. Documentación del entorno

Crea:

```text
.opencode/README.md
```

Explica:

```text
- versión de OpenCode;
- modelo DeepSeek configurado;
- inicio desde PowerShell;
- agentes;
- comandos;
- skills;
- MCP;
- OAuth pendiente;
- límites de seguridad;
- cómo desactivar Neon/Vercel;
- actualización segura;
- resolución de problemas.
```

No incluyas secretos.

---

## 16. Validación

Valida:

```text
JSON/JSONC correcto
YAML frontmatter válido
skills válidas
agentes válidos
sin MCP duplicados
sin secretos
sin configuraciones contradictorias
```

Ejecuta:

```powershell
opencode --version
opencode auth list
opencode models deepseek --refresh
opencode agent list
opencode mcp list
opencode mcp auth list
```

No uses `--auto`.

### Prueba DeepSeek

Solo si está autenticado y V4 fue verificado:

```powershell
opencode run --model "<ID_EXACTO_DEEPSEEK_V4>" "Responde únicamente: OPENCODE_DEEPSEEK_READY"
```

Resultado esperado:

```text
OPENCODE_DEEPSEEK_READY
```

No registres tokens ni costes detallados.

### Pruebas MCP read-only

```text
Context7: resolver documentación de Next.js o Drizzle.
GitHub: leer metadatos del repositorio y PR; confirmar read-only.
Playwright: about:blank o localhost.
Vercel: listar proyectos o deployments existentes.
Neon: listar proyectos y confirmar Preview; sin SQL.
```

Si Neon no puede aislarse, desactívalo.

### Gates seguros

Detecta scripts reales y ejecuta, cuando existan:

```text
lint
typecheck
tests unitarios
build:ci
tests de configuración
```

No ejecutar E2E que envíen formularios, correos, escriban DB o muten Preview/Production.

No modificar código de aplicación.

### Integridad final

```powershell
git diff --check
git status --short --untracked-files=all
git diff --name-status
git diff --cached --name-status
```

Debe quedar:

```text
STAGED_CHANGES = 0
COMMITS = 0
PUSHES = 0
MERGE = false
DEPLOYMENTS = 0
```

---

## 17. Archivos permitidos

Puedes crear o modificar, fusionando:

```text
opencode.json u opencode.jsonc, solo uno
AGENTS.md
.editorconfig
.vscode/extensions.json
.vscode/settings.json
.github/copilot-instructions.md
.github/instructions/*.instructions.md
.agents/skills/*/SKILL.md
.opencode/agents/*.md
.opencode/commands/*.md
.opencode/README.md
```

No modificar:

```text
app/
components/
lib/
tests/
drizzle/
public/
.env.local
package.json
lockfiles
```

salvo necesidad estricta y autorización previa.

---

## 18. Criterios de aceptación

La tarea está completa solo si:

```text
1. OpenCode carga sin errores.
2. DeepSeek V4 usa un ID real.
3. DeepSeek está autenticado o queda claramente pendiente.
4. VS Code tiene solo extensiones necesarias.
5. PowerShell es el terminal del workspace.
6. Context7 está configurado.
7. GitHub MCP está read-only.
8. Playwright MCP está operativo.
9. Vercel requiere aprobación.
10. Neon requiere aprobación y está limitado a Preview o desactivado.
11. AGENTS.md es específico.
12. Las cuatro skills son detectables.
13. Los seis agentes son detectables.
14. Los cinco comandos son detectables.
15. No se filtraron secretos.
16. No se tocó .env.local.
17. No se modificó código de aplicación.
18. No hubo staging.
19. No hubo commit.
20. No hubo push.
21. No hubo deployment.
22. Los cambios previos siguen intactos.
23. Los gates seguros pasan o quedan documentados.
```

---

## 19. Informe final obligatorio

```text
# INFORME FINAL — ENTORNO OPENCODE JUSTICIA VERDADERA

## Sistema
OS =
POWERSHELL_VERSION =
NODE_VERSION =
NPM_VERSION =
VSCODE_VERSION =
OPENCODE_VERSION =

## DeepSeek
DEEPSEEK_AUTHENTICATED =
DEEPSEEK_V4_MODEL_ID =
DEEPSEEK_V4_FLASH_MODEL_ID =
DEFAULT_MODEL =
MODEL_CONNECTIVITY =

## Extensiones
ALREADY_INSTALLED =
INSTALLED_NOW =
FAILED_INSTALLATIONS =
DUPLICATE_AI_EXTENSIONS_FOUND =
UNOFFICIAL_AI_EXTENSIONS_FOUND =

## OpenCode
CONFIG_FILE =
CONFIG_SCHEMA_VALID =
SHARE_DISABLED =
DEFAULT_AGENT =
PERMISSION_POLICY_VALID =
SECRETS_IN_CONFIG = 0

## MCP
CONTEXT7_STATUS =
GITHUB_STATUS =
GITHUB_READ_ONLY =
PLAYWRIGHT_STATUS =
VERCEL_STATUS =
VERCEL_APPROVAL_GATED =
NEON_STATUS =
NEON_PREVIEW_ONLY =
NEON_APPROVAL_GATED =
MCP_DUPLICATES = 0

## Agentes
IMPLEMENTATION =
AUDIT_READ_ONLY =
TEST_VALIDATOR =
SECURITY_REVIEW =
PREVIEW_VALIDATOR =
PR_HANDOFF =

## Skills
AUDIT_READ_ONLY_SKILL =
VALIDATE_LOCAL_GATES_SKILL =
PREVIEW_SMOKE_TEST_SKILL =
PREPARE_PR_HANDOFF_SKILL =

## Comandos
AUDIT_COMMAND =
VALIDATE_COMMAND =
PREVIEW_COMMAND =
HANDOFF_COMMAND =
SAFE_IMPLEMENT_COMMAND =

## Archivos creados
<lista exacta>

## Archivos modificados
<lista exacta>

## Archivos preservados
app/(public)/blog/page.tsx =
.env.local =
UNTRACKED_FILES =

## Gates
LINT =
TYPECHECK =
UNIT_TESTS =
BUILD_CI =
OTHER_SAFE_TESTS =

## Acciones humanas pendientes
<OAuth, API key o selección Preview>

## Integridad
STAGED_CHANGES = 0
COMMITS = 0
PUSHES = 0
MERGE = false
READY = false
DEPLOYMENTS = 0
FORM_SUBMISSIONS = 0
EMAILS_SENT = 0
DATABASE_WRITES = 0
REMOTE_MUTATIONS = 0
MEMORY_MCP_INSTALLED = false
FILESYSTEM_MCP_INSTALLED = false
FETCH_MCP_INSTALLED = false
SEQUENTIAL_THINKING_INSTALLED = false

PORCENTAJE_COMPLETADO =
PORCENTAJE_PENDIENTE =
```

No declares 100 % si falta OAuth o autenticación de DeepSeek.

Detente después del informe.

No hagas commit ni push.

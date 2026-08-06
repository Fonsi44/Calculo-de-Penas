# PROMPT MAESTRO — OPTIMIZACIÓN PROFESIONAL DE OPENCODE PARA PINEDA Y ASOCIADOS

## 0. Rol, autoridad y relación con el orquestador

Actúa como **ingeniero principal de plataforma de desarrollo, arquitectura y calidad**, especializado en OpenCode, Next.js, TypeScript, React, Tailwind, Neon PostgreSQL, Drizzle, seguridad, testing, accesibilidad, rendimiento, SEO, GEO y contenido jurídico YMYL.

Este trabajo tiene un único objetivo: dejar el entorno de OpenCode preparado para ejecutar con mayor calidad, seguridad y eficiencia las tareas que reciba en el futuro.

La jerarquía de trabajo es obligatoria:

1. **ChatGPT es el orquestador externo del proyecto.**
2. El usuario copia en OpenCode los prompts preparados por ChatGPT.
3. Tú eres el ejecutor técnico de cada bloque autorizado.
4. No inventes una fase posterior ni continúes autónomamente con otras mejoras.
5. Al terminar este bloque, entrega un informe reproducible y detente.
6. El usuario enviará ese informe a ChatGPT, que decidirá el siguiente prompt.

No sustituyas al orquestador externo con una planificación indefinida. Puedes coordinar subagentes internos para completar esta tarea, pero no decidir el siguiente objetivo del proyecto.

---

# 1. Modo y autorización

Declara al comenzar:

```text
MODO = IMPLEMENTACIÓN CONTROLADA DEL ENTORNO OPENCODE
ALCANCE = configuración de desarrollo y documentación asociada
COMMIT = NO AUTORIZADO
PUSH = PROHIBIDO
MERGE = PROHIBIDO
DEPLOY = PROHIBIDO
PRODUCCIÓN = PROHIBIDA
MIGRACIONES DE BASE DE DATOS = PROHIBIDAS
CAMBIOS DE MODELO O PROVEEDOR IA = PROHIBIDOS
```

Este prompt autoriza:

- inspeccionar todo el repositorio y el entorno local;
- crear o mejorar la configuración de OpenCode del proyecto;
- crear agentes, skills y comandos de OpenCode;
- activar y configurar LSP si la versión instalada lo soporta realmente;
- instalar dependencias de desarrollo gratuitas, oficiales y necesarias;
- instalar mediante Homebrew utilidades gratuitas justificadas, únicamente si faltan;
- configurar un MCP local, gratuito y sin credenciales, si supera la evaluación indicada;
- crear scripts de diagnóstico y validación del entorno;
- modificar `AGENTS.md`, `README.md`, `CHANGELOG.md`, `package.json` y archivos de configuración relacionados únicamente cuando sea necesario y sin reescribir su historia.

No autoriza:

- cambiar el modelo por defecto, proveedores, API keys o facturación;
- instalar herramientas de pago;
- instalar paquetes abandonados, no oficiales o de procedencia dudosa;
- configurar MCP con acceso a producción, correo, base de datos, Vercel, Neon o secretos;
- modificar datos, migraciones, código funcional del producto o contenido jurídico;
- ejecutar `git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`, `git clean -fd`;
- desplegar en Vercel;
- aplicar migraciones;
- escribir en Neon, Resend, Google, Bing u otros servicios;
- guardar secretos en archivos versionados.

---

# 2. Reglas canónicas antes de tocar nada

Lee completamente, en este orden:

```text
AGENTS.md
README.md
CHANGELOG.md
CONTRIBUTING.md
docs/README.md
package.json
package-lock.json
.env.example
.gitignore
.github/workflows/*
```

Después inspecciona, si existen:

```text
opencode.json
opencode.jsonc
.opencode/**
.agents/**
.claude/**
.vscode/**
.mcp.json
~/.config/opencode/opencode.json
~/.config/opencode/opencode.jsonc
~/.config/opencode/agents/**
~/.config/opencode/skills/**
```

No asumas que los archivos adjuntos o la documentación reflejan el HEAD actual. El código, `package.json`, la configuración efectiva y las pruebas son la fuente técnica vigente.

Respeta especialmente estas reglas ya existentes:

- `AGENTS.md` es el protocolo canónico permanente.
- Debe preservarse la separación entre web pública, blog, intranet, SGIE y administración.
- Los datos jurídicos no pueden inventarse.
- Los cambios sensibles requieren validación proporcional.
- No se usan mocks como solución final.
- No se ocultan errores.
- No se crean documentos duplicados ni basura.
- Se preservan cambios locales preexistentes.
- No se hacen commits ni push sin autorización expresa.

Antes de editar:

```bash
git status --short --branch
git diff --check
git diff --name-status
git diff --cached --name-status
git branch --show-current
git rev-parse HEAD
node --version
npm --version
opencode --version
```

Registra cualquier cambio local existente y no lo mezcles con este trabajo.

---

# 3. Principio rector

No instales “todo lo posible”. Instala y configura únicamente lo que cumpla simultáneamente:

```text
UTILIDAD REAL
MANTENIMIENTO ACTIVO
LICENCIA LIBRE O USO GRATUITO
FUENTE OFICIAL O REPOSITORIO VERIFICABLE
SIN CREDENCIALES NUEVAS
SIN ACCESO A PRODUCCIÓN
SIN DUPLICAR CAPACIDADES EXISTENTES
BAJO COSTE DE CONTEXTO
PERMISOS MÍNIMOS
RESULTADO REPRODUCIBLE
```

Para cada herramienta, agente, skill, comando, LSP o MCP considerado, crea internamente una matriz:

```text
nombre
problema_que_resuelve
capacidad_ya_existente
beneficio
coste_contexto
riesgo_seguridad
mantenimiento
licencia
decisión
justificación
```

Decisiones permitidas:

```text
INSTALAR
CONFIGURAR
CONSERVAR
REEMPLAZAR
NO_INSTALAR_REDUNDANTE
NO_INSTALAR_RIESGOSO
NO_COMPATIBLE
```

No conviertas OpenCode en un entorno lento cargando decenas de herramientas en cada sesión.

---

# 4. Detectar la versión y usar la sintaxis correcta

La configuración de OpenCode cambia entre versiones. Antes de escribir `opencode.json` o `opencode.jsonc`:

1. Obtén la versión real mediante `opencode --version`.
2. Consulta la ayuda local:
   ```bash
   opencode --help
   opencode mcp --help
   opencode agent --help
   ```
3. Usa la documentación oficial correspondiente a esa versión.
4. Valida contra:
   ```text
   https://opencode.ai/config.json
   ```
5. Ejecuta el comando de diagnóstico de configuración disponible en esa versión, preferentemente:
   ```bash
   opencode debug config
   ```
   Si ese comando no existe, usa únicamente una alternativa mostrada por `opencode --help`.
6. No mezcles sintaxis V1 y V2.
7. No inventes propiedades.
8. Si una capacidad está declarada en el schema pero no tiene runtime real en la versión instalada, clasifícala `CONFIGURADA_PERO_NO_OPERATIVA` y no la presentes como validada.

Usa un único archivo canónico de configuración del proyecto:

```text
opencode.jsonc
```

Solo usa otro nombre si la versión instalada no admite JSONC o ya existe una configuración canónica diferente que convenga conservar.

No dupliques la misma configuración entre el proyecto y `~/.config/opencode`.

---

# 5. Arquitectura de agentes

Primero audita agentes existentes. Reutiliza o mejora los válidos y elimina duplicación conceptual. No borres nada sin demostrar que está obsoleto.

Crea agentes de proyecto en:

```text
.opencode/agents/
```

La arquitectura objetivo es la siguiente, adaptada al repositorio real.

## 5.1. `task-executor` — agente principal

Modo:

```text
primary
```

Responsabilidad:

- recibir exclusivamente el bloque ordenado por ChatGPT;
- leer `AGENTS.md`;
- declarar `AUDITORÍA`, `IMPLEMENTACIÓN` o `VERIFICACIÓN`;
- inspeccionar antes de editar;
- dividir el análisis entre subagentes cuando aporte valor;
- consolidar hallazgos;
- implementar solo el alcance autorizado;
- ejecutar validación proporcional;
- no avanzar a otra fase;
- entregar el informe final exacto para devolver a ChatGPT.

Permisos:

- lectura, glob, grep, list, skills, LSP y tareas: permitidos;
- edición: permitida dentro del worktree para tareas autorizadas;
- bash de bajo riesgo: permitido;
- comandos destructivos, producción, push y migraciones: denegados;
- commit: debe pedir autorización y no ejecutarse en esta tarea;
- directorios externos: denegados salvo lectura necesaria de configuración OpenCode expresamente autorizada.

## 5.2. Subagentes

Crea agentes `mode: subagent` con permisos mínimos:

### `repo-auditor`

Solo lectura. Analiza arquitectura, inconsistencias, código muerto, duplicaciones, dependencias, configuración y deuda técnica. No edita.

### `backend-engineer`

Next.js server, rutas API, servicios, validación Zod, autenticación, autorización, seguridad, caché, colas, integraciones y lógica de negocio. No toca frontend salvo contrato compartido necesario.

### `frontend-engineer`

React 19, Next.js App Router, Tailwind 4, componentes, responsive, diseño, interacción, accesibilidad e hidratación. Conserva el sistema visual canónico y no rediseña la web pública sin autorización específica.

### `database-engineer`

Neon PostgreSQL, Drizzle, schema, migraciones, consultas, índices, transacciones, concurrencia y rollback. No ejecuta migraciones ni escribe en bases remotas. Toda operación peligrosa requiere aprobación.

### `seo-geo-content`

SEO técnico, GEO, metadata, canonicals, sitemaps, robots, enlazado interno, `llms.txt`, datos estructurados JSON-LD, entidades, contenido y CTR. Para contenido jurídico, solo propone cambios respaldados por fuentes canónicas y exige revisión humana.

### `security-reviewer`

Solo lectura por defecto. Busca vulnerabilidades, exposición de secretos, PII, permisos, CSRF, SSRF, XSS, inyección, auth, cookies, headers, rate limiting, supply chain y configuraciones inseguras.

### `qa-release`

Solo lectura salvo artefactos efímeros. Selecciona y ejecuta las pruebas proporcionales; revisa lint, typecheck, Vitest, Playwright, build, migraciones reproducibles, accesibilidad, rendimiento y readiness.

### `docs-governance`

Mantiene documentación canónica, ADR, README, AGENTS y CHANGELOG sin reescribir historia ni duplicar fuentes de verdad.

No crees agentes adicionales salvo que exista una necesidad demostrable que no cubra esta arquitectura.

Cada agente Markdown debe tener:

- `description` específica;
- `mode`;
- temperatura baja cuando proceda;
- límite razonable de pasos;
- permisos explícitos;
- skills permitidas;
- responsabilidades;
- exclusiones;
- checklist de entrada;
- checklist de salida;
- formato de hallazgos;
- referencias a archivos canónicos del repositorio.

No fijes un modelo distinto por agente. Conserva el modelo/proveedor configurado por el usuario.

---

# 6. Skills del proyecto

Audita primero `.opencode/skills`, `.agents/skills` y `.claude/skills`. Conserva compatibilidad sin duplicar IDs.

Usa preferentemente:

```text
.opencode/skills/<nombre>/SKILL.md
```

Crea o consolida estas skills, solo si no existe ya una equivalente:

```text
project-governance
repository-exploration
nextjs-frontend
backend-api-security
neon-drizzle
testing-quality
seo-geo-jsonld
legal-content-safety
performance-accessibility
git-release-safety
documentation-governance
incident-debugging
```

Cada `SKILL.md` debe:

- usar un nombre lowercase con guiones;
- incluir frontmatter válido;
- tener descripción concreta que permita carga bajo demanda;
- explicar cuándo debe y cuándo no debe cargarse;
- apuntar a fuentes canónicas reales del repositorio;
- incluir un procedimiento corto y ejecutable;
- incluir validaciones;
- incluir anti-patrones;
- incluir condiciones para detenerse y pedir intervención;
- evitar copiar grandes fragmentos de `AGENTS.md`;
- no incluir secretos;
- no contener instrucciones genéricas sin relación con este proyecto.

Contenido mínimo esperado:

## `project-governance`

Modos, jerarquía ChatGPT → usuario → OpenCode, límites de autorización, preservación del worktree y formato final.

## `repository-exploration`

Mapeo del repo, búsqueda de fuentes de verdad, imports, rutas dinámicas, cron, webhooks y análisis previo a eliminar o mover archivos.

## `nextjs-frontend`

Server/Client Components, App Router, React 19, Tailwind 4, hidratación, responsive, accesibilidad, estados de carga/error y sistema visual canónico.

## `backend-api-security`

Rutas API, Zod, auth, RBAC/capabilities, CSRF, rate limiting, logs seguros, idempotencia, caché y errores.

## `neon-drizzle`

Schema, migraciones aditivas, transacciones, índices, concurrencia, aislamiento staging/production, rollback y validación reproducible.

## `testing-quality`

Matriz de AGENTS, tests relacionados, Vitest, Playwright, determinismo, no hardcodear PASS y no ocultar fallos.

## `seo-geo-jsonld`

Metadata, canonical, robots, sitemaps, JSON-LD, `llms.txt`, entidades, answer-first, enlazado, Search Console y noindex.

## `legal-content-safety`

No inventar derecho, citas, credenciales ni resultados; fuentes canónicas; YMYL; revisión humana; estados editoriales.

## `performance-accessibility`

Core Web Vitals, bundle, caché, imágenes, fuentes, accesibilidad WCAG, teclado, foco, contraste, consola e hidratación.

## `git-release-safety`

Diff, scope, commits atómicos solo autorizados, PR, checks, no push/merge/deploy y release gates.

## `documentation-governance`

README, AGENTS, CHANGELOG, ADR, docs index, actualización mínima y no duplicación.

## `incident-debugging`

Reproducción, hipótesis, evidencia, causa raíz, corrección mínima, regresión y rollback.

Configura permisos de skills para que se carguen bajo demanda. No inyectes el cuerpo de todas las skills en cada prompt.

---

# 7. Comandos reutilizables

Crea en `.opencode/commands/` los comandos estrictamente necesarios:

```text
task.md
audit.md
implement.md
verify.md
seo-check.md
ui-check.md
release-check.md
handoff.md
environment-check.md
```

Requisitos:

- no sobrescribir comandos integrados;
- usar `$ARGUMENTS` cuando corresponda;
- enlazar cada comando con el agente adecuado;
- `audit` debe ser read-only;
- `implement` debe exigir alcance concreto;
- `verify` debe seleccionar validación proporcional, no ejecutar todo siempre;
- `release-check` no debe hacer merge ni deploy;
- `handoff` debe producir el informe para ChatGPT;
- `environment-check` debe comprobar agentes, skills, config, MCP, LSP, binarios y scripts;
- comandos de auditoría o análisis extensos pueden ejecutarse como subtarea para no contaminar el contexto principal.

---

# 8. Permisos y seguridad de OpenCode

Configura permisos explícitos. No uses modo permisivo global ni `--auto` como comportamiento normal.

Permite automáticamente tareas de lectura y validación de bajo riesgo, por ejemplo:

```text
git status
git diff
git log
git show
git branch --show-current
git rev-parse
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
npx tsc --noEmit
opencode --version
opencode debug config
opencode agent list
opencode mcp list
```

Debe pedir aprobación o quedar denegado según criticidad:

```text
git add
git commit
instalación de dependencias
modificación fuera del worktree
scripts con escritura
seed
migraciones
autenticación CLI
operaciones Vercel/Neon
```

Debe quedar denegado:

```text
git push
git merge
git rebase
git reset --hard
git clean -fd
git checkout -- .
git restore destructivo
rm -rf sobre el repositorio
sudo
vercel --prod
despliegue de producción
migraciones de producción
escritura directa en Production
lectura o impresión de valores secretos
```

Asegura que:

- `repo-auditor`, `security-reviewer` y `qa-release` no puedan editar;
- `database-engineer` no pueda aplicar migraciones ni conectarse a producción;
- `seo-geo-content` no pueda publicar contenido pending;
- ningún agente pueda hacer push, merge o deploy;
- ningún MCP pueda invocarse sin permisos explícitos;
- las herramientas de navegador no usen el perfil personal de Chrome ni sesiones autenticadas.

No guardes tokens, cookies, credenciales ni variables secretas en `opencode.jsonc`, Markdown, logs o scripts.

---

# 9. MCP: selección mínima y segura

OpenCode ya dispone de lectura, búsqueda, shell, subagentes y herramientas propias. No instales MCP redundantes.

## 9.1. MCP permitido y recomendado

Evalúa e instala, si es compatible con la versión actual, **un único MCP principal de navegador**:

```text
chrome-devtools-mcp
```

Condiciones:

- repositorio oficial de Chrome DevTools;
- licencia libre;
- ejecución local;
- versión exacta fijada, no dependencia flotante permanente;
- modo `--slim`;
- preferentemente `--headless`;
- perfil temporal o aislado;
- sin acceso al perfil personal;
- sin cookies o sesiones autenticadas;
- permisos `ask`;
- solo para agentes `frontend-engineer`, `seo-geo-content` y `qa-release`;
- deshabilitado o no expuesto al resto;
- smoke test sin iniciar sesión ni enviar formularios;
- registrar coste de contexto y herramientas expuestas.

Preferencia de instalación reproducible:

1. consultar versión estable oficial;
2. instalar como `devDependency` exacta si resulta razonable;
3. usar `npx --no-install` desde la configuración;
4. reflejar la versión en `package-lock.json`;
5. no usar `@latest` en la configuración final.

## 9.2. Playwright MCP

El proyecto ya usa Playwright. Evalúa `@playwright/mcp`, pero no lo habilites junto con Chrome DevTools MCP salvo que demuestres una capacidad necesaria y no duplicada.

Decisión preferida:

```text
Playwright CLI y tests existentes = conservar
Chrome DevTools MCP = navegador exploratorio/performance
@playwright/mcp = NO_INSTALAR_REDUNDANTE
```

Puedes cambiar esta decisión únicamente con evidencia técnica.

## 9.3. MCP prohibidos por defecto

No instales por defecto:

- filesystem MCP;
- git MCP;
- GitHub MCP;
- memory MCP;
- PostgreSQL/Neon MCP;
- Vercel MCP;
- Resend/email MCP;
- Google Drive/Gmail MCP;
- browser MCP no oficial;
- servidores que requieran API key;
- servidores que envíen código o datos a servicios remotos;
- agregadores de MCP;
- paquetes sin mantenimiento o sin procedencia clara.

Usa las alternativas existentes:

```text
filesystem/git → herramientas nativas de OpenCode
GitHub → gh CLI
Playwright → suite y CLI del proyecto
Neon/Vercel → CLI oficial solo cuando una tarea futura lo autorice
documentación web → webfetch/websearch de OpenCode cuando esté disponible
```

Verifica finalmente:

```bash
opencode mcp list
```

No autentiques ningún MCP.

---

# 10. LSP

Activa LSP únicamente después de verificar el runtime real de la versión instalada.

Objetivo para este repositorio:

```text
TypeScript
TSX
JavaScript
JSON
CSS/Tailwind cuando exista soporte estable
```

Procedimiento:

1. Comprueba si OpenCode incluye runtime LSP operativo.
2. Comprueba si TypeScript y el servidor requerido ya existen.
3. Si falta y es necesario, instala como dependencia de desarrollo exacta:
   ```text
   typescript-language-server
   ```
4. Usa la versión de `typescript` compatible con el proyecto; no la actualices arbitrariamente.
5. Configura extensiones `.ts`, `.tsx`, `.js`, `.jsx`.
6. Activa la herramienta LSP experimental únicamente si la versión actual la requiere y está documentada.
7. No añadas variables globales permanentes al perfil del usuario sin necesidad.
8. Si hace falta una variable de entorno para iniciar OpenCode, crea un wrapper PowerShell documentado y seguro, sin secretos.
9. Verifica, si el CLI/runtime lo permite:
   - diagnósticos;
   - go to definition;
   - referencias;
   - símbolos;
   - ausencia de procesos huérfanos.
10. Si el LSP no funciona realmente, no simules éxito. Documenta:
    ```text
    LSP = CONFIGURADO_NO_OPERATIVO_EN_VERSION_ACTUAL
    ```

No instales servidores LSP redundantes o incompatibles.

---

# 11. Formateadores y calidad de edición

Audita la configuración real de ESLint, Prettier, Biome, Tailwind y TypeScript.

Reglas:

- conserva el formatter existente;
- no introduzcas Prettier o Biome si genera conflicto con el estilo actual;
- no reformatees masivamente el repositorio;
- no produzcas un diff de miles de líneas sin cambios semánticos;
- configura el formateo solo para archivos editados;
- si OpenCode soporta formatter runtime, valida que realmente se ejecute;
- si no lo soporta, usa scripts existentes;
- no desactives reglas para conseguir verde;
- no aumentes el baseline de `knip`, lint o deuda técnica.

---

# 12. Utilidades CLI gratuitas

Comprueba antes de instalar:

```bash
command -v rg
command -v fd
command -v jq
command -v gitleaks
command -v actionlint
command -v shellcheck
command -v gh
command -v vercel
command -v neonctl
```

Puedes instalar mediante Homebrew, solo si faltan y hay uso real:

```text
ripgrep
fd
jq
gitleaks
actionlint
shellcheck
```

No instales automáticamente Vercel o Neon CLI si no existen; regístralos como opcionales porque conectan con servicios externos y deberán configurarse en una tarea autorizada.

No modifiques autenticaciones existentes.

Integra scripts únicamente cuando aporten cobertura no duplicada:

- secret scan local redactado;
- validación de workflows;
- validación de shell;
- diagnóstico OpenCode.

No añadas ganchos Git invasivos si el proyecto no tiene ya una estrategia de hooks. No bloquees commits por herramientas no instaladas sin ofrecer degradación clara.

---

# 13. Doctor del entorno

Crea un script mantenible, preferentemente:

```text
scripts/opencode-doctor.mjs
```

Y un script npm, si no existe equivalente:

```json
"opencode:doctor": "node scripts/opencode-doctor.mjs"
```

Debe ser read-only y comprobar:

- versión de Node, npm y OpenCode;
- archivo canónico de configuración;
- JSON/JSONC válido;
- schema de OpenCode;
- agentes con frontmatter válido;
- nombres y modos;
- permisos peligrosos;
- skills con nombres/frontmatter válidos;
- IDs duplicados entre `.opencode`, `.agents` y `.claude`;
- comandos existentes y referencias a agentes;
- MCP configurados y estado;
- ausencia de MCP prohibidos;
- LSP declarado y soporte detectado;
- binarios opcionales;
- scripts npm requeridos;
- archivos sensibles ignorados;
- ausencia de secretos obvios en `.opencode/**`;
- enlaces documentales básicos;
- coherencia entre `AGENTS.md`, `README.md` y configuración;
- que no exista permiso de push, merge, deploy o producción.

Salida:

```text
PASS
WARN
FAIL
NOT_APPLICABLE
RESTART_REQUIRED
```

Debe devolver exit code distinto de cero solo para fallos reales, no por herramientas opcionales.

Añade tests unitarios para el doctor si su lógica no es trivial.

---

# 14. Actualización de AGENTS.md, README.md y CHANGELOG.md

Los tres archivos están autorizados únicamente para cambios mínimos y veraces.

## `AGENTS.md`

No lo reemplaces ni debilites.

Añade o mejora una sección corta de operación con OpenCode que documente:

- ChatGPT como orquestador externo;
- `task-executor` como ejecutor de un bloque;
- ubicación de agentes, skills y comandos;
- permisos;
- doctor del entorno;
- MCP habilitado;
- LSP y sus limitaciones reales;
- obligación de detenerse y devolver informe;
- prohibición de autoavanzar, push, merge, deploy y producción.

No dupliques el resto del protocolo.

Si una regla nueva entra en conflicto, prevalece la opción más segura y debes explicarlo.

## `README.md`

Añade una sección breve:

```text
Entorno OpenCode
```

Debe incluir:

- requisito de versión verificado;
- cómo iniciar desde PowerShell en macOS;
- agente principal;
- comandos principales;
- `npm run opencode:doctor`;
- necesidad de reiniciar OpenCode tras cambiar config;
- cómo comprobar MCP y LSP;
- referencia a `.opencode/README.md`;
- no incluir secretos ni configuración de modelos.

Verifica que la información del stack siga coincidiendo con `package.json`.

## `CHANGELOG.md`

Solo añade una entrada bajo `[Unreleased]` si realmente se implementaron cambios.

La entrada debe describir:

- configuración OpenCode;
- agentes;
- skills;
- comandos;
- MCP seleccionado;
- LSP;
- doctor;
- permisos;
- validaciones.

No inventes una release, no cambies fechas históricas y no declares validado lo que quedó pendiente.

## `.opencode/README.md`

Puedes crear este documento técnico dentro de `.opencode/` para evitar inflar los archivos raíz.

Debe ser la guía operativa de:

- arquitectura;
- listado de agentes;
- listado de skills;
- comandos;
- permisos;
- MCP;
- LSP;
- troubleshooting;
- actualización segura;
- cómo devolver el handoff a ChatGPT.

---

# 15. Configuración PowerShell/macOS

El usuario ejecuta OpenCode desde PowerShell 7 en macOS.

Verifica:

```powershell
$PSVersionTable.PSVersion
$HOME
Get-Command opencode
Get-Command node
Get-Command npm
```

Si LSP u otra función necesita variables de entorno para iniciar OpenCode, crea un wrapper dentro del repositorio, por ejemplo:

```text
scripts/start-opencode.ps1
```

Requisitos:

- no contener secretos;
- usar rutas relativas;
- validar que está en la raíz Git;
- establecer únicamente variables técnicas documentadas;
- ejecutar `opencode`;
- propagar correctamente el exit code;
- no modificar `$PROFILE` automáticamente;
- documentar el comando de uso.

No alteres la configuración permanente del shell salvo necesidad demostrada y autorización explícita adicional.

---

# 16. Validación final

Ejecuta primero validaciones específicas del entorno:

```bash
npm run opencode:doctor
opencode --version
opencode debug config
opencode agent list
opencode mcp list
```

Usa alternativas solo si la versión instalada muestra comandos diferentes.

Valida archivos:

- sintaxis de `opencode.jsonc`;
- frontmatter de agentes;
- frontmatter de skills;
- comandos;
- doctor;
- PowerShell;
- ausencia de secretos;
- `git diff --check`.

Después aplica la matriz de `AGENTS.md`.

Como se modificarán configuración, scripts, documentación y posiblemente dependencias, ejecuta como mínimo:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Si existe `npm run verify`, ejecútalo también.

No reduzcas tests ni ignores errores. Si un fallo es preexistente, demuéstralo comparándolo con el estado inicial y clasifícalo.

Comprueba al final:

```bash
git status --short --branch
git diff --check
git diff --name-status
git diff --stat
git diff -- . ':!package-lock.json'
```

No stages archivos.

---

# 17. Criterios de aceptación

El trabajo solo puede considerarse completado si:

- existe una configuración OpenCode canónica y válida;
- no se cambió el modelo o proveedor;
- los permisos impiden acciones destructivas;
- existe un agente ejecutor y subagentes con responsabilidades no solapadas;
- las skills son específicas y cargables bajo demanda;
- los comandos funcionan y no pisan built-ins;
- el MCP seleccionado es oficial, local, fijado y limitado;
- no hay MCP redundantes o con acceso sensible;
- LSP está realmente validado o claramente marcado como no operativo;
- no hubo formateo masivo;
- el doctor funciona;
- AGENTS/README/CHANGELOG reflejan exactamente el estado;
- no hay secretos;
- no se alteró producción;
- lint, typecheck, tests y build tienen resultado registrado;
- el árbol conserva cualquier cambio previo;
- no hubo commit, push, merge ni deploy;
- se entrega un informe suficiente para que ChatGPT decida el siguiente paso.

---

# 18. Entrega obligatoria

Entrega una única respuesta final en español con esta estructura:

## 1. Veredicto

```text
ENTORNO_OPENCODE = READY | PARTIAL | BLOCKED
OpenCode version:
Config canónica:
MCP:
LSP:
Agentes:
Skills:
Comandos:
Doctor:
Reinicio requerido:
```

## 2. Inventario inicial

Incluye lo que ya existía y lo que estaba ausente.

## 3. Decisiones

Tabla:

```text
elemento
decisión
motivo
coste_contexto
riesgo
```

Incluye también herramientas rechazadas.

## 4. Archivos modificados

Una fila por archivo:

```text
ruta
acción
motivo
cambio_principal
```

## 5. Instalaciones

```text
paquete
versión exacta
origen oficial
licencia
global/proyecto
motivo
```

## 6. Agentes, skills y comandos

Lista exacta y propósito de cada uno.

## 7. MCP y LSP

Qué está operativo, cómo se verificó y qué quedó pendiente.

## 8. Permisos

Acciones permitidas, con aprobación y prohibidas.

## 9. Validaciones

```text
comando
exit_code
resultado
advertencias
```

## 10. Riesgos y pendientes

Separa:

```text
BLOQUEANTE
NO BLOQUEANTE
REQUIERE REINICIO
REQUIERE DECISIÓN DEL ORQUESTADOR
```

## 11. Instrucciones para empezar a usarlo

Da los comandos exactos para PowerShell en macOS.

## 12. Handoff para ChatGPT

Termina exactamente con:

```text
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Dependencias instaladas:
Agentes creados o modificados:
Skills creadas o modificadas:
Comandos creados o modificados:
MCP configurados:
Estado LSP:
Comandos ejecutados:
Resultado de cada comando:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Cambios locales preexistentes preservados:
Commit: NO REALIZADO
Push: NO REALIZADO
Merge: NO REALIZADO
Deploy: NO REALIZADO
Próximo paso recomendado:
```

No ejecutes el próximo paso. Detente para que el usuario entregue el informe a ChatGPT.

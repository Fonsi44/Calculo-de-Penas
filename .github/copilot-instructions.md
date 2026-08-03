# Instrucciones de VS Code — Pineda y Asociados (Justicia Verdadera)

Este archivo es la puerta de entrada a las instrucciones del proyecto para
agentes de VS Code (GitHub Copilot, ChatGPT, etc.).

## Fuente canónica

- **`AGENTS.md`** (raíz) es el protocolo canónico del proyecto. Léelo completo
  antes de cualquier tarea. Este archivo no lo duplica: solo lo enlaza y
  reitera lo esencial.

## Reglas esenciales

- **Shell obligatoria: PowerShell 7** (`pwsh -NoProfile -Command '...'`),
  también en macOS. No uses Bash como interfaz principal.
- **No secretos:** nunca leas, imprimas ni escribas valores de `.env`,
  `.env.local`, API keys, tokens, JWT, cadenas de conexión, webhooks ni
  credenciales OAuth. Informa solo `PRESENT`/`ABSENT`/`AUTHENTICATED`.
- **No modificar `.env.local`** (se considera `UNTRUSTED`).
- **No Production**: no mutar Vercel, Neon, Resend, GitHub, Preview,
  Production, bases de datos, webhooks, formularios ni correo.
- **No commit/push/merge/deploy** sin autorización literal del propietario.
- **Preservar siempre los cambios locales** preexistentes.
- **No afectar la web pública** al trabajar en SGIE/Admin (aislamiento).
- **No registro público**: el alta de usuarios se hace desde Admin.
- **No enviar contratos automáticamente**.
- **Política comercial**: única formulación «Evaluación inicial confidencial»
  (`lib/marketing-policy.ts`). No publicar variantes de consulta
  gratuita/sin costo/sin compromiso no confirmadas.
- **Usar «bufete», nunca «buffet»**.
- Cambios pequeños, verificables y con tests. No afirmar validaciones no
  ejecutadas.

## Instrucciones específicas por área

Se aplican automáticamente según el tipo de archivo:

- TypeScript/React: `.github/instructions/typescript.instructions.md`
- Tests: `.github/instructions/tests.instructions.md`
- Documentación: `.github/instructions/docs.instructions.md`
- Seguridad (API, lib, middleware, next.config): `.github/instructions/security.instructions.md`

## Skills

Skills portables (OpenCode + VS Code) en `.agents/skills/`:
`audit-read-only`, `validate-local-gates`, `preview-smoke-test`,
`prepare-pr-handoff`.
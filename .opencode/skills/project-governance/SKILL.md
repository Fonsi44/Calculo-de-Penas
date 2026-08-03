---
name: project-governance
description: Gobernanza del proyecto Pineda y Asociados. Usar SIEMPRE que se inicie una tarea (modos AUDITORÍA/IMPLEMENTACIÓN/VERIFICACIÓN, jerarquía ChatGPT→usuario→task-executor, límites de autorización, preservación del worktree, formato de informe final). NO cargar para tareas de un único subsistema que ya lo tienen documentado en AGENTS.md.
---

# Gobernanza del proyecto — Pineda y Asociados

Protocolo canónico en `AGENTS.md`. Esta skill resume operación; **no reemplaza
el protocolo**.

## Modos

| Modo | Lectura | Escritura | Commits | Llamadas externas |
|------|---------|-----------|---------|-------------------|
| AUDITORÍA | Sí, sin exclusiones | No | No | Solo GET sin efectos |
| IMPLEMENTACIÓN | Sí | Cambios autorizados pequeños | Solo autorización expresa | Solo autorización expresa |
| VERIFICACIÓN | Sí | No | No | Solo comprobaciones read-only |

## Jerarquía

1. ChatGPT orquestador → 2. usuario (copia el prompt) → 3. task-executor (ejecuta).

## Reglas clave

- R1 leer antes de editar; R2 una fuente de verdad por subsistema; R4 no
  inventar datos legales; R6 intranet/admin privados; R7 commit atómico con
  autorización; R11/R12 clasificar con honestidad; R20 no ocultar errores;
  R21 no declarar completado sin validar.
- Nunca push, merge, deploy, migraciones de producción ni secretos.

## Flujo

1. `git status --short --branch` antes y después.
2. Leer archivos a modificar.
3. Implementar el bloque autorizado.
4. Validación proporcional (`AGENTS.md` §4).
5. Informe final en formato `AGENTS.md` §9; **detenerse**.

## Validaciones

- `git diff --check` (sin errores).
- Según cambio: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build`.
- Entorno OpenCode: `npm run opencode:doctor`.

## Anti-patrones

- Avanzar a una fase no autorizada por el orquestador.
- Commits sin autorización expresa.
- Reescribir el historial Git.
- Ocultar errores con try/catch vacíos.

## Detenerse y pedir intervención

- Alcance ambiguo o cambio en archivos sensibles (`AGENTS.md` §7).
- Necesidad de credenciales o acceso a producción.

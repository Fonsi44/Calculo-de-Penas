---
name: git-release-safety
description: Seguridad de Git y release del proyecto — diff, scope, commits atómicos solo con autorización, PR, checks, prohibición de push/merge/deploy y release gates. Usar antes de cualquier operación Git o al preparar una entrega.
---

# Seguridad Git y release — Pineda y Asociados

## Política (AGENTS.md §5)

- Cambios locales preexistentes: **preservar siempre**.
- Commits: solo con autorización expresa; atómicos, en español, con prefijo (R7).
- Nunca push sin orden expresa. Nunca deploy en Vercel ni migraciones de
  producción sin orden expresa.
- Prohibido: `git reset --hard`, `git clean -fd`, reescribir historial.
- Ramas cortas + PR; no trabajar sobre `main` salvo instrucción explícita.
- Sin `git merge`/`pull`/`cherry-pick`/`rebase` entre ramas sin autorización.

## Procedimiento

1. `git status --short --branch` antes y después.
2. Revisar `git diff` antes de cualquier add/commit.
3. Stagear solo archivos intencionados; nunca secretos.
4. Commit atómico solo con autorización expresa del usuario.

## Validaciones

- `git diff --check` (sin errores de espacio).
- Checks del CI: `npm run verify` como referencia de release.

## Anti-patrones

- Commitear `.env.local`, `data/google/`, `data/bing/`, tokens o outputs live.
- Commitear junto con cambios no relacionados.
- Hacer push, merge o deploy sin orden expresa.

## Detenerse y pedir intervención

- Cualquier commit, push, merge o deploy no autorizado.

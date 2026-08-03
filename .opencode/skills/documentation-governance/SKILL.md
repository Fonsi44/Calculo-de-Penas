---
name: documentation-governance
description: Gobernanza de documentación del proyecto — README, AGENTS, CHANGELOG, ADR, docs index y .opencode/ sin reescribir historia ni duplicar fuentes. Usar al crear o actualizar documentación canónica.
---

# Gobernanza de documentación — Pineda y Asociados

## Reglas (AGENTS.md §1, §9, §10)

- Informe final en la respuesta del agente, no como archivo Markdown nuevo.
- Solo crear archivos de informe cuando el usuario lo solicite expresamente.
- Actualizar documentos existentes antes de crear otros.
- Documentación técnica dentro de `docs/`.
- Decisiones arquitectónicas duraderas como ADR en `docs/adr/`.
- No crear docs en la raíz salvo canónicos autorizados.

## Documentos canónicos

- `AGENTS.md` (protocolo IA), `README.md`, `CHANGELOG.md` (`[Unreleased]`),
  `CONTRIBUTING.md`, `docs/README.md` (índice), `.opencode/README.md`.

## Procedimiento

1. Leer el documento a modificar (R1).
2. Cambio mínimo y veraz; sin duplicar fuente existente.
3. Verificar enlaces (`npm run docs:links`) y coherencia de stack.

## Validaciones

- `npm run docs:links`
- Coherencia de `README.md` con `package.json`.

## Anti-patrones

- Reescribir fechas históricas o el pasado del CHANGELOG.
- Inventar releases o validaciones.
- Generar un informe Markdown por cada ejecución.

## Detenerse y pedir intervención

- Cambio que afecte a la historia del CHANGELOG sin ser una release real.

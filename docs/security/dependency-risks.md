---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Riesgos de dependencias

**Owner:** @engineering
**Status:** active
**Last reviewed:** 2026-07-28

## Vulnerabilidades activas (26)

### Resumen

| Advisory | Paquete | Severidad | Runtime/Dev | Alcanzable | Fix | Acción |
|----------|---------|-----------|-------------|------------|-----|--------|
| next/postcss/sharp | `next@16.2.12` | high | Runtime/build | Copias fijadas por Next | Sin release corregida compatible | Seguir upstream; override probado y descartado por árbol inválido |
| esbuild dev server | `esbuild` | moderate | Dev | Solo en desarrollo local | Sin fix | Aceptable — no afecta producción |
| brace-expansion DoS | `brace-expansion` | high | Dev | Solo en tooling de build | Sin fix directo | Aceptable — no expuesto |
| libxmljs2 | `@cyclonedx/cyclonedx-npm` | high | Dev | Generación manual de SBOM | Downgrade sugerido incorrecto | No procesa XML de usuario |
| minimatch | `eslint`, `eslint-config-next` | high | Dev | Lint en repo confiable | Requiere majors no compatibles | Seguir upstream |

### Detalle por paquete

`googleapis@173.0.0` eliminó las cuatro vulnerabilidades moderadas de producción
de la cadena `uuid`. `npm audit --omit=dev` conserva nueve altas, todas
atribuidas a las copias internas de `postcss` y `sharp` fijadas por
`next@16.2.12`. El audit completo registra 26 (0 críticas, 4 moderadas, 22
altas); las 17 adicionales pertenecen a lint, Drizzle y SBOM. La revisión debe
repetirse cuando Next o esas herramientas publiquen versiones compatibles.

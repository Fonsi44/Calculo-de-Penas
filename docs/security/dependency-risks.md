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
**Last reviewed:** 2026-07-27

## Vulnerabilidades activas (31)

### Resumen

| Advisory | Paquete | Severidad | Runtime/Dev | Alcanzable | Fix | Acción |
|----------|---------|-----------|-------------|------------|-----|--------|
| uuid buffer bounds | `uuid` (vía `googleapis` → `gaxios`) | moderate | Runtime | Solo en scripts GSC/GA4 (vía `lib/google.ts`) | `googleapis@173+` (breaking) | Actualizar en staging |
| next.js | `next@16.2.11` | high | Runtime | Framework completo | `next@16.2.12` (patch) | Se aplicó patch; requiere redeploy |
| sharp libvips | `sharp` | high | Runtime (scripts) | Solo en `scripts/optimize-images.mjs` y `gen-favicon.mjs` | Sin fix disponible | Riesgo bajo: solo tooling |
| esbuild dev server | `esbuild` | moderate | Dev | Solo en desarrollo local | Sin fix | Aceptable — no afecta producción |
| brace-expansion DoS | `brace-expansion` | high | Dev | Solo en tooling de build | Sin fix directo | Aceptable — no expuesto |
| postcss XSS | `postcss` | high | Dev | Solo en build de Tailwind | Sin fix directo | Aceptable — no expuesto a usuarios |
| postcss file read | `postcss` | high | Dev | Solo en build de Tailwind | Sin fix directo | Aceptable — no expuesto a usuarios |
| postcss traversal | `postcss` | high | Dev | Solo en build de Tailwind | Sin fix directo | Aceptable — no expuesto a usuarios |
| hono path traversal | `@hono/node-server` | moderate | Dev | Solo en MCP server de desarrollo | Sin fix | Aceptable — no expuesto |

### Detalle por paquete

#### `uuid` (moderate — 20 vulnerabilidades transitivas)
- **Ruta:** `googleapis` → `googleapis-common` → `gaxios` → `uuid`
- **Uso en código:** `lib/google.ts:1` importa `googleapis` para Google Search Console y Analytics
- **Condición de explotación:** Requiere que un atacante controle el buffer pasado a `uuid.v3()`/`v5()`/`v6()`. En nuestro caso, `uuid` solo se usa internamente por `gaxios` para generar IDs de request, no con input de usuario.
- **Fix:** `googleapis@173.0.0` elimina la dependencia de `uuid` vía `gaxios@7`. **Breaking change**: la API de `googleapis` cambió significativamente (módulos ESM, nueva auth).
- **Mitigación:** No se procesa input de usuario con `uuid`. El riesgo es bajo.
- **Condición de resolución:** Actualizar `googleapis` en entorno staging, validar `lib/google.ts`, tests GSC/GA4.
- **Revisión:** 2026-08-27

#### `next` (high)
- **Versión:** 16.2.11 → **actualizada a 16.2.12** (vía `npm update`)
- **Estado:** Parcialmente resuelto. El advisory puede requerir confirmación post-update.

#### `sharp` (high)
- **Uso:** Solo en scripts de optimización de imágenes (tooling, no runtime)
- **Condición de explotación:** Requiere procesar imágenes maliciosas con `sharp`. Nuestros scripts solo procesan imágenes del repositorio.
- **Riesgo:** Bajo. No se ejecuta en servidor público.

---
name: 'Test Standards'
description: 'Convenciones de testing (Vitest/Playwright) del proyecto'
applyTo: '**/*.{test,spec}.{ts,tsx}'
---
# Convenciones de tests — Pineda y Asociados

- Framework: **Vitest** (unitario/integración) y **Playwright** (e2e).
  Comandos: `npm run test`, `npx vitest <ruta>`, `npm run test:e2e`.
- Validación proporcional según `AGENTS.md` §4: no ejecutar siempre la
  suite completa; elegir la mínima según el tipo de cambio.
- **No hardcodear PASS** ni ocultar fallos con `skip`/`only`/mocks vacíos
  (R20/R21). Los tests son evidencia real.
- No reducir tests ni ignorar errores para "poner el verde".
- Los e2e no deben enviar formularios reales, correos, escribir en DB ni
  mutar Preview/Production sin autorización.
- Errores preexistentes: demostrarlos comparando con el estado inicial del
  árbol Git (no asumirlos).
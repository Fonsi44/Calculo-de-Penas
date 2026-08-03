---
name: incident-debugging
description: Depuración de incidentes del proyecto — reproducción, hipótesis, evidencia, causa raíz, corrección mínima, regresión y rollback. Usar ante un bug, fallo de test, error de build o incidente de producción/staging.
---

# Depuración de incidentes — Pineda y Asociados

## Procedimiento

1. **Reproducir** el incidente con el menor input posible.
2. Formular hipótesis con evidencia (logs, tests, lecturas).
3. Localizar causa raíz (no el síntoma).
4. Corrección mínima y justificada.
5. Verificar regresión (tests del módulo) y rollback (cambios reversibles).

## Reglas

- No ocultar errores con try/catch vacíos (R20).
- No declarar resuelto sin evidencia de reproducción y verificación (R21).
- No crear soluciones temporales sin señalarlas como tales.
- Fallos preexistentes: demostrar comparando con el estado inicial.

## Validaciones

- Según causa: `npm run lint`, `npx tsc --noEmit`, `npm run test` (módulo),
  `npm run build`.
- Para producción: documentar y proponer; no actuar sin autorización.

## Anti-patrones

- "Fix" sin reproducción ni causa raíz.
- Casts inseguros o desactivación de reglas para silenciar.
- Borrar evidencia (logs, reproducciones).

## Detenerse y pedir intervención

- Causa raíz en archivos sensibles (`AGENTS.md` §7) o acceso a producción.

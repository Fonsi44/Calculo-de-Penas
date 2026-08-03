---
name: testing-quality
description: Testing de calidad del proyecto — matriz de validación de AGENTS.md §4, Vitest, Playwright, determinismo, sin hardcodear PASS y sin ocultar fallos. Usar antes de declarar una tarea completada o al escribir/ejecutar pruebas.
---

# Testing y calidad — Pineda y Asociados

## Matriz de validación proporcional (AGENTS.md §4)

| Cambio | Validación mínima |
|--------|-------------------|
| Documentación | formato + enlaces + coherencia |
| Código localizado | `npm run lint` + `npx tsc --noEmit` + pruebas del módulo |
| Transversal/seguridad/auth/DB/config | lint + tsc + `npm run test` + `npm run build` |
| SEO estático | `npm run build` + validadores locales |

## Procedimiento

1. Identificar el tipo de cambio → validación mínima.
2. Ejecutar pruebas del módulo afectado (Vitest) y lint + typecheck.
3. No hardcodear PASS ni excluir tests para ocultar fallos (R20/R21).
4. Fallos preexistentes: demostrar comparando con el estado inicial.

## Comandos

- `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`
- `npm run test:e2e` (Playwright) · `npm run verify` (suite completa CI)

## Anti-patrones

- Ocultar fallos con try/catch o casts inseguros.
- Reducir cobertura o desactivar reglas para obtener verde.
- Declarar completado sin ejecutar las validaciones correspondientes.

## Detenerse y pedir intervención

- Falla que requiera cambiar código sensible sin autorización.

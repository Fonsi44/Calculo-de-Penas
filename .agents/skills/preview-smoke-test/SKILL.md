---
name: preview-smoke-test
description: Smoke test de navegación con Playwright en localhost o Preview (responsive, accesibilidad, consola, enlaces). Usar para verificar páginas públicas sin formularios, DB ni email.
license: proprietary
compatibility: opencode-vscode
---
# Smoke test de Preview — Pineda y Asociados

Verificación de navegación con Playwright MCP o chrome-devtools sobre
**localhost o Preview read-only**.

## Procedimiento

1. Cargar la URL objetivo (localhost o Preview; nunca Production).
2. Verificar:
   - Navegación y renderizado correcto.
   - Responsive (varios viewports).
   - Accesibilidad básica (landmarks, encabezados, foco visible).
   - Consola sin errores (registrar warnings relevantes).
   - Enlaces internos válidos (sin rotos obvios).
3. Reportar PASS/FAIL/BLOCKED con evidencia (screenshots, errores de consola).

## Prohibido

- Formularios reales, envío de emails, escritura en DB, usuarios reales.
- Acciones mutables en Production o Preview.
- Navegación con perfil personal o cookies de sesión reales.

## Detenerse y pedir intervención

- Necesidad de interactuar con formularios o servicios reales.
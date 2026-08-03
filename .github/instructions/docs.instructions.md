---
name: 'Documentation Standards'
description: 'Convenciones de documentación (Markdown) del proyecto'
applyTo: '**/*.md'
---
# Convenciones de documentación — Pineda y Asociados

- Documentación técnica dentro de `docs/`; el índice vive en
  `docs/README.md`. No crear documentación nueva en la raíz salvo archivos
  canónicos autorizados (`AGENTS.md`, `README.md`, `CHANGELOG.md`).
- Actualizar documentos existentes antes de crear otros. No duplicar
  fuentes de verdad (R2).
- **Informes de agente:** se entregan en la respuesta del agente (formato
  `AGENTS.md` §9), no como archivos Markdown nuevos en la raíz.
- `AGENTS.md` es el protocolo canónico; no reescribir su historia.
- Decisiones arquitectónicas duraderas: ADR en `docs/adr/`.
- El código y las pruebas actuales son la fuente de verdad técnica; los
  informes antiguos son evidencia histórica.
- No guardar outputs, backups, exports, logs ni temporales en el repositorio.
- Usar «bufete», nunca «buffet». No inventar datos legales ni credenciales.
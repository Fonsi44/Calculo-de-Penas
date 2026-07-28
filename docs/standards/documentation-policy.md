---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Política documental

Reglas para mantener la documentación del repositorio organizada y vigente.

---

## Principios

1. **Una fuente por área**: no mantener dos documentos que se declaren canónicos para el mismo tema.
2. **Documentación viva**: cada documento tiene owner, estado y `last_reviewed`.
3. **Código como verdad**: el código y las pruebas son la fuente de verdad técnica; la documentación describe, no prescribe.
4. **Auditorías son históricas**: no se tratan como documentación canónica vigente.

---

## Tipos de documentos

| Tipo | Ubicación | Ejemplo |
|------|-----------|---------|
| Canónico de proyecto | Raíz | `README.md`, `AGENTS.md`, `CHANGELOG.md` |
| Arquitectura | `docs/architecture/` | `sgie-arquitectura.md` |
| Decisión (ADR) | `docs/adr/` | `ADR-012-ai-governance.md` |
| Operaciones | `docs/operations/` | `migrations.md` |
| Seguridad | `docs/security/` | `auth-flow.md` |
| Estándar | `docs/standards/` | `repository-layout.md` |
| Auditoría | `docs/audits/archive/YYYY-MM-DD/` | `auditoria-integral.md` |

---

## Reglas

- **No crear documentos en raíz** salvo los canónicos autorizados.
- **No crear un informe nuevo por cada tarea**. El informe se entrega en la respuesta del agente.
- **Actualizar antes que crear**: si existe un documento del área, se modifica; no se crea uno paralelo.
- **Archivar, no acumular**: las auditorías completadas van a `archive/` con fecha.
- **Eliminar documentación obsoleta**: si un documento describe una arquitectura que ya no existe, se archiva o elimina.
- **Referencias sin archivo**: no referenciar documentos que no existen (ej. `pinedayasociados.md`).

---

## Metadata de documentos

Cada documento vivo debe incluir al inicio:

```markdown
**Owner:** @equipo-responsable
**Status:** draft | review | approved | deprecated
**Last reviewed:** YYYY-MM-DD
**Expires:** YYYY-MM-DD (opcional, para documentos con caducidad)
```

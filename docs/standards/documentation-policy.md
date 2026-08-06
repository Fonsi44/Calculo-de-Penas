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
| Arquitectura | `docs/architecture/` | `fase-2-nucleo-durable-documentos-comunicaciones.md` |
| Decisión (ADR) | `docs/adr/` | `ADR-012-ai-governance.md` |
| Operaciones | `docs/operations/` | `migrations.md` |
| Seguridad | `docs/security/` | `runbook-backup-restore.md` |
| Estándar | `docs/standards/` | `repository-layout.md` |
| SEO / GEO | `docs/seo/` | `current/master-implementation-status.md` |
| Analítica | `docs/analytics/` | `configuracion-y-validacion.md` |
| Roadmap | `docs/roadmaps/active/` y `completed/` | `active/sgie-implementation-checklist.md` |
| Especificación de implementación | `docs/implementation/` | `mvp-fase-1-magic-links-upload-seguro.md` |
| Handoff técnico | `docs/handoffs/` | `fase-2-a-fase-3.md` |
| Auditoría | `docs/audits/archive/YYYY-MM-DD/` | `auditoria-integral.md` |
| Referencia legal | `docs/reference/legal/` | `codigo_de_trabajo.pdf` |

---

## Reglas

- **No crear documentos en raíz** salvo los canónicos autorizados.
- **No crear un informe nuevo por cada tarea**. El informe se entrega en la respuesta del agente.
- **Actualizar antes que crear**: si existe un documento del área, se modifica; no se crea uno paralelo.
- **Archivar, no acumular**: las auditorías completadas van a `docs/audits/archive/` con fecha.
- **Eliminar documentación obsoleta**: si un documento describe una arquitectura que ya no existe, se archiva o elimina.
- **Referencias sin archivo**: no referenciar documentos que no existen (ej. `pinedayasociados.md`).
- **No duplicar árboles**: no mantener dos carpetas paralelas para la misma área (p. ej. `ops/` y `operations/`, o `docs 2/`).

---

## Metadata de documentos

Cada documento **vivo** (estado `current` o `planned`) debe incluir frontmatter
YAML canónico al inicio, validado por `npm run docs:links`:

```yaml
---
status: current
owner: engineering
created: YYYY-MM-DD
last_reviewed: YYYY-MM-DD
review_due: YYYY-MM-DD
supersedes: null
superseded_by: null
---
```

- `status`: `current` | `planned` | `historical` | `deprecated`.
- `owner`: área funcional responsable (engineering, seo, analytics, ops, sgie, legal).
- `created`: fecha de alta del documento.
- `last_reviewed`: fecha de la última revisión real.
- `review_due`: caducidad de revisión (o `null` para `historical`).
- `supersedes` / `superseded_by`: cadena de sustitución entre documentos.
- Las auditorías históricas **no** se marcan como `current`; conservan su
  evidencia sin metadatos de "vigente" salvo `status: historical` cuando se
  añada frontmatter.

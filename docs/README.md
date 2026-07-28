---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Documentación — Pineda y Asociados / Justicia Verdadera

Índice de la documentación canónica del repositorio. Cada área tiene **una única
fuente de verdad**. Los documentos históricos y auditorías viven en `archive/`.

---

## Documentos canónicos (raíz)

| Documento | Área | Descripción |
|-----------|------|-------------|
| `../README.md` | General | Entrada técnica: stack, instalación, estructura, scripts |
| `../AGENTS.md` | Agentes IA | Protocolo canónico para agentes de IA |
| `../CHANGELOG.md` | Releases | Historial de cambios (Keep a Changelog) |
| `../CONTRIBUTING.md` | Contribución | Flujo de trabajo: ramas, PRs, validaciones |

## Arquitectura (`architecture/`)

| Documento | Descripción |
|-----------|-------------|
| `architecture/fase-1-nucleo-admin-identidad-calendario.md` | Fase 1: Admin, identidad, calendario |
| `architecture/fase-2-nucleo-durable-documentos-comunicaciones.md` | Fase 2: Workflows, outbox, OCR, IA |
| `architecture/fase-4a-automatizacion-documental-core.md` | Fase 4A: Pipeline documental |
| `architecture/sgie-arquitectura.md` | Arquitectura general SGIE |

## Decisiones (ADR) (`adr/`)

Las decisiones arquitectónicas duraderas se documentan como ADR. Ver `adr/README.md` para el índice completo.

## Estándares (`standards/`)

| Documento | Descripción |
|-----------|-------------|
| `standards/repository-layout.md` | Estructura del repositorio y reglas de organización |
| `standards/feature-workflow.md` | Flujo para nuevas funciones |
| `standards/documentation-policy.md` | Política documental |
| `standards/scripts-policy.md` | Política de scripts y tooling |

## Operaciones (`operations/`)

| Documento | Descripción |
|-----------|-------------|
| `operations/migrations.md` | Estrategia de migraciones: Drizzle + runner manual |

## Seguridad (`security/`)

Documentación de seguridad, autenticación, autorización y protección de datos.

## Auditorías (`audits/`)

| Carpeta | Contenido |
|---------|-----------|
| `audits/archive/` | Auditorías históricas organizadas por fecha |
| `audits/current/` | Auditorías vigentes |

---

## Reglas

- Un documento por área. No mantener dos documentos que se declaren canónicos para la misma función.
- Las auditorías fechadas no son documentación canónica; son evidencia histórica.
- Toda funcionalidad modificada debe actualizar su documentación.
- Los ADR solo se usan para decisiones arquitectónicas duraderas.
- `last_reviewed` y estado en cada documento vivo.

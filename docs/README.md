---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-08-06
review_due: 2026-11-04
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
| `../CHANGELOG.md` | Releases | Historial de cambios reciente (Keep a Changelog) |
| `../CONTRIBUTING.md` | Contribución | Flujo de trabajo: ramas, PRs, validaciones |

## Arquitectura (`architecture/`)

| Documento | Descripción |
|-----------|-------------|
| `architecture/auditoria-consolidada-viabilidad-sgie.md` | Auditoría consolidada de viabilidad SGIE |
| `architecture/estudio-tecnico-viabilidad-sgie-autonomo.md` | Estudio técnico de SGIE autónomo |
| `architecture/fase-1-nucleo-admin-identidad-calendario.md` | Fase 1: Admin, identidad, calendario |
| `architecture/fase-2-nucleo-durable-documentos-comunicaciones.md` | Fase 2: Workflows, outbox, OCR, IA |
| `architecture/fase-3-experiencia-operativa-cliente.md` | Fase 3: Experiencia operativa del cliente |
| `architecture/fase-4a-automatizacion-documental-core.md` | Fase 4A: Pipeline documental |
| `architecture/fase-4b1-bulk-approval.md` | Fase 4B-1: Aprobación documental en bloque |
| `architecture/staging-production-topology.md` | Topología staging/producción |

## Decisiones (ADR) (`adr/`)

Las decisiones arquitectónicas duraderas se documentan como ADR. Ver
[`adr/README.md`](adr/README.md) para el índice completo (ADR-003 a ADR-013).

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
| `operations/build-and-deploy.md` | Build y deploy |
| `operations/environment-variables.md` | Variables de entorno |
| `operations/staging-*.md` | Validación, despliegue, observabilidad y rollback de staging |
| `operations/production-*.md` | Checklists y go/no-go de producción |

## Seguridad (`security/`)

| Documento | Descripción |
|-----------|-------------|
| `security/runbook-backup-restore.md` | Runbook de backup/restauración |
| `security/runbook-rotacion-credenciales-fase1.md` | Runbook de rotación de credenciales |
| `security/dependency-risks.md` | Riesgos de dependencias |
| `security/incidents/` | Informes de incidentes fechados |

## SEO / GEO (`seo/`)

Ver [`seo/README.md`](seo/README.md) para el índice completo (operativa vigente,
`current/`, `decisions/` y fases históricas).

## Analítica (`analytics/`)

| Documento | Descripción |
|-----------|-------------|
| `analytics/configuracion-y-validacion.md` | Configuración y validación de analítica |

## Auditorías (`audits/`)

| Carpeta | Contenido |
|---------|-----------|
| `audits/archive/` | Auditorías históricas organizadas por fecha |
| `audits/current/` | Auditorías y remediaciones vigentes |
| `audits/fase3c-*`, `fase4a-*`, `fase5a-*` | Evidencia de auditorías de contenido (validadas por tests) |

## Roadmaps (`roadmaps/`)

| Carpeta | Contenido |
|---------|-----------|
| `roadmaps/active/` | Planes en implementación (p. ej. checklist maestro SGIE) |
| `roadmaps/completed/` | Planes ejecutados y cerrados (p. ej. plan maestro SEO) |

## Otras áreas

| Carpeta | Contenido |
|---------|-----------|
| `implementation/` | Especificaciones técnicas de implementación MVP SGIE |
| `handoffs/` | Handoffs técnicos entre fases |
| `changelog/` | Histórico de releases (Releases 1–110) |
| `strategy/` | Documentos de estrategia SGIE |
| `design/` | Auditorías de diseño y sistema de diseño |
| `reference/legal/` | Referencia legal en PDF (códigos y leyes) |

---

## Reglas

- Un documento por área. No mantener dos documentos que se declaren canónicos para la misma función.
- Las auditorías fechadas no son documentación canónica; son evidencia histórica.
- Toda funcionalidad modificada debe actualizar su documentación.
- Los ADR solo se usan para decisiones arquitectónicas duraderas.
- `last_reviewed` y estado en cada documento vivo.

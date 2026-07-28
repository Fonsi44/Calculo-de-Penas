---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Fase 3 — Experiencia operativa, portal del cliente y comunicaciones avanzadas

Estado: implementación local en `main` (commit `be926a5`), migración 0037 aplicable en staging.

## Resumen

Fase 3 construye la experiencia del abogado y del cliente sobre el núcleo durable de Fase 2:

1. **Mi Jornada** — colas accionables (requiere decisión, espera terceros, riesgo, trabajo rápido).
2. **Workspace de expediente** — detalle con pestañas (resumen, documentos, tareas, comunicaciones, historial).
3. **Bandeja de revisión documental** — filtros, acciones y trazabilidad.
4. **Dashboard Admin** — incidencias, riesgo, personas, automatización, salud.
5. **Calendario completo** — equipo, DELETE, todo el día, zona horaria, recordatorios, conflictos.
6. **Portal del cliente** — acceso por enlace seguro, ver/subir/reemplazar documentos.
7. **Inbound** — webhook Resend verificado, relación con expediente/requisito.
8. **Reglas de comunicación** — disparador, condiciones, plantilla, aprobación, versionado.
9. **Simulador de workflow** — dry-run con detección de bloqueos y loops.
10. **Evaluación IA** — panel de métricas, costes, correcciones.
11. **Alertas y SLA** — reglas deterministas para vencimientos, espera, inactividad.

## Servicios creados

| Servicio | Archivo | Propósito |
|----------|---------|-----------|
| WorkQueueService | `lib/sgie/work-queue-service.ts` | Colas accionables de Mi Jornada |
| ReviewService | `lib/sgie/review-service.ts` | Bandeja de revisión documental |
| AdminOperationsService | `lib/sgie/admin-operations-service.ts` | Dashboard admin completo |
| AlertasSlaService | `lib/sgie/alertas-sla-service.ts` | Alertas deterministas y SLA |
| ClientPortalService | `lib/sgie/client-portal-service.ts` | Portal del cliente por token |
| InboundService | `lib/sgie/inbound-service.ts` | Email entrante y webhook Resend |
| CommunicationRulesService | `lib/sgie/communication-rules-service.ts` | Reglas de comunicación |
| WorkflowSimulationService | `lib/sgie/workflow-simulation-service.ts` | Simulación dry-run de workflow |
| AiEvaluationService | `lib/sgie/ai-evaluation-service.ts` | Evaluaciones y métricas IA |

## Páginas creadas

| Ruta | Propósito |
|------|-----------|
| `/intranet/sgie/mi-jornada` | Dashboard personal del abogado |
| `/intranet/sgie/revision-documental` | Bandeja de revisión documental |
| `/intranet/sgie/portal-cliente` | Gestión de enlaces de portal |
| `/intranet/sgie/agenda` | Calendario (mejorado: DELETE, todo el día, equipo) |
| `/intranet/admin` | Dashboard admin (reescrito con 5 grupos) |
| `/intranet/admin/comunicaciones` | Outbox, plantillas, reglas |
| `/intranet/admin/sgie/simulador` | Simulador de workflow |
| `/intranet/admin/sgie/evaluacion-ia` | Panel de evaluación IA |
| `/intranet/admin/sgie/alertas` | Alertas y SLA |
| `/intranet/admin/sgie/reglas-comunicacion` | Reglas de comunicación |

## Migración 0037

Tablas: `alertas_sla`, `inbound_messages`, `portal_sessions`, `communication_rules`, `workflow_snapshots`, `user_activity_log`.

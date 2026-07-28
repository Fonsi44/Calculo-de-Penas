---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# ADR-009: Estrategia de alertas y SLA

## Contexto
El sistema necesita notificar proactivamente sobre vencimientos, documentos pendientes, inactividad y errores de procesamiento.

## Decisión
- Alertas deterministas generadas por worker programado (mismo cron de Fase 2).
- Sin predicción: solo reglas explícitas configurables.
- Severidades: info, advertencia, error, crítico.
- Estados: abierta, en_progreso, pospuesta, resuelta, descartada_con_motivo.
- Cada alerta tiene propietario, recurso, expediente y auditoría.
- SLA tracking: tiempos de respuesta por tipo de alerta.
- Las alertas se muestran en Mi Jornada, Dashboard y página dedicada.

## Consecuencias
- Sin falsos positivos de ML.
- Las alertas son accionables y auditables.
- No hay reentrenamiento automático.

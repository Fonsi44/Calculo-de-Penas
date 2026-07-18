# Handoff técnico — Fase 3 a Fase 4

Fecha de cierre: 18 de julio de 2026. Commit: `be926a5`.

## Estado final de Fase 3

Fase 3 completa la experiencia operativa del abogado, el portal del cliente y las comunicaciones avanzadas sobre el núcleo durable de Fase 2.

### Implementado
- Mi Jornada con 4 colas accionables
- Workspace de expediente con pestañas
- Bandeja de revisión documental con 8 filtros y 9 acciones
- Dashboard Admin con 5 grupos de métricas
- Calendario con DELETE, equipo, todo el día, participantes
- Portal del cliente con enlace seguro
- Inbound email con webhook Resend
- Reglas de comunicación versionadas
- Simulador de workflow dry-run
- Evaluación IA con métricas y costes
- Alertas y SLA deterministas

### Pendiente para Fase 4
- Firma electrónica mediante adaptador independiente
- Workspace global del abogado ("Mi jornada" avanzado)
- Calendario externo (Google Calendar, Outlook)
- Copiloto global con RAG transversal
- Predicción y next best action
- Dashboard operativo completo
- Historial, próxima acción y calendario avanzado

## Invariantes que no deben romperse

1-10: mismas que Fase 1 y 2.
11. Portal cliente expone solo datos del expediente vinculado al enlace.
12. Inbound nunca cambia estados críticos automáticamente.
13. Reglas de comunicación solo envían con plantillas activas.
14. Simulador nunca escribe datos reales ni envía correos.

## Tests
- 54 suites, 963 tests (incluyendo 24 de Fase 2 y 22 de Fase 3)
- E2E Fase 3 en `scripts/e2e/fase3-e2e.mjs` (requiere DB aislada)

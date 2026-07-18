# Handoff técnico — Fase 3 a Fase 4

Fecha de cierre: 18 de julio de 2026. Commit de cierre del E2E: ver
`CHANGELOG.md`. (El commit `be926a5` cerró la **implementación** funcional;
el E2E real se validó posteriormente corrigiendo el script `fase3-e2e.mjs`.)

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
- 54 suites, 963 tests (incluyendo 24 de Fase 2 y 22 de Fase 3).
- **E2E Fase 2**: `scripts/e2e/fase2-e2e.mjs` — 9/9 pasos verificados en
  rama Neon aislada.
- **E2E Fase 3**: `scripts/e2e/fase3-e2e.mjs` — 70/70 assertions verificadas
  en rama Neon aislada, con providers reales (DeepSeek + Resend) y limpieza
  completa de fixtures. Requiere DB aislada; usar el runner
  `scripts/e2e/run-fase3-isolated.mjs` para configurar el entorno en memoria.

### Correcciones del E2E de Fase 3 (18 jul 2026)
El script `fase3-e2e.mjs` previo tenía 9 fallos bloqueantes que impedían su
ejecución (columnas inexistentes: `rol`→`rol_inicial`, `creado_por`→
`creada_por`, `configuracion` en `usuarios_sgie`, `task_type`/`estado` en
`extracciones_ia`, `creado_en` en `ai_task_routing`; tablas inexistentes:
`calendario`→`eventos_agenda`, `log_sgie`→`auditoria_eventos`; enum inválido
`completado`→`aprobado`; hash >64 chars; limpieza inerte por `id LIKE 'f3e2e%'`
sobre UUIDs aleatorios). El script se reescribió alineado al schema real y a
las migraciones 0032–0037, con assertions de concurrencia/DLQ/portal/cron/
DeepSeek/Resend y limpieza robusta por ID tracking + segundo pase.

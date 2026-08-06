# Handoff técnico — Fase 2 a Fase 3

Fecha de cierre: 18 de julio de 2026. Commit: `c74840d`.

## Estado final de Fase 2

La Fase 2 implementa el núcleo durable de procedimientos, documentos, comunicaciones, OCR e IA sobre el SGIE. Consta de 9 subsistemas integrados con la Fase 1 existente:

| Subsistema | Archivos | Estado |
|-----------|----------|--------|
| Workflow engine | `lib/sgie/workflow.ts` | COMPLETADO |
| Job queue durable | `lib/sgie/jobs-db.ts` | COMPLETADO |
| Transactional outbox | `lib/sgie/outbox.ts` | COMPLETADO |
| Subida atómica | `lib/sgie/upload-atomico.ts` | COMPLETADO |
| Pipeline documental | `app/api/cron/sgie/procesar/route.ts`, `lib/sgie/motor-documental.ts` | COMPLETADO |
| OCR | `lib/sgie/ocr/provider.ts`, `lib/sgie/ocr/tesseract.ts` | COMPLETADO (stub por defecto) |
| AI Router | `lib/sgie/ia-router.ts`, `lib/sgie/ia-documental.ts` | COMPLETADO |
| Comunicaciones | `lib/sgie/correos-db.ts` | COMPLETADO |
| Observabilidad | `lib/sgie/observabilidad.ts` | COMPLETADO |

Además:
- Endpoint de métricas admin: `app/api/admin/sgie/metricas/route.ts`
- Endpoint de carga pública: `app/api/public/cargar/[token]/route.ts`
- Endpoint de procesamiento: `app/api/sgie/documentos/[id]/procesar/route.ts`
- Endpoint de rechazo: `app/api/sgie/documentos/[id]/rechazar/route.ts`
- E2E documental: `scripts/e2e/fase2-e2e.mjs`
- Documentación de arquitectura: `docs/architecture/fase-2-nucleo-durable-documentos-comunicaciones.md`
- ADRs: `docs/adr/ADR-003` a `ADR-006`

Migraciones:
- `0034_fase2_workflows_outbox_jobs.sql`: workflow engine, outbox, jobs durables, comunicaciones outbox base
- `0035_fase2_documents_ocr_ai.sql`: OCR resultados, AI task routing, pipeline tracking
- `0036_fase2_communications.sql`: plantillas versionadas, delivery tracking, webhooks, auditoría

## Invariantes que no deben romperse

1. **Autenticación cron**: `GET /api/cron/sgie/procesar` requiere `Authorization: Bearer <CRON_SECRET>`. Sin CRON_SECRET en servidor, retorna 500.
2. **Carga pública**: solo vía enlace mágico con token hash SHA-256. Rate limit 10/15min por IP.
3. **Idempotencia en jobs**: `encolarJob` con `idempotencyKey` y `onConflictDoNothing` por (tipo, refId, ventana_temporal). No crear jobs duplicados.
4. **Idempotencia en correos**: `enviarCorreo` con `onConflictDoNothing` por (expediente_id, plantilla_slug, ventana_temporal).
5. **Transaccionalidad**: `registrarDocumentoAtomico` es una transacción DB que inserta documento + outbox event + job. Si falla, compensa blob huérfano.
6. **Dead-letter después de N intentos**: por defecto 3. La DLQ no se reprocesa automáticamente; requiere reintento manual vía `reintentarJob()`.
7. **OCR stub nunca inventa texto**: sin OCR_PROVIDER real, `processDocument()` retorna `success:false`. El documento queda en `ocr_pendiente`.
8. **Sin acceso público a procesamiento/rechazo**: requireAbogado + CSRF + verificación de asignación/permiso.
9. **FOR UPDATE SKIP LOCKED**: dos workers no procesan el mismo job. Locks abandonados se recuperan después de expiración.
10. **Misma rama main**: todo el trabajo está en `main`. No crear ramas ni worktrees.

## Deuda técnica conocida

- **OCR Tesseract.js**: funcional pero sin pruebas de rendimiento con PDFs de muchas páginas. `OffscreenCanvas` puede no estar disponible en entornos Node.js sin headless Chromium.
- **OCR stub por defecto**: sin OCR real configurado, los documentos escaneados quedan en `ocr_pendiente`. No hay alerta automática.
- **Correos sin Resend real**: `enviarCorreo()` funciona, pero sin `RESEND_API_KEY` los correos quedan en estado `fallido` con error documentado. No hay cola de reintentos automática para correos fallidos (más allá del outbox).
- **Snapshots Drizzle**: el journal tiene 36 entradas pero los snapshots terminan en 0023. No ejecutar `drizzle-kit generate` sobre este historial — puede proponer renames ambiguos. Usar `drizzle-kit check`.
- **Equipos sin UI de gestión**: el modelo de equipos existe desde Fase 1 pero no hay interfaz para gestionarlos.
- **E2E Fase 2**: el script `fase2-e2e.mjs` inserta directamente en DB (no usa las rutas API reales). La verificación de atomicidad contra endpoints HTTP reales queda pendiente.
- **No hay endpoints para reprocesar desde DLQ**: `reintentarJob()` existe pero no hay API que lo exponga.
- **No hay UI admin para tareas de IA pendientes de revisión**: `obtenerTareasPendientesRevision()` existe pero no hay pantalla que lo consume.

## Qué debe priorizar Fase 3

### Portal del cliente y comunicaciones avanzadas

1. **Portal seguro del cliente**: autenticación del cliente para ver estado de expedientes, documentos y comunicaciones.
2. **Resend real**: configurar `RESEND_API_KEY`, validar entrega con webhooks, implementar inbound email.
3. **Recordatorios automáticos**: el motor de recordatorios existe (`lib/sgie/motor-recordatorios.ts`), necesita activación y UI.
4. **Envío programado**: `comunicaciones_outbox.programadoPara` soporta envíos diferidos; falta UI para gestionarlos.

### Mejoras a Fase 2

5. **API de reintento desde DLQ**: exponer `reintentarJob()` vía endpoint admin.
6. **UI de revisión IA**: pantalla para que abogados revisen tareas pendientes de `ai_task_routing`.
7. **Dashboard de métricas**: consumir `obtenerMetricasOperativas()` en una página admin.
8. **OCR real**: si se necesita, configurar `OCR_PROVIDER=google|aws|azure` implementando la interfaz `OcrProvider`.

### Experiencia del abogado

9. **Mi jornada / bandeja de tareas**: vista unificada de expedientes, documentos pendientes, comunicaciones.
10. **Operaciones por lote**: seleccionar múltiples documentos para procesar/rechazar en lote.

## Requeridos tests antes de Fase 3

```bash
# Validación universal
npm run lint
npx tsc --noEmit

# Tests del core Fase 2
npx vitest run lib/sgie/ --reporter=verbose

# E2E documental (requiere DB aislada)
node scripts/e2e/fase2-e2e.mjs

# Build
npm run build
```

No debe haber errores de lint ni TypeScript. El E2E debe pasar completamente (todos los pasos 1–10). Cualquier fallo debe resolverse antes de comenzar Fase 3.

## Referencias

- [Arquitectura Fase 2](../architecture/fase-2-nucleo-durable-documentos-comunicaciones.md)
- [ADR-003: Job queue strategy](../adr/ADR-003-job-queue-strategy.md)
- [ADR-004: Outbox pattern](../adr/ADR-004-outbox-pattern.md)
- [ADR-005: OCR strategy](../adr/ADR-005-ocr-strategy.md)
- [ADR-006: AI router](../adr/ADR-006-ai-router.md)
- [Checklist maestro](../roadmaps/active/sgie-implementation-checklist.md)

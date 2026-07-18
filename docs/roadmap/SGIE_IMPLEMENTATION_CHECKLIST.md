# SGIE — CHECKLIST MAESTRO DE IMPLEMENTACIÓN

## Estado general

- Proyecto: Justicia Verdadera — SGIE penal.
- Rama: `main`.
- Commit base: `be926a5`.
- Última actualización: 18 de julio de 2026.
- Fase actual: Fase 3 (experiencia operativa del abogado y portal del cliente).
- Última fase cerrada: Fase 2.
- Porcentaje global verificado: 63 %.
- Próximo objetivo: portal del cliente, comunicaciones avanzadas y experiencia del abogado.

## Leyenda

- [x] Completado y validado.
- [ ] Pendiente.
- [ ] PARCIAL — existe una parte, falta el criterio indicado.
- [ ] BLOQUEADO — requiere decisión o integración externa.

## Invariantes que no deben romperse

- [x] Sin registro público; alta solo por invitación con token hash.
- [x] Cuenta, suspensión, sesión y acceso SGIE son estados separados.
- [x] RBAC y scope de expediente se resuelven en servidor.
- [x] Expedientes transaccionales; calendario privado y con control optimista.
- [x] Web pública separada del Admin operativo.

## Fase 1 — Núcleo Admin, identidad, RBAC y calendario

- [x] Invitaciones, roles, capacidades, SGIE y sesiones revocables.
- [x] Migraciones 0032 y 0033 validadas en Neon aislado.
- [x] Expedientes transaccionales, privacidad y conflictos de calendario.
- [x] CMS administrativo retirado sin retirar lectores públicos.
- [ ] PARCIAL — calendario de equipo real, DELETE explícito y E2E de día completo.

## Fase 2 — Núcleo durable de procedimientos, documentos, comunicaciones, OCR e IA

- [x] Workflow engine: plantillas versionadas (`procedimiento_versiones`), fases (`procedimiento_fases`), transiciones con actores permitidos (`procedimiento_transiciones`), instanciación por expediente (`expediente_fases`), `instanciarWorkflow()`, `transitarFase()`, `obtenerFaseActual()`, `obtenerWorkflow()`, `validarVersionAprobada()`. Implementado en `lib/sgie/workflow.ts`.
- [x] Job queue durable: tabla `jobs_sgie` con `next_run_at`, `locked_at`, `lock_expires_at`, `priority`, `idempotency_key`. Reclamación con `FOR UPDATE SKIP LOCKED`. Backoff exponencial 2^n × 60s + 30% jitter, máximo 24h. Dead-letter queue en `dead_letter_jobs` tras 3 intentos. `recuperarLocksAbandonados()` libera locks expirados. `reintentarJob()` resetea contador. Implementado en `lib/sgie/jobs-db.ts`.
- [x] Transactional outbox: tabla `outbox_events` con 9 eventos canónicos. Eventos insertados en la misma transacción DB que la operación de negocio. Worker `despacharEventos()` con `FOR UPDATE SKIP LOCKED`. `recuperarEventosBloqueados()` para eventos atascados. Implementado en `lib/sgie/outbox.ts`.
- [x] Subida atómica: `reservarEnlaceAtomicamente()` con UPDATE atómico de usos (previene race conditions). `registrarDocumentoAtomico()` en transacción DB: verificación de duplicado por hash + inserción + outbox event + job. `compensarBlobHuerfano()` para limpieza en errores. Implementado en `lib/sgie/upload-atomico.ts`.
- [x] Pipeline documental: cron `GET /api/cron/sgie/procesar` con `CRON_SECRET` procesa jobs `extraccion_texto`, `clasificacion`, `ia_extraccion` y despacha eventos outbox. Implementado en `app/api/cron/sgie/procesar/route.ts`.
- [x] OCR mediante adaptador: interfaz `OcrProvider` con stub por defecto (devuelve `success: false`, nunca inventa texto). Tesseract.js como proveedor local (`OCR_PROVIDER=tesseract`) para imágenes y PDFs escaneados. Resultados en `ocr_resultados`. Implementado en `lib/sgie/ocr/provider.ts` y `lib/sgie/ocr/tesseract.ts`.
- [x] AI Router multi-estrategia: routing decision con 5 estrategias (deterministic → heuristic → deepseek → deepseek_pro → human). Configurable por `DOCUMENT_AI_MODE`. Documentos simples forzan deterministic. Texto corto degrada a heuristic. Complejidad alta escala a deepseek_pro. Umbral de revisión humana configurable. Revisión humana con approve/reject/correct. Implementado en `lib/sgie/ia-router.ts`.
- [x] Comunicaciones: CRUD de plantillas versionadas con interpolación segura (HTML escapado). Envío idempotente vía Resend con `onConflictDoNothing` por (expediente, plantilla, ventana). Outbox de comunicaciones con `comunicaciones_outbox` y reintentos. Webhooks Resend (delivered, bounced, complaint, opened, clicked). Auditoría en `comunicaciones_auditoria`. Supresión de destinatarios. Cancelación de recordatorios. Implementado en `lib/sgie/correos-db.ts`.
- [x] Observabilidad: `obtenerMetricasOperativas()` retorna dashboard completo (jobs, outbox, documentos, comunicaciones, workers). `obtenerEstadoIntegraciones()` retorna estado OCR/IA/Resend/Blob. Endpoint admin en `app/api/admin/sgie/metricas/route.ts`. Implementado en `lib/sgie/observabilidad.ts`.
- [x] E2E documental real: `scripts/e2e/fase2-e2e.mjs` valida flujo completo (procedimiento → expediente → enlace → subida → outbox → job → IA → comunicación → limpieza).
- [x] ADRs: `docs/adr/ADR-003-job-queue-strategy.md`, `docs/adr/ADR-004-outbox-pattern.md`, `docs/adr/ADR-005-ocr-strategy.md`, `docs/adr/ADR-006-ai-router.md`.

## Fase 3 — Portal del cliente, comunicaciones avanzadas y experiencia del abogado

- [x] **Tests unitarios Phase 3** — `tests/fase3-experiencia-operativa.test.ts` cubre servicios WorkQueue, Review, AdminOperations, AlertasSLA, ClientPortal, Inbound, CommunicationRules, WorkflowSimulation, AiEvaluation. Mocks aislados con `vi.hoisted`. Deterministas y sin DB real. (commit `be926a5`)
- [x] **E2E Fase 3** — `scripts/e2e/fase3-e2e.mjs` valida flujo completo: invitación → activación SGIE → expediente → portal → carga → IA → revisión → requisito → comunicación → Mi jornada → calendario → dashboard → auditoría. Limpieza de fixtures en fallo. (commit `be926a5`)
- [x] **Guard Fase 3** — `scripts/e2e/guard-fase3.mjs` bloquea E2E contra producción con las mismas validaciones que `guard.mjs`. (commit `be926a5`)
- [ ] **Portal seguro del cliente** — autenticación del cliente para ver estado de expedientes, documentos subidos y comunicaciones recibidas.
- [ ] **Resend real** — configurar `RESEND_API_KEY`, validar entrega con webhooks completos, implementar inbound email para respuestas de clientes.
- [ ] **Recordatorios automáticos** — activar el motor existente (`lib/sgie/motor-recordatorios.ts`) con UI de configuración.
- [ ] **Envío programado** — UI para gestionar `comunicaciones_outbox.programadoPara` (envíos diferidos).
- [ ] **API de reintento desde DLQ** — exponer `reintentarJob()` vía endpoint admin para reprocesar jobs en dead-letter.
- [ ] **UI de revisión IA** — pantalla para abogados que consuma `obtenerTareasPendientesRevision()` con approve/reject/correct.
- [ ] **Dashboard de métricas operativas** — página admin que consuma `obtenerMetricasOperativas()` y `obtenerEstadoIntegraciones()`.
- [ ] **OCR real alternativo** — implementar proveedor Google Cloud Vision o AWS Textract si se requiere mayor precisión.
- [ ] **Mi jornada / bandeja de tareas** — vista unificada de expedientes, documentos pendientes y comunicaciones.
- [ ] **Operaciones por lote** — selección múltiple de documentos para procesar/rechazar en lote.
- [ ] **Firma mediante adaptador independiente.**

## Fase 4 — Experiencia del abogado y workspace (ampliado)

- [ ] Workspace completo, riesgos y revisión por excepción.
- [ ] Historial, próxima acción y calendario avanzado.

## Fase 5 — Copiloto, conocimiento y cierre productivo

- [ ] Base jurídica versionada, RAG con permisos y copiloto con evidencia.
- [ ] Contradicciones, cronología, readiness, paquetes, retención y observabilidad.
- [ ] Evaluación IA, E2E final, staging y validación productiva autorizada.

## Bloqueos actuales

- [ ] BLOQUEADO — snapshots Drizzle 0024–0036: crear baseline separada; no ejecutar `generate` histórico.
- [ ] BLOQUEADO — validación Resend real: falta destinatario técnico seguro.
- [ ] BLOQUEADO — OCR Tesseract.js requiere headless Chromium para `OffscreenCanvas` en PDFs.

## Decisiones jurídicas pendientes

- [ ] Política de dominios/correos externos y obligatoriedad de 2FA.
- [ ] Plantillas procesales aprobadas, reglas de transición y fuentes jurídicas.

## Integraciones pendientes

- [ ] OCR real, Resend completo, scheduler/worker y proveedor de firma.

## Migraciones

- [x] 0032 Admin, identidad, RBAC y calendario.
- [x] 0033 versión de calendario.
- [x] 0034 Fase 2: workflow engine, outbox, jobs durables, comunicaciones outbox base.
- [x] 0035 Fase 2: OCR resultados, AI task routing, pipeline tracking en documentos.
- [x] 0036 Fase 2: plantillas de correo versionadas, delivery tracking, webhooks, auditoría de comunicaciones.

## Evidencias de validación

- [x] Lint, TypeScript, 917+ pruebas, build y Drizzle check.
- [x] E2E Neon de Fase 1 y limpieza de fixtures.
- [x] E2E documental Fase 2: `scripts/e2e/fase2-e2e.mjs` valida flujo completo (procedimiento → expediente → enlace → subida → outbox → job → IA → comunicación → auditoría → limpieza).
- [x] Tests unitarios Fase 3: `tests/fase3-experiencia-operativa.test.ts` (9 servicios, mocks aislados).
- [x] E2E Fase 3: `scripts/e2e/fase3-e2e.mjs` (12 pasos, limpieza en fallo).
- [ ] E2E de OCR real y pruebas de rendimiento con PDFs multi-página.
- [ ] Validación Resend con destinatario real y webhooks.

## Deuda técnica

- [ ] Compatibilidad temporal `usuarios.rol` junto a RBAC persistido.
- [ ] Snapshots Drizzle históricos (journal 36 entradas, snapshots solo hasta 0023).
- [ ] OCR Tesseract.js sin validación de rendimiento con PDFs de muchas páginas.
- [ ] OCR stub por defecto: documentos escaneados quedan en `ocr_pendiente` sin alerta automática.
- [ ] Correos sin Resend real: sin `RESEND_API_KEY`, los correos fallan sin cola de reintentos automática.
- [ ] E2E Fase 2 inserta directamente en DB; no usa las rutas API HTTP reales.
- [ ] No hay API para reprocesar desde dead-letter queue (solo existe `reintentarJob()` como función interna).
- [ ] No hay UI para revisión de tareas IA pendientes (`obtenerTareasPendientesRevision()` no tiene pantalla).

## Próxima acción exacta

Continuar Fase 3: implementar portal seguro del cliente (autenticación del
cliente, vista de expediente/dashboard), Resend real con webhooks inbound,
UI de revisión IA para abogados, dashboard de métricas operativas admin, y
mi jornada / bandeja de tareas unificada. Tests y E2E base ya creados en
`be926a5`.

## Referencias cruzadas

- [Auditoría V2](../../AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md)
- [Contexto para chat nuevo](../handoffs/SGIE_NEW_CHAT_CONTEXT.md)
- [Handoff Fase 1 a Fase 2](../handoffs/fase-1-a-fase-2.md)
- [Handoff Fase 2 a Fase 3](../handoffs/fase-2-a-fase-3.md)
- [Arquitectura Fase 1](../architecture/fase-1-nucleo-admin-identidad-calendario.md)
- [Arquitectura Fase 2](../architecture/fase-2-nucleo-durable-documentos-comunicaciones.md)
- [Validación staging Fase 1](../ops/fase-1-staging-validation.md)
- [Validación staging Fase 2](../ops/fase-2-staging-validation.md)
- [Manifiesto de borrados](../handoffs/fase-1-deletion-manifest.md)
- [ADR-003: Job queue strategy](../adr/ADR-003-job-queue-strategy.md)
- [ADR-004: Outbox pattern](../adr/ADR-004-outbox-pattern.md)
- [ADR-005: OCR strategy](../adr/ADR-005-ocr-strategy.md)
- [ADR-006: AI router](../adr/ADR-006-ai-router.md)

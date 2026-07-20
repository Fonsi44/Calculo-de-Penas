# Contexto para un chat nuevo — Justicia Verdadera SGIE

## Proyecto

Justicia Verdadera es un SGIE penal para Honduras, construido con Next.js,
TypeScript, Drizzle/PostgreSQL Neon y Vitest. El objetivo es transformar la
intranet en un sistema de trabajo jurídico seguro: expediente, documentos,
requisitos, automatización y revisión humana.

## Forma de trabajo

Usar un único prompt amplio por fase. El usuario ejecuta, devuelve el resultado
completo, el orquestador revisa y se corrige o se avanza. No crear microfases,
no hacer commit/push/merge/despliegue sin autorización y no iniciar trabajo fuera
de la fase solicitada.

## Fuentes de verdad

1. `AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md`.
2. `docs/roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md`.
3. Código, migraciones y tests actuales.
4. `docs/handoffs/fase-1-a-fase-2.md`.
5. `docs/architecture/fase-1-nucleo-admin-identidad-calendario.md` y
   `docs/ops/fase-1-staging-validation.md`.
6. `docs/handoffs/fase-1-deletion-manifest.md`.

## Fase 1

Estado: cerrada. Implementó invitaciones, auth, RBAC, acceso SGIE,
expedientes transaccionales, calendario privado y optimista, migraciones
0032/0033 y retirada del CMS Admin. Se validó en Neon aislado.
Invariantes: sin registro público, tokens hash, servidor autoritativo,
scope de expediente, calendario privado y web pública separada.

## Fase 2

Estado: cerrada. Implementó el núcleo durable de procedimientos,
documentos, comunicaciones, OCR e IA:

- **Workflow engine:** procedimiento_versiones, fases, transiciones,
  instanciación por expediente, control de versiones y aprobación.
- **Cola durable:** FOR UPDATE SKIP LOCKED, backoff exponencial con
  jitter, dead-letter queue, recuperación de locks, job_attempts.
- **Outbox transaccional:** eventos de dominio (case.created,
  document.uploaded, etc.) en la misma transacción que el cambio.
- **Carga atómica:** reserva atómica de enlace mágico, duplicado por
  hash, compensación de blob huérfano.
- **Worker/scheduler:** endpoint cron autenticado con CRON_SECRET,
  lotes configurables, locks, reclamación atómica.
- **OCR real:** Tesseract.js con interfaz OcrProvider, degradación
  controlada cuando no hay proveedor.
- **Router IA:** 4 estrategias (determinista → heurístico → DeepSeek →
  humano), 4 tipos de tarea, registro en ai_task_routing.
- **Comunicaciones:** outbox durable, webhook Resend, supresión,
  cancelación de recordatorios, versionado de plantillas.
- **Observabilidad:** endpoint de métricas operativas (jobs, outbox,
  documentos, comunicaciones, integraciones).
- Migraciones 0034, 0035, 0036 verificadas con drizzle-kit check.
- Tests: 52 suites, 917 tests, todos correctos.
- Lint, TypeScript y build correctos.

## Fase 3

Estado: cerrada y validada (commit `8c931af`). Mi Jornada, workspace de
expediente, bandeja de revisión, dashboard Admin, calendario completo
(equipo, día completo, 409), portal del cliente, inbound email, reglas de
comunicación, simulador workflow, evaluación IA, alertas/SLA. Migración 0037.
E2E Fase 3: 70/70 assertions con DeepSeek + Resend reales.

## Fase 4A

Estado: **CERTIFICADA al 100%** (commits `7de4fd1`, `6f79b86`, `39f86b7` + certificación E2E 20-07-2026). Automatización documental core P2-01 a P2-06 integrada vía
`DocumentAutomationOrchestrator`. FeatureFlagService con deny-by-default,
6 scopes, kill switch admin, cache y auditoría. Prompt injection defense.
Migraciones 0038–0043 (idempotentes, hash SHA-256). ADR-010/011/012.
Bug 5 (fuente firma pendiente en P2-06), Bug 6 (`setFlag` atómico con
`FOR UPDATE`+`ON CONFLICT`), Bug 7 (kill switch con `settings.manage`),
Bug 8 (`fetchApplicable` optimizado con `WHERE OR` por scope).
Certificación E2E real (20-07-2026): Fase 4A 19/19 con DeepSeek
`deepseek-v4-flash`, Fase 2 9/9, Fase 3 70/70 (DeepSeek + Resend reales)
sobre rama Neon aislada efímera (eliminada, cero residuos). Suite serial
1065/1065, lint/tsc/build/drizzle-kit check limpios, web pública intacta.

## Restricciones

(mismas que antes)

## Prompt de arranque para un chat nuevo (Fase 4B)

```text
Lee primero AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md (sección 63),
docs/roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md y
docs/handoffs/SGIE_NEW_CHAT_CONTEXT.md. Revisa el repositorio real y
continúa únicamente con Fase 4B: aprobación en bloque (P2-07), paquete de
firma (P2-08), firma electrónica (P2-09), calendario externo (P2-10),
retrieval FTS/pg_trgm, copiloto tool calling y base de conocimiento jurídica.
No rehagas Fases 1/2/3/4A, no modifiques la web pública, no uses producción
ni datos reales, y no hagas commit/push/merge/despliegue.
```

## Referencias cruzadas

- [Auditoría V2](../../AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md)
- [Checklist maestro](../roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md)
- [Handoff Fase 1 a Fase 2](fase-1-a-fase-2.md)
- [Handoff Fase 2 a Fase 3](fase-2-a-fase-3.md)
- [Handoff Fase 3 a Fase 4](fase-3-a-fase-4.md)
- [Handoff Fase 4A](fase-4a-hardening-and-validation.md)
- [Arquitectura Fase 1](../architecture/fase-1-nucleo-admin-identidad-calendario.md)
- [Arquitectura Fase 2](../architecture/fase-2-nucleo-durable-documentos-comunicaciones.md)
- [Arquitectura Fase 4A](../architecture/fase-4a-automatizacion-documental-core.md)
- [Validación Fase 2](../ops/fase-2-staging-validation.md)
- [Validación Fase 4A](../ops/fase-4a-staging-validation.md)
- [Manifiesto de borrados](fase-1-deletion-manifest.md)
- [ADR-010 Feature flags](../adr/ADR-010-feature-flags-and-kill-switches.md)
- [ADR-011 Orchestrator](../adr/ADR-011-document-automation-orchestrator.md)
- [ADR-012 Gobernanza IA](../adr/ADR-012-ai-governance-and-prompt-injection.md)

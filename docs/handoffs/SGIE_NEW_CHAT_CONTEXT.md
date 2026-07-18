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

## Restricciones

(mismas que antes)

## Prompt de arranque para un chat nuevo (Fase 3)

```text
Lee primero AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md,
docs/roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md y
docs/handoffs/SGIE_NEW_CHAT_CONTEXT.md. Revisa el repositorio real y
continúa únicamente con Fase 3: comunicaciones avanzadas, portal del
cliente y experiencia del abogado.
No rehagas Fase 1/2, no modifiques la web pública, no uses producción
ni datos reales, y no hagas commit/push/merge/despliegue.
```

## Referencias cruzadas

- [Auditoría V2](../../AUDITORIA_COMPLETA_RECONSTRUCCION_INTRANET_SGIE_V2.md)
- [Checklist maestro](../roadmap/SGIE_IMPLEMENTATION_CHECKLIST.md)
- [Handoff Fase 1 a Fase 2](fase-1-a-fase-2.md)
- [Handoff Fase 2 a Fase 3](fase-2-a-fase-3.md)
- [Arquitectura Fase 1](../architecture/fase-1-nucleo-admin-identidad-calendario.md)
- [Arquitectura Fase 2](../architecture/fase-2-nucleo-durable-documentos-comunicaciones.md)
- [Validación Fase 2](../ops/fase-2-staging-validation.md)
- [Manifiesto de borrados](fase-1-deletion-manifest.md)

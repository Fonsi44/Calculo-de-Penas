# Fase 2 MVP — seguimiento documental, recordatorios y bloqueo por cliente

**Fecha:** 9 de julio de 2026
**Base documental:** Fase 1 (`docs/implementation/mvp-fase-1-magic-links-upload-seguro.md`), auditoría y estudios de `docs/architecture/` y `docs/strategy/`.
**Tipo de documento:** Especificación + implementación realizada.
**Carácter:** técnico y accionable. Sin IA, sin OCR, sin SEJE, sin retención automatizada, sin tocar la web pública.

---

## 1. Objetivo de la Fase 2

Convertir la Fase 1 (magic links + upload seguro) en un **flujo documental gestionado**: SGIE sabe qué documentación falta, envía recordatorios al cliente, actualiza estados del expediente, bloquea expedientes por falta de respuesta y escala internamente al asistente/abogado. **Sin IA ni OCR.**

## 2. Qué ya existía (no rehecho)

- **Checklists**: `crearExpediente` instancia `requisitos_expediente` desde `definicion.jsonb` de `tipos_procedimiento`; `confirmarChecklist` los marca confirmados y pasa a `pendiente_de_documentos`.
- **Transiciones**: `transicionPermitida` (mapa de adyacencia), `cambiarEstadoExpediente` (audita en `historial_expediente`).
- **Documentos**: `registrarDocumento`, `aprobarDocumento`, `rechazarDocumento`.
- **Emails idempotentes** (al abogado): `notificaciones-email.ts` con patrón `ventana_temporal`.
- **Cron**: `/api/cron/sgie/procesar` protegido por `CRON_SECRET`.
- **Vista de detalle**: `app/intranet/sgie/expedientes/[id]/page.tsx` con checklist, documentos y enlaces.

## 3. Qué se implementó en la Fase 2

### 3.1 Schema (`lib/schema.ts`) y migración 0026
- Enum `expediente_estado`: añadido `'bloqueado_por_cliente'`.
- Enum `auditoria_accion`: añadidos `'reminder_sent'`, `'case_blocked_by_client'`, `'case_unblocked'`, `'internal_escalation_created'`.
- Enum `job_sgie_tipo`: ya incluía `'recordatorio'` (reutilizado, sin cambio).
- `estados.ts`: label de `bloqueado_por_cliente`.
- Migración `drizzle/migrations/0026_fase2_bloqueo_recordatorios.sql` + journal idx 26.

**Decisión de estados**: reutilizar existentes. `rechazado` = rechazo manual; `no_aplica` se representa con `confirmado: true` + estado `aprobado` (excluido del cómputo de obligatorios pendientes). Solo se añade `bloqueado_por_cliente` al enum.

### 3.2 Nuevos módulos `lib/sgie/`
- **`config-seguimiento.ts`**: constantes del motor (DIAS_PRIMER_RECUERDO=3, DIAS_SEGUNDO_RECUERDO=7, DIAS_BLOQUEO=14, MAX_RECORDATORIOS=2), slugs de plantillas y función pura `accionSegunDias(dias, enviados)`.
- **`seguimiento-documental.ts`**: `calcularEstadoDocumental` (pura), `marcarRequisitoNoAplica`, `vincularDocumentoARequisitoOnUpload`, `recalcularYAvanzarEstadoDocumental`, `rechazarDocumentoManual` (reabre requisito), `desbloquearExpediente`, `bloquearExpedientePorCliente`.
- **`recordatorios-cliente.ts`**: `enviarSolicitudDocumental`, `enviarRecordatorio` (1/2), `enviarAvisoBloqueo`, `enviarConfirmacionRecepcion`, `enviarSolicitudCorreccion`. Idempotentes (slug+expediente+ventana en `correos_enviados`). El token del enlace va **solo** en el HTML del email, nunca en logs/auditoría.
- **`motor-recordatorios.ts`**: `procesarRecordatoriosPendientes()` — job idempotente que recorre expedientes en espera con obligatorios pendientes, dispara recordatorios/aviso/bloqueo según días, y escala (tarea+alerta+auditoría) al responsable.

### 3.3 Cron
`app/api/cron/sgie/procesar/route.ts` ahora invoca también `procesarRecordatoriosPendientes()`. Mantiene protección `CRON_SECRET`. Recomendado: 1×/día en Vercel Cron.

### 3.4 Rutas API internas (auth `requireAbogado` + CSRF + rate limit)
- `POST /api/sgie/expedientes/[id]/seguimiento/solicitud`
- `POST /api/sgie/expedientes/[id]/seguimiento/recordatorio` (body `{numero:1|2}`)
- `POST /api/sgie/expedientes/[id]/seguimiento/desbloquear`
- `GET  /api/sgie/expedientes/[id]/seguimiento` (resumen)

Reutilizadas: `POST /api/sgie/documentos/[id]/rechazar` (rechazo manual), `POST /api/sgie/expedientes/[id]/checklist/confirmar`.

### 3.5 Vinculación en upload (gap cerrado)
`app/api/public/cargar/[token]/route.ts`: tras `registrarDocumento`, si hay `requisitoExpedienteId` y no es duplicado, llama a `vincularDocumentoARequisitoOnUpload` (marca requisito `subido` y recalcula estado documental).

### 3.6 Vista interna
`components/sgie/seguimiento-documental.tsx` (panel `SeguimientoDocumental`) integrado en `app/intranet/sgie/expedientes/[id]/page.tsx`. Muestra estado documental, requisitos (pendientes/recibidos/no aplica/rechazados), enlace activo, último envío, y acciones (enviar solicitud, recordatorio 1/2, desbloquear). Sin rediseño; usa el design system existente.

## 4. Tablas usadas/añadidas
**Sin tablas nuevas.** Usadas: `expedientes`, `requisitos_expediente`, `documentos_expediente`, `enlaces_magicos`, `correos_enviados`, `auditoria_eventos`, `tareas`, `alertas`, `historial_expediente`, `jobs_sgie`. Cambios solo en enums (migración 0026).

## 5. Flujo de seguimiento documental
1. Expediente creado con checklist (Fase previa) → `confirmarChecklist` → `pendiente_de_documentos`.
2. `POST .../seguimiento/solicitud` → crea enlace + email `solicitud_documental` al cliente + estado `enlace_enviado`.
3. Cliente sube por magic link → documento vinculado a requisito (`subido`) + recálculo (parcial/completo).
4. Si faltan obligatorios y pasa el tiempo → cron dispara recordatorio 1 (día 3), recordatorio 2 (día 7), aviso de bloqueo, bloqueo (día 14).
5. `bloqueado_por_cliente` → crea tarea+alerta de escalado al responsable.
6. `POST .../seguimiento/desbloquear` o recepción documental → vuelve a `pendiente_de_documentos`.

## 6. Flujo de recordatorios (configuración)
- Días: primer=3, segundo=7, bloqueo=14 (constantes en `config-seguimiento.ts`).
- Idempotencia: ventana `YYYY-MM-DD` (+número para recordatorios) en `correos_enviados`.
- SGIE **no calcula plazos legales**: solo programa recordatorios sobre fechas internas.

## 7. Plantillas de email (slugs)
`solicitud_documental`, `primer_recordatorio`, `segundo_recordatorio`, `aviso_bloqueo`, `confirmacion_recepcion`, `solicitud_correccion`. Registradas en `correos_enviados.plantilla_slug`. El token va solo en el HTML del email.

## 8. Estados usados
Expediente: `pendiente_de_documentos`, `enlace_enviado`, `documentos_parcialmente_recibidos`, `documentos_completos`, `bloqueado_por_cliente`. Requisito: `solicitado`, `subido`, `aprobado` (no_aplica), `rechazado`.

## 9. Eventos de auditoría garantizados
`reminder_sent`, `case_blocked_by_client`, `case_unblocked`, `internal_escalation_created` (nuevos) + reutilizados `enlace_created`, `documento_uploaded`, `documento_updated`, `correo_sent`/`correo_failed` (vía `correos_enviados`). **Nunca incluyen el token en claro.**

## 10. Resultado de pruebas (9 jul 2026)
| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run lint` | ✅ 0 errores, 0 warnings |
| `npm run test` | ✅ 816 tests, 38 archivos (incluye 13 nuevos de seguimiento) |
| `npm run build` | ✅ build + postbuild correctos |
| `git status` | ✅ web pública intacta |

## 11. Riesgos pendientes
- **Aplicar migraciones 0025 + 0026 en staging/producción** (`drizzle-kit migrate` con `DATABASE_URL` de staging) — no ejecutadas, solo generadas.
- **Resend sin credenciales en este entorno** — los emails quedan `pendiente`/`fallido` en `correos_enviados`; verificar `RESEND_API_KEY` en staging.
- **`CRON_SECRET`** debe estar configurado para que el endpoint de cron funcione; si no, responde 401.
- **Programación real en Vercel Cron** — el endpoint existe y es idempotente; falta configurar el schedule (1×/día).
- **Checklists por materia** — los procedimientos/catálogo requieren validación por abogado hondureño (no son requisitos legales definitivos).

## 12. Qué queda para Fase 3
- Extracción de texto (PDF digital con `pdfjs-dist`) + OCR externo para escaneos.
- Pipeline documental completo (sin IA todavía).
- Revisión asistente operativa.

## 13. Criterio — Fase 2 cerrada
**Sí, a nivel de código.** Cumple: checklist aplicable; requisitos con estados; solicitud/recordatorios al cliente vía magic link; idempotencia sin duplicados; bloqueo por cliente; desbloqueo; documento vincula requisito; `documentos_completos` cuando obligatorios recibidos/no_aplica; emails y auditoría registrados; job de recordatorios implementado (idempotente, vía cron existente); sin IA/OCR; web pública intacta; lint/tsc/test/build verde.

**Pendiente de operación**: aplicar migraciones en staging y verificar el flujo E2E real con un expediente y un cliente de prueba.

-- Migración 0026 — Fase 2 MVP: bloqueo por cliente + eventos de auditoría de
-- seguimiento documental y recordatorios.
--
-- OBJETIVO: habilitar el seguimiento documental gestionado (recordatorios al
-- cliente, bloqueo por falta de respuesta, escalado interno) sin IA ni OCR.
--
-- Nota: ALTER TYPE ... ADD VALUE NO es transacciones en PostgreSQL; cada
-- statement se ejecuta de forma independiente (drizzle-kit lo maneja con
-- breakpoints). En Neon esto es seguro.

-- Nuevo estado de expediente: bloqueado por falta de respuesta del cliente
-- tras agotar el ciclo de recordatorios.
ALTER TYPE "expediente_estado" ADD VALUE IF NOT EXISTS 'bloqueado_por_cliente';
--> statement-breakpoint
-- Eventos de auditoría de la Fase 2.
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'reminder_sent';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'case_blocked_by_client';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'case_unblocked';
--> statement-breakpoint
ALTER TYPE "auditoria_accion" ADD VALUE IF NOT EXISTS 'internal_escalation_created';

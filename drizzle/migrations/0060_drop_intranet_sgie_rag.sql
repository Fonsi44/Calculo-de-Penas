-- 0060_drop_intranet_sgie_rag.sql
-- Elimina tablas de intranet, SGIE, auth, calculadora, preview y RAG.
-- Irreversible. Requiere backup previo en producción.

BEGIN;

DROP TABLE IF EXISTS "usuarios_sgie" CASCADE;
DROP TABLE IF EXISTS "clientes" CASCADE;
DROP TABLE IF EXISTS "tipos_procedimiento" CASCADE;
DROP TABLE IF EXISTS "expedientes" CASCADE;
DROP TABLE IF EXISTS "expediente_asignaciones" CASCADE;
DROP TABLE IF EXISTS "expediente_permisos" CASCADE;
DROP TABLE IF EXISTS "requisitos_expediente" CASCADE;
DROP TABLE IF EXISTS "historial_expediente" CASCADE;
DROP TABLE IF EXISTS "enlaces_magicos" CASCADE;
DROP TABLE IF EXISTS "portal_sessions" CASCADE;
DROP TABLE IF EXISTS "documentos_expediente" CASCADE;
DROP TABLE IF EXISTS "plantillas_correo" CASCADE;
DROP TABLE IF EXISTS "correos_enviados" CASCADE;
DROP TABLE IF EXISTS "extracciones_ia" CASCADE;
DROP TABLE IF EXISTS "document_text_pages" CASCADE;
DROP TABLE IF EXISTS "campos_extraidos" CASCADE;
DROP TABLE IF EXISTS "reglas_config_version" CASCADE;
DROP TABLE IF EXISTS "validaciones" CASCADE;
DROP TABLE IF EXISTS "confianza_resultados" CASCADE;
DROP TABLE IF EXISTS "alertas" CASCADE;
DROP TABLE IF EXISTS "tareas" CASCADE;
DROP TABLE IF EXISTS "eventos_agenda" CASCADE;
DROP TABLE IF EXISTS "notificaciones_leidas" CASCADE;
DROP TABLE IF EXISTS "resumenes_ia_expediente" CASCADE;
DROP TABLE IF EXISTS "tarea_comentarios" CASCADE;
DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;
DROP TABLE IF EXISTS "two_factor_secrets" CASCADE;
DROP TABLE IF EXISTS "two_factor_recovery_codes" CASCADE;
DROP TABLE IF EXISTS "two_factor_challenges" CASCADE;
DROP TABLE IF EXISTS "jobs_sgie" CASCADE;
DROP TABLE IF EXISTS "correcciones_ia" CASCADE;
DROP TABLE IF EXISTS "sugerencias_ajuste" CASCADE;
DROP TABLE IF EXISTS "retencion_politicas" CASCADE;
DROP TABLE IF EXISTS "embeddings" CASCADE;
DROP TABLE IF EXISTS "case_readiness_runs" CASCADE;
DROP TABLE IF EXISTS "case_readiness_checks" CASCADE;
DROP TABLE IF EXISTS "preview_tokens" CASCADE;
DROP TABLE IF EXISTS "procedimiento_versiones" CASCADE;
DROP TABLE IF EXISTS "procedimiento_fases" CASCADE;
DROP TABLE IF EXISTS "procedimiento_transiciones" CASCADE;
DROP TABLE IF EXISTS "expediente_fases" CASCADE;
DROP TABLE IF EXISTS "outbox_events" CASCADE;
DROP TABLE IF EXISTS "job_attempts" CASCADE;
DROP TABLE IF EXISTS "dead_letter_jobs" CASCADE;
DROP TABLE IF EXISTS "comunicaciones_outbox" CASCADE;
DROP TABLE IF EXISTS "comunicaciones_aprobaciones" CASCADE;
DROP TABLE IF EXISTS "webhook_receipts" CASCADE;
DROP TABLE IF EXISTS "ocr_resultados" CASCADE;
DROP TABLE IF EXISTS "ai_task_routing" CASCADE;
DROP TABLE IF EXISTS "plantilla_correo_versiones" CASCADE;
DROP TABLE IF EXISTS "comunicaciones_auditoria" CASCADE;
-- Conservar sgie_schema_migrations: el runner de migraciones manuales la usa como tracking.
DROP TABLE IF EXISTS "feature_flags" CASCADE;
DROP TABLE IF EXISTS "feature_flag_history" CASCADE;
DROP TABLE IF EXISTS "document_classifications" CASCADE;
DROP TABLE IF EXISTS "document_links" CASCADE;
DROP TABLE IF EXISTS "extraction_schema_versions" CASCADE;
DROP TABLE IF EXISTS "document_extractions" CASCADE;
DROP TABLE IF EXISTS "document_contradictions" CASCADE;
DROP TABLE IF EXISTS "case_summary_checkpoints" CASCADE;
DROP TABLE IF EXISTS "case_summary_history" CASCADE;
DROP TABLE IF EXISTS "case_next_actions" CASCADE;
DROP TABLE IF EXISTS "ai_pipeline_runs" CASCADE;
DROP TABLE IF EXISTS "document_bulk_approvals" CASCADE;
DROP TABLE IF EXISTS "document_bulk_approval_items" CASCADE;
DROP TABLE IF EXISTS "alertas_sla" CASCADE;
DROP TABLE IF EXISTS "inbound_messages" CASCADE;
DROP TABLE IF EXISTS "communication_rules" CASCADE;
DROP TABLE IF EXISTS "workflow_snapshots" CASCADE;
DROP TABLE IF EXISTS "user_activity_log" CASCADE;
DROP TABLE IF EXISTS "signature_packages" CASCADE;
DROP TABLE IF EXISTS "signature_package_items" CASCADE;
DROP TABLE IF EXISTS "signature_package_signers" CASCADE;
DROP TABLE IF EXISTS "signature_envelopes" CASCADE;
DROP TABLE IF EXISTS "signature_envelope_signers" CASCADE;
DROP TABLE IF EXISTS "signature_events" CASCADE;
DROP TABLE IF EXISTS "signature_artifacts" CASCADE;
DROP TABLE IF EXISTS "calendar_connections" CASCADE;
DROP TABLE IF EXISTS "calendar_event_links" CASCADE;
DROP TABLE IF EXISTS "calendar_feed_tokens" CASCADE;
DROP TABLE IF EXISTS "calendar_sync_runs" CASCADE;
DROP TABLE IF EXISTS "knowledge_index_entries" CASCADE;
DROP TABLE IF EXISTS "knowledge_relations" CASCADE;
DROP TABLE IF EXISTS "knowledge_sources" CASCADE;
DROP TABLE IF EXISTS "knowledge_versions" CASCADE;
DROP TABLE IF EXISTS "sgie_search_entries" CASCADE;
DROP TABLE IF EXISTS "events" CASCADE;
DROP TABLE IF EXISTS "risk_evaluations" CASCADE;
DROP TABLE IF EXISTS "workload_snapshots" CASCADE;
DROP TABLE IF EXISTS "daily_briefs" CASCADE;
DROP TABLE IF EXISTS "user_preferences" CASCADE;
DROP TABLE IF EXISTS "autonomy_metrics" CASCADE;
DROP TABLE IF EXISTS "document_segmentation_runs" CASCADE;
DROP TABLE IF EXISTS "document_segments" CASCADE;
DROP TABLE IF EXISTS "document_comparisons" CASCADE;
DROP TABLE IF EXISTS "document_comparison_changes" CASCADE;
DROP TABLE IF EXISTS "document_contradiction_candidates" CASCADE;
DROP TABLE IF EXISTS "aceptaciones_legales" CASCADE;
DROP TABLE IF EXISTS "auditoria_eventos" CASCADE;
DROP TABLE IF EXISTS "calculos" CASCADE;
DROP TABLE IF EXISTS "casos" CASCADE;
DROP TABLE IF EXISTS "invitaciones" CASCADE;
DROP TABLE IF EXISTS "usuarios_capacidades" CASCADE;
DROP TABLE IF EXISTS "equipos_miembros" CASCADE;
DROP TABLE IF EXISTS "equipos" CASCADE;
DROP TABLE IF EXISTS "usuarios_roles" CASCADE;
DROP TABLE IF EXISTS "roles_permisos" CASCADE;
DROP TABLE IF EXISTS "permisos" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;
DROP TABLE IF EXISTS "usuarios" CASCADE;
DROP TABLE IF EXISTS "bufetes" CASCADE;

-- Enums asociados a auth/auditoría (si existen).
-- Conservar tipo_pena: lo usan supuestos_penales (catálogo legal público).
DROP TYPE IF EXISTS auditoria_accion CASCADE;
DROP TYPE IF EXISTS invitacion_estado CASCADE;

-- Extensión pgvector solo usada por embeddings.
DROP EXTENSION IF EXISTS vector;

COMMIT;

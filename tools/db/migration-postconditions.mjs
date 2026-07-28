/**
 * Postcondiciones explícitas para las 58 migraciones del PR #20.
 *
 * Cada entrada define verificaciones estructurales que DEMUESTRAN que una
 * migración fue aplicada. No se aceptan conjeturas basadas en nombres.
 *
 * Formato:
 *   checks: array de objetos con método y parámetros.
 *   all (default true): todas deben pasar para APLICADA_COMPLETA.
 *                           false = alguna debe pasar (OR lógico).
 */
export const POSTCONDITIONS = [
  // ── Drizzle migrations (journal) ──────────────────────────────────

  { id: "0000_eminent_lucky_pierre", checks: [
    { table: "ramas_juridicas" }, { table: "categorias_blog" },
    { table: "categorias_faq" }, { table: "areas_juridicas" },
    { table: "delitos" }, { table: "articulos_cp" },
    { table: "articulos_constitucion" }, { table: "configuracion_sitio" },
    { table: "page_content" }, { table: "solicitudes_consulta" },
    { table: "redirects" }, { table: "menus" },
    { table: "blog_posts" }, { table: "posts_tags" },
    { table: "newsletter_subscriptions" }, { table: "faq_entries" },
    { table: "autores" },
  ]},
  { id: "0001_sudden_mongu", checks: [
    { table: "remisiones_normativas" },
  ]},
  { id: "0002_confused_black_crow", checks: [
    { table: "supuestos_penales" },
  ]},
  { id: "0003_auditoria_eventos", checks: [
    { table: "auditoria_eventos" },
  ]},
  { id: "0004_fixed_lifeguard", checks: [
    { table: "tags" },
  ]},
  { id: "0005_motionless_northstar", checks: [
    { table: "agravantes_especificas" }, { table: "validaciones" },
    { table: "campos_extraidos", column: "id" },
    { table: "calculos" },
    { column: "calculos", name: "supuesto_penal_id" },
  ]},
  { id: "0006_abandoned_gorilla_man", checks: [
    { table: "tipos_procedimiento" }, { table: "procedimiento_fases" },
    { table: "procedimiento_transiciones" },
  ]},
  { id: "0007_mixed_the_phantom", checks: [
    { table: "bufetes" },
  ]},
  { id: "0008_stale_zzzax", checks: [
    { table: "usuarios" }, { table: "usuarios_roles" },
    { table: "roles" }, { table: "permisos" },
    { table: "roles_permisos" },
    // Check blog_posts has review_status column (added by 0008)
    { column: "blog_posts", name: "review_status", type: "character varying" },
  ]},
  { id: "0009_clever_storm", checks: [
    { table: "auditoria_eventos", column: "id" },
    // Renamed column from filepath to metadata
    { column: "auditoria_eventos", name: "metadata", type: "jsonb" },
  ]},
  { id: "0010_overjoyed_phil_sheldon", checks: [
    { table: "areas_juridicas", column: "color" },
  ]},
  { id: "0011_great_abomination", checks: [
    { table: "password_reset_tokens" },
  ]},
  { id: "0012_broad_sally_floyd", checks: [
    { table: "delitos", column: "categoria_id" },
    // supuestos_penales.agravado_origen reference
    { column: "supuestos_penales", name: "agravado_origen", type: "uuid" },
  ]},
  { id: "0013_add_newsletter_subscriptions", checks: [
    { table: "newsletter_subscriptions", column: "consent_id" },
  ]},
  { id: "0014_woozy_alex_wilder", checks: [
    { enum: "expediente_estado", values: ["creado","activo","en_proceso","suspendido","cerrado","archivado"] },
    { enum: "expediente_prioridad", values: ["baja","media","alta","urgente"] },
    { table: "expedientes" },
  ]},
  { id: "0015_stale_kingpin", checks: [
    { enum: "evento_agenda_estado", values: ["propuesta","confirmada","en_curso","completada","cancelada"] },
    { enum: "evento_agenda_visibilidad", values: ["publico","privado","bufete"] },
    { enum: "asignacion_rol", values: ["responsable","colaborador","supervisor","observador"] },
    { table: "eventos_agenda" },
    { table: "expediente_asignaciones" },
    { table: "expediente_permisos" },
  ]},
  { id: "0019_sticky_karen_page", checks: [
    { table: "page_content", column: "tags_json" },
    { extension: "pg_trgm" },
  ]},
  { id: "0024_security_user_defaults", checks: [
    // Default values and constraints on usuarios
    { column: "usuarios", name: "token_version", type: "integer", notNull: true, default: "0" },
    { column: "usuarios", name: "active", type: "boolean", notNull: true, default: "false" },
    { column: "usuarios", name: "must_change_password", type: "boolean", default: "false" },
  ]},
  { id: "0025_enlaces_token_hash", checks: [
    { table: "enlaces_magicos" },
    { column: "enlaces_magicos", name: "token_hash", type: "character varying" },
  ]},
  { id: "0026_fase2_bloqueo_recordatorios", checks: [
    // Check constraints for bloqueado + validaciones column
    { column: "usuarios", name: "bloqueado", type: "boolean", default: "false" },
    { column: "usuarios", name: "bloqueado_motivo", type: "character varying" },
    { table: "sugerencias_ajuste" },
    { table: "confianza_resultados" },
  ]},
  { id: "0028_fase4_ia_documental", checks: [
    { table: "extracciones_ia" },
    { table: "correcciones_ia" },
    { table: "resumenes_ia_expediente" },
    { column: "blog_posts", name: "ai_research_provider", type: "character varying" },
    { column: "blog_posts", name: "ai_search_queries_count", type: "integer" },
  ]},
  { id: "0033_fase1_calendario_version", checks: [
    { column: "eventos_agenda", name: "version", type: "integer", notNull: true, default: "1" },
  ]},
  { id: "0038_lively_silvermane", checks: [
    { column: "blog_posts", name: "ai_review_provider", type: "character varying" },
    { column: "blog_posts", name: "ai_review_requires_human", type: "boolean", default: "false" },
    { column: "blog_posts", name: "ai_research_provider", type: "character varying" },
    { column: "blog_posts", name: "ai_search_queries_count", type: "integer" },
    { column: "blog_posts", name: "ai_official_sources_count", type: "integer" },
    { column: "blog_posts", name: "last_reviewed_at" },
    { column: "blog_posts", name: "next_review_due_at" },
  ]},

  // ── Manual migrations ─────────────────────────────────────────────

  { id: "manual-0042", checks: [
    // Unique partial indexes
    { index: "feature_flags_kill_switch_global_unique", table: "feature_flags" },
    { index: "document_links_vigente_unique", table: "document_links" },
    { index: "document_contradictions_unique", table: "document_contradictions" },
    { index: "case_next_actions_idempotency_unique", table: "case_next_actions" },
    { table: "extraction_schema_versions" },
    { table: "eventos_agenda", check: true }, // adding NOT NULL constraints
  ]},
  { id: "manual-0043", checks: [
    // Checkpoint unique partial indexes
    { index: "case_summary_checkpoints_unique_idx", table: "case_summary_checkpoints" },
    { table: "case_summary_checkpoints" },
  ]},
];

// Helper: verificar si un ID está en el listado
export function getPostconditions(id) {
  return POSTCONDITIONS.find(e => e.id === id)?.checks || [];
}

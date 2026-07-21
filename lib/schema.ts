import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, varchar, foreignKey, unique, serial, jsonb, index, uniqueIndex, vector, real, time } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export const ramasJuridicas = pgTable('ramas_juridicas', {
  id: varchar('id', { length: 100 }).primaryKey(),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  parentId: varchar('parent_id', { length: 100 }),
  nivel: integer('nivel').notNull().default(1),
  orden: integer('orden').notNull().default(0),
}, (table) => ({
  parentRef: foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }),
}));

export const articulosConstitucion = pgTable('articulos_constitucion', {
  id: integer('id').primaryKey(),
  articulo: varchar('articulo', { length: 100 }).notNull(),
  titulo: varchar('titulo', { length: 200 }),
  capitulo: varchar('capitulo', { length: 200 }),
  texto: text('texto'),
});

export const articulosCp = pgTable('articulos_cp', {
  id: serial('id').primaryKey(),
  articulo: varchar('articulo', { length: 50 }).notNull().unique(),
  libro: varchar('libro', { length: 200 }),
  titulo: varchar('titulo', { length: 200 }),
  capitulo: varchar('capitulo', { length: 200 }),
  seccion: varchar('seccion', { length: 200 }),
  epigrafe: varchar('epigrafe', { length: 300 }),
  texto: text('texto').notNull(),
  tema: varchar('tema', { length: 100 }),
});

export const delitos = pgTable('delitos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 500 }).notNull(),
  articulo: varchar('articulo', { length: 100 }).notNull(),
  conducta: text('conducta'),
  clasificacion: varchar('clasificacion', { length: 200 }),
  ramaId: varchar('rama_id', { length: 100 }),
  constitucionArticuloId: integer('constitucion_articulo_id'),
  penaMinimaMeses: integer('pena_minima_meses').notNull(),
  penaMaximaMeses: integer('pena_maxima_meses').notNull(),
  tienePenaAlternativa: boolean('tiene_pena_alternativa').default(false),
  penaAlternativaMin: integer('pena_alternativa_min').default(0),
  penaAlternativaMax: integer('pena_alternativa_max').default(0),
  penasAccesorias: text('penas_accesorias').array().default([]),
  observaciones: text('observaciones'),
  esGrave: boolean('es_grave').default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
  penaPorRemisionNormativa: boolean('pena_por_remision_normativa').default(false),
  articulosRemitidosParaPena: text('articulos_remitidos_para_pena'),
  penaBaseResueltaDesdeArticulo: varchar('pena_base_resuelta_desde_articulo', { length: 200 }),
  condicionParaAplicarPenaRemitida: text('condicion_para_aplicar_pena_remitida'),
  agravacionPorArticuloRemitido: text('agravacion_por_articulo_remitido'),
  formulaCalculoRemision: text('formula_calculo_remision'),
  requiereDatosEconomicos: boolean('requiere_datos_economicos').default(false),
  variablesNecesariasParaCalculo: text('variables_necesarias_para_calculo'),
  penaResueltaMinMeses: integer('pena_resuelta_min_meses'),
  penaResueltaMaxMeses: integer('pena_resuelta_max_meses'),
  observacionesRemisionNormativa: text('observaciones_remision_normativa'),
}, (table) => ({
  ramaRef: foreignKey({ columns: [table.ramaId], foreignColumns: [ramasJuridicas.id] }),
  constitucionRef: foreignKey({ columns: [table.constitucionArticuloId], foreignColumns: [articulosConstitucion.id] }),
  uniqueNombreArticulo: unique('delitos_nombre_articulo_unique').on(table.nombre, table.articulo),
  ramaIdx: index('delitos_rama_idx').on(table.ramaId),
  nombreIdx: index('delitos_nombre_idx').on(table.nombre),
  articuloIdx: index('delitos_articulo_idx').on(table.articulo),
}));

export const bufetes = pgTable('bufetes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
});

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  rol: varchar('rol', { length: 50 }).notNull().default('pendiente'),
  bufeteId: uuid('bufete_id'),
  active: boolean('active').default(false),
  mustChangePassword: boolean('must_change_password').default(false),
  // Invalida todas las sesiones emitidas antes de un cambio de credenciales.
  tokenVersion: integer('token_version').notNull().default(0),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  // SGIE — gobernanza de accesos (Fase 2). Columnas aditivas, no rompen filas existentes.
  // `active=false` es desactivación (soft-delete). `bloqueado=true` es revocación de acceso
  // distinguible (usuario existe, no se elimina, no puede entrar). El documento SGIE §6.2
  // pide ambos explícitamente.
  ultimoAcceso: timestamp('ultimo_acceso', { withTimezone: true }),
  bloqueado: boolean('bloqueado').default(false),
  bloqueadoEn: timestamp('bloqueado_en', { withTimezone: true }),
  bloqueadoMotivo: varchar('bloqueado_motivo', { length: 500 }),
  correoCorporativoVinculado: boolean('correo_corporativo_vinculado').default(false),
}, (table) => ({
  bufeteRef: foreignKey({ columns: [table.bufeteId], foreignColumns: [bufetes.id] }),
  activeIdx: index('usuarios_active_idx').on(table.active),
  bloqueadoIdx: index('usuarios_bloqueado_idx').on(table.bloqueado),
}));

export const casos = pgTable('casos', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  cliente: varchar('cliente', { length: 200 }),
  estado: varchar('estado', { length: 50 }).notNull().default('borrador'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }),
  usuarioIdx: index('casos_usuario_idx').on(table.usuarioId),
  creadoEnIdx: index('casos_creado_en_idx').on(table.creadoEn),
}));

export const calculos = pgTable('calculos', {
  id: uuid('id').primaryKey().defaultRandom(),
  casoId: uuid('caso_id').notNull(),
  config: jsonb('config').notNull(),
  resultado: jsonb('resultado').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  casoRef: foreignKey({ columns: [table.casoId], foreignColumns: [casos.id] }),
  casoIdx: index('calculos_caso_idx').on(table.casoId),
  creadoEnIdx: index('calculos_creado_en_idx').on(table.creadoEn),
}));

export const auditoriaAccionEnum = pgEnum('auditoria_accion', [
  'login',
  'logout',
  'login_failed',
  'caso_created',
  'caso_updated',
  'caso_deleted',
  'calculo_created',
  'calculo_deleted',
  'delito_created',
  'delito_updated',
  'delito_deleted',
  'rate_limited',
  'unauthorized_access',
  'usuario_created',
  'usuario_updated',
  'usuario_deleted',
  'invitacion_created',
  'invitacion_accepted',
  'invitacion_revoked',
  'invitacion_resent',
  'password_reset',
  'password_changed',
  'blog_created',
  'blog_updated',
  'blog_deleted',
  'blog_generated',
  'faq_created',
  'faq_updated',
  'faq_deleted',
  'site_config_updated',
  'categoria_blog_created',
  'categoria_blog_updated',
  'categoria_blog_deleted',
  'categoria_faq_created',
  'categoria_faq_updated',
  'categoria_faq_deleted',
  'tag_created',
  'tag_updated',
  'tag_deleted',
  'autor_created',
  'autor_updated',
  'autor_deleted',
  'pagina_cms_created',
  'pagina_cms_updated',
  'pagina_cms_deleted',
  'area_juridica_created',
  'area_juridica_updated',
  'area_juridica_deleted',
  'medio_created',
  'medio_updated',
  'medio_deleted',
  'redirect_created',
  'redirect_updated',
  'redirect_deleted',
  'menu_updated',
  'rol_created',
  'rol_updated',
  'rol_deleted',
  'permiso_updated',
  // Fase 3/5 — agravantes específicas del tipo penal.
  'agravante_especifica_created',
  'agravante_especifica_updated',
  'agravante_especifica_deleted',
  // LegalTech — gestión automatizada de expedientes (Fase 1+).
  'expediente_created',
  'expediente_updated',
  'expediente_estado_changed',
  'expediente_deleted',
  'cliente_created',
  'cliente_updated',
  'cliente_deleted',
  'documento_uploaded',
  'documento_updated',
  'documento_deleted',
  'documento_ia_processed',
  // Fase 4B-1: aprobación documental en bloque.
  'documento_bulk_approved',
  'documento_bulk_reverted',
  'enlace_created',
  'enlace_revoked',
  'enlace_used',
  'magic_link_accessed',
  'magic_link_expired',
  'tarea_created',
  'tarea_updated',
  'tarea_completed',
  'tarea_deleted',
  'evento_created',
  'evento_updated',
  'evento_deleted',
  'nota_created',
  'nota_deleted',
  'plantilla_created',
  'plantilla_updated',
  'plantilla_deleted',
  'correo_sent',
  'correo_failed',
  'notificacion_created',
  'notificacion_read',
  'validacion_aprobada',
  'validacion_rechazada',
  // Fase 2 — seguimiento documental, recordatorios y bloqueo por cliente.
  'reminder_sent',
  'case_blocked_by_client',
  'case_unblocked',
  'internal_escalation_created',
  // Fase 3 — pipeline de extracción documental y revisión asistente.
  'document_extraction_started',
  'document_extraction_completed',
  'document_extraction_failed',
  'document_requires_ocr',
  'document_extraction_retried',
  'document_manual_reviewed',
  // Fase 4 — IA documental (DeepSeek): análisis, revisión humana y auditoría.
  'ai_analysis_started',
  'ai_analysis_completed',
  'ai_analysis_failed',
  'ai_analysis_skipped_no_text',
  'ai_analysis_not_configured',
  'ai_suggestion_accepted',
  'ai_suggestion_rejected',
  'ai_human_review_requested',
  'ai_correction_requested',
  // Fase 5 — puerta "Listo para revisión" y revisión documental.
  'readiness_evaluation_completed',
  'case_ready_for_review',
  'case_returned_by_lawyer',
  'case_documental_review_approved',
  'case_additional_info_requested',
  // Fase 2 — Workflows, Outbox, Jobs.
  'workflow_transition',
  'outbox_dispatched',
  'outbox_failed',
  'job_claimed',
  'job_completed',
  'job_failed',
  'job_dead_lettered',
  'job_requeued',
  // Fase 2 — Comunicaciones.
  'comunicacion_created',
  'comunicacion_approved',
  'comunicacion_rejected',
  'comunicacion_sent',
  'comunicacion_failed',
  'comunicacion_bounced',
  'comunicacion_suppressed',
  'webhook_received',
  'webhook_processed',
  // Fase 2 — IA y OCR.
  'ai_task_routed',
  'ai_task_completed',
  'ai_task_reviewed',
  'ocr_completed',
  'ocr_failed',
  // Fase 3 — Portal del cliente y sesiones.
  'portal_session_created',
  'portal_session_expired',
  'portal_document_uploaded',
  // Fase 4A — Orquestación documental IA y feature flags.
  'ai_pipeline_run_started',
  'ai_pipeline_run_completed',
  'ai_pipeline_run_failed',
  'feature_flag_changed',
  // Fase 4B-1 — Aprobación documental en bloque.
  'documento_bulk_approved',
  'documento_bulk_reverted',
  // Fase 4B-2 — Paquetes preparados para firma.
  'signature_package_created',
  'signature_package_ready',
  'signature_package_locked',
  'signature_package_cancelled',
  'signature_package_superseded',
  'signature_package_verified',
]);

export const auditoriaEventos = pgTable('auditoria_eventos', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id'),
  accion: auditoriaAccionEnum('accion').notNull(),
  recurso: varchar('recurso', { length: 100 }),
  recursoId: varchar('recurso_id', { length: 100 }),
  ip: varchar('ip', { length: 64 }),
  userAgent: varchar('user_agent', { length: 500 }),
  metadata: jsonb('metadata'),
  exito: boolean('exito').notNull().default(true),
  mensaje: text('mensaje'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }),
  accionIdx: index('auditoria_accion_idx').on(table.accion),
  usuarioIdx: index('auditoria_usuario_idx').on(table.usuarioId),
  creadoEnIdx: index('auditoria_creado_en_idx').on(table.creadoEn),
}));

export const rateLimits = pgTable('rate_limits', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 50 }).notNull(),
  count: integer('count').notNull().default(1),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => ({
  pk: unique('rate_limits_pk').on(table.identifier, table.keyPrefix),
  expiresIdx: index('rate_limits_expires_idx').on(table.expiresAt),
}));

export const aceptacionesLegales = pgTable('aceptaciones_legales', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  aceptadoEn: timestamp('aceptado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }),
  uniqueUsuarioVersion: unique('aceptacion_unique').on(table.usuarioId, table.version),
}));

export type AuditoriaAccion = typeof auditoriaAccionEnum.enumValues[number];
export type AuditoriaEvento = typeof auditoriaEventos.$inferSelect;
export type AuditoriaEventoInsert = typeof auditoriaEventos.$inferInsert;

export const solicitudesConsulta = pgTable('solicitudes_consulta', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  telefono: varchar('telefono', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  motivo: varchar('motivo', { length: 100 }).notNull(),
  resumen: text('resumen').notNull(),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  emailStatus: varchar('email_status', { length: 20 }).default('pending'),
  emailId: varchar('email_id', { length: 255 }),
  emailError: text('email_error'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  creadoEnIdx: index('solicitudes_consulta_creado_en_idx').on(table.creadoEn),
  emailStatusIdx: index('solicitudes_consulta_email_status_idx').on(table.emailStatus),
}));

export type SolicitudConsulta = typeof solicitudesConsulta.$inferSelect;
export type SolicitudConsultaInsert = typeof solicitudesConsulta.$inferInsert;

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 300 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  body: text('body').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  category: varchar('category', { length: 200 }).notNull(),
  tags: text('tags').array().default([]),
  author: varchar('author', { length: 200 }).default('Pineda y Asociados'),
  readingTime: varchar('reading_time', { length: 20 }).default('3 min'),
  coverImage: varchar('cover_image', { length: 500 }),
  featured: boolean('featured').default(false),
  published: boolean('published').default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),

  // SEO metadata
  metaTitle: varchar('meta_title', { length: 500 }),
  metaDescription: text('meta_description'),
  ogImage: varchar('og_image', { length: 500 }),

  // Indexation control
  noindex: boolean('noindex').default(false),

  // Canonical override
  canonicalUrl: varchar('canonical_url', { length: 500 }),

  // Author relationship
  authorId: uuid('author_id'),

  // Legal review workflow
  reviewStatus: varchar('review_status', { length: 50 }).default('published'),
  reviewedBy: varchar('reviewed_by', { length: 200 }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  legalReviewNotes: text('legal_review_notes'),

  // Content audit
  lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  nextReviewDueAt: timestamp('next_review_due_at', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('blog_posts_slug_idx').on(table.slug),
  categoryIdx: index('blog_posts_category_idx').on(table.category),
  publishedAtIdx: index('blog_posts_published_at_idx').on(table.publishedAt),
  publishedIdx: index('blog_posts_published_idx').on(table.published),
  featuredIdx: index('blog_posts_featured_idx').on(table.featured),
}));

export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostInsert = typeof blogPosts.$inferInsert;

export const faqEntries = pgTable('faq_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: varchar('category', { length: 200 }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').default(0),
  published: boolean('published').default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  categoryIdx: index('faq_entries_category_idx').on(table.category),
  sortOrderIdx: index('faq_entries_sort_order_idx').on(table.sortOrder),
  publishedIdx: index('faq_entries_published_idx').on(table.published),
}));

export type FaqEntry = typeof faqEntries.$inferSelect;
export type FaqEntryInsert = typeof faqEntries.$inferInsert;

export const configuracionSitio = pgTable('configuracion_sitio', {
  id: uuid('id').primaryKey().defaultRandom(),
  clave: varchar('clave', { length: 100 }).notNull().unique(),
  valor: text('valor').notNull(),
  descripcion: varchar('descripcion', { length: 300 }),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
});

export type ConfiguracionSitio = typeof configuracionSitio.$inferSelect;
export type ConfiguracionSitioInsert = typeof configuracionSitio.$inferInsert;

export const pageContent = pgTable('page_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  page: varchar('page', { length: 200 }).notNull(),
  section: varchar('section', { length: 200 }).notNull(),
  field: varchar('field', { length: 100 }).notNull(),
  content: text('content').notNull().default(''),
  lang: varchar('lang', { length: 10 }).default('es-HN'),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pageSectionFieldIdx: index('page_content_page_section_field_idx').on(table.page, table.section, table.field),
  pageIdx: index('page_content_page_idx').on(table.page),
}));

export type PageContent = typeof pageContent.$inferSelect;
export type PageContentInsert = typeof pageContent.$inferInsert;

// ============================================================
// Fase 1 — CMS Tables
// ============================================================

export const categoriasBlog = pgTable('categorias_blog', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  descripcion: varchar('descripcion', { length: 500 }),
  color: varchar('color', { length: 50 }),
  icono: varchar('icono', { length: 100 }),
  sortOrder: integer('sort_order').default(0),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('categorias_blog_slug_idx').on(table.slug),
}));

export type CategoriaBlog = typeof categoriasBlog.$inferSelect;
export type CategoriaBlogInsert = typeof categoriasBlog.$inferInsert;

export const categoriasFaq = pgTable('categorias_faq', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  titulo: varchar('titulo', { length: 200 }).notNull(),
  descripcion: varchar('descripcion', { length: 500 }),
  icono: varchar('icono', { length: 100 }),
  color: varchar('color', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('categorias_faq_slug_idx').on(table.slug),
}));

export type CategoriaFaq = typeof categoriasFaq.$inferSelect;
export type CategoriaFaqInsert = typeof categoriasFaq.$inferInsert;

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  slugIdx: index('tags_slug_idx').on(table.slug),
}));

export type Tag = typeof tags.$inferSelect;
export type TagInsert = typeof tags.$inferInsert;

export const postsTags = pgTable('posts_tags', {
  postId: uuid('post_id').notNull(),
  tagId: uuid('tag_id').notNull(),
}, (table) => ({
  postRef: foreignKey({ columns: [table.postId], foreignColumns: [blogPosts.id] }),
  tagRef: foreignKey({ columns: [table.tagId], foreignColumns: [tags.id] }),
  pk: unique('posts_tags_pk').on(table.postId, table.tagId),
  postIdx: index('posts_tags_post_idx').on(table.postId),
  tagIdx: index('posts_tags_tag_idx').on(table.tagId),
}));

export const autores = pgTable('autores', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }),
  bio: text('bio'),
  foto: varchar('foto', { length: 500 }),
  redes: jsonb('redes').$type<{ twitter?: string; linkedin?: string; web?: string }>(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
});

export type Autor = typeof autores.$inferSelect;
export type AutorInsert = typeof autores.$inferInsert;

export const paginasCms = pgTable('paginas_cms', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descripcion: text('descripcion'),
  contenido: jsonb('contenido').$type<Record<string, unknown>>(),
  plantilla: varchar('plantilla', { length: 100 }).default('default'),
  estado: varchar('estado', { length: 20 }).default('borrador'),
  seo: jsonb('seo').$type<{ title?: string; description?: string; ogImage?: string; canonical?: string; robots?: string; noindex?: boolean }>(),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').default(0),
  createdBy: uuid('created_by'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('paginas_cms_slug_idx').on(table.slug),
  parentRef: foreignKey({ columns: [table.parentId], foreignColumns: [table.id] }),
  createdByRef: foreignKey({ columns: [table.createdBy], foreignColumns: [usuarios.id] }),
}));

export type PaginaCms = typeof paginasCms.$inferSelect;
export type PaginaCmsInsert = typeof paginasCms.$inferInsert;

export const areasJuridicas = pgTable('areas_juridicas', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descripcionCorta: text('descripcion_corta'),
  descripcionLarga: text('descripcion_larga'),
  icono: varchar('icono', { length: 100 }),
  imagen: varchar('imagen', { length: 500 }),
  categoria: varchar('categoria', { length: 50 }).notNull().default('servicio'),
  grupo: varchar('grupo', { length: 200 }),
  subservicios: jsonb('subservicios').$type<{ titulo: string; descripcion: string }[]>(),
  faqs: jsonb('faqs').$type<{ pregunta: string; respuesta: string }[]>(),
  seo: jsonb('seo').$type<{ title?: string; description?: string; ogImage?: string }>(),
  sortOrder: integer('sort_order').default(0),
  estado: varchar('estado', { length: 20 }).default('publicado'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('areas_juridicas_slug_idx').on(table.slug),
  categoriaIdx: index('areas_juridicas_categoria_idx').on(table.categoria),
}));

export type AreaJuridica = typeof areasJuridicas.$inferSelect;
export type AreaJuridicaInsert = typeof areasJuridicas.$inferInsert;

export const medios = pgTable('medios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombreArchivo: varchar('nombre_archivo', { length: 500 }).notNull(),
  altText: varchar('alt_text', { length: 500 }),
  titulo: varchar('titulo', { length: 300 }),
  descripcion: text('descripcion'),
  tipoMime: varchar('tipo_mime', { length: 100 }).notNull(),
  tamaño: integer('tamaño').notNull(),
  dimensiones: jsonb('dimensiones').$type<{ width: number; height: number }>(),
  url: varchar('url', { length: 500 }).notNull(),
  formatos: jsonb('formatos').$type<{ original: string; webp?: string; thumb?: string; medium?: string }>(),
  createdBy: uuid('created_by'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  createdByRef: foreignKey({ columns: [table.createdBy], foreignColumns: [usuarios.id] }),
}));

export type Medio = typeof medios.$inferSelect;
export type MedioInsert = typeof medios.$inferInsert;

export const versionesContenido = pgTable('versiones_contenido', {
  id: uuid('id').primaryKey().defaultRandom(),
  entidadTipo: varchar('entidad_tipo', { length: 50 }).notNull(),
  entidadId: varchar('entidad_id', { length: 100 }).notNull(),
  contenido: jsonb('contenido').notNull(),
  version: integer('version').notNull(),
  creadoPor: uuid('creado_por'),
  descripcion: varchar('descripcion', { length: 500 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  entidadIdx: index('versiones_entidad_idx').on(table.entidadTipo, table.entidadId),
}));

export type VersionContenido = typeof versionesContenido.$inferSelect;
export type VersionContenidoInsert = typeof versionesContenido.$inferInsert;

export const redirects = pgTable('redirects', {
  id: uuid('id').primaryKey().defaultRandom(),
  origen: varchar('origen', { length: 500 }).notNull().unique(),
  destino: varchar('destino', { length: 500 }).notNull(),
  tipo: integer('tipo').notNull().default(301),
  activo: boolean('activo').default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
});

export type Redirect = typeof redirects.$inferSelect;
export type RedirectInsert = typeof redirects.$inferInsert;

export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  items: jsonb('items').$type<{ label: string; url?: string; slug?: string; target?: string; icon?: string; children?: { label: string; url: string }[] }[]>(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
});

export type Menu = typeof menus.$inferSelect;
export type MenuInsert = typeof menus.$inferInsert;

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  descripcion: varchar('descripcion', { length: 300 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
});

export type Rol = typeof roles.$inferSelect;
export type RolInsert = typeof roles.$inferInsert;

export const permisos = pgTable('permisos', {
  id: uuid('id').primaryKey().defaultRandom(),
  recurso: varchar('recurso', { length: 100 }).notNull(),
  accion: varchar('accion', { length: 100 }).notNull(),
  descripcion: varchar('descripcion', { length: 300 }),
}, (table) => ({
  recursoAccionUnique: unique('permisos_recurso_accion_unique').on(table.recurso, table.accion),
}));

export type Permiso = typeof permisos.$inferSelect;
export type PermisoInsert = typeof permisos.$inferInsert;

export const rolesPermisos = pgTable('roles_permisos', {
  rolId: uuid('rol_id').notNull(),
  permisoId: uuid('permiso_id').notNull(),
}, (table) => ({
  rolRef: foreignKey({ columns: [table.rolId], foreignColumns: [roles.id] }),
  permisoRef: foreignKey({ columns: [table.permisoId], foreignColumns: [permisos.id] }),
  pk: unique('roles_permisos_pk').on(table.rolId, table.permisoId),
}));

export const usuariosRoles = pgTable('usuarios_roles', {
  usuarioId: uuid('usuario_id').notNull(),
  rolId: uuid('rol_id').notNull(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }),
  rolRef: foreignKey({ columns: [table.rolId], foreignColumns: [roles.id] }),
  pk: unique('usuarios_roles_pk').on(table.usuarioId, table.rolId),
}));

export const equipos = pgTable('equipos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull().unique(),
  activo: boolean('activo').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
});

export const equiposMiembros = pgTable('equipos_miembros', {
  equipoId: uuid('equipo_id').notNull(),
  usuarioId: uuid('usuario_id').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  equipoRef: foreignKey({ columns: [table.equipoId], foreignColumns: [equipos.id] }).onDelete('cascade'),
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  pk: unique('equipos_miembros_pk').on(table.equipoId, table.usuarioId),
  usuarioIdx: index('equipos_miembros_usuario_idx').on(table.usuarioId),
}));

export const usuariosCapacidades = pgTable('usuarios_capacidades', {
  usuarioId: uuid('usuario_id').notNull(),
  permisoId: uuid('permiso_id').notNull(),
  permitido: boolean('permitido').notNull().default(true),
  concedidoPor: uuid('concedido_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  permisoRef: foreignKey({ columns: [table.permisoId], foreignColumns: [permisos.id] }).onDelete('cascade'),
  concedidoPorRef: foreignKey({ columns: [table.concedidoPor], foreignColumns: [usuarios.id] }),
  pk: unique('usuarios_capacidades_pk').on(table.usuarioId, table.permisoId),
}));

export const invitacionEstadoEnum = pgEnum('invitacion_estado', [
  'pendiente', 'aceptada', 'expirada', 'revocada',
]);

export const invitaciones = pgTable('invitaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  estado: invitacionEstadoEnum('estado').notNull().default('pendiente'),
  rolInicial: varchar('rol_inicial', { length: 50 }).notNull(),
  equipoId: uuid('equipo_id'),
  accesoSgie: boolean('acceso_sgie').notNull().default(false),
  capacidades: jsonb('capacidades').$type<string[]>().notNull().default([]),
  creadaPor: uuid('creada_por').notNull(),
  creadaEn: timestamp('creada_en', { withTimezone: true }).defaultNow(),
  expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
  aceptadaEn: timestamp('aceptada_en', { withTimezone: true }),
  revocadaEn: timestamp('revocada_en', { withTimezone: true }),
  usuarioId: uuid('usuario_id'),
  emailEstado: varchar('email_estado', { length: 50 }).notNull().default('pendiente'),
  emailError: varchar('email_error', { length: 500 }),
  resendId: varchar('resend_id', { length: 200 }),
}, (table) => ({
  equipoRef: foreignKey({ columns: [table.equipoId], foreignColumns: [equipos.id] }),
  creadaPorRef: foreignKey({ columns: [table.creadaPor], foreignColumns: [usuarios.id] }),
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }),
  emailIdx: index('invitaciones_email_idx').on(table.email),
  estadoIdx: index('invitaciones_estado_idx').on(table.estado),
  expiraIdx: index('invitaciones_expira_idx').on(table.expiraEn),
}));

// ============================================================
// Newsletter subscriptions
// ============================================================

export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  source: varchar('source', { length: 50 }).default('blog'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  emailIdx: index('newsletter_email_idx').on(table.email),
}));

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type NewsletterSubscriptionInsert = typeof newsletterSubscriptions.$inferInsert;

// ============================================================
// Fase 2 — Supuesto Penal Calculable
// ============================================================

export const tipoPenaEnum = pgEnum('tipo_pena', ['prision', 'multa', 'perpetuidad']);

export const supuestosPenales = pgTable('supuestos_penales', {
  id: uuid('id').primaryKey().defaultRandom(),
  delitoId: uuid('delito_id').notNull(),
  numeral: varchar('numeral', { length: 50 }),
  literal: varchar('literal', { length: 50 }),
  inciso: varchar('inciso', { length: 50 }),
  textoModalidad: text('texto_modalidad'),
  penaMinMeses: integer('pena_min_meses').notNull(),
  penaMaxMeses: integer('pena_max_meses').notNull(),
  tipoPena: tipoPenaEnum('tipo_pena').notNull().default('prision'),
  tieneAgravantesEspecificas: boolean('tiene_agravantes_especificas').default(false),
  observaciones: text('observaciones'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  delitoRef: foreignKey({ columns: [table.delitoId], foreignColumns: [delitos.id] }),
  delitoIdx: index('supuestos_penales_delito_idx').on(table.delitoId),
  numeralLiteralIncisoIdx: index('supuestos_penales_numeral_literal_inciso_idx').on(table.numeral, table.literal, table.inciso),
}));

export type SupuestoPenal = typeof supuestosPenales.$inferSelect;
export type SupuestoPenalInsert = typeof supuestosPenales.$inferInsert;

export const agravantesEspecificas = pgTable('agravantes_especificas', {
  id: uuid('id').primaryKey().defaultRandom(),
  supuestoPenalId: uuid('supuesto_penal_id').notNull(),
  articuloCp: varchar('articulo_cp', { length: 100 }).notNull(),
  numeral: varchar('numeral', { length: 50 }),
  literal: varchar('literal', { length: 50 }),
  textoAgravante: text('texto_agravante').notNull(),
  fraccionAumento: varchar('fraccion_aumento', { length: 20 }).notNull(),
  obligatoria: boolean('obligatoria').default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  supuestoRef: foreignKey({ columns: [table.supuestoPenalId], foreignColumns: [supuestosPenales.id] }),
  supuestoIdx: index('agravantes_especificas_supuesto_idx').on(table.supuestoPenalId),
  articuloIdx: index('agravantes_especificas_articulo_idx').on(table.articuloCp),
}));

export type AgravanteEspecifica = typeof agravantesEspecificas.$inferSelect;
export type AgravanteEspecificaInsert = typeof agravantesEspecificas.$inferInsert;

export const remisionesNormativas = pgTable('remisiones_normativas', {
  id: uuid('id').primaryKey().defaultRandom(),
  articuloOrigen: varchar('articulo_origen', { length: 100 }).notNull(),
  numeralOrigen: varchar('numeral_origen', { length: 50 }),
  articuloDestino: varchar('articulo_destino', { length: 100 }).notNull(),
  numeralDestino: varchar('numeral_destino', { length: 50 }),
  textoRemision: text('texto_remision').notNull(),
  condicionAplicacion: text('condicion_aplicacion'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  articuloOrigenIdx: index('remisiones_articulo_origen_idx').on(table.articuloOrigen),
  articuloDestinoIdx: index('remisiones_articulo_destino_idx').on(table.articuloDestino),
}));

export type RemisionNormativa = typeof remisionesNormativas.$inferSelect;
export type RemisionNormativaInsert = typeof remisionesNormativas.$inferInsert;

// ============================================================
// SGIE Autopilot — Modelo base (Fase 1)
//
// Tablas aditivas para el Sistema de Gestión Integral de
// Expedientes. No modifican tablas existentes (salvo columnas de
// gobernanza en `usuarios`). Convención del repo: snake_case en DB,
// uuid PK defaultRandom, FKs explícitas, índices en claves de acceso.
// Referencia: pinedayasociados.md §20 (entidades) y §8.2 (estados).
// ============================================================

// --- Enums SGIE ---

// Estados del expediente (§8.2). Las transiciones críticas
// (`validado` y posteriores) sólo las realiza el abogado, nunca el sistema.
export const expedienteEstadoEnum = pgEnum('expediente_estado', [
  'creado',
  'pendiente_de_checklist',
  'pendiente_de_documentos',
  'enlace_enviado',
  'documentos_parcialmente_recibidos',
  'documentos_completos',
  'analisis_pendiente',
  'analisis_completado',
  'inconsistencias_detectadas',
  'pendiente_validacion_abogado',
  'validado', // Sólo abogado
  'pendiente_de_firma', // Sólo abogado
  'en_tramite', // Sólo abogado
  'en_seguimiento',
  'finalizado', // Sólo abogado
  'archivado', // Sólo abogado o política aprobada
  // Fase 2 — bloqueo documental por falta de respuesta del cliente.
  'bloqueado_por_cliente',
  // Fase 5 — puerta "Listo para revisión": preparación documental vs validación jurídica.
  'listo_para_revision',
  'devuelto_por_abogado',
]);

// Estados que requieren acción humana explícita (transiciones críticas).
// El sistema nunca ejecuta estas transiciones automáticamente.
export const EXPEDIENTE_ESTADOS_CRITICOS = new Set<string>([
  'validado',
  'pendiente_de_firma',
  'en_tramite',
  'finalizado',
  'archivado',
]);

// Tipo inferido del enum de estados de expediente (para firmas de funciones).
export type ExpedienteEstado = (typeof expedienteEstadoEnum.enumValues)[number];

export const expedientePrioridadEnum = pgEnum('expediente_prioridad', [
  'baja',
  'media',
  'alta',
  'urgente',
]);

export const procedimientoEstadoEnum = pgEnum('procedimiento_estado', [
  'borrador',
  'activo',
  'desactivado',
  'pendiente_validacion_legal',
]);

export const requisitoTipoEnum = pgEnum('requisito_tipo', [
  'obligatorio',
  'opcional',
  'condicional',
]);

export const requisitoEstadoEnum = pgEnum('requisito_estado', [
  'solicitado',
  'subido',
  'clasificando',
  'clasificado',
  'texto_extraido',
  'ocr_pendiente',
  'ilegible',
  'duplicado',
  'incorrecto',
  'vencido',
  'ia_procesada',
  'pendiente_abogado',
  'aprobado',
  'rechazado',
]);

export const asignacionRolEnum = pgEnum('asignacion_rol', [
  'responsable',
  'colaborador',
  'supervisor',
]);

export const actorTipoEnum = pgEnum('actor_tipo', [
  'abogado',
  'admin',
  'sistema',
]);

// --- Tablas SGIE ---

// Perfil SGIE 1:1 de un usuario con rol abogado. Vínculo de correo
// corporativo y flag de activación SGIE (independiente de `usuarios.active`).
export const usuariosSgie = pgTable('usuarios_sgie', {
  usuarioId: uuid('usuario_id').primaryKey(),
  correoCorporativo: varchar('correo_corporativo', { length: 255 }),
  activoSgie: boolean('activo_sgie').default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }),
}));

export type UsuarioSgie = typeof usuariosSgie.$inferSelect;
export type UsuarioSgieInsert = typeof usuariosSgie.$inferInsert;

// Maestro de clientes. `duplicadoHash` permite detección de duplicados
// por identidad/RTN normalizado sin exponer PII en el índice.
export const clientes = pgTable('clientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  identidad: varchar('identidad', { length: 50 }),
  rtn: varchar('rtn', { length: 50 }),
  email: varchar('email', { length: 255 }),
  telefono: varchar('telefono', { length: 50 }),
  notas: text('notas'),
  duplicadoHash: varchar('duplicado_hash', { length: 64 }),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
  // Sprint 5 — baja lógica. El cliente inactivo conserva todos sus datos y
  // expedientes; sólo se bloquea la creación de expedientes nuevos.
  activo: boolean('activo').notNull().default(true),
  desactivadoEn: timestamp('desactivado_en', { withTimezone: true }),
  desactivadoPor: uuid('desactivado_por'),
  motivoDesactivacion: text('motivo_desactivacion'),
}, (table) => ({
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  desactivadoPorRef: foreignKey({ columns: [table.desactivadoPor], foreignColumns: [usuarios.id] }),
  duplicadoHashIdx: index('clientes_duplicado_hash_idx').on(table.duplicadoHash),
  identidadIdx: index('clientes_identidad_idx').on(table.identidad),
  nombreIdx: index('clientes_nombre_idx').on(table.nombre),
}));

export type Cliente = typeof clientes.$inferSelect;
export type ClienteInsert = typeof clientes.$inferInsert;

// Catálogo versionado de procedimientos. Los seeds iniciales se marcan
// `pendiente_validacion_legal` hasta aprobación humana (§11.3).
// Un expediente se ancla a `procedimientoVersion` al crearse (§11.3).
export const tiposProcedimiento = pgTable('tipos_procedimiento', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  areaJuridica: varchar('area_juridica', { length: 200 }),
  descripcion: text('descripcion'),
  version: integer('version').notNull().default(1),
  estado: procedimientoEstadoEnum('estado').notNull().default('pendiente_validacion_legal'),
  // Definición declarativa del procedimiento (documentos requeridos/opcionales/
  // condicionales, campos esperados, reglas). JSON versionable; la validación
  // legal queda pendiente hasta `estado=activo`.
  definicion: jsonb('definicion'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('tipos_procedimiento_slug_idx').on(table.slug),
  estadoIdx: index('tipos_procedimiento_estado_idx').on(table.estado),
}));

export type TipoProcedimiento = typeof tiposProcedimiento.$inferSelect;
export type TipoProcedimientoInsert = typeof tiposProcedimiento.$inferInsert;

// Unidad central de trabajo. `procedimientoVersion` ancla la versión vigente
// al crear (§11.3). `responsableId` es el abogado principal.
export const expedientes = pgTable('expedientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  numeroInterno: varchar('numero_interno', { length: 100 }).notNull().unique(),
  clienteId: uuid('cliente_id'),
  tipoProcedimientoId: uuid('tipo_procedimiento_id'),
  procedimientoVersion: integer('procedimiento_version'),
  responsableId: uuid('responsable_id'),
  estado: expedienteEstadoEnum('estado').notNull().default('creado'),
  prioridad: expedientePrioridadEnum('prioridad').notNull().default('media'),
  area: varchar('area', { length: 200 }),
  resumen: text('resumen'),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
  cerradoEn: timestamp('cerrado_en', { withTimezone: true }),
}, (table) => ({
  clienteRef: foreignKey({ columns: [table.clienteId], foreignColumns: [clientes.id] }),
  tipoProcedimientoRef: foreignKey({ columns: [table.tipoProcedimientoId], foreignColumns: [tiposProcedimiento.id] }),
  responsableRef: foreignKey({ columns: [table.responsableId], foreignColumns: [usuarios.id] }),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  numeroInternoIdx: index('expedientes_numero_interno_idx').on(table.numeroInterno),
  estadoIdx: index('expedientes_estado_idx').on(table.estado),
  responsableIdx: index('expedientes_responsable_idx').on(table.responsableId),
  clienteIdx: index('expedientes_cliente_idx').on(table.clienteId),
}));

export type Expediente = typeof expedientes.$inferSelect;
export type ExpedienteInsert = typeof expedientes.$inferInsert;

// Asignación abogado ↔ expediente. Un expediente tiene un `responsable`
// y puede tener colaboradores/supervisores. Base del scope por abogado.
export const expedienteAsignaciones = pgTable('expediente_asignaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  abogadoId: uuid('abogado_id').notNull(),
  rol: asignacionRolEnum('rol').notNull().default('responsable'),
  asignadoPor: uuid('asignado_por'),
  asignadoEn: timestamp('asignado_en', { withTimezone: true }).defaultNow(),
  revocadaEn: timestamp('revocada_en', { withTimezone: true }),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }),
  abogadoRef: foreignKey({ columns: [table.abogadoId], foreignColumns: [usuarios.id] }),
  asignadoPorRef: foreignKey({ columns: [table.asignadoPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('expediente_asignaciones_expediente_idx').on(table.expedienteId),
  abogadoIdx: index('expediente_asignaciones_abogado_idx').on(table.abogadoId),
  // Una sola asignación activa (no revocada) por (expediente, abogado).
  activaUnica: unique('expediente_asignaciones_activa_unica').on(table.expedienteId, table.abogadoId),
}));

export type ExpedienteAsignacion = typeof expedienteAsignaciones.$inferSelect;
export type ExpedienteAsignacionInsert = typeof expedienteAsignaciones.$inferInsert;

// Permisos extra: acceso a expediente sin ser responsable (revisión por
// supervisión, sustitución o reasignación). Concedido por admin (§6.2).
export const expedientePermisos = pgTable('expediente_permisos', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  abogadoId: uuid('abogado_id').notNull(),
  tipoPermiso: varchar('tipo_permiso', { length: 50 }).notNull(),
  concedidoPor: uuid('concedido_por'),
  concedidoEn: timestamp('concedido_en', { withTimezone: true }).defaultNow(),
  revocadoEn: timestamp('revocado_en', { withTimezone: true }),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }),
  abogadoRef: foreignKey({ columns: [table.abogadoId], foreignColumns: [usuarios.id] }),
  concedidoPorRef: foreignKey({ columns: [table.concedidoPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('expediente_permisos_expediente_idx').on(table.expedienteId),
  abogadoIdx: index('expediente_permisos_abogado_idx').on(table.abogadoId),
}));

export type ExpedientePermiso = typeof expedientePermisos.$inferSelect;
export type ExpedientePermisoInsert = typeof expedientePermisos.$inferInsert;

// Checklist instanciado por expediente. Anclado a la versión del
// procedimiento al crear. Cada requisito tiene tipo y estado documental.
export const requisitosExpediente = pgTable('requisitos_expediente', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  // Referencia opcional al requisito dentro de la definición del procedimiento
  // (clave textual dentro de `tipos_procedimiento.definicion`).
  procedimientoRequisitoKey: varchar('procedimiento_requisito_key', { length: 100 }),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  tipo: requisitoTipoEnum('tipo').notNull().default('obligatorio'),
  estado: requisitoEstadoEnum('estado').notNull().default('solicitado'),
  orden: integer('orden').default(0),
  confirmado: boolean('confirmado').default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }),
  expedienteIdx: index('requisitos_expediente_expediente_idx').on(table.expedienteId),
}));

export type RequisitoExpediente = typeof requisitosExpediente.$inferSelect;
export type RequisitoExpedienteInsert = typeof requisitosExpediente.$inferInsert;

// Línea de tiempo del expediente (audit trail). Cada acción crítica
// registra actor, estado anterior/nuevo y metadata (§20.3).
export const historialExpediente = pgTable('historial_expediente', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  accion: varchar('accion', { length: 100 }).notNull(),
  estadoAnterior: varchar('estado_anterior', { length: 50 }),
  estadoNuevo: varchar('estado_nuevo', { length: 50 }),
  actorId: uuid('actor_id'),
  actorTipo: actorTipoEnum('actor_tipo').notNull().default('sistema'),
  metadata: jsonb('metadata'),
  mensaje: text('mensaje'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }),
  actorRef: foreignKey({ columns: [table.actorId], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('historial_expediente_expediente_idx').on(table.expedienteId),
  creadoEnIdx: index('historial_expediente_creado_en_idx').on(table.creadoEn),
}));

export type HistorialExpediente = typeof historialExpediente.$inferSelect;
export type HistorialExpedienteInsert = typeof historialExpediente.$inferInsert;

// ============================================================
// SGIE Autopilot — Modelo extendido (Fases 4–10)
//
// Tablas aditivas para: enlaces mágicos y carga documental (Fase 4),
// plantillas y correos (Fase 5), motor documental (Fase 6), IA (Fase 7),
// reglas y confianza (Fase 8), agenda/tareas (Fase 9), métricas/auditoría/
// aprendizaje/retención (Fase 10). Referencia: pinedayasociados.md §20.
// ============================================================

// --- Enums adicionales ---

export const documentoEstadoEnum = pgEnum('documento_estado', [
  'solicitado', 'subido', 'clasificando', 'clasificado', 'texto_extraido',
  'ocr_pendiente', 'ilegible', 'duplicado', 'incorrecto', 'vencido',
  'ia_procesada', 'pendiente_abogado', 'aprobado', 'rechazado',
]);

export const documentoOrigenEnum = pgEnum('documento_origen', [
  'cliente', 'abogado', 'admin', 'sistema',
]);

export const severidadEnum = pgEnum('severidad', [
  'info', 'advertencia', 'error', 'critico',
]);

export const alertaSeveridadEnum = pgEnum('alerta_severidad', [
  'info', 'advertencia', 'error', 'critico',
]);

export const tareaEstadoEnum = pgEnum('tarea_estado', [
  'pendiente', 'en_progreso', 'completada', 'cancelada',
]);

export const tareaPrioridadEnum = pgEnum('tarea_prioridad', [
  'baja', 'media', 'alta', 'urgente',
]);

export const eventoAgendaTipoEnum = pgEnum('evento_agenda_tipo', [
  'interna', 'procesal_detectada', 'audiencia', 'recordatorio', 'vencimiento_enlace',
  'personal', 'cita_cliente', 'plazo', 'revision_interna', 'firma', 'tarea_hito', 'ausencia',
]);

export const eventoAgendaEstadoEnum = pgEnum('evento_agenda_estado', [
  'propuesta', 'confirmada', 'descartada', 'completada', 'cancelada',
]);

export const eventoAgendaVisibilidadEnum = pgEnum('evento_agenda_visibilidad', [
  'privado', 'expediente', 'equipo',
]);

export const plantillaCorreoEstadoEnum = pgEnum('plantilla_correo_estado', [
  'borrador', 'activa', 'desactivada',
]);

export const correoEstadoEnum = pgEnum('correo_estado', [
  'pendiente', 'enviado', 'fallido', 'reintentando',
]);

export const jobSgieEstadoEnum = pgEnum('job_sgie_estado', [
  'pendiente', 'en_proceso', 'completado', 'fallido', 'cancelado', 'dead_lettered',
]);

export const jobSgieTipoEnum = pgEnum('job_sgie_tipo', [
  'extraccion_texto', 'clasificacion', 'ocr', 'ia_extraccion',
  'reglas_ejecucion', 'confianza_calculo', 'correo_envio', 'recordatorio',
  'retencion_archivado', 'limpieza',
]);

export type JobSgieTipo = (typeof jobSgieTipoEnum.enumValues)[number];

export const sugerenciaEstadoEnum = pgEnum('sugerencia_estado', [
  'pendiente', 'aprobada', 'rechazada', 'aplicada',
]);

// --- Fase 4: enlaces mágicos y carga documental ---

// Token de carga seguro: 256 bits, expiración, usos máximos, revocable.
// Scope a expediente/requisito. Acceso público por token (no indexable).
export const enlacesMagicos = pgTable('enlaces_magicos', {
  id: uuid('id').primaryKey().defaultRandom(),
  // NUNCA se almacena el token en claro: se persiste su hash SHA-256 (hex, 64).
  // El token en claro solo vive en memoria en el momento de emisión/envío por
  // email y viaja en la URL /cargar/{token} como credencial del cliente.
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expedienteId: uuid('expediente_id').notNull(),
  requisitoExpedienteId: uuid('requisito_expediente_id'),
  clienteEmail: varchar('cliente_email', { length: 255 }),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
  usosMaximos: integer('usos_maximos').default(1),
  usosActuales: integer('usos_actuales').default(0),
  revocadoEn: timestamp('revocado_en', { withTimezone: true }),
  revocadoPor: uuid('revocado_por'),
  revocadoMotivo: varchar('revocado_motivo', { length: 500 }),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  requisitoRef: foreignKey({ columns: [table.requisitoExpedienteId], foreignColumns: [requisitosExpediente.id] }),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  tokenHashIdx: index('enlaces_magicos_token_hash_idx').on(table.tokenHash),
  expedienteIdx: index('enlaces_magicos_expediente_idx').on(table.expedienteId),
}));

export type EnlaceMagico = typeof enlacesMagicos.$inferSelect;
export type EnlaceMagicoInsert = typeof enlacesMagicos.$inferInsert;

export const portalSessions = pgTable('portal_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  enlaceId: uuid('enlace_id'),
  clienteEmail: varchar('cliente_email', { length: 255 }),
  ultimoAcceso: timestamp('ultimo_acceso', { withTimezone: true }),
  expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  enlaceRef: foreignKey({ columns: [table.enlaceId], foreignColumns: [enlacesMagicos.id] }).onDelete('cascade'),
  tokenHashIdx: index('portal_sessions_token_hash_idx').on(table.tokenHash),
  enlaceIdx: index('portal_sessions_enlace_idx').on(table.enlaceId),
  clienteEmailIdx: index('portal_sessions_cliente_email_idx').on(table.clienteEmail),
  expiraIdx: index('portal_sessions_expira_idx').on(table.expiraEn),
}));

export type PortalSession = typeof portalSessions.$inferSelect;
export type PortalSessionInsert = typeof portalSessions.$inferInsert;


// Metadatos de documentos. Hash SHA-256 obligatorio antes de cualquier
// procesamiento IA/OCR. Detección de duplicados por hash. Bytes en Blob privado.
export const documentosExpediente = pgTable('documentos_expediente', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  requisitoExpedienteId: uuid('requisito_expediente_id'),
  enlaceMagicoId: uuid('enlace_magico_id'),
  nombreOriginal: varchar('nombre_original', { length: 500 }).notNull(),
  nombreSaneado: varchar('nombre_saneado', { length: 500 }).notNull(),
  tipoMime: varchar('tipo_mime', { length: 100 }).notNull(),
  tamañoBytes: integer('tamaño_bytes').notNull(),
  hashSha256: varchar('hash_sha256', { length: 64 }).notNull(),
  blobUrl: varchar('blob_url', { length: 1000 }).notNull(),
  blobTextoUrl: varchar('blob_texto_url', { length: 1000 }),
  estado: documentoEstadoEnum('estado').notNull().default('subido'),
  origen: documentoOrigenEnum('origen').notNull().default('cliente'),
  tipoDocumento: varchar('tipo_documento', { length: 100 }),
  subidoPor: uuid('subido_por'),
  subidoIp: varchar('subido_ip', { length: 64 }),
  subidoUserAgent: varchar('subido_user_agent', { length: 500 }),
  subidoEn: timestamp('subido_en', { withTimezone: true }).defaultNow(),
  procesadoEn: timestamp('procesado_en', { withTimezone: true }),
  aprobadoPor: uuid('aprobado_por'),
  aprobadoEn: timestamp('aprobado_en', { withTimezone: true }),
  rechazadoPor: uuid('rechazado_por'),
  rechazadoEn: timestamp('rechazado_en', { withTimezone: true }),
  rechazoMotivo: text('rechazo_motivo'),
  metadata: jsonb('metadata'),
  // Fase 4B-1: control optimista por documento para aprobación en bloque.
  // Incrementado en cada mutación de estado (aprobar/revertir). Permite
  // detectar conflictos concurrentes: UPDATE ... WHERE id=$1 AND version=$2.
  version: integer('version').notNull().default(1),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  requisitoRef: foreignKey({ columns: [table.requisitoExpedienteId], foreignColumns: [requisitosExpediente.id] }),
  enlaceRef: foreignKey({ columns: [table.enlaceMagicoId], foreignColumns: [enlacesMagicos.id] }),
  subidoPorRef: foreignKey({ columns: [table.subidoPor], foreignColumns: [usuarios.id] }),
  aprobadoPorRef: foreignKey({ columns: [table.aprobadoPor], foreignColumns: [usuarios.id] }),
  rechazadoPorRef: foreignKey({ columns: [table.rechazadoPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('documentos_expediente_expediente_idx').on(table.expedienteId),
  hashIdx: index('documentos_expediente_hash_idx').on(table.hashSha256),
  estadoIdx: index('documentos_expediente_estado_idx').on(table.estado),
  // Índice para el UPDATE optimista (id, version).
  idVersionIdx: index('documentos_expediente_id_version_idx').on(table.id, table.version),
}));

export type DocumentoExpediente = typeof documentosExpediente.$inferSelect;
export type DocumentoExpedienteInsert = typeof documentosExpediente.$inferInsert;

// --- Fase 5: plantillas y correos ---

export const plantillasCorreo = pgTable('plantillas_correo', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  asunto: varchar('asunto', { length: 300 }).notNull(),
  cuerpoHtml: text('cuerpo_html').notNull(),
  variablesPermitidas: text('variables_permitidas').array().default([]),
  estado: plantillaCorreoEstadoEnum('estado').notNull().default('borrador'),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('plantillas_correo_slug_idx').on(table.slug),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
}));

export type PlantillaCorreo = typeof plantillasCorreo.$inferSelect;
export type PlantillaCorreoInsert = typeof plantillasCorreo.$inferInsert;

// Registro de correos con idempotencia: UNIQUE (expediente_id, plantilla_slug,
// ventana_temporal) evita duplicados por el mismo disparador en la misma ventana.
export const correosEnviados = pgTable('correos_enviados', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id'),
  plantillaSlug: varchar('plantilla_slug', { length: 100 }).notNull(),
  destinatario: varchar('destinatario', { length: 255 }).notNull(),
  asunto: varchar('asunto', { length: 300 }).notNull(),
  cuerpoHtml: text('cuerpo_html').notNull(),
  estado: correoEstadoEnum('estado').notNull().default('pendiente'),
  resendId: varchar('resend_id', { length: 255 }),
  ventanaTemporal: varchar('ventana_temporal', { length: 50 }),
  intentos: integer('intentos').default(0),
  error: text('error'),
  enviadoPor: uuid('enviado_por'),
  enviadoEn: timestamp('enviado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  enviadoPorRef: foreignKey({ columns: [table.enviadoPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('correos_enviados_expediente_idx').on(table.expedienteId),
  idempotenciaUnique: unique('correos_enviados_idempotencia_unique')
    .on(table.expedienteId, table.plantillaSlug, table.ventanaTemporal),
}));

export type CorreoEnviado = typeof correosEnviados.$inferSelect;
export type CorreoEnviadoInsert = typeof correosEnviados.$inferInsert;

// --- Fase 7: extracciones IA y campos ---

export const extraccionesIa = pgTable('extracciones_ia', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentoId: uuid('documento_id').notNull(),
  proveedor: varchar('proveedor', { length: 100 }),
  modelo: varchar('modelo', { length: 100 }),
  promptHash: varchar('prompt_hash', { length: 64 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  duracionMs: integer('duracion_ms'),
  exito: boolean('exito').default(true),
  error: text('error'),
  resultadoJson: jsonb('resultado_json'),
  // Fase 4 — IA documental: estado sugerido, score compuesto e idempotencia.
  suggestedStatus: varchar('suggested_status', { length: 50 }),
  totalConfidence: integer('total_confidence'),
  inputHash: varchar('input_hash', { length: 64 }),
  runStatus: varchar('run_status', { length: 20 }).default('completed'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  documentoIdx: index('extracciones_ia_documento_idx').on(table.documentoId),
}));

/**
 * Texto extraído por página de un documento (Fase 3).
 *
 * Cada fila es una página: su texto, el método (pdf_text/ocr/manual) y la
 * confianza cuando aplique. Permite revisión asistente página a página y
 * reanálisis sin re-extraer. Vinculada al documento y (opcional) a la
 * extracción de `extracciones_ia` que la generó.
 *
 * No guarda binarios: solo el texto extraído. Referencia: Fase 3 MVP.
 */
export const documentTextPages = pgTable('document_text_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentoId: uuid('documento_id').notNull(),
  extractionId: uuid('extraction_id'),
  pageNumber: integer('page_number').notNull(),
  text: text('text').notNull(),
  method: varchar('method', { length: 30 }).notNull().default('pdf_text'),
  confidence: real('confidence'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  extractionRef: foreignKey({ columns: [table.extractionId], foreignColumns: [extraccionesIa.id] }).onDelete('set null'),
  documentoIdx: index('document_text_pages_documento_idx').on(table.documentoId),
  documentoPaginaUnique: unique('document_text_pages_documento_pagina_unique').on(table.documentoId, table.pageNumber),
}));

export type DocumentTextPage = typeof documentTextPages.$inferSelect;
export type DocumentTextPageInsert = typeof documentTextPages.$inferInsert;

export type ExtraccionIa = typeof extraccionesIa.$inferSelect;
export type ExtraccionIaInsert = typeof extraccionesIa.$inferInsert;

// Campos extraídos con confianza inicial y cita fuente. La confianza final
// la calcula el motor de confianza (Fase 8) y se guarda en confianza_resultados.
export const camposExtraidos = pgTable('campos_extraidos', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentoId: uuid('documento_id').notNull(),
  expedienteId: uuid('expediente_id').notNull(),
  clave: varchar('clave', { length: 100 }).notNull(),
  valor: text('valor'),
  tipo: varchar('tipo', { length: 50 }),
  confianza: integer('confianza'),
  citaFragmento: text('cita_fragmento'),
  observaciones: text('observaciones'),
  confirmadoPor: uuid('confirmado_por'),
  confirmadoEn: timestamp('confirmado_en', { withTimezone: true }),
  corregidoValor: text('corregido_valor'),
  corregidoPor: uuid('corregido_por'),
  corregidoEn: timestamp('corregido_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  confirmadoPorRef: foreignKey({ columns: [table.confirmadoPor], foreignColumns: [usuarios.id] }),
  corregidoPorRef: foreignKey({ columns: [table.corregidoPor], foreignColumns: [usuarios.id] }),
  documentoIdx: index('campos_extraidos_documento_idx').on(table.documentoId),
  expedienteIdx: index('campos_extraidos_expediente_idx').on(table.expedienteId),
}));

export type CampoExtraido = typeof camposExtraidos.$inferSelect;
export type CampoExtraidoInsert = typeof camposExtraidos.$inferInsert;

// --- Fase 8: reglas, validaciones, confianza, alertas ---

// Configuración de reglas/umbrales versionada. Cambios críticos requieren
// confirmación del admin y auditoría.
export const reglasConfigVersion = pgTable('reglas_config_version', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull(),
  config: jsonb('config').notNull(),
  descripcion: varchar('descripcion', { length: 500 }),
  aprobadoPor: uuid('aprobado_por'),
  activa: boolean('activa').default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  aprobadoPorRef: foreignKey({ columns: [table.aprobadoPor], foreignColumns: [usuarios.id] }),
  versionIdx: index('reglas_config_version_idx').on(table.version),
}));

export type ReglasConfigVersion = typeof reglasConfigVersion.$inferSelect;
export type ReglasConfigVersionInsert = typeof reglasConfigVersion.$inferInsert;

// Resultados del motor de reglas (determinista, idempotente).
export const validaciones = pgTable('validaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  documentoId: uuid('documento_id'),
  reglaId: varchar('regla_id', { length: 100 }).notNull(),
  severidad: severidadEnum('severidad').notNull(),
  resultado: varchar('resultado', { length: 50 }).notNull(),
  evidencias: jsonb('evidencias'),
  mensaje: text('mensaje'),
  ventanaTemporal: varchar('ventana_temporal', { length: 50 }),
  ejecutadoPor: varchar('ejecutado_por', { length: 50 }).default('sistema'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  expedienteIdx: index('validaciones_expediente_idx').on(table.expedienteId),
  // Idempotencia: una regla por expediente+documento+regla+ventana.
  idempotenciaUnique: unique('validaciones_idempotencia_unique')
    .on(table.expedienteId, table.reglaId, table.ventanaTemporal),
}));

export type Validacion = typeof validaciones.$inferSelect;
export type ValidacionInsert = typeof validaciones.$inferInsert;

// Confianza calculada por documento/campo/expediente con evidencias.
export const confianzaResultados = pgTable('confianza_resultados', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id'),
  documentoId: uuid('documento_id'),
  campoExtraidoId: uuid('campo_extraido_id'),
  nivel: varchar('nivel', { length: 20 }).notNull(), // campo | documento | expediente
  confianza: integer('confianza').notNull(), // 0-100
  etiqueta: varchar('etiqueta', { length: 20 }), // baja | media | alta | muy_alta
  evidencias: jsonb('evidencias'),
  reglasConfigVersionId: uuid('reglas_config_version_id'),
  calculadoEn: timestamp('calculado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  campoRef: foreignKey({ columns: [table.campoExtraidoId], foreignColumns: [camposExtraidos.id] }).onDelete('cascade'),
  reglasRef: foreignKey({ columns: [table.reglasConfigVersionId], foreignColumns: [reglasConfigVersion.id] }),
  expedienteIdx: index('confianza_resultados_expediente_idx').on(table.expedienteId),
}));

export type ConfianzaResultado = typeof confianzaResultados.$inferSelect;
export type ConfianzaResultadoInsert = typeof confianzaResultados.$inferInsert;

// Alertas generadas por el motor de reglas o por el sistema.
export const alertas = pgTable('alertas', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id'),
  documentoId: uuid('documento_id'),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  severidad: alertaSeveridadEnum('severidad').notNull(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  mensaje: text('mensaje'),
  resuelta: boolean('resuelta').default(false),
  resueltaPor: uuid('resuelta_por'),
  resueltaEn: timestamp('resuelta_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  resueltaPorRef: foreignKey({ columns: [table.resueltaPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('alertas_expediente_idx').on(table.expedienteId),
  severidadIdx: index('alertas_severidad_idx').on(table.severidad),
  resueltaIdx: index('alertas_resuelta_idx').on(table.resuelta),
}));

export type Alerta = typeof alertas.$inferSelect;
export type AlertaInsert = typeof alertas.$inferInsert;

// --- Fase 9: tareas y eventos de agenda ---

export const tareas = pgTable('tareas', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id'),
  asignadaA: uuid('asignada_a'),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descripcion: text('descripcion'),
  estado: tareaEstadoEnum('estado').notNull().default('pendiente'),
  prioridad: tareaPrioridadEnum('prioridad').notNull().default('media'),
  automatica: boolean('automatica').default(false),
  fechaVencimiento: timestamp('fecha_vencimiento', { withTimezone: true }),
  completadaEn: timestamp('completada_en', { withTimezone: true }),
  creadaPor: uuid('creada_por'),
  creadaEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  asignadaARef: foreignKey({ columns: [table.asignadaA], foreignColumns: [usuarios.id] }),
  creadaPorRef: foreignKey({ columns: [table.creadaPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('tareas_expediente_idx').on(table.expedienteId),
  asignadaIdx: index('tareas_asignada_idx').on(table.asignadaA),
  estadoIdx: index('tareas_estado_idx').on(table.estado),
}));

export type Tarea = typeof tareas.$inferSelect;
export type TareaInsert = typeof tareas.$inferInsert;

export const eventosAgenda = pgTable('eventos_agenda', {
  id: uuid('id').primaryKey().defaultRandom(),
  propietarioId: uuid('propietario_id').notNull(),
  creadoPor: uuid('creado_por').notNull(),
  expedienteId: uuid('expediente_id'),
  tipo: eventoAgendaTipoEnum('tipo').notNull(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descripcion: text('descripcion'),
  inicio: timestamp('inicio', { withTimezone: true }).notNull(),
  fin: timestamp('fin', { withTimezone: true }),
  todoElDia: boolean('todo_el_dia').notNull().default(false),
  zonaHoraria: varchar('zona_horaria', { length: 100 }).notNull().default('America/Tegucigalpa'),
  ubicacion: varchar('ubicacion', { length: 500 }),
  visibilidad: eventoAgendaVisibilidadEnum('visibilidad').notNull().default('privado'),
  participantes: jsonb('participantes').$type<Array<{ usuarioId?: string; email?: string; nombre?: string }>>().notNull().default([]),
  recordatorios: jsonb('recordatorios').$type<Array<{ minutosAntes: number; canal: 'email' | 'sistema' }>>().notNull().default([]),
  fecha: timestamp('fecha', { withTimezone: true }).notNull(),
  estado: eventoAgendaEstadoEnum('estado').notNull().default('propuesta'),
  canceladaEn: timestamp('cancelada_en', { withTimezone: true }),
  version: integer('version').notNull().default(1),
  origenConfianza: integer('origen_confianza'),
  confirmadaPor: uuid('confirmada_por'),
  confirmadaEn: timestamp('confirmada_en', { withTimezone: true }),
  creadaEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  propietarioRef: foreignKey({ columns: [table.propietarioId], foreignColumns: [usuarios.id] }),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  confirmadaPorRef: foreignKey({ columns: [table.confirmadaPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('eventos_agenda_expediente_idx').on(table.expedienteId),
  fechaIdx: index('eventos_agenda_fecha_idx').on(table.fecha),
  propietarioIdx: index('eventos_agenda_propietario_idx').on(table.propietarioId),
  inicioIdx: index('eventos_agenda_inicio_idx').on(table.inicio),
}));

export type EventoAgenda = typeof eventosAgenda.$inferSelect;
export type EventoAgendaInsert = typeof eventosAgenda.$inferInsert;

// ────────────────────────────────────────────────────────────────────────────
// Sprint 3 — Notificaciones leídas (persistencia de lectura).
//
// Las notificaciones del SGIE son DERIVADAS (virtuales): se calculan del estado
// actual (tareas vencidas, alertas, etc.) sin persistir el contenido. Esta
// tabla persiste SÓLO el hecho de que el usuario marcó una notificación como
// leída, identificada por una clave estable (`notificacionKey` = tipo:recursoId).
// Así el badge cuenta sólo las no leídas, sin necesidad de persistir el payload.
// ────────────────────────────────────────────────────────────────────────────
export const notificacionesLeidas = pgTable('notificaciones_leidas', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull(),
  // Clave estable de la notificación, ej. "tarea_vencida:<uuid>".
  notificacionKey: varchar('notificacion_key', { length: 200 }).notNull(),
  leidaEn: timestamp('leida_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  // Un usuario + clave → una fila (idempotente: marcar dos veces no duplica).
  usuarioKeyUnique: unique('notificaciones_leidas_usuario_key_unique').on(table.usuarioId, table.notificacionKey),
  usuarioIdx: index('notificaciones_leidas_usuario_idx').on(table.usuarioId),
}));

export type NotificacionLeida = typeof notificacionesLeidas.$inferSelect;
export type NotificacionLeidaInsert = typeof notificacionesLeidas.$inferInsert;

// ────────────────────────────────────────────────────────────────────────────
// Sprint 4 — Resúmenes IA de expediente (caché validada).
//
// Persiste el resumen generado por IA para no recalcular en cada render. El
// hash_entrada permite invalidar el caché si cambian los datos fuente del
// expediente (documentos, campos, estados). Cumple R17: prompt restrictivo,
// no inventa datos legales, IA nunca decide estados.
// ────────────────────────────────────────────────────────────────────────────
export const resumenesIaExpediente = pgTable('resumenes_ia_expediente', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  resumen: text('resumen').notNull(),
  proveedor: varchar('proveedor', { length: 50 }).notNull(),
  modelo: varchar('modelo', { length: 100 }).notNull(),
  generadoPor: uuid('generado_por').notNull(),
  generadoEn: timestamp('generado_en', { withTimezone: true }).defaultNow(),
  hashEntrada: varchar('hash_entrada', { length: 64 }).notNull(),
  confianza: integer('confianza').default(0),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  metadata: jsonb('metadata'),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  generadoPorRef: foreignKey({ columns: [table.generadoPor], foreignColumns: [usuarios.id] }).onDelete('set null'),
  // Un resumen vigente por expediente (se reemplaza al regenerar).
  expedienteUnique: unique('resumenes_ia_expediente_exp_unique').on(table.expedienteId),
  expedienteIdx: index('resumenes_ia_expediente_exp_idx').on(table.expedienteId),
}));

export type ResumenIaExpediente = typeof resumenesIaExpediente.$inferSelect;
export type ResumenIaExpedienteInsert = typeof resumenesIaExpediente.$inferInsert;

// ────────────────────────────────────────────────────────────────────────────
// Sprint 4 — Comentarios de tarea (colaboración).
//
// Borrado lógico vía eliminado_en (no DELETE físico). Texto plano (sin HTML
// inseguro). Scope: el autor puede editar/eliminar los suyos; otros abogados
// con acceso a la tarea pueden comentar (sólo lectura de los ajenos).
// ────────────────────────────────────────────────────────────────────────────
export const tareaComentarios = pgTable('tarea_comentarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  tareaId: uuid('tarea_id').notNull(),
  autorId: uuid('autor_id').notNull(),
  comentario: text('comentario').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  editadoEn: timestamp('editado_en', { withTimezone: true }),
  eliminadoEn: timestamp('eliminado_en', { withTimezone: true }),
}, (table) => ({
  tareaRef: foreignKey({ columns: [table.tareaId], foreignColumns: [tareas.id] }).onDelete('cascade'),
  autorRef: foreignKey({ columns: [table.autorId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  tareaIdx: index('tarea_comentarios_tarea_idx').on(table.tareaId),
}));

export type TareaComentario = typeof tareaComentarios.$inferSelect;
export type TareaComentarioInsert = typeof tareaComentarios.$inferInsert;

// ────────────────────────────────────────────────────────────────────────────
// Sprint 4 — Tokens de reset de contraseña (un solo uso, expiración corta).
//
// Se almacena el HASH del token (no el token plano). Expiración 1h.
// Consumo: al usarlo, se marca consumido_en (no se borra, para auditoría).
// ────────────────────────────────────────────────────────────────────────────
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull(),
  tokenHash: varchar('token_hash', { length: 128 }).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  expiraEn: timestamp('expira_en', { withTimezone: true }).notNull(),
  consumidoEn: timestamp('consumido_en', { withTimezone: true }),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  tokenHashUnique: unique('password_reset_tokens_hash_unique').on(table.tokenHash),
  usuarioIdx: index('password_reset_tokens_usuario_idx').on(table.usuarioId),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type PasswordResetTokenInsert = typeof passwordResetTokens.$inferInsert;

// ────────────────────────────────────────────────────────────────────────────
// Sprint 5 — 2FA TOTP.
//
// El secret se cifra en reposo (encryptionAvailable). El enrolamiento es
// opt-in (admin/perfil), nunca automático. Los códigos de recuperación se
// guardan hasheados (SHA-256) y se muestran una sola vez.
// Si 2FA no está habilitado, el login actual sigue funcionando sin cambios.
// ────────────────────────────────────────────────────────────────────────────
export const twoFactorSecrets = pgTable('two_factor_secrets', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull(),
  // Secret TOTP cifrado (nunca en plano).
  secretCifrado: text('secret_cifrado').notNull(),
  habilitado: boolean('habilitado').notNull().default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  usuarioUnique: unique('two_factor_secrets_usuario_unique').on(table.usuarioId),
}));

export type TwoFactorSecret = typeof twoFactorSecrets.$inferSelect;
export type TwoFactorSecretInsert = typeof twoFactorSecrets.$inferInsert;

export const twoFactorRecoveryCodes = pgTable('two_factor_recovery_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id').notNull(),
  // Hash del código (SHA-256). El código plano se muestra una sola vez al generar.
  codeHash: varchar('code_hash', { length: 128 }).notNull(),
  usadoEn: timestamp('usado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  codeHashIdx: index('two_factor_recovery_codes_hash_idx').on(table.codeHash),
  usuarioIdx: index('two_factor_recovery_codes_usuario_idx').on(table.usuarioId),
}));

export type TwoFactorRecoveryCode = typeof twoFactorRecoveryCodes.$inferSelect;
export type TwoFactorRecoveryCodeInsert = typeof twoFactorRecoveryCodes.$inferInsert;

/** Challenges de segundo factor de un único uso; nunca contienen el token. */
export const twoFactorChallenges = pgTable('two_factor_challenges', {
  jti: varchar('jti', { length: 128 }).primaryKey(),
  usuarioId: uuid('usuario_id').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('cascade'),
  expiresIdx: index('two_factor_challenges_expires_idx').on(table.expiresAt),
}));

// --- Fase 6/7: jobs SGIE (cola idempotente) ---

export const jobsSgie = pgTable('jobs_sgie', {
  id: uuid('id').primaryKey().defaultRandom(),
  tipo: jobSgieTipoEnum('tipo').notNull(),
  refId: uuid('ref_id'), // documento_id, expediente_id, etc.
  estado: jobSgieEstadoEnum('estado').notNull().default('pendiente'),
  payload: jsonb('payload'),
  ventanaTemporal: varchar('ventana_temporal', { length: 50 }),
  intentos: integer('intentos').default(0),
  maxIntentos: integer('max_intentos').default(3),
  error: text('error'),
  errorCode: varchar('error_code', { length: 100 }),
  procesadoEn: timestamp('procesado_en', { withTimezone: true }),
  completadoEn: timestamp('completado_en', { withTimezone: true }),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }),
  workerId: varchar('worker_id', { length: 100 }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  priority: integer('priority').default(0),
  idempotencyKey: varchar('idempotency_key', { length: 64 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  estadoIdx: index('jobs_sgie_estado_idx').on(table.estado),
  tipoIdx: index('jobs_sgie_tipo_idx').on(table.tipo),
  priorityIdx: index('jobs_sgie_priority_idx').on(table.priority),
  idempotencyKeyUnique: unique('jobs_sgie_idempotency_key_unique').on(table.idempotencyKey),
  // Idempotencia: un job por tipo+ref+ventana.
  idempotenciaUnique: unique('jobs_sgie_idempotencia_unique')
    .on(table.tipo, table.refId, table.ventanaTemporal),
}));

export type JobSgie = typeof jobsSgie.$inferSelect;
export type JobSgieInsert = typeof jobsSgie.$inferInsert;

// --- Fase 10: aprendizaje controlado, retención ---

// Registro de correcciones del abogado sobre campos propuestos por IA.
export const correccionesIa = pgTable('correcciones_ia', {
  id: uuid('id').primaryKey().defaultRandom(),
  campoExtraidoId: uuid('campo_extraido_id').notNull(),
  campo: varchar('campo', { length: 100 }).notNull(),
  valorPropuesto: text('valor_propuesto'),
  valorCorregido: text('valor_corregido'),
  motivo: varchar('motivo', { length: 500 }),
  documentoId: uuid('documento_id'),
  abogadoId: uuid('abogado_id').notNull(),
  confianzaAnterior: integer('confianza_anterior'),
  confianzaPosterior: integer('confianza_posterior'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  campoRef: foreignKey({ columns: [table.campoExtraidoId], foreignColumns: [camposExtraidos.id] }).onDelete('cascade'),
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  abogadoRef: foreignKey({ columns: [table.abogadoId], foreignColumns: [usuarios.id] }),
  campoExtraidoIdx: index('correcciones_ia_campo_extraido_idx').on(table.campoExtraidoId),
}));

export type CorreccionIa = typeof correccionesIa.$inferSelect;
export type CorreccionIaInsert = typeof correccionesIa.$inferInsert;

// Sugerencias de ajuste de reglas/umbrales. Requieren aprobación humana.
export const sugerenciasAjuste = pgTable('sugerencias_ajuste', {
  id: uuid('id').primaryKey().defaultRandom(),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  propuesta: jsonb('propuesta'),
  backtest: jsonb('backtest'),
  estado: sugerenciaEstadoEnum('estado').notNull().default('pendiente'),
  aprobadaPor: uuid('aprobada_por'),
  aprobadaEn: timestamp('aprobada_en', { withTimezone: true }),
  creadaEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  aprobadaPorRef: foreignKey({ columns: [table.aprobadaPor], foreignColumns: [usuarios.id] }),
  estadoIdx: index('sugerencias_ajuste_estado_idx').on(table.estado),
}));

export type SugerenciaAjuste = typeof sugerenciasAjuste.$inferSelect;
export type SugerenciaAjusteInsert = typeof sugerenciasAjuste.$inferInsert;

// Política de retención configurable. NO VALIDADO hasta investigación legal Honduras.
export const retencionPoliticas = pgTable('retencion_politicas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  tipoDocumento: varchar('tipo_documento', { length: 100 }),
  estadoExpediente: varchar('estado_expediente', { length: 50 }),
  diasConservacion: integer('dias_conservacion'),
  accion: varchar('accion', { length: 50 }).default('archivar'), // archivar | migrar | destruir
  activa: boolean('activa').default(false),
  aprobadaPor: uuid('aprobada_por'),
  aprobadaEn: timestamp('aprobada_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  aprobadaPorRef: foreignKey({ columns: [table.aprobadaPor], foreignColumns: [usuarios.id] }),
}));

export type RetencionPolitica = typeof retencionPoliticas.$inferSelect;
export type RetencionPoliticaInsert = typeof retencionPoliticas.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
//  Vector embeddings para RAG (pgvector)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tabla de embeddings vectoriales para el sistema RAG.
 *
 * Almacena fragmentos (chunks) de contenido indexado (blog posts,
 * artículos legales, delitos, FAQs, PDFs, etc.) junto con su vector
 * de embedding generado por DeepSeek (deepseek-embedding, 1536 dims).
 *
 * FUENTE DE VERDAD: el contenido original en sus tablas/archivos fuente
 * (blog_posts, data/articulos_cp.json, etc.). Esta tabla es un índice
 * de búsqueda semántica, no una fuente primaria.
 *
 * Sprint RAG — Fase 1.
 */
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Tipo de entidad indexada: blog_post, articulo_cp, delito, etc. */
  entidadTipo: varchar('entidad_tipo', { length: 50 }).notNull(),
  /** Identificador único dentro de su tipo (slug del post, número de artículo, etc.) */
  entidadId: varchar('entidad_id', { length: 255 }).notNull(),
  /** Índice del chunk dentro de la entidad (0-based) */
  chunkIndex: integer('chunk_index').notNull().default(0),
  /** Contenido textual del chunk */
  contenido: text('contenido').notNull(),
  /** Vector de embedding (DeepSeek deepseek-embedding, 1536 dimensiones) */
  embedding: vector('embedding', { dimensions: 1536 }),
  /** Modelo que generó el embedding */
  modelo: varchar('modelo', { length: 50 }).notNull().default('deepseek-embedding'),
  /** Metadatos adicionales (categoría, autor, etc.) */
  metadata: jsonb('metadata').default({}),
  /** Fecha de creación */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	}, (table) => ({
	  entidadIdx: index('embeddings_entidad_idx').on(table.entidadTipo, table.entidadId),
	  uniqueIdx: uniqueIndex('embeddings_unique_idx').on(table.entidadTipo, table.entidadId, table.chunkIndex),
	  // El índice HNSW se crea vía migración SQL raw porque drizzle-orm no lo soporta directamente
	}));

// ─── Fase 5 — Puerta de calidad "Listo para revisión" ──────────────────────

/** Agrupa una evaluación de preparación documental del expediente. */
export const caseReadinessRuns = pgTable('case_readiness_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  estadoFinal: varchar('estado_final', { length: 40 }).notNull(),
  score: integer('score').default(0),
  checksTotal: integer('checks_total').default(0),
  checksPass: integer('checks_pass').default(0),
  checksWarn: integer('checks_warn').default(0),
  checksFail: integer('checks_fail').default(0),
  iniciadoPor: varchar('iniciado_por', { length: 50 }).default('sistema'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  expedienteIdx: index('case_readiness_runs_expediente_idx').on(table.expedienteId),
}));

/** Un check individual de preparación dentro de un run. Unique por (run, nombre). */
export const caseReadinessChecks = pgTable('case_readiness_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull(),
  expedienteId: uuid('expediente_id').notNull(),
  checkName: varchar('check_name', { length: 80 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('unknown'),
  source: varchar('source', { length: 30 }).default('system'),
  blocking: boolean('blocking').default(false),
  reason: text('reason'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  runRef: foreignKey({ columns: [table.runId], foreignColumns: [caseReadinessRuns.id] }).onDelete('cascade'),
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  uniqueRunCheck: unique('case_readiness_checks_run_check_unique').on(table.runId, table.checkName),
  expedienteIdx: index('case_readiness_checks_expediente_idx').on(table.expedienteId),
}));

export type CaseReadinessRun = typeof caseReadinessRuns.$inferSelect;
export type CaseReadinessRunInsert = typeof caseReadinessRuns.$inferInsert;
export type CaseReadinessCheck = typeof caseReadinessChecks.$inferSelect;
export type CaseReadinessCheckInsert = typeof caseReadinessChecks.$inferInsert;

export type Embedding = typeof embeddings.$inferSelect;
export type EmbeddingInsert = typeof embeddings.$inferInsert;

// ─── Preview tokens (Phase 2 — opaque, server-side, single-use) ───
export const previewTokens = pgTable('preview_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 128 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  body: text('body').notNull(),
  category: varchar('category', { length: 100 }).default('derecho-penal'),
  slug: varchar('slug', { length: 300 }).default('preview'),
  description: text('description').default(''),
  createdBy: uuid('created_by').notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tokenIdx: index('preview_tokens_token_idx').on(table.token),
  expiresIdx: index('preview_tokens_expires_idx').on(table.expiresAt),
  createdByRef: foreignKey({ columns: [table.createdBy], foreignColumns: [usuarios.id] }).onDelete('cascade'),
}));

export type PreviewToken = typeof previewTokens.$inferSelect;
export type PreviewTokenInsert = typeof previewTokens.$inferInsert;

// ============================================================
// Fase 2 — Workflows, Outbox, Jobs, Documentos OCR/AI,
//            Comunicaciones
// ============================================================

// ─── Procedimiento Versiones ─────────────────────────────────

export const procedimientoVersiones = pgTable('procedimiento_versiones', {
  id: uuid('id').primaryKey().defaultRandom(),
  procedimientoId: uuid('procedimiento_id').notNull(),
  version: integer('version').notNull(),
  definicion: jsonb('definicion'),
  estado: procedimientoEstadoEnum('estado').notNull().default('pendiente_validacion_legal'),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  procedimientoRef: foreignKey({ columns: [table.procedimientoId], foreignColumns: [tiposProcedimiento.id] }),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  procedimientoIdx: index('procedimiento_versiones_procedimiento_idx').on(table.procedimientoId),
  versionUnique: unique('procedimiento_versiones_version_unique').on(table.procedimientoId, table.version),
}));

export type ProcedimientoVersion = typeof procedimientoVersiones.$inferSelect;
export type ProcedimientoVersionInsert = typeof procedimientoVersiones.$inferInsert;

// ─── Procedimiento Fases ─────────────────────────────────────

export const procedimientoFases = pgTable('procedimiento_fases', {
  id: uuid('id').primaryKey().defaultRandom(),
  procedimientoVersionId: uuid('procedimiento_version_id').notNull(),
  nombre: varchar('nombre', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull(),
  orden: integer('orden').notNull().default(0),
  descripcion: text('descripcion'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  versionRef: foreignKey({ columns: [table.procedimientoVersionId], foreignColumns: [procedimientoVersiones.id] }),
  versionIdx: index('procedimiento_fases_version_idx').on(table.procedimientoVersionId),
  versionSlugUnique: unique('procedimiento_fases_version_slug_unique').on(table.procedimientoVersionId, table.slug),
}));

export type ProcedimientoFase = typeof procedimientoFases.$inferSelect;
export type ProcedimientoFaseInsert = typeof procedimientoFases.$inferInsert;

// ─── Procedimiento Transiciones ──────────────────────────────

export const procedimientoTransiciones = pgTable('procedimiento_transiciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  procedimientoVersionId: uuid('procedimiento_version_id').notNull(),
  desdeFaseId: uuid('desde_fase_id').notNull(),
  haciaFaseId: uuid('hacia_fase_id').notNull(),
  nombre: varchar('nombre', { length: 200 }),
  condiciones: jsonb('condiciones'),
  actoresPermitidos: text('actores_permitidos').array().default(['abogado', 'admin', 'sistema']),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  versionRef: foreignKey({ columns: [table.procedimientoVersionId], foreignColumns: [procedimientoVersiones.id] }),
  desdeFaseRef: foreignKey({ columns: [table.desdeFaseId], foreignColumns: [procedimientoFases.id] }),
  haciaFaseRef: foreignKey({ columns: [table.haciaFaseId], foreignColumns: [procedimientoFases.id] }),
  versionIdx: index('procedimiento_transiciones_version_idx').on(table.procedimientoVersionId),
  desdeIdx: index('procedimiento_transiciones_desde_idx').on(table.desdeFaseId),
  haciaIdx: index('procedimiento_transiciones_hacia_idx').on(table.haciaFaseId),
}));

export type ProcedimientoTransicion = typeof procedimientoTransiciones.$inferSelect;
export type ProcedimientoTransicionInsert = typeof procedimientoTransiciones.$inferInsert;

// ─── Expediente Fases ────────────────────────────────────────

export const expedienteFases = pgTable('expediente_fases', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  faseId: uuid('fase_id').notNull(),
  entradaEn: timestamp('entrada_en', { withTimezone: true }).defaultNow(),
  salidaEn: timestamp('salida_en', { withTimezone: true }),
  metadata: jsonb('metadata'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  faseRef: foreignKey({ columns: [table.faseId], foreignColumns: [procedimientoFases.id] }),
  expedienteIdx: index('expediente_fases_expediente_idx').on(table.expedienteId),
  faseIdx: index('expediente_fases_fase_idx').on(table.faseId),
}));

export type ExpedienteFase = typeof expedienteFases.$inferSelect;
export type ExpedienteFaseInsert = typeof expedienteFases.$inferInsert;

// ─── Outbox Events (Transactional Outbox) ────────────────────

export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  aggregateId: varchar('aggregate_id', { length: 100 }),
  aggregateType: varchar('aggregate_type', { length: 100 }),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  intentos: integer('intentos').default(0),
  maxIntentos: integer('max_intentos').default(3),
  error: text('error'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }),
  workerId: varchar('worker_id', { length: 100 }),
  correlationId: varchar('correlation_id', { length: 64 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  procesadoEn: timestamp('procesado_en', { withTimezone: true }),
}, (table) => ({
  statusIdx: index('outbox_events_status_idx').on(table.status),
  eventTypeIdx: index('outbox_events_event_type_idx').on(table.eventType),
  creadoEnIdx: index('outbox_events_creado_en_idx').on(table.creadoEn),
}));

export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type OutboxEventInsert = typeof outboxEvents.$inferInsert;

// ─── Job Attempts ─────────────────────────────────────────────

export const jobAttempts = pgTable('job_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull(),
  numeroIntento: integer('numero_intento').notNull(),
  estado: varchar('estado', { length: 30 }).notNull().default('running'),
  iniciadoEn: timestamp('iniciado_en', { withTimezone: true }).defaultNow(),
  completadoEn: timestamp('completado_en', { withTimezone: true }),
  error: text('error'),
  errorCode: varchar('error_code', { length: 100 }),
  output: jsonb('output'),
  correlationId: varchar('correlation_id', { length: 64 }),
}, (table) => ({
  jobRef: foreignKey({ columns: [table.jobId], foreignColumns: [jobsSgie.id] }).onDelete('cascade'),
  jobIdx: index('job_attempts_job_idx').on(table.jobId),
}));

export type JobAttempt = typeof jobAttempts.$inferSelect;
export type JobAttemptInsert = typeof jobAttempts.$inferInsert;

// ─── Dead Letter Jobs ─────────────────────────────────────────

export const deadLetterJobs = pgTable('dead_letter_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id'),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  refId: uuid('ref_id'),
  payload: jsonb('payload'),
  motivo: text('motivo'),
  errorFinal: text('error_final'),
  errorCode: varchar('error_code', { length: 100 }),
  intentosTotales: integer('intentos_totales').default(0),
  enviadoADlqEn: timestamp('enviado_a_dlq_en', { withTimezone: true }).defaultNow(),
  correlationId: varchar('correlation_id', { length: 64 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  jobRef: foreignKey({ columns: [table.jobId], foreignColumns: [jobsSgie.id] }).onDelete('set null'),
  tipoIdx: index('dead_letter_jobs_tipo_idx').on(table.tipo),
}));

export type DeadLetterJob = typeof deadLetterJobs.$inferSelect;
export type DeadLetterJobInsert = typeof deadLetterJobs.$inferInsert;

// ─── Comunicaciones Outbox ────────────────────────────────────

export const comunicacionesOutbox = pgTable('comunicaciones_outbox', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id'),
  tipo: varchar('tipo', { length: 50 }).notNull(),
  destinatario: varchar('destinatario', { length: 255 }).notNull(),
  asunto: varchar('asunto', { length: 300 }),
  cuerpo: text('cuerpo'),
  estado: varchar('estado', { length: 30 }).notNull().default('pending'),
  intentos: integer('intentos').default(0),
  maxIntentos: integer('max_intentos').default(3),
  programadoPara: timestamp('programado_para', { withTimezone: true }),
  enviadoEn: timestamp('enviado_en', { withTimezone: true }),
  error: text('error'),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('comunicaciones_outbox_expediente_idx').on(table.expedienteId),
  estadoIdx: index('comunicaciones_outbox_estado_idx').on(table.estado),
}));

export type ComunicacionOutbox = typeof comunicacionesOutbox.$inferSelect;
export type ComunicacionOutboxInsert = typeof comunicacionesOutbox.$inferInsert;

// ─── Comunicaciones Aprobaciones ──────────────────────────────

export const comunicacionesAprobaciones = pgTable('comunicaciones_aprobaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  comunicacionId: uuid('comunicacion_id').notNull(),
  estado: varchar('estado', { length: 30 }).notNull().default('pending'),
  aprobadoPor: uuid('aprobado_por'),
  rechazadoPor: uuid('rechazado_por'),
  comentario: text('comentario'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  resueltoEn: timestamp('resuelto_en', { withTimezone: true }),
}, (table) => ({
  comunicacionRef: foreignKey({ columns: [table.comunicacionId], foreignColumns: [comunicacionesOutbox.id] }).onDelete('cascade'),
  aprobadoPorRef: foreignKey({ columns: [table.aprobadoPor], foreignColumns: [usuarios.id] }),
  rechazadoPorRef: foreignKey({ columns: [table.rechazadoPor], foreignColumns: [usuarios.id] }),
  comunicacionIdx: index('comunicaciones_aprobaciones_comunicacion_idx').on(table.comunicacionId),
}));

export type ComunicacionAprobacion = typeof comunicacionesAprobaciones.$inferSelect;
export type ComunicacionAprobacionInsert = typeof comunicacionesAprobaciones.$inferInsert;

// ─── Webhook Receipts ─────────────────────────────────────────

export const webhookReceipts = pgTable('webhook_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  fuente: varchar('fuente', { length: 100 }).notNull(),
  eventType: varchar('event_type', { length: 100 }),
  payload: jsonb('payload').notNull(),
  estado: varchar('estado', { length: 30 }).notNull().default('received'),
  recibidoEn: timestamp('recibido_en', { withTimezone: true }).defaultNow(),
  procesadoEn: timestamp('procesado_en', { withTimezone: true }),
  error: text('error'),
}, (table) => ({
  fuenteIdx: index('webhook_receipts_fuente_idx').on(table.fuente),
  estadoIdx: index('webhook_receipts_estado_idx').on(table.estado),
}));

export type WebhookReceipt = typeof webhookReceipts.$inferSelect;
export type WebhookReceiptInsert = typeof webhookReceipts.$inferInsert;

// ─── OCR Resultados ───────────────────────────────────────────

export const ocrResultados = pgTable('ocr_resultados', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentoId: uuid('documento_id').notNull(),
  textoExtraido: text('texto_extraido').notNull(),
  metodo: varchar('metodo', { length: 50 }).notNull().default('tesseract'),
  confianza: real('confianza'),
  paginas: integer('paginas'),
  duracionMs: integer('duracion_ms'),
  modeloOcr: varchar('modelo_ocr', { length: 100 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  documentoIdx: index('ocr_resultados_documento_idx').on(table.documentoId),
}));

export type OcrResultado = typeof ocrResultados.$inferSelect;
export type OcrResultadoInsert = typeof ocrResultados.$inferInsert;

// ─── AI Task Routing ──────────────────────────────────────────

export const aiTaskRouting = pgTable('ai_task_routing', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentoId: uuid('documento_id'),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  proveedorAsignado: varchar('proveedor_asignado', { length: 100 }),
  modelo: varchar('modelo', { length: 100 }),
  estado: varchar('estado', { length: 30 }).notNull().default('pending'),
  payload: jsonb('payload'),
  resultado: jsonb('resultado'),
  asignadoEn: timestamp('asignado_en', { withTimezone: true }).defaultNow(),
  completadoEn: timestamp('completado_en', { withTimezone: true }),
  error: text('error'),
  revisadoPor: uuid('revisado_por'),
  revisadoEn: timestamp('revisado_en', { withTimezone: true }),
}, (table) => ({
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  revisadoPorRef: foreignKey({ columns: [table.revisadoPor], foreignColumns: [usuarios.id] }),
  documentoIdx: index('ai_task_routing_documento_idx').on(table.documentoId),
  estadoIdx: index('ai_task_routing_estado_idx').on(table.estado),
}));

export type AiTaskRouting = typeof aiTaskRouting.$inferSelect;
export type AiTaskRoutingInsert = typeof aiTaskRouting.$inferInsert;

// ─── Plantilla Correo Versiones ───────────────────────────────

export const plantillaCorreoVersiones = pgTable('plantilla_correo_versiones', {
  id: uuid('id').primaryKey().defaultRandom(),
  plantillaCorreoId: uuid('plantilla_correo_id').notNull(),
  version: integer('version').notNull(),
  asunto: varchar('asunto', { length: 300 }).notNull(),
  cuerpoHtml: text('cuerpo_html').notNull(),
  variablesPermitidas: text('variables_permitidas').array().default([]),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  plantillaRef: foreignKey({ columns: [table.plantillaCorreoId], foreignColumns: [plantillasCorreo.id] }).onDelete('cascade'),
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  plantillaIdx: index('plantilla_correo_versiones_plantilla_idx').on(table.plantillaCorreoId),
  versionUnique: unique('plantilla_correo_versiones_version_unique').on(table.plantillaCorreoId, table.version),
}));

export type PlantillaCorreoVersion = typeof plantillaCorreoVersiones.$inferSelect;
export type PlantillaCorreoVersionInsert = typeof plantillaCorreoVersiones.$inferInsert;

// ─── Comunicaciones Auditoría ─────────────────────────────────

export const comunicacionesAuditoria = pgTable('comunicaciones_auditoria', {
  id: uuid('id').primaryKey().defaultRandom(),
  comunicacionId: uuid('comunicacion_id'),
  accion: varchar('accion', { length: 100 }).notNull(),
  estadoAnterior: varchar('estado_anterior', { length: 30 }),
  estadoNuevo: varchar('estado_nuevo', { length: 30 }),
  metadata: jsonb('metadata'),
  actorId: uuid('actor_id'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  comunicacionRef: foreignKey({ columns: [table.comunicacionId], foreignColumns: [comunicacionesOutbox.id] }).onDelete('set null'),
  actorRef: foreignKey({ columns: [table.actorId], foreignColumns: [usuarios.id] }),
  comunicacionIdx: index('comunicaciones_auditoria_comunicacion_idx').on(table.comunicacionId),
  accionIdx: index('comunicaciones_auditoria_accion_idx').on(table.accion),
  creadoEnIdx: index('comunicaciones_auditoria_creado_en_idx').on(table.creadoEn),
}));

export type ComunicacionAuditoria = typeof comunicacionesAuditoria.$inferSelect;
export type ComunicacionAuditoriaInsert = typeof comunicacionesAuditoria.$inferInsert;

// ============================================================
// Fase 4A — Registro de migraciones SGIE (0038)
// ============================================================

export const sgieSchemaMigrations = pgTable('sgie_schema_migrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  hash: varchar('hash', { length: 64 }).notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow(),
  appliedBy: varchar('applied_by', { length: 100 }),
  rowsAffected: integer('rows_affected').notNull().default(0),
}, (table) => ({
  nameIdx: index('sgie_schema_migrations_name_idx').on(table.name),
}));

// ============================================================
// Fase 4A — Feature flags y kill switches (0039)
// ============================================================

export const featureFlagScopeEnum = pgEnum('feature_flag_scope', [
  'global', 'organizacion', 'equipo', 'usuario', 'expediente', 'procedimiento',
]);

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagKey: varchar('flag_key', { length: 100 }).notNull(),
  scopeLevel: featureFlagScopeEnum('scope_level').notNull(),
  organizationId: uuid('organization_id'),
  teamId: uuid('team_id'),
  userId: uuid('user_id'),
  caseId: uuid('case_id'),
  procedureId: uuid('procedure_id'),
  enabled: boolean('enabled').notNull().default(false),
  config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  killSwitch: boolean('kill_switch').notNull().default(false),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  motivo: varchar('motivo', { length: 500 }),
  actorId: uuid('actor_id'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  keyIdx: index('feature_flags_key_idx').on(table.flagKey),
  scopeIdx: index('feature_flags_scope_idx').on(table.scopeLevel),
}));

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type FeatureFlagInsert = typeof featureFlags.$inferInsert;

export const featureFlagHistory = pgTable('feature_flag_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagKey: varchar('flag_key', { length: 100 }).notNull(),
  scopeLevel: featureFlagScopeEnum('scope_level').notNull(),
  organizationId: uuid('organization_id'),
  teamId: uuid('team_id'),
  userId: uuid('user_id'),
  caseId: uuid('case_id'),
  procedureId: uuid('procedure_id'),
  previousEnabled: boolean('previous_enabled'),
  newEnabled: boolean('new_enabled').notNull(),
  previousConfig: jsonb('previous_config'),
  newConfig: jsonb('new_config'),
  killSwitch: boolean('kill_switch').notNull().default(false),
  motivo: varchar('motivo', { length: 500 }),
  actorId: uuid('actor_id'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  keyIdx: index('feature_flag_history_key_idx').on(table.flagKey),
  creadoEnIdx: index('feature_flag_history_creado_en_idx').on(table.creadoEn),
}));

// ============================================================
// Fase 4A — Pipeline documental (0040)
// ============================================================

export const documentClassifications = pgTable('document_classifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull(),
  expedienteId: uuid('expediente_id'),
  pipelineVersion: varchar('pipeline_version', { length: 40 }).notNull(),
  tipoPropuesto: varchar('tipo_propuesto', { length: 100 }).notNull(),
  subtipoPropuesto: varchar('subtipo_propuesto', { length: 100 }),
  idioma: varchar('idioma', { length: 20 }),
  esCompuestoProbable: boolean('es_compuesto_probable').notNull().default(false),
  expedienteProbableId: uuid('expediente_probable_id'),
  requisitoProbableId: uuid('requisito_probable_id'),
  confianza: integer('confianza').notNull(),
  alternativas: jsonb('alternativas').notNull().default([]),
  evidencias: jsonb('evidencias').notNull().default([]),
  estrategia: varchar('estrategia', { length: 30 }).notNull(),
  modelo: varchar('modelo', { length: 100 }),
  promptVersion: varchar('prompt_version', { length: 40 }),
  schemaVersion: varchar('schema_version', { length: 40 }).notNull().default('1'),
  estado: varchar('estado', { length: 30 }).notNull().default('propuesta'),
  decisionPor: uuid('decision_por'),
  decisionEn: timestamp('decision_en', { withTimezone: true }),
  decisionMotivo: varchar('decision_motivo', { length: 500 }),
  correccionTipo: varchar('correccion_tipo', { length: 100 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  latenciaMs: integer('latencia_ms'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  docPipelineUnique: uniqueIndex('document_classifications_doc_pipeline_unique').on(table.documentId, table.pipelineVersion),
  docIdx: index('document_classifications_doc_idx').on(table.documentId),
  estadoIdx: index('document_classifications_estado_idx').on(table.estado),
  confianzaIdx: index('document_classifications_confianza_idx').on(table.confianza),
}));

export type DocumentClassification = typeof documentClassifications.$inferSelect;
export type DocumentClassificationInsert = typeof documentClassifications.$inferInsert;

export const documentLinks = pgTable('document_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull(),
  expedienteId: uuid('expediente_id').notNull(),
  requisitoId: uuid('requisito_id'),
  tipo: varchar('tipo', { length: 30 }).notNull().default('principal'),
  origen: varchar('origen', { length: 20 }).notNull().default('auto'),
  confianza: integer('confianza'),
  estrategia: varchar('estrategia', { length: 30 }),
  explicacion: text('explicacion'),
  evidencias: jsonb('evidencias').notNull().default([]),
  estado: varchar('estado', { length: 30 }).notNull().default('propuesta'),
  decisionPor: uuid('decision_por'),
  decisionEn: timestamp('decision_en', { withTimezone: true }),
  decisionMotivo: varchar('decision_motivo', { length: 500 }),
  actorId: uuid('actor_id'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  docIdx: index('document_links_doc_idx').on(table.documentId),
  expIdx: index('document_links_exp_idx').on(table.expedienteId),
  estadoIdx: index('document_links_estado_idx').on(table.estado),
}));

export type DocumentLink = typeof documentLinks.$inferSelect;
export type DocumentLinkInsert = typeof documentLinks.$inferInsert;

export const extractionSchemaVersions = pgTable('extraction_schema_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tipoDocumento: varchar('tipo_documento', { length: 100 }).notNull(),
  version: integer('version').notNull(),
  campos: jsonb('campos').notNull().default([]),
  activo: boolean('activo').notNull().default(true),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tipoIdx: index('extraction_schema_versions_tipo_idx').on(table.tipoDocumento),
}));

export type ExtractionSchemaVersion = typeof extractionSchemaVersions.$inferSelect;
export type ExtractionSchemaVersionInsert = typeof extractionSchemaVersions.$inferInsert;

export const documentExtractions = pgTable('document_extractions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull(),
  expedienteId: uuid('expediente_id').notNull(),
  schemaVersionId: uuid('schema_version_id').notNull(),
  pipelineVersion: varchar('pipeline_version', { length: 40 }).notNull(),
  campos: jsonb('campos').notNull().default([]),
  estrategia: varchar('estrategia', { length: 30 }).notNull(),
  modelo: varchar('modelo', { length: 100 }),
  promptVersion: varchar('prompt_version', { length: 40 }),
  confianza: integer('confianza').notNull(),
  estado: varchar('estado', { length: 30 }).notNull().default('extraido'),
  validadoPor: uuid('validado_por'),
  validadoEn: timestamp('validado_en', { withTimezone: true }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  latenciaMs: integer('latencia_ms'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  docPipelineUnique: uniqueIndex('document_extractions_doc_pipeline_unique').on(table.documentId, table.pipelineVersion),
  docIdx: index('document_extractions_doc_idx').on(table.documentId),
  expIdx: index('document_extractions_exp_idx').on(table.expedienteId),
  estadoIdx: index('document_extractions_estado_idx').on(table.estado),
}));

export type DocumentExtraction = typeof documentExtractions.$inferSelect;
export type DocumentExtractionInsert = typeof documentExtractions.$inferInsert;

export const documentContradictions = pgTable('document_contradictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  tipo: varchar('tipo', { length: 60 }).notNull(),
  hechoA: jsonb('hecho_a').notNull(),
  hechoB: jsonb('hecho_b').notNull(),
  documentAId: uuid('document_a_id'),
  documentBId: uuid('document_b_id'),
  paginaA: integer('pagina_a'),
  paginaB: integer('pagina_b'),
  fragmentoA: text('fragmento_a'),
  fragmentoB: text('fragmento_b'),
  severidad: varchar('severidad', { length: 20 }).notNull().default('advertencia'),
  confianza: integer('confianza').notNull().default(100),
  bloqueante: boolean('bloqueante').notNull().default(false),
  explicacion: text('explicacion').notNull(),
  origen: varchar('origen', { length: 20 }).notNull().default('determinista'),
  reglaId: varchar('regla_id', { length: 100 }),
  modeloIa: varchar('modelo_ia', { length: 100 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  estado: varchar('estado', { length: 30 }).notNull().default('propuesta'),
  resolucionPor: uuid('resolucion_por'),
  resolucionEn: timestamp('resolucion_en', { withTimezone: true }),
  resolucionMotivo: varchar('resolucion_motivo', { length: 500 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expIdx: index('document_contradictions_exp_idx').on(table.expedienteId),
  estadoIdx: index('document_contradictions_estado_idx').on(table.estado),
  severidadIdx: index('document_contradictions_severidad_idx').on(table.severidad),
}));

export type DocumentContradiction = typeof documentContradictions.$inferSelect;
export type DocumentContradictionInsert = typeof documentContradictions.$inferInsert;

// ============================================================
// Fase 4A — Resúmenes incrementales y NextActions (0041)
// ============================================================

export const caseSummaryCheckpoints = pgTable('case_summary_checkpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  // UNIQUE parcial (solo vigentes) vía índice en migración 0043; permite
  // histórico de checkpoints invalidados + 1 vigente por expediente.
  expedienteId: uuid('expediente_id').notNull(),
  sourceHash: varchar('source_hash', { length: 64 }).notNull(),
  watermark: timestamp('watermark', { withTimezone: true }).notNull().defaultNow(),
  cambiosIncluidos: integer('cambios_incluidos').notNull().default(0),
  cambiosDetalle: jsonb('cambios_detalle').notNull().default([]),
  modelo: varchar('modelo', { length: 100 }),
  pipelineVersion: varchar('pipeline_version', { length: 40 }).notNull().default('1'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  latenciaMs: integer('latencia_ms'),
  estado: varchar('estado', { length: 20 }).notNull().default('vigente'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expIdx: index('case_summary_checkpoints_exp_idx').on(table.expedienteId),
  estadoIdx: index('case_summary_checkpoints_estado_idx').on(table.estado),
}));

export type CaseSummaryCheckpoint = typeof caseSummaryCheckpoints.$inferSelect;
export type CaseSummaryCheckpointInsert = typeof caseSummaryCheckpoints.$inferInsert;

export const caseSummaryHistory = pgTable('case_summary_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  checkpointId: uuid('checkpoint_id'),
  sourceHash: varchar('source_hash', { length: 64 }).notNull(),
  watermark: timestamp('watermark', { withTimezone: true }).notNull(),
  cambiosIncluidos: integer('cambios_incluidos').notNull().default(0),
  resumen: text('resumen').notNull(),
  diferenciaAnterior: text('diferencia_anterior'),
  tipoContenido: varchar('tipo_contenido', { length: 20 }).notNull().default('mixto'),
  modelo: varchar('modelo', { length: 100 }),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  latenciaMs: integer('latencia_ms'),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expIdx: index('case_summary_history_exp_idx').on(table.expedienteId),
  creadoEnIdx: index('case_summary_history_creado_en_idx').on(table.creadoEn),
}));

export const caseNextActions = pgTable('case_next_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  actionKey: varchar('action_key', { length: 120 }).notNull(),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  descripcion: text('descripcion'),
  razon: text('razon').notNull(),
  prioridad: integer('prioridad').notNull().default(3),
  evidencias: jsonb('evidencias').notNull().default([]),
  bloqueos: jsonb('bloqueos').notNull().default([]),
  reglaId: varchar('regla_id', { length: 120 }),
  estrategia: varchar('estrategia', { length: 30 }).notNull().default('determinista'),
  modeloIa: varchar('modelo_ia', { length: 100 }),
  confianza: integer('confianza'),
  esPrincipal: boolean('es_principal').notNull().default(false),
  expiraEn: timestamp('expira_en', { withTimezone: true }),
  requiereConfirmacionHumana: boolean('requiere_confirmacion_humana').notNull().default(true),
  estado: varchar('estado', { length: 30 }).notNull().default('propuesta'),
  decisionPor: uuid('decision_por'),
  decisionEn: timestamp('decision_en', { withTimezone: true }),
  decisionMotivo: varchar('decision_motivo', { length: 500 }),
  idempotencyKey: varchar('idempotency_key', { length: 120 }),
  sourceHash: varchar('source_hash', { length: 64 }).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expIdx: index('case_next_actions_exp_idx').on(table.expedienteId),
  estadoIdx: index('case_next_actions_estado_idx').on(table.estado),
  prioridadIdx: index('case_next_actions_prioridad_idx').on(table.prioridad),
}));

export type CaseNextAction = typeof caseNextActions.$inferSelect;
export type CaseNextActionInsert = typeof caseNextActions.$inferInsert;

export const aiPipelineRuns = pgTable('ai_pipeline_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  correlationId: varchar('correlation_id', { length: 64 }).notNull(),
  expedienteId: uuid('expediente_id'),
  documentId: uuid('document_id'),
  taskType: varchar('task_type', { length: 40 }).notNull(),
  estrategia: varchar('estrategia', { length: 30 }).notNull(),
  modelo: varchar('modelo', { length: 100 }),
  promptVersion: varchar('prompt_version', { length: 40 }),
  pipelineVersion: varchar('pipeline_version', { length: 40 }).notNull().default('1'),
  estado: varchar('estado', { length: 30 }).notNull().default('pending'),
  resultSummary: text('result_summary'),
  confianza: integer('confianza'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  latenciaMs: integer('latencia_ms'),
  costeEstimadoUsd: real('coste_estimado_usd'),
  error: text('error'),
  refTable: varchar('ref_table', { length: 60 }),
  refId: uuid('ref_id'),
  actorId: uuid('actor_id'),
  scopeResuelto: jsonb('scope_resuelto'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  corrIdx: index('ai_pipeline_runs_corr_idx').on(table.correlationId),
  taskIdx: index('ai_pipeline_runs_task_idx').on(table.taskType),
  estadoIdx: index('ai_pipeline_runs_estado_idx').on(table.estado),
  creadoEnIdx: index('ai_pipeline_runs_creado_en_idx').on(table.creadoEn),
}));

export type AiPipelineRun = typeof aiPipelineRuns.$inferSelect;
export type AiPipelineRunInsert = typeof aiPipelineRuns.$inferInsert;

// ────────────────────────────────────────────────────────────────────────────
// Fase 4B-1 — P2-07: Aprobación documental en bloque.
//
// Permite que un abogado autorizado apruebe varios documentos de un expediente
// en una operación segura, explicable, idempotente, auditable y parcialmente
// reversible. El lote NO es "todo o nada": cada documento se valida y ejecuta
// de forma individual; un documento inválido no impide aprobar los válidos.
//
// - document_bulk_approvals: cabecera del lote (preview hash, idempotency key,
//   estado, resultados agregados, correlation ID).
// - document_bulk_approval_items: resultados individuales por documento
//   (versión snapshot para control optimista, resultado, motivo).
// ────────────────────────────────────────────────────────────────────────────

// Estado del lote completo.
export const bulkApprovalEstadoEnumValues = [
  'pendiente',   // preview generada, sin confirmar.
  'confirmada',  // todos los documentos aprobados o ya aprobados.
  'parcial',     // algunos aprobados, otros rechazados por validación.
  'revertida',   // al menos un documento fue revertido tras confirmar.
  'fallida',     // error técnico; ningún documento aprobado.
  'expirada',    // preview caducó sin confirmar.
] as const;
export type BulkApprovalEstado = (typeof bulkApprovalEstadoEnumValues)[number];

// Resultado por documento individual.
export const bulkApprovalItemResultadoEnumValues = [
  'pendiente',
  'aprobado',
  'ya_aprobado',
  'rechazado_validacion',
  'conflicto_version',
  'no_autorizado',
  'no_encontrado',
  'bloque_contradiccion',
  'procesamiento_pendiente',
  'requiere_revision_humana',
  'error_tecnico',
  'revertido',
] as const;
export type BulkApprovalItemResultado = (typeof bulkApprovalItemResultadoEnumValues)[number];

export const documentBulkApprovals = pgTable('document_bulk_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
  previewHash: varchar('preview_hash', { length: 64 }).notNull(),
  estado: varchar('estado', { length: 30 }).notNull().default('pendiente'),
  previewCaducidad: timestamp('preview_caducidad', { withTimezone: true }).notNull(),
  confirmadaEn: timestamp('confirmada_en', { withTimezone: true }),
  correlationId: varchar('correlation_id', { length: 64 }),
  motivo: text('motivo'),
  total: integer('total').notNull().default(0),
  aprobados: integer('aprobados').notNull().default(0),
  yaAprobados: integer('ya_aprobados').notNull().default(0),
  rechazados: integer('rechazados').notNull().default(0),
  resultados: jsonb('resultados').notNull().default({}),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  actorRef: foreignKey({ columns: [table.actorId], foreignColumns: [usuarios.id] }),
  // Idempotencia: (expediente, idempotency_key) único.
  expedienteIdemUnique: uniqueIndex('document_bulk_approvals_exp_idem_unique').on(table.expedienteId, table.idempotencyKey),
  // Una preview activa por expediente (pendiente/confirmada/parcial).
  expedientePreviewActiveUnique: uniqueIndex('document_bulk_approvals_exp_preview_active_unique')
    .on(table.expedienteId, table.previewHash)
    .where(sql`estado IN ('preview_pending', 'preview_confirmed', 'preview_partial')`),
  actorCreadoIdx: index('document_bulk_approvals_actor_creado_idx').on(table.actorId, table.creadoEn),
  expedienteEstadoIdx: index('document_bulk_approvals_exp_estado_idx').on(table.expedienteId, table.estado),
}));

export type DocumentBulkApproval = typeof documentBulkApprovals.$inferSelect;
export type DocumentBulkApprovalInsert = typeof documentBulkApprovals.$inferInsert;

export const documentBulkApprovalItems = pgTable('document_bulk_approval_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bulkApprovalId: uuid('bulk_approval_id').notNull(),
  documentId: uuid('document_id').notNull(),
  expedienteId: uuid('expediente_id').notNull(),
  versionSnapshot: integer('version_snapshot').notNull(),
  tipoDocumento: varchar('tipo_documento', { length: 100 }),
  requisitoId: uuid('requisito_id'),
  estadoPrevio: varchar('estado_previo', { length: 30 }),
  resultado: varchar('resultado', { length: 30 }).notNull().default('pendiente'),
  motivo: text('motivo'),
  decididoEn: timestamp('decidido_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  bulkApprovalRef: foreignKey({ columns: [table.bulkApprovalId], foreignColumns: [documentBulkApprovals.id] }).onDelete('cascade'),
  documentRef: foreignKey({ columns: [table.documentId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  // Un documento una sola vez por lote.
  bulkDocUnique: uniqueIndex('document_bulk_approval_items_bulk_doc_unique').on(table.bulkApprovalId, table.documentId),
  docIdx: index('document_bulk_approval_items_doc_idx').on(table.documentId),
  bulkResultadoIdx: index('document_bulk_approval_items_bulk_resultado_idx').on(table.bulkApprovalId, table.resultado),
}));

export type DocumentBulkApprovalItem = typeof documentBulkApprovalItems.$inferSelect;
export type DocumentBulkApprovalItemInsert = typeof documentBulkApprovalItems.$inferInsert;

export const alertasSla = pgTable('alertas_sla', {
  id: uuid('id').primaryKey().defaultRandom(),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  severidad: varchar('severidad', { length: 30 }).notNull().default('info'),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  mensaje: text('mensaje'),
  expedienteId: uuid('expediente_id'),
  propietarioId: uuid('propietario_id'),
  vencimiento: timestamp('vencimiento', { withTimezone: true }),
  estado: varchar('estado', { length: 30 }).notNull().default('activa'),
  resueltaPor: uuid('resuelta_por'),
  resueltaEn: timestamp('resuelta_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  propietarioRef: foreignKey({ columns: [table.propietarioId], foreignColumns: [usuarios.id] }),
  resueltaPorRef: foreignKey({ columns: [table.resueltaPor], foreignColumns: [usuarios.id] }),
  expedienteIdx: index('alertas_sla_expediente_idx').on(table.expedienteId),
  propietarioIdx: index('alertas_sla_propietario_idx').on(table.propietarioId),
  estadoIdx: index('alertas_sla_estado_idx').on(table.estado),
  severidadIdx: index('alertas_sla_severidad_idx').on(table.severidad),
  vencimientoIdx: index('alertas_sla_vencimiento_idx').on(table.vencimiento),
}));

export const inboundMessages = pgTable('inbound_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: varchar('message_id', { length: 255 }).notNull().unique(),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  toEmail: varchar('to_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  bodyText: text('body_text'),
  bodyHtml: text('body_html'),
  expedienteId: uuid('expediente_id'),
  requisitoId: uuid('requisito_id'),
  documentoId: uuid('documento_id'),
  estado: varchar('estado', { length: 30 }).notNull().default('recibido'),
  procesadoEn: timestamp('procesado_en', { withTimezone: true }),
  error: text('error'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('set null'),
  requisitoRef: foreignKey({ columns: [table.requisitoId], foreignColumns: [requisitosExpediente.id] }).onDelete('set null'),
  documentoRef: foreignKey({ columns: [table.documentoId], foreignColumns: [documentosExpediente.id] }).onDelete('set null'),
  messageIdIdx: index('inbound_messages_message_id_idx').on(table.messageId),
  expedienteIdx: index('inbound_messages_expediente_idx').on(table.expedienteId),
  estadoIdx: index('inbound_messages_estado_idx').on(table.estado),
  fromIdx: index('inbound_messages_from_idx').on(table.fromEmail),
}));

export const communicationRules = pgTable('communication_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  disparador: varchar('disparador', { length: 100 }).notNull(),
  condiciones: jsonb('condiciones').default({}),
  destinatario: varchar('destinatario', { length: 255 }).notNull(),
  plantillaSlug: varchar('plantilla_slug', { length: 100 }),
  retrasoMinutos: integer('retraso_minutos').default(0),
  horarioInicio: time('horario_inicio'),
  horarioFin: time('horario_fin'),
  cadenciaHoras: integer('cadencia_horas'),
  maximoEnvio: integer('maximo_envio').default(1),
  cancelacionSi: jsonb('cancelacion_si').default([]),
  sensibilidad: varchar('sensibilidad', { length: 30 }).default('normal'),
  requiereAprobacion: boolean('requiere_aprobacion').notNull().default(false),
  idioma: varchar('idioma', { length: 10 }).default('es'),
  escalado: jsonb('escalado').default([]),
  estado: varchar('estado', { length: 30 }).notNull().default('borrador'),
  version: integer('version').notNull().default(1),
  creadoPor: uuid('creado_por'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }),
}, (table) => ({
  creadoPorRef: foreignKey({ columns: [table.creadoPor], foreignColumns: [usuarios.id] }),
  disparadorIdx: index('communication_rules_disparador_idx').on(table.disparador),
  estadoIdx: index('communication_rules_estado_idx').on(table.estado),
  creadoPorIdx: index('communication_rules_creado_por_idx').on(table.creadoPor),
}));

export const workflowSnapshots = pgTable('workflow_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  procedimientoVersionId: uuid('procedimiento_version_id'),
  snapshot: jsonb('snapshot').notNull().default({}),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  versionRef: foreignKey({ columns: [table.procedimientoVersionId], foreignColumns: [procedimientoVersiones.id] }).onDelete('set null'),
  expedienteIdx: index('workflow_snapshots_expediente_idx').on(table.expedienteId),
  versionIdx: index('workflow_snapshots_version_idx').on(table.procedimientoVersionId),
}));

export const userActivityLog = pgTable('user_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id'),
  tipo: varchar('tipo', { length: 100 }).notNull(),
  recurso: varchar('recurso', { length: 100 }),
  recursoId: varchar('recurso_id', { length: 100 }),
  metadata: jsonb('metadata').default({}),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usuarioRef: foreignKey({ columns: [table.usuarioId], foreignColumns: [usuarios.id] }).onDelete('set null'),
  usuarioIdx: index('user_activity_log_usuario_idx').on(table.usuarioId),
  tipoIdx: index('user_activity_log_tipo_idx').on(table.tipo),
  creadoEnIdx: index('user_activity_log_creado_en_idx').on(table.creadoEn),
   recursoIdx: index('user_activity_log_recurso_idx').on(table.recurso, table.recursoId),
}));

// ─── P2-08: Paquetes preparados para firma ─────────────────────────────────

export const signaturePackages = pgTable('signature_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  expedienteId: uuid('expediente_id').notNull(),
  organizationId: uuid('organization_id'),
  actorId: uuid('actor_id').notNull(),
  estado: varchar('estado', { length: 30 }).notNull().default('draft'),
  version: integer('version').notNull().default(1),
  proposito: varchar('proposito', { length: 100 }),
  titulo: varchar('titulo', { length: 300 }).notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 120 }).notNull(),
  previewHash: varchar('preview_hash', { length: 64 }),
  manifestHash: varchar('manifest_hash', { length: 64 }),
  manifestSchemaVersion: varchar('manifest_schema_version', { length: 20 }).notNull().default('1.0'),
  hashAlgorithm: varchar('hash_algorithm', { length: 20 }).notNull().default('sha256'),
  manifestJson: jsonb('manifest_json'),
  documentOrder: jsonb('document_order').notNull().default(sql`'[]'`),
  readinessRunId: uuid('readiness_run_id'),
  readinessException: boolean('readiness_exception').notNull().default(false),
  readinessExceptionMotivo: text('readiness_exception_motivo'),
  congeladoEn: timestamp('congelado_en', { withTimezone: true }),
  expiracionEn: timestamp('expiracion_en', { withTimezone: true }),
  canceladoMotivo: text('cancelado_motivo'),
  correlationId: varchar('correlation_id', { length: 64 }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  expedienteRef: foreignKey({ columns: [table.expedienteId], foreignColumns: [expedientes.id] }).onDelete('cascade'),
  actorRef: foreignKey({ columns: [table.actorId], foreignColumns: [usuarios.id] }),
  expIdemUnique: uniqueIndex('signature_packages_exp_idem_unique').on(table.expedienteId, table.idempotencyKey),
  expActiveUnique: uniqueIndex('signature_packages_exp_active_unique').on(table.expedienteId).where(sql`estado IN ('ready', 'locked')`),
  expEstadoIdx: index('signature_packages_exp_estado_idx').on(table.expedienteId, table.estado),
  actorIdx: index('signature_packages_actor_idx').on(table.actorId),
}));

export type SignaturePackage = typeof signaturePackages.$inferSelect;
export type SignaturePackageInsert = typeof signaturePackages.$inferInsert;

export const signaturePackageItems = pgTable('signature_package_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull(),
  documentId: uuid('document_id').notNull(),
  expedienteId: uuid('expediente_id').notNull(),
  versionFrozen: integer('version_frozen').notNull(),
  nombreNormalizado: varchar('nombre_normalizado', { length: 500 }).notNull(),
  mime: varchar('mime', { length: 200 }),
  tamanoBytes: integer('tamano_bytes'),
  hashSha256: varchar('hash_sha256', { length: 64 }).notNull(),
  aprobadoPor: uuid('aprobado_por'),
  aprobadoEn: timestamp('aprobado_en', { withTimezone: true }),
  orden: integer('orden').notNull().default(0),
  requisitoId: uuid('requisito_id'),
  tipoDocumento: varchar('tipo_documento', { length: 100 }),
  metadataSnapshot: jsonb('metadata_snapshot'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  packageRef: foreignKey({ columns: [table.packageId], foreignColumns: [signaturePackages.id] }).onDelete('cascade'),
  documentRef: foreignKey({ columns: [table.documentId], foreignColumns: [documentosExpediente.id] }).onDelete('cascade'),
  pkgDocVerUnique: uniqueIndex('signature_package_items_pkg_doc_ver_unique').on(table.packageId, table.documentId, table.versionFrozen),
  pkgIdx: index('signature_package_items_pkg_idx').on(table.packageId),
  docIdx: index('signature_package_items_doc_idx').on(table.documentId),
}));

export type SignaturePackageItem = typeof signaturePackageItems.$inferSelect;
export type SignaturePackageItemInsert = typeof signaturePackageItems.$inferInsert;

export const signaturePackageSigners = pgTable('signature_package_signers', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull(),
  nombre: varchar('nombre', { length: 300 }).notNull(),
  email: varchar('email', { length: 255 }),
  identificador: varchar('identificador', { length: 100 }),
  rolDocumento: varchar('rol_documento', { length: 100 }).notNull(),
  orden: integer('orden').notNull().default(0),
  obligatorio: boolean('obligatorio').notNull().default(true),
  metodoFuturo: varchar('metodo_futuro', { length: 50 }),
  estadoValidacion: varchar('estado_validacion', { length: 30 }).notNull().default('pendiente'),
  fuente: varchar('fuente', { length: 30 }).notNull().default('manual'),
  consentimiento: text('consentimiento'),
  validadoEn: timestamp('validado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  packageRef: foreignKey({ columns: [table.packageId], foreignColumns: [signaturePackages.id] }).onDelete('cascade'),
  pkgNameRolUnique: uniqueIndex('signature_package_signers_pkg_name_rol_unique').on(table.packageId, table.nombre, table.rolDocumento),
  pkgIdx: index('signature_package_signers_pkg_idx').on(table.packageId),
}));

export type SignaturePackageSigner = typeof signaturePackageSigners.$inferSelect;
export type SignaturePackageSignerInsert = typeof signaturePackageSigners.$inferInsert;

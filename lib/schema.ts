import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, varchar, foreignKey, unique, serial, jsonb, index } from 'drizzle-orm/pg-core';

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
  rol: varchar('rol', { length: 50 }).notNull().default('abogado'),
  bufeteId: uuid('bufete_id'),
  active: boolean('active').default(true),
  mustChangePassword: boolean('must_change_password').default(false),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  bufeteRef: foreignKey({ columns: [table.bufeteId], foreignColumns: [bufetes.id] }),
  activeIdx: index('usuarios_active_idx').on(table.active),
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

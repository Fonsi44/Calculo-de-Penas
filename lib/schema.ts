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
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  creadoEnIdx: index('solicitudes_consulta_creado_en_idx').on(table.creadoEn),
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

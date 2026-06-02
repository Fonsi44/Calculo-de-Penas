import { pgTable, uuid, text, integer, boolean, timestamp, varchar, foreignKey, unique, serial, jsonb } from 'drizzle-orm/pg-core';

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
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  bufeteRef: foreignKey({ columns: [table.bufeteId], foreignColumns: [bufetes.id] }),
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
}));

export const calculos = pgTable('calculos', {
  id: uuid('id').primaryKey().defaultRandom(),
  casoId: uuid('caso_id').notNull(),
  config: jsonb('config').notNull(),
  resultado: jsonb('resultado').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow(),
}, (table) => ({
  casoRef: foreignKey({ columns: [table.casoId], foreignColumns: [casos.id] }),
}));

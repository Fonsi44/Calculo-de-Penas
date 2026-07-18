#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');
const sql = neon(process.env.DATABASE_URL);
const mode = process.argv.includes('--post') ? 'post' : 'pre';

async function count(table) {
  const exists = await sql`select to_regclass(${`public.${table}`}) is not null as exists`;
  if (!exists[0]?.exists) return null;
  const queries = {
    usuarios: () => sql`select count(*)::int as count from usuarios`,
    eventos_agenda: () => sql`select count(*)::int as count from eventos_agenda`,
    expedientes: () => sql`select count(*)::int as count from expedientes`,
    expediente_asignaciones: () => sql`select count(*)::int as count from expediente_asignaciones`,
    invitaciones: () => sql`select count(*)::int as count from invitaciones`,
    equipos: () => sql`select count(*)::int as count from equipos`,
    equipos_miembros: () => sql`select count(*)::int as count from equipos_miembros`,
    usuarios_capacidades: () => sql`select count(*)::int as count from usuarios_capacidades`,
  };
  const rows = await queries[table]();
  return rows[0]?.count ?? null;
}

const counts = {};
for (const table of [
  'usuarios',
  'eventos_agenda',
  'expedientes',
  'expediente_asignaciones',
  'invitaciones',
  'equipos',
  'equipos_miembros',
  'usuarios_capacidades',
]) {
  counts[table] = await count(table);
}

const result = { mode, counts };
if (mode === 'post') {
  const columns = await sql`
    select table_name, column_name, is_nullable, column_default
    from information_schema.columns
    where (table_name = 'eventos_agenda' and column_name in
      ('propietario_id', 'creado_por', 'inicio', 'fin', 'todo_el_dia', 'zona_horaria', 'visibilidad'))
      or (table_name = 'invitaciones' and column_name in
      ('token_hash', 'expira_en', 'estado', 'acceso_sgie', 'capacidades'))
    order by table_name, column_name
  `;
  const indexes = await sql`
    select tablename, indexname
    from pg_indexes
    where tablename in ('invitaciones', 'usuarios_capacidades', 'equipos_miembros', 'eventos_agenda')
    order by tablename, indexname
  `;
  const constraints = await sql`
    select tc.table_name, tc.constraint_name, tc.constraint_type
    from information_schema.table_constraints tc
    where tc.table_name in ('invitaciones', 'usuarios_capacidades', 'equipos_miembros', 'eventos_agenda')
    order by tc.table_name, tc.constraint_name
  `;
  const hasPhase1Columns = columns.some((column) =>
    column.table_name === 'eventos_agenda' && column.column_name === 'propietario_id');
  const invalid = hasPhase1Columns
    ? await sql`
        select
          (select count(*)::int from eventos_agenda where propietario_id is null) as eventos_sin_propietario,
          (select count(*)::int from eventos_agenda where creado_por is null) as eventos_sin_creador,
          (select count(*)::int from eventos_agenda where inicio is null) as eventos_sin_inicio
      `
    : [{ eventos_sin_propietario: null, eventos_sin_creador: null, eventos_sin_inicio: null }];
  const migrationTable = await sql`
    select to_regclass('drizzle.__drizzle_migrations') is not null as exists
  `;
  const migrations = migrationTable[0]?.exists
    ? await sql`
        select id, created_at
        from drizzle.__drizzle_migrations
        order by created_at desc
        limit 5
      `
    : [];
  Object.assign(result, { columns, indexes, constraints, invalid: invalid[0], migrations });
}

console.log(JSON.stringify(result));

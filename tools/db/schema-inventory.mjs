#!/usr/bin/env node
/**
 * PostgreSQL semantic schema inventory.
 *
 * Library:
 *   collectSchemaInventory(sql)
 *   compareInventories(canonical, clone)
 *
 * CLI:
 *   node tools/db/schema-inventory.mjs <canonical-url> <clone-url>
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = resolve(ROOT, '.local');
const DOC = resolve(ROOT, 'docs/operations/production-schema-divergence-pr20.md');
const USER_SCHEMAS = `n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname !~ '^pg_toast'`;

function normalized(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeRows(rows) {
  return rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map(normalized) : normalized(value),
    ]),
  ));
}

async function rows(sql, text) {
  return normalizeRows((await sql.query(text)).rows);
}

export async function collectSchemaInventory(sql) {
  const [
    tables, columns, indexes, constraints, enums, domains, compositeTypes,
    sequences, extensions, routines, triggers, views, materializedViews, policies,
  ] = await Promise.all([
    rows(sql, `
      SELECT n.nspname AS schema, c.relname AS name,
        CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned_table'
          WHEN 'f' THEN 'foreign_table' END AS type,
        c.relpersistence AS persistence, c.relispartition AS is_partition,
        pg_get_partkeydef(c.oid) AS partition_key,
        pn.nspname AS parent_schema, pc.relname AS parent_table,
        c.relrowsecurity AS rls, c.relforcerowsecurity AS rls_forced
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      LEFT JOIN pg_inherits i ON i.inhrelid=c.oid
      LEFT JOIN pg_class pc ON pc.oid=i.inhparent
      LEFT JOIN pg_namespace pn ON pn.oid=pc.relnamespace
      WHERE ${USER_SCHEMAS} AND c.relkind IN ('r','p','f')
      ORDER BY n.nspname,c.relname`),
    rows(sql, `
      SELECT n.nspname AS schema, c.relname AS table, a.attnum AS position,
        a.attname AS name, format_type(a.atttypid,a.atttypmod) AS full_type,
        tn.nspname AS type_schema, t.typname AS internal_type,
        information_schema._pg_char_max_length(a.atttypid,a.atttypmod) AS length,
        information_schema._pg_numeric_precision(a.atttypid,a.atttypmod) AS precision,
        information_schema._pg_numeric_scale(a.atttypid,a.atttypmod) AS scale,
        NOT a.attnotnull AS nullable, pg_get_expr(d.adbin,d.adrelid) AS default,
        a.attidentity AS identity, a.attgenerated AS generated,
        cn.nspname AS collation_schema, co.collname AS collation
      FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_type t ON t.oid=a.atttypid JOIN pg_namespace tn ON tn.oid=t.typnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      LEFT JOIN pg_collation co ON co.oid=a.attcollation
      LEFT JOIN pg_namespace cn ON cn.oid=co.collnamespace
      WHERE ${USER_SCHEMAS} AND c.relkind IN ('r','p','f')
        AND a.attnum>0 AND NOT a.attisdropped
      ORDER BY n.nspname,c.relname,a.attnum`),
    rows(sql, `
      SELECT n.nspname AS schema, t.relname AS table, i.relname AS name,
        x.indisunique AS unique, x.indisprimary AS primary,
        am.amname AS method,
        ARRAY(SELECT pg_get_indexdef(x.indexrelid,k,TRUE)
          FROM generate_series(1,x.indnkeyatts) k ORDER BY k) AS keys,
        ARRAY(SELECT a.attname FROM unnest(x.indkey)
          WITH ORDINALITY AS u(attnum,ord)
          JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=u.attnum
          WHERE u.ord<=x.indnkeyatts ORDER BY u.ord) AS columns,
        ARRAY(SELECT pg_get_indexdef(x.indexrelid,k,TRUE)
          FROM generate_series(x.indnkeyatts+1,x.indnatts) k ORDER BY k) AS include,
        pg_get_expr(x.indexprs,x.indrelid) AS expressions,
        ARRAY(SELECT opc.opcname FROM unnest(x.indclass)
          WITH ORDINALITY AS u(opcoid,ord) JOIN pg_opclass opc ON opc.oid=u.opcoid
          ORDER BY u.ord) AS operator_classes,
        x.indoption::text AS options, pg_get_expr(x.indpred,x.indrelid) AS predicate,
        pg_get_indexdef(x.indexrelid) AS definition
      FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid
      JOIN pg_class t ON t.oid=x.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
      JOIN pg_am am ON am.oid=i.relam
      WHERE ${USER_SCHEMAS}
      ORDER BY n.nspname,t.relname,i.relname`),
    rows(sql, `
      SELECT n.nspname AS schema, c.relname AS table, con.conname AS name,
        CASE con.contype WHEN 'p' THEN 'PRIMARY_KEY' WHEN 'u' THEN 'UNIQUE'
          WHEN 'f' THEN 'FOREIGN_KEY' WHEN 'c' THEN 'CHECK'
          WHEN 'x' THEN 'EXCLUSION' END AS type,
        pg_get_constraintdef(con.oid,TRUE) AS definition,
        ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY u(attnum,ord)
          JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=u.attnum
          ORDER BY u.ord) AS columns,
        rn.nspname AS referenced_schema, rc.relname AS referenced_table,
        ARRAY(SELECT a.attname FROM unnest(con.confkey) WITH ORDINALITY u(attnum,ord)
          JOIN pg_attribute a ON a.attrelid=con.confrelid AND a.attnum=u.attnum
          ORDER BY u.ord) AS referenced_columns,
        CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
          WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete,
        CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
          WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_update,
        con.condeferrable AS deferrable, con.condeferred AS initially_deferred,
        con.convalidated AS validated
      FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      LEFT JOIN pg_class rc ON rc.oid=con.confrelid
      LEFT JOIN pg_namespace rn ON rn.oid=rc.relnamespace
      WHERE ${USER_SCHEMAS} AND con.contype IN ('p','u','f','c','x')
      ORDER BY n.nspname,c.relname,con.conname`),
    rows(sql, `
      SELECT n.nspname AS schema,t.typname AS name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      JOIN pg_enum e ON e.enumtypid=t.oid WHERE ${USER_SCHEMAS}
      GROUP BY n.nspname,t.typname ORDER BY n.nspname,t.typname`),
    rows(sql, `
      SELECT n.nspname AS schema,t.typname AS name,format_type(t.typbasetype,t.typtypmod) AS base_type,
        t.typnotnull AS not_null,pg_get_expr(t.typdefaultbin,0) AS default,
        cn.nspname AS collation_schema,c.collname AS collation
      FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      LEFT JOIN pg_collation c ON c.oid=t.typcollation
      LEFT JOIN pg_namespace cn ON cn.oid=c.collnamespace
      WHERE ${USER_SCHEMAS} AND t.typtype='d' ORDER BY n.nspname,t.typname`),
    rows(sql, `
      SELECT n.nspname AS schema,t.typname AS name,
        jsonb_agg(jsonb_build_object('position',a.attnum,'name',a.attname,
          'type',format_type(a.atttypid,a.atttypmod)) ORDER BY a.attnum) AS attributes
      FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      JOIN pg_class c ON c.oid=t.typrelid JOIN pg_attribute a ON a.attrelid=c.oid
      WHERE ${USER_SCHEMAS} AND t.typtype='c' AND c.relkind='c'
        AND a.attnum>0 AND NOT a.attisdropped
      GROUP BY n.nspname,t.typname ORDER BY n.nspname,t.typname`),
    rows(sql, `
      SELECT n.nspname AS schema,c.relname AS name,format_type(s.seqtypid,NULL) AS data_type,
        s.seqstart AS start,s.seqincrement AS increment,s.seqmin AS min,s.seqmax AS max,
        s.seqcache AS cache,s.seqcycle AS cycle,
        tn.nspname AS owned_by_schema,tc.relname AS owned_by_table,a.attname AS owned_by_column
      FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      LEFT JOIN pg_depend d ON d.objid=c.oid AND d.deptype IN ('a','i')
      LEFT JOIN pg_class tc ON tc.oid=d.refobjid
      LEFT JOIN pg_namespace tn ON tn.oid=tc.relnamespace
      LEFT JOIN pg_attribute a ON a.attrelid=d.refobjid AND a.attnum=d.refobjsubid
      WHERE ${USER_SCHEMAS} ORDER BY n.nspname,c.relname`),
    rows(sql, `SELECT extname AS name,extversion AS version,n.nspname AS schema
      FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY extname`),
    rows(sql, `
      SELECT n.nspname AS schema,p.proname AS name,
        pg_get_function_identity_arguments(p.oid) AS identity_arguments,
        CASE p.prokind WHEN 'p' THEN 'procedure' ELSE 'function' END AS kind,
        l.lanname AS language,p.provolatile AS volatility,p.prosecdef AS security_definer,
        pg_get_function_result(p.oid) AS result,pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      JOIN pg_language l ON l.oid=p.prolang WHERE ${USER_SCHEMAS}
        AND p.prokind IN ('f','p')
      ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)`),
    rows(sql, `
      SELECT n.nspname AS schema,c.relname AS table,t.tgname AS name,
        t.tgenabled AS enabled,pg_get_triggerdef(t.oid,TRUE) AS definition,
        pn.nspname AS function_schema,p.proname AS function
      FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid
      JOIN pg_namespace pn ON pn.oid=p.pronamespace
      WHERE ${USER_SCHEMAS} AND NOT t.tgisinternal
      ORDER BY n.nspname,c.relname,t.tgname`),
    rows(sql, `SELECT schemaname AS schema,viewname AS name,definition
      FROM pg_views WHERE schemaname NOT IN ('pg_catalog','information_schema')
      ORDER BY schemaname,viewname`),
    rows(sql, `SELECT schemaname AS schema,matviewname AS name,definition,
      ispopulated AS populated FROM pg_matviews
      WHERE schemaname NOT IN ('pg_catalog','information_schema')
      ORDER BY schemaname,matviewname`),
    rows(sql, `
      SELECT schemaname AS schema,tablename AS table,policyname AS name,
        permissive,roles,cmd,qual AS using,with_check
      FROM pg_policies ORDER BY schemaname,tablename,policyname`),
  ]);
  const inventory = {
    formatVersion: 2,
    tables, columns, indexes, constraints, enums, domains, compositeTypes,
    sequences, extensions, routines, triggers, views, materializedViews, policies,
  };
  inventory.fingerprint = createHash('sha256')
    .update(JSON.stringify(inventory)).digest('hex');
  return inventory;
}

const KEYS = {
  tables: ['schema', 'name'], columns: ['schema', 'table', 'name'],
  indexes: ['schema', 'table', 'name'], constraints: ['schema', 'table', 'name'],
  enums: ['schema', 'name'], domains: ['schema', 'name'],
  compositeTypes: ['schema', 'name'], sequences: ['schema', 'name'],
  extensions: ['name'], routines: ['schema', 'name', 'identity_arguments', 'kind'],
  triggers: ['schema', 'table', 'name'], views: ['schema', 'name'],
  materializedViews: ['schema', 'name'], policies: ['schema', 'table', 'name'],
};

export function objectKey(type, object) {
  return KEYS[type].map((key) => String(object[key] ?? '')).join('\u0000');
}

export function compareObjectType(type, canonical = [], clone = []) {
  const left = new Map(canonical.map((value) => [objectKey(type, value), value]));
  const right = new Map(clone.map((value) => [objectKey(type, value), value]));
  return [...new Set([...left.keys(), ...right.keys()])].sort().map((key) => {
    const canonicalValue = left.get(key);
    const cloneValue = right.get(key);
    let status = 'IDENTICAL';
    if (!canonicalValue) status = 'CLONE_ONLY';
    else if (!cloneValue) status = 'CANONICAL_ONLY';
    else if (JSON.stringify(canonicalValue) !== JSON.stringify(cloneValue)) {
      status = 'SAME_NAME_DIFFERENT_DEFINITION';
    }
    return { key: key.replaceAll('\u0000', '.'), status, canonical: canonicalValue, clone: cloneValue };
  });
}

export function compareInventories(canonical, clone) {
  const objects = {};
  const summary = {};
  for (const type of Object.keys(KEYS)) {
    objects[type] = compareObjectType(type, canonical[type], clone[type]);
    summary[type] = Object.fromEntries(
      ['IDENTICAL', 'CLONE_ONLY', 'CANONICAL_ONLY', 'SAME_NAME_DIFFERENT_DEFINITION']
        .map((status) => [status, objects[type].filter((item) => item.status === status).length]),
    );
  }
  return { formatVersion: 2, summary, objects };
}

function renderPatch(diff) {
  const lines = [];
  for (const [type, items] of Object.entries(diff.objects)) {
    for (const item of items.filter(({ status }) => status !== 'IDENTICAL')) {
      lines.push(`## ${type}: ${item.key} [${item.status}]`);
      lines.push(`- canonical: ${JSON.stringify(item.canonical ?? null)}`);
      lines.push(`+ clone: ${JSON.stringify(item.clone ?? null)}`, '');
    }
  }
  return lines.length ? `${lines.join('\n')}\n` : 'IDENTICAL\n';
}

function renderDoc(diff, canonical, clone) {
  const differing = Object.values(diff.objects).flat()
    .filter(({ status }) => status !== 'IDENTICAL');
  return `# Divergencia de esquema de producción — PR #20

Documento generado por \`tools/db/schema-inventory.mjs\`. No autoriza cambios en producción.

- Fingerprint canónico: \`${canonical.fingerprint}\`
- Fingerprint clon: \`${clone.fingerprint}\`
- Objetos divergentes: ${differing.length}

## Resumen

| Tipo | Idénticos | Solo clon | Solo canónica | Definición diferente |
|---|---:|---:|---:|---:|
${Object.entries(diff.summary).map(([type, s]) =>
    `| ${type} | ${s.IDENTICAL} | ${s.CLONE_ONLY} | ${s.CANONICAL_ONLY} | ${s.SAME_NAME_DIFFERENT_DEFINITION} |`).join('\n')}

## Evidencia

${differing.length ? differing.map((item) =>
    `### ${item.key}\n\nClasificación: \`${item.status}\`\n\n` +
    `- Canónica: \`${JSON.stringify(item.canonical ?? null)}\`\n` +
    `- Clon: \`${JSON.stringify(item.clone ?? null)}\``).join('\n\n') : 'Los inventarios son idénticos.'}
`;
}

async function main() {
  const [canonicalUrl, cloneUrl] = process.argv.slice(2);
  if (!canonicalUrl || !cloneUrl) throw new Error('Uso: schema-inventory.mjs <canonical-url> <clone-url>');
  const { Pool } = await import('@neondatabase/serverless');
  const canonicalPool = new Pool({ connectionString: canonicalUrl, max: 1 });
  const clonePool = new Pool({ connectionString: cloneUrl, max: 1 });
  try {
    const [canonical, clone] = await Promise.all([
      collectSchemaInventory(canonicalPool), collectSchemaInventory(clonePool),
    ]);
    const diff = compareInventories(canonical, clone);
    mkdirSync(OUT, { recursive: true });
    mkdirSync(dirname(DOC), { recursive: true });
    writeFileSync(resolve(OUT, 'canonical-schema-inventory.json'), `${JSON.stringify(canonical, null, 2)}\n`);
    writeFileSync(resolve(OUT, 'clone-schema-inventory.json'), `${JSON.stringify(clone, null, 2)}\n`);
    writeFileSync(resolve(OUT, 'schema-diff-pr20.json'), `${JSON.stringify(diff, null, 2)}\n`);
    writeFileSync(resolve(OUT, 'schema-diff-pr20.patch'), renderPatch(diff));
    writeFileSync(DOC, renderDoc(diff, canonical, clone));
    const count = Object.values(diff.objects).flat().filter((x) => x.status !== 'IDENTICAL').length;
    console.log(`Inventario completo: ${count} divergencias.`);
  } finally {
    await Promise.all([canonicalPool.end(), clonePool.end()]);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Error de inventario: ${error.message}`);
    process.exitCode = 1;
  });
}

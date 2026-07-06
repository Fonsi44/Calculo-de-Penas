#!/usr/bin/env node
/**
 * EDICIÓN PUNTUAL DE UN POST DEL BLOG (no masivo).
 *
 * Uso:
 *   node scripts/_edit-post.cjs <slug> <archivo-html-cuerpo>
 *
 * El archivo debe contener líneas opcionales al inicio con el formato:
 *   TITLE: ...
 *   META_TITLE: ...        (vacío = null)
 *   META_DESC: ...
 *   DESCRIPTION: ...        (resumen/excerpt; opcional)
 *   === BODY ===
 *   <html del cuerpo>
 *
 * Solo actualiza los campos presentes. Hace backup previo en
 * auditoria-blog/backup-manual-<slug>-<timestamp>.json y relee el post
 * tras escribir para confirmar.
 *
 * No es un proceso masivo: un slug por invocación.
 */
const fs = require('fs');
const path = require('path');

// Cargar .env.local si existe, si no .env
(function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const rawLine of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      let value = m[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
    break;
  }
})();

const slug = process.argv[2];
const fileArg = process.argv[3];
if (!slug || !fileArg) {
  console.error('Uso: node scripts/_edit-post.cjs <slug> <archivo>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL no definida');
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(process.cwd(), fileArg), 'utf8');
const lines = raw.split(/\r?\n/);
const fields = { TITLE: null, META_TITLE: undefined, META_DESC: null, DESCRIPTION: null };
let bodyStart = -1;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith('=== BODY ===')) { bodyStart = i + 1; break; }
  let matched = false;
  for (const k of Object.keys(fields)) {
    if (l.startsWith(k + ':')) { fields[k] = l.slice(k.length + 1).trim(); matched = true; break; }
  }
  if (!matched && l.trim() === '') continue;
}
if (bodyStart < 0) { console.error('No se encontró "=== BODY ==="'); process.exit(1); }
const body = lines.slice(bodyStart).join('\n').trim();

(async () => {
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);

  // 1. Backup previo
  const before = await sql`SELECT id, slug, title, meta_title, meta_description, description, body, updated_at FROM blog_posts WHERE slug = ${slug}`;
  if (before.length === 0) {
    console.error('Slug no encontrado: ' + slug);
    process.exit(2);
  }
  const backupDir = path.resolve(process.cwd(), 'auditoria-blog');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-manual-${slug}-${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(before[0], null, 2));
  console.log('Backup previo: ' + backupPath);

  // 2. Construir sets dinámicamente
  const sets = [];
  const params = [];
  if (fields.TITLE) { params.push(fields.TITLE); sets.push(`title = $${params.length}`); }
  if (fields.META_DESC !== null) { params.push(fields.META_DESC); sets.push(`meta_description = $${params.length}`); }
  if (fields.DESCRIPTION !== null) { params.push(fields.DESCRIPTION); sets.push(`description = $${params.length}`); }
  if (fields.META_TITLE !== undefined) {
    // '' = limpiar (null), valor = set
    params.push(fields.META_TITLE === '' ? null : fields.META_TITLE);
    sets.push(`meta_title = $${params.length}`);
  }
  params.push(body);
  sets.push(`body = $${params.length}`);
  params.push(new Date().toISOString());
  sets.push(`updated_at = $${params.length}`);

  // 3. Ejecutar UPDATE (sql.query permite placeholders $1..$N)
  const slugParamIndex = params.length + 1;
  params.push(slug);
  const query = `UPDATE blog_posts SET ${sets.join(', ')} WHERE slug = $${slugParamIndex}`;
  await sql.query(query, params);
  console.log('UPDATE aplicado para: ' + slug);

  // 4. Releer y confirmar
  const after = await sql`SELECT slug, title, meta_title, meta_description, length(body) AS body_len, updated_at FROM blog_posts WHERE slug = ${slug}`;
  console.log('Confirmado:', JSON.stringify(after[0]));
})().catch((e) => { console.error('ERROR:', e.message); process.exit(3); });

import { config } from 'dotenv';
config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL no encontrada'); process.exit(1); }

const sql = neon(url);

async function backup(table) {
  const rows = await sql`SELECT * FROM ${sql.unsafe(table)}`;
  const backupPath = `data/backup_${table}_${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Backup: ${rows.length} filas de ${table} -> ${backupPath}`);
  return rows.length;
}

async function reseedDelitos() {
  const delitos = JSON.parse(fs.readFileSync('data/delitos.json', 'utf-8'));
  console.log(`Re-seed delitos: ${delitos.length} entradas en JSON`);

  // Delete all
  const del = await sql`DELETE FROM delitos`;
  console.log(`DELETE: ${del.count ?? '?'} filas`);

  // Insert one by one (text array columns need raw string for parameter binding)
  let count = 0;
  for (const d of delitos) {
    const accArr = d.penas_accesorias || [];
    // For neon serverless, pass array directly
    await sql.query(
      `INSERT INTO delitos (
        nombre, articulo, conducta, clasificacion, rama_id,
        constitucion_articulo_id, pena_minima_meses, pena_maxima_meses,
        tiene_pena_alternativa, pena_alternativa_min, pena_alternativa_max,
        penas_accesorias, observaciones, es_grave
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        d.nombre,
        d.articulo,
        d.conducta || '',
        d.clasificacion || '',
        d.rama_id || null,
        d.constitucion_articulo_id || null,
        d.pena_minima_meses,
        d.pena_maxima_meses,
        d.tiene_pena_alternativa || false,
        d.pena_alternativa_min || 0,
        d.pena_alternativa_max || 0,
        accArr,  // Pass as JS array
        d.observaciones || null,
        d.es_grave || false,
      ]
    );
    count++;
    if (count % 50 === 0) console.log(`  ${count}/${delitos.length} insertados...`);
  }
  return count;
}

async function reseedConstitucion() {
  const arts = JSON.parse(fs.readFileSync('data/articulos_constitucion.json', 'utf-8'));
  console.log(`\nRe-seed articulos_constitucion: ${arts.length} entradas en JSON`);

  const del = await sql`DELETE FROM articulos_constitucion`;
  console.log(`DELETE: ${del.count ?? '?'} filas`);

  let count = 0;
  for (let i = 0; i < arts.length; i += 50) {
    const batch = arts.slice(i, i + 50);
    for (const a of batch) {
      await sql`
        INSERT INTO articulos_constitucion (id, articulo, titulo, capitulo, texto)
        VALUES (${a.numero}, ${a.articulo}, ${a.titulo || ''}, ${a.capitulo || ''}, ${a.texto})
        ON CONFLICT (id) DO UPDATE SET
          articulo = EXCLUDED.articulo,
          titulo = EXCLUDED.titulo,
          capitulo = EXCLUDED.capitulo,
          texto = EXCLUDED.texto
      `;
      count++;
    }
    console.log(`  ${count}/${arts.length} insertados...`);
  }
  return count;
}

async function verify() {
  const total = await sql`SELECT COUNT(*) as total FROM delitos`;
  console.log(`\nVerificacion: delitos en BD = ${total[0].total}`);

  const con = await sql`SELECT COUNT(*) as total FROM articulos_constitucion`;
  console.log(`Verificacion: articulos_constitucion en BD = ${con[0].total}`);

  // Check for mojibake
  const bad = await sql`SELECT id, nombre FROM delitos WHERE nombre ~ '[ÃÂ]' LIMIT 5`;
  console.log(`Mojibake en delitos: ${bad.length} filas (debe ser 0)`);
  if (bad.length > 0) bad.forEach(b => console.log(`  ${b.id}: ${b.nombre}`));
}

(async () => {
  try {
    console.log('=== BACKUP ===');
    const d_count = await backup('delitos');
    const c_count = await backup('articulos_constitucion');

    // FK constraint: delitos.constitucion_articulo_id -> articulos_constitucion.id
    // Must clear delitos BEFORE clearing articulos_constitucion
    // And re-seed articulos_constitucion BEFORE delitos

    // Step 1: Clear delitos (no FK issues)
    console.log('\n=== LIMPIAR DELITOS (paso 1) ===');
    const del = await sql`DELETE FROM delitos`;
    console.log(`DELETE FROM delitos: ${del.count ?? '?'} filas`);

    // Step 2: Re-seed articulos_constitucion
    console.log('\n=== RE-SEED CONSTITUCION (paso 2) ===');
    const c_inserted = await reseedConstitucion();
    console.log(`Insertados: ${c_inserted}`);

    // Step 3: Re-seed delitos
    console.log('\n=== RE-SEED DELITOS (paso 3) ===');
    const d_inserted = await reseedDelitos();
    console.log(`Insertados: ${d_inserted}`);

    console.log('\n=== VERIFICACION ===');
    await verify();

    console.log('\n[OK] Re-seed completo');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

#!/usr/bin/env node
/**
 * Seed E2E sintético — idempotente, seguro, solo para staging.
 * Requiere: ALLOW_E2E_SEED=true, NODE_ENV!=production.
 */
import { Pool } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('DATABASE_URL required'); process.exit(1); }
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_E2E_SEED) {
  console.error('BLOCKED: production'); process.exit(1);
}
if (!process.env.ALLOW_E2E_SEED) {
  console.error('Set ALLOW_E2E_SEED=true'); process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });
const PWHASH = '$2a$12$LJ3m4ys3GaqM5oVfG0XzSO1MqQZz0KqLn5E0pN6dOyOoR8ZXmQX0e';

async function seed() {
  console.log('🌱 Seed E2E...\n');
  const users = [
    ['admin@test.local', 'Admin Test', 'admin'],
    ['abogado-a@test.local', 'Abogado A', 'abogado'],
    ['abogado-b@test.local', 'Abogado B', 'abogado'],
  ];
  const ids = {};
  for (const [email, nombre, rol] of users) {
    await pool.query(
      `INSERT INTO usuarios (id, email, nombre, rol, active, password_hash, token_version, creado_en)
       VALUES ($1,$2,$3,$4,true,$5,0,NOW()) ON CONFLICT (email) DO UPDATE SET nombre=$3, rol=$4, active=true, password_hash=$5`,
      [randomUUID(), email, nombre, rol, PWHASH]
    );
    const r = await pool.query('SELECT id FROM usuarios WHERE email=$1', [email]);
    ids[email] = r.rows[0].id;
    console.log('  ✓', email, '('+rol+')');
  }

  // Cliente
  let clientId;
  const cr = await pool.query("SELECT id FROM clientes WHERE email='cliente@test.local'");
  if (cr.rows.length > 0) { clientId = cr.rows[0].id; }
  else {
    clientId = randomUUID();
    await pool.query('INSERT INTO clientes (id, nombre, email, creado_en) VALUES ($1,$2,$3,NOW())', [clientId, 'Cliente Test', 'cliente@test.local']);
  }
  console.log('  ✓ cliente@test.local');

  // Expedientes
  for (const [num, uid] of [['E2E-001', ids['abogado-a@test.local']], ['E2E-002', ids['abogado-b@test.local']]]) {
    let expId;
    const er = await pool.query('SELECT id FROM expedientes WHERE numero_interno=$1', [num]);
    if (er.rows.length > 0) { expId = er.rows[0].id; }
    else {
      expId = randomUUID();
      await pool.query('INSERT INTO expedientes (id, numero_interno, cliente_id, responsable_id, estado, prioridad, creado_en) VALUES ($1,$2,$3,$4,$5,$6,NOW())', [expId, num, clientId, uid, 'creado', 'media']);
    }
    await pool.query('INSERT INTO expediente_asignaciones (id, expediente_id, abogado_id, asignado_en) VALUES ($1,$2,$3,NOW()) ON CONFLICT DO NOTHING', [randomUUID(), expId, uid]);
    console.log('  ✓', num);
  }

  // Evento agenda
  const now = new Date();
  await pool.query(
    `INSERT INTO eventos_agenda (id, titulo, tipo, visibilidad, fecha, inicio, fin, propietario_id, creado_por, creado_en, estado, participantes, recordatorios, todo_el_dia, zona_horaria, version)
     VALUES ($1,$2,'audiencia','privado',$3,$3,$4,$5,$5,NOW(),'confirmada','[]','[]',false,'America/Tegucigalpa',1) ON CONFLICT DO NOTHING`,
    [randomUUID(), 'Audiencia E2E', now, new Date(Date.now()+7*86400000), ids['abogado-a@test.local']]
  );
  console.log('  ✓ evento agenda');

  await pool.end();
  console.log('\n✅ Seed completado. Users: admin@test.local, abogado-a@test.local, abogado-b@test.local / Test123!');
}
seed().catch(err => { console.error('FAIL:', err.message); process.exit(1); });

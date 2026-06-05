#!/usr/bin/env node
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { inArray, like } from 'drizzle-orm';
import { usuarios, calculos, casos, auditoriaEventos } from '../lib/schema.ts';

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('Buscando usuarios de prueba E2E (email LIKE e2e-%@test.local)...\n');
  const matches = await db
    .select({ id: usuarios.id, email: usuarios.email })
    .from(usuarios)
    .where(like(usuarios.email, 'e2e-%@test.local'));

  if (matches.length === 0) {
    console.log('No hay usuarios de prueba que limpiar.');
    return;
  }

  console.log(`Encontrados ${matches.length} usuarios de prueba:`);
  for (const m of matches) console.log(`  - ${m.email}`);

  if (DRY_RUN) {
    console.log('\nDry-run: no se eliminó nada. Ejecuta sin --dry-run para limpiar.');
    return;
  }

  const ids = matches.map(m => m.id);
  console.log('\nEliminando dependencias y usuarios...');

  const cal = await db.delete(calculos).where(inArray(calculos.casoId, db.select({ id: casos.id }).from(casos).where(inArray(casos.usuarioId, ids)))).returning({ id: calculos.id });
  const cas = await db.delete(casos).where(inArray(casos.usuarioId, ids)).returning({ id: casos.id });
  const aud = await db.delete(auditoriaEventos).where(inArray(auditoriaEventos.usuarioId, ids)).returning({ id: auditoriaEventos.id });
  const usr = await db.delete(usuarios).where(inArray(usuarios.id, ids)).returning({ id: usuarios.id });

  console.log(`OK ${usr.length} usuarios, ${cas.length} casos, ${cal.length} calculos, ${aud.length} auditorias eliminados.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

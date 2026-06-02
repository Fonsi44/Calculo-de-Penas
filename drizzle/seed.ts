import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ramasJuridicas, articulosConstitucion, articulosCp, delitos } from '../lib/schema';
import * as fs from 'fs';
import * as path from 'path';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface RamaSeed {
  id: string;
  nombre: string;
  parent_id: string | null;
  nivel: number;
  orden: number;
}

interface ArticuloSeed {
  numero: number;
  articulo: string;
  titulo: string;
  capitulo: string;
  texto: string;
}

interface DelitoSeed {
  nombre: string;
  articulo: string;
  conducta?: string;
  rama_id?: string;
  constitucion_articulo_id?: number | null;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tiene_pena_alternativa?: boolean;
  pena_alternativa_min?: number;
  pena_alternativa_max?: number;
  penas_accesorias?: string[];
  observaciones?: string;
}

async function seed() {
  console.log('Iniciando seed...\n');

  // Check if data already exists to prevent duplicate seeding
  const existing = await sql`SELECT COUNT(*) as total FROM delitos`;
  if (Number(existing[0].total) > 0) {
    console.log(`✓ BD ya contiene ${existing[0].total} delitos — saltando seed`);
    process.exit(0);
  }

  // Ramas jurídicas — batch insert
  const ramasPath = path.resolve('data/ramas_juridicas.json');
  if (fs.existsSync(ramasPath)) {
    const ramas: RamaSeed[] = JSON.parse(fs.readFileSync(ramasPath, 'utf-8'));
    await db.insert(ramasJuridicas).values(
      ramas.map(r => ({
        id: r.id,
        nombre: r.nombre,
        parentId: r.parent_id,
        nivel: r.nivel,
        orden: r.orden,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Ramas: ${ramas.length} insertadas`);
  }

  // Artículos constitucionales — batch insert
  const artsPath = path.resolve('data/articulos_constitucion.json');
  if (fs.existsSync(artsPath)) {
    const arts: ArticuloSeed[] = JSON.parse(fs.readFileSync(artsPath, 'utf-8'));
    await db.insert(articulosConstitucion).values(
      arts.map(a => ({
        id: a.numero,
        articulo: a.articulo,
        titulo: a.titulo,
        capitulo: a.capitulo,
        texto: a.texto,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Artículos constitucionales: ${arts.length} insertados`);
  }

  // Artículos del Código Penal
  const cpPath = path.resolve('data/articulos_cp.json');
  if (fs.existsSync(cpPath)) {
    const cp: any[] = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
    await db.insert(articulosCp).values(
      cp.map(a => ({
        articulo: a.articulo,
        libro: a.libro,
        titulo: a.titulo,
        capitulo: a.capitulo,
        seccion: a.seccion,
        epigrafe: a.epigrafe,
        texto: a.texto,
        tema: a.tema,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Artículos CP: ${cp.length} insertados`);
  }

  // Delitos — batch insert en chunks de 100
  const delitosPath = path.resolve('data/delitos.json');
  if (fs.existsSync(delitosPath)) {
    const delitosSeed: DelitoSeed[] = JSON.parse(fs.readFileSync(delitosPath, 'utf-8'));
    const batchSize = 100;
    let count = 0;
    for (let i = 0; i < delitosSeed.length; i += batchSize) {
      const batch = delitosSeed.slice(i, i + batchSize);
      await db.insert(delitos).values(
        batch.map(d => ({
          nombre: d.nombre,
          articulo: d.articulo,
          conducta: d.conducta,
          ramaId: d.rama_id,
          constitucionArticuloId: d.constitucion_articulo_id ?? null,
          penaMinimaMeses: d.pena_minima_meses,
          penaMaximaMeses: d.pena_maxima_meses,
          tienePenaAlternativa: d.tiene_pena_alternativa ?? false,
          penaAlternativaMin: d.pena_alternativa_min ?? 0,
          penaAlternativaMax: d.pena_alternativa_max ?? 0,
          penasAccesorias: d.penas_accesorias ?? [],
          observaciones: d.observaciones,
          esGrave: d.pena_maxima_meses >= 60,
        }))
      ).onConflictDoNothing();
      count += batch.length;
      console.log(`  ${count}/${delitosSeed.length} delitos...`);
    }
    console.log(`✓ Delitos: ${count} insertados`);
  }

  console.log('\n✔ Seed completado');
  process.exit(0);
}

seed().catch((err) => {
  console.error('✖ Error en seed:', err);
  process.exit(1);
});

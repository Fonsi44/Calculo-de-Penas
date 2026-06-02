import { db } from '@/lib/db';
import { ramasJuridicas, articulosConstitucion, articulosCp, delitos } from '@/lib/schema';
import { count } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  const [result] = await db.select({ total: count() }).from(delitos);
  if (result.total > 0) {
    return Response.json({ message: `Base de datos ya tiene ${result.total} delitos`, seeded: false });
  }

  const dataDir = path.resolve(process.cwd(), 'data');

  // Ramas jurídicas
  const ramasPath = path.join(dataDir, 'ramas_juridicas.json');
  if (fs.existsSync(ramasPath)) {
    const ramas = JSON.parse(fs.readFileSync(ramasPath, 'utf-8'));
    await db.insert(ramasJuridicas).values(
      ramas.map((r: any) => ({
        id: r.id,
        nombre: r.nombre,
        parentId: r.parent_id,
        nivel: r.nivel,
        orden: r.orden,
      }))
    ).onConflictDoNothing();
  }

  // Artículos constitucionales
  const artsPath = path.join(dataDir, 'articulos_constitucion.json');
  if (fs.existsSync(artsPath)) {
    const arts = JSON.parse(fs.readFileSync(artsPath, 'utf-8'));
    await db.insert(articulosConstitucion).values(
      arts.map((a: any) => ({
        id: a.numero,
        articulo: a.articulo,
        titulo: a.titulo,
        capitulo: a.capitulo,
        texto: a.texto,
      }))
    ).onConflictDoNothing();
  }

  // Artículos del Código Penal
  const cpPath = path.join(dataDir, 'articulos_cp.json');
  if (fs.existsSync(cpPath)) {
    const cp = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
    await db.insert(articulosCp).values(
      cp.map((a: any) => ({
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
  }

  // Delitos
  const delitosPath = path.join(dataDir, 'delitos.json');
  let delitoCount = 0;
  if (fs.existsSync(delitosPath)) {
    const delitosSeed = JSON.parse(fs.readFileSync(delitosPath, 'utf-8'));
    const batchSize = 100;
    for (let i = 0; i < delitosSeed.length; i += batchSize) {
      const batch = delitosSeed.slice(i, i + batchSize);
      await db.insert(delitos).values(
        batch.map((d: any) => ({
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
      delitoCount += batch.length;
    }
  }

  return Response.json({ message: `Base de datos poblada con ${delitoCount} delitos`, seeded: true });
}

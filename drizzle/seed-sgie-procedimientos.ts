/**
 * SGIE — Seed de tipos de procedimiento (Fase 0/1).
 *
 * Genera un procedimiento por cada subservicio del catálogo interno
 * (`data/areas-juridicas.ts`): áreas generales, grupos del hub penal y
 * subáreas del hub de migrantes. Todos se marcan `pendiente_validacion_legal`
 * hasta que un abogado responsable los valide y active (§11.3 del plan SGIE).
 *
 * No inventa requisitos legales definitivos: la `definicion` incluye sólo
 * estructura editable (documentos requeridos/opcionales/condicionales vacíos
 * y campos esperados genéricos) para que el abogado los complete tras
 * validación legal.
 *
 * Idempotente: ON CONFLICT (slug) DO NOTHING. Re-ejecutable sin duplicar.
 *
 * Uso: npx tsx drizzle/seed-sgie-procedimientos.ts
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { tiposProcedimiento } from '../lib/schema';
import { areasGenerales, hubPenal, hubMigrantes } from '../data/areas-juridicas';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface ProcedimientoSeed {
  slug: string;
  nombre: string;
  areaJuridica: string;
  descripcion: string;
  definicion: Record<string, unknown>;
}

/**
 * Construye un slug estable y único a partir del área + subservicio.
 * Formato: `<area-slug>--<subservicio-slug>`.
 */
function construirSlug(areaSlug: string, tituloSub: string): string {
  const sub = tituloSub
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${areaSlug}--${sub}`.slice(0, 200);
}

/**
 * Definición editable genérica. No contiene requisitos legales definitivos:
 * el abogado los completa tras validación legal. Estructura conforme a §11.2.
 */
function definicionBase(areaTitulo: string, subservicioTitulo: string, subservicioDesc: string) {
  return {
    origen: 'seed-catalogo-areas-juridicas',
    areaTitulo,
    subservicioTitulo,
    subservicioDescripcion: subservicioDesc,
    documentosRequeridos: [] as string[],
    documentosOpcionales: [] as string[],
    documentosCondicionales: [] as string[],
    camposEsperados: ['cliente_nombre', 'cliente_identidad'] as string[],
    reglasValidacion: [] as string[],
    plazosInternos: [] as string[],
    tareasAutomaticas: [] as string[],
    plantillasCorreoAsociadas: [] as string[],
    criteriosCompletitud: [] as string[],
    notaLegal: 'Pendiente de validación legal por abogado responsable. No usar como requisito definitivo hasta su activación.',
  };
}

function recopilarProcedimientos(): ProcedimientoSeed[] {
  const out: ProcedimientoSeed[] = [];
  const slugsVistos = new Set<string>();

  const push = (p: ProcedimientoSeed) => {
    if (slugsVistos.has(p.slug)) return; // dedupe defensivo
    slugsVistos.add(p.slug);
    out.push(p);
  };

  // Áreas generales (13)
  for (const area of areasGenerales) {
    for (const sub of area.subservicios) {
      push({
        slug: construirSlug(area.slug, sub.titulo),
        nombre: `${sub.titulo}`,
        areaJuridica: area.titulo,
        descripcion: sub.descripcion,
        definicion: definicionBase(area.titulo, sub.titulo, sub.descripcion),
      });
    }
  }

  // Hub penal — grupos especializados
  for (const grupo of hubPenal.grupos) {
    for (const sub of grupo.subservicios) {
      push({
        slug: construirSlug(grupo.slug, sub.titulo),
        nombre: `${sub.titulo}`,
        areaJuridica: `${hubPenal.titulo} — ${grupo.titulo}`,
        descripcion: sub.descripcion,
        definicion: definicionBase(`${hubPenal.titulo} — ${grupo.titulo}`, sub.titulo, sub.descripcion),
      });
    }
  }

  // Hub migrantes — subáreas
  for (const subarea of hubMigrantes.subareas) {
    for (const sub of subarea.subservicios) {
      push({
        slug: construirSlug(subarea.slug, sub.titulo),
        nombre: `${sub.titulo}`,
        areaJuridica: `${hubMigrantes.titulo} — ${subarea.titulo}`,
        descripcion: sub.descripcion,
        definicion: definicionBase(`${hubMigrantes.titulo} — ${subarea.titulo}`, sub.titulo, sub.descripcion),
      });
    }
  }

  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[seed-sgie-procedimientos] DATABASE_URL no definida. Saliendo.');
    process.exit(0); // salida limpia (coherente con otros scripts del repo)
  }

  const procedimientos = recopilarProcedimientos();
  console.log(`[seed-sgie-procedimientos] ${procedimientos.length} procedimientos a sembrar (pendiente_validacion_legal).`);

  let insertados = 0;
  for (const p of procedimientos) {
    try {
      const res = await db
        .insert(tiposProcedimiento)
        .values({
          slug: p.slug,
          nombre: p.nombre,
          areaJuridica: p.areaJuridica,
          descripcion: p.descripcion,
          version: 1,
          estado: 'pendiente_validacion_legal',
          definicion: p.definicion,
        })
        .onConflictDoNothing({ target: tiposProcedimiento.slug })
        .returning({ id: tiposProcedimiento.id });
      if (res.length > 0) insertados += 1;
    } catch (e) {
      console.warn(`[seed-sgie-procedimientos] Error al insertar "${p.slug}":`, (e as Error).message);
    }
  }

  console.log(`[seed-sgie-procedimientos] Insertados ${insertados} nuevos. ${procedimientos.length - insertados} ya existían (idempotente).`);

  // Reporte por área.
  const conteo = await db
    .select({ area: tiposProcedimiento.areaJuridica })
    .from(tiposProcedimiento);
  const porArea = new Map<string, number>();
  for (const r of conteo) {
    const area = r.area ?? 'Sin área';
    porArea.set(area, (porArea.get(area) ?? 0) + 1);
  }
  console.log('[seed-sgie-procedimientos] Distribución por área jurídica:');
  for (const [area, n] of porArea) {
    console.log(`  · ${area}: ${n}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[seed-sgie-procedimientos] Error fatal:', e);
    process.exit(1);
  });

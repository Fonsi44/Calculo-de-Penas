import { db } from './db';
import { isUsableDatabaseUrl } from '@/lib/database-url';
import { areasJuridicas } from './schema';
import { eq, asc } from 'drizzle-orm';
import { cache } from 'react';

export interface AreaFromDb {
  slug: string;
  titulo: string;
  descripcionCorta: string;
  descripcionLarga: string;
  icono: string;
  categoria: 'servicio' | 'penal' | 'migrante';
  grupo: string | null;
  subservicios: { titulo: string; descripcion: string }[];
  faqs: { pregunta: string; respuesta: string }[];
  sortOrder: number;
}

function isDbReachable(): boolean {
  return isUsableDatabaseUrl(process.env.DATABASE_URL);
}

export const getAreasFromDb = cache(async (categoria?: string): Promise<AreaFromDb[]> => {
  if (!isDbReachable()) return [];
  const where = categoria ? eq(areasJuridicas.categoria, categoria) : undefined;
  const rows = await db.select().from(areasJuridicas).where(where).orderBy(asc(areasJuridicas.sortOrder));
  return rows.map(r => ({
    slug: r.slug,
    titulo: r.titulo,
    descripcionCorta: r.descripcionCorta ?? '',
    descripcionLarga: r.descripcionLarga ?? '',
    icono: r.icono ?? 'scale',
    categoria: r.categoria as 'servicio' | 'penal' | 'migrante',
    grupo: r.grupo,
    subservicios: (r.subservicios ?? []) as { titulo: string; descripcion: string }[],
    faqs: (r.faqs ?? []) as { pregunta: string; respuesta: string }[],
    sortOrder: r.sortOrder ?? 0,
  }));
});

export const getAreaBySlugFromDb = cache(async (slug: string): Promise<AreaFromDb | undefined> => {
  if (!isDbReachable()) return undefined;
  const [row] = await db.select().from(areasJuridicas).where(eq(areasJuridicas.slug, slug)).limit(1);
  if (!row) return undefined;
  return {
    slug: row.slug,
    titulo: row.titulo,
    descripcionCorta: row.descripcionCorta ?? '',
    descripcionLarga: row.descripcionLarga ?? '',
    icono: row.icono ?? 'scale',
    categoria: row.categoria as 'servicio' | 'penal' | 'migrante',
    grupo: row.grupo,
    subservicios: (row.subservicios ?? []) as { titulo: string; descripcion: string }[],
    faqs: (row.faqs ?? []) as { pregunta: string; respuesta: string }[],
    sortOrder: row.sortOrder ?? 0,
  };
});

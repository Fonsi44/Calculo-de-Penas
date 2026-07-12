import { db } from '@/lib/db';
import { articulosCp } from '@/lib/schema';
import { ilike, or, and, eq, asc, sql } from 'drizzle-orm';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busqueda = searchParams.get('busqueda');
  const tema = searchParams.get('tema');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');
  const countOnly = searchParams.get('count') === '1';

  const filters = [];
  if (busqueda) {
    const q = `%${busqueda}%`;
    filters.push(
      or(
        ilike(articulosCp.articulo, q),
        ilike(articulosCp.epigrafe, q),
        ilike(articulosCp.texto, q),
        ilike(articulosCp.tema, q),
      )
    );
  }
  if (tema) {
    filters.push(eq(articulosCp.tema, tema));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  if (countOnly) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(articulosCp).where(where);
    return Response.json({ total: count });
  }

  const [rows, totalRow] = await Promise.all([
    db.select()
      .from(articulosCp)
      .where(where)
      .orderBy(asc(articulosCp.id))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(articulosCp).where(where),
  ]);

  return Response.json({
    data: rows,
    total: totalRow[0].count,
    limit,
    offset,
    hasMore: offset + rows.length < totalRow[0].count,
  });
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    validateCsrf(request);
    const body = await request.json();
    const [row] = await db.insert(articulosCp).values({
      articulo: body.articulo,
      libro: body.libro,
      titulo: body.titulo,
      capitulo: body.capitulo,
      seccion: body.seccion,
      epigrafe: body.epigrafe,
      texto: body.texto,
      tema: body.tema,
    }).returning();
    return Response.json(row, { status: 201 });
  } catch (e) {
    return authFailureResponse(e);
  }
}

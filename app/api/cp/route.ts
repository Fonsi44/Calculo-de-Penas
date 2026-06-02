import { db } from '@/lib/db';
import { articulosCp } from '@/lib/schema';
import { ilike, or, and, eq, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const busqueda = searchParams.get('busqueda');
  const tema = searchParams.get('tema');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

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

  const rows = await db.select()
    .from(articulosCp)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(asc(articulosCp.id))
    .limit(limit)
    .offset(offset);

  return Response.json(rows);
}

export async function POST(request: Request) {
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
}

import { db } from '@/lib/db';
import { articulosCp, delitos } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return Response.json({ error: 'ID inválido' }, { status: 400 });
  }

  const [row] = await db.select().from(articulosCp).where(eq(articulosCp.id, numId));
  if (!row) {
    return Response.json({ error: 'Artículo no encontrado' }, { status: 404 });
  }

  const delitosRelacionados = await db.select({
    id: delitos.id,
    nombre: delitos.nombre,
    articulo: delitos.articulo,
  }).from(delitos).where(
    eq(delitos.articulo, row.articulo)
  ).limit(20);

  return Response.json({ ...row, delitos_relacionados: delitosRelacionados });
}

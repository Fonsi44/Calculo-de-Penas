import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { count, isNotNull } from 'drizzle-orm';

export async function GET() {
  const rows = await db.select({
    nombre: delitos.ramaId,
    cantidad: count(),
  }).from(delitos).where(
    isNotNull(delitos.ramaId)
  ).groupBy(delitos.ramaId).orderBy(delitos.ramaId);

  return Response.json(rows.map(r => ({ nombre: r.nombre, cantidad: r.cantidad })));
}

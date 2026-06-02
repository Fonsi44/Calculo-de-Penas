import { db } from '@/lib/db';
import { delitos } from '@/lib/schema';
import { count, isNotNull } from 'drizzle-orm';

export async function GET() {
  const rows = await db.select({
    id: delitos.constitucionArticuloId,
    cantidad: count(),
  }).from(delitos).where(
    isNotNull(delitos.constitucionArticuloId)
  ).groupBy(delitos.constitucionArticuloId).orderBy(delitos.constitucionArticuloId);

  return Response.json(rows.map(r => ({ id: r.id, cantidad: r.cantidad })));
}

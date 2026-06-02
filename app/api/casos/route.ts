import { db } from '@/lib/db';
import { casos, calculos } from '@/lib/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

function getUser(request: Request) {
  const token = getTokenFromCookies(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  const user = getUser(request);
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const rows = await db.select({
    id: casos.id,
    titulo: casos.titulo,
    cliente: casos.cliente,
    estado: casos.estado,
    creadoEn: casos.creadoEn,
    totalCalculos: count(calculos.id),
  }).from(casos)
    .leftJoin(calculos, eq(calculos.casoId, casos.id))
    .where(eq(casos.usuarioId, user.userId))
    .groupBy(casos.id)
    .orderBy(desc(casos.creadoEn));

  return new Response(JSON.stringify(rows), { status: 200 });
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const [row] = await db.insert(casos).values({
    usuarioId: user.userId,
    titulo: body.titulo || 'Sin título',
    cliente: body.cliente || null,
    estado: 'borrador',
  }).returning();

  return new Response(JSON.stringify(row), { status: 201 });
}

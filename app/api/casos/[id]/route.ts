import { db } from '@/lib/db';
import { casos, calculos } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { getTokenFromCookies, verifyToken } from '@/lib/auth';

function getUser(request: Request) {
  const token = getTokenFromCookies(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [caso] = await db.select().from(casos).where(eq(casos.id, id));
  if (!caso) return new Response(JSON.stringify({ error: 'Caso no encontrado' }), { status: 404 });

  const calculosList = await db.select().from(calculos)
    .where(eq(calculos.casoId, id))
    .orderBy(desc(calculos.creadoEn));

  return new Response(JSON.stringify({ ...caso, calculos: calculosList }), { status: 200 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [row] = await db.update(casos)
    .set({
      titulo: body.titulo,
      cliente: body.cliente,
      estado: body.estado,
      actualizadoEn: new Date(),
    })
    .where(eq(casos.id, id))
    .returning();

  if (!row) return new Response(JSON.stringify({ error: 'Caso no encontrado' }), { status: 404 });
  return new Response(JSON.stringify(row), { status: 200 });
}

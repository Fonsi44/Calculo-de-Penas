import { db } from '@/lib/db';
import { calculos } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const body = await request.json();
  const { caso_id, config, resultado } = body;

  if (!caso_id || !config || !resultado) {
    return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
  }

  const [row] = await db.insert(calculos).values({
    casoId: caso_id,
    config: JSON.parse(JSON.stringify(config)),
    resultado: JSON.parse(JSON.stringify(resultado)),
  }).returning();

  return new Response(JSON.stringify(row), { status: 201 });
}

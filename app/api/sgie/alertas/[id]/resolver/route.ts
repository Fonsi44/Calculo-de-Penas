import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { alertas } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const { id: alertaId } = await params;

    const [alerta] = await db.select().from(alertas).where(eq(alertas.id, alertaId));
    if (!alerta) return Response.json({ error: 'No encontrada' }, { status: 404 });

    await db.update(alertas).set({ resuelta: true, resueltaPor: auth.userId, resueltaEn: new Date() })
      .where(eq(alertas.id, alertaId));

    return Response.json({ ok: true });
  } catch (err) { return authFailureResponse(err); }
}

import { db } from '@/lib/db';
import { enlacesMagicos, expedientes, requisitosExpediente, documentosExpediente } from '@/lib/schema';
import { and, eq, isNull, gt, lt } from 'drizzle-orm';
import { hashToken } from '@/lib/sgie/util';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return Response.json({ ok: false, error: 'Token requerido.' }, { status: 400 });
  }

  try {
    const tokenHash = hashToken(token);

    const [enlace] = await db
      .select()
      .from(enlacesMagicos)
      .where(eq(enlacesMagicos.tokenHash, tokenHash))
      .limit(1);

    if (!enlace) {
      return Response.json({ ok: false, error: 'Enlace no encontrado.', codigo: 'NOT_FOUND' });
    }

    if (enlace.revocadoEn) {
      return Response.json({ ok: false, error: 'Este enlace ha sido revocado.', codigo: 'REVOKED' });
    }

    if (new Date(enlace.expiraEn) < new Date()) {
      return Response.json({ ok: false, error: 'Este enlace ha expirado.', codigo: 'EXPIRED' });
    }

    if (enlace.usosMaximos !== null && enlace.usosActuales !== null && enlace.usosActuales >= enlace.usosMaximos) {
      return Response.json({ ok: false, error: 'Este enlace ha alcanzado el máximo de usos.', codigo: 'EXHAUSTED' });
    }

    const [exp] = await db
      .select({ numeroInterno: expedientes.numeroInterno, estado: expedientes.estado, area: expedientes.area })
      .from(expedientes)
      .where(eq(expedientes.id, enlace.expedienteId))
      .limit(1);

    const requisitos = await db
      .select({
        id: requisitosExpediente.id,
        nombre: requisitosExpediente.nombre,
        tipo: requisitosExpediente.tipo,
        estado: requisitosExpediente.estado,
      })
      .from(requisitosExpediente)
      .where(eq(requisitosExpediente.expedienteId, enlace.expedienteId))
      .orderBy(requisitosExpediente.orden, requisitosExpediente.creadoEn);

    const docMap = new Map<string, { estado: string; id: string }>();
    if (enlace.requisitoExpedienteId) {
      const docs = await db
        .select({ id: documentosExpediente.id, estado: documentosExpediente.estado, requisitoExpedienteId: documentosExpediente.requisitoExpedienteId })
        .from(documentosExpediente)
        .where(eq(documentosExpediente.expedienteId, enlace.expedienteId));
      for (const d of docs) {
        if (d.requisitoExpedienteId) {
          docMap.set(d.requisitoExpedienteId, { estado: d.estado, id: d.id });
        }
      }
    }

    return Response.json({
      ok: true,
      expediente: exp ?? { numeroInterno: 'N/A', estado: 'desconocido', area: null },
      requisitos: requisitos.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        estado: r.estado,
        documentoEstado: docMap.get(r.id)?.estado ?? null,
        documentoId: docMap.get(r.id)?.id ?? null,
      })),
    });
  } catch (err) {
    console.error('[portal] Error:', err);
    return Response.json({ ok: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}

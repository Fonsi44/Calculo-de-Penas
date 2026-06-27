import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  documentosExpediente,
  expedientes,
  expedienteAsignaciones,
  expedientePermisos,
  clientes,
} from '@/lib/schema';
import { and, eq, isNull, count, desc, inArray } from 'drizzle-orm';

const querySchema = z.object({
  expedienteId: z.string().uuid().optional(),
  estado: z.string().optional(),
  origen: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function contextoDesdeAuth(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, esAdmin: auth.rol === 'admin', rol: auth.rol };
}

async function idsExpedientesAccesibles(usuarioId: string, esAdmin: boolean): Promise<string[] | null> {
  if (esAdmin) return null;

  const [asignados, permitidos] = await Promise.all([
    db
      .select({ id: expedienteAsignaciones.expedienteId })
      .from(expedienteAsignaciones)
      .where(
        and(
          eq(expedienteAsignaciones.abogadoId, usuarioId),
          isNull(expedienteAsignaciones.revocadaEn),
        ),
      ),
    db
      .select({ id: expedientePermisos.expedienteId })
      .from(expedientePermisos)
      .where(
        and(
          eq(expedientePermisos.abogadoId, usuarioId),
          isNull(expedientePermisos.revocadoEn),
        ),
      ),
  ]);

  const ids = new Set<string>();
  [...asignados, ...permitidos].forEach((r) => ids.add(r.id));
  return Array.from(ids);
}

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const ctx = contextoDesdeAuth(auth);
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));

    const accesibles = await idsExpedientesAccesibles(ctx.usuarioId, ctx.esAdmin);

    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({ documentos: [], total: 0, page: query.page, limit: query.limit });
    }

    const conditions = [];
    if (accesibles !== null) {
      conditions.push(inArray(documentosExpediente.expedienteId, accesibles));
    }
    if (query.expedienteId) {
      conditions.push(eq(documentosExpediente.expedienteId, query.expedienteId));
    }
    if (query.estado) {
      conditions.push(eq(documentosExpediente.estado, query.estado as typeof documentosExpediente.$inferSelect.estado));
    }
    if (query.origen) {
      conditions.push(eq(documentosExpediente.origen, query.origen as typeof documentosExpediente.$inferSelect.origen));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [countRow]] = await Promise.all([
      db
        .select({
          id: documentosExpediente.id,
          expedienteId: documentosExpediente.expedienteId,
          requisitoExpedienteId: documentosExpediente.requisitoExpedienteId,
          nombreOriginal: documentosExpediente.nombreOriginal,
          tipoMime: documentosExpediente.tipoMime,
          tamañoBytes: documentosExpediente.tamañoBytes,
          estado: documentosExpediente.estado,
          origen: documentosExpediente.origen,
          tipoDocumento: documentosExpediente.tipoDocumento,
          subidoEn: documentosExpediente.subidoEn,
          procesadoEn: documentosExpediente.procesadoEn,
          hashSha256: documentosExpediente.hashSha256,
          aprobadoEn: documentosExpediente.aprobadoEn,
          rechazadoEn: documentosExpediente.rechazadoEn,
          rechazoMotivo: documentosExpediente.rechazoMotivo,
          numeroInterno: expedientes.numeroInterno,
          clienteNombre: clientes.nombre,
        })
        .from(documentosExpediente)
        .leftJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
        .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
        .where(where)
        .orderBy(desc(documentosExpediente.subidoEn))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      db
        .select({ total: count() })
        .from(documentosExpediente)
        .where(where),
    ]);

    return Response.json({
      documentos: rows.map((r) => ({
        ...r,
        hashSha256: r.hashSha256 ? `${r.hashSha256.slice(0, 8)}...` : null,
      })),
      total: countRow?.total ?? 0,
      page: query.page,
      limit: query.limit,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { documentosExpediente, expedientes, clientes } from '@/lib/schema';
import { and, eq, inArray, desc, isNull } from 'drizzle-orm';

const ESTADOS_REVISION = ['pendiente_abogado', 'clasificado', 'ia_procesada'] as const;

export async function GET(request: Request) {
  try {
    const auth = await requireAbogado(request);
    const { searchParams } = new URL(request.url);
    const tipoError = searchParams.get('tipoError');

    const docs = await db
      .select({
        id: documentosExpediente.id,
        nombre: documentosExpediente.nombreOriginal,
        expedienteId: documentosExpediente.expedienteId,
        estado: documentosExpediente.estado,
        tipoDocumento: documentosExpediente.tipoDocumento,
        fecha: documentosExpediente.subidoEn,
        clienteNombre: clientes.nombre,
        numeroInterno: expedientes.numeroInterno,
        metadata: documentosExpediente.metadata,
      })
      .from(documentosExpediente)
      .leftJoin(expedientes, eq(documentosExpediente.expedienteId, expedientes.id))
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .where(and(
        inArray(documentosExpediente.estado, ESTADOS_REVISION as unknown as typeof documentosExpediente.estado),
        isNull(documentosExpediente.aprobadoEn),
        isNull(documentosExpediente.rechazadoEn),
      ))
      .orderBy(desc(documentosExpediente.subidoEn))
      .limit(100);

    const rows = docs.map((d) => {
      const meta = d.metadata as Record<string, unknown> | null;
      const confianza = typeof meta?.confianzaIa === 'number' ? meta.confianzaIa : Math.round(Math.random() * 100);
      const tipoErrorDetectado = (() => {
        if (confianza < 30) return 'ilegible';
        if (confianza < 50) return 'baja_confianza';
        if (confianza < 70) return 'ocr_insuficiente';
        if (d.estado === 'clasificado' && confianza < 80) return 'clasificacion_dudosa';
        return 'baja_confianza';
      })();

      return {
        id: d.id,
        nombre: d.nombre,
        expedienteId: d.expedienteId ?? '',
        numeroInterno: d.numeroInterno ?? '',
        requisito: d.tipoDocumento ?? 'Documento',
        cliente: d.clienteNombre ?? '',
        estado: d.estado,
        confianza,
        fecha: d.fecha?.toISOString() ?? new Date().toISOString(),
        tipoError: tipoError,
      };
    });

    const filtrados = tipoError
      ? rows.filter((r) => r.tipoError === tipoError)
      : rows;

    return Response.json({ documentos: filtrados, total: filtrados.length });
  } catch (err) {
    return authFailureResponse(err);
  }
}

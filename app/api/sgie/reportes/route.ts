/**
 * GET /api/sgie/reportes
 *
 * Genera métricas operativas filtradas con scope por abogado (admin ve todo).
 * Soporta:
 *   - JSON (default): agregados para la pantalla de reportes.
 *   - ?formato=csv:   descarga CSV del listado de expedientes (RFC 4180 + BOM).
 *
 * Filtros: fechaDesde, fechaHasta, clienteId, estado, abogadoId,
 * tipoProcedimientoId.
 *
 * Seguridad: requireAbogado + scope. El export audita el hecho (no los datos).
 *
 * Sprint 2 — tarea 2.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { generarReporte, type FiltrosReporte } from '@/lib/sgie/reportes-db';
import { generarCsv, conBom, nombreArchivoExport, type ColumnaCsv } from '@/lib/sgie/csv';
import { generarPdfReporte } from '@/lib/sgie/pdf';
import { traducirEstadoExpediente } from '@/lib/sgie/estados';

const querySchema = z.object({
  formato: z.enum(['json', 'csv', 'pdf']).default('json'),
  fechaDesde: z.string().datetime().optional(),
  fechaHasta: z.string().datetime().optional(),
  clienteId: z.string().uuid().optional(),
  estado: z.string().max(50).optional(),
  abogadoId: z.string().uuid().optional(),
  tipoProcedimientoId: z.string().uuid().optional(),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

function parseFiltros(query: z.infer<typeof querySchema>): FiltrosReporte {
  return {
    fechaDesde: query.fechaDesde ? new Date(query.fechaDesde) : undefined,
    fechaHasta: query.fechaHasta ? new Date(query.fechaHasta) : undefined,
    clienteId: query.clienteId,
    estado: query.estado,
    abogadoId: query.abogadoId,
    tipoProcedimientoId: query.tipoProcedimientoId,
  };
}

const COLUMNAS_EXPEDIENTES: ColumnaCsv[] = [
  { clave: 'numeroInterno', etiqueta: 'N.º interno' },
  { clave: 'estado', etiqueta: 'Estado' },
  { clave: 'clienteNombre', etiqueta: 'Cliente' },
  { clave: 'procedimientoNombre', etiqueta: 'Procedimiento' },
  { clave: 'creadoEn', etiqueta: 'Creado' },
];

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const rl = await rateLimit(`sgie:reporte:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const filtros = parseFiltros(query);

    const metricas = await generarReporte(ctx(auth), filtros);

    if (query.formato === 'csv') {
      // Auditar exportación (no los datos sensibles, sólo el hecho + filtros).
      // No existe acción `expediente_exported` en el enum; usamos `expediente_updated`
      // con recurso 'reporte' y metadata explícita para reflejar la exportación.
      await logSgie({
        usuarioId: auth.userId,
        accion: 'expediente_updated',
        recurso: 'reporte',
        metadata: {
          evento: 'export_csv',
          formato: 'csv',
          totalFilas: metricas.expedientes.listado.length,
          filtros: {
            fechaDesde: query.fechaDesde ?? null,
            fechaHasta: query.fechaHasta ?? null,
            estado: query.estado ?? null,
          },
        },
        request,
      });

      // Traducir estado a etiqueta legible en el CSV.
      const filas = metricas.expedientes.listado.map((e) => ({
        numeroInterno: e.numeroInterno,
        estado: traducirEstadoExpediente(e.estado),
        clienteNombre: e.clienteNombre ?? '',
        procedimientoNombre: e.procedimientoNombre ?? '',
        creadoEn: e.creadoEn ? new Date(e.creadoEn).toISOString().slice(0, 10) : '',
      }));
      const csv = conBom(generarCsv(filas, COLUMNAS_EXPEDIENTES));
      const filename = nombreArchivoExport('reporte-expedientes', 'csv');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    if (query.formato === 'pdf') {
      // Sprint 3: PDF server-side con pdfkit. Auditar exportación.
      await logSgie({
        usuarioId: auth.userId,
        accion: 'expediente_updated',
        recurso: 'reporte',
        metadata: {
          evento: 'export_pdf',
          formato: 'pdf',
          totalFilas: metricas.expedientes.listado.length,
          filtros: {
            fechaDesde: query.fechaDesde ?? null,
            fechaHasta: query.fechaHasta ?? null,
            estado: query.estado ?? null,
          },
        } as Record<string, unknown>,
        request,
      });

      const buffer = generarPdfReporte({
        metricas,
        filtros: {
          fechaDesde: query.fechaDesde,
          fechaHasta: query.fechaHasta,
          estado: query.estado,
        },
        generadoPor: auth.userId,
      });
      const filename = nombreArchivoExport('reporte-sgie', 'pdf');

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    return Response.json({ metricas, filtros: query });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

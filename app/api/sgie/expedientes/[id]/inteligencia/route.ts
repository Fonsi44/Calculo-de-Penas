/**
 * GET /api/sgie/expedientes/:id/inteligencia
 *
 * Presenta los datos IA del expediente: confianza global, documentos
 * clasificados con confianza, campos extraídos con valor/confianza/cita/estado,
 * e inconsistencias detectadas. NO invoca IA costosa en cada render: usa datos
 * ya calculados por el motor de confianza y los campos extraídos existentes.
 *
 * Seguridad: requireAbogado + scope del expediente.
 *
 * Sprint 3 — tarea 4. La IA nunca aprueba/firma/cierra: sólo informa.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  documentosExpediente, camposExtraidos, expedienteAsignaciones, expedientePermisos,
} from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { calcularConfianzaExpediente, calcularConfianzaDocumento } from '@/lib/sgie/motor-confianza';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAbogado(request);
    const rl = await rateLimit(`sgie:ia:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    const esAdmin = auth.rol === 'admin';

    // Verificar scope del expediente.
    if (!esAdmin) {
      const [asig] = await db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, id), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      const [perm] = await db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
        .where(and(eq(expedientePermisos.expedienteId, id), eq(expedientePermisos.abogadoId, auth.userId), isNull(expedientePermisos.revocadoEn)));
      if (!asig && !perm) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    // Confianza global del expediente (cálculo existente, cacheable).
    const { confianza, etiqueta } = await calcularConfianzaExpediente(id);

    // Documentos con su clasificación (tipoDocumento). La confianza por documento
    // se calcula vía el motor existente (no hay columna propia; vive en
    // confianza_resultados / se deriva de los campos extraídos).
    const docsRows = await db.select({
      id: documentosExpediente.id,
      nombreOriginal: documentosExpediente.nombreOriginal,
      tipoDocumento: documentosExpediente.tipoDocumento,
      estado: documentosExpediente.estado,
    }).from(documentosExpediente).where(eq(documentosExpediente.expedienteId, id));

    // Calcular confianza por documento (motor existente).
    const documentos = await Promise.all(
      docsRows.map(async (d) => {
        const { confianza, etiqueta } = await calcularConfianzaDocumento(d.id);
        return { ...d, confianza, etiquetaConfianza: etiqueta };
      }),
    );

    // Campos extraídos del expediente.
    const campos = await db.select({
      id: camposExtraidos.id,
      documentoId: camposExtraidos.documentoId,
      clave: camposExtraidos.clave,
      valor: camposExtraidos.valor,
      tipo: camposExtraidos.tipo,
      confianza: camposExtraidos.confianza,
      citaFragmento: camposExtraidos.citaFragmento,
      confirmadoPor: camposExtraidos.confirmadoPor,
      corregidoPor: camposExtraidos.corregidoPor,
      corregidoValor: camposExtraidos.corregidoValor,
    }).from(camposExtraidos).where(eq(camposExtraidos.expedienteId, id));

    // Inconsistencias: campos con la misma clave y valores distintos.
    const porClave = new Map<string, Set<string>>();
    for (const c of campos) {
      const valor = c.corregidoValor ?? c.valor;
      if (!valor) continue;
      if (!porClave.has(c.clave)) porClave.set(c.clave, new Set());
      porClave.get(c.clave)!.add(valor);
    }
    const inconsistencias = Array.from(porClave.entries())
      .filter(([, valores]) => valores.size > 1)
      .map(([clave, valores]) => ({ clave, valoresDistintos: Array.from(valores) }));

    return Response.json({
      confianza: { valor: confianza, etiqueta },
      documentos,
      campos,
      inconsistencias,
      // No hay resumen IA generado automático implementado; se informa al cliente.
      resumenIaDisponible: false,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}

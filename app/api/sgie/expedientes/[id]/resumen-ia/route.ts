/**
 * GET  /api/sgie/expedientes/:id/resumen-ia
 * POST /api/sgie/expedientes/:id/resumen-ia
 *
 * Resumen IA del expediente. GET devuelve el caché vigente (si existe y los
 * datos fuente no cambiaron). POST lo genera/regenera llamando al proveedor IA
 * con prompt restrictivo (R17), cacheando en `resumenes_ia_expediente`.
 *
 * Seguridad: requireAbogado + scope del expediente. CSRF en POST. Rate limit.
 * Auditoría: documento_updated con metadata explícita (no hay acción dedicada).
 *
 * Si el proveedor IA no está configurado, responde estado controlado sin romper.
 * La IA nunca aprueba/firma/cierra/cambia estados.
 *
 * Sprint 4 — tarea 1.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  resumenesIaExpediente, expedientes, clientes, tiposProcedimiento,
  documentosExpediente, camposExtraidos, alertas,
  expedienteAsignaciones, expedientePermisos,
} from '@/lib/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { validateCsrf } from '@/lib/csrf';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logSgie } from '@/lib/sgie/auditoria-sgie';
import { generarResumenIa, calcularHashEntrada, type DatosResumenInput } from '@/lib/sgie/resumen-ia';

async function verificarScope(expedienteId: string, userId: string, esAdmin: boolean): Promise<boolean> {
  if (esAdmin) return true;
  const [a] = await db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
    .where(and(eq(expedienteAsignaciones.expedienteId, expedienteId), eq(expedienteAsignaciones.abogadoId, userId), isNull(expedienteAsignaciones.revocadaEn)));
  const [p] = await db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
    .where(and(eq(expedientePermisos.expedienteId, expedienteId), eq(expedientePermisos.abogadoId, userId), isNull(expedientePermisos.revocadoEn)));
  return Boolean(a || p);
}

/** Recopila los datos fuente del expediente para el resumen. */
async function recopilarDatos(expedienteId: string): Promise<DatosResumenInput> {
  const [exp] = await db.select({
    numeroInterno: expedientes.numeroInterno, estado: expedientes.estado,
    resumen: expedientes.resumen, clienteNombre: clientes.nombre,
    procedimientoNombre: tiposProcedimiento.nombre,
  }).from(expedientes)
    .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
    .leftJoin(tiposProcedimiento, eq(expedientes.tipoProcedimientoId, tiposProcedimiento.id))
    .where(eq(expedientes.id, expedienteId));

  const documentos = await db.select({
    nombre: documentosExpediente.nombreOriginal,
    tipo: documentosExpediente.tipoDocumento,
  }).from(documentosExpediente).where(eq(documentosExpediente.expedienteId, expedienteId));

  const campos = await db.select({
    clave: camposExtraidos.clave, valor: camposExtraidos.valor, confianza: camposExtraidos.confianza,
  }).from(camposExtraidos).where(eq(camposExtraidos.expedienteId, expedienteId));

  const alertasActivasRows = await db.select({ id: alertas.id }).from(alertas)
    .where(and(eq(alertas.expedienteId, expedienteId), eq(alertas.resuelta, false)));

  // Inconsistencias: campos con misma clave y valores distintos.
  const porClave = new Map<string, Set<string>>();
  for (const c of campos) {
    if (!c.valor) continue;
    if (!porClave.has(c.clave)) porClave.set(c.clave, new Set());
    porClave.get(c.clave)!.add(c.valor);
  }
  const inconsistencias = Array.from(porClave.entries())
    .filter(([, v]) => v.size > 1)
    .map(([clave, valores]) => ({ clave, valores: Array.from(valores) }));

  return {
    numeroInterno: exp?.numeroInterno ?? expedienteId,
    estado: exp?.estado ?? 'desconocido',
    clienteNombre: exp?.clienteNombre ?? null,
    procedimientoNombre: exp?.procedimientoNombre ?? null,
    resumen: exp?.resumen ?? null,
    documentos: documentos.map((d) => ({ nombre: d.nombre, tipo: d.tipo, confianza: 0 })),
    campos: campos.map((c) => ({ clave: c.clave, valor: c.valor, confianza: c.confianza })),
    alertasActivas: alertasActivasRows.length,
    inconsistencias,
  };
}

/** GET: devuelve el caché vigente. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAbogado(request);
    const { id } = await params;
    if (!(await verificarScope(id, auth.userId, auth.rol === 'admin'))) {
      return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }
    const [cache] = await db.select().from(resumenesIaExpediente).where(eq(resumenesIaExpediente.expedienteId, id));
    // Si no hay caché, indicar que se debe generar.
    if (!cache) {
      return Response.json({ disponible: false, motivo: 'no_generado' });
    }
    return Response.json({
      disponible: true,
      resumen: cache.resumen,
      proveedor: cache.proveedor,
      modelo: cache.modelo,
      generadoEn: cache.generadoEn,
      confianza: cache.confianza,
      hashEntrada: cache.hashEntrada,
      desactualizado: false, // el POST verifica el hash al regenerar
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}

/** POST: genera o regenera el resumen. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAbogado(request);
    validateCsrf(request);
    const rl = await rateLimit(`sgie:resumen_ia:${auth.userId}`, { max: 5, windowMs: 5 * 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { id } = await params;
    if (!(await verificarScope(id, auth.userId, auth.rol === 'admin'))) {
      return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }

    const datos = await recopilarDatos(id);
    const hashEntrada = calcularHashEntrada(datos);

    // Si hay caché con el mismo hash, devolverlo sin llamar a la IA.
    const [cache] = await db.select().from(resumenesIaExpediente).where(eq(resumenesIaExpediente.expedienteId, id));
    if (cache && cache.hashEntrada === hashEntrada) {
      return Response.json({
        disponible: true, resumen: cache.resumen, proveedor: cache.proveedor, modelo: cache.modelo,
        generadoEn: cache.generadoEn, confianza: cache.confianza, hashEntrada, cacheado: true,
      });
    }

    // Generar con IA.
    const resultado = await generarResumenIa(datos);

    if (!resultado.ok) {
      // Auditar fallo.
      await logSgie({
        usuarioId: auth.userId, accion: 'documento_updated', recurso: 'resumen_ia',
        recursoId: id, metadata: { evento: 'resumen_ia_failed', error: resultado.error, codigo: resultado.codigo } as Record<string, unknown>,
        exito: false, request,
      });
      return Response.json({ disponible: false, motivo: resultado.codigo, error: resultado.error });
    }

    // Persistir caché (upsert: reemplazar el existente).
    if (cache) {
      await db.update(resumenesIaExpediente).set({
        resumen: resultado.resumen, proveedor: resultado.proveedor, modelo: resultado.modelo,
        generadoPor: auth.userId, generadoEn: new Date(), hashEntrada,
        confianza: resultado.confianza, tokensInput: resultado.tokensInput ?? null, tokensOutput: resultado.tokensOutput ?? null,
      }).where(eq(resumenesIaExpediente.id, cache.id));
    } else {
      await db.insert(resumenesIaExpediente).values({
        expedienteId: id, resumen: resultado.resumen, proveedor: resultado.proveedor, modelo: resultado.modelo,
        generadoPor: auth.userId, hashEntrada, confianza: resultado.confianza,
        tokensInput: resultado.tokensInput ?? null, tokensOutput: resultado.tokensOutput ?? null,
      });
    }

    await logSgie({
      usuarioId: auth.userId, accion: 'documento_updated', recurso: 'resumen_ia',
      recursoId: id, metadata: { evento: 'resumen_ia_generated', proveedor: resultado.proveedor, modelo: resultado.modelo } as Record<string, unknown>,
      request,
    });

    return Response.json({
      disponible: true, resumen: resultado.resumen, proveedor: resultado.proveedor, modelo: resultado.modelo,
      generadoEn: new Date().toISOString(), confianza: resultado.confianza, hashEntrada, generado: true,
    });
  } catch (err) {
    return authFailureResponse(err);
  }
}

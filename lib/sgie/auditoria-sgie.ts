/**
 * SGIE — wrapper de auditoría para acciones SGIE.
 *
 * Reutiliza `logAudit` (lib/audit.ts) sin duplicar la lógica de persistencia.
 * Centraliza el mapeo accion→enum y añade metadata SGIE consistente,
 * para que los endpoints no repitan este código.
 *
 * El enum `auditoria_accion` ya incluye los valores SGIE (expediente_*, cliente_*,
 * rol_updated, permiso_updated, etc.) — no se añaden nuevos valores aquí.
 */
import { logAudit } from '@/lib/audit';
import type { AuditoriaAccion } from '@/lib/schema';

export async function logSgie(params: {
  usuarioId: string;
  accion: AuditoriaAccion;
  recurso: string;
  recursoId?: string;
  metadata?: Record<string, unknown>;
  exito?: boolean;
  mensaje?: string;
  request?: Request;
}): Promise<void> {
  await logAudit({
    usuarioId: params.usuarioId,
    accion: params.accion,
    recurso: params.recurso,
    recursoId: params.recursoId,
    metadata: params.metadata,
    exito: params.exito,
    mensaje: params.mensaje,
    request: params.request,
  });
}

/**
 * Registra una entrada en el historial interno del expediente
 * (línea de tiempo del expediente, distinta de la auditoría transversal).
 * Ambas coexisten: `historial_expediente` es la línea de tiempo visible
 * en el cockpit; `auditoria_eventos` es el log transversal de gobernanza.
 */
import { db } from '@/lib/db';
import { historialExpediente } from '@/lib/schema';

export async function registrarHistorialExpediente(params: {
  expedienteId: string;
  accion: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  actorId?: string | null;
  actorTipo: 'abogado' | 'admin' | 'sistema';
  metadata?: Record<string, unknown>;
  mensaje?: string;
}): Promise<void> {
  await db.insert(historialExpediente).values({
    expedienteId: params.expedienteId,
    accion: params.accion,
    estadoAnterior: params.estadoAnterior ?? null,
    estadoNuevo: params.estadoNuevo ?? null,
    actorId: params.actorId ?? null,
    actorTipo: params.actorTipo,
    metadata: params.metadata ?? null,
    mensaje: params.mensaje ?? null,
  });
}

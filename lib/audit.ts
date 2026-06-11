import { db } from './db';
import { auditoriaEventos } from './schema';
import type { AuditoriaAccion, AuditoriaEventoInsert } from './schema';

export interface AuditOpts {
  usuarioId?: string | null;
  accion: AuditoriaAccion;
  recurso?: string;
  recursoId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  exito?: boolean;
  mensaje?: string;
}

export async function audit(opts: AuditOpts): Promise<void> {
  try {
    const row: AuditoriaEventoInsert = {
      usuarioId: opts.usuarioId ?? null,
      accion: opts.accion,
      recurso: opts.recurso ?? null,
      recursoId: opts.recursoId ?? null,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
      metadata: opts.metadata ?? null,
      exito: opts.exito ?? true,
      mensaje: opts.mensaje ?? null,
    };
    await db.insert(auditoriaEventos).values(row);
  } catch (e) {
    console.warn('[audit] no se pudo registrar evento:', opts.accion, e);
  }
}

export function ipFromRequest(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export function uaFromRequest(request: Request): string {
  return (request.headers.get('user-agent') || 'unknown').slice(0, 500);
}

export async function logAudit(params: {
  usuarioId: string;
  accion: AuditoriaAccion;
  recurso: string;
  recursoId?: string;
  metadata?: Record<string, unknown>;
  exito?: boolean;
  mensaje?: string;
  request?: Request;
}) {
  try {
    const ip = params.request ? ipFromRequest(params.request) : null;
    const userAgent = params.request ? uaFromRequest(params.request) : null;

    await db.insert(auditoriaEventos).values({
      usuarioId: params.usuarioId,
      accion: params.accion,
      recurso: params.recurso,
      recursoId: params.recursoId ?? null,
      ip,
      userAgent,
      metadata: params.metadata ?? null,
      exito: params.exito ?? true,
      mensaje: params.mensaje ?? null,
    });
  } catch {
    console.error('[audit] Error al registrar evento de auditoría');
  }
}

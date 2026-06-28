/**
 * SGIE — Búsqueda global (Sprint 1).
 *
 * Búsqueda textual segura con scope por abogado. Cubre clientes, expedientes,
 * documentos y tareas. NO es búsqueda semántica ni IA (pendiente de Sprint 3+).
 *
 * Referencia: auditoría SGIE §3 (buscador global ⌘K).
 *
 * Seguridad: scope aplicado en cada query. El admin ve todo; cada abogado sólo
 * sus clientes/expedientes/documentos/tareas. Devuelve payload pequeño y
 * homogéneo para renderizar resultados agrupados en la UI.
 */
import { db } from '@/lib/db';
import {
  clientes,
  expedientes,
  documentosExpediente,
  tareas,
  expedienteAsignaciones,
  expedientePermisos,
} from '@/lib/schema';
import { and, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import type { ContextoAbogado } from './expedientes-db';

export type TipoResultado = 'cliente' | 'expediente' | 'documento' | 'tarea';

export interface ResultadoBusqueda {
  id: string;
  tipo: TipoResultado;
  titulo: string;
  subtitulo: string | null;
  href: string;
  metadata: {
    estado?: string | null;
    prioridad?: string | null;
    numeroInterno?: string | null;
  };
}

export interface BuscarOpts {
  q: string;
  /** Límite por tipo (default 5). */
  porTipo?: number;
}

/**
 * Normaliza el término de búsqueda: trim + longitud mínima.
 * Devuelve null si el término no es buscable (vacío o muy corto).
 *
 * Función pura — testeable sin DB.
 */
export function normalizarTermino(q: string | null | undefined): string | null {
  if (!q) return null;
  const t = q.trim();
  if (t.length < 2) return null;
  return t;
}

/**
 * IDs de expedientes accesibles por el abogado. null = sin restricción (admin).
 */
async function idsExpedientesAccesibles(ctx: ContextoAbogado): Promise<string[] | null> {
  if (ctx.esAdmin) return null;
  const [asignados, permitidos] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, ctx.usuarioId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, ctx.usuarioId), isNull(expedientePermisos.revocadoEn))),
  ]);
  const ids = new Set<string>();
  [...asignados, ...permitidos].forEach((r) => ids.add(r.id));
  return Array.from(ids);
}

/**
 * Búsqueda global con scope. Devuelve resultados agrupados implícitamente por
 * `tipo` (el frontend agrupa al renderizar). Cada tipo respeta el scope del
 * abogado.
 */
export async function buscar(
  ctx: ContextoAbogado,
  opts: BuscarOpts,
): Promise<{ resultados: ResultadoBusqueda[]; total: number }> {
  const termino = normalizarTermino(opts.q);
  if (!termino) return { resultados: [], total: 0 };

  const porTipo = Math.min(Math.max(opts.porTipo ?? 5, 1), 20);
  const term = `%${termino}%`;
  const accesibles = await idsExpedientesAccesibles(ctx);

  const resultados: ResultadoBusqueda[] = [];

  // ── Clientes ────────────────────────────────────────────────────────────
  // El abogado sólo ve clientes que tengan expedientes accesibles para él.
  const clientesConds = [or(ilike(clientes.nombre, term), ilike(clientes.email, term), ilike(clientes.identidad, term), ilike(clientes.rtn, term))!];
  if (accesibles !== null) {
    if (accesibles.length === 0) {
      // Sin expedientes accesibles → sin clientes.
    } else {
      clientesConds.push(sql`EXISTS (
        SELECT 1 FROM expedientes e
        WHERE e.cliente_id = ${clientes.id}
          AND e.id IN (${sql.join(accesibles.map((id) => sql`${id}`), sql`, `)})
      )`);
    }
  }
  const cliRows = accesibles === null || accesibles.length > 0
    ? await db.select({
        id: clientes.id, nombre: clientes.nombre, identidad: clientes.identidad, rtn: clientes.rtn,
      }).from(clientes).where(and(...clientesConds)).limit(porTipo)
    : [];
  for (const c of cliRows) {
    resultados.push({
      id: c.id, tipo: 'cliente', titulo: c.nombre,
      subtitulo: c.identidad || c.rtn || null,
      href: `/intranet/sgie/clientes/${c.id}`,
      metadata: {},
    });
  }

  // Si el abogado no tiene expedientes accesibles, el resto de tipos no aplica.
  if (accesibles !== null && accesibles.length === 0) {
    return { resultados, total: resultados.length };
  }

  // ── Expedientes ──────────────────────────────────────────────────────────
  const expConds = [or(ilike(expedientes.numeroInterno, term), ilike(expedientes.resumen, term), ilike(clientes.nombre, term))!];
  if (accesibles !== null) expConds.push(inArray(expedientes.id, accesibles));
  const expRows = await db.select({
    id: expedientes.id, numeroInterno: expedientes.numeroInterno, estado: expedientes.estado, resumen: expedientes.resumen, clienteNombre: clientes.nombre,
  }).from(expedientes)
    .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
    .where(and(...expConds)).limit(porTipo);
  for (const e of expRows) {
    resultados.push({
      id: e.id, tipo: 'expediente', titulo: e.numeroInterno,
      subtitulo: e.clienteNombre || e.resumen?.slice(0, 80) || null,
      href: `/intranet/sgie/expedientes/${e.id}`,
      metadata: { estado: e.estado, numeroInterno: e.numeroInterno },
    });
  }

  // ── Documentos (requieren expediente accesible) ──────────────────────────
  if (accesibles === null || accesibles.length > 0) {
    const docConds = [or(ilike(documentosExpediente.nombreOriginal, term), ilike(documentosExpediente.tipoDocumento, term))!];
    if (accesibles !== null) docConds.push(inArray(documentosExpediente.expedienteId, accesibles));
    const docRows = await db.select({
      id: documentosExpediente.id, nombreOriginal: documentosExpediente.nombreOriginal,
      estado: documentosExpediente.estado, tipoDocumento: documentosExpediente.tipoDocumento,
      expedienteId: documentosExpediente.expedienteId,
    }).from(documentosExpediente).where(and(...docConds)).limit(porTipo);
    for (const d of docRows) {
      resultados.push({
        id: d.id, tipo: 'documento', titulo: d.nombreOriginal,
        subtitulo: d.tipoDocumento || null,
        href: `/intranet/sgie/documentos?expedienteId=${d.expedienteId}`,
        metadata: { estado: d.estado },
      });
    }

    // ── Tareas (requieren expediente accesible) ───────────────────────────
    const tarConds = [or(ilike(tareas.titulo, term), ilike(tareas.descripcion, term))!];
    if (accesibles !== null) tarConds.push(inArray(tareas.expedienteId, accesibles));
    const tarRows = await db.select({
      id: tareas.id, titulo: tareas.titulo, estado: tareas.estado, prioridad: tareas.prioridad,
    }).from(tareas).where(and(...tarConds)).limit(porTipo);
    for (const t of tarRows) {
      resultados.push({
        id: t.id, tipo: 'tarea', titulo: t.titulo,
        subtitulo: null,
        href: `/intranet/sgie/tareas`,
        metadata: { estado: t.estado, prioridad: t.prioridad },
      });
    }
  }

  return { resultados, total: resultados.length };
}

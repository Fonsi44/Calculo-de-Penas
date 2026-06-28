/**
 * GET /api/sgie/buscar/semantica?q=...
 *
 * Consulta inteligente híbrida: búsqueda textual con ranking por relevancia
 * (TF simple con boost de título). NO usa embeddings (no existen en el repo):
 * es ranking determinista y transparente, no semántica real ni IA.
 *
 * Si la IA está disponible, podría añadir un resumen de resultados (no aquí;
 * el resumen IA vive en /expedientes/[id]/resumen-ia para control R17).
 *
 * Seguridad: requireAbogado + scope por abogado. Aviso de "resultado asistido".
 *
 * Sprint 4 — tarea 5.
 */
import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  expedientes, clientes, documentosExpediente, tareas, camposExtraidos,
  expedienteAsignaciones, expedientePermisos,
} from '@/lib/schema';
import { and, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { rankear, type DocumentoBuscable } from '@/lib/sgie/busqueda-hibrida';
import { isEmbeddingsDisponible } from '@/lib/sgie/embeddings';

const querySchema = z.object({
  q: z.string().min(2).max(200),
  limite: z.coerce.number().int().min(1).max(30).default(15),
});

function ctx(auth: { userId: string; rol: string }) {
  return { usuarioId: auth.userId, rol: auth.rol, esAdmin: auth.rol === 'admin' };
}

async function idsAccesibles(usuarioId: string, esAdmin: boolean): Promise<string[] | null> {
  if (esAdmin) return null;
  const [asig, perm] = await Promise.all([
    db.select({ id: expedienteAsignaciones.expedienteId }).from(expedienteAsignaciones)
      .where(and(eq(expedienteAsignaciones.abogadoId, usuarioId), isNull(expedienteAsignaciones.revocadaEn))),
    db.select({ id: expedientePermisos.expedienteId }).from(expedientePermisos)
      .where(and(eq(expedientePermisos.abogadoId, usuarioId), isNull(expedientePermisos.revocadoEn))),
  ]);
  return Array.from(new Set([...asig.map((r) => r.id), ...perm.map((r) => r.id)]));
}

export async function GET(request: Request) {
  try {
    const auth = requireAbogado(request);
    const rl = await rateLimit(`sgie:semantica:${auth.userId}`, { max: 30, windowMs: 60_000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams.entries()));
    const accesibles = await idsAccesibles(auth.userId, auth.rol === 'admin');

    if (accesibles !== null && accesibles.length === 0) {
      return Response.json({ resultados: [], total: 0, aviso: 'Sin expedientes accesibles.' });
    }

    // Recopilar candidatos con búsqueda textual amplia (ILIKE) + scope.
    const term = `%${query.q}%`;
    const candidatos: DocumentoBuscable[] = [];

    // Expedientes.
    const expConds = [or(ilike(expedientes.numeroInterno, term), ilike(expedientes.resumen, term), ilike(clientes.nombre, term))!];
    if (accesibles) expConds.push(inArray(expedientes.id, accesibles));
    const expRows = await db.select({
      id: expedientes.id, numeroInterno: expedientes.numeroInterno, resumen: expedientes.resumen,
      clienteNombre: clientes.nombre, estado: expedientes.estado,
    }).from(expedientes)
      .leftJoin(clientes, eq(expedientes.clienteId, clientes.id))
      .where(and(...expConds)).limit(50);
    for (const e of expRows) {
      candidatos.push({
        id: e.id, tipo: 'expediente', titulo: e.numeroInterno,
        subtitulo: e.clienteNombre ?? null, cuerpo: e.resumen ?? null,
        href: `/intranet/sgie/expedientes/${e.id}`,
      });
    }

    // Documentos (si hay accesibles).
    if (accesibles === null || accesibles.length > 0) {
      const docConds = [or(ilike(documentosExpediente.nombreOriginal, term), ilike(documentosExpediente.tipoDocumento, term))!];
      if (accesibles) docConds.push(inArray(documentosExpediente.expedienteId, accesibles));
      const docRows = await db.select({
        id: documentosExpediente.id, nombre: documentosExpediente.nombreOriginal,
        tipo: documentosExpediente.tipoDocumento, expedienteId: documentosExpediente.expedienteId,
      }).from(documentosExpediente).where(and(...docConds)).limit(30);
      for (const d of docRows) {
        candidatos.push({
          id: d.id, tipo: 'documento', titulo: d.nombre,
          subtitulo: d.tipo ?? null, cuerpo: null,
          href: `/intranet/sgie/documentos?expedienteId=${d.expedienteId}`,
        });
      }

      // Tareas.
      const tarConds = [or(ilike(tareas.titulo, term), ilike(tareas.descripcion, term))!];
      if (accesibles) tarConds.push(inArray(tareas.expedienteId, accesibles));
      const tarRows = await db.select({ id: tareas.id, titulo: tareas.titulo, descripcion: tareas.descripcion })
        .from(tareas).where(and(...tarConds)).limit(20);
      for (const t of tarRows) {
        candidatos.push({
          id: t.id, tipo: 'tarea', titulo: t.titulo, subtitulo: null, cuerpo: t.descripcion,
          href: '/intranet/sgie/tareas',
        });
      }
    }

    // Rankear por relevancia.
    const resultados = rankear(candidatos, query.q).slice(0, query.limite);

    // Sprint 5 — informar honestamente si hay semántica real (embeddings) o
    // sólo ranking textual. Hoy: ranking textual (sin pgvector/proveedor).
    const semanticaReal = isEmbeddingsDisponible();

    return Response.json({
      resultados,
      total: resultados.length,
      semanticaReal,
      aviso: semanticaReal
        ? 'Resultado asistido por similitud vectorial; verificar fuente original.'
        : 'Resultado asistido por ranking textual (semántica real pendiente de infraestructura); verificar fuente original.',
    });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

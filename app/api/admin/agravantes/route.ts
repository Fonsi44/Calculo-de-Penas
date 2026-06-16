import { db } from '@/lib/db';
import { agravantesEspecificas, supuestosPenales, delitos } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { and, eq, asc, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const createSchema = z.object({
  supuesto_penal_id: z.string().uuid(),
  articulo_cp: z.string().min(1).max(100),
  numeral: z.string().max(50).nullable().optional(),
  literal: z.string().max(50).nullable().optional(),
  texto_agravante: z.string().min(1),
  fraccion_aumento: z.string().min(1).max(20).regex(/^\d+\s*\/\s*\d+$/, 'Fracción inválida (formato: 1/3)'),
  obligatoria: z.boolean().default(false),
});

/**
 * GET /api/admin/agravantes
 *
 * Lista todas las agravantes específicas con el supuesto penal y delito
 * vinculados (join). Permite filtrar por supuesto_penal_id o articulo_cp.
 *
 * Requiere rol admin. Uso interno del bufete.
 */
export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const supuestoId = searchParams.get('supuesto_penal_id');
    const articulo = searchParams.get('articulo_cp');

    const conditions: SQL[] = [];
    if (supuestoId) conditions.push(eq(agravantesEspecificas.supuestoPenalId, supuestoId));
    if (articulo) conditions.push(eq(agravantesEspecificas.articuloCp, articulo));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Join agravantes → supuestos_penales → delitos para mostrar contexto.
    const rows = await db
      .select({
        agravante: agravantesEspecificas,
        supuesto: supuestosPenales,
        delito: delitos,
      })
      .from(agravantesEspecificas)
      .innerJoin(supuestosPenales, eq(agravantesEspecificas.supuestoPenalId, supuestosPenales.id))
      .innerJoin(delitos, eq(supuestosPenales.delitoId, delitos.id))
      .where(where)
      .orderBy(asc(delitos.articulo), asc(agravantesEspecificas.numeral));

    const resultado = rows.map(r => ({
      id: r.agravante.id,
      supuesto_penal_id: r.agravante.supuestoPenalId,
      articulo_cp: r.agravante.articuloCp,
      numeral: r.agravante.numeral,
      literal: r.agravante.literal,
      texto_agravante: r.agravante.textoAgravante,
      fraccion_aumento: r.agravante.fraccionAumento,
      obligatoria: r.agravante.obligatoria ?? false,
      creado_en: r.agravante.creadoEn,
      supuesto_penal: {
        id: r.supuesto.id,
        texto_modalidad: r.supuesto.textoModalidad,
        pena_min_meses: r.supuesto.penaMinMeses,
        pena_max_meses: r.supuesto.penaMaxMeses,
      },
      delito: {
        id: r.delito.id,
        nombre: r.delito.nombre,
        articulo: r.delito.articulo,
      },
    }));

    return Response.json({ agravantes: resultado });
  } catch (err) {
    return authFailureResponse(err);
  }
}

/**
 * POST /api/admin/agravantes
 *
 * Crea una nueva agravante específica vinculada a un supuesto penal.
 */
export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`agravante:create:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json();
    const parsed = createSchema.parse(body);

    // Verificar que el supuesto penal existe.
    const [supuesto] = await db.select().from(supuestosPenales).where(eq(supuestosPenales.id, parsed.supuesto_penal_id));
    if (!supuesto) {
      return Response.json({ error: 'Supuesto penal no encontrado' }, { status: 404 });
    }

    const [entry] = await db.insert(agravantesEspecificas).values({
      supuestoPenalId: parsed.supuesto_penal_id,
      articuloCp: parsed.articulo_cp,
      numeral: parsed.numeral ?? null,
      literal: parsed.literal ?? null,
      textoAgravante: parsed.texto_agravante,
      fraccionAumento: parsed.fraccion_aumento,
      obligatoria: parsed.obligatoria,
    }).returning();

    await logAudit({
      usuarioId: auth.userId,
      accion: 'agravante_especifica_created',
      recurso: 'agravantes_especificas',
      recursoId: entry.id,
      metadata: { articulo_cp: entry.articuloCp, supuesto_penal_id: entry.supuestoPenalId },
      request,
    });

    return Response.json({ agravante: entry }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

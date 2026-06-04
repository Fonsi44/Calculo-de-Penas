import { db } from '@/lib/db';
import { calculos, casos, delitos } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, authFailureResponse } from '@/lib/auth';
import { getEstadoDelito } from '@/lib/estados-delitos';

interface StoredConfig {
  delito_id: string;
  pena_seleccionada?: string;
  variables_activas?: string[];
  grado_autoria?: string;
  grado_ejecucion?: string;
  reduccion_tentativa?: number;
  agravantes?: string[];
  atenuantes?: string[];
  eximentes?: string[];
  eximente_completa?: string | null;
  [key: string]: unknown;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;

    const [calculo] = await db.select().from(calculos).where(eq(calculos.id, id));
    if (!calculo) {
      return new Response(JSON.stringify({ error: 'Cálculo no encontrado' }), { status: 404 });
    }

    const [caso] = await db.select({ id: casos.id, usuarioId: casos.usuarioId, titulo: casos.titulo })
      .from(casos).where(eq(casos.id, calculo.casoId));
    if (!caso || caso.usuarioId !== user.userId) {
      return new Response(JSON.stringify({ error: 'Sin permiso sobre este cálculo' }), { status: 403 });
    }

    const storedConfig = calculo.config as unknown as StoredConfig[];
    const delitoIds = storedConfig.map(c => c.delito_id).filter(Boolean);

    let enrichedConfig: unknown[] = [];
    if (delitoIds.length > 0) {
      const rows = await db.select().from(delitos);
      const byId = new Map(rows.map(r => [r.id, r]));
      enrichedConfig = storedConfig.map(c => {
        const row = byId.get(c.delito_id);
        if (!row) return { ...c, delito: null };
        const estado = getEstadoDelito(row.nombre, row.articulo);
        return {
          delito_id: c.delito_id,
          pena_seleccionada: c.pena_seleccionada ?? 'prision',
          variables_activas: c.variables_activas ?? [],
          grado_autoria: c.grado_autoria ?? 'autor_directo',
          grado_ejecucion: c.grado_ejecucion ?? 'consumado',
          reduccion_tentativa: c.reduccion_tentativa ?? 1,
          agravantes: c.agravantes ?? [],
          atenuantes: c.atenuantes ?? [],
          eximentes: c.eximentes ?? [],
          eximente_completa: c.eximente_completa ?? null,
          delito: {
            id: row.id,
            nombre: row.nombre,
            articulo: row.articulo,
            conducta: row.conducta,
            rama_id: row.ramaId,
            constitucion_articulo_id: row.constitucionArticuloId,
            clasificacion: row.clasificacion,
            pena_minima_meses: row.penaMinimaMeses,
            pena_maxima_meses: row.penaMaximaMeses,
            pena_alternativa_min: row.penaAlternativaMin,
            pena_alternativa_max: row.penaAlternativaMax,
            tiene_pena_alternativa: row.tienePenaAlternativa,
            penas_accesorias: row.penasAccesorias || [],
            observaciones: row.observaciones,
            es_grave: row.esGrave,
            estado: estado.estado,
            estado_nota: estado.nota,
            estado_articulo_sugerido: estado.articulo_sugerido,
          },
        };
      });
    }

    return new Response(JSON.stringify({
      id: calculo.id,
      casoId: calculo.casoId,
      casoTitulo: caso.titulo,
      creadoEn: calculo.creadoEn,
      config: enrichedConfig,
      resultado: calculo.resultado,
    }), { status: 200 });
  } catch (e) {
    return authFailureResponse(e);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    const { id } = await params;

    const [calculo] = await db.select({ id: calculos.id, casoId: calculos.casoId })
      .from(calculos).where(eq(calculos.id, id));
    if (!calculo) {
      return new Response(JSON.stringify({ error: 'Cálculo no encontrado' }), { status: 404 });
    }

    const [caso] = await db.select({ id: casos.id, usuarioId: casos.usuarioId })
      .from(casos).where(eq(casos.id, calculo.casoId));
    if (!caso || caso.usuarioId !== user.userId) {
      return new Response(JSON.stringify({ error: 'Sin permiso sobre este cálculo' }), { status: 403 });
    }

    await db.delete(calculos).where(eq(calculos.id, id));
    return new Response(JSON.stringify({ message: 'Cálculo eliminado' }), { status: 200 });
  } catch (e) {
    return authFailureResponse(e);
  }
}

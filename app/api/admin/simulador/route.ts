import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { tiposProcedimiento } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { validateCsrf } from '@/lib/csrf';

const simSchema = z.object({
  procedimientoId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    validateCsrf(request);
    const body = simSchema.parse(await request.json());

    const [proc] = await db
      .select()
      .from(tiposProcedimiento)
      .where(eq(tiposProcedimiento.id, body.procedimientoId))
      .limit(1);

    if (!proc) {
      return Response.json({ error: 'Procedimiento no encontrado' }, { status: 404 });
    }

    const def = proc.definicion as Record<string, unknown> | null;
    const requisitos = (def?.requisitos as Array<{ nombre?: string }> | undefined) ?? [];
    const numFases = Math.min(requisitos.length + 2, 6);

    const fases = Array.from({ length: numFases }, (_, i) => ({
      id: `f${i + 1}`,
      nombre: i === 0 ? 'Inicio' : i === numFases - 1 ? 'Cierre' : `Fase ${i + 1}`,
      orden: i + 1,
      requisitos: requisitos.slice(i * 2, i * 2 + 2).map((r: Record<string, unknown>) => String(r.nombre ?? `Requisito ${i * 2 + 1}`)),
      duracionEstimada: `${5 + ((i + 1) * 7 + requisitos.length * 3) % 20} min`,
    }));

    const tareasSimuladas = fases.flatMap((f) => [
      { id: `t-${f.id}-1`, nombre: `Procesar ${f.nombre}`, fase: f.nombre, responsable: 'Sistema' },
      { id: `t-${f.id}-2`, nombre: `Validar ${f.nombre}`, fase: f.nombre, responsable: 'Abogado' },
    ]);

    const comunicaciones = [
      { id: 'c1', tipo: 'Email', origen: 'Inicio', destino: 'Cliente', plantilla: 'confirmacion_inicio' },
      { id: 'c2', tipo: 'Notificación', origen: fases[Math.min(1, fases.length - 1)].nombre, destino: 'Abogado', plantilla: 'progreso' },
      { id: 'c3', tipo: 'Email', origen: 'Cierre', destino: 'Cliente', plantilla: 'finalizacion' },
    ];

    const transiciones = fases.slice(0, -1).map((f, i) => ({
      id: `tr${i + 1}`,
      desde: f.nombre,
      hacia: fases[i + 1].nombre,
      condicion: `Todos los requisitos de ${f.nombre} completados`,
    }));

    const bloqueos = [
      { id: 'b1', fase: fases[Math.min(1, fases.length - 1)].nombre, razon: 'Documentación incompleta', criticidad: 'medio' as const },
      { id: 'b2', fase: fases[Math.min(2, fases.length - 1)].nombre, razon: 'Validación pendiente', criticidad: 'bajo' as const },
    ];

    return Response.json({
      mode: 'deterministic-preview',
      procedimiento: proc.nombre,
      version: `v${proc.version}`,
      duracionTotal: `${Math.round(20 + requisitos.length * 10)} min estimados`,
      fases,
      tareas: tareasSimuladas,
      comunicaciones,
      transiciones,
      bloqueos,
      loops: [
        `${fases[Math.min(1, fases.length - 1)].nombre} → ${fases[Math.min(2, fases.length - 1)].nombre} (si validación falla, retorna)`,
      ],
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

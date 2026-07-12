import { requireAbogado, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { caseReadinessRuns, caseReadinessChecks, expedienteAsignaciones } from '@/lib/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

/** GET /api/sgie/expedientes/:id/readiness */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAbogado(req); const { id } = await params;
    if (auth.rol !== 'admin') {
      const [a] = await db.select({ id: expedienteAsignaciones.id }).from(expedienteAsignaciones)
        .where(and(eq(expedienteAsignaciones.expedienteId, id), eq(expedienteAsignaciones.abogadoId, auth.userId), isNull(expedienteAsignaciones.revocadaEn)));
      if (!a) return Response.json({ error: 'Sin acceso' }, { status: 403 });
    }
    const [run] = await db.select().from(caseReadinessRuns).where(eq(caseReadinessRuns.expedienteId, id)).orderBy(desc(caseReadinessRuns.createdAt)).limit(1);
    if (!run) return Response.json({ readiness: null });
    const checks = await db.select().from(caseReadinessChecks).where(eq(caseReadinessChecks.runId, run.id));
    return Response.json({ readiness: { ...run, checks } });
  } catch (e) { return authFailureResponse(e); }
}

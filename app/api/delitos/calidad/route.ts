import { getResumenEstados } from '@/lib/estados-delitos';

export async function GET() {
  const r = getResumenEstados();
  return Response.json({
    verificados: r.verificados,
    pendientes: r.pendientes_revision,
    rechazados: r.rechazados,
    total: r.total,
    generado_en: r.generado_en,
  });
}

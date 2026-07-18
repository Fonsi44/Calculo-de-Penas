import { rejillaMes, rejillaSemana } from './calendario';

export function visibleAgendaRange(reference: Date, view: 'mes' | 'semana'): { desde: Date; hasta: Date } {
  const days = view === 'mes'
    ? rejillaMes(reference.getFullYear(), reference.getMonth())
    : rejillaSemana(reference);
  const desde = new Date(days[0].fecha);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(days[days.length - 1].fecha);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

export function buildAgendaQuery(reference: Date, view: 'mes' | 'semana', page = 1): string {
  const { desde, hasta } = visibleAgendaRange(reference, view);
  return new URLSearchParams({
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    page: String(page),
    limit: '100',
  }).toString();
}

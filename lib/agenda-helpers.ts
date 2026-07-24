import { ForbiddenError, ValidationError } from '@/lib/http-errors';

export function resolveEventMutationScope(
  current: { visibilidad: 'privado' | 'expediente' | 'equipo'; expedienteId: string | null },
  update: { visibilidad?: 'privado' | 'expediente' | 'equipo'; expedienteId?: string | null },
  canManageTeam: boolean,
) {
  const visibilidad = update.visibilidad ?? current.visibilidad;
  const expedienteId = update.expedienteId === undefined ? current.expedienteId : update.expedienteId;
  if (visibilidad === 'equipo' && !canManageTeam) {
    throw new ForbiddenError('Falta la capacidad calendar.manage_team');
  }
  if (visibilidad === 'expediente' && !expedienteId) {
    throw new ValidationError('La visibilidad de expediente requiere expediente');
  }
  return { visibilidad, expedienteId };
}

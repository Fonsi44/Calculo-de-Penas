import { and, count, eq, gt, inArray, isNull, lt, notInArray, or } from 'drizzle-orm';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db, isDbConfigured } from '@/lib/db';
import {
  alertas,
  eventosAgenda,
  expedientes,
  invitaciones,
  jobsSgie,
  usuarios,
  usuariosSgie,
} from '@/lib/schema';
import { isEmailConfigured } from '@/lib/email';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const now = new Date();
    const [
      [activeUsers], [sgieLawyers], [pendingInvites], [expiredInvites], [suspendedUsers],
      [activeCases], [unassignedCases], [upcomingEvents], [pendingJobs], [failedJobs], [activeAlerts],
    ] = await Promise.all([
      db.select({ value: count() }).from(usuarios).where(and(eq(usuarios.active, true), eq(usuarios.bloqueado, false))),
      db.select({ value: count() }).from(usuariosSgie).innerJoin(usuarios, eq(usuarios.id, usuariosSgie.usuarioId))
        .where(and(eq(usuariosSgie.activoSgie, true), eq(usuarios.active, true), eq(usuarios.bloqueado, false))),
      db.select({ value: count() }).from(invitaciones).where(and(eq(invitaciones.estado, 'pendiente'), gt(invitaciones.expiraEn, now))),
      db.select({ value: count() }).from(invitaciones).where(or(eq(invitaciones.estado, 'expirada'), and(eq(invitaciones.estado, 'pendiente'), lt(invitaciones.expiraEn, now)))),
      db.select({ value: count() }).from(usuarios).where(eq(usuarios.bloqueado, true)),
      db.select({ value: count() }).from(expedientes).where(notInArray(expedientes.estado, ['finalizado', 'archivado'])),
      db.select({ value: count() }).from(expedientes).where(and(isNull(expedientes.responsableId), notInArray(expedientes.estado, ['finalizado', 'archivado']))),
      db.select({ value: count() }).from(eventosAgenda).where(and(gt(eventosAgenda.inicio, now), notInArray(eventosAgenda.estado, ['cancelada', 'descartada', 'completada']))),
      db.select({ value: count() }).from(jobsSgie).where(inArray(jobsSgie.estado, ['pendiente', 'en_proceso'])),
      db.select({ value: count() }).from(jobsSgie).where(eq(jobsSgie.estado, 'fallido')),
      db.select({ value: count() }).from(alertas).where(eq(alertas.resuelta, false)),
    ]);

    return Response.json({
      metrics: {
        activeUsers: Number(activeUsers?.value ?? 0),
        sgIeLawyers: Number(sgieLawyers?.value ?? 0),
        pendingInvitations: Number(pendingInvites?.value ?? 0),
        expiredInvitations: Number(expiredInvites?.value ?? 0),
        suspendedUsers: Number(suspendedUsers?.value ?? 0),
        activeCases: Number(activeCases?.value ?? 0),
        unassignedCases: Number(unassignedCases?.value ?? 0),
        upcomingEvents: Number(upcomingEvents?.value ?? 0),
        pendingJobs: Number(pendingJobs?.value ?? 0),
        failedJobs: Number(failedJobs?.value ?? 0),
        activeAlerts: Number(activeAlerts?.value ?? 0),
      },
      dependencies: {
        database: { status: isDbConfigured() ? 'verificado' : 'no_configurado' },
        resend: { status: isEmailConfigured() ? 'configurado_no_verificado' : 'no_configurado' },
        automations: { status: process.env.CRON_SECRET ? 'configurado_no_verificado' : 'no_configurado' },
      },
    });
  } catch (error) {
    return authFailureResponse(error);
  }
}

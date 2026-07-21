import assert from 'node:assert/strict';
import { and, eq, like, or } from 'drizzle-orm';
import { db, closeDb } from '@/lib/db';
import {
  aceptacionesLegales,
  auditoriaEventos,
  clientes,
  eventosAgenda,
  expedienteAsignaciones,
  expedientes,
  historialExpediente,
  invitaciones,
  permisos,
  requisitosExpediente,
  roles,
  usuarios,
  usuariosCapacidades,
  usuariosRoles,
  usuariosSgie,
} from '@/lib/schema';
import {
  createInvitation,
  hashInvitationToken,
  inspectInvitation,
  resendInvitation,
  revokeInvitation,
} from '@/lib/invitations';
import { assertCapability, assertSgieAccess, canAccessCase } from '@/lib/access-service';
import { crearExpediente } from '@/lib/sgie/expedientes-db';
import { hashPassword, signToken } from '@/lib/auth';
import { POST as acceptInvitationRoute } from '@/app/api/auth/invitaciones/[token]/route';
import { GET as agendaGet, POST as agendaPost } from '@/app/api/sgie/agenda/route';
import { PATCH as agendaPatch } from '@/app/api/sgie/agenda/[id]/route';

const IDS = {
  admin: 'f1000000-0000-4000-a000-000000000001',
  lawyerB: 'f1000000-0000-4000-a000-000000000003',
};
const PREFIX = 'fase1-e2e-';
const PASSWORD = 'Fase1Integration123!';

Object.assign(process.env, { NODE_ENV: 'test' });
process.env.ALLOW_TEST_EMAILS = 'true';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.RESEND_API_KEY = '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'fase1-integration-jwt-secret-0123456789abcdef';

function tokenFromUrl(url: string | undefined): string {
  assert.ok(url, 'La invitación de test debe devolver activationUrl');
  return decodeURIComponent(url.split('/').at(-1)!);
}

function request(url: string, method: string, body: unknown, token?: string): Request {
  return new Request(url, {
    method,
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      ...(token ? { cookie: `token=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function cleanup() {
  const testUsers = await db.select({ id: usuarios.id }).from(usuarios)
    .where(like(usuarios.email, `${PREFIX}%`));
  const userIds = testUsers.map((row) => row.id);
  const testCases = await db.select({ id: expedientes.id }).from(expedientes)
    .where(like(expedientes.numeroInterno, 'F1-E2E-%'));
  const caseIds = testCases.map((row) => row.id);

  await db.delete(invitaciones).where(like(invitaciones.email, `${PREFIX}%`));
  for (const caseId of caseIds) {
    await db.delete(eventosAgenda).where(eq(eventosAgenda.expedienteId, caseId));
    await db.delete(requisitosExpediente).where(eq(requisitosExpediente.expedienteId, caseId));
    await db.delete(historialExpediente).where(eq(historialExpediente.expedienteId, caseId));
    await db.delete(expedienteAsignaciones).where(eq(expedienteAsignaciones.expedienteId, caseId));
    await db.delete(auditoriaEventos).where(eq(auditoriaEventos.recursoId, caseId));
    await db.delete(expedientes).where(eq(expedientes.id, caseId));
  }
  for (const userId of userIds) {
    await db.delete(usuariosCapacidades).where(or(
      eq(usuariosCapacidades.usuarioId, userId),
      eq(usuariosCapacidades.concedidoPor, userId),
    ));
  }
  for (const userId of userIds) {
    await db.delete(eventosAgenda).where(eq(eventosAgenda.propietarioId, userId));
    await db.delete(usuariosRoles).where(eq(usuariosRoles.usuarioId, userId));
    await db.delete(aceptacionesLegales).where(eq(aceptacionesLegales.usuarioId, userId));
    await db.delete(usuariosSgie).where(eq(usuariosSgie.usuarioId, userId));
    await db.update(invitaciones).set({ usuarioId: null }).where(eq(invitaciones.usuarioId, userId));
    await db.delete(auditoriaEventos).where(eq(auditoriaEventos.usuarioId, userId));
    await db.delete(usuarios).where(eq(usuarios.id, userId));
  }
  await db.delete(clientes).where(like(clientes.email, `${PREFIX}%`));
}

async function main() {
  await cleanup();
  const passwordHash = await hashPassword(PASSWORD);
  await db.insert(usuarios).values({
    id: IDS.admin,
    email: `${PREFIX}admin@test.local`,
    nombre: 'Admin Fase 1',
    passwordHash,
    rol: 'admin',
    active: true,
    bloqueado: false,
  }).onConflictDoUpdate({
    target: usuarios.id,
    set: { active: true, bloqueado: false, passwordHash },
  });

  const invitation = await createInvitation({
    email: `${PREFIX}lawyer-a@test.local`,
    nombre: 'Abogado A Fase 1',
    rolInicial: 'abogado',
    accesoSgie: true,
    capacidades: ['cases.assign'],
    creadaPor: IDS.admin,
  });
  assert.equal(invitation.emailEstado, 'no_configurado');
  const token = tokenFromUrl(invitation.activationUrl);
  const [stored] = await db.select().from(invitaciones).where(eq(invitaciones.id, invitation.id));
  assert.equal(stored.tokenHash, hashInvitationToken(token));
  assert.equal(stored.tokenHash.length, 64);
  assert.ok(!JSON.stringify(stored).includes(token));
  assert.ok(stored.expiraEn > new Date());

  const accepts = await Promise.all(Array.from({ length: 8 }, (_, index) =>
    acceptInvitationRoute(
      request(`http://localhost:3000/api/auth/invitaciones/${token}`, 'POST',
        { password: PASSWORD, termsAccepted: true }),
      { params: Promise.resolve({ token }) },
    ).then(async (response) => ({ status: response.status, body: await response.json(), index })),
  ));
  const successCount = accepts.filter((result) => result.status === 200).length;
  if (successCount !== 1) {
    console.error('Acceptance failed:', JSON.stringify(accepts, null, 2));
  }
  assert.equal(successCount, 1);
  assert.equal(accepts.filter((result) => result.status === 409).length, 7);

  const [accepted] = await db.select().from(invitaciones).where(eq(invitaciones.id, invitation.id));
  assert.equal(accepted.estado, 'aceptada');
  assert.ok(accepted.usuarioId);
  const lawyerA = accepted.usuarioId!;
  const [profile] = await db.select().from(usuariosSgie).where(eq(usuariosSgie.usuarioId, lawyerA));
  assert.equal(profile.activoSgie, true);
  assert.equal((await db.select().from(usuariosRoles).where(eq(usuariosRoles.usuarioId, lawyerA))).length, 1);
  assert.equal((await db.select().from(auditoriaEventos).where(and(
    eq(auditoriaEventos.usuarioId, lawyerA),
    eq(auditoriaEventos.accion, 'invitacion_accepted'),
  ))).length, 1);
  assert.equal((await inspectInvitation(token)).valid, false);

  const revoked = await createInvitation({
    email: `${PREFIX}revoked@test.local`, nombre: 'Revocado', rolInicial: 'abogado',
    accesoSgie: true, creadaPor: IDS.admin,
  });
  const revokedToken = tokenFromUrl(revoked.activationUrl);
  await revokeInvitation(revoked.id);
  assert.equal((await inspectInvitation(revokedToken)).estado, 'revocada');

  const expired = await createInvitation({
    email: `${PREFIX}expired@test.local`, nombre: 'Expirado', rolInicial: 'abogado',
    accesoSgie: true, creadaPor: IDS.admin,
  });
  const expiredToken = tokenFromUrl(expired.activationUrl);
  await db.update(invitaciones).set({ expiraEn: new Date(Date.now() - 1000) })
    .where(eq(invitaciones.id, expired.id));
  assert.equal((await inspectInvitation(expiredToken)).estado, 'expirada');

  const resendBase = await createInvitation({
    email: `${PREFIX}resend@test.local`, nombre: 'Reenvío', rolInicial: 'abogado',
    accesoSgie: true, creadaPor: IDS.admin,
  });
  const oldToken = tokenFromUrl(resendBase.activationUrl);
  const resent = await resendInvitation(resendBase.id, IDS.admin);
  assert.equal((await inspectInvitation(oldToken)).valid, false);
  assert.equal((await inspectInvitation(tokenFromUrl(resent.activationUrl))).valid, true);

  await db.insert(usuarios).values({
    id: IDS.lawyerB,
    email: `${PREFIX}lawyer-b@test.local`,
    nombre: 'Abogado B Fase 1',
    passwordHash,
    rol: 'abogado',
    active: true,
    bloqueado: false,
  });
  await db.insert(usuariosSgie).values({ usuarioId: IDS.lawyerB, activoSgie: true });

  await assertSgieAccess(lawyerA);
  await db.update(usuariosSgie).set({ activoSgie: false }).where(eq(usuariosSgie.usuarioId, lawyerA));
  await assert.rejects(() => assertSgieAccess(lawyerA));
  await db.update(usuariosSgie).set({ activoSgie: true }).where(eq(usuariosSgie.usuarioId, lawyerA));
  await assertSgieAccess(lawyerA);
  await db.update(usuarios).set({ bloqueado: true }).where(eq(usuarios.id, lawyerA));
  await assert.rejects(() => assertSgieAccess(lawyerA));
  await db.update(usuarios).set({ bloqueado: false }).where(eq(usuarios.id, lawyerA));

  const [assignPermission] = await db.select().from(permisos)
    .where(and(eq(permisos.recurso, 'cases'), eq(permisos.accion, 'assign')));
  await assertCapability(lawyerA, 'cases.assign');
  await db.update(usuariosCapacidades).set({ permitido: false }).where(and(
    eq(usuariosCapacidades.usuarioId, lawyerA),
    eq(usuariosCapacidades.permisoId, assignPermission.id),
  ));
  await assert.rejects(() => assertCapability(lawyerA, 'cases.assign'));
  await db.update(usuariosCapacidades).set({ permitido: true }).where(and(
    eq(usuariosCapacidades.usuarioId, lawyerA),
    eq(usuariosCapacidades.permisoId, assignPermission.id),
  ));

  const good = await crearExpediente({
    numeroInterno: `F1-E2E-${Date.now()}`,
    responsableId: lawyerA,
    requisitosIniciales: [{ nombre: 'Identificación sintética' }],
  }, { usuarioId: IDS.admin, esAdmin: true, rol: 'admin' });
  assert.equal((await db.select().from(expedienteAsignaciones)
    .where(eq(expedienteAsignaciones.expedienteId, good.id))).length, 1);
  assert.equal((await db.select().from(requisitosExpediente)
    .where(eq(requisitosExpediente.expedienteId, good.id))).length, 1);
  assert.equal((await db.select().from(historialExpediente)
    .where(eq(historialExpediente.expedienteId, good.id))).length, 1);
  assert.equal(await canAccessCase(lawyerA, good.id), true);
  assert.equal(await canAccessCase(IDS.lawyerB, good.id), false);

  const rollbackNumber = `F1-E2E-ROLLBACK-${Date.now()}`;
  await assert.rejects(() => crearExpediente({
    numeroInterno: rollbackNumber,
    responsableId: lawyerA,
    requisitosIniciales: [{ nombre: 'x'.repeat(500) }],
  }, { usuarioId: IDS.admin, esAdmin: true, rol: 'admin' }));
  assert.equal((await db.select().from(expedientes)
    .where(eq(expedientes.numeroInterno, rollbackNumber))).length, 0);

  const personal = await agendaPost(
    request('http://localhost:3000/api/sgie/agenda', 'POST', {
      titulo: 'Evento personal Fase 1',
      inicio: '2026-07-20T15:00:00.000Z',
      fin: '2026-07-20T16:00:00.000Z',
      tipo: 'personal',
      visibilidad: 'privado',
      zonaHoraria: 'America/Tegucigalpa',
    }, signToken({ userId: lawyerA, email: `${PREFIX}lawyer-a@test.local`, rol: 'abogado' })),
  );
  assert.equal(personal.status, 201);
  const personalBody = await personal.json();
  const eventId = personalBody.evento.id as string;
  const [event] = await db.select().from(eventosAgenda).where(eq(eventosAgenda.id, eventId));
  assert.equal(event.propietarioId, lawyerA);
  assert.equal(event.zonaHoraria, 'America/Tegucigalpa');

  const tokenA = signToken({ userId: lawyerA, email: `${PREFIX}lawyer-a@test.local`, rol: 'abogado' });
  const tokenB = signToken({ userId: IDS.lawyerB, email: `${PREFIX}lawyer-b@test.local`, rol: 'abogado' });
  const denied = await agendaPatch(
    request(`http://localhost:3000/api/sgie/agenda/${eventId}`, 'PATCH',
      { titulo: 'Intrusión', version: event.version }, tokenB),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(denied.status, 403);

  const concurrent = await Promise.all([
    agendaPatch(request(`http://localhost:3000/api/sgie/agenda/${eventId}`, 'PATCH',
      { titulo: 'Cambio A', version: event.version }, tokenA), { params: Promise.resolve({ id: eventId }) }),
    agendaPatch(request(`http://localhost:3000/api/sgie/agenda/${eventId}`, 'PATCH',
      { titulo: 'Cambio B', version: event.version }, tokenA), { params: Promise.resolve({ id: eventId }) }),
  ]);
  assert.equal(concurrent.filter((response) => response.status === 200).length, 1);
  assert.equal(concurrent.filter((response) => response.status === 409).length, 1);

  const range = await agendaGet(new Request(
    'http://localhost:3000/api/sgie/agenda?desde=2026-07-01T00:00:00.000Z&hasta=2026-07-31T23:59:59.000Z&page=1&limit=100',
    { headers: { cookie: `token=${tokenA}` } },
  ));
  assert.equal(range.status, 200);
  const rangeBody = await range.json();
  assert.ok(rangeBody.eventos.some((row: { id: string }) => row.id === eventId));

  console.log(JSON.stringify({
    ok: true,
    invitationConcurrency: { attempts: 8, success: 1, conflicts: 7 },
    resendInvalidatedOldToken: true,
    sgIeImmediateRevocation: true,
    rbacImmediateOverride: true,
    caseTransactionRollback: true,
    calendarPrivacy: true,
    calendarOptimisticConcurrency: true,
    resendMode: 'provider-not-configured-explicit',
  }));
}

main()
  .finally(async () => {
    await cleanup();
    await closeDb();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

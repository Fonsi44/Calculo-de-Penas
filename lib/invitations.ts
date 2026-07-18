import { createHash, randomBytes } from 'crypto';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  aceptacionesLegales,
  equiposMiembros,
  invitaciones,
  permisos,
  roles,
  usuarios,
  usuariosCapacidades,
  usuariosRoles,
  usuariosSgie,
} from '@/lib/schema';
import { hashPassword } from '@/lib/auth';
import { CAPABILITIES, type Capability } from '@/lib/access-service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/http-errors';
import { getClient, getFromAddress, getFromName } from '@/lib/email';

const DEFAULT_TTL_HOURS = 72;
const LEGAL_VERSION = '2026-06-04';

export function invitationTtlHours(): number {
  const configured = Number(process.env.INVITATION_TTL_HOURS ?? DEFAULT_TTL_HOURS);
  return Number.isFinite(configured) && configured >= 1 && configured <= 720
    ? configured
    : DEFAULT_TTL_HOURS;
}

export function generateInvitationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function invitationUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/intranet/activar-invitacion/${encodeURIComponent(token)}`;
}

export async function createInvitation(input: {
  email: string;
  nombre: string;
  rolInicial: 'administrador' | 'abogado' | 'supervisor';
  equipoId?: string;
  accesoSgie: boolean;
  capacidades?: Capability[];
  creadaPor: string;
}): Promise<{
  id: string;
  estado: 'pendiente';
  expiraEn: Date;
  emailEstado: 'enviado' | 'no_configurado' | 'fallido';
  activationUrl?: string;
}> {
  const email = input.email.trim().toLowerCase();
  const capabilities = [...new Set(input.capacidades ?? [])].filter((item) =>
    CAPABILITIES.includes(item),
  );
  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiraEn = new Date(Date.now() + invitationTtlHours() * 60 * 60 * 1000);

  const [activeUser] = await db.select({ id: usuarios.id }).from(usuarios)
    .where(and(eq(usuarios.email, email), eq(usuarios.active, true)));
  if (activeUser) throw new ConflictError('Ya existe una cuenta activa con ese correo');

  await db.update(invitaciones).set({
    estado: 'revocada',
    revocadaEn: new Date(),
  }).where(and(
    eq(invitaciones.email, email),
    eq(invitaciones.estado, 'pendiente'),
    isNull(invitaciones.aceptadaEn),
  ));

  const [created] = await db.insert(invitaciones).values({
    email,
    nombre: input.nombre.trim(),
    tokenHash,
    rolInicial: input.rolInicial,
    equipoId: input.equipoId ?? null,
    accesoSgie: input.accesoSgie,
    capacidades: capabilities,
    creadaPor: input.creadaPor,
    expiraEn,
    emailEstado: 'pendiente',
  }).returning({ id: invitaciones.id });
  if (!created) throw new Error('No se pudo crear la invitación');

  const sent = await sendInvitationEmail({
    id: created.id,
    email,
    nombre: input.nombre.trim(),
    token,
    expiraEn,
  });

  return {
    id: created.id,
    estado: 'pendiente',
    expiraEn,
    emailEstado: sent,
    ...(process.env.NODE_ENV === 'production' ? {} : { activationUrl: invitationUrl(token) }),
  };
}

async function sendInvitationEmail(input: {
  id: string;
  email: string;
  nombre: string;
  token: string;
  expiraEn: Date;
}): Promise<'enviado' | 'no_configurado' | 'fallido'> {
  const client = getClient();
  if (!client) {
    await db.update(invitaciones).set({
      emailEstado: 'no_configurado',
      emailError: 'RESEND_API_KEY no configurada',
    }).where(eq(invitaciones.id, input.id));
    return 'no_configurado';
  }

  try {
    const result = await client.emails.send({
      from: `${getFromName()} <${getFromAddress()}>`,
      to: input.email,
      subject: 'Active su acceso a Pineda y Asociados',
      html: `<p>Hola ${escapeHtml(input.nombre)},</p>
        <p>Ha recibido una invitación para activar su cuenta. Usted definirá su propia contraseña.</p>
        <p><a href="${invitationUrl(input.token)}">Activar mi cuenta</a></p>
        <p>El enlace vence el ${input.expiraEn.toISOString()} y solo puede usarse una vez.</p>`,
    });
    if (result.error) throw new Error(result.error.message);
    await db.update(invitaciones).set({
      emailEstado: 'enviado',
      emailError: null,
      resendId: result.data?.id ?? null,
    }).where(eq(invitaciones.id, input.id));
    return 'enviado';
  } catch (error) {
    await db.update(invitaciones).set({
      emailEstado: 'fallido',
      emailError: (error instanceof Error ? error.message : 'Error de Resend').slice(0, 500),
    }).where(eq(invitaciones.id, input.id));
    return 'fallido';
  }
}

export async function inspectInvitation(token: string): Promise<{
  valid: boolean;
  estado: string;
  nombre?: string;
  email?: string;
  expiraEn?: Date;
}> {
  const [row] = await db.select({
    nombre: invitaciones.nombre,
    email: invitaciones.email,
    estado: invitaciones.estado,
    expiraEn: invitaciones.expiraEn,
  }).from(invitaciones).where(eq(invitaciones.tokenHash, hashInvitationToken(token)));
  if (!row) return { valid: false, estado: 'invalida' };
  if (row.estado !== 'pendiente') return { valid: false, estado: row.estado };
  if (row.expiraEn <= new Date()) {
    await db.update(invitaciones).set({ estado: 'expirada' })
      .where(and(eq(invitaciones.tokenHash, hashInvitationToken(token)), eq(invitaciones.estado, 'pendiente')));
    return { valid: false, estado: 'expirada' };
  }
  return { valid: true, ...row };
}

export async function acceptInvitation(input: {
  token: string;
  password: string;
  termsAccepted: true;
}): Promise<{ userId: string; requiresTwoFactorSetup: boolean }> {
  const tokenHash = hashInvitationToken(input.token);
  const passwordHash = await hashPassword(input.password);

  return db.transaction(async (tx) => {
    const [claimed] = await tx.update(invitaciones).set({
      estado: 'aceptada',
      aceptadaEn: new Date(),
    }).where(and(
      eq(invitaciones.tokenHash, tokenHash),
      eq(invitaciones.estado, 'pendiente'),
      gt(invitaciones.expiraEn, new Date()),
      isNull(invitaciones.aceptadaEn),
      isNull(invitaciones.revocadaEn),
    )).returning();

    if (!claimed) throw new ConflictError('La invitación no es válida o ya fue utilizada');

    const legacyRole = claimed.rolInicial === 'administrador' ? 'admin' : claimed.rolInicial;
    const [existing] = await tx.select({ id: usuarios.id, active: usuarios.active })
      .from(usuarios).where(eq(usuarios.email, claimed.email));

    let userId: string;
    if (existing) {
      if (existing.active) throw new ConflictError('La cuenta ya está activa');
      const [reactivated] = await tx.update(usuarios).set({
        nombre: claimed.nombre,
        passwordHash,
        rol: legacyRole,
        active: true,
        bloqueado: false,
        bloqueadoEn: null,
        bloqueadoMotivo: null,
        mustChangePassword: false,
        tokenVersion: sql`${usuarios.tokenVersion} + 1`,
      }).where(eq(usuarios.id, existing.id)).returning({ id: usuarios.id });
      if (!reactivated) throw new Error('No se pudo reactivar la cuenta');
      userId = reactivated.id;
    } else {
      const [created] = await tx.insert(usuarios).values({
        email: claimed.email,
        nombre: claimed.nombre,
        passwordHash,
        rol: legacyRole,
        active: true,
        bloqueado: false,
        mustChangePassword: false,
      }).returning({ id: usuarios.id });
      if (!created) throw new Error('No se pudo crear la cuenta');
      userId = created.id;
    }

    await tx.update(invitaciones).set({ usuarioId: userId })
      .where(eq(invitaciones.id, claimed.id));

    const [role] = await tx.select({ id: roles.id }).from(roles)
      .where(eq(roles.nombre, claimed.rolInicial));
    if (!role) throw new NotFoundError('El rol previsto no está configurado');
    await tx.insert(usuariosRoles).values({ usuarioId: userId, rolId: role.id })
      .onConflictDoNothing({ target: [usuariosRoles.usuarioId, usuariosRoles.rolId] });

    if (claimed.equipoId) {
      await tx.insert(equiposMiembros).values({ equipoId: claimed.equipoId, usuarioId: userId })
        .onConflictDoNothing({ target: [equiposMiembros.equipoId, equiposMiembros.usuarioId] });
    }

    await tx.insert(usuariosSgie).values({
      usuarioId: userId,
      activoSgie: claimed.accesoSgie,
    }).onConflictDoUpdate({
      target: usuariosSgie.usuarioId,
      set: { activoSgie: claimed.accesoSgie, actualizadoEn: new Date() },
    });

    const requested = Array.isArray(claimed.capacidades) ? claimed.capacidades : [];
    if (requested.length > 0) {
      const permissionRows = await tx.select({
        id: permisos.id,
        recurso: permisos.recurso,
        accion: permisos.accion,
      }).from(permisos);
      const requestedSet = new Set(requested);
      const grants = permissionRows.filter((p) => requestedSet.has(`${p.recurso}.${p.accion}`));
      if (grants.length > 0) {
        await tx.insert(usuariosCapacidades).values(grants.map((p) => ({
          usuarioId: userId,
          permisoId: p.id,
          permitido: true,
          concedidoPor: claimed.creadaPor,
        }))).onConflictDoNothing();
      }
    }

    await tx.insert(aceptacionesLegales).values({
      usuarioId: userId,
      version: LEGAL_VERSION,
    }).onConflictDoNothing({
      target: [aceptacionesLegales.usuarioId, aceptacionesLegales.version],
    });

    return {
      userId,
      // El proyecto no impone actualmente 2FA obligatorio por rol. El usuario
      // puede configurarlo desde seguridad; si la política cambia, debe
      // añadirse un estado persistido y bloquear acceso hasta completar setup.
      requiresTwoFactorSetup: false,
    };
  });
}

export async function revokeInvitation(id: string): Promise<void> {
  const [row] = await db.update(invitaciones).set({
    estado: 'revocada',
    revocadaEn: new Date(),
  }).where(and(eq(invitaciones.id, id), eq(invitaciones.estado, 'pendiente')))
    .returning({ id: invitaciones.id });
  if (!row) throw new ConflictError('La invitación no está pendiente');
}

export async function resendInvitation(id: string, actorId: string) {
  const [current] = await db.select().from(invitaciones).where(eq(invitaciones.id, id));
  if (!current) throw new NotFoundError('Invitación no encontrada');
  if (current.estado === 'aceptada') throw new ForbiddenError('Una invitación aceptada no se puede reenviar');
  return createInvitation({
    email: current.email,
    nombre: current.nombre,
    rolInicial: current.rolInicial as 'administrador' | 'abogado' | 'supervisor',
    equipoId: current.equipoId ?? undefined,
    accesoSgie: current.accesoSgie,
    capacidades: (current.capacidades ?? []) as Capability[],
    creadaPor: actorId,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] as string);
}

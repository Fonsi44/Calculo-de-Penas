/**
 * SGIE — capa de acceso a datos para gestión de usuarios y accesos (Fase 2).
 *
 * Extiende el CRUD existente de usuarios con la gobernanza SGIE:
 * último acceso, bloqueo, vínculo de correo corporativo y perfil SGIE.
 * No sustituye a `app/api/admin/usuarios/route.ts` (CRUD base); lo complementa.
 *
 * Fuente de verdad: tabla `usuarios` + `usuarios_sgie` + `expediente_asignaciones`.
 */
import { db } from '@/lib/db';
import {
  usuarios,
  usuariosSgie,
  expedienteAsignaciones,
} from '@/lib/schema';
import { and, count, eq, ilike, isNull, or, sql } from 'drizzle-orm';

export interface UsuarioGestion {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  active: boolean | null;
  bloqueado: boolean | null;
  bloqueadoMotivo: string | null;
  bloqueadoEn: Date | null;
  ultimoAcceso: Date | null;
  correoCorporativoVinculado: boolean | null;
  debeCambiarPassword: boolean | null;
  creadoEn: Date | null;
  /** Conteo de expedientes activos asignados (responsable/colaborador, no revocados). */
  expedientesAsignados: number;
}

export interface ListarUsuariosOpts {
  q?: string;
  /** Filtrar por estado de acceso. `undefined` = todos. */
  estado?: 'activos' | 'bloqueados' | 'inactivos';
  limit?: number;
  offset?: number;
}

/**
 * Lista usuarios para el panel de Usuarios/Accesos con datos de gobernanza
 * y conteo de expedientes asignados. A diferencia del GET anterior (que filtraba
 * `active=true`), devuelve todos los usuarios con su estado, para que el admin
 * pueda ver y gestionar bloqueados/inactivos (requisito §6.2).
 */
export async function listarUsuariosGestion(opts: ListarUsuariosOpts = {}): Promise<{
  usuarios: UsuarioGestion[];
  total: number;
}> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const conditions = [];
  if (opts.q) {
    const term = `%${opts.q}%`;
    conditions.push(or(ilike(usuarios.nombre, term), ilike(usuarios.email, term))!);
  }
  if (opts.estado === 'activos') {
    conditions.push(eq(usuarios.active, true));
    conditions.push(eq(usuarios.bloqueado, false));
  } else if (opts.estado === 'bloqueados') {
    conditions.push(eq(usuarios.bloqueado, true));
  } else if (opts.estado === 'inactivos') {
    conditions.push(eq(usuarios.active, false));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countRow]] = await Promise.all([
    db.select({
      id: usuarios.id,
      email: usuarios.email,
      nombre: usuarios.nombre,
      rol: usuarios.rol,
      active: usuarios.active,
      bloqueado: usuarios.bloqueado,
      bloqueadoMotivo: usuarios.bloqueadoMotivo,
      bloqueadoEn: usuarios.bloqueadoEn,
      ultimoAcceso: usuarios.ultimoAcceso,
      correoCorporativoVinculado: usuarios.correoCorporativoVinculado,
      debeCambiarPassword: usuarios.mustChangePassword,
      creadoEn: usuarios.creadoEn,
    })
      .from(usuarios)
      .where(where)
      .orderBy(usuarios.creadoEn)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(usuarios).where(where),
  ]);

  if (rows.length === 0) {
    return { usuarios: [], total: countRow?.total ?? 0 };
  }

  // Conteo de expedientes asignados activos por abogado (una sola query agregada).
  const userIds = rows.map((r) => r.id);
  const asignaciones = await db
    .select({
      abogadoId: expedienteAsignaciones.abogadoId,
      n: count(),
    })
    .from(expedienteAsignaciones)
    .where(
      and(
        sql`${expedienteAsignaciones.abogadoId} = ANY(${sql.raw(`ARRAY['${userIds.join("','")}']::uuid[]`)})`,
        isNull(expedienteAsignaciones.revocadaEn),
      ),
    )
    .groupBy(expedienteAsignaciones.abogadoId);

  const conteoPorAbogado = new Map<string, number>(
    asignaciones.map((a) => [a.abogadoId, Number(a.n)]),
  );

  return {
    usuarios: rows.map((r) => ({
      ...r,
      expedientesAsignados: conteoPorAbogado.get(r.id) ?? 0,
    })),
    total: countRow?.total ?? 0,
  };
}

/**
 * Cuenta cuántos administradores activos y no bloqueados quedan.
 * Usado para evitar dejar el sistema sin admin al cambiar roles o bloquear.
 */
export async function contarAdminsActivos(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(usuarios)
    .where(and(eq(usuarios.rol, 'admin'), eq(usuarios.active, true), eq(usuarios.bloqueado, false)));
  return Number(row?.n ?? 0);
}

/**
 * Actualiza el rol de un usuario y sincroniza su perfil SGIE:
 * al asignar rol `abogado` se asegura el perfil `usuarios_sgie` (upsert);
 * al quitarlo no se elimina el perfil (trazabilidad) pero `activoSgie` queda false.
 */
export async function actualizarRolUsuario(params: {
  usuarioId: string;
  nuevoRol: 'admin' | 'abogado';
}): Promise<{ rol: string } | null> {
  const [updated] = await db
    .update(usuarios)
    .set({ rol: params.nuevoRol })
    .where(eq(usuarios.id, params.usuarioId))
    .returning({ rol: usuarios.rol });

  if (!updated) return null;

  if (params.nuevoRol === 'abogado') {
    // Upsert de perfil SGIE (si no existe, lo crea activo).
    await db
      .insert(usuariosSgie)
      .values({ usuarioId: params.usuarioId, activoSgie: true })
      .onConflictDoNothing({ target: usuariosSgie.usuarioId });
  } else {
    // Al dejar de ser abogado, se desactiva el perfil SGIE (no se elimina).
    await db
      .update(usuariosSgie)
      .set({ activoSgie: false })
      .where(eq(usuariosSgie.usuarioId, params.usuarioId));
  }

  return updated;
}

/**
 * Bloquea (revoca acceso) a un usuario. Distinguible de `active=false`
 * (desactivación/soft-delete): el usuario sigue existiendo y visible,
 * pero no puede iniciar sesión ni mantener una sesión activa.
 */
export async function bloquearUsuario(params: {
  usuarioId: string;
  motivo?: string;
}): Promise<void> {
  await db
    .update(usuarios)
    .set({
      bloqueado: true,
      bloqueadoEn: new Date(),
      bloqueadoMotivo: params.motivo ?? null,
    })
    .where(eq(usuarios.id, params.usuarioId));
}

export async function desbloquearUsuario(params: { usuarioId: string }): Promise<void> {
  await db
    .update(usuarios)
    .set({
      bloqueado: false,
      bloqueadoEn: null,
      bloqueadoMotivo: null,
    })
    .where(eq(usuarios.id, params.usuarioId));
}

/**
 * Marca el correo corporativo como vinculado (verificación administrativa de
 * que el abogado usa un correo @pinedayasociadoshn.com). Actualiza también
 * el campo `correoCorporativo` del perfil SGIE si procede.
 */
export async function vincularCorreoCorporativo(params: {
  usuarioId: string;
  correoCorporativo?: string;
}): Promise<void> {
  await db
    .update(usuarios)
    .set({ correoCorporativoVinculado: true })
    .where(eq(usuarios.id, params.usuarioId));

  if (params.correoCorporativo) {
    await db
      .insert(usuariosSgie)
      .values({
        usuarioId: params.usuarioId,
        correoCorporativo: params.correoCorporativo,
        activoSgie: true,
      })
      .onConflictDoUpdate({
        target: usuariosSgie.usuarioId,
        set: { correoCorporativo: params.correoCorporativo, actualizadoEn: new Date() },
      });
  }
}

/**
 * Comprueba si un usuario está bloqueado o inactivo. Usado por el login
 * y por `/api/auth/me` para revocar sesiones activas de usuarios bloqueados
 * tras la emisión del JWT (el JWT es stateless; el bloqueo es posterior).
 */
export async function obtenerEstadoAcceso(usuarioId: string): Promise<{
  bloqueado: boolean;
  active: boolean;
} | null> {
  const [row] = await db
    .select({ bloqueado: usuarios.bloqueado, active: usuarios.active })
    .from(usuarios)
    .where(eq(usuarios.id, usuarioId));
  if (!row) return null;
  return { bloqueado: Boolean(row.bloqueado), active: Boolean(row.active) };
}

/**
 * Registra el último acceso (timestamp) al iniciar sesión.
 */
export async function registrarUltimoAcceso(usuarioId: string): Promise<void> {
  await db
    .update(usuarios)
    .set({ ultimoAcceso: new Date() })
    .where(eq(usuarios.id, usuarioId));
}

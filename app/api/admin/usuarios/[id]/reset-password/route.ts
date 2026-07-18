import { and, eq } from 'drizzle-orm';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { validateCsrf } from '@/lib/csrf';
import { crearTokenReset } from '@/lib/auth-reset';
import { getClient, getFromAddress, getFromName } from '@/lib/email';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request);
    validateCsrf(request);
    const { id } = await params;
    if (id === actor.userId) {
      return Response.json({ error: 'Use el cambio de contraseña de su perfil' }, { status: 400 });
    }
    const [target] = await db.select({
      id: usuarios.id, nombre: usuarios.nombre, email: usuarios.email,
    }).from(usuarios).where(and(eq(usuarios.id, id), eq(usuarios.active, true)));
    if (!target) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const { token } = await crearTokenReset(target.id);
    const client = getClient();
    let emailEstado: 'enviado' | 'no_configurado' | 'fallido' = 'no_configurado';
    if (client) {
      try {
        const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/intranet/restablecer-clave/${encodeURIComponent(token)}`;
        const result = await client.emails.send({
          from: `${getFromName()} <${getFromAddress()}>`,
          to: target.email,
          subject: 'Restablezca su contraseña — SGIE',
          html: `<p>Hola ${target.nombre},</p><p>Administración solicitó un restablecimiento seguro.</p><p><a href="${url}">Definir nueva contraseña</a></p><p>El enlace vence en una hora y es de un solo uso.</p>`,
        });
        emailEstado = result.error ? 'fallido' : 'enviado';
      } catch {
        emailEstado = 'fallido';
      }
    }
    await logAudit({
      usuarioId: actor.userId, accion: 'password_reset', recurso: 'usuario',
      recursoId: id, metadata: { emailEstado, adminNoConocePassword: true }, request,
    });
    return Response.json({
      ok: true,
      emailEstado,
      message: emailEstado === 'enviado'
        ? 'Enlace de restablecimiento enviado'
        : 'Solicitud guardada; el correo no fue enviado',
    });
  } catch (error) {
    return authFailureResponse(error);
  }
}

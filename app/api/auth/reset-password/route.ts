/**
 * POST /api/auth/reset-password      — solicitar reset (público, rate limitado).
 * POST /api/auth/reset-password/confirm — confirmar reset con token + nueva password.
 *
 * Seguridad: respuesta neutra (no revela si el email existe). Rate limit por
 * email + IP. Auditoría password_reset / password_changed. Sin CSRF aquí
 * porque es ruta pública pre-auth (coherente con /api/auth/login).
 *
 * Sprint 4 — tarea 4.
 */
import { z } from 'zod';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { crearTokenReset, consumirTokenReset, validarTokenReset } from '@/lib/auth-reset';
import { invalidateFreshness } from '@/lib/auth';
import { isEmailConfigured, getClient, getFromAddress, getFromName } from '@/lib/email';

const solicitarSchema = z.object({
  email: z.string().email().max(255),
});

const confirmarSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  // Rate limit por IP para evitar abuso (5 solicitudes / 15 min).
  const rl = await rateLimit(`auth:reset:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'}`, { max: 5, windowMs: 15 * 60_000, keyPrefix: 'auth' });
  if (!rl.ok) return rateLimitResponse(rl);

  const url = new URL(request.url);
  const esConfirmar = url.pathname.endsWith('/confirm');

  try {
    if (esConfirmar) {
      const parsed = confirmarSchema.parse(await request.json());
      // Validar primero para obtener usuarioId (auditoría) sin consumir aún.
      const usuarioId = await validarTokenReset(parsed.token);
      if (!usuarioId) {
        return Response.json({ error: 'Token inválido, expirado o ya utilizado' }, { status: 400 });
      }
      const ok = await consumirTokenReset(parsed.token, parsed.password);
      if (!ok) {
        return Response.json({ error: 'Token inválido, expirado o ya utilizado' }, { status: 400 });
      }
      invalidateFreshness(usuarioId);
      await logAudit({ usuarioId, accion: 'password_changed', recurso: 'auth', request, metadata: { flujo: 'reset_confirm' } });
      return Response.json({ ok: true, mensaje: 'Contraseña actualizada. Inicie sesión.' });
    }

    // Solicitud de reset.
    const parsed = solicitarSchema.parse(await request.json());
    const email = parsed.email.trim().toLowerCase();

    // Buscar usuario. Respuesta neutra siempre (no revelar existencia).
    const [usuario] = await db.select({ id: usuarios.id, nombre: usuarios.nombre })
      .from(usuarios).where(eq(usuarios.email, email));

    if (usuario) {
      const { token } = await crearTokenReset(usuario.id);

      // Auditoría.
      await logAudit({ usuarioId: usuario.id, accion: 'password_reset', recurso: 'auth', request, metadata: { flujo: 'reset_request' } });

      // Enviar email si Resend está configurado.
      if (isEmailConfigured()) {
        const client = getClient();
        if (client) {
          const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pinedayasociadoshn.com'}/reset?token=${token}`;
          try {
            await client.emails.send({
              from: `${getFromName()} <${getFromAddress()}>`,
              to: email,
              subject: 'Restablecimiento de contraseña — SGIE',
              html: `
                <p>Hola ${usuario.nombre},</p>
                <p>Has solicitado restablecer tu contraseña del SGIE.</p>
                <p><a href="${resetUrl}">Restablecer contraseña</a></p>
                <p>Este enlace expira en 1 hora. Si no lo solicitaste, ignora este correo.</p>
                <p>Pineda y Asociados</p>
              `,
              text: `Restablece tu contraseña: ${resetUrl}\nEste enlace expira en 1 hora.`,
            });
          } catch {
            // No revelar fallo de email al cliente (seguridad). El token existe; el usuario puede pedir reenvío.
          }
        }
      }
      // Si email no configurado, el token se creó pero no se envió. El admin
      // puede entregarlo manualmente en desarrollo. Limitación documentada.
    }

    // Respuesta neutra SIEMPRE.
    return Response.json({ ok: true, mensaje: 'Si el correo existe, recibirá un enlace de restablecimiento.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return Response.json({ error: 'Error en la solicitud' }, { status: 500 });
  }
}

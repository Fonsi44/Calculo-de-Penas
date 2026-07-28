import { createLogoutResponse, getTokenFromCookies, verifyToken, invalidateFreshness } from '@/lib/auth';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  const token = getTokenFromCookies(request);
  let revocationFailed = false;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      // Invalidar la sesión server-side: incrementar token_version para que
      // el token actual (con la versión vieja) deje de ser válido, incluso si
      // el cliente lo reenvía. Esto cierra la brecha donde logout solo limpiaba
      // la cookie del navegador pero el token seguía siendo funcional.
      // Fail-closed: si la DB falla, NO silenciamos el error. Aun así se limpian
      // las cookies del navegador, pero se devuelve 503 para auditoría.
      try {
        await db.update(usuarios)
          .set({ tokenVersion: sql`${usuarios.tokenVersion} + 1` })
          .where(eq(usuarios.id, payload.userId));
        invalidateFreshness(payload.userId);
      } catch (err) {
        console.error('[logout] Error al revocar sesión:', err);
        revocationFailed = true;
        // Cookies se limpian igualmente (createLogoutResponse).
      }
    }
  }

  if (revocationFailed) {
    const resp = createLogoutResponse();
    return new Response(resp.body, {
      status: 503,
      statusText: 'Sesión cerrada localmente; error al revocar en servidor',
      headers: resp.headers,
    });
  }
  return createLogoutResponse();
}

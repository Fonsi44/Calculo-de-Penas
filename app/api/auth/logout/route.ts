import { createLogoutResponse, getTokenFromCookies, verifyToken, invalidateFreshness } from '@/lib/auth';
import { db } from '@/lib/db';
import { usuarios } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  const token = getTokenFromCookies(request);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      // Invalidar la sesión server-side: incrementar token_version para que
      // el token actual (con la versión vieja) deje de ser válido, incluso si
      // el cliente lo reenvía. Esto cierra la brecha donde logout solo limpiaba
      // la cookie del navegador pero el token seguía siendo funcional.
      await db.update(usuarios)
        .set({ tokenVersion: sql`${usuarios.tokenVersion} + 1` })
        .where(eq(usuarios.id, payload.userId))
        .catch(() => { /* best-effort: la cookie se limpia igualmente */ });
      invalidateFreshness(payload.userId);
    }
  }
  return createLogoutResponse(request);
}

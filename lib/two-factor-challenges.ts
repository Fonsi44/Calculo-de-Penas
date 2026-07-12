import { randomUUID } from 'crypto';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { twoFactorChallenges } from '@/lib/schema';

export const TWO_FACTOR_CHALLENGE_TTL_SECONDS = 5 * 60;

export async function crearChallenge2fa(usuarioId: string): Promise<{ jti: string; expiresAt: Date }> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000);
  await db.insert(twoFactorChallenges).values({ jti, usuarioId, expiresAt });
  return { jti, expiresAt };
}

/** Consumo compare-and-set: solo una solicitud concurrente puede obtener la fila. */
export async function consumirChallenge2fa(jti: string, usuarioId: string): Promise<boolean> {
  const rows = await db.update(twoFactorChallenges)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(twoFactorChallenges.jti, jti),
      eq(twoFactorChallenges.usuarioId, usuarioId),
      isNull(twoFactorChallenges.consumedAt),
      gt(twoFactorChallenges.expiresAt, new Date()),
    ))
    .returning({ jti: twoFactorChallenges.jti });
  return rows.length === 1;
}

/** Limpieza segura y acotada; puede ejecutarse desde cron de mantenimiento. */
export async function limpiarChallenges2faExpirados(): Promise<void> {
  await db.delete(twoFactorChallenges).where(lt(twoFactorChallenges.expiresAt, new Date()));
}

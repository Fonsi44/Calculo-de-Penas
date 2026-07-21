import { requireAbogado } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';
import { db } from '@/lib/db';
import { calendarFeedTokens, eventosAgenda } from '@/lib/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { generateFeedToken, hashToken, generateIcsFeed } from '@/lib/sgie/calendar-ics';

function icsError(status: number, msg: string) {
  return new Response(msg, { status, headers: { 'Content-Type': 'text/plain' } });
}

/** GET /api/sgie/agenda/ics/feed?token=xxx */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return icsError(401, 'Token requerido');

  const tokenHash = hashToken(token);
  const [feed] = await db.select().from(calendarFeedTokens)
    .where(and(eq(calendarFeedTokens.tokenHash, tokenHash), isNull(calendarFeedTokens.revokedAt)))
    .limit(1);

  if (!feed) return icsError(410, 'Feed revocado o token inválido');
  if (feed.expiresAt && new Date(feed.expiresAt) < new Date()) return icsError(410, 'Feed expirado');

  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hasta = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const eventos = await db.select().from(eventosAgenda)
    .where(and(
      eq(eventosAgenda.propietarioId, feed.userId),
      gte(eventosAgenda.inicio, desde),
      lte(eventosAgenda.inicio, hasta),
    ))
    .orderBy(eventosAgenda.inicio);

  const icsInput = eventos.map((e) => ({
    uid: `sgie-${e.id}@pinedayasociadoshn.com`,
    titulo: e.titulo,
    descripcion: e.descripcion ?? undefined,
    inicio: e.inicio,
    fin: e.fin ?? undefined,
    todoElDia: e.todoElDia,
    zonaHoraria: e.zonaHoraria,
    sequence: e.version,
    estado: e.estado === 'confirmada' ? 'CONFIRMED' as const : e.estado === 'cancelada' ? 'CANCELLED' as const : 'TENTATIVE' as const,
    lastModified: e.confirmadaEn ?? e.creadaEn ?? new Date(),
  }));

  const feedContent = generateIcsFeed(icsInput, 'SGIE — Pineda y Asociados');
  return new Response(feedContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="sgie-calendar.ics"',
      'Cache-Control': 'private, max-age=300',
    },
  });
}

/** POST /api/sgie/agenda/ics/feed — crear feed privado */
export async function POST(req: Request) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);
    const rl = await rateLimit(`sgie:ics:feed:${auth.userId}`, { max: 5, windowMs: 60000, keyPrefix: 'sgie' });
    if (!rl.ok) return rateLimitResponse(rl);

    const token = generateFeedToken();
    const tokenHash = hashToken(token);

    await db.insert(calendarFeedTokens).values({
      userId: auth.userId,
      tokenHash,
      scope: 'read',
    });

    return Response.json({ token, url: `/api/sgie/agenda/ics/feed?token=${token}` });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** DELETE /api/sgie/agenda/ics/feed — revocar feed */
export async function DELETE(req: Request) {
  try {
    const auth = await requireAbogado(req);
    validateCsrf(req);

    await db.update(calendarFeedTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(calendarFeedTokens.userId, auth.userId), isNull(calendarFeedTokens.revokedAt)));

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSubscriptions } from '@/lib/schema';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstileToken } from '@/lib/captcha';

const schema: { safeParse: (v: unknown) => { success: boolean; data?: { email: string } } } = {
  safeParse: (v: unknown) => {
    if (typeof v !== 'object' || v === null) return { success: false };
    const body = v as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false };
    return { success: true, data: { email } };
  },
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = await rateLimit(`subscribe:${ip}`, { windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'subscribe' });
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Solicitud inválida.' },
        { status: 400 },
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico inválido.' },
        { status: 400 },
      );
    }

    // Cloudflare Turnstile — bypass seguro si faltan claves (lib/captcha.ts).
    const turnstileOk = await verifyTurnstileToken(
      (body as Record<string, unknown>)['cf-turnstile-response'] as string | undefined,
      ip,
    );
    if (!turnstileOk) {
      return NextResponse.json(
        { success: false, error: 'Verificación antispam inválida.' },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    await db
      .insert(newsletterSubscriptions)
      .values({ email, source: 'blog' })
      .onConflictDoNothing();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Error interno. Intente de nuevo.' },
      { status: 500 },
    );
  }
}

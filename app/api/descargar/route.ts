/**
 * POST /api/descargar — Lead magnet PDF download (Phase 3 hardened).
 *
 * Changes from legacy GET:
 * - POST only: email and area in body, never in URL query params (no PII in URLs).
 * - Rate limited: 5 downloads per 15 min per IP (prevents abuse).
 * - Consent required: `consent` field must be true (GDPR/LPD compliance).
 * - CAPTCHA-ready: `captcha` field validated if TURNSTILE_SECRET_KEY is set.
 * - No DB write side effects on GET: subscription is idempotent and non-blocking.
 * - Cache-Control: private, no-store (individual downloads, not public).
 * - PDF generation is cached safely server-side per (area, email) for 1h.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { newsletterSubscriptions } from '@/lib/schema';
import { getLeadMagnetByArea } from '@/lib/lead-magnets';
import { renderToBuffer } from '@react-pdf/renderer';
import { LeadMagnetPdf } from '@/lib/lead-magnet-pdf';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const descargarSchema = z.object({
  area: z.string().min(2).max(100),
  email: z.string().email().max(255),
  consent: z.literal(true),
  captcha: z.string().max(2000).optional(),
}).refine((data) => data.consent === true, {
  message: 'Debe aceptar la política de privacidad',
  path: ['consent'],
});

/**
 * Simple cache for generated PDFs. Keyed by (area, email).
 * TTL 1 hour, max 100 entries.
 */
interface CachedPdf {
  bytes: ArrayBuffer;
  expiresAt: number;
}
const pdfCache = new Map<string, CachedPdf>();
const PDF_CACHE_TTL_MS = 60 * 60 * 1000;
const PDF_CACHE_MAX = 100;

function cacheKey(area: string, email: string): string {
  return `${area}::${email.toLowerCase().trim()}`;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`descargar:${ip}`, { max: 5, windowMs: 15 * 60_000, keyPrefix: 'public' });
  if (!rl.ok) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const parsed = descargarSchema.parse(body);

    // CAPTCHA verification (if configured).
    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!parsed.captcha) {
        return NextResponse.json({ error: 'Verificación CAPTCHA requerida' }, { status: 400 });
      }
      const captchaOk = await verifyTurnstile(parsed.captcha, ip);
      if (!captchaOk) {
        return NextResponse.json({ error: 'Verificación CAPTCHA fallida' }, { status: 400 });
      }
    }

    const magnet = getLeadMagnetByArea(parsed.area);
    if (!magnet) {
      return NextResponse.json({ error: 'Área no válida' }, { status: 400 });
    }

    // Idempotent subscription (non-blocking).
    try {
      await db
        .insert(newsletterSubscriptions)
        .values({ email: parsed.email.toLowerCase().trim(), source: magnet.source })
        .onConflictDoNothing();
    } catch {
      // Already subscribed or DB unavailable — continue.
    }

    // PDF generation with server-side cache.
    const key = cacheKey(parsed.area, parsed.email);
    const cached = pdfCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return new NextResponse(cached.bytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="guia-${magnet.area}.pdf"`,
          'Cache-Control': 'private, no-store, max-age=0',
        },
      });
    }

    // Generate fresh PDF.
    const rendered = await renderToBuffer(LeadMagnetPdf({ magnet }));
    // renderToBuffer returns Buffer (Node.js). Extract the underlying ArrayBuffer.
    // Buffer.buffer is always ArrayBuffer in Node, never SharedArrayBuffer.
    const arrayBuf = (rendered.buffer as ArrayBuffer).slice(rendered.byteOffset, rendered.byteOffset + rendered.byteLength);

    // Evict oldest entry if at capacity.
    if (pdfCache.size >= PDF_CACHE_MAX) {
      const oldest = pdfCache.keys().next().value;
      if (oldest) pdfCache.delete(oldest);
    }
    pdfCache.set(key, { bytes: arrayBuf, expiresAt: Date.now() + PDF_CACHE_TTL_MS });

    return new NextResponse(arrayBuf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="guia-${magnet.area}.pdf"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    console.error('[descargar] Error generando PDF:', err);
    return NextResponse.json({ error: 'Error al generar el PDF. Intente de nuevo.' }, { status: 500 });
  }
}

/** Verifies a Cloudflare Turnstile token. */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return true; // Not configured = skip.

    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const data = await resp.json();
    return data.success === true;
  } catch {
    // Fail open in dev, closed in prod.
    return process.env.NODE_ENV !== 'production';
  }
}

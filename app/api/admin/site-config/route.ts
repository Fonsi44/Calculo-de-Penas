import { db } from '@/lib/db';
import { configuracionSitio } from '@/lib/schema';
import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

const ALLOWED_KEYS = new Set([
  'telefono', 'whatsapp', 'email', 'direccion_line1', 'direccion_line2',
  'ciudad', 'departamento', 'horario', 'facebook', 'instagram', 'tiktok',
  'geo_lat', 'geo_lng',
  'seo_title', 'seo_description', 'seo_keywords', 'seo_og_image',
  'seo_google_verification', 'seo_noindex', 'seo_sitemap_auto',
]);

const validators: Record<string, (v: string) => string | null> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Email inválido',
  telefono: (v) => /^\+?[\d\s-]{7,20}$/.test(v) ? null : 'Teléfono inválido',
  whatsapp: (v) => /^\d{7,20}$/.test(v) ? null : 'WhatsApp inválido (solo dígitos)',
  facebook: (v) => { try { new URL(v); return null; } catch { return 'URL inválida'; } },
  instagram: (v) => { try { new URL(v); return null; } catch { return 'URL inválida'; } },
  tiktok: (v) => { try { new URL(v); return null; } catch { return 'URL inválida'; } },
  geo_lat: (v) => { const n = Number(v); return isNaN(n) || n < -90 || n > 90 ? 'Latitud inválida (-90 a 90)' : null; },
  geo_lng: (v) => { const n = Number(v); return isNaN(n) || n < -180 || n > 180 ? 'Longitud inválida (-180 a 180)' : null; },
};

const updateSchema = z.record(z.string(), z.string());

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch (err) {
    return authFailureResponse(err);
  }
  const rows = await db.select().from(configuracionSitio);
  const config: Record<string, string> = {};
  for (const row of rows) config[row.clave] = row.valor;
  return Response.json({ config });
}

export async function PUT(request: Request) {
  try {
    const auth = requireAdmin(request);
    validateCsrf(request);
    const rl = await rateLimit(`site-config:update:${auth.userId}`, { max: 20, windowMs: 60_000, keyPrefix: 'admin' });
    if (!rl.ok) return rateLimitResponse(rl);
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    for (const [clave] of Object.entries(parsed)) {
      if (!ALLOWED_KEYS.has(clave)) {
        return Response.json({ error: `Clave no permitida: ${clave}` }, { status: 400 });
      }
    }

    for (const [clave, valor] of Object.entries(parsed)) {
      const validator = validators[clave];
      if (validator) {
        const error = validator(valor);
        if (error) return Response.json({ error: `${clave}: ${error}` }, { status: 400 });
      }
    }

    for (const [clave, valor] of Object.entries(parsed)) {
      await db.insert(configuracionSitio)
        .values({ clave, valor })
        .onConflictDoUpdate({ target: configuracionSitio.clave, set: { valor, actualizadoEn: new Date() } });
    }

    await logAudit({
      usuarioId: auth.userId,
      accion: 'site_config_updated',
      recurso: 'site_config',
      metadata: { claves: Object.keys(parsed) },
      request,
    });

    try { revalidatePath('/'); revalidatePath('/solicitar-consulta'); } catch {}

    const rows = await db.select().from(configuracionSitio);
    const config: Record<string, string> = {};
    for (const row of rows) config[row.clave] = row.valor;

    return Response.json({ config });
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    return authFailureResponse(err);
  }
}

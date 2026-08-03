import { afterEach, describe, expect, it } from 'vitest';
import { GET, dynamic } from '@/app/api/public-config/route';

const originalServerSiteKey = process.env.TURNSTILE_SITE_KEY;
const originalPublicSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

afterEach(() => {
  if (originalServerSiteKey === undefined) delete process.env.TURNSTILE_SITE_KEY;
  else process.env.TURNSTILE_SITE_KEY = originalServerSiteKey;

  if (originalPublicSiteKey === undefined) delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  else process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalPublicSiteKey;
});

describe('GET /api/public-config', () => {
  it('lee la site key del entorno server-side en runtime', async () => {
    process.env.TURNSTILE_SITE_KEY = '0xSERVER_SITE_KEY';
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xPUBLIC_SITE_KEY';

    const response = await GET();

    expect(dynamic).toBe('force-dynamic');
    expect(await response.json()).toEqual({ turnstileSiteKey: '0xSERVER_SITE_KEY' });
  });

  it('mantiene compatibilidad con NEXT_PUBLIC_TURNSTILE_SITE_KEY', async () => {
    delete process.env.TURNSTILE_SITE_KEY;
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '0xPUBLIC_SITE_KEY';

    const response = await GET();

    expect(await response.json()).toEqual({ turnstileSiteKey: '0xPUBLIC_SITE_KEY' });
  });
});

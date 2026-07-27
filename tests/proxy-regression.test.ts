/**
 * Proxy Regression Tests — Classification and Routing
 *
 * Tests the proxy middleware's route classification (`isPublicApiPath`,
 * `isSessionApiPath`) and integration routing behavior. Covers all
 * authentication categories: PUBLIC, PRE_AUTH, TOKEN_AUTH, WEBHOOK_AUTH,
 * CRON_AUTH, and SESSION_AUTH.
 *
 * Also verifies edge cases: invalid tokens, non-existent routes,
 * query strings, and trailing slashes.
 */
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { signSessionToken } from '@/lib/auth';
import { proxy, isPublicApiPath, isSessionApiPath } from '@/proxy';

// ─────────────────────────────────────────────────────────────────────────────
// Classification Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('isPublicApiPath — route classification', () => {
  // ── CATEGORY 1: PUBLIC API routes ──
  describe('CATEGORY 1 — PUBLIC (no authentication)', () => {
    const publicRoutes = [
      '/api/health',
      '/api/health/readiness',
      '/api/contacto',
      '/api/consulta',
      '/api/chat',
      '/api/delitos/count',
      '/api/indexnow-key',
      '/api/og',
      '/api/whatsapp',
      '/api/subscribe',
      '/api/descargar',
      '/api/clasificaciones',
      '/api/remisiones-normativas',
    ];

    it.each(publicRoutes)('classifies %s as public (non-session)', (route) => {
      expect(isPublicApiPath(route)).toBe(true);
      expect(isSessionApiPath(route)).toBe(false);
    });

    // Prefix-based public routes (e.g., /api/delitos/*, /api/cp/*, /api/health/*)
    it('classifies /api/delitos sub-routes as public', () => {
      expect(isPublicApiPath('/api/delitos')).toBe(true);
      expect(isPublicApiPath('/api/delitos/pena/123')).toBe(true);
      expect(isSessionApiPath('/api/delitos')).toBe(false);
    });

    it('classifies /api/cp sub-routes as public', () => {
      expect(isPublicApiPath('/api/cp')).toBe(true);
      expect(isPublicApiPath('/api/cp/articulo/1')).toBe(true);
    });

    it('classifies /api/health sub-routes as public', () => {
      expect(isPublicApiPath('/api/health/custom')).toBe(true);
    });
  });

  // ── CATEGORY 2: PRE_AUTH routes ──
  describe('CATEGORY 2 — PRE_AUTH (login, 2FA, reset, invitaciones)', () => {
    it.each([
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/register',
      '/api/auth/me',
      '/api/auth/2fa/verify',
    ])('classifies %s as public (non-session)', (route) => {
      expect(isPublicApiPath(route)).toBe(true);
      expect(isSessionApiPath(route)).toBe(false);
    });

    it('classifies /api/auth/reset-password and sub-routes as public', () => {
      expect(isPublicApiPath('/api/auth/reset-password')).toBe(true);
      expect(isPublicApiPath('/api/auth/reset-password/something')).toBe(true);
    });

    it('classifies /api/auth/invitaciones sub-routes as public', () => {
      expect(isPublicApiPath('/api/auth/invitaciones/some-token')).toBe(true);
    });
  });

  // ── CATEGORY 3: TOKEN_AUTH routes ──
  describe('CATEGORY 3 — TOKEN_AUTH (token-based, no JWT session)', () => {
    it.each([
      '/api/public/cargar/some-token',
      '/api/public/portal',
      '/api/public/portal/123',
      '/api/sgie/agenda/ics/feed',
    ])('classifies %s as public (non-session)', (route) => {
      expect(isPublicApiPath(route)).toBe(true);
      expect(isSessionApiPath(route)).toBe(false);
    });
  });

  // ── CATEGORY 4: WEBHOOK_AUTH routes ──
  describe('CATEGORY 4 — WEBHOOK_AUTH (signature-based)', () => {
    it.each([
      '/api/webhooks/signature/some-provider',
      '/api/email/inbound',
      '/api/email/inbound/some-path',
    ])('classifies %s as public (non-session)', (route) => {
      expect(isPublicApiPath(route)).toBe(true);
      expect(isSessionApiPath(route)).toBe(false);
    });
  });

  // ── CATEGORY 5: CRON_AUTH routes ──
  describe('CATEGORY 5 — CRON_AUTH (cron-secret-based)', () => {
    it.each([
      '/api/revalidate',
      '/api/cron/sgie/procesar',
      '/api/cron/anything',
    ])('classifies %s as public (non-session)', (route) => {
      expect(isPublicApiPath(route)).toBe(true);
      expect(isSessionApiPath(route)).toBe(false);
    });
  });

  // ── CATEGORY 6: SESSION_AUTH routes ──
  describe('CATEGORY 6 — SESSION_AUTH (JWT required)', () => {
    it.each([
      '/api/admin/anything',
      '/api/admin/users',
      '/api/sgie/cockpit',
      '/api/sgie/casos',
      '/api/nonexistent-internal',
    ])('classifies %s as session API (requires JWT)', (route) => {
      expect(isPublicApiPath(route)).toBe(false);
      expect(isSessionApiPath(route)).toBe(true);
    });

    it('non-API paths are not classified as session API', () => {
      expect(isSessionApiPath('/intranet/admin')).toBe(false);
      expect(isSessionApiPath('/blog/some-post')).toBe(false);
      expect(isSessionApiPath('/')).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Proxy Integration Tests — Routing behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('proxy — integration routing', () => {
  const validToken = signSessionToken({
    userId: 'u1',
    email: 'test@example.test',
    rol: 'admin',
    tokenVersion: 0,
  });

  // ── 1. PUBLIC API routes return next (not redirected/blocked) ──
  describe('1. PUBLIC API routes pass through', () => {
    it.each([
      '/api/health',
      '/api/health/readiness',
      '/api/contacto',
      '/api/consulta',
      '/api/chat',
      '/api/delitos/count',
      '/api/indexnow-key',
      '/api/og',
    ])('returns next for %s without JWT', async (path) => {
      const request = new NextRequest(`https://example.test${path}`);
      const response = await proxy(request);
      // Should not be redirected or blocked.
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('x-correlation-id')).toBeTruthy();
    });
  });

  // ── 2. PRE_AUTH routes pass through without JWT ──
  describe('2. PRE_AUTH routes pass through without JWT', () => {
    it.each([
      '/api/auth/login',
      '/api/auth/2fa/verify',
      '/api/auth/reset-password',
      '/api/auth/reset-password/something',
      '/api/auth/invitaciones/some-token',
    ])('allows %s without JWT', async (path) => {
      const request = new NextRequest(`https://example.test${path}`);
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  // ── 3. TOKEN_AUTH routes pass through ──
  describe('3. TOKEN_AUTH routes pass through', () => {
    it.each([
      '/api/public/cargar/some-token',
      '/api/public/portal',
      '/api/sgie/agenda/ics/feed',
    ])('allows %s without JWT', async (path) => {
      const request = new NextRequest(`https://example.test${path}`);
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  // ── 4. WEBHOOK_AUTH routes pass through ──
  describe('4. WEBHOOK_AUTH routes pass through', () => {
    it.each([
      '/api/webhooks/signature/some-provider',
      '/api/email/inbound',
    ])('allows %s without JWT', async (path) => {
      const request = new NextRequest(`https://example.test${path}`);
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  // ── 5. CRON_AUTH routes pass through ──
  describe('5. CRON_AUTH routes pass through', () => {
    it.each([
      '/api/revalidate',
      '/api/cron/sgie/procesar',
    ])('allows %s without JWT', async (path) => {
      const request = new NextRequest(`https://example.test${path}`);
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  // ── 6. SESSION_AUTH routes are blocked without JWT ──
  describe('6. SESSION_AUTH routes blocked without JWT', () => {
    it.each([
      '/api/admin/anything',
      '/api/sgie/cockpit',
    ])('blocks %s without JWT (401)', async (path) => {
      const request = new NextRequest(`https://example.test${path}`);
      const response = await proxy(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('No autorizado');
    });

    it('allows /api/admin/anything with valid admin JWT', async () => {
      const request = new NextRequest('https://example.test/api/admin/anything', {
        headers: { cookie: `token=${validToken}` },
      });
      const response = await proxy(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  // ── 7. Invalid JWT token returns 401 ──
  describe('7. Invalid JWT token returns 401', () => {
    it('returns 401 for malformed token on session route', async () => {
      const request = new NextRequest('https://example.test/api/admin/users', {
        headers: { cookie: 'token=not-a-real-jwt' },
      });
      const response = await proxy(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('No autorizado');
    });

    it('returns 401 for empty token on session route', async () => {
      const request = new NextRequest('https://example.test/api/admin/users', {
        headers: { cookie: 'token=' },
      });
      const response = await proxy(request);
      expect(response.status).toBe(401);
    });
  });

  // ── 8. Non-existent routes are not accessible via proxy bypass ──
  describe('8. Non-existent routes are not accidentally accessible', () => {
    it('unrecognized API routes are treated as session routes (blocked without JWT)', async () => {
      const request = new NextRequest('https://example.test/api/nonexistent-route');
      const response = await proxy(request);
      // Unknown API route should be classified as session API
      // and blocked with 401 when no JWT is present.
      expect(response.status).toBe(401);
    });

    it('unrecognized non-API routes pass through for Next.js 404', async () => {
      const request = new NextRequest('https://example.test/some/unknown/page');
      const response = await proxy(request);
      // Non-API, non-intranet, non-public routes pass through to Next.js 404.
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  // ── 9. Routes with query strings work correctly ──
  describe('9. Routes with query strings work correctly', () => {
    it('public API route with query string passes through', async () => {
      const request = new NextRequest('https://example.test/api/health?param=1');
      const response = await proxy(request);
      expect(response.status).toBe(200);
    });

    it('session route with query string blocked without JWT', async () => {
      const request = new NextRequest('https://example.test/api/admin/users?page=2');
      const response = await proxy(request);
      expect(response.status).toBe(401);
    });
  });

  // ── 10. Routes with trailing slash ──
  describe('10. Routes with trailing slash', () => {
    it('public API route with trailing slash is classified correctly', () => {
      // /api/health/ matches because the prefix check
      // pathname.startsWith('/api/health/') is true.
      expect(isPublicApiPath('/api/health/')).toBe(true);

      // /api/health (exact) also matches.
      expect(isPublicApiPath('/api/health')).toBe(true);
    });

    it('NextRequest normalizes trailing slash in pathname', async () => {
      const request = new NextRequest('https://example.test/api/health/');
      const response = await proxy(request);
      // NextRequest pathname strips trailing slashes, so this should pass through.
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('prefix-based public route with trailing content after slash works', () => {
      // /api/delitos/ matches the prefix since startsWith('/api/delitos/')
      // or pathname === '/api/delitos' both work.
      expect(isPublicApiPath('/api/delitos/count')).toBe(true);
    });

    it('session API route with trailing slash is blocked without JWT', async () => {
      const request = new NextRequest('https://example.test/api/admin/');
      // NextRequest may strip trailing slash; either way the route is session API.
      const response = await proxy(request);
      expect(response.status).toBe(401);
    });
  });
});

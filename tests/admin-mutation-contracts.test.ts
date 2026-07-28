import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWhatsAppSignature } from '@/app/api/whatsapp/route';

const ROOT = resolve(import.meta.dirname, '..');

function routeFiles(directory: string): string[] {
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? routeFiles(path) : entry.name === 'route.ts' ? [path] : [];
  });
}

const ADMIN_MUTATIONS = [
  'app/api/admin/alertas/route.ts',
  'app/api/admin/reglas-comunicacion/route.ts',
  'app/api/admin/simulador/route.ts',
];

const NON_CSRF_MUTATION_CONTRACTS: Record<string, RegExp> = {
  'app/api/admin/usuarios/route.ts': /status:\s*405/,
  'app/api/auth/2fa/verify/route.ts': /verifyTwoFactorChallenge/,
  'app/api/auth/login/route.ts': /verifyPassword/,
  'app/api/auth/logout/route.ts': /createLogoutResponse/,
  'app/api/auth/register/route.ts': /public_register_disabled/,
  'app/api/auth/reset-password/route.ts': /validarTokenReset/,
  'app/api/chat/route.ts': /rateLimit/,
  'app/api/consulta/route.ts': /verifyTurnstileToken/,
  'app/api/contacto/route.ts': /verifyTurnstileToken/,
  'app/api/cron/sgie/procesar/route.ts': /function autorizado/,
  'app/api/descargar/route.ts': /verifyTurnstile/,
  'app/api/email/inbound/route.ts': /verifyResendWebhook/,
  'app/api/public/cargar/[token]/route.ts': /reservarEnlaceAtomicamente/,
  'app/api/revalidate/route.ts': /timingSafeEqual/,
  'app/api/subscribe/route.ts': /verifyTurnstileToken/,
  'app/api/webhooks/signature/[provider]/route.ts': /processWebhook/,
  'app/api/whatsapp/route.ts': /verifyWhatsAppSignature/,
};

describe('contratos de mutaciones administrativas', () => {
  it.each(ADMIN_MUTATIONS)('%s exige sesión admin, CSRF y Zod', (file) => {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    expect(source).toContain('requireAdmin(request)');
    expect(source).toContain('validateCsrf(request)');
    expect(source).toMatch(/z\.object\(/);
  });

  it('el simulador es determinista y declara que es una previsualización', () => {
    const source = readFileSync(resolve(ROOT, 'app/api/admin/simulador/route.ts'), 'utf8');
    expect(source).not.toContain('Math.random');
    expect(source).toContain("mode: 'deterministic-preview'");
  });

  it('toda ruta mutable sin CSRF pertenece a una excepción contractual verificable', () => {
    const mutationPattern = /export async function (?:POST|PUT|PATCH|DELETE)\b/;
    const routesWithoutCsrf = routeFiles('app/api')
      .filter((file) => {
        const source = readFileSync(resolve(ROOT, file), 'utf8');
        return mutationPattern.test(source) && !source.includes('validateCsrf');
      })
      .sort();

    expect(routesWithoutCsrf).toEqual(Object.keys(NON_CSRF_MUTATION_CONTRACTS).sort());

    for (const [file, contractPattern] of Object.entries(NON_CSRF_MUTATION_CONTRACTS)) {
      expect(readFileSync(resolve(ROOT, file), 'utf8'), file).toMatch(contractPattern);
    }
  });

  it('el webhook de WhatsApp falla cerrado y valida la firma del cuerpo crudo', () => {
    const body = '{"entry":[]}';
    const secret = 'test-app-secret';
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

    expect(verifyWhatsAppSignature(body, signature, secret)).toBe(true);
    expect(verifyWhatsAppSignature(`${body} `, signature, secret)).toBe(false);
    expect(verifyWhatsAppSignature(body, null, secret)).toBe(false);
    expect(verifyWhatsAppSignature(body, signature, undefined)).toBe(false);
  });
});

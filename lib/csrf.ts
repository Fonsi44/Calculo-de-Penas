import { getClientIp } from './rate-limit';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'https://www.pinedayasociadoshn.com',
  'https://pinedayasociadoshn.com',
  'https://calculo-de-penas-nextjs.vercel.app',
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function validateCsrf(request: Request): void {
  if (SAFE_METHODS.has(request.method)) return;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (!origin && !referer) return;

  const source = origin ?? referer!;
  try {
    const parsed = new URL(source);
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
      const allowedUrl = new URL(allowed);
      if (parsed.hostname === 'localhost' && allowedUrl.hostname === 'localhost') return true;
      return parsed.origin === allowedUrl.origin;
    });
    if (!isAllowed) {
      throw new Error(`CSRF: origen no permitido: ${source}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('CSRF')) throw err;
    throw new Error(`CSRF: origen inválido: ${source}`);
  }
}

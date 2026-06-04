# CSP — Content Security Policy

## Estado actual (commit pendiente de A4)

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests   [solo en producción]
```

## Por qué se mantiene `'unsafe-inline'` para scripts

Next.js (incluyendo 16.x) emite **scripts inline** para:
- Hidratación de Server Components
- Chunks críticos (`<script>__NEXT_DATA__ = ...</script>`)
- Inline `<script>` con metadata de React

Quitar `'unsafe-inline'` rompe la app en producción sin configuración adicional.
La forma correcta de endurecer este punto es usar **nonces**:

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
  `;
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
  return response;
}
```

Esto se implementará en **Fase F2** (migración de middleware → proxy Next 17),
donde el proxy nativo de Next soporta nonces automáticos.

## Por qué se quitó `'unsafe-eval'`

`eval()` y `new Function()` no se usan en este proyecto:
- `bcryptjs` no usa eval
- `jsonwebtoken` no usa eval
- `zod` no usa eval
- No usamos librerías que generen código dinámico

El cambio es **seguro** y reduce la superficie de ataque XSS.

## Por qué se mantiene `'unsafe-inline'` para styles

Tailwind CSS v4 genera estilos dinámicos en tiempo de ejecución (CSS-in-JS-like).
Quitar `'unsafe-inline'` para styles rompería la aplicación de clases utility.

Alternativa: usar hashes por build (similar a nonces). Demasiado frágil para
este proyecto (Tailwind no expone API de hash estable).

## Headers adicionales

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME-sniffing |
| `X-Frame-Options` | `DENY` | Anti-clickjacking (CSP frame-ancestors es el principal) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limitar info de referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Desactivar APIs no usadas |
| `X-DNS-Prefetch-Control` | `off` | Reducir fuga de DNS en redes inseguras |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Solo producción. 2 años. |
| `Cache-Control` (API) | `no-store, max-age=0` | APIs nunca cachean |

## Verificación

```bash
curl -I https://calculo-de-penas-nextjs.vercel.app/ | grep -i content-security
```

Debe devolver:
```
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

## Roadmap

- [x] A4: Quitar `unsafe-eval`, añadir `object-src 'none'`
- [ ] F2 (Next 17): implementar nonces en proxy nativo
- [ ] F2: cambiar styles a hashes por build

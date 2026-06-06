# 06 — Seguridad

## Autenticación

- JWT firmado con `JWT_SECRET` (≥32 chars, obligatorio en producción)
- Soporte de rotación: `JWT_SECRET_PREVIOUS` para transición entre secretos
- Cookie `token`: `HttpOnly; Path=/; SameSite=Lax; Secure` (en producción)
- Helpers en `lib/auth.ts`: `requireAuth`, `requireAdmin`, `authFailureResponse`
- Rate limiting en login: 5 intentos/minuto por IP (tabla `rate_limits` en Neon)

## Autorización por endpoint

| Ruta | Método | Auth | Ownership |
|------|--------|------|-----------|
| `/api/auth/*` | POST | público | — |
| `/api/calcular` | POST | user | — |
| `/api/calculos/[id]` | GET/DELETE | user | sí (userId) |
| `/api/casos/[id]` | GET/PUT | user | sí (userId) |
| `/api/casos/[id]/pdf` | GET | user | sí (userId) |
| `/api/delitos` | GET/POST | user/admin | — |
| `/api/delitos/[id]` | GET/PUT/DELETE | user/admin | — |
| `/api/cp` | GET/POST | user/admin | — |
| `/api/contacto` | POST | público | rate-limited 3/hora |
| `/api/seed` | POST | admin | — |

## Protecciones implementadas

- **IDOR cerrado**: todas las rutas con `[id]` verifican `userId` del recurso vs. token
- **Rate limiting**: login (5/min) y contacto (3/hora) vía Neon DB
- **CSP**: 7 directivas configuradas en `next.config.ts`
- **Security headers**: proxy añade X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- **Restricción de dominio**: registro solo con email `@pinedayasociadoshn.com` (Fase 11)
- **Auditoría**: eventos críticos registrados en tabla `auditoria_eventos` (no bloqueante)
- **Validación al arranque**: `NODE_ENV=production` verifica `JWT_SECRET` y `DATABASE_URL`
- **Migración de secretos**: rotación vía `JWT_SECRET_PREVIOUS` sin downtime

## Variables de entorno requeridas

- `DATABASE_URL` — conexión Neon PostgreSQL
- `JWT_SECRET` — ≥32 chars
- `NEXT_PUBLIC_SITE_URL` — URL canónica
- `RESEND_API_KEY` — API key de Resend (formulario contacto)
- Opcional: `JWT_SECRET_PREVIOUS`, `NEXT_PUBLIC_NOINDEX`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`

## Pendientes

- Branch protection en GitHub (no disponible en plan gratuito)
- Alertas automáticas de 5xx (Vercel Hobby no las soporta)
- Prueba periódica de PITR (recomendada cada 3 meses)
- Rate limiting tras proxies/CDN requiere validación de `x-forwarded-for`

# 04 — Seguridad

## Autenticación

- **JWT** firmado con `JWT_SECRET` (≥32 chars, obligatorio en producción).
- Cookie `token` con `HttpOnly; Path=/; SameSite=Lax; Secure` (en `NODE_ENV=production`).
- TTL: 1 día.
- Hash de contraseñas: `bcryptjs` (10 rounds).
- Helpers centralizados en `lib/auth.ts`:
  - `requireAuth(request)` → `AuthUser` o lanza `AuthError(401)`.
  - `requireAdmin(request)` → `AuthUser` con `rol === 'admin'` o lanza `AuthError(403)`.
  - `authFailureResponse(error)` → `Response` JSON con código correcto.

## Autorización por endpoint

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/auth/{login,logout,me,register}` | público | público | — | — |
| `/api/delitos/count` | público | — | — | — |
| `/api/delitos/calidad` | user | — | — | — |
| `/api/delitos` | user | admin | — | — |
| `/api/delitos/[id]` | user | — | admin | admin |
| `/api/cp` | user | admin | — | — |
| `/api/cp/[id]` | user | — | admin | — |
| `/api/calcular` | — | user | — | — |
| `/api/calculos` | user (propios) | user | — | — |
| `/api/casos` | user (propios) | user | — | — |
| `/api/casos/[id]` | user + ownership | — | user + ownership | — |
| `/api/casos/[id]/pdf` | user + ownership | — | — | — |
| `/api/seed` | — | admin | — | — |
| `/api/clasificaciones` | user | — | — | — |

## Protección contra IDOR

- `casos` y `calculos` se filtran siempre por `usuarioId === user.userId`.
- Ownership se valida en GET y PUT antes de devolver/actualizar.
- PUT `/api/casos/[id]` aplica whitelist de campos (no mass-assignment).

## Middleware (`middleware.ts`)

- Lista explícita de rutas API públicas: `/api/auth/{login,logout,register,me}`, `/api/delitos/count`.
- Para páginas: solo `/login` y `/_not-found` son públicas.
- Cualquier ruta no pública sin token → 401 JSON (en API) o redirect a `/login` (en páginas).
- Advertencia: en Next.js 17 la convención `middleware` será `proxy`.

## Variables de entorno

| Variable | Requerida | Validación |
|----------|-----------|------------|
| `DATABASE_URL` | sí | formato `postgresql://…` |
| `JWT_SECRET` | sí | ≥32 caracteres (validado en `lib/auth.ts:validateJwtSecret`) |
| `NODE_ENV` | recomendado | `production` activa `Secure` en cookie y validador estricto |

## Secretos en el repositorio

- `.env` trackeado en `.gitignore` (`.env*`).
- **NO COMMITEAR secretos**. Usar Vercel Environment Variables o Neon connection pool.
- Si se commitea accidentalmente: rotar inmediatamente y limpiar historial con `git filter-repo`.

## Pendientes de seguridad

- **Crítico**: rotar `DATABASE_URL` y `JWT_SECRET` actuales (débiles). Acción del usuario.
- **Crítico**: limpiar `.env` del historial git.
- **Alto**: rate limiting en `/api/auth/login` y `/api/calcular` (sin infra Upstash/KV hoy).
- **Alto**: CSP y security headers en `next.config.ts`.
- **Medio**: añadir `__Host-` prefix a la cookie cuando se despliegue en HTTPS exclusivo.
- **Medio**: logs de auditoría (tabla `auditoria_eventos` no existe en schema).
- **Bajo**: 2FA para admins (no contemplado).

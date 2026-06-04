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
| `DATABASE_URL` | sí | formato `postgresql://…`; recomendado `?sslmode=require` |
| `JWT_SECRET` | sí | ≥32 caracteres y no placeholder (validado en `lib/auth.ts:validateJwtSecret`) |
| `JWT_SECRET_PREVIOUS` | no | ≥32 caracteres. Solo se usa durante la ventana de rotación. |
| `NODE_ENV` | recomendado | `production` activa `Secure` en cookie y validación estricta |

## Validación al arranque

`lib/auth.ts` invoca `validateJwtSecret(secret, role)` al cargar el módulo:

- Rechaza secretos con longitud < 32 (en cualquier entorno).
- En producción, rechaza el fallback de desarrollo y patrones de placeholder
  (`change-in-production`, `dev-only`, `replace-with`, `example`, `placeholder`,
  `lex-honduras-secret`, `tu-secreto`, `your-secret`, `test1234`).
- En desarrollo, los placeholders generan una advertencia por consola pero
  la app arranca (para no bloquear desarrollo local).

Para auditar el entorno actual:

```bash
node scripts/check-secrets.mjs
```

El script:

- Lee `.env` (si existe) y combina con `process.env`.
- En desarrollo: imprime WARN para placeholders.
- En producción: imprime FAIL y sale con código 1 si hay problemas.

## Procedimiento de rotación de secretos

### `JWT_SECRET` (rotación sin invalidar sesiones)

1. Generar nuevo secreto:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
2. En Neon/Vercel/Railway/etc., añadir `JWT_SECRET_PREVIOUS` con el valor
   actual de `JWT_SECRET`.
3. Sustituir `JWT_SECRET` por el nuevo valor.
4. Redesplegar.
5. Tras la ventana de gracia (p. ej. 24h, = TTL de la cookie), eliminar
   `JWT_SECRET_PREVIOUS` y redesplegar.

`lib/auth.ts:verifyToken` acepta tokens firmados con cualquiera de los dos
secretos durante la ventana de rotación.

### `DATABASE_URL` (rotación de credenciales Neon)

1. En Neon console → Project → Roles, regenerar la contraseña del rol
   principal.
2. Copiar la nueva cadena de conexión.
3. En Vercel → Project → Settings → Environment Variables, actualizar
   `DATABASE_URL` para los entornos `Production` y `Preview`.
4. Redesplegar.

## Secretos en el repositorio

- `.env` trackeado en `.gitignore` (`.env*`).
- `.env.example` contiene solo la estructura (sin valores reales).
- **NO COMMITEAR secretos**. Usar Vercel Environment Variables o Neon
  connection pool.
- Si se commitea accidentalmente: rotar inmediatamente y limpiar historial
  con `git filter-repo`.

## Pendientes de seguridad

- **Crítico**: rotar `DATABASE_URL` y `JWT_SECRET` actuales en producción
  (los valores en `.env` de desarrollo son placeholders y `validateJwtSecret`
  los rechaza al arranque en `NODE_ENV=production`).
- **Crítico**: limpiar `.env` del historial git si fue commiteado alguna vez.
- **Alto**: rate limiting en `/api/auth/login` y `/api/calcular` (en memoria,
  sin infra Upstash/KV en producción).
- **Alto**: CSP y security headers en `next.config.ts`.
- **Medio**: tabla `auditoria_eventos` definida en schema pero sin uso
  sistemático desde los endpoints.

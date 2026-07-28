---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Staging Environment

## Propósito
Entorno aislado, equivalente funcional a producción, para validación pre-producción.

## Ramas Git
- Rama activa: `staging/fase6-preproduction`
- No se hace merge a `main` sin autorización explícita.
- No se crean PRs automáticos.

## Variables de entorno (sin valores)

### Identidad y entorno
- `NEXT_PUBLIC_NOINDEX=true` — bloquea indexación
- `APP_ENV=staging` — identifica entorno
- `NEXT_PUBLIC_SITE_URL` — URL de staging
- `NEXT_PUBLIC_SITE_NAME` — nombre del bufete

### Base de datos
- `DATABASE_URL` — URL de la rama Neon de staging
- `ALLOW_TEST_DATABASE=true` — permite operaciones de test
- `E2E_ENV=staging` — marca entorno E2E

### Autenticación
- `JWT_SECRET` — secreto JWT (distinto de producción)
- `ENCRYPTION_KEY` — clave de cifrado TOTP
- `CRON_SECRET` — secreto para jobs programados

### Email (Resend)
- `RESEND_API_KEY` — API key de staging
- `RESEND_FROM_EMAIL` — remitente verificado
- `CONTACT_NOTIFICATION_EMAIL` — destinatario allowlist
- `RESEND_WEBHOOK_SECRET` — verificación webhook

### IA Documental (DeepSeek)
- `IA_DOCUMENTAL_API_KEY` — API key staging
- `IA_DOCUMENTAL_MODEL=deepseek-v4-flash`
- `IA_DOCUMENTAL_MODE=ai`
- `IA_DOCUMENTAL_TIMEOUT_MS=60000`

### Blob Storage
- `BLOB_READ_WRITE_TOKEN` — token compartido (misma store)
- `BLOB_STORE_ID` — store ID

### Firma electrónica
- `DROPBOX_SIGN_API_KEY` — sandbox
- `DROPBOX_SIGN_TEST_MODE=true`

### Seguridad
- `TURNSTILE_SITE_KEY` — claves de staging
- `TURNSTILE_SECRET_KEY` — secreto de staging

## Proveedores
- Resend: API key de staging con remitente verificado
- DeepSeek: API key real con modelo deepseek-v4-flash
- Dropbox Sign: sandbox
- Neon: rama aislada

## Guardias de seguridad
1. `ALLOW_TEST_DATABASE=true` requerido para E2E
2. `lib/staging-guard.ts` — assertNotProduction, assertTestDatabase
3. `lib/email-allowlist.ts` — redirige correos fuera de producción
4. `scripts/e2e/guard.mjs` — bloquea E2E sin base aislada
5. Vercel Deployment Protection — SSO en staging

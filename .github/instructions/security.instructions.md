---
name: 'Security Standards'
description: 'Reglas de seguridad para backend, lib, middleware y config (auth, CSRF, rate limit, secretos)'
applyTo: 'app/api/**,lib/**,middleware.ts,next.config.*'
---
# Seguridad — Pineda y Asociados

- **Auth:** JWT con propósito explícito + bcrypt + 2FA TOTP; cookies
  `__Host-token` (HttpOnly, Secure, SameSite=Lax). Ver `lib/auth.ts`.
- **Proxy:** `proxy.ts` protege `/intranet/*` y `/api/*`; rol admin para
  `/api/admin/*`. Node runtime (firma HS256).
- **Rate limiting:** login 5/60s, contacto 10/15min, calcular 30/min.
- **Sanitización:** `sanitize-html` en todo HTML de entrada.
- **Validación:** Zod en todas las rutas POST/PATCH/PUT.
- **Secretos:** nunca hardcodear (`OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `JWT_SECRET`, `ENCRYPTION_KEY`,
  `INDEXNOW_KEY`, `DEEPSEEK_API_KEY`, `IA_DOCUMENTAL_API_KEY`, `CRON_SECRET`).
  No revelar valores; informar solo ubicación y tipo.
- **PII:** no loguear ni enviar consultas legales, nombres, correos,
  teléfonos ni identificadores de expedientes.
- **Intranet:** `/intranet/*`, `/admin/*` son PRIVADAS (R6).
- **Chat público:** motor de reglas local, sin LLM externo.
- **Política comercial:** única formulación «Evaluación inicial
  confidencial» (`lib/marketing-policy.ts`); no publicar variantes.
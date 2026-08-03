---
name: backend-api-security
description: Backend y API del proyecto — rutas app/api, Zod, auth JWT, RBAC/capacidades, CSRF, rate limiting, logs seguros, idempotencia y caché. Usar para implementar o auditar código de servidor. No usar para frontend ni DB.
---

# Backend y seguridad API — Pineda y Asociados

## Reglas base (AGENTS.md §6)

- Auth: JWT propósito explícito + bcrypt + 2FA TOTP; cookies `__Host-token`.
- Proxy (`proxy.ts`) protege `/intranet/*` y `/api/*`; rol admin para
  `/api/admin/*`. Corre en Node runtime (HS256).
- Rate limiting: login 5/60s, contacto 10/15min, calcular 30/min, chat 12/10min.
- Zod en todas las rutas POST/PATCH/PUT; `sanitize-html` en HTML de entrada.
- Chat público: motor de reglas local, **sin LLM externo** (DEEPSEEK_* no aplica).

## Procedimiento

1. Leer la ruta o servicio a modificar y su contexto (`AGENTS.md` §1).
2. Validar entrada con Zod; sanitizar HTML; aplicar rate limit y CSRF.
3. No loguear PII, consultas legales, nombres, correos ni identificadores.
4. Errores: no ocultar con try/catch vacíos (R20).

## Validaciones

- `npm run lint` + `npx tsc --noEmit` + pruebas del módulo.
- Para cambios de auth/seguridad: suite completa (`npm run test` + `npm run build`).

## Anti-patrones

- Hardcodear secretos (`JWT_SECRET`, `RESEND_API_KEY`, etc.).
- Exponer la intranet; bypass de proxy o validación.
- Llamar a LLM externo desde el chat público.

## Detenerse y pedir intervención

- Cambio en `lib/auth.ts`, `proxy.ts` o schema de seguridad sin autorización expresa.

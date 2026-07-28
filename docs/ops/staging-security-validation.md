---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Validación de Seguridad en Staging

## Autenticación y sesiones

- Cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax)
- JWT con propósito explícito
- 2FA TOTP activo
- Logout invalida sesión

## RBAC y capacidades

- Admin: acceso completo
- Abogado: solo expedientes propios
- Cliente: solo portal de cliente
- Usuario suspendido: bloqueado
- SGIE revocado: bloqueado

## Aislamiento organizativo

- Org A no accede a expedientes de Org B
- Scope por organización en todas las queries
- Verificación en access-service.ts

## Protecciones de staging

- `NEXT_PUBLIC_NOINDEX=true`: noindex, nofollow, noarchive
- `X-Robots-Tag: noindex, nofollow` en cabeceras HTTP
- Vercel Deployment Protection (SSO)
- Email allowlist: solo destinatarios autorizados
- Base de datos aislada (rama Neon staging)

## Pruebas de seguridad ejecutadas

- [x] Organización A no accede a B
- [x] Cliente no accede a SGIE interno
- [x] Abogado no accede a Admin sin permisos
- [x] Usuario suspendido bloqueado
- [x] CSRF en rutas POST/PATCH/PUT (Zod validation)
- [x] Rate limiting en login (5/60s), contacto (10/15min)
- [x] Sanitización HTML en entradas de usuario
- [x] Noindex activo en staging
- [x] Robots.txt bloquea todo en staging
- [x] Cache privada (no-store)

## Pendientes para producción

- [ ] Revisar CSP (nonce-based en lugar de 'unsafe-inline')
- [ ] Auditoría de secretos en git history
- [ ] Rotación de JWT_SECRET
- [ ] Configurar HSTS preload

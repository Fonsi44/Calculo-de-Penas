---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Checklist de PR - Fase 0 seguridad

## Resumen de Fase 0

La rama `security/fase-0-emergency-lockdown` cierra riesgos criticos y altos detectados en registro publico, CSRF, rate limit, captcha, email de contacto e inbound email. No incluye cambios de diseno ni push.

## Commits incluidos

- `7ba8b05 seguridad: cerrar registro publico`
- `3d735ff seguridad: exigir csrf en mutaciones autenticadas`
- `8daa792 seguridad: cerrar fallos abiertos operativos`

## Riesgos corregidos

- Registro publico libre deshabilitado.
- Nuevas cuentas por default quedan con `rol = pendiente`.
- Nuevas cuentas por default quedan con `active = false`.
- El registro publico no firma token de sesion.
- Mutaciones autenticadas revisadas con CSRF.
- Rate limit sensible falla cerrado en produccion ante error de DB.
- Captcha falla cerrado en produccion si faltan claves Turnstile.
- Email de contacto ya no usa fallback personal hardcodeado.
- Inbound email no inserta HTML externo directamente en correos internos.

## Riesgos pendientes

- La migracion `0024_security_user_defaults.sql` debe aplicarse en Neon staging/preview y luego produccion con ventana controlada.
- Usuarios existentes no fueron modificados; se requiere auditoria manual de roles y estado.
- Variables de entorno reales de Vercel deben verificarse sin exponer valores.
- Warnings existentes de build sobre `Cache-Control` y Edge Runtime quedan fuera de esta fase.

## Pasos manuales antes de merge

- Ejecutar validacion local: `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npx next build`.
- Ejecutar `npm run security:validate-staging` con `DATABASE_URL` de Neon staging/preview.
- Confirmar que `admins_activos >= 1` antes y despues.
- Confirmar defaults esperados en `usuarios.rol` y `usuarios.active`.
- Revisar que Vercel Preview tenga variables obligatorias.
- Revisar el diff del PR para confirmar que no hay secretos ni cambios de UI publica no solicitados.

## Pasos manuales despues de deploy preview

- Probar login con usuario admin activo.
- Confirmar que `/api/auth/register` responde bloqueado.
- Probar creacion de usuario desde panel admin.
- Confirmar que formularios publicos con Turnstile funcionan en preview.
- Confirmar que contacto/consulta envian notificacion al correo configurado.
- Revisar logs de Vercel Preview por errores 403/429/500 inesperados.

## Checklist para Vercel

- `DATABASE_URL` de Preview apunta a Neon staging/preview.
- `JWT_SECRET` configurado y fuerte.
- `TURNSTILE_SECRET_KEY` configurado.
- `TURNSTILE_SITE_KEY` o equivalente backend configurado.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` configurado.
- `CONTACT_NOTIFICATION_EMAIL` configurado.
- `RESEND_API_KEY` configurado si se prueban correos.
- `RESEND_FROM_EMAIL` usa dominio verificado.
- `RESEND_WEBHOOK_SECRET` configurado si inbound esta activo.
- `NEXT_PUBLIC_NOINDEX=true` en Preview.
- No se copiaron secretos de Production sin revision.

## Checklist para Neon

- URL usada pertenece a staging/preview.
- Existe al menos un admin activo antes de migrar.
- Migracion `0024_security_user_defaults.sql` aplicada en staging/preview.
- Defaults verificados con `information_schema.columns`.
- Conteos agregados por `rol`/`active` revisados.
- No se ejecutaron updates masivos sobre usuarios existentes.

## Checklist para usuarios existentes

- Identificar todos los usuarios `admin`.
- Confirmar que al menos uno esta `active = true` y `bloqueado = false`.
- Revisar usuarios `abogado` activos y confirmar que siguen siendo necesarios.
- Revisar usuarios con roles desconocidos o pendientes.
- No listar ni compartir emails completos en reportes publicos.

## Comandos de validacion local

```powershell
npm run lint
npx tsc --noEmit
npm run test
npx next build
```

## Criterios para aprobar el merge

- Lint, typecheck, tests y build pasan.
- Script staging ejecutado contra URL confirmada como staging/preview.
- `admins_activos >= 1` antes y despues.
- Defaults de `usuarios.rol` y `usuarios.active` correctos en staging.
- No hay secretos en diff, logs o documentacion.
- No hay cambios de diseno o textos publicos no justificados.

## Criterios para bloquear el merge

- No se puede confirmar que la DB usada sea staging/preview.
- `admins_activos = 0`.
- Fallan lint, typecheck, tests o build.
- Faltan variables obligatorias en Vercel Preview para probar formularios/auth/email.
- Aparecen secretos o URLs completas en archivos, logs o comentarios.
- La migracion afecta datos existentes de forma inesperada.

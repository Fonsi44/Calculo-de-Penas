---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# PR de seguridad y estabilizacion

## Titulo sugerido del PR

Seguridad: cierre de registro publico, CSRF y estabilizacion de build preview

## Resumen ejecutivo

Esta rama concentra el cierre de emergencia de seguridad y la preparacion operativa para validar staging/preview antes de merge. El cambio bloquea el registro publico, evita activacion/rol privilegiado por default, exige CSRF en mutaciones autenticadas, endurece rate limit/captcha/email en produccion y prepara Vercel Preview para builds reproducibles con `npm ci` y `npm run build:ci`.

No incluye migraciones aplicadas, cambios de produccion, secretos, cambios de diseno ni push.

## Commits incluidos

- `7ba8b05 seguridad: cerrar registro publico`
- `3d735ff seguridad: exigir csrf en mutaciones autenticadas`
- `8daa792 seguridad: cerrar fallos abiertos operativos`
- `24b573b seguridad: preparar validacion staging y checklist pr`
- `2acde05 estabilizacion: preparar build ci y vercel preview`
- `ac8a89a limpieza: excluir auditorias ajenas del pr`

## Archivos principales modificados

- `app/api/auth/register/route.ts`
- `app/intranet/login/page.tsx`
- `app/api/admin/usuarios/route.ts`
- `lib/schema.ts`
- `drizzle/migrations/0024_security_user_defaults.sql`
- `drizzle/migrations/meta/_journal.json`
- rutas mutadoras autenticadas bajo `app/api/**/route.ts`
- `lib/rate-limit.ts`
- `lib/captcha.ts`
- `lib/email.ts`
- `app/api/email/inbound/route.ts`
- `scripts/security/validate-staging-security.ps1`
- `docs/security/staging-security-validation.md`
- `docs/security/phase-0-pr-checklist.md`
- `docs/operations/environment-variables.md`
- `docs/operations/build-and-deploy.md`
- `package.json`
- `vercel.json`
- `next.config.ts`
- tests relacionados con CSRF y rate limit

## Riesgos corregidos

- Registro publico libre deshabilitado.
- Nuevos usuarios quedan por default con `rol = pendiente`.
- Nuevos usuarios quedan por default con `active = false`.
- El endpoint publico de registro no crea sesion.
- Mutaciones autenticadas revisadas con CSRF.
- Rate limit sensible falla cerrado en produccion si la DB no esta disponible.
- Turnstile falla cerrado en produccion si faltan claves.
- Email operativo no cae a destinatario personal hardcodeado.
- Inbound email no inserta HTML externo directamente en reenvios internos.
- Vercel Preview usa `npm ci` con lockfile y `build:ci` sin `postbuild`.
- Se retira la cabecera manual de `Cache-Control` para `/_next/*`, dejando a Next gestionar assets hasheados.

## Validaciones ejecutadas

- `git status`
- `git branch --show-current`
- `git log --oneline -10`
- `git diff main...HEAD --stat`
- `git diff main...HEAD --name-only`
- busqueda de `.env`, `docs/audits/*` y secretos obvios en el diff
- comprobacion mecanica de mutaciones autenticadas sin `validateCsrf`
- `npm run security:validate-staging` sin `DATABASE_URL` para verificar aborto seguro
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- `npm run build:ci`
- `npx next build`

Nota: los builds que usan `next/font/google` requieren red para descargar fuentes en compilacion. Sin red, fallan por Google Fonts; con red permitida pasan.

## Riesgos pendientes

- Migracion `0024_security_user_defaults.sql` pendiente de aplicar en Neon staging/preview.
- Variables reales de Vercel Preview pendientes de verificar sin revelar valores.
- Usuarios existentes pendientes de auditoria manual por rol/estado.
- Google Fonts sigue siendo dependencia de red del build hasta migrar a fuentes locales.
- Warning existente de Edge Runtime: algunas paginas no generan estatico por usar edge runtime.

## Pasos obligatorios antes de merge

1. Confirmar que el PR no incluye `.env`, secretos, `auditoria-acciones.md` ni `docs/audits/*`.
2. Confirmar en Vercel Preview que se usa `npm ci`.
3. Confirmar en Vercel Preview que se usa `npm run build:ci`.
4. Configurar solo variables Preview/Staging necesarias.
5. Ejecutar `npm run security:validate-staging` con `DATABASE_URL` de Neon staging/preview.
6. Aplicar la migracion `0024` solo si el preflight devuelve `admins_activos >= 1`.
7. Probar login admin, creacion de usuarios desde admin, formularios publicos y email operativo en preview.

## Pasos obligatorios despues de deploy preview

1. Probar que `/api/auth/register` responde bloqueado.
2. Probar login de un admin activo.
3. Crear un usuario desde panel admin y confirmar rol explicito/activo.
4. Probar formulario publico con Turnstile configurado.
5. Probar contacto/consulta y confirmar notificacion interna.
6. Revisar logs de Vercel Preview por 401/403/429/500 inesperados.
7. Confirmar que no se ejecuto `postbuild` en preview.

## Pasos para Neon staging/preview

Configurar temporalmente en PowerShell:

```powershell
$env:DATABASE_URL = "<NEON_STAGING_OR_PREVIEW_DATABASE_URL>"
npm run security:validate-staging
```

El script debe:

- no imprimir la URL completa;
- pedir confirmacion explicita de staging/preview;
- abortar si detecta marcador `prod` o `production`;
- verificar `admins_activos >= 1`;
- aplicar migraciones solo con confirmacion `APPLY 0024 TO STAGING`;
- verificar defaults de `usuarios.rol` y `usuarios.active`;
- verificar de nuevo administradores activos.

## Pasos para Vercel Preview

- `installCommand`: `npm ci`
- `buildCommand`: `npm run build:ci`
- confirmar que `NEXT_PUBLIC_NOINDEX=true` en preview;
- confirmar `DATABASE_URL` de Preview hacia Neon staging/preview;
- confirmar `JWT_SECRET`, Turnstile, Resend/email y webhook secret si aplican;
- no copiar secretos de Production sin revision.

## Criterios de bloqueo del merge

- `admins_activos = 0` en staging/preview.
- No se puede confirmar que `DATABASE_URL` sea staging/preview.
- Falla `lint`, typecheck, tests o build con red disponible para Google Fonts.
- El diff incluye `.env`, secretos, `docs/audits/*` o cambios no relacionados.
- Vercel Preview no usa `npm ci` o no usa `npm run build:ci`.
- Formularios publicos quedan bloqueados por falta de Turnstile en preview sin decision explicita.
- Email operativo queda sin `CONTACT_NOTIFICATION_EMAIL` en preview/produccion.

## Plan de rollback

Rollback de codigo:

1. Revertir el merge commit del PR.
2. Redeploy del ultimo commit estable.
3. Confirmar login admin y formularios.

Rollback de migracion `0024`, solo si se aplico y se aprueba volver temporalmente al default anterior:

```sql
ALTER TABLE "usuarios" ALTER COLUMN "rol" SET DEFAULT 'abogado';
ALTER TABLE "usuarios" ALTER COLUMN "active" SET DEFAULT true;
```

Este rollback solo cambia defaults futuros; no modifica usuarios existentes. No se recomienda salvo incidente controlado porque reabre el riesgo de altas activas/privilegiadas por defecto.

Rollback operativo sin revertir codigo:

- restaurar variables faltantes en Vercel Preview/Production;
- desactivar temporalmente pruebas de formularios hasta configurar Turnstile;
- mantener `buildCommand` anterior solo si `build:ci` falla por causa ajena, con decision documentada.

## Texto listo para GitHub PR

### Titulo

Seguridad: cierre de registro publico, CSRF y estabilizacion de build preview

### Descripcion

Este PR aplica el cierre de emergencia de seguridad y deja la rama preparada para validacion staging/preview antes de merge.

Incluye:

- bloqueo del registro publico;
- defaults seguros para usuarios nuevos (`rol = pendiente`, `active = false`);
- migracion `0024_security_user_defaults.sql`;
- CSRF en mutaciones autenticadas;
- fail-closed en rate limit, captcha y email en produccion;
- sanitizacion de inbound email;
- script `security:validate-staging`;
- documentacion de variables, staging, build/deploy y checklist;
- `build:ci`;
- Vercel Preview con `npm ci` y `npm run build:ci`;
- retirada del `Cache-Control` manual para `/_next/*`.

### Checklist

- [ ] No hay `.env` ni secretos en el diff.
- [ ] No hay `docs/audits/*` ni cambios ajenos.
- [ ] Vercel Preview usa `npm ci`.
- [ ] Vercel Preview usa `npm run build:ci`.
- [ ] `security:validate-staging` ejecutado contra Neon staging/preview.
- [ ] `admins_activos >= 1` antes y despues.
- [ ] Migracion `0024` aplicada solo en staging/preview.
- [ ] Login admin probado en preview.
- [ ] Registro publico bloqueado probado en preview.
- [ ] Formularios con Turnstile probados en preview.
- [ ] Email operativo probado en preview.

### Pruebas ejecutadas

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test`
- `npm run build:ci`
- `npx next build`
- `npm run security:validate-staging` sin `DATABASE_URL` para confirmar aborto seguro

### Riesgos pendientes

- Aplicar/verificar migracion `0024` en Neon staging/preview.
- Revisar usuarios existentes por rol/estado.
- Confirmar variables reales de Vercel Preview.
- Google Fonts sigue requiriendo red durante build.
- Warning existente de Edge Runtime.

### Notas para reviewer

Revisar especialmente:

- que `/api/auth/register` no cree usuarios ni sesion;
- que `usuarios.rol` y `usuarios.active` tengan defaults seguros;
- que los endpoints mutadores autenticados tengan CSRF;
- que los fail-closed solo afecten produccion/rutas sensibles;
- que inbound email no inserte HTML externo;
- que `build:ci` no dispare `postbuild`;
- que `vercel.json` use `npm ci` y `npm run build:ci`;
- que no haya cambios de UI publica o branding fuera de alcance.

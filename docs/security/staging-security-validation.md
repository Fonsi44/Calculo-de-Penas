# Validacion segura de staging para seguridad Fase 0

Este documento describe como validar en Neon staging/preview la migracion `0024_security_user_defaults.sql` sin exponer secretos y sin tocar produccion.

## Que valida el script

El script `scripts/security/validate-staging-security.ps1` valida:

- Que existe `DATABASE_URL`.
- Que la URL no se imprime completa.
- Que el operador confirma explicitamente que el destino es staging/preview.
- Que existe al menos un administrador activo antes de migrar.
- Que la migracion se ejecuta solo tras una segunda confirmacion explicita.
- Que los defaults de `usuarios.rol` y `usuarios.active` quedan visibles despues.
- Que sigue existiendo al menos un administrador activo despues.
- Que la distribucion agregada por `rol` y `active` no revela datos personales.

## Configurar temporalmente `DATABASE_URL` en PowerShell

Use una terminal PowerShell nueva y asigne solo la URL de Neon staging/preview:

```powershell
$env:DATABASE_URL = "<NEON_STAGING_OR_PREVIEW_DATABASE_URL>"
```

No guarde este valor en `.env`, no lo pegue en documentos y no lo suba a Git.

## Confirmar que se esta usando staging/preview

Antes de ejecutar el script:

- Verifique en Neon que la cadena pertenece a una rama o base de datos staging/preview.
- Verifique en Vercel que la variable pertenece a Preview o a un entorno de staging, no Production.
- Revise el host y nombre de base que imprimira el script. Nunca se imprime la URL completa.
- Si el host o base contiene `prod` o `production`, el script aborta.

Ejecute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/security/validate-staging-security.ps1
```

Tambien puede usar:

```powershell
npm run security:validate-staging
```

## Resultado esperado

Antes de migrar:

- `admins_activos` debe ser `1` o mayor.

Despues de aplicar:

- `usuarios.rol` debe tener default equivalente a `'pendiente'`.
- `usuarios.active` debe tener default equivalente a `false`.
- `admins_activos` debe seguir siendo `1` o mayor.
- La auditoria por `rol`/`active` debe mostrar solo conteos agregados.

## Si no hay admin activo

No aplique la migracion. El riesgo es dejar staging sin operador capaz de crear o activar usuarios desde el panel admin.

Accion recomendada:

1. Identificar por un canal administrativo seguro cual debe ser el usuario administrador.
2. Activarlo o promoverlo mediante un procedimiento manual revisado.
3. Volver a ejecutar el preflight.

## Si faltan variables de entorno

Si falta `DATABASE_URL`, el script aborta. Configure una URL temporal de staging/preview en la sesion PowerShell y vuelva a ejecutar.

Si faltan otras variables de entorno de la aplicacion, no bloquee esta migracion salvo que impidan conectar con Neon staging. Documente el faltante y corrijalo en Vercel Preview antes del deploy de prueba.

## Lo que nunca debe hacerse en produccion

- No ejecutar este script con `DATABASE_URL` de produccion.
- No usar cadenas copiadas desde Vercel Production.
- No aplicar migraciones reales si no se puede confirmar staging/preview.
- No imprimir, guardar ni pegar la URL completa en tickets, chats o documentos.
- No hacer rollback a defaults inseguros salvo incidente aprobado.

## Verificar que la migracion 0024 quedo aplicada

La verificacion principal es:

```sql
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name IN ('rol', 'active')
ORDER BY column_name;
```

Resultado esperado:

- `rol`: default equivalente a `'pendiente'`.
- `active`: default equivalente a `false`.

Tambien confirme que Drizzle registro la migracion en su tabla interna de migraciones si el entorno la tiene habilitada.

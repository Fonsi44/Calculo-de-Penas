# Build y despliegue

Guia operativa para validar la rama de seguridad antes de PR y despliegue preview.

## Comandos locales recomendados

```powershell
npm run lint
npx tsc --noEmit
npm run test
npm run build:ci
```

Para reproducir el build normal del proyecto:

```powershell
npm run build
```

## Diferencia entre build normal y build CI

- `npm run build`: ejecuta `next build` y despues dispara el lifecycle `postbuild` de npm.
- `npm run build:ci`: ejecuta solo `next build`. No dispara `postbuild`.
- `postbuild`: ejecuta tareas operativas posteriores al build: bump de service worker, verificacion de chunks, generacion de `llms.txt` y submit IndexNow en modo controlado por su propio script.

Use `build:ci` para CI y Vercel Preview cuando solo se quiere compilar y verificar la aplicacion, sin mezclar tareas operativas externas.

## Validacion antes de PR

Antes de abrir o actualizar el PR:

```powershell
npm run lint
npx tsc --noEmit
npm run test
npm run build:ci
```

Si se quiere comprobar el comportamiento completo local, ejecute tambien:

```powershell
npm run build
```

## Validacion en Vercel Preview

Vercel debe usar:

- install: `npm ci`
- build: `npm run build:ci`

Esto aprovecha `package-lock.json` para instalaciones reproducibles y evita tareas `postbuild` durante la compilacion de preview.

Confirme en los logs de Vercel Preview:

- que instala con `npm ci`;
- que compila con `npm run build:ci`;
- que no imprime secretos;
- que no ejecuta migraciones reales;
- que no hay llamadas operativas no deseadas posteriores al build.

## Google Fonts

`app/layout.tsx` usa `next/font/google` para `Cormorant Garamond` y `Manrope`. Durante `next build`, Next descarga CSS/fuentes desde Google Fonts para optimizarlas. En entornos sin red, el build puede fallar aunque el codigo este correcto.

Recomendacion futura: migrar estas fuentes a assets locales con `next/font/local`. No se hizo en esta fase porque implica incorporar archivos de fuentes y puede afectar peso visual/renderizado.

## Migracion 0024 pendiente

La migracion `drizzle/migrations/0024_security_user_defaults.sql` debe aplicarse primero en Neon staging/preview, no en produccion.

Antes de aplicar:

```sql
SELECT COUNT(*) AS admins_activos
FROM usuarios
WHERE rol = 'admin'
  AND active = true
  AND COALESCE(bloqueado, false) = false;
```

Debe devolver `1` o mas.

## Validacion staging de seguridad

Use el script operativo:

```powershell
$env:DATABASE_URL = "<NEON_STAGING_OR_PREVIEW_DATABASE_URL>"
npm run security:validate-staging
```

El script no imprime la URL completa, exige confirmacion explicita de staging/preview, valida administradores activos y permite aplicar la migracion solo con confirmacion adicional.

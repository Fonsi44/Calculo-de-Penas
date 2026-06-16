# Fase 2 — Guía completa de despliegue

## Pre-requisitos

1. ✅ Build de Vercel debe estar en `READY` (verificar en Vercel dashboard)
2. ✅ Archivo `.env` configurado con `DATABASE_URL` de Neon
3. ✅ Node.js 18+ instalado
4. ✅ `psql` cliente instalado (para scripts de validación)

## Paso 1: Commit y push de los fixes

```powershell
cd "C:\Users\Admin\OneDrive - Alfons Roiget\Calculo de penas"

# Verificar cambios pendientes
git status

# Commit de los fixes
git add drizzle/seed-fase2.ts scripts/vincular-supuestos-penales.ts docs/fase2-fixes-compilacion.md
git commit -m "fix(Fase2): corregir name collisions en seed-fase2.ts y vincular-supuestos-penales.ts"

# Push a GitHub
git push origin main
```

## Paso 2: Monitorear build en Vercel

Después del push, el build se iniciará automáticamente. Monitorea:

**Opción A: Vercel Dashboard**
1. Abrir https://vercel.com/pineda-asociados-forms-nuevo
2. Ver "Deployments" → el más reciente debería cambiar de `Building` a `Ready`
3. Si falla, ver logs para identificar error

**Opción B: Vercel CLI (si está instalado)**
```powershell
vercel ls calculo-de-penas-nextjs
```

**Tiempo estimado:** 3-5 minutos

## Paso 3: Ejecutar despliegue completo

Una vez el build esté en `Ready`:

```powershell
cd "C:\Users\Admin\OneDrive - Alfons Roiget\Calculo de penas"
.\scripts\fase2-deploy-complete.ps1
```

Este script ejecutará:
1. ✅ Migración Drizzle (crea tablas y enum)
2. ✅ Seed Fase 2 (remisiones normativas)
3. ✅ Vinculación delitos-supuestos penales

## Paso 4: Validar despliegue

```powershell
.\scripts\fase2-validate-deploy.ps1
```

Validará:
- ✅ Tabla `supuestos_penales` tiene registros
- ✅ Tabla `remisiones_normativas` tiene 3 registros
- ✅ Tabla `agravantes_especificas` accesible
- ✅ Enum `tipo_pena` tiene valores correctos
- ✅ Foreign keys definidas correctamente

## Paso 5: Verificar en Neon Console

1. Abrir https://console.neon.tech/
2. Seleccionar proyecto `pineda-asociados-forms-nuevo`
3. Ir a "Tables"
4. Verificar:
   - `supuestos_penales`: 1+ registros
   - `remisiones_normativas`: 3 registros
   - `agravantes_especificas`: 0 registros (normal)

## Rollback por emergencia

Si algo sale mal:

```powershell
.\scripts\fase2-rollback.ps1
```

Esto eliminará las 3 tablas y el enum, dejando la DB en estado Fase 0.

## Solución de problemas

### Error: "psql: command not found"

**Solución:** Instalar PostgreSQL client o usar alternativa:

```powershell
# Opción 1: Instalar PostgreSQL
winget install PostgreSQL.postgresql

# Opción 2: Usar conexión web Neon
# Ir a Neon Console → SQL Editor → ejecutar queries manualmente
```

### Error: "relation already exists"

**Causa:** Las tablas ya fueron creadas en un intento previo.

**Solución:** Ejecutar rollback primero o continuar con seed/vinculación.

### Error: "Connection refused"

**Causa:** `DATABASE_URL` incorrecta o Neon DB no accesible.

**Solución:**
1. Verificar `.env` tiene `DATABASE_URL` correcta
2. Verificar Neon DB está activa (no paused)
3. Verificar IP no está bloqueada (Neon usa allowlist)

### Build falla en Vercel

**Causa:** TypeScript error o dependencia faltante.

**Solución:**
1. Ver logs en Vercel Dashboard
2. Ejecutar `npm run build` localmente (si es posible)
3. Revisar errores en salida de build

## Validación en producción

Después del despliegue exitoso:

1. ✅ Home carga correctamente: https://www.pinedayasociadoshn.com
2. ✅ Intranet accesible: https://www.pinedayasociadoshn.com/intranet/dashboard
3. ✅ Calculadora funciona: https://www.pinedayasociadoshn.com/calculadora
4. ✅ Blog funciona: https://www.pinedayasociadoshn.com/blog

## Próximos pasos (Fase 3+)

Una vez Fase 2 está validada:

- **Fase 3:** Integrar `supuestos_penales` en el motor de cálculo
- **Fase 4:** UI para gestionar agravantes específicas
- **Fase 5:** UI para gestionar remisiones normativas

## Soporte

Si encuentras problemas no documentados:

1. Revisar logs completos en `docs/fase2-fixes-compilacion.md`
2. Verificar `CHANGELOG.md` para contexto de cambios
3. Ejecutar `npm run build` localmente (si OneDrive lo permite)
4. Consultar Vercel build logs para errores específicos

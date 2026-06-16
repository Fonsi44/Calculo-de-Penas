# Fase 2 — Fixes de compilación aplicados (2026-06-16)

## Problema detectado

El build de Vercel falló en commit af2cf89 con estado ERROR. El build previo (3c7a90c, Fase 0) estaba en READY.

## Causa raíz

**2 name collisions críticos** en scripts de seed y vinculación:

### 1. `drizzle/seed-fase2.ts` (línea 160)

**Error:**
```typescript
import { remisionesNormativas } from '../lib/schema'; // Tabla
const remisionesNormativas = [ ... ]; // Array local ← ERROR
await db.insert(remisionesNormativas).values(remisionesNormativas); // Ambiguo
```

**Fix aplicado:**
```typescript
import { remisionesNormativas as remisionesNormativasTable } from '../lib/schema';
const remisionesNormativas = [ ... ]; // Array local
await db.insert(remisionesNormativasTable).values(remisionesNormativas);
```

### 2. `scripts/vincular-supuestos-penales.ts` (líneas 105, 156)

**Error:**
```typescript
import { supuestosPenales } from '../lib/schema'; // Tabla
await db.insert(supuestosPenales).values(...); // ← ERROR (conflicto)
```

**Fix aplicado:**
```typescript
import { supuestosPenales as supuestosPenalesTable } from '../lib/schema';
await db.insert(supuestosPenalesTable).values(nuevoSupuesto);
```

## Archivos modificados

| Archivo | Líneas | Cambio |
|--------|--------|--------|
| `drizzle/seed-fase2.ts` | 5, 160 | Import renombrado a `remisionesNormativasTable` |
| `scripts/vincular-supuestos-penales.ts` | 5, 105, 156 | Import renombrado a `supuestosPenalesTable` |

## Pasos pendientes

1. **Commit y push de los fixes:**
   ```bash
   cd "C:\Users\Admin\OneDrive - Alfons Roiget\Calculo de penas"
   git add drizzle/seed-fase2.ts scripts/vincular-supuestos-penales.ts
   git commit -m "fix(Fase2): corregir name collisions en seed-fase2.ts y vincular-supuestos-penales.ts"
   git push origin main
   ```

2. **Validar build Vercel:**
   - Monitorear Vercel dashboard
   - Esperar a que build pase de `Building` → `Ready`

3. **Ejecutar migración en Neon DB:**
   ```bash
   npx drizzle-kit push
   # O alternativamente:
   node scripts/load-env.cjs psql ... < drizzle/migrations/0016_fase2_supuesto_penal.sql
   ```

4. **Ejecutar seed:**
   ```bash
   npx tsx drizzle/seed-fase2.ts
   ```

5. **Ejecutar vinculación:**
   ```bash
   npx tsx scripts/vincular-supuestos-penales.ts
   ```

6. **Validar datos:**
   - Verificar en Neon Console que las 3 tablas tengan datos:
     - `supuestos_penales`: 1+ registros
     - `agravantes_especificas`: 0 (requieren supuestos_penales primero)
     - `remisiones_normativas`: 3 registros

## Estado actual

- ✅ Fase 2 diseño schema: COMPLETADO
- ✅ Fase 2 migración SQL: COMPLETADO
- ✅ Fase 2 seed scripts: COMPLETADOS
- ✅ Fase 2 vinculación script: COMPLETADO
- ✅ **Fase 2 fixes de compilación: COMPLETADOS**
- ⏳ **Fase 2 commit/push: PENDIENTE** (requiere git)
- ⏳ **Fase 2 validación build Vercel: PENDIENTE**
- ⏳ **Fase 2 ejecución migración: PENDIENTE**
- ⏳ **Fase 2 ejecución seed: PENDIENTE**
- ⏳ **Fase 2 ejecución vinculación: PENDIENTE**

## Producción

- **Commit activo:** 3c7a90c (Fase 0)
- **URL:** https://www.pinedayasociadoshn.com
- **Estado:** READY, funcional
- **Fase 2 en producción:** NO (bloqueado por build failure)

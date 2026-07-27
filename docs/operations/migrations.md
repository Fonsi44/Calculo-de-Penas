# Estrategia de migraciones

**Owner:** @engineering
**Status:** approved
**Last reviewed:** 2026-07-27

---

## Arquitectura

El repositorio usa dos mecanismos complementarios:

1. **Drizzle ORM (`drizzle-kit`)**: migraciones estándar registradas en `drizzle/migrations/meta/_journal.json`. Cubre los primeros 39 conjuntos de cambios (0000–0038).

2. **Runner manual** (`tools/db/run-migrations.mjs`): para las 17 migraciones aplicadas fuera del journal de Drizzle. Gestionadas mediante manifiesto `tools/db/manual-migrations.json` con checksum SHA-256, orden estable, dependencias y detección de modificaciones.

---

## Comandos

```bash
# Ver estado de todas las migraciones (Drizzle + manuales)
npm run db:migrations:status

# Validar integridad (sin ejecutar SQL)
npm run db:migrations:validate

# Recalcular checksums del manifiesto
npm run db:migrations:checksums

# Aplicar migraciones pendientes
npm run db:migrations:apply
```

---

## Crear una base desde cero

```bash
# 1. Configurar DATABASE_URL apuntando a la base vacía
# 2. Aplicar migraciones Drizzle (journal)
npx drizzle-kit migrate
# 3. Aplicar migraciones manuales
npm run db:migrations:apply
# 4. Verificar
npm run db:migrations:validate
```

## Actualizar una base existente

```bash
# 1. Verificar estado actual
npm run db:migrations:status
npm run db:migrations:validate
# 2. Aplicar Drizzle pendientes
npx drizzle-kit migrate
# 3. Aplicar manuales pendientes
npm run db:migrations:apply
```

## Añadir una migración nueva

```bash
# 1. Modificar lib/schema.ts
# 2. Generar SQL (se registra automáticamente en el journal)
npx drizzle-kit generate
# 3. Verificar
npm run db:migrations:validate
```

---

## Preparación de staging/producción

- **Staging**: ejecutar `npm run db:migrations:status` y `validate` contra la DB de staging.
- **Producción**: requiere `MIGRATE_PRODUCTION=true`. El runner tiene protección que bloquea `apply` si detecta entorno productivo sin esta variable.

---

## Recuperación ante fallo

1. Identificar la migración fallida con `db:migrations:status`.
2. Si es Drizzle: el journal registra qué se aplicó; corregir el SQL y re-ejecutar `drizzle-kit migrate`.
3. Si es manual: cada entrada tiene checksum; si un SQL se modificó después de aplicar, `validate` lo detecta. Corregir y re-ejecutar.

---

## Detección de drift

```bash
npm run db:migrations:validate
```

Detecta:
- SQL sin tracking (ni journal ni manifiesto)
- IDs duplicados
- Dependencias rotas
- Checksums modificados
- Colisiones de prefijos
- Dependencias circulares

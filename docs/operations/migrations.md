# Estrategia de migraciones

**Owner:** @engineering
**Status:** approved
**Last reviewed:** 2026-07-28

---

## Arquitectura

El repositorio usa dos mecanismos complementarios:

1. **Drizzle ORM (`drizzle-kit`)**: migraciones estándar registradas en `drizzle/migrations/meta/_journal.json`. Cubre los primeros 39 conjuntos de cambios (0000–0038).

2. **Runner manual** (`tools/db/run-migrations.mjs`): para las 19 migraciones aplicadas fuera del journal de Drizzle. Gestionadas mediante manifiesto `tools/db/manual-migrations.json` con checksum SHA-256, orden estable, dependencias y detección de modificaciones.

**Total: 58 migraciones (39 Drizzle + 19 manuales)**

---

## Comandos

```bash
# Ver estado de todas las migraciones (Drizzle + manuales)
npm run db:migrations:status

# Validar integridad (sin ejecutar SQL)
npm run db:migrations:validate

# Recalcular checksums del manifiesto
npm run db:migrations:checksums

# Aplicar migraciones pendientes (MODO DRY-RUN: solo valida y muestra orden)
npm run db:migrations:apply

# Aplicar migraciones pendientes (MODO EJECUCIÓN: realmente aplica SQL)
npm run db:migrations:apply -- --execute
```

**Importante**: `npm run db:migrations:apply` sin `--execute` solo valida y muestra el orden. No ejecuta SQL. Para aplicar realmente, usa `--execute`.

---

## Guards de seguridad

El runner incluye verificación de branch Neon para `apply --execute`:

### Ejecución en staging

```bash
ALLOW_STAGING_MIGRATIONS=true \
npm run db:migrations:apply -- --execute
```

Requisitos:
- `DATABASE_URL` apuntando a DB de staging
- `NEON_PRODUCTION_BRANCH_ID` definido
- `ALLOW_STAGING_MIGRATIONS=true`
- El branch actual de Neon NO es el de producción

### Ejecución en producción

```bash
MIGRATE_PRODUCTION=true \
PRODUCTION_MIGRATION_CONFIRMATION=APPLY_PR20_MIGRATIONS \
npm run db:migrations:apply -- --execute
```

Requisitos simultáneos:
- `DATABASE_URL` apuntando a DB de producción
- `NEON_PRODUCTION_BRANCH_ID` definido
- `MIGRATE_PRODUCTION=true`
- `PRODUCTION_MIGRATION_CONFIRMATION=APPLY_PR20_MIGRATIONS`
- El branch actual de Neon ES el de producción
- Aprobación humana expresa

Si alguna condición falla, el runner aborta sin ejecutar SQL (fail-closed).

---

## Secuencia recomendada

1. **status y validate**: `npm run db:migrations:status` + `validate` (sin conexión)
2. **Snapshot o punto de restauración Neon** (antes de aplicar)
3. **Ejecución en staging**: `npm run db:migrations:apply -- --execute`
4. **Segunda ejecución** (confirma idempotencia: debe reportar 0 aplicadas)
5. **Smoke tests**: verificar login, blog, cálculo
6. **Aprobación de producción** (revisión humana + autorización expresa)
7. **Ejecución en producción**: con `MIGRATE_PRODUCTION` + `PRODUCTION_MIGRATION_CONFIRMATION`
8. **Verificación**: `usuarios.token_version` existe, columnas `ai_review_*` en `blog_posts`
9. **Observación** (24h post-deployment)
10. **Rollback** si es necesario: `git revert <merge-commit>`

---

## Crear una base desde cero

```bash
# 1. Configurar DATABASE_URL apuntando a la base vacía
# 2. Aplicar todas las migraciones
npm run db:migrations:apply -- --execute
# 3. Verificar
npm run db:migrations:validate
```

## Actualizar una base existente

```bash
# 1. Verificar estado actual
npm run db:migrations:status
npm run db:migrations:validate
# 2. Aplicar pendientes
npm run db:migrations:apply -- --execute
```

## Añadir una migración nueva

```bash
# 1. Modificar lib/schema.ts
# 2. Generar SQL (se registra automáticamente en el journal)
npx drizzle-kit generate
# 3. Si es manual: añadir entrada en tools/db/manual-migrations.json
# 4. Recalcular checksums
npm run db:migrations:checksums
# 5. Verificar
npm run db:migrations:validate
```

---

## Migraciones destacadas

| ID | Archivo | Propósito |
|----|---------|-----------|
| 0030 | `0030_security_sessions_2fa.sql` | Sesiones + 2FA (contiene sección DOWN separada por `>><down>`) |
| 0031 | `0031_preview_tokens.sql` | Preview tokens (DOWN separada) |
| manual-0055 | `0055_fix_usuarios_token_version.sql` | Re-add `token_version` |
| manual-0056 | `0056_fix_blog_posts_ai_review_columns.sql` | 10 columnas `ai_review_*` faltantes |

### UP/DOWN

Las migraciones 0030 y 0031 incluyen su reversión DOWN en el mismo archivo tras el marcador `>><down>`. El runner ejecuta automáticamente solo la sección UP (antes del marcador). Esto evita que al aplicar desde una base vacía se ejecute UP y luego DOWN, dejando tablas sin crear.

---

## Recuperación ante fallo

- Si una migración falla, el runner aborta y la migración no se registra como aplicada.
- Las migraciones Drizzle usan sentencias no transaccionables (CREATE TABLE).
- Las migraciones manuales se ejecutan secuencialmente.
- Para bases existentes, hacer siempre snapshot o punto de restauración en Neon antes de aplicar.

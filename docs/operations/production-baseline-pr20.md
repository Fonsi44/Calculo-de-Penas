---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Production Baseline PR #20

## Estado

- Proyecto Neon: `spring-frog-35352705` (justicia-verdadera)
- Branch productivo: `production`
- Base seleccionada: `neondb` (210 usuarios, 175 blog posts, 134 publicados, 25 clientes, 29 expedientes)
- Clon de ensayo: `preflight-cutover-pr20`
- Algoritmo Drizzle: SHA-256 hex del SQL completo (compatible con drizzle-orm/migrator.js)

## Verificación estructural (58/58)

Se verificaron contra el clon:

- **CREATE TABLE**: todas las tablas existen (100%)
- **ALTER TABLE ADD COLUMN**: todas las columnas existen (100%)
- **CREATE INDEX**: 56/58 índices existen (2 difieren en nombre: `enlaces_magicos_token_idx`, `embeddings_vector_idx`)
- **CREATE TYPE (enum)**: todos los tipos existen con valores correctos
- **Tracking**: pendiente de aplicar

## Procedimiento de baseline

### 1. Conectar

```bash
export DATABASE_URL=<connection_string_de_produccion>
export NEON_PRODUCTION_BRANCH_ID=<branch_id>
```

### 2. Plan (solo lectura)

```bash
npm run db:migrations:baseline:plan
```

Debe mostrar 58 migraciones verificadas.

### 3. Apply (solo en clon)

```bash
MIGRATION_BASELINE_CONFIRMATION=BASELINE_PREFLIGHT_CLONE \
npm run db:migrations:baseline:apply
```

Esto registra las 58 entradas en `drizzle.__drizzle_migrations` + `sgie_schema_migrations` usando advisory lock y transacción.

### 4. Verificar

```bash
npm run db:migrations:status
npm run db:migrations:validate
```

Resultado esperado: 58 registradas, 0 pendientes, 0 drift.

## Cuentas sintéticas

La base `neondb` contiene ~203 usuarios con email `@test.local`, `auth-test@`, `sidebar-test@`, etc.

### Neutralización (dry-run primero)

```bash
node tools/ops/disable-synthetic-production-users.mjs
```

### Aplicar

```bash
DISABLE_SYNTHETIC_USERS=true \
SYNTHETIC_USERS_CONFIRMATION=DISABLE_ON_PREFLIGHT_CLONE \
node tools/ops/disable-synthetic-production-users.mjs
```

## Vercel Production

Actualmente apunta a una base Prisma legacy. Después del baseline y neutralización, cambiar:

- `DATABASE_URL` → proyecto `spring-frog-35352705`, branch `production`, base `neondb`
- `DATABASE_URL_UNPOOLED` → misma conexión (sin pool)
- Verificar `POSTGRES_URL`, `POSTGRES_PRISMA_URL` legacy

## Rollback

1. Restaurar variables Vercel anteriores
2. Redeploy deployment anterior
3. Si hay cambios en `neondb`: restaurar desde snapshot Neon

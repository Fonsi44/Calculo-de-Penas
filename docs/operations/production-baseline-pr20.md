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
- Clon de ensayo: `preflight-cutover-pr20` (tracking 39+21 ya aplicado)
- Algoritmo Drizzle: SHA-256 hex del SQL completo (compatible con drizzle-orm/migrator.js)

## Verificación estructural (60/60)

Se verificaron contra el clon:

- **CREATE TABLE**: todas las tablas existen (100%)
- **ALTER TABLE ADD COLUMN**: todas las columnas existen (100%)
- **CREATE INDEX**: 56/58 índices existen (2 difieren en nombre: `enlaces_magicos_token_idx`, `embeddings_vector_idx`)
- **CREATE TYPE (enum)**: todos los tipos existen con valores correctos
- **Tracking en Production**: 39 Drizzle + 21 manuales, aplicado
  transaccionalmente el 2026-07-28.
- **Plan aplicado**: `EQUIVALENTE`, `publicDrift=0`, firmado para
  `7275cb5ed602a37de86fb1589f11908e52984357`.
- **Snapshot pre-cutover**: `snap-muddy-poetry-ap44ccpa`.

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

Debe mostrar 39 migraciones Drizzle y 21 manuales verificadas.

### 3. Apply

```bash
# No ejecutar sin la autorización productiva única.
BASELINE_PLAN=.local/production-baseline-pr20.json \
BASELINE_ALLOWED_BRANCH_ID="$NEON_PRODUCTION_BRANCH_ID" \
MIGRATION_BASELINE_CONFIRMATION=BASELINE_PRODUCTION_PR20_AUTHORIZED \
npm run db:migrations:baseline:apply
```

Esto registra 39 entradas en `drizzle.__drizzle_migrations` y 21 en
`sgie_schema_migrations` usando advisory lock y una única transacción. El token
productivo no es válido en clones y el token de ensayo no es válido en
Production.

### 4. Verificar

```bash
npm run db:migrations:status
npm run db:migrations:validate
```

Resultado esperado: 60 registradas, 0 pendientes, 0 drift.

## Cuentas sintéticas

La base `neondb` contiene ~203 usuarios con email `@test.local`, `auth-test@`, `sidebar-test@`, etc.

### Neutralización (dry-run primero)

```bash
node tools/ops/disable-synthetic-production-users.mjs
```

### Resultado productivo

- Dry-run: 208 emparejadas, 0 modificadas.
- Apply transaccional: 208 emparejadas, 208 neutralizadas.
- Postcondiciones: 210 usuarios totales, 208 allowlisted inactivas y
  bloqueadas, 2 identidades fuera de allowlist intactas y 208 eventos de
  auditoría.

### Aplicar

```bash
DISABLE_SYNTHETIC_USERS=true \
SYNTHETIC_USERS_CONFIRMATION=DISABLE_ON_PREFLIGHT_CLONE \
node tools/ops/disable-synthetic-production-users.mjs
```

## Vercel Production

Variables aplicadas:

- `DATABASE_URL` → proyecto `spring-frog-35352705`, branch `production`, base `neondb`
- `DATABASE_URL_UNPOOLED` → misma conexión (sin pool)
- `POSTGRES_URL` y `POSTGRES_PRISMA_URL` permanecen ausentes.

Deployment productivo:

- Commit de aplicación: `dcd0cadefe65e41fc35a94df83ef9b8dbc42940a`
- Vercel: `dpl_4YwZyKkmEcoMoTt7ivyv7vAb7hEp`
- Dominio: `https://www.pinedayasociadoshn.com`
- Readiness: `healthy`; DB, 39/39 Drizzle, 21/21 manuales, Blob, cron,
  email e IA verdes.
- Smoke: home, health, readiness, blog, artículo DB, login, robots, sitemap y
  sesión anónima respondieron HTTP 200.

## Rollback

1. Restaurar variables Vercel anteriores
2. Redeploy deployment anterior
3. Si hay cambios en `neondb`: restaurar desde snapshot Neon

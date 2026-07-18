# Validación en staging — Fase 3

## Prerrequisitos
- Neon aislado con ALLOW_TEST_DATABASE=true
- Migraciones 0032-0037 aplicadas

## Pasos
1. `npx drizzle-kit check`
2. Aplicar migraciones contra staging
3. `npm run test` (963 tests)
4. `npm run build`
5. E2E: `node scripts/e2e/fase3-e2e.mjs`

## Rollback
- Migración 0037: `DROP TABLE IF EXISTS ... CASCADE` (ver SQL para lista completa)

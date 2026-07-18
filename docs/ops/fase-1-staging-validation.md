# Validación staging — cierre de Fase 1

Fecha: 18 de julio de 2026.

## Entorno

- Proyecto Neon: `justicia-verdadera`.
- Rama: `fase1-validation-202607`.
- Branch ID: `br-shy-union-ap40d9u5`.
- Padre: `production`.
- Endpoint aislado: `ep-super-pond-apt2ymw5`.
- Base: `neondb`.
- Expiración: 19-07-2026 08:24 GMT+2.

No incluir la cadena de conexión ni contraseñas en archivos o logs.

## Guardas obligatorias

Las variables siguientes se establecen solo en la sesión del comando:

```text
ALLOW_TEST_DATABASE=true
E2E_ENV=staging
E2E_NEON_BRANCH_NAME=fase1-validation-202607
E2E_NEON_BRANCH_ID=br-shy-union-ap40d9u5
E2E_NEON_ENDPOINT_ID=ep-super-pond-apt2ymw5
E2E_NEON_PRODUCTION_ENDPOINT_ID=<endpoint de producción observado>
```

`scripts/e2e/guard.mjs` debe pasar antes de cualquier escritura. Después:

```text
node scripts/e2e/verify-neon-branch.mjs --write-probe
node scripts/e2e/inspect-phase1-db.mjs --pre
node scripts/e2e/apply-phase1-migration.mjs
node scripts/e2e/apply-phase1-migration.mjs --tag=0033_fase1_calendario_version
npm run e2e:fase1
node scripts/e2e/verify-transaction-rollback.mjs
node scripts/e2e/inspect-phase1-db.mjs --post
```

El aplicador no conserva una autorización de rama en el código: exige estos
metadatos solo en el proceso, comprueba que el endpoint de staging no coincide
con el de producción y que PostgreSQL reporta el Branch ID solicitado.

## Resultados observados

- Identidad PostgreSQL: branch ID coincidente.
- Escritura temporal: validada y sin artefactos.
- 0032: 49 sentencias, transacción serializable, hash registrado.
- 0033: aplicada y registrada.
- Reaplicación 0032: omitida como `alreadyApplied`.
- Backfill: 183 usuarios, 5 eventos, 14 expedientes y 14 asignaciones
  conservados; cero nulos inválidos.
- Invitaciones concurrentes: 1 éxito, 7 conflictos.
- SGIE y RBAC: revocación/concesión inmediata en servidor.
- Expedientes: creación completa y rollback de fallo intermedio.
- Calendario: privacidad personal, rango mensual y conflicto optimista.
- Resend: proveedor deliberadamente no configurado; no hubo envío.
- Limpieza: invitaciones, usuarios, eventos y expedientes de prueba eliminados.

## Drizzle

Los snapshots terminan en 0023 mientras el journal continúa hasta 0033.
No ejecutar `generate` para reconstruir automáticamente ese intervalo: puede
proponer renames ambiguos y migraciones duplicadas. Hasta crear una baseline
formal, usar:

```text
npx drizzle-kit check
node scripts/e2e/inspect-phase1-db.mjs --post
```

## Limpieza

`e2e:fase1` elimina sus fixtures en `finally`. La rama tiene autoeliminación en
un día y no debe promoverse ni conectarse a Vercel Production. Si se elimina
manualmente antes, comprobar primero que no hay otra validación en curso.

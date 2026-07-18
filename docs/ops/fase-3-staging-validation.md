# Validación en staging — Fase 3

## Prerrequisitos
- Rama Neon aislada `fase3-e2e-validation-20260718`
  (branch `br-dark-term-apjtoeoj`, endpoint `ep-fancy-field-ap04213c`).
- Migraciones 0032–0037 aplicadas en la rama aislada (95 tablas).
- Variables en memoria (NO en `.env`):
  - `ALLOW_TEST_DATABASE=true`
  - `E2E_ENV=staging`
  - `E2E_NEON_BRANCH_NAME=fase3-e2e-validation-20260718`
  - `E2E_NEON_BRANCH_ID=br-dark-term-apjtoeoj`
  - `E2E_NEON_ENDPOINT_ID=ep-fancy-field-ap04213c`
  - `DATABASE_URL` apuntando al endpoint aislado.
  - Alias DeepSeek: `IA_DOCUMENTAL_API_KEY ??= DEEPSEEK_API_KEY`.

## Runner

El script `scripts/e2e/run-fase3-isolated.mjs` configura todo lo anterior
**en memoria** (sin tocar `.env`) y ejecuta Fase 2 y Fase 3 contra la rama
aislada. El guard `guard-fase3.mjs` verifica el aislamiento antes de correr.

```bash
node scripts/e2e/run-fase3-isolated.mjs fase2   # solo Fase 2
node scripts/e2e/run-fase3-isolated.mjs fase3   # solo Fase 3
node scripts/e2e/run-fase3-isolated.mjs         # ambas
```

## Pasos de validación

1. `npx drizzle-kit check` — coherencia schema/migraciones.
2. `node scripts/e2e/run-fase3-isolated.mjs` — E2E Fase 2 + Fase 3 contra
   la rama aislada, con providers reales (DeepSeek + Resend).
3. `npm run lint` — 0 errores, 0 warnings.
4. `npx tsc --noEmit` — 0 errores.
5. `npm run test` — 963/963 tests.
6. `npm run build` — build correcto.

## Resultado verificado (18 jul 2026)

- **E2E Fase 2**: ✅ 9/9 pasos, código 0.
- **E2E Fase 3**: ✅ 70/70 assertions, código 0, ~15s.
  - 13 pasos del flujo (invitación → SGIE → expediente → portal → IA →
    revisión → alertas → reglas → recordatorios → calendario → dashboard →
    auditoría).
  - Concurrencia/DLQ: FOR UPDATE SKIP LOCKED, backoff, DLQ, recuperación de
    locks, retry manual, idempotencia outbox, dedup documental, reserva
    concurrente, webhook duplicado.
  - DeepSeek real: latencia ~450–565ms, modelo `deepseek-v4-flash`, tokens
    validados, schema JSON comprobado.
  - Resend real: envío aceptado, message ID persistido en `correos_enviados`,
    `RESEND_WEBHOOK_SECRET` configurado (Svix Ed25519).
  - CRON_SECRET: efímero en memoria, contract test 200/401/403.
  - Limpieza: 0 fixtures restantes tras cada ejecución.
- **Validación local**: lint 0, tsc 0, 963/963 tests, build OK, drizzle OK.

## Notas
- El endpoint aislado puede estar suspendido (Neon auto-suspend). La conexión
  directa con `DATABASE_URL` lo reactiva automáticamente al primer `SELECT`.
- `NEON_API_KEY` no es necesaria para ejecutar el E2E (solo para crear nuevas
  ramas vía API). La rama existente se reutiliza por conexión directa.
- Las tablas de la migración 0037 (`portal_sessions`, `alertas_sla`,
  `inbound_messages`, `communication_rules`, `workflow_snapshots`,
  `user_activity_log`) existen en la rama aislada pero **algunas no tienen
  servicio TS dedicado** (deuda técnica documentada; el E2E las prueba a
  nivel SQL cuando aplica).

## Rollback
- Migración 0037: `DROP TABLE IF EXISTS ... CASCADE` (ver SQL para lista
  completa).
- La rama Neon aislada se conserva para Fase 4; no eliminar.

---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-08-04
supersedes: docs/audits/archive/2026-07-27/repository/plan-reorganizacion.md
superseded_by: null
---

# Programa maestro de remediación del repositorio

## Control de ejecución

- Rama: `refactor/repository-professionalization`
- HEAD de partida: `f99304fd5e4bd9f99d8e54140430bd6216958c30`
- HEAD validado actual: `f9cf94df346a7eebe3e4da02457ac7d043a2420e`
- PR: [#20](https://github.com/Fonsi44/Calculo-de-Penas/pull/20), Draft, mergeable.
- Producción: solo lectura; no existe autorización de cutover.
- Ledger: `docs/audits/current/repository-remediation-ledger.csv`.
- Estado local reproducible: `.local/repository-remediation-state.json`.
- Auditoría delta: `docs/audits/current/repository-delta-audit.md`.

Las evidencias históricas del 27 de julio son inmutables. El ledger parte de
estados conservadores y solo admite `DONE_VERIFIED` con evidencia actual,
commit o justificación de no cambio y prueba reproducible.

## Estado inicial verificado

- Local, remoto y PR #20 apuntaban al mismo HEAD al iniciar.
- Los checks remotos del PR estaban verdes: GitGuardian, CI, Lighthouse y
  Vercel Preview.
- El árbol contenía dos informes SEO modificados antes de esta ejecución y las
  evidencias suministradas sin versionar; se preservan.
- `npm run check:fast` pasó con advertencias no bloqueantes originadas en
  artefactos locales/evidencias.
- La suite focalizada inicial pasó: 11 archivos y 209 tests.
- El sistema de migraciones contiene 39 entradas Drizzle y 21 migraciones
  manuales manifestadas con checksum.

## Gates

| Fase | Estado | Evidencia o acción pendiente |
|---|---|---|
| 0. Delta y estado real | PARTIAL | Delta inicial y ledger creados; faltan regeneradores completos de reachability, API, links, assets y dependencias. |
| 1. P0 y seguridad | DONE_VERIFIED | Proxy, 2FA, calendario, migraciones, scope y navegación de delitos tienen pruebas verdes. Las rutas mutables quedan cubiertas por contrato global: CSRF o excepción explícita verificable; el webhook WhatsApp valida HMAC y falla cerrado. |
| 2. DB, divergencias y seeds | DONE_VERIFIED | 82 divergencias clasificadas, `publicDrift=0`, seeds contractuales equivalentes, baseline firmado 39+21 aplicado al clon y segunda ejecución 0 aplicadas/60 omitidas. Production intacta. |
| 3. Cuentas sintéticas | DONE_VERIFIED | Ensayo en rama Neon efímera: allowlist exacta de 208 usuarios, dry-run 208/0, aplicación 208/208, 208 auditorías y conteos funcionales preservados; rama eliminada. Producción y clon padre intactos. |
| 4. Raíz y documentación | PARTIAL | Raíz limpia y evidencias exactas archivadas; falta separar documentación viva/histórica y activar el gate de enlaces locales. |
| 5. Depuración controlada | NOT_STARTED | Las 280 filas están incorporadas al ledger; falta decisión individual y pruebas por lote. |
| 6. Arquitectura | NOT_STARTED | Solo después de cerrar estabilización y depuración. |
| 7. PWA/simulador/integraciones | PARTIAL | Simulador determinista y mutaciones/integraciones cubiertas por contratos de seguridad; falta reconciliar PWA y contratos funcionales activos. |
| 8. CI y gobernanza | DONE_VERIFIED | `npm run verify` es la interfaz única de CI: higiene, 60 migraciones, lint, TypeScript, 1.915 tests, build y baseline Knip; el workflow remoto la ejecuta. |
| Validación dinámica | PARTIAL | `npm run verify` pasó en `f30ad559`; pruebas de seguridad, lint y TypeScript pasan en `f9cf94df`. Faltan E2E y repetición integral sobre el HEAD final. |
| Release/cutover | BLOCKED_PRODUCTION_AUTH | No se solicitará autorización hasta que todos los gates técnicos previos estén verdes. |

## Reglas de avance

1. Preservar cambios locales preexistentes.
2. Un cambio lógico y reversible por commit.
3. Recalcular evidencia después de cada lote.
4. No borrar candidatos sin validar imports, configuración, DB, historial,
   rutas, scripts, tests y consumidores externos.
5. No ejecutar escrituras en Neon/Vercel Production, despliegue Production,
   merge, force-push ni eliminación de recursos legacy.
6. Solicitar una única autorización productiva agrupada solo cuando no quede
   ningún gate previo pendiente.

## Próximo lote

1. Recalcular reachability, scripts, assets, links y dependencias.
2. Resolver las 280 decisiones históricas contra el HEAD actual.
3. Archivar documentación histórica fuera del conjunto vivo y activar su gate.
4. Ejecutar E2E y repetir `npm run verify` sobre el HEAD final.
5. Regenerar plan de cutover firmado únicamente cuando no queden gates técnicos.

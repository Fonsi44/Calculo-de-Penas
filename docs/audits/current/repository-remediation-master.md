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
- HEAD validado actual: `ab88a1bf4db89711b5fedb4fc0b84d349a636c07`
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
| 1. P0 y seguridad | PARTIAL | Proxy, 2FA, calendario, migraciones, scope y navegación de delitos tienen pruebas verdes. Falta el barrido contractual completo de rutas mutables/integraciones. |
| 2. DB, divergencias y seeds | DONE_VERIFIED | 82 divergencias clasificadas, `publicDrift=0`, seeds contractuales equivalentes, baseline firmado 39+21 aplicado al clon y segunda ejecución 0 aplicadas/60 omitidas. Production intacta. |
| 3. Cuentas sintéticas | PARTIAL | Tooling y prueba focalizada verdes; falta ensayo completo sobre clon limpio y restauración. |
| 4. Raíz y documentación | NOT_STARTED | Las evidencias suministradas generan advertencias de raíz; deben reconciliarse sin alterar su contenido. |
| 5. Depuración controlada | NOT_STARTED | Las 280 filas están incorporadas al ledger; falta decisión individual y pruebas por lote. |
| 6. Arquitectura | NOT_STARTED | Solo después de cerrar estabilización y depuración. |
| 7. PWA/simulador/integraciones | NOT_STARTED | Reconciliar contratos activos contra HEAD. |
| 8. CI y gobernanza | PARTIAL | CI remota verde y `check*` existen; falta interfaz `verify` y gates completos exigidos. |
| Validación dinámica | PARTIAL | Pruebas focalizadas verdes; suite, build, E2E y entornos aislados pendientes para el HEAD final. |
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

1. Regenerar clasificación y controles de rutas API sobre HEAD.
2. Ejecutar validaciones P0 completas.
3. Ensayar neutralización sintética y restauración sobre clon.
4. Recalcular reachability, scripts, assets, links y dependencias.
5. Actualizar ledger, delta y este control tras cada lote lógico.

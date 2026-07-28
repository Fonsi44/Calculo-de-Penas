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
- HEAD validado actual: `f59b0597bebdaf67c8292d43f0a5a242659bd2fb`
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
| 0. Delta y estado real | DONE_VERIFIED | Reachability/Knip, rutas mutables, assets con cruce DB, enlaces vivos, dependencias, schema y seeds recalculados contra HEAD. |
| 1. P0 y seguridad | DONE_VERIFIED | Proxy, 2FA, calendario, migraciones, scope y navegación de delitos tienen pruebas verdes. Las rutas mutables quedan cubiertas por contrato global: CSRF o excepción explícita verificable; el webhook WhatsApp valida HMAC y falla cerrado. |
| 2. DB, divergencias y seeds | DONE_VERIFIED | 82 divergencias clasificadas, `publicDrift=0`, seeds contractuales equivalentes, baseline firmado 39+21 aplicado al clon y segunda ejecución 0 aplicadas/60 omitidas. Production intacta. |
| 3. Cuentas sintéticas | DONE_VERIFIED | Ensayo en rama Neon efímera: allowlist exacta de 208 usuarios, dry-run 208/0, aplicación 208/208, 208 auditorías y conteos funcionales preservados; rama eliminada. Producción y clon padre intactos. |
| 4. Raíz y documentación | DONE_VERIFIED | Raíz limpia, evidencia histórica archivada, 54 documentos vivos con frontmatter y 0 enlaces locales rotos; contratos `git check-ignore` verdes. |
| 5. Depuración controlada | DONE_VERIFIED | 280/280 decisiones verificadas; 26 fuentes retiradas, 24 one-offs archivados, 14 assets sin consumidor retirados y 26 assets conservados por DB/contrato externo. |
| 6. Arquitectura | DONE_VERIFIED | Schema separado con barrel compatible y entrypoints por dominio; Drizzle conforme; 564 fuentes con 0 ciclos y 0 imports `components → app`. |
| 7. PWA/simulador/integraciones | DONE_VERIFIED | PWA usa exclusivamente route handler, simulador determinista etiquetado y mutaciones/integraciones con contrato explícito y fallo cerrado. |
| 8. CI y gobernanza | DONE_VERIFIED | `npm run verify` cubre higiene, gobernanza, docs, 60 migraciones, lint, TypeScript, 1.932 tests, build y Knip; main protege PR, revisión CODEOWNERS, conversaciones y CI required. |
| Validación dinámica | DONE_VERIFIED | `npm run verify` verde y E2E Neon aislado 111/111; cleanup final eliminó 7 usuarios y todas las referencias sintéticas. |
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

1. Confirmar checks remotos del HEAD final.
2. Regenerar y firmar el plan de cutover contra el HEAD final.
3. Solicitar la puerta productiva única; no ejecutar sin autorización.

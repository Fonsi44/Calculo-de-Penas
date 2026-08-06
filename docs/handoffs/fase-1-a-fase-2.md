# Handoff técnico — Fase 1 a Fase 2

Fecha de cierre: 18 de julio de 2026. Destinatario: DeepSeek V4 Flash.

## Estado final de Fase 1

La Fase 1 reconstruye el núcleo operativo de Admin e identidad y retira el CMS
del Admin sin retirar las fuentes de lectura del sitio público. El alta es solo
por invitación: el token se genera con 32 bytes aleatorios, se guarda únicamente
como SHA-256 y se consume dentro de una transacción que crea o reactiva la cuenta,
rol, capacidades, perfil SGIE, equipo y aceptación legal.

La autorización es de servidor y centralizada en `lib/access-service.ts`.
Combina el rol legado, roles/permisos persistidos y overrides individuales. Las
mutaciones de cuenta relevantes incrementan `token_version`; SGIE se evalúa
independientemente de que la cuenta esté activa. Los expedientes se crean en una
transacción única con su asignación, checklist, historial y auditoría.

El calendario SGIE usa consultas paginadas por rango, propietario/creador,
visibilidad privada/de expediente/de equipo, zona horaria y control optimista
mediante `version`. Las actualizaciones obsoletas devuelven 409. Un usuario no
puede promover un evento a equipo sin `calendar.manage_team` ni dejar un evento
de expediente sin expediente válido.

Migraciones:

- `0032_fase1_admin_identidad_calendario.sql`: invitaciones, equipos,
  capacidades, RBAC, columnas/backfill/índices/FK del calendario.
- `0033_fase1_calendario_version.sql`: versión entera no nula con default 1.

La validación real se hizo en una rama Neon efímera aislada. Se validaron
invitaciones concurrentes (1 aceptación y 7 conflictos), revocación SGIE y RBAC,
transacción/rollback de expedientes, privacidad/concurrencia del calendario y
limpieza de fixtures. Resend se verificó sin proveedor, por lo que no hubo envío
real ni afirmación de entrega.

## Invariantes que no deben romperse

- No existe registro público; el alta es exclusivamente por invitación.
- Los tokens de invitación se persisten solo mediante hash, nunca en logs.
- Cuenta activa, suspensión, sesión y acceso SGIE son estados separados.
- La autorización se resuelve en servidor; el cliente no concede capacidades.
- El acceso a expedientes se comprueba por asignación o permiso en servidor.
- La creación de expedientes es transaccional.
- El calendario es privado por defecto y exige autorización coherente en GET,
  POST y PATCH.
- Toda edición de calendario usa versión y debe devolver 409 ante conflicto.
- Los errores HTTP tipados conservan `x-correlation-id`; los errores imprevistos
  no se degradan a 401.
- La web pública y sus fuentes de lectura siguen separadas del Admin operativo.

## Mapa de archivos

| Área | Archivos principales |
| --- | --- |
| Auth y sesiones | `lib/auth.ts`, `proxy.ts`, `lib/csrf.ts` |
| Invitaciones | `lib/invitations.ts`, `app/api/admin/invitaciones/*`, `app/api/auth/invitaciones/[token]/route.ts` |
| RBAC y SGIE | `lib/access-service.ts`, `app/api/admin/usuarios/[id]/*` |
| Admin operativo | `app/intranet/admin/*`, `app/api/admin/usuarios/route.ts` |
| Expedientes | `lib/sgie/expedientes-db.ts`, `app/api/sgie/expedientes/route.ts` |
| Calendario | `app/api/sgie/agenda/*`, `lib/sgie/agenda-query.ts`, `app/intranet/sgie/agenda/page.tsx` |
| Schema y migraciones | `lib/schema.ts`, `drizzle/migrations/0032_*`, `drizzle/migrations/0033_*` |
| E2E seguro | `scripts/e2e/guard.mjs`, `verify-neon-branch.mjs`, `apply-phase1-migration.mjs`, `fase1-integration.ts` |
| Documentación | `docs/architecture/fase-1-nucleo-admin-identidad-calendario.md`, `docs/operations/fase-1-staging-validation.md` |

## Deuda técnica conocida

- Los snapshots de Drizzle terminan en 0023 mientras el journal llega a 0033.
  No ejecutar `drizzle-kit generate` sobre ese historial: puede producir renames
  ambiguos o migraciones duplicadas. Usar `drizzle-kit check` y la inspección
  real del esquema hasta crear una baseline de snapshots en una operación aparte.
- Resend no se validó con un destinatario técnico seguro ni proveedor real.
- La gestión visual de equipos no se implementó: existe el modelo persistente,
  no una interfaz ficticia.

## Preparación para Fase 2

La Fase 2 se centrará en fases/procedimientos, requisitos documentales,
recepción segura, procesamiento durable, jobs, outbox, OCR, IA, estados visibles
y revisión por excepción. Debe integrarse mediante los servicios de autorización
existentes, mantener las operaciones de expediente transaccionales y no mezclar
flujos internos con la web pública. Cualquier job u outbox debe respetar la
idempotencia, la trazabilidad/auditoría y la separación de secretos ya aplicada.

No se ha diseñado ni implementado funcionalidad de Fase 2 en este cierre.

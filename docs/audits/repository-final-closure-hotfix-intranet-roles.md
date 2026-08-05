# Cierre: `hotfix/intranet-access-accounts` — refactor redundante (2026-08-05)

**Estado:** `HOTFIX_INTRANET_ACCESS = REDUNDANT_CONFIRMED`

## Resumen

La rama `hotfix/intranet-access-accounts` contiene un único commit (`dabb339c`,
2026-07-24) que centralizaba la lógica de roles en `lib/roles.ts` (`isAdminRole`,
`isSgieRole`, `normalizeRole`, `ROLES_ADMIN`, `ROLES_SGIE`) y añadía tests
(`tests/roles.test.ts`, `tests/proxy-admin-access.test.ts`), reemplazando
comparaciones directas `rol !== 'admin'`.

Tras la auditoría de solo lectura, **`main` ya proporciona una solución
equivalente y suficiente**. El refactor no se integra y la rama puede eliminarse
con seguridad.

## Qué sustituye al hotfix en `main`

| Capacidad del hotfix | Sustituto en `main` |
|---|---|
| `isAdminRole` (admin + administrador) | `lib/auth.ts:requireAdmin` usa `defaultCapabilitiesForRole(user.rol).has('users.manage')`; `lib/access-service.ts:ROLE_DEFAULTS` define `admin` y `administrador` con `CAPABILITIES` completas (incl. `users.manage`). |
| `isSgieRole` (admin/administrador/abogado/supervisor) | `lib/access-service.ts` (`assertSgieAccess`, `defaultCapabilitiesForRole`, `sgIeEnabled`) cubre los 4 roles. |
| `normalizeRole` (administrador → admin) | `lib/invitations.ts:197` (`legacyRole`) normaliza `administrador` → `admin` al reclamar invitación; la API `app/api/admin/usuarios/[id]/rol/route.ts` restringe el rol a `['admin','abogado','supervisor']`; `usuarios.rol` usa valores canónicos. |
| Tests de roles/proxy | `tests/proxy-regression.test.ts`, `tests/session-purpose-proxy.test.ts`, `tests/fase1-admin-identidad-calendario.test.ts` y la suite SGIE cubren acceso admin/abogado/supervisor. |

## Por qué NO se integra el commit antiguo

1. **`main` admite correctamente** `admin`, `administrador`, `supervisor` y
   `abogado` vía capabilities centralizadas (`ROLE_DEFAULTS`), no por
   comparaciones dispersas.
2. El `proxy.ts` de la rama es una **versión obsoleta** (lista de rutas públicas
   muy distinta a la actual, sin categorías `SESSION_AUTH` modernas). Un merge o
   cherry-pick reintroduciría código antiguo y podría romper la protección de
   firma JWT y el aislamiento de rutas.
3. La normalización actual garantiza que `usuarios.rol` no almacene
   `administrador` en flujos nuevos, por lo que las comparaciones `rol === 'admin'`
   del frontend son consistentes con el valor canónico.

## Decisión

- **No integrar** el commit `dabb339c`.
- **No eliminar** código actual de permisos/auth (contractos públicos intactos).
- Documentar que la rama es redundante → **`SAFE_TO_DELETE`**.

## Validación

- `npm run seo:growth:reconcile:check` OK (sin escritura).
- `git diff --check` OK.
- Sin cambios en producción, metadata, contenido ni medición de 28 días
  (`SEO_GROWTH_28D_MEASUREMENT = WAITING_FOR_MEASUREMENT_DATE`).

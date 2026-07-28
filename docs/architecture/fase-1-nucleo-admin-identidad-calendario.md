---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Fase 1 — núcleo Admin, identidad, permisos y calendario SGIE

Estado del documento: implementación local, pendiente de aplicar la migración
`0032_fase1_admin_identidad_calendario.sql` en el entorno correspondiente.

## Arquitectura resultante

El Admin deja de ser el CMS de la web pública y queda orientado a operación,
identidad, seguridad, gobierno y configuración SGIE. La navegación se divide en
Operación, Personas y acceso, Configuración SGIE y Gobierno. Los módulos aún no
implementados aparecen desactivados como “Próxima fase”; no simulan datos ni
operaciones.

Las páginas y APIs administrativas de Blog, FAQ, páginas, menús, medios, SEO,
analítica pública, Search Console, redirects y editor visual fueron retiradas.
No se eliminaron las tablas ni los servicios de lectura que usa el sitio
público:

- Blog: `blog_posts` mediante `lib/blog-db.ts`.
- FAQ: `faq_entries` mediante `lib/faq-db.ts`.
- Páginas: `page_content` mediante `lib/page-content-db.ts`.
- Configuración pública: `lib/site.ts` y las lecturas existentes.

## Flujo de invitación

1. Un administrador crea la invitación en
   `POST /api/admin/invitaciones` con nombre, correo, rol, equipo opcional,
   acceso SGIE y capacidades adicionales.
2. `lib/invitations.ts` genera 32 bytes aleatorios y guarda únicamente SHA-256.
3. La invitación persiste con expiración configurable, estado, creador y
   resultado real de correo.
4. Resend envía el enlace si `RESEND_API_KEY` está configurada. Sin Resend la
   invitación permanece pendiente con `emailEstado=no_configurado`; no se
   declara una entrega ficticia.
5. El usuario abre `/intranet/activar-invitacion/{token}`, define su propia
   contraseña y acepta los términos.
6. Una transacción reclama el token pendiente/no expirado, crea o reactiva el
   usuario, asigna rol, capacidades, equipo, perfil SGIE y aceptación legal.
7. El token queda consumido. Reenvío crea un token nuevo y revoca el anterior.

Estados: `pendiente`, `aceptada`, `expirada`, `revocada`.

No existe registro público: `/api/auth/register` devuelve 403. El endpoint
histórico `POST /api/admin/usuarios` devuelve 405 y obliga a usar invitaciones.
El administrador nunca define ni recibe la contraseña de otra persona.

## Estados de usuario y acceso

Los conceptos aplicados son independientes:

- `usuarios.active`: cuenta activa/inactiva.
- `usuarios.bloqueado`: suspensión administrativa.
- `invitaciones.estado`: ciclo previo al alta.
- `usuarios_sgie.activo_sgie`: acceso funcional al SGIE.
- `usuarios.token_version`: revocación de todas las sesiones emitidas.
- `usuarios_roles` / `roles_permisos`: roles y capacidades persistidos.
- `usuarios_capacidades`: concesión o denegación individual.
- asignaciones/permisos de expediente: alcance sobre casos concretos.

`requireAbogado` consulta `accessService.assertSgieAccess`, que valida estado
actual persistido, perfil SGIE y membresía/capacidades. El JWT no es la única
fuente de autorización. Cambios de rol, suspensión, SGIE y revocación invalidan
la caché corta de sesión; las mutaciones críticas incrementan
`token_version`.

## Roles y capacidades

Roles iniciales:

- Administrador: todas las capacidades.
- Abogado: expedientes accesibles, creación/actualización, documentos y
  calendario propio/relacionado.
- Supervisor: lectura global, asignación, revisión/aprobación documental y
  calendario de equipo.

Capacidades canónicas:

`users.read`, `users.manage`, `users.invite`, `roles.manage`, `cases.read`,
`cases.read_all`, `cases.create`, `cases.assign`, `cases.update`,
`documents.read`, `documents.review`, `documents.approve`, `calendar.read`,
`calendar.write`, `calendar.manage_team`, `settings.manage`, `audit.read`.

La compatibilidad con `usuarios.rol` se conserva temporalmente. La migración
crea roles/permisos y hace backfill de `usuarios_roles`. La capa central combina
roles persistidos, fallback legado y overrides individuales.

## Autorización de expedientes

`accessService.assertCaseAccess` centraliza acceso por capacidad, asignación
activa o permiso explícito. Un abogado sin `cases.assign` queda como
responsable y recibe 403 si intenta indicar otro usuario. Quien sí tenga la
capacidad puede elegir un responsable, pero este debe existir, estar activo,
no suspendido, tener SGIE habilitado, capacidad compatible y pertenecer al
mismo bufete cuando ambos tienen organización asignada.

`crearExpediente` usa una sola transacción para:

1. expediente;
2. asignación principal;
3. checklist inicial;
4. historial;
5. auditoría transversal.

Un fallo revierte el conjunto y evita expedientes parciales.

## Calendario

`eventos_agenda` mantiene `fecha` para compatibilidad temporal y añade:

- propietario y creador;
- inicio, final y todo el día;
- zona horaria (por defecto `America/Tegucigalpa`);
- ubicación, tipo, estado y visibilidad;
- participantes y recordatorios JSON;
- expediente opcional y cancelación.

La migración hace backfill de eventos existentes desde `confirmada_por`,
responsable del expediente o primer administrador activo. Si no puede resolver
un propietario, aborta antes de imponer `NOT NULL`.

Las lecturas exigen `desde` y `hasta`, limitan el rango a 93 días y paginan a
100 filas. La UI calcula las 42 celdas del mes o los 7 días de la semana y
recorre páginas cuando procede; ya no envía `limit=200`.

Reglas:

- propietario: ve, crea, edita, reprograma y cancela eventos personales;
- miembro con acceso al expediente: ve y crea/edita eventos de ese expediente;
- otros abogados: no ven eventos privados;
- `calendar.manage_team`: acceso de equipo para Admin/Supervisor.

La UI ofrece mes, semana, navegación, creación, edición, reprogramación,
cancelación, filtros de tipo/estado, estados de carga/error/vacío y controles
con etiquetas accesibles.

## Errores y observabilidad

`lib/http-errors.ts` define errores HTTP tipados y respuestas sin stack trace.
Un error inesperado ya no se convierte en 401: devuelve 500 con correlation ID.
El proxy añade `x-correlation-id` a APIs y páginas privadas; invitaciones,
usuarios, expedientes y calendario registran auditoría con el mismo request.

Mapa: autenticación 401, autorización/CSRF 403, validación 400/422, no encontrado
404, conflicto 409, rate limit 429, dependencia 502/503 y error inesperado 500.

## Migración y variables

Migración nueva:

- `drizzle/migrations/0032_fase1_admin_identidad_calendario.sql`.
- `drizzle/migrations/0033_fase1_calendario_version.sql`, control optimista
  para impedir pérdida silenciosa de cambios concurrentes.

Es aditiva: crea equipos, invitaciones, capacidades directas y columnas de
calendario; añade enums/índices/FK, seeds RBAC y backfills. No elimina datos ni
tablas editoriales.

Variable nueva:

- `INVITATION_TTL_HOURS` (por defecto 72; rango 1–720).

Variables existentes necesarias:

- `DATABASE_URL`, `JWT_SECRET`;
- `RESEND_API_KEY` y `RESEND_FROM_EMAIL` para entrega de invitaciones;
- `ENCRYPTION_KEY` para 2FA existente.

## Pasos manuales

1. Revisar backup y aplicar `0032` y `0033` primero en staging.
2. Comprobar que el backfill de eventos encuentra propietario para todas las
   filas.
3. Configurar y verificar el dominio remitente de Resend.
4. Ejecutar una invitación real en staging y comprobar entrega/aceptación/2FA.
5. Ejecutar E2E con una DB efímera mediante el guard del repositorio.

## Limitaciones y decisiones pendientes

- Equipos tienen modelo persistente, pero su pantalla de gestión se deja para
  la siguiente fase; no se presenta una pantalla ficticia.
- 2FA existe y puede configurarse, pero el proyecto no declara todavía una
  política obligatoria por rol. Si se hace obligatoria, debe persistirse un
  estado de enrolamiento requerido y bloquear acceso hasta completarlo.
- Integraciones de Google/Microsoft Calendar quedan fuera de alcance.
- Las tablas editoriales se conservan por dependencia pública. Su eventual
  archivado o migración requiere una fase de datos separada.
- Las migraciones no se ejecutaron contra producción desde esta tarea.

## Validación real de cierre — 18 de julio de 2026

Se utilizó la rama Neon efímera `fase1-validation-202607`
(`br-shy-union-ap40d9u5`), hija de `production`, con endpoint independiente
`ep-super-pond-apt2ymw5`, base `neondb` y autoeliminación programada para el
19 de julio de 2026 a las 08:24 GMT+2. El endpoint productivo observado fue
distinto. Las credenciales no se persistieron ni se documentaron.

El guard exige simultáneamente `ALLOW_TEST_DATABASE=true`, `E2E_ENV=staging`,
nombre e ID de rama y endpoint Neon coincidente. PostgreSQL confirmó el branch
ID mediante `current_setting('neon.branch_id', true)` y una transacción temporal
confirmó escritura aislada.

Resultados:

- 0032 aplicada como transacción serializable de 49 sentencias y registrada
  por hash; una segunda ejecución devolvió `alreadyApplied: true`;
- 0033 aplicada como transacción serializable;
- backfill: 183 usuarios, 5 eventos, 14 expedientes y 14 asignaciones
  conservados; cero eventos sin propietario, creador o inicio;
- rollback inducido: cero objetos persistentes;
- ocho aceptaciones simultáneas: un éxito y siete conflictos 409, sin
  duplicados ni entidades parciales;
- desactivación SGIE, suspensión y overrides RBAC efectivos inmediatamente;
- expediente completo y rollback ante fallo de checklist validados;
- privacidad de evento personal entre abogados y control optimista 1 éxito /
  1 conflicto validados;
- Resend se validó en modo proveedor ausente: invitación persistida,
  `emailEstado=no_configurado`, sin afirmar entrega ni enviar correo;
- fixtures eliminados: los conteos volvieron exactamente al inventario previo.

El driver canónico cambió de `neon-http` a `neon-serverless`: el primero no
implementa transacciones interactivas y hacía fallar los flujos atómicos.

### Divergencia de snapshots Drizzle

El journal contiene 34 entradas, pero solo existen snapshots 0000–0023. Las
migraciones manuales 0024–0033 no tienen snapshot; por eso `drizzle-kit
generate` compara el schema actual con 0023 y solicita decisiones interactivas
de rename, pudiendo generar SQL duplicado. No se reconstruyeron snapshots
históricos ni se reescribieron migraciones aplicadas. La verificación
reproducible se realiza con `drizzle-kit check`, el hash registrado de 0032/0033
y `scripts/e2e/inspect-phase1-db.mjs`. Queda como deuda técnica acotada
reconstruir una baseline de snapshots en una operación de migraciones separada.

El procedimiento completo y los comandos están en
`docs/ops/fase-1-staging-validation.md`.

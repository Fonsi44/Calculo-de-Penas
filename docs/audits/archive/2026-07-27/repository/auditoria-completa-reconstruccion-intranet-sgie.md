# AUDITORÍA TÉCNICA Y PLAN MAESTRO DE RECONSTRUCCIÓN  

> Leyenda de seguimiento: `[x] COMPLETADO Y VALIDADO` · `[/] IMPLEMENTADO
> PARCIALMENTE` · `[~] IMPLEMENTADO, PENDIENTE DE VALIDACIÓN REAL` · `[ ]
> PENDIENTE` · `[!] BLOQUEADO` · `[-] NO APLICA`.

> **VERSIÓN 2.1 — ampliada el 18 de julio de 2026; control de progreso
> sincronizado tras Fase 1 el 18 de julio de 2026**
>
> Esta versión incorpora la definición del producto jurídico penal, el motor de
> fases y procedimientos, la comunicación integral con clientes mediante Resend,
> la estrategia concreta de OCR e IA, la base de conocimiento y la gobernanza
> necesaria para convertir la intranet en un sistema operativo del bufete.

## Intranet Justicia Verdadera — Administración, SGIE y automatización documental

**Fecha de auditoría:** 17 de julio de 2026  
**Repositorio analizado:** `Justicia Verdadera`  
**Rama declarada en el paquete:** `main`  
**Commit declarado:** `c90fd7bedfe427dc6563901a1a4b731cfac82932`  
**Tipo de auditoría:** revisión estática integral del paquete mínimo del repositorio  
**Objetivo:** convertir una intranet construida por partes en un sistema coherente, seguro e innovador que reduzca al mínimo el trabajo administrativo y documental de los abogados.

---

# 1. Veredicto ejecutivo

> **⚠️ Estado actual (19-07-2026):** este veredicto describe el estado ORIGINAL
> de la auditoría (previo a Fase 1) y se conserva como diagnóstico histórico.
> El estado real y verificado hoy está en la **sección 63** (Control maestro de
> progreso): Fases 1, 2 y 3 VALIDADAS; Fase 4A ~85% (automatización documental
> core con E2E real y DeepSeek validado); Fase 4B (firma, calendario externo,
> retrieval, copiloto) PENDIENTE.

La intranet tiene una base técnica valiosa y bastante más avanzada de lo que aparenta desde la interfaz: existen expedientes, asignaciones, permisos, checklists, enlaces seguros de carga, almacenamiento en Blob, extracción documental, IA, readiness, tareas, alertas, auditoría, autenticación, 2FA y pruebas unitarias.

El problema principal no es la ausencia total de funcionalidades. El problema es que se han construido **varios productos parcialmente superpuestos sin una arquitectura de producto común**:

1. Un panel administrativo de la web pública orientado a SEO, blog, páginas y contenidos.
2. Un conjunto anterior de herramientas jurídicas y gestión de “casos”.
3. Un SGIE posterior con expedientes, documentos y automatización.
4. Módulos de agenda, tareas, correo, alertas e IA añadidos en sprints separados.
5. Dos modelos de roles y varias formas diferentes de calcular el acceso a un expediente.
6. Automatizaciones diseñadas pero no cerradas operacionalmente.

El resultado es una intranet con mucho código, pero con poca continuidad entre acciones. El abogado navega entre módulos aislados, repite contexto, desconoce qué debe hacer a continuación y puede encontrarse con operaciones aparentemente exitosas que no continúan su procesamiento.

## Conclusión central

No recomiendo seguir añadiendo pantallas sobre la estructura actual.

La solución es una **reconstrucción incremental del producto**, conservando las capacidades útiles y sustituyendo la navegación por módulos por un sistema dirigido por trabajo:

- **Admin controla identidad, permisos, equipos, plantillas, reglas y operación del SGIE.**
- **El abogado trabaja desde una bandeja de acciones y desde un espacio único por expediente.**
- **El sistema procesa, clasifica, relaciona, comprueba y prepara documentos automáticamente.**
- **La intervención humana se concentra en excepciones, decisiones jurídicas y aprobaciones.**
- **El calendario, las tareas, las comunicaciones y los documentos forman parte del mismo flujo de expediente.**

El objetivo no debe ser “tener muchos módulos”, sino conseguir que un abogado pueda responder en segundos a estas preguntas:

- ¿Qué requiere mi atención ahora?
- ¿Qué expediente está bloqueado y por qué?
- ¿Qué documento falta?
- ¿Qué ha detectado el sistema?
- ¿Qué vence próximamente?
- ¿Qué puedo aprobar en bloque?
- ¿Cuál es la siguiente mejor acción?
- ¿Qué expedientes están realmente listos para firma o revisión?

---

# 2. Alcance y limitaciones

## 2.1 Material inspeccionado

El paquete contiene código de aplicación, APIs, esquema Drizzle, migraciones, componentes, scripts, documentación y tests.

Inventario relevante:

| Área | Archivos/rutas | Líneas aproximadas |
|---|---:|---:|
| Pantallas Admin | 29 | 7.275 |
| Pantallas SGIE | 12 | 4.382 |
| APIs Admin | 45 | 4.210 |
| APIs SGIE | 55 | 4.670 |
| Tests TypeScript | 60 | 9.604 |
| Pantallas Admin claramente CMS/SEO | 9 | 3.378 |
| APIs Admin claramente CMS/SEO | 30 | 3.024 |
| Scripts relacionados con SEO, blog, indexación, contenido o analítica pública | 52 | 20.948 |

Estos números confirman que una parte muy grande del esfuerzo del repositorio está dedicada a la web pública, no al funcionamiento diario del SGIE.

## 2.2 Qué se ha podido verificar

Se han verificado directamente:

- Contratos entre interfaces y APIs.
- Reglas de autorización implementadas.
- Estructura del modelo de datos.
- Flujo de creación de usuarios.
- Flujo de creación de expedientes.
- Flujo de subida y procesamiento documental.
- Cola de trabajos.
- Agenda y calendario.
- Navegación Admin y SGIE.
- Configuración de despliegue incluida.
- Estructura y naturaleza de las pruebas.

## 2.3 Qué no se ha verificado en ejecución

No se ha dispuesto de:

- Sesión real contra la base de datos Neon.
- Variables de producción.
- Proyecto Vercel enlazado.
- Logs productivos.
- Datos reales.
- Cuenta Resend.
- Cron externo no versionado.
- Proveedor OCR real.
- Pruebas E2E ejecutadas contra un entorno desplegado.

Por ello, los hallazgos de código son concluyentes, mientras que la configuración externa se marca como **no verificable** cuando corresponde.

---

# 3. Evaluación actual

Escala: 0 = inexistente, 5 = excelente y listo para producción.

| Dimensión | Nota | Diagnóstico |
|---|---:|---|
| Coherencia de producto | 1,5/5 | Admin, herramientas antiguas y SGIE no forman un flujo único. |
| Experiencia del abogado | 1,5/5 | Navegación por módulos, exceso de contexto y poca orientación a la siguiente acción. |
| Gestión administrativa | 2/5 | Puede gestionar usuarios, pero el Admin principal está centrado en contenido público. |
| Agenda y plazos | 1/5 | Contiene errores de contrato, scope y modelo insuficiente. |
| Automatización documental | 2/5 | Buena base conceptual, pero cola, OCR y operación asíncrona incompletos. |
| Seguridad | 3,5/5 | Existen buenas defensas, aunque el modelo de autorización está duplicado e inconsistente. |
| Modelo de datos | 2,5/5 | Amplio, pero monolítico, duplicado y sin una frontera clara por dominios. |
| Observabilidad | 2/5 | Hay auditoría, pero faltan salud operativa, trazabilidad de jobs y errores accionables. |
| Tests | 2,5/5 | Cobertura unitaria considerable; faltan tests de contrato e integración que reproduzcan los fallos reales. |
| Preparación multiusuario | 2/5 | Hay asignaciones y permisos, pero la activación SGIE no se aplica realmente. |
| Innovación útil | 2,5/5 | Hay IA/readiness, pero todavía no se transforma en reducción demostrable del trabajo. |

---

# 4. Fortalezas que deben conservarse

La reconstrucción no debe tirar todo. Estas bases son útiles:

1. **Registro público desactivado.** La ruta de registro no permite altas abiertas.
2. **Sesiones revocables.** Se usa `tokenVersion`, usuario activo y bloqueo para invalidar sesiones.
3. **CSRF y rate limiting** en operaciones sensibles.
4. **2FA** y desafíos de un solo uso.
5. **Tokens de carga almacenados mediante hash**, no en claro.
6. **Validación de archivos**, MIME, extensión, tamaño y hash SHA-256.
7. **Vercel Blob** como almacenamiento documental.
8. **Auditoría funcional y SGIE.**
9. **Scope de expedientes en consultas principales** mediante asignaciones y permisos.
10. **Checklists por tipo de procedimiento.**
11. **Readiness y barreras para impedir decisiones críticas automáticas.**
12. **Procesamiento por páginas y base para IA documental.**
13. **Estados detallados de expediente y documento.**
14. **Pruebas unitarias sobre autenticación, documentos, IA, readiness, calendario y motores.**
15. **Principio correcto:** el sistema no debe tomar decisiones jurídicas finales sin aprobación humana.

Estas capacidades deben integrarse en una arquitectura coherente en lugar de reescribirse indiscriminadamente.

---

# 5. Hallazgos críticos confirmados

## P0-01. El calendario llama a la API con un valor que la propia API rechaza

La pantalla solicita:

- `app/intranet/sgie/agenda/page.tsx:80-89`
- Petición: `/api/sgie/agenda?limit=200`

La API admite como máximo 100:

- `app/api/sgie/agenda/route.ts:10-17`
- `limit.max(100)`

Consecuencia:

- La petición devuelve 400.
- La interfaz entra en estado de error.
- El usuario percibe que “el calendario no funciona”.

### Corrección inmediata

- Cambiar la UI para consultar por rango visible y paginación, no cargar 200 indiscriminadamente.
- La vista mensual debe enviar `desde` y `hasta`.
- La vista semanal debe enviar su rango correspondiente.
- Añadir un test de contrato que monte UI + handler o valide el cliente tipado contra el schema.

---

## P0-02. Un abogado puede crear un evento personal que después desaparece

La API permite crear eventos sin `expedienteId`:

- `app/api/sgie/agenda/route.ts:19-24`
- `app/api/sgie/agenda/route.ts:93-100`

Sin embargo, la consulta para abogados filtra por expedientes accesibles:

- `app/api/sgie/agenda/route.ts:37-52`

Los eventos con `expedienteId = null` no entran en ese filtro.

Además, la edición deniega expresamente eventos sin expediente:

- `app/api/sgie/agenda/[id]/route.ts:30-43`

Consecuencia:

1. El abogado crea el evento.
2. Recibe una aparente confirmación.
3. Al refrescar, el evento desaparece.
4. No puede editarlo.

### Corrección estructural

Añadir al evento:

- `ownerUserId`
- `createdBy`
- `organizationId`
- visibilidad: `private`, `team`, `case`
- participantes
- expediente opcional

Regla de acceso:

- Un abogado ve sus eventos personales.
- Ve los eventos de expedientes a los que tiene acceso.
- Ve eventos de equipo cuando sea participante o tenga permiso.
- Admin ve todos los eventos de su organización, salvo eventos privados si se decide preservar privacidad.

---

## P0-03. El scope de agenda no es consistente

La consulta GET considera:

- asignaciones;
- permisos explícitos.

La creación y edición solo consideran asignaciones.

Archivos:

- `app/api/sgie/agenda/route.ts:39-46`
- `app/api/sgie/agenda/route.ts:86-90`
- `app/api/sgie/agenda/[id]/route.ts:41-43`

Consecuencia:

- Un abogado puede ver un expediente por permiso delegado.
- Puede ver sus eventos.
- No necesariamente puede crear o editar eventos asociados.

### Corrección

Crear una única función central:

```ts
canAccessCase({
  userId,
  caseId,
  capability: "calendar.write"
})
```

Todas las rutas deben usar el mismo servicio de autorización.

---

## P0-04. La activación independiente del SGIE existe en base de datos, pero no se aplica

El esquema define:

- `usuarios_sgie.activo_sgie`
- `lib/schema.ts:829-839`

Sin embargo, `requireAbogado` solo comprueba el rol del JWT:

- `lib/auth.ts:346-363`

No consulta ni exige `activoSgie`.

Consecuencia:

- Un usuario con rol `abogado` puede entrar aunque su perfil SGIE esté desactivado.
- El concepto “primero se da de alta y luego se activa el acceso SGIE” no está realmente implementado.

### Modelo correcto

Separar explícitamente:

- `usuarios.active`: cuenta global habilitada.
- `membership.status`: invitado, activo, suspendido, revocado.
- `sgieAccess.enabled`: acceso al producto SGIE.
- roles/capacidades: administrador, abogado, supervisor, auxiliar, auditor.
- asignación a equipo u organización.

Cada API SGIE debe validar la membresía y el permiso, no solo el valor del JWT.

---

## P0-05. La creación inicial de abogados no sincroniza el perfil SGIE

La ruta de creación inserta directamente en `usuarios`:

- `app/api/admin/usuarios/route.ts:53-90`

No crea `usuarios_sgie`.

La sincronización solo se ejecuta al cambiar posteriormente el rol:

- `app/api/admin/usuarios/[id]/rol/route.ts:15-20`
- `lib/sgie/usuarios-db.ts:140-169`

Consecuencia:

- Dos abogados con el mismo rol pueden tener estados de perfil distintos dependiendo de cómo fueron creados.
- El alta y el cambio de rol no comparten una transacción o servicio de dominio.

### Corrección

Sustituir el POST por un servicio transaccional:

```text
createMembershipInvitation
→ crea usuario/invitación
→ crea membresía
→ asigna rol/capacidades
→ configura acceso SGIE
→ envía invitación de un solo uso
→ registra auditoría
```

---

## P0-06. El alta usa una contraseña proporcionada por el administrador

La API exige una contraseña de solo seis caracteres y activa inmediatamente la cuenta:

- `app/api/admin/usuarios/route.ts:11-16`
- `app/api/admin/usuarios/route.ts:72-79`

No se observa en ese flujo:

- invitación de un solo uso;
- expiración;
- creación de contraseña por el propio abogado;
- `mustChangePassword = true`;
- verificación del correo;
- aceptación de condiciones;
- activación separada.

### Flujo recomendado

1. Admin introduce nombre, correo, rol, equipo y capacidades.
2. El sistema crea una invitación con token hash y caducidad.
3. Resend envía un enlace de activación.
4. El abogado define su contraseña.
5. Configura 2FA.
6. Admin o política automática activa SGIE.
7. Se registra quién invitó, cuándo se aceptó y qué permisos obtuvo.

No debe existir registro público. El único punto de entrada debe ser una invitación administrativa válida.

---

## P0-07. El dominio de correo está codificado en el código

- `lib/auth.ts:111-125`
- Solo permite `@pinedayasociadoshn.com`.

Esto puede ser correcto para una única firma, pero contradice el objetivo de dar de alta “cualquier abogado” autorizado desde Admin.

### Corrección

Configurar políticas por organización:

- dominios permitidos opcionales;
- correos externos permitidos por invitación;
- verificación obligatoria;
- lista de dominios bloqueados;
- política de 2FA por rol;
- política de sesión por organización.

La seguridad debe basarse en la invitación y la membresía, no exclusivamente en el dominio.

---

## P0-08. Hay dos sistemas de roles y uno es inoperante

Existen:

- `usuarios.rol` con valores directos;
- tablas `roles`, `permisos`, `roles_permisos`, `usuarios_roles`.

El helper granular hace primero `requireAdmin`:

- `lib/permissions.ts:6-9`

Como `requireAdmin` ya rechaza a los no administradores, la consulta granular de permisos nunca sirve para conceder permisos a abogados.

Además, no se detectó uso funcional significativo de `requirePermission`.

### Decisión necesaria

Elegir un único modelo:

#### Recomendado: RBAC + capacidades

- roles organizativos;
- capacidades atómicas;
- reglas de scope;
- membresías por organización;
- excepciones por expediente.

Ejemplos:

- `users.manage`
- `cases.create`
- `cases.assign`
- `cases.read_all`
- `documents.review`
- `documents.approve`
- `calendar.manage_team`
- `automation.configure`
- `audit.read`
- `retention.manage`

Eliminar progresivamente el rol string como fuente única, manteniéndolo solo durante la migración.

---

## P0-09. Un abogado puede enviar un `responsableId` arbitrario al crear un expediente

El comentario indica que solo el admin puede elegir otro responsable:

- `app/api/sgie/expedientes/route.ts:77-83`

Pero el código usa cualquier `responsableId` recibido:

- `app/api/sgie/expedientes/route.ts:95-113`

No se ve una comprobación de `auth.rol === admin` antes de aceptarlo.

### Riesgo

- Asignaciones no autorizadas.
- Expedientes asignados a usuarios ajenos o inválidos.
- Inconsistencia operativa.

### Corrección

- Abogado: `responsableId = auth.userId` forzado en servidor.
- Supervisor/admin con capacidad `cases.assign`: puede elegir.
- Validar que el responsable pertenece a la organización, está activo, tiene acceso SGIE y capacidad adecuada.

---

## P0-10. La creación del expediente no es transaccional

La creación realiza por separado:

1. insert de expediente;
2. insert de asignación;
3. insert de checklist;
4. insert de historial.

Evidencia:

- `lib/sgie/expedientes-db.ts:340-406`

Si falla un paso intermedio, el expediente puede quedar parcialmente creado.

### Corrección

Usar una transacción Neon/Drizzle:

```text
BEGIN
  create case
  create responsible assignment
  instantiate workflow/checklist version
  create initial timeline event
  insert outbox event
COMMIT
```

El correo, la IA y otros efectos externos deben salir de un **outbox**, no ejecutarse dentro de la transacción.

---

## P0-11. La cola de trabajos no incrementa intentos ni reintenta fallos

En `lib/sgie/jobs-db.ts`:

- `reclamarJob` establece `intentos: undefined`.
- `fallarJob` afirma incrementar intentos, pero establece `intentos: undefined`.
- Los fallidos quedan en estado `fallido`.
- El lector solo busca `pendiente`.
- `maxIntentos` no gobierna ningún reintento.
- No hay backoff.
- No hay dead-letter queue.
- El claim no es atómico.

Evidencia:

- `lib/sgie/jobs-db.ts:66-108`

### Consecuencia

Un fallo temporal de red, Blob, IA u OCR puede detener permanentemente el documento.

### Cola mínima correcta

Campos:

- `status`
- `attempts`
- `maxAttempts`
- `nextRunAt`
- `lockedAt`
- `lockExpiresAt`
- `workerId`
- `lastError`
- `lastErrorCode`
- `completedAt`
- `deadLetteredAt`
- `idempotencyKey`
- `priority`

Claim mediante una operación atómica o `FOR UPDATE SKIP LOCKED`.

Política sugerida:

- reintentos exponenciales;
- jitter;
- clasificación de errores recuperables/no recuperables;
- desbloqueo de jobs abandonados;
- dead-letter;
- reintento manual;
- alertas administrativas;
- métricas por tipo de job.

---

## P0-12. La cola puede fallar silenciosamente

`encolarJob` captura cualquier error, escribe un warning y devuelve un ID vacío:

- `lib/sgie/jobs-db.ts:59-63`

El flujo de carga puede continuar como exitoso.

### Consecuencia

Un documento puede estar almacenado y registrado, pero no tener ningún job procesable.

### Corrección

Aplicar patrón outbox:

1. Dentro de la misma transacción del documento se crea un evento `document.uploaded`.
2. Un dispatcher publica el trabajo.
3. Si el dispatcher falla, el evento sigue pendiente y se reintenta.
4. La UI muestra estado verificable: recibido, pendiente, procesando, intervención requerida, procesado o fallido.

Nunca se debe comunicar “procesamiento iniciado” si no existe una unidad durable de trabajo.

---

## P0-13. La idempotencia diaria puede bloquear reintentos manuales

La clave única de job es:

- tipo;
- `refId`;
- ventana temporal, por defecto el día.

Evidencia:

- `lib/sgie/jobs-db.ts:26-58`
- `lib/schema.ts:1600-1618`

Si un job falla y se solicita reintentar el mismo día, la inserción puede chocar con el job existente y no crear un nuevo pendiente.

### Corrección

Separar:

- `idempotencyKey` de la operación lógica;
- `attempt` del mismo job;
- reejecución administrativa explícita;
- versión del pipeline/modelo.

---

## P0-14. No existe cron versionado en la configuración de Vercel incluida

El endpoint recomienda ejecutarse diariamente:

- `app/api/cron/sgie/procesar/route.ts:1-18`

Pero `vercel.json` solo declara build e instalación.

- `vercel.json:1-6`

Puede existir un scheduler externo, pero no está documentado en el paquete.

Además, el lote máximo es 5.

### Consecuencia

- La automatización puede no ejecutarse.
- Cinco documentos diarios es insuficiente para una herramienta operativa.
- Incluso funcionando, el procesamiento tendría una latencia inaceptable.

### Corrección

Usar una de estas estrategias:

1. **Vercel Cron + dispatcher frecuente** para carga moderada.
2. **Inngest, Trigger.dev, QStash o cola gestionada** para trabajos durables.
3. Worker independiente si el volumen y OCR requieren más tiempo.

El evento de carga debe disparar procesamiento casi inmediato. El cron debe ser una red de seguridad, no el único motor.

---

## P0-15. OCR no está implementado

El único proveedor real es el stub:

- `lib/sgie/ocr/provider.ts:56-88`

Cualquier valor distinto también cae al stub.

### Consecuencia

- PDFs con texto pueden procesarse.
- Escaneos e imágenes quedan pendientes.
- Una parte importante de la documentación jurídica no será automatizable.

### Corrección

Implementar al menos un proveedor real con:

- OCR por página;
- confianza;
- rotación;
- idioma español;
- detección de tablas;
- límites y coste;
- reintentos;
- redacción o control de PII según proveedor;
- política de residencia de datos;
- fallback controlado;
- revisión humana por baja confianza.

No debe confundirse OCR con el modelo de lenguaje: primero se extrae texto; después se analiza.

---

## P0-16. La subida de archivos no es atómica de extremo a extremo

Secuencia actual:

1. valida token;
2. sube Blob;
3. registra documento;
4. vincula requisito;
5. encola job;
6. consume uso.

Evidencia:

- `app/api/public/cargar/[token]/route.ts:92-145`

Riesgos:

- Blob huérfano si falla la DB.
- Documento sin requisito si falla la vinculación.
- Documento sin job si falla la cola.
- Uso no consumido si falla al final.
- Respuestas inconsistentes bajo concurrencia.

### Corrección

- Reserva atómica del uso del enlace.
- Registro de upload en estado `receiving`.
- Subida con clave controlada.
- Transacción de documento + vínculo + outbox.
- Compensación para borrar Blob huérfano.
- Reconciliador periódico de blobs y filas.
- Estado final solo tras persistencia completa.

---

## P0-17. El límite de usos del enlace tiene una carrera

La validación comprueba los usos y posteriormente se incrementan por separado:

- `lib/sgie/enlaces-magicos.ts:90-130`
- `lib/sgie/enlaces-magicos.ts:133-140`

Dos solicitudes concurrentes pueden validar antes de que ninguna incremente.

### Corrección

Reservar uso con un UPDATE condicional:

```sql
UPDATE enlaces_magicos
SET usos_actuales = usos_actuales + 1
WHERE id = ?
  AND revocado_en IS NULL
  AND expira_en > now()
  AND usos_actuales < usos_maximos
RETURNING *
```

Si no devuelve fila, el enlace no puede usarse.

---

## P0-18. La detección de duplicados tiene una ventana de carrera

Primero se consulta el hash y después se inserta:

- `lib/sgie/documentos-db.ts:35-94`

Sin una restricción única adecuada, dos cargas concurrentes del mismo documento pueden entrar como no duplicadas.

### Corrección

Crear índice único parcial o clave de deduplicación:

- `(organization_id, expediente_id, hash_sha256, version_scope)`

Decidir explícitamente si se bloquea el duplicado o se registra como nueva versión.

---

## P0-19. Los errores internos se convierten en “No autorizado”

`authFailureResponse` devuelve 401 para cualquier error que no sea `AuthError`:

- `lib/auth.ts:366-375`

Muchas rutas llaman a este helper para su `catch` general.

### Consecuencia

- Un fallo de base de datos parece un problema de sesión.
- La UI redirige o muestra errores engañosos.
- Se dificulta el soporte y la observabilidad.
- El usuario siente que el sistema falla de forma aleatoria.

### Corrección

Crear errores tipados:

- `AuthenticationError` → 401
- `AuthorizationError` → 403
- `ValidationError` → 400/422
- `NotFoundError` → 404
- `ConflictError` → 409
- `RateLimitError` → 429
- `DependencyError` → 502/503
- error no controlado → 500 + correlation ID

La respuesta al cliente no debe exponer detalles sensibles, pero los logs sí deben conservar contexto estructurado.

---

## P0-20. Faltan pruebas que cubran los contratos reales

Existen tests de helpers de agenda y calendario, pero no se ha localizado un test de integración que detecte:

- `limit=200` frente a máximo 100;
- evento personal que desaparece;
- permiso de expediente visible pero no editable;
- acceso SGIE desactivado;
- retry de jobs;
- claim concurrente;
- subida + outbox;
- creación transaccional de expediente.

### Corrección

Crear pruebas de flujo, no solo de funciones aisladas.

---

# 6. Admin y SGIE están desconectados

## 6.1 El Admin principal está orientado a la web pública

La navegación incluye:

- SEO;
- Blog;
- FAQ;
- Páginas;
- Menús;
- Biblioteca de medios;
- Áreas jurídicas;
- Configuración del sitio.

Evidencia:

- `app/intranet/admin/layout.tsx:46-95`

Sin embargo, ya existen pantallas SGIE administrativas:

- `/intranet/admin/sgie/usuarios`
- `/intranet/admin/sgie/metricas`
- `/intranet/admin/sgie/plantillas`
- `/intranet/admin/sgie/reglas`
- `/intranet/admin/sgie/retencion`

Estas rutas no aparecen en la navegación principal.

## 6.2 El dashboard Admin también es contenido-céntrico

Consulta blog y muestra acciones como:

- nuevo post;
- gestionar blog;
- panel SEO;
- páginas.

Evidencia:

- `app/intranet/admin/page.tsx`

El administrador abre el sistema y no ve:

- abogados activos;
- invitaciones pendientes;
- expedientes sin responsable;
- jobs fallidos;
- documentos atascados;
- vencimientos;
- carga por abogado;
- alertas críticas;
- salud de Resend/OCR/IA;
- tiempos de revisión;
- reglas que fallan.

## 6.3 Existen dos pantallas de usuarios

- `/intranet/admin/usuarios`: gestión extensa.
- `/intranet/admin/sgie/usuarios`: vista adicional que vuelve a enlazar a la anterior.

Esto crea duplicidad conceptual y mantenimiento doble.

## 6.4 Hay herramientas jurídicas antiguas dentro del Admin

El Admin contiene:

- calculadora;
- casos;
- Código Penal;
- delitos;
- agravantes.

Estas herramientas no son administración del sistema.

### Reorganización

- Las utilidades del abogado deben vivir en un área “Herramientas”.
- Los “casos” antiguos deben migrarse a expedientes SGIE o retirarse.
- El Admin debe reservarse para gobernanza y operación.
- No deben convivir dos conceptos distintos de caso/expediente.

---

# 7. Qué eliminar del Admin

El usuario ha decidido eliminar SEO y gestión de contenido. La retirada debe hacerse con seguridad para no romper la web pública.

## 7.1 Retirar inmediatamente de la navegación y del bundle administrativo

Pantallas:

- `app/intranet/admin/seo`
- `app/intranet/admin/blog`
- `app/intranet/admin/faq`
- `app/intranet/admin/pages`
- `app/intranet/admin/menus`
- `app/intranet/admin/medios`
- `app/intranet/admin/servicios`
- cualquier editor visual asociado
- configuración pública que solo modifica contenidos del sitio

APIs administrativas candidatas a retirada:

- `app/api/admin/seo/**`
- `app/api/admin/blog/**`
- `app/api/admin/faq/**`
- `app/api/admin/pages/**`
- `app/api/admin/menus/**`
- `app/api/admin/medios/**`
- `app/api/admin/areas-juridicas/**`
- `app/api/admin/site-config/**`
- `app/api/admin/categorias-blog/**`
- `app/api/admin/categorias-faq/**`
- `app/api/admin/tags/**`
- `app/api/admin/redirects/**`
- `app/api/admin/search-console/**`
- `app/api/admin/analytics/**` cuando solo sirva a la web pública
- `app/api/admin/visual-editor/**`
- `app/api/admin/preview/**` cuando dependa del CMS
- upload administrativo usado solo por el CMS

Scripts candidatos a sacar del producto intranet:

- scripts de blog;
- scripts SEO;
- IndexNow;
- Search Console;
- Bing Webmaster;
- auditorías editoriales;
- normalización de posts;
- corrección de metas;
- canibalización;
- enlaces internos;
- optimización editorial;
- importadores de analítica pública.

## 7.2 No borrar todavía las tablas de contenido

La web pública puede seguir leyendo:

- posts;
- páginas;
- FAQ;
- menús;
- áreas;
- configuración;
- redirects;
- medios.

### Estrategia segura

1. Desactivar edición en Admin.
2. Inventariar lecturas desde la web pública.
3. Exportar el contenido actual.
4. Migrarlo a MDX, Markdown, JSON versionado o a un servicio independiente.
5. Validar paridad visual y SEO.
6. Crear backup.
7. Retirar APIs administrativas.
8. Retirar tablas solo cuando ninguna ruta pública las use.

Eliminar tablas “de raíz” antes de esa migración podría romper la web pública.

## 7.3 Recomendación de separación

A medio plazo:

```text
apps/
  public-web/
  intranet/
packages/
  auth/
  database/
  ui/
  domain-sgie/
  observability/
```

No es obligatorio separar despliegues en el primer paso, pero sí separar dominios y dependencias.

---

# 8. Nuevo propósito del Admin

El Admin debe convertirse en el **centro de control operativo del SGIE**.

## 8.1 Navegación propuesta

### Operación

- Resumen operativo
- Cola de incidencias
- Documentos atascados
- Expedientes en riesgo
- Vencimientos globales
- Jobs y automatizaciones
- Salud de integraciones

### Personas y acceso

- Usuarios
- Invitaciones
- Roles y capacidades
- Equipos
- Sustituciones y ausencias
- Carga de trabajo
- Sesiones y seguridad

### Configuración SGIE

- Tipos de procedimiento
- Plantillas de expediente
- Checklists documentales
- Flujos de estados
- Reglas automáticas
- Plantillas de correo
- Políticas de recordatorio
- SLA y prioridades
- Categorías de documentos
- Campos de extracción

### Gobierno y cumplimiento

- Auditoría
- Retención
- Exportaciones
- Accesos a expedientes
- Consentimientos
- Incidentes
- Copias y restauración
- Configuración de privacidad

### Integraciones

- Resend
- Blob
- OCR
- IA
- Firma electrónica
- Calendarios
- Webhooks
- Estado de credenciales sin mostrar secretos

## 8.2 Dashboard Admin propuesto

Bloques prioritarios:

1. **Incidencias que requieren intervención**
   - jobs fallidos;
   - documentos sin procesar;
   - correos rebotados;
   - enlaces agotados;
   - OCR no disponible;
   - expedientes sin responsable.

2. **Riesgo operativo**
   - vencimientos en 24/48/72 horas;
   - expedientes bloqueados;
   - documentos pendientes de cliente;
   - revisiones fuera de SLA.

3. **Personas**
   - abogados activos;
   - invitaciones pendientes;
   - usuarios suspendidos;
   - carga por abogado;
   - ausencias;
   - reasignaciones recomendadas.

4. **Automatización**
   - porcentaje auto-clasificado;
   - porcentaje auto-vinculado;
   - correcciones humanas;
   - tasa de jobs correctos;
   - latencia de procesamiento;
   - ahorro estimado de tiempo.

5. **Salud**
   - DB;
   - Blob;
   - Resend;
   - OCR;
   - proveedor IA;
   - cron/worker;
   - última ejecución exitosa.

---

# 9. Nuevo panel del abogado

## 9.1 La navegación actual obliga a pensar en módulos

Actualmente hay entradas separadas para:

- Clientes
- Expedientes
- Documentos
- Alertas
- Tareas
- Agenda
- Correos

Esto refleja la base de datos, no el trabajo real del abogado.

## 9.2 Navegación propuesta

1. **Mi jornada**
2. **Expedientes**
3. **Revisión documental**
4. **Calendario y plazos**
5. **Clientes**
6. **Buscar**
7. **Informes personales**
8. **Herramientas jurídicas**

Las alertas, tareas y correos no necesitan ser destinos principales si se incorporan a la bandeja y al expediente.

## 9.3 Pantalla “Mi jornada”

Debe ser el centro del trabajo diario.

### Cola 1: requiere mi decisión

- documentos con baja confianza;
- contradicciones;
- readiness pendiente de aprobación;
- solicitudes de firma;
- cambios críticos de estado;
- plazos propuestos por IA.

### Cola 2: esperando a terceros

- documentos pedidos al cliente;
- firma pendiente;
- respuesta de juzgado;
- correo enviado;
- subsanación.

### Cola 3: en riesgo

- vencimientos próximos;
- expediente sin movimiento;
- cliente sin responder;
- documento rechazado;
- job fallido;
- correo rebotado.

### Cola 4: trabajo rápido

- aprobar documentos en bloque;
- confirmar fechas;
- completar tareas;
- enviar recordatorio;
- asignar responsable;
- generar paquete para firma.

## 9.4 Principio “zero inbox jurídico”

Cada elemento debe terminar en una acción:

- aprobar;
- devolver;
- pedir información;
- posponer con motivo;
- reasignar;
- resolver;
- abrir expediente.

No debe haber alertas meramente informativas sin propietario, vencimiento o resolución.

---

# 10. Espacio único de expediente

La pantalla actual de detalle tiene más de 500 líneas y acumula resumen, checklist, historial, documentos, alertas, seguimiento, readiness, inteligencia y acciones.

Debe convertirse en un workspace.

## 10.1 Cabecera fija

- número de expediente;
- cliente;
- procedimiento;
- estado;
- responsable;
- prioridad;
- siguiente vencimiento;
- readiness;
- progreso documental;
- siguiente mejor acción;
- acceso rápido a compartir, solicitar, generar paquete y cerrar.

## 10.2 Pestañas

### Resumen

- resumen ejecutivo;
- bloqueos;
- próximos pasos;
- fechas críticas;
- participantes;
- actividad reciente.

### Documentos

- checklist;
- archivos;
- versiones;
- estado de procesamiento;
- evidencias;
- comparación;
- aprobación por lotes.

### Tareas y plazos

- timeline;
- tareas;
- dependencias;
- calendario;
- hitos;
- alertas de SLA.

### Comunicaciones

- correos;
- recordatorios;
- plantillas;
- entregas;
- rebotes;
- mensajes relacionados.

### Historial

- auditoría legible;
- cambios de estado;
- accesos;
- aprobaciones;
- automatizaciones;
- correcciones de IA.

## 10.3 Panel lateral inteligente

- qué falta;
- qué es contradictorio;
- qué cambió desde la última visita;
- resumen con evidencias;
- sugerencia de próxima acción;
- confianza;
- enlace exacto a página y documento;
- nunca una conclusión sin fuente.

---

# 11. Rediseño completo de agenda y calendario

## 11.1 Modelo mínimo de evento

Añadir:

- `organizationId`
- `ownerUserId`
- `createdBy`
- `expedienteId` opcional
- `taskId` opcional
- `title`
- `description`
- `startAt`
- `endAt`
- `allDay`
- `timezone`
- `location`
- `eventType`
- `status`
- `visibility`
- `source`
- `sourceReference`
- `confidence`
- `confirmedBy`
- `confirmedAt`
- `recurrenceRule`
- `externalCalendarId`
- `externalEventId`
- `syncStatus`
- `cancelledAt`

Tablas relacionadas:

- participantes;
- recordatorios;
- recurrencias/excepciones;
- enlaces a expediente;
- entregas de notificación.

## 11.2 Tipos de evento

- plazo judicial;
- audiencia;
- cita con cliente;
- firma;
- revisión interna;
- entrega documental;
- tarea;
- recordatorio;
- evento personal;
- ausencia;
- hito de procedimiento.

## 11.3 Fechas propuestas por IA

La IA puede:

- detectar una fecha;
- indicar documento y página;
- explicar por qué parece un plazo;
- proponer el tipo;
- asignar confianza.

No debe confirmar automáticamente un plazo jurídico de alto riesgo.

Flujo:

```text
detectado → propuesto → revisión humana → confirmado → notificado → completado
```

## 11.4 Interfaz

- vista día, semana, mes y agenda;
- filtros por abogado, equipo, expediente y tipo;
- drag & drop con confirmación;
- panel rápido;
- crear desde expediente;
- crear desde tarea;
- reprogramar conservando historial;
- conflictos;
- zonas horarias;
- recordatorios;
- opción “ver solo plazos críticos”.

## 11.5 Integración externa

Preparar adaptadores para:

- Google Calendar;
- Microsoft 365;
- ICS.

La sincronización debe ser opcional, bidireccional solo cuando haya una política clara y evitando duplicados.

---

# 12. Motor de gestión documental automatizada

## 12.1 Objetivo operativo

El abogado no debería:

- renombrar documentos manualmente;
- decidir a qué expediente pertenece cada archivo salvo excepciones;
- revisar todos los archivos de principio a fin;
- comparar datos repetidos manualmente;
- recordar continuamente qué falta;
- redactar cada solicitud documental desde cero;
- revisar expedientes completos para saber si están listos.

## 12.2 Pipeline propuesto

### Paso 1. Creación del expediente

- seleccionar plantilla de procedimiento;
- crear checklist versionado;
- crear hitos;
- asignar responsable;
- generar solicitudes documentales;
- calcular SLA;
- registrar outbox.

### Paso 2. Solicitud segura

- enlace por cliente o requisito;
- caducidad;
- límite de usos;
- autenticación adicional opcional;
- instrucciones específicas;
- estado visible;
- recordatorios automáticos.

### Paso 3. Recepción

- validación;
- antivirus o proveedor de scanning;
- hash;
- deduplicación;
- almacenamiento privado;
- versión;
- auditoría;
- outbox durable.

### Paso 4. Extracción

- PDF con texto;
- OCR si es escaneado;
- texto por página;
- tablas;
- idioma;
- calidad;
- páginas ilegibles.

### Paso 5. Clasificación

- tipo documental;
- expediente probable;
- requisito probable;
- versión;
- confianza;
- detección de documento compuesto.

### Paso 6. Extracción estructurada

Según tipo:

- nombres;
- identidad;
- fechas;
- cuantías;
- número de expediente externo;
- órgano;
- firmantes;
- vigencia;
- referencias;
- campos configurables.

Cada campo debe guardar:

- valor;
- documento;
- página;
- fragmento;
- coordenadas cuando sea posible;
- confianza;
- modelo/pipeline;
- validación humana.

### Paso 7. Comprobaciones

- identidad coherente;
- nombres coherentes;
- fechas válidas;
- documento caducado;
- firma ausente;
- página ausente;
- duplicado;
- contradicción entre documentos;
- requisito equivocado;
- documento ilegible;
- documento manipulado, cuando exista proveedor;
- reglas por procedimiento.

### Paso 8. Enrutamiento

- alta confianza + regla determinista → vinculación automática reversible;
- confianza media → bandeja rápida;
- baja confianza o riesgo alto → revisión obligatoria;
- error técnico → cola operativa.

### Paso 9. Readiness

El expediente se considera preparado solo si:

- checklist confirmado;
- obligatorios presentes;
- procesamiento completo;
- datos críticos validados;
- no hay contradicciones bloqueantes;
- plazos revisados;
- tareas críticas cerradas;
- firmas requeridas definidas;
- aprobaciones humanas registradas.

### Paso 10. Paquete

- índice;
- documentos ordenados;
- nombres normalizados;
- carátula;
- resumen;
- checklist;
- evidencias;
- paquete de firma;
- hash y manifiesto;
- exportación controlada.

---

# 13. Copiloto jurídico-documental

El producto puede ser innovador sin convertir la IA en decisor jurídico.

## 13.1 Capacidades recomendadas

- “Resume lo ocurrido desde mi última visita”.
- “¿Qué falta para completar este expediente?”
- “Muéstrame las contradicciones”.
- “¿De dónde sale esta fecha?”
- “Compara estas dos versiones”.
- “Prepara una solicitud de los documentos pendientes”.
- “Genera un resumen para revisión”.
- “Agrupa expedientes con el mismo bloqueo”.
- “Busca una cláusula o dato en todos mis expedientes autorizados”.
- “Genera un paquete de revisión”.
- “Explica por qué no está listo”.
- “Sugiere la próxima mejor acción”.

## 13.2 Reglas obligatorias

- Responder solo con fuentes autorizadas.
- Citar documento y página.
- Mostrar confianza.
- Distinguir hecho, inferencia y sugerencia.
- No inventar.
- No ejecutar estados críticos.
- No enviar comunicaciones sensibles sin aprobación, salvo reglas expresamente autorizadas.
- Registrar prompt lógico, modelo, versión, evidencias y decisión humana.
- Permitir corrección y aprendizaje controlado.

## 13.3 Arquitectura IA

Separar:

1. OCR.
2. extracción estructurada.
3. clasificación.
4. embeddings/búsqueda.
5. razonamiento asistido.
6. reglas deterministas.
7. evaluación.
8. aprobación humana.

No enviar documentos completos a un modelo cuando basten fragmentos pertinentes.

---

# 14. Arquitectura objetivo

## 14.1 Dominios

```text
identity/
  users
  invitations
  memberships
  roles
  capabilities
  sessions
  2fa

organizations/
  firms
  teams
  policies
  integrations

cases/
  clients
  cases
  assignments
  permissions
  states
  timeline

workflows/
  procedure-templates
  workflow-versions
  steps
  requirements
  rules
  readiness

documents/
  uploads
  versions
  blobs
  text-pages
  facts
  evidence
  reviews
  signatures

work/
  tasks
  deadlines
  events
  reminders
  notifications

communications/
  templates
  messages
  deliveries
  inbound
  bounces

automation/
  outbox
  jobs
  schedules
  retries
  dead-letter
  automation-runs

ai/
  extraction
  classification
  summaries
  evaluations
  corrections

governance/
  audit
  retention
  exports
  incidents
```

## 14.2 Estructura de código recomendada

```text
app/
  (public)/
  intranet/
    admin/
    lawyer/
  api/
    admin/
    sgie/
    public/
    webhooks/
    workers/

modules/
  identity/
  organizations/
  cases/
  workflows/
  documents/
  calendar/
  communications/
  automation/
  ai/
  governance/

lib/
  db/
  auth/
  errors/
  observability/
  storage/
  email/
```

Cada módulo debe tener:

- schema;
- repository;
- service;
- policies;
- contracts;
- tests.

## 14.3 No acceder directamente a tablas desde cada ruta

Las rutas actuales repiten consultas de scope.

Crear servicios:

- `AccessService`
- `CaseService`
- `DocumentService`
- `WorkflowService`
- `CalendarService`
- `JobService`
- `CommunicationService`

Las APIs validan entrada y llaman a servicios; no reconstruyen reglas de negocio individualmente.

---

# 15. Modelo de datos recomendado

## 15.1 Identidad y organización

- `organizations`
- `memberships`
- `invitations`
- `roles`
- `capabilities`
- `role_capabilities`
- `membership_roles`
- `teams`
- `team_members`
- `delegations`
- `access_policies`

## 15.2 Expedientes

Añadir o consolidar:

- `organization_id`
- responsable principal;
- equipo;
- versión de workflow;
- SLA;
- próxima acción;
- próxima fecha;
- riesgo;
- readiness;
- clasificación;
- origen;
- archivado;
- bloqueo;
- prioridad calculada.

## 15.3 Documentos

- `documents`: identidad lógica.
- `document_versions`: cada archivo.
- `document_blobs`: ubicación y cifrado.
- `document_requirements`: relación con requisitos.
- `document_pages`: texto/OCR.
- `document_facts`: campos extraídos.
- `document_evidence`: fuente.
- `document_reviews`: decisiones.
- `document_issues`: incidencias.
- `document_processing_runs`: ejecuciones.
- `document_access_log`: accesos sensibles.

## 15.4 Workflows

- `workflow_templates`
- `workflow_versions`
- `workflow_steps`
- `workflow_requirements`
- `workflow_rules`
- `case_workflow_instances`
- `case_step_instances`
- `readiness_checks`

Nunca modificar una plantilla histórica que ya esté instanciada; crear versión nueva.

## 15.5 Automatización

- `outbox_events`
- `jobs`
- `job_attempts`
- `dead_letters`
- `automation_rules`
- `automation_runs`
- `scheduled_actions`

---

# 16. Multiempresa y aislamiento

El esquema contiene referencias a bufetes, pero muchas entidades SGIE no muestran un `organizationId` uniforme.

Hay que decidir:

## Opción A. Un único bufete

- Declararlo como restricción de producto.
- Simplificar temporalmente.
- Mantener diseño preparado para organización.

## Opción B. Varios bufetes

Todas las tablas de dominio deben incluir `organization_id` y todas las consultas deben filtrar en servidor.

No basta con ocultar información en UI.

Debe existir:

- aislamiento por organización;
- usuarios con membresías;
- roles por organización;
- claves y plantillas por organización;
- auditoría con tenant;
- storage path con tenant;
- límites y facturación;
- pruebas de fuga cruzada.

---

# 17. Comunicaciones y Resend

## 17.1 Convertir “Correos” en una bandeja relacionada con expedientes

Cada mensaje debe tener:

- expediente;
- cliente;
- plantilla;
- tipo;
- estado;
- remitente lógico;
- destinatarios;
- entrega;
- rebote;
- apertura si la política lo permite;
- respuesta;
- idempotencia;
- evidencia de consentimiento cuando corresponda.

## 17.2 Automatizaciones

- solicitud inicial;
- recordatorio;
- segundo recordatorio;
- aviso interno;
- documento rechazado;
- expediente listo;
- firma pendiente;
- vencimiento;
- cierre.

## 17.3 Gobierno

- plantillas versionadas;
- variables validadas;
- previsualización;
- aprobación para mensajes sensibles;
- rate limit;
- supresión de direcciones con rebote;
- webhook firmado;
- reintentos;
- log completo.

---

# 18. Seguridad y cumplimiento

## 18.1 Acceso

- invitación exclusiva;
- 2FA obligatoria para admin;
- opción obligatoria para abogados;
- sesiones cortas para acciones sensibles;
- reautenticación para exportar, cambiar permisos o descargar paquetes;
- bloqueo y revocación;
- lista de sesiones;
- cierre remoto;
- política por organización.

## 18.2 Autorización

- capacidades;
- scope por organización;
- scope por expediente;
- scope por documento;
- deny-by-default;
- tests de matriz;
- una única implementación de acceso.

## 18.3 Documentos

- Blob privado;
- URLs firmadas de corta duración;
- no devolver URL interna permanente;
- clasificación de sensibilidad;
- cifrado;
- retención;
- borrado;
- legal hold;
- exportación;
- antivirus;
- controles de descarga;
- marca y trazabilidad opcionales.

## 18.4 Auditoría

Registrar:

- actor;
- organización;
- recurso;
- acción;
- antes/después;
- motivo;
- IP;
- user agent;
- correlation ID;
- resultado;
- automatización/modelo;
- evidencia;
- timestamp.

La auditoría no debe poder editarse desde la aplicación.

## 18.5 IA

- contrato de tratamiento de datos;
- política de retención del proveedor;
- regiones;
- no entrenamiento cuando sea configurable;
- minimización;
- redacción de PII cuando proceda;
- evaluación periódica;
- logs sin documentos completos;
- controles de prompt injection documental.

---

# 19. Observabilidad operativa

## 19.1 Correlation ID

Cada operación debe tener un identificador desde UI hasta:

- API;
- DB;
- job;
- Blob;
- Resend;
- OCR;
- IA.

## 19.2 Métricas

- jobs pendientes/fallidos;
- edad del job más antiguo;
- latencia de procesamiento;
- tasa OCR;
- tasa de extracción;
- coste por documento;
- corrección humana;
- rebotes;
- eventos sin notificar;
- documentos huérfanos;
- blobs huérfanos;
- errores por endpoint;
- 401/403 reales;
- tiempos de respuesta;
- expedientes bloqueados.

## 19.3 Panel de salud

Mostrar al Admin:

- estado;
- última comprobación;
- latencia;
- última ejecución;
- error sanitizado;
- acción recomendada.

---

# 20. Testing necesario

## 20.1 Autenticación

- invitación válida;
- invitación expirada;
- uso único;
- usuario inactivo;
- SGIE desactivado;
- rol sin capacidad;
- cambio de rol;
- revocación de sesión;
- último admin.

## 20.2 Autorización

Matriz por operación:

| Acción | Admin | Supervisor | Abogado responsable | Colaborador | Sin acceso |
|---|---:|---:|---:|---:|---:|
| Ver expediente | Sí | Según scope | Sí | Sí | No |
| Reasignar | Sí | Capacidad | No | No | No |
| Aprobar documento | Capacidad | Capacidad | Sí | Según capacidad | No |
| Cambiar regla | Sí | No | No | No | No |
| Ver auditoría global | Sí | Opcional | No | No | No |

## 20.3 Calendario

Tests obligatorios:

1. La UI nunca envía un límite inválido.
2. Evento personal creado por abogado vuelve en GET.
3. Su propietario puede editarlo.
4. Un evento de expediente respeta asignaciones y permisos.
5. Un abogado sin acceso no ve ni modifica.
6. Reprogramación registra motivo.
7. Zona horaria no altera el día.
8. Rango mensual incluye bordes correctos.
9. Recordatorios son idempotentes.
10. Evento propuesto por IA requiere confirmación según riesgo.

## 20.4 Jobs

- claim atómico;
- dos workers no procesan el mismo job;
- incremento de intentos;
- backoff;
- recuperación de lock;
- dead-letter;
- retry manual;
- idempotencia;
- outbox;
- fallo de Blob;
- fallo OCR;
- fallo IA.

## 20.5 Documentos

- MIME real;
- hash;
- duplicado concurrente;
- enlace agotado concurrente;
- Blob huérfano;
- DB caída;
- OCR;
- baja confianza;
- versión;
- rechazo;
- aprobación;
- regla;
- readiness.

## 20.6 E2E críticos

1. Admin invita abogado.
2. Abogado activa cuenta y 2FA.
3. Admin activa SGIE.
4. Admin asigna expediente.
5. Abogado crea expediente desde plantilla.
6. Sistema envía solicitud.
7. Cliente carga documento.
8. Pipeline procesa.
9. Abogado revisa excepción.
10. Expediente pasa a listo para revisión.
11. Se genera paquete.
12. Auditoría reconstruye todo el flujo.

---

# 21. Backlog priorizado

## P0 — estabilización obligatoria

| ID | Trabajo | Criterio de aceptación |
|---|---|---|
| P0-01 | Corregir contrato de agenda | Calendario carga por rango y no produce 400. |
| P0-02 | Propiedad de eventos | Eventos personales permanecen visibles y editables por propietario. |
| P0-03 | Unificar scope | GET/POST/PATCH usan la misma política de acceso. |
| P0-04 | Aplicar `activoSgie` | Usuario desactivado no accede a ninguna API SGIE. |
| P0-05 | Servicio único de alta | Crear abogado sincroniza identidad, membresía, rol y SGIE. |
| P0-06 | Invitaciones | No se comparten contraseñas; token de un solo uso. |
| P0-07 | Bloquear `responsableId` | Solo capacidad autorizada reasigna. |
| P0-08 | Transacción de expediente | No existen expedientes parciales. |
| P0-09 | Cola durable | Intentos, locks, retry, backoff y DLQ funcionan. |
| P0-10 | Outbox documental | Ningún documento queda sin trabajo durable. |
| P0-11 | Cron/worker versionado | La automatización tiene ejecución verificable. |
| P0-12 | Errores tipados | Fallo interno no se devuelve como 401. |
| P0-13 | OCR real | Escaneos procesables con estado y confianza. |
| P0-14 | Test de flujo documental | Upload → procesamiento → review pasa de extremo a extremo. |
| P0-15 | Correlation IDs | Cualquier fallo puede rastrearse. |

## P1 — orden del producto

| ID | Trabajo | Criterio de aceptación |
|---|---|---|
| P1-01 | Retirar CMS/SEO del Admin | No aparece ni se carga en la intranet. |
| P1-02 | Dashboard Admin operativo | Muestra usuarios, riesgos, jobs e integraciones. |
| P1-03 | Fusionar usuarios | Una única pantalla y fuente de verdad. |
| P1-04 | Mover herramientas jurídicas | Ya no forman parte de Admin. |
| P1-05 | Retirar “casos” antiguos | Todo trabajo activo usa expedientes SGIE. |
| P1-06 | Nueva navegación abogado | Prioriza jornada, revisión y expedientes. |
| P1-07 | Workspace de expediente | Pestañas, cabecera y siguiente acción. |
| P1-08 | Bandeja de revisión | Documentos por excepción, con acciones rápidas. |
| P1-09 | Calendario completo | Propiedad, duración, recordatorios y plazos. |
| P1-10 | Estado operativo visible | UI muestra pendiente/procesando/fallido y cómo resolver. |

## P2 — automatización avanzada

| ID | Trabajo | Criterio de aceptación |
|---|---|---|
| P2-01 | Auto-clasificación | Documento se clasifica con evidencia y confianza. |
| P2-02 | Auto-vinculación | Se vincula a requisito cuando supera umbral. |
| P2-03 | Extracción estructurada | Campos con fuente y validación. |
| P2-04 | Contradicciones | Reglas comparan hechos entre documentos. |
| P2-05 | Resumen incremental | Indica cambios desde última visita. |
| P2-06 | Next best action | Cada expediente tiene acción recomendada explicable. |
| P2-07 | Aprobación en bloque | Operaciones seguras y auditadas. |
| P2-08 | Paquete para firma | Índice, manifiesto y versiones correctas. |
| P2-09 | Firma electrónica | Adaptador desacoplado. |
| P2-10 | Calendario externo | Sincronización controlada e idempotente. |

## P3 — diferenciación

| ID | Trabajo |
|---|---|
| P3-01 | Predicción de riesgo de incumplimiento de SLA. |
| P3-02 | Balance de carga y recomendaciones de reasignación. |
| P3-03 | Detección de documentos compuestos. |
| P3-04 | Comparador visual y semántico de versiones. |
| P3-05 | Búsqueda transversal con permisos y evidencias. |
| P3-06 | Brief diario personalizado. |
| P3-07 | Portal de cliente con progreso y requerimientos. |
| P3-08 | Métrica de ahorro de tiempo por automatización. |

---

# 22. Plan de implementación por bloques

## Bloque 0. Congelación y seguridad

- No añadir nuevas funciones al CMS Admin.
- Backup de Neon y Blob.
- Inventario de rutas públicas que dependen del CMS.
- Feature flags.
- Métricas de referencia.
- Pruebas de autorización.
- Entorno staging aislado.
- Ningún borrado de tablas todavía.

## Bloque 1. Estabilizar la operación

- calendario;
- activación SGIE;
- alta por invitación;
- autorización central;
- error handling;
- transacciones;
- cola;
- cron/worker;
- OCR;
- observabilidad.

Salida requerida:

- un documento cargado siempre termina en procesado, requiere intervención o fallido visible;
- nunca desaparece silenciosamente.

## Bloque 2. Reorganizar Admin

- retirar CMS/SEO de navegación;
- nuevo dashboard;
- usuarios unificados;
- equipos;
- roles/capacidades;
- plantillas;
- reglas;
- salud;
- auditoría;
- retención.

## Bloque 3. Rediseñar experiencia del abogado

- “Mi jornada”;
- workspace de expediente;
- revisión documental;
- calendario;
- acciones rápidas;
- estados comprensibles;
- responsive y accesibilidad.

## Bloque 4. Automatización documental

- pipeline;
- campos;
- evidencia;
- reglas;
- excepciones;
- readiness;
- paquetes;
- comunicación automática.

## Bloque 5. Copiloto y diferenciación

- resumen incremental;
- búsqueda;
- contradicciones;
- next best action;
- brief diario;
- comparación;
- predicción operativa.

## Bloque 6. Retirada definitiva del CMS

- contenido público migrado;
- paridad validada;
- APIs retiradas;
- scripts retirados;
- dependencias TipTap/Recharts u otras revisadas;
- tablas eliminadas mediante migraciones reversibles;
- separación de despliegues si aporta valor.

---

# 23. Reglas para ejecutar la reconstrucción con Codex

1. Trabajar en ramas pequeñas.
2. Un objetivo funcional por PR.
3. No mezclar retirada del CMS con migraciones SGIE críticas.
4. Añadir test de regresión antes de corregir cada fallo.
5. No modificar la web pública salvo en la fase de migración acordada.
6. No borrar tablas sin mapa de dependencias.
7. Todas las migraciones deben tener plan de rollback.
8. No introducir secretos.
9. No ejecutar contra producción.
10. No desplegar automáticamente.
11. Mantener compatibilidad temporal durante migraciones de roles.
12. No aceptar “funciona en UI” sin test de API y datos.
13. Toda automatización debe ser idempotente.
14. Toda acción automática debe ser visible y auditable.
15. Toda sugerencia IA debe conservar evidencia.
16. Toda decisión jurídica crítica necesita actor humano.
17. Toda cola debe tener retry y dead-letter.
18. Toda operación multi-entidad debe ser transaccional o usar saga/outbox.
19. Toda respuesta de error debe incluir correlation ID.
20. Cada fase debe terminar con lint, typecheck, tests, build y E2E relevante.

---

# 24. Definition of Done

Una funcionalidad no está terminada hasta que:

- tiene autorización en servidor;
- tiene validación;
- es idempotente cuando procede;
- registra auditoría;
- produce errores tipados;
- tiene estados loading, vacío, error y éxito;
- tiene accesibilidad básica;
- funciona en móvil;
- tiene test unitario;
- tiene test de integración;
- forma parte de un flujo E2E si es crítica;
- tiene métrica;
- aparece en salud operativa si depende de terceros;
- está documentada;
- no deja datos parciales;
- no expone secretos o PII;
- no rompe la web pública.

---

# 25. Indicadores de éxito

## Reducción de trabajo

- minutos de revisión por expediente;
- minutos de gestión documental por documento;
- porcentaje de documentos auto-clasificados;
- porcentaje auto-vinculado;
- porcentaje que requiere revisión;
- número de clics hasta resolver;
- expedientes gestionados por abogado.

## Calidad

- tasa de corrección de IA;
- falsos positivos;
- documentos mal vinculados;
- contradicciones reales detectadas;
- readiness revertido;
- plazos corregidos por abogado.

## Operación

- jobs fallidos;
- edad del job más antiguo;
- latencia upload → extracción;
- latencia extracción → clasificación;
- disponibilidad de OCR;
- rebotes;
- documentos huérfanos;
- blobs huérfanos.

## Cliente

- tiempo de respuesta;
- porcentaje de solicitudes completadas;
- recordatorios necesarios;
- enlaces expirados;
- carga correcta al primer intento.

## Riesgo

- plazos vencidos;
- expedientes sin responsable;
- expedientes sin actividad;
- accesos denegados;
- incidentes;
- descargas masivas;
- cambios de permisos.

---

# 26. Estado final deseado

## Para el administrador

El Admin crea una invitación, decide exactamente qué puede hacer el abogado, lo asigna a un equipo, controla su acceso al SGIE, configura plantillas y reglas, supervisa carga de trabajo, ve fallos técnicos y puede auditar cualquier acción.

## Para el abogado

El abogado abre “Mi jornada” y recibe una lista priorizada de decisiones. Entra en un expediente y encuentra todo: documentos, tareas, plazos, comunicaciones, historial y recomendaciones. Revisa excepciones, no archivos completos sin contexto.

## Para el cliente

El cliente recibe una solicitud clara, carga documentos sin crear cuenta, conoce qué falta y recibe recordatorios útiles. No ve información interna.

## Para el sistema

Cada evento crea trabajo durable. Cada documento tiene estado. Cada error es visible. Cada acción es auditable. Cada sugerencia tiene evidencia. Ningún proceso crítico depende de que una única función serverless termine correctamente.

---

# 27. Recomendación final

La intranet no necesita más funciones aisladas. Necesita un **núcleo operacional único**.

La prioridad correcta es:

1. corregir contratos rotos;
2. cerrar identidad, activación y permisos;
3. hacer durable el procesamiento;
4. retirar el CMS del Admin;
5. convertir el expediente en el centro de trabajo;
6. orientar la interfaz a acciones;
7. automatizar por excepción;
8. añadir IA con evidencia y control humano.

Si se ejecuta así, la ventaja del producto no será simplemente “usar IA”. La verdadera innovación será que el sistema conozca el estado documental de cada expediente, impulse el siguiente paso, detecte bloqueos, prepare la revisión y reduzca la intervención del abogado a aquello que realmente requiere criterio profesional.

---

# ANEXO A. Evidencias principales

| Hallazgo | Archivo y líneas |
|---|---|
| UI solicita 200 eventos | `app/intranet/sgie/agenda/page.tsx:80-89` |
| API limita a 100 | `app/api/sgie/agenda/route.ts:10-17` |
| GET excluye eventos personales | `app/api/sgie/agenda/route.ts:37-52` |
| POST permite evento sin expediente | `app/api/sgie/agenda/route.ts:93-100` |
| PATCH deniega evento sin expediente | `app/api/sgie/agenda/[id]/route.ts:30-43` |
| Admin contiene SEO/CMS | `app/intranet/admin/layout.tsx:64-95` |
| SGIE administrativo oculto en nav | rutas `app/intranet/admin/sgie/**` frente a `layout.tsx` |
| Alta directa con contraseña | `app/api/admin/usuarios/route.ts:53-90` |
| Dominio codificado | `lib/auth.ts:111-125` |
| Activación SGIE no exigida | `lib/schema.ts:829-839`; `lib/auth.ts:346-363` |
| Perfil SGIE solo se sincroniza al cambiar rol | `lib/sgie/usuarios-db.ts:140-169` |
| Sistema granular de permisos inalcanzable | `lib/permissions.ts:6-28` |
| Responsable arbitrario | `app/api/sgie/expedientes/route.ts:77-113` |
| Expediente no transaccional | `lib/sgie/expedientes-db.ts:340-406` |
| Jobs sin incremento/retry | `lib/sgie/jobs-db.ts:66-108` |
| Fallo de cola silenciado | `lib/sgie/jobs-db.ts:59-63` |
| Cron no configurado en archivo | `vercel.json:1-6` |
| Lote de procesamiento 5 | `app/api/cron/sgie/procesar/route.ts:18-33` |
| OCR solo stub | `lib/sgie/ocr/provider.ts:56-88` |
| Upload secuencial sin outbox | `app/api/public/cargar/[token]/route.ts:92-145` |
| Uso de enlace con carrera | `lib/sgie/enlaces-magicos.ts:90-140` |
| Duplicado check-then-insert | `lib/sgie/documentos-db.ts:35-94` |
| Error interno convertido en 401 | `lib/auth.ts:366-375` |
| Navegación SGIE por módulos | `app/intranet/sgie/layout.tsx:24-33` |
| Detalle de expediente monolítico | `app/intranet/sgie/expedientes/[id]/page.tsx` |

---

# ANEXO B. Decisiones de producto propuestas

1. No existe registro público.
2. Toda alta se realiza por invitación de Admin.
3. Cuenta activa y acceso SGIE son estados distintos.
4. Los roles pertenecen a una organización.
5. El expediente es el agregado principal.
6. Un único servicio resuelve acceso a expediente.
7. Agenda, tareas y comunicaciones dependen del expediente o de un propietario.
8. Todo proceso asíncrono usa outbox y job durable.
9. El OCR es una dependencia propia, no una función del LLM.
10. La IA propone; el abogado decide en acciones críticas.
11. El Admin no gestiona contenido público.
12. La web pública se separa progresivamente del producto intranet.
13. Los abogados trabajan por colas de acción, no por tablas aisladas.
14. Todo dato extraído conserva evidencia.
15. Toda automatización se puede explicar, revertir y auditar.


---

# AMPLIACIÓN V2 — DEFINICIÓN DEL PRODUCTO JURÍDICO-OPERATIVO

Esta ampliación corrige una carencia de la primera versión: no basta con definir infraestructura, documentos, agenda y automatizaciones. Para que el SGIE sea realmente útil en un bufete penal hay que definir:

1. Qué representa un expediente.
2. Cómo se construyen y gobiernan sus fases.
3. Qué cambia según el papel procesal del cliente.
4. Qué documentación se necesita en cada momento.
5. Qué comunicaciones deben producirse.
6. Qué puede automatizarse.
7. Qué debe aprobar un abogado.
8. Qué modelo de IA interviene en cada tarea.
9. De qué fuentes jurídicas y operativas obtiene conocimiento el sistema.
10. Cómo se mantiene actualizado cuando cambia la ley o la práctica del bufete.

La solución correcta no es programar un único flujo rígido llamado “proceso penal”. Debe construirse un **motor de expedientes y procedimientos versionados**, administrado por el bufete y ejecutado por el SGIE.

---

# 28. Supuesto jurisdiccional y alcance jurídico

Esta propuesta toma como jurisdicción inicial **Honduras**, coherente con el proyecto y el dominio del bufete.

La normativa hondureña estructura el procedimiento penal ordinario, a alto nivel, en:

- etapa preparatoria;
- etapa intermedia;
- debate o juicio oral y público.

La etapa preparatoria incluye, en términos generales:

- denuncia, cuando exista;
- investigación preliminar;
- requerimiento fiscal;
- audiencia inicial.

La etapa intermedia comprende:

- formalización de la acusación;
- contestación de cargos;
- auto de apertura a juicio.

El debate o juicio oral y público comprende:

- preparación;
- sustanciación;
- deliberación y sentencia.

El sistema no debe convertir estas categorías legales generales en un flujo rígido y universal. También existen:

- actuaciones previas a la judicialización;
- declaración de imputado;
- medidas cautelares;
- procedimientos alternativos;
- procedimiento abreviado;
- flagrancia o juicio expedito;
- querella o acusación privada;
- conciliación cuando proceda;
- recursos;
- ejecución de pena;
- incidentes;
- medidas de protección;
- actuaciones propias de la víctima;
- actuaciones propias de la defensa;
- actuaciones civiles derivadas del delito;
- procedimientos asociados a leyes penales especiales.

Por ello, el SGIE debe distinguir entre:

1. **macroetapa legal**;
2. **fase operativa del bufete**;
3. **hito procesal**;
4. **tarea**;
5. **requisito documental**;
6. **decisión profesional**;
7. **comunicación**;
8. **plazo**;
9. **resultado o transición**.

La herramienta no sustituye la revisión jurídica. Las plantillas y reglas deben ser aprobadas y versionadas por abogados del bufete.

---

# 29. Definición exacta de expediente

Un expediente no debe ser solamente una fila con cliente, estado y documentos.

Debe ser un agregado que reúna:

- organización o bufete;
- cliente principal;
- otras personas relacionadas;
- papel procesal;
- jurisdicción;
- órgano judicial;
- número interno;
- número judicial o fiscal;
- tipo de asunto;
- delitos investigados o imputados;
- procedimiento aplicable;
- versión del flujo;
- abogado responsable;
- equipo;
- estado interno;
- macroetapa legal;
- fase operativa;
- hitos;
- tareas;
- plazos;
- requisitos documentales;
- documentos y versiones;
- hechos extraídos;
- evidencias;
- comunicaciones;
- aprobaciones;
- decisiones;
- riesgos;
- readiness;
- auditoría;
- retención;
- resultado final.

## 29.1 Papeles procesales que modifican el flujo

Como mínimo:

- persona investigada;
- imputado;
- acusado;
- condenado;
- víctima;
- ofendido;
- acusador privado;
- querellante;
- tercero civilmente responsable;
- testigo asistido;
- representante;
- familiar o contacto autorizado.

El mismo tipo de delito no requiere el mismo trabajo cuando el bufete representa a la defensa que cuando representa a la víctima.

## 29.2 Clasificadores iniciales

Al abrir el expediente, el sistema debe preguntar:

- jurisdicción;
- sede;
- procedimiento;
- papel del cliente;
- situación de libertad;
- urgencia;
- existencia de audiencia o plazo;
- fecha conocida más próxima;
- existencia de requerimiento fiscal;
- existencia de denuncia;
- existencia de orden de captura;
- existencia de medidas cautelares;
- existencia de víctima vulnerable;
- existencia de evidencias digitales;
- necesidad de perito;
- origen del asunto;
- nivel de confidencialidad;
- posibles conflictos de interés.

Estas respuestas seleccionan una plantilla inicial y activan reglas específicas.

---

# 30. Las fases del expediente: cómo deben crearse

## 30.1 No codificar fases directamente en la interfaz

Una fase no debe ser un `enum` inmutable como:

```text
inicial → investigación → audiencia → juicio → cerrado
```

Ese enfoque volvería a dejar la intranet rígida y desactualizada.

Debe existir un **editor de plantillas procesales** en Admin.

## 30.2 Componentes de una plantilla

Cada plantilla debe contener:

- nombre;
- jurisdicción;
- tipo de procedimiento;
- papel procesal;
- versión;
- vigencia;
- abogado responsable de su aprobación;
- macroetapas;
- fases operativas;
- hitos;
- requisitos documentales;
- tareas;
- reglas;
- plazos;
- formularios;
- comunicaciones;
- aprobaciones;
- criterios de entrada;
- criterios de salida;
- bifurcaciones;
- excepciones;
- checklist de cierre.

## 30.3 Versionado

Ejemplo:

```text
Defensa penal ordinaria — Honduras
v1.0 — aprobada 2026-08-01
v1.1 — modifica requisitos de audiencia inicial
v2.0 — adapta cambios normativos o nueva metodología del bufete
```

Un expediente iniciado con `v1.0` debe mantener esa versión, salvo migración explícita y auditada.

Nunca se debe alterar retroactivamente el flujo histórico de expedientes abiertos.

## 30.4 Estados de una plantilla

- borrador;
- revisión jurídica;
- aprobada;
- activa;
- reemplazada;
- retirada.

Solo las plantillas aprobadas pueden crear expedientes reales.

## 30.5 Editor visual

El Admin debe permitir diseñar:

```text
fase
  ├─ requisitos documentales
  ├─ tareas
  ├─ plazo o regla de fecha
  ├─ correo de entrada
  ├─ recordatorios
  ├─ decisiones
  ├─ formulario
  ├─ automatizaciones
  ├─ condición de salida
  └─ posibles transiciones
```

El editor debe ser comprensible para un abogado y no exigir programación.

---

# 31. Plantilla inicial: defensa penal ordinaria

Esta plantilla es una base operativa que debe revisar el bufete.

## Fase 0. Consulta, conflicto y aceptación

### Objetivo

Determinar si el asunto puede aceptarse y si existe urgencia.

### Datos

- identidad del potencial cliente;
- contacto;
- personas contrarias;
- autoridad;
- número de asunto si existe;
- resumen;
- próximas fechas;
- situación de libertad;
- documentación disponible;
- origen del contacto.

### Automatizaciones

- comprobación de conflicto;
- detección de duplicado;
- clasificación inicial;
- identificación de urgencia;
- solicitud de documentos de consulta;
- creación de tarea de revisión.

### Comunicaciones

- confirmación de recepción;
- solicitud de documentación inicial;
- recordatorio de cita;
- aviso de documentación pendiente;
- comunicación de aceptación o imposibilidad de asumir el asunto.

### Bloqueo

No crear expediente activo hasta:

- conflicto resuelto;
- responsable asignado;
- aceptación registrada;
- relación profesional documentada según política del bufete.

---

## Fase 1. Apertura y recopilación inicial

### Objetivo

Crear una ficha fiable y reunir el núcleo documental.

### Requisitos posibles

- identidad;
- datos de contacto;
- autorización;
- contrato u hoja de encargo;
- denuncia;
- citación;
- requerimiento fiscal;
- acta o resolución;
- antecedentes entregados por el cliente;
- cronología inicial;
- pruebas disponibles;
- datos de testigos;
- documentos médicos;
- archivos digitales;
- recibos o justificantes;
- poderes cuando correspondan.

### Automatizaciones

- creación de carpetas lógicas;
- solicitud documental;
- clasificación;
- OCR;
- extracción de nombres, números, fechas y órganos;
- detección de próximos plazos;
- generación de cronología preliminar;
- detección de documentos ilegibles;
- comprobación de identidad cruzada.

### Salida

- expediente identificado;
- urgencia clasificada;
- documentación mínima disponible;
- abogado confirma estrategia inicial.

---

## Fase 2. Investigación y preparación

### Objetivo

Organizar hechos, evidencias, hipótesis y actuaciones necesarias.

### Elementos

- cronología;
- matriz de hechos;
- matriz de prueba;
- personas relacionadas;
- diligencias;
- peritos;
- testigos;
- documentos pendientes;
- contradicciones;
- teoría inicial;
- riesgos.

### Automatizaciones

- extracción de hechos;
- comparación de declaraciones;
- identificación de fechas;
- agrupación de evidencias;
- transcripción;
- detección de contradicciones;
- búsqueda semántica;
- recordatorios;
- borradores de solicitudes.

### Decisiones humanas

- estrategia;
- relevancia jurídica;
- diligencias a solicitar;
- valoración probatoria;
- comunicación sensible al cliente.

---

## Fase 3. Requerimiento, declaración y medidas

Esta fase se activa cuando el asunto se judicializa o existe una actuación inmediata.

### Elementos

- requerimiento fiscal;
- citación;
- orden;
- declaración de imputado;
- resolución;
- medidas cautelares;
- garantías;
- fecha de audiencia inicial;
- obligaciones del cliente.

### Automatizaciones

- extraer cargos y hechos atribuidos;
- extraer órgano y número;
- detectar fecha y hora;
- crear evento propuesto;
- preparar checklist de audiencia;
- generar instrucciones al cliente;
- recordar obligaciones cautelares;
- alertar por incompatibilidades de agenda.

### Comunicaciones

- explicación práctica de la citación;
- documentación que debe llevar;
- fecha, hora y lugar;
- instrucciones previas;
- confirmación de asistencia;
- recordatorio 72/24 horas;
- resultado de la actuación;
- obligaciones posteriores.

---

## Fase 4. Audiencia inicial

### Objetivo

Preparar, celebrar y registrar la actuación.

### Requisitos

- carpeta de audiencia;
- requerimiento;
- documentos de identidad;
- prueba disponible;
- testigos;
- peritajes;
- argumentos;
- medidas cautelares;
- minuta;
- resultado.

### Automatizaciones

- dossier de audiencia;
- índice de evidencias;
- resumen de contradicciones;
- cronología;
- lista de pendientes;
- extracción de resolución;
- actualización de estado;
- generación de tareas resultantes.

### Salidas posibles

- continuación;
- sobreseimiento;
- modificación;
- medidas;
- nueva audiencia;
- necesidad de recurso;
- cierre.

Cada salida puede abrir una rama distinta.

---

## Fase 5. Etapa intermedia

### Objetivo

Preparar formalización, contestación, prueba y apertura a juicio.

### Requisitos

- acusación;
- contestación;
- medios de prueba;
- exclusiones;
- objeciones;
- lista de testigos;
- peritos;
- piezas de convicción;
- resoluciones;
- auto de apertura.

### Automatizaciones

- comparar acusación con requerimiento;
- detectar hechos nuevos;
- matriz de prueba;
- comprobar anexos;
- comprobar que cada afirmación tiene respaldo;
- preparar índices;
- localizar contradicciones;
- actualizar riesgos;
- generar checklist de audiencia preliminar.

---

## Fase 6. Preparación del juicio

### Objetivo

Conseguir que toda la documentación y estrategia estén listas.

### Elementos

- teoría del caso;
- cronología final;
- matriz hechos-prueba;
- testigos;
- interrogatorios;
- contrainterrogatorios;
- peritos;
- objeciones;
- documentos;
- piezas de convicción;
- logística;
- agenda de sesiones.

### Automatizaciones

- paquete de juicio;
- versiones consolidadas;
- vínculos de evidencia;
- resumen por testigo;
- comparación de declaraciones;
- listado de inconsistencias;
- control de disponibilidad;
- comunicaciones de preparación.

La IA puede ayudar a estructurar y comparar. No debe decidir estrategia ni generar afirmaciones sin evidencia.

---

## Fase 7. Juicio oral y público

### Objetivo

Dar soporte operativo durante el debate.

### Capacidades

- agenda de sesiones;
- carpeta rápida;
- notas;
- incidencias;
- acceso por evidencia;
- búsqueda instantánea;
- comparación con declaraciones anteriores;
- tareas surgidas;
- registro de resultado.

Las acciones en tiempo real deben ser rápidas, resilientes y no depender exclusivamente de un modelo externo.

---

## Fase 8. Sentencia y decisión sobre recursos

### Objetivo

Recibir, analizar y decidir la siguiente actuación.

### Automatizaciones

- OCR y extracción;
- resumen estructurado;
- identificación de decisión;
- penas, medidas y obligaciones;
- detección de fechas;
- cálculo de plazo propuesto;
- comparación con pretensiones;
- preparación de matriz de motivos potenciales;
- creación de reunión con cliente.

### Control humano

Todo plazo, recurso o decisión debe ser confirmado por abogado.

---

## Fase 9. Recursos

Plantillas separadas según el recurso procedente.

### Elementos

- resolución recurrida;
- fecha de notificación;
- plazo;
- legitimación;
- motivos;
- precedentes;
- anexos;
- presentación;
- resultado.

### Automatizaciones

- calendario;
- checklist;
- paquete documental;
- comparación;
- citas internas;
- seguimiento;
- comunicación al cliente.

---

## Fase 10. Ejecución y seguimiento posterior

### Elementos

- sentencia firme;
- pena;
- medidas;
- pagos;
- reglas de conducta;
- cómputos;
- centro;
- incidencias;
- solicitudes;
- beneficios;
- liberación;
- cierre.

### Automatizaciones

- recordatorios;
- seguimiento de obligaciones;
- documentación periódica;
- comunicaciones;
- alertas por incumplimiento;
- generación de informes.

---

## Fase 11. Cierre y retención

### Checklist

- resultado documentado;
- cliente informado;
- documentos finales;
- honorarios según sistema externo o integración;
- accesos revocados;
- enlaces cerrados;
- exportación;
- retención asignada;
- lecciones internas;
- plantilla corregida si hubo incidencias;
- satisfacción opcional;
- cierre aprobado.

---

# 32. Otras plantillas obligatorias

No debe existir una sola plantilla penal.

Mínimo inicial:

1. Defensa penal ordinaria.
2. Defensa urgente con persona detenida.
3. Defensa en flagrancia o procedimiento expedito.
4. Procedimiento abreviado.
5. Asistencia a víctima.
6. Acusación privada o querella.
7. Recurso.
8. Ejecución de pena.
9. Medidas cautelares.
10. Consulta penal sin expediente judicial.
11. Investigación corporativa o interna, si el bufete la presta.
12. Plantillas por leyes especiales que sean frecuentes en el bufete.

Cada plantilla debe especificar su aplicabilidad y exclusiones.

---

# 33. De dónde sale el material para construir las fases

El sistema no debe “aprender por sí solo” cómo trabaja el bufete.

Debe ejecutarse un proyecto de **modelado jurídico y operativo**.

## 33.1 Fuentes externas

- Código Procesal Penal vigente y reformas.
- Código Penal vigente y reformas.
- Constitución.
- Leyes penales especiales.
- Reglamentos aplicables.
- normativa de medidas, ejecución y protección;
- acuerdos, circulares y protocolos oficiales;
- formularios oficiales;
- información del Poder Judicial;
- jurisprudencia oficialmente disponible;
- criterios que el bufete decida incorporar con revisión;
- calendario judicial y días inhábiles cuando exista fuente oficial.

## 33.2 Fuentes internas

- manuales del bufete;
- checklists;
- modelos de escritos;
- plantillas de correo;
- formularios;
- expedientes cerrados anonimizados;
- listas de documentos que los abogados solicitan;
- motivos de devolución;
- errores frecuentes;
- cronologías típicas;
- nomenclatura interna;
- criterios de asignación;
- niveles de urgencia;
- acuerdos de servicio;
- proceso de revisión y firma;
- práctica por sede u órgano;
- experiencia de abogados senior.

## 33.3 Talleres de modelado

Para cada tipo de asunto:

1. seleccionar 5–20 expedientes cerrados representativos;
2. anonimizar;
3. reconstruir su línea temporal;
4. enumerar documentos;
5. identificar decisiones;
6. identificar comunicaciones;
7. identificar bloqueos;
8. identificar plazos;
9. separar lo obligatorio de lo habitual;
10. describir excepciones;
11. diseñar la plantilla;
12. probarla con un expediente simulado;
13. aprobarla jurídicamente;
14. pilotarla;
15. medir y corregir.

## 33.4 No usar material sin gobernanza

No deben incorporarse automáticamente:

- documentos de clientes sin base de tratamiento;
- expedientes abiertos para entrenar modelos;
- jurisprudencia de origen incierto;
- blogs como fuente normativa;
- respuestas de IA como si fueran derecho vigente;
- plantillas antiguas sin fecha ni responsable;
- criterios personales no aprobados.

---

# 34. Base de conocimiento jurídica versionada

## 34.1 Tipos de contenido

- norma;
- reforma;
- jurisprudencia;
- protocolo;
- formulario;
- plantilla;
- criterio interno;
- checklist;
- guía de atención;
- modelo de comunicación.

## 34.2 Metadatos obligatorios

- jurisdicción;
- autoridad;
- tipo;
- título;
- fecha;
- vigencia desde;
- vigencia hasta;
- fuente;
- versión;
- hash;
- responsable legal;
- estado de revisión;
- alcance;
- etiquetas;
- normas relacionadas;
- contenido reemplazado.

## 34.3 Flujo de publicación

```text
ingestado
→ clasificado
→ pendiente de revisión jurídica
→ aprobado
→ publicado internamente
→ reemplazado o retirado
```

La IA solo puede usar como fuente jurídica operativa material aprobado, salvo que la interfaz indique claramente que es material no validado.

## 34.4 Actualizaciones normativas

Crear una tarea periódica:

- revisar fuentes oficiales;
- detectar modificaciones;
- generar diff;
- identificar plantillas afectadas;
- bloquear publicación automática;
- solicitar revisión;
- publicar nueva versión;
- decidir si migrar expedientes existentes.

---

# 35. Sistema de comunicaciones con el cliente

La comunicación no debe ser una función lateral llamada “Correos”.

Debe ser un motor unido a:

- fase;
- requisito;
- tarea;
- plazo;
- decisión;
- documento;
- firma;
- cita;
- incidencia;
- estado del expediente.

## 35.1 Principio

Cada comunicación debe responder:

- por qué se envía;
- quién la autoriza;
- a quién;
- sobre qué expediente;
- qué acción se solicita;
- cuándo vence;
- qué enlace seguro contiene;
- qué ocurre si no responde;
- cuándo deja de enviarse;
- cómo se registra la respuesta.

## 35.2 Tipos de comunicación

- transaccional automática;
- transaccional con aprobación;
- informativa;
- solicitud documental;
- recordatorio;
- aviso de cita;
- aviso de plazo;
- confirmación;
- incidencia;
- devolución;
- firma;
- cierre;
- comunicación interna;
- mensaje manual relacionado con expediente.

## 35.3 Niveles de automatización

### Nivel 0. Manual

El sistema propone, el abogado redacta y envía.

### Nivel 1. Plantilla asistida

El sistema rellena una plantilla y el abogado aprueba.

### Nivel 2. Automática segura

Se envía sin aprobación porque:

- no contiene asesoramiento jurídico;
- el texto está aprobado;
- el disparador es determinista;
- el destinatario está verificado;
- existe una regla activa.

Ejemplos:

- confirmación de recepción;
- recordatorio de documento pendiente;
- recordatorio de cita;
- confirmación de carga;
- enlace de acceso.

### Nivel 3. Automática supervisada

El sistema puede enviar por reglas, pero se muestra en una cola previa o resumen.

### Nivel 4. Prohibida sin aprobación

- valoración del caso;
- estrategia;
- reconocimiento de hechos;
- recomendación de aceptar un acuerdo;
- resultado judicial interpretado;
- recurso;
- información extremadamente sensible;
- mensaje que pueda perjudicar derechos.

---

# 36. Orquestador de comunicaciones

No enviar correos directamente desde las rutas de expediente.

## 36.1 Flujo técnico

```text
evento de dominio
→ regla de comunicación
→ validación de condiciones
→ creación de communication_intent
→ aprobación si corresponde
→ renderizado de plantilla
→ outbox
→ job de envío
→ Resend
→ webhook
→ actualización de entrega
→ timeline del expediente
→ siguiente regla o escalado
```

## 36.2 Ejemplos de eventos de dominio

- `case.created`
- `case.phase_entered`
- `client.invited`
- `document.requested`
- `document.received`
- `document.rejected`
- `document.approved`
- `requirement.pending`
- `deadline.confirmed`
- `appointment.scheduled`
- `appointment.changed`
- `hearing.result_recorded`
- `signature.requested`
- `signature.completed`
- `case.ready_for_review`
- `case.closed`
- `email.bounced`
- `client.replied`

## 36.3 Condiciones de una regla

Ejemplo:

```yaml
trigger: requirement.pending
conditions:
  - requirement.client_action_required == true
  - days_pending >= 3
  - case.status not_in [closed, suspended]
  - recipient.email_verified == true
  - no_successful_upload_after_request == true
action:
  template: document-reminder-1
  automation_level: automatic_safe
  deduplication_window: 72h
  stop_when:
    - requirement.completed
    - request.cancelled
    - email.hard_bounced
```

---

# 37. Modelo de datos de comunicaciones

## Tablas propuestas

### `communication_threads`

- id;
- organizationId;
- caseId;
- clientId;
- subjectCanonical;
- status;
- lastActivityAt;
- assignedTo;
- sensitivity.

### `communication_intents`

Representa la intención antes del envío.

- trigger;
- ruleId;
- templateVersionId;
- approvalRequired;
- approvalStatus;
- generatedData;
- idempotencyKey;
- scheduledFor;
- cancelledAt.

### `messages`

- threadId;
- direction;
- channel;
- sender;
- recipients;
- subject;
- renderedBody;
- textBody;
- status;
- provider;
- providerMessageId;
- sentAt;
- receivedAt;
- sensitivity;
- createdBy;
- approvedBy.

### `message_deliveries`

- messageId;
- recipient;
- sent;
- delivered;
- delayed;
- bounced;
- complained;
- suppressed;
- failed;
- lastEventAt;
- failureCode;
- failureReason.

### `message_events`

- providerEventId;
- type;
- providerCreatedAt;
- receivedAt;
- payloadSanitized;
- processedAt;
- duplicate.

### `message_attachments`

Nunca usar adjuntos sensibles cuando sea preferible un enlace autenticado.

### `communication_rules`

- trigger;
- conditions;
- template;
- delay;
- recurrence;
- stop conditions;
- escalation;
- approval level;
- active;
- version.

### `contact_preferences`

- canales permitidos;
- idioma;
- horarios;
- contacto alternativo;
- consentimiento;
- restricciones;
- verificación.

---

# 38. Estados de correo y webhooks de Resend

El SGIE debe distinguir:

- programado;
- en cola interna;
- enviado a Resend;
- aceptado por Resend;
- entregado al servidor destinatario;
- retrasado;
- rebotado;
- fallido;
- suprimido;
- marcado como spam;
- abierto, solo si se usa y la política lo permite;
- clicado, solo si se usa y la política lo permite;
- respuesta recibida.

No se debe mostrar “enviado correctamente” cuando solo se obtuvo una respuesta válida de la API.

## 38.1 Webhook

El endpoint debe:

- verificar firma;
- guardar el ID único de entrega;
- ser idempotente;
- aceptar eventos fuera de orden;
- responder rápidamente;
- procesar después mediante cola;
- relacionar `providerMessageId` con el mensaje;
- registrar timeline;
- generar alerta ante rebote o queja;
- detener recordatorios si la dirección es inválida;
- permitir replay.

## 38.2 Reglas ante problemas

### Rebote permanente

- marcar correo no operativo;
- detener automatizaciones;
- crear tarea para verificar contacto;
- usar contacto alternativo aprobado;
- mostrar alerta al responsable.

### Retraso temporal

- esperar;
- no duplicar;
- escalar si vence un plazo de contacto.

### Queja de spam

- suspender comunicaciones no esenciales;
- alertar Admin;
- revisar consentimiento y plantilla.

### Fallo técnico

- reintentar según política;
- dead-letter;
- alerta operativa;
- nunca perder la intención original.

---

# 39. Correos necesarios a lo largo del expediente

## 39.1 Consulta inicial

- confirmación de recepción;
- documentos necesarios para valorar el asunto;
- enlace seguro;
- cita;
- recordatorio;
- confirmación de que el asunto será revisado;
- aceptación;
- rechazo o conflicto, con texto aprobado.

## 39.2 Apertura

- bienvenida;
- datos del abogado;
- canal autorizado;
- explicación del portal;
- documentos iniciales;
- firma de documentos;
- aviso de privacidad;
- instrucciones de seguridad.

## 39.3 Recopilación documental

- solicitud inicial;
- confirmación de carga;
- archivo ilegible;
- archivo equivocado;
- documento incompleto;
- documento caducado;
- requisito cumplido;
- primer recordatorio;
- segundo recordatorio;
- aviso de bloqueo;
- llamada requerida.

## 39.4 Audiencias y citas

- confirmación;
- ubicación;
- documentos que debe llevar;
- instrucciones;
- recordatorio;
- cambio;
- cancelación;
- confirmación de asistencia;
- resumen práctico posterior aprobado.

## 39.5 Medidas y obligaciones

- obligaciones del cliente;
- fechas;
- documentación acreditativa;
- recordatorios;
- aviso interno de posible incumplimiento;
- confirmación de cumplimiento.

## 39.6 Preparación de juicio

- reunión;
- preparación;
- disponibilidad;
- testigos;
- documentos;
- cambios;
- instrucciones logísticas.

## 39.7 Resolución

- recepción de resolución;
- reunión para explicación;
- próximos pasos;
- decisión pendiente;
- plazo confirmado;
- copia segura;
- instrucciones aprobadas.

## 39.8 Firma

- documento listo;
- acceso;
- verificación;
- recordatorio;
- firma completada;
- rechazo o caducidad.

## 39.9 Cierre

- confirmación;
- documentos finales;
- retención;
- revocación de accesos;
- encuesta opcional;
- instrucciones posteriores.

---

# 40. Ejemplo completo: solicitud documental automatizada

## Disparador

Se crea un expediente de defensa y la plantilla genera siete requisitos.

## Acción del sistema

1. Agrupa los requisitos solicitables al cliente.
2. Elimina requisitos ya satisfechos.
3. Selecciona plantilla aprobada.
4. Genera un enlace seguro con:
   - expediente;
   - requisitos;
   - expiración;
   - límite;
   - idioma;
   - auditoría.
5. Crea intención de comunicación.
6. Envía por Resend.
7. Guarda el ID.
8. Espera webhooks.
9. Muestra entrega en timeline.

## Respuesta del cliente

1. Cliente abre el enlace.
2. Ve una lista clara.
3. Carga archivos por requisito.
4. Se valida y procesa.
5. El cliente recibe confirmación.
6. El requisito pasa a recibido o requiere corrección.
7. Si falta algo, el próximo recordatorio contiene solo lo pendiente.
8. Cuando todo está completo se cancelan los recordatorios.

## Escalado

```text
día 0 → solicitud
día 3 → recordatorio 1
día 7 → recordatorio 2
día 10 → tarea de llamada
día 14 → expediente bloqueado y alerta
```

Los tiempos deben ser configurables por plantilla y caso.

---

# 41. Portal del cliente

El correo debe ser el canal de aviso, no el lugar donde se exponga toda la información.

## Funciones

- acceso mediante enlace seguro;
- opción de segundo factor para expedientes sensibles;
- requisitos pendientes;
- carga;
- estado de cada archivo;
- instrucciones;
- citas;
- firmas;
- mensajes;
- contacto;
- historial limitado.

## Seguridad

- no mostrar estrategia;
- no mostrar notas internas;
- no exponer otros participantes;
- no usar URLs permanentes de Blob;
- enlaces de corta duración;
- revocación;
- limitación;
- auditoría;
- detección de acceso anómalo;
- expiración.

## Respuestas por correo

Resend Inbound puede recibir respuestas en una dirección relacionada con el hilo.

Flujo:

```text
respuesta recibida
→ webhook inbound
→ validación
→ búsqueda de hilo
→ guardar mensaje
→ analizar adjuntos
→ relacionar con expediente
→ notificar abogado
→ nunca cambiar estado jurídico sin revisión
```

Los adjuntos entrantes deben pasar por el mismo pipeline de seguridad documental.

---

# 42. Plantillas de correo

## 42.1 No guardar textos sueltos

Cada plantilla debe tener:

- identificador;
- finalidad;
- fase;
- evento;
- idioma;
- versión;
- asunto;
- HTML;
- texto plano;
- variables permitidas;
- sensibilidad;
- nivel de automatización;
- aprobador;
- vigencia;
- pruebas;
- vista previa.

## 42.2 Variables seguras

Ejemplos:

- nombre del cliente;
- nombre del abogado;
- número interno;
- lista de requisitos;
- fecha confirmada;
- lugar;
- enlace seguro;
- fecha de expiración;
- teléfono del bufete.

No permitir que un modelo inserte arbitrariamente contenido jurídico sensible sin validación.

## 42.3 Bloques reutilizables

- encabezado;
- identidad del bufete;
- aviso de seguridad;
- botón;
- contacto;
- privacidad;
- no responder, cuando corresponda;
- firma del responsable.

## 42.4 Aprobación

Una nueva versión de plantilla:

```text
borrador
→ revisión de estilo
→ revisión jurídica
→ prueba
→ aprobada
→ activa
```

---

# 43. IA concreta recomendada

No debe existir “una IA que hace todo”.

## 43.1 Capa 1. Extracción local de PDF

Para PDFs con texto:

- `pdfjs` o parser equivalente;
- extracción por página;
- coordenadas;
- metadatos;
- sin coste de LLM.

## 43.2 Capa 2. OCR

Para PDF escaneado o imagen:

### Recomendación inicial

Crear una interfaz de proveedor y ejecutar una prueba comparativa con:

- Google Document AI Enterprise OCR;
- Azure Document Intelligence Read/Layout;
- alternativa adicional si costes o residencia lo aconsejan.

La decisión debe basarse en un conjunto real anonimizado de documentos del bufete.

### Métricas

- precisión en español;
- manuscritos;
- sellos;
- tablas;
- páginas inclinadas;
- calidad baja;
- coordenadas;
- confianza;
- tiempo;
- coste;
- región;
- retención;
- contrato de tratamiento.

No ejecutar OCR pesado dentro de una petición de Vercel.

## 43.3 Capa 3. DeepSeek V4 Flash

Usarlo como modelo principal de volumen para:

- clasificación documental;
- extracción a JSON;
- normalización;
- resumen por documento;
- detección de entidades;
- propuesta de requisito;
- propuesta de fase;
- generación de borradores de correo con plantilla;
- análisis inicial de incidencias;
- comparación sencilla;
- traducción o simplificación controlada.

Razones:

- coste bajo;
- gran contexto;
- salida JSON;
- llamadas a herramientas;
- alta concurrencia.

## 43.4 Capa 4. DeepSeek V4 Pro

Reservarlo para:

- razonamiento entre múltiples documentos;
- contradicciones complejas;
- cronología consolidada;
- comparación de versiones;
- revisión de un paquete;
- resumen de resolución;
- preparación de un briefing;
- análisis de expedientes de alto valor;
- segunda revisión cuando Flash tiene baja confianza.

No usar Pro por defecto para cada página.

## 43.5 Capa 5. Motor determinista

Debe decidir:

- si existe un requisito;
- si un documento está recibido;
- si una fecha fue confirmada;
- si un plazo está pendiente;
- si una aprobación falta;
- si un correo debe detenerse;
- si el expediente cumple readiness.

La IA entrega propuestas y hechos con evidencia. Las reglas deterministas controlan estados.

## 43.6 Capa 6. Revisión humana

Obligatoria en:

- estrategia;
- plazos jurídicos;
- calificación;
- medidas;
- recursos;
- comunicación sensible;
- contradicción crítica;
- cierre;
- paquete de firma;
- readiness jurídico final.

---

# 44. Enrutador de modelos

No codificar llamadas directas a un modelo en cada función.

Crear:

```ts
interface AIModelRouter {
  classifyDocument(input): Promise<Result>
  extractFields(input, schema): Promise<Result>
  compareDocuments(input): Promise<Result>
  summarizeCase(input): Promise<Result>
  draftCommunication(input): Promise<Result>
}
```

## Política sugerida

```text
tarea simple y estructurada
→ DeepSeek V4 Flash sin thinking

tarea compleja con varios documentos
→ DeepSeek V4 Flash thinking

baja confianza o alto riesgo
→ DeepSeek V4 Pro

resultado todavía incierto
→ revisión humana
```

## Fallback

- segundo intento con prompt corregido;
- proveedor/modelo alternativo;
- no ocultar error;
- marcar intervención;
- conservar trazabilidad.

---

# 45. Contrato de salida de IA

Toda extracción debe devolver:

```json
{
  "schemaVersion": "1.0",
  "documentType": {
    "value": "resolucion",
    "confidence": 0.94,
    "evidence": [
      {
        "page": 1,
        "text": "fragmento mínimo",
        "bbox": [0, 0, 0, 0]
      }
    ]
  },
  "fields": {},
  "warnings": [],
  "requiresHumanReview": true
}
```

## Reglas

- JSON validado;
- schema versionado;
- evidencia;
- confianza por campo;
- no inventar valores;
- `null` cuando no existe;
- distinguir texto literal e inferencia;
- conservar modelo, versión, prompt lógico y coste;
- evaluación automatizada;
- revisión humana.

---

# 46. Cómo usar la IA sobre el expediente

## 46.1 No enviar todo sin criterio

Crear un contexto compuesto por:

- datos estructurados;
- documentos relevantes;
- páginas recuperadas;
- hechos confirmados;
- fase;
- papel procesal;
- pregunta;
- fuentes jurídicas aprobadas.

## 46.2 RAG con permisos

La búsqueda debe filtrar antes de recuperar:

- organización;
- usuario;
- expediente;
- sensibilidad;
- estado de aprobación;
- vigencia.

## 46.3 Defensa ante prompt injection documental

Los documentos pueden contener instrucciones maliciosas.

El sistema debe indicar al modelo:

- el documento es datos, no instrucciones;
- ignorar órdenes contenidas;
- no revelar secretos;
- usar herramientas restringidas;
- no cambiar estados;
- citar evidencias.

La ejecución de acciones se realiza fuera del modelo y mediante permisos.

---

# 47. Construcción del conocimiento con expedientes pasados

## Objetivo

Aprender patrones operativos, no entrenar automáticamente un modelo con datos personales.

## Proceso

1. seleccionar expedientes cerrados;
2. obtener autorización y base jurídica aplicable;
3. anonimizar;
4. extraer estructura;
5. etiquetar fases;
6. etiquetar documentos;
7. etiquetar decisiones;
8. identificar comunicaciones;
9. construir ejemplos;
10. revisar por abogados;
11. almacenar como dataset interno;
12. usar para evaluación y diseño de reglas.

## Dataset inicial recomendado

Por cada procedimiento:

- 20–50 documentos de cada tipo frecuente;
- casos de buena y mala calidad;
- escaneos;
- documentos incompletos;
- duplicados;
- contradicciones;
- ejemplos de clasificación;
- salidas esperadas.

El primer objetivo no es fine-tuning. Es:

- evaluar OCR;
- evaluar extracción;
- diseñar schemas;
- crear tests;
- fijar umbrales.

---

# 48. Panel Admin para configurar el producto jurídico

## Sección “Procedimientos”

- plantillas;
- versiones;
- fases;
- transiciones;
- aplicabilidad;
- aprobación;
- simulación.

## Sección “Documentos”

- tipos;
- campos;
- requisitos;
- validaciones;
- ejemplos;
- reglas de calidad;
- retención.

## Sección “Comunicaciones”

- plantillas;
- reglas;
- niveles de automatización;
- recordatorios;
- horarios;
- escalados;
- rebotes;
- idiomas.

## Sección “IA”

- modelos;
- tareas;
- umbrales;
- costes;
- prompts lógicos;
- schemas;
- evaluaciones;
- errores;
- correcciones.

## Sección “Conocimiento”

- fuentes;
- vigencia;
- revisión;
- impacto;
- publicación;
- material sustituido.

## Sección “Simulador”

Permitir crear un expediente ficticio y comprobar:

- fases;
- tareas;
- correos;
- requisitos;
- transiciones;
- plazos;
- automatizaciones;
- readiness.

Nada debe activarse en producción sin simulación y aprobación.

---

# 49. Motor de transición de fases

## 49.1 Entrada

Una fase puede activarse por:

- acción humana;
- documento;
- resolución;
- fecha;
- evento;
- regla;
- importación;
- webhook;
- finalización de otra fase.

## 49.2 Condiciones de salida

Ejemplo:

```text
Fase: recopilación inicial

obligatorios:
- identidad aprobada
- contrato firmado
- requerimiento recibido o marcado no aplicable
- próxima fecha confirmada o marcada desconocida
- responsable asignado

bloqueantes:
- conflicto no resuelto
- cliente no verificado
- documento crítico ilegible
```

## 49.3 Transición

Toda transición registra:

- fase origen;
- fase destino;
- regla;
- datos;
- actor;
- automatización;
- fecha;
- motivo;
- pendientes arrastrados;
- comunicaciones generadas.

## 49.4 Excepciones

El abogado puede:

- omitir requisito con motivo;
- volver a fase;
- suspender;
- activar ruta alternativa;
- crear requisito ad hoc;
- cambiar plantilla mediante migración.

Nunca borrar el historial.

---

# 50. Relación fase–documento–comunicación

Ejemplo:

```text
Expediente entra en “recopilación inicial”
→ se instancian 8 requisitos
→ 5 dependen del cliente
→ se genera solicitud agrupada
→ Resend entrega correo
→ cliente sube 3
→ OCR procesa
→ 2 se aprueban automáticamente
→ 1 requiere revisión
→ recordatorio contiene únicamente 3 pendientes
→ abogado rechaza un archivo
→ se envía correo de corrección
→ cliente reemplaza
→ todos completos
→ readiness de fase pasa
→ abogado confirma
→ expediente entra en preparación
```

Esta secuencia es el núcleo del producto.

---

# 51. Comunicación interna

No todo debe enviarse al cliente.

## Destinatarios internos

- abogado responsable;
- colaborador;
- supervisor;
- administrador operativo;
- seguridad;
- finanzas, si se integra;
- recepción.

## Alertas internas

- cliente no responde;
- rebote;
- plazo;
- documento crítico;
- baja confianza;
- contradicción;
- job fallido;
- acceso anómalo;
- expediente sin actividad;
- sobrecarga;
- sustitución por ausencia.

Las alertas internas deben ser tareas accionables y no una lista infinita.

---

# 52. Calendario y comunicaciones unidos

Un evento confirmado puede generar:

- correo al cliente;
- recordatorio;
- tarea de preparación;
- checklist;
- reserva de tiempo;
- aviso a participantes;
- cambio de fase.

Si cambia:

- cancelar recordatorios anteriores;
- enviar cambio;
- registrar entrega;
- actualizar tareas;
- conservar historial.

La IA puede proponer una fecha extraída. Solo una fecha confirmada debe activar correos externos de alto riesgo.

---

# 53. Firma y confirmación de expedientes

## Objetivo

Preparar un paquete controlado para firma o confirmación.

## Flujo

1. readiness documental;
2. selección de documentos;
3. versiones congeladas;
4. índice;
5. hash;
6. aprobación de abogado;
7. envío al proveedor de firma;
8. seguimiento;
9. recordatorios;
10. recepción de evidencias;
11. almacenamiento;
12. cierre de requisitos;
13. comunicación al cliente.

## Abstracción

Crear `SignatureProvider` para no depender de un proveedor único.

## No usar Resend como firma

Resend notifica y entrega enlaces. La firma debe realizarse mediante un proveedor adecuado o un sistema legalmente validado.

---

# 54. Privacidad de comunicaciones

Los correos deben minimizar datos sensibles.

Preferir:

- “Tiene una solicitud pendiente”;
- enlace seguro;
- autenticación;
- portal.

Evitar en el cuerpo:

- detalles innecesarios del delito;
- documentos completos;
- datos de terceros;
- estrategia;
- información médica;
- credenciales.

Permitir categorías de sensibilidad:

- normal;
- confidencial;
- altamente sensible.

---

# 55. Decisiones que el bufete debe tomar antes de programar

1. Jurisdicción inicial exacta.
2. Tipos de asuntos prioritarios.
3. Papeles procesales.
4. Diez procedimientos iniciales.
5. Requisitos por procedimiento.
6. Qué comunicaciones son automáticas.
7. Qué comunicaciones requieren aprobación.
8. Cadencia de recordatorios.
9. Horarios.
10. Idiomas.
11. Canal de respuesta.
12. Política de correo sensible.
13. Proveedor OCR.
14. Proveedor de firma.
15. Uso de calendario externo.
16. Reglas de retención.
17. Umbrales de IA.
18. Quién aprueba plantillas.
19. Quién supervisa jobs fallidos.
20. Qué métricas definen ahorro real.

Estas decisiones deben registrarse como ADR o documentos de producto.

---

# 56. Equipo necesario para construir el sistema

## Responsable jurídico

- aprueba procedimientos;
- fuentes;
- reglas;
- plantillas;
- riesgos.

## Abogado de operaciones

- traduce práctica real;
- valida UX;
- define excepciones.

## Responsable de producto

- prioriza;
- mide;
- evita construir módulos aislados.

## Ingeniería

- dominio;
- seguridad;
- workers;
- integraciones;
- frontend.

## Responsable de IA/documentos

- OCR;
- schemas;
- evaluación;
- costes;
- calidad.

## Seguridad y privacidad

- accesos;
- proveedores;
- retención;
- incidentes.

Sin propiedad jurídica y de producto, el sistema volverá a fragmentarse.

---

# 57. Piloto recomendado

No comenzar con todos los procedimientos.

## Alcance

- una sede;
- dos o tres abogados;
- un tipo de procedimiento;
- defensa;
- 20–50 expedientes;
- 5–10 tipos documentales;
- comunicaciones documentales;
- calendario;
- OCR;
- Flash;
- revisión humana.

## Objetivos

- 95 % de uploads con estado final visible;
- cero correos duplicados;
- cero recordatorios después de cumplir;
- cero fechas activadas sin confirmación;
- clasificación útil;
- reducción medible de tiempo;
- trazabilidad completa.

## Salida

Solo ampliar cuando:

- la plantilla funciona;
- los abogados la usan;
- los errores están medidos;
- los correos son correctos;
- la cola es estable;
- la IA supera umbral;
- la seguridad se valida.

---

# 58. Pruebas adicionales de comunicaciones

1. Una solicitud genera un único correo.
2. Reejecutar el evento no duplica.
3. Un requisito cumplido cancela recordatorio.
4. Un rebote crea tarea.
5. Un evento fuera de orden no degrada estado.
6. Un webhook duplicado se ignora.
7. Una respuesta se relaciona con el hilo.
8. Un adjunto pasa por seguridad.
9. Un abogado sin acceso no lee el hilo.
10. La plantilla conserva versión.
11. El modelo no inserta variables no permitidas.
12. Una fecha propuesta no genera correo hasta confirmarse.
13. El cierre detiene comunicaciones.
14. El cambio de email invalida automatizaciones pendientes.
15. Un cliente con preferencia restringida no recibe correo indebido.

---

# 59. Pruebas adicionales de IA

1. Documento sin dato devuelve `null`.
2. Toda extracción contiene evidencia.
3. La clasificación guarda confianza.
4. Un JSON inválido se repara o se deriva.
5. No cambia estados directamente.
6. Un documento con instrucciones maliciosas no controla el agente.
7. El RAG no recupera otro expediente.
8. Fuentes no aprobadas no se usan como autoridad.
9. Una norma sustituida no aparece como vigente.
10. Flash escala a Pro cuando la política lo exige.
11. Pro escala a humano si sigue incierto.
12. Se guarda modelo y versión.
13. Se mide coste.
14. Se puede reproducir la evaluación.
15. Una corrección humana alimenta métricas, no reentrenamiento automático.

---

# 60. Nuevos elementos P0 y P1

## P0 adicionales

| ID | Trabajo |
|---|---|
| P0-COM-01 | Crear outbox de comunicaciones. |
| P0-COM-02 | Crear mensajes y entregas. |
| P0-COM-03 | Webhook Resend firmado e idempotente. |
| P0-COM-04 | Manejar rebote, fallo, retraso y supresión. |
| P0-COM-05 | Detener recordatorios cuando se cumple el requisito. |
| P0-COM-06 | Relacionar cada correo con expediente y requisito. |
| P0-COM-07 | Crear plantillas versionadas. |
| P0-COM-08 | Crear niveles de aprobación. |
| P0-AI-01 | Crear router de modelos. |
| P0-AI-02 | Crear schema de salida y evidencia. |
| P0-AI-03 | Implementar OCR real mediante adaptador. |
| P0-AI-04 | Separar Flash, Pro, reglas y revisión. |
| P0-WF-01 | Crear motor de plantillas versionadas. |
| P0-WF-02 | Crear fase, transición y requisitos instanciados. |
| P0-WF-03 | Crear auditoría de transición. |
| P0-WF-04 | Impedir plantillas no aprobadas. |

## P1 adicionales

| ID | Trabajo |
|---|---|
| P1-COM-01 | Portal de cliente documental. |
| P1-COM-02 | Respuestas inbound relacionadas. |
| P1-COM-03 | Editor de reglas de comunicación. |
| P1-WF-01 | Editor visual de procedimientos. |
| P1-WF-02 | Simulador de expediente. |
| P1-KB-01 | Base jurídica versionada. |
| P1-KB-02 | Flujo de revisión y publicación. |
| P1-AI-01 | Panel de evaluaciones y costes. |
| P1-AI-02 | Bandeja de baja confianza. |

---

# 61. Arquitectura final resumida

```text
Admin
  ├─ usuarios, invitaciones, equipos y permisos
  ├─ procedimientos y fases
  ├─ requisitos y tipos documentales
  ├─ comunicaciones y plantillas
  ├─ IA, OCR y evaluaciones
  ├─ conocimiento jurídico
  ├─ salud, jobs y auditoría
  └─ retención e integraciones

SGIE abogado
  ├─ mi jornada
  ├─ expediente
  │   ├─ resumen
  │   ├─ documentos
  │   ├─ tareas y plazos
  │   ├─ comunicaciones
  │   └─ historial
  ├─ revisión documental
  ├─ calendario
  └─ herramientas

Cliente
  ├─ correo transaccional
  ├─ enlace seguro
  ├─ requisitos
  ├─ carga
  ├─ firmas
  ├─ citas
  └─ mensajes

Automatización
  ├─ eventos de dominio
  ├─ outbox
  ├─ jobs
  ├─ OCR
  ├─ DeepSeek V4 Flash
  ├─ DeepSeek V4 Pro
  ├─ reglas deterministas
  ├─ revisión humana
  ├─ Resend
  └─ webhooks
```

---

# 62. Conclusión ampliada

La pieza que faltaba no era simplemente “añadir correos”.

El SGIE debe convertirse en un **motor de trabajo jurídico penal** en el que:

- una plantilla aprobada crea las fases;
- cada fase crea requisitos, tareas, fechas y comunicaciones;
- los documentos del cliente entran por un portal seguro;
- OCR y DeepSeek convierten archivos en datos y evidencias;
- un motor determinista evalúa completitud;
- el abogado revisa excepciones y decisiones;
- Resend mantiene al cliente informado y solicita acciones;
- los webhooks confirman si la comunicación llegó;
- el expediente avanza solo cuando se cumplen condiciones;
- cada actuación queda trazada.

Las fases se obtienen combinando normativa vigente, práctica oficial y metodología real del bufete. La IA no inventa el procedimiento. El bufete lo define, lo aprueba, lo versiona y el sistema lo ejecuta.

Ese es el cambio que puede transformar la intranet de una colección de pantallas en una herramienta jurídica operativa.

---

# 63. Control maestro de progreso — fuente de verdad operativa

Esta sección sustituye cualquier interpretación de los hallazgos históricos como
estado actual. Los apartados 1–62 conservan evidencia y diseño; esta tabla es la
fuente canónica para decidir si un trabajo se repite, se valida o pasa a una fase
posterior.

## 63.1 Leyenda y reglas

- **IMPLEMENTADO**: existe código/migración en el árbol actual; no implica prueba real.
- **VALIDADO**: además existe evidencia de prueba o validación ejecutada identificada abajo.
- **PARCIAL**: existe una parte útil, pero falta al menos un criterio de aceptación.
- **PENDIENTE**: no se ha implementado en la fase indicada.
- **RIESGO**: requiere una decisión, una integración externa o separar cambios no relacionados.

No se debe cambiar un estado a VALIDADO por referencias históricas. Debe añadirse
la evidencia primaria: ruta, migración, test y comando/resultados. La Fase 2 no
puede modificar los invariantes de Fase 1 indicados en `docs/handoffs/fase-1-a-fase-2.md`.

## 63.2 Corte verificado: Fase 1

Evidencia ejecutada el 18-07-2026:

- `npm run lint`: correcto.
- `npx tsc --noEmit`: correcto.
- `npm run test`: 52 archivos, 917 pruebas correctas.
- `npm run build`: correcto; 321 rutas generadas.
- `npx drizzle-kit check`: correcto.
- `git diff --check`: correcto.
- E2E real previo en Neon aislado: invitaciones concurrentes, RBAC/SGIE,
  expediente transaccional, privacidad y concurrencia de calendario, rollback y
  limpieza de fixtures. Procedimiento: `docs/operations/fase-1-staging-validation.md`.

| ID histórico | Estado actual | Fase | Evidencia primaria / criterio restante |
|---|---|---|---|
| P0-01 contrato agenda | VALIDADO | Fase 1 | `agenda-query.ts`, API por rango, prueba `fase1-admin-identidad-calendario.test.ts`. |
| P0-02 propiedad de eventos | VALIDADO | Fase 1 | `propietario_id`, backfill 0032 y E2E de privacidad. |
| P0-03 scope agenda | VALIDADO | Fase 1 | `accessService.assertCaseAccess` en GET/POST/PATCH. |
| P0-04 `activoSgie` | VALIDADO | Fase 1 | `assertSgieAccess`; E2E de revocación inmediata. |
| P0-05/P0-06 alta e invitación | VALIDADO | Fase 1 | `lib/invitations.ts`, 0032 y E2E de consumo concurrente. |
| P0-07 responsable arbitrario | VALIDADO | Fase 1 | `expedientes-db.ts` y pruebas de autorización de asignación. |
| P0-08 transacción expediente | VALIDADO | Fase 1 | `crearExpediente` transaccional y rollback E2E. |
| P0-12 errores tipados | VALIDADO | Fase 1 | `lib/http-errors.ts`, `authFailureResponse` y pruebas. |
| P0-15 correlation IDs | IMPLEMENTADO | Fase 1 | Proxy y respuestas tipadas los emiten; falta una prueba de contrato dedicada si se quiere elevar la evidencia. |
| P1-01 retirada CMS Admin | VALIDADO | Fase 1 | Rutas CMS retiradas; fuentes públicas conservadas; build correcto. |
| P1-03 fuente de usuarios | IMPLEMENTADO | Fase 1 | Admin usa invitaciones y `listarUsuariosGestion`; mantener revisión de rutas legacy en cada fase. |
| P1-09 calendario completo | PARCIAL | Fase 1 → Fase 3 | Rango, propiedad, privacidad, zona y versión validados; faltan membresía de equipo real, DELETE explícito y cobertura E2E de día completo/equipo. |

## 63.3 Backlog pendiente por fase

> **Actualización 19-07-2026:** los items P0 de Fase 2, los P1 de Fase 3 y los
> P2-01…06 de Fase 4A **ya están IMPLEMENTADOS/VALIDADOS**. La tabla siguiente
> conserva el criterio histórico de cierre; el estado real actual está en
> §63.7 (Fase 2), §63.8 (Fase 3), §63.9 (Fase 4A) y §63.10 (consolidado).

| ID | Estado (19-07-2026) | Fase prevista | Criterio mínimo de cierre |
|---|---|---|---|
| P0-09 cola durable | ✅ VALIDADO (§63.7) | Fase 2 | Claim atómico, intentos, backoff, lock, DLQ e idempotencia verificable. |
| P0-10 outbox documental | ✅ VALIDADO (§63.7) | Fase 2 | Evento durable creado con la operación; dispatcher reintentable. |
| P0-11 cron/worker | ✅ VALIDADO (§63.7) | Fase 2 | Scheduler/worker versionado, autenticado y observable. |
| P0-13 OCR real | ⚠️ IMPLEMENTADO (§63.7) | Fase 2 | Adaptador real, estados, confianza y pruebas controladas. Pendiente: rendimiento PDFs grandes. |
| P0-14 flujo documental E2E | ✅ VALIDADO (§63.7) | Fase 2 | Upload → trabajo durable → procesamiento → revisión, sin mocks de persistencia. |
| P0-COM-01…08 | ✅ VALIDADO (§63.7) | Fase 2 | Outbox, entrega, webhook seguro, preferencias y aprobaciones. |
| P0-AI-01…04 | ✅ VALIDADO (§63.7) | Fase 2 | Router, schema/evidencia, OCR y separación de modelos/reglas/revisión. |
| P0-WF-01…04 | ✅ VALIDADO (§63.7) | Fase 2 | Plantillas aprobadas/versionadas, fases, transición y auditoría. |
| P1-02, P1-04…10 | ✅ VALIDADO (§63.8) | Fase 3 | UX operativa y consolidación posterior a la durabilidad de Fase 2. |
| P2-01…06 automatización doc | ✅ CERTIFICADA (§63.9) | Fase 4A | Clasificación, vinculación, extracción, contradicciones, resumen, next-action. Orchestrator + E2E real revalidado 20-07 (19/19 DeepSeek); bugs 5-8 cerrados; ADR-010/011/012; tests P2-05/P2-06 ampliados (16→41) y feature-flags (16→24). |
| P2-07 aprobación en bloque | PENDIENTE | Fase 4B | Selección, preview, validación individual, idempotencia, undo seguro. |
| P2-08 paquete firma | PENDIENTE | Fase 4B | Snapshot congelado, hash, manifiesto, orden, firmantes validados. |
| P2-09 firma electrónica | PENDIENTE | Fase 4B | Adaptador desacoplado (SignatureProvider), sandbox o proveedor real. |
| P2-10 calendario externo | PENDIENTE | Fase 4B | ICS baseline, Google/Microsoft OAuth opcional, sync idempotente. |
| Retrieval FTS/pg_trgm + copiloto | PENDIENTE | Fase 4B | Sin embeddings; PostgreSQL FTS + pg_trgm + tool calling con allowlist. |
| Base conocimiento jurídica | PENDIENTE | Fase 4B | Fuentes versionadas, aprobadas, vigencia, índice textual. |
| P3 predicción / balance / brief | PENDIENTE | Fase 5 | No iniciar antes de cerrar Fase 4 completa. |

## 63.4 Invariantes de continuidad

1. No hay registro público; toda alta es por invitación con token hash.
2. Cuenta activa, suspensión, token de sesión y acceso SGIE son estados separados.
3. La autorización y el scope de expediente se resuelven en servidor.
4. La creación de expediente y los futuros eventos de outbox deben ser atómicos.
5. Calendario privado por defecto; mutaciones con control optimista y 409 ante conflicto.
6. La web pública no se convierte en dependencia del Admin operativo.
7. No persistir credenciales, URLs de staging, tokens ni fixtures E2E.

## 63.5 Riesgos de control antes de Fase 2

> **Actualización 19-07-2026:** los dos primeros riesgos están RESUELTOS.
> Resend validado con destinatario técnico real en E2E Fase 3 (commit
> `8c931af`, message ID persistido). El árbol de trabajo está limpio y los
> borrados de documentación/SEO se confirmaron en Fase 1. El riesgo de
> snapshots Drizzle sigue vigente.

- Los snapshots Drizzle 0024–0033 no existen; no ejecutar `drizzle-kit generate`
  para reconstruirlos automáticamente. Usar `drizzle-kit check` y planificar una
  baseline separada. **Sigue vigente.** Las migraciones 0038–0043 de Fase 4A
  usan una tabla propia (`sgie_schema_migrations`) con hash SHA-256 para no
  depender del journal Drizzle.
- ~~Resend no se ha validado con destinatario técnico seguro.~~ **RESUELTO:**
  validado en E2E Fase 3 paso 11b (`CONTACT_NOTIFICATION_EMAIL`/`CONTACT_TO`,
  message ID persistido, webhook Svix Ed25519).
- ~~El árbol de trabajo contiene borrados amplios de documentación/SEO ajenos
  al núcleo de Fase 1.~~ **RESUELTO:** confirmados y commiteados en Fase 1.

## 63.6 Handoff de arranque para Fase 2

Antes de implementar, el siguiente agente debe leer, en este orden:

1. Esta sección 63.
2. `docs/handoffs/fase-1-a-fase-2.md`.
3. `docs/architecture/fase-1-nucleo-admin-identidad-calendario.md`.
4. `docs/operations/fase-1-staging-validation.md`.
5. Los módulos de jobs, documentos, OCR y cron citados en P0-09…P0-14.

El primer objetivo de Fase 2 es el núcleo durable de procedimientos, requisitos
documentales, outbox y jobs. No rediseñar la web pública ni duplicar identidad,
RBAC, scope de expediente o calendario ya existentes.

Referencias: [checklist maestro](../../../../roadmaps/active/sgie-implementation-checklist.md),
[contexto de chat](../../../../handoffs/SGIE_NEW_CHAT_CONTEXT.md),
[handoff Fase 1→2](../../../../handoffs/fase-1-a-fase-2.md),
[arquitectura Fase 1](../../../../architecture/fase-1-nucleo-admin-identidad-calendario.md),
[validación staging](../../../../operations/fase-1-staging-validation.md) y
[manifiesto de borrados](../../../../handoffs/fase-1-deletion-manifest.md).

## 63.7 Corte verificado: Fase 2 — Núcleo durable

Evidencia ejecutada (commit `be926a5`, 18-07-2026; migraciones 0034–0036):

- Workflow engine versionado: `procedimiento_versiones`, `procedimiento_fases`,
  `procedimiento_transiciones` con actores permitidos. `instanciarWorkflow()`,
  `transitarFase()`, `obtenerFaseActual()`.
- Cola durable `jobs_sgie`: `FOR UPDATE SKIP LOCKED`, backoff exponencial
  `2^n × 60s` + jitter 30% (máx 24h), `dead_letter_jobs` tras 3 intentos,
  `job_attempts`, `recuperarLocksAbandonados()`.
- Transactional outbox `outbox_events`: 9 eventos canónicos insertados en la
  misma transacción; `despacharEventos()` con SKIP LOCKED.
- Carga documental atómica: `upload-atomico.ts` con reserva UPDATE…RETURNING,
  `enlaces_magicos.token_hash` SHA-256, `documentos_expediente` con dedup.
- Worker/cron autenticado: `app/api/cron/sgie/procesar/route.ts` con
  `CRON_SECRET`.
- OCR: interfaz `OcrProvider` + Tesseract.js (`ADR-005`); stub nunca inventa.
- IA router 4 estrategias (`ADR-006`): deterministic → heuristic → DeepSeek →
  humano, revisión humana obligatoria para legales.
- Comunicaciones: `comunicaciones_outbox` + webhook Resend (`ADR-008`).
- Observabilidad: `ai_task_routing`, `extracciones_ia`, `ocr_resultados`.

| ID histórico | Estado actual | Fase | Evidencia primaria |
|---|---|---|---|
| P0-09 cola durable | VALIDADO | Fase 2 | `lib/sgie/jobs-db.ts` (SKIP LOCKED, backoff, DLQ, recuperación locks). E2E Fase 2 paso 8b. |
| P0-10 outbox documental | VALIDADO | Fase 2 | `lib/sgie/outbox.ts`, `registrarDocumentoAtomico`. E2E paso 3. |
| P0-11 cron/worker | VALIDADO | Fase 2 | `app/api/cron/sgie/procesar/route.ts` + `CRON_SECRET`. Contract test en E2E Fase 3 paso 12b. |
| P0-13 OCR real | IMPLEMENTADO | Fase 2 | `lib/sgie/ocr/tesseract.ts`. Pendiente: validación rendimiento PDFs multi-página. |
| P0-14 flujo documental E2E | VALIDADO | Fase 2 | `scripts/e2e/fase2-e2e.mjs` (9/9 pasos en Neon aislada, commit `8c931af`). |
| P0-COM-01…08 | VALIDADO | Fase 2 | `comunicaciones_outbox`, `correos_enviados`, `webhook_receipts`, `lib/webhook-verify.ts` (Svix). E2E Fase 3 paso 11b (envío real Resend). |
| P0-AI-01…04 | VALIDADO | Fase 2 | `lib/sgie/ia-router.ts`, `lib/sgie/ia-documental.ts`, schemas Zod, separación reglas/IA/revisión. DeepSeek validado en E2E Fase 3 paso 10b. |
| P0-WF-01…04 | VALIDADO | Fase 2 | `lib/sgie/workflow.ts`, plantillas versionadas, fases, transiciones con actor. |
| P0-16 subida atómica | VALIDADO | Fase 2 | `upload-atomico.ts`. E2E Fase 2 paso 4. |
| P0-17 carrera usos enlace | VALIDADO | Fase 2 | Reserva UPDATE…WHERE usos_actuales<usos_maximos RETURNING. E2E Fase 3 bloque concurrencia. |
| P0-18 carrera duplicados | VALIDADO | Fase 2 | `existeHashEnExpediente` + dedup concurrente en E2E Fase 3. |

## 63.8 Corte verificado: Fase 3 — Experiencia operativa y portal

Evidencia ejecutada (commits `69fb621`/`d0e717c` implementación; `8c931af`
validación E2E real, 18-07-2026; migración 0037):

- Mi Jornada con 4 colas accionables (`lib/sgie/work-queue-service.ts`).
- Workspace de expediente con pestañas; bandeja revisión documental.
- Dashboard Admin con 5 grupos de métricas (`admin-operations-service.ts`).
- Calendario: equipo, día completo, DELETE lógico, 409 conflicto optimista
  (versionado). **Cierra P1-09** que quedó PARCIAL en Fase 1.
- Portal del cliente por enlace mágico (`ADR-007`); `portal_sessions` (0037).
- Inbound email con webhook Resend (`ADR-008`); `inbound_messages`.
- Reglas de comunicación versionadas; simulador dry-run.
- Alertas y SLA deterministas (`ADR-009`); `alertas_sla`, `alertas`.
- Resumen IA con caché por hash de entrada (`resumenes_ia_expediente`).

**Validación real** (commit `8c931af`, rama Neon aislada
`fase3-e2e-validation-20260718`, endpoint `ep-fancy-field-ap04213c`):

- E2E Fase 2: 9/9 pasos, código 0.
- E2E Fase 3: **70/70 assertions**, código 0, ~15s.
- DeepSeek real: latencia ~450ms, modelo `deepseek-v4-flash`, schema JSON.
- Resend real: message ID persistido en `correos_enviados`, webhook Svix.
- CRON_SECRET efímero con contract test 200/401.
- Limpieza: 42 filas, 0 restantes.

| ID histórico | Estado actual | Fase | Evidencia primaria |
|---|---|---|---|
| P1-09 calendario completo | VALIDADO | Fase 3 | Eventos equipo/día-completo, 409 por versión, cancelación. E2E Fase 3 paso 11. |
| P1-02…10 (UX operativa) | VALIDADO | Fase 3 | Mi Jornada, workspace, dashboard, bandeja revisión, reglas comunicación. 9 servicios Phase 3. |
| Portal cliente | VALIDADO | Fase 3 | `client-portal-service.ts`, `portal_sessions`. E2E paso 4 (token válido/expirado/revocado/agotado/acceso cruzado). |
| Inbound email | VALIDADO | Fase 3 | `inbound-service.ts`, webhook verify Svix. |

**Corrección de deuda heredada** (commit `e3f99d6`, 19-07-2026):
`lib/sgie/inbound-service.verificarWebhookResend` usaba HMAC-SHA256
(algoritmo incorrecto: Resend usa Svix Ed25519) y devolvía `true` sin secreto
(bypass). Corregido: delega en `verifyResendWebhook` (Svix correcto),
fail-closed, unifica `RESEND_WEBHOOK_SECRET` (canónica) con alias
`RESEND_SIGNING_SECRET`. 22/22 tests actualizados.

## 63.9 Corte verificado: Fase 4A — Automatización documental core

Evidencia ejecutada (commits `7de4fd1` implementación + `6f79b86` hardening y
validación, 19-07-2026; migraciones 0038–0043):

**Feature flags y kill switches** (`lib/sgie/feature-flags.ts`):
deny-by-default, precedencia (procedimiento>expediente>usuario>equipo>org>
global), scope inferior solo RESTRINGE, kill switch con prioridad absoluta,
cache TTL 5s, auditoría en `feature_flag_history`. 10 flags canónicas.
15 tests.

**Servicios P2-01 a P2-06** (cada uno con feature flag + idempotencia):

| Servicio | Estado | Tests | Evidencia |
|---|---|---|---|
| P2-01 Clasificación | VALIDADO | 11 | `clasificacion-documental.ts`: heurística→DeepSeek, tipos críticos nunca auto-aprobados, prompt injection como dato. UNIQUE por (doc, pipeline). |
| P2-02 Auto-vinculación | IMPLEMENTADO | 5 | `auto-vinculacion.ts`: candidato único + confianza≥75 + sin bloqueantes; conflictos a revisión; reversible. UNIQUE vigente (0042). |
| P2-03 Extracción estructurada | IMPLEMENTADO | 7 | `extraccion-estructurada.ts`: regex determinista (identidad/RTN/fecha HN)→DeepSeek, schemas versionados. UNIQUE por (doc, pipeline). |
| P2-04 Contradicciones | IMPLEMENTADO | 4 | `motor-contradicciones.ts`: determinista (campos sensibles=>crítica bloqueante), duplicidad hash. UNIQUE (0042). Capa IA pendiente Fase 4B. |
| P2-05 Resumen incremental | IMPLEMENTADO | 1 (mínimo) | `resumen-incremental.ts`: hash fuentes + watermark, cache hit, abstención, transacción atómica invalidar+insert. UNIQUE parcial vigente (0043). |
| P2-06 NextAction | IMPLEMENTADO | 1 (mínimo) | `next-action.ts`: determinista (bloqueantes>requisitos>alertas>DLQ). DLQ filtrado por expediente (bug corregido). Fuentes 5-8 pendientes. |

**DocumentAutomationOrchestrator** (`lib/sgie/document-automation-orchestrator.ts`):
encadena P2-01→P2-06 con autorización `canAccessCase`, correlationId,
`ai_pipeline_runs` por etapa, kill switch, resiliente (fallo no aborta),
sin llamadas externas en transacciones. 7 tests.

**Migraciones 0038–0043** (idempotentes, hash SHA-256 registrado en
`sgie_schema_migrations`, aplicadas a Neon aislada):

| # | Contenido |
|---|---|
| 0038 | registro migraciones SGIE (tabla propia). |
| 0039 | `feature_flags` + `feature_flag_history`. |
| 0040 | `document_classifications`, `document_links`, `extraction_schema_versions`, `document_extractions`, `document_contradictions`. |
| 0041 | `case_summary_checkpoints`, `case_summary_history`, `case_next_actions`, `ai_pipeline_runs`. |
| 0042 | UNIQUEs (idempotencia) + seed 7 schemas canónicos (identidad, rtn, resolución_judicial, escrito_juridico, poder, comprobante, otro). |
| 0043 | `case_summary_checkpoints` UNIQUE absoluto → parcial (solo vigentes). |

**Validación real** (commit `6f79b86`):

- E2E Fase 4A: **19/19 assertions** con DeepSeek real
  (`RUN_DEEPSEEK_E2E=true`). DeepSeek: `deepseek-v4-flash`, 792ms,
  clasificó identidad hondureña sintética con confianza 95.
- Regresión: Fase 2 (9/9) + Fase 3 (70/70) verdes.
- Suite local: lint 0, tsc 0, **1015/1015 tests**, build OK, drizzle OK.
- Limpieza: 18 filas, 0 restantes.

**Deuda Fase 4A resuelta** (cierre de bugs 5-8, commit de cierre `fix(sgie): close phase 4a automation core`):

- ~~Bug 5 (fuentes P2-06)~~: **RESUELTO.** Añadidos plazos próximos (≤3d prioridad 2, ≤7d prioridad 3), comunicaciones fallidas (prioridad 3), readiness bloqueado (prioridad 2) y **fuente firma pendiente** (`det.firma_pendiente`, prioridad 2) que detecta `eventos_agenda` tipo `firma` en estado `propuesta`/`confirmada` no cubiertos por la ventana de plazos, sin duplicar acción cuando la cubre `det.plazo_3dias`/`det.plazo_7dias`. Validado con 2 tests nuevos (firma fuera de ventana y no-duplicación).
- ~~Bug 6 (race `setFlag`)~~: **RESUELTO.** UPSERT atómico con `SELECT FOR UPDATE` + `ON CONFLICT DO NOTHING` en transacción.
- ~~Bug 7 (`activateKillSwitch` sin autorización)~~: **RESUELTO.** `assertKillSwitchAuthorization` valida `settings.manage` vía `assertCapability`. Deny-by-default.
- ~~Bug 8 (`fetchApplicable` rendimiento)~~: **RESUELTO.** WHERE por scope aplicable en la query SQL (no carga todas las filas).
- ~~Tests P2-05/P2-06 mínimos~~: **RESUELTO.** 16 tests nuevos (7 P2-05 cache/hash/invalidación/abstención/fallo IA; 9 P2-06 fuentes nuevas/jerarquía/abstención).
- ~~ADR-010/011/012 y docs~~: **RESUELTOS.** Creados ADR-010, ADR-011, ADR-012, architecture Fase 4A, ops Fase 4A. Actualizados checklist, CHANGELOG, SGIE_NEW_CHAT_CONTEXT.

## 63.10 Estado consolidado por fase (20-07-2026, certificación)

| Fase | Estado | Commits clave | E2E | Tests |
|---|---|---|---|---|
| Fase 1 — Núcleo admin/identidad/calendario | VALIDADO | `c74840d` | E2E Fase 1 (Neon) | 917 (en su corte) |
| Fase 2 — Núcleo durable | VALIDADO | `be926a5` | E2E Fase 2: 9/9 (revalidado 20-07) | 963 (en su corte) |
| Fase 3 — Experiencia operativa + portal | VALIDADO | `69fb621`, `8c931af` | E2E Fase 3: 70/70, DeepSeek+Resend reales (revalidado 20-07) | 963 |
| Fase 4A — Automatización documental core | **CERTIFICADA** | `7de4fd1`, `6f79b86`, `39f86b7` | E2E Fase 4A: **19/19 DeepSeek real** (revalidado 20-07 sobre rama Neon aislada) | 1065 (suite serial) |
| Fase 4B — Firma, calendario ext, retrieval, copiloto, UI | PENDIENTE | — | — | — |
| Fase 5 — Predicción, balance carga, brief diario | PENDIENTE | — | — | — |

**Fase 4A: CERTIFICADA al 100%.** Sobre el HEAD `39f86b7` se ejecutaron los tres E2E reales contra una rama Neon aislada efímera (`fase4a-cert-validation-20260720`, eliminada tras la certificación, cero residuos): Fase 4A 19/19 con DeepSeek `deepseek-v4-flash` (tipo identidad, confianza 95), Fase 2 9/9, Fase 3 70/70 (DeepSeek 527ms + Resend real con message ID persistido). Suite serial 1065/1065, lint/tsc/build/drizzle-kit check limpios, web pública intacta. El único elemento NO VALIDADO era el test `fase3-experiencia-operativa.test.ts > WorkQueueService > returns array sorted by priority` bajo paralelización (pasa 22/22 aislado y en serial); **corregido en Fase 4B-1** (causa raíz: timeout por `await import` en timer; fix: `beforeAll` precarga módulos). Suite paralela ahora estable 3×.

## 63.11 Corte verificado: Fase 4B-1 — P2-07 Aprobación documental en bloque

**Fecha:** 2026-07-20. HEAD: `feat(sgie): add safe bulk document approval`.

**Implementado:**
- Migración 0044 (`documentos_expediente.version`, `document_bulk_approvals`, `document_bulk_approval_items`, enum `documento_bulk_approved`/`documento_bulk_reverted`, seed flag). Idempotente, hash `ffadd62b8767`.
- Feature flag `sgie.documents.bulk_approve` (11ª flag canónica, deny-by-default).
- Servicio `bulk-approval-service` (preview, confirm, status, undo) con control optimista por `version`, idempotencia por `(expediente, idempotencyKey)`, resultado parcial, reversión segura (ventana 72h), cascadas readiness/resumen/next-action, auditoría + outbox.
- API preview/confirm/status/revert (Zod+CSRF+rate-limit).
- UI en bandeja de revisión (selección múltiple + modal).
- ADR-013, arquitectura, ops, handoff.

**Validación:**
- Tests: servicio 31/31, API 10/10, UI 7/7.
- E2E Neon aislado efímero `fase4b1-cert-validation-20260720`: 16/16 assertions, rama eliminada, cero residuos.
- Suite completa: 1113/1113 (3× paralela estables).
- lint 0, tsc 0, build OK, drizzle-kit check OK, web pública intacta.

**No validado:** P2-08/09/10, retrieval, copiloto (no iniciados).

---

# 64. Registro verificable de hallazgos P0-01 a P0-20

Los bloques siguientes actualizan el diagnóstico histórico con el estado del
árbol actual. Los identificadores se conservan para trazabilidad; no se elimina
la evidencia original de los apartados 5 y 21.

### P0-01 — contrato de agenda

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: rango visible, máximo 100 y paginación.
- Archivos: `lib/sgie/agenda-query.ts`, `app/api/sgie/agenda/route.ts`.
- Migraciones: 0032.
- Tests: `tests/fase1-admin-identidad-calendario.test.ts`.
- Validación real: E2E Neon de calendario.
- Trabajo restante: ninguno para el contrato base.

### P0-02 — propiedad de eventos

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: propietario, creador, visibilidad y backfill.
- Archivos: `lib/schema.ts`, rutas de agenda.
- Migraciones: 0032.
- Tests: Fase 1 y E2E de privacidad.
- Validación real: evento personal visible solo para su propietario.
- Trabajo restante: equipo con membresía explícita en Fase 4.

### P0-03 — scope de agenda

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: `accessService.assertCaseAccess` en GET, POST y PATCH.
- Archivos: `lib/access-service.ts`, rutas de agenda.
- Migraciones: 0032.
- Tests: E2E de acceso de expediente y privacidad.
- Validación real: ejecutada en Neon aislado.
- Trabajo restante: ninguno para el scope actual.

### P0-04 — activación SGIE

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: `assertSgieAccess` consulta cuenta, suspensión y perfil SGIE.
- Archivos: `lib/access-service.ts`, `lib/auth.ts`, `proxy.ts`.
- Migraciones: 0032.
- Tests: E2E de revocación inmediata.
- Validación real: ejecutada en Neon aislado.
- Trabajo restante: ninguno.

### P0-05 — sincronización de alta

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: aceptación transaccional crea/reactiva cuenta, rol, SGIE y equipo.
- Archivos: `lib/invitations.ts`, rutas de invitaciones.
- Migraciones: 0032.
- Tests: concurrencia de aceptación.
- Validación real: 1 éxito y 7 conflictos en Neon.
- Trabajo restante: política obligatoria de 2FA, si el bufete la decide.

### P0-06 — invitaciones sin contraseña administrativa

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: token aleatorio, SHA-256, expiración y uso único.
- Archivos: `lib/invitations.ts`, `app/api/auth/invitaciones/[token]/route.ts`.
- Migraciones: 0032.
- Tests: unitarios y E2E concurrente.
- Validación real: Neon aislado; Resend sin proveedor.
- Trabajo restante: envío real a destinatario técnico seguro.

### P0-07 — política de correo

- Estado: [/] IMPLEMENTADO PARCIALMENTE.
- Fase: 1 → decisión de producto posterior.
- Evidencias: invitación controla el alta; persiste política de dominio en auth.
- Archivos: `lib/auth.ts`, `lib/invitations.ts`.
- Migraciones: 0032.
- Tests: cobertura de alta por invitación.
- Validación real: no se validó política de dominios externos.
- Trabajo restante: decisión jurídica/organizativa de dominios y excepciones.

### P0-08 — RBAC único

- Estado: [/] IMPLEMENTADO PARCIALMENTE.
- Fase: 1.
- Evidencias: capacidades persistidas y overrides; compatibilidad temporal con `usuarios.rol`.
- Archivos: `lib/access-service.ts`, `lib/schema.ts`.
- Migraciones: 0032.
- Tests: E2E RBAC inmediato.
- Validación real: Neon aislado.
- Trabajo restante: retirar la compatibilidad de rol legado en una migración separada.

### P0-09 — responsable de expediente

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: capacidad `cases.assign` y validación del responsable en servidor.
- Archivos: `lib/sgie/expedientes-db.ts`, ruta de expedientes.
- Migraciones: 0032.
- Tests: autorización y E2E.
- Validación real: expediente creado en Neon aislado.
- Trabajo restante: ninguno para la regla actual.

### P0-10 — transacción de expediente

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: una transacción para expediente, asignación, checklist, historial y auditoría.
- Archivos: `lib/db.ts`, `lib/sgie/expedientes-db.ts`.
- Migraciones: no aplica.
- Tests: rollback inducido y E2E.
- Validación real: cero artefactos persistentes tras fallo inducido.
- Trabajo restante: integrar outbox en Fase 2.

### P0-11 a P0-18 — durabilidad documental, por hallazgo

| Hallazgo | Estado | Fase | Evidencia actual | Validación y trabajo restante |
|---|---|---|---|---|
| P0-11 cola sin intentos/retry | [ ] PENDIENTE | 2 | `lib/sgie/jobs-db.ts` no satisface claim/retry durable. | Implementar intentos, backoff, lock y DLQ; E2E real. |
| P0-12 cola con fallo silencioso | [ ] PENDIENTE | 2 | No hay observabilidad/contrato de error durable completo. | Correlation, estados y alerta operativa; E2E real. |
| P0-13 idempotencia diaria | [ ] PENDIENTE | 2 | La regla actual no distingue retry manual seguro. | Diseño de clave/idempotencia y pruebas de reintento. |
| P0-14 cron versionado | [ ] PENDIENTE | 2 | No hay scheduler/worker versionado y autenticado. | Añadir configuración, autorización y observabilidad. |
| P0-15 OCR real | [ ] PENDIENTE | 2 | `lib/sgie/ocr/provider.ts` sigue siendo stub. | Adaptador real, confianza, estados y prueba controlada. |
| P0-16 subida atómica | [ ] PENDIENTE | 2 | Upload, objeto y trabajo no forman una operación durable única. | Outbox/compensación y E2E de extremo a extremo. |
| P0-17 carrera de enlace | [ ] PENDIENTE | 2 | Uso máximo del enlace no tiene claim atómico verificable. | Restricción/claim transaccional y concurrencia real. |
| P0-18 carrera de duplicados | [ ] PENDIENTE | 2 | No existe restricción deduplicadora comprobada. | Índice/clave y test concurrente. |

Migraciones de este bloque: pendientes de diseñar en Fase 2. Pruebas actuales:
no hay E2E durable de flujo documental completo. Validación real: no realizada.

### P0-19 — errores internos

- Estado: [x] COMPLETADO Y VALIDADO.
- Fase: 1.
- Evidencias: errores HTTP tipados y respuesta 500 con correlation ID.
- Archivos: `lib/http-errors.ts`, `lib/auth.ts`, `proxy.ts`.
- Migraciones: no aplica.
- Tests: suite de auth y Fase 1.
- Validación real: build y pruebas correctas.
- Trabajo restante: prueba de contrato adicional opcional por endpoint.

### P0-20 — contratos reales

- Estado: [/] IMPLEMENTADO PARCIALMENTE.
- Fase: 1 → Fase 2.
- Evidencias: E2E real de identidad, RBAC, expediente y calendario.
- Archivos: `scripts/e2e/fase1-integration.ts`, guardas Neon.
- Migraciones: 0032 y 0033 verificadas en staging.
- Tests: 917 pruebas unitarias y E2E Fase 1.
- Validación real: Neon aislado.
- Trabajo restante: E2E documental durable y comunicaciones de Fase 2/3.

## 64.1 Matriz de backlog posterior a Fase 1

Esta matriz no declara cierre por informes anteriores: distingue evidencia de
código/prueba de trabajo aún no validado en un flujo real.

| Grupo | Estado actual | Fase | Criterio de cierre |
|---|---|---|---|
| P1-01 | [x] COMPLETADO Y VALIDADO | 1 | CMS/Admin retirado sin eliminar lectores públicos; build correcto. |
| P1-02 | [ ] PENDIENTE | 3 | Dashboard operativo y métricas de trabajo SGIE. |
| P1-03 | [~] IMPLEMENTADO, PENDIENTE DE VALIDACIÓN REAL | 1 | Consolidar navegación y retirar toda ruta legacy de usuarios. |
| P1-04 | [ ] PENDIENTE | 3 | Bandeja única de acciones. |
| P1-05 | [ ] PENDIENTE | 3 | Migrar o retirar el concepto legacy de casos. |
| P1-06 | [ ] PENDIENTE | 3 | Estado y trazabilidad de operaciones de abogado. |
| P1-07 | [ ] PENDIENTE | 3 | Alertas y SLA operativos. |
| P1-08 | [ ] PENDIENTE | 3 | Indicadores y observabilidad de trabajo. |
| P1-09 | [/] IMPLEMENTADO PARCIALMENTE | 1 → 3 | Completar equipo, DELETE y E2E de día completo. |
| P1-10 | [ ] PENDIENTE | 3 | Consolidación de navegación y experiencia SGIE. |
| P2-01…P2-10 | [ ] PENDIENTE | 4 | No iniciar antes del núcleo durable de Fase 2 y UX de Fase 3. |
| P3-01…P3-08 | [ ] PENDIENTE | 5 | Optimización posterior, no sustituye controles P0/P1. |
| P0-COM-01…P0-COM-08 | [ ] PENDIENTE | 2 | Outbox, entrega, webhooks seguros, preferencias y aprobación. |
| P0-AI-01…P0-AI-04 | [ ] PENDIENTE | 2 | OCR/IA trazable, evidencia, reglas y revisión humana. |
| P0-WF-01…P0-WF-04 | [ ] PENDIENTE | 2 | Procedimientos, requisitos, transiciones y auditoría. |
| P1-COM-01…P1-COM-03 | [ ] PENDIENTE | 3 | UX y operación de comunicaciones. |
| P1-AI-01…P1-AI-02 | [ ] PENDIENTE | 3 | Supervisión humana y experiencia de revisión. |
| P1-WF-01…P1-WF-02 | [ ] PENDIENTE | 3 | UX de plantillas y operación. |
| P1-KB-01…P1-KB-02 | [ ] PENDIENTE | 3 | Base de conocimiento con fuente, versionado y permisos. |

El checklist maestro contiene el desglose operativo y los criterios de prueba:
`docs/roadmaps/active/sgie-implementation-checklist.md`.

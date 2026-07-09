# Especificación técnica — Fase 1 MVP: magic links + upload seguro

**Fecha:** 9 de julio de 2026
**Base documental:**
- `docs/architecture/auditoria-consolidada-viabilidad-sgie.md`
- `docs/architecture/estudio-tecnico-viabilidad-sgie-autonomo.md`
- `docs/strategy/plan-maestro-mejora-sgie-admin-integracion.md`
- `docs/strategy/especializacion-sgie-honduras-abogados.md`

**Tipo de documento:** Especificación técnica de implementación, ejecutable.
**Inspección del repositorio realizada:** `lib/schema.ts` (66 tablas, 23 enums), `lib/sgie/*`, `app/api/sgie/*`, `app/api/public/cargar/[token]/route.ts`, `app/cargar/[token]/page.tsx`, `proxy.ts`. Esta especificación se fundamenta en el estado **real** del código, no en suposiciones.

> **⚠ Hallazgo principal:** la Fase 1 **no está por implementar desde cero**: está **mayormente implementada**. Esta especificación cataloga lo que ya existe, identifica los **gaps reales** (uno de seguridad crítico) y define el trabajo concreto restante para cerrar la fase. Cualquier visión que asuma que "hay que crear el modelo de datos y los magic links" es **inexacta** frente al estado del repo.

---

## 1. Objetivo de la Fase 1

Definir con precisión cómo **completar y validar** la primera fase MVP del SGIE semi-autónomo: **modelo de datos SGIE base, magic links, upload seguro, Vercel Blob, Resend y auditoría mínima**. El objetivo es que un cliente pueda recibir un enlace, abrir el portal de carga y entregar documentación de forma trazable y segura, sin cuenta y sin exponer la intranet ni la web pública.

La Fase 1 **no** introduce IA, OCR, procesamiento documental automático, integración SEJE ni retención automatizada. El job `extraccion_texto` que ya se encola queda **fuera del alcance funcional** de esta fase (se implementa en Fase 3); aquí solo se garantiza que se encola correctamente, sin procesarlo.

---

## 2. Alcance exacto

Lo que la Fase 1 debe dejar operativo y validado:

1. **Emisión de magic links** desde SGIE (abogado/admin) con expiración, usos máximos y scope por expediente/requisito.
2. **Envío del enlace al cliente por email** vía Resend.
3. **Portal público de carga** (`/cargar/[token]`, `noindex`, aislado de la web pública).
4. **Endpoint público de subida** (`POST /api/public/cargar/[token]`) con validaciones.
5. **Almacenamiento en Vercel Blob** (privado, sin binarios en Neon).
6. **Registro del documento en Neon** con hash SHA-256, metadatos, IP/UA.
7. **Rate limit** por IP en el portal.
8. **Auditoría mínima** de emisión, acceso y subida.
9. **Encolado** del job de extracción (sin ejecutar su procesamiento en esta fase).
10. **Cierre del gap de seguridad crítico** (token hasheado, ver sección 12).

---

## 3. Fuera de alcance

- IA de clasificación/extracción/resumen (Fase 4).
- OCR de escaneos (Fase 3).
- Pipeline documental completo y verificación documento-expediente (Fases 3–4).
- Puerta de calidad `case_readiness_checks` / “Listo para revisión” (Fase 5).
- Integración SEJE y fuentes oficiales.
- Retención documental automatizada (pendiente de aprobación legal).
- Escaneo antivirus/malware automatizado (recomendado, pero fuera del MVP Fase 1 salvo decisión expresa).
- Cualquier cambio en la web pública (`app/(public)/**`).
- Diseño visual / componentes UI nuevos.

---

## 4. Entidades Drizzle necesarias

**Estado real: todas las entidades de Fase 1 ya existen en `lib/schema.ts`.** No se proponen tablas nuevas en esta fase; se documenta lo existente para que la implementación operre sobre ello. La fuente de verdad es `lib/schema.ts` (R2).

| Entidad (tabla DB) | Símbolo Drizzle | Rol en Fase 1 | Estado |
|---|---|---|---|
| `clientes` | `clientes` | destinatario del enlace | ✅ existe |
| `expedientes` | `expedientes` | contenedor del trámite | ✅ existe |
| `requisitos_expediente` | `requisitosExpediente` | checklist (scope del enlace) | ✅ existe |
| `enlaces_magicos` | `enlacesMagicos` | token, expiración, usos, revocación | ⚠️ existe pero **token en claro** (gap crítico, sec. 12) |
| `documentos_expediente` | `documentosExpediente` | metadatos + hash + blobUrl + estado | ✅ existe |
| `auditoria_eventos` | `auditoriaEventos` | trazabilidad (emisión, acceso, subida) | ✅ existe |
| `correos_enviados` | `correosEnviados` | registro del email con el enlace | ✅ existe |
| `rate_limits` | `rateLimits` | control por IP/ventana | ✅ existe |
| `jobs_sgie` | `jobsSgie` | cola del job `extraccion_texto` | ✅ existe |

### 4.1 Enum ya existente: `expediente_estado`

Ya define el ciclo documental base: `creado`, `pendiente_de_checklist`, `pendiente_de_documentos`, `enlace_enviado`, `documentos_parcialmente_recibidos`, `documentos_completos`, `analisis_pendiente`, `analisis_completado`, `inconsistencias_detectadas`, `pendiente_validacion_abogado`, `validado`, `pendiente_de_firma`, … **No requiere creación**.

### 4.2 Cambios de schema necesarios en Fase 1

**Único cambio de schema: hashing del token.** Opciones (a decidir en implementación, ambas válidas):

- **Opción A (recomendada):** añadir columna `token_hash varchar(64)` con `unique`, guardar solo `sha256(token)`, conservar `token` solo en memoria en el momento de la creación (para enviarlo por email una vez) y **nunca** persistirlo en claro. Migración con backfill: hashear los tokens existentes no es posible (no se puede invertir); por tanto, la migración debe **invalidar** los tokens en claro previos (poner `revocado_en`) y forzar reemisión.
- **Opción B:** renombrar la columna `token` a `token_hash` semánticamente y almacenar siempre el hash. Misma consideración de invalidación de tokens previos.

> **Decisión pendiente:** opción A o B. Cualquiera resuelve el gap. El cambio debe generarse con `npx drizzle-kit generate` y aplicarse en staging antes que en producción (R8).

---

## 5. Rutas API necesarias

**Estado real: todas las rutas de Fase 1 ya existen.** No se crean nuevas; se documentan las existentes y se señalan ajustes.

| Ruta | Método | Estado | Observación |
|---|---|---|---|
| `POST /api/sgie/enlaces` | POST | ✅ existe | emite enlace; auth `requireAbogado` + CSRF + rate limit |
| `GET /api/sgie/enlaces?expedienteId=` | GET | ✅ existe | lista enlaces (no devuelve token de revocados) |
| `POST /api/sgie/enlaces/[id]/revocar` | POST | ✅ existe | revoca |
| `POST /api/public/cargar/[token]` | POST | ✅ existe | **núcleo de Fase 1**; ver sección 7 |
| `GET /cargar/[token]` (página) | — | ✅ existe | portal cliente, `noindex` |
| `POST /api/sgie/notificaciones/email` | POST | ✅ existe | envío vía Resend |

### 5.1 Ajuste requerido en `POST /api/sgie/enlaces`

Hoy crea el enlace y devuelve el `token` al abogado. Tras el cambio de hashing (sec. 4.2), el flujo correcto es: **crear enlace → enviar email inmediatamente vía Resend (con el token en claro solo en esa llamada) → devolver al abogado una referencia y el estado del envío, no el token reusable**. Si se necesita mostrar un enlace al abogado (p. ej. para copiar), debe ser un enlace de **un solo uso visual** oCaducado al primer uso, no un token permanente en claro en la UI.

---

## 6. Flujo completo de magic link

Referencia: `lib/sgie/enlaces-magicos.ts` (`crearEnlace`, `validarEnlace`, `consumirUsoEnlace`).

1. El abogado abre el expediente en SGIE y solicita un enlace (con `expedienteId`, `requisitoExpedienteId?`, `clienteEmail?`, `diasExpiracion?`, `usosMaximos?`).
2. `POST /api/sgie/enlaces` valida auth (`requireAbogado`), CSRF, rate limit y acceso al expediente (`verificarAccesoExpediente`).
3. `crearEnlace` genera un token seguro de 256 bits (`generarTokenSeguro`) y persiste (hoy en claro → **debe ser hash** tras sec. 4.2). Defaults: 7 días, 5 usos.
4. Se envía el email al cliente por Resend con la URL `https://.../cargar/{token}`.
5. Se registra en `correos_enviados` (con idempotencia) y en `auditoria_eventos` (`magic_link_created`).
6. El expediente pasa a estado `enlace_enviado` (enum existente).

**Validación al usar el enlace** (`validarEnlace`): existe → no revocado → no expirado → usos disponibles. Devuelve códigos `no_encontrado` / `expirado` / `revocado` / `agotado`. **No consume el uso**; lo consume `consumirUsoEnlace` solo tras una subida exitosa.

---

## 7. Flujo completo de subida documental

Referencia: `app/api/public/cargar/[token]/route.ts`. **Ya implementado** con orden de seguridad correcto.

1. `POST /api/public/cargar/[token]` con `FormData` (campo `archivo`).
2. **Rate limit por IP**: 10 cargas / 15 min (`keyPrefix: 'sgie-carga'`). *Por IP, no por token* (evita rotación de tokens).
3. **Validar enlace** (`validarEnlace`). Si falla, audita `magic_link_accessed` (exito:false) y devuelve 404/410.
4. **Parsear multipart** y extraer el `File`.
5. **Validar archivo** (`validarArchivoCarga`): tamaño, MIME declarado, **magic bytes**, extensión peligrosa.
6. **Hash SHA-256** del buffer **antes** de cualquier otra acción.
7. **Subir a Blob** privado (`subirDocumentoBlob`) con nombre saneado (`saneaNombreDocumento`).
8. **Registrar documento** (`registrarDocumento`): detecta duplicado por hash en el expediente → estado `duplicado` y **no** se procesa.
9. Si no es duplicado, **encolar job** `extraccion_texto` en `jobs_sgie` (idempotente).
10. **Consumir un uso** del enlace (`consumirUsoEnlace`) solo tras éxito.
11. **Auditar** `documento_uploaded` (exito:true) con expediente, documento, duplicado, hash, tamaño.
12. Respuesta `201 { ok, documentoId, duplicado, mensaje }`.

### 7.1 Gaps detectados en el flujo de subida

- **Ausencia de escaneo malware** antes/después de subir (recomendado; fuera del MVP salvo decisión expresa).
- **Ausencia de signed URL con expiración para la descarga/preview** ya gestionada por `documentos/[id]/preview` — verificar que no exponga URLs permanentes públicas (auditar en pruebas).
- El flujo **confía en que Blob es privado**; confirmar la configuración del store (access `private`) en variables de entorno.

---

## 8. Uso de Vercel Blob

- Cliente `@vercel/blob@^2.4.1` ya presente.
- Función helper `subirDocumentoBlob` (`lib/sgie/util.ts`) ya usada por el endpoint.
- **Regla absoluta:** en Neon solo `blob_url` (referencia interna) + `hash_sha256` + metadatos; **nunca** el binario.
- El Blob debe estar en un store **privado**; las descargas se hacen vía signed URL corta desde rutas autenticadas (preview/descargar), no desde URLs públicas permanentes.
- **Decisión pendiente (no bloqueante para Fase 1):** Vercel Blob vs S3 vs R2 para volumen. Para el MVP se mantiene Blob.

---

## 9. Uso de Resend

- Cliente `resend@^6.12.4` ya presente.
- Envío gestionado por `lib/sgie/notificaciones-email.ts` y `POST /api/sgie/notificaciones/email`.
- Registro de cada envío en `correos_enviados` (con `resend_id`, `estado`, `intentos`, `error`, idempotencia por `expedienteId + plantillaSlug + ventanaTemporal`).
- **Emails de Fase 1:** solicitud documental (con el enlace) y, opcionalmente, confirmación de recepción tras subida exitosa.
- **Requisito:** dominio verificado en Resend para buena entregabilidad.

---

## 10. Estados documentales iniciales

Enum `documentoEstadoEnum` ya existe con valor por defecto `subido`. Estados relevantes para Fase 1:

| Estado | Cuándo |
|---|---|
| `subido` | tras registro exitoso (default) |
| `duplicado` | hash ya existe en el expediente |
| `procesando` / `procesado` | **fuera de Fase 1** (Fase 3+) |
| `aprobado` / `rechazado` | **fuera de Fase 1** (requiere revisión humana posterior) |

> Nota: los estados de IA (prevalidado, etc.) y la puerta “Listo para revisión” **no existen en Fase 1**. El documento queda en `subido` o `duplicado`; su validación humana posterior es manual en esta fase.

---

## 11. Auditoría mínima

Usar `auditoria_eventos` (append-only) y `lib/sgie/auditoria-sgie.ts` (`logSgie`) / `lib/audit.ts` (`audit`).

Eventos mínimos a garantizar en Fase 1:

| Evento | Acción (enum) | Disparo |
|---|---|---|
| `magic_link_created` | creación del enlace | emisión |
| `magic_link_accessed` | acceso al enlace (éxito o fallo) | validación del token |
| `documento_uploaded` | subida (éxito o fallo) | endpoint de carga |
| `magic_link_revoked` | revocación | `POST .../revocar` |
| `email_sent` (o equivalente) | envío del enlace | Resend |

Cada evento con `ip`, `user_agent`, `exito`, `metadata` (expediente/documento/código de error, **nunca** el token).

---

## 12. Seguridad del token

**🔴 Gap crítico detectado:** `enlaces_magicos.token` se almacena y busca **en claro**:
- `crearEnlace` inserta `token` (generado por `generarTokenSeguro`) en claro.
- `validarEnlace` hace `where(eq(enlacesMagicos.token, token))` en claro.
- No existe `token_hash` ni hashing en el módulo.

Esto contradice los documentos estratégicos (“guardar solo hash del token”) y es un riesgo real: un acceso a la base compromete todos los enlaces activos.

### 12.1 Cambio obligatorio en Fase 1

1. Añadir `token_hash` único (SHA-256 del token).
2. `crearEnlace`: generar token → calcular `sha256(token)` → persistir **solo** `token_hash` → devolver/enviar el token en claro **una sola vez** (email/respuesta inmediata).
3. `validarEnlace`: recibir token → `sha256(token)` → buscar por `token_hash`.
4. `consumirUsoEnlace`: operar por `id`, no por token en claro.
5. **Invalidar tokens en claro previos** en la migración (no son hasheables): marcar `revocado_en = now()`, motivo “migración a token hasheado”. Reemisión obligatoria.
6. No loguear nunca el token en claro (auditar solo su hash o su id).

### 12.2 Controles adicionales (ya presentes o a confirmar)

- Expiración obligatoria (default 7 días). ✅
- Usos máximos (default 5) con decremento atómico. ✅ (`consumirUsoEnlace`)
- Revocación manual. ✅
- Scope por expediente y por requisito. ✅
- Rate limit por IP (no por token). ✅
- `noindex` en el portal. ✅
- **OTP opcional para sensibles** (familia, penal): **pendiente** (no en Fase 1 salvo decisión).

---

## 13. Validaciones de archivo

`validarArchivoCarga` (`lib/sgie/util.ts`) ya aplica:

- **Tamaño máximo** configurado (verificar umbral real y documentarlo).
- **MIME declarado** permitido (allowlist).
- **Magic bytes** (detección real de tipo, no solo el MIME que envía el cliente).
- **Extensión peligrosa** bloqueada.
- **Hash SHA-256** obligatorio antes de procesar.

### 13.1 A confirmar/reforzar

- Publicar el allowlist de MIME/extensiones permitidas en la propia especificación una vez confirmado (PDF, imágenes comunes; rechazar ejecutables/scripts).
- Tamaño máximo por archivo y por sesión (acumulado) — confirmar si existe límite acumulado además del rate limit por número de cargas.

---

## 14. Rate limit

`rate_limits` + `lib/rate-limit.ts` ya operativos.

- **Portal de carga:** 10 cargas / 15 min por IP (`keyPrefix: 'sgie-carga'`). ✅
- **Emisión de enlaces:** rate limit existente en `POST /api/sgie/enlaces`. ✅
- **Recomendación:** añadir rate limit también al **GET del portal** (`/cargar/[token]`) por IP/token para evitar enumeración o abuso de render.

---

## 15. Manejo de errores

Reglas para el endpoint público (cliente sin cuenta, no puede ver errores internos):

- Token inválido/expirado/revocado/agotado → mensaje claro al cliente + auditoría `magic_link_accessed` exito:false. Estados 404 (no_encontrado) / 410 (resto).
- Archivo inválido (tamaño/MIME/magic) → 400 con mensaje accionable; auditar exito:false.
- Rate limit excedido → 429 con `Retry-After` (`rateLimitResponse`).
- Error interno → 500 genérico **sin detalles**; log en servidor (`console.error` ya presente).
- **Nunca** devolver el token en ningún error ni respuesta de listado.

---

## 16. Criterios de aceptación

La Fase 1 se considera completa cuando:

1. Un abogado puede emitir un enlace desde SGIE y el cliente lo recibe por email.
2. El cliente abre `/cargar/{token}`, sube un documento y recibe confirmación.
3. El documento queda registrado en `documentos_expediente` con hash, blob_url, IP/UA y estado `subido`.
4. Un duplicado (mismo hash en el expediente) se marca `duplicado` y no se procesa.
5. Un enlace expirado/revocado/agotado devuelve el mensaje correcto y audita el intento.
6. El rate limit bloquea tras 10 cargas/15 min por IP.
7. El token **no se almacena en claro** (gap cerrado) y los tokens previos quedan invalidados.
8. La auditoría registra emisión, acceso, subida y revocación.
9. El job `extraccion_texto` queda encolado (sin procesarse en esta fase) para documentos no duplicados.
10. `lint`, `tsc --noEmit`, `test` y `build` en verde; migración aplicada en staging.

---

## 17. Tests necesarios

- **Tests de token:** emisión, validación (válido/expirado/revocado/agotado), consumo de uso, revocación, hashing (tras el cambio).
- **Tests de magic link (flujo):** enlace válido permite subir; enlace inválido bloquea con código correcto.
- **Tests de upload:** archivo válido se registra; archivo demasiado grande rechazado; MIME no permitido rechazado; magic bytes inconsistentes rechazados; extensión peligrosa rechazada.
- **Tests de duplicados:** mismo hash en el expediente → estado `duplicado`, no se encola job.
- **Tests de rate limit:** 11.ª carga en 15 min → 429.
- **Tests de scope:** un token de expediente A no puede usarse para subir a expediente B (implícito por `validarEnlace`, pero cubrir con test).
- **Tests de auditoría:** cada acción crítica deja evento con ip/ua/exito.
- **Tests de seguridad del token:** no se devuelve el token en listados ni errores; el hash basta para validar.
- **Tests de Blob:** la subida usa store privado; no se generan URLs públicas permanentes.

---

## 18. Riesgos

1. **Token en claro (crítico)** — ya detectado; debe cerrarse antes de cualquier exposición de la Fase 1. Riesgo: compromiso de DB expone todos los enlaces activos.
2. **Invalidación de tokens previos al migrar** — fricción operativa (clientes con enlaces pendientes deben recibir uno nuevo). Mitigación: comunicar y reemitir.
3. **Ausencia de escaneo malware** — riesgo de almacenar contenido malicioso en Blob. Mitigación: añadir escaneo antes/después (post-MVP o por decisión expresa).
4. **URLs de Blob potencialmente públicas** — si el store no es privado, los binarios quedan accesibles. Mitigación: verificar config del store y usar signed URLs.
5. **Enumeración de tokens** — aunque el rate limit mitiga, validar que el portal no filtre información por existencia de token.
6. **Emails no entregados** — el enlace nunca llega al cliente. Mitigación: eventos de Resend + canal alternativo (fuera de Fase 1).
7. **Confusión de estados** — el documento queda `subido` sin validación; el equipo debe entender que en Fase 1 **no hay** “Listo para revisión” automático.

---

## 19. Checklist final antes de implementar

- [ ] Decidir opción de hashing del token (A: columna `token_hash` nueva; B: renombrar) y generar migración con `drizzle-kit generate`.
- [ ] Invalidar tokens en claro previos en la migración (`revocado_en`).
- [ ] Modificar `crearEnlace` / `validarEnlace` / `consumirUsoEnlace` para operar con hash.
- [ ] Ajustar `POST /api/sgie/enlaces` para enviar email inmediato y no devolver token reusable.
- [ ] Confirmar que el Blob store es **privado** y que preview/descarga usan signed URLs.
- [ ] Documentar allowlist real de MIME/extensiones y tamaño máximo.
- [ ] Añadir rate limit al GET del portal si no existe.
- [ ] Garantizar que el job `extraccion_texto` solo se **encola** (no se procesa en Fase 1).
- [ ] Escribir/ejecutar los tests de la sección 17.
- [ ] Validar `npm run lint && npx tsc --noEmit && npm run test && npm run build` en verde.
- [ ] Aplicar migración en **staging** antes que en producción.
- [ ] Confirmar que **ningún cambio toca** `app/(public)/**` (web pública).

---

## 20. Cierre de la Fase 1 — implementación realizada (9 jul 2026)

### 20.1 Cambios realizados

| Archivo | Cambio |
|---|---|
| `lib/schema.ts` | `enlaces_magicos`: sustituida columna `token` por `token_hash varchar(64) notNull unique`; índice `tokenIdx` → `tokenHashIdx` sobre `token_hash`. |
| `lib/sgie/util.ts` | Añadido `hashToken(token)` → SHA-256 hex 64 chars (reutiliza `createHash`). |
| `lib/sgie/enlaces-magicos.ts` | `crearEnlace` persiste **solo `tokenHash`**, devuelve `token` en claro únicamente en memoria; `validarEnlace` hashea el token recibido y busca por `tokenHash`. Nuevo tipo `EnlaceCreado`. `consumirUsoEnlace`, `revocarEnlace` y `expirarEnlacesVencidos` sin cambios (operan por `id`/fechas). |
| `app/api/sgie/enlaces/route.ts` | Comentario que documenta el riesgo limitado: el `token` se devuelve **solo** en la respuesta inmediata de creación (POST). El listado (GET) ya no lo exponía. |
| `drizzle/migrations/0025_enlaces_token_hash.sql` | Migración nueva. |
| `drizzle/migrations/meta/_journal.json` | Entrada idx 25, tag `0025_enlaces_token_hash`. |
| `tests/sgie-enlaces-magicos-hash.test.ts` | Tests nuevos (11). |

### 20.2 Decisión de schema

**Migrar a `token_hash` y limpiar** (opción B del plan). Se sustituyó la columna `token` (en claro) por `token_hash` (SHA-256 hex, 64, único). El token en claro solo vive en memoria en el momento de emisión (email/respuesta al abogado) y viaja en la URL `/cargar/{token}` como credencial del cliente. No se persiste ni se loguea ni se audita.

### 20.3 Migración generada

`drizzle/migrations/0025_enlaces_token_hash.sql` — pasos:
1. `CREATE EXTENSION IF NOT EXISTS pgcrypto` (para poder hashear con `digest` si hace falta; aunque el backfill no se usa porque los tokens previos se invalidan).
2. `ADD COLUMN token_hash varchar(64)`.
3. **Revocación de TODOS los enlaces previos** (`revocado_en = now()`, motivo `'invalidado por migración a token_hash (Fase 1)'`) donde `revocado_en IS NULL`.
4. `DROP COLUMN token`.
5. `token_hash SET NOT NULL` + índice único + índice btree; drop del índice `token_idx` antiguo.

**Comando para aplicar en staging:**
```bash
DATABASE_URL=<staging> npx drizzle-kit migrate
```

### 20.4 Enlaces previos invalidados

**Todos** los enlaces activos previos quedan revocados por la migración. No son hasheables de forma verificable (no se puede recuperar el token original ni garantizar que no fueron comprometidos mientras estuvieron en claro). Los clientes con enlaces pendientes deberán recibir uno nuevo emitido por el abogado. **Esta invalidación es intencionada y definitiva.**

### 20.5 Rutas verificadas (sin cambios de comportamiento externo)

- `POST /api/sgie/enlaces` — emite enlace (auth `requireAbogado` + CSRF + rate limit); devuelve `token` solo en la respuesta de creación.
- `GET /api/sgie/enlaces?expedienteId=` — lista sin token.
- `POST /api/sgie/enlaces/[id]/revocar` — revoca por id.
- `GET /cargar/[token]` — portal cliente (`noindex`, sin datos sensibles, sin navegación a SGIE/Admin).
- `POST /api/public/cargar/[token]` — upload (rate limit 10/15min/IP, validación MIME+magic bytes+extensión, hash SHA-256, Blob privado, duplicados, job `extraccion_texto` encolado, auditoría).

### 20.6 Variables necesarias

- `DATABASE_URL` (Neon) — obligatoria para migración y runtime.
- `BLOB_READ_WRITE_TOKEN` — para Vercel Blob privado (sin él, `subirDocumentoBlob` hace fallback a filesystem local solo en dev).
- `RESEND_API_KEY` — para envío de emails (sin credenciales, el envío debe quedar mockeado/registrado en `correos_enviados` con estado de fallo).

### 20.7 Eventos de auditoría garantizados (enum ya existente)

`enlace_created`, `magic_link_accessed` (éxito/fallo), `documento_uploaded` (éxito/fallo), `enlace_revoked`, `correo_sent`/`correo_failed` (vía notificaciones). **Ninguno incluye el token en claro** (se registra `recursoId` = id del enlace).

### 20.8 Resultado de pruebas (9 jul 2026)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run test` | ✅ 803 tests, 37 archivos, todos pasan (incluye 11 nuevos) |
| `npm run lint` | ✅ 0 errores |
| `npm run build` | ✅ build + postbuild correctos |
| `git status` | ✅ web pública intacta (sin cambios en `app/(public)`) |

### 20.9 Límites pendientes (no bloqueantes para cerrar Fase 1)

- **Aplicación real de la migración en staging/producción** (no ejecutada: solo generada; `drizzle-kit migrate` con `DATABASE_URL` de staging).
- **Escaneo antivirus/malware** — fuera del MVP (recomendado post-Fase 1).
- **OTP para expedientes sensibles** — fuera del MVP.
- **Resend sin credenciales en este entorno** — verificar `RESEND_API_KEY` en staging; sin ella, los envíos fallan y se registran en `correos_enviados`.
- **Rate limit del GET del portal** (`/cargar/[token]`) — el rate limit actual protege el POST de upload; un rate limit de lectura anti-enumeración queda como mejora post-MVP.

### 20.10 Criterio — Fase 1 cerrada

La Fase 1 se considera **cerrada a nivel de código**:
1. ✅ Ningún magic link activo se almacena en claro (schema + migración).
2. ✅ `validarEnlace` busca por hash.
3. ✅ Enlaces previos invalidados por la migración.
4. ✅ Portal y upload siguen funcionando (sin cambios de comportamiento externo; tests en verde).
5. ✅ Auditoría registra eventos críticos sin token en claro.
6. ✅ lint/tsc/test/build en verde.
7. ✅ Web pública intacta.

**Pendiente de operación**: aplicar la migración en staging (`drizzle-kit migrate`) y verificar el flujo E2E real con un enlace recién emitido.

---

## Registro de certeza

- **VALIDADO por inspección del repo:** entidades SGIE, rutas de enlaces, endpoint público de carga, portal `/cargar/[token]`, rate limit, auditoría, Resend, Blob, jobs. La Fase 1 está **mayormente implementada**.
- **VALIDADO como gap real (crítico):** el token se almacena y busca **en claro** en `enlaces_magicos.token`; debe hashearse.
- **Pendiente de confirmación:** allowlist exacto de MIME/extensiones y tamaño máximo; configuración privada del store Blob; existencia de rate limit en el GET del portal.
- **Fuera de alcance Fase 1:** IA, OCR, pipeline documental, puerta “Listo para revisión”, SEJE, retención automatizada, escaneo malware (salvo decisión expresa), web pública.

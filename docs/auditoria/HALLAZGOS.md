# Hallazgos de auditoría

## Escala y criterio

La severidad combina impacto, explotabilidad, frecuencia, alcance y esfuerzo del atacante. “Comprobado” significa evidencia de código, comando o navegación; “Riesgo probable” identifica un comportamiento no explotado en producción.

## Resumen por severidad

| Severidad | Cantidad |
|---|---:|
| Crítica | 1 |
| Alta | 5 |
| Media | 10 |
| Baja | 6 |
| **Total** | **22** |

## Hallazgos

### AUD-SEC-001 — Challenge 2FA reutilizable como sesión completa

- **Categoría:** autenticación / MFA
- **Severidad:** Crítica
- **Estado:** `IMPLEMENTADO` el control, `RIESGO COMPROBADO` en código, explotación productiva no realizada
- **Ubicación:** `app/api/auth/login/route.ts:96-115`, `app/api/auth/2fa/verify/route.ts:23-38`, `lib/auth.ts:72,163-168,209-218`
- **Evidencia reproducible:** el login llama `signToken()` para crear `challenge`; esa función firma `userId/email/rol` con TTL 24 h. `requireAuth()` acepta cualquier token verificado sin claim de propósito. El verify 2FA usa el mismo `verifyToken()`.
- **Impacto:** el segundo factor puede omitirse colocando el challenge recibido como cookie de sesión. Acceso completo según el rol contenido.
- **Probabilidad:** Alta si una cuenta tiene 2FA activo y el cliente/challenge se captura o manipula.
- **Solución:** token separado con `purpose: '2fa_challenge'`, TTL 5 min, `jti` de un solo uso y firma/función distinta; `requireAuth` debe exigir `purpose: 'session'`. Añadir tests de rechazo cruzado.

### AUD-SEC-002 — IDOR/BOLA en detalle y actualización de clientes

- **Categoría:** autorización a nivel de objeto / privacidad
- **Severidad:** Alta
- **Estado:** `IMPLEMENTADO` el control (Fase 1); `RIESGO COMPROBADO` en código previo, no explotado en producción
- **Ubicación:** `lib/sgie/clientes-db.ts:51-61,183,202,292-296`, `app/api/sgie/clientes/[id]/route.ts:37-38,81-82`
- **Evidencia reproducible (corregido):** `condicionAmbitoCliente()` inyecta un `EXISTS` (asignaciones + permisos activos) dentro del `WHERE` de SELECT y UPDATE, no después de recuperar la fila. Cliente ajeno o inexistente devuelve 404 indistinguible. La mutación cruzada no afecta filas (UPDATE returning length 0 → false). La creación/reutilización no filtra UUID de clientes fuera de ámbito.
- **Pruebas:** `tests/clientes-idor.test.ts` (9 tests: abogado A ve su cliente, abogado B recibe 404 en GET y PATCH, mutación cruzada imposible, duplicado no-accesible no filtra UUID, admin conserva acceso).
- **Pendiente:** validación de integración con DB aislada en staging (los tests unitarios mockean `db`); logs de auditoría de intentos denegados por scope.

### AUD-SEC-003 — Credenciales productivas débiles y compartidas entre roles

- **Categoría:** gestión de credenciales
- **Severidad:** Alta
- **Estado:** `VALIDADO` mediante login autorizado
- **Ubicación:** cuentas de producción proporcionadas para Admin y SGIE (valor no reproducido)
- **Evidencia reproducible:** ambas cuentas autenticaron con la misma contraseña débil facilitada para la auditoría.
- **Impacto:** toma de control de Admin y SGIE por reutilización, adivinación o filtración; eleva cualquier fallo a compromiso total.
- **Probabilidad:** Alta.
- **Solución:** rotación inmediata, contraseña única larga por cuenta, activar 2FA después de corregir AUD-SEC-001, invalidar sesiones existentes y revisar auditoría de accesos.

### AUD-SEC-004 — Preview de borradores expone contenido en URL y renderiza HTML sin sanitizar

- **Categoría:** XSS / fuga de información
- **Severidad:** Alta
- **Estado:** `RIESGO COMPROBADO` en código
- **Ubicación:** `app/api/admin/preview/route.ts:14-33`, `app/(public)/preview/[token]/page.tsx:22-58`
- **Evidencia reproducible:** el body completo se incluye en un JWT firmado pero no cifrado y se devuelve dentro de la URL; la página usa `dangerouslySetInnerHTML` con `payload.body` sin `sanitizeHtml`.
- **Impacto:** borradores visibles en historial/logs/telemetría y XSS persistente durante la vista previa con permisos/origen del sitio.
- **Probabilidad:** Media-Alta para contenido pegado/importado o enlace compartido.
- **Solución:** preview opaco server-side con ID aleatorio de un solo uso, acceso autenticado, no body en URL; sanitizar al guardar y al renderizar; CSP específica sin scripts inline.

### AUD-FUN-001 — Recuperación de contraseña envía a una ruta inexistente

- **Categoría:** disponibilidad de cuenta / UX
- **Severidad:** Alta
- **Estado:** `COMPROBADO` por inventario y build
- **Ubicación:** `app/api/auth/reset-password/route.ts:71-84`, `app/intranet/layout.tsx:10`, `proxy.ts:79`
- **Evidencia reproducible:** el correo genera `/reset?token=...`; el build no contiene `/reset`. El layout/proxy mencionan `/intranet/recuperar-clave`, pero tampoco existe `page.tsx`.
- **Impacto:** usuarios bloqueados no pueden restablecer contraseña; aumenta intervención administrativa y riesgo de entrega manual de tokens.
- **Probabilidad:** Alta cuando se usa el flujo.
- **Solución:** crear flujo canónico único y tests E2E de solicitud/confirmación, sin exponer token en logs.

### AUD-DEP-001 — 15 vulnerabilidades conocidas en dependencias

- **Categoría:** supply chain
- **Severidad:** Alta
- **Estado:** `VALIDADO` con `npm audit --json`
- **Ubicación:** `package.json:117-118,136,140,166`, `package-lock.json`
- **Evidencia reproducible:** 5 altas y 10 moderadas. Altas incluyen MCP SDK/servers, Hono y Undici; moderadas incluyen PostCSS/Next, esbuild/Drizzle y uuid/googleapis. Algunas no tienen fix directo.
- **Impacto:** ReDoS, DNS rebinding, CORS, TLS/proxy, DoS WebSocket, XSS de CSS y riesgos de tooling.
- **Probabilidad:** variable; MCP/tooling puede no estar en el runtime web, Undici/Hono requieren confirmar camino efectivo.
- **Solución:** separar dependencias operativas del runtime, actualizar compatibles en rama, documentar excepciones, generar SBOM y bloquear altas explotables en CI.

### AUD-SEC-005 — Descarga PDF usa GET con escritura y sin control de abuso

- **Categoría:** semántica HTTP / abuso / recursos
- **Severidad:** Media
- **Estado:** `RIESGO COMPROBADO` en código
- **Ubicación:** `app/api/descargar/route.ts:8-45`, `proxy.ts:43`
- **Evidencia reproducible:** `GET` recibe email por query, inserta suscripción y renderiza PDF; no tiene rate limit ni CAPTCHA.
- **Impacto:** contaminación de suscriptores, CSRF por recursos embebidos, PII en URL/logs y consumo de CPU/memoria mediante generación reiterada.
- **Probabilidad:** Alta para bots.
- **Solución:** POST con Zod, Turnstile, rate limit fail-closed y consentimiento; URL de descarga opaca posterior; PDF cacheado por área sin email.

### AUD-SEC-006 — Criptografía y rate limit 2FA acoplados a sesión

- **Categoría:** criptografía / resiliencia
- **Severidad:** Media
- **Estado:** `IMPLEMENTADO` el control (Fase 1); `RIESGO COMPROBADO` en código previo
- **Ubicación:** `lib/auth-2fa.ts:87-108`, `app/api/auth/2fa/verify/route.ts:39`, `lib/rate-limit.ts:23-35`
- **Evidencia reproducible (corregido):** el cifrado TOTP usa `ENCRYPTION_KEY` dedicada (obligatoria en producción, ≥32 chars); `JWT_SECRET` solo figura como fallback legacy de lectura para migración controlada, nunca para cifrar contenido nuevo. `ENCRYPTION_KEY_PREVIOUS` permite rotación sin inutilizar secretos. El prefijo `2fa` está en `SENSITIVE_PREFIXES` con fail-closed en producción; el rate limit se aplica por `userId:ip`.
- **Pruebas:** `tests/rate-limit.test.ts` (fail-closed 2fa con DB caída), `tests/2fa-verify-route.test.ts` (6 escenarios del endpoint verify).
- **Pendiente:** `ENCRYPTION_KEY` debe configurarse en el entorno de despliegue (operación manual, ver runbook); rotación de `ENCRYPTION_KEY_PREVIOUS` tras migrar todos los enrolamientos.

### AUD-SEC-007 — Login devuelve mensajes internos en errores inesperados

- **Categoría:** manejo de errores
- **Severidad:** Media
- **Estado:** `COMPROBADO` en código
- **Ubicación:** `app/api/auth/login/route.ts:133-136`
- **Evidencia reproducible:** el catch serializa `e.message` al cliente y registra el objeto completo.
- **Impacto:** exposición de detalles de DB/configuración; logs con datos innecesarios.
- **Probabilidad:** Media durante fallos.
- **Solución:** mensaje 500 neutro, correlation ID, detalle solo en observabilidad con redacción.

### AUD-PRI-001 — Logs de consulta incluyen email y mensajes debug

- **Categoría:** privacidad / observabilidad
- **Severidad:** Media
- **Estado:** `COMPROBADO` en código
- **Ubicación:** `app/api/consulta/route.ts:105-124`
- **Evidencia reproducible:** logs debug imprimen email, tipo y destino de autorespuesta.
- **Impacto:** PII en logs de plataforma, retención y acceso más amplios que la DB jurídica.
- **Probabilidad:** Alta por cada consulta con email.
- **Solución:** eliminar debug, loguear ID/correlation y estado; política de redacción y retención.

### AUD-ARC-001 — Contrato contradictorio de preview de Blob privado

- **Categoría:** arquitectura documental
- **Severidad:** Media
- **Estado:** `RIESGO PROBABLE`, no se abrió un documento real
- **Ubicación:** `lib/sgie/util.ts:170-186`, `app/api/sgie/documentos/[id]/preview/route.ts:8-19,77-89`
- **Evidencia reproducible:** upload usa `access: 'private'`, pero el preview devuelve `blobUrl` directamente y comenta que las URLs actuales son públicas.
- **Impacto:** preview roto o tentación de volver público el storage; si el proveedor cambia, fuga documental.
- **Probabilidad:** Media.
- **Solución:** proxy de descarga autenticado/stream o URL firmada temporal, `Content-Disposition`, no devolver URL persistente.

### AUD-QA-001 — Cobertura insuficiente en fronteras críticas

- **Categoría:** QA
- **Severidad:** Media
- **Estado:** `VALIDADO`
- **Ubicación:** `vitest.config.ts`, reporte `npm run test:coverage`
- **Evidencia reproducible:** proxy 18,05 % líneas; RAG 2,38 %; varios módulos DB SGIE 0 %. No se encontraron tests de challenge 2FA.
- **Impacto:** regresiones de autorización, jobs y datos pueden pasar con 861 tests verdes.
- **Probabilidad:** Alta a medida que crece el sistema.
- **Solución:** matriz de seguridad por rol/objeto, tests DB aislada y umbrales por módulo crítico.

### AUD-QA-002 — E2E usa DATABASE_URL configurada y deja datos

- **Categoría:** aislamiento de pruebas
- **Severidad:** Media
- **Estado:** `COMPROBADO`; suite con escritura no ejecutada
- **Ubicación:** `scripts/e2e-start.mjs:9-17`, `e2e/auth-flow.spec.ts:25-26,31-104`, `e2e/intranet-sidebar.spec.ts:60`
- **Evidencia reproducible:** el servidor toma `process.env.DATABASE_URL`; specs registran usuarios/crean casos y la limpieza es manual.
- **Impacto:** contaminación o modificación accidental de producción, además de rate limit desactivado.
- **Probabilidad:** Media-Alta en entornos locales mal configurados.
- **Solución:** URL obligatoria con allowlist de staging/local, guard de host/database, fixtures transaccionales y teardown automático.

### AUD-SEO-001 — GSC y GA4 no pueden refrescarse

- **Categoría:** SEO/Analytics operativo
- **Severidad:** Media
- **Estado:** `VALIDADO`
- **Ubicación:** `docs/audits/seo-live-summary.md`
- **Evidencia reproducible:** `seo:collect` obtuvo 4/6 y reportó `invalid_grant` para GSC/GA4.
- **Impacto:** decisiones con datos obsoletos y alertas incompletas.
- **Probabilidad:** Actual.
- **Solución:** reautorizar OAuth, verificar propiedad y rotación/expiración; alerta por antigüedad de datasets.

### AUD-OPS-001 — Recuperación ante desastre no validada

- **Categoría:** resiliencia/operaciones
- **Severidad:** Media
- **Estado:** `NO VALIDADO`
- **Ubicación:** repositorio y documentación operativa
- **Evidencia reproducible:** no se ejecutó ni encontró evidencia reciente de restore probado, RPO/RTO o runbook integral Neon+Blob+secrets.
- **Impacto:** pérdida o indisponibilidad prolongada de expedientes/documentos.
- **Probabilidad:** Baja-Media; impacto alto.
- **Solución:** definir RPO/RTO, backups Neon, retención Blob, restore trimestral y runbook con responsables.

### AUD-SEC-008 — Callback OAuth público contradice su documentación y no usa state

- **Categoría:** OAuth / coherencia
- **Severidad:** Media
- **Estado:** `COMPROBADO` en código
- **Ubicación:** `proxy.ts:35-45`, `app/api/oauth/callback/route.ts:7-27`
- **Evidencia reproducible:** `/api/oauth/callback` está en `PUBLIC_API_EXACT`, aunque el handler afirma que el proxy exige JWT; no existe validación `state`.
- **Impacto:** superficie OAuth innecesaria, intercambio no ligado a una sesión y errores externos expuestos parcialmente.
- **Probabilidad:** Baja-Media porque el endpoint no persiste tokens.
- **Solución:** eliminarlo si es legado o exigir admin+state PKCE y persistencia segura.

### AUD-DOC-001 — README y cifras canónicas desactualizadas

- **Categoría:** documentación
- **Severidad:** Baja
- **Estado:** `COMPROBADO`
- **Ubicación:** `README.md`, `AGENTS.md`, inventario actual
- **Evidencia reproducible:** README: 754/35 pruebas/suites y 70+ APIs; real: 861/42 y 142 rutas. AGENTS menciona 66 tablas; se contaron 69 `pgTable`.
- **Impacto:** estimaciones y auditorías parten de un mapa incorrecto.
- **Solución:** generar métricas automáticamente en CI o evitar cifras rígidas.

### AUD-MNT-001 — Endpoint MCP de demostración desplegado

- **Categoría:** superficie abandonada
- **Severidad:** Baja
- **Estado:** `COMPROBADO`
- **Ubicación:** `app/api/[transport]/route.ts:1-31`
- **Evidencia reproducible:** handler MCP solo expone `roll_dice` y activa `verboseLogs`.
- **Impacto:** dependencia y superficie innecesarias; contribuye a advisories MCP.
- **Solución:** eliminar si no hay consumidor o aislarlo fuera del runtime productivo.

### AUD-MNT-002 — Lint permite seis advertencias SGIE

- **Categoría:** mantenibilidad
- **Severidad:** Baja
- **Estado:** `VALIDADO`
- **Ubicación:** rutas readiness y métricas autonomía informadas por ESLint
- **Evidencia reproducible:** 0 errores, 6 warnings por imports/variables sin uso.
- **Impacto:** ruido que oculta regresiones y señales de código incompleto.
- **Solución:** limpiar y hacer `--max-warnings=0` cuando la base esté en cero.

### AUD-PERF-001 — Build depende de Google Fonts en tiempo de compilación

- **Categoría:** build/resiliencia
- **Severidad:** Baja
- **Estado:** `VALIDADO`
- **Ubicación:** `app/layout.tsx`, `next/font/google`
- **Evidencia reproducible:** primer build falló al no acceder a `fonts.googleapis.com`; pasó con red autorizada.
- **Impacto:** despliegues fallidos por proveedor/red externa.
- **Solución:** self-host de fuentes con licencias verificadas o cache de build controlado.

### AUD-UX-001 — Admin concentra demasiadas métricas y accesos duplicados

- **Categoría:** UI/UX
- **Severidad:** Baja
- **Estado:** `VALIDADO` visual/DOM
- **Ubicación:** `/intranet/admin`, `app/intranet/admin/page.tsx`
- **Evidencia reproducible:** panel mezcla métricas legales, contenido, búsqueda, tabla, módulos y marco normativo; acciones rápidas duplican sidebar.
- **Impacto:** carga cognitiva y baja priorización operacional.
- **Solución:** dashboard por excepciones/pendientes, personalizable y con navegación por tareas.

### AUD-UX-002 — Estados SGIE se muestran con nomenclatura técnica

- **Categoría:** UI/UX
- **Severidad:** Baja
- **Estado:** `VALIDADO` visual/DOM
- **Ubicación:** `/intranet/sgie`, componentes de cockpit
- **Evidencia reproducible:** estados como “analisis completado”, “documentos parcialmente recibidos” y “pendiente validacion abogado” aparecen como valores de sistema.
- **Impacto:** lectura lenta, inconsistencia lingüística y riesgo de acción incorrecta.
- **Solución:** catálogo de etiquetas humanas, color/ícono no exclusivos y siguiente acción visible.

## Hallazgos cerrados — Fases 1-5 y Subfases (2026-07-12)

### AUD-SEC-008 — Preview con contenido en JWT dentro de URL

- **Categoría:** Seguridad
- **Severidad:** Alta
- **Estado:** `CERRADO` (Fase 2)
- **Descripción:** El preview de contenido transportaba title, body, description, category dentro de un JWT en la URL (`/preview/<jwt>`). Un JWT en URL queda en logs de proxy, historial del navegador y puede ser compartido accidentalmente.
- **Solución:** Reemplazado por tokens opacos server-side (`preview_tokens` en DB), single-use, expiración 1h, sanitización HTML con allowlist estricta. Página de preview requiere autenticación. Migración 0031.

### AUD-SEC-009 — `/api/oauth/callback` público sin autenticación

- **Categoría:** Seguridad
- **Severidad:** Media
- **Estado:** `CERRADO` (Fase 2)
- **Descripción:** El endpoint de callback OAuth estaba listado en `PUBLIC_API_EXACT` del proxy, permitiendo acceso anónimo. El código del handler asumía incorrectamente que el proxy lo protegía.
- **Solución:** Removido de `PUBLIC_API_EXACT`. Ahora requiere autenticación vía proxy (JWT válido).

### AUD-SEC-010 — Upload acepta MIME arbitrario del cliente

- **Categoría:** Seguridad
- **Severidad:** Alta
- **Estado:** `CERRADO` (Fase 3)
- **Descripción:** El endpoint de upload solo validaba `file.type` (provisto por el cliente, spoofeable). Un atacante podía subir un ejecutable renombrado `.jpg`.
- **Solución:** `lib/file-validation.ts` con validación por magic bytes (JPEG, PNG, WebP, AVIF, PDF, ZIP/DOCX). Detección de Zip Slip, extensión vs firma, límites. Admin upload route migrada a `validateImage()`.

### AUD-SEC-011 — `/api/descargar` GET con PII en URL

- **Categoría:** Seguridad
- **Severidad:** Media
- **Estado:** `CERRADO` (Fase 3)
- **Descripción:** Email en query param de URL (logs, historial). GET con side effects (escritura en DB). Sin rate limiting ni consent.
- **Solución:** Migrado a POST. Email y área en body. Rate limit 5/15min. Consent obligatorio. CAPTCHA-ready (Turnstile). Cache-Control: private, no-store. PDF cache server-side 1h.

### AUD-SEC-012 — `invalidateFreshness` nunca llamado tras mutaciones

- **Categoría:** Seguridad
- **Severidad:** Alta
- **Estado:** `CERRADO` (Fase 1)
- **Descripción:** La caché de frescura de sesión (5s TTL) no se invalidaba tras cambio de contraseña, bloqueo, cambio de rol, desactivación o logout. Ventana de 5 segundos donde una sesión revocada seguía siendo aceptada.
- **Solución:** Cableado en 7 rutas: change-password, reset-password admin, PATCH/DELETE usuario, bloqueo, rol, logout, reset por email.

### AUD-SEC-013 — `consumirTokenReset` no incrementaba `tokenVersion`

- **Categoría:** Seguridad
- **Severidad:** Alta
- **Estado:** `CERRADO` (Fase 1)
- **Descripción:** El reset de contraseña por email no invalidaba sesiones existentes porque no incrementaba `tokenVersion`. Un atacante con una sesión robada podía mantener acceso tras el reset.
- **Solución:** `consumirTokenReset` ahora incrementa `tokenVersion` y resetea `mustChangePassword` en la misma transacción.

### AUD-DEPS-001 — MCP demo con 3 HIGH CVEs sin consumidores

- **Categoría:** Dependencias
- **Severidad:** Alta
- **Estado:** `CERRADO` (Fase 4)
- **Descripción:** `app/api/[transport]/route.ts` era un endpoint MCP de demostración (solo `roll_dice`) con dependencias `@modelcontextprotocol/*` que tenían 3 vulnerabilidades HIGH. Sin consumidores reales.
- **Solución:** Endpoint eliminado. Dependencias `mcp-handler`, `@modelcontextprotocol/server-github`, `@modelcontextprotocol/server-postgres`, `@modelcontextprotocol/sdk` removidas.

### AUD-QA-002 — ESLint warnings en producción

- **Categoría:** Calidad
- **Severidad:** Baja
- **Estado:** `CERRADO` (Fase 4)
- **Descripción:** 6 warnings `no-unused-vars` en rutas de SGIE (readiness, autonomía).
- **Solución:** Imports no usados eliminados. ESLint: 0 errores, 0 warnings.

### AUD-MIG-001 — Consistencia de migraciones

- **Categoría:** Infraestructura
- **Severidad:** Media
- **Estado:** `CERRADO` (Subfase 1)
- **Descripción:** Auditoría de 32 migraciones: journal, SQL, schema, idempotencia, DOWN.
- **Solución:** 0 errores encontrados. 0030 y 0031 con IF NOT EXISTS, DOWN separado, schema↔SQL consistente.

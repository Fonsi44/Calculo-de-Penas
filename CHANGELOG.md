# Changelog — Pineda y Asociados

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto se adhiere a [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

> **Histórico completo (Releases 1–110):** [`docs/changelog/archive-2026-H1.md`](docs/changelog/archive-2026-H1.md).
> Este archivo principal conserva solo lo vigente y reciente; el detalle
> granular (fases SEO A–G, remediación identidad 2FA, fix chunks, evolución del
> chat) vive en el archivo histórico, conservado íntegro sin reescribir hechos.

---

## [Unreleased]

## [111] — 2026-07-18 — Fase 2 — Núcleo durable de procedimientos, documentos, comunicaciones, OCR e IA

> **Estado:** implementado en `main` (commit `c74840d`). Migraciones 0034–0036 listas para aplicar en staging.
> Documentación: `docs/architecture/fase-2-nucleo-durable-documentos-comunicaciones.md`, `docs/ops/fase-2-staging-validation.md`,
> `docs/handoffs/fase-2-a-fase-3.md`, `docs/adr/ADR-003` a `ADR-006`.

### Added

- **SGIE/Workflow engine:** plantillas versionadas de procedimiento (`procedimiento_versiones`), fases (`procedimiento_fases`) con orden/slug, transiciones (`procedimiento_transiciones`) con actores permitidos (`abogado`/`admin`/`sistema`). `instanciarWorkflow()` clona fases activas en `expediente_fases`. `transitarFase()` valida transiciones y actor en transacción atómica. `obtenerFaseActual()` y `obtenerWorkflow()` para consulta de estado.
- **SGIE/Job queue durable:** tabla `jobs_sgie` ampliada con `next_run_at`, `locked_at`, `lock_expires_at`, `worker_id`, `priority`, `idempotency_key`. Reclamación con `FOR UPDATE SKIP LOCKED`. Backoff exponencial 2^n × 60s + 30% jitter (máx 24h). Dead-letter queue en `dead_letter_jobs` tras 3 intentos. Historial de intentos en `job_attempts`. `recuperarLocksAbandonados()` para limpieza de workers caídos.
- **SGIE/Transactional outbox:** tabla `outbox_events` con 9 eventos canónicos (`case.created`, `workflow.instantiated`, `document.uploaded`, `document.processing.requested`, `document.processed`, `document.review.required`, `requirement.completed`, `communication.requested`, `communication.cancelled`). Eventos insertados en la misma transacción DB que la operación de negocio. `despacharEventos()` con `FOR UPDATE SKIP LOCKED`.
- **SGIE/Subida atómica:** `reservarEnlaceAtomicamente()` con UPDATE atómico de usos (previene race conditions). `registrarDocumentoAtomico()` en transacción DB: verificación de duplicado por hash intra-expediente y global + inserción + outbox event + job. `compensarBlobHuerfano()` para limpieza en errores.
- **SGIE/OCR:** interfaz `OcrProvider` con stub por defecto (nunca inventa texto). Tesseract.js como proveedor local para imágenes (JPEG/PNG/WebP/TIFF/BMP) y PDFs escaneados vía `pdfjs-dist` + `OffscreenCanvas`. Tabla `ocr_resultados` con texto, confianza, páginas y duración.
- **SGIE/AI Router:** enrutamiento multi-estrategia (deterministic → heuristic → deepseek → deepseek_pro → human). Configurable por `DOCUMENT_AI_MODE`. Umbral de revisión humana configurable vía `DOCUMENT_AI_HUMAN_REVIEW_THRESHOLD`. Revisión humana con approve/reject/correct. Trazabilidad completa en `ai_task_routing` + `logSgie`.
- **SGIE/Comunicaciones:** CRUD de plantillas versionadas con interpolación segura (HTML escapado). Envío idempotente vía Resend con `onConflictDoNothing`. Outbox de comunicaciones (`comunicaciones_outbox`) con reintentos (max 3) y envío programado. Webhooks Resend (delivered/bounced/complaint/opened/clicked). Auditoría en `comunicaciones_auditoria`. Supresión de destinatarios y cancelación de recordatorios.
- **SGIE/Observabilidad:** `obtenerMetricasOperativas()` con dashboard completo (jobs, outbox, documentos, comunicaciones, workers). `obtenerEstadoIntegraciones()` para OCR/IA/Resend/Blob. Endpoint `GET /api/admin/sgie/metricas` protegido por rol admin + capacidad `audit.read`.
- **API endpoints:** `POST /api/public/cargar/[token]` (carga pública con rate limit + enlace mágico atómico), `POST /api/sgie/documentos/[id]/procesar` (procesamiento con requireAbogado + CSRF), `POST /api/sgie/documentos/[id]/rechazar` (rechazo con notificación), `GET /api/cron/sgie/procesar` (pipeline batch con CRON_SECRET).
- **Migraciones:** `0034_fase2_workflows_outbox_jobs.sql` (14 tablas + alter jobs_sgie), `0035_fase2_documents_ocr_ai.sql` (2 tablas + alter documentos_expediente/document_text_pages), `0036_fase2_communications.sql` (2 tablas + alter correos_enviados/plantillas_correo/comunicaciones_outbox). Todas aditivas con IF NOT EXISTS.
- **E2E:** `scripts/e2e/fase2-e2e.mjs` valida flujo completo (procedimiento → expediente → enlace → subida → outbox → job → IA → comunicación → auditoría → limpieza).
- **Documentación:** arquitectura Fase 2, validación staging, handoff a Fase 3, ADRs 003–006 (job queue, outbox, OCR, AI router).

### Changed
- **SGIE/Checklist:** actualizado con todos los items de Fase 2 marcados COMPLETADO y notas de implementación.
- **Integraciones:** las variables `DEEPSEEK_*` se usan ahora también para `ia-documental.ts` (no solo RAG/scripts de blog).

### Security
- Endpoint cron protegido con `CRON_SECRET` (Bearer token).
- Carga pública con rate limit 10/15min por IP + enlace mágico con token hash SHA-256.
- Procesamiento/rechazo de documentos con requireAbogado + CSRF + verificación de asignación/permiso de expediente.
- OCR stub nunca inventa texto; sin OCR real el documento queda en `ocr_pendiente` con auditoría.

## [Unreleased]

### Added
- **SGIE/Admin:** invitaciones seguras con token SHA-256, expiración, uso único,
  revocación/reenvío, activación transaccional, resultado real de Resend y
  aceptación legal.
- **SGIE/Admin:** RBAC central con Administrador, Abogado y Supervisor, 17
  capacidades canónicas, overrides individuales, equipos y política persistida
  de acceso SGIE/expedientes/calendario.
- **SGIE/Agenda:** propietario/creador, rango visible paginado, tipos operativos,
  visibilidad, zona horaria, participantes, recordatorios, edición y cancelación.
- Migración aditiva `0032_fase1_admin_identidad_calendario.sql` y documento de
  arquitectura `docs/architecture/fase-1-nucleo-admin-identidad-calendario.md`.

### Changed
- **Admin:** dashboard editorial sustituido por resumen operativo real; gestión
  de usuarios unificada y alta directa reemplazada por invitación.
- **Expedientes:** creación, responsable, checklist, historial y auditoría ahora
  comparten una transacción; asignación a terceros exige `cases.assign`.
- **Errores:** fallos inesperados dejan de degradarse a 401 y devuelven 500 con
  correlation ID; CSRF devuelve 403 tipado.
- **docs:** Saneamiento documental de `AGENTS.md`, `README.md` y `CHANGELOG.md`.
  `AGENTS.md` reestructurado como protocolo canónico conciso con tres modos
  explícitos (`AUDITORÍA`, `IMPLEMENTACIÓN`, `VERIFICACIÓN`), declaración de que
  ningún archivo queda excluido de lectura en auditoría, y matriz de validación
  proporcional en lugar de validación universal. Manuales extensos de SEO Live y
  RAG condensados y enlazados a `docs/`.
  `README.md` reducido a entrada técnica profesional verificada: versiones
  reales del stack (Next.js 16.2.10 + React 19.2.7, no las obsoletas anteriores),
  eliminación de conteos manuales de tests/suites/endpoints/scripts/KPIs
  temporales, y reformulación de las afirmaciones de cumplimiento
  ("cumple GDPR/ePrivacy" → controles técnicos orientados al cumplimiento que
  requieren revisión jurídica humana).
  `CHANGELOG.md` normalizado a Keep a Changelog con un único bloque `[Unreleased]`
  y releases recientes resumidos; el detalle histórico se mueve a
  `docs/changelog/archive-2026-H1.md` sin perder información.
- **docs:** Bloque accidental de "Analítica pública" que estaba pegado al final
  del formato de entrega de `AGENTS.md` (texto huérfano sin cabecera) eliminado.

### Removed
- Superficies Admin del antiguo CMS: Blog, FAQ, páginas, menús, medios, SEO,
  analítica pública, Search Console, redirects y editor visual. Se conservan
  tablas y servicios de lectura requeridos por la web pública.
- Dependencias Tiptap y componentes editoriales que quedaron huérfanos.

## [110] - 2026-07-04 — Transformación coherente de la web pública

Reorganización integral de la web pública para eliminar "crecimiento por
acumulación" y convertir el sitio en una experiencia coherente. Override de R5
autorizado; resto del protocolo respetado (URLs/slugs intactos).

### Changed
- `lib/areas-unified.ts` (puente seed TS ↔ tabla DB `areas_juridicas`) y
  `lib/faq-unified.ts` (documenta 4 orígenes de FAQ) como fuentes unificadas.
- Componentes nuevos: `EditorialBlock`, `IconBadge`; utilidades `.section-breath`,
  `.rhythm-tight`. Variantes en `BlogHighlights`/`ConsultationCTA`/`TrustBar`.
- Home 631 → 456 líneas (−28 %). Cada página pública con misión canónica única.

### Fixed
- `@id` `FAQPage` duplicado en `/derecho-penal` y `/hondurenos-en-espana`.
- Deuda de hidratación React #418 en `ChatWidget` (patrón `useSyncExternalStore`).
- FAQ i18n home renombrada a `FAQ_HOME_LEGACY`: rol declarado como
  structured-data (JSON-LD), no UI ni fuente canónica.

> Detalle completo: [`docs/audits/transformacion-web-publica.md`](docs/audits/transformacion-web-publica.md).

## [109] - 2026-07-04 — Ajuste de escala visual + sistema de diseño

### Changed
- Tokens de escala visual agresivos (`--ui-scale`, `--space-scale`, etc.) que
  reducen ~30 % la altura de secciones manteniendo legibilidad (16 px mín.) y
  accesibilidad táctil (≥36 px).
- Sistema de diseño consolidado: `.prose-pilar`, `.geo-snippet`, `.prose-editorial`,
  patrón `card-premium`. Auditoría UX/UI de todas las páginas públicas.
- Arquitectura narrativa canónica por página: Breadcrumbs → PageHero → TrustBar
  → IntroEditorial → Sections → ConsultationCTA → HubFaq.

## [108] - 2026-07-07 — Chat público sin LLM externo

> Sustituye al chat original basado en DeepSeek (Release 108 histórico, archivado).
> Estado final: el chat público funciona **exclusivamente con un motor de reglas
> local**; los mensajes del usuario no se transmiten a ningún proveedor externo
> de IA. Verificado: `lib/chat/` no contiene `deepseek.ts` ni `system-prompt.ts`,
> y `app/api/chat/route.ts` no referencia DeepSeek.

### Changed
- `app/api/chat/route.ts` mono-flujo: rate-limit → Zod → guardrails → motor de
  reglas local. Eliminados `CHAT_PROVIDER`, cliente DeepSeek y system prompt LLM.
- Política de privacidad (sección 6) reescrita: "sistema automatizado basado en
  reglas locales". Versión política 0.4 → 0.5.

### Security
- Las variables `DEEPSEEK_*` de `.env.example` pertenecen a RAG/embeddings y
  scripts internos de blog, **no al chat público**. El chat no requiere API key de IA.

### Notes
- **PENDIENTE:** revisión jurídica humana de la redacción de la política de
  privacidad frente al ordenamiento hondureño y RGPD/LOPDGDD.

## [107] - 2026-07-10 — Saneamiento SEO Ahrefs Fases 1–G

Corrección técnica SEO basada en 6 CSV de Ahrefs (crawl 10-jul-2026).

### Fixed
- 2 enlaces 4xx en `/hondurenos-en-espana` (slugs inexistentes → canónico
  `/servicios-juridicos/derecho-civil-y-notarial`).
- 8 posts despublicados cuyas rutas estaban redirigidas (301) pero seguían
  publicados → generaban 114 enlaces internos a 3xx.
- H1 duplicado en 3 posts del blog (h1 → h2, vía `normalizar-blog.ts --solo-h1`).
- Titles largos (Fase A), metas cortas (Fase B), metas largas/truncadas (Fase C),
  orphan pages (Fase D), structured data `@context` en `@graph` (Fase F).
- `AggregateRating` eliminado de la home (política self-serving reviews).
- Retirada de `/intranet/admin` del header público HTML; `rel=nofollow` en tags
  del pie de post; `X-Robots-Tag` por ruta en `next.config.ts`.

### Added
- `scripts/seo-ahrefs-audit.mjs` (validador), `fix-long-titles.ts`,
  `fix-long-metas.ts`, `fix-editorial-placeholders.ts` (idempotentes, dry-run).
- `lib/seo.ts` helper `buildServiceMetaDescription()` (sanitiza HTML, recorta a
  120–155 chars en límite de palabra).

### Notes
- **NO VALIDADO:** los warnings del validador reflejan el CSV estático
  pre-corrección; desaparecerán tras deploy + recrawl Ahrefs. Las correcciones
  de código y DB están aplicadas y verificadas localmente.

## [106] - 2026-07-07 — Fix "page has broken JavaScript"

### Fixed
- Service worker con `CACHE` fijo entre deploys causaba 404 en chunks JS
  referenciados desde HTML servido (chunks obsoletos en caché).
- `public/sw.js` ahora versiona la caché por build vía placeholder `__BUILD_ID__`;
  cada deploy purga las cachés de builds anteriores y purga entradas cuya
  revalidación devuelve 404.
- Títulos de blog con marca "Pineda y Asociados" duplicada (template + sufijo DB).

### Added
- `scripts/bump-sw-cache.mjs` (inyecta `BUILD_ID` en `sw.js`).
- `scripts/verify-chunks.mjs` (valida chunks referenciados vs `.next/static/chunks/`).
- `postbuild` ejecuta `bump-sw-cache` + `verify-chunks` antes de `generate-llms-txt`.

## [105] - 2026-07-12 — Remediación integral identidad 2FA Fases 1–5

> **Estado:** código completado; pendiente de despliegue y pasos operativos
> (aplicar migración `0030_security_sessions_2fa.sql` en staging, configurar
> `ENCRYPTION_KEY` en producción, ejecutar runbook de rotación de credenciales).
> No se cambiaron credenciales productivas desde código.

### Security
- JWT con propósito explícito (`session`/`2fa_challenge`), challenge 2FA TTL 5 min,
  `jti` aleatorio con consumo atómico (compare-and-set en DB).
- `ENCRYPTION_KEY` dedicada y obligatoria para cifrar secretos TOTP (desacoplada
  de `JWT_SECRET`); `ENCRYPTION_KEY_PREVIOUS` para rotación controlada.
- Versión de sesión (`token_version`): la rotación de contraseña invalida tokens previos.
- Preview reemplazado por tokens opacos server-side (`preview_tokens`): un solo uso,
  expiración 1 h, HTML sanitizado con allowlist estricta.
- `/api/descargar` migrado de GET a POST (sin PII en URL), rate limiting, consent
  obligatorio, CAPTCHA-ready (Turnstile), `Cache-Control: private, no-store`.
- `lib/file-validation.ts`: validación por magic bytes (Zip Slip, extensión vs firma).
- Endpoint MCP demo eliminado (3 HIGH CVEs); dependencias MCP removidas (-6 paquetes).

### Added
- Runbook de backup/restauración: [`docs/security/runbook-backup-restore.md`](docs/security/runbook-backup-restore.md).
- Runbook de rotación de credenciales Fase 1: [`docs/security/runbook-rotacion-credenciales-fase1.md`](docs/security/runbook-rotacion-credenciales-fase1.md).

## [104] - 2026-07-16 — Corrección de pageviews GA4 y Consent Mode v2

### Fixed
- Visita inicial de GA4: `config` vuelve a emitir el `page_view` inicial y se
  ejecuta `afterInteractive` (eliminaba la carrera con el efecto de App Router).
- Duplicación SPA en Network: retirado el `page_view` manual; cambios History API
  delegados en GA4 Enhanced Measurement. Verificado un hit 204 por ruta.
- Stub de Clarity para usar la API oficial `window.clarity` (evitaba `a[c] is not
  a function`).
- OAuth Google alternativo endurecido (scopes mínimos, `state` anti-CSRF, callback
  limitado a localhost, token no mostrado, persistencia atómica).

### Changed
- Consent Mode v2 con banner accesible, elección granular, persistencia
  versionada 180 días, revocación y acceso desde el footer. GA4 y Clarity no
  descargan scripts antes de aceptar analítica; publicidad permanece denegada.
- Exportadores GA4/GSC paginados y ampliados (JSON/CSV atómicos, reintentos,
  timeouts, rangos configurables). Bing genera JSON y CSV.

---

*Changelog mantenido por el sistema de agentes. Cada entrada refleja cambios
reales; los estados (`VALIDADO`, `PENDIENTE`, `NO VALIDADO`) se respetan. Para
el detalle granular anterior a esta versión, consúltese el archivo histórico.*

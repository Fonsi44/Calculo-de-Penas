# Auditoría integral del repositorio Justicia Verdadera

**Fecha:** 2026-07-27  
**Alcance:** repositorio completo, archivo por archivo  
**Modo:** auditoría estática de solo lectura  
**Repositorio analizado:** `justicia-verdadera.zip`  
**Archivos:** 3,197  
**Carpetas:** 722  
**Tamaño lógico:** 108.0 MB

## 1. Veredicto ejecutivo

El repositorio contiene una aplicación amplia y funcionalmente ambiciosa, pero ha acumulado varias generaciones de arquitectura, auditorías, scripts de una sola ejecución, salidas de herramientas, backups y documentación que se sigue presentando como vigente. El problema principal no es estético: hoy existen bloqueos funcionales de autenticación e integraciones, fugas de scope en métricas SGIE, componentes activos que llaman APIs inexistentes y una estrategia de migraciones no reproducible desde cero.

**Veredicto:** no conviene empezar una reorganización masiva moviendo carpetas antes de corregir los fallos P0. Primero debe estabilizarse el comportamiento; después limpiar; finalmente imponer una forma profesional y automática de trabajar.

| Dimensión | Estado | Conclusión |
|---|---|---|
| Seguridad y acceso | CRÍTICO | El proxy bloquea rutas que deben autenticarse mediante challenge, token mágico, secreto de cron o firma webhook. |
| SGIE / intranet | ALTO | Hay métricas fuera de scope, calendario externo incompleto y servicios documentados pero desconectados del runtime. |
| Base de datos | CRÍTICO | 56 SQL frente a 39 entradas de journal; un entorno nuevo no tiene una ruta única y verificable de migración. |
| Código muerto/obsoleto | ALTO | 39 candidatos sin runtime, 19 módulos solo en tests, 90 scripts sin consumidor y 40 assets sin referencia estática. |
| Documentación | ALTO | 286 Markdown, enlaces absolutos rotos, fuentes canónicas contradictorias y auditorías históricas en la raíz. |
| Gobernanza | ALTO | AGENTS.md obliga a trabajar directamente sobre main y fomenta logs manuales crecientes. |
| CI y reproducibilidad | MEDIO-ALTO | La CI puede omitir controles si desaparece un script y no verifica migraciones, higiene, enlaces ni código muerto. |
| Validación dinámica | NO COMPLETADA | No fue posible instalar con npm 11 ni ejecutar lint/test/build en este entorno. |

## 2. Inventario cuantitativo

| Métrica | Resultado |
|---|---|
| Archivos inventariados | 3,197 |
| Carpetas | 722 |
| Líneas de código/configuración | 171,742 en 1,037 archivos |
| Markdown | 286 |
| Rutas API analizadas | 159 |
| Scripts de package.json | 129 |
| Archivos bajo scripts/ | 268 (243 activos + 25 archivados) |
| Archivos >300 líneas | 123 |
| Archivos >500 líneas | 43 |
| Archivos >1.000 líneas | 6 |
| Migraciones SQL | 56 |
| Entradas journal Drizzle | 39 |
| Grupos de duplicados exactos | 39 |
| Espacio duplicado recuperable | 3.5 MB |
| Enlaces Markdown locales rotos | 21 |
| Candidatos de assets sin referencia estática | 40 |

Distribución principal:

| Área | Archivos |
|---|---|
| docs | 1708 |
| app | 277 |
| public-assets | 259 |
| scripts | 243 |
| lib | 181 |
| components | 131 |
| tests | 127 |
| database | 87 |
| data | 63 |
| audit-output | 40 |
| root | 30 |
| scripts-archive | 25 |
| backups | 11 |
| hooks | 7 |
| ci | 3 |
| other | 2 |
| agent-local | 2 |
| generated-output | 1 |

## 3. Alcance y metodología

Se descomprimió el ZIP, se calculó inventario, hashes SHA-256, tamaños y líneas; se construyó un grafo de imports para TypeScript/JavaScript; se contrastaron scripts con `package.json`, CI, documentación y otros scripts; se compararon referencias API y páginas con el árbol de rutas; se revisaron controles de autenticación, CSRF, validación y firmas en 159 rutas; se analizaron enlaces Markdown, duplicados exactos, assets, dependencias y consistencia del journal de migraciones.

La revisión **archivo por archivo** está en el CSV adjunto. Cada fila incluye ruta, categoría, extensión, tamaño, líneas, hash, acción recomendada, prioridad, confianza y justificación. Un análisis estático no puede saber con certeza si una imagen se referencia desde una fila de base de datos o si un script se ejecuta manualmente fuera de `package.json`; por eso los borrados se dividen entre confirmados y candidatos con validación previa.

## 4. Hallazgos críticos P0

### P0-01 — El proxy invalida rutas públicas protegidas por mecanismos propios

**Evidencia:** `proxy.ts:31-61, 124-164` solo declara algunas APIs públicas. Cualquier otra `/api/*` exige cookie JWT antes de llegar al handler. Quedan bloqueadas, entre otras, `POST /api/auth/2fa/verify`, reset de contraseña, portal por token mágico, cron SGIE, webhook inbound de Resend, webhooks de firma y `/api/health/readiness`. Los handlers ya validan challenge, token, `CRON_SECRET` o firma; el proxy los intercepta antes.

**Acción:** Corregir con una clasificación explícita de rutas `session-auth`, `pre-auth`, `token-auth`, `webhook-auth`, `cron-auth` y `public`. Añadir tests de contrato que invoquen cada ruta sin JWT y comprueben que alcanza su handler.

**Nota:** No sustituir el bloqueo por una apertura genérica de prefijos; cada excepción debe quedar asociada al control real del handler.

### P0-02 — El flujo 2FA está implementado en backend pero roto en la interfaz

**Evidencia:** `app/api/auth/login/route.ts:96-116` responde `requiere2fa` y no crea sesión. `app/intranet/login/page.tsx:29-35` ignora ese campo, muestra éxito y redirige. Además, `/api/auth/2fa/verify` está bloqueada por el proxy.

**Acción:** Implementar estado de segundo paso, entrada TOTP/código de recuperación, conservación efímera del challenge, tratamiento de errores y E2E completo.

**Nota:** Hasta corregirlo, una cuenta con 2FA habilitado puede quedar sin acceso.

### P0-03 — Métricas SGIE fuera del scope del abogado

**Evidencia:** `app/api/sgie/metricas/autonomia/route.ts:14-31` calcula los expedientes accesibles pero no usa los IDs en las consultas. `app/api/sgie/cockpit/route.ts:81-92` devuelve correos fallidos globales a cualquier abogado/supervisor.

**Acción:** Crear una única abstracción de scope (`getAccessibleExpedienteIds` + builders de condiciones) y prohibir queries SGIE sin scope salvo admin explícito. Añadir tests con dos abogados y expedientes disjuntos.

**Nota:** Es una exposición de metadatos entre usuarios, aunque sean agregados.

### P0-04 — Migraciones no reproducibles

**Evidencia:** Hay 56 archivos SQL, pero `drizzle/migrations/meta/_journal.json` solo registra 39 entradas y termina en `0038_lively_silvermane`. Diecisiete migraciones desde `0038_fase4a...` hasta `0054_fase5b...` no forman parte del journal.

**Acción:** Elegir un único mecanismo: incorporar las migraciones al journal/snapshots o crear un runner propio con manifiesto, checksum, orden, transacción y tabla de control. CI debe levantar una DB vacía y aplicar todo desde cero.

**Nota:** No generar nuevas migraciones hasta cerrar esta decisión.

### P0-05 — Calendario externo activo con APIs inexistentes

**Evidencia:** `app/intranet/sgie/agenda/page.tsx` renderiza `CalendarExternalSection`, que llama status/privacy/sandbox/conflicts. En `app/api/sgie/agenda` solo existen `route.ts`, `[id]/route.ts` e `ics/feed/route.ts`.

**Acción:** Ocultar la sección mediante feature flag deny-by-default o completar todos los endpoints con tests de contrato. No dejar botones que siempre fallan.

**Nota:** El archivo `lib/sgie/calendar-sync.ts` de 759 líneas tampoco está conectado al runtime.

### P0-06 — Navegación rota en administración de delitos

**Evidencia:** Tres enlaces de `app/intranet/admin/delitos/page.tsx` apuntan a `/delito-form`; la ruta real está bajo `/intranet/admin/delito-form`.

**Acción:** Corregir enlaces, añadir test de navegación y centralizar rutas internas tipadas.

**Nota:** Es un fallo funcional directo y sencillo de cerrar.

## 5. Hallazgos altos P1

### P1-01 — Arquitectura PWA duplicada y obsoleta

**Evidencia:** El runtime actual usa `app/sw.js/route.ts` + `public/sw.template.js`. `scripts/build-sw.mjs`, `.gitignore` y `tests/fase3e-sw-build-determinism.test.ts` continúan validando `public/sw.js`/`sw.generated.js`; `postbuild` no ejecuta `build-sw`.

**Acción:** Eliminar el script y reescribir los tests contra el route handler, o volver oficialmente al build-time. No mantener ambos contratos.

### P1-02 — Simulador activo con datos aleatorios

**Evidencia:** `app/api/admin/simulador/route.ts:30-71` usa `Math.random()` y construye tareas, comunicaciones, transiciones y bloqueos ficticios. La ruta se consume desde la intranet y contradice la regla R3 de `AGENTS.md`.

**Acción:** Marcarlo claramente como demo no productiva y aislarlo, o generar una simulación determinista desde la definición real del procedimiento.

### P1-03 — CSRF inconsistente

**Evidencia:** Rutas autenticadas mutables como `app/api/admin/alertas/route.ts`, `reglas-comunicacion/route.ts` y `simulador/route.ts` no llaman al validador CSRF estándar.

**Acción:** Crear wrapper único `withAdminMutation`/`withSgieMutation` que aplique auth, CSRF, rate limit, schema y auditoría. Añadir test que enumere rutas mutables.

### P1-04 — Módulos declarados productivos, pero solo conectados a tests

**Evidencia:** Diecinueve módulos están en estado `test-only-candidate`. Destaca `lib/sgie/document-automation-orchestrator.ts`, señalado en ADRs y auditorías como punto de entrada productivo, pero importado únicamente por `tests/fase4a-orchestrator.test.ts`.

**Acción:** Para cada módulo: integrar mediante una ruta/job real y prueba de integración, o retirar código, tests y afirmaciones documentales. No aceptar 'implementado' como equivalente a 'archivo existente'.

### P1-05 — 39 candidatos de código fuente sin consumidor runtime

**Evidencia:** El grafo detecta componentes de blog/marketing/layout/SGIE y librerías como `lib/api-fetch.ts`, `lib/storage.ts`, `lib/google.ts`, `lib/places.ts`, `lib/calendar/*` sin entrada o importación productiva.

**Acción:** Eliminar en lotes pequeños después de buscar imports dinámicos, referencias en configuración y uso por DB. Cada lote debe pasar `npm run verify`.

### P1-06 — 90 scripts sin consumidor conocido

**Evidencia:** No aparecen en `package.json`, workflows, docs ni otros scripts. Varios son fases históricas, actualizaciones puntuales de DB, dumps, restores y editores de posts.

**Acción:** Crear manifiesto de scripts. Ejecutar validación histórica y clasificar como activo, one-off archivado, reemplazado o eliminable. No conservar scripts de modificación de DB sin owner, dry-run y rollback.

### P1-07 — Scripts con imports no resolubles

**Evidencia:** Se detectaron 31 imports que el analizador no pudo resolver, principalmente scripts que importan `../lib/db.js` o `../lib/schema.js` y herramientas archivadas.

**Acción:** Verificar su ejecución bajo `tsx`; corregir extensión/alias o archivarlos. Un script que no puede resolverse no debe figurar como herramienta operativa.

### P1-08 — `.gitignore` duplicado y contradictorio

**Evidencia:** El bloque principal se repite desde aproximadamente la línea 166. `!.env.example` queda posteriormente neutralizado por `.env*`; hay comentarios PWA obsoletos y `/output/` solo aparece en la segunda copia.

**Acción:** Reescribir desde cero, con secciones únicas y tests `git check-ignore`. Añadir `.backups/`, `.zcode/`, reportes de dependencias, outputs de auditoría y temporales.

### P1-09 — Política Git insegura y poco profesional

**Evidencia:** `AGENTS.md` R19 obliga a trabajar directamente sobre `main`, prohíbe ramas y PRs, y manda registrar casi toda operación en documentos crecientes de raíz.

**Acción:** Sustituir por ramas cortas, PR obligatorio, CI requerida, CODEOWNERS, plantilla de PR y changelog solo para cambios de usuario/release.

### P1-10 — Documentación sin fuente vigente única

**Evidencia:** Hay 13 documentos Markdown/MC en raíz, dos `Unreleased` en `CHANGELOG.md`, referencias a `pinedayasociados.md` inexistente en 20 archivos, y auditorías fechadas que se declaran canónicas.

**Acción:** Definir documentación viva por dominio, ADRs para decisiones y archivo por fecha. Cada documento vivo debe tener owner, estado, `last_reviewed` y fecha de caducidad/revisión.

## 6. Código muerto, obsoleto y desconectado

### 6.1 Clasificación correcta

- **Código muerto probable:** no tiene entrada runtime ni imports detectados. Se puede proponer borrado, pero debe descartarse carga dinámica o referencia desde configuración.
- **Código solo en tests:** no está muerto técnicamente; representa una funcionalidad que nunca se conectó al producto. Debe integrarse o retirarse junto con sus pruebas y documentación.
- **Código solo para scripts:** es tooling, no runtime. Debe vivir en `tools/` o en un paquete de scripts con contrato claro.
- **Script no referenciado:** puede ser una herramienta manual; no se borra hasta revisar historial Git, cabecera, dry-run y responsable.

### 6.2 Candidatos sin runtime (39)

| Ruta | Líneas |
|---|---|
| app/cargar/[token]/portal-carga-client.tsx | 175 |
| components/blog/lazy-blog-search.tsx | 26 |
| components/blog/legal-article-cta.tsx | 86 |
| components/blog/local-consult-form.tsx | 66 |
| components/domain/articulo-autocomplete.tsx | 268 |
| components/domain/calculadora/calculadora-header.tsx | 96 |
| components/layout/app-shell.tsx | 133 |
| components/layout/user-actions.tsx | 123 |
| components/marketing/google-reviews.tsx | 134 |
| components/marketing/intro-editorial.tsx | 56 |
| components/marketing/map-embed-lazy.tsx | 31 |
| components/marketing/service-blocks.tsx | 134 |
| components/marketing/social-share.tsx | 53 |
| components/marketing/testimonial-card.tsx | 186 |
| components/sgie/copilot-expediente.tsx | 113 |
| components/sgie/sgie-placeholder.tsx | 46 |
| components/ui/stepper.tsx | 102 |
| components/ui/table-pagination.tsx | 53 |
| lib/api-fetch.ts | 101 |
| lib/blog-helpers.ts | 99 |
| lib/cache-dashboard.ts | 23 |
| lib/calendar/provider.ts | 80 |
| lib/calendar/sandbox-provider.ts | 179 |
| lib/email-allowlist.ts | 70 |
| lib/email-staging-wrapper.ts | 105 |
| lib/faq-unified.ts | 88 |
| lib/file-validation.ts | 186 |
| lib/google-reviews.ts | 138 |
| lib/google.ts | 504 |
| lib/permissions.ts | 30 |
| lib/places.ts | 138 |
| lib/sgie/baselines-service.ts | 41 |
| lib/sgie/brief-jobs.ts | 30 |
| lib/sgie/calendar-sync.ts | 759 |
| lib/sgie/document-intelligence-jobs.ts | 34 |
| lib/sgie/risk-workload-jobs.ts | 78 |
| lib/sgie/search-indexer.ts | 122 |
| lib/storage.ts | 147 |
| lib/types/admin-dashboard.ts | 54 |

### 6.3 Módulos solo conectados a tests (19)

| Ruta | Líneas |
|---|---|
| app/types.ts | 52 |
| lib/calculo-validator.ts | 175 |
| lib/chat/knowledge-base.ts | 80 |
| lib/sgie/ai-evaluation-service.ts | 137 |
| lib/sgie/auto-vinculacion.ts | 262 |
| lib/sgie/clasificacion-documental.ts | 400 |
| lib/sgie/client-portal-service.ts | 191 |
| lib/sgie/document-automation-orchestrator.ts | 295 |
| lib/sgie/extraccion-estructurada.ts | 303 |
| lib/sgie/ia-router.ts | 423 |
| lib/sgie/inbound-service.ts | 101 |
| lib/sgie/motor-contradicciones.ts | 221 |
| lib/sgie/observabilidad.ts | 179 |
| lib/sgie/resumen-incremental.ts | 212 |
| lib/sgie/review-service.ts | 288 |
| lib/sgie/work-queue-service.ts | 441 |
| lib/sgie/workflow-simulation-service.ts | 266 |
| lib/sgie/workflow.ts | 286 |
| lib/test-db-guard.ts | 32 |

### 6.4 Módulos solo consumidos por scripts (6)

| Ruta | Líneas |
|---|---|
| lib/ai/deepseek-blog-review.ts | 347 |
| lib/ai/review-invariants.ts | 99 |
| lib/ai/review-status.ts | 145 |
| lib/ai/source-provenance.ts | 386 |
| lib/rag/chunking.ts | 239 |
| lib/rag/retrieval.ts | 244 |

### 6.5 Scripts sin consumidor conocido (90)

La lista completa está en la matriz CSV. Primeros 40 candidatos:

| Ruta |
|---|
| scripts/update-pension-db.ts |
| scripts/update-prestaciones-db.ts |
| scripts/extract-prestaciones.js |
| scripts/check-info-items.ts |
| scripts/update-changelog.js |
| scripts/fase7b-aplicar-correcciones-juridicas.ts |
| scripts/fase7-consolidar-lote-a-corregido.ts |
| scripts/fase5a-paquetes-revision-humana.ts |
| scripts/analyze-topics.js |
| scripts/fase7b-resolver-huerfanos.ts |
| scripts/fase7-aplicar-correcciones.ts |
| scripts/fase6-prepare-lote.ts |
| scripts/generar-inventario-completo.ts |
| scripts/test-auto-linker.ts |
| scripts/fase7c-crawl-134.ts |
| scripts/fase6d-restore-wrong.ts |
| scripts/restore-target-posts.ts |
| scripts/fase7b-corregir-titles.ts |
| scripts/fase7b-inventario-definitivo.ts |
| scripts/update-allanamiento-db.ts |
| scripts/update-prescripcion-db.ts |
| scripts/seo-update-ctas-tracking.ts |
| scripts/inspect-urls.mjs |
| scripts/check-delitos-articulos.mjs |
| scripts/fase6c-inventory.ts |
| scripts/fase7c-revalidacion-global.ts |
| scripts/fase3-migrate.ts |
| scripts/dump-target-posts.ts |
| scripts/edit-prescripcion.js |
| scripts/seo-collect-authenticated.mjs |
| scripts/edit-domesticas.js |
| scripts/fase3c-art71-bodies.ts |
| scripts/debug-body-text.ts |
| scripts/list-tables.mjs |
| scripts/debug-auto-linker.ts |
| scripts/edit-allanamiento.js |
| scripts/fase5a-aplicar-correcciones.ts |
| scripts/fase6-lote-aplicar-correcciones.ts |
| scripts/fase6-lote-setup.ts |
| scripts/fase6-calculate-inventory.ts |

**Criterio de borrado:** ningún candidato debe eliminarse en un macrocommit. Agrupar por dominio, ejecutar búsqueda en historial Git, comprobar que no exista runbook externo, y validar lint/typecheck/tests/build después de cada lote.

## 7. Auditoría de la web pública y blog

La web pública tiene una base amplia de rutas, datos jurídicos y SEO, pero la organización mezcla contenido canónico, derivados, auditorías live y herramientas editoriales. Los principales riesgos no son solo visuales:

- El blog convive con numerosas herramientas de corrección puntuales y auditorías por fases; varias ya no tienen consumidor.
- Existen componentes blog/marketing desconectados (`lazy-blog-search`, `legal-article-cta`, `local-consult-form`, `google-reviews`, `service-blocks`, `testimonial-card`, etc.).
- `app/(public)/blog/[categoria]/[slug]/page.tsx` supera 670 líneas y combina carga, SEO, render y reglas editoriales.
- `data/areas-juridicas.ts` y `data/landings-locales.ts` son grandes catálogos TS; deben separarse en datos validados + schemas, evitando lógica mezclada.
- Hay 40 assets sin referencia estática; antes de borrarlos hay que consultar `blog_posts`, `page_content` y cualquier campo de imagen en DB.
- Hay 39 grupos de archivos byte-idénticos, principalmente imágenes con nombres diferentes. Esto desperdicia espacio y dificulta saber cuál es la fuente canónica.

**Plan web/blog:** crear un catálogo de contenido y assets con IDs canónicos, schema validado, hash, origen/licencia y consumidores; mover tooling editorial a `tools/blog`; mantener solo comandos soportados; archivar reportes puntuales fuera de la raíz; separar componentes server/client y dividir la página de post en loader, metadata, body y módulos de conversión.

## 8. Auditoría de SGIE, Admin e intranet

- Hay dos endpoints de métricas de autonomía (`/api/sgie/metricas-autonomia` y `/api/sgie/metricas/autonomia`) con contratos y lógicas diferentes. Deben consolidarse o versionarse/deprecarse explícitamente.
- Cockpit, dashboard operativo, dashboard avanzado, brief y Mi Jornada solapan responsabilidades. Hace falta un catálogo API y un modelo de lectura común, no más endpoints ad hoc.
- El calendario mezcla feed ICS funcional, UI de proveedores externos incompleta y un servicio de sincronización desconectado.
- El simulador no representa el workflow real.
- Los servicios Fase 4A/4B/5 son numerosos; parte está activa y parte existe solo como módulo probado. La documentación actual no distingue correctamente `implemented`, `wired`, `enabled`, `validated in staging` y `enabled in production`.
- El acceso SGIE necesita tests de aislamiento por abogado en todas las consultas agregadas y listados.

**Modelo de estados obligatorio para funcionalidades:** `propuesta` → `implementada` → `conectada` → `validada` → `habilitada`. Un archivo y sus unit tests solo acreditan `implementada`; no `conectada` ni `habilitada`.

## 9. Auditoría de base de datos y datos

### 9.1 Schema monolítico
`lib/schema.ts` tiene más de 3.400 líneas. Debe dividirse por dominios (`auth`, `blog`, `legal`, `sgie`, `communications`, `audit`) y reexportarse desde un barrel compatible para evitar un cambio masivo inmediato.

### 9.2 Migraciones
La mezcla entre journal Drizzle y SQL manual posterior impide demostrar reproducibilidad. El readiness espera al menos 55 migraciones, pero el journal solo conoce 39. Esta discrepancia confirma que la aplicación y el sistema de migración no comparten una fuente de verdad.

### 9.3 Fuentes y derivados
`docs/Articulos` contiene PDFs legales pesados; `data/pdfs-extracted` y `data/pdfs-chunked` son derivados. La estructura debe separar:
- `sources/legal/`: fuente primaria + manifest con hash, jurisdicción, fecha y licencia.
- `generated/legal-text/`: texto extraído regenerable.
- `generated/rag/`: chunks/índices regenerables.
- DB/pgvector: índice productivo, nunca fuente primaria.

### 9.4 Backups
`.backups/` y `data/backups/` no deben permanecer en el repositorio. Mantenerlos en almacenamiento cifrado con retención y restauración probada; jamás como copias silenciosas junto al código.

## 10. Auditoría de scripts y automatizaciones

`package.json` tiene 129 scripts, con aliases duplicados (`auth:all`/`seo:doctor`, `bing:auth`/`auth:bing`, `analytics:audit`/`analytics:validate`, etc.). El volumen impide distinguir la interfaz soportada de comandos temporales.

**Estructura propuesta:**
```text
tools/
  cli/
    blog/
    seo/
    analytics/
    db/
    sgie/
  lib/
  one-off/
    archive/YYYY-MM/
  manifest.json
```

Cada script activo debe declarar `id`, `owner`, `status`, `purpose`, `command`, `dryRun`, `mutates`, `requiredEnv`, `rollback`, `lastValidated` y `expiresAt`. CI debe fallar si existe un script activo sin entrada en el manifiesto.

Los comandos públicos de `package.json` deben reducirse a una superficie estable, por ejemplo: `dev`, `build`, `verify`, `test:*`, `db:*`, `content:*`, `seo:*`, `ops:*`. Los one-off se ejecutan por ruta explícita y se archivan al terminar.

## 11. Auditoría documental

### Problemas confirmados
- Dos secciones `Unreleased` y releases fuera de orden en `CHANGELOG.md`.
- Referencias absolutas `file:///Users/...` y `file:///c:/Proyectos/...` en 21 enlaces.
- Veinte archivos hacen referencia a `pinedayasociados.md`, que no existe en el ZIP.
- `auditoriatotal.mc` y macroauditorías antiguas se presentan como canónicas.
- Documentos de handoff y auditoría repiten estado y porcentajes, pero no se invalidan al cambiar el código.
- Dos archivos de revisión humana del blog son duplicados exactos.

### Política documental profesional
1. La raíz solo conserva `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md` y archivos de configuración.
2. Documentos vivos bajo `docs/product`, `docs/architecture`, `docs/engineering`, `docs/operations`, `docs/security` y `docs/runbooks`.
3. Decisiones permanentes en `docs/adr/ADR-NNN-*`.
4. Auditorías puntuales en `docs/audits/archive/YYYY/MM/`; solo una auditoría vigente por dominio en `docs/audits/current/`.
5. Frontmatter obligatorio: `status`, `owner`, `created`, `last_reviewed`, `review_due`, `supersedes`, `superseded_by`.
6. Enlaces siempre relativos al repositorio.
7. Ningún documento puede declarar una función 'validada' sin una evidencia ejecutable o referencia de despliegue.

## 12. Auditoría de CI, tests y calidad

La CI instala Node 22/npm 11 y ejecuta lint, typecheck, tests, build y SEO. Sin embargo, primero comprueba si los scripts existen y, si faltan, los omite. Esto permite que una eliminación accidental de `lint` o `test` convierta la ausencia del control en un pipeline verde. Deben ejecutarse comandos fijos y fallar si no existen.

Controles ausentes recomendados:
- higiene de raíz y archivos ignorados;
- `knip` para archivos/exports/dependencias sin uso;
- enlaces Markdown;
- `gitleaks`;
- consistencia de migraciones y migración de DB vacía;
- contratos de rutas públicas/pre-auth/webhook/cron;
- aislamiento SGIE multiusuario;
- detección de duplicados (`jscpd` para código y SHA-256 para assets);
- presupuestos de tamaño de archivos;
- smoke E2E de login normal, 2FA, reset, portal mágico, cron y webhooks simulados.

Propuesta de comando canónico:
```json
{
  "scripts": {
    "verify": "npm run repo:hygiene && npm run lint && npm run typecheck && npm run test && npm run db:migrations:check && npm run test:contract && npm run build"
  }
}
```

## 13. Dependencias

El análisis estático encontró 16 dependencias sin imports directos. La mayoría son herramientas, tipos o configuración y no deben eliminarse automáticamente. `recharts` sí es un candidato claro a revisar; `@modelcontextprotocol/server-filesystem` parece tooling local; `@cyclonedx/cyclonedx-npm` se usa a través de un comando `npx`. Ejecutar `knip` y luego retirar solo dependencias confirmadas, regenerando lockfile y validando build.

No se pudo ejecutar `npm audit` ni verificar vulnerabilidades instaladas porque la instalación no se completó en este entorno. El repositorio exige npm ≥11 y el entorno disponible tenía npm 10.9.2; los intentos de instalar npm 11/dependencias agotaron el tiempo.

## 14. Estructura objetivo del repositorio

Se recomienda una reorganización incremental sin mover de golpe todo a `src/`, para reducir riesgo:
```text
/
├── app/                         # rutas Next.js, sin lógica de dominio pesada
├── components/
│   ├── ui/
│   ├── public/
│   ├── intranet/
│   └── sgie/
├── lib/
│   ├── core/                    # errores, logging, config, validación
│   ├── auth/
│   ├── db/
│   │   └── schema/              # schema por dominio + index.ts
│   ├── public/
│   ├── blog/
│   ├── sgie/
│   └── integrations/            # Resend, firma, calendario, IA, Blob
├── data/
│   └── canonical/               # solo fuentes pequeñas y versionables
├── sources/
│   └── legal/                   # manifest; binarios grandes preferentemente externos
├── drizzle/
│   └── migrations/              # un único mecanismo reproducible
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── e2e/
│   └── fixtures/
├── tools/
│   ├── cli/
│   ├── lib/
│   └── one-off/archive/YYYY-MM/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── engineering/
│   ├── operations/
│   ├── security/
│   ├── runbooks/
│   ├── adr/
│   └── audits/{current,archive}/
├── generated/                   # ignorado; todo regenerable
└── .local/                      # ignorado; agentes, backups y salidas locales
```

**Regla de dependencia:** `app` puede importar `components` y `lib`; `components` puede importar `lib` pero no `app`; dominios de `lib` no se importan circularmente; integraciones se consumen mediante interfaces; scripts usan APIs públicas de dominio, no tablas al azar.

## 15. Forma profesional de trabajar desde ahora

### 15.1 Flujo estándar de una función
1. Crear tarea con ID, objetivo, alcance, aceptación, riesgos, migraciones y rollback.
2. Rama corta `feat/JV-123-descripcion`, `fix/JV-123-*` o `chore/JV-123-*`.
3. Implementar verticalmente: schema/migración → dominio → ruta → UI → tests → docs.
4. Usar feature flag con owner y fecha de caducidad si la función no está lista para todos.
5. Ejecutar `npm run verify`.
6. Abrir PR con checklist, evidencia y capturas solo cuando aporten valor.
7. Revisión y CI obligatorias; squash merge; borrar rama.
8. Actualizar `CHANGELOG.md` solo si cambia comportamiento de usuario/release.
9. Archivar scripts one-off y eliminar outputs generados antes del merge.

### 15.2 Definition of Done
- Criterios de aceptación demostrados.
- Sin rutas/botones desconectados.
- Auth, scope, CSRF y rate limit según clasificación.
- Migración reversible/probada desde DB vacía.
- Unit + integración/contrato según el cambio.
- Logs, métricas y errores definidos.
- Runbook/ADR solo cuando corresponde.
- Sin archivos huérfanos, backups, dumps ni reportes live.
- Feature flag y código temporal con fecha de eliminación.
- `npm run verify` verde.

### 15.3 Reglas anti-basura automatizadas
- Allowlist de archivos permitidos en raíz.
- Prohibir `.backups`, `.zcode`, `output`, reportes de audit/deps y `file://`.
- Fallar por scripts activos sin manifiesto o con `expiresAt` vencido.
- Fallar por documentos vivos sin frontmatter/revisión.
- Fallar por migración SQL sin manifest/journal.
- Fallar por imports de capas prohibidas y ciclos.
- Reportar archivos sin uso; el umbral no debe crecer.
- Reportar duplicados y assets sin consumidor; baseline decreciente.
- Presupuesto orientativo: 300 líneas por módulo, 500 con justificación; excepciones explícitas para datos generados/tests.

## 16. Plan de ejecución priorizado

| Fase | Prioridad | Contenido | Salida |
|---|---|---|---|
| Fase 0 — estabilización | P0 | Proxy/rutas especiales; 2FA; scope SGIE; calendario roto; enlaces delitos; CSRF; congelar migraciones. | Sistema funcional y sin bloqueos conocidos. |
| Fase 1 — higiene estructural | P1 | Reescribir ignore; retirar locales/backups/output; limpiar PWA antigua; ordenar raíz; normalizar docs. | Raíz mínima y artefactos fuera del código. |
| Fase 2 — depuración | P1-P2 | 39 candidatos runtime, 19 test-only, 90 scripts, 40 assets, duplicados, dependencias. | Matriz resuelta con evidencia por elemento. |
| Fase 3 — arquitectura | P2 | Dividir schema y módulos >500; consolidar APIs métricas/dashboards; separar tooling y fuentes/derivados. | Límites de dominio claros y menor acoplamiento. |
| Fase 4 — gobernanza/CI | P1-P2 | Nuevo AGENTS/CONTRIBUTING, ramas/PR, CODEOWNERS, verify, hygiene, migrations, contracts. | El desorden deja de poder entrar por CI. |
| Fase 5 — mantenimiento | Continuo | Revisión mensual de deuda, flags, scripts vencidos, docs y assets. | La deuda se mantiene estable o decrece. |

### Orden recomendado de PRs
1. `fix/security-special-routes-and-2fa`
2. `fix/sgie-scope-and-calendar-contracts`
3. `fix/migration-source-of-truth`
4. `chore/repository-ignore-and-root-hygiene`
5. `chore/pwa-obsolete-flow-removal`
6. `docs/canonical-documentation-reset`
7. `chore/scripts-manifest-and-archive`
8. PRs pequeños de código muerto por dominio
9. `refactor/schema-domain-split`
10. `ci/professional-quality-gates`

## 17. Qué no debe borrarse todavía

- Assets sin referencia estática hasta cruzarlos con la base de datos.
- Archivos IndexNow/Bing de verificación hasta comprobar la configuración de proveedores.
- Módulos `test-only` sin decidir si la función debe integrarse.
- Migraciones manuales hasta verificar qué se aplicó en Neon y construir un manifiesto con checksums.
- PDFs legales sin inventario de origen/licencia/hash y copia externa segura.
- Scripts de restore/dump hasta comprobar backups y runbooks; después deben archivarse fuera de la superficie activa.

## 18. Criterios de cierre de la reorganización

La reorganización se considera cerrada cuando:
- La raíz cumple allowlist.
- No hay rutas pre-auth/webhook/cron bloqueadas por el proxy.
- Login normal, 2FA, reset, portal mágico y jobs tienen E2E/contract tests.
- Todas las queries SGIE pasan pruebas de aislamiento.
- Una DB vacía llega al schema actual con un solo comando.
- Cero migraciones fuera del manifiesto.
- Cero scripts activos sin manifest y cero one-off vencidos.
- Cero enlaces `file://` en docs vivas.
- Cero documentos que se declaren canónicos sin owner/revisión.
- Los candidatos de código muerto tienen decisión registrada.
- `npm run verify` es obligatorio y verde en PR.

## 19. Limitaciones y validación pendiente

Esta auditoría es estática. No se modificó el repositorio. No se ejecutaron `lint`, `typecheck`, tests ni build porque la instalación de dependencias no concluyó en el entorno de auditoría y la versión disponible de npm era 10.9.2 frente al requisito npm ≥11. Antes de borrar o mover código deben repetirse las validaciones en Node 22 + npm 11, con variables seguras y una base de datos aislada.

No se confirmó ningún secreto de producción hardcodeado; los diez patrones detectados corresponden principalmente a placeholders/tests/workflows. Aun así, debe ejecutarse `gitleaks` sobre todo el historial, no solo el snapshot del ZIP.

## 20. Anexos

- Inventario archivo por archivo con acción recomendada.
- Matriz de código muerto, scripts, assets, duplicados, dependencias e imports no resueltos.
- CSV técnicos de reachability, scripts, API, páginas, dependencias, enlaces, duplicados, assets, controles de rutas, smells y secretos.

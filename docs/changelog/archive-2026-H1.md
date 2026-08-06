---
status: historical
owner: engineering
created: 2026-07-18
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Histórico de cambios — Releases 91 a 110 (H1 2026)

> Archivo de detalle histórico movido desde `CHANGELOG.md` para mantener el
> changelog principal breve y orientado a lo vigente. **No se ha reescrito ni
> omitido ningún hecho**: lo que sigue es el registro original, conservado tal
> cual, con sus estados (`VALIDADO`, `PENDIENTE`, `NO VALIDADO`) intactos.
>
> Para lo vigente y reciente ver [`/CHANGELOG.md`](../../CHANGELOG.md).

---

## 2026-07-16 — Corrección de pageviews GA4

- Corregida la visita inicial de GA4: `config` vuelve a emitir el `page_view` inicial y se ejecuta `afterInteractive`, eliminando la carrera con el efecto de App Router.
- Añadidas validaciones de formato para IDs GA4/GTM y exclusión de previews, con opt-in explícito para pruebas.
- Añadidas pruebas unitarias y documentación de configuración/validación sin secretos.
- Consent Mode v2 completado con banner accesible, elección granular, persistencia versionada durante 180 días, revocación y acceso desde el footer.
- GA4 y Clarity no descargan scripts antes de aceptar analítica; publicidad permanece denegada.
- Exportadores GA4/GSC paginados y ampliados; JSON/CSV atómicos, reintentos, timeouts y rangos configurables. Bing genera JSON y CSV.
- Facebook Pixel queda deshabilitado mientras no exista consentimiento publicitario; los dry-runs Google no escriben ni siquiera al fallar y el recolector limita cada subproceso a 120 segundos.
- Corregido el stub de Clarity para usar la API oficial `window.clarity` y evitar el error productivo `a[c] is not a function`.
- Endurecido OAuth Google alternativo: scopes mínimos de lectura, `state` anti-CSRF, callback limitado a localhost, token no mostrado y persistencia atómica.
- Centralizada la detección de gcloud para reconocer la instalación autorizada en `C:\gcloud-sdk` aunque no esté incluida en `PATH`.
- Renovado OAuth de lectura y validados GA4/GSC/Bing; añadida comprobación Analytics Admin de propiedad, stream, zona horaria, retención y eventos clave sin exponer identificadores completos.
- Validación remota de Consent Mode completada en Preview temporal; detectada
  ausencia de los IDs públicos GA4/Clarity en el entorno Preview. El deployment
  y bypass temporales se retiraron sin modificar Production.
- Corregida la duplicación SPA observada en Network: se retiró el `page_view`
  manual y se delegaron cambios History API en GA4 Enhanced Measurement.
  Verificado un hit 204 por ruta, sin reinyección de GA4/Clarity.

## 2026-07-12 — Remediación integral Fases 1-5

### Fase 1 — Cierre de seguridad crítica
- `invalidateFreshness()` cableado en 7 puntos de mutación crítica (cambio de contraseña, reset admin, bloqueo, rol, desactivación, logout, reset por email).
- `consumirTokenReset` ahora incrementa `tokenVersion` + resetea `mustChangePassword` (revoca sesiones tras reset por email).
- `lib/permissions.ts` reconciliado: `AuthError` canónico de `lib/auth.ts` con `status: 403`.

### Fase 2 — Preview y controles de contenido
- Preview reemplazado: tokens opacos server-side (`preview_tokens`) en lugar de JWT con contenido en URL. Un solo uso, expiración 1h, HTML sanitizado con allowlist estricta.
- Página de preview requiere autenticación (redirect a login si no hay sesión).
- Proxy añade `x-correlation-id` en todas las respuestas para trazabilidad.
- `/api/oauth/callback` removido de rutas públicas (ahora requiere auth vía proxy).
- Migración 0031: tabla `preview_tokens` con índices y FK.

### Fase 3 — Documentos y endpoints públicos
- `lib/file-validation.ts`: validación por magic bytes (JPEG, PNG, WebP, AVIF, PDF, ZIP/DOCX) con detección de Zip Slip, extensión vs firma, y límites.
- Admin upload route usa `validateImage()` con magic bytes (no confía en MIME del cliente).
- `/api/descargar` migrado de GET a POST: email/área en body (sin PII en URL), rate limiting 5/15min, consent obligatorio, CAPTCHA-ready (Turnstile), caché server-side de PDFs, `Cache-Control: private, no-store`.
- SGIE `/api/public/cargar` ya tenía validación por magic bytes (verificado).

### Fase 4 — Dependencias, testing, CI
- Endpoint MCP demo (`app/api/[transport]/`) eliminado: sin consumidores, 3 HIGH CVEs.
- Dependencias MCP removidas: `mcp-handler`, `@modelcontextprotocol/*` (-6 paquetes).
- ESLint: 0 errores, 0 warnings (6 unused imports corregidos en readiness, autonomía).
- SBOM: `@cyclonedx/cyclonedx-npm` (devDep) + script `sbom:generate`.
- Scripts `deps:audit` y `deps:outdated` para CI.
- 10 vulnerabilidades moderadas restantes documentadas (transitivas: googleapis, next, drizzle-kit, postcss, esbuild).

### Fase 5 — Integridad jurídica, RAG, operaciones
- Auditoría de delitos: 483 analizados, 25 críticos (penas 0-0), 142 sin rama, 483 sin clasificación. Reporte en `data/auditoria-delitos-report.json`. Correcciones requieren validación humana con fuentes canónicas.
- Embeddings: proveedor deepseek-embedding, 1536 dimensiones, consistente entre `.env.example`, `lib/rag/config.ts` y AGENTS.md.
- Runbook de backup/restauración: `docs/security/runbook-backup-restore.md` (Neon PITR, Vercel Blob, rotación de secretos, SLOs, DRP, mantenimiento periódico).

---

## Seguridad — Fase 1 de identidad (código completado, pendiente de despliegue y pasos operativos)

- JWT con propósito explícito (`session` / `2fa_challenge`), challenge 2FA con TTL 5 min, `jti` aleatorio y consumo atómico persistente (compare-and-set en DB).
- `ENCRYPTION_KEY` dedicada y obligatoria para cifrar secretos TOTP (desacoplada de `JWT_SECRET`); `ENCRYPTION_KEY_PREVIOUS` para rotación controlada.
- Versión de sesión (`token_version`): la rotación de contraseña invalida tokens previos; verificación en proxy + handlers `require*` con validación DB y caché corta para mitigar impacto en latencia.
- Ámbito de clientes aplicado dentro de la query DB (SELECT/UPDATE vía EXISTS condicionado), 404 indistinguible para cliente ajeno, sin fuga de UUID en creación/reutilización.
- Guard anti-producción para tests con escritura (regex reforzada, cableado en arranque de vitest).
- `rate-limit` fail-closed para prefijo `2fa` en producción, limitación por userId+IP.
- Suite de pruebas obligatoria: 28 tests nuevos (matriz IDOR clientes, verify 2FA, concurrencia jti, revocación token_version, guard DB); cobertura de auth.ts 86 % y clientes-db.ts 67 %.
- Requiere: aplicar migración `0030_security_sessions_2fa.sql` en staging, configurar `ENCRYPTION_KEY` en producción, ejecutar runbook de rotación de credenciales. No se cambiaron credenciales productivas desde código.

---

## [Unreleased] - 2026-07-10 — Saneamiento Site Audit Ahrefs (enlaces 4xx/3xx, sitemap, H1)

Corrección técnica SEO basada en el análisis de 6 CSV exportados de Ahrefs (crawl 10-jul-2026). Diagnóstico completo en `auditoria_seo/ahrefs_2026_07_10/ahrefs-diagnostico-inicial.md`. Solo correcciones técnicas localizadas; sin reescritura editorial.

### `fix(seo): enlaces internos rotos (4xx) y redirigidos (3xx)`
- **2 enlaces 4xx corregidos** en `app/(public)/hondurenos-en-espana/page.tsx`: los href a `/servicios-juridicos/derecho-notarial` y `/servicios-juridicos/derecho-civil` (slugs inexistentes) ahora apuntan al slug canónico `/servicios-juridicos/derecho-civil-y-notarial`. Los otros 6 enlaces 4xx del CSV son artefactos de crawl sin referencia real (ya documentados en `next.config.ts:176-181`).
- **8 posts despublicados** (`published=false`) cuyas rutas están redirigidas (301) en `next.config.ts` hacia URLs consolidadas, pero seguían publicados → generaban **114 enlaces internos a 3xx** vía sitemap, `BlogHighlights`, navegación prev/next y landings. Slugs: `abogado-penalista-choluteca`, `despido-injustificado-honduras-derechos-trabajador`, `empleador-no-paga-salario-honduras`, `calcular-prestaciones-laborales-honduras`, `despido-laboral-honduras-derechos`, `tramites-notariales-frecuentes-honduras`, `elegir-bufete-abogados-nacaome`, `elegir-bufete-multidisciplinario-ventajas-honduras`. Los redirects 301 se mantienen intactos. Script: `scripts/seo-unpublish-consolidated-posts.ts` (dry-run por defecto, con verificación post-escritura).

### `fix(seo): sitemap sin URLs 3xx`
- Añadido `/blog/derecho-penal/abogado-penalista-choluteca` a `REDIRECT_SOURCE_PATHS` en `app/sitemap.ts` (era el único target 3xx que el sitemap seguía incluyendo; los otros 7 ya estaban excluidos). Defensa en profundidad junto a la despublicación.

### `fix(blog): jerarquía H1 (R15)`
- 3 posts con doble `<h1>` en el body corregidos (h1→h2) vía `scripts/normalizar-blog.ts --aplicar --solo-h1`: `banco-demanda-deuda-defensa-opciones-honduras`, `como-preparar-demanda-guia-no-abogados-honduras`, `habilitacion-clinicas-hospitales`. La plantilla ya renderiza el título como `<h1>` (`page.tsx:392`).

### Validación
- `lint` (0 errores), `tsc --noEmit` (EXIT 0), `blog:normalizar` (dry-run OK), `build` (354/354 páginas estáticas, 0 errores), `test` (861/861).
- Sitemap: 0 de los 8 slugs viejos entrarían al filtro `published=true`.
- Canonicals: 816 revisados, 0 problemas (paginación y facetas son noindex con canonical self, correcto).
- Documentación: `auditoria_seo/ahrefs_2026_07_10/` (diagnóstico, correcciones, post-validación, pendientes, 4 CSV de revisión, URLs candidatas IndexNow).

### Clasificación (R11)
- **VALIDADO**: enlaces 4xx, despublicación 8 posts, exclusión sitemap, H1×3, canonicals.
- **PENDIENTE**: validación de schema.org con Rich Results Test (sin CSV `all_issues` en este lote); noindex de páginas core en runtime (post-deploy); reemplazo de slugs viejos en landings (`BlogHighlights`) para mantener densidad de enlazado.

## [Unreleased] - 2026-07-10 — Fase 1.5: Optimización Manual de 5 Posts Estratégicos (SEO Quirúrgico)

Ejecución de la Fase 1 del plan de contenidos, enfocada exclusivamente en la mejora **manual, individual y quirúrgica** de contenido existente. Se evitó cualquier reescritura masiva o uso de plantillas genéricas para preservar la línea editorial y el tono corporativo de Pineda y Asociados.

### `feat(seo): Optimización de Contenido (Fase 1)`
- **`pension-alimenticia-porcentaje-honduras-2026`**: Eliminadas aseveraciones arriesgadas sobre porcentajes fijos judiciales. Añadida explicación sobre el Principio de Proporcionalidad y FAQ de prescripción.
- **`allanamiento-ilegal-violacion-domicilio-honduras`**: Reestructuración del H2 inicial para capturar el Featured Snippet del horario legal (6:00 a.m. a 6:00 p.m. Art. 212 CPP). Clarificación de 4 excepciones legales para allanamientos nocturnos.
- **`prescripcion-deudas-plazos-honduras`**: Corrección crítica técnica (plazo civil general ajustado a 10 años). Diferenciación clara entre vía ejecutiva mercantil y vía ordinaria civil. Añadida prevención sobre tácticas de cobranza extrajudicial.
- **`calcular-prestaciones-laborales-honduras`**: División semántica entre Derechos Adquiridos (renuncia) e Indemnizaciones (despido). Corrección del plazo de prescripción por despido a 60 días hábiles. Inserción de Disclaimer fuerte sobre el cálculo orientativo.
- **`contratos-empleadas-domesticas-obligaciones-honduras`**: Suavizado de tono alarmista hacia uno de asesoría patronal preventiva. Precisión sobre cobertura geográfica del IHSS. Nuevo CTA enfocado a empleadores domésticos.

### Validación post-implementación
- Confirmación de renderizado y metadatos SEO en `.next/server/app/`. Todas las optimizaciones están integradas, el schema se valida correctamente y no hay enlaces internos rotos.
- Establecida la lista de control de 7/14/30 días para monitorear impacto en GSC y Bing Webmaster Tools.

## [Unreleased] - 2026-07-10 — Recrawling IndexNow y Validación de Correcciones Bing WMT

Ejecución de la fase de validación técnica y recrawling en Bing WMT para agilizar la actualización del índice tras la corrección masiva de errores de rastreo (511 4xx).

### `feat(seo): Validación y envío de URLs saneadas a IndexNow`
- **Validación Técnica Local**: Se desarrolló el script `seo-validate-recrawl.mjs` que extrajo y analizó 135 URLs afectadas (obtenidas de GSC, sitemap y auditorías previas), verificando status HTTP 200, metadatos `robots`, `x-robots-tag`, y consistencia canonical mediante peticiones reales (fetch).
- **Limpieza de Señales**: Se descartaron 8 URLs (404s intencionales y canonical overrides, por ej. `blog?page=3` y antiguas URLs parametrizadas) garantizando que ninguna URL no indexable fuera sometida a recrawling.
- **IndexNow Submission**: Se desarrolló el script `seo-submit-indexnow.mjs` que sometió exitosamente 127 URLs validadas a la API de IndexNow (api.indexnow.org) en lotes controlados (≤50 URLs), generando un archivo de clave de autenticación local.
- **Trazabilidad y Control**: Todos los entregables, listados de URLs aceptadas (dry-run y finales), CSVs, y logs detallados (status 202 Accepted) fueron guardados en el nuevo directorio de persistencia `auditoria_seo/recrawl_bing/`, incluyendo el documento `checklist-post-recrawl.md` para monitoreo continuo a 24h, 72h, 7d y 14d.

## [Unreleased] - 2026-07-09 — Implementación SEO prioritaria GSC y Bing

Implementación directa de las mejoras SEO prioritarias detectadas tras cruzar datos reales de Google Search Console, Bing Webmaster Tools y GA4.

### `feat(seo): Fase 6 - Cierre de Producción y Políticas de Versionado`
- **Checklist Post-Deploy**: Creado `data/seo/post-deploy-seo-checklist.md` con 10 pasos tácticos de ejecución obligatoria al desplegar cambios de SEO/Growth a producción (Validación de disponibilidad, robots, sitemap, GSC/WMT y GA4 tracking orgánico).
- **Política de Versionado de Reportes SEO**: Actualizado `.gitignore` permitiendo la gestión de conocimiento documentada (`.md` en `data/seo/`) pero excluyendo terminantemente datos transitorios (`data/seo/*.json` y `data/seo/history/`) asegurando un repositorio limpio.
- **Limpieza de Entorno**: Verificada la pureza técnica del repositorio, confirmando la ausencia de logs residuales o scripts colgados post-Fase 5.
- **Validación Final**: Completadas exitosamente las pruebas de regresión en producción-ready (828 tests aprobados, `npm run build` OK, y cero incidencias en `lint`/`tsc`).

### `feat(seo): Fase 4/5 - Auditoría avanzada, preparación Bing y tracking GTM`
- **Mejora en Auditor de Indexabilidad**: `seo-indexability.ts` ahora se conecta a Drizzle ORM para obtener las rutas dinámicas publicadas del blog e inyecta dinámicamente las rutas de `blogCategories`, eliminando los 11 falsos positivos de "Tráfico Huérfano" que surgían al comprobar únicamente el `canonical-paths.json` estático.
- **Preparación Bing WMT**: Creado directorio `data/bing/` y documento `README.md` que establece la plantilla y el procedimiento operativo estándar (SOP) para extraer y procesar manualmente los 455 errores 4xx / 721 crawl errors mediante CSV, bloqueado por limitaciones de la API pública de Bing WMT.
- **Validación Tracking CTAs**: Confirmada la solidez técnica del script `seo_blog_cta_click` en `components/analytics-scripts.tsx`, implementado bajo listener nativo único y captura semántica de `data-cta-location`, `destination_url`, `source_url`, `cta_topic`. No genera dobles ejecuciones.
- **Operaciones SEO Mensuales**: Redactado y formalizado el documento `docs/seo-monthly-ops.md` estableciendo el checklist riguroso de 28 días (Baseline, Extracción, Saneamiento, Validación).
- **Snapshot Histórico**: Automatizada la rotación histórica de `gsc-live.json`, `ga4-live.json` y reportes al ejecutar `seo-snapshot.ts`, permitiendo backups seguros en `data/seo/history/` previo a cada nuevo ciclo de auditoría.
- **Redirecciones 301 Intencionales Documentadas**: Verificado que las 9 URLs marcadas como "Tráfico Huérfano" (ej: `/blog/derecho-de-familia/pension-alimenticia-honduras-como-solicitarla`) se deben a redirecciones 301 activas e intencionales en `next.config.ts`, siendo en realidad "Rutas históricas sin acción" originadas por retención de tráfico en GSC.

### `feat(seo): Cierre Técnico de Medición y Auditoría de Indexabilidad (Fase 3)`

### `feat(seo): CTAs transaccionales y metadata en posts prioritarios`
- **Posts actualizados en DB** (vía script `seo-update-blog-ctas.ts`):
  - `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026`: H1 (`title`), `metaTitle` y `metaDescription` optimizados con el año "2026" y el enfoque "Porcentajes y Cálculo".
  - `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`: Meta optimizada sobre plazos y requisitos.
  - `/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras`: Meta optimizada sobre demandas e indemnización.
- **Inyección de CTAs**: Añadido un componente HTML al final del cuerpo de cada uno de los 3 posts anteriores para redirigir tráfico internacional cualificado (ej. España/USA) hacia `/solicitar-consulta`. Se usó HTML semántico con clases nativas del framework (`bg-slate-50`, `text-primary`, etc.).

### `fix(seo): Landing Hondureños en España como Hub Transfronterizo`
- **`app/(public)/hondurenos-en-espana/page.tsx`**:
  - Actualizados `title` y `description` para enfocarse en la intención de búsqueda real: "Abogados en Honduras para Hondureños en España".
  - Reforzados los enlaces internos del bloque "Trámites más frecuentes" hacia servicios específicos de familia, civil y notarial (ej. Divorcio en Honduras residiendo en España).

### `fix(seo): Configuración Crawler y Sitemap`
- Verificada exclusión correcta de rutas `/intranet/`, `/api/` y `/admin/` en `robots.ts` para mitigar 455 errores 4xx reportados por Bing.
- Sitemap y rutas canónicas validadas de forma exitosa (Sitemap self-referencing operando correctamente).

### `feat(seo): Auditoría Bing WMT y Analytics CTA`
- **Documentación Limitación Bing**: Se generó `data/seo/bing-crawl-errors-detailed.json` detallando que el API de Bing (GetCrawlStats) reporta los 455 errores 4xx y 721 crawl errors a nivel agregado, pero no expone un endpoint público para descargar las URLs específicas, requiriendo exportación vía web dashboard.
- **Indexabilidad de URLs**: Se creó un script que cruza rutas estáticas con datos de GSC y GA4 para generar un reporte automático `url-indexability-audit.md` y clasificar URLs por indexabilidad y tráfico, comprobando la consistencia entre fuentes.
- **Medición GA4 para CTAs Orgánicos**: Se actualizó el HTML de los CTAs inyectados en la DB agregando el atributo `data-event-name="seo_blog_cta_click"`, lo cual permite implementar mediciones pasivas por Tag Manager u observadores de eventos sin saturar la arquitectura actual con scripts invasivos.

---

## [Unreleased] - 2026-07-07 — Saneamiento SEO Ahrefs Fases A–G (6 CSV nuevos)

Corrección de las incidencias reportadas por los 6 CSV nuevos de Ahrefs:
`title-too-long` (128 URLs), `meta-descripti` ×2 (41 largas + 17 cortas),
`orphan-page` (8 URLs con 0 inlinks), `pages-to-submit` (inventario) y
`structured-data` (212 URLs con errores Schema.org). La Fase 1 y la Fase 6
parcial (validador DB) ya estaban hechas; este release ejecuta las fases
pendientes ahora que los CSV existen.

### `fix(seo): titles largos — Fase A (128 → 0 esperado tras recrawl)`

- **`scripts/fix-long-titles.ts`** (nuevo): script idempotente (dry-run/
  `--aplicar`, backup-required <2h) que corrige `blog_posts.title` y
  `blog_posts.meta_title` con reglas deterministas:
  - Decodifica entidades HTML visibles (`&oacute;` → `ó`, `&ntilde;` → `ñ`).
  - Elimina sufijos de placeholder (`| [Tu Empresa]`) y marca redundante
    (`| Pineda y Asociados` — el template lo reañade en runtime).
  - Compacta patrones verbosos ("Guía Completa | Requisitos y Trámites" →
    "Requisitos y Trámites", elimina ", Honduras" redundante).
  - Recorta a ≤49 chars DB (→ ≤70 renderizado con marca) prefiriendo cortes
    naturales en `:` o `,`.
- **DB**: aplicado a 149 posts publicados (261 campos corregidos en 2 pasadas;
  idempotente: 0 cambios en tercera corrida).
- **7 páginas estáticas** con titles largos corregidas manualmente:
  - 5 cargo landings (`abogado-civil/familia/laboralista/penalista-nacaome`,
    `abogado-penalista-choluteca`): `title` → `{ absolute }` con marca única
    ≤48 chars. También reescritas sus meta descriptions (sin "Consulta sin
    costo. WhatsApp +504..." claim no verificable).
  - 2 templates `[slug]` (`derecho-penal/[slug]`, `hondurenos-en-espana/[slug]`):
    sufijo `· Abogados Penalistas` / `· Abogados Honduras-España` (23-28 chars)
    reemplazado por `| ${site.name}` (alinea con patrón de blog).
- **`package.json`**: añadido `blog:fix-titles` / `:aplicar`.

### `fix(seo): metas cortas — Fase B (17 categorías → 17 ampliadas)`

- **`data/blog/categories.ts`**: 17 `descripcion` de categorías ampliadas de
  74–97 chars a 120–155, con contexto hondureño y precisión jurídica. Una sola
  fuente alimenta meta description + H visible + OG + Twitter. Sin inventar
  servicios ni claims (R4/R13). Las 3 restantes (<110 pero no en CSV) también
  ampliadas a ≥120 para coherencia.

### `fix(seo): metas largas/truncadas — Fase C (41 → 0 esperado tras recrawl)`

- **`lib/seo.ts`**: nuevo helper `buildServiceMetaDescription(html)` que
  sanitiza HTML (vía `stripHtml` de `lib/strip-html.ts` con `sanitize-html`),
  recorta a 120–155 chars en límite de palabra, sin CTA fijo. Sustituye al
  patrón bug `${descripcion.substring(0,N)} Consulta confidencial...`.
- **3 familias corregidas**:
  - `servicios-juridicos/[slug]`: meta + OG + Twitter ahora usan el helper.
  - `derecho-penal/[slug]`: antes pasaba `grupo.descripcion` crudo (HTML) sin
    stripHtml → dejaba `<strong>`/`<a>` en la meta.
  - `hondurenos-en-espana/[slug]`: antes rompía meta + OG + Twitter con HTML
    crudo y truncamiento mid-word.
- **5 landings locales** (Namasigüe, Orocuina, Pespire, Marcovia, El Triunfo):
  `description` en `data/landings-locales.ts` reescrita a 120–155 chars,
  eliminando "Primera consulta sin costo. WhatsApp +504 9536-3724." (claim no
  verificado como política global).
- **`scripts/fix-long-metas.ts`** (nuevo): script idempotente que recorta
  `blog_posts.meta_description` a ≤155 en límite de palabra y elimina sufijos
  de relleno comercial ("Asesoría legal.", "¡Evita multas!", "¡Proteja sus
  derechos!"). Aplicado a 149 posts (46 corregidos; idempotente).
- **`package.json`**: añadido `blog:fix-metas` / `:aplicar`.

### `fix(seo): orphan pages — Fase D (8 URLs con 0 inlinks → enlazadas)`

- **`app/(public)/abogados-en-nacaome/page.tsx`** (sede): añadidos 2 bloques
  contextuales de chips:
  - "Especialistas por área en Nacaome" → 3 cargo landings (civil, familia,
    laboral) + penalista-nacaome.
  - "Cobertura legal en el sur de Honduras" → 5 ciudades secundarias (langue,
    caridad, alianza, concepcion-de-maria, san-antonio-de-flores).
- **`app/(public)/servicios-juridicos/[slug]/page.tsx`**: bloque condicional
  "¿Busca un especialista en Nacaome?" enlaza a la cargo landing
  correspondiente cuando `slug` es familia/laboral/civil.
- Cada orphan recibe ahora ≥1 href inlink HTML real (no solo sitemap). Respeta
  R18 (las 5 secundarias NO van al footer global).

### `fix(seo): structured data — Fase F (212 errores → 0 esperado tras recrawl)`

- **Bug raíz `@context` en `@graph`**: cada uno de los 6 schemas del grafo
  global (`legalServiceSchema`, `organizationSchema`, `websiteSchema`,
  `founderSchema`, `thaniaSchema`, `emilSchema` en `lib/site.ts`) incluía su
  propio `@context: "https://schema.org"`, lo cual es inválido dentro de un
  `@graph` (el `@context` debe estar solo en el wrapper). Eliminado de los 6
  nodos; el wrapper `@graph` en `app/(public)/layout.tsx` ya lo aporta.
- **AggregateRating Home eliminado**: `components/marketing/google-reviews.tsx`
  emitía `AggregateRating` con `reviewCount: 1` (causaba "Google rich results
  validation error"). Eliminado por política de self-serving reviews (sin
  corpus robusto y auditable de reseñas reales). Las reseñas visibles (UI)
  siguen renderizándose.
- **`@id` slash unificado**: las 5 cargo landings usaban `${site.url}#website`
  / `${site.url}#legal-service` (sin slash), mientras el grafo global define
  `${site.url}/#website`. Unificado a formato con slash para que la resolución
  `@id` funcione en el Knowledge Graph.
- **`scripts/validate-jsonld.mjs`** ampliado: detecta `@context` dentro de
  nodos del `@graph`, `AggregateRating` (warning), y reglas mínimas por
  `@type` (Service→provider, BlogPosting→author+publisher, FAQPage→mainEntity
  no vacío). Añadidas rutas default: `/abogados-en-nacaome`,
  `/abogado-penalista-choluteca`, y un post de blog.

### `feat(seo): validador seo:ahrefs ampliado — Fase G`

- **`scripts/seo-ahrefs-audit.mjs`**: nueva sección 7 que analiza los CSV de
  las Fases A–F y reporta warnings informativos:
  - titles >70 chars (indexables) del CSV `title-too-long`.
  - metas cortas (<110) y largas (>160) del CSV `meta-description`.
  - HTML crudo en metas (`<strong>`, `<a>`).
  - descripciones truncadas (patrón "Consulta confidencial" pegado).
  - orphan pages indexables en sitemap con 0 inlinks.
  - structured data con errores de validación.
  - presencia de AggregateRating.
- `detectType` ampliado para reconocer 5 tipos nuevos de CSV, con checks
  específicos ANTES del genérico `4xx` (los CSV de Ahrefs comparten columnas
  HTTP status/Depth/Is indexable).

### `feat(seo): placeholder editorial [Tu Empresa] en meta_title (DB)` (work previo)

- **`scripts/fix-editorial-placeholders.ts`** (nuevo): script idempotente que
  elimina sufijos de placeholder en `title`/`meta_title`. DB: 1 post corregido.
- **`scripts/seo-ahrefs-audit.mjs`**: sección 6 con chequeos DB bloqueantes
  (marca duplicada, placeholders, metadata ausente).

### Validación

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm test` ✅ (790/790) · `npm run build` ✅
- `npm run seo:ahrefs` ✅ (OK, sin bloqueantes; sección 6 DB: 0 incidencias)
- `node scripts/validate-jsonld.mjs` ✅ (8 rutas OK: Home 2 bloques sin AggregateRating,
  cargo landings con @id unificados, blog post con BlogPosting+FAQPage válidos)
- Sitemap: 213 URLs, 8 orphans presentes, 0 noindex/legales/intranet
- Scripts DB idempotentes: `fix-long-titles` (0 cambios 3ª corrida),
  `fix-long-metas` (0 cambios 2ª corrida)
- Backup previo: `auditoria-blog/backup-2026-07-07-18-36.json` (175 posts)

### NO VALIDADO (requiere recrawl Ahrefs)

Los warnings de la sección 7 del validador reflejan el CSV estático pre-corrección.
Desaparecerán tras deploy + recrawl de Ahrefs. Las correcciones de código y DB
están aplicadas y verificadas localmente (JSON-LD validado en HTML prerenderizado).

---

## [Unreleased] - 2026-07-07 — Saneamiento SEO Ahrefs Fase 1

Corrección del primer bloque de auditoría Ahrefs: páginas 4XX/404, enlaces
internos a 3XX, contradicción meta robots vs `X-Robots-Tag`, nofollow masivo a
`/intranet/admin` desde el header público, e inconsistencia de `rel` en tags del
pie de post. Sin cambios visuales, sin inventar contenido jurídico, sin romper
rutas existentes.

### `fix(seo): X-Robots-Tag por ruta, no global (contradicción con meta noindex)`

- **Causa raíz**: `next.config.ts` emitía `X-Robots-Tag: index, follow` global
  (regla catch-all `/:path*`) a TODAS las páginas públicas, incluidas las
  noindex (6 legales + filtros `?tag=`/`?month=`/`?page=`). Ahrefs reportó 601
  URLs con señal contradictoria (meta `noindex, follow` + header `index, follow`).
- **`next.config.ts`**: se elimina el `robotsHeader` estático. Las páginas
  indexables no reciben `X-Robots-Tag` (la metadata por-página + sitemap son la
  autoridad). Se añaden reglas `headers()` explícitas para las 6 rutas legales
  (`/terminos`, `/aviso-legal`, `/politica-privacidad`, `/politica-cookies`,
  `/politica-editorial`, `/disclaimer`) → `X-Robots-Tag: noindex, follow`.
  `noindexActive` (staging) sigue forzando noindex global.

### `fix(seo): redirects 301 de red de seguridad para 4XX reportados`

- 5 redirects con destino canónico verificado (post 200 existente):
  - `/articulos/declaracion-isr-personas-naturales` → `/blog/tributario/impuesto-renta-personas-fisicas-honduras`
  - `/articulos/facturacion-electronica-honduras` → `/blog/tributario/facturacion-electronica-requisitos-sar`
  - `/articulos/isv-en-honduras` → `/blog/tributario/isv-impuesto-venta-tasas-obligaciones-honduras`
  - `/contacto-tegucigalpa` → `/solicitar-consulta`
  - `/servicios/gestoria-ambiental-corporativa` → `/servicios-juridicos/ambiental-regulatorio`
- Los slugs con doble prefijo (`/blog/tributario/blog/...`) NO se redirigen: son
  artefactos de rastreo sin referencia real en código/DB (verificado).

### `fix(seo): reescritura en origen de enlaces rotos (fix-internal-redirects)`

- **`scripts/fix-internal-redirects.ts`**: ampliado con `REWRITE_MAP` para
  reescribir en el body HTML de los posts los enlaces `/articulos/*` (3 URLs) →
  posts canónicos, y `/contacto` → `/solicitar-consulta` (evita cadena de
  redirect). Mantiene patrón dry-run/idempotencia/backup-required. Reporte
  etiqueta cada cambio con su fuente (`rewrite-map` vs `redirect-301`).
- Dry-run detecta **21 posts / 23 enlaces** a corregir, incluyendo el post
  `como-obtener-rtn-personas-empresas-honduras` con los 3 enlaces `/articulos/*`
  rotos. No se ejecuta `--aplicar` en este turno (lo decide el usuario).

### `fix(seo): retirada de /intranet/admin del HTML público`

- **`components/marketing/public-header.tsx`**: eliminado el bloque
  `Link href="/intranet/admin"` del header global (visible en todas las páginas
  públicas con `rel=nofollow`). La intranet sigue existiendo, protegida por
  `robots.ts` + auth; accesible por URL directa conocida por el personal.
- **`app/article-modal.tsx`**: retirado el CTA "Ver en la biblioteca completa →"
  que enlazaba a `/intranet/admin/cp/:id` desde el modal público del CP.
- Reduces superficie de ataque y elimina el patrón de nofollow masivo reportado.

### `fix(seo): rel=nofollow en tags del pie de post`

- **`app/(public)/blog/[categoria]/[slug]/page.tsx`**: los enlaces `?tag=` del
  pie de cada post ahora llevan `rel="nofollow"` (coherente con el sidebar, que
  ya lo aplicaba). Evita emitir señales dofollow hacia URLs noindex.

### `feat(seo): validador Fase 1 — npm run seo:ahrefs`

- **`scripts/seo-ahrefs-audit.mjs`** (nuevo): lee los CSV de `ahrefs/`
  (UTF-16LE/TSV), autodetecta columnas, y reporta 4XX, enlaces a 3XX, noindex
  con señales contradictorias, noindex en sitemap y `/intranet/admin` en
  componentes públicos. Exit 1 si hay incidencias bloqueantes.
- **`package.json`**: añadido `"seo:ahrefs": "node scripts/seo-ahrefs-audit.mjs"`.

### Validación

- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm test` (789 tests) ✅
- `npm run build` ✅ (sitemap: 213 URLs, 0 legales/intranet/filtros)
- `npm run seo:ahrefs` ✅ (sin bloqueantes)
- `fix-internal-redirects` dry-run ✅ (21 posts / 23 enlaces detectados)

---

## [Unreleased] - 2026-07-07 — Fix "page has broken JavaScript" y títulos duplicados

Corrección de la auditoría SEO que reportaba `/_next/static/chunks/403tsh8uvet9c.js`
devolviendo 404 desde HTML servido, provocando el error "page has broken JavaScript"
en todas las páginas de `www.pinedayasociadoshn.com`. Junto a la corrección de
títulos de blog con la marca "Pineda y Asociados" duplicada.

### `fix(seo): consistencia de assets Next.js y purga de caché SW por build`

- **Causa raíz**: el deploy vigente ya no referenciaba el chunk roto (verificado
  con `curl` sobre Home, `/despacho`, `/servicios-juridicos`, `/derecho-penal`,
  `/blog` y posts — 0 referencias al chunk `403tsh8uvet9c.js`). El 404 venía de
  HTML/Assets inconsistentes entre builds, agravado por un service worker con
  `CACHE = 'pineda-pwa-v1'` fijo entre deploys: el `activate` nunca purgaba la
  caché anterior y el SW seguía sirviendo chunks obsoletos (stale-while-revalidate)
  cuyo HTML referenciaba assets que ya no existían en el servidor.
- **`public/sw.js`**: la versión de caché ahora se versiona por build vía el
  placeholder `__BUILD_ID__`, inyectado en CI por `scripts/bump-sw-cache.mjs`.
  Cada deploy activa `install → skipWaiting → activate` y purga las cachés de
  builds anteriores. El handler de assets además purga entradas cacheadas cuya
  revalidación devuelve 404 (chunk huérfano).
- **`scripts/bump-sw-cache.mjs`** (nuevo): lee `.next/BUILD_ID` y reescribe la
  línea `const CACHE = ...` de `public/sw.js`. Idempotente: restaura el
  placeholder antes de reinyectar. El repo mantiene el placeholder; el valor
  real solo vive en el artefacto de build desplegado.
- **`scripts/verify-chunks.mjs`** (nuevo): valida tras `next build` que todos
  los chunks referenciados en `build-manifest.json` y `app-build-manifest.json`
  existan físicamente en `.next/static/chunks/`. Sale con código 1 si hay
  chunks 404, previniendo deploys inconsistentes.
- **`package.json`**: `postbuild` ahora ejecuta `bump-sw-cache` +
  `verify-chunks` antes de `generate-llms-txt` y `submit-indexnow`. Añadido
  script `verify:chunks` para validación manual.

### `fix(seo): títulos de blog sin marca "Pineda y Asociados" duplicada`

- **Causa raíz**: `scripts/blog-verify-fix.ts` instruye a la IA a añadir
  ` | Pineda y Asociados` al final del `metaTitle`. Pero el layout raíz
  (`app/(public)/layout.tsx`) define `template: '%s | Pineda y Asociados'`, que
  vuelve a añadir la marca → `"Título | Pineda y Asociados | Pineda y Asociados"`.
- **`app/(public)/blog/[categoria]/[slug]/page.tsx`**: el `generateMetadata` del
  post ahora usa `title: { absolute: ... }` (sin template) y `stripDuplicateBrand()`
  elimina cualquier sufijo de marca (`| Pineda y Asociados`, `- Pineda y Asociados`,
  `Pineda y Asociados` colgante) que el `metaTitle` traiga de la DB, aplicando la
  marca una sola vez. Coherente con el resto de páginas slug del blog que ya usan
  `title: { absolute }`.

### Validación

- `npm run lint` ✓ · `npx tsc --noEmit` ✓ · `npm test` ✓ (789/789, 36 archivos)
  · `npm run build` ✓ (postbuild: `bump-sw-cache` + `verify-chunks` OK, 7 chunks
  referenciados, 0 faltantes).
- `curl` sobre Home, `/despacho`, `/servicios-juridicos`, `/derecho-penal`,
  `/blog`, un post de blog, `/derecho-penal/proceso-penal-completo` y
  `/preguntas-frecuentes`: todos los chunks JS referenciados devuelven 200.
  El chunk `403tsh8uvet9c.js` ya no se referencia en ninguna página.

---

## [Unreleased] - 2026-07-07 — Refuerzo de Veracidad E-E-A-T y SEO/GEO

Implementación técnica para soportar entidades profesionales verificables sin inventar datos, cumpliendo los requisitos YMYL para sitios jurídicos.

### `feat(seo): soporte completo para entidades profesionales verificables (E-E-A-T)`

- **`lib/site.ts`**: añadida compatibilidad con variables de entorno para colegiación (CAH), LinkedIn y directorios de los tres abogados (`NEXT_PUBLIC_CAH_*`, `NEXT_PUBLIC_LINKEDIN_*`, `NEXT_PUBLIC_DIRECTORIO_*`).
- **Schema.org**: `hasCredential` condicionado a la existencia de CAH real. `sameAs` filtrado rigurosamente mediante el nuevo helper `validUrlsOnly` para evitar emitir URLs vacías o placeholders.
- **`.env.example`**: documentadas las nuevas variables con advertencia estricta de no inventar credenciales.

### `feat(ui): microcopy condicional de confianza E-E-A-T`

- **`app/(public)/page.tsx`**: panel informativo del Hero ahora muestra el distintivo "Colegiación CAH Verificada" solo si existen datos configurados.
- **`app/(public)/despacho/page.tsx`**: tarjetas del equipo actualizadas para renderizar condicionalmente los distintivos de CAH, LinkedIn y directorios jurídicos.

### `feat(geo): archivo llms.txt para motores de IA`

- **`scripts/generate-llms-txt.mjs`**: añadido bloque obligatorio de "Disclaimers Legales y Limitaciones" para clarificar que el contenido no es asesoría y que las herramientas son orientativas.
- **`public/llms.txt`**: regenerado automáticamente con los nuevos disclaimers.

### `docs`: Actualización de documentación de verificación E-E-A-T
- **`README.md`**: nueva sección explicando cómo completar la autoridad externa para levantar el bloqueo suave YMYL.

---

## [Unreleased] - 2026-07-07 — Eliminación completa de DeepSeek del chat público

El chat público ya no depende, no menciona, no llama ni requiere DeepSeek en
ningún escenario. Funciona exclusivamente con el motor de reglas local. Las
API keys de DeepSeek han sido borradas y el chat sigue operativo sin ellas.

### `refactor(chat)!: eliminación completa de DeepSeek del chat público`

- **`app/api/chat/route.ts`**: eliminada toda la lógica dual. El endpoint ahora
  es mono-flujo: rate-limit → Zod → guardrails → motor de reglas local. Sin
  bifurcación DeepSeek, sin imports de `deepseek.ts`, sin `CHAT_PROVIDER`.
- **`lib/chat/deepseek.ts`**: **ELIMINADO** (cliente DeepSeek del chat).
- **`lib/chat/system-prompt.ts`**: **ELIMINADO** (system prompt para LLM).
- **`lib/chat/knowledge-base.ts`**: eliminadas `buildKnowledgeBase()` y
  `buildRAGContext()` (funciones para inyectar contexto al LLM). Se conservan
  `PUBLIC_LINKS_ALLOWLIST` e `isAllowedPublicLink()` (utilidades de validación).
- **`lib/chat/config.ts`**: eliminados `CHAT_PROVIDER`, `config.deepseek`,
  `DEEPSEEK_*`, `generation` (temperature/maxTokens/timeout). El chat no
  requiere ninguna API key de IA.
- **`lib/chat/rules-engine.ts`**: único motor de respuestas. Sin cambios
  funcionales (solo comentario documental).

### `feat(legal): política de privacidad sin DeepSeek en el chat`

- **`app/(public)/politica-privacidad/page.tsx`**: sección 6 reescrita.
  "Sistema automatizado basado en reglas locales" (no IA generativa).
  "Los mensajes no se envían a ningún proveedor externo de IA". DeepSeek
  eliminado de la lista de encargados de tratamiento.
- **`lib/legal-content.ts`**: versión política 0.4 → 0.5.

### `chore(docs): README y .env.example sin DeepSeek en el chat`

- **`README.md`**: sección chat reescrita. "Motor de reglas local, sin LLM
  externo". Tabla de variables sin `DEEPSEEK_*` ni `CHAT_PROVIDER`. Nota
  explícita: las variables `DEEPSEEK_*` del `.env.example` pertenecen a
  RAG/embeddings y scripts de blog, NO al chat.
- **`.env.example`**: sección chat limpiada (solo `CHAT_ENABLED` y rate-limit).
  Variables `DEEPSEEK_*` movidas con nota "INDEPENDIENTE del chat público".

### Tests
- **`tests/api-chat.test.ts`**: reescrito mono-flujo. Eliminada la suite
  "modo deepseek (opt-in)". Añadidos tests de regresión: "funciona sin
  DEEPSEEK_API_KEY" y "no existe path que llame a DeepSeek". 12 tests.
- **`tests/chat-guardrails.test.ts`**: eliminada suite `system-prompt`
  (archivo eliminado). 22 tests (antes 27).
- **`tests/chat-rules-engine.test.ts`**: sin cambios (16 tests).

### Validaciones
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (21.3s) ·
  `npm run test` ✅ (**789 tests**, 36 suites) · `npm run seo:doctor` ✅.

### Referencias DeepSeek fuera de alcance (subsistemas independientes del chat)
Estas referencias NO se modificaron porque pertenecen a subsistemas que no
afectan al chat público ni a los usuarios de la web:
- `lib/rag/` (embeddings, retrieval vectorial) — usa DeepSeek para embeddings.
- `scripts/blog-*.ts`, `scripts/seo-*.ts` — corrección editorial de posts.
- `lib/sgie/ia-documental.ts` — IA documental de la intranet (privado).
- `drizzle/migrations/meta/0023_snapshot.json` — snapshot de migración RAG.

### Riesgos pendientes
- **Revisión legal humana**: la política de privacidad ahora declara que el
  chat no usa IA generativa ni transmite a terceros. Conviene confirmar que
  la redacción cumple con el ordenamiento hondureño y RGPD/LOPDGDD.
- **Variables DeepSeek en RAG/scripts**: siguen existiendo para embeddings y
  corrección de blog. Si en el futuro se quiere eliminar DeepSeek por completo
  del proyecto, requerirá migrar el subsistema RAG a otro proveedor de
  embeddings (tarea separada, fuera de alcance).

---

## [Unreleased] - 2026-07-07 — Chat sin LLM externo: motor de reglas local por defecto

Eliminación de la dependencia operativa de DeepSeek en el chat. El asistente ahora
funciona por defecto con un **motor de reglas local** que no transmite mensajes a
ningún proveedor externo de IA. DeepSeek queda como opción **opt-in** (requiere
`CHAT_PROVIDER=deepseek` + `DEEPSEEK_API_KEY`).

### `feat(chat): motor de reglas local (CHAT_PROVIDER=rules) — sin DeepSeek por defecto`

- **Nuevo motor local (`lib/chat/rules-engine.ts`)**: detección de 14 intenciones
  (saludo, servicios, ubicación, horario, contacto, preparar consulta, caso urgente,
  identificar área, checklist, WhatsApp, formulario, privacidad, migrantes, no_entendido)
  mediante patrones regex + plantillas de respuesta prudente. Combina el clasificador
  de área legal (`sugerirAreaLegal`) y el detector de urgencia (`detectUrgency`).
  Sin transmisión a terceros.
- **Config (`lib/chat/config.ts`)**: añadida variable `CHAT_PROVIDER` con default
  `'rules'`. Valores: `'rules'` (local) | `'deepseek'` (opt-in, requiere API key).
  Mensaje inicial actualizado para reflejar modo local. Disclaimer ajustado
  ("Asistente automatizado" en vez de "Asistente de IA").
- **API route (`app/api/chat/route.ts`)**: refactorizado para rutear al motor local
  por defecto. DeepSeek solo se llama si `provider === 'deepseek'` Y API key presente.
  Si DeepSeek falla, cae al motor local como fallback (el chat nunca queda muerto).
- **Política de privacidad (`app/(public)/politica-privacidad/page.tsx`)**: sección 6
  reescrita. Modo local por defecto (no transmisión a terceros). DeepSeek como
  encargado condicional ("solo si se activa expresamente; en la configuración actual
  está desactivado").

### Funcionalidades conservadas sin LLM
- ✅ Mensaje inicial con aviso (sistema automatizado + no asesoría + privacidad)
- ✅ Quick replies de preconsulta
- ✅ Clasificador de área legal (12 áreas, heurística por keywords)
- ✅ Detector de urgencia (15 patrones server-side + banner visual + CTAs resaltados)
- ✅ Preparación de resumen de preconsulta (guía estructurada)
- ✅ Generador de mensaje WhatsApp (plantilla prudente con marcadores)
- ✅ Checklists documentales orientativos (11 áreas)
- ✅ Derivación a WhatsApp, llamada, correo o formulario
- ✅ Respuestas sobre servicios, ubicación, horario, contacto (datos locales)
- ✅ Guardrails de prompt injection (18 patrones), temas privados, asesoramiento definitivo
- ✅ Respuesta segura cuando no entiende (deriva a contacto humano)

### Tests
- `tests/chat-rules-engine.test.ts` — **NUEVO**: 16 tests (detección intención,
  urgencia, clasificación área, límites legales, no transmisión, generador WhatsApp,
  checklists).
- `tests/api-chat.test.ts`: reescrito con 3 suites (modo rules, validación/guardrails,
  modo deepseek opt-in). 13 tests.
- `tests/chat-guardrails.test.ts`: sin cambios (ya cubría guardrails compartidos).

### Validaciones
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (27.1s, 361 páginas) ·
  `npm run test` ✅ (**796 tests**, 36 suites, +29 respecto al baseline de 767) ·
  `npm run seo:doctor` ✅ (18 OK).

### Limitaciones del modo sin LLM
- **Sin comprensión semántica profunda**: el motor detecta intenciones por keywords,
  no por comprensión del lenguaje natural. Mensajes muy ambiguos o reescritos pueden
  caer en `no_entendido`.
- **Sin respuestas generativas**: el motor usa plantillas fijas. No puede redactar
  resúmenes personalizados del caso del usuario como haría un LLM.
- **Sin RAG**: en modo local no se inyecta contexto de artículos legales (la integración
  RAG queda para el modo DeepSeek si se activa).
- **Tono más repetitivo**: las plantillas pueden sonar similares entre conversaciones
  distintas. Es la contrapartida de no alucinar.

### Riesgos pendientes
- **Revisión legal humana**: la política de privacidad refleja el modo local por defecto,
  pero conviene confirmar que la redacción cumple con el ordenamiento hondureño y, si
  aplica, RGPD/LOPDGDD.
- **DeepSeek no se elimina del código**: queda como integración opt-in para quien quiera
  reactivar el modo generativo. `DEEPSEEK_API_KEY` sigue siendo opcional (no obligatoria
  para el build).
- **Scripts RAG/blog** (`lib/rag/`, `scripts/blog-*.ts`) siguen usando DeepSeek para
  embeddings/corrección de posts — fuera del alcance de este cambio (subsistema separado
  del chat público).

---

## [Unreleased] - 2026-07-06 — Evolución del chat a asistente de preconsulta legal

Transformación del chat asistente de "orientador genérico" a **asistente de preconsulta legal**
con capacidades estructuradas, manteniendo intactos todos los límites legales/YMYL.

### `feat(chat): asistente de preconsulta — clasificador área, urgencia, resumen y WhatsApp`

- **System prompt (`lib/chat/system-prompt.ts`)**: reescrito con 7 funcionalidades de preconsulta
  (explicar servicios, clasificar área legal probable, detectar urgencia, preparar resumen de
  preconsulta, generar mensaje para WhatsApp/correo, checklists documentales orientativos,
  asistir al formulario). Transparencia IA obligatoria. Frases prohibidas explícitas ("usted
  ganará", "tiene derecho seguro", "la pena será exactamente", "demande", "haga esto para
  evitar responsabilidad"). Privacidad y minimización de datos antes de solicitar información.
  Regla especial RAG intacta.
- **Guardrails (`lib/chat/guardrails.ts`)**: añadida detección de urgencia server-side
  (`detectUrgency`, 15 patrones: detención, audiencia, denuncia, violencia intrafamiliar,
  menores, embargo, despido, vencimiento de plazo, citación, riesgo migratorio, amenaza,
  urgente, prisión preventiva). No bloquea: marca `urgent: true` para que el widget resalte
  CTAs de WhatsApp/teléfono. Refuerzo de prompt injection (+8 patrones: "finge ser", "modo god",
  "sin restricciones", "sobreescribe tus reglas", "system prompt", etc.).
- **API route (`app/api/chat/route.ts`)**: el flag `urgent` se propaga en la respuesta JSON
  (guardrail, fallback y deepseek) para que el widget pueda reaccionar.
- **Config (`lib/chat/config.ts`)**: mensaje inicial con triple aviso obligatorio (IA + no
  asesoría + privacidad). Quick replies de preconsulta: "Preparar consulta", "Identificar área
  legal", "Caso urgente", "Enviar WhatsApp", "Ir al formulario", "Soy hondureño en España".
- **Módulo preconsulta (`lib/chat/preconsulta.ts`)** — NUEVO: clasificador heurístico de área
  legal (`sugerirAreaLegal`, 12 áreas con keywords), checklists documentales orientativos
  (`CHECKLISTS_DOCUMENTALES`, 11 áreas), generador de mensaje WhatsApp prudente
  (`generarMensajeWhatsApp` con marcadores para datos faltantes).
- **Widget (`components/chat/chat-widget.tsx`)**: quick reply buttons al inicio (ocultos tras el
  primer mensaje), banner de urgencia con CTAs resaltados (ring + animate-pulse), detección
  client-side de área legal para analytics, manejo del flag `urgent` del backend.

### `feat(legal): política de privacidad documenta el chat/IA y proveedor DeepSeek`

- **Política de Privacidad (`app/(public)/politica-privacidad/page.tsx`)**: añadida sección 6
  "Asistente virtual de preconsulta (IA)" con naturaleza, datos tratados, datos no tratados,
  conservación (no almacenamiento), transmisión al proveedor y derecho a no usar la IA.
  Renumeradas secciones 7-10. DeepSeek añadido como encargado de tratamiento en sección 5.
- **Versión política (`lib/legal-content.ts`)**: bumped 0.2 → 0.3, "Junio 2026" → "Julio 2026".

### Tests
- `tests/chat-guardrails.test.ts`: +3 suites nuevas (detectUrgency, preconsulta-sugerirAreaLegal,
  preconsulta-generarMensajeWhatsApp, preconsulta-ChecklistsDocumentales). System prompt integrity
  ampliado (frases prohibidas, privacidad, funcionalidades preconsulta). 27 tests total (antes 13).

### Validaciones
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npm run build` ✅ (31.9s, 361 páginas) ·
  `npm run test` ✅ (767 tests, 35 suites, +13 respecto al baseline).

### Límites legales implementados
- El chat informa que es IA en el mensaje inicial y en el system prompt.
- No emite dictámenes, no promete resultados, no calcula probabilidades de éxito.
- Frases prohibidas explícitas en system prompt y guardrails.
- Detección de urgencia deriva inmediatamente a WhatsApp/teléfono.
- Minimización de datos: aviso de privacidad antes de solicitar información.
- No almacenamiento de conversaciones (historial solo en navegador del usuario).
- Prompt injection reforzado (server-side + system prompt).
- Política de privacidad documenta proveedor DeepSeek, finalidad, datos y no-retención.

---

## [Unreleased] - CI/CD GitHub Actions

### Changed
- **CI/CD:** Refactorización completa del flujo de GitHub Actions (`ci.yml`). Unificación de validaciones en un único workflow robusto.
- **CI/CD:** Implementación de instalación reproducible en Ubuntu (`npm ci --no-audit --no-fund`) con npm 11 y caché dependiente de `package-lock.json`.
- **CI/CD:** El pipeline ahora utiliza ejecución inteligente y condicionada de scripts: comprueba la existencia de `lint`, `typecheck`, `test`, `build` y `seo:doctor` en el `package.json` mediante `jq` antes de invocarlos para evitar fallos por scripts faltantes.
- **CI/CD:** Integración de variables de entorno seguras, usando placeholders funcionales (ej. `DATABASE_URL`) y configuraciones públicas necesarias en la nube (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_NOINDEX`, etc.) para permitir el paso del build en un entorno sin base de datos real.
- **Config:** Documentación actualizada en `.env.example` y `README.md` destacando las guías de uso local del CI y el manejo adecuado de secretos.

## [11.0.1] - 2026-07-06 — Implementación Fase 1 auditoría SEO/GEO (tareas A-01 a A-04)

Ejecución de las 4 tareas de prioridad ALTA del `SEO_GEO_ACTION_PLAN.md`, generadas
por la auditoría integral SEO/GEO/YMYL (`AUDITORIA_SEO_GEO_LEGAL_PINEDA.md`).

### Verificación post-deploy en producción (2026-07-06)

Confirmación de que los cambios de Fase 1 están vivos en producción, sin regresiones.

- **Deploy verificado en producción:** enlace al Poder Judicial de Honduras
  (`https://www.poderjudicial.gob.hn/`) confirmado en `/despacho` (265.767 bytes) y
  en el footer de la home (249.519 bytes). `rel="noopener noreferrer"`, sin `nofollow`,
  texto prudente ("referencia institucional del sistema judicial hondureño").
- **Canonical coherente:** canonical = og:url = URL servida =
  `https://www.pinedayasociadoshn.com` (sin slash, normalización Next.js). Title 59 chars,
  1 `<h1>`, sin trailingSlash global.
- **Sitemap/robots:** ambos HTTP 200; sitemap 213 URLs (sin cambios); robots referencia
  sitemap correctamente.
- **Slug A-04 corregido:** 0 referencias al slug erróneo `derecho-ambiental-regulatorio`
  en el repo; URL correcta `/servicios-juridicos/ambiental-regulatorio` sirve 200.
- **Integridad confirmada:** JSON-LD, blog, RGPD/cookies, next.config.ts, proxy.ts,
  sameAs y CWV intactos (sin cambios en git diff).
- **A-01 sigue pendiente:** cadena apex 308→308 confirmada en vivo (2 saltos). Requiere
  configuración manual en Vercel → Domains → apex como redirect 301 a www.
- **Validaciones locales:** `lint` ✅, `tsc --noEmit` ✅, `build` ✅ (28.0s, 361 páginas),
  `seo:doctor` ✅ (18 OK), `test` ✅ (754 tests, 35 suites).
- **Progreso:** 92 % completado / 8 % restante (sin cambios: A-01 Vercel + A-04 detalle
  externo Bing/Screaming Frog). A-02, A-03 completadas y validadas en producción.

### Cierre técnico post-implementación (2026-07-06)

Re-validación y cierre operativo de los pendientes externos de Fase 1. Sin cambios
de código funcionales adicionales — solo documentación de procedimientos externos.

- **Re-validación local:** `lint` ✅, `tsc --noEmit` ✅, `build` ✅ (28.0s, 361 páginas),
  `seo:doctor` ✅ (18 OK / 1 ERROR gcloud externo / 4 PENDIENTE creds), `test` ✅ (754 tests, 35 suites).
- **Cierre externo A-01 (Vercel):** documentado procedimiento exacto en
  `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` § "Cierre técnico Fase 1". Estado verificado en vivo:
  cadena apex sigue en 2 saltos (308→308); requiere config manual en Vercel Domains.
- **Cierre externo A-02 (GSC/Bing):** documentado checklist de validación pasiva.
  Decisión local mantenida: no forzar `trailingSlash` global. Pendiente confirmación en
  GSC URL Inspection y Bing WMT SEO Report.
- **Cierre externo A-04 (Bing WMT/Screaming Frog):** documentado procedimiento de
  extracción, crawl, clasificación (5 tipos) y corrección. Prohibido redirigir 404 a
  home o crear páginas vacías. Criterio de cierre: 0 enlaces internos rotos corregibles.
- **Documentación actualizada:** `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` (sección "Cierre
  técnico Fase 1" con instrucciones operativas para Vercel, GSC, Bing WMT y Screaming
  Frog), `SEO_GEO_ACTION_PLAN.md` (sección "Cierre externo Fase 1").
- **Progreso:** 92 % completado / 8 % restante (sin cambios). Recomendación: desplegar
  + cerrar A-01 en Vercel (~10 min) → esperar indexación; A-04 en paralelo.

### `fix(seo): Fase 1 auditoría — enlace autoridad, canonical home y enlace roto`

- **A-03 (Enlace a autoridad jurídica)**: Añadido enlace al Poder Judicial de Honduras
  (`https://www.poderjudicial.gob.hn/`) en `/despacho` (tarjeta "Credenciales y
  especialidad") y en el footer (columna identidad). Refuerza E-E-A-T (Trustworthiness)
  en sitio YMYL jurídico. `rel="noopener noreferrer"`, sin `nofollow`, tono prudente.
  - `app/(public)/despacho/page.tsx`
  - `components/marketing/public-footer.tsx`
- **A-04 (Enlace interno roto)**: Corregido slug de servicio en `landing-local.tsx`:
  `derecho-ambiental-regulatorio` (404) → `ambiental-regulatorio` (canónico). Coherente
  con `data/areas-juridicas.ts`, `lib/internal-links.ts`, `public-footer.tsx` y
  `data/seo/canonical-paths.json`. Enlace latente (no se renderizaba actualmente) pero
  bug potencial si una landing local añadía un servicio ambiental.
  - `components/marketing/landing-local.tsx`
- **A-02 (Canonical home)**: Decisión documentada (sin cambio funcional). Next.js App
  Router normaliza el trailing slash de la raíz con `trailingSlash: false` (default):
  el HTML sirve `...com` sin slash, coherente entre canonical, og:url y URL servida.
  Bing no reporta errores de canonicalización (3.754 2xx, 16 priorityUrls sin "redirect").
  No se fuerza `trailingSlash: true` global (impactaría 213 URLs del sitemap, ~60
  redirects y todos los canonicals; riesgo de regresión > beneficio). Comentarios
  actualizados para reflejar la realidad.
  - `app/(public)/page.tsx` (comentario)
  - `app/(public)/layout.tsx` (comentario)
- **A-01 (Redirect apex)**: PENDIENTE EXTERNA. La cadena 308→308 en el dominio apex
  (`http://non-www` → `https://non-www` → `https://www`) es infraestructura de Vercel
  que intercepta antes de la app Next.js. `next.config.ts` ya declara los redirects
  (líneas 118–119) como defensa en profundidad. Requiere config manual en Vercel →
  Project Settings → Domains → apex como "Redirect to www" Permanent (301).

### Documentación generada/actualizada
- `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md`: nueva sección "Implementación Fase 1 — 2026-07-06".
- `SEO_GEO_ACTION_PLAN.md`: A-01 a A-04 marcadas con estado (pendiente externa / completada / parcial).
- `SEO_AUDIT_CHECKLIST.md`: 2 ítems ⚠️→✅ (2.6, 7.8); 3 ítems ⚠️ actualizados (1.8, 1.10, 11.9). Total: 128✅ / 23⚠️ / 0❌ (85 %).

### Validaciones
- `npm run lint` ✅ limpio
- `npx tsc --noEmit` ✅ limpio
- `npm run build` ✅ Compiled successfully in 28.8s, 361 páginas estáticas, exit code 0
- `npm run seo:doctor` ✅ 18 OK / 1 ERROR (gcloud CLI no instalada, no relacionado) / 4 PENDIENTE

---

## [Unreleased] - 2026-07-06 — Saneamiento global del repositorio y mejoras SEO/GEO

Este saneamiento se separó en dos commits atómicos y semánticamente correctos: un `chore` técnico y un `feat(seo)` funcional.

### Commit 1: `chore: saneamiento global del repositorio y hardening operativo`
- **Fase 1 (Limpieza Básica)**:
  - Eliminación segura de archivos temporales (`_tmp_*`, `_chat_*.png`, `auditoriablog_*.md`) y limpieza de la carpeta `scratch/`. Actualización de `.gitignore`.
  - Correcciones técnicas en `app/robots.ts` (permitidos `/_next/` para bots) y `tests/blog-verify-fix.test.ts` (typecheck fixes).
- **Fase 2 (Saneamiento Operativo)**:
  - Consolidación del directorio `scripts/`: Se creó `scripts/README.md` documentando el inventario.
  - Archivado histórico: Se movieron a `scripts/archive/` los scripts huérfanos/obsoletos.
  - Verificación de exclusión: Se confirmó que `archive/` está ignorado en el typecheck global.
- **Fase 3 (Consolidación SDK de IA)**:
  - Se eliminó con seguridad la dependencia legacy `@google/generative-ai`.
  - Se consolidó la conectividad sobre la SDK oficial `@google/genai` (Gemini) y se documentó el uso de `openai` como cliente para RAG/DeepSeek.
- **Fase 4 (Hardening de secretos y datos generados)**:
  - Se eliminaron del index de Git (vía `git rm --cached`) outputs generados: `data/corregir-checkpoint.json` y `data/gsc-*.json`.
  - Fortalecimiento de `.gitignore` bloqueando patrones `*token*.json`, `*secret*.json`, `*credential*.json`, `*checkpoint*.json` y `data/bing/`.
  - Creación de `data/README.md` estipulando la política de "Fuentes de verdad" (versionables) vs "Datos generados/Locales" (no versionables).
- **Fase 5 (Validación y Cierre)**:
  - Validación 100% exitosa en `lint`, `typecheck`, `test` (754 tests en 35 suites) y `build`.
  - Cierre formal del informe `AUDIT_REPOSITORY_REPORT.md`.

### Commit 2: `feat(seo): incorporar mejoras GEO y marcado estructurado para contenido`
- **Estructura Semántica**:
  - Ampliado el marcado estructurado del sitio y blog con señales GEO/SEO (`lib/schemas/blog.ts`, `lib/site.ts`).
  - Añadidas propiedades semánticas orientadas a asistentes (entidades `Organization`, `SpeakableSpecification`, idioma BCP-47).
  - Actualizado el script `scripts/corregir-articulos.ts` para inyectar bloques estructurales GEO puros (`geo-summary`, `geo-law`, `geo-data`) directamente en los bodies HTML.

---

## Releases 104–110 (Julio 2026) — Resumen visual/UX/SEO

> Estos releases se conservan en main con resumen; el detalle granular se mantiene aquí como referencia.

- **Release 110 (2026-07-04):** Transformación coherente de la web pública. `lib/areas-unified.ts` (puente TS↔DB) y `lib/faq-unified.ts` (4 orígenes FAQ). Componentes nuevos: `EditorialBlock`, `IconBadge`, utilidades `.section-breath`, `.rhythm-tight`. Variantes en `BlogHighlights`/`ConsultationCTA`/`TrustBar`. Home 631→456 líneas (−28 %). Cierre: IconBadge aplicado, FAQ i18n home renombrada a `FAQ_HOME_LEGACY` (structured-data, no UI), fix `@id` `FAQPage` duplicado en `/derecho-penal` y `/hondurenos-en-espana`, QA visual Playwright (22 capturas), SEO validado vía HTTP local. Cierre deuda runtime: fix hidratación React #418 (`ChatWidget` con `useSyncExternalStore`). Ver `docs/audits/archive/2026-08-06/transformacion-web-publica.md`.
- **Release 109b (2026-07-04):** Ajuste fuerte de escala visual v2. Tokens agresivos (`--ui-scale: 0.82`, etc.) que reducen ~30% altura de secciones. Mantiene legibilidad (16px min) y accesibilidad táctil (≥36px).
- **Release 108 (2026-07-04):** Chat conversacional con DeepSeek v4 Flash (estado histórico, **sustituido después por motor de reglas local**). Backend `lib/chat/`, endpoint `/api/chat`, guardrails server-side, allowlist de enlaces públicos, analytics anónimos. 24 tests nuevos. *Nota: esta arquitectura fue eliminada en el release del 2026-07-07 (ver arriba).*
- **Release 107 (2026-07-04):** Fase 2 advanced SEO/GEO/CRO/analytics. Fix factual apellidos pilar (Thania Marlene Paz, Emil Barahona). Des-canibalización landings locales. Recompresión WebP. Enlazado página pilar. GEO/LLMO AnswerBlocks en hubs. `llms.txt` con sección FAQ. CRO + analytics (`trackScrollDepth`).
- **Release 106 (2026-07-04):** Consolidación del sistema de diseño + auditoría pública integral. Utilidades `.prose-pilar` y `.geo-snippet`. Arquitectura narrativa canónica por página (Breadcrumbs → PageHero → TrustBar → IntroEditorial → Sections → ConsultationCTA → HubFaq).
- **Release 105 (2026-07-04):** Auditoría UX/UI + sistema de diseño visual público. `IntroEditorial`, `.prose-editorial`. Normalización de `/servicios-juridicos`, `/derecho-penal`, `/hondurenos-en-espana`. Rediseño de `HubFaq`.
- **Release 104 (2026-07-04):** Fase 2 growth SEO/GEO/Perf/Conversión. `validate-jsonld.mjs`. Recompresión WebP Fase 2 (~2.4 MB). Página pilar `/guia-legal-abogados-honduras`. Landings P7 diferenciadas. GEO/LLMO avanzado (`AnswerBlock`). CRO + analytics (`trackFaqOpen`, `trackBlogSearch`, `trackInternalClick`).
- **Release 103 (2026-07-04):** seo/perf/a11y/security. Quick wins (og-image, SALT_ROUNDS 10→12, `maybeRehashPassword`). `lib/seo.ts` `buildMetadata()`. Schema markup unificado `@graph`. FAQ hubs (`data/faqs-hubs.ts`, `hub-faq.tsx`). Performance (`optimize-images.mjs`, ~5.4 MB ahorrados). Accesibilidad WCAG 2.2 AA. Seguridad: Cloudflare Turnstile, `proxy.ts` con `verifyToken`, `app/error.tsx`.
- **Release 102 (2026-07-03):** seo/internal-linking. `lib/internal-links.ts` (grafo único), `lib/entity-dictionary.ts`, `lib/blog-context-linker.ts` (auto-linker HTML-safe), `components/marketing/related-links.tsx`. Puentes servicio↔ciudad↔blog↔área.
- **Release 100 (2026-07-03):** seo/geo/cro. 4 landings locales nuevas (Caridad, Alianza, Concepción de María, San Antonio de Flores). Landing comercial `/abogado-penalista-choluteca`. Redirects 301. `llms.txt` ampliado. `data/seo/canonical-paths.json` actualizado.
- **Release 99 (2026-07-03):** seo/perf/geo auditoría completa. AVIF. `experimental.optimizePackageImports`. `playwright` → devDeps. `RootShell` Server Component. Clarity vía snippet. `MapEmbed` lazy. JSON-LD `wordCount`/`articleSection`. TOC blog server-rendered. Páginas legales noindex. Google Consent Mode v2. GTM/Facebook Pixel opcionales.
- **Release 98 (2026-07-03):** seo expansion IA de thin posts con verificación legal (`blog:verify-fix`). 0 alucinaciones, 0 discrepancias facticas, 0 reversiones.
- **Release 97 (2026-07-03):** seo reducción warnings Bing title too long. 32/72 posts corregidos.
- **Release 96 (2026-07-03):** seo corrección Bing WMT titles largos y errores 4xx.
- **Release 95 (2026-07-03):** seo optimización CTR basada en GSC. 2 title/meta + 4 meta descriptions.
- **Release 94 (2026-07-03):** seo primera corrección basada en SEO Live. 3 enlaces internos a redirects 301 corregidos.
- **Release 93 (2026-07-03):** docs saneamiento documental y sistema SEO live operativo. `AGENTS.md` 452→121, `README.md` 939→149, `CHANGELOG.md` 3297→~80.
- **Release 92 (2026-07-03):** Fase 9 Sistema SEO Live operativo. Scripts live creados.
- **Release 91 (2026-07-03):** Fases 1-8 SEO/Bing, Redirects, OAuth, CLI. Bing WMT API Key funcional. IndexNow real (20 URLs).

---

## Histórico anterior (Releases 1–90, pre-Jul 2026)

El historial completo de releases 1-90 está disponible en [Releases de GitHub](https://github.com/pineda-y-asociados/justicia-verdadera/releases) (privado). Hitos principales:

- **Release 90:** Cobertura 10 ciudades + IndexNow REAL + GA4 + optimización CTR.
- **Release 89:** Normalización del blog (CTAs, H1→H2, whitespace).
- **Release 88:** SGIE Fases 1-10 completas (gestión integral de expedientes).
- **Release 87:** Limpieza de tooling IA legacy (`.kilo/`, `CLAUDE.md` eliminados).
- **Release 85:** `AGENTS.md` como protocolo canónico único.
- **Release 81:** Rotación de OAuth Client Secret (hardcodeado → `.env.local`).
- **Release 80:** Migración del blog a DB (Drizzle/Neon, `data/blog/posts/` vaciado).
- **Release 1-79:** Fundación (Next.js, Tailwind, motor cálculo, intranet, calculadora).

---

## Operaciones y despliegues (Jul 2026)

### Deploy: Producción (2026-07-09)
- **Commit desplegado:** 573c6aa
- **Validación post-deploy:** Completada con éxito (HTTP 200 en rutas críticas).
- **Estado robots/sitemap/canonicals:** Validados en producción, sin bloqueos.
- **Estado CTA tracking:** Activo (evento seo_blog_cta_click inyectado en Client-Side).
- **Pendientes:** CSV de Bing Webmaster Tools para saneamiento de errores 4xx.
- **Próxima revisión:** 48-72h para indexación prioritaria, y 28 días para análisis Baseline comparativo.

### Seguimiento Post-Deploy (48h-72h)
- **Validación HTTP Producción:** Confirmado 200 OK en rutas principales, sitemap.xml y robots.txt sin exclusiones erróneas.
- **Estructura y Tracking:** Canonical absolutos en su lugar, titles actualizados presentes en HTML pre-renderizado, y marcadores de evento seo_blog_cta_click confirmados.
- **Auditorías de absorción:** Baseline GSC y GA4 confirmados como estables (se requiere extender ventana para detectar variaciones de CTR).
- **Archivos Bing:** Esperando importación de CSV externo para ejecutar mapeo de 301s.
- **Reporte generado:** data/seo/post-deploy-48h-report.md con objetivos claros para evaluación a 28 días.

### Análisis de Impacto Temprano SEO (Fase 10)
- **Informe Generado:** data/seo/early-impact-seo-report.md con diagnóstico de señales GSC/GA4/Bing a 48h del despliegue.
- **Oportunidades GSC:** Identificación de posiciones 2-4 en keywords de familia/deudas para mejora de CTR, e intención informacional latente.
- **Estado Tracking CTA:** seo_blog_cta_click listo y a la espera de acumular tráfico real en GA4.
- **Backlog SEO:** Creado plan de trabajo priorizado para el ciclo de optimización mensual (foco en redirecciones Bing y conversión en España).
- **Medición Futura:** Ciclo comparativo fijado para dentro de 28 días (Agosto 2026).

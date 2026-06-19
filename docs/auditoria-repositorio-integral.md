# Auditoría Integral del Repositorio — LEX HONDURAS / Pineda y Asociados

> **Fecha:** 2026-06-19
> **Autor:** Arquitecto senior (auditoría automatizada)
> **Alcance:** Repositorio completo en `C:\Proyectos\Justicia Verdadera` (rama `main`, commit `169d72b`)
> **Naturaleza:** Diagnóstico accionable. **NO se han aplicado refactors masivos ni borrados.** Solo lectura, validación y generación de este informe.
> **Estado general:** Implementado y parcialmente validado. El repo compila, pasa lint y los 382 tests, pero dos validadores de datos del blog fallan (fechas futuras y revisiones vencidas) y hay deuda técnica acumulada (66 scripts, archivos legacy, 8 componentes sin uso, 2 endpoints con superficie de seguridad mejorable).

---

## 1. Resumen ejecutivo

El repositorio es una aplicación Next.js 16 / React 19 / Tailwind v4 / Neon PostgreSQL / Drizzle de complejidad alta, con un motor de cálculo de penas, un CMS propio (blog + FAQ + páginas visuales), una intranet administrativa y una web pública optimizada para SEO local en la zona sur de Honduras.

**Estado técnico:** sólido en lo estructural (build limpio, 382 tests, schema Drizzle con 32 tablas y 17 migraciones, CSP/HSTS/headers completos, auth JWT con validación de secreto, proxy de edge bien acotado, 0 filtraciones de rutas privadas en la web pública). El SEO técnico está cuidadoso (JSON-LD, sitemap dinámico, canonicalización, IndexNow conservador, `llms.txt`). **Los datos del blog están íntegros** (verificado contra Neon: 0 fechas realmente futuras, 0 órdenes incorrectos).

**Problemas reales detectados:**
1. **Dos validadores rotos por `MAX_DATE` hardcodeada** (`validar-fechas-blog.ts` y `content-audit.ts` tienen `new Date('2026-06-14...')` congelada) → falsos positivos. **No es un problema de datos.** (Reclasificado tras re-validación.)
2. **71 posts con revisión editorial realmente vencida** — pendiente editorial, no bug técnico.
3. **2 endpoints con superficie de seguridad mejorable** (`/api/oauth/callback` devuelve `refresh_token` en JSON; `/api/email/inbound` no verifica firma de Resend).
4. **Deuda técnica acumulada:** 66 scripts (muchos temporales de migración ya ejecutada), 8 componentes marketing sin uso, capas `legacy` (`lib/blog.ts`, `data/blog/types.ts`, `data/faq.ts`), archivos raíz sueltos (`.yml`, `.log`, `.txt`, `default.pub`, `cookies.txt`), y ~25 archivos de auditoría/backup en `data/`.
5. **Documentación desincronizada** con el código (key IndexNow distinta en README vs realidad, conteo de tablas, Node 22 en CI vs 24 local).

**Nada de esto es destructivo ni bloquea producción hoy.** El sitio está desplegado y funciona. Son oportunidades de endurecimiento, higiene y consistencia.

---

## 2. Estado general del repositorio

| Métrica | Valor | Estado |
|---|---|---|
| Framework | Next.js 16.2.7 / React 19.2.4 / Tailwind v4 | ✅ Vigente |
| Node (local) | v24.16.0 | ✅ |
| Node (CI) | 22 | ⚠️ Desalineado (ver H-DB-02) |
| npm | 11.13.0 | ✅ |
| `npm run lint` | 0 errores | ✅ VALIDADO |
| `npm run build` | Compiled + TypeScript OK | ✅ VALIDADO |
| `npm test` (Vitest) | 382/382 (18 suites) | ✅ VALIDADO |
| `npm run validate:dates` | **FALSA (exit 1): 85 posts fecha futura** | ❌ FALLA REAL |
| `npm run content:audit` | **FALSA (exit 1): 71 posts revisión vencida** | ❌ FALLA REAL |
| Git working tree | limpio, rama `main` al día con origin | ✅ |
| Rutas privadas filtradas en público | 0 | ✅ VALIDADO |
| Secretos commiteados | 0 detectados | ✅ VALIDADO |
| Tablas Drizzle | 32 (schema) / 17 migraciones | ✅ Consistente |
| Tests E2E (Playwright) | No ejecutados en esta auditoría | ⚪ NO VALIDADO |

---

## 3. Riesgos críticos

> **ACTUALIZACIÓN (2026-06-19, tras re-validación contra la DB):** el diagnóstico
> original de CR-01/CR-02 estaba **equivocado**. Se verificó directamente contra
> Neon que **0 posts tienen fecha realmente futura** (`> NOW()`) y **0 tienen
> orden incorrecto** (`published_at > updated_at`). Los datos del blog son
> correctos. El bug real es de **código**: los dos validadores tienen
> `MAX_DATE = new Date('2026-06-14T23:59:59Z')` **hardcodeada**, un valor
> congelado en el pasado que falsa cualquier post actualizado con posterioridad.
> La corrección correcta es hacer `MAX_DATE` dinámica (`new Date()`), no
> "recalcular las fechas de 85 posts". Esto se ejecuta en Fase 1.

### CR-01 — `validate:dates` falla por `MAX_DATE` hardcodeada (bug de código, no de datos)
- **Severidad:** ALTA (herramienta rota) — **reclasificada desde CRÍTICA**
- **Área:** Scripts / CI
- **Archivo/ruta:** `scripts/validar-fechas-blog.ts:9` → `const MAX_DATE = new Date('2026-06-14T23:59:59Z')`
- **Descripción:** El validador compara las fechas de los posts contra una constante estática del 2026-06-14. Cualquier post con `updated_at` posterior (legítimo) se reporta como "futuro". Los 85 posts afectados tienen `updated_at = 2026-06-19` (hoy), fecha **válida**.
- **Evidencia (verificada contra Neon):**
  - `SELECT COUNT(*) WHERE published_at > NOW() OR updated_at > NOW()` → **0**
  - `SELECT COUNT(*) WHERE published_at > updated_at` → **0** (orden correcto)
  - `updated_at` máximo real: `2026-06-19 17:43:11+00` (hoy)
  - Muestra: `pension-alimenticia-honduras-como-solicitarla` pub=2026-03-23 upd=2026-06-19 ✓
- **Impacto:** El script da falsos positivos y, de añadirse al CI, bloquearía cualquier deploy tras una edición legítima del blog. El README declaraba "última fecha 2026-06-14" porque el script lo imponía, no porque los datos lo requirieran.
- **Recomendación:** Sustituir `MAX_DATE` hardcodeada por `new Date()` (con un margen pequeño de tolerancia para diferencias de reloj, ej. +1 día). Los posts con fechas genuinamente futuras seguirán detectándose.
- **Esfuerzo:** Bajo (2 líneas por script).
- **Riesgo de tocarlo:** Bajo.
- **Requiere aprobación humana:** No.
- **Automatizable:** Sí.

### CR-02 — `content:audit` falla por `MAX_DATE` hardcodeada + revisiones editoriales reales vencidas
- **Severidad:** MEDIA — **reclasificada desde CRÍTICA**
- **Área:** Scripts / Procesos editoriales
- **Archivo/ruta:** `scripts/content-audit.ts:11` → `const MAX_DATE = new Date('2026-06-14T23:59:59Z')` (no usada para el cálculo de vencidos, pero presente); la lógica de vencidos usa `now` correctamente.
- **Descripción:** El script determina vencidos con `due <= now` (correcto). Los 71 posts marcados **sí tienen `next_review_due_at` realmente vencida** (no es artefacto de fechas). El `MAX_DATE` hardcodeado de la línea 11 es código muerto (no afecta al resultado) pero debe eliminarse por higiene.
- **Evidencia:** 0 posts con `next_review_due_at IS NULL`; los vencidos tienen fecha de revisión ≤ hoy.
- **Impacto:** Es un **pendiente editorial real**, no un bug técnico. El proceso de revisión trimestral declarado en README no se ha ejecutado para esos 71 posts.
- **Recomendación:** (a) Eliminar `MAX_DATE` muerta del script. (b) Documentar los 71 vencidos como **PENDIENTE EDITORIAL** (decisión humana), no como fallo técnico. No recalcular `next_review_due_at` automáticamente — sería falsear el estado de revisión.
- **Esfuerzo:** Bajo (código) / alto (editorial).
- **Requiere aprobación humana:** Sí (la parte editorial).
- **Automatizable:** Solo la limpieza de código.

> **Nota:** A diferencia del diagnóstico original, **no se modificarán fechas de posts**. CR-01 se resuelve corrigiendo el script; CR-02 se documenta como pendiente editorial. Los datos del blog están íntegros.

---

## 4. Hallazgos por área

> Convención de IDs: `{severidad}-{área}-{n}`. Severidades: CR (crítico), AL (alto), ME (medio), BA (bajo).

### 4.1 Seguridad / API

#### AL-SEC-01 — `/api/oauth/callback` expone `refresh_token` en la respuesta JSON
- **Severidad:** ALTA
- **Archivo:** `app/api/oauth/callback/route.ts`
- **Descripción:** Endpoint público (no requiere auth, está fuera de `PUBLIC_API_*` pero responde a GET sin token porque el proxy solo exige token en `/api/` no-pública... veamos: `/api/oauth/callback` NO está en `PUBLIC_API_EXACT` ni `PUBLIC_API_PREFIXES`, así que el proxy **sí exige token**). Verificación: el proxy devuelve 401 sin token para cualquier `/api/*` no listada. Por tanto el endpoint está protegido por token a nivel edge. **Aun así**, dentro de su lógica devuelve `tokens.refresh_token` en el body JSON a quien presente un `code` válido.
- **Evidencia:** líneas 24-30: `return NextResponse.json({ success: true, refresh_token: tokens.refresh_token, ... })`.
- **Impacto:** Es un flujo **manual** de obtención de token OAuth (script `oauth-get-refresh-token.mjs` lo invoca un humano admin). No es OAuth estándar de navegador. El riesgo real es bajo **si** solo lo usa el admin con token de intranet, pero el patrón es frágil: el refresh_token viaja en un body que podría quedar en logs/proxies. Además **no valida `state`** (CSRF teórico).
- **Recomendación:** (a) Confirmar que el proxy exige token para este path (sí, según `proxy.ts`). (b) Considerar no devolver el refresh_token por HTTP y en su lugar escribirlo a un store seguro, o limitar la respuesta a `{success: true}` + log server-side. (c) Añadir validación de `state`.
- **Esfuerzo:** Medio.
- **Riesgo de tocarlo:** Medio (rompería el flujo manual de obtención de token si se cambia sin coordinar).
- **Requiere aprobación humana:** Sí.
- **Automatizable:** Parcial.

#### AL-SEC-02 — `/api/email/inbound` no verifica la firma del webhook de Resend
- **Severidad:** ALTA
- **Archivo:** `app/api/email/inbound/route.ts`
- **Descripción:** Webhook de Resend (`email.received`) que (a) envía una auto-respuesta al remitente y (b) reenvía el correo al destinatario interno de notificaciones. **No valida ninguna firma/HMAC** de que el POST venga realmente de Resend.
- **Evidencia:** la función `POST` parsea `request.json()` directamente sin verificar cabecera de firma.
- **Impacto:** Un atacante puede forjar POSTs → generar auto-respuestas de spam arbitrarias y reenviar contenido inyectado al buzón interno. Además `data.from`, `data.subject`, `data.html` se interpolan en el HTML del reenvío **sin escapar** (XSS en el cliente de correo que visualice el reenvío; impacto limitado pero real).
- **Recomendación:** (a) Verificar la firma del webhook de Resend (cabecera `svix-signature`/`svix-timestamp`/`svix-id` con `RESEND_WEBHOOK_SECRET`). (b) Escapar `data.from`/`data.subject` al interpolar en HTML.
- **Esfuerzo:** Medio.
- **Riesgo:** Bajo (añade verificación; si se rompe, el webhook deja de procesar, lo cual es detectable).
- **Requiere aprobación humana:** Sí (hay que obtener `RESEND_WEBHOOK_SECRET` del panel).
- **Automatizable:** Sí.

#### ME-SEC-03 — `msvalidate.01` (Bing) hardcodeado en `app/layout.tsx`
- **Severidad:** MEDIA
- **Archivo:** `app/layout.tsx:73`
- **Descripción:** El código de verificación de Bing está literal en el código en vez de en una variable de entorno, a diferencia de Google (`NEXT_PUBLIC_GOOGLE_VERIFICATION`).
- **Impacto:** Inconsistencia de configuración; rotación del código obliga a editar código y redeploilar.
- **Recomendación:** Mover a `NEXT_PUBLIC_BING_VERIFICATION` (env) con fallback.
- **Esfuerzo:** Bajo.
- **Automatizable:** Sí.

### 4.2 Arquitectura y rutas

#### ME-ARQ-01 — Doble definición de `metadata` (robots/OG/title) entre root y public layout
- **Severidad:** MEDIA
- **Archivos:** `app/layout.tsx` vs `app/(public)/layout.tsx`
- **Descripción:** Ambos layouts definen `metadata.robots`, `openGraph`, `title`. Next.js aplica jerarquía (el más específico gana), así que **no hay bug funcional**, pero es fuente de confusión y riesgo de override silencioso. El root layout además define `verification.other.msvalidate.01` y `alternates.types.rss`, mientras el público redefine OG/robots.
- **Recomendación:** Centralizar lo común en un helper y dejar que cada layout solo añada lo específico. Documentar la jerarquía.
- **Esfuerzo:** Bajo-Medio.
- **Automatizable:** Parcial.

#### ME-ARQ-02 — Capa adaptadora `lib/blog.ts` + `data/blog/types.ts` (legacy) redundante
- **Severidad:** MEDIA (deuda técnica)
- **Archivos:** `lib/blog.ts`, `lib/schemas/blog.ts`, `data/blog/types.ts`, `data/blog/posts/` (vacía)
- **Descripción:** Tras la migración a DB, `data/blog/posts/` quedó **vacía** (0 archivos). Sin embargo `lib/blog.ts` define un tipo `Post` legacy y mapea `BlogPost` (DB) → `Post` (legacy), consumido por `components/blog/blog-card.tsx` y `lib/schemas/blog.ts`. Es una capa intermedia que ya no aporta valor: la fuente de verdad es `blog-db.ts`.
- **Impacto:** Duplicidad de tipos (`Post` vs `BlogPost`), mantenimiento dual, superficie de bugs.
- **Recomendación:** Migrar `blog-card.tsx` y `lib/schemas/blog.ts` a usar `BlogPost` directamente y eliminar `lib/blog.ts` + `data/blog/types.ts`. **Fase posterior**, con tests.
- **Esfuerzo:** Medio.
- **Riesgo:** Medio (toca rendering público del blog).
- **Requiere aprobación humana:** Recomendado.

### 4.3 SEO técnico

#### ME-SEO-01 — Documentación (README/CHANGELOG) cita key IndexNow obsoleta
- **Severidad:** MEDIA (documentación)
- **Archivos:** `README.md` (líneas ~843-881, 1097-1101), `CHANGELOG.md` Release 79
- **Descripción:** La doc afirma que la key IndexNow es `6faddf836cbd448fad29083c8f31d573` y que el archivo de verificación es `public/6faddf836cbd448fad29083c8f31d573.txt`. **La realidad es `9f9940d5665c41d98705255d3704be71`** (archivo `public/9f9940d5665c41d98705255d3704be71.txt` y `INDEXNOW_KEY` en `.env`). El build lo confirma: `Key (mask): 9f9940…71` y `Validación key: ✓ coincide`.
- **Impacto:** Un operador que siga la doc buscaría un archivo que no existe. Confusión operativa. La key real está bien (producción funciona).
- **Recomendación:** Actualizar README y CHANGELOG con la key real, o (mejor) eliminar la key literal de la doc y referenciar solo `INDEXNOW_KEY` + `public/<key>.txt`.
- **Esfuerzo:** Bajo.
- **Automatizable:** Sí.
- **Estado:** PROPUESTO.

#### BA-SEO-02 — `cookies.txt` y `.yml` de accesibilidad commiteados (deberían estar ignorados)
- **Severidad:** BAJA
- **Archivos:** `cookies.txt`, `post-submit.yml`, `solicitar-consulta-form.yml`
- **Descripción:** `.gitignore` (líneas 104-106, 113) ignora estos nombres, pero **ya estaban commiteados** antes de añadir las reglas. `cookies.txt` es un resto vacío de curl; los `.yml` son dumps de accesibilidad de Playwright (no son configuración).
- **Impacto:** Ruido en la raíz del repo; confusión (parecen config).
- **Recomendación:** `git rm --cached` de los tres y dejar que `.gitignore` haga su trabajo.
- **Esfuerzo:** Bajo.
- **Automatizable:** Sí.

### 4.4 Contenido y blog

> Los hallazgos críticos de datos (CR-01, CR-02) ya están en §3. Aquí los complementarios.

#### AL-BLOG-01 — Posts thin/plantilla residual (lista `THIN_POST_SLUGS` en sitemap)
- **Severidad:** ALTA (SEO)
- **Archivos:** `app/sitemap.ts` (constante `THIN_POST_SLUGS`, ~48 slugs), `docs/blog-duplicity-report.md`
- **Descripción:** El sitemap degrada a `priority: 0.3` unos 48 posts identificados como thin/plantilla. Es una **mitigación correcta**, pero indica que casi 1/3 del catálogo necesita reescritura o consolidación. Ya hay trabajo hecho (redirects 301 por canibalización en `next.config.ts`, scripts `rewrite-14-alto-posts.ts`, `rewrite-25-medio-posts.ts`).
- **Impacto:** Calidad editorial desigual afecta al crawl budget y a la autoridad temática.
- **Recomendación:** Continuar el plan de `docs/indexacion-plan-decision.md` (Fase 4: reescritura). No es bug de código.
- **Requiere aprobación humana:** Sí (decisiones editoriales).

#### ME-BLOG-02 — `data/faq.ts` (legacy, 73 FAQs) sin referencias
- **Severidad:** MEDIA (deuda)
- **Archivo:** `data/faq.ts`
- **Descripción:** `grep` no encuentra importadores. La fuente de verdad es `faq_entries` (DB) vía `lib/faq-db.ts`. El README lo menciona como "fallback si la DB no tiene FAQs", pero `faq-db.ts` no lo importa.
- **Recomendación:** Verificar si `faq-db.ts` tiene fallback a este archivo; si no, mover a `data/legacy/` o eliminar.
- **Esfuerzo:** Bajo.
- **Automatizable:** Sí (tras confirmar).

### 4.5 Frontend / UI

#### ME-UI-01 — 8 componentes de marketing sin uso (código muerto)
- **Severidad:** MEDIA
- **Archivos:** `components/marketing/{circular-icon,commitments-grid,feature-grid,features-bar,rss-sidebar,service-card-photo,specialists-grid,two-column-image-text}.tsx`
- **Evidencia:** `grep` de imports (por nombre de archivo y por nombre de componente PascalCase) → **0 referencias** fuera de su propia definición.
- **Impacto:** 8 archivos muertos aumentan superficie de mantenimiento y confunden (¿están en uso?).
- **Recomendación:** Confirmar con una build de producción que no se referencian dinámicamente (ya hecho: build OK, Next tree-shaking los elimina). Mover a `components/marketing/_unused/` o eliminar en Fase 3.
- **Esfuerzo:** Bajo.
- **Riesgo:** Bajo (si la confirmación de 0 refs es robusta).
- **Requiere aprobación humana:** Recomendado (pueden estar reservados para uso futuro).

#### BA-UI-02 — `default.pub` en la raíz (clave pública SSH/PubKey suelta)
- **Severidad:** BAJA
- **Descripción:** `default.pub` (398 bytes) es una clave pública suelta en la raíz. `.gitignore` (línea 84) ignora `*.pub`, pero ya está commiteada.
- **Impacto:** No es un secreto (es pública), pero es ruido y rompe la regla "no commitear claves".
- **Recomendación:** `git rm --cached default.pub`.
- **Automatizable:** Sí.

### 4.6 Rendimiento

#### BA-PERF-01 — `recharts` en bundle admin (esperable, bien aislado)
- **Severidad:** BAJA (informativo)
- **Descripción:** `recharts` (lib pesada) solo se importa en `components/admin/base-*.tsx`. Como toda la intranet es privada y no hidrata en la web pública, **no afecta al LCP/CLS público**. Confirmado: la web pública solo carga GA4/Clarity con `strategy="lazyOnload"` y `recharts` no llega al cliente público.
- **Estado:** Sin acción requerida. Documentado como verificación positiva.

#### BA-PERF-02 — 96 archivos `'use client'`
- **Severidad:** BAJA (informativo)
- **Descripción:** La mayoría son intranet/admin/calculadora (interactivos por naturaleza). En la web pública los client components son los esperados: `public-header`, `live-widgets` (FloatingContactRail), `blog-search`/`lazy-blog-search`, `solicitar-consulta-form`, `rich-text-editor`, etc. No hay client components improcedentes en páginas públicas críticas.
- **Estado:** Sin acción requerida.

### 4.7 Base de datos y migraciones

#### AL-DB-01 — Schema tiene 32 tablas; AGENTS.md/README documentan 15-16
- **Severidad:** ALTA (documentación) / BAJA (funcional)
- **Archivos:** `lib/schema.ts` (32 tablas) vs `AGENTS.md` §2 ("15 tablas") y `README.md` ("14 tablas")
- **Descripción:** El schema creció con las fases CMS (categorías, tags, autores, páginas_cms, áreas, medios, versiones, redirects, menus, roles, permisos, newsletter, supuestos_penales, agravantes, remisiones). La doc se quedó corta.
- **Impacto:** Trazabilidad: un agente que lea AGENTS.md subestimará el schema.
- **Recomendación:** Actualizar la tabla de "Base de datos" en AGENTS.md y README a 32 tablas.
- **Esfuerzo:** Bajo.
- **Automatizable:** Sí.

#### H-DB-02 — CI usa Node 22; local usa Node 24
- **Severidad:** MEDIA
- **Archivo:** `.github/workflows/ci.yml:28` (`node-version: '22'`)
- **Descripción:** El runner CI fija Node 22; el entorno local es 24.16.0. El comentario del CI explica que alinea npm 11 por el lockfile. No hay bug hoy (build pasa en ambos), pero es divergencia de versiones.
- **Recomendación:** Evaluar subir CI a Node 24 (alineado con local y con `engines` implícito). Verificar que `npm ci` siga limpio.
- **Esfuerzo:** Bajo.
- **Requiere aprobación humana:** Recomendado.

#### ME-DB-03 — CI no ejecuta `validate:dates` ni `content:audit`
- **Severidad:** MEDIA
- **Archivo:** `.github/workflows/ci.yml`
- **Descripción:** El README (líneas 827-838) muestra el snippet YAML para añadir ambos validadores al CI, pero **no están en `ci.yml`**. Hoy fallarían (CR-01/CR-02), por lo que no se podrían añadir sin corregir antes los datos.
- **Recomendación:** Tras resolver CR-01/CR-02, añadir ambos steps al CI (con `DATABASE_URL` desde secrets).
- **Esfuerzo:** Bajo.
- **Automatizable:** Sí.

### 4.8 Scripts y package.json

#### AL-SCR-01 — 66 scripts, la mayoría temporales de migración ya ejecutada
- **Severidad:** ALTA (higiene)
- **Directorio:** `scripts/`
- **Descripción:** Inventario: 41 `.ts` + 16 `.mjs` + 3 `.js` + 3 `.cjs` + 3 `.ps1`. Muchos son **scripts puntuales de migración/fix ya consumidos**: `fase1-thin-posts`, `fase2-*` (8 variantes), `fase34-insertar-satelites-locales`, `fase4-pilares-restantes`, `fase5-secundarios-formulario`, `fix-blog-dates`, `fix-final-vacios`, `fix-internal-links`, `insertar-posts-reescritos` (42KB), `rewrite-14-alto-posts` (66KB), `rewrite-25-medio-posts` (64KB), `editar-posts-plantilla` (33KB), `restore-thin-posts`, `expandir-thin-posts`, `sanear-posts-plantilla-residual`, `limpiar-duplicados`, `migrate-seo-columns`, `vincular-*`.
- **Impacto:** `scripts/` es un cementerio de one-shots. Dificulta distinguir los scripts operativos vivos (`submit-indexnow`, `validar-fechas-blog`, `content-audit`, `seo-health-check`, `visual-regression`, `gsc-analytics`, `auditar-indexacion-prioritaria`, `load-env`) de los muertos.
- **Recomendación (Fase 3):** Crear `scripts/legacy/` y mover los one-shots ya ejecutados. Mantener en `scripts/` solo los operativos. Documentar cada uno con un comentario de propósito en su cabecera.
- **Esfuerzo:** Medio (requiere clasificar uno a uno).
- **Riesgo:** Bajo (mover, no borrar).
- **Requiere aprobación humana:** Sí.
- **Automatizable:** Parcial.

### 4.9 Dependencias

#### BA-DEP-01 — Dependencias todas en uso (sin candidatas obvias a eliminación)
- **Severidad:** BAJA (informativo positivo)
- **Descripción:** Verificación rápida de las más pesadas/dudosas:
  - `recharts` → 3 componentes admin ✅
  - `@react-pdf/renderer` → 5 sitios (PDFs cálculo/casos/lead-magnet) ✅
  - `googleapis` → 9 sitios (analytics, search-console, oauth, scripts) ✅
  - `mcp-handler` → `app/api/[transport]/route.ts` ✅
  - `sanitize-html` → `lib/sanitize.ts` ✅
  - TipTap (7 extensiones) → `rich-text-editor.tsx` ✅
- **Recomendación:** Ejecutar `npx depcheck` en una fase posterior para una verificación exhaustiva. No eliminar nada a ciegas.
- **Estado:** Sin acción inmediata.

### 4.10 Tests y CI

#### ME-TEST-01 — Sin tests para SEO/schema/sitemap/rutas privadas
- **Severidad:** MEDIA
- **Descripción:** Las 18 suites cubren cálculo (62 tests), catálogo delitos (129), auth, rate-limit, validación, API contacto/calcular, componentes UI. **No hay tests** que verifiquen: (a) que el sitemap no incluya rutas privadas, (b) que `proxy.ts` bloquee `/intranet/*` sin token, (c) que los JSON-LD sean válidos, (d) que `robots.txt` bloquee lo que debe.
- **Impacto:** Regresiones SEO/seguridad no se detectan automáticamente. El script `auditar-indexacion-prioritaria.mjs` cubre parte en producción, pero no es un test de CI.
- **Recomendación:** Añadir tests unitarios para: (1) `sitemap()` excluye rutas privadas y posts canonicalizados, (2) `robots()` bloquea IA crawlers e intranet, (3) función `isPublicApiPath`/`isPublicPagePath` del proxy.
- **Esfuerzo:** Medio.
- **Automatizable:** Sí.

#### BA-TEST-02 — Tests E2E no ejecutados en esta auditoría
- **Severidad:** BAJA
- **Descripción:** `e2e/` tiene 4 specs (`smoke`, `auth-flow`, `intranet-sidebar`, `admin-agravantes`). No se ejecutaron por tiempo/entorno. El CHANGELOG Release 80 declara "e2e: 37/37".
- **Estado:** NO VALIDADO en esta sesión.

### 4.11 Documentación

#### ME-DOC-01 — `analisisdedatos.md` (692 líneas) en la raíz, sin propósito claro
- **Severidad:** MEDIA
- **Archivo:** `analisisdedatos.md`
- **Descripción:** Archivo Markdown grande en la raíz del repo, fuera de `docs/`. No se referencia desde README/AGENTS. Parece un análisis de datos puntual.
- **Recomendación:** Mover a `docs/` o a `docs/legacy/` si es histórico.
- **Automatizable:** Sí.

#### ME-DOC-02 — Sección "Blog (WordPress) — LEGACY" en README pero WordPress no tracked
- **Severidad:** MEDIA
- **Archivos:** `README.md` (líneas 885-900), `wordpress/` (105K, **0 archivos en git**)
- **Descripción:** El README documenta estructura y migración de WordPress, pero `wordpress/` está en `.gitignore` (línea 87) y **no hay ningún archivo tracked**. Es contenido local muerto.
- **Recomendación:** Decidir: (a) si la migración WP terminó, eliminar la sección del README y borrar `wordpress/` local; (b) si sigue viva, quitarlo del `.gitignore` y commitear lo relevante.
- **Requiere aprobación humana:** Sí.

#### BA-DOC-03 — Coexistencia de 2 sistemas de agentes (Kilo + OpenCode)
- **Severidad:** BAJA
- **Archivos:** `kilo.json`, `.kilo/`, `opencode.jsonc` (gitignored), `.opencode/` (gitignored)
- **Descripción:** El repo está instrumentado para Kilo (config tracked, agente SEO, reglas, skills, comandos) y también para OpenCode (config y node_modules locales, gitignored). No hay conflicto (OpenCode no se commitea), pero indica doble tooling.
- **Recomendación:** Decidir cuál es el canal oficial y documentarlo. Si Kilo es el principal, dejar OpenCode solo local.
- **Automatizable:** No.

---

## 5. Archivos obsoletos / candidatos a limpieza

> **No se ha borrado nada.** Clasificación para una Fase 3 futura.

### Raíz del repo

| Archivo | Clasificación | Nota |
|---|---|---|
| `cookies.txt` | **Candidato a eliminar** | Resto vacío de curl. En `.gitignore` pero commiteado. `git rm --cached`. |
| `default.pub` | **Candidato a eliminar** | Clave pública suelta. `git rm --cached`. |
| `post-submit.yml` | **Candidato a eliminar** | Dump de accesibilidad Playwright. En `.gitignore` pero commiteado. |
| `solicitar-consulta-form.yml` | **Candidato a eliminar** | Igual que arriba. |
| `build-output.log` | **Candidato a eliminar** | Log de build. En `.gitignore` pero commiteado. |
| `dev-log.txt`, `dev-server.log`, `dev-server-err.log` | **Candidato a eliminar** | Logs locales. En `.gitignore` pero commiteados. |
| `.vercel-env-check.txt` | **Candidato a eliminar** | Output del CLI Vercel. Añadir a `.gitignore`. |
| `analisisdedatos.md` | **Mover a `docs/`** | Fuera de lugar. |
| `CLAUDE.md` | **Mantener** | Solo contiene `@AGENTS.md` (referencia para Claude Code). Válido. |

### `data/` (backups, auditorías, fragmentos)

| Archivo(s) | Clasificación |
|---|---|
| `art_*.txt` (20 archivos: `art_211_curr.txt`, etc.) | **Mover a `data/legacy/`** — fragmentos de auditoría de artículos CP ya consumidos. |
| `fix_art_*.txt` (9 archivos) | **Mover a `data/legacy/`** — notas de fix puntuales. |
| `*.BACKUP_*` (`articulos_cp.json.BACKUP_20260614_001713`, `delitos-estados.json.BACKUP_20260614`, `delitos.json.BACKUP_20260614`) | **Mover a `data/legacy/` o eliminar** — backups de migración Jun 14. |
| `auditoria-completa-delitos.json`, `auditoria-correcciones.json`, `auditoria-cp-report.json`, `auditoria-delitos-report.json`, `auditoria-inicial.txt`, `auditoria_completa.txt` | **Mover a `data/legacy/`** — reportes de auditoría históricos. |
| `informe-auditoria-cp.md` | **Mover a `docs/legacy/`**. |
| `cp_actualizado_text.txt`, `cp_original_text.txt`, `cp_tsc_text.txt` | **Mover a `data/legacy/`** — texto plano del CP para diff. |
| `delitos-validacion.csv` | **Revisar** — ¿se usa en algún script? |
| `data/blog/posts/` (vacía) | **Eliminar** — carpeta vacía tras migración a DB. |

### `scripts/` (one-shots de migración)

Ver AL-SCR-01. ~30 scripts candidatos a `scripts/legacy/`: todos los `fase*`, `fix-*` puntuales, `insertar-*`, `rewrite-*`, `restore-*`, `expandir-*`, `sanear-*`, `limpiar-duplicados`, `migrate-seo-columns`, `vincular-*`, `inventario`.

### Componentes

Ver ME-UI-01: 8 componentes marketing sin uso.

---

## 6. Duplicidades y deuda técnica

1. **Tipos blog duales** (`Post` legacy vs `BlogPost` DB) — ME-ARQ-02.
2. **`data/faq.ts` legacy** sin referencias — ME-BLOG-02.
3. **Doble metadata** root/public layout — ME-ARQ-01.
4. **Bing verification** hardcodeado vs Google en env — ME-SEC-03.
5. **`wordpress/`** local + sección README — ME-DOC-02.
6. **Doble tooling de agentes** (Kilo + OpenCode) — BA-DOC-03.
7. **Capa `lib/blog.ts` adaptadora** redundante — ME-ARQ-02.

---

## 7. Riesgos SEO / indexación

| ID | Riesgo | Severidad |
|---|---|---|
| CR-01 | 85 posts con `dateModified`/`lastmod` futuro (sitemap + JSON-LD) | CRÍTICA |
| AL-BLOG-01 | ~48 posts thin/plantilla en `THIN_POST_SLUGS` | ALTA |
| ME-SEO-01 | Doc cita key IndexNow inexistente | MEDIA |
| BA-SEO-02 | Ruido en raíz (`.yml`, `cookies.txt`) | BAJA |

**Verificaciones positivas (VALIDADO):**
- ✅ 0 rutas privadas en sitemap, robots, llms.txt, header, footer, JSON-LD, breadcrumbs.
- ✅ `robots.txt` bloquea `/intranet/`, `/api/`, `/_next/`, `/404`, `/500`, `/login` + 13 bots IA.
- ✅ `X-Robots-Tag: noindex, nofollow` en `/api/*`, `/intranet/*`, `/login`.
- ✅ `proxy.ts` redirige a login (no a home) rutas intranet sin token — cumple regla 18.
- ✅ Rutas obsoletas (`/areas-juridicas`, etc.) devuelven 404 vía `NextResponse.next()` + not-found.
- ✅ Canonicalización de posts canibalizados (redirects 301 en `next.config.ts`).
- ✅ Sitemap excluye posts canonicalizados a otra URL propia.
- ✅ `llms.txt` no referencia ninguna herramienta interna.
- ✅ JSON-LD (LegalService, Organization, WebSite) con `sameAs` condicional (no inventa redes).

---

## 8. Riesgos frontend / rendimiento

| ID | Riesgo | Severidad |
|---|---|---|
| ME-UI-01 | 8 componentes marketing muertos | MEDIA |
| BA-UI-02 | `default.pub` suelta | BAJA |

**Verificaciones positivas:** web pública mayormente Server Components; GA4/Clarity con `lazyOnload`; imágenes con `priority`/`fetchPriority` en LCP; `recharts` aislado en admin; preconnect a fonts/GA4 condicional.

---

## 9. Riesgos seguridad / API

| ID | Riesgo | Severidad |
|---|---|---|
| AL-SEC-01 | `/api/oauth/callback` devuelve `refresh_token` (protegido por token edge, pero patrón frágil) | ALTA |
| AL-SEC-02 | `/api/email/inbound` sin verificación de firma Resend | ALTA |
| ME-SEC-03 | Bing verification hardcodeado | MEDIA |

**Verificaciones positivas:**
- ✅ Auth: JWT con validación de secreto (mín 32 chars, rechaza placeholders en prod), bcrypt, cookies `__Host-*` HttpOnly Secure SameSite=Lax.
- ✅ `requireAdmin`/`requireAuth` en todas las APIs de escritura.
- ✅ Proxy de edge verifica token para `/intranet/*` y `/api/*` no pública, rol admin para `/api/admin/*`.
- ✅ Rate limiting (login 5/60s, contacto/consulta 10/15min, calcular 30/min, generate 10/5min).
- ✅ Sanitización HTML server-side (`sanitize-html`).
- ✅ CSP restrictivo, HSTS preload, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`.
- ✅ 0 secretos commiteados (sk-, AKIA, ghp_, AIza, private keys).
- ✅ `.env`, `.env.local`, `.env.vercel` NO tracked.

---

## 10. Riesgos DB / migraciones

| ID | Riesgo | Severidad |
|---|---|---|
| AL-DB-01 | Doc subestima tablas (15-16 vs 32 reales) | ALTA (doc) |
| H-DB-02 | Node 22 CI vs 24 local | MEDIA |
| ME-DB-03 | CI sin validate:dates/content:audit | MEDIA |

**Verificaciones positivas:** schema Drizzle con FKs, índices y unique constraints coherentes; 17 migraciones + snapshots; seed con guarda anti-doble; datos de delitos íntegros (483, 0 duplicados, 100% verificados).

---

## 11. Riesgos tests / CI

| ID | Riesgo | Severidad |
|---|---|---|
| ME-TEST-01 | Sin tests SEO/sitemap/proxy/JSON-LD | MEDIA |
| BA-TEST-02 | E2E no ejecutados en esta sesión | BAJA (NO VALIDADO) |

**Verificaciones positivas:** 382 tests pasan; CI ejecuta lint→tsc→test→build→validación seed; workflow Lighthouse separado.

---

## 12. Documentación desactualizada

| Doc | Discrepancia |
|---|---|
| `AGENTS.md` §2 | "15 tablas" → son 32 |
| `README.md` estructura | "14 tablas", "18+ endpoints" → 32 tablas, 76 route.ts |
| `README.md` IndexNow | Key `6faddf83…` → real `9f9940…` |
| `README.md` | Sección WordPress legacy (0 archivos tracked) |
| `README.md` líneas 720-722 | "npm test — 314 tests" → ahora 382 |
| `CHANGELOG.md` R79 | Cita key IndexNow `6faddf83…` obsoleta |

---

## 13. Quick wins seguros

> Cambios de bajo riesgo y bajo esfuerzo, ejecutables sin aprobación compleja.

1. **`git rm --cached`** de `cookies.txt`, `default.pub`, `post-submit.yml`, `solicitar-consulta-form.yml`, `build-output.log`, `dev-log.txt`, `dev-server.log`, `dev-server-err.log`, `.vercel-env-check.txt` + añadir `.vercel-env-check.txt` a `.gitignore`. (BA-SEO-02, BA-UI-02)
2. **Actualizar key IndexNow en README/CHANGELOG** o eliminarla de la doc. (ME-SEO-01)
3. **Actualizar conteo de tablas** en AGENTS.md y README. (AL-DB-01)
4. **Mover `analisisdedatos.md` a `docs/`**. (ME-DOC-01)
5. **Mover `informe-auditoria-cp.md` a `docs/legacy/`** y los `data/*.txt`/`*.BACKUP*`/`auditoria-*` a `data/legacy/`. (§5)

> Estos quick wins son **PROPUESTA**. No se aplican en esta fase (la instrucción fue: auditoría primero, sin borrados automáticos).

---

## 14. Plan de ejecución por fases

> Cada fase = un commit atómico (o pocos). Validar `lint && build && test` tras cada una.

### Fase 1 — Validadores rotos + seguridad (no toca datos del blog)
- [x] **CR-01:** sustituir `MAX_DATE` hardcodeada por `new Date()` en `validar-fechas-blog.ts`. Los datos del blog están íntegros (verificado).
- [x] **CR-02:** eliminar `MAX_DATE` muerta de `content-audit.ts`. Documentar los 71 vencidos como **PENDIENTE EDITORIAL** (no se falsea `next_review_due_at`).
- [x] **AL-SEC-02:** verificar firma Resend en `/api/email/inbound` + escapar HTML. (Fallback seguro si falta `RESEND_WEBHOOK_SECRET`.)
- [x] **AL-SEC-01:** revisar `/api/oauth/callback` (no devolver `refresh_token` por body; documentar).
- *Naturaleza:* solo código + configuración. **No se modifican datos del blog.**

### Fase 2 — SEO / indexación
- [ ] **ME-SEO-01:** corregir key IndexNow en doc.
- [ ] Continuar `docs/indexacion-plan-decision.md` Fase 4 (reescritura thin posts).
- [ ] **ME-SEC-03:** mover Bing verification a env.
- *Naturaleza:* doc + config. Bajo riesgo.

### Fase 3 — Limpieza de archivos obsoletos
- [ ] **Quick wins §13** (`git rm --cached`, mover `data/legacy/`).
- [ ] **AL-SCR-01:** crear `scripts/legacy/`, mover ~30 one-shots.
- [ ] **ME-UI-01:** mover/eliminar 8 componentes marketing muertos.
- [ ] **ME-ARQ-02 / ME-BLOG-02:** eliminar `lib/blog.ts`, `data/blog/types.ts`, `data/faq.ts`, `data/blog/posts/` (tras migrar tipos).
- [ ] **ME-DOC-02:** decidir destino de `wordpress/`.
- *Naturaleza:* higiene. Mover, no borrar sin backup.

### Fase 4 — Frontend / rendimiento
- [ ] **ME-ARQ-01:** unificar metadata root/public layout.
- [ ] Auditoría `depcheck` exhaustiva.
- *Naturaleza:* refactor menor.

### Fase 5 — Blog / contenido
- [ ] Reescritura thin posts (AL-BLOG-01).
- [ ] Decisión editorial sobre los 71 "vencidos".
- *Naturaleza:* editorial. Requiere humano.

### Fase 6 — Tests / CI
- [ ] **ME-TEST-01:** tests para sitemap/robots/proxy/JSON-LD.
- [ ] **ME-DB-03:** añadir validate:dates + content:audit al CI (tras Fase 1).
- [ ] **H-DB-02:** subir CI a Node 24.
- *Naturaleza:* calidad.

### Fase 7 — Documentación
- [ ] Sincronizar AGENTS.md/README/CHANGELOG con la realidad (tablas, tests, key).
- [ ] **BA-DOC-03:** documentar tooling de agentes oficial.
- *Naturaleza:* doc.

---

## 15. Qué NO tocar

- **Motor de cálculo** (`lib/rules/v1/`, `lib/utils.ts`, `lib/catalogos.ts`) — verificadísimo, 483 delitos, 100% validado. Solo tocar con causa legal expresa.
- **Web pública visual** (`app/(public)/**/*.tsx`) — regla 1 de AGENTS.md. La auditoría SEO sí puede, no el rediseño.
- **Schema DB** (`lib/schema.ts`) — coherente con 17 migraciones. Cambios requieren `drizzle-kit generate`.
- **Auth** (`lib/auth.ts`) — robusto. No tocar sin reason.
- **Proxy** (`proxy.ts`) — bien acotado. Cambios pueden abrir filtraciones.
- **Datos de delitos** (`data/delitos.json`, `data/delitos-estados.json`) — fuente canónica verificada.
- **Redirects 301** de `next.config.ts` — son consolidaciones de canibalización activas; eliminarlas rompería SEO.
- **`THIN_POST_SLUGS`** en sitemap — mitigación activa hasta reescritura.
- **`.kilo/`** (agente SEO, reglas, skills) — tooling oficial, trazable.

---

## 16. Pendientes que requieren decisión humana

1. **CR-01/CR-02:** ¿recalcular fechas de los 85/71 posts, o son intencionales (rewrites de Jun 19)?
2. **AL-SEC-02:** obtener `RESEND_WEBHOOK_SECRET` del panel de Resend.
3. **AL-SEC-01:** ¿el flujo OAuth manual debe seguir devolviendo el refresh_token por HTTP?
4. **ME-DOC-02:** ¿migración WordPress terminada? ¿borrar `wordpress/` y su sección en README?
5. **AL-BLOG-01:** priorización de los ~48 thin posts a reescribir.
6. **BA-DOC-03:** ¿Kilo u OpenCode como tooling oficial?
7. **ME-UI-01:** ¿los 8 componentes marketing sin uso son para uso futuro o se eliminan?

---

## 17. Comandos ejecutados y resultados

| Comando | Resultado |
|---|---|
| `pwd` | `/c/Proyectos/Justicia Verdadera` ✅ (no OneDrive) |
| `git status` | clean, `main` al día ✅ |
| `git log -1` | `169d72b` Release 80 ✅ |
| `node -v` | v24.16.0 ✅ |
| `npm -v` | 11.13.0 ✅ |
| `npm run lint` | 0 errores ✅ |
| `npm run build` | Compiled + TypeScript OK + postbuild IndexNow dry-run OK ✅ |
| `npm test` | 382/382 (18 suites) ✅ |
| `npm run validate:dates` | **FAIL (exit 1): 85 posts updated_at futura** ❌ |
| `npm run content:audit` | **FAIL (exit 1): 71 posts revisión vencida** ❌ |
| `node -e delitos.json length` | 483 ✅ |
| `node -e duplicados` | 0 ✅ |
| `node -e delitos-estados` | 483/483 verificados ✅ |
| `grep secretos (sk-/AKIA/ghp_/AIza/PRIVATE KEY)` | 0 archivos ✅ |
| `grep rutas privadas en app/(public)` | 0 archivos ✅ |
| `git ls-files wordpress/` | 0 archivos (legacy local) |
| `npm run test:e2e` | **NO VALIDADO** (no ejecutado en esta sesión) |

---

## 18. Próximo paso recomendado

**Fase 1 (datos + seguridad), con aprobación del bufete:**

1. Decidir CR-01/CR-02 (fechas de los 85/71 posts) y ejecutar el script de recálculo + validar.
2. Obtener `RESEND_WEBHOOK_SECRET` y endurecer `/api/email/inbound` (AL-SEC-02).
3. Revisar `/api/oauth/callback` con el responsable (AL-SEC-01).

Estos son los únicos ítems con impacto real en producción hoy. El resto (higiene, doc, tests) es mejora continua y puede abordarse en fases posteriores sin urgencia.

---

*Fin del informe. Este documento es diagnóstico; ningún cambio de código ni de datos se ha aplicado en esta fase.*

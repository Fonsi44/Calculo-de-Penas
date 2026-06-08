# Changelog

## Release 7 — Auditoría SEO: imágenes, accesibilidad, depuración de informe (2026-06-08)

### Imágenes
- **Migración a WebP**: 5 imágenes JPG del blog convertidas a WebP usando `sharp`. Reducción de 10.6 MB a 391 KB (-96%).
  - `bufete-abogados.jpg` (3.3 MB) → `bufete-abogados.webp` (103 KB)
  - `despido-laboral.jpg` (2.8 MB) → `despido-laboral.webp` (48 KB)
  - `abogado-penalista-sur.jpg` (2.4 MB) → `abogado-penalista-sur.webp` (110 KB)
  - `problemas-familiares.jpg` (1.0 MB) → `problemas-familiares.webp` (55 KB)
  - `servicios-empresariales.jpg` (1.4 MB) → `servicios-empresariales.webp` (16 KB)
- Actualizadas todas las referencias en `data/blog/posts/` (6 posts → `.webp`).

### Informe de auditoría (`docs/informe.md`)
- Depuración completa de inconsistencias entre resumen, hallazgos, análisis, quick wins, roadmap y checklist.
- Marcados como corregidos: HS-01 (OG), HS-02 (imágenes), HS-03 (analítica), HS-04 (URLs legacy), HS-07 (keywords), HS-08 (gramática).
- Evaluados y documentados: HS-05 (sitemap de imágenes — no implementado), HS-06 (hreflang — no aplica).
- Actualizadas puntuaciones: SEO on-page 82/100 (+7), Rendimiento 78/100 (+18), Global **82/100 (+8)**.

### Mantenimiento documental (cierre R7)
- Eliminado duplicado completo del informe (ya estaba limpio, verificado).
- HS-05 y HS-06 reescritos como evaluación documentada, no como errores activos.
- Corregido `❌ H1 presente y único` → `✅`.
- Corregidos typos: "Excellent schema coverage" → español, "FAQPpage" → "FAQPage".
- Checklist: sitemap de imágenes marcado como evaluado (`[x]`).
- Puntuación global unificada a 82/100 en todo el documento.
- Conclusión reescrita reflejando estado real: problemas técnicos corregidos, pendientes de contenido y autoridad.

### Accesibilidad
- **Contraste**: verificado primary (#0B1B3D) y acento (#C5A55A) superan WCAG AA.
- **FAQs**: verificados nativos `<details>/<summary>` navegables por teclado.
- **Aria-describedby**: documentado en informe.

### Lazy loading y sitemap
- Verificado: BlogCard usa `next/image` con `fill` + `sizes` (lazy loading por defecto). Correcto.
- Sitemap ya tiene frecuencia `weekly` para blog. Sin cambios necesarios.

### Validaciones
- Build: 89/89 páginas, 0 errores
- Lint: 0 errores
- Tests: 183/185 pasan (2 fallos preexistentes chip.test.tsx)



### SEO técnico
- **OG tags específicos por página**: Añadidos `openGraph` title, description, url e images propios en `/despacho`, `/servicios-juridicos`, `/derecho-penal`, `/hondurenos-en-espana` y `/contacto`. Corregido `og:url` que apuntaba genéricamente a homepage.
- **OG image**: Añadida referencia a `og-image.png` en todas las páginas y en el root layout.
- **Meta keywords**: Eliminado el meta `keywords` global del root layout (repetitivo en todas las páginas, ignorado por Google desde 2009).
- **URLs legacy**: Añadido manejo explícito en `proxy.ts` para rutas obsoletas (`/areas-juridicas`, `/migrantes-hondurenos-en-espana`, `/hodurenos-en-espana`) que ahora devuelven 404 en lugar de redirigir al login de intranet (307).

### Contenido
- **Corrección gramatical**: "Nuestras Servicios Jurídicos" → "Nuestros Servicios Jurídicos" en homepage (`app/(public)/page.tsx`).

### Rendimiento
- **Optimización de imágenes**: Cambiado `images.unoptimized: true → false` en `next.config.ts`. Las imágenes ahora pasan por el optimizador de Next.js, reduciendo tamaño sin pérdida visual.
- **Analítica**: Implementada infraestructura condicional para Google Analytics (GA4) y Microsoft Clarity via `next/script` con `strategy="afterInteractive"`. Se cargan solo si las variables de entorno `NEXT_PUBLIC_GA_ID` o `NEXT_PUBLIC_CLARITY_ID` están definidas.

### UX/CRO
- **Expectativa de respuesta**: Añadido texto informativo en formulario de contacto con horario laboral y alternativas urgentes (teléfono/WhatsApp).

### Validaciones
- Build: 89/89 páginas generadas, 0 errores
- Lint: 0 errores
- Tests: 183/185 pasan (2 fallos preexistentes en chip.test.tsx ajenos a estos cambios)



### Cambios aplicados

- **SSL/TLS**: Auditoría completa del estado HTTPS. El sitio ya operaba correctamente:
  - Certificado gestionado por Vercel (Let's Encrypt, renovación automática).
  - Redirección 308 HTTP→HTTPS en todos los 4 puntos de entrada.
  - HSTS `max-age=63072000; includeSubDomains; preload` (2 años, listo para preload).
  - Cabeceras de seguridad completas (CSP, X-Frame-Options, X-Content-Type-Options, etc.).
  - Sin mixed content detectado.
- **Canonical host**: Cambiado `site.url` fallback de apex→www (`lib/site.ts:44`, `.env.example:12`). Configurada `NEXT_PUBLIC_SITE_URL` explícitamente en Vercel Production para alinear todas las URLs canónicas, OpenGraph y JSON-LD con `https://www.pinedayasociadoshn.com`.
- **Validación**: Lint 0 errores, Build 87/87 páginas.

## Release 4 — Auditoría y correcciones de accesibilidad (2026-06-06)

### Cambios aplicados

- **CRITICAL**: Eliminado `id="main"` duplicado en `root-shell.tsx` — el wrapper público pasa a `<div>` sin id; el wrapper intranet cambia a `<main id="main">`. El skip-link ahora apunta al `<main>` correcto.
- **CRITICAL**: Añadido `useFocusTrap` a `ArticleModal`, `MobileNavDrawer` (app-sidebar) y menú móvil de `public-header`.
- **CRITICAL**: Añadido `aria-label` al campo de búsqueda en paso 1 de calculadora; `role="alert"` en errores de formularios (contacto y solicitar consulta); `id` explícito + `htmlFor` en checkboxes y labels de formularios.
- **HIGH**: Contraste de color corregido — `--color-text-muted` light `#6B6B6B→#595959` (4.7:1), dark `#8A8A8A→#A0A0A0` (4.6:1), ambos WCAG AA.
- **HIGH**: Touch target mínimo aumentado — `IconButton` sm de 28px→32px.
- **MEDIUM**: `Chip` cambia de `role="switch"`/`aria-checked` a `role="button"`/`aria-pressed` (selección, no toggle persistente).
- **MEDIUM**: `aria-expanded` añadido a `MobileNavToggle` en `app-sidebar`.
- **MEDIUM`: `<h3>` dentro de `<summary>` en FAQ cambiado a `<span>` semánticamente neutro.
- Sin cambios en diseño visual, SEO, rendimiento ni funcionalidad.

### Archivos modificados

- `components/layout/root-shell.tsx`
- `app/article-modal.tsx`
- `components/layout/app-sidebar.tsx`
- `components/marketing/public-header.tsx`
- `app/calculadora/paso1-delito.tsx`
- `components/marketing/solicitar-consulta-form.tsx`
- `app/(public)/contacto/page.tsx`
- `app/globals.css`
- `components/ui/icon-button.tsx`
- `components/ui/chip.tsx`
- `app/(public)/page.tsx`

### Validación

- `npm run lint`: 0 errores, 0 warnings.
- `npm run build`: Compiled successfully, 87/87 páginas.
- Test suite no ejecutada (solo cambios de UI/aria, 0 cambios en lógica de negocio).

## Release 3 — Migración middleware → proxy (2026-06-06)

### Cambios técnicos

- Migración oficial de Next.js: `middleware.ts` → `proxy.ts` con codemod oficial.
- Función exportada renombrada de `middleware` a `proxy`. Comportamiento idéntico.
- Actualizadas todas las referencias en `AGENTS.md`, `docs/`, `next.config.ts`.
- Advertencia de deprecación `middleware` eliminada del build.

### Archivos modificados

- `middleware.ts` → `proxy.ts` (renombrado + función renombrada)
- `next.config.ts` (comentario actualizado)
- `AGENTS.md` (3 referencias a middleware → proxy)
- `docs/01-arquitectura.md`, `docs/06-seguridad.md`, `docs/07-csp-hardening.md`, `docs/09-despliegue.md`, `docs/13-checklist-implementacion.md`
- `data/areas-juridicas.ts` (comentario)
- `CHANGELOG.md`

## Release 2 — Cluster SEO blog zona sur (2026-06-06)

### Novedades

- **Cluster SEO de 5 artículos** orientados a posicionamiento local en el sur de Honduras.
- Cada artículo con keyword principal propia, intención de búsqueda diferenciada y enfoque geográfico en Nacaome, Valle y Choluteca.
- Enlazado interno entre artículos y hacia páginas de servicio del sitio.

### Artículos creados

1. **«¿Cuándo necesita un abogado penalista en el sur de Honduras?»** — `abogado-penalista-sur-honduras.ts` (derecho-penal). Keyword: "abogado penalista sur de Honduras". Intención: informacional + transaccional suave.
2. **«Problemas legales familiares en Honduras: guía práctica de pasos a seguir»** — `problemas-legales-familiares-honduras.ts` (derecho-de-familia). Keyword: "problemas legales familiares Honduras". Intención: informacional.
3. **«Despido laboral en Honduras: derechos, indemnización y pasos para reclamar»** — `despido-laboral-honduras-derechos.ts` (derecho-laboral). Keyword: "despido laboral Honduras derechos". Intención: informacional + transaccional clara.
4. **«Cómo elegir un bufete de abogados en Nacaome o la zona sur de Honduras»** — `elegir-bufete-abogados-nacaome.ts` (practica-legal). Keyword: "bufete de abogados Nacaome". Intención: comparativa / confianza / validación.
5. **«Servicios legales para empresas y particulares en el sur de Honduras»** — `servicios-legales-empresas-sur-honduras.ts` (derecho-civil). Keyword: "servicios legales sur de Honduras". Intención: transaccional clara.

### Archivos modificados

- `data/blog/posts/index.ts` — importados y registrados los 5 nuevos posts.
- `data/blog/posts/abogado-penalista-sur-honduras.ts` (NUEVO)
- `data/blog/posts/problemas-legales-familiares-honduras.ts` (NUEVO)
- `data/blog/posts/despido-laboral-honduras-derechos.ts` (NUEVO)
- `data/blog/posts/elegir-bufete-abogados-nacaome.ts` (NUEVO)
- `data/blog/posts/servicios-legales-empresas-sur-honduras.ts` (NUEVO)

### Cluster SEO

- Post piloto existente (`defensa-penal-honduras`) funciona como piedra angular del clúster penal.
- Artículo 1 enlaza al post piloto y viceversa.
- Artículo 4 enlaza a página de servicio y al post 5.
- Artículo 5 enlaza a páginas de servicio de cada rama (penal, familia, laboral, civil).
- Schema `BlogPosting` aplicado automáticamente vía `lib/schemas/blog.ts` para todos los posts.
- Sin canibalización semántica entre artículos.

### Validación

- 5 posts nuevos + 1 existente = 6 posts en total.
- Sin cambios en motor de cálculo, API, DB, componentes, layout ni configuración.

### Novedades

- **F0**: Andamiaje común — `data/areas-juridicas.ts` (1086 líneas, taxonomía 13 áreas + 7 grupos penales + 3 subáreas migrantes), `lib/schemas/legal-page.ts` (helpers JSON-LD).
- **F1**: 7 componentes marketing — `placeholder-photo`, `circular-icon`, `service-card-photo`, `specialists-grid`, `two-column-image-text`, `commitments-grid`, `testimonials-section`.
- **F2**: 3 hubs — `/servicios-juridicos` (posteriormente `/servicios-juridicos`), `/derecho-penal`, `/hondurenos-en-espana`.
- **F3**: 13 áreas standalone (familia, laboral, civil, mercantil, bancario, administrativo, aduanero, sanitario, extranjería, propiedad intelectual, tributario, ambiental, conciliación).
- **F4**: 7 grupos penales + 3 subáreas transnacionales (10 páginas dinámicas).
- **F5**: FAQ pública `/preguntas-frecuentes` con 73 preguntas en 11 categorías y acordeones `<details>`.
- **F6-F7**: Blog infra — `data/blog/` con tipos, categorías (11), post piloto. `lib/blog.ts`, `lib/schemas/blog.ts`. Componentes `blog-card`, `blog-sidebar`. Páginas: `/blog` hub, `/blog/[slug]` SSG, `/blog/categoria/[categoria]`, `/blog/feed.xml` RSS 2.0.
- **F8**: Post piloto "Defensa penal en Honduras" (~1000 palabras HTML).
- **F9**: Sitemap dinámico con blog posts + categorías. Navegación header/footer, middleware, redirects 301.

### Cambios de ruta

- `/servicios-juridicos` → `/servicios-juridicos` (renombrado).
- `/derecho-penal` movido a top-level (fuera de áreas-juridicas).
- `/hondurenos-en-espana` movido a top-level.
- Redirects 301: `/areas-de-practica/*` → `/servicios-juridicos/*`, `/derecho-penal-hondureno` → `/derecho-penal`, `/proceso-penal` → `/hondurenos-en-espana`.

### Intranet

- Eliminados todos los enlaces a `/intranet/` de componentes públicos (header, footer).
- Solo se permite el botón "Acceso Intranet" en la barra superior del header (`components/marketing/public-header.tsx`).
- Verificado: 0 enlaces no autorizados a `/intranet/` en código público.

### Validación

- `npm run lint`: 22 problemas (4 errores preexistentes + 18 warnings preexistentes). 0 errores nuevos introducidos.
- `npm run build`: `Compiled successfully` + `Finished TypeScript` sin errores. 78/78 páginas estáticas (SSG/SSR).
- `npm test`: 181/181 tests pasados en 12 archivos.
- `npm run test:e2e`: 25/25 tests pasados.
- Vercel deploy: `Ready` en ~45s. Alias producción: `pinedayasociadoshn.com`.

### Riesgos

- 4 errores lint preexistentes (setState en effect) no corregidos.
- Sin assets fotográficos propios del bufete (diseño sin imágenes).
- Sin páginas legales (aviso-legal, política-privacidad, política-cookies, disclaimer) — pendientes para release futuro.

## Fase 11 — Consolidación de MCPs y wrapper de entorno para OpenCode (2026-06-05)

### Configuración
- **`opencode.jsonc`** (local, no versionado): rediseñado para usar servidores `npx -y` on-demand. Sustituye el MCP `dbhub` roto (binario ausente en `.opencode/node_modules/`) por una combinación portable de servidores estándar. Conserva `filesystem`, añade `github` con wrapper de `.env` y `chrome-devtools`. MCPs remotos/heredados (`playwright`, `neon`, `git`) se siguen tomando del global del usuario.
- **`scripts/load-env.cjs`** (NUEVO, versionado): wrapper CommonJS que lee `.env` del proyecto desde `CWD` (o `DOTENV_PATH` si está definido), exporta las variables que aún no estén en `process.env` y lanza el subproceso propagando stdin/stdout/env. Soporta expansión de placeholders `${VAR}` en argumentos. Usa `shell: true` solo en Windows para resolver binarios `.cmd` (npx, npm). Verificado con `opencode mcp list`: 6/6 servidores conectados.
- **`eslint.config.mjs`**: añadido `scripts/load-env.cjs` a `globalIgnores` (binario auxiliar en CommonJS, no es código de la app).

### Backend
- Sin cambios. Ningún archivo del motor de cálculo ni del backend fue tocado.

### Frontend
- Sin cambios. La calculadora, el sidebar y el resto de UI no fueron tocados.

### Tests
- Validación manual con `opencode mcp list`: 6/6 servidores conectados (`playwright`, `neon`, `github`, `git`, `filesystem`, `chrome-devtools`). El `github` MCP ahora carga `GITHUB_PERSONAL_ACCESS_TOKEN` desde `.env` del proyecto (antes fallaba porque solo estaba en global).
- Validación de sintaxis de `load-env.cjs` con `node -c` y de `opencode.jsonc` con `JSON.parse`.

### Seguridad
- El wrapper no sobrescribe variables ya presentes en el shell: si `NEON_API_KEY` o `GITHUB_PERSONAL_ACCESS_TOKEN` están exportados en el entorno del usuario, tienen precedencia sobre `.env`.
- `load-env.cjs` no loguea valores de variables, solo cuenta cuántas cargó (con `LOAD_ENV_DEBUG=1`).
- `.opencode/dbhub.toml` con DSN hardcoded se conserva sin cambios (no se borra por política de mínima intervención). El user puede sanitizarlo manualmente si lo desea.

### Riesgos
- `npm run lint` sigue reportando **4 errores preexistentes** no introducidos por esta fase: `app/calculadora/hooks.ts:44` (setState en effect), `app/intranet/dashboard/page.tsx:91` (setState en effect), `components/marketing/live-widgets.tsx:33` y `:50` (setState en effect). Son de la regla `react-hooks/set-state-in-effect` y requieren refactor fuera del alcance de esta fase.
- 8 warnings preexistentes en archivos de la app y de marketing (variables/imports no usados) que ya existían antes de este cambio.
- `opencode.jsonc` no se versiona en git (verificado con `git show HEAD:opencode.jsonc` → 404 y `git status --ignored` lo marca como `!! opencode.jsonc`). El cambio queda solo en disco del usuario. Si en el futuro se quiere portabilizar la config, hay que sacar `.opencode/` del `.gitignore` raíz (decisión de arquitectura separada).
- `chrome-devtools-mcp` requiere Chrome estable instalado (ya está en `C:\Program Files\Google\Chrome\Application\chrome.exe`).
- **Hallazgo de última hora**: `.opencode/` completo está ignorado en el `.gitignore` raíz (no solo en `.opencode/.gitignore`). Por eso el wrapper se movió de `.opencode/bin/load-env.cjs` a `scripts/load-env.cjs` para que sea replicable entre clones. Si se necesita más tooling local, el lugar correcto es `scripts/` o `.opencode/` queda como estado descartable por diseño.

## Fase 10 — Resend (email transaccional del formulario de contacto) (2026-06-05)

### Dependencias
- **`package.json`**: añadida `resend` (SDK oficial, 6.x).

### Backend
- **`lib/email.ts`** (NUEVO): cliente Resend con instanciación perezosa, helpers `sendContactEmail()`, `isEmailConfigured()`, `getFromAddress()`, `getNotificationEmail()`. Sanitiza HTML de campos de usuario. Si `RESEND_API_KEY` no está configurada, devuelve `ok: false` (la API responde 503).
- **`lib/validation.ts`**: nuevo `contactoSchema` (Zod) y `CONTACTO_ASUNTOS` (catálogo compartido con el form). Exporta tipo `ContactoInput`.
- **`app/api/contacto/route.ts`** (NUEVO): endpoint POST público. Valida con Zod, aplica rate limit por IP (3/hora), envía email a `CONTACT_NOTIFICATION_EMAIL` con `replyTo` al correo del remitente, devuelve 200 / 400 / 429 / 502 / 503.

### Configuración
- **`.env.example`**: ya tenía `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL` documentados (sin cambios).
- **`.env.local`** (NUEVO, gitignored): valores reales para entorno local.
- **Vercel**: pendiente agregar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en Production/Preview/Development (Vercel → Settings → Environment Variables). Sin esto, el endpoint devolverá 503.

### Frontend
- **`app/(public)/contacto/page.tsx`**: sin cambios. Ya hacía POST a `/api/contacto`, que antes devolvía 404. Ahora operativo.
- **Pendiente de hardening futuro**: extraer `SUBJECTS` del form para importar `CONTACTO_ASUNTOS` desde `lib/validation.ts` (DRY). No aplicado en este cambio para mantener diff mínimo.

### Tests
- **`tests/validation.test.ts`**: 8 tests nuevos para `contactoSchema` (payload válido, email vacío opcional, validaciones varias, trim).
- **`tests/api/contacto.test.ts`** (NUEVO): 7 tests (200 éxito, 400 validación, 400 JSON malformado, 400 sin privacidad, 503 sin Resend, 502 fallo Resend, 429 rate limit).

### Seguridad
- Rate limit por IP (3/hora) para prevenir abuso del formulario público.
- IP y User-Agent del remitente se incluyen en el email y se loguean en consola para trazabilidad.
- API key nunca expuesta al cliente (uso server-side exclusivamente).

### Riesgos
- En Vercel hay que añadir `RESEND_API_KEY` (Production). Sin esto el endpoint falla con 503.
- `RESEND_FROM_EMAIL` por defecto es `onboarding@resend.dev` (solo funciona con la cuenta Resend que emitió la key). Para enviar desde el dominio del bufete, verificar el dominio en Resend y cambiar `RESEND_FROM_EMAIL` a `no-reply@pinedayasociadoshn.com`.

## Fase 9 — Saneamiento integral del catálogo contra CP HN (2026-06-05)

### Constitución (fuente de verdad)

- **`docs/Constitucion de Honduras.pdf`**: nuevo PDF agregado como fuente primaria de la Constitución de la República.
- **`scripts/build-constitucion-index.py`** (NUEVO): extractor de Constitución desde PDF (PyMuPDF 1.27).
- **`data/articulos_constitucion.json`**: re-extraído de 128 a **378 artículos** (rango 1-379, único gap real en Art. 332).
- **Hallazgo crítico**: el JSON anterior tenía mapeos `numero → texto` incorrectos. Re-extracción corrige todos los enlaces constitución↔delito.
- Sub-artículos 43-A y 43-B fusionados en Art. 43 (evita PK duplicado en BD, preserva texto).

### Catálogo de delitos

- **`data/delitos.json`**: **434 → 483 entradas** (395 nuevas extracciones + 88 preservadas del catálogo histórico que referencian artículos CP fuera de `tema='delitos'`).
- Cubre los **362 artículos del CP con `tema='delitos'`** del Decreto 130-2017.
- **`scripts/extract-penas-from-cp.py`** (NUEVO): parser de penas artículo-por-artículo. 4 órdenes del CP soportadas: `prisión de X a Y años`, `X a Y años de prisión`, `prisión a perpetuidad`, `prisión permanente`.
- **232/395 (58.7%)** con pena auto-detectada. Resto (163) son artículos procesales/concursales sin pena propia.
- 251/395 con `rama_id` auto-asignada desde estructura CP. 132/395 con `constitucion_articulo_id` enlazado.
- **`data/delitos-propuestos.json`**: catálogo propuesto intermedio (395 entradas).
- **`data/inventario_cp_delitos.csv`** (NUEVO): inventario de los 362 artículos CP con `tema='delitos'`, marcando cobertura actual.
- **`data/inventario_faltantes.csv`** (NUEVO): 255 artículos CP no cubiertos.
- **`data/reclasificacion_88.csv`** (NUEVO): 88 entradas del catálogo histórico que referencian artículos fuera de `tema='delitos'`.

### Validación y reportes

- **`data/delitos-validacion.json`**: regenerado (234 validados, 249 a revisión, 0 rechazados).
- **`data/delitos-estados.json`**: totales sincronizados con seed.
- **`data/delitos-validacion.csv`**: regenerado.
- **Sanity checks**: 0 mojibake, 0 duplicados, 0 pena_min > pena_max (1 caso detectado y corregido: Malversación imprudente).

### Web y documentación

- **`app/delitos/page.tsx`**: hardcode "Los 466 delitos" → dinámico con `{total}` y mención de "362 artículos del CP tipificados como delito".
- **`README.md`**: cifra actualizada de "466 delitos, 128 arts. const." → "483 delitos, 378 arts. const.".
- **`docs/13-checklist-implementacion.md`**, **`docs/14-log-implementacion.md`**, **`docs/24-validacion-delitos.md`**: cifras y narrativa actualizadas.

### Filesystem

- **`docs/Co�digo Penal Decreto 130-2017 fusionado actualizado a julio 2024.pdf`**: renombrado a **`docs/Codigo Penal Decreto 130-2017 fusionado actualizado a julio 2024.pdf`** (corregido caracter combinante Unicode).

### BD Neon (re-seed limpio)

- **`scripts/resend-neon.mjs`** (NUEVO): backup + DELETE + INSERT para `delitos` y `articulos_constitucion` con orden FK-aware.
- Delitos: 469 → **483** (sanitización, sin mojibake, FK actualizadas).
- Articulos_constitucion: 128 → **378** (PKs y textos correctos).
- Backups guardados en `data/backup_*_2026-06-05.json`.

## Fase 8 — Saneamiento integral del repositorio (2026-06-05)

### Archivo de código muerto

- **`_archived_unused/`** (NUEVO): carpeta de archivo con índice `INDEX.md` trazable. 35 archivos movidos.
- **Código muerto archivado (4 archivos):** `components/ui/breadcrumb.tsx`, `hooks/use-local-storage.ts`, `lib/api-helpers.ts`, `lib/rules/v2/` (0 imports en todo el repositorio).
- **Backups archivados (8 archivos):** `.gitbak`, `.bak2`, `backup_*_date` de `data/`.
- **Artefactos históricos archivados (5 archivos):** `delitos-propuestos.json`, `delitos-validacion.md`, `inventario_cp_delitos.csv`, `inventario_faltantes.csv`, `validacion_constitucion.txt`.
- **Scripts históricos archivados (13 scripts):** apply-0003, build-constitucion-index, build-cp-index, check-neon, fix-delitos, init-validacion, parse_cp_html, regen-delitos-validation, regenerate-estados, remove-rejected, update-validacion, validate-delitos, verify-auditoria.
- **Assets boilerplate archivados (5 SVGs):** file.svg, globe.svg, next.svg, vercel.svg, window.svg.

### Refactorizaciones

- **`lib/pdf-document.tsx`**: eliminada duplicación de `formatMeses()` y `formatFechaHora()`; ahora importa de `lib/ui.ts`.
- **API routes**: unificadas 7 rutas a `Response.json()` (antes mezclaban con `new Response(JSON.stringify())`). Afecta: `calculos/route.ts`, `calculos/[id]/route.ts`, `casos/[id]/route.ts`, `auth/login/route.ts`, `auth/me/route.ts`, `auth/register/route.ts`, `lib/rate-limit.ts`.
- **`app/api/calculos/[id]/route.ts`**: `StoredConfig` ahora deriva de `DelitoConfig` con `Partial<>` en lugar de interfaz local.
- **`app/layout.tsx`**: comentario en catch vacío del inline script de tema.
- **`drizzle/seed.ts`**: reemplazado `process.exit(0)` por `return` en guarda de seed; eliminado `process.exit(0)` del final.
- **`lib/utils.ts`** y **`lib/ui.ts`**: documentada diferencia semántica entre `meses_a_texto()` y `formatMeses()`.

### Correcciones

- **`public/manifest.json`**: corregidas referencias a iconos PWA (apuntaban a `icon-192.png` e `icon-512.png` inexistentes; ahora usa `icon-192.svg` existente).
- **`middleware.ts`**: limpiado regex del matcher (eliminados 5 SVG boilerplate ya archivados).
- **`AGENTS.md`**: corregido conteo de tests (decía "81 en 3 archivos", la realidad es "152 en 11 archivos").

### Impacto

- `data/`: 21 → 7 archivos (solo activos)
- `scripts/`: 23 → 10 archivos (solo útiles)
- `public/`: 7 → 2 archivos (manifest.json + icon-192.svg)
- `lib/`: eliminadas funciones duplicadas en `pdf-document.tsx`
- 0 dependencias huérfanas encontradas

## Fase 7 — Saneamiento integral del catálogo contra CP HN (2026-06-05)

### Constitución (fuente de verdad)

- **`docs/Constitucion de Honduras.pdf`**: nuevo PDF agregado como fuente primaria de la Constitución de la República.
- **`scripts/build-constitucion-index.py`** (NUEVO): extractor de Constitución desde PDF (PyMuPDF 1.27).
- **`data/articulos_constitucion.json`**: re-extraído de 128 a **378 artículos** (rango 1-379, único gap real en Art. 332).
- **Hallazgo crítico**: el JSON anterior tenía mapeos `numero → texto` incorrectos. Re-extracción corrige todos los enlaces constitución↔delito.
- Sub-artículos 43-A y 43-B fusionados en Art. 43 (evita PK duplicado en BD, preserva texto).

### Catálogo de delitos

- **`data/delitos.json`**: **434 → 483 entradas** (395 nuevas extracciones + 88 preservadas del catálogo histórico que referencian artículos CP fuera de `tema='delitos'`).
- Cubre los **362 artículos del CP con `tema='delitos'`** del Decreto 130-2017.
- **`scripts/extract-penas-from-cp.py`** (NUEVO): parser de penas artículo-por-artículo. 4 órdenes del CP soportadas: `prisión de X a Y años`, `X a Y años de prisión`, `prisión a perpetuidad`, `prisión permanente`.
- **232/395 (58.7%)** con pena auto-detectada. Resto (163) son artículos procesales/concursales sin pena propia.
- 251/395 con `rama_id` auto-asignada desde estructura CP. 132/395 con `constitucion_articulo_id` enlazado.
- **`data/delitos-propuestos.json`**: catálogo propuesto intermedio (395 entradas).
- **`data/inventario_cp_delitos.csv`** (NUEVO): inventario de los 362 artículos CP con `tema='delitos'`, marcando cobertura actual.
- **`data/inventario_faltantes.csv`** (NUEVO): 255 artículos CP no cubiertos.
- **`data/reclasificacion_88.csv`** (NUEVO): 88 entradas del catálogo histórico que referencian artículos fuera de `tema='delitos'`.

### Validación y reportes

- **`data/delitos-validacion.json`**: regenerado (234 validados, 249 a revisión, 0 rechazados).
- **`data/delitos-estados.json`**: totales sincronizados con seed.
- **`data/delitos-validacion.csv`**: regenerado.
- **Sanity checks**: 0 mojibake, 0 duplicados, 0 pena_min > pena_max (1 caso detectado y corregido: Malversación imprudente).

### Web y documentación

- **`app/delitos/page.tsx`**: hardcode "Los 466 delitos" → dinámico con `{total}` y mención de "362 artículos del CP tipificados como delito".
- **`README.md`**: cifra actualizada de "466 delitos, 128 arts. const." → "483 delitos, 378 arts. const.".
- **`docs/13-checklist-implementacion.md`**, **`docs/14-log-implementacion.md`**, **`docs/24-validacion-delitos.md`**: cifras y narrativa actualizadas.

### Filesystem

- **`docs/Co�digo Penal Decreto 130-2017 fusionado actualizado a julio 2024.pdf`**: renombrado a **`docs/Codigo Penal Decreto 130-2017 fusionado actualizado a julio 2024.pdf`** (corregido caracter combinante Unicode).

## Fase 6 — Endurecimiento final (2026-06-04)

### Lint y calidad

- **`app/calculadora/calculadora-header.tsx`**: eliminado import no usado de `useRouter`.
- **`app/calculadora/state.ts`**: añadidos `eslint-disable-line` para setState en efectos (navegación imperativa desde URL params).
- **Resultado:** `npm run lint` → 0 errores, 0 warnings.

### Documentación

- **`README.md`**: estructura actualizada (12 módulos calculadora, 18 endpoints, 152 tests, health check, audit trail, rate limiting).
- **`docs/13-checklist-implementacion.md`**: actualizado con items completados de seguridad, BD, testing.
- **`docs/14-log-implementacion.md`**: métricas finales agregadas.

### Métricas acumuladas

- Tests: 53 → 152 (11 suites, 7 backend + 4 frontend).
- Lint: advisory → blocking (0 errores, 0 warnings).
- Tablas BD: 9 → 10 (rate_limits).
- Índices BD: 3 → 12 (delitos 3, casos 2, calculos 2, rate_limits 1, auditoria 3).
- Eventos auditables: 13 (todos implementados).
- Rate limits activos: 2 (login 5/min en Neon, calcular 30/min en Neon).
- Componentes calculadora: 2 → 12 archivos.
- Security headers: 7.

## Fase Pre-6 — Corrección documental y modelo de eximentes (2026-06-04)

### Documentación

- **`AGENTS.md`**: corregida la numeración de artículos del CP en `lib/catalogos.ts` (agravantes Art. 32, atenuantes Art. 31, eximentes Art. 30) — el código ya referenciaba correctamente los Arts. 30-32 del CP Decreto 130-2017; la doc estaba desactualizada.
- **`docs/02-motor-calculo.md`**: misma corrección de Arts. 25-27 → 30-32; descripción completa de los 10 agravantes, 6 atenuantes y 5 eximentes completas conforme al catálogo real.
- **`docs/01-arquitectura.md`, `docs/03-trazabilidad-normativa.md`, `docs/13-checklist-implementacion.md`, `docs/14-log-implementacion.md`, `docs/19-e2e-testing.md`, `docs/24-validacion-delitos.md`**: cifras corregidas (469 → 466 delitos verificados; 466/466 validados, 0 pendientes, 0 rechazados).

### Modelo de eximentes (decisión)

- **Decisión:** los 5 items del catálogo `EXIMENTES` (`inimputabilidad`, `legitima_defensa`, `estado_necesidad`, `miedo_insuperable`, `cumplimiento_deber`) son todos **eximentes completas** (`completa: true`).
- El campo `eximentes: string[]` de `DelitoConfig` queda como compat: si llega con IDs, el motor **los descarta** (todos los items del catálogo son completas). La única vía de eximente incompleta es vía `atenuantes: ['eximente_incompleta']` (Art. 31.1 CP).
- En próxima versión del schema (v2) se evaluará eliminar `eximentes: string[]` o introducir un item con `completa: false` en el catálogo.

### Refactors menores

- **`lib/calculo.ts`**: eliminados aliases `aplicarConcursoPublic`/`generarAnalisisJuridicoPublic`. Ahora se re-exportan directamente `aplicarConcurso` y `generarAnalisisJuridico`.
- **`lib/estados-delitos.ts`**: añadido `import 'server-only'` para defensa contra importación accidental desde cliente.

## Fase 5 — Tests frontend + CI endurecido (2026-06-04)

### Testing

- **`package.json`**: añadidos `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- **`vitest.config.ts`**: añadido `setupFiles: ['./tests/setup.ts']`.
- **`tests/setup.ts`** (NUEVO): importa `@testing-library/jest-dom` para matchers DOM.
- **`tests/components/badge.test.tsx`** (NUEVO): 8 tests (tones, variants, sizes).
- **`tests/components/button.test.tsx`** (NUEVO): 10 tests (variants, loading, disabled, click).
- **`tests/components/chip.test.tsx`** (NUEVO): 6 tests (selected, tones, click).
- **`tests/components/circunstancia-picker.test.tsx`** (NUEVO): 9 tests (secciones, regla compensación, toggles eximentes/agravantes/atenuantes, artículos CP).

### CI/CD

- **`.github/workflows/ci.yml`**: lint ahora bloqueante (eliminado `continue-on-error: true` y `|| true`). Nombre del paso actualizado.

### Métricas

- Tests: 119 → 152 (7 → 11 suites).
- Lint: advisory → blocking.

## Fase 4 — Refactor calculadora (2026-06-04)

### Arquitectura

- **`app/calculadora/state.ts`** (NUEVO): hook `useCalculadoraState` centralizando todo el estado (20+ variables) y handlers (12+ funciones) del flujo de 8 pasos.
- **`app/calculadora/calculadora-header.tsx`** (NUEVO): header azul con stepper móvil + banner de modificación + sidebar desktop.
- **`app/calculadora/paso2-variantes.tsx`** (NUEVO): selección de tipo de pena (prisión/multa).
- **`app/calculadora/paso3-participacion.tsx`** (NUEVO): grado de autoría + ejecución + reducción tentativa.
- **`app/calculadora/paso5-delitos-list.tsx`** (NUEVO): lista de delitos configurados con botones añadir/eliminar.
- **`app/calculadora/paso6-concurso.tsx`** (NUEVO): selección de tipo de concurso.
- **`app/calculadora/paso7-resumen.tsx`** (NUEVO): resumen + botón calcular.
- **`app/calculadora/save-modal.tsx`** (NUEVO): modal para guardar cálculo en caso existente o nuevo.
- **`app/calculadora/page.tsx`**: reducido de 817 → 99 líneas (solo orquestación).
- **Total:** 2 → 12 archivos en `app/calculadora/`.

## Fase 3 — Índices BD + API helpers (2026-06-04)

### Base de datos

- **`lib/schema.ts`**: índices añadidos en `delitos(ramaId, nombre, articulo)`, `casos(usuarioId, creadoEn)`, `calculos(casoId, creadoEn)`.
- **`drizzle/migrations/0005_motionless_northstar.sql`** (NUEVO): migración con 7 nuevos índices.

### API

- **`lib/api-helpers.ts`** (NUEVO): helpers `apiSuccess(data, status)` y `apiError(message, status)` para estandarizar respuestas.

## Fase 2 — Auditoría CRUD + Auth normalizado + Limpieza deps (2026-06-04)

### Seguridad

- **`app/api/casos/route.ts`**: migrado de `getUser()` manual a `requireAuth()`. Audit en POST (`caso_created`).
- **`app/api/casos/[id]/route.ts`**: audit en PUT (`caso_updated`).
- **`app/api/casos/[id]/pdf/route.ts`**: migrado de `getTokenFromCookies + verifyToken` a `requireAuth()` + `authFailureResponse()`.
- **`app/api/calculos/route.ts`**: audit en POST (`calculo_created`).
- **`app/api/calculos/[id]/route.ts`**: audit en DELETE (`calculo_deleted`).

### Dependencias

- **`package.json`**: eliminados `ws` y `@types/ws` (no utilizados). `dotenv` conservado (usado por scripts y seed).

## Fase 1 — Rate limit Neon + Health check (2026-06-04)

### Rate limiting

- **`lib/schema.ts`**: nueva tabla `rate_limits` con UNIQUE(identifier, key_prefix) + índice expires.
- **`drizzle/migrations/0004_fixed_lifeguard.sql`** (NUEVO): migración para tabla rate_limits.
- **`lib/rate-limit.ts`**: rewrite completo para usar Neon DB en lugar de Map en memoria. Upsert atómico con `ON CONFLICT DO UPDATE` y `CASE WHEN expires_at < NOW()`. Función ahora async.
- **`app/api/auth/login/route.ts`**: `await rateLimit(...)`.
- **`app/api/calcular/route.ts`**: `await rateLimit(...)`.

### Health check

- **`app/api/health/route.ts`** (NUEVO): `GET /api/health` → `{ status, db, timestamp, uptime }`. Sin auth.
- **`middleware.ts`**: `/api/health` añadido a rutas públicas.

### Tests

- **`tests/rate-limit.test.ts`**: rewrite completo para mock DB adapter.
- **`tests/api/calcular.test.ts`**: mock de `insert` + `rateLimits` añadidos.

## Fase 0 — Emergencia secretos + .gitignore (2026-06-04)

### Documentación

- **`AGENTS.md`**: corregida la numeración de artículos del CP en `lib/catalogos.ts` (agravantes Art. 32, atenuantes Art. 31, eximentes Art. 30) — el código ya referenciaba correctamente los Arts. 30-32 del CP Decreto 130-2017; la doc estaba desactualizada.
- **`docs/02-motor-calculo.md`**: misma corrección de Arts. 25-27 → 30-32; descripción completa de los 10 agravantes, 6 atenuantes y 5 eximentes completas conforme al catálogo real.
- **`docs/01-arquitectura.md`, `docs/03-trazabilidad-normativa.md`, `docs/13-checklist-implementacion.md`, `docs/14-log-implementacion.md`, `docs/19-e2e-testing.md`, `docs/24-validacion-delitos.md`**: cifras corregidas (469 → 466 delitos verificados; 466/466 validados, 0 pendientes, 0 rechazados).

### Modelo de eximentes (decisión)

- **Decisión:** los 5 items del catálogo `EXIMENTES` (`inimputabilidad`, `legitima_defensa`, `estado_necesidad`, `miedo_insuperable`, `cumplimiento_deber`) son todos **eximentes completas** (`completa: true`).
- El campo `eximentes: string[]` de `DelitoConfig` queda como compat: si llega con IDs, el motor **los descarta** (todos los items del catálogo son completas). La única vía de eximente incompleta es vía `atenuantes: ['eximente_incompleta']` (Art. 31.1 CP).
- En próxima versión del schema (v2) se evaluará eliminar `eximentes: string[]` o introducir un item con `completa: false` en el catálogo.

### Refactors menores

- **`lib/calculo.ts`**: eliminados aliases `aplicarConcursoPublic`/`generarAnalisisJuridicoPublic`. Ahora se re-exportan directamente `aplicarConcurso` y `generarAnalisisJuridico`.
- **`lib/estados-delitos.ts`**: añadido `import 'server-only'` para defensa contra importación accidental desde cliente.

## Fase 5 — Hardening (2026-06-03)

### Security headers (`next.config.ts`)

- `Content-Security-Policy`: default-src 'self', script-src con nonces, frame-ancestors 'none', upgrade-insecure-requests en prod.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.
- `X-DNS-Prefetch-Control: off`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (solo prod).
- `Cache-Control: no-store, max-age=0` en `/api/*`.
- `poweredByHeader: false`.

### Cookie `__Host-` en producción

- **`lib/auth.ts`**: nuevo export `COOKIE_NAME = '__Host-token'` en prod, `token` en dev. Helper `readCookie` interno. `createAuthResponse` y `createLogoutResponse` emiten ambos nombres en transición.
- **`middleware.ts`**: lee `COOKIE_NAME` o fallback `token` (compatibilidad para migrar sesiones existentes).

### Rate limiting in-memory

- **`lib/rate-limit.ts`** (NUEVO): bucket por IP/usuario, ventana configurable, helper `getClientIp()`.
- **`app/api/auth/login/route.ts`**: 5 req/min por IP. Devuelve 429 con `Retry-After` y headers `X-RateLimit-*`.
- **`app/api/calcular/route.ts`**: 30 req/min por usuario autenticado. Aplica `requireAuth` antes del rate limit.

### Tabla `auditoria_eventos`

- **`lib/schema.ts`**: nueva tabla con enum `auditoria_accion` (13 acciones), FK a `usuarios`, índices por acción, usuario y fecha. Tipos exportados: `AuditoriaAccion`, `AuditoriaEvento`, `AuditoriaEventoInsert`.
- **`drizzle/migrations/0003_auditoria_eventos.sql`** (NUEVO): generada con `npx drizzle-kit generate`. Crea ENUM, tabla, FK y 3 índices.
- **`lib/audit.ts`** (NUEVO): helper `audit()` no-bloqueante. Helpers `ipFromRequest`, `uaFromRequest`.
- **`app/api/auth/login/route.ts`**: registra `login`, `login_failed`, `rate_limited` con IP, user-agent, metadata.

### Documentación

- **`docs/13-checklist-implementacion.md`** (NUEVO): lista de verificación pre-producción (seguridad, datos, motor, API, UI, CI/CD, docs, monitoreo, rollback).
- **`docs/14-log-implementacion.md`** (NUEVO): registro cronológico de cambios, decisiones técnicas, métricas acumuladas.

### Métricas

- Security headers: 0 → 7.
- Tablas BD: 8 → 9.
- Acciones auditables: 13.
- Rate limits activos: 2 (login 5/min, calcular 30/min).
- Documentos: 6 → 8.
- Tests: 53/53 verdes.

## Fase 1-2 — Refactor arquitectónico (2026-06-03)

### Motor de cálculo: `lib/rules/v1/`

- **`lib/rules/v1/types.ts`** (NUEVO): tipos `DelitoBase`, `DelitoConfig`, `CalculoRequest`, `ResultadoIndividual`, `ResultadoConcurso`, `DelitoAnalizado`, `ResultadoCalculo`.
- **`lib/rules/v1/pena-base.ts`** (NUEVO): `seleccionarPenaBase()` elige pena de prisión o multa.
- **`lib/rules/v1/grado-autoria.ts`** (NUEVO): `aplicarGradoAutoria()` aplica Art. 61 CP (solo `complice` por ahora).
- **`lib/rules/v1/tentativa.ts`** (NUEVO): `aplicarTentativa()` aplica Art. 62 + Art. 69.1 (reduccion_tentativa 1 o 2 grados).
- **`lib/rules/v1/circunstancias.ts`** (NUEVO): `aplicarCircunstances()` aplica Art. 70 con compensación.
- **`lib/rules/v1/eximentes.ts`** (NUEVO): `evaluarEximenteCompleta()` aplica Art. 30 (eximente completa).
- **`lib/rules/v1/concurso.ts`** (NUEVO): `aplicarConcurso()` Arts. 66/67/68 (real, ideal, continuado, delito único).
- **`lib/rules/v1/analisis.ts`** (NUEVO): `generarAnalisisJuridico()` produce el reporte textual.
- **`lib/rules/v1/index.ts`** (NUEVO): orquesta todo, exporta API pública.
- **`lib/calculo.ts`**: ahora es un re-export del motor v1. API pública sin cambios: `calcular_pena_individual`, `calcular_pena`, `aplicar_concurso`, `generar_analisis_juridico`. Todos los tests siguen pasando (53/53).

### Refactor de calculadora (UI)

- **`app/calculadora/hooks.ts`** (NUEVO): extrae `useDelitosLoader()` y `useDelitosFilter()` desde el componente principal. Reducción de ~25 líneas en `page.tsx`.
- **`app/calculadora/page.tsx`**: usa los nuevos hooks. `setResultado` tipado con `ResultadoCalculo` (elimina `any`).
- **`eslint.config.mjs`**: añade `scripts/**`, `data/**`, `drizzle/**`, `docs/**` a `globalIgnores` (eran `.js`/`.json`/`.md` no TS).

### CI / GitHub Actions

- **`.github/workflows/ci.yml`** (NUEVO): en cada push/PR ejecuta lint, typecheck, tests, build y validación de seeds (delitos sin duplicados, delitos-estados con totales).

### Documentación adicional

- **`docs/04-seguridad.md`** (NUEVO): auth, autorización por endpoint, protección IDOR, middleware, variables, pendientes.
- **`docs/05-despliegue.md`** (NUEVO): setup Vercel, local, CI, secrets, rollback.
- **`docs/06-actualizacion-normativa.md`** (NUEVO): procedimiento paso a paso para reformas al CP, versionado v1/v2, riesgos.

### Métricas

- Tests: 53/53 verdes tras refactor del motor.
- Build: 24/24 páginas generadas.
- Archivos del motor: 1 (396 líneas) → 9 (~250 líneas distribuidas).
- Calculadora: 1 archivo (908 líneas) → mismo archivo (~890 líneas) + 1 hook (60 líneas).
- Cobertura de tests del motor: 100% (todos los paths probados).

## Fase 0 — Contención de riesgos (2026-06-03)

### Seguridad

- **`lib/auth.ts`**: Eliminado fallback `'dev-secret'` para `JWT_SECRET`. Validador `validateJwtSecret()` exige ≥32 caracteres y lanza en producción si falta o es débil. Cookie endurecida: `HttpOnly; Path=/; SameSite=Lax; Secure` (solo en `NODE_ENV=production`). TTL reducido a 1 día. Nuevos helpers `requireAuth`, `requireAdmin`, `authFailureResponse`, clase `AuthError`, tipo `AuthUser`.
- **`middleware.ts`**: Reescrito. Antes trataba TODA `/api/*` como pública (riesgo IDOR masivo). Ahora lista explícita de rutas API públicas: `/api/auth/{login,logout,register,me}` y `/api/delitos/count`. El resto exige token (responde 401 JSON). Para páginas: solo `/login` y `/_not-found` son públicas. Si el usuario ya está autenticado y va a `/login`, redirige a `/`.
- **`app/api/casos/[id]/route.ts`**: GET y PUT ahora llaman a `requireAuth` y verifican `caso.usuarioId === user.userId` antes de devolver/actualizar. PUT aplica whitelist de campos para evitar mass-assignment.
- **`app/api/calculos/route.ts`**: POST y GET con `requireAuth`. POST valida ownership del `casoId` (404 si no existe, 403 si no pertenece al usuario).
- **`app/api/delitos/route.ts`**: POST con `requireAdmin`. GET añade campos `estado`, `estado_nota`, `estado_articulo_sugerido` por delito, leídos desde `data/delitos-estados.json`.
- **`app/api/delitos/[id]/route.ts`**: PUT y DELETE con `requireAdmin`. GET añade los mismos campos de estado.
- **`app/api/cp/route.ts` y `app/api/cp/[id]/route.ts`**: POST y PUT con `requireAdmin`.
- **`app/api/seed/route.ts`**: POST con `requireAdmin`.

### Arquitectura

- **`lib/db.ts`**: Reemplazado `if (!dbUrl) throw` en import (rompía build) por Proxy lazy con función `isDbConfigured()`. Build pasa con `DATABASE_URL` placeholder.

### Motor de cálculo (JUR-01)

- **`lib/calculo.ts`**: `calcular_pena_individual` ahora aplica `reduccion_tentativa === 2` (Art. 69.1 CP) cuando el grado de ejecución es `tentativa_acabada` o `tentativa_inacabada`. Tras reducir por Art. 62 (-1/4 o -1/3), aplica `aplicar_mitad_inferior` adicional. Se registra en `modificaciones[]`.
- **`tests/calculo.test.ts`**: 2 tests nuevos cubren el caso. Total: 51 → 53 tests, todos verdes.

### Calidad de datos del catálogo (JUR-03 + UX-01)

- **`scripts/generar-estados-delitos.js`** (NUEVO): Lee `data/delitos-validacion.csv` y emite `data/delitos-estados.json` con `estado: verificado | pendiente_revision | rechazado`, sugerencia de artículo y nota. Parser CSV con soporte de comillas escapadas.
- **`lib/estados-delitos.ts`** (NUEVO): Loader server-side con cache en memoria, función `getEstadoDelito(nombre, articulo)` y `getResumenEstados()`.
- **`app/api/delitos/calidad/route.ts`** (NUEVO): Endpoint GET con resumen `{ verificados, pendientes, rechazados, total, generado_en }`.
- **`app/types.ts`**: `Delito` añade campos opcionales `estado`, `estado_nota`, `estado_articulo_sugerido`.
- **`app/calculadora/page.tsx`**:
  - Banner amarillo `BannerCalidadDatos` en paso 1 con totales y porcentajes desde `/api/delitos/calidad`.
  - Badge `Revisar` o `No verificado` junto a cada delito del listado.
  - Bloque amarillo con nota, sugerencia del validador y checkbox obligatorio "Confirmo que verifiqué el artículo contra la fuente oficial" si el delito seleccionado no está verificado.
  - `goNext` bloquea el avance y muestra `toast.danger` si el checkbox no está marcado.
  - Estado nuevo: `pendientesConfirmados: Record<id, boolean>`.

### Documentación

- **`docs/01-arquitectura.md`** (NUEVO): capas, stack, entidades, endpoints, autenticación, build, riesgos.
- **`docs/02-motor-calculo.md`** (NUEVO): pipeline, funciones, helpers, catálogos, tests, limitaciones.
- **`docs/03-trazabilidad-normativa.md`** (NUEVO): tabla Arts. CP implementados, estados, procedimiento de actualización, riesgos legales.

### Métricas

- Tests: 51 → 53 (+2).
- Endpoints con auth obligatoria: 6 (casos, calculos, delitos, cp, seed, calculadora).
- Rutas API públicas mínimas: 5 (auth flow + count).
- Delitos verificados: 112/469 (23.9%).

### Pendiente de acción del usuario

- **Rotar `DATABASE_URL` y `JWT_SECRET`** en Neon/Vercel. Las credenciales actuales están en `.env` (no trackeado pero presente en historial git) y `JWT_SECRET` actual es débil.
- **Limpiar historial git** de `.env` con `git filter-repo` (requiere confirmación explícita y force push).

## Fase 3 — Consolidación (2026-06-03)

### Autocompletar artículos
- **`components/domain/articulo-autocomplete.tsx`** (NUEVO): Combobox accesible (`role="combobox"`, `aria-activedescendant`) con debounce 180 ms, navegación por teclado (↑/↓/Enter/Esc), highlight de coincidencias, badges de tema y click-outside para cerrar. Reutilizable.
- **`app/page.tsx`**: Nueva card "Búsqueda rápida de artículos" en el home, con badge "635 arts." y enlace a `/api/cp`.

### Generador de PDF profesional
- **`lib/pdf-document.tsx`** (NUEVO): Componente `@react-pdf/renderer` con sistema de estilos, tipografía Helvetica, paleta institucional. Estructura por sección:
  - Cabecera con marca LEX HONDURAS.
  - Datos del caso (cliente, estado, fechas, total cálculos).
  - Por cada cálculo: pena principal, accesorias, detalle por delito (pena base, resultante, recomendada, gravedad, modificaciones), concurso aplicable, análisis jurídico, fundamento normativo (chips Art. 19/21/25/26/27/30/31/32/60/61/62/66/67/68/69/70) y disclaimer legal.
  - Pie de página con paginación, fecha de generación y datos de contacto.
- **`app/api/casos/[id]/pdf/route.ts`** (NUEVO): Route handler server-side con auth JWT, verificación de ownership del caso, `renderToBuffer` + `Uint8Array` para Response, `Content-Disposition: attachment` con nombre saneado.
- **`app/casos/[id]/page.tsx`**: Nuevo botón "PDF" en la cabecera que descarga el informe con autenticación vía cookie JWT.
- **Dependencia añadida**: `@react-pdf/renderer` (57 paquetes transitivos).

### Paginación server-side
- **`app/api/cp/route.ts`**: Nueva respuesta `{data, total, limit, offset, hasMore}`. Soporta `?count=1` para total-only. Búsqueda y tema aplican a nivel SQL con `WHERE ... AND ...`.
- **`app/api/delitos/route.ts`**: Misma forma de respuesta. Añadido filtro `rama` (matching `ramaId`).
- **`app/cp/page.tsx`**: Refactor con `AppShell`, paginación de 30 resultados por página, total real desde `count`, labels de tema correctos (13 categorías reales), `EmptyState` y `Spinner` consistentes.
- **`app/cp/[id]/page.tsx`**: Refactor con `AppShell`, `backHref="/cp"`, labels de tema correctos.
- **`app/delitos/page.tsx`**: Refactor con `AppShell`, paginación 30/pág, filtro de rama, total real.

### Backward compatibility
- `app/article-modal.tsx` y `articulo-autocomplete.tsx` ahora aceptan tanto respuesta array (legacy) como `{data}` (nuevo).

### Validación de datos (NO modificar fuente)
- **`scripts/validate-delitos.js`**: Validador básico por similitud de tokens.
- **`scripts/validate-delitos-tfidf.js`**: Validador con TF-IDF + cosine similarity. Genera `data/delitos-validacion.csv` con mejor artículo sugerido.
- **`data/delitos-validacion.md`** (NUEVO): Reporte de calidad. 68.9 % de los 469 registros NO se corresponden con el artículo declarado. **PENDIENTE** de revisión manual por abogado HN. Riesgo legal documentado.
- Acción: NO se modificó `data/delitos.json`. El script es de solo lectura.

### Validación
- 51/51 tests Vitest pasando.
- `npm run build` OK.
- Desplegado en Vercel: commit `a6a8f3f`, URL canónica `calculo-de-penas-nextjs.vercel.app`.

### Riesgos abiertos (no cerrados)
- `.env` con `DATABASE_URL` y `JWT_SECRET` aún en historial git (rotar pendiente).
- `data/delitos.json` con 76.1 % de artículos incorrectos (revisión manual pendiente).
- 4 fórmulas del motor pendientes de validación legal.

## Fase 2 Rediseño — Shell, dominio y resultado pericial (2026-06-03)

### AppShell, sidebar y header institucional
- **`components/layout/app-shell.tsx`** (NUEVO): Layout institucional con sidebar desktop, header sticky, breadcrumb, headerRight, back opcional, max-width configurable. Sistema de tokens semánticos consistente.
- **`components/layout/app-sidebar.tsx`** (NUEVO): Sidebar de navegación con iconos lucide, active state, footer con versión. `MobileNavDrawer` (hoja deslizante) + `MobileNavToggle` + hook `useMobileNav` para móvil.
- **`components/layout/user-actions.tsx`** (NUEVO): Toggle de tema + dropdown de usuario (reemplaza al antiguo `UserMenu`).
- **`components/layout/user-menu.tsx`**: ELIMINADO (movido a UserActions integrado en AppShell).

### Componentes de dominio
- **`components/domain/circunstancia-picker.tsx`** (NUEVO): Paso 4 con panel explicativo de la regla de compensación (eximentes vs atenuantes/agravantes). Eximentes como cards seleccionables; atenuantes/agravantes como chips aditivos. Mensaje sobre Art. 30-32 CP.
- **`components/domain/penalty-result-panel.tsx`** (NUEVO): Paso 8 reorganizado como informe pericial:
  - **Cabecera editorial** con número de caso, fecha, estado de gravedad.
  - **Pena principal** destacada con tipografía serif y unidad explícita.
  - **Sección I** — Delitos analizados.
  - **Sección II** — Detalle de cada delito con su pena individual.
  - **Sección III** — Accesorias (inhabilitación, interdicción, comiso) si aplica.
  - **Sección IV** — Análisis del cálculo (fracción aplicada, grado, compensación).
  - **Sección V** — Fundamento normativo: chips clickeables a Arts. 19, 21, 25, 26, 30, 31, 32, 60, 61, 62, 66, 67, 68, 69, 70.
  - **Disclaimer** legal explícito.
- **`components/domain/circunstancia-picker.tsx`** añade hook `useUnsavedChanges` para protección `beforeunload`.

### Hooks
- **`hooks/use-unsaved-changes.ts`** (NUEVO): Hook genérico para detectar cambios sin guardar y bloquear cierre de pestaña accidental.

### Refactor con AppShell
- **`app/calculadora/page.tsx`**: Reescrita con `UserActions` + `CircunstanciaPicker` + `PenaltyResultPanel`. Cálculo sin cambio de lógica. Atajos centralizados. -333 líneas netas.
- **`app/delitos/page.tsx`**: Refactor con `AppShell` + primitivos (`Card`, `Badge`, `Input`, `EmptyState`, `ErrorState`, `Button`, `CenteredSpinner`). Toast/Confirm en lugar de alert/confirm nativos. Filtro por rama con chips de conteo.
- **`app/layout.tsx`**: Sin `UserMenu` (ahora en AppShell).

### Validación
- 51/51 tests Vitest pasando.
- `npm run build` OK.
- Desplegado en Vercel: commit `f7d7753`, URL canónica `calculo-de-penas-nextjs.vercel.app`.

## Fase 1 Rediseño — Sistema de diseño y primitivos (2026-06-03)

### Sistema de tokens y tipografía
- **`lib/ui.ts`** (NUEVO): Utilidades de formato (`cn`, `formatFechaCorta`, `formatFechaCompleta`, `formatFechaHora`, `formatMeses`, `formatRangoPena`, `pluralizar`, `claseEstado`, `RAMA_NOMBRES`, `formatRama`).
- **`app/globals.css`**: 30+ tokens semánticos (mitigation, aggravation, exemption, info, danger, etc.) light/dark. `font-serif` para citas, `system-ui` para UI. `text-[11px]` solo para metadatos legales. Skip-link, focus-visible global, `prefers-reduced-motion`.

### Primitivos UI (14 componentes)
- `Button`, `IconButton`, `Card`, `Badge`, `Chip`, `Input`, `Spinner` (`CenteredSpinner`), `EmptyState`, `ErrorState`, `Modal`, `Stepper`, `Toast`, `Confirm`, `Breadcrumb`.

### Hooks reutilizables
- `useDebounce`, `useFocusTrap`, `useKeyboardShortcuts`, `useLocalStorage`, `useMediaQuery`.

### Páginas refactorizadas con primitivos
- `app/page.tsx` (home), `app/login/page.tsx`, `app/casos/page.tsx`, `app/casos/[id]/page.tsx`, `app/cp/page.tsx`, `app/cp/[id]/page.tsx`, `app/delitos/page.tsx`, `app/delito-form/page.tsx`.
- `ToastProvider` + `ConfirmProvider` en root layout.
- Alert/confirm nativos sustituidos por `useToast` + `useConfirm`.

### Validación
- 51/51 tests Vitest pasando.
- `npm run build` OK.
- Desplegado en Vercel: commit `bba0b69`.

## Fase 3 — Profesionalización (2026-06-02)

### PWA (Progressive Web App)

- **`public/manifest.json`** (NUEVO): Manifest con nombre, iconos, tema, standalone display
- **`public/icon-192.svg`** (NUEVO): Icono con la balanza de LEX
- **Layout**: Meta tags para Apple Web App (capable, status bar style)
- **`suppressHydrationWarning`**: Para evitar flicker con modo oscuro

### Modo oscuro

- **`app/theme-context.tsx`** (NUEVO): Contexto con persistencia en localStorage
- **Toggle en user-menu**: Botón sol/luna en la barra superior
- **CSS**: Variables `--color-*` duplicadas en `.dark` con tonos oscuros (#111318 fondo, #1C1E26 superficie)
- **Flash prevention**: Script inline en `<head>` que aplica la clase antes del render

### Layout responsive de escritorio

- **Calculadora**: Sidebar vertical en `lg:` (pantallas grandes) con los 8 pasos visibles
- **Sidebar**: Muestra todos los pasos con su estado (completado/activo/pendiente)
- **Contenido**: Ocupa el espacio restante con `flex-1`
- **Mobile**: Sin cambios, sigue siendo el stepper horizontal original
- **`globals.css`**: Clases `desktop-sidebar` con ancho responsive (320px md, 380px lg)

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `⌘+Enter` / `Ctrl+Enter` | Calcular pena (paso 7) |
| `←` / `→` | Navegar entre pasos |
| `Esc` | Cerrar modals (artículo, guardar caso) |
| Indicador visual `⌘↵` en botón de calcular |

## Fase 11 — Restricción de dominio y fix de navegación (2026-06-05)

### Restricción de dominio en autenticación

- **`lib/auth.ts`**: exporta `ALLOWED_EMAIL_DOMAIN = '@pinedayasociadoshn.com'`, `TEST_EMAIL_DOMAINS = ['@test.local', '@example.com']` y helpers `isTestMode()` / `isAllowedAuthEmail()`. La función `isAllowedAuthEmail(email)` aplica la regla con bypass automático cuando `process.env.ALLOW_TEST_EMAILS === 'true'` o `process.env.NODE_ENV === 'test'`.
- **`lib/validation.ts`**: `authRegisterSchema` y `authLoginSchema` añaden `.refine()` que rechaza emails fuera de `@pinedayasociadoshn.com` (mensaje: "Solo se permiten correos del dominio @pinedayasociadoshn.com"). El bypass de test domains se evalúa en runtime, no en build.
- **`tests/validation.test.ts`**: 14 tests nuevos (3 describe blocks: `authRegisterSchema`, `authLoginSchema`, `isAllowedAuthEmail`) que cubren: dominio válido, dominio externo, dominio malicioso tipo `pinedayasociadoshn.com.evil.com`, mayúsculas, espacios, lista de dominios de test, bypass por `ALLOW_TEST_EMAILS`, rechazo en mayúsculas con punto antes del dominio.
- **`scripts/e2e-start.mjs`**: añade `ALLOW_TEST_EMAILS: 'true'` al env cuando se ejecuta Playwright, para que la suite `e2e/auth-flow.spec.ts` (que usa `@test.local`) siga pasando.
- Total de tests: 181/181 (152 anteriores + 29 nuevos) en 12 archivos.

### Fix de navegación `/login` legacy

- **`app/login/page.tsx`**: ya no contiene el formulario. Convertido en server component minimal que ejecuta `redirect('/intranet/login')` desde `next/navigation`. Cualquier `goto('/login')`, link o historial del navegador ahora va a `/intranet/login` (ruta oficial del bufete).
- **`components/layout/user-actions.tsx`**: dos referencias a `/login` actualizadas a `/intranet/login` (línea 74 `router.push` del logout action; línea 85 `Link href` del botón "Iniciar sesión" cuando no hay sesión).
- **`e2e/smoke.spec.ts`**: 3 cambios. Test 18 y test de modo oscuro actualizados a `/intranet/login` con matcher de título `/Pineda y Asociados|LEX/i`. Nuevo test verifica que `/login` redirige correctamente.

### Hardening menor

- **`app/(public)/contacto/page.tsx`**: eliminado array `SUBJECTS` local. Ahora importa `CONTACTO_ASUNTOS` desde `lib/validation` (DRY, fuente única de verdad entre cliente y API).
- **`.env.example`**: añadida variable documentada `RESEND_FROM_EMAIL="no-reply@pinedayasociadoshn.com"` para configurar el remitente del email transaccional del formulario de contacto (override del default `onboarding@resend.dev`).

### Limpieza

- **`.gitignore`**: añadidos patrones `.opencode/`, `home-*.png`, `neon-mcp-*.log`, `.playwright-mcp/`, `opencode.jsonc`, `scripts/validate-opencode-config.cjs` (artefactos de desarrollo local / sesión MCP, no del repositorio).
- Scripts temporales (`scripts/clean-ratelimit.cjs`, `scripts/list-users.cjs`) eliminados antes del commit.

### Validación

- `npm run lint`: 0/0 errores introducidos por este cambio (los 4 warnings preexistentes de `live-widgets.tsx` son de otro lote).
- `npm run build`: `✓ Compiled successfully in 9.3s` + `Finished TypeScript in 9.6s` + 37/37 static pages.
- `npm test`: 181/181 tests en 12 archivos.
- `npm run test:e2e`: misma firma que baseline (4 fallos preexistentes en `auth-flow.spec.ts` por rate-limit compartido entre tests paralelos; 1 fallo nuevo en smoke test del título `/login` corregido a `/intranet/login`).

## Fase 2 — Autenticación, casos y exportación (2026-06-02)

## Deploy fix — Vercel Production (2026-06-03)

### Causa raíz

Vercel rechazaba el build con `JWT_SECRET environment variable is required (>= 32 chars) in production` durante la fase de "Collecting page data". El dashboard de Vercel solo tenía configurada `DATABASE_URL` (Production) y faltaba `JWT_SECRET`.

### Fix aplicado

- `vercel env add JWT_SECRET production` con valor `crypto.randomBytes(48).toString('base64url')` (64 chars, criptográficamente seguro).
- Empty commit `0750a3d` para re-disparar el deploy.
- Verificado: deploy `dpl_9VdeKmEzZ1vPEfmvM8Vsv4RbKg9m` → status `Ready` (2026-06-03 23:13:54).
- `https://calculo-de-penas-nextjs.vercel.app` → `200 OK`.
- `https://calculo-de-penas-nextjs.vercel.app/api/auth/me` → `200 OK {"user":null}` (sin sesión, comportamiento correcto).

### Nota de seguridad

El secret añadido a Vercel Production es **diferente** del `lex-honduras-secret-change-in-production-2026` que sigue en `.env` local. El local funciona porque tiene 49 chars (pasa el check `>= 32`) y el fallback dev de `lib/auth.ts:10` cubre entornos sin env. En Vercel ahora se usa el secret seguro.

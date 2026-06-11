# LEX HONDURAS — Motor de Cálculo de Penas

Aplicación web para el cálculo de penas según el **Código Penal de Honduras (Decreto 130-2017)** y reformas vigentes.

> **🧠 Para agentes IA**: Este repositorio tiene un protocolo obligatorio en [`AGENTS.md`](./AGENTS.md). Léelo antes de cualquier modificación. Contiene la arquitectura actual, fuentes de datos, reglas del Blog CMS, FAQ CMS, calculadora y restricciones críticas que debes respetar.

Público objetivo: profesionales del derecho que necesitan determinar penas con precisión técnica.

Stack: Next.js 16 + React 19 + Tailwind CSS v4 + Neon PostgreSQL + Drizzle ORM + JWT + Vitest + Playwright.

## Estructura

```
app/
  (public)/                → Sitio web público (marketing + blog + FAQ)
  calculadora/             → Calculadora de penas (8 pasos)
  intranet/                → Dashboard autenticado
  api/                     → API routes (18+ endpoints)
lib/
  rules/v1/                → Motor de cálculo modular (9 archivos)
   schema.ts                → Esquema Drizzle ORM (14 tablas)
  auth.ts                  → JWT + bcrypt
  rate-limit.ts            → Rate limiting via Neon DB
  audit.ts                 → Auditoría no bloqueante
  email.ts                 → Resend (formulario contacto)
  datetime.ts              → Zona horaria Honduras (UTC-6)
  validation.ts            → Zod schemas
data/                      → Datos semilla
  delitos.json             → 483 delitos del CP hondureño
  ramas_juridicas.json     → 119 registros
  articulos_constitucion.json → 378 registros
components/
  marketing/               → 20+ componentes de UI pública (incluye Breadcrumbs, ServiceCard)
  ui/                      → 13 componentes reutilizables
  domain/                  → Componentes de dominio legal
  layout/                  → Layout app-sidebar, app-shell
tests/                     → 13 suites (185 tests)
e2e/                       → Tests E2E (Playwright, 29 tests)
docs/                      → Documentación técnica (15 archivos)
```

## Motor de cálculo

| Concepto | Artículo | Fórmula |
|---|---|---|
| Cómplice | Art. 61 CP | Pena inferior en 1/3 |
| Tentativa acabada | Art. 62 CP | Pena inferior en 1/4 |
| Tentativa inacabada | Art. 62 CP | Pena inferior en 1/3 |
| 1-2 agravantes | Art. 70.b CP | Mitad superior |
| 1 atenuante | Art. 70.c CP | Mitad inferior |
| 3+ agravantes | Art. 70.e CP | Límite máximo |
| 2+ atenuantes | Art. 70.d CP | Límite mínimo |
| Agravantes + atenuantes | Art. 70.f CP | Compensación |
| Concurso real | Art. 66 CP | Suma, límite triple (30/40 años) |
| Concurso ideal | Art. 67 CP | +1/3, sin exceder suma |
| Delito continuado | Art. 68 CP | Mitad superior + hasta 1/3 |
| Aumento en fracción | Art. 69.1 CP | [máx, máx×(1+fracción)] |
| Disminución en fracción | Art. 69.2 CP | [mín×(1-fracción), mín] |

## Desarrollo

```bash
npm install
npm run dev            # Servidor de desarrollo
npm test               # 185 tests unitarios (Vitest, 13 suites)
npm run test:e2e       # 29 tests E2E (Playwright)
npm run lint           # ESLint (0 errores, 0 warnings)
npm run build          # Turbopack build + TypeScript check
```

## Despliegue

- Producción: Vercel (pinedayasociadoshn.com)
- Base de datos: Neon PostgreSQL (Plan Free, PITR 7 días)
- CI: GitHub Actions

## Configuración SEO

### Variables de entorno SEO

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SITE_URL` | URL canónica del sitio | Sí |
| `NEXT_PUBLIC_NOINDEX` | `"true"` bloquea indexación global | Sí (usar `"false"` en prod) |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | Código de verificación de Google Search Console | No (pero recomendada) |
| `NEXT_PUBLIC_GA_ID` | ID de medición de Google Analytics 4 (G-XXXXXXXXXX) | No (pero recomendada) |
| `NEXT_PUBLIC_CLARITY_ID` | ID de proyecto de Microsoft Clarity | No |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK` | URL del perfil de Facebook | No |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` | URL del perfil de Instagram | No |
| `NEXT_PUBLIC_SOCIAL_TIKTOK` | URL del perfil de TikTok | No |

### Cómo activar Google Search Console

1. Ir a [Google Search Console](https://search.google.com/search-console) y añadir propiedad (tipo "Prefijo de URL": `https://www.pinedayasociadoshn.com`).
2. Elegir método "Metaetiqueta HTML".
3. Copiar el código de verificación (solo el valor del atributo `content`, ej: `AbCdEfGhIjKlMnOpQrStUvWxYz`).
4. Configurar la variable de entorno en Vercel: `NEXT_PUBLIC_GOOGLE_VERIFICATION=<código>`.
5. Tras el deploy, hacer clic en "Verificar" en GSC.
6. Una vez verificada, ir a Sitemaps → Añadir sitemap → `sitemap.xml`.

### Cómo activar Google Analytics 4

1. Crear propiedad en [Google Analytics](https://analytics.google.com).
2. Obtener el ID de medición (formato `G-XXXXXXXXXX`).
3. Configurar la variable en Vercel: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`.
4. Tras 24h, verificar que los datos de tráfico aparecen en GA4.

### Cómo activar Microsoft Clarity

1. Crear proyecto en [Microsoft Clarity](https://clarity.microsoft.com).
2. Obtener el ID del proyecto.
3. Configurar la variable en Vercel: `NEXT_PUBLIC_CLARITY_ID=<id>`.

### IndexNow

El script `scripts/submit-indexnow.mjs` envía todas las URLs a los buscadores compatibles con IndexNow (Bing, Yandex). El host se deriva de `NEXT_PUBLIC_SITE_URL`.

**Automatización:** IndexNow se ejecuta automáticamente tras cada build exitoso en Vercel (`postbuild` en `package.json`).

```bash
npm run indexnow:dry      # Simular
npm run indexnow          # Enviar URLs reales
```

### Estado actual de servicios SEO

| Servicio | Estado |
|----------|--------|
| Google Search Console | ✅ Verificado + sitemap enviado |
| Google Analytics 4 | ✅ Activo (`G-L2PGBN3SWK`) |
| IndexNow (Bing) | ✅ Automatizado post-build |
| Indexación | ✅ Activada (`NEXT_PUBLIC_NOINDEX=false`) |
| CSP | ✅ Compatible con GA4 |

---

## Panel de Administración (Intranet)

El panel `/intranet/admin/` permite gestionar Blog y FAQ con editor WYSIWYG (TipTap), categorías reales y persistencia directa en base de datos.

### Acceso

- URL: `https://www.pinedayasociadoshn.com/intranet/admin/blog`
- Autenticación JWT requerida (solo usuarios con rol `admin`).
- La sesión se gestiona mediante cookies `__Host-token` + `__Host-profile`.

### Blog — `/intranet/admin/blog`

- **Listado**: Tabla con título, categoría, estado (publicado/borrador), fecha, acciones (editar/publicar/eliminar/duplicar/ver).
- **Buscar**: Por texto (título/descripción).
- **Filtros**: Por categoría (dropdown con categorías reales de `data/blog/categories.ts`) y por estado (todos/publicados/borradores).
- **Orden**: Por fecha, título o estado (clic en cabecera de columna).
- **Crear/Editar**: Ruta `/intranet/admin/blog/[id]` (usa `nuevo` para crear).
  - **Editor con doble pestaña**: Visual (WYSIWYG TipTap) y Código (HTML directo). Conversión bidireccional.
  - Editor WYSIWYG: **TipTap** con soporte para párrafos, H2/H3, negrita, cursiva, subrayado, tachado, color, highlight, alineación, listas (bullet, numerada, checklist), enlaces, undo/redo.
  - Campos: título, slug (auto-generado desde título), descripción, contenido HTML, categoría (dropdown real), fecha publicación, tags (con auto-generación), autor, tiempo lectura (con cálculo automático), imagen portada (URL o subida), destacado, publicado.
  - **Subida de imagen destacada**: Botón "Subir imagen" que envía el archivo a `POST /api/admin/upload`. La imagen se valida (JPEG/PNG/WebP, máx 10 MB), se nombra según el slug del post y se guarda en `/public/images/blog/`. Muestra vista previa.
  - **Generador automático de posts**: El botón "Generar post" crea un artículo completo con título, slug, descripción, cuerpo HTML estructurado (introducción, marco legal, requisitos, plazos, documentación, recomendaciones, conclusión), tiempo de lectura y tags. El cuerpo se genera en formato HTML compatible con los posts existentes. **Rate limit**: 10 generaciones cada 5 minutos por usuario.
  - Al guardar: el contenido se sanitiza (elimina scripts, iframes, event handlers) y se persiste en PostgreSQL (`blog_posts` table).
  - Al publicar: `revalidatePath` invalida caché ISR de `/blog`, `/blog/[categoria]` y `/blog/[categoria]/[slug]`.
  - **Aviso de cambios sin guardar**: Indicador visual y confirmación beforeunload.
  - **Vista previa**: Enlace "Ver en web" disponible para posts publicados.

### FAQ — `/intranet/admin/faq`

- **Listado**: Agrupado por categoría, expandible, con estado (público/borrador) y orden.
- **Buscar**: Filtro por texto (pregunta/respuesta).
- **Filtros**: Por categoría (dropdown real) y por estado (todos/publicados/borradores).
- **Crear**: Formulario con categoría (dropdown de `data/faq-categories.ts`), pregunta y respuesta (editor WYSIWYG TipTap con soporte para párrafos, negrita, cursiva, listas y enlaces).
- **Editar**: Inline, con editor WYSIWYG + checkbox de publicado.
- **Reordenar**: Flechas arriba/abajo ajustan `sortOrder`.
- **Eliminar**: Con confirmación modal.
- **Categorías**: Dropdown usa `data/faq-categories.ts` — 11 categorías predefinidas. Validación en frontend y backend.
- **Aviso de categorías inválidas**: Banner de advertencia si hay FAQs con categoría no reconocida.

### Páginas editables (CMS) — `/intranet/admin/pages`

El panel de páginas editables permite modificar el contenido textual de las páginas públicas sin tocar código. Cada página tiene secciones y campos definidos en `lib/page-content-db.ts` (`getEditablePagesMeta()`).

#### Páginas disponibles

| Página | Ruta pública | Secciones editables |
|--------|-------------|-------------------|
| Inicio | `/` | hero, contact_card, questions, specialties, services, testimonials, process, why_us, multidisciplinary, faq |
| El Despacho | `/despacho` | hero, mision_vision, values, commitments |
| Solicitar Consulta | `/solicitar-consulta` | hero, reasons, guarantees |
| Cómo llegar | `/como-llegar` | hero, ref_points, routes |
| Términos | `/terminos` | hero, content |
| Aviso Legal | `/aviso-legal` | hero, content |
| Política de Privacidad | `/politica-privacidad` | hero, content |
| Política de Cookies | `/politica-cookies` | hero, content |
| Disclaimer | `/disclaimer` | hero, content |
| Configuración | — | contacto, direccion, redes, geo |

#### Flujo de edición

1. **Carga**: El admin carga el contenido actual desde la tabla `page_content` en PostgreSQL.
2. **Campos**: Cada sección tiene campos de tipo `text`, `textarea` o `richtext` (TipTap).
3. **Guardar**: Al pulsar "Guardar todo", cada campo se envía individualmente a `POST /api/admin/pages`.
4. **Persistencia**: La API hace upsert en `page_content` con `(page, section, field, lang='es-HN')`.
5. **Publicación**: No hay distinción guardar/publicar. Al guardar, la API llama `revalidatePath(ruta)` para invalidar la caché ISR de la página afectada.
6. **Éxito**: El admin muestra "Campo guardado y publicado — ya visible en la web."

#### Fuente de datos

- **Escritura**: `POST /api/admin/pages` → tabla `page_content` (PostgreSQL).
- **Lectura pública**: Las páginas públicas (server components) llaman `getPageContent(page)` desde `lib/page-content-db.ts`.
- **Fallback**: Si no hay datos en DB para un campo, se usa el valor por defecto definido en `getEditablePagesMeta()`.
- **ISR**: Las páginas públicas tienen `revalidate = 3600` (1 hora). La revalidación on-demand via `revalidatePath()` actualiza el contenido inmediatamente después de guardar.
- **FAQ respuestas**: Las respuestas FAQ pueden contener HTML (tipo `richtext`). Se renderizan con `dangerouslySetInnerHTML` previa sanitización server-side.

#### Cómo verificar que un cambio se publicó

1. Guardar desde `/intranet/admin/pages/home`.
2. Abrir `https://www.pinedayasocioshn.com/` en una ventana de incógnito.
3. Hard refresh (Ctrl+F5). Si el cambio no aparece:
   - Esperar unos segundos (la revalidación es asíncrona).
   - Verificar que la DB tiene el valor: conectar a Neon y consultar `SELECT * FROM page_content WHERE page='home'`.
   - Verificar que el cambio está en la DB pero no se ve → forzar ISR con `revalidatePath('/')` desde la API.

### Categorías

- **Blog**: 20 categorías definidas en `data/blog/categories.ts`. Los dropdowns del admin cargan desde este archivo. Las categorías se guardan por slug en la DB.
- **FAQ**: 11 categorías definidas en `data/faq-categories.ts`. Los dropdowns usan `faqCategoriesMeta`. Las categorías se guardan por slug, la página pública muestra el nombre legible.

### Publicación y caché

- **Persistencia**: PostgreSQL (Neon) — tablas `blog_posts`, `faq_entries` y `page_content`.
- **Formato**: HTML sanitizado (desde TipTap, limpiado con `lib/sanitize.ts`).
- **ISR**: Todas las páginas públicas (blog, FAQ, páginas editables) tienen `revalidate = 3600` (1 hora).
- **Revalidación on-demand**: Cada create/update/delete llama `revalidatePath()` en todas las rutas afectadas.
- **Páginas dinámicas**: `/blog` y `/blog/[categoria]` usan `searchParams` → renderizado dinámico.
- **Páginas estáticas con ISR**: `/`, `/despacho`, `/solicitar-consulta`, etc. se regeneran bajo demanda tras guardar en el admin.
- **Verificación**: Si un cambio no aparece tras guardar, esperar ~30s y recargar con hard refresh (Ctrl+F5). Si persiste, verificar el contenido en la tabla `page_content` de la DB.

### Seguridad

- **Autenticación**: `requireAdmin(request)` en todas las rutas API de escritura.
- **Sanitización**: `sanitizeHtml()` elimina `<script>`, `<iframe>`, `on*` handlers, `javascript:` protocol.
- **Validación**: Zod schemas en todas las rutas POST/PATCH.
- **Auditoría**: `logAudit()` registra todas las operaciones CRUD en `auditoria_eventos`.
- **CSRF**: SameSite=Lax en cookies. Next.js Server Actions protection implícita en API routes.
- **Rate limiting**: Blog generate (10/5min), login (5/60s), contacto (10/15min), consulta (10/15min), calcular (30/min).

### Corrección de bug crítico (2026-06-11)

El componente `RichTextEditor` (TipTap) no reaccionaba a cambios en la prop `content` después del montaje inicial. Esto causaba que:
- Al editar un post existente, el editor aparecía vacío.
- El generador IA mostraba el cuerpo en blanco aunque el HTML se generaba correctamente.

**Solución**: Añadido `useEffect` en `components/ui/rich-text-editor.tsx` que sincroniza cambios externos mediante `editor.commands.setContent()` con detección de origen interno/externo para evitar bucles.

### Calculadora de penas

- **Catálogo**: 483 delitos del Código Penal hondureño (Decreto 130-2017) más reformas.
- **Verificación**: 483 verificados (100%), 0 pendientes, 0 rechazados. Fuente: `data/delitos-estados.json`.
- **API de calidad**: `GET /api/delitos/calidad` devuelve resumen de estados.

#### Fuente de verdad de delitos

| Archivo | Rol |
|---------|-----|
| `data/delitos.json` | Catálogo canónico (483 delitos con nombre, artículo, penas) |
| `data/delitos-estados.json` | Estado de verificación por delito (`verificado`/`pendiente_revision`/`rechazado`) |
| `data/delitos-validacion.json` | Fuente histórica de validación offline (no usada en runtime) |
| `lib/estados-delitos.ts` | Módulo de acceso: `getEstadoDelito(nombre, articulo)` y `getResumenEstados()` |

#### Cómo funciona la validación

1. La calculadora (`lib/rules/v1/index.ts`) llama `getEstadoDelito(delito.nombre, delito.articulo)` para cada delito.
2. `getEstadoDelito` busca en `delitos-estados.json` por clave `"${nombre}__${articulo}"`.
3. Si encuentra la entrada, devuelve su `estado` (`verificado`/`pendiente_revision`/`rechazado`).
4. Si no la encuentra, devuelve por defecto `estado: 'verificado'`.
5. El resultado se expone en `DelitoAnalizado.confianza`.
6. Si `confianza !== 'verificado'`, aparece la alerta de "datos no verificados".

#### Normalización de artículos

Los artículos se identifican por su formato canónico (`Art. NNN CP`). Para búsquedas:
- `342` → `342`
- `Art. 342` → `342`
- `Artículo 342` → `342`
- `342 CP` → `342`
- `Art. 342 CP` → `342`

#### Tests de delitos

- `tests/catalogo-delitos.test.ts` — 129 tests: integridad del catálogo, estados de validación, normalización de artículos, penas del Art. 342 CP, alerta de datos no verificados y cálculo de muestra representativa.
- `npm test` — 314 tests totales (14 archivos).

---

## Blog (WordPress) — LEGACY

El blog se sirvió históricamente desde WordPress con GeneratePress. La migración a Next.js (DB nativa) está en curso.

### Migración

El script `wordpress/scripts/migrate-posts-to-wp.js` lee posts desde `data/blog/posts/*.ts` y genera WXR + redirect map.

### Estructura de archivos (en `/wordpress/themes/generatepress-child/`)

```
generatepress-child/
├── style.css, functions.php, home.php, category.php
├── single.php, author.php, tag.php, search.php
└── assets/css/blog.css, assets/js/toc.js
```


### Estructura SEO implementada

- **Sitemap dinámico:** `/sitemap.xml` — incluye páginas estáticas, categorías de blog y posts individuales con prioridades y lastmod diferenciados.
- **Robots.txt dinámico:** `/robots.txt` — bloquea `/intranet/`, `/api/`, `/_next/`, bots de IA permanentemente.
- **Breadcrumbs:** Componente `<Breadcrumbs>` reutilizable con schema `BreadcrumbList` integrado. Presente en todas las páginas públicas.
- **JSON-LD:** `LegalService`, `WebSite`, `Organization`, `FAQPage`, `BlogPosting`, `BreadcrumbList`, `CollectionPage`.
- **Blog con paginación:** 12 posts por página, navegación prev/next, canonicals correctos.
- **Canonicals:** Configuradas en todas las páginas. URLs con filtro de tags canonicalizan a `/blog`.
- **Meta robots:** Dinámicos según `NEXT_PUBLIC_NOINDEX`.
- **OG images:** Configuradas en todas las páginas (imagen genérica por defecto, cover image en posts).
- **RSS Feed:** `/blog/feed.xml` declarado en `<link rel="alternate">`.
- **Seguridad HTTP:** HSTS 2 años con preload, CSP restrictivo, headers de seguridad completos.

## Google APIs (GA4 + Search Console)

### Configuración

1. Crear una cuenta de servicio en [Google Cloud Console](https://console.cloud.google.com) → IAM → Cuentas de servicio.
2. Generar una clave JSON y guardarla de forma segura.
3. Añadir la cuenta de servicio a:
   - **Google Analytics 4**: Administración → Usuarios → Añadir → `Visualizador`.
   - **Google Search Console**: Ajustes → Usuarios → Añadir → `Propietario completo`.
4. Configurar las variables de entorno en `.env.local` (ver `.env.example`).

### Variables de entorno

```bash
# Cuenta de servicio (recomendado para Vercel)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_ANALYTICS_PROPERTY_ID=123456789
GOOGLE_SEARCH_CONSOLE_SITE_URL=sc-domain:pinedayasociadoshn.com

# Alternativa: archivo JSON (solo local)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**IMPORTANTE:**
- Ninguna variable Google tiene prefijo `NEXT_PUBLIC_` — no se exponen al frontend.
- La app lanza error claro si faltan variables al consultar las APIs.
- No committear el JSON de credenciales ni las claves.

### Endpoints API

| Endpoint | Descripción |
|---|---|
| `GET /api/admin/analytics?days=28` | Métricas GA4 (usuarios, sesiones, páginas vistas, fuentes, países, dispositivos) |
| `GET /api/admin/search-console?days=28` | Rendimiento Search Console (clicks, impresiones, CTR, posición, queries, páginas) |
| `POST /api/admin/seo/inspect` | URL Inspection API (requiere `{"url": "https://..."}`) |
| `GET /api/admin/seo/summary` | Resumen SEO combinado (GA4 + GSC + contenido) |
| `GET /api/admin/seo/sitemap` | Estado del sitemap (URLs incluidas, conteo) |

### Panel SEO (`/intranet/admin/seo`)

Accesible solo para usuarios con rol `admin`. Incluye:

- **Resumen**: estado de indexación global, integraciones configuradas, métricas rápidas.
- **Analytics**: panel completo con métricas GA4 y selector de rango (7/28/90 días).
- **Search Console**: clicks, impresiones, CTR, posición, top consultas y páginas.
- **Indexación**: inspección de URLs via URL Inspection API con URLs rápidas predefinidas.
- **Sitemap**: URLs incluidas, estado y acciones (ver sitemap.xml, robots.txt).
- **Acciones**: checklist de recomendaciones SEO prioritarias.

### Sitemap

- Generado dinámicamente por `app/sitemap.ts`.
- Incluye: 37 rutas estáticas + 20 categorías de blog + posts publicados desde DB.
- `lastModified` dinámico basado en `updatedAt`/`publishedAt` real.
- Se vacía automáticamente si `NEXT_PUBLIC_NOINDEX=true`.
- Enviado a Bing IndexNow vía postbuild (`scripts/submit-indexnow.mjs`).

### Limitaciones

- **Google Analytics**: mide tráfico y comportamiento. No indexa páginas.
- **Search Console**: audita rendimiento SEO e indexación. No garantiza indexación.
- **URL Inspection API**: requiere que la URL esté en la propiedad de Search Console.
- **Google decide si indexa cada URL** — el sistema ayuda a detectar y corregir problemas técnicos, pero no garantiza indexación.
- No se usa Google Indexing API para blog normal (solo contenido soportado oficialmente).

## SEO

### Control de indexación (NOINDEX)

Una sola variable controla todo el sistema de indexación: `NEXT_PUBLIC_NOINDEX`.

| Valor | Meta robots | X-Robots-Tag | robots.txt | Sitemap |
|-------|------------|--------------|------------|---------|
| `true` | `noindex, nofollow` | `noindex, nofollow, noarchive, nosnippet, noimageindex` | Disallow: `/` | Vacío |
| `false` | `index, follow` | `index, follow, max-image-preview:large, max-snippet:-1` | Allow: `/` (bloquea `/intranet/`, `/api/`, AI crawlers) | Completo |

- **Desarrollo/staging**: `NEXT_PUBLIC_NOINDEX=true` (por defecto en `.env.local` de desarrollo)
- **Producción**: `NEXT_PUBLIC_NOINDEX=false`
- Las rutas privadas (`/intranet/`, `/api/`) siempre tienen `X-Robots-Tag: noindex, nofollow` independientemente del valor.
- El panel SEO muestra "NOINDEX" o "INDEXABLE" según el valor actual.

### Google Analytics 4

**GA4 Frontend** (`NEXT_PUBLIC_GA_ID`):
- Script gtag cargado en `app/layout.tsx` vía `next/script` con `strategy="afterInteractive"`.
- Solo se activa si `NEXT_PUBLIC_GA_ID` está definido.
- No requiere credenciales de cuenta de servicio.
- El panel SEO muestra "GA4 Frontend: Activo" o "Sin configurar".

**GA4 Data API** (backend, requiere cuenta de servicio):
- Variables: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_ANALYTICS_PROPERTY_ID`.
- La clave privada debe tener `\n` escapados: `"-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----\\n"`.
- Si faltan credenciales, el panel muestra "GA4 Data API: Sin configurar" sin error 500.
- Si están configuradas, muestra métricas reales en la pestaña Analytics.

### Google Search Console API (backend)

- Variables: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`.
- `GOOGLE_SEARCH_CONSOLE_SITE_URL` acepta formatos: `sc-domain:pinedayasociadoshn.com` o `https://www.pinedayasociadoshn.com/`.
- La cuenta de servicio debe tener rol "Propietario completo" en Search Console → Ajustes → Usuarios.
- Si faltan credenciales, el panel muestra "Search Console API: Sin configurar".
- Si están configuradas, muestra clicks, impresiones, CTR, posición media, top queries y páginas.

### Cómo añadir la cuenta de servicio a GA4 y Search Console

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com) → APIs y Servicios → Biblioteca → Activar:
   - Google Analytics Data API (`analyticsdata.googleapis.com`)
   - Google Search Console API (`searchconsole.googleapis.com`)
2. IAM y administración → Cuentas de servicio → Crear cuenta → Generar clave JSON.
3. Copiar `client_email` y `private_key` del JSON a las variables de entorno.
4. Añadir la cuenta de servicio como usuario:
   - **GA4**: Administración → Usuarios de la propiedad → Añadir usuario → rol "Visualizador".
   - **Search Console**: Ajustes → Usuarios y permisos → Añadir usuario → rol "Propietario completo".

### Panel SEO - Health Check

El panel SEO (`/intranet/admin/seo`) incluye un sistema de health check real que verifica cada integración:

- **Endpoint**: `GET /api/admin/seo/health` (requiere autenticación admin)
- **Verificaciones**:
  - GA4 Data API: consulta real a `analyticsdata.googleapis.com`
  - Search Console API: consulta real a `searchconsole.googleapis.com`
  - GA4 Frontend: verifica `NEXT_PUBLIC_GA_ID`
  - IndexNow: verifica que el archivo de clave responde HTTP 200 con el contenido correcto
  - Sitemap: verifica conteo de posts en base de datos
- **Estados posibles**: `active`, `not_configured`, `permission_error`, `api_error`, `property_error`, `key_file_error`, `error`
- **Botón "Revalidar"**: en la pestaña Resumen SEO para ejecutar health checks bajo demanda

### Script gcloud de diagnóstico

Para diagnosticar y configurar Google Cloud desde Windows:

```powershell
.\scripts\seo\google-cloud-setup.ps1 `
  -ProjectId "pineda-asociados-forms-nuevo" `
  -ServiceAccount "id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com" `
  -Ga4PropertyId "541022095"
```

El script:
1. Verifica instalación de gcloud CLI
2. Autentica (abre navegador si es necesario)
3. Configura el proyecto activo
4. Habilita APIs (analyticsdata, analyticsadmin, searchconsole)
5. Diagnostica la service account
6. Muestra instrucciones paso a paso para permisos manuales

### Sitemap dinámico

- `app/sitemap.ts` genera `/sitemap.xml` con:
  - 37 rutas estáticas (home, despacho, servicios, blog, FAQ, legales).
  - 20 categorías de blog.
  - Todos los posts publicados desde `blog_posts` con `lastModified` real.
- Excluye: `/intranet/*`, `/api/*`, borradores, páginas noindex.
- Se vacía automáticamente si `NEXT_PUBLIC_NOINDEX=true`.

### robots.txt dinámico

- `app/robots.ts` genera `/robots.txt`:
  - Producción: permite rastreo público, bloquea `/intranet/`, `/api/`, `/_next/`, `/404`, `/500`.
  - Bloquea permanentemente bots de IA (GPTBot, ClaudeBot, PerplexityBot, etc.).
  - Declara `sitemap.xml`.
  - Desarrollo: bloquea todo.

### Datos estructurados (JSON-LD)

- **LegalService + LocalBusiness**: `lib/site.ts` → `legalServiceSchema()`. Inyectado en layout público.
- **Organization**: `lib/site.ts` → `organizationSchema()`. Inyectado en layout público.
- **WebSite**: `lib/site.ts` → `websiteSchema()`. Inyectado en layout público.
- **Service**: `lib/schemas/legal-page.ts` → `serviceSchema()`. Para páginas de área jurídica.
- **FAQPage**: `lib/schemas/legal-page.ts` → `faqPageSchema()`. Para FAQs con preguntas/respuestas.
- **BreadcrumbList**: `lib/schemas/legal-page.ts` → `breadcrumbsSchema()`. Para migas de pan.
- **BlogPosting/Article**: implementado en páginas de blog individual.

### IndexNow

- Clave servida vía `GET /api/indexnow-key` (usa `INDEXNOW_KEY` de `.env.local`).
- Script postbuild: `scripts/submit-indexnow.mjs` — envía URLs públicas a Bing, Yandex, Seznam.
- Solo envía URLs públicas (no intranet, no API, no borradores).
- Si `INDEXNOW_KEY` no está definida, el postbuild salta con aviso (no falla el build).
- Generar clave en: https://www.bing.com/indexnow/getstarted

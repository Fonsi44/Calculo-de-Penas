# LEX HONDURAS — Protocolo obligatorio para agentes IA

Este repositorio requiere precisión, trazabilidad, verificación real y honestidad operativa. Ningún agente puede afirmar que algo está implementado, corregido, validado o completado si no lo ha comprobado mediante lectura de archivos, cambios reales y comandos de validación cuando correspondan. Las reglas son permanentes, no una tarea puntual.

---

## 1. Descripción del proyecto

**Nombre**: LEX HONDURAS — Motor de Cálculo de Penas + Web Corporativa  
**Sitio**: `https://www.pinedayasociadoshn.com` (Vercel)  
**Base de datos**: Neon PostgreSQL (Plan Free, PITR 7 días)  
**Framework**: Next.js 16.2.7 + React 19 + Tailwind CSS v4  
**ORM**: Drizzle ORM (v0.45.2)  
**Auth**: JWT + bcryptjs (cookies `__Host-token` + `__Host-profile`)  
**Editor**: TipTap (rich text)  
**Testing**: Vitest (185 tests) + Playwright (29 tests E2E)  
**CI**: GitHub Actions (`lint → tsc → test → build → validate`)  

### Módulos principales

| Módulo | Rutas | Estado | Acceso |
|--------|-------|--------|--------|
| Web pública (marketing) | `/(public)/*` | ✅ Producción | Público |
| Blog | `/blog`, `/blog/[categoria]/[slug]` | ✅ DB nativa + ISR | Público |
| FAQ | `/preguntas-frecuentes` | ✅ DB nativa + ISR | Público |
| Intranet (dashboard + admin) | `/intranet/*`, `/intranet/admin/*` | ✅ CMS completo | 🔒 Solo personal del bufete |
| Calculadora de penas | `/calculadora`, `/intranet/calculadora` (8 pasos, rewrite) | ✅ Motor v1 | 🔒 Solo personal del bufete |
| API REST | `/api/*` (25+ endpoints) | ✅ | Mixto (público / auth según endpoint) |
| WordPress (legacy) | `wordpress/` | ⏳ Migración en curso | — |

> **⚠️ Toda la intranet (`/intranet/*`, `/calculadora`, `/casos`, `/cp`, `/delitos`, `/atajos`, `/admin/*`) es PRIVADA y de uso exclusivo del personal del bufete.** Ninguna de estas rutas debe ser mencionada, enlazada, indexada ni referenciada desde la web pública o desde buscadores. Ver reglas 17-19 en sección 8.

### Público objetivo

**Web pública:** Potenciales clientes que buscan asesoría jurídica en Honduras.  
**Intranet:** Exclusivamente personal del bufete Pineda y Asociados para gestión de casos, cálculo de penas y administración de contenido.

---

### Google Cloud Platform (GCP)

El proyecto de GCP asociado es **`pineda-asociados-forms-nuevo`** (no `justicia-verdadera`). Todos los comandos de gcloud deben usar `--project=pineda-asociados-forms-nuevo`.

---

## 2. Arquitectura actual

### Estructura de directorios

```
app/
  (public)/                → Sitio web público (marketing + blog + FAQ) — sin auth
  intranet/
    dashboard/             → Dashboard principal (autenticado)
    admin/                 → Panel admin (solo rol admin)
      blog/                → Gestión de blog (lista + editor)
      faq/                 → Gestión de FAQ
      config/              → Configuración del sitio
      usuarios/            → Gestión de usuarios
      perfil/              → Perfil y cambio de contraseña
      calculadora/         → Calculadora de penas (8 pasos, wizard admin)
      casos/               → Gestión de casos
      cp/                  → Biblioteca del Código Penal
      delitos/             → Catálogo de delitos
      delito-form/         → Editor de delitos (crear/editar)
    login/                 → Login de intranet
  api/
    admin/
      blog/                → CRUD posts (POST / PATCH / DELETE)
      faq/                 → CRUD FAQs (POST / PATCH / DELETE)
      pages/               → Gestión de contenido de páginas públicas (GET / POST)
      usuarios/            → CRUD usuarios + reset-password
      site-config/         → Configuración del sitio (GET público / PUT admin)
      upload/              → Subida de imágenes
    auth/                  → login, logout, register, me, change-password, terminos
    calcular/              → Motor de cálculo + PDF
    calculos/              → CRUD cálculos guardados
    casos/                 → CRUD casos + PDF
    delitos/               → Catálogo de delitos + calidad + count
    cp/                    → Artículos del CP
    health/                → Health check
    seed/                  → Seed de base de datos
    contacto/              → Formulario de contacto (Resend)
    consulta/              → Solicitud de consulta
    clasificaciones/       → Clasificaciones/ramas jurídicas
    whatsapp/              → WhatsApp redirección
    indexnow-key/          → Clave IndexNow
    [transport]/           → Transport handler genérico
lib/
  rules/v1/                → Motor de cálculo (9 archivos)
  schema.ts                → Esquema Drizzle ORM (35 tablas)
  auth.ts                  → JWT + bcrypt
  audit.ts                 → Auditoría no bloqueante
  blog-db.ts               → Blog: helper de lectura (DB)
  blog-helpers.ts          → Blog: helpers varios
  blog.ts                  → Blog: tipos legacy
  faq-db.ts                → FAQ: helper de lectura (DB)
  site-config-db.ts        → Site config: helper
  page-content-db.ts       → Page content: helper + metadatos
  cache.ts                 → Caché/revalidación
  datetime.ts              → Zona horaria Honduras (UTC-6)
  email.ts                 → Resend (email transaccional)
  rate-limit.ts            → Rate limiting via Neon DB
  sanitize.ts              → Sanitización HTML server-side
  validation.ts            → Zod schemas
  db.ts                    → Conexión a base de datos
  site.ts                  → Configuración del sitio (centralizada)
  ui.ts                    → Helpers de UI
  utils.ts                 → Motor: aumentar/reducir grado, mitades
  catalogos.ts             → Catálogos legales (agravantes, atenuantes, eximentes)
  pdf-document.tsx         → Generación de PDF (@react-pdf)
  types.ts                 → Tipos compartidos (Delito, DelitoConfig, Step, etc.)
data/
  delitos.json             → 483 delitos del CP hondureño
  ramas_juridicas.json     → 119 registros
  articulos_constitucion.json → 378 artículos Constitución
  articulos_cp.json        → Artículos del CP
  blog/
    categories.ts          → 20 categorías de blog (fuente de verdad)
    posts/                 → 134 posts (legacy, previo a migración DB)
    types.ts               → Tipo Post
  faq-categories.ts        → 11 categorías FAQ (fuente de verdad)
  faq.ts                   → FAQs legacy (73 preguntas)
  images.ts                → Catálogo de imágenes
  areas-juridicas.ts       → Taxonomía de áreas jurídicas
  delitos-estados.json     → Estado de verificación de delitos
  delitos-validacion.json  → Validación detallada por delito
components/
  marketing/               → 25+ componentes de UI pública
  ui/                      → 13 componentes reutilizables (Button, Input, Card, Badge, etc.)
  domain/
    calculadora/           → 13 componentes del motor de cálculo (state, hooks, pasos 1-8)
    circunstancia-picker/  → Selector de circunstancias penales
  layout/                  → AppShell, AppSidebar, RootShell, etc.
  blog/                    → BlogCard, BlogSidebar, etc.
tests/                     → 13 suites (~185 tests)
e2e/                       → 3 spec files (~29 tests)
docs/                      → 26+ documentos técnicos
scripts/                   → load-env.cjs, submit-indexnow.mjs
wordpress/                 → Child theme GeneratePress + scripts migración
proxy.ts                   → Edge proxy (reemplaza middleware.ts)
```

### Sistema de rutas App Router

- **Route Groups**: `(public)/` para web pública, `intranet/` para área autenticada
- **Rewrites**: `/intranet/calculadora` → `/calculadora`, `/intranet/casos` → `/casos`, etc.
- **Redirects**: `/contacto` → `/solicitar-consulta`, `/areas-de-practica` → `/servicios-juridicos`, etc.
- **Proxy** (`proxy.ts`): Edge function que protege rutas `/intranet/*` y `/api/*` con JWT
- **ISR**: Páginas públicas con `revalidate = 3600` (1 hora). On-demand via `revalidatePath()`
- **Layout**: `app/layout.tsx` usa `RootShell` que oculta sidebar en rutas públicas y admin

### Base de datos (35 tablas)

> **Fuente de verdad:** `lib/schema.ts`. La lista completa y actualizada de
> tablas vive ahí; esta tabla enumera solo las principales para contexto. Las
> fases CMS y Fase 2 (supuestos penales) añadieron el resto (`categorias_blog`,
> `categorias_faq`, `tags`, `posts_tags`, `autores`, `paginas_cms`,
> `areas_juridicas`, `medios`, `versiones_contenido`, `redirects`, `menus`,
> `roles`, `permisos`, `roles_permisos`, `usuarios_roles`,
> `newsletter_subscriptions`, `supuestos_penales`, `agravantes_especificas`,
> `remisiones_normativas`).

| Tabla | Propósito |
|-------|-----------|
| `ramas_juridicas` | Taxonomía de ramas del derecho (119 registros) |
| `articulos_constitucion` | Artículos de la Constitución (378) |
| `articulos_cp` | Artículos del Código Penal (635+) |
| `delitos` | Catálogo de delitos (483) — unique(`nombre`, `articulo`) |
| `bufetes` | Bufetes registrados |
| `usuarios` | Usuarios del sistema (con `active`, `must_change_password`) |
| `casos` | Casos legales |
| `calculos` | Cálculos de penas (JSONB) |
| `auditoria_eventos` | Auditoría de acciones (con enum de 50+ acciones) |
| `rate_limits` | Rate limiting |
| `aceptaciones_legales` | Aceptaciones de términos |
| `solicitudes_consulta` | Solicitudes de consulta pública |
| `blog_posts` | Posts del blog (con SEO meta, noindex, canonical, review workflow) |
| `faq_entries` | Entradas de FAQ |
| `configuracion_sitio` | Configuración clave-valor |
| `page_content` | Contenido de páginas públicas editable por secciones |

Migraciones: `npx drizzle-kit generate` + `npx drizzle-kit push`. No modificar Neon directamente.
Seed (`drizzle/seed.ts`) tiene guarda: si ya hay datos, no ejecuta nada.

### Autenticación y autorización

- **JWT**: `lib/auth.ts` — `signToken()`, `verifyToken()`, `requireAdmin()`, `requireAuth()`
- **Cookies**: `__Host-token` (JWT) + `__Host-profile` (datos usuario)
- **Proxy**: `proxy.ts` verifica token para rutas `/intranet/*` y `/api/*` no públicas
- **Admin**: solo rol `admin` accede a `/intranet/admin/*` — verificado en `requireAdmin()`
- **Rate limiting**: login (5/60s), contacto (10/15min), consulta (10/15min), calcular (30/min), generate (10/5min)
- **Auditoría**: `lib/audit.ts` con helper `logAudit()` y `audit()` — registra en `auditoria_eventos`

### Zona horaria

- Honduras: CST (UTC-6, `America/Tegucigalpa`)
- Fechas mostradas al usuario: helpers de `lib/datetime.ts`
- Fechas internas: UTC/ISO

---

## 3. Intranet / Admin

### `/intranet/admin/` — Panel de Administración

Accesible solo para usuarios con rol `admin`. Layout propio con sidebar admin (independiente del sidebar principal).

#### Dashboard (`/intranet/admin/page.tsx`)
- Cards con stats: total posts, publicados, borradores, FAQs
- Acciones rápidas: nuevo post, nueva FAQ, gestionar blog, configuración
- Tabla de posts recientes
- Sidebar con módulos: Blog, FAQ, Usuarios, Configuración, Perfil

#### Blog — Listado (`/intranet/admin/blog/page.tsx`)
- Tabla paginada (20 por página) con: título, categoría, estado, fecha, acciones
- Búsqueda por texto (título/descripción)
- Filtros: categoría (dropdown de `data/blog/categories.ts`), estado (todos/publicados/borradores)
- Orden: por fecha, título o estado (clic en cabecera)
- Acciones por fila: editar, publicar/despublicar, duplicar, eliminar, ver en web
- Enlace "Nuevo post" → `/intranet/admin/blog/nuevo`

#### Blog — Editor (`/intranet/admin/blog/[id]/page.tsx`)
- **Doble pestaña**: Visual (WYSIWYG TipTap) y Código (HTML directo). Conversión bidireccional.
- Campos: título, slug (auto-generado), descripción, contenido HTML, categoría (dropdown real), fecha publicación, tags (con auto-generación), autor, tiempo lectura (auto), imagen portada (URL o subida), destacado, publicado
- **Subida de imagen**: `POST /api/admin/upload` — valida tipo MIME, tamaño máx 10 MB, nombra según slug
- **Generador AI**: botón "Generar post" → `POST /api/admin/blog/generate` — crea artículo completo con estructura legal. Rate limit: 10/5min por usuario
- **Aviso cambios no guardados**: indicador visual + confirmación beforeunload
- **Vista previa**: enlace "Ver en web" para posts publicados

#### Páginas — Gestión (`/intranet/admin/pages/`)
- **Listado**: 9 páginas públicas editables con stats (secciones, campos)
- **Editor**: `/intranet/admin/pages/[page]` — navegación por secciones, edición inline
- **Campos**: text, textarea, rich text (TipTap)
- **Persistencia**: `page_content` tabla en DB
- **API**: `POST/GET /api/admin/pages` con `requireAdmin()`, sanitización, auditoría, revalidación ISR
- **Páginas editables**: home, despacho, solicitar-consulta, como-llegar, terminos, aviso-legal, politica-privacidad, politica-cookies, disclaimer

#### FAQ — Gestión (`/intranet/admin/faq/page.tsx`)
- Agrupado por categoría (acordeones expandibles)
- Búsqueda por texto (pregunta/respuesta)
- Filtros: categoría (dropdown real), estado (todos/publicados/borradores)
- Edición inline con RichTextEditor
- Reordenar: flechas arriba/abajo (ajusta `sortOrder`)
- Crear: formulario con categoría (dropdown de `data/faq-categories.ts`), pregunta y respuesta
- Banner de advertencia si hay FAQs con categoría no reconocida
- Badges: "Público" (success) / "Borrador" (warning)

#### Usuarios (`/intranet/admin/usuarios/`)
- Lista + formulario crear
- Editar usuario por ID
- Reset password con contraseña temporal

#### Configuración (`/intranet/admin/config/page.tsx`)
- Formulario: contacto, dirección, horario, redes sociales, geo

#### Perfil (`/intranet/admin/perfil/page.tsx`)
- Datos del usuario actual + cambiar contraseña

### `/intranet/dashboard/` — Dashboard de la Intranet

- Panel principal del bufete (visible para todos los roles autenticados)
- Stats: delitos (483), arts. CP (635), ramas (119), pasos (8)
- Búsqueda rápida de artículos CP via `ArticuloAutocomplete`
- Cards de funcionalidades: Calcular pena, Mis casos, Biblioteca CP, Catálogo de delitos
- Enlace a Admin (solo si rol = admin)
- Marco normativo: referencia al CP Decreto 130-2017 y reformas

### `/intranet/calculadora` → rewrite → `/calculadora`

Ver sección 7 (Calculadora).

---

## 4. Blog CMS

### Admin
- **Ruta**: `/intranet/admin/blog/` (listado) y `/intranet/admin/blog/[id]` (editar/crear)
- **API**: `app/api/admin/blog/` — CRUD completo con `requireAdmin()`

### Fuente de datos
- **Primaria**: PostgreSQL, tabla `blog_posts`
- **Lectura pública**: `lib/blog-db.ts` — `getPublishedPosts()`, `getPostBySlug()`, `getBlogCategories()`, `getRelatedPosts()`
- **Legacy**: `data/blog/posts/*.ts` (134 posts en TS, importados desde `data/blog/posts/index.ts`). NO usar como fuente primaria para escritura.

### Creación de posts
- Desde el admin: formulario con TipTap (visual) + pestaña código (HTML)
- Desde generador AI: botón "Generar post" que llama a `/api/admin/blog/generate`
- El generador crea título, slug, descripción, cuerpo HTML estructurado (introducción, marco legal, requisitos, plazos, etc.)

### Edición
- Editar post existente desde `/intranet/admin/blog/[id]`
- El RichTextEditor carga contenido desde la DB y permite edición visual
- Doble pestaña: Visual (TipTap) ↔ Código (HTML). Conversión bidireccional

### Publicación
- Al guardar: sanitización HTML server-side (`lib/sanitize.ts` — elimina scripts, iframes, handlers)
- Al publicar: `revalidatePath()` invalida caché de `/blog`, `/blog/[categoria]`, `/blog/[categoria]/[slug]`
- ISR: páginas públicas con `revalidate = 3600`
- Formato: HTML sanitizado

### Categorías
- 20 categorías definidas en `data/blog/categories.ts`
- Los dropdowns del admin cargan desde este archivo (misma fuente en listado y editor)
- Las categorías se guardan por slug en la DB

### Imágenes destacadas
- Subida via `POST /api/admin/upload`
- Validación: JPEG/PNG/WebP, máx 10 MB
- Naming: `slug-del-post.ext`
- Guardado: `/public/images/blog/`
- Preview en el formulario

### Publicación masiva
- **Endpoint**: `POST /api/admin/blog/publish-all` — solo admin
- Marca todos los posts con `published = false` como `published = true`
- Incluye auditoría y revalidación ISR de todas las rutas del blog
- Botón "Publicar todos" visible en el listado si hay posts sin publicar

### Manejo de HTML escapado
- `components/ui/rich-text-editor.tsx` incluye `decodeHtmlEntities()` que decodifica entidades HTML (`&lt;` → `<`) antes de pasar contenido a TipTap
- Se aplica tanto en la inicialización (`useEditor`) como en la sincronización (`setContent`)
- Es segura para contenido HTML puro (no produce doble decodificación)

### Reglas obligatorias para la IA

- No guardar posts en una fuente distinta a la DB (`blog_posts`).
- No usar `data/blog/posts/` como solución final para escritura (solo legacy).
- No dejar cuerpos de posts vacíos.
- No crear posts automáticos sin cuerpo completo.
- No romper formato HTML existente.
- No perder contenido al editar (el editor TipTap sincroniza con `setContent()` vía `useEffect`).
- No cambiar slugs existentes sin motivo justificado.
- No modificar diseño público (`/blog/*` pages).
- No permitir categorías inválidas (deben estar en `data/blog/categories.ts`).
- No almacenar en localStorage como persistencia.

---

## 5. FAQ CMS

### Admin
- **Ruta**: `/intranet/admin/faq/`
- **API**: `app/api/admin/faq/` — CRUD completo con `requireAdmin()`

### Fuente de datos
- **Primaria**: PostgreSQL, tabla `faq_entries`
- **Lectura pública**: `lib/faq-db.ts` — `getFaqsForPublicPage()` (cacheada con `cache()` de React), `getPublishedFaqs()`, `getFaqsGrouped()`
- **Legacy**: `data/faq.ts` (73 FAQs). Solo usado como fallback si la DB no tiene FAQs.

### Creación y edición
- Formulario con categoría (dropdown de `data/faq-categories.ts`), pregunta y respuesta
- Respuesta usa editor TipTap con soporte para párrafos, negrita, cursiva, listas y enlaces
- Edición inline en la misma página de listado
- Checkbox de publicado

### Categorías
- 11 categorías definidas en `data/faq-categories.ts`
- Centralizadas: `faqCategoriesMeta[]`, `faqCategorySlugToName`, `faqCategorySlugToDescription`
- Validación frontend y backend
- Banner de advertencia si hay categorías no reconocidas en la DB

### Publicación y caché
- Sanitización HTML server-side antes de guardar
- `revalidatePath('/preguntas-frecuentes')` al crear/editar/eliminar
- ISR: página pública con `revalidate = 3600`

### Reglas obligatorias para la IA

- No guardar FAQ en una fuente distinta a la DB (`faq_entries`).
- No crear categorías falsas (deben estar en `data/faq-categories.ts`).
- No permitir categorías inválidas.
- No perder formato HTML al editar.
- No duplicar FAQ al actualizar.
- No modificar diseño público.
- No usar mocks como solución final.

---

## 6. Categorías

### Blog — 20 categorías
- **Fuente**: `data/blog/categories.ts`
- **Estructura**: `{ slug, nombre, descripcion, color }`
- **Slugs**: `derecho-penal`, `proceso-penal`, `derecho-de-familia`, `derecho-laboral`, `derecho-civil`, `derecho-mercantil`, `extranjeria-migracion`, `hondurenos-en-espana`, `derecho-notarial`, `tributario`, `noticias-legales`, `practica-legal`, `derechos-ciudadanos`, `derecho-bancario`, `derecho-administrativo`, `derecho-aduanero`, `regulacion-sanitaria`, `propiedad-intelectual`, `derecho-ambiental`, `conciliacion-arbitraje`
- Los dropdowns del admin usan `blogCategories` (importado directamente del archivo)
- Las categorías se guardan por slug en `blog_posts.category`

### FAQ — 11 categorías
- **Fuente**: `data/faq-categories.ts`
- **Estructura**: `{ slug, titulo, descripcion }`
- **Slugs**: `derecho-penal-general`, `asistencia-detenidos`, `proceso-penal`, `derecho-de-familia`, `derecho-laboral`, `derecho-civil`, `derecho-mercantil`, `extranjeria-migracion`, `tributario-sar`, `bufete-honorarios`, `otras-areas`
- Helpers: `faqCategorySlugToName`, `faqCategorySlugToDescription`
- Los dropdowns del admin usan `faqCategoriesMeta`

### Reglas
- Las categorías deben venir de la fuente real (archivo TS), no de texto libre.
- No duplicar listas de categorías. Ya están centralizadas.
- Si se añade una categoría nueva, actualizar el array en el archivo fuente y la DB si aplica.
- No permitir categorías que no existan en la fuente.

---

## 7. Calculadora de penas

### Rutas
- **Pública**: `/calculadora` — 8 pasos (flujo wizard, **pero requiere autenticación** — es ruta legacy de intranet)
- **Intranet**: `/intranet/calculadora` → rewrite → `/calculadora`
- **Admin**: `/intranet/admin/calculadora` — versión admin con layout propio
- **Código**: `components/domain/calculadora/` (13 archivos: state, hooks, pasos 1-8)
- **Estado**: vía `configs` (array de `DelitoConfig`). Preservar inmutabilidad.

> **⚠️ PRIVACIDAD ABSOLUTA**: La calculadora de penas es una herramienta interna del bufete. Ninguna de sus rutas (`/calculadora`, `/intranet/calculadora`, `/intranet/admin/calculadora`, `/api/calcular`, `/api/calcular/pdf`) debe ser indexada por buscadores, enlazada desde páginas públicas, ni mencionada en contenido indexable. Ver regla 17 en sección 8.

### Motor de cálculo
- `lib/rules/v1/` — 9 archivos: `pena-base.ts`, `circunstancias.ts`, `tentativa.ts`, `grado-autoria.ts`, `concurso.ts`, `eximentes.ts`, `analisis.ts`, `types.ts`, `index.ts`
- `lib/calculo.ts` — re-exporta desde `lib/rules/v1/`
- `lib/utils.ts` — aumentar/reducir grado, mitad superior/inferior
- `lib/catalogos.ts` — catálogos legales (agravantes Art. 32 CP, atenuantes Art. 31 CP, eximentes Art. 30 CP)

### Catálogo de delitos
- **483 delitos** del Código Penal hondureño (Decreto 130-2017) más reformas
- **Verificación**: 483 verificados (100%), 0 pendientes, 0 rechazados — `data/delitos-estados.json`
- **API calidad**: `GET /api/delitos/calidad` devuelve resumen de estados
- **Validación**: contra CP Decreto 130-2017 y reformas 119-2019, 46-2020, 93-2021, 59-2024
- **Fuente**: `data/delitos.json` (unique constraint en `(nombre, articulo)`)

### API
- `POST /api/calcular` — `CalculoRequest`, devuelve resultado JSON
- `POST /api/calcular/pdf` — genera PDF vía @react-pdf
- `GET /api/delitos` — listar delitos
- `GET /api/delitos/[id]` — detalle delito
- `GET /api/delitos/count` — contador
- `GET /api/delitos/calidad` — resumen verificación

### Reglas para la IA

- No cambiar solo el texto del contador (debe reflejar datos reales).
- No marcar registros como verificados sin validar contra el CP.
- No alterar fórmulas legales sin causa justificada y verificación legal expresa.
- `meses_a_texto()` debe mantener formato "X años y Y meses".
- Paso 4: `eximente_completa` es `string | null`, no booleano.
- Paso 8: resultado envuelto en `ErrorBoundary`.
- La calculadora NO usa `AppShell` (UX de wizard de foco).
- La API `/api/calcular` es POST y espera `CalculoRequest`. No cambiar el contrato.
- No cambiar reglas de compensación agravantes/atenuantes sin verificación legal expresa.

---

## 8. Restricciones críticas para agentes IA

### Lo que NO debe hacer la IA

1. **No rediseñar la web pública**. Las páginas `/(public)/*` tienen diseño visual establecido. Solo tocar la apariencia visual por bug técnico imprescindible. La optimización SEO (metadatos, schemas, headings semánticos, datos estructurados, enlazado interno) no constituye rediseño y es responsabilidad del agente SEO.
 2. **No romper SEO ni URLs públicas sin justificación**. Los cambios de slugs, breadcrumbs, JSON-LD, sitemap, robots.txt, OG tags o hreflang deben ser intencionados, trazables y validados. El agente SEO tiene autoridad para optimizar metadatos, schemas, headings, enlazado interno y arquitectura de contenido siempre que no degrade el SEO existente. Cualquier cambio estructural en URLs requiere aprobación explícita.
3. **No usar datos mock como solución final**. Toda persistencia debe ser en DB (PostgreSQL) a menos que el sistema explícitamente use otra fuente.
4. **No usar localStorage como persistencia final** salvo que sea la fuente real explícita del subsistema.
5. **No cambiar arquitectura sin justificar** (framework, app router, proxy, auth, DB schema).
6. **No duplicar lógica** (helpers, tipos, schemas, configuraciones).
7. **No crear categorías falsas** para blog o FAQ. Usar `data/blog/categories.ts` y `data/faq-categories.ts`.
8. **No introducir cambios destructivos** sin migración/backup (DELETE sin WHERE, DROP table, etc.).
9. **No marcar datos como verificados sin validación real** contra el CP de Honduras.
10. **No dejar posts generados automáticamente sin cuerpo completo**.
11. **No eliminar contenido existente** sin migración o backup verificable.
12. **No modificar configuración de modelos, proveedores o APIs** (IA, email, analytics) sin instrucción explícita.
13. **No mezclar refactors grandes con correcciones puntuales**.
14. **No crear rutas nuevas si ya existen rutas oficiales** del proyecto.
15. **No permitir categorías inválidas** en formularios de blog o FAQ.
16. **No guardar en fuentes incorrectas** (blog debe ir a `blog_posts`, FAQ a `faq_entries`).
17. **La calculadora de penas es uso interno exclusivo del personal del bufete**. No crear rutas públicas, no exponer fuera de `/intranet/`, no enlazar desde páginas públicas indexables. No solicitar indexación de ninguna URL relacionada con la calculadora en buscadores. Bing, Google y demás motores no deben descubrir ni indexar ninguna URL bajo `/intranet/`, `/calculadora`, `/casos`, `/cp`, `/delitos` ni `/admin/`.
18. **No exponer la intranet ni sus herramientas al público**. La intranet (`/intranet/*`) y todas sus rutas hijas son privadas. No redirigir desde URLs administrativas a la home sin considerar las señales SEO que ello genera. Si una URL administrativa es descubierta, debe devolver 401/403/login, no 301/302 genérica.
19. **La intranet es PRIVADA y jamás se menciona en la web pública**. No se hace referencia a ninguna funcionalidad, ruta, herramienta, contenido ni sección de la intranet (`/intranet/*`, `/calculadora`, `/casos`, `/cp`, `/delitos`, `/atajos`, `/admin/*`) desde páginas públicas, artículos del blog, FAQ, sitemaps, metadatos, breadcrumbs, schemas JSON-LD, enlaces internos ni externos. Para los buscadores y el público general, la intranet no existe.

### Lo que SIEMPRE debe hacer la IA

1. **Auditar antes de tocar código**: leer README.md, CHANGELOG.md, AGENTS.md.
2. **Identificar la fuente real de datos** antes de escribir.
3. **Hacer cambios mínimos y coherentes** con el código existente.
4. **Ejecutar build/lint/tests** (`npm run lint && npm run build && npm run test`).
5. **Probar rutas afectadas** después del cambio.
6. **Actualizar documentación** (README.md, CHANGELOG.md) cuando aplique.
7. **Reportar NO VALIDADO** si un comando no puede ejecutarse, con la causa exacta.
8. **Distinguir** entre IMPLEMENTADO, VALIDADO, NO VALIDADO, PENDIENTE, RIESGO.
9. **Responder en español**, claro y breve.
10. **Usar el formato de respuesta final** (ver sección 11).

---

## 9. Flujo obligatorio por cambio

Ejecutar en orden. No saltar pasos.

### 1. Lint + Build
```bash
npm run lint
npm run build
```
- `lint`: 0 errores. (Puede haber warnings preexistentes.)
- `build`: `Compiled successfully` + `Finished TypeScript` sin errores.
- Si `build` falla por `EPERM` en `.next`: `Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue` y reintentar.

### 2. Tests unit + E2E
```bash
npm run test
npm run test:e2e
```
- `test` (Vitest): debe pasar todos los tests (~185 en 13 archivos).
- `test:e2e` (Playwright): debe pasar todas las pruebas E2E (3 spec files, ~29 tests, suite pública sin auth).
- Si `test:e2e` falla por `EPERM` en `test-results` o `.next`: limpiar y reintentar.
- Si el webServer de Playwright no arranca por build sucia: `Remove-Item -LiteralPath .next -Recurse -Force` antes de reintentar.

### 3. Commit + Push (solo si pasos 1 y 2 pasan)
```bash
git add <archivos específicos>
git commit -m "<mensaje descriptivo en español>"
git push origin main
```
- Commits atómicos (un cambio lógico por commit). Mensaje en español, con prefijo (`feat:`, `fix:`, `docs:`, `chore:`).
- NO usar `git add .` a ciegas; revisar `git status` y `git diff --stat` antes.
- `push` solo a `main` (no hay branches de feature).

### 4. Verificar deploy de Vercel (después de push)
```bash
Start-Sleep -Seconds 30
vercel ls calculo-de-penas-nextjs
vercel inspect <url-del-nuevo-deploy>
```
- Vercel CLI autenticado. El deploy debe pasar de `Building` a `Ready` en ~30-60s.
- Verificar alias de producción: `calculo-de-penas-nextjs.vercel.app`.

---

## 10. Comandos por área modificada

| Área | Comando |
|------|---------|
| Motor de cálculo (`lib/calculo.ts`, `lib/rules/v1/`, `lib/utils.ts`, `lib/catalogos.ts`) | `npm run build` + verificar API `/api/calcular` con `Invoke-RestMethod` |
| Schema DB (`lib/schema.ts`) | `npx drizzle-kit generate` |
| Dependencias, build, Vercel o estructura del proyecto | `npm run build` |
| Datos semilla (`data/*.json`) | `node -e "const d=require('./data/delitos.json'); console.log(d.length)"` + verificar sin duplicados por `(nombre, articulo)` y UTF-8 |
| Blog admin | `npm run build` + verificar GET `/api/admin/blog` |
| FAQ admin | `npm run build` + verificar GET `/api/admin/faq` |
| Blog público | `npm run build` + `npm run test:e2e` |
| API routes | `npm run build` + verificar endpoint con `Invoke-RestMethod` |
| UI / componentes públicos | `npm run build` + `npm run test` |
| Imágenes / assets | `npm run build` + verificar rutas públicas |
| SEO / robots / sitemap | `npm run build` + `npm run lint` + verificar `sitemap.xml` y `robots.txt` en build output |

---

## 11. Comunicación con el usuario

- Responder siempre en español, claro y breve.
- No usar respuestas complacientes. Si algo está mal, decirlo.
- Distinguir entre plantilla, borrador, versión parcial, versión completa y validación real.
- No llenar con teoría innecesaria.

### Formato de respuesta final

```
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Cambios aplicados:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```

---

## 12. Investigación inicial en este repositorio

Cuando se inicia una sesión, leer en orden:
1. `README*`, `package.json`, `kilo.json` (proyecto), `opencode.jsonc` (legacy)
2. Config global: `~/.config/kilo/kilo.json` (moderno) o `~/.config/kilo/kilo.jsonc` — puede contener agentes, MCP servers, plugins y config que afectan el comportamiento
3. `AGENTS.md` (este archivo), `.kilo/agent/*.md` (agentes del proyecto), `.kilo/rules/*.md` (reglas del proyecto)
4. Archivos de entrypoint y config de build/test
5. `CHANGELOG.md` (últimas releases para contexto de cambios recientes)

No asumir que la configuración del proyecto es la única que existe. Verificar también la global.

---

## 13. Principios obligatorios

1. No afirmar "hecho", "completado", "validado", "listo" o "todo correcto" sin pruebas reales.
2. No inventar resultados de comandos, URLs, fuentes legales, APIs, rutas, dependencias ni comportamiento del sistema.
3. Si una validación no puede ejecutarse, reportar `NO VALIDADO` con la causa exacta.
4. No ocultar errores. Si algo está mal, decirlo claramente.
5. No reescribir archivos completos si basta una corrección mínima.
6. No dejar funciones truncadas, código muerto, comentarios falsos o promesas no implementadas.
7. No cambiar arquitectura sin justificación técnica.
8. No modificar configuración de modelos, proveedores o APIs salvo instrucción explícita.
9. No asumir que una validación equivale a otra. `dry-run` ≠ validación de producción.
10. No confundir compilación correcta con funcionamiento real del sistema.

## Honestidad operativa

Distinguir entre:
- `IMPLEMENTADO`: archivo modificado realmente.
- `VALIDADO`: comandos reales ejecutados y pasaron.
- `NO VALIDADO`: no se pudo comprobar (falta Internet, dependencias, env vars, permisos, servicios externos, credenciales o comando inexistente).
- `PENDIENTE`: falta trabajo real.
- `RIESGO`: condición que puede fallar en ejecución real.

Está prohibido usar "hecho", "listo", "completado" o "validado" si no corresponde exactamente. Si una tarea está parcialmente completada, reportar porcentaje completado y restante.

---

## 14. Forma de trabajo

### Antes de modificar
- Leer archivos afectados y entender el cambio mínimo necesario.
- Revisar `README.md`, `CHANGELOG.md`, `kilo.json` (proyecto y global), y archivos de reglas existentes (`.kilo/rules/*.md`).
- Confirmar si el cambio afecta API routes, motor de cálculo, DB schema, seed, metadata, UI de la calculadora, blog CMS, FAQ CMS, o validación de penas.
- Si el cambio es de ámbito SEO, verificar que cumple las reglas de `.kilo/rules/seo.md` y no degrada el SEO existente.
- **Siempre revisar la configuración GLOBAL** (`~/.config/kilo/kilo.json`) además de la del proyecto.

### Durante la modificación
- Cambios mínimos y controlados. No eliminar lógica funcional sin justificación.
- No crear rutas nuevas si ya existen rutas oficiales del proyecto.
- No mezclar refactors grandes con correcciones puntuales salvo instrucción explícita.
- No cambiar nombres de API routes, parámetros, schema DB o metadata sin justificación.

### Después de modificar
- Ejecutar validaciones reales. Revisar regresiones.
- Si algo falla, corregirlo o reportarlo como riesgo pendiente.
- Si se modifica comportamiento del proyecto, actualizar `README.md` o `CHANGELOG.md` si existe.
- Si se añaden rutas públicas, agregar a `PUBLIC_PAGE_EXACT` o `PUBLIC_PAGE_PREFIXES` en `proxy.ts`.
- Si se añaden rutas intranet legacy, agregar a `INTRANET_LEGACY_EXACT` o `INTRANET_LEGACY_PREFIXES`.
- Si se añaden páginas admin, asegurar que están protegidas por `requireAdmin()`.
- **Verificar que ninguna ruta nueva de intranet/admin se filtre al sitemap, robots.txt ni enlaces públicos**.

### Siempre verificar antes de finalizar
- Confirmar que ninguna URL de `/intranet/`, `/calculadora`, `/casos`, `/cp`, `/delitos`, `/atajos` ni `/admin/*` aparece en `sitemap.xml`.
- Confirmar que `robots.txt` bloquea todas las rutas privadas.
- Confirmar que `X-Robots-Tag: noindex, nofollow` se aplica a todas las rutas privadas.
- Confirmar que ningún enlace público (header, footer, contenido, breadcrumbs, schema) referencia la intranet. El único enlace a intranet es el de "Acceso Intranet" con `rel="nofollow"` en el header.

---

## 15. Criterio de cierre

Una tarea se cierra solo si: archivos revisados → cambios aplicados → comandos ejecutados → resultados reportados → riesgos declarados → no verificable marcado como `NO VALIDADO` → sin funciones truncadas, rutas rotas ni validaciones inventadas.

---

## 16. Gobernanza SEO

### Agente SEO

El proyecto dispone de un agente SEO especializado en `.kilo/agent/SEOSenior.md`. Este agente tiene autoridad para:

- Optimizar metadatos (title, description, OG, Twitter Cards, robots)
- Mejorar datos estructurados (JSON-LD, Schema.org)
- Ajustar headings (H1-H6) con criterio semántico
- Proponer y ejecutar mejoras de enlazado interno
- Auditar y corregir canibalización de keywords
- Optimizar contenido para intención de búsqueda
- Revisar y mejorar la arquitectura de información
- Gestionar sitemap.xml y robots.txt
- Implementar y validar hreflang, canonical, alternates
- Trabajar SEO local (Google Business Profile, geo tags, NAP)

### Reglas SEO persistentes

Las reglas en `.kilo/rules/seo.md` son vinculantes para cualquier modificación con impacto SEO:

- Una URL = una intención de búsqueda principal
- Revisar canibalización antes de crear nuevas páginas
- Alinear title, H1, primer párrafo y headings con la intención
- Evitar keyword stuffing y repetición artificial
- No inventar datos, métricas, rankings ni ubicaciones
- Priorizar cambios por impacto SEO (crítico > importante > recomendable)
- Mantener coherencia entre contenido, arquitectura y enlazado interno

### Conflictos con otras reglas

En caso de conflicto entre una regla SEO y una regla general del proyecto:
1. Las reglas de seguridad e integridad de datos prevalecen sobre las SEO
2. Las reglas de no-rediseño aplican solo al diseño visual, no al contenido SEO
3. El agente SEO puede modificar metadatos, schemas y contenido editorial sin aprobación adicional
4. Los cambios estructurales de URLs requieren aprobación explícita

### Skills y comandos SEO

- Skills: `.kilo/skills/auditoria-seo/`, `.kilo/skills/brief-seo/`, `.kilo/skills/enlazado-interno/`, `.kilo/skills/seo-local/`, `.kilo/skills/on-page/`
- Comandos: `/auditar-seo`, `/brief-seo`, `/enlazado-interno`, `/seo-local`, `/fix-seo`

## Instrucción final

La prioridad del agente es preservar integridad, trazabilidad, seguridad y verificabilidad del repositorio. La respuesta correcta no es la más complaciente, sino la más precisa y comprobable.

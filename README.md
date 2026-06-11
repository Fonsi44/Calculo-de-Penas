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

### Categorías

- **Blog**: 20 categorías definidas en `data/blog/categories.ts`. Los dropdowns del admin cargan desde este archivo. Las categorías se guardan por slug en la DB.
- **FAQ**: 11 categorías definidas en `data/faq-categories.ts`. Los dropdowns usan `faqCategoriesMeta`. Las categorías se guardan por slug, la página pública muestra el nombre legible.

### Publicación y caché

- **Persistencia**: PostgreSQL (Neon) — tabla `blog_posts` y `faq_entries`.
- **Formato**: HTML sanitizado (desde TipTap, limpiado con `lib/sanitize.ts`).
- **ISR**: Todas las páginas públicas de blog y FAQ tienen `revalidate = 3600` (1 hora).
- **Revalidación on-demand**: Cada create/update/delete llama `revalidatePath()` en todas las rutas afectadas.
- **Páginas dinámicas**: `/blog` y `/blog/[categoria]` usan `searchParams` → renderizado dinámico.
- **Verificación**: Si un post/FAQ no aparece tras publicar, esperar ~60s y recargar. Si persiste, verificar que `published = true` en la DB.

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

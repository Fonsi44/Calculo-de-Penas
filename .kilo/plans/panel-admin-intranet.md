# Plan: Panel de Control de Administración (v2 - Revisión de Arquitectura)

**Objetivo:** Crear un panel admin completo, seguro y mantenible en `/intranet/admin/*`, accesible solo para rol `admin`, con gestión de usuarios, blog, FAQ, configuración del sitio y perfil.

**Fecha:** 2026-06-11
**Estado:** Parcialmente implementado (~45%). Se requiere corrección de seguridad, nuevas tablas, páginas pendientes y APIs públicas.

---

## Estado Actual (auditoría real del repositorio)

### Ya implementado (~45%)
| Componente | Archivos | Estado |
|-----------|----------|--------|
| Schema DB | `lib/schema.ts` (líneas 181-232) | ✅ 3 tablas nuevas creadas y migradas (migración 0008) |
| API Usuarios | `app/api/admin/usuarios/` (3 archivos) | ✅ CRUD + reset-password con requireAdmin |
| API Blog | `app/api/admin/blog/` (2 archivos) | ✅ CRUD con requireAdmin |
| API FAQ | `app/api/admin/faq/` (2 archivos) | ✅ CRUD con requireAdmin |
| API Site Config | `app/api/admin/site-config/route.ts` | ✅ GET público, PUT admin |
| API Cambio Contraseña | `app/api/auth/change-password/route.ts` | ✅ requireAuth + verifyPassword |
| Layout Admin | `app/intranet/admin/layout.tsx` | ✅ Sidebar admin, check cliente rol |
| Dashboard | `app/intranet/admin/page.tsx` | ✅ Stats con fetch a APIs admin |
| Página Usuarios | `app/intranet/admin/usuarios/page.tsx` | ✅ Lista + formulario crear |
| Página Editar Usuario | `app/intranet/admin/usuarios/[id]/page.tsx` | ✅ Formulario edición |

### Pendiente (~55%)
- **Schema:** `active` + `must_change_password` en usuarios, `admin_audit_log`
- **Seguridad:** último admin, soft delete, sanitización HTML, allowlist site-config
- **Auditoría:** extender `auditoria_eventos` enum y loggear acciones admin
- **Páginas:** blog (lista+editor), FAQ, config, perfil
- **APIs públicas:** `lib/blog-db.ts`, `lib/faq-db.ts`, `lib/site-config-db.ts` para SSR
- **Migración:** script `scripts/migrate-blog-to-db.ts`
- **SEO:** actualizar páginas públicas del blog para leer de DB

---

## Fase 1: Correcciones de Schema y Seguridad

### 1.1 Modificar tabla `usuarios` en `lib/schema.ts`

Añadir columnas:
```typescript
active: boolean('active').default(true),           // soft delete
mustChangePassword: boolean('must_change_password').default(false), // force pw change
```

### 1.2 Extender `auditoriaAccionEnum`

Añadir valores para acciones admin:
```typescript
'usuario_created',
'usuario_updated',
'usuario_deleted',
'password_reset',
'blog_created',
'blog_updated',
'blog_deleted',
'faq_created',
'faq_updated',
'faq_deleted',
'site_config_updated',
```

Reutilizar tabla `auditoria_eventos` existente. El campo `recurso` será la entidad ("usuario", "blog", "faq", "site_config"), `recursoId` el ID, `metadata` con detalles adicionales.

### 1.3 Añadir índices pendientes en `blog_posts`

```typescript
publishedIdx: index('blog_posts_published_idx').on(table.published),
featuredIdx: index('blog_posts_featured_idx').on(table.featured),
```

### 1.4 Añadir índice `published` en `faq_entries`

```typescript
publishedIdx: index('faq_entries_published_idx').on(table.published),
```

### 1.5 Generar migración 0009

```bash
npx drizzle-kit generate && npx drizzle-kit push
```

---

## Fase 2: Correcciones de APIs Admin

### 2.1 `POST /api/admin/usuarios` — Añadir auditoría

Loggear `usuario_created` en `auditoria_eventos` con metadata `{ targetEmail, targetRol }`.

### 2.2 `PATCH /api/admin/usuarios/[id]` — Último admin + auditoría

- **Protección último admin:** Si se intenta cambiar rol de `admin` a `abogado`, verificar cuántos admins activos quedan. Si es el último, rechazar con 403.
- Loggear `usuario_updated` con metadata `{ changes }`.
- Si se cambia `rol`, loggear como metadata adicional `{ oldRol, newRol }`.

### 2.3 `DELETE /api/admin/usuarios/[id]` — Soft delete

- Cambiar a `active = false` en lugar de DELETE físico.
- Añadir control: no desactivar al último admin.
- Loggear `usuario_deleted` (soft).

### 2.4 `POST /api/admin/usuarios/[id]/reset-password` — Temp password

- Generar contraseña temporal aleatoria de 12 caracteres con `crypto.randomBytes`.
- Establecer `must_change_password = true` en el usuario.
- Devolver la contraseña temporal UNA SOLA VEZ al admin, con mensaje de advertencia.
- Loggear `password_reset` en auditoría.

### 2.5 `POST /api/auth/change-password` — Limpiar must_change_password

- Tras cambio exitoso de contraseña propia, poner `must_change_password = false`.

### 2.6 `POST /api/admin/blog` — Auto-slug + auditoría

- Si no se proporciona slug, generarlo automáticamente desde el title (kebab-case, sanitizado).
- Loggear `blog_created`.

### 2.7 `PATCH /api/admin/blog/[id]` — Auditoría + revalidación

- Loggear `blog_updated`.
- Al publicar/despublicar, llamar `revalidatePath('/blog')` y `revalidatePath('/blog/${slug}')`.

### 2.8 `DELETE /api/admin/blog/[id]` — Auditoría + revalidación

- Loggear `blog_deleted`.
- Revalidar rutas de blog.

### 2.9 `POST /api/admin/faq` — Auditoría

- Loggear `faq_created`.

### 2.10 `PATCH /api/admin/faq/[id]` — Auditoría + revalidación

- Loggear `faq_updated`.
- Revalidar FAQ pública.

### 2.11 `DELETE /api/admin/faq/[id]` — Auditoría

- Loggear `faq_deleted`.

### 2.12 `PUT /api/admin/site-config` — Allowlist + validación + revalidación

- **Allowlist de claves permitidas:**
  ```
  telefono, whatsapp, email, direccion_line1, direccion_line2,
  ciudad, departamento, horario, facebook, instagram, tiktok,
  geo_lat, geo_lng
  ```
- Rechazar claves no permitidas con 400.
- Validar formato: email (regex email), teléfono (regex), URLs (URL constructor), lat/lng (número).
- Loggear `site_config_updated` con metadata `{ claves }`.
- Revalidar página de contacto y home.

---

## Fase 3: Helper de Auditoría

### 3.1 `lib/audit.ts`

Crear helper reutilizable:
```typescript
export async function logAuditEvent(params: {
  usuarioId: string;
  accion: AuditoriaAccion;  // tipo extendido
  recurso: string;
  recursoId?: string;
  metadata?: Record<string, unknown>;
  exito?: boolean;
  mensaje?: string;
  request?: Request;
}): Promise<void>
```

Extrae `ip` y `userAgent` del Request automáticamente. Usa `db.insert(auditoriaEventos)`.

---

## Fase 4: APIs de Lectura Pública (Server Components)

### 4.1 `lib/blog-db.ts`

Funciones server-side que leen directamente de DB (sin fetch a API):
```typescript
export async function getPublishedPosts(opts?: { limit?: number; category?: string }): Promise<BlogPost[]>
export async function getPostBySlug(slug: string): Promise<BlogPost | null>
export async function getBlogCategories(): Promise<string[]>
export async function getRelatedPosts(slug: string, category: string, limit?: number): Promise<BlogPost[]>
```

Solo devuelven posts con `published = true`.

### 4.2 `lib/faq-db.ts`

```typescript
export async function getPublishedFaqs(): Promise<FaqEntry[]>
export async function getFaqCategories(): Promise<string[]>
```

Agrupadas por categoría, ordenadas por `sort_order`.

### 4.3 `lib/site-config-db.ts`

```typescript
export async function getSiteConfigOverrides(): Promise<Record<string, string>>
```

Lee de `configuracion_sitio`. Se usa como override sobre `lib/site.ts`.

### 4.4 Actualizar páginas públicas del blog

Las páginas en `app/(public)/blog/` actualmente importan `data/blog/posts/index.ts`. Hay que actualizarlas para usar `lib/blog-db.ts` en su lugar:

- `app/(public)/blog/page.tsx` → usar `getPublishedPosts()`
- `app/(public)/blog/[slug]/page.tsx` → usar `getPostBySlug(slug)`
- Mantener `data/blog/posts/index.ts` como fallback durante transición.

Estrategia de migración gradual:
1. Crear `lib/blog-db.ts`.
2. Modificar páginas del blog para intentar DB primero, fallback a archivos TS.
3. Tras migración exitosa y población de DB, eliminar fallback.

### 4.5 Actualizar página pública de FAQ

- `app/(public)/preguntas-frecuentes/page.tsx` → intentar `lib/faq-db.ts` primero, fallback a `data/faq.ts`.

### 4.6 Actualizar `lib/site.ts` para overrides

Añadir función async opcional. Mantener exports síncronos intactos.

---

## Fase 5: Páginas Admin Pendientes

### 5.1 Blog — Lista (`app/intranet/admin/blog/page.tsx`)
- Tabla paginada con columnas: título, categoría, estado (Badge), fecha.
- Filtros: búsqueda (q), categoría (select de categories.ts), estado (publicado/borrador/todos).
- Acciones por fila: editar, eliminar (con confirmación), toggle publicar.
- Botón "Nuevo post".

### 5.2 Blog — Editor (`app/intranet/admin/blog/[id]/page.tsx`)
- Modo crear: `/intranet/admin/blog/nuevo` o detectar `id === 'nuevo'`.
- Campos: título, slug (auto-generado), descripción, categoría (select), tags (chips), author, reading_time, cover_image URL, featured toggle, published toggle, published_at date.
- Body: textarea HTML + pestaña "Preview" con iframe sandbox.
- Preview: `<iframe sandbox="allow-same-origin" srcDoc={body} />` para evitar XSS.
- Al guardar, redirigir a lista.

### 5.3 FAQ (`app/intranet/admin/faq/page.tsx`)
- Agrupado por categoría con acordeones.
- Cada entrada muestra pregunta + preview de respuesta.
- Botones: editar, eliminar, subir/bajar (reordenar sort_order).
- Modal/Bloque para añadir nueva FAQ: categoría (select o nuevo), pregunta, respuesta (textarea HTML).
- Select de categorías extraído de `data/blog/categories.ts` o `data/faq.ts`.

### 5.4 Configuración del Sitio (`app/intranet/admin/config/page.tsx`)
- Formulario con secciones:
  - **Contacto:** teléfono, WhatsApp, email
  - **Dirección:** línea 1, línea 2, ciudad, departamento
  - **Horario:** texto libre
  - **Redes sociales:** Facebook, Instagram, TikTok
  - **Geo:** latitud, longitud
- Valores iniciales cargados de `GET /api/admin/site-config` con fallback a `site.*` (frontend lee de `site` vía import o API pública).
- Botón "Guardar configuración" → `PUT /api/admin/site-config`.

### 5.5 Perfil (`app/intranet/admin/perfil/page.tsx`)
- Mostrar datos del usuario actual (nombre, email, rol).
- Formulario "Cambiar contraseña":
  - Contraseña actual
  - Nueva contraseña
  - Confirmar nueva contraseña
- Validación cliente: coincidencia, mínimo 6 caracteres.
- POST a `/api/auth/change-password`.

---

## Fase 6: Migración Blog TS → DB

### 6.1 Script `scripts/migrate-blog-to-db.ts`

```typescript
// Ejecutar con: npx tsx scripts/migrate-blog-to-db.ts
import { db } from '../lib/db';
import { blogPosts } from '../lib/schema';
import { allPosts } from '../data/blog/posts/index';  // array de Post

async function migrate() {
  const existing = await db.select({ slug: blogPosts.slug }).from(blogPosts);
  const existingSlugs = new Set(existing.map(r => r.slug));

  let inserted = 0;
  for (const post of allPosts) {
    if (existingSlugs.has(post.slug)) continue;
    await db.insert(blogPosts).values({
      slug: post.slug,
      title: post.title,
      description: post.description,
      body: post.body,
      publishedAt: new Date(post.publishedAt),
      updatedAt: post.updatedAt ? new Date(post.updatedAt) : null,
      category: post.category,
      tags: post.tags,
      author: post.author,
      readingTime: post.readingTime,
      coverImage: post.coverImage ?? null,
      featured: post.featured ?? false,
      published: true,
    });
    inserted++;
  }
  console.log(`Migrados ${inserted} posts nuevos. Total existentes: ${existingSlugs.size}`);
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
```

### 6.2 Migrar FAQs existentes

Script similar `scripts/migrate-faq-to-db.ts` que lee `data/faq.ts` y las inserta en `faq_entries`.

---

## Fase 7: Proxy y Root Shell

### 7.1 `proxy.ts`

`/intranet/admin/*` ya está cubierto por `startsWith('/intranet')` en el proxy. No se requiere cambio.

### 7.2 `root-shell.tsx`

`/intranet/admin/*` NO está en PUBLIC_ROUTES, por lo que el RootShell muestra sidebar principal. El layout admin tiene su propio sidebar independiente, así que el sidebar principal se ocultará si detectamos ruta `/intranet/admin`.

**Opción A:** Añadir `/intranet/admin` a PUBLIC_PREFIXES internos en RootShell (para que no muestre sidebar + drawer).

**Opción B:** El layout admin se encarga de ocultar su propio sidebar y el root-shell simplemente muestra el sidebar normal (que queda a la izquierda). Esto crearía DOBLE sidebar.

**Decisión: Opción A.** Añadir en `root-shell.tsx`:
```typescript
const INTRANET_ADMIN_PREFIX = '/intranet/admin';
function isPublicRoute(pathname: string): boolean {
  // ... existing checks ...
  if (pathname.startsWith(INTRANET_ADMIN_PREFIX)) return true; // admin tiene su propio layout
  return false;
}
```

---

## Fase 8: Revalidación y Caché

- Tras cambios en blog: `revalidatePath('/blog')`, `revalidatePath('/blog/[slug]')`.
- Tras cambios en FAQ: `revalidatePath('/preguntas-frecuentes')`.
- Tras cambios en site-config: `revalidatePath('/')`, `revalidatePath('/contacto')`, etc.
- Usar `unstable_cache` o `revalidateTag` si aplica en funciones de `lib/blog-db.ts`.

---

## Fase 9: Lint, Build, Tests

```bash
npm run lint
npm run build
npm run test
```

---

## Orden de Implementación (18 pasos)

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Añadir `active`, `must_change_password` a usuarios + nuevo enum auditoría | `lib/schema.ts` |
| 2 | Añadir índices published/featured en blog_posts y faq_entries | `lib/schema.ts` |
| 3 | Generar migración 0009 y aplicar | `drizzle/migrations/` |
| 4 | Crear `lib/audit.ts` (helper de auditoría) | `lib/audit.ts` |
| 5 | Corregir API usuarios: soft delete, último admin, auditoría | `app/api/admin/usuarios/` |
| 6 | Corregir API reset-password: temp password + must_change_password | `app/api/admin/usuarios/[id]/reset-password/` |
| 7 | Corregir API change-password: limpiar must_change_password | `app/api/auth/change-password/` |
| 8 | Corregir API blog: auto-slug, auditoría, revalidación | `app/api/admin/blog/` |
| 9 | Corregir API FAQ: auditoría, revalidación | `app/api/admin/faq/` |
| 10 | Corregir API site-config: allowlist, validación, revalidación | `app/api/admin/site-config/` |
| 11 | Página Blog (lista) | `app/intranet/admin/blog/page.tsx` |
| 12 | Página Blog (editor) | `app/intranet/admin/blog/[id]/page.tsx` |
| 13 | Página FAQ | `app/intranet/admin/faq/page.tsx` |
| 14 | Página Configuración | `app/intranet/admin/config/page.tsx` |
| 15 | Página Perfil | `app/intranet/admin/perfil/page.tsx` |
| 16 | Crear `lib/blog-db.ts`, `lib/faq-db.ts`, `lib/site-config-db.ts` | `lib/*-db.ts` |
| 17 | Script migración blog + FAQ TS → DB | `scripts/migrate-blog-to-db.ts`, `scripts/migrate-faq-to-db.ts` |
| 18 | Lint + build + test | Flujo estándar |

---

## Porcentaje completado: ~45%

- Schema inicial: ✅
- APIs admin básicas: ✅
- Layout + dashboard: ✅
- Página usuarios: ✅
- Correcciones seguridad: ❌ (0%)
- Páginas pendientes: ❌ (0%)
- APIs públicas/SSR: ❌ (0%)
- Migración: ❌ (0%)

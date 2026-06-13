# LEX HONDURAS — Motor de Cálculo de Penas

Aplicación web para el cálculo de penas según el **Código Penal de Honduras (Decreto 130-2017)** y reformas vigentes.

> **🧠 Para agentes IA**: Este repositorio tiene un protocolo obligatorio en [`AGENTS.md`](./AGENTS.md). Léelo antes de cualquier modificación. Contiene la arquitectura actual, fuentes de datos, reglas del Blog CMS, FAQ CMS, calculadora y restricciones críticas que debes respetar.

Público objetivo: profesionales del derecho que necesitan determinar penas con precisión técnica.

Stack: Next.js 16 + React 19 + Tailwind CSS v4 + Neon PostgreSQL + Drizzle ORM + JWT + Vitest + Playwright.

## Sistema visual (Premium Corporate Luxury)

Dirección de arte: **Navy refinado (#0F1D3A) · Off-white limpio (#F9F8F5) · Gold sofisticado (#D4AF37)**.

### Tokens principales (`app/globals.css` — bloque `@theme`)

- **Color**: `--color-primary`, `--color-primary-light`, `--color-primary-dark`, `--color-accent`, `--color-accent-light`, `--color-accent-dark`.
- **Superficies** (jerarquía clara): `background < surface-alt < surface-2 < surface`. `surface-2` (nuevo) añade un nivel sutil con tinte cálido para dar profundidad sin oscurecer.
- **Texto**: `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`.
- **Bordes**: `--color-border`, `--color-border-light`, `--color-border-strong`.
- **Sombras premium** (tintadas con navy, 3 capas: contacto cercano + halo medio + profundidad amplia): `--shadow-xs/sm/md/lg/xl`, `--shadow-card`, `--shadow-card-hover`, `--shadow-btn-primary/secondary/accent`.

### Escala tipográfica (Release 37 — referencia)

Sistema fijo en `app/globals.css`. Todo el frontend público debe respetarlo.

| Elemento | Mobile | Desktop | Peso | Notas |
|---|---|---|---|---|
| `body` | 16px | 16px | 400 | Estándar web, párrafos con presencia real |
| Hero H1 (página interna) | 30px | 48px | 800 (`font-extrabold`) | `PageHero` — presencia de hero corporativo |
| Hero H1 (home) | 36px | 68px | 800 | Inline en `app/(public)/page.tsx` |
| H2 sección | 24px | 36px | 800 | `SectionHeader` — coherente con la home |
| H3 card / bloque | 18px | 18-20px | 700 | `card-title` |
| Subtítulo hero | 16px | 18px | 400 | `leading-relaxed`, `max-w-3xl` |
| Texto base | 16px | 16px | 400 | `text-base` |
| Eyebrow | 11px | 11px | 700 | `.eyebrow-rule` — uppercase + tracking 0.3em |

**Reglas**:
- No usar `text-base` por debajo de 16px. No usar `text-sm` (14px) en cuerpo de párrafo (sí допустимо en captions, meta, labels).
- No bajar H1 por debajo de 30px en mobile ni 48px en desktop.
- No usar `font-bold` (700) en hero/sección — usar `font-extrabold` (800) para presencia corporativa.
- Si una sección parece "tímida" o "encogida", el problema casi siempre es body demasiado bajo, no un componente concreto. Verificar primero `getComputedStyle(body).fontSize`.

### Utilities compartidas

- `.card-premium` — superficie con gradiente interno + sombra multicapa + halo dorado al hover.
- `.card-dark` — tarjeta para zonas navy con borde luminoso sutil.
- `.hero-card` — borde con gradiente dorado + 4 niveles de sombra + glow.
- `.glass` — header con `backdrop-blur 16px` + saturate.
- `.eyebrow-rule` — línea dorada + uppercase tracking (eyebrows consistentes).
- `.ring-gradient-accent` — borde con gradiente dorado.
- `.btn-shimmer` — pasada de luz en hover para CTAs.
- `.text-gradient-accent` — texto con gradiente dorado.
- `.bg-hero-gradient` — gradiente navy 165° con transiciones suaves.
- `.bg-page-warm` — gradiente vertical cálido global para páginas públicas.
- `.bg-grid` / `.bg-grid-soft` — grid sutil 1px (zonas oscuras/claras).
- `.glow-accent-top` — línea + halo radial dorado superior (hero, footer).
- `.premium-bar` — franja dorada superior en hover (cards premium).
- `.divider-accent` — separador con gradiente dorado horizontal.

### Componentes UI base

- `Button` (`components/ui/button.tsx`) — variants: `primary` (navy + halo dorado), `secondary` (surface + borde), `tertiary`, `danger`, `ghost`, `accent` (oro sólido). Todos con hover lift `-translate-y-0.5`, focus visible dorado, transición `ease-out 200ms`.
- `Card` (`components/ui/card.tsx`) — variants: `default` (card-premium), `flat`, `elevated`. Soporte `premium` para añadir barra dorada al hover.
- `Input` / `Textarea` / `Field` — focus con anillo dorado 3px, hover con borde más fuerte, mensajes de error refinados.
- `Badge`, `Chip`, `Stepper`, `EmptyState`, `Modal`, `Toast`, `Confirm`, `Spinner` — mantienen coherencia visual con el sistema.

### Reglas de oro del rediseño

1. **NO usar rojo** para CTAs primarios en la web pública (usar accent dorado). El rojo se reserva para estados semánticos (`danger`, `aggravation`) en calculadora.
2. **NO usar gradientes baratos** ni efectos llamativos. Solo gradientes navy→dorado sutiles y glows refinados.
3. **NO romper el ritmo** — todos los espacios en múltiplos de 4 (4/8/12/16/20/24).
4. **NO usar glassmorphism exagerado** — solo en header sticky y zonas con scroll.
5. **Separar siempre las cards del fondo** — usar `card-premium` (o `card-dark` en zonas navy) garantiza profundidad.
6. **Respetar el focus visible** — nunca `outline: none` sin alternativa.

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

### Indexabilidad de páginas públicas (SEO técnico)

Todas las páginas bajo `/(public)/` deben cumplir estos requisitos para ser indexables:

**Requisitos por página:**
- ✅ HTTP 200 (sin redirecciones)
- ✅ `<meta name="robots" content="index, follow">`
- ✅ `<link rel="canonical">` autocanónico (apuntando a sí misma)
- ✅ `<title>` único y descriptivo
- ✅ `<meta name="description">` única
- ✅ `<meta property="og:url">` apuntando a la URL correcta (no a home)
- ✅ `<meta property="og:title">` específico de la página
- ✅ Incluida en `sitemap.xml`
- ✅ Enlazada desde home, footer o navegación principal
- ✅ `<meta name="googlebot">` configurado (hereda del layout público)
- ✅ Contenido visible en HTML inicial (SSR)

**Problemas comunes ya corregidos (Release 30):**
1. Hreflang apuntando a home en todas las páginas → Eliminado (sitio monolingüe, no necesario)
2. OG tags (url, title) heredando los de la home → Cada página define sus propios OG tags
3. Canonical default `'/'` en layout público → Eliminado (cada página debe definir el suyo)
4. Título duplicado por plantilla → Corregido
5. Blog sin googleBot en robots → Corregido
6. Páginas huérfanas sin enlace en footer → Blog y Solicitar Consulta añadidos al footer

**Para verificar que una página es indexable:**
```bash
curl -sI https://www.pinedayasociadoshn.com/servicios-juridicos | findstr -i "x-robots"
curl -s https://www.pinedayasociadoshn.com/servicios-juridicos | findstr -i "robots canonical og:url"
```

**Para solicitar reindexación tras cambios:**
1. Ir a Google Search Console → URL Inspection
2. Pegar la URL y presionar Enter
3. Hacer clic en "Solicitar indexación"
4. Alternativamente: solicitar recrawleo del sitemap completo

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

### Agente SEO y herramientas de posicionamiento

El proyecto dispone de un sistema completo de agentes, reglas, skills y comandos SEO para Kilo Code:

| Recurso | Ruta | Propósito |
|----------|------|-----------|
| **Agente SEO** | `.kilo/agent/SEOSenior.md` | Agente principal con autoridad para optimizar metadatos, schemas, headings, enlazado interno y contenido editorial. Modo `primary`, invocable como `/SEOSenior` o desde `@SEOSenior`. |
| **Reglas SEO** | `.kilo/rules/seo.md` | 12 reglas vinculantes para cualquier modificación con impacto SEO. Incluyen intención de búsqueda, canibalización, priorización, schemas obligatorios y SEO local. |
| **Skill: Auditoría SEO** | `.kilo/skills/auditoria-seo/SKILL.md` | Auditoría técnica completa: indexación, on-page, schemas, arquitectura, enlazado, conversión. |
| **Skill: Brief SEO** | `.kilo/skills/brief-seo/SKILL.md` | Briefs de contenido optimizados con keyword, intención, headings, enlazado y schemas. |
| **Skill: Enlazado interno** | `.kilo/skills/enlazado-interno/SKILL.md` | Análisis de interlinking, anchors, páginas huérfanas y silos temáticos. |
| **Skill: SEO local** | `.kilo/skills/seo-local/SKILL.md` | Optimización local: NAP, geo tags, LocalBusiness schema, keywords geográficas. |
| **Skill: On-page** | `.kilo/skills/on-page/SKILL.md` | Optimización por página: titles, metas, headings, OG, schemas, contenido. |
| **Comando: `/auditar-seo`** | `.kilo/command/auditar-seo.md` | Auditoría SEO completa automatizada. |
| **Comando: `/brief-seo`** | `.kilo/command/brief-seo.md` | Crear brief SEO para nuevo contenido. |
| **Comando: `/enlazado-interno`** | `.kilo/command/enlazado-interno.md` | Analizar y optimizar enlazado interno. |
| **Comando: `/seo-local`** | `.kilo/command/seo-local.md` | Optimizar presencia en búsquedas locales. |
| **Comando: `/fix-seo`** | `.kilo/command/fix-seo.md` | Corregir problemas SEO detectados en auditorías. |

**Uso del agente SEO**: Invocar con `/SEOSenior` o seleccionando el agente "SEOSenior" en el menú de agentes. Para tareas específicas, usar los comandos `/auditar-seo`, `/brief-seo`, etc.

### Implementación SEO local — Zona Sur de Honduras (Jun 2026)

El blog ha sido reforzado con una estrategia SEO local orientada a captar leads en la zona sur de Honduras. La implementación sigue el plan definido en `auditoria-blog/AUDITORIA-ESTRATEGICA.md`.

**Páginas de dinero locales** (9 activas):
- `abogados-en-nacaome` — Sede del despacho (página principal)
- `abogados-en-choluteca` — Principal núcleo de captación
- `abogados-en-san-lorenzo` — Eje comercial y aduanero
- `abogado-penalista-choluteca` — Defensa penal local
- `abogado-laboral-choluteca` — Despidos y liquidaciones
- `abogado-familia-choluteca` — Divorcio, pensión, custodia
- `abogado-civil-choluteca` — Contratos, herencias, propiedades
- `abogado-aduanero-san-lorenzo` — Importaciones y comercio exterior
- `abogado-empresas-san-lorenzo` — Constitución y asesoría empresarial

**Posts satélite** (8 activos):
- `divorcio-choluteca`, `pension-alimenticia-choluteca`, `demanda-laboral-choluteca`
- `accidente-transito-choluteca`, `cobro-deudas-choluteca`, `defensa-sar-choluteca`
- `importaciones-san-lorenzo`, `tramites-legales-nacaome`

**Arquitectura**: Cada página de dinero contiene propuesta de valor local, servicios específicos, proceso de atención, zonas cubiertas, FAQs, CTA contextual y enlaces a posts satélite. Cada post satélite enlaza hacia su página de dinero correspondiente.

**Conversión**: FloatingContactRail (WhatsApp + teléfono flotante) activo globalmente. Eventos GA4 para clics en WhatsApp, teléfono y formularios en todos los CTAs del blog.

**Medición**: Biblioteca `lib/analytics.ts` con funciones `trackWhatsAppClick()`, `trackPhoneClick()`, `trackFormClick()` y `trackLeadGenerated()`.

**Gobernanza**: Las reglas en `.kilo/rules/seo.md` son vinculantes. El agente SEO tiene autoridad para modificar metadatos, schemas y contenido editorial. Los cambios estructurales de URLs requieren aprobación explícita. Ver `AGENTS.md` §16 para la política completa.

---

## Panel de Administración (Intranet Unificado)

El panel `/intranet/admin/` es el centro de control unificado que integra todas las funciones del antiguo dashboard (`/intranet/dashboard`) y del panel admin previo. Los usuarios con rol `admin` son redirigidos automáticamente aquí tras iniciar sesión.

### Acceso

- URL: `https://www.pinedayasociadoshn.com/intranet/admin`
- Autenticación JWT requerida (solo usuarios con rol `admin`).
- La sesión se gestiona mediante cookies `__Host-token` + `__Host-profile`.
- Los usuarios no-admin siguen accediendo a `/intranet/dashboard`.

### Navegación

El menú lateral fijo (w-60, visible en escritorio, colapsable en móvil) organiza las funciones en 5 grupos:

1. **Inicio** — Panel general con indicadores, acciones rápidas, herramientas jurídicas y posts recientes
2. **Gestión de contenido** — Blog, FAQ, Páginas editables
3. **Herramientas jurídicas** — Calculadora de penas, Mis casos, Biblioteca CP, Catálogo de delitos
4. **Administración** — Usuarios, SEO, Auditoría
5. **Configuración** — Perfil, Configuración del sitio

Cada grupo tiene submenús colapsables que se expanden automáticamente al navegar a una ruta de ese grupo. Las herramientas jurídicas abren en sus propias rutas (`/intranet/calculadora`, `/intranet/casos`, etc.) manteniendo su experiencia de uso original.

### Estilo visual

El estilo del dashboard prevalece: bordes gold (`border-l-accent`), tarjetas con iconos, badges tonales, tipografía compacta (`text-xxs` uppercase), sombras sutiles tintadas con navy, paleta navy+gold. El contenido derecho usa `max-w-7xl` para mejor aprovechamiento del espacio.

### Sistema de diseño del panel admin (Release 48)

El panel administrativo usa 4 componentes compartidos para mantener consistencia visual en todas las páginas:

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `PageHeader` | `components/ui/page-header.tsx` | Encabezado con título, subtítulo, metadatos y acciones |
| `StatCards` | `components/ui/stat-cards.tsx` | Grid de tarjetas de métricas con colores por tonalidad |
| `FilterBar` | `components/ui/filter-bar.tsx` | Búsqueda + filtros combinables |
| `TablePagination` | `components/ui/table-pagination.tsx` | Paginación con navegación prev/next |

**Reglas visuales del admin:**
- Toda página debe comenzar con `PageHeader`.
- Stats van después del header, antes de filtros.
- Filtros usan `FilterBar` cuando hay búsqueda + selects.
- Paginación usa `TablePagination` (se oculta si `totalPages <= 1`).
- Todos los `<select>` están estilizados globalmente con `appearance: none` y flecha SVG.
- Todos los `<input type="checkbox">` usan `accent-color: var(--color-accent)`.
- Bordes de tabla y card usan `border-border` (consistente en todas las páginas).
- Sidebar usa animación `grid-rows` para submenús colapsables.

**Para añadir una nueva página admin:**
1. Importar `PageHeader` y colocarlo al inicio del JSX.
2. Si tiene métricas, usar `StatCards` con `items={[...]}`.
3. Si tiene búsqueda/filtros, usar `FilterBar`.
4. Si tiene tabla, envolver en `<Card padding="none"><div className="overflow-x-auto"><table>...</table></div></Card>` y añadir `TablePagination`.

### Arquitectura CMS — Gestión dinámica de contenido

El proyecto cuenta con un sistema CMS en evolución que permite gestionar todo el contenido desde el admin sin tocar código. La Fase 1 del CMS añadió las tablas en `lib/schema.ts` (líneas 304+). Release 49 implementó los primeros módulos funcionales.

#### Tablas CMS disponibles

| Tabla | Propósito | Admin page |
|-------|-----------|-----------|
| `menus` | Menús de navegación (JSONB items) | `/intranet/admin/menus` ✅ |
| `medios` | Biblioteca de medios (imágenes, PDFs) | `/intranet/admin/medios` ✅ |
| `areas_juridicas` | Áreas de servicio (con subservicios, FAQs, SEO) | `/intranet/admin/servicios` ✅ |
| `paginas_cms` | Páginas dinámicas (contenido JSONB, SEO, plantilla) | Pendiente |
| `categorias_blog` | Categorías de blog en DB | Pendiente |
| `categorias_faq` | Categorías de FAQ en DB | Pendiente |
| `autores` | Autores de blog | Pendiente |
| `versiones_contenido` | Versionado de contenido | Pendiente |
| `redirects` | Redirecciones 301/302 | Pendiente |

#### Contenido que aún depende de código estático (NO gestionable)

| Contenido | Archivo/s | Prioridad |
|-----------|----------|-----------|
| Navegación header/footer | `components/marketing/public-header.tsx`, `public-footer.tsx` | 🔴 Crítica |
| 13 áreas jurídicas (títulos, descripciones, FAQs) | `data/areas-juridicas.ts` (1122 líneas) | 🔴 Crítica |
| CTA callout, trust bar, features bar | `components/marketing/*.tsx` | 🔴 Crítica |
| Cuerpo de 5 páginas legales | `app/(public)/{aviso-legal,terminos,politica-*}.tsx` | 🟡 Alta |
| Equipo profesional (2 perfiles) | `app/(public)/despacho/page.tsx` | 🟡 Alta |
| Cómo llegar (puntos ref, rutas) | `app/(public)/como-llegar/page.tsx` | 🟡 Alta |
| Stats, ticker, motivos formulario | `components/marketing/live-widgets.tsx`, `solicitar-consulta-form.tsx` | 🟡 Alta |
| 20 categorías blog, 11 categorías FAQ | `data/blog/categories.ts`, `data/faq-categories.ts` | 🟢 Media |
| Mapeo de imágenes OG | `data/images.ts` | 🟢 Media |

#### Hoja de ruta para migración completa

**Fase 1 (Release 49) — Módulos base** ✅
- [x] API CRUD para menús
- [x] API upload/búsqueda/eliminación para medios
- [x] API completa para áreas jurídicas (GET/POST/PATCH/DELETE)
- [x] Admin pages para menús, medios, áreas jurídicas
- [x] Sidebar actualizado con nuevos módulos

**Fase 2 — Contenido crítico al admin** 🟡 Pendiente
- [ ] Seed de `data/areas-juridicas.ts` → tabla `areas_juridicas`
- [ ] Conectar `public-header.tsx` a DB (`GET /api/admin/menus?nombre=principal`)
- [ ] Conectar `public-footer.tsx` a DB (`GET /api/admin/menus?nombre=footer`)
- [ ] Admin page para editar secciones de home (stats, ticker, CTA)
- [ ] Editor completo de áreas jurídicas (subservicios, FAQs, SEO)

**Fase 3 — Páginas y legal** 🟡 Pendiente
- [ ] Admin page para páginas dinámicas (`paginas_cms`)
- [ ] Migrar cuerpo de páginas legales a DB
- [ ] Editor de contenido con bloques (hero, texto, cards, galería, CTA, FAQs)
- [ ] Preview en tiempo real de páginas

**Fase 4 — Equipo y testimonios** 🟢 Pendiente
- [ ] Tabla + API + admin page para equipo profesional
- [ ] Tabla + API + admin page para testimonios
- [ ] Frontend dinámico para despacho y home

**Fase 5 — Categorías en DB** 🟢 Pendiente
- [ ] Seed categorías blog/FAQ a DB
- [ ] Admin pages para gestionar categorías
- [ ] Migrar frontend a DB como fuente de verdad

**Fase 6 — Versionado y permisos** 🟢 Pendiente
- [ ] Activar tabla `versiones_contenido` (auto-save on update)
- [ ] UI de historial de cambios en cada editor
- [ ] Roles RBAC (`roles`, `permisos`, `usuarios_roles`)

### Calculadora de penas

La calculadora de penas está integrada en `/intranet/admin/calculadora` dentro del layout admin unificado. Usa el mismo motor de cálculo (`lib/rules/v1/`) y los mismos componentes paso. Los usuarios admin son redirigidos automáticamente desde `/intranet/calculadora` a la ruta admin. Los usuarios no-admin siguen accediendo a la calculadora clásica.

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
- **BlogPosting/Article**: `lib/schemas/blog.ts` → `blogPostSchema()`. Incluye headline, description, datePublished, dateModified, author (Person), publisher (LegalService reference), image, articleBody e inLanguage. Inyectado en páginas de blog individual.
- **ContactPage/ContactPoint**: schema específico en `/solicitar-consulta` con telephone, contactType, areaServed, availableLanguage, hoursAvailable.
- **Lead Magnets**: `lib/lead-magnets.ts` — 13 guías descargables. Endpoint `GET /api/descargar?area=X&email=Y`.
- **Newsletter**: `POST /api/subscribe` — tabla `newsletter_subscriptions`. Rate limit 10/15min.
- **KPIs Conversión**: dashboard SEO expone `newsletterSubscribers`, `totalConsultas`, `consultasUltimoMes`.

### IndexNow

- Clave servida vía `GET /api/indexnow-key` (usa `INDEXNOW_KEY` de `.env.local`).
- Script postbuild: `scripts/submit-indexnow.mjs` — envía URLs públicas a Bing, Yandex, Seznam.
- Solo envía URLs públicas (no intranet, no API, no borradores).
- Si `INDEXNOW_KEY` no está definida, el postbuild salta con aviso (no falla el build).
- Generar clave en: https://www.bing.com/indexnow/getstarted

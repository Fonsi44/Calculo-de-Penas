# Pineda y Asociados

Web corporativa, blog jurídico, CMS interno y herramientas privadas del despacho
Pineda y Asociados. Incluye un motor de cálculo de penas según el **Código Penal
de Honduras (Decreto 130-2017)** y reformas vigentes (119-2019, 46-2020, 93-2021,
59-2024), disponible exclusivamente para el personal del bufete.

**Sitio:** `https://www.pinedayasociadoshn.com` (Vercel)  
**Stack:** Next.js 16.2.7 + React 19.2.4 + Tailwind CSS v4 + Neon PostgreSQL + Drizzle ORM  
**Auth:** JWT + bcryptjs (cookies `__Host-token` + `__Host-profile`)  
**Testing:** Vitest (397 tests, 19 suites) + Playwright (37 tests E2E, 4 specs)  
**CI:** GitHub Actions (`lint → tsc → test → build → validate:seed → validate:dates`)

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.7 (App Router) |
| UI | React 19.2.4 + Tailwind CSS v4 |
| Fonts | Cormorant Garamond + Manrope (Google Fonts) |
| Base de datos | Neon PostgreSQL (Plan Free, PITR 7 días) |
| ORM | Drizzle ORM 0.45.2 (35 tablas) |
| Auth | JWT (jsonwebtoken 9.0.3) + bcryptjs 3.0.3 |
| Editor WYSIWYG | TipTap 3.26 |
| PDF | @react-pdf/renderer 4.5.1 |
| Analytics | GA4 (NEXT_PUBLIC_GA_ID) + Clarity (NEXT_PUBLIC_CLARITY_ID) |
| Email | Resend 6.12.4 |
| Validación | Zod 4.4.3 |
| Iconos | lucide-react 0.471 |
| Endpoint OAuth | googleapis 144.0.0 |
| Charts (admin) | recharts 3.8.1 |
| Sanitización | sanitize-html 2.17.5 |
| Velocidad | @vercel/speed-insights |

**Node:** `>=22` (local v24.16.0, CI v22 con npm 11)  
**npm:** `>=11` (lockfile generado con npm 11)

---

## Estructura del repositorio

```
app/
  (public)/           → Sitio web público
  intranet/           → Dashboard + Admin (requiere auth)
  api/                → 70+ endpoints REST
lib/
  rules/v1/           → Motor de cálculo de penas (9 archivos)
  schema.ts           → 35 tablas Drizzle ORM
  auth.ts             → JWT + bcrypt
  site.ts             → Config centralizada + JSON-LD
  blog-db.ts          → Blog: helper de lectura DB
  faq-db.ts           → FAQ: helper de lectura DB
  page-content-db.ts  → CMS: helper de páginas editables
  email.ts            → Resend (transaccional + webhook)
  webhook-verify.ts   → Verificación firma Svix
  rate-limit.ts       → Rate limiting via Neon
  sanitize.ts         → Sanitización HTML
  validation.ts       → Zod schemas
  catalogos.ts        → Agravantes/atenuantes/eximentes
  analytics.ts        → Eventos GA4 (WhatsApp, teléfono, formularios)
components/
  marketing/          → 25+ componentes de UI pública
  ui/                 → 15+ componentes reutilizables (Button, Card, etc.)
  domain/             → Calculadora (13 componentes), circunstancia-picker
  layout/             → AppShell, AppSidebar, RootShell
  admin/              → 16 componentes admin (charts, editor visual, etc.)
  blog/               → BlogCard, BlogSearch, etc.
data/
  delitos.json        → 483 delitos CP (fuente canónica, verificada 100%)
  articulos_cp.json   → 635+ artículos CP
  articulos_constitucion.json → 378 artículos
  ramas_juridicas.json → 119 registros
  areas-juridicas.ts  → 13 áreas de servicio
  blog/categories.ts  → 20 categorías blog
  faq-categories.ts   → 11 categorías FAQ
  images.ts           → Catálogo de imágenes
  landings-locales.ts → 9 landings SEO local
tests/                → 19 suites (397 tests)
e2e/                  → 4 spec files (37 tests)
scripts/
  28 scripts operativos (validadores, IndexNow, health checks, auditar, etc.)
  legacy/             → 38 one-shots de migración ya ejecutada
docs/                 → Documentación técnica (15+ archivos)
drizzle/              → Migraciones (17 migraciones) + seeds
```

---

## Inicio rápido

```bash
# Instalar
npm install

# Desarrollar
npm run dev               # http://localhost:3000

# Validar
npm run lint              # ESLint — 0 errores requerido
npm run build             # Next.js build + TypeScript check
npm test                  # Vitest — 397 tests
npm run test:e2e          # Playwright — 37 tests E2E
npm run validate:dates    # Verificar fechas del blog
npm run content:audit     # Auditoría editorial (71 pendientes hoy)

# Despliegue en Vercel (producción)
# git push → CI automático en main/master/develop
```

---

## Troubleshooting

### `npm ci` falla con error de `optionalDependencies` / `@esbuild/*`
El `package-lock.json` se generó con **npm 11**. Los runners con npm 10 rechazan
la validación estricta de optionalDependencies de esbuild.
```bash
npm install -g npm@11   # luego reintenta npm ci
```
El CI ya alinea npm 11 (`ci.yml` → step "Install npm 11").

### Tests E2E fallan (`Executable doesn't exist`)
Falta instalar el navegador de Playwright:
```bash
npm run test:e2e:install   # chromium
```

### `validate:dates` o `content:audit` fallan sin `DATABASE_URL`
Los scripts de validación del blog requieren acceso a Neon. Sin `DATABASE_URL`
real, salen limpio (exit 0) por diseño para no bloquear PRs. Para validar local:
```bash
# .env.local con DATABASE_URL=postgresql://... de Neon
npm run validate:dates
npm run content:audit
```

### Blog público muestra "Error inesperado / DATABASE_URL required"
El blog (`lib/blog-db.ts`) degrada a estado vacío/404 limpio si la DB no está
alcanzable (sin `DATABASE_URL` o fallo de conexión) — nunca error 500. Pero el
contenido real solo aparece cuando `DATABASE_URL` (Neon) está configurada en el
**entorno de ejecución** (Vercel Project Settings → Environment Variables), no
solo en build. Si el blog sale vacío en producción, verifica que la variable
esté definida en el entorno de deploy (Production/Preview) y re-deploy.

### Build falla por TypeScript tras tocar `scripts/`
Desde la Fase HQC, `scripts/` (excepto `scripts/legacy/`) está incluido en el
typecheck. Si añades un script nuevo, asegúrate de que pasa `npx tsc --noEmit`.

### `lint` exige 0 errores
ESLint está configurado en modo estricto. Cualquier error bloquea el CI. Los
warnings son permisivos. Corrige siempre los errores antes de commitear.

### Cobertura de tests
```bash
npm run test:coverage   # genera coverage/ con reporte text + lcov
```
Umbral actual (conservador, se subirá gradualmente): 35% líneas. Línea base
medida en la Fase HQC: **66% líneas, 64% branches, 56% funciones**.

---

## Contribuir

Este repositorio usa **commits atómicos** con prefijos semánticos en español.
Ver [`AGENTS.md`](./AGENTS.md) §R7 para el protocolo completo.

### Prefijos de commit
| Prefijo | Uso |
|---------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo documentación |
| `chore:` | Mantenimiento, tooling, dependencias |
| `seo:` | Cambios con impacto SEO |
| `refactor:` | Reestructuración sin cambio de comportamiento |
| `test:` | Tests o configuración de testing |
| `ci:` | CI/CD |

### Reglas mínimas
1. **Lee antes de escribir** (AGENTS.md R1): usa `Read` antes de editar.
2. **Un cambio lógico por commit** (R7): no mezcles refactor con fix.
3. **Valida tras el cambio** (R8): `npm run lint && npm run build && npm test`.
4. **No uses verbos complacientes** (R12): "hecho/listo" solo si está verificado.
5. **Clasifica estados con honestidad** (R11): `IMPLEMENTADO`/`VALIDADO`/`NO VALIDADO`/`PENDIENTE`/`RIESGO`.

### Archivos que NO debe tocar la IA sin autorización explícita
Motor de cálculo (`lib/rules/v1/`), schema DB (`lib/schema.ts`), auth (`lib/auth.ts`),
proxy (`proxy.ts`), datos de delitos (`data/delitos.json`), redirects 301 de
`next.config.ts`, web pública visual (`app/(public)/**/*.tsx`). Ver AGENTS.md §9.

---

## Módulos principales

### Web pública (`/(public)/*`)
Páginas: home, despacho, servicios-jurídicos (13 áreas), derecho-penal (hub),
hondureños-en-espana, blog, FAQ, contacto, páginas legales, landings SEO local
(abogados-en-*). Server Components por defecto; solo header, buscador y
FloatingContactRail son client components. ISR con `revalidate = 3600`.

- **Logo oficial:** `public/images/logo.png` (PNG transparente, 741×728
  ~cuadrado). Usado en header, footer y JSON-LD (Organization/LegalService).
  Proporción preservada con `width`/`height` intrínsecos + `w-auto` +
  `object-fit: contain`; sin fondo blanco, `drop-shadow` sutil para contraste
  sobre fondos oscuros. Tamaños por contexto: header `h-9`–`h-12` (equilibrado
  con la nav), footer `h-14`–`h-16`.
- **Wordmark del header:** junto al logo, lockup de marca en dos líneas —
  "Pineda y Asociados" (serif) sobre "Bufete Jurídico" (eyebrow dorado).
- **Favicon e iconos PWA:** generados desde el logo oficial vía
  `node scripts/gen-favicon.mjs` (usa `sharp`). `app/favicon.ico` (ICO
  multi-size 16/32/48), `public/icon-192.png` + `public/icon-512.png`
  (manifest, any + maskable) y `public/apple-touch-icon.png` (180×180, fondo
  navy). Reproducible: regenerar tras cambiar el logo. Ya no se usa el
  placeholder "LEX" anterior.
- **Footer — dirección enlazada:** la dirección de Contacto abre el perfil
  oficial del despacho en Google Maps (`site.googleBusiness`, pestaña nueva,
  `rel="noopener noreferrer"`).
- **Mapa:** iframe de Google Maps con fallback estático (dirección + botón
  "Ver en Google Maps") si el iframe no carga. CSP ajustado para permitir
  `frame-src https://www.google.com`.
- **Reseñas:** sección `GoogleReviews` — **server component** que obtiene las
  reseñas en servidor vía `lib/google-reviews.ts` (Google Places API New v1 con
  `GOOGLE_PLACES_API_KEY` de entorno, cache 1 h + ISR) y, si no hay clave o
  falla la llamada, usa un fallback local de 6 reseñas verificadas. Diseño sutil
  y compacto (fondo cálido, `.card-premium`, 3 reseñas en desktop, estrellas
  pequeñas), sin script de Maps ni JS de cliente. JSON-LD `AggregateRating`
  solo con datos reales de Google. Sin errores de consola ni mensajes técnicos
  al usuario.
- **Home — maquetación:** arquitectura de ~11 secciones con jerarquía clara
  (hero → beneficios → servicios → confianza/cercanía → CTA final). Eliminadas
  redundancias (REAL QUESTIONS duplicaba FAQ; CTA BLOG duplicaba el CTA de
  `BlogHighlights`; Contact Strip + Ubicación fusionados). WHY US y
  multidisciplinar fusionados en una sola sección con `divider-accent`. Áreas
  destacadas en rejilla de 4 columnas con imágenes `aspect-4/3` equilibradas.
- **Home — sección "Prefiere vernos en persona":** sección premium de dos
  columnas (datos de contacto con iconos unificados a la izquierda + mapa
  contenido en `Card` a la derecha) con CTAs claros. Sustituye al Contact Strip
  + Ubicación sueltos. No duplica WhatsApp (`FloatingContactRail` es global).
- **Iconografía unificada (AGENTS.md R16):** todos los contenedores de icono de
  la web pública siguen el canon `w-11 h-11 rounded-lg` con `border` + `bg-tint`
  e icono `size={20}`. Alineados `ContactStrip`, `BlogHighlights` y el bloque
  "Prefiere vernos en persona" de `/solicitar-consulta` (antes mezclaban
  `w-10 h-10 rounded-md`, tints dispares y borders inconsistentes).

### Blog (`/blog/**`)
- **Fuente:** DB (tabla `blog_posts`). `data/blog/posts/` está vacío (migrado).
- **Editor:** TipTap (visual) + HTML directo, doble pestaña.
- **159 posts publicados** (ninguno con fecha futura).
- **20 categorías** en `data/blog/categories.ts`. No crear categorías nuevas sin
  actualizar el archivo.
- **THIN_POST_SLUGS:** 49 posts con priority 0.3 en sitemap (mitigación activa).
  Ver `docs/plan-reescritura-blog.md` para el plan editorial.
- **71 posts con revisión trimestral vencida** (pendiente editorial humano).
- **Canonical override:** campo `canonical_url` en `blog_posts`.
- **Noindex por artículo:** campo `noindex`.
- **Generador AI:** `POST /api/admin/blog/generate` (rate limit 10/5min).
- **Normalización masiva:** `npm run blog:normalizar` (dry-run por defecto).
  Corrige CTAs duplicados, H1 en body y whitespace en todos los posts.
  Idempotente, con backup previo. No inventa contenido.
- **Peso editorial objetivo:** 800–1000 palabras reales por post. 114 posts
  están por debajo y requieren ampliación editorial humana (no relleno
  automático).

### FAQ (`/preguntas-frecuentes`)
- **Fuente:** DB (tabla `faq_entries`). `data/faq.ts` = legacy en uso
  (categorías FAQ via `faq-db.ts:6,47`).
- **11 categorías** en `data/faq-categories.ts`.
- Admin en `/intranet/admin/faq`.

### Intranet / Admin (`/intranet/**`)
- **Privada.** Exclusiva del personal del bufete.
- Login en `/intranet/login` (JWT, solo emails `@pinedayasociadoshn.com`).
- Roles: `admin` (acceso total) y `abogado` (dashboard + calculadora).
- **Módulos admin:** Blog (CRUD), FAQ, Páginas editables, Calculadora penas,
  Casos, Biblioteca CP, Catálogo delitos, Usuarios, SEO, Auditoría, Medios,
  Menús, Configuración, Perfil.
- **NUNCA** mencionar/enlazar desde web pública (única excepción: enlace
  "Acceso Intranet" en header con `rel="nofollow"`).

### Calculadora de penas (`/intranet/admin/calculadora`)
- 8 pasos (wizard), motor en `lib/rules/v1/` (9 archivos).
- 483 delitos del CP hondureño, 100% verificados.
- Uso interno exclusivo. No indexar, no enlazar desde público.

### API REST (`/api/**`)
- **70+ endpoints** en `app/api/`.
- Protegidas por proxy edge (`proxy.ts`): requiere JWT para `/api/*` salvo
  rutas públicas explícitas (`/api/health`, `/api/delitos/count`, etc.).
- Rol admin requerido para `/api/admin/*`.

---

## Variables de entorno

> Ver `.env.example` para valores por defecto y descripciones completas.

### Identidad y SEO (NEXT_PUBLIC_)
| Variable | Propósito |
|----------|-----------|
| `NEXT_PUBLIC_SITE_URL` | URL canónica |
| `NEXT_PUBLIC_SITE_NAME` | Nombre comercial |
| `NEXT_PUBLIC_NOINDEX` | `"true"` bloquea indexación global |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | Código de GSC |
| `NEXT_PUBLIC_BING_VERIFICATION` | Código de Bing WMT |

### Contacto y geo
`NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_WHATSAPP`,
`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GEO_LAT`, `NEXT_PUBLIC_GEO_LNG`

### Redes sociales (opcional)
`NEXT_PUBLIC_SOCIAL_FACEBOOK`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM`,
`NEXT_PUBLIC_SOCIAL_TIKTOK`

### Analytics
`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`

### Servidor (no NEXT_PUBLIC_)
| Variable | Propósito |
|----------|-----------|
| `DATABASE_URL` | Neon PostgreSQL |
| `JWT_SECRET` | Mínimo 32 caracteres |
| `RESEND_API_KEY` | Email transaccional |
| `RESEND_WEBHOOK_SECRET` | Firma webhook de Resend (nueva) |
| `RESEND_FROM_EMAIL` | Dirección remitente |
| `CONTACT_NOTIFICATION_EMAIL` | Destinatario de notificaciones |
| `INDEXNOW_KEY` | Clave IndexNow (coincide con `public/<key>.txt`) |
| `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` | OAuth2 Google (scripts manuales) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | GA4 + GSC Data APIs |
| `GOOGLE_ANALYTICS_PROPERTY_ID` | Property ID de GA4 |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | URL en GSC |
| `GA_MEASUREMENT_PROTOCOL_SECRET` | Eventos server-side GA4 |
| `INTRANET_RATE_LIMIT_PER_MIN` | Rate limit intranet (default 10) |

---

## SEO técnico

| Componente | Estado |
|------------|--------|
| Sitemap | `/sitemap.xml` — dinámico, excluye rutas privadas y posts canonicalizados |
| Robots.txt | `/robots.txt` — bloquea `/intranet/`, `/api/`, `/login`, 12+ IA crawlers; **permite `/_next/`** (assets de render necesarios para Googlebot) |
| llms.txt | `/llms.txt` — descripción del sitio para asistentes IA |
| JSON-LD | `LegalService+LocalBusiness`, `Organization`, `WebSite`, `BreadcrumbList`, `BlogPosting`, `FAQPage`, `Service` |
| IndexNow | Postbuild dry-run; envío real con `ENABLE_INDEXNOW_SUBMIT=true` |
| GA4 | Frontend (gtag `lazyOnload`) + Data API backend (opcional) |
| Clarity | Script `lazyOnload` (opcional) |
| Open Graph | Configurado por página (title, description, image, locale `es_HN`) |
| Twitter Cards | `summary_large_image` |
| Canonical | Autocanónico por defecto; override vía `canonical_url` en posts |
| Hreflang | No aplica (sitio monolingüe es-HN) |
| Core Web Vitals | Monitoreados via Lighthouse CI (`.github/workflows/lighthouse.yml`) |
| SEO Health Check | `npm run seo:health` (15 señales off-page) |
| SEO Local | 3 landings (Nacaome, Choluteca, San Lorenzo) + 8 posts satélite |
| Plan de indexación | `docs/indexacion-plan-decision.md` |

### SEO técnico y mantenimiento

Cómo regenerar y validar los archivos SEO tras cambios:

| Tarea | Comando / Ubicación |
|-------|---------------------|
| **Sitemap** (`/sitemap.xml`) | Se regenera en build automáticamente. Fuente: `app/sitemap.ts` (rutas estáticas) + tabla `blog_posts` (DB). Excluye rutas privadas, posts `noindex` y posts canonicalizados. |
| **Robots** (`/robots.txt`) | Fuente: `app/robots.ts`. Permite `/_next/` (CSS/JS de Next.js que Googlebot necesita para renderizar). Bloquea solo `/intranet/`, `/api/`, `/login` y 12 crawlers de IA. |
| **llms.txt** (`/llms.txt`) | Archivo estático en `public/llms.txt`. Referenciado vía `<link rel="llms-txt">` en `app/layout.tsx`. |
| **JSON-LD** | Helpers en `lib/site.ts` (LegalService, Organization, WebSite) + `lib/schemas/`. El BreadcrumbList lo emite exclusivamente el componente `<Breadcrumbs>` (una sola fuente de verdad). |
| **Validar tras cambios SEO** | `npm run lint && npm run build && npm test` (obligatorio por AGENTS.md R8). El test `tests/seo-protection.test.ts` verifica: robots no bloquea `/_next/`, sitemap sin rutas privadas, schemas válidos, sin BreadcrumbList duplicado y FAQPage sanitiza HTML. |
| **Health check off-page** | `npm run seo:health` (15 señales SEO externas). |
| **Validar fechas del blog** | `npm run validate:dates`. |

#### Convenciones SEO del código (resumen auditoría Jun 2026)
- **Titles**: usar `title: { absolute: ... }` cuando el título base + marca supere 65 caracteres (evita marca doble/triple contextual). Enrutas dinámicas anidadas (`/derecho-penal/[slug]`, `/hondurenos-en-espana/[slug]`) la marca va una sola vez.
- **Structured data**: `serviceType` en `Service` describe la categoría textual del servicio (ej. "Defensa Penal"), **nunca** `'LegalService'` (que es el `@type` del provider).
- **FAQPage**: las respuestas se pasan por `toPlainText()` (strip HTML) — Google exige texto plano en `acceptedAnswer.text`.
- **Enlaces externos a `.gob.hn`**: verificar con `curl` antes de cambiar; algunos dominios cambian (p. ej. `miambiente.gob.hn` → `serna.gob.hn`). El script `scripts/seo-health-check.mjs` cubre señales off-page.
- **nofollow interno**: el único `rel="nofollow"` del código público es el enlace del header a `/intranet/admin` (obligatorio por AGENTS.md R6). Los `rel="noopener noreferrer"` son de seguridad para `target="_blank"`, no de SEO.

---

## Seguridad

- **Autenticación:** JWT 24h, cookies `__Host-token` (HttpOnly, Secure, SameSite=Lax).
- **Proxy edge:** valida JWT antes de llegar a Next.js para `/intranet/*` y `/api/*`.
- **Rate limiting:** login (5/60s), contacto (10/15min), consulta (10/15min),
  calcular (30/min), generate (10/5min), vía tabla Neon.
- **Sanitización HTML:** `sanitize-html` elimina scripts, iframes, handlers.
- **Validación:** Zod schemas en todas las rutas de escritura.
- **Auditoría:** `auditoria_eventos` registra todas las acciones (enum 50+).
- **CSP:** Restrictivo (default-src 'self', script-src con GA4/Clarity).
- **HSTS:** `max-age=63072000; includeSubDomains; preload` en producción.
- **Webhook email:** verificación de firma Svix Ed25519 (`lib/webhook-verify.ts`).
  Sin `RESEND_WEBHOOK_SECRET` en prod → 503 seguro.
- **OAuth callback:** protegido por proxy JWT; no devuelve `refresh_token` en JSON.
- **No se commitearon** `.env`, `.env.local`, claves privadas ni secretos.

---

## Mantenimiento

### Scripts operativos (33 en `scripts/`)

**Validación de datos:**
```bash
npm run validate:dates       # Fechas del blog (ninguna futura)
npm run content:audit        # Revisión editorial vencida
npm run validar-meta-seo     # Metadatos SEO de posts
npm run blog:normalizar      # Normalización del blog (DRY-RUN por defecto)
npm run blog:normalizar:aplicar  # Aplica CTAs/H1/whitespace en DB
npm run blog:review          # Revisión editorial + SEO con IA (solo sugiere)
npm run blog:review:aplicar  # Igual, pero aplica cambios mecánicos seguros
npm run blog:seo-audit       # Auditoría SEO de contenido (enlaces, nofollow, alt, fechas, HTML)
npm run blog:fix-redirects   # Corrige enlaces internos que apuntan a redirects 301 (DRY-RUN)
npm run blog:fix-redirects:aplicar  # Igual, pero aplica en DB (requiere backup previo)
npm run blog:backup          # Backup completo de blog_posts (JSON restoreable + resumen MD)
```

> **`blog:seo-audit`** (`scripts/seo-content-audit.ts`) es la auditoría SEO de
> contenido dinámico del blog. Lee los 159 posts publicados de la DB y detecta:
> enlaces internos con `rel="nofollow"` (deben eliminarse salvo justificación
> documentada), enlaces internos que apuntan a rutas con redirect 301 declarado
> en `next.config.ts`, URLs `http://` inseguras, imágenes `<img>` sin `alt`,
> anchors pobres/no descriptivos ("aquí", "click", "ver más"), fechas no
> ISO-8601 o futuras, y HTML desbalanceado (tags abiertos/cerrados). Es de solo
> lectura: no modifica la DB. Sale con código 1 si hay hallazgos críticos (CI).

> **`blog:fix-redirects`** (`scripts/fix-internal-redirects.ts`) corrige los
> enlaces internos que apuntan a rutas con redirect 301. Para cada `<a href>`
> cuyo path coincide con un redirect declarado en `next.config.ts`, reemplaza
> el `href` por la URL canónica final. Dry-run por defecto; idempotente
> (re-ejecutar no hace nada). Requiere backup previo (<2h) para aplicar.

> **`blog:backup`** (`scripts/backup-blog.ts`) genera un dump completo de
> `blog_posts` (todas las columnas editoriales y SEO) en
> `auditoria-blog/backup-YYYY-MM-DD-HHMM.json` (restoreable) + un resumen `.md`
> legible. Es de solo lectura. **Ejecutar SIEMPRE** antes de cualquier script
> que escriba en `blog_posts` en masa (`blog:normalizar:aplicar`,
> `blog:fix-redirects:aplicar`, `blog:review:aplicar`).

> **`blog:normalizar`** es el script canónico de corrección del blog
> (`scripts/normalizar-blog.ts`). Dry-run por defecto, backup previo obligatorio
> e idempotente. Elimina CTAs/disclaimer duplicados del body (ya los añade
> `<LegalDisclaimer>`), convierte `<h1>` del body a `<h2>` (evita doble H1) y
> normaliza whitespace. **No inventa contenido**: el peso editorial (<800
> palabras) se reporta pero requiere ampliación humana. Ver CHANGELOG Release 89.

> **`blog:review`** (`scripts/blog-ai-review.ts`) es la herramienta de revisión
> editorial + SEO del blog. Opera sobre la **DB** (tabla `blog_posts`, HTML — el
> blog no vive en MD/MDX). Analiza cada post publicado: conteo de palabras reales
> (objetivo 800–1000), jerarquía H1/H2/H3, metadatos SEO, tags, alt text de
> imágenes, enlaces internos/externos, fechas futuras y disclaimer duplicado.
> Opcionalmente consulta a **DeepSeek** para sugerencias (secciones a ampliar,
> mejoras SEO) — **la IA solo sugiere, nunca escribe contenido en la DB**
> (AGENTS.md R17). Sin `DEEPSEEK_API_KEY` corre en modo solo-heurísticas.
>
> **Seguridad:** dry-run por defecto. `--aplicar` solo ejecuta las mismas
> transformaciones mecánicas idempotentes que `blog:normalizar` (H1→H2, CTAs,
> whitespace); las sugerencias IA **nunca** se aplican y requiren revisión humana.
> Los posts <800 palabras se marcan como "requiere ampliación editorial" y **no
> se rellenan** con texto genérico (R13). Backup previo siempre.
>
> ```bash
> # Variables de entorno (.env.local)
> DATABASE_URL=postgresql://...        # obligatoria (Neon)
> DEEPSEEK_API_KEY=sk-...              # opcional, habilita sugerencias IA
> DEEPSEEK_MODEL=deepseek-chat         # opcional, modelo a usar
>
> # Ejemplos
> npm run blog:review                          # dry-run con IA (todos los posts)
> npm run blog:review -- --slug mi-slug        # un solo post
> npm run blog:review -- --no-ai               # sin IA (solo heurísticas, 0 coste)
> npm run blog:review -- --limit 20            # primeros 20 (control de coste API)
> npm run blog:review:aplicar                  # aplica solo cambios mecánicos
> ```
>
> Reporte Markdown: `auditoria-blog/blog-ai-review-<ts>.md`.
>
> ⚠️ **Si una `DEEPSEEK_API_KEY` se compromete (commiteada, filtrada en chat,
> expuesta en logs), debe rotarse en el panel de DeepSeek.** El código no resuelve
> una clave comprometida (AGENTS.md §3). NUNCA hardcodear la key.

**IndexNow:**
```bash
npm run indexnow:dry        # Simular (postbuild por defecto)
npm run indexnow:incremental # Envío real de URLs nuevas (<24h)
npm run indexnow:full       # Catálogo completo (máx 500 URLs)
```

**Health checks:**
```bash
npm run seo:health          # 15 señales SEO off-page
npm run seo:health:json     # Igual, salida JSON
npm run auditar-indexacion-prioritaria  # URLs prioritarias en prod
```

**Regresión visual:**
```bash
npm run visual:baseline     # Generar baseline
npm run visual:check        # Comparar contra baseline
npm run visual:update       # Actualizar baseline
```

**DB y scripts:**
```bash
npm run db:check            # Estado de la base de datos
npm run seed:fase2          # Seed de supuestos penales (Fase 2)
```

### Blog
- **159 posts publicados.** 71 con revisión trimestral vencida (editorial
  pendiente). 49 thin/plantilla con prioridad reducida en sitemap.
- **Plan de reescritura:** `docs/plan-reescritura-blog.md`.
- **No modificar `THIN_POST_SLUGS`** en `app/sitemap.ts` hasta que los posts
  se reescriban realmente.

### Archivos legacy (en repositorio pero no operativos)
- `data/legacy/` — 35 archivos históricos (fragmentos `.txt`, backups).
- `scripts/legacy/` — 38 one-shots de migración ya ejecutada.
- `components/marketing/_unused/` — 8 componentes sin uso.

---

## Pendientes reales

### Urgentes (requieren acción humana, no código)
1. **Rotar OAuth Client Secret en GCP Console** (el código se limpió en
   Release 81 `57db930`, pero el valor antiguo sigue comprometido en git
   history y debe rotarse en GCP).
2. **Rotar la API key de Google Places** (el código se limpió — antes estaba
   hardcodeada en `google-reviews.tsx` y expuesta en el bundle del navegador;
   ahora se lee de `GOOGLE_PLACES_API_KEY` de entorno). La clave antigua sigue
   comprometida en git history y debe regenerarse/restringirse en Google Cloud
   Console (Credenciales → Places API únicamente + restricción de dominios).
3. **Configurar `RESEND_WEBHOOK_SECRET`** en Vercel (sin él, `/api/email/inbound`
   responde 503 en producción).
4. **Revisar los 71 posts** con revisión trimestral vencida.
5. **Reescribir los 49 posts thin** (ver `docs/plan-reescritura-blog.md`).

### Externos
- **Verificar dominio en Bing Webmaster Tools** (causa del 0% indexación
  histórica en Bing). Ver `docs/seo-off-page.md` §2.
- **Google Business Profile:** consistencia NAP.
- **Configurar redes sociales** (Facebook, Instagram, TikTok) via
  `NEXT_PUBLIC_SOCIAL_*` para que funcione `sameAs` en JSON-LD.

### No urgente (deuda técnica)
- Migrar `lib/blog.ts` + `data/blog/types.ts` a tipo `BlogPost` puro.
- ~~Migrar `wordpress/` (local, no tracked).~~ **Resuelto:** `wordpress/` no
  existe ni en disco ni en git. La migración del blog a DB (Drizzle) está
  completada; la referencia era obsoleta.

---

## Documentación relacionada

| Documento | Contenido |
|-----------|----------|
| `docs/auditoria-repositorio-integral.md` | Auditoría integral + estado post-implementación |
| `docs/indexacion-plan-decision.md` | Plan de indexación SEO |
| `docs/plan-reescritura-blog.md` | Plan editorial de 49 posts thin |
| `docs/seo-off-page.md` | Estrategia SEO off-page |
| `docs/pagespeed-usabilidad.md` | Métricas PageSpeed |
| `docs/blog-duplicity-report.md` | Reporte de contenido plantilla |
| `docs/content-review-schedule.md` | Revisión trimestral de contenido |
| `docs/lighthouse-baseline.md` | Línea base Lighthouse CI |
| `docs/01-arquitectura.md` — `docs/26-roadmap-implementacion.md` | Docs históricos (ver `docs/`) |
| `docs/legacy/CHANGELOG_ARCHIVE.md` | Changelog histórico completo |

---

## Tooling IA

### Protocolo obligatorio
Este repositorio tiene un protocolo obligatorio en [`AGENTS.md`](./AGENTS.md).
Léelo antes de cualquier modificación. Contiene reglas críticas sobre fuentes
de verdad, privacidad de intranet, validación obligatoria, clasificación de
estados y lo que la IA nunca debe hacer.

> **Nota:** este repositorio no documenta modelos o proveedores de IA concretos
> porque cambian dinámicamente según el entorno de ejecución. Tampoco asume
> ningún modelo específico; las reglas de `AGENTS.md` aplican
> independientemente del modelo que procese cada instrucción.

Configuraciones anteriores (`.kilo/`, `kilo.json`, `CLAUDE.md`) fueron
**eliminadas del repositorio** (Release 87). Pueden existir en disco local
pero están en `.gitignore` y no afectan al funcionamiento de los agentes. El
protocolo canónico es [`AGENTS.md`](./AGENTS.md).

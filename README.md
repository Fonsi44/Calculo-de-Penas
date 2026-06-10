# LEX HONDURAS — Motor de Cálculo de Penas

Aplicación web para el cálculo de penas según el **Código Penal de Honduras (Decreto 130-2017)** y reformas vigentes.

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
  schema.ts                → Esquema Drizzle ORM (11 tablas)
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

```bash
# Simular (sin enviar):
node scripts/submit-indexnow.mjs --dry-run

# Enviar URLs reales:
node scripts/submit-indexnow.mjs
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

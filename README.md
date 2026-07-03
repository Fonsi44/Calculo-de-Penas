# Pineda y Asociados

Web corporativa, blog jurídico y herramientas internas del despacho Pineda y
Asociados — abogados en Nacaome, Valle, Honduras. Incluye motor de cálculo de
penas según el Código Penal de Honduras (Decreto 130-2017), sistema SEO live
con datos reales de GSC/GA4/Bing, y CMS interno.

**Sitio:** `https://www.pinedayasociadoshn.com` (Vercel)
**Stack:** Next.js 16.2.7 + React 19.2.4 + Tailwind CSS v4 + Neon PostgreSQL + Drizzle ORM
**Auth:** JWT + bcryptjs (cookies `__Host-token` HttpOnly/Secure/SameSite=Lax)
**Testing:** Vitest (730 tests, 33 suites) + Playwright

---

## Inicio rápido

```bash
npm install
npm run dev               # http://localhost:3000
npm run lint              # ESLint — 0 errores requerido
npm run build             # Next.js build + TypeScript
npm test                  # Vitest — 730 tests
```

---

## Estructura

```
app/(public)/     → Web pública (home, servicios, blog, FAQ, landings)
app/intranet/     → Dashboard + Admin (requiere auth JWT)
app/api/          → 70+ endpoints REST
lib/              → Motor cálculo, DB, auth, schemas, SEO
components/       → UI pública + admin + blog
data/             → Delitos CP (483), códigos legales, categorías, landings
scripts/          → 28+ scripts operativos (validación, SEO, blog, IndexNow)
tests/            → 33 suites Vitest + 4 specs Playwright E2E
drizzle/          → Migraciones + seeds
docs/             → Documentación técnica (auditorías, SEO, guías)
```

---

## Sistema SEO Live

Acceso directo a datos reales de Google y Bing. Sin tokens en chat.

```bash
npm run seo:doctor       # diagnóstico auths (debe dar 0 ERROR)
npm run seo:collect       # recolecta todas las fuentes → reportes
npm run seo:gsc:live      # GSC: queries, CTR, posición
npm run seo:ga4:live      # GA4: usuarios, sesiones, conversiones
npm run seo:bing:live     # Bing: crawl, queries, backlinks
npm run indexnow:dry      # IndexNow dry-run (20 URLs)
```

### KPIs actuales (Fase 9, Jul 2026, 28 días)

| Fuente | Métrica | Valor |
|--------|---------|-------|
| GSC | Clics / Impresiones / CTR / Posición | 134 / 6,613 / 2.03% / 7.0 |
| GA4 | Usuarios / Sesiones / Pageviews / Conversiones | 670 / 843 / 4,801 / 9 |
| Bing | Rastreadas / 4xx / Errores / Queries | 2,387 / 161 / 206 / 44 |
| IndexNow | URLs dry-run | 20 OK |
| Sitemap | Probes | 30/30 |
| SEO Health | Checks | 15/15 |

Reportes: `docs/audits/seo-live-summary.md` (ejecutivo),
`docs/audits/seo-live-action-plan.md` (plan 7/30/90 días).
Manual: `docs/seo/live-data-access.md`.

---

## Autenticación por CLI

```bash
npm run auth:google        # login Google (GSC/GA4) — abre navegador
npm run auth:google:status # verificar estado
npm run auth:bing          # login Bing OAuth — Device Code Flow
npm run auth:bing:status   # verificar estado
```

Credenciales guardadas en `~/.config/gcloud/` y `.secrets/` (gitignored).
Nunca compartir tokens ni secretos en chats o logs.

---

## Scripts principales

| Área | Comandos |
|------|----------|
| Validación | `npm run lint && npm run build && npm test` |
| Blog | `validate:dates`, `content:audit`, `blog:normalizar`, `blog:verify-fix` |
| IndexNow | `indexnow:dry`, `indexnow:core` (envío real) |
| SEO Health | `seo:health`, `audit:indexacion` |
| SEO Live | `seo:doctor`, `seo:collect`, `seo:gsc:live`, `seo:ga4:live`, `seo:bing:live` |
| DB | `db:check`, `seed:*` |
| Visual | `visual:check`, `visual:update` |

---

## Seguridad

- `.env.local`, `.env`, `.secrets/`, `data/google/`, `data/bing/`, `data/seo/` nunca se commitean.
- NUNCA hardcodear `OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`, `JWT_SECRET`, `INDEXNOW_KEY`.
- NUNCA compartir tokens, refresh tokens ni API keys en chats, logs o documentación.
- Cookies HttpOnly/Secure/SameSite=Lax. Proxy edge protege intranet y API.
- Si un secreto aparece en git history, requiere rotación en el proveedor.

---

## SEO / GEO / Analytics

La web está optimizada para indexación (Google/Bing), búsqueda generativa
(GEO/LLMO) y SEO local. Todo se controla desde `lib/site.ts` y variables de
entorno (ver `.env.example`).

### Indexación y metadata
- **`app/robots.ts`**: robots dinámico AI-aware (permite GPTBot/ClaudeBot,
  bloquea scrapers no deseados). Referencia el sitemap.
- **`app/sitemap.ts`**: sitemap DB-driven (~220 URLs). Rutas estáticas desde
  `data/seo/canonical-paths.json`, categorías y posts desde la DB.
- **Canonical absoluto** por página + `metadataBase` global.
- **`public/llms.txt`** + generador (`scripts/generate-llms-txt.mjs`, corre en
  `postbuild`): resumen del despacho para modelos de IA.
- **RSS feed**: `/blog/feed.xml`.

### Schema.org (JSON-LD)
Inyectado vía layout público y páginas: `LegalService`/`LocalBusiness`/`Attorney`,
`Organization`, `WebSite`, `Person` (3 abogados), `WebPage`, `BreadcrumbList`,
`FAQPage`, `Service`, `BlogPosting` (con `wordCount` y `articleSection`),
`ItemList`, `AggregateRating` (solo con reseñas reales de Google).

### Variables de entorno (opcionales, ver `.env.example`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_GA_ID` | GA4 (formato G-XXXX). Si no hay GTM, se carga gtag.js directo. |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (GTM-XXXX). Si se setea, reemplaza gtag.js. |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Facebook Pixel. Solo activar con consentimiento de cookies. |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity (cargado vía snippet, no npm). |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK` / `_INSTAGRAM` / `_LINKEDIN` / `_YOUTUBE` / `_TIKTOK` / `_X` | Perfiles sociales reales. Alimentan `sameAs` en schemas y el footer. Vacío = sin perfil. |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` / `NEXT_PUBLIC_BING_VERIFICATION` | Verificación de Search Console / Bing WMT. |
| `NEXT_PUBLIC_NOINDEX` | `true` = noindex global (staging). |

### Consentimiento y privacidad
- **Google Consent Mode v2** activo por defecto: cookies denegadas hasta
  consentimiento explícito. Las mediciones sin cookies siguen funcionando.
- Cumple GDPR/ePrivacy para tráfico europeo (`/hondurenos-en-espana`).

### Dependiente de hosting / externos (no código)

| Item | Estado / Acción manual |
|------|------------------------|
| **HTTP/2** | Activo por defecto en Vercel. Si se migra de hosting, verificar. |
| **Compresión gzip/brotli** | Activa en el edge de Vercel/CDN por defecto. |
| **HSTS** | Configurado en `next.config.ts` (producción). |
| **Google Business Profile** | Verificar y enlazar perfil real en `lib/site.ts` (`googleBusiness`). |
| **Perfiles sociales reales** | Setear `NEXT_PUBLIC_SOCIAL_*` cuando existan. |
| **DMARC/SPF** | Gestionar en el proveedor de DNS (no código). |

---

## Configuración de imágenes

- **Formatos**: AVIF + WebP (`next/image` optimiza automáticamente).
- **Fuente única de paths**: `data/images.ts` (`getCorporateImage`,
  `getServiceImage`, `getFounderImage`, etc.).
- Imágenes locales en `public/images/`; OG images en `public/og/`.

---

## Pendientes actuales

### Humanos (Jul 2026)

1. Filtrar tráfico bot en GA4 (activar "Exclude known bots").
2. Revisar dashboard Bing WMT para Site Scan/Site Explorer.
3. Bing OAuth completo (`npm run auth:bing` — API Key ya cubre datos básicos).

### Técnicos

1. Optimizar meta descriptions de top 10 páginas con CTR 0% en GSC.
2. Reducir errores 4xx en Bing (161 actuales).
3. Estrategia de backlinks (0 detectados).
4. Verificar snippet de "abogado" (posición 1 en GSC, CTR 0%).

---

## Documentación

| Documento | Contenido |
|-----------|----------|
| `AGENTS.md` | Protocolo canónico para agentes IA |
| `CHANGELOG.md` | Histórico de cambios por release |
| `auditoriatotal.mc` | Línea base canónica — **solo lectura** |
| `auditoria-acciones.md` | Registro de acciones ejecutadas |
| `docs/seo/live-data-access.md` | Manual operativo SEO Live |
| `docs/audits/seo-live-summary.md` | Reporte ejecutivo SEO |
| `docs/audits/seo-live-action-plan.md` | Plan de mejora 7/30/90 días |

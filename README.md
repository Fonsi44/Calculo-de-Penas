# Pineda y Asociados

Web corporativa, blog jurídico y herramientas internas del despacho Pineda y
Asociados — abogados en Nacaome, Valle, Honduras. Incluye motor de cálculo de
penas según el Código Penal de Honduras (Decreto 130-2017), sistema SEO live
con datos reales de GSC/GA4/Bing, y CMS interno.

- **Sitio:** `https://www.pinedayasociadoshn.com` (Vercel)
- **Stack:** Next.js 16.2.7 + React 19.2.4 + Tailwind CSS v4 + Neon PostgreSQL + Drizzle ORM
- **Auth:** JWT + bcryptjs (cookies `__Host-token` HttpOnly/Secure/SameSite=Lax)
- **Testing:** Vitest (754 tests, 35 suites) + Playwright

---

## Inicio rápido

```bash
npm install
npm run dev               # http://localhost:3000
npm run lint              # ESLint — 0 errores requerido
npm run build             # Next.js build + TypeScript
npm test                  # Vitest — 754 tests
```

---

## Estructura

```
app/(public)/     → Web pública (home, servicios, blog, FAQ, landings)
app/intranet/     → Dashboard + Admin (requiere auth JWT)
app/api/          → 70+ endpoints REST
lib/              → Motor cálculo, DB, auth, schemas, SEO
components/       → UI pública + admin + blog + sistema de diseño
  ├── marketing/     → Componentes reutilizables públicos (Section, ServiceCard, HubFaq, IntroEditorial, etc.)
  ├── ui/            → Primitivas UI (Button, Card, Badge, Modal, etc.)
  ├── layout/        → Shell, sidebar, shortcuts
  └── blog/          → Componentes del blog
data/             → Delitos CP (483), códigos legales, categorías, landings
scripts/          → 28+ scripts operativos (validación, SEO, blog, IndexNow)
tests/            → 33 suites Vitest + 4 specs Playwright E2E
drizzle/          → Migraciones + seeds
docs/             → Documentación técnica (auditorías, SEO, guías)
```

### Arquitectura de información (Release 110, Jul 2026)

Cada página pública tiene una **misión canónica única**; el contenido que
antes se duplicaba ahora tiene un **dueño claro** que las demás referencian:

| Página | Misión | Dueña de |
|---|---|---|
| `/` Home | Orientar y conducir | — |
| `/despacho` | Centro institucional | Bloque Equipo, claims multidisciplinares |
| `/servicios-juridicos` | Catálogo de áreas | Matriz de orientación |
| `/derecho-penal` | Hub de especialidad | Etapas/riesgos penales |
| `/hondurenos-en-espana` | Servicio transnacional | Trámites apostilla/poder |
| `/preguntas-frecuentes` | Repositorio FAQ | FAQ global |
| `/guia-legal-abogados-honduras` | Página pilar | Cómo contratar abogado |

**Fuentes de verdad unificadas:**
- `lib/areas-unified.ts`: puente entre `data/areas-juridicas.ts` (seed canónico) y
  la tabla DB `areas_juridicas`. Prioriza DB, fallback al TS si no responde.
- `lib/faq-unified.ts`: documenta los 4 orígenes de FAQ (DB, hubs editorial,
  áreas embebidas, i18n home DEPRECADA) y expone helpers tipados.

Ver `docs/audits/transformacion-web-publica.md` para el informe completo.

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

- `.env.local`, `.env`, `.secrets/`, `data/google/`, `data/bing/` nunca se commitean. Los outputs live o generados bajo `data/seo/` no se versionan, pero las fuentes canónicas explícitas (ej. `data/seo/canonical-paths.json`) sí.
- **Guías operativas:** Para el manejo estricto de secretos y fuentes de verdad, consulta `data/README.md`. Para el uso seguro de comandos operativos y herramientas IA (`@google/genai`, `openai`), consulta `scripts/README.md`.
- NUNCA hardcodear `OAUTH_CLIENT_SECRET`, `RESEND_API_KEY`, `JWT_SECRET`, `INDEXNOW_KEY`, `DEEPSEEK_API_KEY`.
- NUNCA compartir tokens, refresh tokens ni API keys en chats, logs o documentación.
- **Datos generados:** Revisa siempre los archivos añadidos con `git status`. Nunca trackees archivos generados, caches o checkpoints temporales bajo `data/`.
- Cookies HttpOnly/Secure/SameSite=Lax. Proxy edge protege intranet y API.
- Si un secreto aparece en git history, requiere rotación en el proveedor.

---

## Chat asistente (DeepSeek)

Chat conversacional en la web pública orientado a conversión y orientación
inicial. Se monta solo en `app/(public)/layout.tsx` (con salvaguarda adicional
que impide renderizar en rutas privadas). La `DEEPSEEK_API_KEY` nunca sale del
servidor: el widget solo llama a la ruta relativa `/api/chat`.

**Arquitectura:** widget → `POST /api/chat` → rate-limit (IP + sessionId) →
Zod → guardrails server-side → system prompt + base de conocimiento →
DeepSeek → respuesta filtrada → frontend.

### Variables de entorno (`.env.local`)

| Variable | Default | Descripción |
|---|---|---|
| `CHAT_ENABLED` | `true` | `false` desactiva el widget globalmente sin tocar código |
| `DEEPSEEK_API_KEY` | — | API key (solo servidor; **nunca** en cliente/logs) |
| `DEEPSEEK_MODEL` | `deepseek-v4-flash` | Requerimiento del proyecto. Los IDs oficiales de la API pueden variar; si el proveedor devuelve error de modelo, basta cambiar esta variable (p. ej. `deepseek-chat`) sin tocar código |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` | Base URL de la API |
| `CHAT_TEMPERATURE` | `0.3` | Baja = sobria y consistente |
| `CHAT_MAX_TOKENS` | `400` | Límite de tokens en la respuesta del modelo |
| `CHAT_TIMEOUT_MS` | `20000` | Timeout de la llamada al proveedor |
| `CHAT_MAX_MESSAGE_LENGTH` | `600` | Longitud máxima del mensaje del usuario |
| `CHAT_RATE_LIMIT_PER_IP` | `12` | Máx mensajes por ventana por IP |
| `CHAT_RATE_LIMIT_PER_SESSION` | `12` | Máx mensajes por ventana por sessionId |
| `CHAT_RATE_WINDOW_MS` | `600000` | Ventana de rate-limit (10 min) |

WhatsApp/teléfono se leen de `lib/site.ts` (`NEXT_PUBLIC_CONTACT_*`), no de aquí.

### Privacidad y límites
- **No** se persisten conversaciones. El widget envía solo los últimos turnos
  por mensaje; el `sessionId` vive en `localStorage` del navegador.
- **No** se loguea contenido sensible completo.
- Disclaimer visible en el widget: "Este chat ofrece orientación inicial y no
  sustituye una consulta jurídica."
- Guardrails server-side bloquean: prompt injection, temas privados/intranet y
  solicitudes de asesoramiento jurídico definitivo (cálculo de penas,
  estrategia, escritos) — estas derivan directamente a WhatsApp/teléfono.
- El asistente solo puede enlazar a páginas de la allowlist pública
  (`lib/chat/knowledge-base.ts`); nunca a rutas privadas, API o técnicas.

### Fallback sin IA
Si falta `DEEPSEEK_API_KEY`, el modelo falla o se agota el rate-limit, el widget
sigue ofreciendo WhatsApp, llamada, contacto y servicios (respuesta `source:
`fallback_*`). El chat nunca queda "muerto".

### Mantenimiento de la base de conocimiento
La KB se deriva automáticamente de `data/areas-juridicas.ts` y `lib/site.ts`.
Para añadir/cambiar servicios o datos de contacto, editar esas fuentes canónicas
(fuentes de verdad del proyecto, ver AGENTS.md §2). No editar la KB a mano.

### Tests
`tests/api-chat.test.ts` (endpoint) + `tests/chat-guardrails.test.ts` (lógica
pura + allowlist + system prompt). 24 tests cubren los escenarios de seguridad.

---

## SEO / GEO / Analytics

La web está optimizada para indexación (Google/Bing), búsqueda generativa
(GEO/LLMO) y SEO local. Todo se controla desde `lib/site.ts` y variables de
entorno (ver `.env.example`).

### Indexación y metadata
- **`app/robots.ts`**: robots dinámico AI-aware (permite GPTBot/ClaudeBot,
  bloquea scrapers no deseados). Referencia el sitemap.
- **`app/sitemap.ts`**: sitemap DB-driven (~213 URLs). Rutas estáticas desde
  `data/seo/canonical-paths.json` (53 rutas), categorías y posts desde la DB.
- **Canonical absoluto** por página + `metadataBase` global.
- **`public/llms.txt`** + generador (`scripts/generate-llms-txt.mjs`, corre en
  `postbuild`): resumen del despacho para modelos de IA, con bloque declarativo
  factual (identidad, especialidad penal, zona sur, contacto).
- **SEO local**: 16 landings de ciudad en `data/landings-locales.ts`
  (Nacaome, Choluteca, San Lorenzo, Goascorán, San Marcos de Colón, El Triunfo,
  Marcovia, Pespire, Namasigüe, Orocuina, Langue, Amapala, Caridad, Alianza,
  Concepción de María, San Antonio de Flores) + 5 landings comerciales por
  especialidad (`/abogado-penalista-nacaome`, `/abogado-penalista-choluteca`,
  `/abogado-de-familia-nacaome`, `/abogado-laboralista-nacaome`,
  `/abogado-civil-nacaome`).
- **Página pilar**: `/guia-legal-abogados-honduras` (~2000 palabras) con
  JSON-LD `Article` + `FAQPage`. Recurso nacional para intención informacional.
- **RSS feed**: `/blog/feed.xml`.

### Schema.org (JSON-LD)
Inyectado vía layout público y páginas: `LegalService`/`LocalBusiness`/`Attorney`,
`Organization`, `WebSite`, `Person` (3 abogados), `WebPage`, `BreadcrumbList`,
`FAQPage`, `Service`, `BlogPosting` (con `wordCount` y `articleSection`),
`Article` (página pilar), `ItemList`, `AggregateRating` (solo con reseñas reales
de Google). **`@graph` central** en el layout público unifica las entidades.

### Helper de metadata
- **`lib/seo.ts`** (`buildMetadata`): fuente única para title/description/OG/
  Twitter/robots/canonical en páginas públicas. Robots por defecto con
  `max-image-preview:large, max-snippet:-1`.

### Validadores y scripts SEO
- **`scripts/validate-jsonld.mjs`**: valida que el JSON-LD prerenderizado tenga
  `@type` en cada nodo y sin `@id` duplicados.
- **`scripts/optimize-images.mjs`**: convierte JPG/PNG a WebP+AVIF y recomprime
  WebP >400 KB (`--recompress-webp`). Reporte en `docs/audits/`.
- **`scripts/generate-llms-txt.mjs`**: genera `public/llms.txt` con secciones
  Abogados, Datos del despacho y Contenido recomendado para IA.

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

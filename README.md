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
npm run seo:ahrefs        # valida CSV de ahrefs/: 4XX, 3XX, noindex, intranet/admin
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
| SEO Ahrefs | `seo:ahrefs` (valida CSV de `ahrefs/`: 4XX, 3XX, noindex, `/intranet/admin`) |
| SEO Live | `seo:doctor`, `seo:collect`, `seo:gsc:live`, `seo:ga4:live`, `seo:bing:live` |
| DB | `db:check`, `seed:*` |
| Visual | `visual:check`, `visual:update` |
| Assets/Deploy | `verify:chunks` (valida chunks referenciados vs `.next/static/chunks/`) |

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

## CI/CD (GitHub Actions)

El proyecto cuenta con un pipeline unificado de Integración Continua (CI) en `.github/workflows/ci.yml`.

- **Entorno:** `ubuntu-latest` (Linux)
- **Node.js:** Versión 22 (LTS)
- **Gestor de paquetes:** `npm` (versión 11, forzada explícitamente en el pipeline).
- **Activación:** `push` y `pull_request` hacia ramas principales (`main`, `master`, `develop`).

El CI utiliza ejecución **condicionada e inteligente**: detecta si los comandos existen en el `package.json` antes de ejecutarlos para evitar fallos por mala configuración. Utiliza placeholders seguros para las variables de compilación (`DATABASE_URL`, `JWT_SECRET`, etc.).

### Ejecución Local

Para reproducir la validación del CI en tu máquina, ejecuta esta secuencia exacta. Nota que `test` y `seo:doctor` solo se ejecutarán si el script existe.

```bash
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
npm run seo:doctor
```

---

## Consistencia de deploy y assets Next.js

Cada `next build` genera un `.next/BUILD_ID` nuevo y chunks `/_next/static/*`
con hash distinto. Un deploy inconsistente (HTML de un build + assets de otro,
o assets no desplegados) produce 404 en chunks JS referenciados desde el HTML,
rompiendo la página ("page has broken JavaScript" en auditorías SEO). Para
evitarlo, el `postbuild` ejecuta dos salvaguardas:

1. **`scripts/bump-sw-cache.mjs`** — inyecta el `BUILD_ID` de Next.js en la
   versión de caché del service worker (`public/sw.js`). Cada deploy activa
   `install → skipWaiting → activate` y **purga la caché del SW de builds
   anteriores**, evitando que siga sirviendo chunks obsoletos. El repo
   mantiene el placeholder `__BUILD_ID__`; el valor real solo vive en el
   artefacto de build desplegado.
2. **`scripts/verify-chunks.mjs`** — verifica que todos los chunks
   referenciados en `build-manifest.json` y `app-build-manifest.json` existan
   físicamente en `.next/static/chunks/`. Falla el build si hay chunks 404.

Validación manual de chunks contra el dominio en producción:

```bash
# Validar consistencia local tras el build
npm run verify:chunks

# Validar que ningún chunk referenciado en producción devuelva 404
curl -s https://www.pinedayasociadoshn.com/ | tr '"' '\n' \
  | grep -o '_next/static/chunks/[a-zA-Z0-9_.-]*\.js' | sort -u \
  | while read c; do code=$(curl -s -o /dev/null -w '%{http_code}' \
      "https://www.pinedayasociadoshn.com/$c"); echo "$code $c"; done
```

El service worker (`public/sw.js`) además **purga entradas cacheadas** cuya
revalidación devuelve 404, limpiando proactivamente chunks huérfanos aunque el
`activate` no se dispare entre deploys.

---

## Chat asistente (motor de reglas local, sin LLM externo)

Chat de preconsulta en la web pública orientado a orientación inicial y
conversión. Funciona exclusivamente con un **motor de reglas local**: los
mensajes del usuario NO se envían a ningún proveedor de IA externo (DeepSeek,
OpenAI, etc.) y **no se requiere ninguna API key de IA**.

Se monta solo en `app/(public)/layout.tsx` (con salvaguarda adicional que
impide renderizar en rutas privadas). El widget solo llama a la ruta relativa
`/api/chat`.

**Arquitectura:** widget → `POST /api/chat` → rate-limit (IP + sessionId) →
Zod → guardrails server-side → **motor de reglas local** → respuesta filtrada
→ frontend. Sin llamadas a terceros.

### Variables de entorno (`.env.local`)

| Variable | Default | Descripción |
|---|---|---|
| `CHAT_ENABLED` | `true` | `false` desactiva el widget globalmente sin tocar código |
| `CHAT_MAX_MESSAGE_LENGTH` | `600` | Longitud máxima del mensaje del usuario |
| `CHAT_RATE_LIMIT_PER_IP` | `12` | Máx mensajes por ventana por IP |
| `CHAT_RATE_LIMIT_PER_SESSION` | `12` | Máx mensajes por ventana por sessionId |
| `CHAT_RATE_WINDOW_MS` | `600000` | Ventana de rate-limit (10 min) |

WhatsApp/teléfono se leen de `lib/site.ts` (`NEXT_PUBLIC_CONTACT_*`), no de aquí.

**Nota:** Las variables `DEEPSEEK_*` que aparecen en `.env.example` pertenecen
al subsistema **RAG/embeddings** y a **scripts internos de blog**, NO al chat
público. El chat público no las usa ni las requiere.

### Privacidad y límites
- **No** se persisten conversaciones en el servidor. El widget envía solo los
  últimos turnos por mensaje; el `sessionId` vive en `localStorage` del navegador.
- **No** se loguea contenido sensible completo.
- **No** se envían mensajes a ningún proveedor externo de IA. Todo el
  procesamiento es local (reglas y plantillas en el servidor del sitio).
- Disclaimer visible en el widget: "Asistente automatizado. Orientación
  inicial, no asesoría jurídica."
- Guardrails server-side bloquean: prompt injection, temas privados/intranet y
  solicitudes de asesoramiento jurídico definitivo (cálculo de penas,
  estrategia, escritos) — estas derivan directamente a WhatsApp/teléfono.
- El asistente solo puede enlazar a páginas de la allowlist pública
  (`lib/chat/knowledge-base.ts`); nunca a rutas privadas, API o técnicas.

### Funcionalidades del motor de reglas
- Clasificador de área legal probable (12 áreas, heurística por keywords).
- Detector de urgencia (15 patrones server-side + banner visual + CTAs resaltados).
- Respuestas por intención: saludo, servicios, ubicación, horario, contacto,
  preparar consulta, caso urgente, identificar área, checklist, WhatsApp,
  formulario, privacidad, migrantes, no_entendido.
- Generador de mensaje WhatsApp (plantilla prudente con marcadores).
- Checklists documentales orientativos (11 áreas).
- Derivación segura a contacto humano cuando no entiende.

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

### Verificación E-E-A-T / YMYL
Para cumplir con los estándares de calidad de Google (E-E-A-T) y levantar bloqueos en sitios legales (YMYL), es **imprescindible** completar la huella digital externa de los abogados. Esto se logra rellenando las variables de entorno correspondientes en `.env.local`:
- **Colegiación oficial**: `NEXT_PUBLIC_CAH_DANILO`, `NEXT_PUBLIC_CAH_THANIA`, `NEXT_PUBLIC_CAH_EMIL` (Ej: 12345). Habilita el badge visual y la propiedad `hasCredential` en JSON-LD.
- **LinkedIn profesional**: `NEXT_PUBLIC_LINKEDIN_DANILO` (etc.). Valida la experiencia (LinkedIn se añade al `sameAs` de JSON-LD).
- **Directorios jurídicos**: `NEXT_PUBLIC_DIRECTORIO_DANILO` (etc.). Enlaces a perfiles en directorios legales oficiales o verificados.
- **Redes del bufete**: Rellenar `NEXT_PUBLIC_SOCIAL_*` para validar la entidad corporativa (`Organization`).

> **Importante**: No inventar credenciales ni colocar URLs falsas, ya que esto penaliza severamente el E-E-A-T.

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

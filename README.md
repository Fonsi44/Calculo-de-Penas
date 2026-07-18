# Pineda y Asociados

Web corporativa, blog jurídico y herramientas internas del despacho Pineda y
Asociados — abogados en Nacaome, Valle, Honduras. Incluye motor de cálculo de
penas según el Código Penal de Honduras (Decreto 130-2017), intranet de
gestión integral de expedientes (SGIE) y sistema de analítica y SEO.

- **Sitio:** `https://www.pinedayasociadoshn.com` (Vercel)
- **Documentación para agentes IA:** [`AGENTS.md`](AGENTS.md)
- **Histórico de cambios:** [`CHANGELOG.md`](CHANGELOG.md)

---

## Stack (verificado en `package.json`)

- **Framework:** Next.js 16.2.10 (App Router) + React 19.2.7
- **Estilos:** Tailwind CSS v4
- **Base de datos:** Neon PostgreSQL + Drizzle ORM
- **Auth:** JWT con propósito explícito + bcryptjs + 2FA TOTP
- **Testing:** Vitest + Playwright (E2E)
- **Node:** ≥ 22 · **npm:** ≥ 11

---

## Requisitos e instalación

```bash
git clone <repo> && cd "Justicia Verdadera"
npm install                 # instala dependencias
cp .env.example .env.local  # configura variables (ver abajo)
npm run dev                 # http://localhost:3000
```

Requiere una base de datos Neon accesible (`DATABASE_URL`) para intranet,
calculadora y blog en DB. Sin DB, la web pública y los tests unitarios siguen
funcionando en modo degradado.

---

## Variables de entorno

La referencia canónica y actualizada es [`.env.example`](.env.example). No se
listan secretos aquí. Categorías principales:

| Categoría | Variables clave | Notas |
|-----------|-----------------|-------|
| Identidad / contacto | `NEXT_PUBLIC_SITE_*`, `NEXT_PUBLIC_CONTACT_*` | Públicas |
| Indexación | `NEXT_PUBLIC_NOINDEX`, `NEXT_PUBLIC_*_VERIFICATION` | `true` = noindex global (staging) |
| Google APIs (servidor) | `GOOGLE_SERVICE_ACCOUNT_*`, `GOOGLE_ANALYTICS_PROPERTY_ID` | Para SEO Live (GSC/GA4) |
| Analítica (cliente) | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_CLARITY_ID` | GA4 directo y GTM son **mutuamente excluyentes** |
| DB | `DATABASE_URL` | Neon PostgreSQL |
| Auth / seguridad | `JWT_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_KEY_PREVIOUS` | `ENCRYPTION_KEY` obligatoria en prod; no reutilizar como `JWT_SECRET` |
| Email | `RESEND_API_KEY`, `RESEND_*`, `CONTACT_*`, `INBOUND_*` | Resend |
| IndexNow | `INDEXNOW_KEY` | Notificación a Bing/Yandex |
| Captcha | `TURNSTILE_*`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile |
| Chat público | `CHAT_ENABLED`, `CHAT_RATE_*` | Motor de reglas local; **sin API key de IA** |
| RAG / embeddings | `EMBEDDINGS_*`, `RAG_TOP_K`, `RAG_MIN_SCORE` | **Independiente del chat público** |
| SGIE / IA documental | `IA_DOCUMENTAL_*`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` | Intranet |
| Invitaciones SGIE | `INVITATION_TTL_HOURS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Alta por enlace; sin Resend se guarda como no enviada |

> **Aclaración sobre DeepSeek:** las variables `DEEPSEEK_*` y `IA_DOCUMENTAL_*`
> pertenecen a RAG/embeddings y a scripts internos de blog/SGIE. El **chat
> público no las usa ni las requiere** (funciona con motor de reglas local).

---

## Comandos esenciales

| Tarea | Comando |
|-------|---------|
| Desarrollo | `npm run dev` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) |
| Tests unitarios | `npm run test` (Vitest) |
| Tests E2E | `npm run test:e2e` (Playwright) |
| Build producción | `npm run build` |
| Validación de chunks | `npm run verify:chunks` |

Grupos habituales (lista completa en `package.json`):

- **Blog:** `validate:dates`, `content:audit`, `blog:normalizar` (dry-run → `:aplicar`),
  `blog:verify-fix`, `blog:fix-redirects`, `blog:fix-titles`, `blog:fix-metas`.
- **SEO estático:** `seo:ahrefs`, `seo:health`, `audit:indexacion`,
  `indexnow:dry`.
- **SEO Live:** `seo:doctor`, `seo:collect`, `seo:gsc:live`, `seo:ga4:live`,
  `seo:bing:live` (requieren credenciales; ver [`docs/seo/live-data-access.md`](docs/seo/live-data-access.md)).
- **Auth CLI:** `auth:google`, `auth:google:status`, `auth:bing`, `auth:bing:status`.
- **DB:** `db:check`, `seed:*`.
- **RAG:** `rag:indexar` (dry-run → `:aplicar`), `rag:extraer-pdfs`.
- **Imágenes:** `images:optimize`, `images:recompress`.

---

## Estructura

```
app/(public)/     Web pública (home, servicios, blog, FAQ, landings)
app/intranet/     Dashboard + Admin (requiere auth JWT)
app/api/          Endpoints REST (auth, contacto, chat, SGIE, etc.)
lib/              Motor de cálculo, DB, auth, schemas, SEO, RAG, chat
components/       UI pública + admin + blog + sistema de diseño
data/             Fuentes canónicas (delitos CP, códigos legales, categorías, landings)
scripts/          Scripts operativos (validación, SEO, blog, IndexNow, RAG)
tests/            Suite Vitest + specs Playwright E2E
drizzle/          Migraciones + seeds
docs/             Documentación técnica (audits, seo, security, ops, analytics)
public/           Estáticos (imágenes, OG, sw.js, llms.txt, manifest)
```

---

## Arquitectura de alto nivel

### Web pública
App Router con rutas agrupadas: `(public)` para el sitio visible, `intranet/`
para el panel privado. Cada página pública sigue una arquitectura narrativa
canónica (Breadcrumbs → PageHero → TrustBar → contenido → CTA → FAQ cuando
aporta valor). SEO centralizado en `lib/seo.ts` (`buildMetadata`) y
`lib/site.ts`.

### Administración e identidad SGIE

El Admin es operativo y no edita contenido de la web pública. El alta de
personal se realiza exclusivamente mediante invitación: el administrador
define rol/acceso, Resend entrega un enlace de un solo uso y cada usuario
establece su propia contraseña. Cuenta activa, suspensión, acceso SGIE,
capacidades, asignaciones y sesiones son estados separados.

La autorización central vive en `lib/access-service.ts`; la arquitectura,
migración y pasos manuales están en
[`docs/architecture/fase-1-nucleo-admin-identidad-calendario.md`](docs/architecture/fase-1-nucleo-admin-identidad-calendario.md).

### Chat asistente (motor de reglas local, sin LLM externo)
Widget de preconsulta montado solo en `app/(public)/layout.tsx`. Flujo:
widget → `POST /api/chat` → rate-limit (IP + sessionId) → Zod → guardrails
server-side → **motor de reglas local** → respuesta filtrada. **Los mensajes
del usuario no se transmiten a ningún proveedor externo de IA** y no se
requiere ninguna API key de IA. Las variables `DEEPSEEK_*` pertenecen a
RAG/embeddings y scripts internos, **no al chat**.

### Motor de cálculo de penas
Implementación del Código Penal de Honduras (Decreto 130-2017) en
`lib/rules/v1/`. Componente sensible (ver `AGENTS.md` §7).

### RAG / Búsqueda semántica
Índice vectorial en DB `embeddings` (pgvector) vía `lib/rag/`. **Independiente
del chat público.** Dry-run por defecto. La tabla `embeddings` es un índice de
búsqueda, no fuente primaria de contenido.

### SGIE (intranet)
Sistema de Gestión Integral de Expedientes. Privado (auth + proxy). Documentación
bajo `docs/architecture/`:

- **Fase 1:** Núcleo Admin, identidad, RBAC y calendario.
  [`docs/architecture/fase-1-nucleo-admin-identidad-calendario.md`](docs/architecture/fase-1-nucleo-admin-identidad-calendario.md)
- **Fase 2:** Núcleo durable de procedimientos, documentos, comunicaciones, OCR e IA.
  [`docs/architecture/fase-2-nucleo-durable-documentos-comunicaciones.md`](docs/architecture/fase-2-nucleo-durable-documentos-comunicaciones.md)

---

## Validación

La validación es proporcional al tipo de cambio (ver matriz completa en
[`AGENTS.md` §4](AGENTS.md)). Para cambios transversales, seguridad, auth, DB o
configuración:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
```

Reproducción local del CI (`.github/workflows/ci.yml`):

```bash
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
npm run seo:doctor   # solo si el script existe
```

---

## Seguridad

Los controles se describen según su estado real (diseño verificado / control
existente / pendiente), no como afirmaciones absolutas:

- **Auth (control existente):** JWT con propósito explícito + bcrypt + 2FA TOTP
  (challenge TTL 5 min, `jti` aleatorio, consumo atómico). Cookies
  `__Host-token` HttpOnly/Secure/SameSite=Lax. Versión de sesión que invalida
  tokens al rotar contraseña.
- **Acceso (control existente):** `proxy.ts` protege `/intranet/*` y `/api/*`;
  rol admin para `/api/admin/*`. Rutas privadas no expuestas en el header público.
- **Rate limiting (control existente):** login, contacto, calcular, chat.
- **Validación/sanitización (controles existentes):** Zod en rutas
  POST/PATCH/PUT; `sanitize-html` en HTML de entrada; validación de ficheros
  por magic bytes. **No asumen cobertura total del sistema sin verificación.**
- **Turnstile (control opcional):** captcha en formularios públicos con bypass
  seguro si faltan variables (rate-limit como red de seguridad).
- **2FA identidad Fase 1 (PENDIENTE de despliegue):** migración
  `0030_security_sessions_2fa.sql` y `ENCRYPTION_KEY` en producción. Ver
  [`docs/security/runbook-rotacion-credenciales-fase1.md`](docs/security/runbook-rotacion-credenciales-fase1.md)
  y [`CHANGELOG.md`](CHANGELOG.md) [105].

### Cumplimiento y privacidad

**Consent Mode v2** activo: almacenamiento denegado hasta consentimiento
explícito; GA4 y Clarity no se descargan antes de aceptar analítica; Facebook
Pixel permanece deshabilitado sin consentimiento publicitario. Banner accesible
con elección granular y persistencia versionada.

> **Importante:** estos son **controles técnicos orientados al cumplimiento** de
> normativas de privacidad. **No constituyen una afirmación de cumplimiento
> absoluto** (GDPR/ePrivacy/ordenamiento hondureño). La confirmación de
> cumplimiento legal requiere **revisión jurídica humana**.

**Manejo de secretos:** `.env.local`, `.env`, `.secrets/`, `data/google/`,
`data/bing/` nunca se commitean. Outputs live o generados bajo `data/seo/` no
se versionan (las fuentes canónicas como `canonical-paths.json` sí). Si un
secreto aparece en git history, requiere rotación en el proveedor. Guías en
[`data/README.md`](data/README.md) y [`scripts/README.md`](scripts/README.md).

---

## Documentación

| Documento | Contenido |
|-----------|----------|
| [`AGENTS.md`](AGENTS.md) | Protocolo canónico para agentes IA (modos, reglas, validación) |
| [`CHANGELOG.md`](CHANGELOG.md) | Cambios recientes (Keep a Changelog) |
| [`docs/changelog/archive-2026-H1.md`](docs/changelog/archive-2026-H1.md) | Histórico completo (Releases 1–110) |
| [`docs/seo/live-data-access.md`](docs/seo/live-data-access.md) | Manual operativo SEO Live |
| [`docs/audits/seo-live-summary.md`](docs/audits/seo-live-summary.md) | Reporte ejecutivo SEO |
| [`docs/audits/seo-live-action-plan.md`](docs/audits/seo-live-action-plan.md) | Plan de mejora SEO |
| [`docs/audits/transformacion-web-publica.md`](docs/audits/transformacion-web-publica.md) | Informe transformación web pública |
| [`docs/security/runbook-backup-restore.md`](docs/security/runbook-backup-restore.md) | Runbook backup/restauración |
| [`docs/ops/build-and-deploy.md`](docs/ops/build-and-deploy.md) | Build y deploy |
| [`docs/ops/environment-variables.md`](docs/ops/environment-variables.md) | Variables de entorno |
| [`docs/analytics/configuracion-y-validacion.md`](docs/analytics/configuracion-y-validacion.md) | Configuración de analítica |
| `auditoriatotal.mc` | Línea base canónica — **solo lectura** |
| `auditoria-acciones.md` | Registro de acciones ejecutadas |
| `AUDIT_REPOSITORY_REPORT.md` | Informes de saneamiento |

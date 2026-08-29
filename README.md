# Pineda y Asociados

Plataforma web jurídica integral para el despacho **Pineda y Asociados** (Nacaome,
Valle, Honduras): sitio corporativo indexable, blog especializado, calculadora de
penas según el Código Penal (Decreto 130-2017), intranet de gestión de
expedientes (SGIE), SEO/GEO y analítica con consentimiento.

- **Sitio en producción:** [pinedayasociadoshn.com](https://www.pinedayasociadoshn.com)
- **Protocolo para agentes IA:** [`AGENTS.md`](AGENTS.md)
- **Contribución:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Histórico:** [`CHANGELOG.md`](CHANGELOG.md)

---

## Qué demuestra este repositorio

| Capacidad | Implementación |
|-----------|----------------|
| Web pública SEO-first | Next.js App Router, metadata centralizada, JSON-LD, landings locales |
| Contenido jurídico verificable | Fuentes canónicas en `data/` (CP, códigos, delitos) — sin inventar normativa |
| Calculadora de penas | Motor en `lib/rules/v1/` (subsistema sensible) |
| Intranet SGIE | Auth JWT + 2FA TOTP, RBAC, expedientes, calendario, IA documental |
| Chat de preconsulta | Motor de reglas **local** — sin enviar mensajes a LLMs externos |
| RAG / búsqueda semántica | pgvector en Neon, independiente del chat público |
| Calidad continua | ESLint, TypeScript estricto, Vitest, Playwright, CI en GitHub Actions |

---

## Stack (verificado en `package.json`)

- **Framework:** Next.js 16 (App Router) + React 19
- **Estilos:** Tailwind CSS v4
- **Base de datos:** Neon PostgreSQL + Drizzle ORM
- **Auth:** JWT con propósito explícito + bcrypt + 2FA TOTP
- **Testing:** Vitest + Playwright (E2E)
- **Node:** ≥ 22 · **npm:** ≥ 10

---

## Inicio rápido

```bash
git clone <repo> && cd "Justicia Verdadera"
npm install
cp .env.example .env.local   # configurar variables (sin secretos en Git)
npm run dev                  # http://localhost:3000
```

Con `DATABASE_URL` válida: intranet, blog en DB y calculadora completos. Sin DB,
la web pública y la mayoría de tests unitarios funcionan en modo degradado.

### Validación local (reproduce CI)

```bash
npm run lint
npm run typecheck
npm run test
npm run build:ci
```

---

## Arquitectura

```mermaid
flowchart TB
  subgraph public [Web pública]
    pages[app/public]
    blog[Blog + FAQ + Landings]
    chat[Chat reglas locales]
  end
  subgraph api [API Routes]
    auth[Auth + 2FA]
    contact[Contacto + Turnstile]
    sgie[SGIE + cron]
  end
  subgraph private [Intranet]
    dash[Dashboard + Admin]
  end
  subgraph data [Datos]
    neon[(Neon PostgreSQL)]
    static[data/ códigos y CP]
  end
  pages --> api
  blog --> neon
  dash --> auth
  api --> neon
  chat --> api
  static --> pages
```

- **Web pública:** rutas en `app/(public)/` — narrativa canónica (breadcrumbs,
  hero, contenido, CTA, FAQ cuando aporta).
- **Intranet:** `app/intranet/` protegida por `proxy.ts` (JWT, rate limits).
- **Motor de cálculo:** `lib/rules/v1/` — no modificar sin autorización.
- **Chat público:** `POST /api/chat` — reglas locales, rate-limit, guardrails;
  **no usa API keys de IA**.
- **RAG:** índice `embeddings` (pgvector) vía `lib/rag/` — separado del chat.

---

## Seguridad (controles existentes)

- JWT + bcrypt + 2FA TOTP; cookies `__Host-token` HttpOnly/Secure
- `proxy.ts` protege `/intranet/*` y `/api/*`
- Rate limiting en login, contacto, calculadora y chat
- Zod en rutas mutables; `sanitize-html` en HTML de entrada
- Consent Mode v2: analítica solo tras consentimiento explícito

> Controles técnicos orientados al cumplimiento — **no constituyen afirmación de
> cumplimiento legal absoluto**. La confirmación normativa requiere revisión
> jurídica humana.

Variables de entorno: referencia canónica en [`.env.example`](.env.example).
Secretos (`.env.local`, `.secrets/`, datos live GSC/Bing) **nunca** se commitean.

---

## Estructura del repositorio

```
app/           Rutas Next.js (público, intranet, API)
components/    UI pública, blog, admin, design system
lib/           Auth, SEO, RAG, motor de cálculo, DB
data/          Fuentes legales estáticas y manifiestos SEO
tools/         Scripts de CI y DB (versionados)
tests/         Vitest + Playwright
drizzle/       Migraciones SQL
public/        Estáticos, OG, PWA, verificación Bing
```

### Nota sobre `docs/` y `scripts/`

La documentación operativa (`docs/`) y los scripts de mantenimiento (`scripts/`)
pertenecen al **entorno de desarrollo interno** del despacho y no forman parte
del clone público. El código de aplicación, tests, CI (`tools/ci/`) y este README
sí están versionados para evaluación técnica.

---

## Entorno de desarrollo avanzado

Orquestación con OpenCode, MCP y skills del equipo: ver
[`.opencode/README.md`](.opencode/README.md) y [`AGENTS.md`](AGENTS.md) §7bis.

---

## Documentación versionada

| Documento | Contenido |
|-----------|-----------|
| [`AGENTS.md`](AGENTS.md) | Protocolo canónico para agentes IA |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Flujo de contribución y validación |
| [`CHANGELOG.md`](CHANGELOG.md) | Cambios recientes (Keep a Changelog) |
| [`SECURITY.md`](SECURITY.md) | Reporte responsable de vulnerabilidades |

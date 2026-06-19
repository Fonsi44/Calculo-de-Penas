# 01 — Arquitectura

## Visión general

Pineda y Asociados es una aplicación Next.js 16 (App Router, Turbopack) que combina un sitio web jurídico público con un motor determinista de dosificación penológica basado en el Código Penal de Honduras (Decreto 130-2017 y reformas vigentes).

## Capas

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| **Presentación pública** | `app/(public)/`, `components/marketing/` | Sitio web corporativo, blog, FAQ, formularios |
| **Presentación app** | `app/calculadora/`, `app/intranet/` | Calculadora 8 pasos, dashboard, CRUD |
| **API Routes** | `app/api/` | 18+ endpoints REST con autenticación y ownership |
| **Motor** | `lib/rules/v1/` (9 archivos) | Reglas del CP, helpers matemáticos, catálogos legales |
| **Persistencia** | `lib/db.ts`, `lib/schema.ts`, `drizzle/` | Drizzle ORM sobre Neon Postgres |
| **Datos** | `data/`, `drizzle/seed.ts` | 483 delitos, 119 ramas, 378 arts. constitución |
| **Validación** | `lib/validation.ts` | Schemas Zod |
| **Tipos** | `app/types.ts` | `Delito`, `DelitoConfig`, `Step` |

## Stack

- **Next.js** 16.2.7 (App Router, Turbopack; `middleware` → `proxy` migrado)
- **React** 19.2.4
- **Tailwind CSS** v4
- **Drizzle ORM** 0.45.2 + `@neondatabase/serverless` 1.1.0
- **Autenticación:** JWT (HttpOnly cookies) + bcryptjs
- **Rate limiting:** Neon DB (tabla `rate_limits`)
- **Email:** Resend (formulario contacto público)
- **PDF:** @react-pdf/renderer 4.5.1
- **Tests:** Vitest 4.1.8 (185 tests, 13 suites) + Playwright (29 tests E2E)

## Entidades (lib/schema.ts — 11 tablas)

- `delitos` — Catálogo de tipos penales del CP (483 en JSON, unique constraint `(nombre, articulo)`)
- `ramas_juridicas` — Taxonomía legal (119 registros)
- `articulos_constitucion` — Artículos constitucionales referenciados (378 registros)
- `articulos_cp` — Artículos del Código Penal (635 registros)
- `usuarios`, `bufetes`, `casos`, `calculos`, `auditoria_eventos`, `rate_limits`, `aceptaciones_legales`

## API Routes

| Método | Ruta | Auth | Propósito |
|--------|------|------|-----------|
| POST | `/api/auth/login` | público | Login (rate-limited 5/min) |
| POST | `/api/auth/logout` | público | Cerrar sesión |
| GET | `/api/auth/me` | cookie | Info usuario actual |
| POST | `/api/auth/register` | público | Registro de usuarios |
| POST | `/api/auth/terminos` | público | Aceptación términos |
| POST | `/api/calcular` | user | Motor de cálculo en línea |
| GET/POST | `/api/calculos` | user | CRUD cálculos |
| GET/DELETE | `/api/calculos/[id]` | user+owner | Cálculo individual |
| GET/POST | `/api/casos` | user | CRUD casos |
| GET/PUT | `/api/casos/[id]` | user+owner | Caso individual |
| GET | `/api/casos/[id]/pdf` | user+owner | Export PDF |
| POST | `/api/contacto` | público | Formulario contacto (rate-limited 3/hora) |
| GET/POST | `/api/cp` | user | Biblioteca CP |
| GET/PUT | `/api/cp/[id]` | user | Artículo CP individual |
| GET/POST | `/api/delitos` | user/admin | Catálogo delitos |
| GET/PUT/DELETE | `/api/delitos/[id]` | user/admin | Delito individual |
| GET | `/api/delitos/count` | público | Total delitos |
| GET | `/api/delitos/calidad` | user | Resumen validación |
| GET | `/api/clasificaciones` | user | Clasificaciones por rama |
| GET | `/api/health` | público | Health check |
| POST | `/api/seed` | admin | Seed BD |

## Flujo de datos (calculadora)

```
[data/delitos.json] → GET /api/delitos → app/calculadora (paso 1)
                    ↓
        [configs state] (8 pasos, inmutable)
                    ↓
        POST /api/calcular → lib/rules/v1/index.ts
                    ↓
        Resultado → Paso 8 → Guardar en caso
```

## Autenticación

- JWT firmado con `JWT_SECRET` (≥32 chars, obligatorio en prod) + `JWT_SECRET_PREVIOUS` para rotación
- Cookie `token` con `HttpOnly; Path=/; SameSite=Lax; Secure` (en prod)
- Helpers: `requireAuth`, `requireAdmin`, `authFailureResponse` (`lib/auth.ts`)
- Middleware protege `/intranet/*` y `/api/*` (con excepciones públicas)
- Rate limiting por IP en login y formulario contacto (tabla `rate_limits` en Neon)

## Seguridad

- CSP configurado en `next.config.ts` (headers: 7 directivas)
- Rate limiting vía Neon DB (no in-memory, persiste entre instancias)
- Restricción de registro a dominio `@pinedayasociadoshn.com`
- Auditoría no bloqueante (`lib/audit.ts`)
- PITR 7 días en Neon Free

## Riesgos arquitectónicos

- `middleware` → `proxy.ts` (migrado)
- CSP usa `'unsafe-inline'` para scripts/styles (Next.js 16 no soporta nonces nativos). Roadmap: migrar a nonces con `CSP_NONCE` en Next.js 17.
- Rate limiting por IP es insuficiente tras proxies/CDN; requeriría cabecera `x-forwarded-for` confiable.
- Sin branch protection en GitHub (plan gratuito).
- Sin alertas automáticas de 5xx en Vercel Hobby.

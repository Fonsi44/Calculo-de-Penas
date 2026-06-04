# 01 — Arquitectura

## Visión general

LEX HONDURAS (cálculo de penas) es una aplicación Next.js (App Router, Turbopack) que asiste a abogados y estudiantes de Derecho hondureño en el cálculo de penas conforme al Código Penal (Decreto 130-2017). Implementa un motor determinista de dosificación penológica y una calculadora interactiva guiada por 8 pasos.

## Capas

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| **Presentación** | `app/`, `components/` | UI, calculadora 8 pasos, panel resultado, modales. |
| **API Routes** | `app/api/` | Endpoints REST. Auth + ownership. |
| **Motor** | `lib/calculo.ts`, `lib/utils.ts`, `lib/catalogos.ts` | Reglas del CP, helpers matemáticos, catálogos legales. |
| **Persistencia** | `lib/db.ts`, `lib/schema.ts`, `drizzle/` | Drizzle ORM sobre Neon Postgres. |
| **Datos** | `data/`, `drizzle/seed.ts` | Catálogo de delitos, CP, Constitución, ramas jurídicas. |
| **Validación** | `lib/validation.ts` | Schemas Zod. |
| **Tipos** | `app/types.ts` | `Delito`, `DelitoConfig`, `Step`. |

## Stack

- Next.js 16.2.7 (App Router, Turbopack, middleware deprecado → `proxy` en 17).
- React 19.2.4.
- Drizzle ORM 0.45.2 + `@neondatabase/serverless` 1.1.0.
- jsonwebtoken 9.0.3, bcryptjs 3.0.3.
- @react-pdf/renderer 4.5.1 (PDF server-side).
- vitest 4.1.8 (51 → 53 tests).

## Entidades (lib/schema.ts)

- `delitos` (466 entradas en JSON / 434 únicos en BD por unique constraint): catálogo de tipos penales del CP Honduras Decreto 130-2017, con penas mínima y máxima en meses.
- `ramas_juridicas` (119 registros): taxonomía legal.
- `articulos_constitucion` (128 registros).
- `articulos_cp` (635 registros, derivado).
- `casos`, `calculos`, `usuarios`, `bufetes`.

## API Routes (8 endpoints `ƒ`)

| Método | Ruta | Auth | Notas |
|--------|------|------|-------|
| POST | `/api/auth/login` | público | emite JWT |
| POST | `/api/auth/logout` | público | limpia cookie |
| GET | `/api/auth/me` | público | info usuario |
| POST | `/api/auth/register` | público | registro |
| POST | `/api/calcular` | user | motor en línea |
| GET / POST | `/api/calculos` | user | persistencia cálculos |
| GET / PUT | `/api/casos/[id]` | user + ownership | IDOR cerrado |
| GET | `/api/casos/[id]/pdf` | user + ownership | PDF |
| GET / POST | `/api/delitos` | GET user / POST admin | incluye `estado` |
| GET / PUT / DELETE | `/api/delitos/[id]` | GET user / resto admin | |
| GET | `/api/delitos/count` | público (count) | |
| GET | `/api/delitos/calidad` | user | resumen validación |
| GET / POST | `/api/cp` | GET user / POST admin | |
| POST | `/api/seed` | admin | |
| GET | `/api/clasificaciones` | user | |

## Flujo de datos (calculadora)

```
[lib/data] → /api/delitos → app/calculadora (paso 1)
            ↓
[configs state] (8 pasos, inmutable)
            ↓
POST /api/calcular → lib/calculo.calcular_pena
            ↓
Resultado → Paso 8 (panel) → Guardar en caso
```

## Autenticación

- JWT firmado con `JWT_SECRET` (≥32 chars, obligatorio en prod).
- Cookie `token` con `HttpOnly; Path=/; SameSite=Lax; Secure` (en prod).
- Helpers: `requireAuth`, `requireAdmin`, `authFailureResponse` (`lib/auth.ts`).

## Build y despliegue

- `npm run build`: Turbopack + typecheck.
- Variables requeridas: `DATABASE_URL`, `JWT_SECRET`.
- Deploy: Vercel (`vercel.json` declara framework, buildCommand).
- Advertencia actual: `middleware` deprecado en Next 17 → migrar a `proxy`.

## Riesgos arquitectónicos pendientes

- `middleware` deprecado (Next 17).
- Sin rate limiting real (pendiente Upstash/KV).
- `lib/calculo.ts` monolítico (15234 bytes) → refactor a `lib/rules/v1.ts`.
- Sin CSP ni security headers en `next.config.ts`.

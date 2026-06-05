# LEX HONDURAS — Motor de Cálculo de Penas

Aplicación web para el cálculo de penas según el **Código Penal de Honduras (Decreto 130-2017)**.

Público objetivo: profesionales del derecho que necesitan determinar penas con precisión técnica y ahorrar tiempo.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19 + Tailwind CSS v4
- **Base de datos:** Neon PostgreSQL + Drizzle ORM
- **Autenticación:** JWT (HttpOnly cookies) + bcryptjs
- **Tests unitarios:** Vitest (152 tests)
- **Tests E2E:** Playwright
- **CI/CD:** GitHub Actions + Vercel

## Estructura

```
app/
  page.tsx                   → Página principal
  calculadora/               → Calculadora de penas (12 módulos)
    page.tsx                 → Orquestación (~100 líneas)
    state.ts                 → Estado centralizado
    hooks.ts                 → useDelitosLoader, useDelitosFilter
    calculadora-header.tsx   → Header + sidebar
    paso1-delito.tsx         → Selección de delito
    paso2-variantes.tsx      → Tipo de pena (prisión/multa)
    paso3-participacion.tsx  → Autoría + ejecución + tentativa
    paso5-delitos-list.tsx   → Lista de delitos configurados
    paso6-concurso.tsx       → Tipo de concurso
    paso7-resumen.tsx        → Resumen y calcular
    paso8-resultado.tsx      → Resultado del cálculo
    save-modal.tsx           → Modal guardar en caso
  delitos/                   → Catálogo de delitos
  delito-form/               → CRUD de delitos
  api/                       → API routes (18 endpoints)
    auth/login               → POST (rate-limited 5/min)
    auth/logout              → POST
    auth/me                  → GET
    auth/register            → POST
    calcular                 → POST (rate-limited 30/min)
    calculos/                → GET, POST
    calculos/[id]            → GET, DELETE
    casos/                   → GET, POST
    casos/[id]               → GET, PUT
    casos/[id]/pdf           → GET (PDF export)
    clasificaciones          → GET
    cp/                      → GET, POST
    cp/[id]                  → GET, PUT
    delitos/                 → GET, POST
    delitos/[id]             → GET, PUT, DELETE
    delitos/calidad          → GET
    delitos/count            → GET
    health                   → GET (health check)
    seed                     → POST (admin)
lib/
  rules/v1/                  → Motor de cálculo modular (9 archivos)
    types.ts                 → Tipos del dominio
    pena-base.ts             → Art. 60 CP
    grado-autoria.ts         → Art. 61 CP
    tentativa.ts             → Art. 62 + 69 CP
    circunstancias.ts        → Art. 70 CP
    eximentes.ts             → Art. 30 CP
    concurso.ts              → Arts. 66-68 CP
    analisis.ts              → Reporte textual
    index.ts                 → Orquestación
  auth.ts                    → JWT + bcrypt + validación de secretos
  audit.ts                   → Auditoría no-bloqueante
  rate-limit.ts              → Rate limiting via Neon DB
  schema.ts                  → Esquema Drizzle ORM (10 tablas)
  validation.ts              → Zod schemas
  api-helpers.ts             → Archivos de soporte (catalogos, utils, constants)
  catalogos.ts               → Catálogos legales (CP Honduras)
  utils.ts                   → Funciones matemáticas
  constants.ts               → Límites legales
  db.ts                      → Cliente de base de datos (Proxy pattern)
components/
  ui/                        → 13 componentes reutilizables
  domain/                    → 3 componentes de dominio
  layout/                    → 5 componentes de layout
data/                        → Datos semilla (483 delitos, 119 ramas, 378 arts. const.)
drizzle/                     → Migraciones (7) + seed
tests/                       → 11 suites (152 tests)
  calculo.test.ts            → Motor de cálculo
  auth.test.ts               → Autenticación JWT
  validation.test.ts         → Zod schemas
  rate-limit.test.ts         → Rate limiting
  audit.test.ts              → Auditoría
  api/calcular.test.ts       → API calcular
  components/                → Tests de frontend
    badge.test.tsx
    button.test.tsx
    chip.test.tsx
    circunstancia-picker.test.tsx
e2e/                         → Tests E2E (2 suites)
```

## API endpoints públicos

- `GET /api/health` — Health check (DB status + uptime)
- `GET /api/delitos/count` — Total de delitos
- `GET /api/delitos/calidad` — Resumen de validación
- `GET /api/clasificaciones` — Clasificaciones por rama
- `POST /api/auth/login` — Inicio de sesión
- `POST /api/auth/register` — Registro
- `POST /api/auth/logout` — Cerrar sesión

## Motor de cálculo

El motor implementa fielmente las reglas del CP Honduras:

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
npm run dev          # Servidor de desarrollo
```

## Tests

```bash
npm test             # 152 tests unitarios (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
npm run lint         # ESLint (0 errores, 0 warnings)
```

## Build

```bash
npm run build
npm start
```

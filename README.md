# LEX HONDURAS — Motor de Cálculo de Penas

Aplicación web para el cálculo de penas según el **Código Penal de Honduras (Decreto 130-2017)**.

Público objetivo: profesionales del derecho que necesitan determinar penas con precisión técnica y ahorrar tiempo.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19 + Tailwind CSS v4
- **Base de datos:** Neon PostgreSQL + Drizzle ORM
- **Lenguaje:** TypeScript 5
- **Tests:** Vitest

## Estructura

```
app/
  page.tsx           → Página principal
  calculadora/       → Calculadora de penas (8 pasos)
  delitos/           → Catálogo de delitos
  delito-form/       → CRUD de delitos
  api/               → API routes
lib/
  calculo.ts         → Motor de cálculo (corazón del sistema)
  utils.ts           → Funciones matemáticas (fracciones, mitades)
  catalogos.ts       → Catálogos legales (agravantes, atenuantes, eximentes)
  constants.ts       → Constantes y límites legales
  schema.ts          → Esquema Drizzle ORM
  db.ts              → Cliente de base de datos
data/                → Datos semilla (delitos, ramas, artículos)
tests/               → Tests del motor de cálculo
```

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
npm run dev
```

## Tests

```bash
npm test          # Una ejecución
npm run test:watch  # Modo watch
```

## Build

```bash
npm run build
npm start
```

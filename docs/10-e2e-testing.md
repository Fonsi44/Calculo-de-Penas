# 10 — Tests E2E

## Estado actual

- Framework: Playwright
- 29 tests en 3 suites
- Se ejecutan contra servidor de desarrollo local (no en CI por limitaciones de plan)

## Suites

| Archivo | Tests | Propósito |
|---------|-------|-----------|
| `e2e/smoke.spec.ts` | 12 | Rutas públicas: home, login, atajos, calculadora, delitos, legales, CSP, dark mode |
| `e2e/auth-flow.spec.ts` | 10 | API de autenticación: registro, login, JWT, casos, logout, rate limit |
| `e2e/intranet-sidebar.spec.ts` | 7 | Sidebar navegación autenticada: calculadora, casos, CP, delitos, atajos |

## Cómo ejecutar

```bash
npm run test:e2e            # Local (inicia web server automáticamente)
npx playwright test --ui    # UI mode para depuración
```

## Roadmap

- Tests de calculadora (8 pasos)
- Tests de formulario contacto
- Tests de blog y páginas dinámicas
- Tests de motor de cálculo vía API
- Tests autenticados de intranet (dashboard, casos CRUD)

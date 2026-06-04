# E2E Testing (Playwright)

## Estado

- Framework: `@playwright/test` v1.60.0
- Browsers: Chromium instalado en `%LOCALAPPDATA%\ms-playwright\chromium-1223`
- Tests: `e2e/smoke.spec.ts` (5 tests, smoke público)
- Cobertura actual: rutas públicas (home, login, atajos, calculadora, delitos)

## Cómo ejecutar

### Local (con DB Neon activa)
```bash
npm run test:e2e:install   # solo primera vez
npm run test:e2e
```

`playwright.config.ts` levanta automáticamente `next start` en puerto 3100.
Requiere `.env` con `DATABASE_URL` válida apuntando a Neon.

### Local (contra preview de Vercel)
```bash
PLAYWRIGHT_BASE_URL=https://calculo-de-penas-nextjs.vercel.app npm run test:e2e
```

En este modo NO se arranca `webServer`; se usa la URL externa directamente.

### CI (pendiente de infraestructura)
Por ahora el workflow `CI` (`lint + typecheck + test + build`) NO incluye
el job E2E porque no tenemos DB de test aislada en CI.

Plan para activar E2E en CI:
1. Crear Neon project "lex-honduras-ci" (free tier)
2. Añadir `DATABASE_URL_CI` y `JWT_SECRET_CI` a GitHub Actions secrets
3. Aplicar migraciones antes de tests: `npx drizzle-kit push`
4. Añadir job `e2e` que dependa de `build` y descargue Chromium
5. Tests deben usar la DB de CI (que se descarta tras cada run)

## Tests añadidos (5)

| Test | Qué valida | Tiempo típico |
|------|------------|---------------|
| `home responde 200` | Página principal + sin errores de consola | 1.1s |
| `login page carga` | Form de login + alternar a register | 1.1s |
| `atajos page` | Página de atajos de teclado | 1.2s |
| `calculadora renderiza` | Carga o redirige a /login (200/302/307) | 0.9s |
| `delitos page` | Lista de delitos del CP (434 únicos tras deduplicación; 32 duplicados eliminados del JSON) | 0.6s |

Total local: ~25s (incluye `next build` + arranque + 5 tests paralelos con 4 workers)

## Roadmap E2E (no urgente)

- [ ] Auth flow completo: register → login → calcular → save caso → PDF
- [ ] CRUD delitos: create (admin) → edit → delete
- [ ] CRUD casos: create → view → generate PDF
- [ ] Concursos: real → ideal → homogéneo
- [ ] Multi-user: usuario A no ve casos de usuario B
- [ ] Rate limit: 11 requests → 11ª debe ser 429

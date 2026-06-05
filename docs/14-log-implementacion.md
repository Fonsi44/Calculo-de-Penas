# 14 — Log de implementación

Registro cronológico de cambios significativos. Ver `CHANGELOG.md` para detalle.

## 2026-06-05 — Fase 11 (restricción de dominio + fix navegación)

### Seguridad

- Auth limitada al dominio `@pinedayasociadoshn.com` con bypass para E2E (`ALLOW_TEST_EMAILS` o `NODE_ENV=test`).
- Helper `isAllowedAuthEmail()` centralizado en `lib/auth.ts`.
- 14 tests nuevos cubriendo dominio válido, externo, malicioso, mayúsculas, espacios, bypass test.

### Navegación

- `app/login/page.tsx` → redirect server-side a `/intranet/login` (3 líneas).
- `components/layout/user-actions.tsx` → logout action y link "Iniciar sesión" apuntan a `/intranet/login`.

### Limpieza

- `.gitignore`: añadidos `.opencode/`, `home-*.png`, `neon-mcp-*.log`, `.playwright-mcp/`, `opencode.jsonc`, `scripts/validate-opencode-config.cjs`.

### Hallazgo BD Neon (verificación previa)

- 16 usuarios en `usuarios`: 1 real (`alfonsroiget@gmail.com`, pre-cambio de branding) + 15 artefactos de tests E2E.
- **Implicación**: con la restricción activa, ese usuario real no podrá iniciar sesión hasta que se cree con email `@pinedayasociadoshn.com`.

### Validación

- 181/181 unit tests.
- Build OK (37/37 páginas).
- E2E: misma firma que baseline (4 fallos preexistentes por rate-limit en `auth-flow.spec.ts`).

## 2026-06-05 — Fase 8 (saneamiento integral del repositorio)

### Archivo de código no utilizado

- Creación de `/_archived_unused/` con `INDEX.md` trazable.
- 35 archivos movidos: 4 código muerto (0 imports), 8 backups, 5 artefactos históricos, 13 scripts one-shot, 5 SVG boilerplate.
- `data/` reducido de 21 a 7 archivos (solo datos activos).
- `scripts/` reducido de 23 a 10 scripts (solo mantenimiento activo).
- `public/` reducido de 7 a 2 assets (solo PWA).

### Refactorizaciones de calidad

- `lib/pdf-document.tsx`: eliminada duplicación de `formatMeses()` y `formatFechaHora()` → ahora importa de `lib/ui.ts`.
- 7 rutas API unificadas a `Response.json()`.
- `StoredConfig` en `calculos/[id]/route.ts` derivado de `DelitoConfig` con `Partial<>`.
- Documentada diferencia `meses_a_texto()` vs `formatMeses()` en ambos archivos.
- Comentario en catch vacío de `app/layout.tsx`.
- `drizzle/seed.ts`: `process.exit()` reemplazado por `return` en guarda.

### Correcciones

- Bug PWA: `manifest.json` referenciaba iconos PNG inexistentes → corregido a SVG existente.
- `middleware.ts`: regex limpiado de exclusiones huérfanas.
- `AGENTS.md`: conteo de tests corregido de "81 en 3" a "152 en 11".

### Validación pendiente

- `npm run lint && npm run build`
- `npm run test && npm run test:e2e`

## 2026-06-03 — Fase 0 (contención de riesgos)

### Seguridad

- `lib/auth.ts`: JWT_SECRET obligatorio, cookie endurecida, helpers `requireAuth/requireAdmin`.
- `middleware.ts`: lista explícita de rutas API públicas.
- `/api/casos/[id]`, `/api/calculos`, `/api/delitos/*`, `/api/cp/*`, `/api/seed`: auth + ownership/admin check.

### Arquitectura

- `lib/db.ts`: lazy init con Proxy.
- `lib/calculo.ts`: `reduccion_tentativa=2` aplicado (Art. 69.1 CP).
- 2 tests nuevos en `tests/calculo.test.ts` (53 totales).

### Calidad de datos

- `scripts/generar-estados-delitos.js` + `lib/estados-delitos.ts` + `app/api/delitos/calidad/route.ts`.
- Banner amarillo en calculadora + checkbox obligatorio para delitos no verificados.
- `data/delitos-estados.json` con 483 entradas (234 validados automáticamente, 249 pendientes de revisión manual, 0 rechazados). Refleja el catálogo saneado contra CP Decreto 130-2017 con sus 362 artículos tipificados como delito.

### Documentación

- `docs/01-arquitectura.md`, `02-motor-calculo.md`, `03-trazabilidad-normativa.md`.

## 2026-06-04 — Fase 0-6 (auditoría integral y hardening)

### Fase 0 — Emergencia secretos
- `.gitignore` verificado: `.env` ya ignorado. Añadidos logs, test-results, playwright-report.
- Nuevo `JWT_SECRET` generado (48 bytes base64url).
- Verificado: `.env` nunca commiteado en git.

### Fase 1 — Rate limit Neon + Health check
- `lib/rate-limit.ts`: migrado de Map en memoria a Neon DB (funciona en serverless sin Vercel Pro).
- `app/api/health/route.ts` (nuevo): GET /api/health.
- `drizzle/migrations/0004`: tabla rate_limits.

### Fase 2 — Auditoría CRUD + Auth normalizado
- Auditoría integrada en casos (POST/PUT) y cálculos (POST/DELETE).
- `getUser()` manual eliminado: todos los endpoints usan `requireAuth()`.
- PDF route migrado de verifyToken manual a requireAuth.
- Dependencias `ws`, `@types/ws` eliminadas.

### Fase 3 — Índices BD + API helpers
- Índices añadidos en delitos (3), casos (2), calculos (2).
- `drizzle/migrations/0005`: 7 índices nuevos.
- `lib/api-helpers.ts` (nuevo): helpers apiSuccess/apiError.

### Fase 4 — Refactor calculadora
- Calculadora: de 1 archivo (817 líneas) a 12 módulos.
- `page.tsx` reducido de 817 a 99 líneas.
- `state.ts`: hook centralizado con toda la lógica de estado.

### Fase 5 — Tests frontend + CI endurecido
- Testing Library + jsdom configurados.
- 4 suites de frontend: Badge, Button, Chip, CircunstanciaPicker (33 tests).
- Total: 152 tests (11 suites, 7 backend + 4 frontend).
- CI: lint ahora bloqueante.

### Fase 6 — Endurecimiento final
- Lint: 0 errores, 0 warnings.
- CHANGELOG.md, README.md, docs/13, docs/14 actualizados.

## 2026-06-03 — Fase 1-2 (refactor)

### Motor

- `lib/calculo.ts` (396 líneas) → `lib/rules/v1/` (9 módulos: types, pena-base, grado-autoria, tentativa, circunstancias, eximentes, concurso, analisis, index).
- API pública preservada; tests verdes (53/53).

### UI

- `app/calculadora/hooks.ts` con `useDelitosLoader` y `useDelitosFilter`.
- `setResultado` tipado con `ResultadoCalculo` (elimina `any`).
- `eslint.config.mjs`: ignora `scripts/`, `data/`, `drizzle/`, `docs/`.

### CI

- `.github/workflows/ci.yml`: lint + typecheck + test + build + validación de seeds.

### Documentación

- `docs/04-seguridad.md`, `05-despliegue.md`, `06-actualizacion-normativa.md`.

## 2026-06-03 — Fase 5 (hardening)

### Security headers

- `next.config.ts`: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS (en prod).
- `Cache-Control: no-store` en `/api/*`.

### Cookies endurecidas

- `__Host-token` en producción, `token` en dev (compatibilidad).
- Middleware actualizado para leer ambos nombres.
- `createAuthResponse` y `createLogoutResponse` emiten el nombre correcto.

### Rate limiting

- `lib/rate-limit.ts`: bucket in-memory por IP/usuario, ventana configurable.
- `/api/auth/login`: 5 req/min por IP.
- `/api/calcular`: 30 req/min por usuario autenticado.
- Headers `Retry-After`, `X-RateLimit-*` en 429.

### Auditoría

- `lib/schema.ts`: tabla `auditoria_eventos` con enum `auditoria_accion` (13 acciones).
- `lib/audit.ts`: helper `audit()` no-bloqueante.
- `app/api/auth/login/route.ts`: registra `login`, `login_failed`, `rate_limited` con IP, user-agent.
- Migración Drizzle generada: `drizzle/migrations/0003_auditoria_eventos.sql`.

### Documentación

- `docs/13-checklist-implementacion.md`: lista de verificación pre-producción.
- `docs/14-log-implementacion.md` (este archivo): registro cronológico.

## Decisiones técnicas clave

| Decisión | Razón | Alternativa descartada |
|----------|-------|------------------------|
| Refactor motor a `lib/rules/v1/` | 396 líneas monolíticas | Inline, riesgo de regresión |
| Tests siguen importando de `lib/calculo` | Back-compat | Mover tests, alto costo |
| `__Host-token` solo en prod | Compatibilidad dev | Forzar siempre, requiere HTTPS local |
| Rate limit in-memory | Sin infra Upstash hoy | Distribución real con KV |
| Auditoría no-bloqueante | No romper login si BD falla | Síncrona, riesgo de DoS |
| Banner + checkbox para no verificados | Transparencia al usuario | Bloqueo total, perdería funcionalidad |

## Métricas acumuladas

- **Tests**: 51 → 53 (+2).
- **Endpoints API con auth**: 6 → 8 (casos, calculos, delitos, cp, seed, calcular, calidad, count).
- **Rutas API públicas mínimas**: 5 (auth flow + count).
- **Migraciones Drizzle**: 3 (delitos/ramas, articulos_cp, casos/usuarios/calculos + auditoria_eventos).
- **Archivos del motor**: 1 → 9 módulos cohesivos.
- **Documentos**: 0 → 8 (arquitectura, motor, trazabilidad, seguridad, despliegue, actualización, checklist, log).
- **Security headers**: 0 → 7 (CSP, X-Content-Type-Options, X-Frame, Referrer-Policy, Permissions-Policy, HSTS, X-DNS-Prefetch-Control).
- **Tablas BD**: 8 → 9 (auditoria_eventos).
- **Acciones auditables**: 13.

## Próximos pasos

Ver `docs/06-actualizacion-normativa.md` para procedimiento de reforma legal, y `docs/13-checklist-implementacion.md` para validación pre-producción.

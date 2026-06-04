# 14 — Log de implementación

Registro cronológico de cambios significativos. Ver `CHANGELOG.md` para detalle.

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
- `data/delitos-estados.json` con 466 entradas (466 verificados, 0 pendientes, 0 rechazados al cierre del catálogo).

### Documentación

- `docs/01-arquitectura.md`, `02-motor-calculo.md`, `03-trazabilidad-normativa.md`.

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

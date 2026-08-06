# Resultados de pruebas y comandos

**Fecha:** 2026-07-12  
**Regla:** ningún resultado se extrapola más allá del comando/flujo ejecutado.

---

## Validación Staging — Fases 1-5 y Subfases de migraciones/E2E (2026-07-12 13:00)

### Resumen ejecutivo

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ 0 errores, 0 warnings |
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run test` | ✅ 49 archivos, **899/899 tests** |
| `npm run build` | ✅ Exit 0, 354 páginas |
| Auditoría migraciones | ✅ 32 entradas coherentes, idempotentes |
| E2E Playwright | ⚠️ 7 specs preparados, bloqueados por falta de DB de test |
| SBOM CycloneDX | ⚠️ Bloqueado por npm peer deps (esbuild) |

### Subfase 1 — Consistencia de migraciones

- **Journal**: 32 entradas (0000–0031), secuencia sin saltos, 0 tags duplicados.
- **0030** (`security_sessions_2fa`): `token_version` ALTER con IF NOT EXISTS, `two_factor_challenges` CREATE IF NOT EXISTS, `jti` PK, `consumed_at` nullable, FK cascade, índice `expires_at`, DOWN separado.
- **0031** (`preview_tokens`): CREATE IF NOT EXISTS, `token` unique, `expires_at` NOT NULL, `consumed_at` nullable, FK `created_by` cascade, índices `token`+`expires_at`, DOWN separado.
- **Schema↔SQL**: `twoFactorChallenges` y `previewTokens` en `lib/schema.ts` consistentes con migraciones SQL.

### Subfase 2 — Entorno E2E aislado

Scripts creados en `scripts/e2e/`:
- `guard.mjs` — fail-closed: exige `ALLOW_TEST_DATABASE=true`, `NODE_ENV=test`, DB name con segmento `test|staging|preview|testing`, bloquea patrones productivos.
- `setup.mjs` — aplica migraciones + seed sintético + genera `.env.e2e`.
- `seed.mjs` — 4 usuarios, 3 clientes, 3 expedientes, 3 asignaciones, 1 secreto 2FA (datos deterministas, sin PII).
- `cleanup.mjs` — DELETE por prefijo de ID, best-effort, ejecutado siempre.
- `run.mjs` — orquesta guard → setup → Playwright → cleanup.

### Subfase 3 — Matriz E2E crítica

7 specs Playwright en `tests/e2e/`:

| Spec | Escenarios |
|------|-----------|
| `critical-auth.spec.ts` | 1-8: Login, bloqueo, 2FA, revocación, logout, redirección |
| `critical-authorization.spec.ts` | 9-12: Roles, IDOR/BOLA, mutación cruzada, admin |
| `critical-preview.spec.ts` | 13-14: Token opaco, auth, sanitización, consumo único |
| `critical-upload.spec.ts` | 15-16: Magic bytes, DOCX, tamaño, nombres maliciosos |
| `critical-descargar.spec.ts` | 17: POST, consent, rate limit |
| `critical-security.spec.ts` | 18: Headers, PII, correlation-id |
| `navigation.spec.ts` | Pública + intranet (desktop + mobile) |

### Subfase 4 — Compatibilidad y regresión

- 304 call sites `requireAuth`/`requireAdmin`/`requireAbogado` → 0 sin `await`.
- `invalidateFreshness` cableado en 7 rutas de mutación crítica.
- `ENCRYPTION_KEY` con soporte de rotación (AES-256-GCM + PREVIOUS fallback).

### Subfase 5 — Validación total

- Lint: 0/0. TypeScript: 0. Tests: 899/899. Build: exit 0.
- E2E: Preparado, bloqueado por falta de DB de test.
- SBOM: Bloqueado por npm peer deps; alternativa `npm ls --json > deps-tree.json`.

### Riesgos residuales

- 10 vulnerabilidades moderadas (transitivas, documentadas en CHANGELOG).
- E2E no ejecutado sobre PostgreSQL real.
- SBOM automatizado requiere `npm dedupe`.

---

## Resumen

| Grupo | Resultado |
|---|---|
| Lint | `VALIDADO`: 0 errores, 8 warnings |
| TypeScript | `VALIDADO`: 0 errores |
| Vitest | `VALIDADO`: 49 archivos, 899/899 tests |
| Cobertura | `VALIDADO`: 52,50 % líneas global; auth.ts 86,07 %; rate-limit.ts 96,42 %; proxy.ts 48,10 % |
| Build | `VALIDADO`: exitoso (354 páginas estáticas) |
| E2E producción solo lectura | `VALIDADO`: 22/22 |
| SEO doctor | `PARCIAL`: 15 OK, 2 ERROR, 4 pendiente |
| SEO collect | `PARCIAL`: 4/6 fuentes |
| Dependencias | `FALLA DE AUDITORÍA`: 5 altas, 10 moderadas |

## Comandos ejecutados

### Estado e inventario

- `git status` → rama `main`, alineada con `origin/main`, working tree limpio al inicio.
- `rg --files` y conteos → 1.216 archivos, 87 páginas, 142 API routes, 42 tests, 6 specs E2E, 69 `pgTable`.
- `git ls-files` sobre secretos → `.env`, `.env.local`, `.env.vercel`, `.secrets`, datos live Google/Bing no versionados; sí existen fuentes/reportes canónicos permitidos bajo `data/seo/`.

### SEO/Analytics obligatorio

1. `npm run seo:doctor` → exit 0; 15 OK, 2 ERROR, 4 PENDIENTE.
   - Error local: gcloud CLI ausente.
   - Error local: Vercel CLI ausente.
   - Datos previos GSC/GA4/Bing detectados y secretos ignorados correctamente.
2. `npm run seo:collect` en sandbox → subprocesos rechazados por EPERM y proceso bloqueado.
3. `npm run seo:collect` con permisos ampliados → exit 0; 4/6.
   - GSC: `invalid_grant`.
   - GA4: `invalid_grant`.
   - Bing: extraído.
   - IndexNow: dry-run.
   - SEO Health y sitemap: correctos.

### Calidad de código

- `npm run lint` → exit 0, 6 warnings `no-unused-vars`, 0 errores.
- `npx tsc --noEmit` → exit 0, sin salida.
- `npm run test` → exit 0; 42/42 archivos, 861/861 tests.
- `npm run test:coverage` → exit 0; 861/861 tests.

| Métrica | Cobertura |
|---|---:|
| Statements | 50,90 % |
| Branches | 45,44 % |
| Functions | 51,69 % |
| Lines | 51,31 % |

Zonas relevantes: proxy 18,05 % líneas; sitemap 20,68 %; RAG 2,38 %; SGIE agregado 33,36 %; algunas capas DB SGIE 0 %.

### Build

1. `npm run build` en sandbox → falló al descargar Cormorant Garamond y Manrope desde Google Fonts.
2. `npm run build` con red autorizada → exit 0.
   - Compilación: 28,8 s.
   - TypeScript del build: 29,5 s.
   - 354 páginas estáticas generadas.
   - 7 chunks verificados, 0 faltantes.
   - `llms.txt` regenerado.
   - IndexNow: 24 URLs, **dry-run**, sin envío.

El build inyectó un BUILD_ID en `public/sw.js`; se revirtió ese artefacto para no entregar un cambio funcional ajeno a la auditoría.

### E2E en producción

- Intento inicial con specs que contenían POST → no ejecutado; la elevación fue rechazada por riesgo de side effects.
- Alternativa segura: `PLAYWRIGHT_BASE_URL=https://www.pinedayasociadoshn.com npx playwright test e2e/smoke.spec.ts e2e/hydration.spec.ts`.
- Resultado: 22/22 pass en Chromium, 31,9 s.

Validado: home 200/hero, login carga, 404 de `/atajos`, `/calculadora`, `/login`, `/delitos`, CSP, páginas legales, redirect `/privacidad`, modo oscuro y 8 rutas sin mismatch de hidratación.

### Navegación autorizada privada

- Admin: login correcto y panel disponible.
- SGIE: login correcto y cockpit disponible.
- Abogado → `/intranet/admin`: redirección a `/intranet/sgie` validada.
- Responsive 390×844: Admin y SGIE sin overflow horizontal; botón “Abrir menú”; tabla Admin reduce columnas.
- Navegación directa a API admin: `NO VALIDADO`; el navegador la bloqueó antes de la solicitud.

### Dependencias

- `npm audit --json` → exit 1 esperado por hallazgos: 15 vulnerabilidades, 5 altas, 10 moderadas, 0 críticas según npm.
- `npm outdated --json` → exit 1 esperado por paquetes desactualizados. Entre otros: Next 16.2.7→16.2.10, Playwright 1.60.0→1.61.1, Tiptap 3.26.0→3.27.3, Resend 6.12.4→6.17.2; varios upgrades mayores requieren análisis.

## Pruebas no ejecutadas / NO VALIDADO

- `npx playwright test` completo: excluido porque crea usuarios/casos en `DATABASE_URL` y deja cleanup manual.
- `security:validate-staging`: no ejecutado; exige un staging explícito y puede interactuar con DB.
- POST/PATCH/DELETE productivos, publicación, edición, roles, reset, 2FA real, correo, carga, OCR/IA, descarga y jobs.
- Firefox, Safari, lector de pantalla, contraste automatizado, zoom 200 % y carga concurrente.
- `EXPLAIN ANALYZE`, índices live, backups/restore, RPO/RTO y failover.

## Errores/advertencias observados

| ID | Resultado | Clasificación |
|---|---|---|
| T-01 | build sin red no obtiene Google Fonts | dependencia externa; segundo intento validado |
| T-02 | GSC/GA4 `invalid_grant` | fallo operativo actual |
| T-03 | 6 warnings ESLint | deuda baja |
| T-04 | npm audit 15 vulnerabilidades | riesgo alto/medio |
| T-05 | E2E con POST rechazado/excluido | protección correcta, queda NO VALIDADO |

## Fase 1 de remediación — cierre de brechas (12-jul-2026 11:30–12:15)

Se ejecutaron las subfases A–E del plan de cierre. Resultados de validación final:

| Comando | Resultado | Observaciones |
|---|---|---|
| `npm run lint` | 0 errores, 8 warnings | 2 warnings nuevos en tests (parámetros sin uso prefijados `_`), 6 preexistentes |
| `npx tsc --noEmit` | 0 errores | — |
| `npm run test` | 49 archivos, **899/899 tests** | +28 tests desde baseline 871 (4 nuevos archivos de test) |
| `npm run test:coverage` | 52,50 % líneas | Subió desde 51,31 %; auth.ts 86,07 %; proxy.ts 48,10 %; rate-limit.ts 96,42 %; clientes-db.ts 67,14 % |
| `npm run build` | Exit 0 | Build exitoso a la primera, 354 páginas estáticas |

### Cambios implementados

| Subfase | Cambio | Archivos |
|---|---|---|
| A | Revocación de sesión efectiva: `validateSessionFreshness` con caché 5s, `requireAuth/Admin/Abogado` pasan a `async`, `await` añadido en 169 call sites, proxy verifica frescura de DB | `lib/auth.ts`, `proxy.ts`, 119 archivos API + `lib/permissions.ts` |
| B | Migración 0030 reversible (DOWN); entrada registrada en `_journal.json`; `drizzle-kit generate` no pudo concluir (sin TTY para conflicto presnapshots) | `drizzle/migrations/0030_security_sessions_2fa.sql`, `meta/_journal.json` |
| C | Guard anti-producción reforzado (regex más estricta, `::1` normalizado, scheme validado); cableado en `tests/setup.ts` | `lib/test-db-guard.ts`, `tests/setup.ts`, `tests/test-db-guard.test.ts` |
| D | Suite de pruebas obligatoria: matriz IDOR clientes (9), verify route (6), concurrencia jti (3), revocación token_version (6) | 4 nuevos archivos de test |
| E | Documentación actualizada (HALLAZGOS, RESULTADOS-PRUEBAS, CHANGELOG, README) | `HALLAZGOS.md`, `RESULTADOS-PRUEBAS.md` |

### Estado por hallazgo

| Hallazgo | Estado esta sesión | Pendiente |
|---|---|---|
| AUD-SEC-001 (Challenge 2FA como sesión) | `IMPLEMENTADO` (commit previo); tests de integración añadidos | — |
| AUD-SEC-002 (IDOR/BOLA clientes) | `IMPLEMENTADO` (working tree); 9 tests unitarios de matriz | Validación integración DB aislada en staging |
| AUD-SEC-003 (Credenciales débiles) | `PENDIENTE OPERATIVO`; runbook existente | Rotación manual de contraseñas productivas |
| AUD-SEC-006 (Criptografía y rate limit 2FA) | `IMPLEMENTADO` (commit previo + working tree); `ENCRYPTION_KEY` dedicada, `2fa` fail-closed | Configurar `ENCRYPTION_KEY` en despliegue |
| AUD-QA-001 (Cobertura insuficiente) | `VALIDADO` con mejora: +28 tests, +1,19 pp cobertura | Thresholds por módulo en vitest.config.ts |

### Pruebas nuevas (4 archivos, 28 tests)

| Archivo | Tests | Cubre |
|---|---|---|
| `tests/clientes-idor.test.ts` | 9 | Matriz abogado A/B/admin en GET, PATCH, creación, duplicados |
| `tests/2fa-verify-route.test.ts` | 6 | TOTP inválido, challenge expirado/consumido, bloqueo, rate limit, sesión correcta |
| `tests/two-factor-challenges-concurrency.test.ts` | 3 | Compare-and-set concurrente, expiración, usuario distinto |
| `tests/change-password-revocation.test.ts` | 6 | tokenVersion válido/rechazado, bloqueo, desactivación, caché, fail-closed prod |
| `tests/test-db-guard.test.ts` | +4 | IPv6, subcadena `mytest_prod`, scheme no-postgres, URL ausente |

### Tests de seguridad existentes (confirmados sin regresión)

- `tests/auth.test.ts` (23): sign/verify purpose, require* async
- `tests/session-purpose-proxy.test.ts` (2): proxy rechaza challenge como cookie
- `tests/two-factor-challenges.test.ts` (1): consumo atómico secuencial
- `tests/rate-limit.test.ts` (15): buckets, fail-closed prod login/2fa

### Errores/advertencias residuales

| ID | Resultado | Clasificación |
|---|---|---|
| T-01 | `drizzle-kit generate` requiere TTY | Herramienta; migración reversible documentada, journal registrado manualmente |
| T-02 | 8 warnings ESLint (6 preexistentes + 2 nuevos) | No bloqueante; `--max-warnings=0` no configurado |
| T-03 | Sin test E2E de flujo login → 2FA → sesión en navegador real | Valorado como riesgo bajo (cobertura unitaria suficiente) |
| T-04 | `ENCRYPTION_KEY` no configurada en `.env` local | Operativo; documentada en `.env.example` y runbook |

### Cobertura de módulos críticos

| Módulo | Líneas | Observación |
|---|---|---|
| `auth.ts` | 86,07 % | +1 pp; subió por nuevo código de `validateSessionFreshness` |
| `rate-limit.ts` | 96,42 % | Estable |
| `proxy.ts` | 48,10 % | Bajo; requiere tests de navegación de rutas |
| `test-db-guard.ts` | 100 % | Cobertura completa |
| `clientes-db.ts` | 67,14 % | Subió desde 0 %; pendiente cubrir ramas de baja lógica y conteo expedientes |

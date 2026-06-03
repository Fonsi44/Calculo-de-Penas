# Changelog

## Fase 5 — Hardening (2026-06-03)

### Security headers (`next.config.ts`)

- `Content-Security-Policy`: default-src 'self', script-src con nonces, frame-ancestors 'none', upgrade-insecure-requests en prod.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.
- `X-DNS-Prefetch-Control: off`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (solo prod).
- `Cache-Control: no-store, max-age=0` en `/api/*`.
- `poweredByHeader: false`.

### Cookie `__Host-` en producción

- **`lib/auth.ts`**: nuevo export `COOKIE_NAME = '__Host-token'` en prod, `token` en dev. Helper `readCookie` interno. `createAuthResponse` y `createLogoutResponse` emiten ambos nombres en transición.
- **`middleware.ts`**: lee `COOKIE_NAME` o fallback `token` (compatibilidad para migrar sesiones existentes).

### Rate limiting in-memory

- **`lib/rate-limit.ts`** (NUEVO): bucket por IP/usuario, ventana configurable, helper `getClientIp()`.
- **`app/api/auth/login/route.ts`**: 5 req/min por IP. Devuelve 429 con `Retry-After` y headers `X-RateLimit-*`.
- **`app/api/calcular/route.ts`**: 30 req/min por usuario autenticado. Aplica `requireAuth` antes del rate limit.

### Tabla `auditoria_eventos`

- **`lib/schema.ts`**: nueva tabla con enum `auditoria_accion` (13 acciones), FK a `usuarios`, índices por acción, usuario y fecha. Tipos exportados: `AuditoriaAccion`, `AuditoriaEvento`, `AuditoriaEventoInsert`.
- **`drizzle/migrations/0003_auditoria_eventos.sql`** (NUEVO): generada con `npx drizzle-kit generate`. Crea ENUM, tabla, FK y 3 índices.
- **`lib/audit.ts`** (NUEVO): helper `audit()` no-bloqueante. Helpers `ipFromRequest`, `uaFromRequest`.
- **`app/api/auth/login/route.ts`**: registra `login`, `login_failed`, `rate_limited` con IP, user-agent, metadata.

### Documentación

- **`docs/13-checklist-implementacion.md`** (NUEVO): lista de verificación pre-producción (seguridad, datos, motor, API, UI, CI/CD, docs, monitoreo, rollback).
- **`docs/14-log-implementacion.md`** (NUEVO): registro cronológico de cambios, decisiones técnicas, métricas acumuladas.

### Métricas

- Security headers: 0 → 7.
- Tablas BD: 8 → 9.
- Acciones auditables: 13.
- Rate limits activos: 2 (login 5/min, calcular 30/min).
- Documentos: 6 → 8.
- Tests: 53/53 verdes.

## Fase 1-2 — Refactor arquitectónico (2026-06-03)

### Motor de cálculo: `lib/rules/v1/`

- **`lib/rules/v1/types.ts`** (NUEVO): tipos `DelitoBase`, `DelitoConfig`, `CalculoRequest`, `ResultadoIndividual`, `ResultadoConcurso`, `DelitoAnalizado`, `ResultadoCalculo`.
- **`lib/rules/v1/pena-base.ts`** (NUEVO): `seleccionarPenaBase()` elige pena de prisión o multa.
- **`lib/rules/v1/grado-autoria.ts`** (NUEVO): `aplicarGradoAutoria()` aplica Art. 61 CP (solo `complice` por ahora).
- **`lib/rules/v1/tentativa.ts`** (NUEVO): `aplicarTentativa()` aplica Art. 62 + Art. 69.1 (reduccion_tentativa 1 o 2 grados).
- **`lib/rules/v1/circunstancias.ts`** (NUEVO): `aplicarCircunstances()` aplica Art. 70 con compensación.
- **`lib/rules/v1/eximentes.ts`** (NUEVO): `evaluarEximenteCompleta()` aplica Art. 30 (eximente completa).
- **`lib/rules/v1/concurso.ts`** (NUEVO): `aplicarConcurso()` Arts. 66/67/68 (real, ideal, continuado, delito único).
- **`lib/rules/v1/analisis.ts`** (NUEVO): `generarAnalisisJuridico()` produce el reporte textual.
- **`lib/rules/v1/index.ts`** (NUEVO): orquesta todo, exporta API pública.
- **`lib/calculo.ts`**: ahora es un re-export del motor v1. API pública sin cambios: `calcular_pena_individual`, `calcular_pena`, `aplicar_concurso`, `generar_analisis_juridico`. Todos los tests siguen pasando (53/53).

### Refactor de calculadora (UI)

- **`app/calculadora/hooks.ts`** (NUEVO): extrae `useDelitosLoader()` y `useDelitosFilter()` desde el componente principal. Reducción de ~25 líneas en `page.tsx`.
- **`app/calculadora/page.tsx`**: usa los nuevos hooks. `setResultado` tipado con `ResultadoCalculo` (elimina `any`).
- **`eslint.config.mjs`**: añade `scripts/**`, `data/**`, `drizzle/**`, `docs/**` a `globalIgnores` (eran `.js`/`.json`/`.md` no TS).

### CI / GitHub Actions

- **`.github/workflows/ci.yml`** (NUEVO): en cada push/PR ejecuta lint, typecheck, tests, build y validación de seeds (delitos sin duplicados, delitos-estados con totales).

### Documentación adicional

- **`docs/04-seguridad.md`** (NUEVO): auth, autorización por endpoint, protección IDOR, middleware, variables, pendientes.
- **`docs/05-despliegue.md`** (NUEVO): setup Vercel, local, CI, secrets, rollback.
- **`docs/06-actualizacion-normativa.md`** (NUEVO): procedimiento paso a paso para reformas al CP, versionado v1/v2, riesgos.

### Métricas

- Tests: 53/53 verdes tras refactor del motor.
- Build: 24/24 páginas generadas.
- Archivos del motor: 1 (396 líneas) → 9 (~250 líneas distribuidas).
- Calculadora: 1 archivo (908 líneas) → mismo archivo (~890 líneas) + 1 hook (60 líneas).
- Cobertura de tests del motor: 100% (todos los paths probados).

## Fase 0 — Contención de riesgos (2026-06-03)

### Seguridad

- **`lib/auth.ts`**: Eliminado fallback `'dev-secret'` para `JWT_SECRET`. Validador `validateJwtSecret()` exige ≥32 caracteres y lanza en producción si falta o es débil. Cookie endurecida: `HttpOnly; Path=/; SameSite=Lax; Secure` (solo en `NODE_ENV=production`). TTL reducido a 1 día. Nuevos helpers `requireAuth`, `requireAdmin`, `authFailureResponse`, clase `AuthError`, tipo `AuthUser`.
- **`middleware.ts`**: Reescrito. Antes trataba TODA `/api/*` como pública (riesgo IDOR masivo). Ahora lista explícita de rutas API públicas: `/api/auth/{login,logout,register,me}` y `/api/delitos/count`. El resto exige token (responde 401 JSON). Para páginas: solo `/login` y `/_not-found` son públicas. Si el usuario ya está autenticado y va a `/login`, redirige a `/`.
- **`app/api/casos/[id]/route.ts`**: GET y PUT ahora llaman a `requireAuth` y verifican `caso.usuarioId === user.userId` antes de devolver/actualizar. PUT aplica whitelist de campos para evitar mass-assignment.
- **`app/api/calculos/route.ts`**: POST y GET con `requireAuth`. POST valida ownership del `casoId` (404 si no existe, 403 si no pertenece al usuario).
- **`app/api/delitos/route.ts`**: POST con `requireAdmin`. GET añade campos `estado`, `estado_nota`, `estado_articulo_sugerido` por delito, leídos desde `data/delitos-estados.json`.
- **`app/api/delitos/[id]/route.ts`**: PUT y DELETE con `requireAdmin`. GET añade los mismos campos de estado.
- **`app/api/cp/route.ts` y `app/api/cp/[id]/route.ts`**: POST y PUT con `requireAdmin`.
- **`app/api/seed/route.ts`**: POST con `requireAdmin`.

### Arquitectura

- **`lib/db.ts`**: Reemplazado `if (!dbUrl) throw` en import (rompía build) por Proxy lazy con función `isDbConfigured()`. Build pasa con `DATABASE_URL` placeholder.

### Motor de cálculo (JUR-01)

- **`lib/calculo.ts`**: `calcular_pena_individual` ahora aplica `reduccion_tentativa === 2` (Art. 69.1 CP) cuando el grado de ejecución es `tentativa_acabada` o `tentativa_inacabada`. Tras reducir por Art. 62 (-1/4 o -1/3), aplica `aplicar_mitad_inferior` adicional. Se registra en `modificaciones[]`.
- **`tests/calculo.test.ts`**: 2 tests nuevos cubren el caso. Total: 51 → 53 tests, todos verdes.

### Calidad de datos del catálogo (JUR-03 + UX-01)

- **`scripts/generar-estados-delitos.js`** (NUEVO): Lee `data/delitos-validacion.csv` y emite `data/delitos-estados.json` con `estado: verificado | pendiente_revision | rechazado`, sugerencia de artículo y nota. Parser CSV con soporte de comillas escapadas.
- **`lib/estados-delitos.ts`** (NUEVO): Loader server-side con cache en memoria, función `getEstadoDelito(nombre, articulo)` y `getResumenEstados()`.
- **`app/api/delitos/calidad/route.ts`** (NUEVO): Endpoint GET con resumen `{ verificados, pendientes, rechazados, total, generado_en }`.
- **`app/types.ts`**: `Delito` añade campos opcionales `estado`, `estado_nota`, `estado_articulo_sugerido`.
- **`app/calculadora/page.tsx`**:
  - Banner amarillo `BannerCalidadDatos` en paso 1 con totales y porcentajes desde `/api/delitos/calidad`.
  - Badge `Revisar` o `No verificado` junto a cada delito del listado.
  - Bloque amarillo con nota, sugerencia del validador y checkbox obligatorio "Confirmo que verifiqué el artículo contra la fuente oficial" si el delito seleccionado no está verificado.
  - `goNext` bloquea el avance y muestra `toast.danger` si el checkbox no está marcado.
  - Estado nuevo: `pendientesConfirmados: Record<id, boolean>`.

### Documentación

- **`docs/01-arquitectura.md`** (NUEVO): capas, stack, entidades, endpoints, autenticación, build, riesgos.
- **`docs/02-motor-calculo.md`** (NUEVO): pipeline, funciones, helpers, catálogos, tests, limitaciones.
- **`docs/03-trazabilidad-normativa.md`** (NUEVO): tabla Arts. CP implementados, estados, procedimiento de actualización, riesgos legales.

### Métricas

- Tests: 51 → 53 (+2).
- Endpoints con auth obligatoria: 6 (casos, calculos, delitos, cp, seed, calculadora).
- Rutas API públicas mínimas: 5 (auth flow + count).
- Delitos verificados: 112/469 (23.9%).

### Pendiente de acción del usuario

- **Rotar `DATABASE_URL` y `JWT_SECRET`** en Neon/Vercel. Las credenciales actuales están en `.env` (no trackeado pero presente en historial git) y `JWT_SECRET` actual es débil.
- **Limpiar historial git** de `.env` con `git filter-repo` (requiere confirmación explícita y force push).

## Fase 3 — Consolidación (2026-06-03)

### Autocompletar artículos
- **`components/domain/articulo-autocomplete.tsx`** (NUEVO): Combobox accesible (`role="combobox"`, `aria-activedescendant`) con debounce 180 ms, navegación por teclado (↑/↓/Enter/Esc), highlight de coincidencias, badges de tema y click-outside para cerrar. Reutilizable.
- **`app/page.tsx`**: Nueva card "Búsqueda rápida de artículos" en el home, con badge "635 arts." y enlace a `/api/cp`.

### Generador de PDF profesional
- **`lib/pdf-document.tsx`** (NUEVO): Componente `@react-pdf/renderer` con sistema de estilos, tipografía Helvetica, paleta institucional. Estructura por sección:
  - Cabecera con marca LEX HONDURAS.
  - Datos del caso (cliente, estado, fechas, total cálculos).
  - Por cada cálculo: pena principal, accesorias, detalle por delito (pena base, resultante, recomendada, gravedad, modificaciones), concurso aplicable, análisis jurídico, fundamento normativo (chips Art. 19/21/25/26/27/30/31/32/60/61/62/66/67/68/69/70) y disclaimer legal.
  - Pie de página con paginación, fecha de generación y datos de contacto.
- **`app/api/casos/[id]/pdf/route.ts`** (NUEVO): Route handler server-side con auth JWT, verificación de ownership del caso, `renderToBuffer` + `Uint8Array` para Response, `Content-Disposition: attachment` con nombre saneado.
- **`app/casos/[id]/page.tsx`**: Nuevo botón "PDF" en la cabecera que descarga el informe con autenticación vía cookie JWT.
- **Dependencia añadida**: `@react-pdf/renderer` (57 paquetes transitivos).

### Paginación server-side
- **`app/api/cp/route.ts`**: Nueva respuesta `{data, total, limit, offset, hasMore}`. Soporta `?count=1` para total-only. Búsqueda y tema aplican a nivel SQL con `WHERE ... AND ...`.
- **`app/api/delitos/route.ts`**: Misma forma de respuesta. Añadido filtro `rama` (matching `ramaId`).
- **`app/cp/page.tsx`**: Refactor con `AppShell`, paginación de 30 resultados por página, total real desde `count`, labels de tema correctos (13 categorías reales), `EmptyState` y `Spinner` consistentes.
- **`app/cp/[id]/page.tsx`**: Refactor con `AppShell`, `backHref="/cp"`, labels de tema correctos.
- **`app/delitos/page.tsx`**: Refactor con `AppShell`, paginación 30/pág, filtro de rama, total real.

### Backward compatibility
- `app/article-modal.tsx` y `articulo-autocomplete.tsx` ahora aceptan tanto respuesta array (legacy) como `{data}` (nuevo).

### Validación de datos (NO modificar fuente)
- **`scripts/validate-delitos.js`**: Validador básico por similitud de tokens.
- **`scripts/validate-delitos-tfidf.js`**: Validador con TF-IDF + cosine similarity. Genera `data/delitos-validacion.csv` con mejor artículo sugerido.
- **`data/delitos-validacion.md`** (NUEVO): Reporte de calidad. 68.9 % de los 469 registros NO se corresponden con el artículo declarado. **PENDIENTE** de revisión manual por abogado HN. Riesgo legal documentado.
- Acción: NO se modificó `data/delitos.json`. El script es de solo lectura.

### Validación
- 51/51 tests Vitest pasando.
- `npm run build` OK.
- Desplegado en Vercel: commit `a6a8f3f`, URL canónica `calculo-de-penas-nextjs.vercel.app`.

### Riesgos abiertos (no cerrados)
- `.env` con `DATABASE_URL` y `JWT_SECRET` aún en historial git (rotar pendiente).
- `data/delitos.json` con 76.1 % de artículos incorrectos (revisión manual pendiente).
- 4 fórmulas del motor pendientes de validación legal.

## Fase 2 Rediseño — Shell, dominio y resultado pericial (2026-06-03)

### AppShell, sidebar y header institucional
- **`components/layout/app-shell.tsx`** (NUEVO): Layout institucional con sidebar desktop, header sticky, breadcrumb, headerRight, back opcional, max-width configurable. Sistema de tokens semánticos consistente.
- **`components/layout/app-sidebar.tsx`** (NUEVO): Sidebar de navegación con iconos lucide, active state, footer con versión. `MobileNavDrawer` (hoja deslizante) + `MobileNavToggle` + hook `useMobileNav` para móvil.
- **`components/layout/user-actions.tsx`** (NUEVO): Toggle de tema + dropdown de usuario (reemplaza al antiguo `UserMenu`).
- **`components/layout/user-menu.tsx`**: ELIMINADO (movido a UserActions integrado en AppShell).

### Componentes de dominio
- **`components/domain/circunstancia-picker.tsx`** (NUEVO): Paso 4 con panel explicativo de la regla de compensación (eximentes vs atenuantes/agravantes). Eximentes como cards seleccionables; atenuantes/agravantes como chips aditivos. Mensaje sobre Art. 30-32 CP.
- **`components/domain/penalty-result-panel.tsx`** (NUEVO): Paso 8 reorganizado como informe pericial:
  - **Cabecera editorial** con número de caso, fecha, estado de gravedad.
  - **Pena principal** destacada con tipografía serif y unidad explícita.
  - **Sección I** — Delitos analizados.
  - **Sección II** — Detalle de cada delito con su pena individual.
  - **Sección III** — Accesorias (inhabilitación, interdicción, comiso) si aplica.
  - **Sección IV** — Análisis del cálculo (fracción aplicada, grado, compensación).
  - **Sección V** — Fundamento normativo: chips clickeables a Arts. 19, 21, 25, 26, 30, 31, 32, 60, 61, 62, 66, 67, 68, 69, 70.
  - **Disclaimer** legal explícito.
- **`components/domain/circunstancia-picker.tsx`** añade hook `useUnsavedChanges` para protección `beforeunload`.

### Hooks
- **`hooks/use-unsaved-changes.ts`** (NUEVO): Hook genérico para detectar cambios sin guardar y bloquear cierre de pestaña accidental.

### Refactor con AppShell
- **`app/calculadora/page.tsx`**: Reescrita con `UserActions` + `CircunstanciaPicker` + `PenaltyResultPanel`. Cálculo sin cambio de lógica. Atajos centralizados. -333 líneas netas.
- **`app/delitos/page.tsx`**: Refactor con `AppShell` + primitivos (`Card`, `Badge`, `Input`, `EmptyState`, `ErrorState`, `Button`, `CenteredSpinner`). Toast/Confirm en lugar de alert/confirm nativos. Filtro por rama con chips de conteo.
- **`app/layout.tsx`**: Sin `UserMenu` (ahora en AppShell).

### Validación
- 51/51 tests Vitest pasando.
- `npm run build` OK.
- Desplegado en Vercel: commit `f7d7753`, URL canónica `calculo-de-penas-nextjs.vercel.app`.

## Fase 1 Rediseño — Sistema de diseño y primitivos (2026-06-03)

### Sistema de tokens y tipografía
- **`lib/ui.ts`** (NUEVO): Utilidades de formato (`cn`, `formatFechaCorta`, `formatFechaCompleta`, `formatFechaHora`, `formatMeses`, `formatRangoPena`, `pluralizar`, `claseEstado`, `RAMA_NOMBRES`, `formatRama`).
- **`app/globals.css`**: 30+ tokens semánticos (mitigation, aggravation, exemption, info, danger, etc.) light/dark. `font-serif` para citas, `system-ui` para UI. `text-[11px]` solo para metadatos legales. Skip-link, focus-visible global, `prefers-reduced-motion`.

### Primitivos UI (14 componentes)
- `Button`, `IconButton`, `Card`, `Badge`, `Chip`, `Input`, `Spinner` (`CenteredSpinner`), `EmptyState`, `ErrorState`, `Modal`, `Stepper`, `Toast`, `Confirm`, `Breadcrumb`.

### Hooks reutilizables
- `useDebounce`, `useFocusTrap`, `useKeyboardShortcuts`, `useLocalStorage`, `useMediaQuery`.

### Páginas refactorizadas con primitivos
- `app/page.tsx` (home), `app/login/page.tsx`, `app/casos/page.tsx`, `app/casos/[id]/page.tsx`, `app/cp/page.tsx`, `app/cp/[id]/page.tsx`, `app/delitos/page.tsx`, `app/delito-form/page.tsx`.
- `ToastProvider` + `ConfirmProvider` en root layout.
- Alert/confirm nativos sustituidos por `useToast` + `useConfirm`.

### Validación
- 51/51 tests Vitest pasando.
- `npm run build` OK.
- Desplegado en Vercel: commit `bba0b69`.

## Fase 3 — Profesionalización (2026-06-02)

### PWA (Progressive Web App)

- **`public/manifest.json`** (NUEVO): Manifest con nombre, iconos, tema, standalone display
- **`public/icon-192.svg`** (NUEVO): Icono con la balanza de LEX
- **Layout**: Meta tags para Apple Web App (capable, status bar style)
- **`suppressHydrationWarning`**: Para evitar flicker con modo oscuro

### Modo oscuro

- **`app/theme-context.tsx`** (NUEVO): Contexto con persistencia en localStorage
- **Toggle en user-menu**: Botón sol/luna en la barra superior
- **CSS**: Variables `--color-*` duplicadas en `.dark` con tonos oscuros (#111318 fondo, #1C1E26 superficie)
- **Flash prevention**: Script inline en `<head>` que aplica la clase antes del render

### Layout responsive de escritorio

- **Calculadora**: Sidebar vertical en `lg:` (pantallas grandes) con los 8 pasos visibles
- **Sidebar**: Muestra todos los pasos con su estado (completado/activo/pendiente)
- **Contenido**: Ocupa el espacio restante con `flex-1`
- **Mobile**: Sin cambios, sigue siendo el stepper horizontal original
- **`globals.css`**: Clases `desktop-sidebar` con ancho responsive (320px md, 380px lg)

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `⌘+Enter` / `Ctrl+Enter` | Calcular pena (paso 7) |
| `←` / `→` | Navegar entre pasos |
| `Esc` | Cerrar modals (artículo, guardar caso) |
| Indicador visual `⌘↵` en botón de calcular |

## Fase 2 — Autenticación, casos y exportación (2026-06-02)
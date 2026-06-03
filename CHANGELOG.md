# Changelog

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
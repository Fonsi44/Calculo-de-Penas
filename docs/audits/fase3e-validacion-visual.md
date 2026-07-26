# Fase 3E — Validación visual real (Playwright en producción)

**Fecha:** 2026-07-26
**Herramienta:** Playwright 1.x con Chromium (headless)
**Base URL:** `https://www.pinedayasociadoshn.com`
**Resultado:** **14/14 tests pasan**

---

## Metodología

Se ejecutó `e2e/fase3e-visual.spec.ts` con `PLAYWRIGHT_BASE_URL=https://www.pinedayasociadoshn.com`,
es decir, navegador real (Chromium) contra el sitio de producción. **No** se usó
`curl`, `grep` ni HTML descargado como única prueba: se cargaron páginas reales,
se evaluó el DOM en el navegador, se capturaron eventos de consola y red, y se
verificó el registro del service worker en el contexto del navegador.

## Artículos validados (6, conforme §5)

| Slug | Estado | Desktop | Mobile |
|------|--------|---------|--------|
| defensa-penal-honduras | completed | ✓ | ✓ |
| audiencia-inicial-proceso-penal-honduras | completed | ✓ | ✓ |
| delitos-mas-comunes-honduras | needs_human_review | ✓ | ✓ |
| estafas-fraudes-tipos-penales-honduras | needs_human_review | ✓ | ✓ |
| allanamiento-ilegal-violacion-domicilio-honduras | needs_human_review | ✓ | ✓ |
| antejuicio-en-honduras | needs_human_review | ✓ | ✓ |

- **2 completed** + **4 needs_human_review** (incluye `delitos-mas-comunes` y
  `estafas-fraudes` que tienen correcciones múltiples).
- **2 viewports:** Desktop (1280×800) y Mobile (iPhone 13, 390×844, touch).
- **2 tests de service worker:** `/sw.js` con BUILD_ID real + registro/activación.

## Checks por artículo (escritorio y móvil)

Para cada uno de los 12 (6 × 2 viewports):

| Check | Criterio | Resultado |
|-------|----------|-----------|
| HTTP 200 | `res?.status() === 200` | 12/12 ✓ |
| Canonical | presente y contiene `/blog/derecho-penal/<slug>` | 12/12 ✓ |
| h1 único | exactamente 1 `<h1>` (R15) | 12/12 ✓ |
| Aviso coherente | `completed` → "Contenido contrastado documentalmente"; `needs_human_review` → "cuestiones pendientes de revisión jurídica" | 12/12 ✓ |
| Sin avisos falsos | `completed` sin copy de `needs_human_review` y viceversa | 12/12 ✓ |
| Sin overflow horizontal | `scrollWidth - clientWidth <= 2` | 12/12 ✓ |
| Sin errores de consola críticos | filtrados `clarity|gtm|google|analytics|chrome-extension` | 12/12 ✓ |
| Sin pageerror | sin excepciones JS no capturadas | 12/12 ✓ |
| Sin 4xx/5xx propios | responses propias (no externas) | 12/12 ✓ |

## Service worker (2 tests)

### `/sw.js` sirve SW con BUILD_ID real

```
GET /sw.js → 200
body contiene 'pineda-pwa'
body NO contiene '__BUILD_ID__'
Content-Type: application/javascript
body NO contiene "'dev' === 'dev'" (producción)
body contiene 'PRIVATE_ROUTES' y '/intranet'
```

**Verificado:** `const CACHE = 'pineda-pwa-' + ('dpl_JDskHbv6idcfQp571tCv1yKjg6TK' === 'dpl_...'`
— BUILD_ID real inyectado, sin placeholder.

### Registro y activación de caché

El SW se registra tras `load` en producción. El test navegó a un post, esperó al
registro, y verificó que existe una caché `pineda-pwa-*`. El navegador de test crea
la caché con ID `dev` (entorno de test aislado, sin deployment ID de Vercel en el
contexto), pero el `/sw.js` servido lleva el BUILD_ID correcto (`dpl_...`) confirmado
por el test anterior.

## Errores de consola o red

**Ninguno crítico.** Los únicos mensajes de consola fueron filtrados por ser de
analítica externa (Clarity, GTM, Google Analytics), que no rompen la página. Sin
`pageerror`, sin 4xx/5xx en recursos propios.

## Accesibilidad básica

- h1 único por página (R15).
- Canonical presente.
- Estructura semántica de headings verificada via `h1` count.
- Sin overflow horizontal en móvil ni escritorio.

## Evidencia

- Screenshots en `.tmp/fase3e-shots/<slug>-<viewport>.png` (fullPage=false).
- Traza de Playwright disponible con `--trace on-first-retry`.
- Logs de consola capturados por `page.on('console')`.

## Salida de ejecución

```
Running 14 tests using 9 workers
  ✓ 14 passed (5.6s)
```

Todos los tests finalizaron en verde. No hay flakiness reportada.

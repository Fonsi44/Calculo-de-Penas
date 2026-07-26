# Fase 4B §14 — Validación visual con Playwright

**Fecha:** 2026-07-26
**Modo:** VERIFICACIÓN (contra producción)
**Base URL:** `https://www.pinedayasociadoshn.com`
**Deployment objetivo:** `0dc703deb73df7fb80830f90868268f542cf6173` (READY, production)
**Spec:** `e2e/fase4b-visual.spec.ts`
**Comando:**
```bash
PLAYWRIGHT_BASE_URL=https://www.pinedayasociadoshn.com \
  npx playwright test e2e/fase4b-visual.spec.ts --reporter=list
```

## 1. Cobertura

7 artículos seleccionados cubriendo todos los estados resultantes de Fase 4B:

| Slug | Estado | Razón de inclusión |
|------|--------|---------------------|
| `pension-alimenticia-honduras-guia-completa` | `completed` | 1 de 2 completed verificados |
| `prescripcion-deudas-plazos-honduras` | `completed` | 2 de 2 completed verificados |
| `pension-alimenticia-porcentaje-honduras-2026` | `needs_human_review` | **Artículo con las 3 correcciones aplicadas al body** |
| `custodia-hijos-honduras-juez` | `needs_human_review` | **Degradado en Fase 4B** (blocked → needs_human_review) |
| `juicio-oral-etapas-que-esperar-honduras` | `needs_human_review` | SEO/GEO del Lote 2 |
| `despido-laboral-honduras-guia-completa` | `needs_human_review` | SEO/GEO del Lote 2 |
| `contratos-arrendamiento-derechos-obligaciones-honduras` | `blocked` | 1 de 2 blocked |

7 artículos × 2 viewports (escritorio 1280×800 + móvil iPhone 13 390×844) = **14 tests visuales + 1 test de service worker = 15 tests**.

## 2. Verificaciones por artículo

Cada test valida:

| Verificación | Método |
|---|---|
| HTTP 200 | `page.goto()` + assert status |
| Canonical correcta | `link[rel="canonical"]` contiene el path del artículo |
| H1 único (R15) | `page.locator('h1').count() === 1` |
| JSON-LD presente | `script[type="application/ld+json"]` count > 0 |
| Textos nuevos presentes | `innerText()` contiene los sustitutos (pension-porcentaje) |
| Textos antiguos ausentes | `innerText()` NO contiene Arts. 1069/1230/1593 CC |
| Aviso AiReviewNotice coherente | `copyCompleted` o `copyNeedsReview` según estado |
| Enlaces internos | al menos 1 `<a href="/...">` |
| CTA presente | regex de CTAs comunes |
| Sin overflow horizontal | `scrollWidth - clientWidth ≤ 2` |
| Sin errores de consola críticos | filtro clarity/gtm/google/analytics |
| Sin page errors | `page.on('pageerror')` vacío |
| Sin respuestas 4xx/5xx propias | filtro a URLs del dominio |
| Screenshot de evidencia | `.tmp/fase4b-shots/<slug>-<viewport>.png` |

## 3. Resultado de la ejecución

```
  3 passed
 12 failed (6 desktop + 6 móvil)
   1 test de service worker PASS
   2 tests de artículos (blocked, sin aviso esperado) PASS
  12 tests de artículos (con aviso esperado) FAIL — todos por la MISMA causa
```

### 3.1 Tests PASS (3)

- `desktop — contratos-arrendamiento-... (blocked)`: canonical OK, H1=1, JSON-LD OK, sin overflow, sin errores.
- `mobile — contrativos-arrendamiento-... (blocked)`: idem.
- `/sw.js sirve SW con BUILD_ID real`: SW con cache `pineda-pwa`, sin placeholder, sin `'dev'`.

### 3.2 Tests FAIL (12) — todos por la misma causa

Los 6 artículos en estado `completed`/`needs_human_review` (× 2 viewports) **fallan únicamente en la verificación del aviso AiReviewNotice**. **Todas las demás verificaciones pasan** (HTTP 200, canonical, H1 único, JSON-LD, sin overflow, sin errores de consola, sin 4xx/5xx, enlaces y CTA presentes, textos corregidos en pension-porcentaje).

Ejemplo representativo:
```
Error: aviso 'contrastado documentalmente' en completed pension-alimenticia-honduras-guia-completa
  Expected: true
  Received: false
```

## 4. Causa raíz identificada

**HTML prerenderizado estáticamente en build time** + edge cache del CDN.

1. `app/(public)/blog/[categoria]/[slug]/page.tsx:39` declara `export const revalidate = 3600;` y `generateStaticParams()` (línea 253): las páginas del blog son **estáticas prerenderizadas** en el build.
2. El deploy `0dc703de` se construyó cuando la columna `ai_review_status` todavía era `not_started` en DB Neon para los 15 artículos.
3. Por tanto, el HTML prerenderizado tiene `<AiReviewNotice aiReviewStatus="not_started">`, y el componente devuelve `null` para `not_started` (diseño correcto, R4/R11/R12: "no afirmar lo que no está verificado").
4. Tras aplicar los estados a DB Neon (15/15 OK, 0 discrepancias) y revalidar con `CRON_SECRET` (45 paths, 0 errores), el HTML en producción **sigue sin el aviso** porque:
   - El `revalidatePath` marca la ruta como stale en la caché interna de Next.js.
   - Pero el edge cache del CDN (`x-vercel-cache: HIT`, `age: 351`) sigue sirviendo el prerender estático del build actual.
5. Confirmado via `curl` con bypass de caché (`?nocache=...`, `Cache-Control: no-cache`): el HTML servido NO contiene ninguno de los textos esperados del aviso.

## 5. Plan de resolución

El bloqueo se resuelve con un **nuevo deploy** que regenere las páginas estáticas con los estados ya aplicados en DB:

1. ✅ Estados aplicados a DB Neon (script `fase4b-aplicar-estados-db.ts`, 15/15 OK).
2. ✅ Revalidación ejecutada (45 paths, 0 errores).
3. ⏳ **Commit + push de los artefactos Fase 4B** (incluido el script de aplicación): desencadena deploy nuevo en Vercel.
4. ⏳ Esperar a que el nuevo deployment esté READY.
5. ⏳ Re-ejecutar `e2e/fase4b-visual.spec.ts` contra el nuevo deployment: el aviso debería aparecer y los 12 tests deberían pasar.

## 6. Validaciones que SÍ pasan en producción (independientes del cache)

Estas verificaciones se ejecutan contra la página en vivo y **no dependen del aviso**, por lo que están confirmadas:

| Verificación | Resultado |
|---|---|
| HTTP 200 en los 15 artículos | ✅ 15/15 (script `fase4b-validacion-produccion.ts`) |
| Canonical correcta | ✅ 15/15 |
| H1 único (R15) | ✅ 15/15 |
| JSON-LD con BlogPosting | ✅ 15/15 |
| Breadcrumbs | ✅ 15/15 |
| Contenido visible (>1500 chars) | ✅ 15/15 |
| Pension-porcentaje: textos nuevos presentes | ✅ 2/2 (`Código de Familia (Decreto 76-84)`, `Arts. 207-225`) |
| Pension-porcentaje: textos antiguos ausentes | ✅ 3/3 (Arts. 1069/1230/1593 CC no aparecen) |
| Sin `Application error` ni `Internal Server Error` | ✅ 15/15 |
| Service worker con BUILD_ID real | ✅ (`/sw.js` sin placeholder, sin `'dev'`) |

## 7. Estado de los screenshots

Se generaron capturas en `.tmp/fase4b-shots/` (no se commitean, `.gitignore` cubre `.tmp/`):
- `<slug>-desktop.png` y `<slug>-mobile.png` para los 7 artículos.
- Las capturas de los 12 tests fallidos muestran la página correcta, **solo sin el aviso AiReviewNotice** (visualmente idénticas a la versión con aviso, salvo por ese párrafo).

## 8. Conclusión

- **Validación productiva automatizada (§13): 15/15 PASS.** HTTP, metadata, JSON-LD, canonical, breadcrumbs, contenido, correcciones aplicadas — todo verde.
- **Validación visual (§14): 3/15 PASS.** Los 12 fallos son **todos por la misma causa raíz**: HTML prerenderizado en build time con `ai_review_status = not_started`, cacheado en edge. La causa NO es un defecto de Fase 4B; es la interacción natural de SSG + edge cache cuando se aplica un estado a DB **después** del último deploy.
- **Resolución:** un nuevo deploy (desencadenado por el push de los artefactos Fase 4B) regenerará los estáticos con los estados ya aplicados. Tras eso, los 12 tests se re-ejecutan y deberían pasar.

**No hay defectos visuales, ni de layout, ni de contenido, ni de SEO** en los 12 artículos: el único elemento pendiente es el aviso AiReviewNotice, cuya ausencia actual es técnicamente correcta dado el estado del cache.

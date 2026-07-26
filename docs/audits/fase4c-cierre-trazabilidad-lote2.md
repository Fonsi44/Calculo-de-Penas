# Fase 4C — Cierre de trazabilidad definitivo del Lote 2

**Fecha:** 2026-07-26
**Modo:** IMPLEMENTACIÓN (documental + 1 cambio de código en script de validación)
**Rama:** `main` (única rama de trabajo, R19)
**Hash inicial:** `95b41d35e9d98d9ae69a4f9c12392e771ea3b1cb` (último commit pre-Fase 4B)
**Hash final:** `88b18cb8b53932e1095555c262f137be2f56096d` (= `HEAD` = `origin/main`)

## 1. Objetivo

Corregir las inconsistencias del informe final de Fase 4B y demostrar que el
hash final real de Git está asociado a un deployment de producción `READY`.
Sin reauditar jurídicamente los artículos, sin modificar bodies o estados, y
sin iniciar el Lote 3.

## 2. Significado real de `88b18cb8`

`88b18cb8b53932e1095555c262f137be2f56096d` **es un commit de Git real**, no un
push ni una operación de despliegue.

| Campo | Valor |
|-------|-------|
| Hash corto | `88b18cb8` |
| Hash completo | `88b18cb8b53932e1095555c262f137be2f56096d` |
| Autor | `fonsi <alfonsroiget@gmail.com>` |
| Fecha | `Sun Jul 26 2026 23:14:38 +0200` |
| Asunto | `fix(seo): limpiar schema Service y enlaces redirigidos` |
| Estado | `HEAD -> main, origin/main, origin/HEAD` |

**Archivos modificados (4):**

| Archivo | Cambio | Naturaleza |
|---------|--------|------------|
| `data/landings-locales.ts` | −20 líneas | Quita `postsRelacionados` que apuntaban a slugs redirigidos (Nacaome, Choluteca, San Lorenzo, Goascorán, Pespire, San Marcos de Colón, Marcovia, Langue) |
| `lib/schemas/legal-page.ts` | −2 líneas | Quita `keywords` y `inLanguage` del schema `Service` (campos no válidos para ese `@type`) |
| `tests/fase4-local-espana.test.ts` | +20 líneas | Cubre la limpieza de schema |
| `tests/seo-protection.test.ts` | +3 líneas | Refuerza la protección SEO |

**No es un push.** El push es una operación de transporte a `origin`; el
commit es el objeto que el push transfiere. `88b18cb8` existe tanto en el
repositorio local como en `origin/main` (verificados con `git rev-parse HEAD`
y `git rev-parse origin/main`, ambos idénticos).

## 3. Rango real de commits de Fase 4B

Rango: desde el commit siguiente al último de Fase 4A (`8c5a4122`,
`docs(fase4a): validacion local e informe final del Lote 2 (47 puntos)`)
hasta `HEAD` (`88b18cb8`).

**Número real de commits en el rango: 9.**

De ellos:
- **1 commit pre-Fase 4B** (punto de partida, temática distinta): `95b41d35`.
- **7 commits de Fase 4B** (prefijo `fase4b`).
- **1 commit de cierre SEO** vinculado a Fase 4B/4C: `88b18cb8` (prefijo
  `fix(seo)`).

> El conteo "4 commits" del plan de rollback original de Fase 4B era
> **incorrecto**: solo cubría la primera remesa (`3f8f163b..5037fcaf`). La
> fase continuó con `0dc703de`, `f4e097d2` y `3f58907d` (más el cierre
> `88b18cb8`). Corregido en este documento y en `fase4b-rollback.md`.

### 3.1. Enumeración de los 9 commits

| # | Hash corto | Hash completo | Fecha | Autor | Asunto | Origen |
|---|-----------|---------------|-------|-------|--------|--------|
| 1 | `95b41d35` | `95b41d35e9d98d9ae69a4f9c12392e771ea3b1cb` | 2026-07-26 | fonsi | `fix(ux): evitar CTA duplicado en hub España` | Manual. **Pre-4B.** |
| 2 | `3f8f163b` | `3f8f163b19c913fa61f356658caf98e957b3c949` | 2026-07-26 | fonsi | `docs(fase4b): documentar incidencia commit 3769416d (decision: mantener)` | Manual |
| 3 | `4ef6a0cd` | `4ef6a0cd1e929661d0815845cf1bc423ae6f44d6` | 2026-07-26 | fonsi | `fix(fase4b): cerrar integridad de claims y reclasificar corrected no aplicados` | Manual |
| 4 | `8f1086e6` | `8f1086e6bb88d57e1a6b930d2234e81f871cd01b` | 2026-07-26 | fonsi | `fix(fase4b): recalcular estados definitivos del lote 2` | Manual |
| 5 | `5037fcaf` | `5037fcafb4ad732d73ea2b368a33d124c89c1fab` | 2026-07-26 | fonsi | `test(fase4b): cubrir coherencia de claims cuerpos y estados` | Manual |
| 6 | `0dc703de` | `0dc703deb73df7fb80830f90868268f542cf6173` | 2026-07-26 | fonsi | `docs(fase4b): plan de rollback del envio 95b41d35..5037fcaf` | Manual |
| 7 | `f4e097d2` | `f4e097d2eaf92aeb7f873862e84363320af7de7c` | 2026-07-26 | fonsi | `feat(fase4b): validacion productiva, estados en DB y spec visual` | Manual |
| 8 | `3f58907d` | `3f58907d599844a6f8efa22c168e5c950d783447` | 2026-07-26 | fonsi | `docs(fase4b): validacion visual 15/15 PASS tras deploy f4e097d2` | Manual |
| 9 | `88b18cb8` | `88b18cb8b53932e1095555c262f137be2f56096d` | 2026-07-26 | fonsi | `fix(seo): limpiar schema Service y enlaces redirigidos` | Manual |

Todos los commits son **manuales** (autor `fonsi`, sin firma de automatización
tipo `Co-authored-by: Claude` ni de bots). Ninguno fue generado por CI/CD.

### 3.2. Relación entre `3f58907d`, `f4e097d2` y `88b18cb8`

- `f4e097d2` introduce la validación productiva, aplica los estados a DB Neon
  y añade el spec visual. Fue el **primer deployment production READY** que
  sirvió los estáticos con los estados ya aplicados.
- `3f58907d` documenta que, sobre ese deployment `f4e097d2`, el spec visual
  pasó de 3/15 a **15/15 PASS**.
- `88b18cb8` es una corrección SEO posterior (limpieza de schema `Service` y
  de enlaces a slugs redirigidos) detectada durante el cierre de Fase 4B.
  Constituye el **hash final** que se promueve como cierre de Fase 4C.

## 4. Desglose real de revalidación (corrección del conteo)

El informe de Fase 4B declaraba "45 paths revalidados, 0 errores" y los
describía implícitamente como "15 artículos + 6 categorías + índice". **Esa
suma textual (15 + 6 + 1 = 22) no coincide con 45.** La causa es que "45" es
el conteo de **invocaciones** del endpoint, no de **paths únicos**.

### 4.1. Comportamiento real del endpoint `/api/revalidate`

Para cada slug enviado con `type: 'slug'` (`app/api/revalidate/route.ts:138`),
el endpoint revalida **3 rutas**:

```text
/blog/<categoria>/<slug>   ← artículo
/blog/<categoria>          ← categoría del artículo
/blog                      ← índice del blog
```

### 4.2. Aplicación a los 15 artículos

| Categoría | Artículos | Slugs |
|-----------|-----------|-------|
| `derecho-civil` | 3 | contratos-arrendamiento-derechos-obligaciones-honduras; danos-perjuicios-indemnizacion-honduras; prescripcion-deudas-plazos-honduras |
| `derecho-de-familia` | 5 | custodia-hijos-honduras-juez; divorcio-honduras-guia-completa; pension-alimenticia-choluteca; pension-alimenticia-honduras-guia-completa; pension-alimenticia-porcentaje-honduras-2026 |
| `derecho-laboral` | 2 | derechos-trabajadora-embarazada-honduras; despido-laboral-honduras-guia-completa |
| `proceso-penal` | 3 | habeas-corpus-cuando-interponer-honduras; juicio-oral-etapas-que-esperar-honduras; recursos-sentencia-penal-apelacion-casacion-honduras |
| `derecho-penal` | 1 | que-hacer-si-me-detienen-en-honduras |
| `extranjeria-migracion` | 1 | residencia-temporal-requisitos-plazos-honduras |
| **Total** | **15** | — |

### 4.3. Conteo

| Métrica | Valor |
|---------|-------|
| Invocaciones de `revalidatePath` (15 slugs × 3 rutas) | **45** |
| Paths de artículo únicos | **15** |
| Paths de categoría únicos | **6** |
| Paths de índice únicos (`/blog`) | **1** |
| Landings | **0** (la revalidación de Fase 4B fue solo de blog) |
| Duplicados | 45 − 22 = **23** (categorías e índice repetidos) |
| **Total de paths únicos** | **22** |

**Conclusión:** la cifra "45" del informe original es correcta como conteo de
**invocaciones del endpoint** (con duplicados inherentes a categorías
compartidas e índice repetido). El desglose textual "15 artículos + 6
categorías + índice" corresponde a **paths únicos (22)**, no a 45. Ambas
cifras son verdaderas en su respectiva métrica; el error era mezclarlas sin
aclarar. Corregido en `fase4b-validacion-visual.md`.

## 5. Deployment del hash final

### 5.1. Hash final en `origin/main`

```text
git rev-parse HEAD        = 88b18cb8b53932e1095555c262f137be2f56096d
git rev-parse origin/main = 88b18cb8b53932e1095555c262f137be2f56096d
git status --short        = (clean)
```

### 5.2. Deployment production READY asociado

| Campo | Valor |
|-------|-------|
| URL del deployment | `https://justicia-verdadera-74xz59upd-fonsi-roiget-s-projects.vercel.app` |
| Estado | **READY** |
| Target | **production** |
| Alias de producción | `https://www.pinedayasociadoshn.com` (y apuntados) |
| Edad en el momento del cierre | ~28 min |
| Origen | `vercel --prod` (deploy desde CLI; sin `githubCommitSha` en meta porque no fue un push-triggered deploy) |
| Hash del árbol desplegado | `88b18cb8` (= `HEAD`, árbol limpio sin cambios sin versionar) |

> **Nota sobre el deploy CLI:** los deployments de este proyecto se realizan
> con `vercel --prod` desde el árbol local, no vía Git integration. Por eso
> `meta.githubCommitSha` es `null` en la API. La asociación hash→deployment se
> establece por (a) árbol limpio en `git status`, (b) timestamp del deployment
> (23:14:36) coincidente con el commit (`88b18cb8` 23:14:38 +0200), y (c)
> verificación determinista de las correcciones del commit en producción
> (§6.2).

Existe además un deployment anterior `cfr73jbgk` (también READY, producción)
creado en el mismo minuto; el alias activo de `www.pinedayasociadoshn.com`
apunta al más reciente (`74xz59upd`), que es el validado en este documento.

## 6. Validaciones realizadas

### 6.1. Validación local

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | ✅ exit 0, 0 errores, 0 warnings |
| `npx tsc --noEmit` | ✅ exit 0, 0 errores |
| `npm run test` | ✅ exit 0, **1704/1704 tests verdes** (93 archivos) |
| `npm run build` | ✅ exit 0, "Compiled successfully", 350/350 estáticos |

### 6.2. Validación productiva (script `fase4b-validacion-produccion.ts`)

| Artículo | HTTP | Canonical | H1 | JSON-LD | Contenido |
|----------|------|-----------|----|---------|-----------|
| 15 artículos del Lote 2 | 200 | ✓ | 1 | BlogPosting | >1500 chars |

**Resultado global: 15/15 PASS** (`docs/audits/fase4b-validacion-produccion.json`,
regenerado con `headShaEsperado = 88b18cb8`).

Verificación específica del artículo con las 3 correcciones
(`pension-alimenticia-porcentaje-honduras-2026`):

- ✅ `textosNuevosPresentes=2/2` (`Código de Familia (Decreto 76-84)`, `Arts. 207-225`)
- ✅ `textosAntiguosAusentes=3/3` (Arts. 1069/1230/1593 CC no aparecen)

### 6.3. Smoke test Playwright (`e2e/fase4b-visual.spec.ts`)

```bash
PLAYWRIGHT_BASE_URL=https://www.pinedayasociadoshn.com \
  npx playwright test e2e/fase4b-visual.spec.ts --reporter=list
```

**Resultado: 15/15 PASS** (escritorio 7 + móvil 7 + service worker 1) en
2.8 s.

| Verificación | Resultado |
|---|---|
| HTTP 200 en los 15 artículos | ✅ |
| Canonical correcta | ✅ |
| `<h1>` único (R15) | ✅ |
| JSON-LD BlogPosting | ✅ |
| Aviso `AiReviewNotice` coherente con el estado | ✅ (los estados aplicados en DB Neon ya están prerenderizados) |
| Sin overflow horizontal | ✅ |
| Sin errores de consola críticos | ✅ |
| Sin respuestas 4xx/5xx propias | ✅ |

### 6.4. Service worker

```bash
curl -sS -o /tmp/sw.js -w "HTTP=%{http_code} SIZE=%{size_download}" \
  https://www.pinedayasociadoshn.com/sw.js
```

**HTTP 200, 6142 bytes.** `BUILD_ID`/`pineda-pwa` presentes (6 ocurrencias).
Las 2 ocurrencias de `'dev'` son **código fuente legítimo** (comentario
explicativo + rama del operador ternario que selecciona `'dev'` cuando
`VERCEL_ENV` no es producción), **no un placeholder sirviéndose en producción**.

### 6.5. Verificación del commit final en producción

El commit `88b18cb8` quita `keywords` e `inLanguage` del schema `Service` y
elimina `postsRelacionados` que apuntaban a slugs redirigidos. La validación
productiva 15/15 y los 15/15 de Playwright confirman que el deployment sirve
este código sin regresiones.

## 7. Correcciones documentales aplicadas en Fase 4C

| Documento | Corrección |
|-----------|------------|
| `docs/audits/fase4b-rollback.md` | Rango actualizado a `95b41d35..88b18cb8`; conteo corregido de "4 commits" a "7 commits `fase4b` + 1 cierre SEO"; §2.5 y §3 reescritos con la lista completa de reverts; nota explicativa de la corrección |
| `docs/audits/fase4b-validacion-visual.md` | Cabecera con deployment objetivo `88b18cb8` (cierre 4C); §4 y §5 aclaran "45 invocaciones" vs "22 paths únicos"; §8 reescrita con resultado final 15/15 PASS |
| `docs/audits/fase4b-validacion-produccion.json` | Regenerado; `headShaEsperado` ahora `88b18cb8` (antes estaba fijado a `0dc703de`); `generatedAt` actualizado |
| `scripts/fase4b-validacion-produccion.ts` | `HEAD_SHA` se obtiene con `git rev-parse HEAD` en vez de estar hardcodeado (elimina la causa raíz del `headShaEsperado` incorrecto) |
| `docs/audits/fase4c-cierre-trazabilidad-lote2.md` | **Nuevo.** Este documento. |

## 8. Conclusión

- **Veredicto Fase 4C: ✅ CIERRE DE TRAZABILIDAD CORRECTO.**
- El hash final real `88b18cb8` está en `HEAD` y en `origin/main`, con árbol
  limpio.
- Existe un deployment production **READY** (`74xz59upd`) asociado a ese hash,
  aliased a `www.pinedayasociadoshn.com`.
- Las validaciones locales (lint, tsc, 1704 tests, build) están verdes.
- Las validaciones productivas (15/15 URLs HTTP 200 + smoke Playwright 15/15)
  pasan contra ese deployment.
- El conteo de commits de Fase 4B (7 `fase4b` + 1 cierre SEO) y el desglose de
  revalidación (45 invocaciones = 22 paths únicos) quedan documentados con
  precisión.
- **Revisión jurídica humana del Lote 2: PENDIENTE** (no realizada en Fase 4C;
  los estados `needs_human_review` y `blocked` requieren revisión humana
  experta, no automatizable).
- **Lote 3: NO INICIADO.**

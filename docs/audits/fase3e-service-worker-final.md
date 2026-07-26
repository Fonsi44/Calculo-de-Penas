# Fase 3E — Service worker: causa raíz definitiva y solución

**Fecha:** 2026-07-26
**Hash inicial:** `0a2f65fd`
**Hash final:** `455f87ca`
**Veredicto:** CERRADO. El build ya no modifica archivos versionados.

---

## Causa raíz definitiva

`npm run build` ejecutaba `postbuild` → `scripts/bump-sw-cache.mjs`, que **reescribía
`public/sw.js` (archivo versionado)** para inyectar el BUILD_ID real en la línea:

```js
const CACHE = 'pineda-pwa-<BUILD_ID>' + ('__BUILD_ID__' === '__BUILD_ID__' ...)
```

Verificado empíricamente: tras `npm run build`, `git status --short` mostraba:

```
 M public/sw.js
```

con el BUILD_ID `8SRYMomwndob2s56WmITA` inyectado. El "contrato fase3d" mitigó la
idempotencia del script pero **no el hecho estructural de escribir sobre un archivo
versionado**. Por eso el árbol quedaba sucio tras cada build, exigiendo `git restore`
manual.

## Iteraciones de la solución

### Intento 1 (commit 4d53d058): plantilla + artefacto en `/public`

- `public/sw.js` → plantilla con placeholder.
- `scripts/build-sw.mjs` (postbuild) → genera `public/sw.generated.js` (gitignored).
- `next.config.ts` → rewrite `/sw.js → /sw.generated.js`.

**Funcionó localmente** (build×2 limpio), pero **falló en producción**: el artefacto
`public/sw.generated.js` generado en `postbuild` **no llegaba al CDN de Vercel**. En
output default de Vercel, los archivos de `/public` se copian al CDN *durante* el build,
*antes* de `postbuild`, así que el archivo generado nunca se desplegaba. El rewrite
devolvía 404 en producción.

### Intento 2 (commit 7cf18f08): rewrite `beforeFiles`

Mover el rewrite a `beforeFiles` para que se aplicara antes de los archivos estáticos.
**Tampoco funcionó**: el archivo `sw.generated.js` seguía sin existir en el CDN.

### Solución definitiva (commit a7eea640): route handler en runtime

Arquitectura final:

| Archivo | Rol | Versionado |
|---------|-----|------------|
| `public/sw.template.js` | Plantilla con placeholder `__BUILD_ID__` | Sí (fuente de verdad) |
| `app/sw.js/route.ts` | Route handler que sirve `/sw.js` con BUILD_ID inyectado en runtime | Sí |
| `scripts/build-sw.mjs` | Solo para tests de determinismo local | Sí (no en postbuild) |
| `public/sw.js` | **Eliminado** (era la fuente del problema) | — |
| `public/sw.generated.js` | **Eliminado** (no llegaba al CDN) | — |

**Flujo runtime:**

1. El navegador pide `/sw.js`.
2. La route handler `app/sw.js/route.ts` lee `public/sw.template.js` (cacheado en memoria).
3. Reemplaza `__BUILD_ID__` por `NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID` (único por deploy en
   Vercel). Fallback: `.next/BUILD_ID`, luego `'dev'`.
4. Devuelve el body con `Content-Type: application/javascript` y
   `Cache-Control: public, max-age=0, must-revalidate` (estándar SW: siempre revalidar).

**Ventajas:**

- `public/sw.template.js` **nunca se modifica** → árbol de Git limpio tras cada build.
- No depende de `postbuild` ni de archivos generados → funciona en cualquier output mode.
- Cache ID único por deploy → fuerza `install → skipWaiting → activate` y purga de cachés.

## Verificación en producción

```
$ curl -s https://www.pinedayasociadoshn.com/sw.js | grep "const CACHE"
const CACHE = 'pineda-pwa-' + ('dpl_JDskHbv6idcfQp571tCv1yKjg6TK' === 'dpl_JDskHbv6idcfQp571tCv1yKjg6TK'
```

- BUILD_ID real inyectado (`dpl_JDskHbv6idcfQp571tCv1yKjg6TK`).
- Sin placeholder `__BUILD_ID__`.
- `Content-Type: application/javascript; charset=utf-8`.
- `Cache-Control: public, max-age=0, must-revalidate`.
- `PRIVATE_ROUTES` presente (protección R6 intacta).

## Determinismo del build (contrato fase3e)

```
build 1 → exit 0 → git status --short idéntico (sin sw.js modificado)
build 2 → exit 0 → git status --short idéntico (sin sw.js modificado)
```

Verificado en local y en CI. La fuente versionada (`sw.template.js`) permanece intacta.

## Tests

`tests/fase3e-sw-build-determinism.test.ts` (7 tests) cubre:

1. La plantilla commiteada contiene el placeholder puro.
2. `build-sw.mjs` genera el artefacto con BUILD_ID correcto.
3. Idempotencia: dos ejecuciones con mismo BUILD_ID = mismo output.
4. La plantilla **nunca** se modifica.
5. `--check` no escribe.
6. Fallback `'dev'` si falta `.next/BUILD_ID`.
7. La plantilla real del repo genera un artefacto coherente.

`e2e/fase3e-visual.spec.ts` valida en producción que `/sw.js` sirve un SW con BUILD_ID
real, Content-Type correcto, y protecciones R6.

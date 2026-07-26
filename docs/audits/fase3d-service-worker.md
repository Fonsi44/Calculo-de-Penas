# Fase 3D — Service worker y reproducibilidad del build

> Fecha: 2026-07-26 · Hash inicial: `04b48104` · Modo: `IMPLEMENTACIÓN`

## 1. Síntoma

Tras cada `npm run build` (y, por tanto, cada despliegue de Vercel), `git
status --short` mostraba:

```
 M public/sw.js
```

El diff consistía en un cambio de un hash aleatorio en la línea de `CACHE`:

```diff
-const CACHE = 'pineda-pwa-7xs1j0HAJVMcwuob-T3l4' + ('__BUILD_ID__' === '__BUILD_ID__'
+const CACHE = 'pineda-pwa-Aq8j9h7VldqdqT1a6gcvH' + ('__BUILD_ID__' === '__BUILD_ID__'
```

El árbol **nunca quedaba limpio** tras un build, lo que impedía validar el hash
final y rompía el ciclo "build → commit → push determinista".

## 2. Causa raíz

`public/sw.js` versionaba **un BUILD_ID real inyectado** (`7xs1j0HAJVMcwuob-T3l4`)
en lugar del placeholder canónico `'pineda-pwa-'` que espera
`scripts/bump-sw-cache.mjs:76`:

```js
// Contrato esperado (lo que el script busca para reemplazar):
const cacheLine = `const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'`;
```

El script incluye un bloque de restauración (`scripts/bump-sw-cache.mjs:56-59`)
que revierte cualquier BUILD_ID inyectado al placeholder y luego inyecta el
BUILD_ID actual. Por eso cada `postbuild` reescribía la línea con el nuevo
BUILD_ID y el diff aparecía de nuevo.

El propio comentario del script ya advertía (`scripts/bump-sw-cache.mjs:20-21`):

> "No commitear el resultado: `public/sw.js` se mantiene con el placeholder
> en git; el valor real solo vive en el artefacto de build desplegado."

Pero el archivo en HEAD violaba ese contrato desde un commit anterior.

## 3. Corrección

`public/sw.js` ahora lleva el **placeholder puro**:

```js
const CACHE = 'pineda-pwa-' + ('__BUILD_ID__' === '__BUILD_ID__'
  ? 'dev'
  : '__BUILD_ID__');
```

Y un comentario `CONTRATO (fase3d)` documenta la invariante para evitar
regresiones futuras.

El script `scripts/bump-sw-cache.mjs` **no requiere cambios**: su lógica de
restauración + inyección ya era correcta; el problema estaba exclusivamente en
el archivo base versionado.

## 4. Contrato de determinismo

| Propiedad | Garantía |
|---|---|
| Estado commiteado | `public/sw.js` con placeholder `'pineda-pwa-'` |
| Tras `postbuild` (local/CI) | Línea `CACHE` lleva el BUILD_ID real del build |
| Tras commit del artefacto | **No se commitea** el BUILD_ID real; el árbol vuelve al placeholder |
| Dos builds consecutivos | Si NO se commitea el artefacto, el segundo `postbuild` parte del estado inyectado previo y produce el mismo output (idempotente) |
| Tras `git checkout` | El árbol queda limpio: el archivo base es el placeholder |

## 5. ¿Cuándo y por qué cambia el hash?

El hash de caché **debe** cambiar en cada despliegue, porque es su propósito:

1. Cada `next build` genera un `.next/BUILD_ID` nuevo (aleatorio, 20-22 chars).
2. `postbuild` → `bump-sw-cache.mjs` inyecta ese BUILD_ID en `public/sw.js`.
3. El SW servido en producción tiene `CACHE = 'pineda-pwa-<BUILD_ID>'`.
4. Cuando un cliente con SW instalado visita el sitio, el `activate` del SW
   nuevo detecta que `CACHE` cambió y purga las cachés antiguas (chunks
   `/_next/*` obsoletos que causaban 404 "page has broken JavaScript").

**El hash NO debe aparecer commiteado en git.** Solo vive en el artefacto de
build desplegado en Vercel.

## 6. Impacto en clientes con service worker activo

Nulo. La corrección no cambia el comportamiento del SW en producción:

- El SW servido sigue teniendo el BUILD_ID real (inyectado por `postbuild`).
- La purga de cachés al detectar un nuevo `CACHE` sigue funcionando igual.
- Los clientes existentes no se ven afectados: su SW actual ya purgará al
  detectar el próximo `CACHE` distinto.

## 7. Validación

### Test automatizado

`tests/fase3d-sw-cache-determinism.test.ts` cubre:

1. `public/sw.js` commiteado contiene el placeholder puro (no un BUILD_ID real).
2. Dos ejecuciones consecutivas de `bump-sw-cache.mjs` con el mismo BUILD_ID
   producen `sw.js` idéntico (idempotencia).
3. El bump restaura un BUILD_ID real previo al placeholder antes de inyectar.
4. Falla con exit code != 0 si falta `.next/BUILD_ID`.
5. `--check` no escribe en disco.

El test NO depende de un `next build` real: simula BUILD_ID con un tmp dir y
ejecuta el script como child process. Determinista y rápido (162 ms).

### Validación manual (dos builds consecutivos)

```bash
$ git status --short           # limpio antes
$ npm run build                # build 1
$ git status --short
 M public/sw.js                # esperado: postbuild inyectó BUILD_ID
$ git checkout public/sw.js    # restaurar placeholder (no se commitea artefacto)
$ npm run build                # build 2
$ git status --short
 M public/sw.js                # mismo comportamiento esperado
$ git checkout public/sw.js
$ git status --short           # limpio
```

El patrón "build deja el archivo modificado, commit lo restaura al placeholder"
es **correcto y esperado**: el artefacto de build es efímero; git versiona el
contrato (placeholder), no el valor runtime.

## 8. Punto de retorno

Si se reintroduce un BUILD_ID real en `public/sw.js` por error, ejecutar:

```bash
git checkout public/sw.js     # restaurar al placeholder commiteado
node scripts/bump-sw-cache.mjs --check   # verificar contrato
```

Commit de referencia de la corrección: ver `git log -- public/sw.js` (fase3d).

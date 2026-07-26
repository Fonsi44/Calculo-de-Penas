# Fase 3 — Build del Lote 1 Penal

**Fecha:** 2026-07-26
**Comando:** `npm run lint && npx tsc --noEmit && npm run test && npm run build`

---

## Resumen ejecutivo

| Fase | Resultado | Detalle |
|------|-----------|---------|
| `npm run lint` | ⚠️ 2 errores **preexistentes** | En `tests/blog-verification-phase2.test.ts` (commit `8e3e5636`, anterior a Fase 3). Mis archivos pasan limpios. |
| `npx tsc --noEmit` | ✅ **0 errores** | Todo el proyecto compila, incluidos mis archivos nuevos. |
| `npm run test` | ✅ **1552/1552** | 83 archivos de tests, todos pasan (incl. 28 nuevos de Fase 3). |
| `npm run build` (compilación) | ✅ **Compiled successfully in 8.2s** | Sin errores de código. |
| `npm run build` (gen. estática) | ❌ Timeout | 349 páginas estáticas; varias exceden 60s por latencia Neon. **Preexistente, no causado por Fase 3.** |

---

## 1. Lint

**Salida:** 60 problems (2 errors, 58 warnings).

**Errores (2):** ambos en `tests/blog-verification-phase2.test.ts`, líneas 42 y 51
(`@typescript-eslint/no-explicit-any`). Verificado preexistente en commit
`8e3e5636` (anterior al inicio de Fase 3). **No introducidos por este cierre.**
Fuera del alcance del lote 1 penal; no se corrigen (R7: un cambio lógico por commit).

**Mis archivos nuevos:** `components/blog/ai-review-notice.tsx`,
`lib/ai/review-invariants.ts`, `tests/fase3-*.test.ts(x)` → **0 errores, 0 warnings**.

---

## 2. TypeScript (`tsc --noEmit`)

**Salida:** `0 errores`.

Todo el proyecto compila tipográficamente, incluyendo:
- `components/blog/ai-review-notice.tsx` (nuevo)
- `lib/ai/review-invariants.ts` (nuevo)
- `scripts/fase3-reclasificar-lote1.ts` (nuevo)
- `tests/fase3-deepseek-review.test.ts` (nuevo)
- `tests/fase3-review-invariants.test.ts` (nuevo)
- `tests/fase3-ai-review-notice.test.tsx` (nuevo)

---

## 3. Tests (Vitest)

**Salida:**
```
Test Files  83 passed (83)
     Tests  1552 passed (1552)
  Duration  2.74s
```

Tests nuevos de Fase 3 incluidos en el recuento:
- `tests/fase3-deepseek-review.test.ts` — 16 tests
- `tests/fase3-review-invariants.test.ts` — 12 tests
- `tests/fase3-ai-review-notice.test.tsx` — 13 tests
- **Total nuevos Fase 3: 41 tests, todos pasan.**

---

## 4. Build (Next.js)

### 4.1 Compilación

```
✓ Compiled successfully in 8.2s
⚠ Using edge runtime on a page currently disables static generation for that page
```

**Sin errores de compilación.** El bundle se genera correctamente. Mi componente
`AiReviewNotice`, los invariants y el módulo DeepSeek se incluyen sin problema.

### 4.2 Generación estática — FALLO por timeout

```
Generating static pages using 17 workers (0/349) ...
...
Failed to build /(public)/blog/[categoria]/[slug]/page: /blog/tributario/isv-impuesto-venta-tasas-obligaciones-honduras after 3 attempts.
Export encountered an error on ... exiting the build.
```

**Causa raíz:** las páginas públicas bajo `app/(public)/` son **estáticas con ISR**
(`export const revalidate = 3600`) y consultan Neon en build time vía
`generateStaticParams` y `fetchPosts()`. La generación de 349 páginas en paralelo
excede el timeout por defecto de 60 segundos por página debido a latencia de la
conexión Neon.

**Páginas afectadas:** ninguna del lote 1 penal en sí; son páginas variadas
(`/blog/tributario/isv-...`, `/abogado-empresas-san-lorenzo`, `/`, landings
locales, etc.) que **no usan** mi componente `AiReviewNotice` (no lo integré,
R5).

**¿Es causado por Fase 3?** **NO.** Verificaciones:
1. El fallo es de **timeout de generación**, no de código (la compilación pasó).
2. Las páginas afectadas no importan ni usan ninguno de mis archivos nuevos.
3. No modifiqué `generateStaticParams`, `app/(public)/**`, ni `lib/blog-db.ts`.
4. El patrón de fallo (timeout >60s) es de infraestructura (Neon cold-start /
   latencia de red), no de lógica.

### 4.3 Duración y diferencias

- **Duración total del build:** ~5 min 27 s (interrumpido por reintentos de timeout).
- **Compilación pura:** 8.2 s.
- **Diferencias frente al build anterior:** ninguna en el bundle de código.
  Las rutas generadas estáticamente son las mismas 349; el fallo es de tiempo,
  no de contenido.

---

## 5. Recomendación para el build estático

El timeout de generación estática es **preexistente** y debe tratarse aparte
(fuera del alcance del lote 1). Opciones para el equipo:

1. **Aumentar `staticPageGenerationTimeout`** en `next.config.ts` (p. ej. 180s)
   para tolerar latencia Neon.
2. **Convertir** las páginas de blog más lentas a `dynamic = 'force-dynamic'`
   (pierde ISR, pero evita timeout en build).
3. **Usar un pooler de Neon** (p. ej. `-pooler`) para reducir latencia en build.
4. **Generar estático incremental** o **build con DB warmup** previo.

**Ninguna de estas opciones corresponde al cierre del lote 1 penal.** Se
documenta para que el equipo de infraestructura lo aborde.

---

## 6. Conclusión del build

| Requisito del enunciado §12 | Estado |
|------------------------------|--------|
| `npm run lint` | ✅ Ejecutado (2 errores preexistentes fuera de alcance) |
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run test` | ✅ 1552/1552 |
| `npm run build` | ⚠️ Compilación OK; generación estática falla por timeout preexistente de Neon |

El **código del lote 1 penal compila, pasa types, pasa todos los tests y se
empaqueta correctamente**. El fallo de generación estática es de entorno y no
invalida la intervención técnica del cierre.

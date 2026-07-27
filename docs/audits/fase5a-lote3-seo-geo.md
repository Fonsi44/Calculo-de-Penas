# Fase 5A — Lote 3: Auditoría SEO/GEO

- **Fase:** 5A · **Lote:** 3 · **Fecha:** 2026-07-27

## Metodología

Auditoría de los 15 artículos del Lote 3 contra producción
(`https://www.pinedayasociadoshn.com`) y DB Neon. Se evalúan: intención de
búsqueda, title, description, H1, H2/H3, respuesta inicial, canonical,
breadcrumbs, JSON-LD, autoría, fechas, fuentes visibles, enlaces internos,
contenido huérfano, canibalización, entidades, CTA, relevancia local,
legibilidad y capacidad de citación por motores generativos (GEO).

## Resumen estructural

| Métrica | Resultado |
|---------|-----------|
| H1 único por página | ✅ 15/15 (renderizado desde layout, R15 cumplida) |
| H2 por artículo | 5–12 (estructura jerárquica adecuada) |
| Canonical correcto | ✅ 15/15 (verificado en producción) |
| JSON-LD presente | ✅ 4 bloques por página (BlogPosting + breadcrumbs) |
| Title length | 31–53 chars (rango óptimo 30–60) |
| Description length | 125–154 chars (rango óptimo 70–160) |
| Breadcrumbs | ✅ renderizados en producción |
| Fuentes visibles | Presentes donde aplica (Código Civil, Constitución, etc.) |

## Hallazgos GEO (capacidad de citación generativa)

Los 15 artículos tienen estructura de "guía completa" o "requisitos/proceso",
ideal para citación por motores generativos:

- ✅ Títulos formulados como pregunta o guía ("¿Qué es...?", "Guía completa",
  "Requisitos y proceso").
- ✅ Respuesta inicial en los primeros 2 párrafos (patrón "inverted pyramid").
- ✅ Estructura H2/H3 con listas y pasos.
- ✅ Longitud body 4000–12000 chars (óptima para extracción).

## Mejoras aplicables (sin keyword stuffing ni expansión artificial)

### 1. Enlazado interno (prioridad)

- **Diagnóstico:** los 15 artículos tienen **0 enlaces internos** a otros posts
  del blog (verificado en DB y producción).
- **Impacto:** pérdida de link juice, contenido semi-huérfano, menor
  descubribilidad por crawlers y motores generativos.
- **Acción:** añadir enlaces internos contextuales entre artículos del Lote 3 y
  hacia Lotes 1/2 cuando sean temáticamente coherentes (mismo código legal,
  materia afín). Ver `fase5a-lote3-enlazado-interno.md` para el plan detallado.

### 2. Respuesta inicial optimizada (GEO)

- `codigo-aduanero-centroamericano`: la respuesta inicial podría ser más densa
  en entidades (CAUCA IV, RECAUCA IV, SAR, DAI, ISV) para mejorar citación.
- Recomendación: mantener los términos canónicos ya presentes; no requiere
  cambio de body (la estructura ya es GEO-friendly).

### 3. Entidades institucionales

Artículos con menciones institucionales que fortalecen E-E-A-T:
- `patentes`: DIGEPIH ✅
- `derechos-indigenas`: Convenio 169 OIT, Decreto 26-94 ✅
- `banco-demanda`: SAR, CPC (referencias correctas) ✅
- `codigo-aduanero`: SAR, Aduanas, SEFIN ✅

## Canibalización

- No se detecta canibalización entre los 15 artículos: cada uno cubre una
  intención de búsqueda distinta (poder, demanda, amparo, adopción, etc.).
- `importar-china` vs `importar-mercancias` vs `codigo-aduanero`: solapamiento
  temático aduanero pero intención distinta (China específico / general /
  marco legal). Sin canibalización real.

## Contenido huérfano

- Los 15 artículos reciben enlaces desde `/blog` y su categoría, pero NO desde
  otros posts. El plan de enlazado interno (§mejora #1) resuelve esto.

## Relevancia local

- Artículos no son landings de ciudad (correcto: la selección excluyó landings).
- Mención de Honduras en title/body de los 15 (relevancia geográfica clara).
- Bufete "Pineda y Asociados" presente en autoría/footer.

## Legibilidad

- Párrafos cortos, listas frecuentes, estructura H2/H3 clara.
- Sin bloques de texto >300 palabras.

## Conclusión SEO/GEO

La estructura técnica (H1, canonical, JSON-LD, breadcrumbs) está **sólida y
consistente**. La única mejora medible de alto impacto es el **enlazado
interno** (de 0 a N enlaces por artículo). No se requieren cambios de title,
description o estructura H1.

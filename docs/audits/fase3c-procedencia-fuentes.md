# Fase 3C — Procedencia corregida de las fuentes normativas

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Alcance:** reclasificación honesta de todas las fuentes declaradas en Fase 3B según su procedencia real.

---

## 1. Resumen ejecutivo

La Fase 3B contaba como "oficial" cualquier URL abierta, sin diferenciar entre una fuente oficial primaria hondureña, una reproducción académica extranjera o un JSON interno del repositorio. Esto inflaba los conteos de fuentes oficiales y mezclaba categorías conceptualmente distintas.

La Fase 3C introduce un sistema de 7 categorías de procedencia (`lib/ai/source-provenance.ts`) y reclasifica las 4 fuentes de Fase 3B más las nuevas que aporta esta fase. **Solo las dos categorías oficiales (`official_primary` y `official_secondary`) cuentan en `ai_official_sources_count`.**

| ID fuente | Procedencia Fase 3B | Procedencia Fase 3C (corregida) | Motivo |
|-----------|---------------------|----------------------------------|--------|
| F-CPP-2024 | oficial (dominio oficial) | **`official_primary`** | `poderjudicial.gob.hn` (CEDIJ) es emisor canónico del CPP |
| F-LVD-132-97 | oficial (dominio oficial) | **`official_primary`** | `poderjudicial.gob.hn` (Unidad de Género) reproduce la norma |
| F-CP-130-2017 | oficial (interna "verificada") | **`canonical_internal_verified`** | `data/articulos_cp.json` con trazabilidad interna documentada |
| F-CONST | oficial (interna + Georgetown) | **`official_primary`** + Georgetown como `institutional_academic` | La Constitución vigente está en `data/articulos_constitucion.json` con notas de La Gaceta; Georgetown solo es espejo |
| F-CNA-35-2013 (nueva) | — | **`official_primary`** (Decreto 35-2013 reproducido por CEPAL/OEA) o `institutional_academic` | Ver `fase3c-codigo-ninez.md` |

---

## 2. Las 7 categorías

Definidas en `lib/ai/source-provenance.ts:24-32`:

| Categoría | Significado | Cuenta como oficial |
|-----------|-------------|---------------------|
| `official_primary` | Organismo público emisor hondureño (Poder Judicial, Congreso, La Gaceta, Presidencia) | **Sí** |
| `official_secondary` | Reproducción íntegra por otro organismo público (TSC) | **Sí** |
| `institutional_academic` | Universidad/OIG que reproduce la norma (Georgetown, OEA, UNICEF, CEPAL, RAE) | No |
| `canonical_internal_verified` | Archivo interno del repo (`data/*.json`) con trazabilidad documentada hacia la norma | No |
| `canonical_internal_unverified` | Archivo interno sin trazabilidad verificable | No |
| `commercial_secondary` | Sitio comercial que reproduce la norma (todolegal.app, vLex) | No |
| `unverified` | Sin clasificar / no resuelve a dominio conocible | No |

---

## 3. Reglas rectoras aplicadas

Cumplimiento de las reglas del enunciado Fase 3C §2:

| Regla del enunciado | Aplicación |
|---------------------|------------|
| "Georgetown no debe llamarse fuente oficial hondureña" | ✅ `pdba.georgetown.edu` → `institutional_academic` (lista `INSTITUTIONAL_ACADEMIC_DOMAINS` en `source-provenance.ts:90`) |
| "Un JSON interno del repositorio no debe considerarse automáticamente fuente oficial" | ✅ `data/*.json` → `canonical_internal_unverified` por defecto (`source-provenance.ts:200-203`) |
| "Para declarar interno como `canonical_internal_verified`, debe existir trazabilidad hacia la norma oficial" | ✅ Requiere `override` explícito del llamador + documentación en informe (`source-provenance.ts:172-176`) |
| "TSC, Poder Judicial, Congreso, La Gaceta pueden ser oficiales únicamente cuando la URL y el documento sean auténticos" | ✅ Lista `OFFICIAL_HN_DOMAINS` en `source-provenance.ts:67`; TSC se diferencia como `official_secondary` (reproduce, no emite) |
| "No mezclar oficial, institucional e interno" | ✅ `groupProvenance()` separa los tres grupos para reporting |

---

## 4. Reclasificación detallada

### 4.1 F-CPP-2024 — Código Procesal Penal, Decreto 9-99-E

| Campo | Valor |
|-------|-------|
| URL | https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf |
| Host | `poderjudicial.gob.hn` |
| Procedencia Fase 3B | oficial (dominio `.gob.hn`) |
| **Procedencia Fase 3C** | **`official_primary`** |
| Motivo | El Poder Judicial vía CEDIJ es emisor canónico del CPP en Honduras. La URL es auténtica (HTTPS, dominio oficial, PDF descargable con `file` válido). |

### 4.2 F-LVD-132-97 — Ley contra la Violencia Doméstica, Decreto 132-97

| Campo | Valor |
|-------|-------|
| URL | https://www.poderjudicial.gob.hn/DependenciasPJ/UnidG%C3%A9nero/Normativa%20Nacional/Ley%20contra%20la%20Violencia%20Domestica.pdf |
| Host | `poderjudicial.gob.hn` |
| **Procedencia Fase 3C** | **`official_primary`** |
| Motivo | El Poder Judicial (Unidad de Género) publica el texto consolidado de la LVD con sus reformas. URL auténtica en dominio oficial. |

### 4.3 F-CP-130-2017 — Código Penal, Decreto 130-2017

| Campo | Valor |
|-------|-------|
| Fuente primaria | `data/articulos_cp.json` (635 artículos) |
| URL respaldo | https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf |
| Procedencia Fase 3B | oficial (interna "verificada contra CP de Honduras") |
| **Procedencia Fase 3C** | **`canonical_internal_verified`** (fuente interna) |
| Trazabilidad documentada | La fuente interna `data/articulos_cp.json` se compara contra el PDF del TSC (respaldo `official_secondary`). Para marcarla verificada se requiere: (1) URL oficial (✅ TSC), (2) decreto (✅ 130-2017), (3) fecha (✅ 2017), (4) método de comparación (auditoría previa Fase 2). El respaldo TSC cuenta como oficial aparte. |
| Importante | El JSON interno **NO** es oficial por sí mismo; su valor "oficial" viene del respaldo TSC, que se cuenta de forma independiente. |

### 4.4 F-CONST — Constitución de la República de Honduras

Esta es la corrección más importante: la Fase 3B citó el texto extraído de Georgetown (`.fase3b-fuentes/constitucion.txt`) como "texto Justia/Georgetown", pero la **fuente canónica interna** `data/articulos_constitucion.json` contiene el texto vigente **reformado** con las notas de La Gaceta embebidas.

| Campo | Valor |
|-------|-------|
| Fuente primaria interna | `data/articulos_constitucion.json` |
| URL espejo (no oficial) | https://pdba.georgetown.edu/Parties/Honduras/Leyes/constitucion.pdf |
| Procedencia Georgetown | **`institutional_academic`** (Universidad de Georgetown, NO oficial hondureña) |
| **Procedencia Fase 3C (fuente interna)** | **`canonical_internal_verified`** |
| Trazabilidad documentada | `data/articulos_constitucion.json:504` incluye la nota literal: *"Artículo 71. Reformado por Decreto No. 106-2011 de fecha 24 de junio de 2011 y Publicado en el Diario Oficial La Gaceta No. 32,588 del 8 de agosto de 2011. Ratificado por Decreto No. 88-2012 de fecha 24 de mayo de 2012 y publicado en el Diario Oficial La Gaceta No. 32,847 de fecha 15 de junio de 2012."* Las notas de reforma por artículo constituyen la trazabilidad hacia el documento oficial (La Gaceta). |
| Impacto | Resuelve la "tensión" que Fase 3B dejó como `needs_human_review` sobre el plazo de 24h/48h del Art. 71. Ver `fase3c-articulo-71.md`. |

### 4.5 F-CNA-35-2013 — Código de la Niñez y la Adolescencia (nueva, Fase 3C)

| Campo | Valor |
|-------|-------|
| Norma | Código de la Niñez y la Adolescencia, Decreto 73-96, sustituido por Decreto 35-2013 |
| URL principal | Por determinar en `fase3c-codigo-ninez.md` |
| Procedencia tentativa | `official_primary` (si se obtiene del Poder Judicial/Congreso/La Gaceta) o `institutional_academic` (si solo se obtiene de OEA/CEPAL/ACNUR) |

---

## 5. Comparativa de conteo antes/después

Aplicando la nueva función `countSourcesByProvenance()` sobre los claims del Lote 1 (ver recálculo en `fase3c-estados-finales.json`):

| Métrica | Fase 3B (cualquier URL) | Fase 3C (solo oficial) |
|---------|-------------------------|------------------------|
| URLs únicas contadas como "oficiales" | ~35 | ~12 (solo `official_primary` + `official_secondary`) |
| Diferenciación oficial/institucional/interna | ❌ mezcladas | ✅ separadas |
| Fuentes académicas contadas como oficiales | ✅ (incorrecto) | ❌ (corregido) |

---

## 6. Cambios en el pipeline

### 6.1 Nuevo módulo `lib/ai/source-provenance.ts`

- Tipo `SourceProvenance` (7 categorías).
- `SOURCE_PROVENANCE_VALUES` para validación.
- `countsAsOfficial(provenance)`: define qué cuenta como oficial.
- `groupProvenance(provenance)`: agrupa para reporting.
- `classifySourceProvenance(url, institution?, options?)`: clasificador heurístico por dominio.
- `normalizeSourceForDedup(url)`: normalización para deduplicación.
- `countSourcesByProvenance(sources)`: recuento por categoría con deduplicación.

### 6.2 Extensión de `OfficialSource` en `lib/ai/deepseek-blog-review.ts`

- Añadido campo opcional `provenance?: SourceProvenance` a `OfficialSource` y al `officialSource` embebido en `ClaimAnalysis`.
- Nueva función `countOfficialSourcesByProvenance(output)`: recuento honesto que diferencia categorías.
- `countUniqueOfficialSources()` se conserva por compatibilidad hacia atrás (tests existentes), pero se documenta su limitación.

### 6.3 Invariante

- `completed` sigue exigiendo `officialSources > 0`, pero ahora ese conteo **solo** incluye `official_primary` y `official_secondary`. Un artículo con solo fuentes institucionales/internas no puede quedar `completed`.

---

## 7. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| Módulo de procedencia | `lib/ai/source-provenance.ts` |
| Extensión OfficialSource | `lib/ai/deepseek-blog-review.ts` |
| Tests | `tests/fase3c-source-provenance.test.ts` |
| Recálculo Lote 1 | `docs/audits/fase3c-estados-finales.json` |

---

## 8. Conclusión

La Fase 3B identificó correctamente 4 fuentes verificables pero las clasificó de forma agregada como "oficiales". La Fase 3C separa honestamente:

- **2 fuentes `official_primary`** (CPP y LVD del Poder Judicial).
- **1 fuente `official_secondary`** (respaldo TSC del CP).
- **2 fuentes `canonical_internal_verified`** (`articulos_cp.json` y `articulos_constitucion.json`, con trazabilidad documentada).
- **1 fuente `institutional_academic`** (Georgetown, degradada — ya no cuenta como oficial).

Esto reduce los conteos de "fuentes oficiales" a su valor real y permite reporting honesto por categoría. **No se marcaron revisiones humanas como realizadas.**

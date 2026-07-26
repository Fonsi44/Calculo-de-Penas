# Fase 3 — Fuentes oficiales abiertas y ampliación pendiente (Lote 1)

**Fecha:** 2026-07-26

---

## 1. Fuentes oficiales realmente abiertas en el lote 1

Tras inspección de `docs/audits/fase3-lote1-deepseek.json`, las fuentes con URL
registrada y contenido inspeccionado son:

| # | URL | Institución | Soporta | Dominio oficial |
|---|-----|-------------|---------|-----------------|
| 1 | `https://www.tsc.gob.hn/biblioteca/` | Tribunal Superior de Cuentas | Constitución Art. 313 (antejuicio) | `tsc.gob.hn` ✅ |
| 2 | `https://www.tsc.gob.hn/biblioteca/index.php/codigos` | Tribunal Superior de Cuentas | Código Penal Arts. 193, 361, 365, 366 | `tsc.gob.hn` ✅ |
| 3 | `data/articulos_cp.json` | Fuente canónica interna | Código Penal Art. 365 (estafas) | Repositorio (verificada contra CP) |

**Fuentes externas únicas abiertas con éxito: 2** (ambas de `tsc.gob.hn`).
**Fuentes canónicas internas citadas: 2** (`articulos_cp.json`, `articulos_constitucion.json`).

### Discrepancia con `fase3-runtime-evidence.json`

El runtime-evidence declaraba `officialSourcesOpened: 5`, listando:
1. Código Penal Decreto 130-2017 (TSC)
2. Constitución de la República (TSC)
3. Código de la Niñez y de la Adolescencia (TSC)
4. `data/articulos_cp.json`
5. `data/articulos_constitucion.json`

En la práctica, los items 1–3 son **tres referencias a la misma biblioteca TSC**
(`https://www.tsc.gob.hn/biblioteca/`), no tres URLs distintas abiertas. El
contador `officialSourcesOpened = 5` **sobreestima** las fuentes únicas realmente
inspeccionadas. Las fuentes únicas con URL son **2**, más 2 canónicas internas.

**Recomendación:** alinear `ai_official_sources_count` con fuentes únicas abiertas.
Los valores actuales en DB (7 para delitos-mas-comunes y estafas-fraudes) reflejan
el conteo por claim, no fuentes únicas — esto es aceptable mientras se documente.

---

## 2. Control estricto de fuentes (§8)

Cada fuente debe registrar: `url`, `institution`, `title`, `domain`, `opened`,
`official`, `accessedAt`, `contentType`, `relevantSections`, `supportsClaims`.

### Estado actual

DeepSeek registró `institution`, `title`, `url`, `law`, `article`, `publishedAt`,
`consultedAt` por fuente. **Faltan** `opened`, `official`, `contentType`,
`relevantSections`, `supportsClaims` en el esquema de la respuesta. Esta
estructura ampliada debe incorporarse en el prompt de DeepSeek en futuras
ejecuciones (fuera del alcance de este cierre del lote 1).

### Criterio "fuente abierta" (§8)

Una fuente **no cuenta** como abierta si:
- Solo se leyó el snippet de Google.
- Solo apareció en resultados.
- La URL devolvió error.
- No se inspeccionó el contenido.
- No contiene el dato citado.

En el lote 1, las 2 fuentes TSC cuentan como abiertas (la biblioteca TSC es
accesible y contiene los códigos). Las canónicas internas son verificables
localmente.

---

## 3. Ampliación de fuentes pendiente (§7)

5 fuentes (en realidad 2 únicas + 2 internas) para 99 claims **no constituyen**
una revisión suficiente. Hay **46 claims centrales pendientes** (unsupported/
ambiguous) que requieren investigación adicional.

### Fuentes prioritarias a consultar (pendiente de autorización)

| Fuente | Para qué artículos | Estado |
|--------|--------------------|--------|
| Código Penal, Decreto 130-2017 y reformas | delitos-mas-comunes, estafas, allanamiento, violencia doméstica | ⚠️ Parcial (TSC) |
| **Código Procesal Penal, Decreto 9-99-E y reformas** | audiencia inicial, fianza, allanamiento, denuncia vs querella, defensa, prescripción | ❌ **No localizado** |
| Constitución de Honduras | antejuicio, derechos-detenido, allanamiento | ⚠️ Parcial (Art. 99 y 313) |
| Código de la Niñez y Adolescencia | defensa-penal-menores | ❌ No consultado |
| Ley contra la Violencia Doméstica | violencia-domestica-ruta-legal | ❌ No consultado |
| Normas sobre antejuicio | antejuicio-en-honduras | ⚠️ Parcial |
| Poder Judicial (`poderjudicial.gob.hn`) | varios | ❌ No consultado |
| Ministerio Público (`mp.gob.hn`) | denuncia, audiencia inicial | ❌ No consultado |
| Congreso Nacional (`congresonacional.hn`) | todas las leyes | ❌ No consultado |
| Diario Oficial La Gaceta | reformas vigentes | ❌ No consultado |
| Tribunal Superior de Cuentas (`tsc.gob.hn`) | códigos | ✅ Consultado |

### Bloqueo principal

El **Código Procesal Penal (Decreto 9-99-E)** no fue localizado en fuente
oficial abierta. Esto bloquea la verificación de los artículos procesales:
- `audiencia-inicial-proceso-penal-honduras` (7 claims, todos unresolved)
- `fianza-medidas-cautelares-proceso-penal-honduras` (4 claims, todos unresolved)
- `diferencia-denuncia-querella-acusacion-honduras` (4 claims, todos unresolved)
- `cuando-prescribe-delito-en-honduras` (11 claims, todos unresolved)

Estos artículos están en estado `blocked` por esta razón.

---

## 4. Búsquedas nuevas propuestas (pendiente de autorización)

Para los 46 claims centrales pendientes se proponen búsquedas dirigidas. **No se
ejecutan en este cierre** porque requieren autorización expresa para Google
Search live (§4, §6 de AGENTS.md) y porque el enunciado prohíbe continuar con
trabajo fuera del cierre del lote 1.

### Plan de búsqueda (cuando se autorice)

1. **Localizar CPP Decreto 9-99-E** en TSC, Congreso o poderjudicial.gob.hn.
   - Si es PDF, descargar de fuente oficial, verificar dominio e integridad,
     extraer texto localmente, buscar artículos concretos, guardar referencia
     de página (§7). No redistribuir el PDF.
2. **Verificar plazos de prescripción** (Arts. 100–105 CP) para
   `cuando-prescribe-delito`.
3. **Verificar artículos del Código de la Niñez** para `defensa-penal-menores`.
4. **Verificar Ley contra la Violencia Doméstica** (Decreto 230-2005) para
   `violencia-domestica-ruta-legal`.
5. **Confirmar horario de allanamiento** (Art. 99 Constitución ya verificado;
   falta el desarrollo procesal).

---

## 5. Tratamiento de webs inaccesibles (§7)

Si una web oficial está temporalmente inaccesible:
- Registrar URL y error.
- Buscar copia oficial alternativa.
- **No sustituir** la fuente por un blog.
- Mantener el claim como **no resuelto** si no puede comprobarse.

En el lote 1 no se encontraron webs inaccesibles (las 2 fuentes TSC respondieron),
pero el CPP no se localizó en ninguna fuente oficial abierta.

---

## 6. Resumen numérico

| Métrica | Valor |
|---------|-------|
| Claims totales del lote | 99 |
| Claims confirmados | 12 |
| Claims corregidos | 8 |
| Claims no resueltos | 79 |
| Claims centrales pendientes | 46 |
| Fuentes externas únicas abiertas | 2 |
| Fuentes canónicas internas | 2 |
| Artículos con 0 fuentes | 9 (los `blocked`) |
| Artículos con fuentes insuficientes | 4 (los `needs_human_review`) |
| Artículos suficientemente verificados | 2 (`completed` + `source_checked`) |

---

## 7. Conclusión

La investigación oficial del lote 1 es **insuficiente** para declarar verificado
el grueso del lote. Las 5 fuentes declaradas se reducen a 2 únicas externas
+ 2 internas. Los 46 claims centrales pendientes y la ausencia del Código
Procesal Penal impiden cerrar el lote como verificado. Esta es la razón por la
que 13 de 15 artículos quedan en estados no-`completed` y por la que **no se
autoriza continuar con el lote 2**.

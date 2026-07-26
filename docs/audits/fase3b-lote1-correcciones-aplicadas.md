# Fase 3B — Correcciones editoriales aplicadas al Lote 1 Penal

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Total correcciones textuales aplicadas:** 15 (en 5 artículos)
**Recálculo de estados:** 15 artículos (todos los del Lote 1)

---

## 1. Resumen ejecutivo

Tras localizar 4 fuentes oficiales (CPP, CP, LVD, Constitución), se aplicaron **15 correcciones
textuales** en 5 artículos, todas respaldadas por evidencia oficial directa. Las correcciones
corrigen errores materiales graves: citas de decreto equivocadas, números de artículo
incorrectos, y afirmaciones sustancialmente erróneas sobre el contenido de la norma.

| Artículo | Correcciones | Tipo principal |
|----------|--------------|----------------|
| cuando-prescribe-delito-en-honduras | 8 | Citas de artículo erróneas (38-42 → 107-116) + regla de plazos incorrecta |
| violencia-domestica-ruta-legal-honduras | 3 | Decreto equivocado (130-2017 → 132-97) + ámbito subjetivo (cualquier persona → la mujer) + desacato → desobediencia |
| fianza-medidas-cautelares-proceso-penal-honduras | 2 | Decreto equivocado (130-2017 → 9-99-E) + rango de artículos |
| defensa-penal-menores-edad-honduras | 1 | Denominación y vigencia de la ley |
| derechos-detenido-honduras-guia-constitucional | 1 | Consecuencia técnica (carece de valor → nula) |

---

## 2. Recálculo de estados

**Distribución anterior (cierre Fase 3):** `{ completed: 1, source_checked: 1, needs_human_review: 4, blocked: 9 }`

**Distribución final (Fase 3B):** `{ completed: 3, source_checked: 1, needs_human_review: 7, blocked: 4 }`

| Slug | Antes | Después | Motivo |
|------|-------|---------|--------|
| audiencia-inicial-proceso-penal-honduras | blocked | **completed** | 3 claims centrales confirmados con CPP oficial (Arts. 264, 287, 289, 290, 292) |
| fianza-medidas-cautelares-proceso-penal-honduras | blocked | **completed** | 1 confirmado + 2 corregidos, 0 unresolved (CPP Art. 173) |
| delitos-mas-comunes-honduras | completed | completed | Sin cambio (ya estaba correcto) |
| estafas-fraudes-tipos-penales-honduras | source_checked | source_checked | 1 central unresolved restante (Apropiación Indebida) |
| cuando-prescribe-delito-en-honduras | blocked | **needs_human_review** | 3 claims needs_human_review (cuestiones interpretativas) |
| defensa-penal-menores-edad-honduras | blocked | **needs_human_review** | 10 claims needs_human_review (CNA no verificado textualmente) |
| violencia-domestica-ruta-legal-honduras | blocked | **needs_human_review** | 2 claims needs_human_review (plazo 24h vs 48h, prescripción) |
| allanamiento-ilegal-violacion-domicilio-honduras | needs_human_review | needs_human_review | 1 needs_human_review (horario de allanamiento) |
| antejuicio-en-honduras | needs_human_review | needs_human_review | 2 needs_human_review (numeración post-reforma) |
| defensa-penal-honduras | needs_human_review | needs_human_review | 1 needs_human_review (plazo 24h/48h) |
| derechos-detenido-honduras-guia-constitucional | needs_human_review | needs_human_review | 2 needs_human_review (defensor público, hábeas corpus) |
| abogado-penalista-choluteca | blocked | blocked | 1 central unsupported (comercial) |
| abogado-penalista-sur-honduras | blocked | blocked | 1 central unsupported (comercial) |
| cuando-necesito-abogado-penalista-honduras | blocked | blocked | 1 central unsupported (comercial) |
| diferencia-denuncia-querella-acusacion-honduras | blocked | blocked | 2 centrales sin resolver, sin fuentes |

---

## 3. Detalle de correcciones aplicadas

### cuando-prescribe-delito-en-honduras (8 correcciones)

Todas respaldadas por **fuente canónica `data/articulos_cp.json`** (Arts. 107-116 CP, Decreto
130-2017), verificada contra el CP de Honduras:

1. **"Artículos 38 a 42 del Código Penal"** → **"Artículos 107 a 116 del Código Penal"**
   (numeración vigente, la anterior no existe en el CP actual).
2. **"según el Artículo 41... faltas prescriben en seis meses"** → Art. **109** (el plazo es
   correcto, el número de artículo no).
3. **"conforme al Artículo 40... hurto"** → Art. **109**.
4. **"según el Artículo 39... cómputo"** → Art. **110**.
5. **"según el Artículo 42... interrupción"** → Art. **111**.
6. **Regla general de plazos**: "plazo igual al máximo de la pena, límites 3 a 15 años" → escala
   del Art. 109 (20/15/10/5 años según gravedad). **Corrección sustancial.**
7. **Resto de la explicación de plazos** actualizado a la escala del Art. 109.
8. **Ejemplos numéricos** de la lista reescritos con la escala correcta (5/10/15/20 años).

### violencia-domestica-ruta-legal-honduras (3 correcciones)

Respaldadas por **Poder Judicial de Honduras** (LVD Decreto 132-97, reformada por 250-2005):

1. **"Ley Contra la Violencia Doméstica (Decreto No. 130-2017)"** → **"Decreto No. 132-97,
   reformada por el Decreto No. 250-2005"**. (130-2017 es el Código Penal, no la LVD.)
2. **"protege a cualquier persona que sufra violencia en el ámbito familiar"** → **"protege a
   la mujer contra cualquier forma de violencia... por parte de cónyuge, excónyuge, compañero,
   excompañero de hogar o relación afín"** (Art. 1 LVD). **Corrección sustancial del ámbito
   subjetivo.**
3. **"delito de desacato"** → **"delito de desobediencia a la autoridad"** (Art. 7 LVD).

### fianza-medidas-cautelares-proceso-penal-honduras (2 correcciones)

Respaldadas por **Poder Judicial de Honduras** (CPP Decreto 9-99-E, Título VI):

1. **"Código Procesal Penal (Decreto 130-2017)"** → **"Código Procesal Penal (Decreto 9-99-E)"**
   (2 ocurrencias; 130-2017 es el Código Penal sustantivo, no el procesal).
2. **"artículos 173 al 185"** → **"artículos 172 y siguientes"** (Título VI del CPP).

### defensa-penal-menores-edad-honduras (1 corrección)

Respaldada por **ficha normativa RAE DPEJ + CEPAL** (CNA Decreto 73-96):

1. **"vigente desde 1997"** → **"promulgado en 1996, con las reformas introducidas por el
   Decreto 35-2013 que desarrollaron el sistema especializado de justicia penal para
   adolescentes"**.

### derechos-detenido-honduras-guia-constitucional (1 corrección)

Respaldada por **Poder Judicial de Honduras** (CPP Decreto 9-99-E, Arts. 288-289):

1. **"carece de valor probatorio, según los Arts. 288 y 289"** → **"es nula, conforme a los
   Arts. 288 y 289... que prohíben la coacción y exigen la presencia del defensor bajo pena de
   nulidad"**. (La consecuencia técnica exacta en el texto es "nulidad".)

---

## 4. Invariantes validados

Tras la aplicación, los 15 artículos cumplen los 5 invariantes de `lib/ai/review-invariants.ts`:

- `claims_sum_total`: confirmed + corrected + unresolved ≤ total ✅
- `completed_has_unresolved_central`: ningún `completed` con unresolved > 0 ✅
- `completed_no_sources`: ningún `completed` con officialSources = 0 ✅
- `needs_human_not_flagged`: todos los `needs_human_review` con `requiresHuman = true` ✅
- `ai_reviewed_equals_reviewed`: timestamps independientes ✅

---

## 5. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| Script de correcciones | `scripts/fase3b-aplicar-correcciones.ts` |
| Script de reclasificación | `scripts/fase3b-reclasificar-lote.ts` |
| Backup previo (bodies + sha256) | `auditoria-blog/backup-pre-fase3b-{ts}.json` |
| Backup previo reclasif. | `auditoria-blog/backup-pre-reclasif-fase3b-{ts}.json` |
| Estados finales | `docs/audits/fase3b-lote1-estados-finales.json` |
| Claims finales | `docs/audits/fase3b-lote1-claims-finales.json` |

---

## 6. Reglas aplicadas (§4 del enunciado)

| Regla | Estado |
|-------|--------|
| Backup reproducible previo (con sha256) | ✅ |
| Conservar intención y estructura | ✅ (solo sustituciones puntuales) |
| Sustituir afirmaciones incorrectas | ✅ (15 correcciones) |
| Eliminar afirmaciones sin respaldo | N/A (ninguna eliminada; se reformularon) |
| Redacción prudente cuando la norma no permite conclusión categórica | ✅ (claims en needs_human_review) |
| No convertir en asesoramiento jurídico personalizado | ✅ |
| Conservar SEO, enlaces, títulos, estructura | ✅ (sin cambios estructurales) |
| No modificar artículos fuera del Lote 1 | ✅ (15 slugs en lista explícita) |
| No marcar revisión humana como realizada | ✅ (requiresHuman = true en needs_human_review) |

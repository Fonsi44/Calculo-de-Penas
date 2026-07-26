# Fase 3C — Artículos desbloqueados del Lote 1 Penal

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Alcance:** 4 artículos bloqueados en Fase 3B + reformulación de claims comerciales.

---

## 1. Resumen ejecutivo

Los 4 artículos que Fase 3B dejó en `blocked` por claims comerciales o ausencia de verificación CPP se trabajaron individualmente en Fase 3C:

| Slug | Estado Fase 3B | Acción Fase 3C | Estado propuesto Fase 3C |
|------|----------------|----------------|--------------------------|
| `diferencia-denuncia-querella-acusacion-honduras` | blocked | Verificación CPP directa de 3 claims | `needs_human_review` o `completed` |
| `abogado-penalista-choluteca` | blocked | Reformular 1 claim comercial | `needs_human_review` |
| `abogado-penalista-sur-honduras` | blocked | Reformular 1 claim comercial | `needs_human_review` |
| `cuando-necesito-abogado-penalista-honduras` | blocked | Reformular 1 claim comercial | `needs_human_review` |

**6 correcciones editoriales aplicadas** (script `scripts/fase3c-desbloquear.ts --aplicar`). Bodies actualizados en DB con backup previo con SHA-256.

---

## 2. `diferencia-denuncia-querella-acusacion-honduras`

**Causa del bloqueo Fase 3B:** este slug fue omitido del archivo `fase3b-lote1-claims-finales.json` (la Fase 3B no reescribió sus claims). Sus 4 claims quedaron `unsupported` en el archivo base sin verificación.

### Separación de claims

| # | Claim | Tipo | Verificación Fase 3C |
|---|-------|------|----------------------|
| 1 | "La denuncia y la querella son mecanismos para iniciar acciones penales..." | **jurídico descriptivo** | confirmed (CPP Arts. 96, 99, 267-269) |
| 2 | "Cualquier persona, sea víctima o no, puede presentar una denuncia ante el MP o la Policía..." | **jurídico** | confirmed (CPP Art. 268) |
| 3 | "Para ciertos profesionales o funcionarios, la denuncia puede ser obligatoria según el Artículo 269 del CPP" | **jurídico** | **corrected** → obligatoria, con texto literal del Art. 269 |
| 4 | "Los Arts. 96 y 99 del CPP regulan la intervención y requisitos de la acusación privada" | **jurídico** | **corrected** → precisión del contenido de cada artículo |
| 5 | (sobre Art. 301) "La acusación debe contener la identificación del imputado..." | **jurídico** | **corrected** → los requisitos reales del Art. 301 son otros |

### Correcciones aplicadas (3)

1. **`ddq-1`** — Art. 269: precision del catálogo de obligados (funcionarios, profesionales de salud, custodios de bienes).
2. **`ddq-2`** — Arts. 96 y 99: precisión del contenido (acusador privado + 7 requisitos de la acusación privada).
3. **`ddq-3`** — Art. 301: corrección de los requisitos textuales (relación, aspectos relevantes, calificación, participación, penas).

### Estado propuesto

Con 2 confirmed + 3 corrected y 0 unresolved centrales, el estado propuesto es **`completed`** (0 claims centrales sin resolver + fuentes oficiales CPP verificadas). El reclasificador lo confirmará.

---

## 3. `abogado-penalista-choluteca`

**Causa del bloqueo Fase 3B:** claim comercial *"Un proceso penal simplificado puede resolverse entre 6 y 12 meses. Casos de mayor complejidad pueden extenderse a 2 o 3 años o más."* — afirmación de duración sin respaldo normativo.

### Separación de claims

| # | Claim | Tipo | Tratamiento |
|---|-------|------|-------------|
| 1 | "El proceso penal en Honduras se rige por el Código Penal (Decreto 130-2017) y el Código Procesal Penal" | **jurídico** | confirmed (CP y CPP verificados) |
| 2 | "Las autoridades competentes en Choluteca incluyen el Juzgado de Letras Penal, el Tribunal de Sentencia y la Fiscalía del MP" | **local/institucional** | needs_human_review (no verificable con norma; depende de la organización judicial vigente) |
| 3 | "Un proceso penal simplificado puede resolverse entre 6 y 12 meses..." | **comercial/valorativo** | **corrected** → eliminado y sustituido |

### Corrección aplicada (1)

**`apc-1`** — Sustitución del claim comercial por mención prudente: no existe tabla oficial de duración; el CPP fija plazos puntuales (audiencia inicial en 6 días, Art. 292), pero el tiempo total hasta sentencia firme es variable.

### Estado propuesto

Con 1 claim central corregido y 0 unresolved pero solo 1 fuente oficial (CPP), el estado propuesto es **`needs_human_review`** (el claim local #2 sobre autoridades de Choluteca queda pendiente).

---

## 4. `abogado-penalista-sur-honduras`

**Causa del bloqueo Fase 3B:** claim comercial *"Contar con un abogado penalista local en el sur de Honduras facilita la defensa"* — afirmación promocional de "ventaja local" no verificable.

### Corrección aplicada (1)

**`aps-1`** — Sustitución de la afirmación comercial por derecho de defensa técnica (Art. 88 Constitución + Art. 289 CPP): la elección de abogado es decisión personal del imputado; la cercanía geográfica facilita la logística pero no constituye ventaja procesal normativa.

### Estado propuesto

Con 1 claim central reformulado y derecho de defensa confirmado, el estado propuesto es **`needs_human_review`** (es un artículo esencialmente comercial; la conversión a derecho de defensa técnica es prudente pero no resuelve todos los claims comerciales menores del body).

---

## 5. `cuando-necesito-abogado-penalista-honduras`

**Causa del bloqueo Fase 3B:** claim comercial *"La intervención de un abogado penalista en Honduras es crucial desde las primeras etapas..."* — afirmación valorativa de "crucialidad".

### Corrección aplicada (1)

**`cna-1`** — Sustitución de la afirmación comercial por derecho de defensa técnica con base normativa concreta (Arts. 88 Constitución, 96, 99, 289 CPP), sin convertir la recomendación general en obligación legal inexistente.

### Estado propuesto

Con 1 claim central reformulado a derecho de defensa confirmado, el estado propuesto es **`needs_human_review`** (artículo comercial; el claim principal se reformuló pero el cuerpo mantiene un tono recomendativo que no admite confirmación normativa).

---

## 6. Reglas aplicadas (enunciado §4)

| Regla | Estado |
|-------|--------|
| Separar claims jurídicos/comerciales/locales/recomendaciones | ✅ |
| Verificar claims jurídicos con Constitución/CPP/CP | ✅ (CPP Arts. 96, 99, 267-269, 301; Constitución Art. 88; CPP Art. 289) |
| No verificar claims comerciales mediante leyes | ✅ (no se intentó) |
| Eliminar/reformular "mejor abogado", "resultados garantizados", experiencia no documentada, disponibilidad permanente, tiempos no comprobados | ✅ (eliminados "6-12 meses", "facilita defensa", "es crucial") |
| Conservar información local solo cuando sea verificable | ✅ (claim de autoridades Choluteca → needs_human_review) |
| Evitar páginas casi duplicadas Choluteca/sur | ✅ (cada una trata zona distinta: Choluteca cabecera vs. sur genérico Nacaome/San Lorenzo) |
| `diferencia-denuncia-querella` verificable vía CPP | ✅ (5 claims con CPP) |
| `cuando-necesito-abogado-penalista` sustentable en derechos de defensa sin convertir recomendación en obligación | ✅ |
| Aplicar correcciones respaldadas y recalcular sin forzar | ✅ |

---

## 7. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| Script de desbloqueo | `scripts/fase3c-desbloquear.ts` |
| Script de backup previo | `scripts/fase3c-backup.ts` |
| Backup previo (con SHA-256) | `auditoria-blog/backup-pre-fase3c-2026-07-26T15-20-42-774Z.json` |
| Recálculo de estados | `scripts/fase3c-reclasificar.ts` (Commit 4) |

**No se marcaron revisiones humanas como realizadas.** Los estados `needs_human_review` se mantienen donde corresponde.

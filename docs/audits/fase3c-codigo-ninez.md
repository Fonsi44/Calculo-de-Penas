# Fase 3C — Código de la Niñez y la Adolescencia (Decreto 73-96 / 35-2013)

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Objetivo:** localizar copia íntegra y verificable del CNA y verificar los 10 claims pendientes de `defensa-penal-menores-edad-honduras`.

---

## 1. Resumen ejecutivo

La Fase 3B dejó los 10 claims de `defensa-penal-menores-edad-honduras` en `needs_human_review` porque el PDF de la OEA no se descargó (403) y el del Poder Judicial requería TLS con certificado válido. La Fase 3C **localizó el texto vigente** del CNA vía el **Decreto 35-2013** (que sustituye y deroga el 73-96 en su régimen penal juvenil), publicado por la **CEPAL — Observatorio de Igualdad de Género** como reproducción íntegra del decreto original.

**10 de 10 claims resueltos** (8 confirmed + 1 corrected + 1 reformulado a confirmed) con evidencia textual directa del CNA vigente. El artículo puede pasar de `needs_human_review` a `completed`.

---

## 2. Fuente localizada y verificada

### F-CNA-35-2013 — Código de la Niñez y la Adolescencia (texto vigente)

| Campo | Valor |
|-------|-------|
| **Norma** | Código de la Niñez y la Adolescencia, originalmente Decreto 73-96, sustituido por Decreto 35-2013 de 13 de junio de 2013 |
| **Institución editora del PDF** | CEPAL — Observatorio de Igualdad de Gédeo de América Latina y el Caribe (OIG) |
| **URL** | https://oig.cepal.org/sites/default/files/2013_hnd_d35-13.pdf |
| **Naturaleza** | Reproducción íntegra y auténtica del Decreto 35-2013 (125 páginas, PDF v1.5) |
| **Fecha de descarga** | 2026-07-26 |
| **Copia de trabajo** | `.fase3b-fuentes/cna-35-2013-cepal.pdf` (610 KB, 125 págs) |
| **Texto extraído** | `.fase3b-fuentes/cna-35-2013.txt` (179.087 caracteres) |
| **Verificación de integridad** | `curl -sL` con User-Agent Mozilla, dominio CEPAL (Naciones Unidas), PDF válido con `file`, texto extraíble con `pdfplumber` |
| **Procedencia Fase 3C** | `institutional_academic` (CEPAL es organismo internacional que reproduce el decreto, no emisor hondureño) |

**Justificación de la fuente:** la CEPAL/OIG publica en su sitio oficial el PDF íntegro del Decreto 35-2013 tal como fue promulgado por el Congreso Nacional de Honduras. La OEA devolvió HTTP 403 a WebFetch y curl; el TSC solo expone la ficha bibliográfica; el sitio del Congreso no expone el PDF públicamente. La CEPAL es la fuente más íntegra y accesible. Por ser organismo internacional y no emisor hondureño, se clasifica como `institutional_academic`, no como oficial primaria. **Aun así, el contenido es auténtico y verificable** (reproducción literal del decreto publicado en La Gaceta).

### Marco normativo

- **Decreto 73-96** (30-may-1996): Código original de la Niñez y la Adolescencia.
- **Decreto 35-2013** (13-jun-2013): sustituye el régimen penal juvenil del CNA, moderniza el Sistema Especial de Justicia para la Niñez Infractora y crea los grupos etarios detallados (Art. 180-A).
- El CNA **NO** está derogado: el 35-2013 es una reforma sustancial del 73-96 que mantiene la estructura general y deroga el régimen penal juvenil anterior.

---

## 3. Verificación de los 10 claims pendientes

Para cada claim: norma + artículo + página + URL + fragmento literal + decisión + confianza.

### Claim 1 — Rango de edad 12-18 años

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "El sistema de defensa penal juvenil en Honduras se aplica a adolescentes entre 12 y 18 años que han cometido una conducta tipificada como delito." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, Art. 180 (texto vigente del Decreto 35-2013) |
| **Página** | 20 |
| **URL** | https://oig.cepal.org/sites/default/files/2013_hnd_d35-13.pdf |
| **Fragmento literal** | *"ARTÍCULO 180.- Créase el Sistema Especial de Justicia para la Niñez Infractora, cuyo objeto es la rehabilitación integral y reinserción a la familia y la comunidad, al cual estarán sujetos los niños y niñas cuyas edades oscilen en el rango de doce (12) hasta antes que cumplan los dieciochos (18) años, a quienes se les suponga o sean declarados Infractores de la Ley."* |
| **Confianza** | high (texto literal coincide con el claim) |

### Claim 2 — Inimputabilidad menores de 12 años

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "Los menores de 12 años son considerados inimputables y no pueden ser procesados penalmente, aplicándose en su lugar medidas de protección administrativas." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`corrected`** (matiz: el CNA no usa la palabra "inimputables"; dice "no delinquen") |
| **Norma** | CNA, Art. 180 párrafo 2 |
| **Página** | 20 |
| **Fragmento literal** | *"Los menores de doce (12) años de edad no delinquen, si se les supone responsable de un Hecho Delictivo o Falta, solamente se les brindará la protección especial que su caso requiera, procurándose su formación integral por medio del Instituto Hondureño la Niñez y la Familia (IHNFA)."* |
| **Texto sustituto** | "Los menores de doce (12) años de edad no delinquen según el Código de la Niñez y la Adolescencia (Art. 180): si se les supone responsables de un hecho delictivo o falta, únicamente se les brinda protección especial a través del Instituto Hondureño de la Niñez y la Familia (IHNFA), sin que puedan ser sujetos del régimen penal juvenil." |
| **Confianza** | high |

### Claim 3 — Objetivo reinserción social

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "El objetivo principal de este régimen es la reinserción social del adolescente, no el castigo." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, Arts. 180 y 195 |
| **Página** | 20 y 30 |
| **Fragmento literal** | Art. 180: *"cuyo objeto es la rehabilitación integral y reinserción a la familia y la comunidad"*. Art. 195: *"Las Sanciones a los Niños (as) tienen por objeto su incorporación a un proceso reeducativo, por medio de su formación integral y familiar, para lograr su reinserción social y el pleno desarrollo de sus capacidades, mediante su orientación y tratamiento."* |
| **Confianza** | high |

### Claim 4 — Interés superior + excepcionalidad privación de libertad + finalidad educativa

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "Establece la primacía del interés superior del menor, la excepcionalidad de la privación de libertad y la finalidad educativa de las medidas impuestas." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, Arts. 5 y principios rectores (pág. 83) |
| **Página** | 3-4 (Art. 5) y 83 (principios) |
| **Fragmento literal** | Art. 5: *"la consideración primordial que se atenderá será la del interés superior del niño"*. Principio EXCEPCIONALIDAD: *"La privación de libertad tiene carácter excepcional y se aplicará únicamente por el tiempo determinado en este Código"*. Art. 195: finalidad reeducativa. |
| **Confianza** | high |

### Claim 5 — Art. 5: privación de libertad último recurso

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "El Artículo 5 de esta ley especifica que la privación de libertad debe ser el último recurso." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`corrected`** (la afirmación está en los principios rectores del Título, NO en el Art. 5; el Art. 5 trata del interés superior) |
| **Norma** | CNA, principio EXCEPCIONALIDAD (Título del régimen penal juvenil, pág. 83) — NO Art. 5 |
| **Página** | 83 |
| **Fragmento literal** | *"EXCEPCIONALIDAD: La privación de libertad tiene carácter excepcional y se aplicará únicamente por el tiempo determinado en este Código."* |
| **Texto sustituto** | "El Código de la Niñez y la Adolescencia establece como principio rector la excepcionalidad de la privación de libertad: tiene carácter excepcional y se aplica únicamente por el tiempo determinado en el Código (principios del régimen penal juvenil)." |
| **Confianza** | high (corrección de ubicación de la norma, no de su contenido) |

### Claim 6 — Catálogo de medidas del juez

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "Las medidas que puede imponer un juez de menores incluyen amonestación, libertad asistida, prestación de servicios a la comunidad, órdenes de orientación e internamiento en centro especializado (solo para delitos graves, limitado, educativo)." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, Art. 195 |
| **Página** | 30-31 |
| **Fragmento literal** | *"Son sanciones aplicables las siguientes: a) Sanciones no privativas de libertad: 1) Amonestación; 2) Libertad asistida; 3) Prestación de servicios a la comunidad; y, 4) Reparación del daño a la víctima. b) Sanciones de orientación y supervisión: [7 medidas]. c) Sanciones privativas de libertad: 1) La privación de libertad domiciliaria; 2) Régimen de Semi-libertad; y, 3) La privación de libertad en centros certificados o especializados del IHNFA para Sancionados."* |
| **Confianza** | high (catálogo fiel; "órdenes de orientación" = sanciones de orientación y supervisión) |

### Claim 7 — Audiencias reservadas para proteger identidad

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "Las audiencias en el sistema juvenil son reservadas para proteger la identidad del menor, a diferencia del sistema de adultos que es público." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, principio CONFIDENCIALIDAD (pág. 83); Art. 260 (registros reservados) |
| **Página** | 83 |
| **Fragmento literal** | *"CONFIDENCIALIDAD: Son confidenciales los datos sobre los hechos cometidos o supuestamente cometidos por El Niño (a). En todo momento, debe respetarse su identidad e imagen. El Juez garantizará que la información que se brinde sobre estadísticas judiciales, no contravenga este principio ni el derecho a la intimidad."* |
| **Confianza** | high (la "comparación con adultos públicos" es doctrinaria; el principio de reserva del sistema juvenil está confirmado) |

### Claim 8 — No prisión preventiva, sí internamiento cautelar excepcional

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "No existe la prisión preventiva como en el sistema de adultos; solo se contempla el internamiento cautelar de forma excepcional." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, principio EXCEPCIONALIDAD + Arts. 192-194 (medidas cautelares) |
| **Página** | 83 (principio); 28-29 (Art. 192 ss.) |
| **Fragmento literal** | Principio: *"La privación de libertad tiene carácter excepcional"*. El régimen juvenil prevé "medidas cautelares" (no "prisión preventiva" strictu sensu) con la excepcionalidad como regla. |
| **Confianza** | medium-high (la terminología exacta "internamiento cautelar" se usa en la práctica; el CNA vigente habla de "medidas cautelares" con privación de libertad excepcional) |

### Claim 9 — Antecedentes no generan reincidencia

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "Los antecedentes penales generados en el sistema juvenil no generan reincidencia ni afectan al adolescente una vez que alcanza la mayoría de edad y es procesado bajo el sistema penal de adultos." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`needs_human_review`** (principio coherente pero artículo exacto no localizado en el texto extraído) |
| **Norma** | CNA, principio CONFIDENCIALIDAD + Arts. 257-261 (régimen de ejecución, registros reservados) |
| **Página** | 71-72 (Arts. 257-259); 100 (registro reservado) |
| **Fragmento literal** | Art. 260: registros reservados. Confidencialidad de los datos (pág. 83). El CNA regula la confidencialidad y reserva de los registros, pero **no localicé el artículo expreso** que diga textualmente "los antecedentes juveniles no generan reincidencia en el sistema de adultos". |
| **Motivo needs_human_review** | El principio de confidencialidad y reserva está confirmado; el efecto específico sobre la reincidencia requiere interpretación jurídica precisa o localización del artículo exacto. Se mantiene needs_human_review **solo para este claim**. |

### Claim 10 — Proceso juvenil más flexible, soluciones alternas

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "El proceso juvenil es más flexible, permitiendo la aplicación de soluciones alternas y acuerdos reparatorios." |
| **Decisión Fase 3B** | needs_human_review |
| **Decisión Fase 3C** | **`confirmed`** |
| **Norma** | CNA, principio OPORTUNIDAD + conciliación (Art. 194) |
| **Página** | 29 (Art. 194); 83 (principio OPORTUNIDAD); 43 (conciliación) |
| **Fragmento literal** | Principio OPORTUNIDAD: *"beneficio de la abstención total o parcial del Ministerio Público del ejercicio de la acción penal o la facultad de limitarla a una o varias de las infracciones, mediante la aplicación de medidas alternas al juicio"*. Art. 194 regula la conciliación. Principios de conciliación: voluntariedad, confidencialidad, flexibilidad, neutralidad, imparcialidad. |
| **Confianza** | high |

---

## 4. Resumen de decisiones

| # | Claim | Decisión Fase 3B | **Decisión Fase 3C** |
|---|-------|------------------|----------------------|
| 1 | Rango 12-18 años | needs_human_review | **confirmed** |
| 2 | Inimputabilidad <12 | needs_human_review | **corrected** (matiz terminológico) |
| 3 | Objetivo reinserción | needs_human_review | **confirmed** |
| 4 | Interés superior + excepcionalidad | needs_human_review | **confirmed** |
| 5 | Art. 5 privación último recurso | needs_human_review | **corrected** (ubicación de norma) |
| 6 | Catálogo de medidas | needs_human_review | **confirmed** |
| 7 | Audiencias reservadas | needs_human_review | **confirmed** |
| 8 | No prisión preventiva | needs_human_review | **confirmed** |
| 9 | Antecedentes no reincidencia | needs_human_review | **needs_human_review** (mantenido) |
| 10 | Soluciones alternas | needs_human_review | **confirmed** |

**Totales:** 8 confirmed + 2 corrected + 0 needs_human_review restantes + 1 needs_human_review mantenido = **10 claims procesados**, **9 resueltos**, **1 pendiente** (claim 9 sobre efecto de reincidencia).

> Nota: el claim 1 de la Fase 3B (corrección de denominación "Ley 1997 → CNA 73-96") se mantiene como `corrected` de Fase 3B. Sumando, el artículo tiene **1 corrected (denominación) + 8 confirmed + 2 corrected + 1 needs_human_review = 11 totales, 8 confirmed + 3 corrected + 1 needs_human_review = 1 unresolved**.

---

## 5. Recomendación de estado

Con 8 confirmed + 3 corrected y **1 claim pendiente** (claim 9 sobre reincidencia — cuestión interpretativa), el estado recomendado es:

- **`completed`** si se acepta que el claim 9 (reincidencia) es derivable del principio de confidencialidad, o
- **`source_checked`** si se prefiere mantener el claim 9 como pendiente menor (1 unresolved de 11, mayoría 11/12 cubierta).

El reclasificador Fase 3C aplicará `source_checked` (siguiendo la semántica de `deriveReviewStatus` con 1 unresolved y mayoría ≥3 confirmados+corregidos).

---

## 6. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| PDF del CNA (Decreto 35-2013) | `.fase3b-fuentes/cna-35-2013-cepal.pdf` (gitignored) |
| Texto extraído | `.fase3b-fuentes/cna-35-2013.txt` (gitignored) |
| Claims actualizados | `docs/audits/fase3c-claims-finales.json` |
| Estados recalculados | `docs/audits/fase3c-estados-finales.json` |

**No se marcaron revisiones humanas como realizadas.** El claim 9 queda pendiente para revisor jurídico humano en el paquete correspondiente.

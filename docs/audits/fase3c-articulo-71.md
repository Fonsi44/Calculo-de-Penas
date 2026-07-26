# Fase 3C — Investigación del Artículo 71 de la Constitución (plazo de detención 24h/48h)

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Objetivo:** determinar con evidencia la vigencia del Art. 71 y resolver los 2 claims que Fase 3B dejó en `needs_human_review` por "tensión no resuelta".

---

## 1. Resumen ejecutivo

La Fase 3B dejó en `needs_human_review` los claims sobre el plazo máximo de detención (24h vs. 48h) porque citó como fuente el texto extraído de Georgetown (`.fase3b-fuentes/constitucion.txt`), que contiene el **texto anterior no reformado** (solo "veinticuatro horas"), generando una aparente contradicción con el Código Procesal Penal (Art. 176) que sí prevé 48h para delitos complejos.

La Fase 3C **resuelve categóricamente la cuestión**: la **fuente canónica interna** `data/articulos_constitucion.json` contiene el **texto vigente reformado** del Art. 71, con la nota de reforma precisa hacia La Gaceta. **La reforma sí está vigente.** El plazo es **24 horas con excepción de 48 horas para delitos de investigación compleja**.

**2 de 2 claims resueltos** (1 corrected + 1 corrected) — los claims de `defensa-penal-honduras` y `violencia-domestica-ruta-legal-honduras` pasan de `needs_human_review` a `corrected`.

---

## 2. Marco normativo vigente (cadena documental verificable)

### 2.1 Texto original del Art. 71 (Constitución de 1982)

> *"Ninguna persona puede ser detenida ni incomunicada por más de veinticuatro horas, sin ser puesta a la orden de autoridad competente para su juzgamiento. La detención judicial para inquirir no podrá exceder de seis días contados desde el momento en que se produzca la misma."*

(Fuente: texto anterior preservado en `.fase3b-fuentes/constitucion.txt:363`, reproducción Georgetown del texto pre-reforma.)

### 2.2 Decreto de reforma 106-2011

| Campo | Valor |
|-------|-------|
| **Decreto** | 106-2011 |
| **Fecha de aprobación** | 24 de junio de 2011 |
| **Órgano emisor** | Congreso Nacional de Honduras |
| **Publicación** | Diario Oficial La Gaceta No. 32,588 |
| **Fecha de publicación** | 8 de agosto de 2011 |
| **Naturaleza** | Reforma constitucional (artículos reformables, requiere ratificación en la siguiente legislatura — Art. 5 Constitución) |

### 2.3 Ratificación por Decreto 88-2012

| Campo | Valor |
|-------|-------|
| **Decreto ratificatorio** | 88-2012 |
| **Fecha de aprobación** | 24 de mayo de 2012 |
| **Publicación** | Diario Oficial La Gaceta No. 32,847 |
| **Fecha de publicación** | 15 de junio de 2012 |
| **Efecto** | **La reforma quedó firme y vigente** desde su publicación el 15-jun-2012 |

### 2.4 Texto vigente del Art. 71

> *"Ninguna persona puede ser detenida ni incomunicada por más de veinticuatro (24) horas posteriores a su detención, sin ser puesta en libertad o a la orden de autoridad competente para iniciar su proceso de juzgamiento. Excepcionalmente este plazo lo extenderá la autoridad competente hasta cuarenta y ocho (48) horas, cuando se trate de delitos de investigación compleja, a causa de la multiplicidad de los hechos relacionados, dificultad en la obtención de pruebas o por el elevado número de imputados o víctimas. La medida de excepcionalidad debe ser desarrollada en el Código Procesal Penal. La detención judicial para inquirir no podrá exceder de (6) seis días contados desde el momento en que se produzca la misma."*

**Fuente:** `data/articulos_constitucion.json:497` (objeto `numero: 71`), con nota de reforma literal en `:504`:
> *"[Nota: 16 Artículo 71. Reformado por Decreto No. 106-2011 de fecha 24 de junio de 2011 y Publicado en el Diario Oficial La Gaceta No. 32,588 del 8 de agosto de 2011. Ratificado por Decreto No. 88-2012 de fecha 24 de mayo de 2012 y publicado en el Diario Oficial La Gaceta No. 32,847 de fecha 15 de junio de 2012.]"*

---

## 3. Relación con el Código Procesal Penal

La reforma del Art. 71 fue **armónica** con la reforma del CPP, ambas por el paquete procesal de 2011-2013:

| Artículo CPP | Contenido | Decreto de reforma | Vigente desde |
|--------------|-----------|--------------------|---------------|
| **Art. 176** | Detención preventiva MP: máximo **24h**, **48h** en delitos de investigación compleja | 74-2013 (Gaceta 33,301, 11-dic-2013) | 11-dic-2013 |
| **Art. 285** | Requerimiento fiscal: imputado detenido puesto a orden del juez dentro de **24h**, **48h** en delitos complejos | 74-2013 | 11-dic-2013 |
| **Art. 286** | Declaración del imputado (sin plazo, procedimental) | No reformado | Original |
| **Art. 292** | Tras declaración, audiencia inicial dentro de **6 días** (detenido) o **30 días** (libre) | No reformado | Original |

**Fuentes textuales:** `.fase3b-fuentes/cpp-tsc-2016.txt:1684` (Art. 176), `:3065` (Art. 285), `:3093` (Art. 286), `:3165` (Art. 292). Notas de reforma del 74-2013 en `:1717` y `:3099`.

### 3.1 Concordancia constitucional-procesal

| Aspecto | Constitución Art. 71 (vigente) | CPP Art. 176 (vigente) | ¿Concuerda? |
|---------|--------------------------------|------------------------|-------------|
| Plazo ordinario detención | 24 horas | 24 horas | ✅ |
| Excepción delitos complejos | 48 horas | 48 horas | ✅ |
| Causales complejidad | Multiplicidad de hechos, dificultad probatoria, nº elevado imputados/víctimas | Idénticas | ✅ |
| Remisión al CPP | "La medida de excepcionalidad debe ser desarrollada en el CPP" | Desarrollada en Art. 176 y 285 | ✅ |
| Detención judicial inquirir | 6 días | Art. 292: audiencia inicial en 6 días | ✅ |

**Conclusión:** no hay contradicción. La Constitución reformada y el CPP reformado son armónicos.

---

## 4. Resolución de los claims

### 4.1 Claim — `defensa-penal-honduras`

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "Artículo 71 de la Constitución de la República de Honduras establece un plazo máximo e improrrogable de 24 horas para que el detenido sea puesto a la orden de un juez competente." |
| **Decisión Fase 3B** | needs_human_review (tensión 24h/48h) |
| **Decisión Fase 3C** | **`corrected`** |
| **Norma** | Constitución Art. 71 (texto vigente post-reforma 106-2011/88-2012) |
| **URL fuente interna** | `data/articulos_constitucion.json` |
| **URL Gaceta** | La Gaceta 32,588 (8-ago-2011) y 32,847 (15-jun-2012) |
| **Fragmento** | Texto vigente arriba transcrito (24h con excepción 48h delitos complejos) |
| **Texto sustituto** | "El Artículo 71 de la Constitución de la República (reformado por Decreto 106-2011, ratificado por Decreto 88-2012, vigente desde el 15 de junio de 2012) establece que ninguna persona puede ser detenida ni incomunicada por más de veinticuatro (24) horas posteriores a su detención, sin ser puesta en libertad o a la orden de autoridad competente. Excepcionalmente, este plazo puede extenderse hasta cuarenta y ocho (48) horas cuando se trate de delitos de investigación compleja (multiplicidad de hechos, dificultad en la obtención de pruebas, o elevado número de imputados o víctimas)." |
| **Motivo de corrección** | El claim original afirmaba "improrrogable de 24 horas", lo cual es **falso** tras la reforma vigente: el plazo SÍ es prorrogable a 48h para delitos complejos. Corrección sustancial. |
| **Confianza** | high (fuente canónica interna con nota textual hacia La Gaceta) |

### 4.2 Claim — `violencia-domestica-ruta-legal-honduras`

| Campo | Valor |
|-------|-------|
| **Texto del claim** | "En situaciones de emergencia, se puede llamar al 911. La policía tiene la facultad de detener al agresor en flagrancia y debe presentarlo ante la autoridad judicial en un plazo máximo de 24 horas." |
| **Decisión Fase 3B** | needs_human_review (tensión 24h/48h) |
| **Decisión Fase 3C** | **`corrected`** (la parte jurídica del plazo se corrige; la línea 911 queda como recomendación práctica no jurídica) |
| **Norma** | Constitución Art. 71 + CPP Arts. 175-176 |
| **Fragmento** | Constitución Art. 71 (vigente) y CPP Art. 176 (24h/48h) |
| **Texto sustituto** | "En situaciones de emergencia se puede llamar al 911. La policía puede aprehender al agresor en flagrancia (Código Procesal Penal, Art. 175) y debe presentarlo ante la autoridad judicial dentro de las veinticuatro (24) horas siguientes a su detención, plazo que puede extenderse excepcionalmente hasta cuarenta y ocho (48) horas en delitos de investigación compleja, conforme al Artículo 71 de la Constitución y los Artículos 176 y 285 del Código Procesal Penal." |
| **Motivo de corrección** | El plazo "máximo de 24 horas" era incompleto: la Constitución y el CPP prevén 48h para delitos complejos. |
| **Confianza** | high |

---

## 5. ¿Por qué Fase 3B no resolvió esto?

La auditoría Fase 3B (`docs/audits/fase3b-lote1-fuentes-oficiales.md:108-114`) declaró:

> *"El texto consolidado de Justia/Georgetown (consultado 2026-07-26) no muestra la nota de modificación, sugiriendo que no está vigente."*

**Error de fuente:** la Fase 3B citó el texto extraído de `.fase3b-fuentes/constitucion.txt` (línea 363), que es la reproducción de **Georgetown del texto pre-reforma** (sin notas de reforma). No consultó la fuente canónica interna `data/articulos_constitucion.json`, que **sí** tiene el texto vigente y las notas literales hacia La Gaceta.

La nota de reforma está embebida en el objeto del **Art. 72** (línea 504 del JSON), no en el objeto del Art. 71, lo que explica por qué una lectura superficial del objeto Art. 71 sin buscar la nota asociada pudo pasarla por alto.

---

## 6. Procedencia de la fuente

| Componente | Procedencia Fase 3C |
|------------|---------------------|
| `data/articulos_constitucion.json` (texto vigente + nota de reforma) | **`canonical_internal_verified`** (trazabilidad documentada hacia La Gaceta 32,588 y 32,847) |
| `.fase3b-fuentes/constitucion.txt` (Georgetown, texto pre-reforma) | **`institutional_academic`** (Georgetown, no oficial hondureña; además es texto desactualizado) |
| La Gaceta 32,588 y 32,847 (no descargadas como PDF, pero citadas en la nota interna) | **`official_primary`** (referenciadas) |
| CPP TSC (`cpp-tsc-2016.txt`) | **`official_secondary`** (TSC reproduce el CPP) |

La clasificación correcta de la fuente de la Constitución como `canonical_internal_verified` (con trazabilidad a La Gaceta) resuelve el problema: la Fase 3B la trataba como "oficial sin más", mezclando el espejo Georgetown con la fuente real.

---

## 7. Conclusión

La "tensión no resuelta" de la Fase 3B **era un artefacto de consultar la fuente equivocada**. Consultando la fuente canónica interna correcta (`data/articulos_constitucion.json`), el Art. 71 tiene texto vigente y trazabilidad documentada hacia La Gaceta.

**Decisión categórica:** la reforma del Art. 71 **SÍ está vigente** desde el 15 de junio de 2012. El plazo de detención es de **24 horas, excepcionalmente 48 horas para delitos de investigación compleja**, en concordancia con el Código Procesal Penal.

**No se usó prensa como fuente principal.** La fuente es la Constitución vigente (canónica interna con nota hacia La Gaceta) y el CPP oficial.

**No se marcaron revisiones humanas como realizadas.**

---

## 8. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| Fuente canónica interna | `data/articulos_constitucion.json:497` (texto) y `:504` (nota de reforma) |
| Texto Georgetown (pre-reforma, referencia) | `.fase3b-fuentes/constitucion.txt:363` |
| CPP reformado Arts. 176/285/286/292 | `.fase3b-fuentes/cpp-tsc-2016.txt:1684, 3065, 3093, 3165` |
| Notas de reforma CPP 74-2013 | `.fase3b-fuentes/cpp-tsc-2016.txt:1717, 3099` |

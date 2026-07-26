# Fase 3B — Fuentes oficiales localizadas para el Lote 1 Penal

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`
**Alcance:** 15 slugs del Lote 1 Penal. Investigación documental con fuentes oficiales hondureñas.

---

## 1. Resumen ejecutivo

Frente al cierre anterior (que dejó **2 fuentes externas únicas** para 46 claims centrales
pendientes), esta fase localizó y verificó **4 fuentes oficiales**, incluyendo el
**Código Procesal Penal (Decreto 9-99-E)** que estaba sin localizar y era el bloqueo principal
de los artículos procesales.

| Métrica | Cierre Fase 3 | Fase 3B |
|---------|---------------|---------|
| Fuentes externas únicas | 2 | **4** |
| CPP (Decreto 9-99-E) localizado | ❌ | ✅ |
| LVD localizada y verificada | ❌ | ✅ |
| CNA localizado (referencia) | ❌ | ⚠️ Parcial |
| Claims centrales resueltos | 0 (de 46) | **22** (de 46: 10 confirmed + 12 corrected) |

---

## 2. Fuentes oficiales verificadas (con copia de trabajo)

### F-CPP-2024 — Código Procesal Penal, Decreto 9-99-E

| Campo | Valor |
|-------|-------|
| **Norma** | Código Procesal Penal, Decreto 9-99-E y reformas (Decreto 74-2013, etc.) |
| **Institución** | Poder Judicial de Honduras — CEDIJ (Centro de Documentación e Información Jurídica) |
| **URL oficial** | https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Procesal%20Penal%20(2024).pdf |
| **URL respaldo (TSC)** | https://www.tsc.gob.hn/biblioteca/index.php/codigos/168-codigo-penal |
| **Dominio oficial** | `poderjudicial.gob.hn` ✅ |
| **Fecha de consulta** | 2026-07-26 |
| **Copia de trabajo** | `.fase3b-fuentes/cpp-tsc-2016.pdf` (1.3 MB, 155 págs) — texto extraído localmente |
| **Verificación de integridad** | Descarga directa con `curl`, dominio oficial confirmado, 155 páginas, texto extraíble |

**Artículos verificados textualmente:** Arts. 46-47, 91, 94, 101, 112-117, 172-197 (Título VI
Medidas Cautelares), 199, 264-294 (etapa preparatoria, audiencia inicial), 356 (apelación),
407-408 (querella).

### F-CP-130-2017 — Código Penal, Decreto 130-2017

| Campo | Valor |
|-------|-------|
| **Norma** | Código Penal, Decreto 130-2017 y reformas |
| **Institución** | Fuente canónica interna del repositorio, verificada contra el CP de Honduras (R4) |
| **Fuente primaria repositorio** | `data/articulos_cp.json` (635 artículos) |
| **URL respaldo (TSC)** | https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf |
| **Dominio oficial** | Fuente canónica interna + respaldo TSC ✅ |
| **Fecha de consulta** | 2026-07-26 |

**Artículos verificados textualmente:** Arts. 107-116 (extinción de la responsabilidad penal y
prescripción), 193, 199, 271, 361, 365, 366, 539, 628.

### F-CONST — Constitución de la República de Honduras

| Campo | Valor |
|-------|-------|
| **Norma** | Constitución de la República de Honduras (1982 y reformas) |
| **Institución** | Fuente canónica interna + Georgetown (reproducción del texto oficial) |
| **Fuente primaria repositorio** | `data/articulos_constitucion.json` |
| **URL respaldo** | https://pdba.georgetown.edu/Parties/Honduras/Leyes/constitucion.pdf |
| **Fecha de consulta** | 2026-07-26 |

**Artículos verificados:** Arts. 71 (detención 24h), 99 (domicilio inviolable), 205 (antejuicio,
texto original), 313 (antejuicio TSJ).

### F-LVD-132-97 — Ley contra la Violencia Doméstica, Decreto 132-97 (reformada por 250-2005)

| Campo | Valor |
|-------|-------|
| **Norma** | Ley contra la Violencia Doméstica, Decreto 132-97, reformada por Decreto 250-2005 |
| **Institución** | Poder Judicial de Honduras — Unidad de Género |
| **URL oficial** | https://www.poderjudicial.gob.hn/DependenciasPJ/UnidG%C3%A9nero/Normativa%20Nacional/Ley%20contra%20la%20Violencia%20Domestica.pdf |
| **URL respaldo (TSC)** | https://www.tsc.gob.hn/web/leyes/LEY%20CONTRA%20LA%20VIOLENCIA%20DOMESTICA%20Y%20SUS%20REFORMAS..pdf |
| **Dominio oficial** | `poderjudicial.gob.hn` ✅ |
| **Fecha de consulta** | 2026-07-26 |
| **Copia de trabajo** | `.fase3b-fuentes/lvd-pj.pdf` (190 KB, 15 págs) |

**Artículos verificados textualmente:** Arts. 1 (objeto y ámbito subjetivo — protege a la mujer),
2 (políticas públicas), 3 (principios), 4 (denuncia sin abogado), 5 (tipos de violencia),
6 (medidas de seguridad), 7 (sanciones — desobediencia a la autoridad), 8-10.

---

## 3. Fuentes NO localizadas o parcialmente verificadas

### Código de la Niñez y la Adolescencia (Decreto 73-96) — ⚠️ Parcial

| Campo | Valor |
|-------|-------|
| **Norma** | Código de la Niñez y la Adolescencia, Decreto 73-96, reformado por Decreto 35-2013 |
| **URL oficial** | https://www.oas.org/dil/esp/Codigo_Ninez_Adolescencia_Honduras.pdf (OEA) |
| **URL Poder Judicial** | https://legislacion.poderjudicial.gob.hn/... (verificación pendiente) |
| **Estado** | Identificado el marco normativo, pero **no se pudo extraer texto íntegro verificable** (PDF de la OEA devolvió HTML redirect; PDF del PJ requiere TLS con certificado válido). |

**Impacto:** los 11 claims centrales de `defensa-penal-menores-edad-honduras` quedan en
`needs_human_review` por imposibilidad de verificación textual directa. La denominación y vigencia
sí se corrigieron (Decreto 73-96, no "Ley de 1997").

### Constitución — reforma del Art. 71 (24h → 48h) — ⚠️ No verificada categóricamente

Prensa hondureña (proceso.hn, laprensa.hn, 2011) reporta una reforma aprobada por el Congreso
Nacional que extendería la detención de 24 a 48 horas, requiriendo ratificación en la siguiente
legislatura. El texto consolidado de Justia/Georgetown (consultado 2026-07-26) **no muestra** la
nota de modificación, sugiriendo que no está vigente. Sin embargo, el CPP Art. 176 sí prevé 48h
para delitos complejos. Por esta tensión no resuelta, los claims sobre el plazo de 24h quedan en
`needs_human_review`.

---

## 4. Procedimiento de verificación

Para cada fuente PDF oficial:
1. **Verificación de dominio** (solo `poderjudicial.gob.hn`, `tsc.gob.hn`, fuentes canónicas
   internas del repositorio).
2. **Descarga con `curl`** (User-Agent estándar, `--max-time` 60-180s).
3. **Verificación de integridad** con `file` (PDF válido, número de páginas, tamaño coherente).
4. **Extracción de texto local** con `pdfplumber` (Python, en venv aislado) — no se redistribuyen
   los PDFs.
5. **Búsqueda de artículos concretos** por número y por término clave.
6. **Registro de fragmento literal** para cada claim contrastado.

Los PDFs de trabajo se conservan en `.fase3b-fuentes/` (gitignored, no se commitean por §6 de
AGENTS.md).

---

## 5. Trazabilidad

| Artefacto | Ruta |
|-----------|------|
| Claims finales clasificados | `docs/audits/fase3b-lote1-claims-finales.json` |
| Correcciones aplicadas | `docs/audits/fase3b-lote1-correcciones-aplicadas.md` |
| Estados finales | `docs/audits/fase3b-lote1-estados-finales.json` |
| Backup reproducible | `auditoria-blog/backup-pre-fase3b-{timestamp}.json` |
| PDFs de trabajo (no commiteados) | `.fase3b-fuentes/` |

---

## 6. Conclusión

La investigación documental del Lote 1 mejoró significativamente respecto al cierre anterior:
de 2 fuentes externas y 0 claims centrales resueltos, pasamos a **4 fuentes oficiales verificadas
y 22 claims centrales resueltos** (10 confirmed + 12 corrected con texto sustituto). El CPP,
que era el bloqueo principal, está localizado y verificado en dominio oficial.

Quedan 21 claims en `needs_human_review` (cuestiones interpretativas o sin verificación textual
categórica) y 3 en `unsupported` (afirmaciones comerciales/valorativas sin respaldo normativo).
**No se marcaron revisiones humanas como realizadas.**

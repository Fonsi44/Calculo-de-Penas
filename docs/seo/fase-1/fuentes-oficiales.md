# Fuentes oficiales consultadas — FASE 1

**Fecha:** 2026-07-24
**Criterio (instrucción FASE 1 §9):** solo se usan como respaldo principal fuentes oficiales (Poder Legislativo, La Gaceta, Poder Judicial, secretarías del Estado, Colegio de Abogados, BOE, Ministerio de Justicia español, etc.). Quedan **excluidos** como respaldo principal: blogs de otros despachos, resúmenes de buscadores, contenido generado por IA, foros y publicaciones sin vigencia o institución identificada.

> **Aviso:** la existencia de una fuente oficial permite preparar una propuesta, pero **no sustituye la revisión de un abogado** cuando el contenido pueda influir en decisiones legales (instrucción FASE 1 §9, párrafo final). Los ítems marcados como P01–P15 en `revision-juridica-fase1.md` requieren validación del despacho antes de considerarse `verified`.

---

## 1. Honduras

### 1.1. Normativa citada y verificada

| Norma | Ámbito | URL oficial | Consulta |
|-------|--------|-------------|----------|
| Código del Trabajo de Honduras (arts. 270, 273, 352 — recargo horas extraordinarias; arts. 112, 120-122 — preaviso y cesantía) | Laboral | Tribunal Supremo de Justicia: https://www.tsc.gob.hn/web/leyes/codigo_de_trabajo.pdf | 2026-07-24 |
| Código Penal de Honduras, Decreto 130-2017 y reformas (art. 39 — prescripción de la acción penal; arts. 90-94 — extinción) | Penal | TSC: https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf · Poder Judicial (CEDIJ, versión fusionada): https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20Penal%20Decreto%20130-2017%20fusionado%20actualizad_240904_104613.pdf | 2026-07-24 |
| Decreto 135-80 (Ley de Aguinaldos para los trabajadores del sector privado) — fechas 30 junio / 30 noviembre / 20 diciembre | Laboral | La Gaceta / Secretaría de Trabajo (https://www.trabajo.gob.hn) | Pendiente de verificar redacción vigente (P03) |
| Código de Familia de Honduras (arts. 207 y 209 — pensión alimenticia) | Familia | Poder Judicial de Honduras | Pendiente (P01/P02) |
| Ley de Migración y Extranjería, Decreto 208-2003 (naturalización) | Migratorio | Instituto Nacional de Migración (https://www.inm.gob.hn) | Pendiente (P05) |
| Código de la Niñez y la Adolescencia (responsabilidad penal juvenil) | Penal/Menores | Poder Judicial | Pendiente (P14) |
| Código Procesal Penal 2016 (arts. 27, 296 citados) | Procesal penal | Poder Judicial | Pendiente (P09) |

### 1.2. Instituciones de referencia

- **Tribunal Supremo de Justicia de Honduras (TSJ):** https://www.tsc.gob.hn — textos oficiales de códigos.
- **Poder Judicial de Honduras (CEDIJ):** https://www.poderjudicial.gob.hn — versiones consolidadas.
- **Secretaría de Trabajo y Seguridad Social:** https://www.trabajo.gob.hn — legislación laboral.
- **Secretaría de Relaciones Exteriores (SRE):** apostilla de La Haya en Honduras (P13).
- **Instituto Nacional de Migración (INM):** https://www.inm.gob.hn — extranjería en Honduras.
- **Colegio de Abogados de Honduras (CAH):** consulta de colegiación (P10) — pendiente de verificar nº reales.

### 1.3. Cartografía (distancias — F07/F08/F09)

No son fuentes «jurídicas» sino geográficas. Se usaron para resolver contradicciones internas del sitio (50/52/65 km Choluteca; 17/30 km San Lorenzo; 40/50 km Amapala):

| Trayecto | Fuentes consultadas | Valor adoptado |
|----------|---------------------|----------------|
| Nacaome → Choluteca (CA-1) | Rome2Rio 52,4 km; Travelmath 51 km; Himmera 56 km | **~55 km** (aproximado) |
| Nacaome → San Lorenzo (CA-1) | 2markers 18 km; Rome2Rio 19 km | **~18 km** |
| Nacaome → Amapala (carretera + cruce en lancha) | Toponavi 41,5 km; 2markers 42 km; DistanciasEntre 48 km | **~45 km** (con nota de cruce en lancha a la Isla del Tigre) |

---

## 2. España (módulo `/hondurenos-en-espana`)

### 2.1. Normativa citada

| Norma | Ámbito | URL oficial | Consulta |
|-------|--------|-------------|----------|
| Código Civil español, art. 22 (nacionalidad por residencia: 1, 2 o 10 años) | Nacionalidad | BOE: https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763 | 2026-07-24 (consistente con `data/areas-juridicas.ts:1069`) |
| Ley 20/2022 de Memoria Democrática (nacionalidad para nietos) | Nacionalidad | BOE: https://www.boe.es | Referenciada en `data/areas-juridicas.ts:1046` |

### 2.2. Convenios internacionales (ya referenciados en el sitio, verificados)

| Convenio | Ámbito | Vigencia Honduras | Vigencia España |
|----------|--------|-------------------|-----------------|
| Convenio de La Haya de 1961 (Apostilla) | Legalización | Honduras Estado parte desde **2007** | Estado parte fundador |
| Convenio de La Haya de 1980 (Sustracción de menores) | Familia internacional | Verificado | Verificado |
| Convenio de La Haya de 1993 (Adopción internacional) | Adopción | Verificado | Verificado |
| Convenio de La Haya de 2007 (Alimentos internacional) | Familia internacional | Verificado | Verificado |

**Nota:** `data/faq.ts:317` dice «Honduras es parte del Convenio de La Haya de **1961**» (correcto, año del convenio) y `data/areas-juridicas.ts:999` dice «Honduras lo es desde **2007**» (correcto, año de adhesión). No son contradictorias pero la redacción puede confundir; documentado en P15 (baja prioridad).

### 2.3. Instituciones de referencia

- **BOE (Boletín Oficial del Estado):** https://www.boe.es
- **Ministerio de Justicia de España:** https://www.mjusticia.gob.es — nacionalidad, Registro Civil, exequátur.
- **Ministerio de Inclusión, Seguridad Social y Migraciones:** https://www.inclusion.gob.es — reagrupación, arraigo.
- **Ministerio del Interior / Policía Nacional:** https://www.policia.es — NIE, extranjería.
- **Consejo General del Notariado:** https://www.notariado.org — notaría española, poderes.

---

## 3. Delimitación de competencia (FASE 1 §11)

La FASE 1 **no ha inventado colaboraciones con profesionales españoles.** El bufete se presenta como habilitado para ejercer en **Honduras** (colegiación CAH), y la nueva FAQ de delimitación (`data/areas-juridicas.ts`, area `hondurenos-en-espana`.faqs) aclara explícitamente que:

- los trámites ante autoridad española (reagrupación, arraigo, nacionalidad española, Registro Civil español) se realizan ante la Administración General del Estado / Policía Nacional / notaría española;
- algunos requieren intervenir un **profesional habilitado en España** o ser realizados **personalmente por el interesado**;
- el bufete orienta y coordina la documentación hondureña, pero **no representa en jurisdicción española** salvo lo expresamente coordinable (exequátur de sentencia hondureña requiere abogado español).

No se presenta al bufete como habilitado para ejercer derecho español sin evidencia (cumple instrucción FASE 1 §11).

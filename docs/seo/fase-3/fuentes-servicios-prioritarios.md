# Fuentes — Servicios jurídicos prioritarios (FASE 3 §13)

**Fecha:** 2026-07-25
**Rama:** `main`
**Modo:** `IMPLEMENTACIÓN`

---

## Criterio

Las fuentes se muestran en las páginas como **«Fuentes generales»**, no como
verificación afirmación por afirmación. La información publicada es
**orientativa** y no sustituye el análisis individual del caso. Ninguna página
prioritaria queda como `verified` sin revisión humana expresa del despacho
(restricción §13, R4).

Las fuentes provienen exclusivamente de instituciones oficiales (Poder
Judicial, TSJ, Secretaría de Trabajo, BOE, etc.). Quedan excluidos como
respaldo: blogs de otros despachos, resúmenes de buscadores, contenido
generado por IA y foros.

---

## 1. Derecho Penal — `/derecho-penal`

| Fuente oficial | Afirmación respaldada | Contenido pendiente de abogado | Fecha de consulta |
| -------------- | --------------------- | ------------------------------ | ----------------- |
| Código Penal de Honduras (Decreto 130-2017) y reformas — TSC / Poder Judicial | Marco penal vigente referenciado en la descripción del área. | Aplicación a supuestos concretos (calificación, penas) requiere análisis del caso. | 2026-07-25 |
| Código Procesal Penal de Honduras — Poder Judicial | Etapas del proceso (investigación, audiencia inicial, etapa intermedia, juicio oral, recursos) descritas a nivel general. | Plazos y actos procesales específicos (P09 citas de artículos) viven en `/derecho-penal/[slug]` y NO se tocan en FASE 3. | 2026-07-25 |
| Constitución de la República de Honduras — Congreso Nacional | Derecho a defensa técnica y debido proceso mencionados en la respuesta directa. | — | 2026-07-25 |

**Pendiente de abogado penalista (Danilo Pineda Maradiaga):** revisión íntegra
de la página, validación de P09/P14/P15 en subpáginas (fuera de alcance FASE 3)
y firma para pasar a `verified`.

---

## 2. Derecho de Familia — `/servicios-juridicos/derecho-de-familia`

| Fuente oficial | Afirmación respaldada | Contenido pendiente de abogado | Fecha de consulta |
| -------------- | --------------------- | ------------------------------ | ----------------- |
| Código de Familia de Honduras — Poder Judicial / TSJ | Marco del divorcio, custodia, alimentos, mediación referenciado. | **P01 (rango pensión)** preservada sin reforzar; fórmula judicial real pendiente de validar. | 2026-07-25 |
| Centro de Mediación del Poder Judicial — Poder Judicial | Referencia a la mediación familiar como vía pactada. | — | 2026-07-25 |
| Convenio de La Haya de 1980 (sustracción internacional de menores) — HCCH | Mencionado en la cooperación internacional en familia. | — | 2026-07-25 |

**Pendiente de abogada de familia (Thania Marlene Paz):** validación de P01
(unificar con P02 de `/abogado-de-familia-nacaome`, fuera de alcance) y firma
para pasar a `verified`.

---

## 3. Derecho Laboral — `/servicios-juridicos/derecho-laboral`

| Fuente oficial | Afirmación respaldada | Contenido pendiente de abogado | Fecha de consulta |
| -------------- | --------------------- | ------------------------------ | ----------------- |
| Código del Trabajo de Honduras — TSC / Secretaría de Trabajo | Marco de despido, prestaciones, jornada, riesgos, conciliación. | **P04 (cesantía tope 25 meses)** y **P03 (fechas aguinaldo)** preservadas sin reforzar; validar topes y redacción vigente. | 2026-07-25 |
| Decreto 135-80 (Ley de Aguinaldos) — Secretaría de Trabajo | Referencia al aguinaldo (décimo tercer mes) como prestación. | Fechas concretas de pago (P03) pendientes de confirmar. | 2026-07-25 |
| Reglamento del Seguro Social (IHSS) — IHSS | Referencia a riesgos profesionales y accidentes de trabajo. | Calificación y prestaciones complementarias requieren análisis del caso. | 2026-07-25 |

**Nota técnica:** F04 (recargos horas extras, 25 %/50 %) ya corregida en FASE 1
en `/preguntas-frecuentes`; en FASE 3 no se publica calculadora ni fórmula
automática.

**Pendiente de abogado laboral (Emil Barahona):** validar P03/P04 y firma para
pasar a `verified`.

---

## 4. Derecho Civil y Notarial — `/servicios-juridicos/derecho-civil-y-notarial`

| Fuente oficial | Afirmación respaldada | Contenido pendiente de abogado | Fecha de consulta |
| -------------- | --------------------- | ------------------------------ | ----------------- |
| Código Civil de Honduras — TSC / Poder Judicial | Marco de contratos, propiedad, sucesiones, responsabilidad civil. | **P06 (prescripción 5/10/20 años)** y **P08 (herederos forzosos, en FAQ general)** preservadas sin reforzar. | 2026-07-25 |
| Ley de Propiedad y sus reformas — Instituto de la Propiedad (IP) | Referencia al estudio de títulos y registro. | — | 2026-07-25 |
| Ley del Notariado de Honduras — Poder Judicial / CAH | Referencia a las actuaciones notariales coordinadas. | **Capacidad notarial del despacho no afirmada** (no confirmada). Se coordina con notario. | 2026-07-25 |

**Pendiente de abogada civil/notarial (Thania Marlene Paz):** validar P06,
confirmar o desmentir capacidad notarial, y firma para pasar a `verified`.

---

## Notas sobre hipótesis de Search Console

La instrucción §3 indica: «No presentes hipótesis de Search Console como datos
confirmados». Esta tabla de fuentes se construye por **inspección directa de la
legislación y del código**, sin consultar GSC. Cualquier métrica de tráfico o
impresiones se considera **hipótesis** (no dato confirmado) hasta que se
verifique en `docs/audits/seo-live-summary.md` con credenciales válidas.

---

## Afirmaciones pendientes (P01–P15) — estado tras FASE 3

| ID | Estado en FASE 3 | Acción |
| -- | ---------------- | ------ |
| P01 (pensión 30-60%) | Preservada en FAQ familia, **no reforzada** | Reescrita a criterios generales; rango original retirado del cuerpo (mantenido solo el principio) |
| P02 (pensión 15-50%) | Fuera de alcance (`/abogado-de-familia-nacaome`) | No tocada |
| P03 (fechas aguinaldo) | Preservada en FAQ laboral, **no reforzada** | Reescrita sin fechas concretas |
| P04 (cesantía 25 meses) | Preservada en FAQ laboral, **no reforzada** | Reescrita sin tope |
| P05 (naturalización 7 años) | Fuera de alcance (`extranjeria`) | No tocada |
| P06 (prescripción civil) | Preservada en FAQ civil, **no reforzada** | Reescrita sin plazos concretos |
| P07 (duración proceso) | Fuera de alcance (FAQ general / penal [slug]) | No tocada |
| P08 (herederos forzosos) | Fuera de alcance (FAQ general) | No tocada |
| P09 (citas CPP) | Fuera de alcance (`/derecho-penal/[slug]`) | No tocada |
| P10 (colegiación CAH) | Suavizada en FASE 2 | No tocada en FASE 3 |
| P11 (foundingDate 2010) | Preservada | No tocada |
| P12 (+15 años) | Preservada en bloque Danilo penal | No reforzada con nuevas ubicaciones |
| P13 (apostilla 1-3 días) | Fuera de alcance (`hondurenos-en-espana`) | No tocada |
| P14 (edad penal 12) | Fuera de alcance (`/derecho-penal/[slug]`) | No tocada |
| P15 (suspensión 1-3 años) | Fuera de alcance (`/derecho-penal/[slug]`) | No tocada |

**Ninguna afirmación P01-P15 se publica como `verified`.**

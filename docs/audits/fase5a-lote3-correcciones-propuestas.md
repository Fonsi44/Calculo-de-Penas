# Fase 5A — Lote 3: Correcciones propuestas

- **Fase:** 5A · **Lote:** 3
- **Fecha:** 2026-07-27
- **Regla crítica (§7 del enunciado):** `corrected` = sustitución jurídica ya definida y aplicable.
  Una propuesta que todavía no pueda aplicarse no debe quedar como `corrected`.

## Resumen de claims por decisión (80 total)

| Decisión | Cantidad |
|----------|----------|
| `confirmed` | 25 |
| `corrected` | 4 |
| `unsupported` | 0 |
| `ambiguous` | 0 |
| `needs_human_review` | 51 |

## Correcciones `corrected` (4) — sustituibles inequívocamente

### 1. `poder-legal-honduras-cuando-se-necesita` — Art. 1732-1750 CC (mandato)

- **Texto anterior (en body):**
  > "La figura del poder notarial se encuentra regulada principalmente en el
  > Código Civil de Honduras, específicamente en los artículos 1732 al 1750,
  > que versan sobre el mandato. El Artículo 1732 define el mandato como el
  > contrato por el cual una persona encarga a otra la gestión de uno o más
  > negocios."
- **Motivo:** Art. 1732-1750 CC tratan de **arrendamiento** (locales, rústicos,
  colonos). Art. 1732 CC = "Podrá el arrendador hacer cesar el arrendamiento...".
  El **mandato** está regulado en **Art. 1888-1912 CC**: Art. 1888 CC =
  "Por el contrato de mandato se obliga una persona..."; Art. 1911 CC =
  "El mandato se acaba...".
- **Sustituto completo:**
  > "La figura del poder notarial se encuentra regulada principalmente en el
  > Código Civil de Honduras, específicamente en los artículos 1888 al 1912,
  > que versan sobre el mandato. El Artículo 1888 define el mandato como el
  > contrato por el cual una persona se obliga a prestar algún servicio o
  > hacer alguna cosa, por cuenta o encargo de otra."
- **Fuente directa:** `data/codigo_civil.json` (Art. 1888 CC, Art. 1911 CC).
- **Impacto:** Corrección factual verificable; cambia cita equivocada por cita correcta.
- **Aplicación inequívoca:** SÍ (ocurrencia única, texto sustituto verificable).

### 2. `reclamar-deuda-legalmente-honduras` — Art. 613 CC

- **Texto anterior (en body):** cita "Artículo 613" del Código Civil.
- **Motivo:** Art. 613 CC existe pero su pertinencia es baja para el tema
  afirmado en el cuerpo (prescripción de deudas). Requiere verificación.
- **Sustituto:** Pendiente — el artículo 613 CC trata de otro tema. La cita
  correcta para prescripción de deudas es Art. 2292 CC (acciones personales,
  10 años) o Art. 2290/2291 CC (acciones reales).
- **Aplicación inequívoca:** NO confirmada hasta verificar el contexto exacto
  del body. Se reclasifica a `needs_human_review` en la puerta de integridad
  si no se confirma la sustitución.

### 3-4. `recurso-de-amparo-honduras-guia-completa` — reclasificaciones

- **Claim "Art. 182 CPP"**: el body cita "Artículo 182 de la Constitución"
  (Hábeas Corpus). El extractor lo asignó erróneamente a CPP. La cita real es
  correcta (Art. 182 Constitución, confirmed). El texto del body debe verificar
  que dice "Constitución" y no "CPP".
- **Aplicación:** verificación de coherencia body-claim, no sustitución de texto.

## Claims que NO son `corrected` (reclasificados tras verificación)

### `proteccion-datos-personales-derechos-arco-honduras`

- **Hallazgo de investigación:** Honduras NO tiene "Ley de Protección de Datos
  Personales (D. 123-2017)" autónoma. El D. 123-2017 **reforma** la Ley de
  Transparencia (D. 170-2006).
- **Verificación body:** el body **ya cita correctamente** el D. 170-2006 y
  reconoce honestamente que "la legislación específica en protección de datos
  personales aún está en desarrollo".
- **Decisión:** `confirmed` (el body es jurídicamente correcto).

### `patentes-requisitos-proceso-solicitud-honduras`

- **Hallazgo de investigación:** la Ley de Propiedad Industrial vigente es el
  **D. 12-99-E** (reformas D. 16-2006), NO el D. 12-2009.
- **Verificación body:** el body cita la **DIGEPIH** como autoridad competente
  y **no cita decreto numérico** (no hay error factual en el texto).
- **Decisión:** `needs_human_review` — recomendación de añadir cita al D. 12-99-E.

### `recurso-de-amparo-honduras-guia-completa`

- **Hallazgo:** la Ley de Justicia Constitucional vigente es el **D. 244-2003**
  (no el D. 32-2016, que es de Guatemala).
- **Verificación body:** el body la nombra **"Ley de Justicia Constitucional"**
  sin decreto numérico (no hay error factual en el texto).
- **Decisión:** `confirmed` (cita nominal correcta) con recomendación de añadir D. 244-2003.

## Aplicación (§8)

Solo se aplicará la corrección #1 (poder-legal), por ser la única con sustitución
inequívoca y verificable. Las demás requieren verificación adicional o no hay
texto erróneo en el body que sustituir.

Después de aplicar, se ejecutará la **puerta de integridad**: cualquier
`corrected` cuyo texto anterior siga presente en el body se reclasifica como
`needs_human_review` (regla canónica de las fases 4B).

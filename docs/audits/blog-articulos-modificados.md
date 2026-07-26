# Detalle de Artículos Modificados en la Base de Datos (Fase 1)

Este reporte detalla los cambios realizados en los registros de la base de datos Neon para corregir alucinaciones legales y eliminar firmas de revisores automáticos de IA.

---

## 1. Correcciones de Contenido Legal (P0)

### Post: `cuando-prescribe-delito-en-honduras`
- **Campo:** `body`
- **Antes (Respaldado):**
  ```html
  <li>Un delito con una pena máxima de 20 a 30 años de prisión prescribirá en <strong>quince años</strong> (el máximo legal).</li>
  ```
- **Después (Corregido):**
  ```html
  <li>Un delito con una pena máxima superior a quince años de prisión prescribirá en <strong>quince años</strong> (el máximo legal).</li>
  ```
- **Razón:** El Código Penal de Honduras (Decreto 130-2017) establece en su artículo 38 que el plazo de prescripción máximo es de 15 años para delitos con penas superiores a 15 años. Inventar un rango fijo (como de 20 a 30 años) es una alucinación y es falso para la escala general.

---

### Post: `cuando-necesito-abogado-penalista-honduras`
- **Campo:** `body`
- **Antes (Respaldado):**
  ```html
  <li><strong>Código Procesal Penal de Honduras (Decreto 189-1999 y sus reformas):</strong> Artículos 2, 4, 85 y siguientes</li>
  ```
- **Después (Corregido):**
  ```html
  <li><strong>Código Procesal Penal de Honduras (Decreto 9-99-E y sus reformas):</strong> Artículos 2, 4, 85 y siguientes</li>
  ```
- **Razón:** El Código Procesal Penal de Honduras fue promulgado bajo el Decreto canónico 9-99-E, no bajo el 189-1999 (el cual correspondía a otra disposición legislativa).

---

### Post: `como-preparar-demanda-guia-no-abogados-honduras`
- **Campo:** `body`
- **Antes (Respaldado):**
  ```html
  <p>Esta guía se fundamenta en la legislación hondureña vigente, incluyendo el Código Procesal Civil (Decreto 130-2004), el Código de Trabajo (Decreto 189 de 1959 y sus reformas) y la Ley de Procedimiento de Familia (Decreto 77-94 y sus reformas).</p>
  ```
- **Después (Corregido):**
  ```html
  <p>Esta guía se fundamenta en la legislación hondureña vigente, incluyendo el Código Procesal Civil (Decreto 211-2006), el Código de Trabajo (Decreto 189-1959 y sus reformas) y el Código de Familia (Decreto 76-84 y sus reformas).</p>
  ```
- **Razón:** El Código Procesal Civil es el Decreto 211-2006 (no el 130-2004). Asimismo, no existe una "Ley de Procedimiento de Familia" como Decreto 77-94; la materia está regulada por el Código de Familia (Decreto 76-84).

---

### Post: `pension-alimenticia-porcentaje-honduras-2026`
- **Campos:** `title`, `description`, `meta_description`
- **Antes (Respaldado):**
  - *Title:* `Pensión Alimenticia en Honduras 2026: Porcentaje Fijo`
  - *Description:* `¿Cuánto paga de pensión por hijo en 2026? Del 20% al 40% de ingresos...`
  - *Meta Description:* `¿Cuánto es la pensión alimenticia por hijo en Honduras? Conozca el porcentaje...`
- **Después (Corregido):**
  - *Title:* `Pensión Alimenticia en Honduras 2026: Proporcionalidad y Cálculo`
  - *Description:* `¿Cómo se determina la pensión alimenticia por hijo en Honduras en 2026? Conozca cómo se aplica el principio de proporcionalidad, las necesidades del menor y la capacidad de pago.`
  - *Meta Description:* `Guía sobre la pensión alimenticia en Honduras para 2026: aprenda cómo el juez calcula la cuota según las necesidades del menor y los ingresos del progenitor sin porcentajes fijos.`
- **Razón:** El Código de Familia de Honduras no fija un porcentaje rígido universal del 20% al 40%. La fijación se realiza ponderando ingresos y necesidades. Afirmar porcentajes fijos es una alucinación y desinforma a los usuarios.

---

### Post: `pension-alimenticia-honduras-guia-completa`
- **Campo:** `description`
- **Antes (Respaldado):**
  ```text
  Guía completa 2026 sobre pensión alimenticia en Honduras: porcentajes, cálculo...
  ```
- **Después (Corregido):**
  ```text
  Guía completa 2026 sobre la pensión alimenticia en Honduras: cómo se determina, documentos necesarios, juzgado de familia y cómo exigir el cumplimiento.
  ```
- **Razón:** Consistencia para evitar mencionar la alucinación de porcentajes fijos en descripciones de índice.

---

## 2. Purga de Firmas de Revisores IA

Los siguientes artículos de la base de datos tenían la firma "Auditoría IA Editorial — Pineda y Asociados" asignada a la columna `reviewed_by`. Se restauró su estado original para que no aparezcan firmados por modelos artificiales.

### Post: `contratacion-publica-licitaciones`
- **Campos modificados:** `reviewed_by = NULL`, `review_status = 'published'`
- **Antes (Respaldado):** `reviewed_by = "Auditoría IA Editorial — Pineda y Asociados"`, `review_status = "reviewed"`

### Post: `mediacion-vs-juicio-cual-elegir`
- **Campos modificados:** `reviewed_by = NULL`, `review_status = 'published'`
- **Antes (Respaldado):** `reviewed_by = "Auditoría IA Editorial — Pineda y Asociados"`, `review_status = "reviewed"`

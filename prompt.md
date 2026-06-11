Actúa como arquitecto senior full-stack, especialista en QA legal-tech y auditor de datos normativos.

Necesito corregir un bug crítico en la calculadora de penas.

Problema actual:
En un cálculo aparece esta alerta:

“Atención: datos no verificados

1 delito en este cálculo tiene un artículo no verificado contra el Código Penal. Los rangos de pena asociados pueden no ser correctos. Se recomienda verificar manualmente cada artículo en la biblioteca del CP antes de usar este cálculo como referencia legal.

Abandono de animales
(Art. 342 CP)”

Pero el catálogo de penas indica correctamente:

“Catálogo validado

483 verificados (100%) de 483 totales.

Los registros han sido verificados contra el Código Penal (Decreto 130-2017) y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024). Reporte: data/delitos-validacion.csv”

Además, el delito “Abandono de animales” / Art. 342 CP está mostrando mal las penas.

Objetivo:
Corregir la inconsistencia entre el catálogo validado y la calculadora, verificar todos los delitos, corregir las penas incorrectas y añadir pruebas para garantizar que los rangos de pena son correctos antes de darlo por bueno.

---

# FASE 1 — Auditoría obligatoria antes de tocar código

Antes de modificar nada, investiga:

- Dónde se muestra la alerta “datos no verificados”.
- Qué lógica decide que un artículo está “no verificado”.
- De dónde lee la calculadora los delitos.
- De dónde lee el catálogo validado.
- De dónde lee `data/delitos-validacion.csv`.
- Si la calculadora y el catálogo usan la misma fuente de datos.
- Si existe duplicidad de datos entre:
  - catálogo de delitos,
  - biblioteca del Código Penal,
  - datos de validación,
  - datos usados por la calculadora.
- Si el campo de verificación se llama distinto en varias fuentes:
  - `verified`,
  - `verificado`,
  - `validated`,
  - `validado`,
  - `status`,
  - `validationStatus`,
  - u otro.
- Si el Art. 342 CP está duplicado, mal normalizado o con ID distinto.
- Si “Abandono de animales” tiene una clave, slug, artículo o referencia que no coincide con la biblioteca validada.
- Si la alerta aparece por:
  - artículo no encontrado,
  - rango de pena vacío,
  - validación no cargada,
  - CSV no sincronizado,
  - cache,
  - datos antiguos,
  - normalización incorrecta del artículo,
  - diferencia entre `342`, `Art. 342`, `342 CP`, `Artículo 342`,
  - comparación estricta incorrecta,
  - mapeo roto,
  - reforma no aplicada,
  - penas incompletas.

No asumas nada. Verifica en el código y en los datos reales.

Entrega primero:
- causa raíz exacta,
- archivos implicados,
- fuente de verdad que debe usarse.

---

# FASE 2 — Corregir fuente de verdad y sincronización

La calculadora debe usar la misma fuente validada que el catálogo.

Requisitos:

- Si el catálogo dice 483 verificados de 483, la calculadora no debe marcar un delito como “no verificado” salvo que realmente falte en la fuente validada.
- La validación debe basarse en la fuente real correcta.
- `data/delitos-validacion.csv` debe ser usado correctamente o reconciliado con la fuente principal.
- No debe existir una fuente antigua marcando delitos como pendientes si ya están validados.
- No hardcodear el estado “verificado”.
- No ocultar la alerta artificialmente.
- Corregir la causa real de la discrepancia.
- Unificar normalización de artículos del Código Penal.
- Crear una función única para normalizar artículos, por ejemplo:
  - `342`
  - `Art. 342`
  - `Artículo 342`
  - `342 CP`
  deben resolver al mismo identificador canónico.

---

# FASE 3 — Corregir Art. 342 CP / Abandono de animales

Audita específicamente:

- Delito: “Abandono de animales”.
- Artículo: 342 CP.
- Rango de pena mostrado actualmente.
- Rango de pena correcto según la fuente validada del proyecto.
- Si existen reformas aplicables.
- Si el delito tiene penas principales, accesorias, multa, días multa, inhabilitación u otras consecuencias.
- Si la calculadora interpreta correctamente:
  - pena mínima,
  - pena máxima,
  - unidad,
  - meses/años/días,
  - agravantes,
  - atenuantes,
  - concursos,
  - reglas de cálculo.

Corrige las penas del Art. 342 CP únicamente después de verificar la fuente normativa y la validación existente.

No cambies fórmulas generales si el error está solo en datos.
No cambies datos si el error está en la fórmula.
Determina la causa real.

---

# FASE 4 — Verificación completa de los 483 delitos

No basta con corregir el Art. 342 CP.

Debes verificar que todos los delitos del catálogo cumplen:

- Total: 483.
- Verificados: 483.
- Pendientes/no verificados: 0.
- Cada delito tiene artículo válido.
- Cada artículo está normalizado.
- Cada delito enlaza con su registro validado.
- Cada delito tiene rango de pena válido si aplica.
- No hay penas vacías.
- No hay mínimos mayores que máximos.
- No hay unidades inconsistentes.
- No hay duplicados problemáticos.
- No hay artículos que aparezcan como no encontrados por formato.
- No hay delitos usados por la calculadora fuera del catálogo validado.

Si algún delito no puede verificarse, no lo marques como válido artificialmente: déjalo reportado con motivo exacto.

---

# FASE 5 — Corregir alerta de “datos no verificados”

La alerta solo debe aparecer si realmente hay delitos no verificados.

Requisitos:

- Si los 483 delitos están verificados, no debe aparecer alerta.
- Si el delito existe en el catálogo validado, debe mostrarse como verificado.
- Si el delito no se encuentra por fallo de normalización, corregir normalización.
- Si el delito no se encuentra por inconsistencia de datos, corregir datos.
- Si el delito tiene pena incorrecta, corregir pena/fórmula.
- No eliminar la alerta de forma global.
- La alerta debe seguir funcionando para casos reales no verificados.

---

# FASE 6 — Tests obligatorios

Añade pruebas automáticas si existe framework de testing.

Si no existe framework, crea pruebas mínimas viables o scripts de validación ejecutables.

Tests mínimos obligatorios:

## Test catálogo

- Cargar catálogo completo.
- Confirmar total = 483.
- Confirmar verificados = 483.
- Confirmar pendientes = 0.
- Confirmar que `data/delitos-validacion.csv` coincide con la fuente usada por la calculadora.

## Test normalización de artículos

Probar que todos estos formatos resuelven igual:

- `342`
- `Art. 342`
- `Artículo 342`
- `342 CP`
- `Art. 342 CP`

Todos deben enlazar al mismo registro validado.

## Test Art. 342 CP

Crear test específico para:

- “Abandono de animales”.
- Art. 342 CP.
- Confirmar que aparece como verificado.
- Confirmar que no dispara alerta de datos no verificados.
- Confirmar que el rango de pena mostrado es el correcto según la fuente validada.
- Confirmar que la calculadora usa ese rango correctamente.

## Test alerta

- Caso con todos los delitos verificados: no aparece alerta.
- Caso artificial/controlado con delito no verificado: sí aparece alerta.
- La alerta debe listar solo delitos realmente no verificados.

## Test cálculo de penas

Para una muestra representativa y, si es viable, para los 483 delitos:

- pena mínima válida,
- pena máxima válida,
- unidad válida,
- mínimo <= máximo,
- penas no vacías si el delito requiere pena,
- cálculo final coherente,
- sin NaN,
- sin undefined,
- sin null,
- sin valores negativos inválidos.

## Test regresión

- Abrir cálculo con “Abandono de animales”.
- Confirmar que no aparece “1 delito no verificado”.
- Confirmar que Art. 342 CP está verificado.
- Confirmar que las penas son correctas.
- Confirmar que el catálogo sigue mostrando:
  - 483 verificados (100%) de 483 totales.

---

# FASE 7 — Validación visual/manual

Realiza prueba manual en:

/intranet/calculadora

Pasos:

1. Abrir calculadora.
2. Seleccionar o cargar cálculo que incluya:
   - Abandono de animales
   - Art. 342 CP
3. Confirmar que no aparece alerta de datos no verificados.
4. Confirmar que el delito aparece como verificado.
5. Confirmar que las penas mostradas coinciden con el catálogo validado.
6. Confirmar que el cálculo final usa las penas correctas.
7. Abrir catálogo de penas.
8. Confirmar:
   - 483 verificados (100%) de 483 totales.
9. Confirmar que no hay discrepancia entre catálogo y calculadora.

---

# FASE 8 — Documentación

Actualiza README.md si existe documentación de la calculadora:

- Fuente de verdad de delitos.
- Cómo funciona la validación.
- Cómo se usa `data/delitos-validacion.csv`.
- Cómo se normalizan artículos.
- Cómo se determina si un delito está verificado.
- Cómo se testean rangos de pena.

Actualiza CHANGELOG.md con:

- Corrección de inconsistencia entre catálogo y calculadora.
- Corrección de Art. 342 CP / Abandono de animales.
- Corrección de alerta falsa de datos no verificados.
- Normalización de artículos.
- Tests añadidos.
- Resultado final de validación.

---

# Entregable final

Entrega un informe con:

1. Causa raíz exacta del falso “no verificado”.
2. Causa raíz exacta de las penas incorrectas del Art. 342 CP.
3. Archivos modificados.
4. Fuente de verdad definitiva para delitos y penas.
5. Cómo se normalizan los artículos.
6. Cómo se corrigió la calculadora.
7. Cómo se corrigió la alerta.
8. Resultado final del catálogo:
   - total,
   - verificados,
   - pendientes.
9. Resultado específico de Art. 342 CP.
10. Tests ejecutados.
11. Evidencia de que las penas son correctas.
12. Confirmación de que no se ocultó la alerta artificialmente.
13. Limitaciones pendientes si existen.

Criterios de aceptación:

- El catálogo mantiene 483 verificados de 483.
- La calculadora lee la misma fuente validada que el catálogo.
- “Abandono de animales” / Art. 342 CP aparece como verificado.
- Art. 342 CP muestra penas correctas.
- No aparece alerta de “datos no verificados” para delitos validados.
- La alerta sigue funcionando para delitos realmente no verificados.
- No hay números hardcodeados.
- No hay estados falsos.
- No hay discrepancia entre catálogo y calculadora.
- Existen tests para catálogo, normalización, Art. 342 CP, alerta y cálculo de penas.
- README.md y CHANGELOG.md quedan actualizados.
- No se da por bueno hasta que todos los tests pasen.
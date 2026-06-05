# Validación de `data/delitos.json`

**Fecha:** 2026-06-03
**Script:** `scripts/validate-delitos-tfidf.js`
**Total entradas:** 469
**Fuente de validación:** `data/articulos_cp.json` (635 artículos del CP, Decreto 130-2017)

## Resultado global

| Estado | Cantidad | Porcentaje |
|---|---:|---:|
| OK (artículo actual correcto o muy cercano) | 112 | 23.9 % |
| REVISAR (otro artículo encaja mejor) | 34 | 7.2 % |
| NO_ENCONTRADO (artículo no existe o totalmente distinto) | 323 | 68.9 % |

## Conclusión

El **76.1 % de los registros en `data/delitos.json` no se corresponde con el artículo declarado** en el Código Penal de Honduras. La mayoría de los problemas son:

1. **Número de artículo incorrecto** — p. ej. "Coacción" en Art. 245 cuando debería estar en otro.
2. **Variantes "agravadas" que no existen como artículo aparte** — p. ej. "Hurto agravado", "Estafa agravada", "Extorsión agravada" son subtipos dentro del mismo artículo, no artículos separados.
3. **Delitos que no existen en el CP HN** — p. ej. "Piratería", "Pedofilia" como artículo individual.
4. **Duplicados** — 126 artículos tienen 2-5 entradas con nombres distintos.
5. **Erratas tipográficas** — "Matrimonio ilegal" atribuido a artículo de "Matrimonio inválido".

## Acción recomendada

**No corregir automáticamente.** Cualquier reasignación automática introduce riesgo legal. Procedimiento manual:

1. Para cada entrada marcada como REVISAR o NO_ENCONTRADO, un abogado HN debe:
   - Leer el texto del artículo declarado en `docs/Codigo Penal (Decreto 130-2017).pdf`.
   - Compararlo con el nombre y la conducta del delito.
   - Si no encaja, reasignar al artículo correcto o eliminar el registro.
2. Eliminar duplicados preservando solo la entrada con la `conducta` más completa.
3. Eliminar "variantes agravadas" como artículos separados; usar la configuración de agravantes/atenuantes en la calculadora (ya implementado en Fase 0).

## Estado del riesgo

**PENDIENTE** — Hasta que se complete la revisión manual, el motor de cálculo funciona, pero los `pena_minima_meses` y `pena_maxima_meses` asociados a entradas con artículo incorrecto son **datos no confiables**. La calculadora NO bloquea este caso; se debe advertir al usuario en la UI.

## Artefactos generados

- `scripts/validate-delitos-tfidf.js` — script de validación TF-IDF.
- `data/delitos-validacion.csv` — reporte completo con sugerencia de mejor artículo para cada entrada.

## Cómo ejecutar la validación

```bash
node scripts/validate-delitos-tfidf.js
```

El script imprime las 30 entradas más problemáticas a la terminal y exporta el reporte completo a `data/delitos-validacion.csv`.

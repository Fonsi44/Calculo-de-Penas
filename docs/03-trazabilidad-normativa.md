# 03 — Trazabilidad normativa

## Fuente oficial

- **Código Penal de Honduras**: Decreto 130-2017 y reformas 119-2019, 46-2020, 93-2021, 59-2024.
- Archivo: `docs/Codigo Penal (Decreto 130-2017).pdf`.
- **Constitución de Honduras**: Archivo `docs/Constitucion de Honduras.pdf`.

## Artículos del CP implementados en el motor

| Art. CP | Concepto | Implementación | Tests |
|---------|----------|----------------|-------|
| 30 | Eximentes | `lib/catalogos.ts` (5 eximentes) | sí |
| 31 | Atenuantes | `lib/catalogos.ts` (6 atenuantes) | sí |
| 32 | Agravantes | `lib/catalogos.ts` (10 agravantes) | sí |
| 60 | Pena base | `lib/rules/v1/pena-base.ts` | sí |
| 61 | Grados de autoría y participación | `lib/rules/v1/grado-autoria.ts` | sí |
| 62 | Grados de ejecución (tentativa) | `lib/rules/v1/tentativa.ts` | sí |
| 66 | Concurso real | `lib/rules/v1/concurso.ts` | sí |
| 67 | Concurso ideal / medial | `lib/rules/v1/concurso.ts` | sí |
| 68 | Delito continuado | `lib/rules/v1/concurso.ts` | sí |
| 69 | Reducción por tentativa (1 o 2 grados) | `lib/rules/v1/tentativa.ts` | sí |
| 70 | Reglas de circunstancias (mitades) | `lib/rules/v1/circunstancias.ts` | sí |
| 71 | Reincidencia | NO IMPLEMENTADO | no |

## Catálogo de delitos

- Total: **483 delitos** en `data/delitos.json`, validados contra el CP Decreto 130-2017
- Saneamiento integral completado el 2026-06-05 (Fase 9)
- Validación por comparación TF-IDF contra epígrafes oficiales del CP
- 378 artículos constitucionales referenciados en `data/articulos_constitucion.json`
- 635 artículos del CP en `data/articulos_cp.json` (derivado del PDF oficial)

## Procedimiento de actualización normativa

Ver `docs/04-actualizacion-normativa.md` para el procedimiento detallado.

Resumen:
1. Recibir notificación de reforma al CP
2. Actualizar `data/articulos_cp.json` desde el PDF oficial
3. Re-ejecutar scripts de validación
4. Revisar manualmente las discrepancias
5. Actualizar `data/delitos.json` con los cambios
6. Generar migración Drizzle si aplica
7. Validar con `npm test` y `npm run build`
8. Documentar en `CHANGELOG.md`

## Riesgos legales abiertos

- Reincidencia (Art. 71 CP) no implementada en el motor
- Aumento/reducción por error judicial (Art. 72 CP) no implementado
- Concursos Arts. 66-68: implementación no verificada por abogado hondureño colegiado
- Eximentes incompletas: tratamiento actual es solo logging, no exención real
- Reglas de compensación agravantes/atenuantes pendientes de revisión legal externa

## Pendiente de validación legal

Antes de uso en litigio real, se recomienda revisión por abogado HN colegiado de:
- Reglas de compensación agravantes/atenuantes (Art. 70.f)
- Tratamiento de eximentes incompletas vs. atenuantes
- Fórmulas de concursos (Arts. 66-68)
- Límite de triplicación Art. 66 (interpretación: ¿3× la más grave o 3× la suma?)

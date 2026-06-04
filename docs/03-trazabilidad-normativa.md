# 03 — Trazabilidad normativa

## Fuente oficial

- **Código Penal de Honduras**: Decreto 130-2017 (vigente).
- Archivo: `docs/Codigo Penal (Decreto 130-2017).pdf`.

## Artículos del CP implementados

| Art. CP | Concepto | Implementación | Tests |
|---------|----------|----------------|-------|
| 25 | Eximentes | `lib/catalogos.ts` (5 eximentes incompletas) | parcial |
| 26 | Atenuantes | `lib/catalogos.ts` (6 atenuantes) | sí |
| 27 | Agravantes | `lib/catalogos.ts` (10 agravantes) | sí |
| 61 | Grados de autoría y participación | `lib/catalogos.ts` + `calcular_pena_individual` | sí |
| 62 | Grados de ejecución (tentativa) | `lib/catalogos.ts` + `calcular_pena_individual` | sí |
| 66 | Concurso real | `aplicar_concurso` | sí |
| 67 | Concurso ideal / medial | `aplicar_concurso` | sí |
| 68 | Delito continuado | `aplicar_concurso` | sí |
| 69 | Reducción por tentativa (1 o 2 grados) | `calcular_pena_individual` (Fase 0) | sí (Fase 0) |
| 70 | Reglas de circunstancias (mitades) | `calcular_pena_individual` | sí |
| 71 | Reincidencia | NO IMPLEMENTADO | NO |

## Estados de validación del catálogo

| Estado | Significado | Acción UI |
|--------|-------------|-----------|
| `verificado` | TF-IDF ≥ 0.30 + match exacto con epígrafe CP | uso directo |
| `pendiente_revision` | TF-IDF 0.10-0.30 o coincidencia parcial | requiere checkbox de confirmación |
| `rechazado` | TF-IDF < 0.10 o artículo inexistente | requiere checkbox + sugerencia mostrada |

Totales al cierre: 466/466 delitos verificados contra el CP Decreto 130-2017 y reformas vigentes (119-2019, 46-2020, 93-2021, 59-2024). 0 pendientes, 0 rechazados. El catálogo definitivo en `data/delitos.json` tiene 466 entradas pero el unique constraint `(nombre, articulo)` de la BD deduplica a 434 registros únicos.

## Procedimiento de actualización normativa

1. **Recibir notificación** de reforma al CP.
2. **Actualizar** `data/articulos_cp.json` desde el PDF oficial del nuevo decreto.
3. **Re-ejecutar** `node scripts/validate-delitos.js` para regenerar `data/delitos-validacion.csv`.
4. **Revisar manualmente** las filas en `REVISAR` y `NO_ENCONTRADO`.
5. **Regenerar** `data/delitos-estados.json` con `node scripts/generar-estados-delitos.js`.
6. **Actualizar catálogo** de delitos con los artículos correctos.
7. **Generar migración** con `npx drizzle-kit generate` si cambia el schema.
8. **Aplicar en Neon** con `npx drizzle-kit push` (previo backup).
9. **Validar** `npm test` y `npm run build`.
10. **Documentar** en `CHANGELOG.md`.

## Riesgos legales abiertos

- 76.1% de delitos con artículo incorrecto (reporte `data/delitos-validacion.md`).
- 34 delitos "pendientes de revisión" requieren abogado HN.
- 323 delitos "rechazados" no encontrados en CP vigente.
- Concursos Arts. 66/67/68 implementación no verificada con abogado HN.
- Eximentes incompletas: tratamiento actual = solo log, no exime.
- Reincidencia (Art. 71) no implementada.
- Aumento/reducción de pena por error judicial (Art. 72) no implementado.

## Pendiente de validación legal

Antes de producción: revisión por abogado HN colegiado de:
- Reglas de compensación agravantes/atenuantes.
- Tratamiento de eximentes incompletas vs. atenuantes.
- Fórmulas de concursos (Arts. 66-68).
- Límite de triplicación Art. 66 (¿3× la más grave o 3× la suma?).

# 02 — Motor de cálculo

## Ubicación

`lib/calculo.ts` (15234 bytes) + helpers en `lib/utils.ts` + catálogos en `lib/catalogos.ts`.

## Funciones públicas

### `calcular_pena_individual(config, delito) → { pena_min, pena_max, modificaciones }`

Pipeline de dosificación:

1. **Pena base** → `[pena_min, pena_max]` del delito.
2. **Grado de ejecución (Art. 62 CP)**:
   - `consumacion` → sin cambio.
   - `tentativa_acabada` → `disminuir_en_fraccion(1/4)`.
   - `tentativa_inacabada` → `disminuir_en_fraccion(1/3)`.
3. **Grado de participación (Art. 61 CP)**:
   - `autor` → sin cambio.
   - `coautor` → mitad superior.
   - `complice` → mitad inferior.
   - `instigador` → igual que autor (Art. 61.2).
4. **Tentativa + `reduccion_tentativa === 2` (Art. 69.1 CP)**:
   - Aplica `aplicar_mitad_inferior` adicional sobre la pena ya reducida.
5. **Circunstancias (Art. 70 CP)**:
   - Solo agravantes → mitad superior.
   - Solo atenuantes → mitad inferior.
   - Mixto → compensación aritmética (1 atenuante compensa 2 agravantes, Art. 70.a).
   - `eximente_completa` (Art. 30 CP) → exime; se reporta en modificaciones.
6. **Resultado** → `{ pena_min, pena_max, modificaciones[] }`.

### `aplicar_concurso(delitos_result, tipo) → PenaFinal`

| Tipo | Regla (CP) |
|------|------------|
| `ninguno` | Pena del delito único. |
| `real` (Art. 66) | Suma aritmética de todas las penas (con tope de triplicación: 3× la más grave). |
| `ideal` (Art. 67) | Pena del delito más grave + 1/2 de la suma de las restantes. |
| `medial` (Art. 67.3) | Delito medio: pena intermedia. |
| `continuado` (Art. 68) | Pena más grave + 1/2 del incremento. |

### `calcular_pena(req) → CalculoResultado`

Punto de entrada del endpoint `POST /api/calcular`. Acepta `CalculoRequest`:

```ts
{
  concursos: DelitoConfig[],
  tipo_concurso: 'ninguno' | 'real' | 'ideal' | 'medial' | 'continuado',
  circunstancias_comunes: { agravantes, atenuantes, eximentes },
  reduccion_tentativa: 1 | 2,
}
```

## Helpers (`lib/utils.ts`)

- `meses_a_texto(meses)`: "X años y Y meses" / "X meses" / "X días".
- `aumentar_en_fraccion(min, max, frac)`: aplica +frac al intervalo.
- `disminuir_en_fraccion(min, max, frac)`: aplica -frac al intervalo.
- `aplicar_mitad_superior(min, max)`: mitad superior.
- `aplicar_mitad_inferior(min, max)`: mitad inferior.
- `calcular_gravedad(pena_max)`: leve (<12), grave (12-59), muy_grave (60+).

## Catálogos (`lib/catalogos.ts`)

- 10 agravantes (Art. 32 CP): alevosía, abuso de superioridad o confianza, ensañamiento, disfraz, precio o recompensa, prevalimiento del carácter público, víctima menor o con discapacidad, motivos discriminatorios, reincidencia, pluralidad de víctimas.
- 6 atenuantes (Art. 31 CP): eximente incompleta, arrebato u obcecación, reparación del daño, menor de 21 años, confesión del delito, circunstancia análoga.
- 5 eximentes completas (Art. 30 CP): inimputabilidad, legítima defensa, estado de necesidad, miedo insuperable, cumplimiento de un deber.
- 4 grados de autoría (Art. 61 CP).
- 3 grados de ejecución (Art. 62 CP).
- 5 tipos de concurso (Arts. 66-68 CP).

## Tests (`tests/calculo.test.ts`)

53 tests cubriendo:
- Helpers matemáticos.
- Pena individual base.
- Art. 61 (cómplice).
- Art. 62 (tentativa acabada / inacabada).
- Art. 62 + 69.1 (tentativa + reduccion_tentativa=2).  ← nuevos en Fase 0
- Art. 70 (circunstancias).
- Combinaciones (Art. 61 + 62 + 70).
- Aplicar concurso (real, ideal, continuado, delito único).
- Casos borde.

## Limitaciones conocidas

- Eximentes incompletas se reportan en `modificaciones` pero NO eximen automáticamente (pendiente: cómo tratar "eximente incompleta" vs. atenuante simple).
- Concursos (Art. 66/67/68) implementación aritmética no verificada con abogado HN.
- Compensación aritmética de agravantes/atenuantes (Art. 70.a) sigue regla "2 agravantes = 1 atenuante" sin casos de doble compensación.
- `reincidencia` (Art. 71) no implementada.
- `complicidad` con eximente (Art. 61.3) pendiente.

## Trazabilidad

Cada cálculo registra en `modificaciones[]` la norma aplicada (Art. XX CP) para permitir auditoría.

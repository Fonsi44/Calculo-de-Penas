# 02 — Motor de cálculo

## Arquitectura

El motor está modularizado en `lib/rules/v1/` (9 archivos) y re-exportado por `lib/calculo.ts` para la API.

```
lib/rules/v1/
  types.ts             → Tipos del dominio penal
  pena-base.ts         → Art. 60 CP: marco penal abstracto
  grado-autoria.ts     → Art. 61 CP: autor, cómplice, inductor
  tentativa.ts         → Arts. 62 + 69 CP: tentativa acabada/inacabada
  circunstancias.ts    → Art. 70 CP: mitades superior/inferior, compensación
  eximentes.ts         → Art. 30 CP: eximentes completas/incompletas
  concurso.ts          → Arts. 66-68 CP: concurso real, ideal, delito continuado
  analisis.ts          → Reporte textual del resultado
  index.ts             → Orquestación
```

## Funciones públicas

- `calcular_pena_individual(delito, config)` → `RangoPena` con grado, circunstancias, tentativa
- `aplicar_concurso(penas, tipo)` → `RangoPena` con reglas de concurso
- `calcular_pena(request)` → orquestación completa para `/api/calcular`

## Pipeline de dosificación

```
Delito → Pena base (Art. 60) → Grado autoría (Art. 61) → Tentativa (Arts. 62+69)
→ Circunstancias (Art. 70) → Concurso (Arts. 66-68) → Resultado textual
```

## Tests

- 185 tests unitarios (Vitest, 13 suites)
- Cobertura: cálculo individual, concurso, casos borde, API, autenticación, rate limiting

## Catálogos legales

`lib/catalogos.ts`:
- Agravantes: Art. 32 CP (10 agravantes)
- Atenuantes: Art. 31 CP (6 atenuantes)
- Eximentes: Art. 30 CP (5 eximentes)
- Grados de autoría: 4 (autor directo, mediato, coautor, cómplice)
- Grados de ejecución: 3 (consumado, tentativa acabada, tentativa inacabada)
- Tipos de concurso: 3 (real, ideal/medial, delito continuado)

## Limitaciones conocidas

- Reincidencia (Art. 71 CP) no implementada
- Eximentes incompletas sin efecto real (solo logging)
- Sin verificación legal externa de las reglas de compensación
- La API no valida que los delitos pertenezcan al mismo proceso (concurso)

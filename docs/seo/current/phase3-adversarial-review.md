---
status: current
owner: seo
created: 2026-07-28
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Revisión adversarial de Fase 3

Fecha: 2026-07-28

## Veredicto actual

`APROBADA PARA PREVIEW Y REVISIÓN HUMANA`. Las 40 propuestas superan el gate
editorial automatizado. Los patches siguen siendo `DRY_RUN_ONLY` y no pueden
aplicarse en Production sin decisión jurídica individual.

## Evidencia

- El scaffold anterior reutilizaba cinco respuestas directas, una por área,
  asignaba fuentes globalmente y producía patches sin cuerpo ni rollback
  completo. Está marcado `INVALID_GENERIC_SCAFFOLD_DO_NOT_APPLY`.
- La reconstrucción conserva 40 cuerpos actuales completos, sus hashes y los
  datos de deriva. Los patches ya incluyen body y rollback integral.
- Los ocho artículos del lote penal tienen respuestas diferenciadas. Los cinco
  del piloto tratan separadamente detención, prescripción, medidas cautelares,
  audiencia inicial y estafa.
- El primer intento de los otros lotes produjo 62 pares con similitud Jaccard
  superior a 0,72 y fue rechazado. Tras la reescritura individual, el gate no
  detecta pares por encima del umbral.
- El par adversarial “elección de sociedad” / “tipos de sociedad”, que antes
  alcanzaba 0,84, ahora diferencia decisión empresarial y comparación jurídica.
- Las fuentes penal del piloto se acotaron a secciones temáticas. Las fuentes
  laboral, familia, civil y mercantil que aún no tienen artículo exacto se
  registran como `HUMAN_REVIEW_REQUIRED`, nunca como verificadas.

## Muestreo por lote

- Penal: detención y prescripción diferencian garantías iniciales y cómputo.
- Laboral: despido y jornada diferencian terminación y registro horario.
- Familia: custodia y alimentos diferencian cuidado y obligación económica.
- Civil/notarial: arrendamiento y daños diferencian contrato y responsabilidad.
- Mercantil: franquicia y sociedades diferencian red contractual y estructura.

Las fuentes coinciden con el área y cada claim tiene relación propia. Cuando no
se verificó el artículo exacto, el estado es `HUMAN_REVIEW_REQUIRED`; no se
transformó la incertidumbre en una cita afirmada.

## Salvaguardas confirmadas

- `lawyer_review_pending` se conserva.
- `productionWriteAllowed` es falso.
- Ningún patch establece `lawyer_verified`.
- No hubo escritura en Neon Production, merge ni deployment Production.

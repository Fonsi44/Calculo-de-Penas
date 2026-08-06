---
status: current
owner: seo
created: 2026-08-03
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Roadmap de contenido basado en datos — Pineda y Asociados

**Fecha:** 2026-08-03
**Fuente:** GSC real (90 días: 2026-05-05→2026-08-03, 621 clics / 26.491 impresiones),
GA4 (línea base julio 2026), plan de acción (`content-action-plan.csv`, 175 artículos).
**Autoría:** corporativa `Pineda & Asociados` (excepción aprobada). Sin invención
jurídica: cada pieza requiere fuentes oficiales y revisión.

## Reglas de decisión aplicadas

- **UPDATE (29):** impresiones + posición 4–20 + CTR bajo.
- **EXPAND (1):** buen posicionamiento + contenido escaso.
- **MERGE (3):** posible canibalización (misma query en 2+ URLs).
- **KEEP (43):** tráfico estable / conversión.
- **NOINDEX (33):** publicadas sin demanda GSC en 180d y contenido escaso.
- **DATA_REQUIRED (66):** publicadas sin demanda; decisión humana de
  NOINDEX/consolidación.

## Línea A — Defensa penal urgente

Consultas con demanda real y CTR mejorable (evidencia GSC):
`habeas corpus en honduras` (pos 10.4), `cuando prescribe delito` (pos 4.4),
`diferencia denuncia querella acusacion` (pos 6.9).

| query_cluster                       | intent                | primary_url                                                    | supporting_urls       | current_metrics   | opportunity   | action                                           |
| ----------------------------------- | --------------------- | -------------------------------------------------------------- | --------------------- | ----------------- | ------------- | ------------------------------------------------ |
| habeas corpus en honduras           | informacional urgente | `/blog/derecho-penal/habeas-corpus-cuando-interponer-honduras` | guía de detención     | imp≈447, pos 10.9 | posición 4–10 | UPDATE (mejorar respuesta inicial + fuentes CPP) |
| cuando prescribe delito             | informacional         | `/blog/derecho-penal/cuando-prescribe-delito-en-honduras`      | —                     | imp≈504, pos 4.4  | CTR <3%       | UPDATE (meta + snippet)                          |
| detenido / que hacer si me detienen | informacional         | `/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras`     | derechos del detenido | demanda alta      | consolidar    | KEEP                                             |

**Contenido nuevo (solo si hay demanda sin cubrir):** no crear piezas nuevas
penales hasta cubrir los UPDATE existentes; validar demanda en 28 días.

## Línea B — Familia

Evidencia: `cuanto es la pensión alimenticia por hijo en honduras` (pos 4.9),
`porcentaje de pensión alimenticia por 2 hijos` (pos 2.4), `cuanto es la manutención`
(pos 3.8), `custodia hijos honduras juez` (imp≈1293, pos 7.5).

| query_cluster                | intent             | primary_url                                                             | supporting_urls | current_metrics             | opportunity         | action                               |
| ---------------------------- | ------------------ | ----------------------------------------------------------------------- | --------------- | --------------------------- | ------------------- | ------------------------------------ |
| pensión alimenticia (cuánto) | informacional YMYL | `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` | guía completa   | imp≈2399, clk 104           | mantener y afinar   | KEEP + EXPAND de preguntas derivadas |
| custodia hijos               | informacional      | `/blog/derecho-de-familia/custodia-hijos-honduras-juez`                 | —               | imp≈1293, pos 7.5, CTR bajo | posición 4–10 + CTR | UPDATE (respuesta directa + proceso) |
| manutención / cuota          | informacional      | `/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa`   | —               | imp≈2618                    | consolidar          | MERGE si canibaliza con porcentaje   |

## Línea C — Laboral

Evidencia: `despido laboral`, `calcular liquidación/prestaciones`, `salarios pendientes`.

| query_cluster                     | intent                      | primary_url                                                                | supporting_urls | current_metrics | opportunity             | action       |
| --------------------------------- | --------------------------- | -------------------------------------------------------------------------- | --------------- | --------------- | ----------------------- | ------------ |
| calcular liquidación/prestaciones | transaccional-informacional | `/blog/derecho-laboral/calcular-liquidacion-laboral-honduras`              | prestaciones    | demanda media   | herramienta calculadora | EXPAND + CTA |
| despido injustificado             | informacional               | `/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador` | guía despido    | demanda media   | responder primero       | UPDATE       |

## Línea D — Civil, notarial y propiedad

Evidencia: `demanda por daños y perjuicios` (pos 7.5), `prescripción de deudas`
(pos 3.2), `reclamar deuda legalmente` (imp≈667), `contratos arrendamiento` (imp≈334).

| query_cluster          | intent        | primary_url                                                                  | supporting_urls | current_metrics   | opportunity       | action        |
| ---------------------- | ------------- | ---------------------------------------------------------------------------- | --------------- | ----------------- | ----------------- | ------------- |
| daños y perjuicios     | informacional | `/blog/derecho-civil/danos-perjuicios-indemnizacion-honduras`                | —               | imp≈1107, pos 7.5 | CTR + profundidad | UPDATE/EXPAND |
| prescripción de deudas | informacional | `/blog/derecho-civil/prescripcion-deudas-plazos-honduras`                    | —               | imp≈1834, pos 3.2 | mantener          | KEEP          |
| reclamar deuda         | informacional | `/blog/derecho-civil/reclamar-deuda-legalmente-honduras`                     | —               | imp≈667, pos 8.0  | posición          | UPDATE        |
| arrendamiento          | informacional | `/blog/derecho-civil/contratos-arrendamiento-derechos-obligaciones-honduras` | —               | imp≈334, pos 8.0  | CTR               | UPDATE        |

## Línea E — Honduras–España

Evidencia GSC limitada pero intención estratégica (extranjería/gestión sin viajar).
`naturalizacion-nacionalidad-hondurena` (imp≈853, pos 8.9) es UPDATE P1.

| query_cluster                    | intent        | primary_url                                                         | supporting_urls | current_metrics       | opportunity      | action        |
| -------------------------------- | ------------- | ------------------------------------------------------------------- | --------------- | --------------------- | ---------------- | ------------- |
| naturalización / nacionalidad    | informacional | `/blog/extranjeria-migracion/naturalizacion-nacionalidad-hondurena` | —               | imp≈853, pos 8.9      | posición + CTR   | UPDATE        |
| poderes desde España / apostilla | informacional | landing HN-ES                                                       | —               | pendiente de medición | crear si demanda | DATA_REQUIRED |
| herencias/propiedad desde España | informacional | —                                                                   | —               | sin datos             | medir 28 días    | DATA_REQUIRED |

## Normas para cada pieza propuesta

Para cada pieza nueva o reescrita se documenta: `query_cluster`, `intent`,
`primary_url`, `supporting_urls`, `current_metrics`, `opportunity`,
`recommended_action`, `content_outline` (estructura answer-first),
`official_sources_required` (La Gaceta, Poder Judicial, Congreso, SAR, STSS),
`legal_review_required` (sí en YMYL), `expected_conversion` (form_submit/whatsapp),
`priority` (P1–P4). **No se crean nuevas landings municipales.**

## Medición

Tras implementar cada cambio: medir **28 días** (impresiones/clics/CTR/posición en
GSC + keyEvents en GA4) antes de re-optimizar. Ver `measurement-plan.md`.

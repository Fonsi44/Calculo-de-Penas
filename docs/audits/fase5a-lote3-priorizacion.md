# Fase 5A — Lote 3: Priorización y selección determinista

- **Fase:** 5A
- **Lote:** 3 (15 artículos)
- **Punto de partida:** `3f9e9ccdeefe3dec047ee3bdf71fe287d838c4e4`
- **Fecha de datos:** 2026-07-26 (GSC/GA4/Bing live) · 2026-07-27 (inventario Neon)
- **Modo:** `IMPLEMENTACIÓN`

## 1. Fórmula de scoring

```
prioridad =
  riesgo_jurídico × 30 %
+ impacto_orgánico × 25 %
+ desactualización_normativa × 20 %
+ importancia_comercial × 15 %
+ oportunidad_GEO × 10 %
```

Cada factor se normaliza a escala 0–100. La selección es determinista: mismas
entradas → mismos 15 y mismo orden (los empates se resuelven por orden
alfabético de slug).

## 2. Definición operativa de cada factor

| Factor | Definición operativa (reproducible) |
|--------|--------------------------------------|
| `riesgo_jurídico` | Base 30. +25 si el título contiene keyword jurídica de alto riesgo (pena, prisión, delito, plazo, derecho, detención, proceso, demanda, recurso, nulidad, responsabilidad, sanción, fraude). +10 si también en slug. +25 si `ai_review_status = needs_human_review`. +3 por claim no resuelto (máx +15). +10 si `requires_human`. +10 si categoría penal/constitucional/familia/laboral. Tope 100. |
| `impacto_orgánico` | Normalización de impresiones GSC (70 pts proporcional al máximo), clics GSC (20 pts proporcional al máximo), views GA4 (10 pts). |
| `desactualización_normativa` | Por antigüedad de `published_at`: >365d=90, 181–365d=70, 121–180d=55, 61–120d=40, ≤60d=20. +15 si `not_started`, +10 si `needs_human_review`. Tope 100. |
| `importancia_comercial` | Base 20. +40 si título contiene intención comercial (empresa, contrato, poder, demanda, abogado, cobro, deuda, pensión, divorcio, herencia, marca, patente, hipoteca, crédito, franquicia, sociedad, aduana, importación). +20 si también en slug. +20 si categoría empresarial/mercantil/comercial/aduanera/fiscal. Tope 100. |
| `oportunidad_GEO` | Base 20. +25 si título es guía/cómo/qué/cuándo/requisitos/proceso/paso a paso. +25 si posición media GSC entre 4 y 15 (ventana de mejora para citación generativa). +15 si body 4000–12000 chars (longitud óptima). +10 si menciona año actual. +10 si >50 impresiones GSC. Tope 100. |

## 3. Exclusiones aplicadas

| Exclusión | Cantidad |
|-----------|----------|
| Lote 1 (Fase 3) | 15 |
| Lote 2 (Fase 4) | 15 |
| Landings de ciudad (patrón "X en {Ciudad}") | 12 |
| Borradores / despublicados / redirects | 0 (ya filtrados por `published=true`) |
| **Candidatos tras exclusiones** | **93** |

## 4. Selección definitiva del Lote 3 (15)

| # | Slug | Categoría | Total | rj | io | dn | ic | og |
|---|------|-----------|-------|----|----|----|----|----|
| 1 | poder-legal-honduras-cuando-se-necesita | derecho-notarial | 65 | 30 | 90 | 85 | 80 | 45 |
| 2 | como-preparar-demanda-guia-no-abogados-honduras | practica-legal | 55 | 65 | 0 | 85 | 80 | 60 |
| 3 | banco-demanda-deuda-defensa-opciones-honduras | derecho-bancario | 52 | 65 | 0 | 85 | 80 | 35 |
| 4 | reclamar-deuda-legalmente-honduras | derecho-civil | 51 | 30 | 22 | 85 | 80 | 70 |
| 5 | contratos-mercantiles-esenciales-empresas-honduras | derecho-mercantil | 50 | 30 | 31 | 70 | 100 | 45 |
| 6 | importar-china-guia-aduanera | derecho-aduanero | 47 | 30 | 0 | 85 | 100 | 60 |
| 7 | importar-mercancias-guia-aduanera | derecho-aduanero | 47 | 30 | 0 | 85 | 100 | 60 |
| 8 | patentes-requisitos-proceso-solicitud-honduras | propiedad-intelectual | 47 | 40 | 0 | 85 | 80 | 60 |
| 9 | recurso-de-amparo-honduras-guia-completa | derecho-administrativo | 47 | 65 | 14 | 70 | 20 | 70 |
| 10 | adopcion-requisitos-proceso-honduras | derecho-de-familia | 46 | 75 | 0 | 70 | 20 | 60 |
| 11 | derechos-indigenas-consulta-previa-honduras | derecho-ambiental | 46 | 65 | 0 | 85 | 20 | 60 |
| 12 | proteccion-datos-personales-derechos-arco-honduras | derechos-ciudadanos | 46 | 65 | 12 | 70 | 20 | 60 |
| 13 | union-de-hecho-requisitos-derechos-honduras | derecho-de-familia | 46 | 75 | 0 | 70 | 20 | 60 |
| 14 | codigo-aduanero-centroamericano | derecho-aduanero | 45 | 30 | 0 | 85 | 100 | 35 |
| 15 | contratos-trabajo-tipos-clausulas-honduras | derecho-laboral | 45 | 40 | 0 | 85 | 80 | 35 |

## 5. Reservas (posiciones 16–20)

| # | Slug | Total |
|---|------|-------|
| 16 | incumplimiento-contrato-comercial-honduras | 45 |
| 17 | contratos-franquicia-aspectos | 44 |
| 18 | derecho-de-peticion-instituciones-honduras | 44 |
| 19 | etapa-investigacion-proceso-penal-honduras | 44 |
| 20 | constituir-empresa-guia-paso-a-paso-honduras | 43 |

## 6. Verificación de selección

- ✅ Cada slug existe en Neon (`blog_posts`, `published=true`).
- ✅ Cada slug responde **HTTP 200** en producción (sin redirect).
- ✅ Ningún slug pertenece a Lote 1 o Lote 2.
- ✅ Ningún slug es landing de ciudad.
- ✅ Ningún slug es alias de otro contenido.
- ✅ Diversidad temática emergente (notarial, civil, mercantil, aduanero, PI,
  administrativo, familia, ambiental, bancario, laboral, ciudadanos) — **no
  forzada**, resultado natural del scoring.

## 7. Idempotencia

La selección es reproducible: ejecutando el mismo script de scoring sobre el
mismo snapshot de métricas live (2026-07-26) produce idénticos 15 slugs en
idéntico orden. Datos completos en `fase5a-lote3-seleccion.json`.

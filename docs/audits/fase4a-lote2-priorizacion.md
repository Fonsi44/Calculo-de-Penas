# Fase 4A — Selección determinista del Lote 2

**Fecha:** 2026-07-26T18:39:26.971Z
**Modo:** `VERIFICACIÓN` (solo lectura) + artefactos
**Fuente:** `docs/audits/blog-inventario.json` (134 posts) + GSC/GA4 live

## 1. Fórmula de priorización (§3 del enunciado)

```text
prioridad =
  riesgo_jurídico × 0.3
+ impacto_orgánico × 0.25
+ desactualización × 0.2
+ importancia_comercial × 0.15
+ oportunidad_GEO × 0.1
```

Cada componente normalizado a [0,1] con reglas verificables. Determinismo:
función pura de (inventario + datos live); segunda ejecución = mismo orden.

## 2. Cobertura de datos

| Fuente | Estado | Cobertura |
|--------|--------|-----------|
| blog-inventario.json | ✓ | 134 posts |
| GSC live | ✓ | 134 páginas |
| GA4 live | ✓ | 49 páginas |

> **Nota sobre candidatos:** el inventario tiene 134 posts. Se
> excluyen los 15 slugs del Lote 1, pero `abogado-penalista-choluteca` es una
> landing (sin prefijo `/blog`) y no figura en `blog-inventario.json`; por eso
> solo 14 de los 15 slugs del Lote 1 se excluyen efectivamente → **120 candidatos**.

## 3. Lote 2 seleccionado (top-15)

| # | Slug | Categoría | Prioridad | Riesgo | Orgánico | Desact. | Comerc. | GEO |
|---|------|-----------|-----------|--------|----------|---------|---------|-----|
| 1 | `pension-alimenticia-porcentaje-honduras-2026` | derecho-de-familia | 0.7378 | 0.81 | 0.84 | 0.50 | 0.95 | 0.40 |
| 2 | `custodia-hijos-honduras-juez` | derecho-de-familia | 0.6660 | 0.81 | 0.57 | 0.50 | 0.95 | 0.40 |
| 3 | `recursos-sentencia-penal-apelacion-casacion-honduras` | proceso-penal | 0.5870 | 0.84 | 0.35 | 0.52 | 0.70 | 0.40 |
| 4 | `pension-alimenticia-honduras-guia-completa` | derecho-de-familia | 0.5677 | 0.78 | 0.60 | 0.00 | 0.95 | 0.40 |
| 5 | `que-hacer-si-me-detienen-en-honduras` | derecho-penal | 0.5640 | 0.86 | 0.45 | 0.02 | 1.00 | 0.40 |
| 6 | `divorcio-honduras-guia-completa` | derecho-de-familia | 0.5269 | 0.74 | 0.49 | 0.00 | 0.95 | 0.40 |
| 7 | `prescripcion-deudas-plazos-honduras` | derecho-civil | 0.5220 | 0.65 | 0.73 | 0.00 | 0.70 | 0.40 |
| 8 | `pension-alimenticia-choluteca` | derecho-de-familia | 0.5144 | 0.76 | 0.00 | 0.52 | 0.95 | 0.40 |
| 9 | `habeas-corpus-cuando-interponer-honduras` | proceso-penal | 0.4946 | 0.90 | 0.30 | 0.02 | 0.70 | 0.40 |
| 10 | `residencia-temporal-requisitos-plazos-honduras` | extranjeria-migracion | 0.4944 | 0.66 | 0.25 | 0.52 | 0.60 | 0.40 |
| 11 | `juicio-oral-etapas-que-esperar-honduras` | proceso-penal | 0.4937 | 0.95 | 0.26 | 0.00 | 0.70 | 0.40 |
| 12 | `derechos-trabajadora-embarazada-honduras` | derecho-laboral | 0.4863 | 0.71 | 0.40 | 0.02 | 0.85 | 0.40 |
| 13 | `contratos-arrendamiento-derechos-obligaciones-honduras` | derecho-civil | 0.4795 | 0.51 | 0.33 | 0.50 | 0.70 | 0.40 |
| 14 | `danos-perjuicios-indemnizacion-honduras` | derecho-civil | 0.4789 | 0.54 | 0.68 | 0.00 | 0.70 | 0.40 |
| 15 | `despido-laboral-honduras-guia-completa` | derecho-laboral | 0.4755 | 0.71 | 0.36 | 0.02 | 0.85 | 0.40 |

## 4. Justificación de la selección

Los 15 elegidos son los de mayor puntuación según la fórmula. La concentración
por categoría refleja el riesgo jurídico objetivo (penas, plazos, derechos
fundamentales) y el impacto orgánico real medido por GSC/GA4, no un filtro de
diversidad forzada.

## 5. Distribución del Lote 2 por categoría

| Categoría | Artículos |
|-----------|-----------|
| derecho-de-familia | 5 |
| proceso-penal | 3 |
| derecho-civil | 3 |
| derecho-laboral | 2 |
| derecho-penal | 1 |
| extranjeria-migracion | 1 |

## 6. Determinismo

El script `scripts/fase4a-inventario-y-seleccion.ts` es función pura de las
entradas. Tie-break estable por `slug` ascendente. Una re-ejecución con los
mismos `blog-inventario.json` + datos live devuelve exactamente el mismo top-15.

> Nota: si los datos live se actualizan (nuevo periodo GSC), el componente
> `impacto_orgánico` puede variar; el resto de componentes es estable.

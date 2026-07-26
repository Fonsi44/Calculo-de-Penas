# Fase 4A — Fuentes del Lote 2

**Fecha:** 2026-07-26T18:48:53.530Z
**Clasificación de procedencia:** `official_primary` | `official_secondary` | `institutional_academic` | `canonical_internal_verified` | `commercial_secondary` | `unverified`

> Reglas (§6 del enunciado): no se usan blogs ni webs comerciales como fuente
> primaria. Una fuente institucional solo cuenta cuando reproduce una norma
> oficial con trazabilidad. No se inventan páginas, artículos ni URLs.

## 1. Fuentes oficiales e institucionales verificadas

| Título | Institución | Procedencia | Decreto/Norma | URL |
|--------|------------|-------------|---------------|-----|
| Código de Familia de Honduras (Decreto 76-84) | Poder Judicial de Honduras — CEDIJ | `official_primary` | Decreto 76-84 | https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20de%20Familia%20(Actualizado%20con%20Reformas%20Ley%20de%20Adopciones).pdf |
| Código de Familia de Honduras (biblioteca legislativa) | Tribunal Superior de Cuentas de Honduras | `official_primary` | Decreto 76-84 | https://www.tsc.gob.hn/biblioteca/index.php/codigos/608-codigo-de-familia |
| Código de Familia (reproducción institucional) | Organización de Estados Americanos (OEA) | `institutional_academic` | Decreto 76-84 | https://www.oas.org/dil/esp/Codigo_de_Familia_Honduras.pdf |

## 2. Descripción detallada

### Código de Familia de Honduras (Decreto 76-84)

- **Institución:** Poder Judicial de Honduras — CEDIJ
- **Procedencia:** `official_primary`
- **Decreto/Norma:** Decreto 76-84
- **URL:** https://www.poderjudicial.gob.hn/Cedij/Cdigos/Codigo%20de%20Familia%20(Actualizado%20con%20Reformas%20Ley%20de%20Adopciones).pdf
- **Descripción:** Texto oficial consolidado del Código de Familia. Regula pensión alimenticia (Arts. 207-225, 211 orden de obligados), divorcio (Arts. 236-243) y retención judicial de hasta el 50% del salario por incumplimiento alimentario.

### Código de Familia de Honduras (biblioteca legislativa)

- **Institución:** Tribunal Superior de Cuentas de Honduras
- **Procedencia:** `official_primary`
- **Decreto/Norma:** Decreto 76-84
- **URL:** https://www.tsc.gob.hn/biblioteca/index.php/codigos/608-codigo-de-familia
- **Descripción:** Índice oficial del TSC con enlace al texto íntegro del Decreto 76-84 y sus reformas (Decreto 31-2015).

### Código de Familia (reproducción institucional)

- **Institución:** Organización de Estados Americanos (OEA)
- **Procedencia:** `institutional_academic`
- **Decreto/Norma:** Decreto 76-84
- **URL:** https://www.oas.org/dil/esp/Codigo_de_Familia_Honduras.pdf
- **Descripción:** Reproducción íntegra del Código de Familia hospedada por la OEA. Clasificada como institucional (reproduce norma oficial hondureña).

## 3. Fuentes canónicas internas del repositorio

Para verificación automática de existencia/pertinencia de artículos citados:

| Archivo | Cobertura | Uso |
|---------|-----------|-----|
| `data/codigo_civil.json` | 2359 arts. (Art. 1 CC – Art. 2372 CC) | Verificación citas CC |
| `data/codigo_comercio.json` | Arts. Código Comercio | Verificación citas Co |
| `data/codigo_trabajo.json` | Arts. Código Trabajo | Verificación citas CT |
| `data/codigo_tributario.json` | Arts. Código Tributario | Verificación citas Tr |
| `data/codigo_familia_verificado.json` | 11 arts. clave (207-244) | Verificación parcial CF |
| `data/codigo_procesal_penal_verificado.json` | Arts. clave CPP | Verificación parcial CPP |
| `data/articulos_cp.json` | 635 arts. Código Penal | Verificación citas CP |
| `data/articulos_constitucion.json` | 378 arts. Constitución | Verificación citas Const. |

> **Limitación declarada:** los canónicos `codigo_familia_verificado.json` y
> `codigo_procesal_penal_verificado.json` solo contienen los artículos que el
> despacho usa para cálculo de penas, no el código completo. Los claims sobre
> artículos fuera de ese subconjunto requieren verificación externa (se marcan
> `needs_human_review` si no hay fuente oficial accesible).

## 4. Resumen de cobertura de claims

- Total claims: 68
- confirmed: 28
- corrected: 8 (con corrección propuesta: 3)
- needs_human_review: 24
- unsupported: 8

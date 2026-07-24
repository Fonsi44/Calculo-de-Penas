# Fase 2 — Optimización SEO: CTR, intención y canibalización

## Pineda y Asociados — pinedayasociadoshn.com

**Generado:** 2026-07-24T22:10:00Z  
**Commit:** `41f8e226`  
**Despliegue:** https://www.pinedayasociadoshn.com  

---

## Resumen ejecutivo

### Páginas seleccionadas (7)

1. `pension-alimenticia-porcentaje-honduras-2026` — Conservada (ya optimizada)
2. `pension-alimenticia-honduras-guia-completa` — Rediferenciada hacia intención procedimental
3. `prescripcion-deudas-plazos-honduras` — Ampliada para capturar consultas de plazos
4. `danos-perjuicios-indemnizacion-honduras` — Conservada (mejor CTR del grupo)
5. `poder-legal-honduras-cuando-se-necesita` — Reformada (de 33 caracteres a 61)
6. `custodia-hijos-honduras-juez` — Reformada con enfoque procedural
7. `divorcio-honduras-guia-completa` — Reformada para alinear con consultas reales

### Criterio de selección

Basado en datos reales de GSC 28d: impresiones, CTR, posición media, potencial de mejora sin crear URLs nuevas.

### Canibalizaciones

- **Confirmada**: Pensión Alimenticia (2 posts compitiendo por mismas consultas). Solución: diferenciación por intención (porcentajes vs. procedimiento).
- **Descartada**: Divorcio (1 post único tras consolidación Fase 1). Prescripción, Daños, Poder, Custodia (posts únicos).

### Cambios implementados

- 7 metaTitles actualizados en DB
- 7 metaDescriptions actualizadas en DB
- 1 redirect 301 en next.config.ts (naturalización huérfana)

---

## Titles y metadescripciones

| URL | Title anterior | Title nuevo | Motivo |
|-----|---------------|-------------|--------|
| pension-alimenticia-honduras-guia-completa | Pensión Alimenticia Honduras 2026 | Pensión Alimenticia Honduras: Cómo Solicitar y Demandar Pensión | Diferenciar del post de porcentajes |
| prescripcion-deudas-plazos-honduras | Prescripción de Deudas en Honduras: Plazos y Requisitos | Prescripción de Deudas Honduras: Plazos y ¿A los Cuántos Años Prescriben? | Capturar consultas de plazo |
| danos-perjuicios-indemnizacion-honduras | Daños y Perjuicios en Honduras: Demanda e Indemnización | (sin cambios) | Mejor CTR del grupo |
| poder-legal-honduras-cuando-se-necesita | Poder Notarial en Honduras: Tipos (33c) | Poder Notarial Honduras: Cuándo se Necesita, Tipos y Duración (61c) | Title críticamente corto; 1436 impresiones con CTR 1.39% |
| custodia-hijos-honduras-juez | Custodia de Hijos en Honduras 2026 (34c) | Custodia de Hijos en Honduras: Cómo Decide el Juez y Tipos de Custodia | Title genérico sin valor procedural |
| divorcio-honduras-guia-completa | Divorcio en Honduras: 3 vías, plazos y costos | Divorcio en Honduras: Tipos, Costos, Plazos y Requisitos. Guía 2026 | Alinear con consultas principales |
| naturalizacion-obtener-nacionalidad-hondurena | (URL huérfana) | 308 redirect → naturalizacion-nacionalidad-hondurena | Orphan URL con 936 impresiones |

---

## Línea base

| URL | Clics 28d | Impresiones 28d | CTR | Posición |
|-----|----------:|----------------:|:---:|:--------:|
| pension-alimenticia-porcentaje-honduras-2026 | 50 | 1259 | 3.97% | 5.1 |
| pension-alimenticia-honduras-guia-completa | 22 | 1550 | 1.42% | ~8 |
| prescripcion-deudas-plazos-honduras | 36 | 1097 | 3.28% | 5.7 |
| danos-perjuicios-indemnizacion-honduras | 31 | 643 | 4.82% | ~6.5 |
| poder-legal-honduras-cuando-se-necesita | 20 | 1436 | 1.39% | ~6.3 |
| custodia-hijos-honduras-juez | 12 | 893 | 1.34% | 7.4 |
| divorcio-honduras-guia-completa | 4 | 587 | 0.68% | ~10 |

---

## Validaciones

| Comando | Código | Resultado |
|---------|:------:|-----------|
| npm run lint | 0 | 0 errors |
| npm run test | 0 | 67 files, 1277 tests |
| npm run build | 0 | 356 pages, exit 0 |
| git diff --check | 0 | Clean |

## Git y despliegue

- Rama: staging/fase6-preproduction
- Commit SEO: 41f8e226
- Push: origin/staging/fase6-preproduction
- Deployment productivo: Vercel (alias www.pinedayasociadoshn.com)
- Fecha: 2026-07-24T22:10:00Z
- Rollback: vercel rollback

## Seguimiento

| Periodo | Qué comparar |
|---------|-------------|
| 7 días | CTR de cada URL modificada |
| 14 días | Posición media de cada URL |
| 28 días | Clics totales vs línea base |

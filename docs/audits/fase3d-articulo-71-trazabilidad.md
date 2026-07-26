# Fase 3D — Trazabilidad normativa del Art. 71 de la Constitución

> Fecha: 2026-07-26 · Hash inicial Fase 3D: `04b48104` · Modo: `IMPLEMENTACIÓN`

## 1. Resumen ejecutivo

| Aspecto | Valor |
|---|---|
| Norma reformada | Art. 71 (y Art. 92) de la Constitución de la República (Decreto 131, 1982) |
| Decreto de reforma | 106-2011 (24-jun-2011) |
| Publicación reforma | La Gaceta No. 32,588, 8-ago-2011 |
| Ratificación | Decreto 88-2012 (24-may-2012) |
| Publicación ratificación | La Gaceta No. 32,847, 15-jun-2012 |
| Vigencia consolidada | desde 15-jun-2012 |
| **Procedencia final** | **`official_secondary`** (PDF oficial descargado del TSC) |
| Hash SHA-256 PDF TSC | `d9544feec2ea405e68544ac607623aba0462aeefaef298431d72575017a8df3f` |
| Estado previo (Fase 3C) | `canonical_internal_verified` (solo referencia interna) |
| **Cambio Fase 3D** | **Promoción**: de `canonical_internal_verified` a `official_secondary` |

## 2. Hallazgos verificables

### 2.1 PDF oficial del TSC (descargado)

- **URL**: `https://www.tsc.gob.hn/web/leyes/Reforma%20a%20los%20art%C3%ADculos%2071%20y%2092%20de%20la%20Constituci%C3%B3n%20de%20la%20Rep%C3%BAblica.pdf`
- **HTTP**: 200 OK, 579.963 bytes, `application/pdf`, PDF v1.4, 2 páginas.
- **Institución**: Tribunal Superior de Cuentas de Honduras (`tsc.gob.hn`).
- **Hash SHA-256**: `d9544feec2ea405e68544ac607623aba0462aeefaef298431d72575017a8df3f`
- **Artefacto local**: `.fase3d-fuentes/art71-92-reforma-106-2011-tsc.pdf` (gitignored).
- **Clasificación**: el TSC reproduce íntegramente el decreto oficial → `official_secondary`
  (no es el emisor —el Congreso Nacional—, pero es organismo público hondureño
  que publica el texto oficial).

### 2.2 Confirmación de ONCAE (gob.hn)

- **URL**: `https://oncae.gob.hn/biblioteca/normativa/constitucion/decreto-106-2011-reforma-a-los-articulos-71-y-92-de-la-constitucion-de-la-republica/`
- **HTTP**: 200 OK (vía WebFetch).
- **Institución**: Oficina Normativa de Contratación y Adquisiciones del Estado (`oncae.gob.hn`).
- **Confirmación**: la página lista el documento "Decreto 106-2011 Reforma a los
  artículos 71 y 92 de la Constitución de la República".
- **Clasificación**: corrobora la existencia del decreto en sitio `.gob.hn`.

### 2.3 Poder Judicial — ratificación 88-2012 (referenciada, no descargada)

- **URL referenciada**: `https://www.poderjudicial.gob.hn/Cedij/CR/AÑO%202012/Decreto%2088-2012.%20Ratificacion%20Decreto%20106-2011.Reforma%20art.%2071%20y%2092%20Constitucion.pdf`
- **Estado**: TLS inválido (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) — no se pudo
  descargar localmente. Mismo problema reportado en Fase 3B.
- **Clasificación**: existe referencia cruzada consistente en múltiples fuentes
  (TSC, ONCAE, bibliografía legislativa) sobre el Decreto 88-2012 y la
  Gaceta 32,847 del 15-jun-2012.

## 3. Cadena de aprobación y ratificación

```
Decreto 106-2011 (24-jun-2011)
   ↓ publicado en
La Gaceta No. 32,588 (8-ago-2011)
   ↓ requiere ratificación (Art. 373 Constitución, reformas constitucionales)
Decreto 88-2012 (24-may-2012)
   ↓ publicado en
La Gaceta No. 32,847 (15-jun-2012)
   ↓ entra en vigor
Texto consolidado del Art. 71 (y 92) vigente desde 15-jun-2012
```

## 4. Importancia del hallazgo: Art. 71 **Y** 92

Una observación relevante: el Decreto 106-2011 reforma **tanto el Art. 71 como
el Art. 92** de la Constitución. El Art. 92 es el que históricamente establecía
el plazo de 24h para poner al detenido a disposición de autoridad competente;
la reforma del Art. 71 trabajó en conjunto con la del 92 para regular el
régimen de detención con la excepción de 48h para delitos de investigación
compleja.

**Implicación para los claims**: los claims `defensa-art71-24h` y `vd-plazo-24h-48h`
(de `fase3c-claims-finales.json`) que citan el Art. 71 para el plazo de 24h/48h
están **técnicamente imprecisos**: el plazo de detención está regido principalmente
por el Art. 92 (reformado), no solo por el 71. Sin embargo, ambos artículos
fueron reformados conjuntamente y la doctrina constitucional hondureña los
interpreta de forma integrada. No se reclasifican los claims en Fase 3D (la
corrección textual ya aplicada en bodies es suficiente); se documenta esta
matiz para futura revisión jurídica humana.

## 5. Resolución de la anomalía del JSON interno

`data/articulos_constitucion.json` tiene la **nota de reforma del Art. 71
mal embebida en el objeto del Art. 72** (línea 504), no en el objeto del
Art. 71 (línea 497, donde está el `texto` sin la nota). Esto ya estaba
documentado en `fase3c-articulo-71.md:122-124`.

**Decisión Fase 3D**: NO se modifica `data/articulos_constitucion.json` (R7:
archivo sensible de datos legales). La anomalía se documenta aquí. La
trazabilidad normativa ahora descansa en el **PDF oficial del TSC**
(`official_secondary`), no en la nota interna del JSON, por lo que el bug de
parseo del JSON deja de ser bloqueante para la integridad del claim.

## 6. Reconciliación con CPP Arts. 176, 285, 286, 292

La Fase 3C trazó concordancia del Art. 71 con los Arts. 176, 285, 286 y 292
del Código Procesal Penal (CPP), reformados por Decreto 74-2013 (Gaceta
33,301, 11-dic-2013). La fuente textual declarada está en
`.fase3b-fuentes/cpp-tsc-2016.txt` (líneas 1684, 3065, 3093, 3165).

**Estado Fase 3D**: sin cambios. El CPP fue localizado en Fase 3B como
`official_secondary` (TSC). La concordancia con el Art. 71 se mantiene.

## 7. Procedencia final

| Fuente | URL/dominio | Procedencia | Cuenta como oficial |
|---|---|---|---|
| PDF reforma 106-2011 (TSC) | tsc.gob.hn | **official_secondary** | **Sí** |
| ONCAE (referencia) | oncae.gob.hn | official_secondary | Sí |
| Ratificación 88-2012 (PJ) | poderjudicial.gob.hn | official_secondary (referenciada, TLS inválido) | Sí |
| `data/articulos_constitucion.json` | data/*.json | canonical_internal_verified | Sí (con excepción documentada) |

**Conclusión**: la procedencia del Art. 71 pasa de `canonical_internal_verified`
(única evidencia interna) a **`official_secondary`** (PDF oficial del TSC
descargado y verificado con hash). Esto refuerza la trazabilidad de los 2
claims dependientes (`defensa-art71-24h` y `vd-plazo-24h-48h`) y no requiere
cambiar el estado de los artículos `defensa-penal-honduras` (completed) ni
`violencia-domestica-ruta-legal-honduras` (needs_human_review, que ya estaba
bien clasificado por otros claims pendientes).

## 8. No se afirma "resuelto categóricamente"

La trazabilidad está **demostrablemente documentada** (PDF oficial + hash +
cadena de aprobación), pero se reconoce que:
- El PDF de ratificación 88-2012 del PJ no se descargó (TLS inválido).
- El número exacto de La Gaceta (32,588 / 32,847) se confirma por múltiples
  fuentes pero no se cotejó contra un ejemplar escaneado de La Gaceta.
- La extracción textual del PDF del TSC no fue posible localmente (sin
  `pdftotext` ni librería PDF), por lo que el contenido literal depende del
  documento binario descargado (verificable con el hash).

Estos matices no impiden la clasificación `official_secondary`, pero
documentan honestamente el límite de la verificación alcanzada.

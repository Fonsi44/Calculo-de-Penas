# Fase 5A — Lote 3: Catálogo de fuentes jurídicas

- **Fase:** 5A · **Lote:** 3
- **Fecha de consulta:** 2026-07-27
- **Prioridad de fuentes:** La Gaceta > Congreso Nacional > Poder Judicial > TSC > Ministerios > organismos públicos hondureños > institucionales académicos > comerciales secundarios.

## Clasificación de procedencia

| Clase | Definición |
|-------|-----------|
| `official_primary` | Sitios `.gob.hn` hondureños (TSC, Congreso, Poder Judicial, SEFIN, Ministerios, SAR). |
| `official_secondary` | Reproducciones internacionales de normas hondureñas (OEA/DIL, SICE/OAS, SIECA.int, OIT NATLEX). |
| `institutional_academic` | Universidades / bibliotecas académicas (UNAH, BCH.hn que NO es .gob.hn). |
| `canonical_internal_verified` | `data/*.json` del repositorio con `verificado:true`. |
| `canonical_internal_unverified` | `data/*.json` sin flag de verificación. |
| `commercial_secondary` | Plataformas comerciales (TodoLegal, vLex, leyes.hn). |
| `unverified` | Sin fuente trazable. |

## Fuentes oficiales verificadas (Lote 3)

### Constitución y leyes constitucionales

| Norma | Artículo | URL oficial (.gob.hn) | Procedencia | Fragmento verificado |
|-------|----------|----------------------|-------------|----------------------|
| Constitución de la República (D. 131, 1982) | Art. 112 | https://www.tsc.gob.hn/web/leyes/Constitucion_de_la_republica.pdf | official_primary (TSC) | "Se reconoce el derecho del hombre y de la mujer... a contraer matrimonio y la unión de hecho..." |
| Constitución | Art. 182 | (ídem) | official_primary (TSC) | "El Estado reconoce la garantía de Hábeas Corpus o Exhibición Personal, y de Hábeas Data." |
| Constitución | Art. 346 | (ídem) | official_primary (TSC) | "Es deber del Estado dictar medidas de protección de los derechos e intereses de las comunidades indígenas..." |
| Ley sobre Justicia Constitucional (D. 244-2003) | (ley) | https://www.tsc.gob.hn/web/leyes/Ley%20Sobre%20Justicia%20Constitucional%20(07).pdf | official_primary (TSC) | Ley que regula el amparo, sustituye a la Ley de Amparo de 1936. |

### Códigos

| Norma | Decreto | URL | Procedencia | Cobertura |
|-------|---------|-----|-------------|-----------|
| Código Penal (vigente) | D. 130-2017 | `data/articulos_cp.json` (canon interno, 635 arts) | canonical_internal_verified | Arts. 1-635 CP. |
| Código Procesal Penal | D. 9-2016 | `data/codigo_procesal_penal_verificado.json` (44 arts curados) | canonical_internal_verified | Arts. selectos CPP. |
| Código Civil | D. 48-72 | `data/codigo_civil.json` (canon interno, 2359 arts) | canonical_internal_verified | Arts. 1-2359 CC. |
| Código de Comercio | D. 73-50 | `data/codigo_comercio.json` (canon interno, 1693 arts) | canonical_internal_verified | Arts. 1-1693 CM. |
| Código del Trabajo | D. 144-83 | `data/codigo_trabajo.json` (canon interno, 856 arts) | canonical_internal_verified | Arts. 1-856 CT. |
| Código Tributario | D. 51-2003 | `data/codigo_tributario.json` (canon interno, 218 arts) | canonical_internal_verified | Arts. selectos CTrib. |
| Código de Familia | D. 76-84 | `data/codigo_familia_verificado.json` (11 arts curados) | canonical_internal_verified | Arts. selectos CF (alimentos, divorcio). |
| Código de la Niñez y Adolescencia | D. 73-96 (reformado por D. 35-2013) | https://www.tsc.gob.hn/biblioteca/index.php/codigos/506-codigo-de-la-ninez-y-de-la-adolescencia | official_primary (TSC) | Texto vigente con reformas del D. 35-2013. |

### Leyes especiales

| Norma | Decreto | URL | Procedencia | Uso en Lote 3 |
|-------|---------|-----|-------------|----------------|
| Ley de Propiedad | D. 82-2004 | https://www.tsc.gob.hn/web/leyes/Ley-de-the-Propiedad.pdf | official_primary (TSC) | Art. 95 (consulta pueblos indígenas en recursos naturales). |
| Ley de Transparencia y Acceso a la Información Pública | D. 170-2006 (reformado por D. 123-2017) | https://www.tsc.gob.hn/web/leyes/Ley_de_Transparencia.pdf | official_primary (TSC) | Protección de datos personales (Honduras no tiene ley autónoma). |
| Ley de Propiedad Industrial | D. 12-99-E (reformas D. 16-2006) | https://www.tsc.gob.hn/web/leyes/LEY_DE_PROPIEDAD_INDUSTRIAL.pdf | official_primary (TSC) | Patentes (20 años improrrogables). |
| Ley General del Ambiente | D. 104-93 | (canon: referencia interna) | canonical_internal_unverified | Derechos indígenas/ambientales. |
| CAUCA IV y RECAUCA IV | (regional SIECA) | https://www.sefin.gob.hn/wp-content/uploads/leyes/CÓDIGO%20DE%20ADUANA%20UNIFORME%20CENTROAMERICANO.pdf | official_primary (SEFIN HN) / official_secondary regional (SIECA.int) | Régimen aduanero centroamericano. |
| Convenio 169 OIT (ratificación) | D. 26-94 (ratificado 28-mar-1995) | https://www.trabajo.gob.hn/wp-content/uploads/2017/06/Informe-de-Avances-Convenio-169-Pueblos-Indigenas-y-Tribales-Junio-2017.pdf | official_primary (Min. Trabajo) | Pueblos indígenas y tribales. |

### Códigos NO disponibles como canon interno (gap detectado)

| Norma | Estado | Impacto en Lote 3 |
|-------|--------|-------------------|
| Código Procesal Civil (CPC) | Sin fuente estructurada ni extraída | `banco-demanda-deuda`, `como-preparar-demanda` (plazos procesales) → `needs_human_review`. |
| Ley de Amparo / Justicia Constitucional íntegra | Solo referencia constitucional | `recurso-de-amparo` (cuerpo legal detallado) → `needs_human_review`. |
| CAUCA IV íntegro estructurado | Solo 2 arts sintetizados en `cauca_verificado.json` | `codigo-aduanero-centroamericano` → `needs_human_review`. |
| Ley de Propiedad Industrial estructurada | Solo TXT en `data/pdfs-articulos/` | `patentes-requisitos` → `needs_human_review`. |

## Gaps críticos que generan `needs_human_review`

1. **CPC no estructurado**: 2 artículos del Lote 3 dependen de plazos procesales del CPC.
2. **CAUCA IV no íntegro**: el canon `cauca_verificado.json` solo tiene 2 artículos.
3. **Leyes especiales sin JSON**: Propiedad Industrial, Ley de Propiedad, Ley de Transparencia solo están en PDF/TXT.

## Resumen cuantitativo (Lote 3)

| Procedencia | Claims que la referencian |
|-------------|---------------------------|
| `official_primary` (TSC/SEFIN/Min. Trabajo) | 8 |
| `canonical_internal_verified` (data/*.json) | 25 |
| `canonical_internal_unverified` | 5 |
| Sin fuente (gap) → `needs_human_review` | 42 |

Estos 42 claims sin fuente trazable son mayoritariamente por gaps del canon interno
(CPC, CAUCA íntegro, leyes especiales), no por defecto de los artículos. Cada uno
se documenta en su paquete de revisión humana (§11).

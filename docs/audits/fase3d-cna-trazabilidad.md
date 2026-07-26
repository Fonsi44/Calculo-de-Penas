# Fase 3D — Trazabilidad normativa del Código de la Niñez y de la Adolescencia (CNA)

> Fecha: 2026-07-26 · Hash inicial Fase 3D: `04b48104` · Modo: `IMPLEMENTACIÓN`

## 1. Resumen ejecutivo

| Aspecto | Valor |
|---|---|
| Norma | Código de la Niñez y de la Adolescencia (CNA) |
| Decreto original | 73-96 (30-may-1996) |
| Decreto de reforma sustancial | 35-2013 (27-feb-2013) |
| **Publicación en La Gaceta** | **No. 33,222, 6-sep-2013** (corregido; Fase 3C citaba 13-jun-2013, incorrecto) |
| Copia íntegra accesible | CEPAL/OIG (`institutional_academic`) |
| **Procedencia final** | **`institutional_academic`** (sin cambio — honesta) |
| Estado previo (Fase 3C) | `institutional_academic` |
| **Cambio Fase 3D** | **Sin cambio**, pero se confirma el número correcto de La Gaceta (33,222) |
| Claims afectados | 11 claims de `defensa-penal-menores-edad-honduras` |

## 2. Búsqueda de fuente oficial hondureña (Fase 3D)

Se intentó localizar una fuente oficial hondureña (`.gob.hn`) con el texto
íntegro y descargable del CNA Decreto 35-2013. Resultados:

| Fuente | Dominio | HTTP | Resultado |
|---|---|---|---|
| TSC — biblioteca códigos | tsc.gob.hn | **500** | Error del servidor; sin contenido |
| Poder Judicial — legislación | legislacion.poderjudicial.gob.hn | **DNS fallido** | Subdominio no resuelve (HTTP 000) |
| Poder Judicial — Cedij PDF ratificación | poderjudicial.gob.hn | TLS inválido | `UNABLE_TO_VERIFY_LEAF_SIGNATURE` |
| ACNUR | acnur.org | **403** | Devuelve HTML de error, no PDF |
| OEA | oas.org | **403** | Bloqueado |
| CEPAL/OIG | oig.cepal.org | **200** | ✅ PDF íntegro (único accesible) |
| ONCAE | oncae.gob.hn | — | No tiene el CNA en su biblioteca |

**Conclusión**: ninguna fuente oficial hondureña (`.gob.hn`) sirve el CNA
Decreto 35-2013 de forma descargable y verificable en este momento. Los
sitios `.gob.hn` están caídos, devuelven 500, o tienen TLS inválido.

## 3. Confirmación de la existencia oficial (referencias cruzadas)

Aunque no se pudo descargar de `.gob.hn`, **múltiples fuentes institucionales
confirman** la existencia oficial del decreto y su publicación:

- **UNEP/LEAP** (leap.unep.org): "Decreto No. 35-2013 modifica el Decreto
  No. 73-96. Publicado en La Gaceta No. 33,222 de fecha 6 de septiembre de 2013."
- **Poder Judicial** (referenciado en búsqueda): "Título modificado mediante
  Decreto 35-2013 del 27 de febrero de 2013, publicado en La Gaceta No. 33,222
  de fecha 6 de septiembre de 2013."
- **TSC** (tsc.gob.hn, aunque la página del código devuelve 500): la biblioteca
  lista el CNA como "Decreto No. 35-2013" emitido por el Poder Legislativo.

La **fecha correcta de publicación** es **6-sep-2013** (Gaceta 33,222), no
13-jun-2013 como decía `fase3c-codigo-ninez.md`. Esto se documenta como
corrección.

## 4. Procedencia final

| Fuente | URL/dominio | Procedencia | Cuenta como oficial |
|---|---|---|---|
| CEPAL/OIG (copia íntegra accesible) | oig.cepal.org | **institutional_academic** | **No** |
| UNEP/LEAP (referencia) | leap.unep.org | institutional_academic | No |
| TSC (referenciada, 500) | tsc.gob.hn | official_secondary (no descargable) | Sí, pero inaccesible |
| Poder Judicial (subdominio caído) | legislacion.poderjudicial.gob.hn | official_secondary (inaccesible) | Sí, pero inaccesible |

**Clasificación final**: `institutional_academic`. **No se promociona** a
`official_secondary` porque la fuente oficial no es descargable ni verificable
con hash en este momento.

## 5. Implicación para los claims del CNA

Los 11 claims de `defensa-penal-menores-edad-honduras` (Fase 3C) están
respaldados por la copia de CEPAL (`institutional_academic`). Según la
taxonomía de procedencia (`lib/ai/source-provenance.ts:65`), esta categoría
**no cuenta como oficial** para `ai_official_sources_count`.

**Estado del artículo** (`defensa-penal-menores-edad-honduras`):
`needs_human_review` (sin fuentes oficiales; 0 unresolved pero 0 officialSources).
Esta clasificación **es correcta y se mantiene** — no se fuerza `completed`
porque la única fuente accesible no es oficial hondureña.

### Revisión de los 11 claims (no se reclasifican, se documentan)

| ID claim | Artículo CNA | Decisión 3C | Decisión 3D |
|---|---|---|---|
| menores-rango-edad | Art. 180 | confirmed | confirmed (sin cambio) |
| menores-inimputabilidad | Art. 180 párr. 2 | corrected | corrected (sin cambio) |
| menores-reinsercion | Arts. 180, 195 | confirmed | confirmed (sin cambio) |
| menores-interes-superior | Art. 5 + princ. EXCEPCIONALIDAD | confirmed | confirmed (sin cambio) |
| menores-art5-excepcionalidad | princ. EXCEPCIONALIDAD | corrected | corrected (sin cambio) |
| menores-catalogo-medidas | Art. 195 | confirmed | confirmed (sin cambio) |
| menores-audiencias-reservadas | princ. CONFIDENCIALIDAD | confirmed | confirmed (sin cambio) |
| menores-no-prision-preventiva | princ. EXCEPCIONALIDAD + Arts. 192-194 | confirmed | confirmed (sin cambio) |
| menores-antecedentes-reincidencia | princ. CONFIDENCIALIDAD + Arts. 257-261 | needs_human_review | needs_human_review (sin cambio) |
| menores-soluciones-alternas | princ. OPORTUNIDAD + Art. 194 | confirmed | confirmed (sin cambio) |
| menores-ley-1997 | Decretos 73-96 / 35-2013 | corrected | corrected (sin cambio) |

**Observación**: los claims `confirmed` del CNA están respaldados por la copia
de CEPAL, pero dado que esa copia NO es oficial hondureña, su confirmación es
**tentativa hasta verificación contra fuente oficial**. El estado del artículo
(`needs_human_review`) ya refleja esta limitación estructural.

## 6. Corrección de la documentación Fase 3C

`docs/audits/fase3c-codigo-ninez.md` y `fase3c-procedencia-fuentes.md`
contienen afirmaciones que deben matizarse:

1. **Fecha de publicación**: citaban "13-jun-2013"; lo correcto es
   **6-sep-2013** (Gaceta 33,222). La fecha del decreto es 27-feb-2013; la
   fecha de *publicación en La Gaceta* es 6-sep-2013.
2. **Procedencia oscilante**: `fase3c-procedencia-fuentes.md:21` dejaba la
   procedencia del CNA como "tentativa" entre `official_primary` e
   `institutional_academic`. Fase 3D la fija definitivamente en
   `institutional_academic` (la oficial es inaccesible).
3. **"Resuelto categóricamente"**: la Fase 3C usó esta frase en algún
   documento. Fase 3D la **retira**: la trazabilidad del CNA está limitada
   por la inaccesibilidad de las fuentes `.gob.hn`.

Estas correcciones se aplican en el Commit 8 (documentación).

## 7. No se reduce el estándar de evidencia

La §4 del enunciado Fase 3D exige: *"No reduzcas el estándar de evidencia para
mejorar artificialmente el estado del artículo."*

- El CNA sigue siendo `institutional_academic`.
- Los claims del CNA **no se reclasifican a `confirmed` por fuente oficial**
  porque no hay fuente oficial accesible.
- El artículo `defensa-penal-menores-edad-honduras` permanece
  `needs_human_review` (no se promociona a `completed`).

## 8. Próximos pasos recomendados (no se ejecutan en Fase 3D)

1. Reintentar la descarga del CNA desde `tsc.gob.hn` cuando el servidor se
   recupere (actualmente HTTP 500).
2. Verificar el subdominio `legislacion.poderjudicial.gob.hn` (DNS caído).
3. Si se logra descargar de `.gob.hn`, calcular hash SHA-256 y reclasificar
   a `official_secondary`; recalcular el estado del artículo.
4. Cotejar la copia de CEPAL contra la oficial para detectar divergencias.

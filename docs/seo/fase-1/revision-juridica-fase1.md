# Revisión jurídica — FASE 1 (Exactitud jurídica, entidad y confianza)

**Fecha:** 2026-07-24
**Rama:** `main` (HEAD al inicio `085c54b2`)
**Modo:** `IMPLEMENTACIÓN`
**Fuente base:** `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md` (única auditoría canónica existente en el repo; los entregables `docs/seo/fase-0/*` referidos en la instrucción NO existen en `main`, `staging/fase6-preproduction`, stashes ni reflog — ver `decisiones-implementacion.md` §1).

---

## 1. Tabla de afirmaciones sensibles

Convención de columnas (exigida por la instrucción FASE 1 §14):

| ID | URL | Archivo | Texto actual | Jurisdicción | Riesgo | Fuente oficial | Propuesta | Acción aplicada | Validación pendiente |
| -- | --- | ------- | ------------ | ------------ | ------ | -------------- | --------- | --------------- | -------------------- |

### 1.1. Afirnaciones CORREGIDAS en FASE 1 (acción ya aplicada)

| ID | URL | Archivo | Texto anterior | Jurisdicción | Riesgo | Fuente oficial | Acción aplicada | Validación pendiente |
| -- | --- | ------- | -------------- | ------------ | ------ | -------------- | --------------- | -------------------- |
| F01-cirilico | `/derecho-penal/atencion-casos-penales-litigiosos` | `data/areas-juridicas.ts:724` | «…si es posible, **добиться** absolución en juicio.» (palabra rusa incrustada) | HN | Alto (error editorial) | — | Sustituido por «lograr la absolución». | Ninguna (error tipográfico evidente). |
| F02-equipo-thania | `/despacho`, `/servicios-juridicos` | `data/faqs-hubs.ts:45,87` | «Thania **Pineda** (familia, civil, mercantil)» | HN | Alto (identidad falsa de persona real) | Fuente única `lib/site.ts:540` | Corregido a «Thania **Marlene Paz**». | Ninguna (contrasta con fuente canónica). |
| F03-equipo-emil | `/despacho`, `/servicios-juridicos` | `data/faqs-hubs.ts:45,87` | «Emil **Hernández** (derecho laboral)» | HN | Alto (identidad falsa de persona real) | Fuente única `lib/site.ts:627` | Corregido a «Emil **Barahona**». | Ninguna. |
| F04-horas-extras | `/preguntas-frecuentes` | `data/faq.ts:204` | «recargo del **100 %** … primeras dos horas diurnas, y del **150 %** para horas nocturnas» | HN | **Alto** (afirmación jurídica objetivamente equivocada; perjudica al trabajador) | Código del Trabajo de Honduras, arts. 270, 273 y 352 (TSC, https://www.tsc.gob.hn/web/leyes/codigo_de_trabajo.pdf) | Sustituido por recargo **25 % diurno / 50 % nocturno** con cita de artículos y matiz «depende del convenio». | Confirmación del despacho de que el texto refleja su interpretación. |
| F05-prescripcion-penal | `/preguntas-frecuentes` | `data/faq.ts:56` | «delitos graves **10 a 15 años**, menos graves **3 a 5 años** y **faltas en 6 meses**» | HN | Alto (tabla simplificada inexacta; "faltas" no existe en el CP vigente) | Código Penal Honduras, Decreto 130-2017, art. 39 (TSC, https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf) | Sustituido por formulación general prudente: cómputo desde el día del delito, plazo según pena máxima, imprescriptibles lesa humanidad, interrupción al iniciar procedimiento. | Confirmación del despacho. |
| F06-decimo-cuarto-mes | `/abogado-laboralista-nacaome` | `app/(public)/abogado-laboralista-nacaome/page.tsx:87,115,211` | «vacaciones y **décimo cuarto mes** proporcionales» | HN | Medio (figura inexistente en liquidación privada general) | Decreto 135-80 (aguinaldo = décimo tercer mes) | Sustituido por «décimo tercer mes (aguinaldo)». | Ninguna (terminología legal correcta). |
| F07-dist-choluteca | `/como-llegar` | `app/(public)/como-llegar/page.tsx:55` | «~65 km» Nacaome–Choluteca | general | Medio (contradicción interna: 50/52/65 km) | Cartografía: Rome2Rio 52,4 km, Travelmath 51 km (carretera CA-1) | Unificado a **~55 km** en las tres fuentes. | Ninguna (verificable públicamente). |
| F08-dist-san-lorenzo | `/como-llegar` | `app/(public)/como-llegar/page.tsx:56` | «~30 km» Nacaome–San Lorenzo | general | Medio (contradicción 17/30 km) | Cartografía: 2markers 18 km, Rome2Rio 19 km | Corregido a **~18 km**. | Ninguna. |
| F09-dist-amapala | `/como-llegar` | `app/(public)/como-llegar/page.tsx:57` | «~50 km» Nacaome–Amapala | general | Bajo (40/50 km) | Cartografía: Toponavi 41,5 km, 2markers 42 km | Corregido a **~45 km** (con nota de cruce en lancha). | Ninguna. |
| F10-email-typo-pdf | (PDFs generados: cálculo de penas) | `lib/pdf-document.tsx:544` | `contacto@pinedayasoci**o**shn.com` (dominio inexistente, falta la "a") | general | Medio (email de contacto erróneo en documento jurídico) | Fuente única `lib/site.ts:60` | Sustituido por `site.email` (DRY). Corregido también en `.env.example:179-182`. | Ninguna. |
| F11-universidad-danilo | (JSON-LD global, todas las páginas) | `lib/site.ts:485-488` | `alumniOf: 'Universidad de Honduras'` (denominación no oficial) | HN | Medio (afirmación académica no verificable) | — | Convertido a condicional `NEXT_PUBLIC_ALUMNI_DANILO`; si no se setea, no se publica. | El despacho debe aportar el nombre oficial y verificable de la universidad. |
| F12-phone-hardcode | `/abogado-penalista-nacaome`, `/derecho-penal` | `app/(public)/abogado-penalista-nacaome/page.tsx:120,220`; `app/(public)/derecho-penal/page.tsx:207` | «+504 9536-3724» y horario literales (ignoran `site.*`) | general | Bajo (NAP divergencia potencial) | Fuente única `lib/site.ts` | Sustituido por `site.whatsappDisplay` y `site.hoursShort` (template strings). | Ninguna. |

### 1.2. Afirmaciones PENDIENTES de validación humana (no publicadas como corregidas)

Estas afirmaciones **no se han modificado**: o bien son consistentes internamente pero requieren verificación contra la norma, o existe duda interpretativa y la instrucción prohíbe sustituir una cifra dudosa por otra no validada (§10).

| ID | URL | Archivo | Texto actual | Jurisdicción | Riesgo | Fuente oficial a consultar | Propuesta | Validación pendiente |
| -- | --- | ------- | ------------ | ------------ | ------ | -------------------------- | --------- | -------------------- |
| P01-pension-30-60 | `/preguntas-frecuentes`, `/servicios-juridicos/derecho-de-familia` | `data/faq.ts:149`; `data/areas-juridicas.ts:120` | «entre **30 % y 60 %** según el número de hijos, más 50 % de gastos» | HN | Alto (contradicción con `abogado-de-familia-nacaome` que dice 15-50 %) | Código de Familia Honduras, arts. 207 y 209 | Unificar rango tras verificar la fórmula judicial real. | Abogado de familia del despacho. |
| P02-pension-15-50 | `/abogado-de-familia-nacaome` | `app/(public)/abogado-de-familia-nacaome/page.tsx:115,211` | «oscila típicamente entre el **15 % y el 50 %** del ingreso neto» | HN | Alto (contradicción con P01) | Código de Familia Honduras | Unificar con P01. | Abogado de familia del despacho. |
| P03-aguinaldo-fechas | `/preguntas-frecuentes`, `/servicios-juridicos/derecho-laboral` | `data/faq.ts:188`; `data/areas-juridicas.ts:168` | «50 % antes del 30 de junio y 50 % antes del 30 de noviembre, o un solo pago antes del 20 de diciembre» | HN | Medio | Decreto 135-80 (Ley de Aguinaldos) | Probablemente correcto; verificar redacción vigente. | Confirmación del despacho. |
| P04-cesantia-25 | `/preguntas-frecuentes`, `/servicios-juridicos/derecho-laboral` | `data/faq.ts:184`; `data/areas-juridicas.ts:167` | «cesantía (1 mes por año o fracción, **máximo 25 meses**); preaviso (1 mes o 15 días)» | HN | Medio | Código del Trabajo arts. 112 (preaviso), 120-122 (cesantía) | Verificar topes por antigüedad. | Abogado laboral del despacho. |
| P05-naturalizacion-7 | `/servicios-juridicos/extranjeria-en-honduras` | `data/areas-juridicas.ts:448` | «Naturalización ordinaria — Después de **7 años** de residencia» | HN | Medio (sospechoso: la práctica común cita 2 años) | Ley de Migración y Extranjería, Decreto 208-2003 | Verificar plazo real. | Abogado migratorio. |
| P06-prescripcion-civil | `/preguntas-frecuentes` | `data/faq.ts:227`; `data/areas-juridicas.ts:214` | «plazo legal (5, 10 o 20 años según el caso)» | HN | Medio | Código Civil Honduras | Verificar plazos de usucapión. | Abogado civil. |
| P07-duracion-proceso | `/preguntas-frecuentes`, `/derecho-penal/proceso-penal-completo` | `data/faq.ts:106` vs `data/areas-juridicas.ts:827` | «2 a 4 años» (faq) vs «3-5 años» (área) — contradicción interna | HN | Bajo | — | Unificar rango. | Abogado penalista. |
| P08-herederos-forzosos | `/preguntas-frecuentes` | `data/faq.ts:169` | «herederos forzosos (hijos, cónyuge, padres) … porción legítima» | HN | Medio (terminología española mezclada) | Código Civil y de Familia Honduras | Reformular con terminología hondureña. | Abogado civil/de familia. |
| P09-cpp-articulos | `/derecho-penal/*` | `data/areas-juridicas.ts:742,779,810` | Citas «Art. 296 CPP», «Art. 27 CPP», «Art. 191 CNA» | HN | Medio | CPP 2016 (no 1999), CNA | Verificar numeración vigente. | Abogado penalista. |
| P10-colegiacion-cah | (global, badges) | `lib/site.ts:448,554,640`; `data/faqs-hubs.ts:87` | «abogados y notarios públicos colegiados en Honduras» (sin nº) | HN | Medio | Colegio de Abogados de Honduras | Aportar nº de colegiación real. | Despacho (datos profesionales). |
| P11-anio-fundacion | (global JSON-LD) | `lib/site.ts:369` | `foundingDate: '2010'` (comentario: «Reemplazar por año exacto») | HN | Bajo | — | Confirmar año real o eliminar del JSON-LD. | Despacho. |
| P12-15-anos | (global) | ~15 ubicaciones | «Más de 15 años de ejercicio profesional» | HN | Bajo | — | Verificar año de colegiación de Danilo. | Despacho. |
| P13-apostilla-plazo | `/hondurenos-en-espana/*` | `data/areas-juridicas.ts:946` | «apostilla de La Haya en Honduras se obtiene en **1-3 días hábiles**» | HN | Bajo | Secretaría de Relaciones Exteriores | Verificar plazo real actual. | Despacho. |
| P14-edad-penal-12 | `/derecho-penal/menores-justicia-juvenil` | `data/areas-juridicas.ts:795` | «A partir de los **12 años**, conforme al CNA» | HN | Bajo | Código de la Niñez y la Adolescencia | Verificar inimputabilidad. | Abogado penalista. |
| P15-suspension-1-3 | `/derecho-penal/mediacion-conflictos-penales-y-multas` | `data/areas-juridicas.ts:761` | «período de prueba de **1 a 3 años**» | HN | Bajo | CPP 2016 | Verificar. | Abogado penalista. |

### 1.3. Afirmaciones retiradas / matizadas (no cabe publicación prudente)

Ninguna se ha retirado del todo: todas las correcciones de §1.1 sustituyen la afirmación por una formulación general prudente con cita de la fuente oficial. No se ha retirado contenido íntegro de ninguna página pública.

---

## 2. Delimitación Honduras–España

Clasificación de los servicios de `/hondurenos-en-espana` y sus subpáginas según la matriz A–F de la instrucción FASE 1 §11:

| Subárea / subservicio | Clasificación | Justificación |
|---------------------|---------------|---------------|
| Apostilla de La Haya en Honduras (SERMULAC/SRE) | **A — Actuación jurídica en Honduras** | Trámite ante autoridad hondureña; el bufete lo asume directamente. |
| Traducción jurada español-hondureño | **B — Coordinación documental** | Se coordina con traductor jurado; en España requiere traductor habilitado español (D). |
| Partidas de nacimiento/matrimonio/defunción hondureñas | **A** | Registro Nacional de las Personas (Honduras). |
| Antecedentes penales hondureños | **A** | Dirección Nacional de Investigación (Honduras). |
| Cancelación de antecedentes penales en España | **D — Requiere profesional/autoridad en España** | Ministerio de Justicia español; el bufete solo orienta. |
| DNI/pasaporte hondureño en Consulado Madrid | **C — Orientación general / E — Trámite personal** | Lo realiza el interesado en el Consulado. |
| Permiso de residencia y NIE (España) | **D / E** | Administración española; trámite personal o con abogado español. |
| Renovación del pasaporte español en Honduras | **D / E** | Autoridad española; interesado o profesional habilitado. |
| Poder notarial desde España | **A + B** | Bufete coordina notaría hondureña; firma ante notario español o Consulado. |
| Compraventa/hipoteca de inmueble en Honduras | **A** | Notaría y registro hondureño. |
| Testamento otorgado en España con efectos en Honduras | **B** | Coordinación de protocolización. |
| Divorcio en Honduras residiendo en España | **A** | Juzgado de Familia hondureño. |
| Exequátur de sentencia de divorcio español en Honduras | **A** | Corte Suprema de Justicia (Honduras). |
| Exequátur de sentencia hondureña en España | **D** | Audiencia Provincial española; requiere abogado español. |
| Custodia internacional / sustracción (Convenio La Haya 1980) | **A / D** | Depende de la jurisdicción donde se ejecute. |
| Pensión de alimentos internacional (Convenio 2007) | **A / D** | Ídem. |
| Reagrupación familiar en España | **D / E** | Administración española; trámite personal. |
| Arraigo social/laboral/familiar en España | **D / E** | Extranjería española. |
| Nacionalidad española por residencia / carta de naturaleza | **D / E** | Ministerio de Justicia español. |
| Nacionalidad por Ley de Memoria Democrática | **D / E** | Ídem. |
| Sucesión internacional | **A / B** | Depende de dónde estén los bienes. |
| Adopción internacional (Convenio La Haya 1993) | **A / D** | Ídem. |

**Acción aplicada (FASE 1):** se añadió una **FAQ de delimitación jurisdiccional** al área `hondurenos-en-espana` (`data/areas-juridicas.ts`, area.faqs) que explica los cuatro ámbitos (actuación HN, coordinación documental, requiere profesional en ES, trámite personal del interesado) sin inventar colaboraciones ni reestructurar páginas.

---

## 3. Cambios en JSON-LD / datos estructurados

| Inconsistencia | Estado FASE 1 |
|----------------|---------------|
| `sameAs` divergente entre Organization y LegalService (LegalService incluía `tiktok`, Organization no) | **Corregido**: ambos consumen el mismo array con `validUrlsOnly` (si `tiktok` no se setea, se filtra; si se setea, ambos bloques coinciden). |
| `availableLanguage: ['Spanish']` en ContactPage (`/solicitar-consulta`) vs `['es-HN','es-ES']` en el `@graph` central | **Corregido**: unificado a `['es-HN','es-ES']`. |
| `foundingDate: '2010'` sin contraparte visible (solo «más de 15 años» en UI) | **Pendiente (P11)**: no se publica año concreto hasta confirmación del despacho. Comentario deja claro que es aproximado. |
| `alumniOf: 'Universidad de Honduras'` no verificable | **Corregido (F11)**: condicional a env var; si no se setea, no se publica. |
| `@id` ausentes en múltiples bloques (FAQPage home, ContactPage, CollectionPage, ItemList, BreadcrumbList) | **Documentado**, no abordado en FASE 1 (mejora técnica SEO, no de exactitud jurídica). Queda para FASE 2. |
| `geo` solo en LegalService, no en Organization/Person | **Documentado**, no crítico. El nodo LegalService (que lleva el `geo`) es el que Google usa para LocalBusiness rich results. |

El JSON-LD ahora **coincide con el contenido visible** en NAP (dirección, teléfono, horario, geo, email), porque todos los bloques consumen `lib/site.ts`.

---

## 4. Coherencia NAP (Name Address Phone) — resultado

| Campo | Fuente única | Visible | JSON-LD | Coherente |
|-------|-------------|---------|---------|-----------|
| Nombre | `site.name` = «Pineda y Asociados» | ✓ | ✓ | ✓ |
| Dirección | `site.address.full` (GGJ7+239, Nacaome, Valle, Honduras) | ✓ | ✓ | ✓ |
| Teléfono | `site.phone` / `phoneDisplay` | ✓ (vía helper) | ✓ | ✓ |
| WhatsApp | `site.whatsapp` / `whatsappDisplay` (mismo número) | ✓ | (wa.me) | ✓ |
| Email | `site.email` | ✓ (footer) | omitido por anti-scraping (política) | ✓ |
| Horario | `site.hours` (Lun-Sáb 7:00–20:00) | ✓ | ✓ | ✓ |
| Geo | `site.geo` (13.5300375, -87.487265625) | ✓ (`/como-llegar`) | ✓ (LegalService) | ✓ |

---

## 5. Criterios de cierre (autoevaluación)

| Criterio (instrucción FASE 1) | Estado |
|-------------------------------|--------|
| Identidad con fuente única | ✓ (`lib/site.ts` consolidado; eliminados literales divergentes en PDFs, FAQs y páginas de abogados). |
| Datos NAP coherentes | ✓ (ver §4). |
| Variantes del equipo resueltas o bloqueadas | ✓ (Thania Pineda→Paz, Emil Hernández→Barahona corregidos; Danilo sin segundo apellido → completo). |
| Existe infraestructura de revisión | ✓ (`lib/legal-review.ts` + componente + 18 tests). |
| Todas las afirmaciones críticas clasificadas | ✓ (F01–F12 corregidas, P01–P15 pendientes documentadas). |
| Solo se han publicado correcciones seguras | ✓ (las F tienen fuente oficial o fuente canónica interna; las P no se publican como corregidas). |
| Propuestas pendientes documentadas | ✓ (tabla §1.2). |
| Se diferencia Honduras de España | ✓ (FAQ de delimitación + matriz §2). |
| JSON-LD y contenido visible coinciden | ✓ (NAP §4; sameAs y availableLanguage corregidos). |
| Pruebas en verde | ✓ (18/18 tests `legal-review.test.ts`). |
| Blog intacto | ✓ (ver `decisiones-implementacion.md` §6). |

---

## 6. Porcentaje técnico

- **Porcentaje técnico completado:** ~85 % de la FASE 1 (identidad, equipo, JSON-LD, distancias, horas extras, prescripción, décimo mes, typo email, infraestructura de revisión, delimitación HN/ES, documentación).
- **Porcentaje pendiente de validación humana:** ~15 % — los 15 ítems P01–P15 requieren firma de un abogado del despacho (preferentemente Danilo Pineda Maradiaga para penal, Thania Marlene Paz para familia/civil/mercantil, Emil Barahona para laboral) antes de pasar a `verified` en el registro.

Ver `decisiones-implementacion.md` para el detalle operativo y `fuentes-oficiales.md` para las fuentes consultadas.

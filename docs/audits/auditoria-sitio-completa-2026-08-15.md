---
status: current
owner: seo
created: 2026-08-16
last_reviewed: 2026-08-16
review_due: 2026-11-14
supersedes: docs/audits/archive/2026-08-06/auditoria-gsc-bing-ga4-2026-07-26.md
---

# Auditoría completa del sitio — Pineda y Asociados

**Sitio:** https://www.pinedayasociadoshn.com/  
**Fecha de recolección:** 2026-08-16 (America/Tegucigalpa)  
**Modo:** inspección independiente, basada en datos. Sin deploy, sin IndexNow real, sin envío de formularios.  
**Clasificación de afirmaciones:** `VALIDADO` / `NO VALIDADO` / `PENDIENTE` / `RIESGO` / `IMPLEMENTADO`

Este informe sustituye, como lectura vigente, los snapshots de julio y del 3 de agosto de 2026. Esas cifras se citan solo como histórico.

---

## 0. Alcance, método y límites de evidencia

Se auditó el sitio público del bufete en Nacaome, Valle, Honduras, cruzando APIs live, HTML de producción y el código canónico del repositorio.

| Fuente | Ventana observada | Estado | Notas |
| --- | --- | --- | --- |
| Google Search Console (Search Analytics) | 2025-08-16 → 2026-08-16 (365d) y 2026-07-19 → 2026-08-16 (28d) | `VALIDADO` | ADC de gcloud. Property: `https://www.pinedayasociadoshn.com/` |
| Google Analytics 4 (Data API) | mismas ventanas; property `541022095` | `VALIDADO` | Service account en `.secrets/` (gitignored). La ventana «365d» incluye el histórico real de la propiedad, no doce meses llenos de tráfico |
| Bing Webmaster Tools | crawl 67 días; 555 queries | `VALIDADO` | API Key. Backlinks = 0 |
| IndexNow | dry-run | `VALIDADO` | No se envió |
| Cobertura GSC (indexadas / descubiertas / excluidas) | — | `NO VALIDADO` | El extractor live solo llama `searchanalytics.query`. No hay URL Inspection en esta corrida |
| CrUX / CWV de campo | — | `NO VALIDADO` | Origen sin volumen suficiente (confirmado en `data-source-status.json` histórico y en PSI 429) |
| PageSpeed Insights producción (mobile) | 2026-08-16 | `NO VALIDADO` | HTTP 429 en la API pública |
| Lighthouse laboratorio | 2026-08-03, localhost:3100 desktop | `VALIDADO` (lab, no campo) | `docs/seo/current/performance-runtime-summary.json` |
| Ahrefs / SEMrush / Domain Authority | — | `NO VALIDADO` | Sin herramienta de pago; no hay CSV en `ahrefs/` |
| WAVE / axe sobre producción | — | `NO VALIDADO` | Revisión semántica de HTML + Lighthouse lab a11y=100 |
| `seo:health` y auditoría de sitemap local | 2026-08-16 | `NO VALIDADO` | Fallaron dentro de `seo:collect` (timeout/comando). El sitemap de producción sí se leyó por GET |

**Autenticación (sin valores):** `seo:doctor` = 0 ERROR, 2 pendientes (Bing OAuth). La service account y el OAuth client de `.env.local` no firmaron en esta máquina (OpenSSL `unsupported` / `invalid_client`). La recolección GSC usó gcloud ADC; GA4 usó el JSON de `.secrets/`. El collector npm inyecta dotenvx y los scripts vuelven a leer `.env.local` con `override: true`; eso pisa valores ya inyectados. Hallazgo operativo, no de producto público.

**Muestra de URLs:** 8 páginas pilar, 4 legales, 7 landings indexables, 1 landing `NOINDEX_UNTIL_UNIQUE` (Pespire, control), 1 guía, 1 cómo-llegar, y los extremos GSC (top clics + impresiones altas con CTR bajo). Total inspeccionado en producción: 35 rutas HTML + robots + índice de sitemaps. El blog (~155 URLs en `sitemap-blog.xml`) se analiza por clusters, no fila a fila.

---

## 1. Resumen ejecutivo

El sitio **ya genera demanda orgánica real y creciente**. No es un proyecto «aún sin tráfico». En 28 días GSC registró **741 clics y 31.933 impresiones** (CTR 2,32 %, posición media 6,0). En 365 días: **1.032 clics y 45.848 impresiones**. El 72 % de los clics del año cae en el último mes: el canal orgánico se aceleró en julio–agosto de 2026, sobre todo con artículos de familia y civil.

La on-page técnica de las URLs pilar y de los artículos top es **sólida y repetible**: un solo H1, canonical propio, `index,follow` donde corresponde, JSON-LD (LegalService, BlogPosting, FAQ/Answer, breadcrumbs, NAP) y CTAs visibles. El cuello de botella **no es «falta de SEO básico»**. Es la combinación de:

1. **CTR estructuralmente bajo** (2,25–2,32 %) con muchas queries en posiciones 4–10 a CTR 0 %.
2. **Conversión de formulario casi nula** (`contact_form_submit` = 2 en 28 días) frente a **WhatsApp** (14 clics / 11 usuarios en 28 días).
3. **Bing rastrea de más** (9.477 páginas en 67 días vs ~203 URLs en sitemaps) con 1.183 respuestas 4xx y 1.351 errores de rastreo.
4. **Off-page vacío en Bing** (0 backlinks) y colisión de marca con otro «Bufete Pineda y Asociados» en Tegucigalpa (`bufetepinedayasociados.com`).
5. **Medición contaminada a 365 días** por rutas `/intranet/*` en GA4, a pesar de que el layout público las excluye.

**Fortalezas**

- Dominio local de Nacaome en SERP de `abogados nacaome` (`VALIDADO` por búsqueda pública: el home es el primer resultado web citado).
- Cluster de pensión alimenticia y prescripción de deudas con volumen y clics reales.
- Políticas legales publicadas (aviso, privacidad, cookies, términos), consentimiento que bloquea gtag, formulación comercial canónica «Evaluación inicial confidencial».
- HTTPS, HSTS preload, CSP con `frame-ancestors 'self'`, `nosniff`, Permissions-Policy.
- Schema LegalService en home; BlogPosting + FAQ en artículos de demanda.

**Debilidades críticas**

- CTR 0 % en queries con impresiones (nacionalidad, habeas corpus, daños y perjuicios genérico, detención judicial, sobreseimiento).
- Google indexa **fragmentos `#`** de la guía de prescripción como URLs distintas, con cientos de impresiones y 0 clics.
- Páginas de conversión (`/solicitar-consulta`, `/preguntas-frecuentes`) **no reciben clics orgánicos** medibles.
- GA4: `landingPage = (not set)` sigue presente (30 sesiones / 28d; 132 / 365d).
- CWV de campo y PSI producción: `NO VALIDADO`. El laboratorio local muestra LCP ~3,7–4,4 s (por debajo de 2,5 s).

**Recomendaciones prioritarias (negocio, no cosmética)**

1. Reescribir snippets de las 8–10 URLs con imp. altas y CTR < 1 % (divorcio, detención, sobreseimiento, despacho, nacionalidad España).
2. Cerrar el embudo: el lead real hoy es WhatsApp; el formulario está instrumentado pero casi no convierte.
3. Pedir a Bing recrawl de 4xx y alinear el presupuesto de rastreo al sitemap (203 URLs).
4. Filtrar `/intranet` y `(not set)` en GA4 para no tomar decisiones con tráfico interno.
5. Desambiguar la marca frente al homónimo de Tegucigalpa y reforzar NAP + perfil de negocio local.

---

## 2. Análisis técnico-SEO

### 2.1 Rendimiento orgánico Google

**365 días (2025-08-16 → 2026-08-16)** — `VALIDADO`

| Métrica | Valor |
| --- | ---: |
| Clics | 1.032 |
| Impresiones | 45.848 |
| CTR | 2,25 % |
| Posición media | 6,3 |
| Queries con al menos una impresión | 1.077 |
| Páginas con impresión | 196 |
| Países | 105 |

Distribución geográfica de clics: Honduras 866 (84 %), Estados Unidos 78, España 37. El público orgánico es hondureño; España es un segundo mercado pequeño y coherente con `/hondurenos-en-espana`.

Dispositivos GSC 365d: móvil 708 clics / 34.064 imp. (CTR 2,08 %); escritorio 316 / 11.555 (CTR 2,73 %); tablet 8. **El snippet debe diseñarse primero para móvil**, donde está el 69 % de los clics y el CTR es peor.

**28 días (2026-07-19 → 2026-08-16)** — `VALIDADO`

| Métrica | Valor |
| --- | ---: |
| Clics | 741 |
| Impresiones | 31.933 |
| CTR | 2,32 % |
| Posición media | 6,0 |

Honduras 634 clics / 25.751 imp. Móvil 510 clics / 24.320 imp. La posición media mejoró de 6,3 (año) a 6,0 (28d) y el CTR apenas se movió. Hay visibilidad de primera página sin captura de clic.

### 2.2 Top páginas y oportunidades

Clics GSC, mismas URLs, dos ventanas:

| URL | Clics 365d | Imp. 365d | Clics 28d | Imp. 28d |
| --- | ---: | ---: | ---: | ---: |
| `/blog/.../pension-alimenticia-porcentaje-honduras-2026` | 180 | 4.352 | 144 | 3.401 |
| `/blog/.../prescripcion-deudas-plazos-honduras` | 132 | 3.484 | 106 | 2.635 |
| `/blog/.../danos-perjuicios-indemnizacion-honduras` | 62 | 1.887 | 39 | 1.415 |
| `/blog/.../poder-legal-honduras-cuando-se-necesita` | 61 | 3.373 | 43 | 2.124 |
| `/blog/.../contratos-mercantiles-esenciales-empresas-honduras` | 44 | 723 | 34 | 555 |
| `/blog/.../pension-alimenticia-honduras-guia-completa` | 42 | 3.522 | 21 | 2.286 |
| `/blog/.../custodia-hijos-honduras-juez` | 35 | 1.897 | 23 | 1.116 |
| `/blog/.../expropiacion-forzosa-derechos-propietario-honduras` | 29 | 1.207 | 26 | 1.113 |
| `/blog/.../naturalizacion-nacionalidad-hondurena` | 18 | 2.112 | 18 | 2.112 |
| `/blog/.../divorcio-honduras-guia-completa` | 15 | 2.248 | 14 | 1.845 |
| `/abogados-en-choluteca` | 14 | 388 | 13 | 207 |
| `/` (home) | 13 | 595 | 6 | — |
| `/blog/.../que-hacer-si-me-detienen-en-honduras` | 5 | 957 | 3 | — |

**Canibalización de pensión (RIESGO, evidencia GSC):** dos URLs compiten. La de *porcentaje 2026* gana clics (180); la *guía completa* tiene 3.522 impresiones y solo 42 clics. Conviene una URL primaria para «cuánto / porcentaje» y la guía para «requisitos / procedimiento», con enlaces recíprocos explícitos.

**Fragmentos indexados (RIESGO):** GSC lista URLs con `#plazos-de-prescripcion...`, `#como-se-interrumpe...`, `#caso-practico...` con 583–646 impresiones y 0 clics. Google está tratando anclas del artículo de prescripción como resultados distintos. Eso diluye CTR y puede repetir el mismo snippet. Acción: `FAQPage`/`@id` sin fragmento indexable, o consolidar anclas; no crear headings cuyo `id` se convierta en resultado.

Queries 365d con ≥30 impresiones, posición ≤20 y CTR 0 % (muestra): `nacionalidad de honduras` (136 imp., pos. 9,3), `habeas corpus` (100 / 10,4), `que es detencion judicial en honduras` (91 / 8,1), `sobreseimiento provisional` (87 / 10,1), `daños y perjuicios` (76 / 4,6), `pension alimenticia` (74 / 9,0), `tipos de divorcio en honduras` (67 / 9,3), `cuando prescribe una deuda de tarjeta de crédito en honduras` (40 / 3,6). Están en primera o segunda página **sin gancho de snippet**.

### 2.3 Indexación, robots y sitemap (producción GET)

`robots.txt` (200, 4.887 bytes): Allow `/` para Googlebot, Bingbot, DuckDuckBot, Applebot, GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot. Disallow de `/intranet/`, `/admin/`, `/api/`, calculadora, casos, cp, delitos, atajos, preview, 404/500. **Intranet no se ofrece a rastreo.** `VALIDADO`.

Índice `sitemap.xml` (200) con cinco hijos:

| Sitemap | URLs (`<loc>`) |
| --- | ---: |
| sitemap-pages.xml | 6 |
| sitemap-services.xml | 26 |
| sitemap-blog.xml | 155 |
| sitemap-authors.xml | 4 |
| sitemap-local.xml | 12 |
| **Total** | **203** |

Bing WMT: 9.477 páginas rastreadas en 67 días frente a 203 URLs canónicas. Relación ~47:1. Hay overcrawl (parámetros, 308, noindex, historial). 0 respuestas 5xx (`VALIDADO`). 1.183 4xx y 1.351 errores de rastreo (`VALIDADO` como volumen; el desglose URL a URL de Bing es `NO VALIDADO` en esta API).

Dos 308 permanentes comprobados con `curl -L`:

| Origen GSC | Destino 200 |
| --- | --- |
| `/blog/proceso-penal/sobreseimiento-definitivo-provisional-diferencias-honduras` | `/blog/proceso-penal/sobreseimiento-definitivo-provisional` |
| `/blog/derecho-laboral/empleador-no-paga-salario-honduras` | `/blog/derecho-laboral/despido-laboral-honduras-guia-completa` |

Los 308 están bien como consolidación. GSC aún atribuye impresiones al origen largo de sobreseimiento (755 imp., 5 clics, CTR 0,66 %). Pedir recrawl del destino y vigilar que el origen deje de aparecer.

Landing de control `/abogados-en-pespire`: 200, `noindex, follow`, canonical propio. Cumple `NOINDEX_UNTIL_UNIQUE`. `VALIDADO`.

Cobertura «páginas descubiertas no indexadas» de la UI de GSC: `NO VALIDADO` en esta corrida.

### 2.4 Tabla de puntuación SEO (muestra 25–40 URLs)

**Rúbrica (100 pts, producción GET 2026-08-16):** HTTP 200 (10) + title 35–62 caracteres (15) + meta 120–160 (15) + un H1 (15) + robots/canonical coherentes (15) + schema de tipo de página (10) + alts (5) + CTA (10) + ajuste de rendimiento GSC (−15 si imp. ≥400 y CTR < 1 %; −8 si title > 65). CWV de campo no entra: `NO VALIDADO`.

| Ruta | Title | Meta | H1 | Robots | Schema | Score | GSC 365d clics | Nota |
| --- | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |
| `/` | 47 | 138 | 1 | index | LegalService | **88** | 13 | 1 img sin alt |
| `/despacho` | 46 | 156 | 1 | index | AboutPage | **87** | 1 | 218 imp., CTR 0,46 % |
| `/servicios-juridicos` | 50 | 156 | 1 | index | FAQ/Answer | **95** | 1 | Pilar; poco orgánico |
| `/derecho-penal` | 44 | 159 | 1 | index | FAQ | **95** | 4 | Marca local fuerte, poco query genérico |
| `/hondurenos-en-espana` | 46 | 142 | 1 | index | FAQ | **95** | 9 | Mejor pilar no-blog |
| `/preguntas-frecuentes` | 70 | 125 | 1 | index | FAQ | **82** | 0 | Title largo; 0 clics |
| `/blog` | 37 | 129 | 1 | index | CollectionPage | **90** | 3 | Title corto, sin año/USP |
| `/solicitar-consulta` | 39 | 153 | 1 | index | ContactPage | **90** | 0 | Conversión, no ranking |
| `/aviso-legal` | 32 | 122 | 1 | noindex | NAP | **90** | — | Correcto noindex |
| `/politica-privacidad` | 43 | 148 | 1 | noindex | NAP | **95** | — | Correcto noindex |
| `/politica-cookies` | 43 | 152 | 1 | noindex | NAP | **95** | — | Correcto noindex |
| `/terminos` | 43 | 142 | 1 | noindex | NAP | **95** | — | Correcto noindex |
| `/abogados-en-nacaome` | 46 | 122 | 1 | index | FAQ | **86** | 7 | H1 = «visitar oficina», no «abogados» |
| `/abogados-en-choluteca` | 39 | 150 | 1 | index | FAQ | **95** | 14 | Mejor landing local |
| `/abogados-en-san-lorenzo` | 41 | 160 | 1 | index | FAQ | **95** | 8 | |
| `/abogados-en-goascoran` | 39 | 147 | 1 | index | FAQ | **88** | 0 | Indexable sin demanda aún |
| `/abogados-en-san-marcos-de-colon` | 54 | 141 | 1 | index | FAQ | **95** | 2 | |
| `/abogados-en-el-triunfo` | 45 | 133 | 1 | index | FAQ | **95** | 1 | |
| `/abogados-en-amapala` | 37 | 142 | 1 | index | FAQ | **88** | 0 | Title corto |
| `/como-llegar` | 60 | 151 | 1 | index | NAP | **95** | 2 | |
| `/guia-legal-abogados-honduras` | 45 | 158 | 1 | index | Article | **87** | 2 | 328 imp., CTR 0,61 % |
| Pensión porcentaje 2026 | 59 | 144 | 1 | index | BlogPosting+FAQ | **95** | 180 | URL estrella |
| Prescripción deudas | 50 | 142 | 1 | index | BlogPosting+FAQ | **80** | 132 | Penalizada por #fragments |
| Daños y perjuicios | 45 | 133 | 1 | index | BlogPosting | **95** | 62 | |
| Poder notarial | 55 | 130 | 1 | index | BlogPosting | **90** | 61 | 3.373 imp., CTR ~1,8 % |
| Contratos mercantiles | 44 | 140 | 1 | index | BlogPosting | **95** | 44 | CTR relativo alto |
| Pensión guía completa | 51 | 134 | 1 | index | BlogPosting | **82** | 42 | Canibaliza a porcentaje |
| Custodia hijos | 49 | 134 | 1 | index | BlogPosting | **88** | 35 | CTR bajo vs imp. |
| Expropiación | 58 | 139 | 1 | index | BlogPosting | **90** | 29 | |
| Divorcio guía | 47 | 130 | 1 | index | BlogPosting | **80** | 15 | 2.248 imp., CTR 0,67 % |
| Qué hacer si me detienen | 52 | 151 | 1 | index | BlogPosting | **80** | 5 | 957 imp., CTR 0,52 % |
| Naturalización HN | 48 | 120 | 1 | index | BlogPosting | **88** | 18 | Meta en el borde corto |
| Nacionalidad española | 58 | 134 | 1 | index | BlogPosting | **78** | 1 | 461 imp., CTR 0,22 %; YMYL |
| Sobreseimiento (origen 308) | — | — | — | 308 | — | **55** | 5 | Redirige; GSC aún mide el origen |
| Salario no pagado (origen 308) | — | — | — | 308 | — | **60** | 0 | 201 imp., 0 clics → guía despido |

Media técnica de URLs 200 indexables de la muestra: **alta (mid-80s a 95)**. El SEO on-page **ya está implementado**. El score compuesto baja donde el snippet no convierte impresiones.

### 2.5 Ejemplos de reescritura (no publicados)

Solo propuestas. No se cambió producción.

**1. Divorcio** (2.248 imp., 15 clics, CTR 0,67 %)

- Actual: `Divorcio en Honduras: vías, requisitos y plazos`
- Propuesta: `Divorcio en Honduras: mutuo consentimiento, causal y cuánto tarda`
- Meta actual: genérica de comparación de vías.
- Meta propuesta: `Las 3 vías de divorcio en Honduras (mutuo consentimiento, causal y separación), documentos, hijos y pensión. Guía del bufete en Nacaome. Evaluación inicial confidencial.`

**2. Detención** (957 imp., 5 clics)

- Actual: `¿Qué hacer si me detienen en Honduras? Guía práctica`
- Propuesta: `Me detuvieron en Honduras: derechos, 24 horas y qué no firmar`
- La query `que es detencion judicial en honduras` (91 imp., CTR 0) pide definición en el primer párrafo, no solo «guía práctica».

**3. Despacho** (218 imp., 1 clic)

- Actual: `Bufete de Abogados en Nacaome | Nuestro Equipo`
- Propuesta: `Quiénes somos | Abogados colegiados en Nacaome, Valle`
- El H1 ya habla de experiencia; el title vende «equipo» y pierde el clic de «bufete».

**4. Home (móvil, CTR 2 %)**

- Actual: `Abogados en Nacaome, Valle | Pineda y Asociados`
- Propuesta (si se prioriza penal+familia): `Abogados en Nacaome: defensa penal y familia | Pineda y Asociados`
- Meta actual ya es buena (138 caracteres, propuesta de valor). El hueco es el title genérico frente a queries de servicio.

**5. FAQ (70 caracteres, 0 clics)**

- Actual: `Preguntas frecuentes sobre consultas y honorarios | Pineda y Asociados`
- Propuesta: `Honorarios y primera consulta | Preguntas frecuentes`

---

## 3. Análisis de contenido

### 3.1 Qué está funcionando

El tráfico orgánico **no lo arrastran las páginas de servicio**, sino **guías del blog con pregunta concreta y jurisdicción «Honduras»**. Eso encaja con un bufete de ciudad pequeña: el usuario busca el problema legal, no el nombre del despacho.

Clusters con evidencia GSC (365d / roadmap vigente):

| Cluster | Intención | URL primaria | Evidencia | Acción |
| --- | --- | --- | --- | --- |
| Pensión / manutención / porcentaje | Informacional YMYL | porcentaje-2026 | 180 clics; queries en pos. 2–4 | KEEP + EXPAND preguntas derivadas |
| Prescripción de deudas | Informacional | plazos-honduras | 132 clics; fragments # | KEEP + limpiar fragments |
| Daños y perjuicios | Informacional | indemnizacion | 62 clics; query genérica CTR 0 | UPDATE snippet |
| Poder notarial | Informacional | poder-legal | 61 clics / 3.373 imp. | UPDATE meta (CTR bajo) |
| Custodia | Informacional | custodia-hijos | 35 clics / 1.897 imp. | UPDATE respuesta directa |
| Divorcio | Informacional | guia-completa | 15 clics / 2.248 imp. | UPDATE urgente |
| Penal detención / habeas / sobreseimiento | Urgente | varias | alta imp., CTR < 1 % | UPDATE + enlazar `/derecho-penal` |
| Naturalización HN | Informacional | naturalizacion | 18 clics / 2.112 imp. | KEEP; CTR mejorable |
| Nacionalidad española | YMYL / límite de jurisdicción | hondurenos-en-espana/... | 1 clic / 461 imp. | No sobreprometer derecho español |

Tono observado en producción: jurídico-divulgativo, con disclaimer en componente (no en el body), H1 = título, H2 en el cuerpo. Cumple R14/R15 a nivel de plantilla. `VALIDADO` en la muestra. La calidad jurídica de cada claim del blog **no se re-auditó artículo a artículo** en esta corrida (`NO VALIDADO` como revisión de fondo 155 piezas).

### 3.2 Duplicados y cobertura

- **Pensión:** dos piezas vivas. No fusionar aún: hay demanda para «porcentaje» y para «requisitos». Sí hace falta `rel` interno y titles que no se pisen.
- **Naturalización:** GSC 365d también lista `/blog/extranjeria-migracion/naturalizacion-obtener-nacionalidad-hondurena` (14 clics / 940 imp.). Posible duplicado temático. `PENDIENTE` de decisión editorial KEEP/MERGE.
- **308 laborales/penales:** consolidación ya hecha; el contenido «empleador no paga salario» redirige a la guía de despido. Si la query de salarios impagos sigue impresionando el origen, el destino debe responder esa pregunta en H2 propio.
- **Landings `NOINDEX_UNTIL_UNIQUE` (9 municipios):** Pespire confirmado noindex. No deben entrar a módulos destacados (R18). No se puntuaron como SEO on-page.

Huecos de contenido **con demanda GSC y sin captura**:

- Tarjeta de crédito / prescripción específica (40 imp., pos. 3,6, CTR 0) — un H2 en la guía de prescripción, no un artículo nuevo.
- Detención judicial como definición (91 imp.).
- Sobreseimiento provisional vs definitivo (queries + URL 308).
- `recauca honduras` / `cauca y recauca` (ya hay clics; hay artículo aduanero).

No se recomienda un aluvión de artículos nuevos. El roadmap del 3 de agosto (UPDATE/EXPAND/MERGE) sigue vigente y esta corrida lo confirma con más volumen.

### 3.3 Palabras clave de negocio vs contenido

El home y `/derecho-penal` están optimizados a «abogados / penalista Nacaome». GSC muestra que el público busca **institutos jurídicos** (pensión, prescripción, poder, divorcio), no «abogado penal Honduras» a escala nacional. En la SERP de `abogado penal honduras` aparecen firmas de Tegucigalpa y San Pedro Sula (Consortium, Officium, Dabar). Competir ahí de frente es de bajo ROI. El ROI está en **Nacaome + Valle + Choluteca + problemas concretos**.

`/hondurenos-en-espana` (9 clics/365d) es el pilar no-blog más clicable después del home. El artículo de nacionalidad española **casi no convierte el clic** (CTR 0,22 %). Riesgo YMYL: el bufete orienta trámites hondureños; no debe parecer abogado español.

---

## 4. Experiencia de usuario y diseño

Observación de HTML y CTAs. **No hay rediseño visual** (R5).

**Navegación.** Landmarks y un H1 por página en toda la muestra. El footer enlaza aviso, privacidad, cookies y términos. CTAs de WhatsApp, teléfono y `/solicitar-consulta` aparecen de forma repetida (11–26 coincidencias de patrón CTA por página en el parser; incluye header/footer). Eso es bueno para conversión y puede ser ruidoso en móvil.

**Home.** H1: «Defensa penal y asesoría jurídica en Nacaome y Honduras». Alineado con la propuesta de valor (penal primero, luego familia/laboral/civil). Una imagen sin `alt` (1/11). El resto de la muestra: 0 alts vacíos.

**Landing Nacaome.** Title «Abogados en Nacaome»; H1 «Cómo visitar nuestra oficina en Nacaome». El H1 desplaza la página hacia logística (solapa con `/como-llegar`) y debilita la query de marca local. `RIESGO` menor de canibalización interna.

**Formulario `/solicitar-consulta`.** H1 empático («Cuéntenos su caso. Le escuchamos con discreción.»). Copy de secreto profesional. ContactPage en schema. En GA4 28d: 4 `contact_form_start`, 2 `contact_form_submit`, 3 `contact_form_view`. El abandono entre vista/inicio y envío es el dato útil, pero los volúmenes son demasiado bajos para tasas estables. `VALIDADO` como orden de magnitud; no como A/B.

**Blog como landing.** En 28 días GA4, las entradas orgánicas **no aterrizan en home**: prescripción (62 sesiones), pensión porcentaje (45), daños (23), expropiación (22). El usuario llega al artículo y debe encontrar un CTA de consulta **sin scroll infinito**. Los artículos inspeccionados sí tienen CTA (16–19 hits). Lo que no se ve en GA4 es el clic (`seo_blog_cta_click` = 2 / 28d). O el CTA no se pulsa, o el evento no cubre todos los botones.

**Mobile-first.** GSC dice que el clic es móvil. GA4 28d está más equilibrado (207 usuarios móvil / 229 escritorio) porque incluye Bing y directo. El título de 70 caracteres en FAQ se truncará en SERP móvil.

---

## 5. Rendimiento y Core Web Vitals

| Capa | Resultado | Clasificación |
| --- | --- | --- |
| CrUX origen | Sin datos (tráfico insuficiente) | `NO VALIDADO` |
| PSI producción mobile 2026-08-16 | API 429 | `NO VALIDADO` |
| Lighthouse 13.4.1 lab desktop 2026-08-03 | ver tabla | `VALIDADO` (laboratorio) |
| FID | Métrica retirada | No se reporta; usar INP |
| TBT lab | 4–11 ms | Bueno en lab |
| CLS lab | 0 | Bueno en lab |
| LCP lab | 3.667–4.431 ms | Malo vs umbral 2,5 s |

Lighthouse local (`performance-runtime-summary.json`):

| Ruta lab | Perf | A11y | BP | SEO | LCP | CLS | TBT | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| home | 88 | 100 | 96 | 100 | 3,91 s | 0 | 11 ms | 545 KiB |
| servicios | 85 | 100 | 96 | 100 | 4,43 s | 0 | 4 ms | 572 KiB |
| artículo | 88 | 100 | 96 | 100 | 3,82 s | 0 | 5 ms | 565 KiB |
| landing | 88 | 100 | 96 | 100 | 3,84 s | 0 | 4 ms | 552 KiB |
| contacto | 90 | 100 | 96 | 100 | 3,67 s | 0 | 4 ms | 519 KiB |

Interpretación: **la interactividad lab es buena** (TBT ~0, CLS 0). **El LCP no lo es.** En un bufete cuyo clic orgánico es 69 % móvil, un LCP de ~4 s en desktop simulado es un riesgo de abandono en 3G hondureño. Causa probable (a confirmar con treemap, no medida hoy): hero image, fuentes, JS de consentimiento diferido 2,5 s (`CONSENT_REVEAL_DELAY_MS`). El delay del banner es deliberado para no tapar LCP; no se debe «arreglar» metiendo el banner above-the-fold.

Producción: `cache-control: public, max-age=0, must-revalidate` + `x-vercel-cache: HIT` + `x-nextjs-prerender: 1`. El HTML se sirve desde caché de Vercel; no hay CDN de HTML de larga duración. Imágenes Next y CSS propios: `IMPLEMENTADO`. Compresión y HTTP/2: implícitos en Vercel; no se midió un waterfall (`NO VALIDADO`).

**Recomendación concreta:** cuando PSI deje de devolver 429, medir LCP mobile de home, un artículo top y consulta. Objetivo: LCP < 2,5 s. Hasta entonces, tratar LCP lab como `RIESGO`, no como fallo de producción demostrado.

---

## 6. Accesibilidad (WCAG 2.1)

| Control | Evidencia | Clasificación |
| --- | --- | --- |
| Un H1 por página | 33/33 HTML 200 de la muestra | `VALIDADO` |
| Title no vacío | 33/33 | `VALIDADO` |
| Imágenes con alt | 32/33 páginas a 0 missing; home 1/11 | `PENDIENTE` (home) |
| `lang` / schema `es_HN` | OpenGraph locale en legales | `VALIDADO` en metadatos |
| Consentimiento con foco y Escape | `components/cookie-consent.tsx` (dialog, focus trap, inert widgets) | `IMPLEMENTADO` |
| Lighthouse a11y lab | 100 en 5 rutas | `VALIDADO` lab |
| Contraste de tokens en producción | no medido con analizador | `NO VALIDADO` |
| Teclado en menú móvil / chat | no recorrido | `NO VALIDADO` |
| WAVE | no ejecutado | `NO VALIDADO` |
| Declaración de conformidad WCAG 2.1 AA | no existe como claim auditado | No afirmar AA |

No se afirma cumplimiento WCAG 2.1 AA. El sistema de diseño y el lab son un buen punto de partida; falta auditoría de contraste y teclado en producción. El alt vacío del home es el único defecto concreto de la muestra HTML.

---

## 7. Seguridad y cumplimiento legal

### 7.1 Transporte y cabeceras (GET `/`, 2026-08-16)

| Cabecera | Valor observado | Clasificación |
| --- | --- | --- |
| HTTPS | 200 en `https://www.pinedayasociadoshn.com` | `VALIDADO` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | `VALIDADO` |
| Content-Security-Policy | presente; `frame-ancestors 'self'`; script-src incluye GTM, Clarity, Cloudflare Turnstile | `VALIDADO` |
| X-Frame-Options | **ausente** | Sustituida por CSP `frame-ancestors`. Aceptable; no es un fallo si CSP se cumple |
| X-Content-Type-Options | `nosniff` | `VALIDADO` |
| Referrer-Policy | `strict-origin-when-cross-origin` | `VALIDADO` |
| Permissions-Policy | camera/microphone/geolocation/interest-cohort bloqueados | `VALIDADO` |
| Cookies de sesión públicas | no inspeccionadas (sin login) | `NO VALIDADO` |

El código en `next.config.ts` declara `X-Frame-Options` DENY/SAMEORIGIN según ruta. En el HTML público de Vercel no llegó `X-Frame-Options`; sí `frame-ancestors`. Priorizar CSP. `PENDIENTE` de confirmar en `/intranet` (fuera de alcance de esta auditoría pública).

### 7.2 Políticas publicadas

| Página | Robots | Versión en código por defecto | Hallazgo |
| --- | --- | --- | --- |
| `/aviso-legal` | noindex, follow | v0.1, junio 2026 | Identificación del titular, marco normativo HN, CAH. `VALIDADO` existencia |
| `/politica-privacidad` | noindex, follow | v0.5, julio 2026 | Cuerpo: Honduras **sin autoridad independiente de datos**; Arts. 76–80 Constitución. También aparece la cadena «Ley de Protección de Datos» (hero/defaults). **Tensión de wording.** `RIESGO` de citar una ley inexistente o no vigente como si fuera GDPR local |
| `/politica-cookies` | noindex, follow | v0.1 | Menciona consentimiento, cookies necesarias, Google Analytics y Clarity. `VALIDADO` en HTML |
| `/terminos` | noindex, follow | v0.2 | Uso del sitio / calculadora. `VALIDADO` existencia |
| `/disclaimer` | (no inspeccionada en la muestra de 35) | v0.1 | `PENDIENTE` si se exige en el checklist de pie |

Formulación comercial: landings de Choluteca, San Lorenzo, Goascorán y San Marcos usan «Evaluación inicial confidencial». `VALIDADO` frente a `lib/marketing-policy.ts`. No se vio «consulta gratuita» en la muestra.

Secreto profesional: presente en home, consulta y despacho. `VALIDADO` como mención; el contenido de un expediente concreto no se auditó (correcto).

Colegiación: el home puede renderizar «Abogado colegiado (CAH: …)» si hay número en perfil. R23/fase 1: el número no debe inventarse. En esta auditoría no se verificó el número contra el padrón del CAH (`NO VALIDADO`).

### 7.3 Tracking y consentimiento

- Analytics solo en `app/(public)/layout.tsx`. Prefijos excluidos: `/intranet`, `/preview`, `/api`, `/cp`, `/calculadora`, `/casos`, `/delitos`, `/atajos`, `/admin`. `IMPLEMENTADO`.
- Gtag no carga sin `consent.analytics === true`. `IMPLEMENTADO`.
- GA4 y GTM mutuamente excluyentes en código. `IMPLEMENTADO`.
- Eventos sin PII (form_name, page_path, service_area). `IMPLEMENTADO` en helpers.
- Intranet **no** monta `AnalyticsScripts`. Aun así GA4 365d muestra `/intranet/login` (156 pageviews, 130 usuarios) y `/intranet/admin` (209 pv, 6 usuarios). Hipótesis: propiedad compartida con un stream antiguo, extensión de debug, o hits previos al exclude. En 28d las landings top ya son blog, no intranet. **Filtrar en informes.** `RIESGO` de métricas, no de filtrado público.

---

## 8. Analítica y tracking (GA4 + Bing + GSC)

### 8.1 GA4 — 365 días (máximo de la propiedad)

| Métrica | Valor |
| --- | ---: |
| Usuarios | 1.118 |
| Sesiones | 1.429 |
| Pageviews | 5.598 |
| Eventos | 11.592 |
| Eventos clave | 29 |
| Duración media de sesión | 336 s |
| Rebote | 50,3 % |

Fuentes 365d: direct 561 usuarios (incluye intranet/bookmarks), Google 353, Bing 145, copilot.com 16, chatgpt.com 7, facebook 5+2+2. **Hay tráfico GEO/IA medible** (Copilot, ChatGPT, Gemini). `VALIDADO`.

Países 365d: Honduras 480, España 296, EE.UU. 151, Hong Kong 56, (not set) 30, Países Bajos 28, China 23. España y Asia en 365d no cuadran con GSC (España 37 clics). El 365d de GA4 está inflado por uso interno, previews o bots. **No usar 365d de GA4 para geografía de clientes** sin filtro. El 28d sí: Honduras 361 / 454 sesiones (81 %).

### 8.2 GA4 — 28 días (la ventana de verdad pública)

| Métrica | Valor |
| --- | ---: |
| Usuarios | 439 |
| Sesiones | 560 |
| Pageviews | 744 |
| Eventos clave | 20 |
| Duración media | 233 s |
| Rebote | 28,4 % |

Fuentes 28d: Google 247 usuarios / 307 sesiones, Bing 120 / 149, direct 29 / 44, (not set) 21, Copilot 12, ChatGPT 3. Orgánico combinado Google+Bing ≈ 84 % de usuarios. `VALIDADO`.

Dispositivos 28d: desktop 229, mobile 207, tablet 3. Contrasta con GSC (clic móvil). Parte del desktop GA4 es Bing/Copilot en PC.

**Embudo 28d (eventos)**

| Evento | Count | Usuarios | Rol |
| --- | ---: | ---: | --- |
| scroll_depth | 799 | 353 | Interés |
| page_view | 744 | 438 | Base |
| whatsapp_click | 14 | 11 | Intención |
| faq_open | 11 | 4 | Interés |
| contact_form_start / form_start | 4 / 4 | 3 | Intención |
| contact_form_submit | 2 | 2 | Conversión |
| lead_generated | 2 | 2 | Conversión |
| phone_click | 1 | 1 | Conversión |
| seo_blog_cta_click | 2 | 2 | Intención |
| chat_opened | 1 | 1 | Intención |

El negocio, hoy, **convierte por WhatsApp**, no por el formulario. Relación aprox. 14:2. El key event `contact_form_submit` está bien instrumentado (tras HTTP 2xx, sin PII) y casi no dispara. Pregunta de producto, no de tag: ¿el formulario pide demasiado para un usuario de pensión alimenticia que llegó desde Google?

`landingPage (not set)`: 30 sesiones / 28d (0 newUsers) y 132 / 365d. Sigue el problema histórico de medición, reducido pero no cerrado. `RIESGO`.

`email_click` como key event: sigue pendiente de acción en el panel GA4 (service account sin escritura). `PENDIENTE`.

### 8.3 Bing Webmaster

| Métrica | Valor |
| --- | ---: |
| Días de crawl | 67 |
| Páginas rastreadas | 9.477 |
| 2xx | 24.201 |
| 4xx | 1.183 |
| 5xx | 0 |
| Errores de rastreo | 1.351 |
| Queries | 555 |
| Backlinks | 0 |
| URLs prioritarias rastreadas | 10/10 |

Las queries de Bing en el reporte tienen posición 0 y CTR 0 % en el volcado tabular: la API Key no entrega ranking comparable al de GSC. Sirven como **demanda semántica** (pensión, union de hecho, allanamiento, prestaciones, aduanas), no como ranking. `VALIDADO` como lista de preguntas; `NO VALIDADO` como posiciones.

Comparativa Google vs Bing (28d GA4, no WMT): Google 307 sesiones vs Bing 149. Bing es **un tercio del orgánico de sesiones**, desproporcionado respecto a clics GSC. Encaja con Copilot/IA y con el overcrawl. Tratar Bing como canal GEO, no como réplica de Google.

IndexNow: dry-run OK. Envío real no autorizado en este bloque.

---

## 9. Análisis de competencia

Sin Ahrefs no hay DA, referring domains ni gap numérico. `NO VALIDADO` cualquier cifra de autoridad.

### 9.1 SERP públicas (2026-08-16, buscador web)

| Query | Qué aparece | Pineda |
| --- | --- | --- |
| `abogados nacaome` | Home de Pineda citado en primer lugar | **Gana la plaza** |
| `abogados choluteca` | Cordova & Sauceda (`abogadosdecholuteca.com`), LinkedIn locales | Landing Pineda existe y tiene 13 clics/28d, pero la SERP genérica no lo destacó en esta muestra |
| `pensión alimenticia honduras porcentaje` | Código de Familia (PDF TSC), Procuracion Legal HN, TuNota, consulados | El artículo de Pineda **sí captura clics** (query top GSC, pos. ~3) aunque esta SERP mezcló fuentes oficiales y medios |
| `prescripción de deudas honduras` | BJ Abogados, Grandliga, Scribd, Ulloa Law | Pineda es fuerte en GSC (132 clics) y no dominó este recorte de SERP |
| `qué hacer si me detienen honduras` | Poder Judicial, CPP (OAS/TSC), guías de inmigración USA (ruido) | Pineda tiene la URL y el CTR es pobre: el featured snippet se lo llevan fuentes oficiales |
| `abogado penal honduras` | Consortium Legal, Officium, Dabar (SPS), perfiles LinkedIn | No es el tablero del bufete de Nacaome |

### 9.2 Competidores a vigilar (cualitativo)

| Actor | Tipo | Implicación |
| --- | --- | --- |
| **Córdova & Sauceda** (Choluteca) | Bufete local con web propia | Rival directo de `/abogados-en-choluteca`. Ellos tienen NAP local; Pineda atiende desde Nacaome. El contenido de la landing debe decir con claridad la modalidad (desplazamiento / cita) |
| **BJ Abogados** | Blog jurídico nacional | Compite en prescripción y derecho privado. Autoridad de contenido, no de Valle |
| **Procuracion Legal HN / TuNota / consulados** | Medios y portales | Ganan snippets de pensión. Pineda debe responder «no hay porcentaje fijo; el juez pondera» en las primeras 40 palabras (coherente con el artículo 2026 ya publicado) |
| **Consortium / Officium / Dabar** | Penal corporativo capital / SPS | No pelear «abogado penal Honduras». Pelear detención + habeas + querella en lenguaje de usuario del sur |
| **Bufete Pineda y Asociados — Tegucigalpa** (`bufetepinedayasociados.com`, José Juan Pineda) | **Colisión de marca** | Riesgo de que un cliente de Google Maps/marca se equivoque de despacho. Desambiguar siempre «Nacaome, Valle» en title, GBP y NAP. `RIESGO` reputacional |

### 9.3 Off-page

Bing: **0 backlinks**. Directorios legales y menciones en prensa: `NO VALIDADO` (no se encontró en esta SERP una ficha de directorio inequívoca del bufete de Nacaome). Facebook aparece como fuente GA4 residual (5+ usuarios / 365d). Presencia social: `NO VALIDADO` (no se auditaron perfiles). Google Business Profile: `NO VALIDADO` (no se accedió al panel).

Acción de autoridad, no de más artículos: Colegio de Abogados capítulo Valle/Choluteca, directorios serios, una mención en medio local, GBP verificado con fotos de la sede. Cinco enlaces buenos valen más que 50 posts nuevos.

---

## 10. Plan de acción prioritario

Impacto = clics, leads o riesgo legal. Esfuerzo = cambio de snippet / filtro / recrawl vs rediseño.

### Alta urgencia / alto impacto

| # | Tarea | Por qué | Dueño |
| --- | --- | --- | --- |
| A1 | Reescribir title/meta de divorcio, detención, sobreseimiento (destino 308), despacho y nacionalidad española | Miles de impresiones a CTR < 1 % | Editorial + SEO |
| A2 | Eliminar o desindexar fragments `#` de prescripción | 2.000+ imp. fantasma, 0 clics | Dev SEO (JSON-LD `@id`) |
| A3 | Tratar WhatsApp como conversión principal en informes y en CTA above-the-fold del blog | 14 vs 2 envíos de form en 28d | Marketing |
| A4 | Filtro GA4: excluir `/intranet`, hostname no canónico, y diagnosticar `(not set)` | 365d no sirve para decidir | Analytics |
| A5 | Bing: investigar 4xx (panel WMT) y recrawl de URLs 308 | 1.183 4xx / 1.351 errores | SEO técnico |
| A6 | Desambiguar marca vs Pineda de Tegucigalpa en titles y ficha local | Riesgo de cliente equivocado | Despacho |

### Media

| # | Tarea | Por qué |
| --- | --- | --- |
| M1 | Alinear H1 de `/abogados-en-nacaome` con «abogados», dejar visita en `/como-llegar` | Canibalización interna |
| M2 | Acortar title de FAQ; dar a `/preguntas-frecuentes` una query (honorarios, presupuesto) | 0 clics orgánicos |
| M3 | Enlaces internos pensión porcentaje ↔ guía; naturalización duplicada KEEP/MERGE | Canibalización |
| M4 | H2 «detención judicial» y «tarjeta de crédito» dentro de piezas existentes | Demanda GSC sin artículo nuevo |
| M5 | Alt de la imagen del home | Único fallo alt de la muestra |
| M6 | Medir LCP mobile cuando PSI no dé 429; objetivo < 2,5 s | Lab LCP ~4 s |
| M7 | Marcar `email_click` como key event en GA4 (acción de consola) | Plan de medición |
| M8 | GBP + 3–5 menciones/directorios reales | 0 backlinks Bing |

### Baja

| # | Tarea | Por qué |
| --- | --- | --- |
| B1 | Unificar `X-Frame-Options` con CSP en la respuesta pública | Cosmético si `frame-ancestors` se mantiene |
| B2 | Revisar subtítulo de privacidad vs «Ley de Protección de Datos» | Precisión jurídica (R4) |
| B3 | No perseguir «abogado penal Honduras» nacional | SERP de capitales |
| B4 | Landings indexables sin clics (Goascorán, Amapala): no noindexear aún; no invertir copy hasta 90d más de GSC | Demanda no demostrada |
| B5 | Reparar `seo:collect` health/sitemap timeout y el `override: true` de dotenv vs dotenvx | Operación interna |

---

## 11. Checklist de implementación (equipo Pineda y Asociados)

Usar como lista de trabajo. No está hecha hasta que hay evidencia.

- [ ] Titles/metas de A1 redactados, revisados por el despacho (R4, R23, R24) y publicados
- [ ] GSC 28d posterior: CTR de divorcio y detención > 1,5 % o posición anotada
- [ ] Fragments `#` de prescripción dejan de aparecer como páginas en GSC (o caen a <50 imp.)
- [ ] Informe GA4 28d sin `/intranet/*` en top pages
- [ ] `(not set)` < 5 % de landings o causa documentada
- [ ] WhatsApp y `contact_form_submit` como conversiones en el mismo tablero
- [ ] Panel Bing: muestra de 20 URLs 4xx clasificada (muerta / redirect / noindex)
- [ ] IndexNow real solo tras deploy, con autorización
- [ ] GBP Nacaome verificado o `NO VALIDADO` explícito
- [ ] Una línea de desambiguación «Nacaome, Valle — no somos el bufete homónimo de Tegucigalpa» aprobada por el titular
- [ ] Alt del home corregido
- [ ] H1 landing Nacaome decidido (oficina vs abogados)
- [ ] PSI mobile home + artículo pensión + consulta, guardado en `docs/audits/` o lab
- [ ] Wording de privacidad: o se nombra la ley exacta vigente, o se deja solo Constitución Arts. 76–80
- [ ] Este informe **no** se mezcla en el PR `fix/allow-production-editorial-upsert` salvo orden expresa

---

## 12. Cierre de una página — 5 hallazgos y 5 acciones

**Cinco hallazgos más críticos**

1. El orgánico **ya paga**: 741 clics / 28d, CTR 2,3 %, posición ~6. El problema es convertir impresiones (divorcio, detención, fragments, despacho) y convertir visitas (WhatsApp sí, formulario casi no).
2. On-page técnica de pilar y top blog está **implementada** (H1 único, schema, canonical, CTAs). Seguir «optimizando titles de todo el blog» tiene rendimiento decreciente; hay que ir a snippets de CTR 0 y a off-page.
3. Medición: GA4 365d **no es fiable para geografía ni para páginas top** (intranet, España inflada, `(not set)`). Decidir con GSC + GA4 28d filtrado.
4. Bing rastrea 47 veces más URLs que el sitemap y reporta 0 backlinks. Hay deuda de crawl y de autoridad, no de más posts.
5. Competencia local de Choluteca (Córdova & Sauceda) y colisión de marca con otro Pineda en Tegucigalpa son riesgos de negocio, no de Lighthouse.

**Cinco acciones más urgentes**

1. Reescribir 5 snippets de CTR crítico (divorcio, detención, sobreseimiento destino, despacho, nacionalidad ES).
2. Quitar fragments indexables de prescripción.
3. Filtrar GA4 (intranet + `(not set)`) y mirar WhatsApp como KPI de lead.
4. Clasificar 4xx de Bing y pedir recrawl de 308.
5. Desambiguar NAP/marca Nacaome y abrir 3 vías reales de mención (GBP, colegio, directorio).

---

## Anexo A — Certificaciones de esta corrida

- No se imprimieron secretos ni valores de `.env*`
- No se envió IndexNow real ni se abrieron formularios de producción
- No se hizo commit ni push
- Scripts de extracción se restauraron; el árbol Git de código queda sin esos parches
- Archivos de datos live en `data/google/` y `data/bing/` (gitignored)
- Reportes actualizados por collector: `docs/audits/seo-live-summary.md`, `docs/audits/bing-live-report.md`

## Anexo B — Preguntas del brief, respuesta corta

| Pregunta | Respuesta con evidencia |
| --- | --- |
| ¿Optimizado a lo que busca el público? | Parcialmente. Sí en pensión/prescripción/poder. No en snippets de divorcio/detención. Las páginas de servicio no son el gancho orgánico |
| ¿Formularios y CTAs convierten? | WhatsApp sí (14/28d). Formulario 2 envíos. CTA de blog medido 2 veces |
| ¿Abandono? | Landings GA4 28d = artículos, no home. `(not set)` 30 sesiones. Volumen de form_start 4 vs submit 2 |
| ¿El blog atrae tráfico de calidad? | Sí: 84 % clics GSC desde HN; sesiones orgánicas Google+Bing dominantes en 28d. Calidad de lead `NO VALIDADO` (no hay cruce expediente) |
| ¿Vs competidores? | Gana Nacaome. Choluteca es de Córdova en SERP genérica. Penal nacional es de capitales. Contenido nacional (BJ, medios) pelea snippets |
| ¿Accesibilidad que excluya? | Un alt vacío en home. AA no afirmable |
| ¿Velocidad móvil competitiva? | Lab LCP ~4 s; campo `NO VALIDADO` |
| ¿Políticas según normativa HN? | Páginas existen y citan Constitución y CAH. El rótulo «Ley de Protección de Datos de Honduras» debe alinearse con el cuerpo (no hay autoridad independiente) |

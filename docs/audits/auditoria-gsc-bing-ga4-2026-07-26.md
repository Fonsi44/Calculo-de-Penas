# Auditoría conjunta GSC, Bing Webmaster Tools y GA4

**Sitio:** https://www.pinedayasociadoshn.com/  
**Fecha de auditoría:** 26 de julio de 2026  
**Fuentes:** Google Search Console, Google Analytics 4, Bing Webmaster Tools, API de Search Console, API de GA4, API de Bing y revisión del código de medición.

## Resumen ejecutivo

El sitio está creciendo con rapidez y ya tiene visibilidad orgánica y GEO significativa. El principal freno no es la falta de posicionamiento, sino la combinación de tres problemas:

1. **Medición incompleta:** GA4 no tiene eventos clave y atribuye 73 de 167 sesiones a una página de destino `(not set)`.
2. **CTR mejorable en Google:** posición media 6,5 con un CTR de solo 2,28 %. Hay páginas que ya están en primera página y pueden captar más clics sin esperar grandes mejoras de ranking.
3. **Indexación y rastreo todavía inmaduros:** Google mostraba 107 páginas descubiertas sin indexar en su último informe de cobertura; Bing no tiene el sitemap registrado y reporta enlaces muertos/errores de rastreo.

La señal GEO es especialmente positiva: Bing informa de **79 páginas citadas en respuestas de IA**. No conviene rehacer de forma masiva esos contenidos; hay que conservar su estructura factual, reforzar la autoridad y añadir mejores rutas hacia la consulta.

## Cuadro de situación

| Área | Resultado | Diagnóstico |
|---|---:|---|
| Google, últimos 28 días | 297 clics / 13.010 impresiones | Buen arranque |
| CTR Google | 2,28 % | Mejorable |
| Posición media Google | 6,5 | Muy prometedora |
| Bing, 3 meses | 210 clics / 5,1 mil impresiones | Crecimiento fuerte |
| CTR Bing | 4,13 % | Saludable |
| GA4, últimos 28 días | 167 sesiones / 126 usuarios activos | Muestra todavía pequeña |
| Sesiones de búsqueda orgánica | 105 (62,9 %) | Canal principal |
| Eventos clave GA4 | 0 | Crítico |
| Landing page `(not set)` | 73 sesiones (43,7 %) | Crítico |
| Google indexadas | 115 | Informe del 10/07, todavía desactualizado |
| Google descubiertas sin indexar | 107 | Prioridad alta |
| Sitemap Google | 212 URLs, procesado correctamente | Correcto |
| Sitemap Bing | 0 sitemaps registrados | Prioridad alta |
| Páginas citadas por IA en Bing | 79 | Fortaleza GEO |

## 1. Google Search Console

### Rendimiento

Periodo API: 28/06/2026–26/07/2026.

- 297 clics.
- 13.010 impresiones.
- CTR: 2,28 %.
- Posición media: 6,5.
- El 79,8 % de los clics y el 75,1 % de las impresiones proceden de Honduras.
- Móvil genera el 63,6 % de los clics y el 74,4 % de las impresiones.

La diferencia móvil/escritorio es relevante: móvil tiene aproximadamente 1,95 % de CTR frente a 3,27 % en escritorio. La mejora de títulos, descripciones y lectura del fragmento debe diseñarse primero para resultados móviles.

### Páginas con mayor oportunidad de CTR

| Página | Clics | Impresiones | CTR aprox. | Acción |
|---|---:|---:|---:|---|
| Pensión alimenticia, guía completa | 21 | 1.444 | 1,45 % | Reescribir título y descripción; diferenciarla de la página de porcentajes |
| Poder legal en Honduras | 17 | 1.208 | 1,41 % | Responder desde el título cuándo se necesita y cuánto dura |
| Naturalización / nacionalidad | 10 | 673 | 1,49 % | Consolidar intención y evitar competencia entre dos URLs similares |
| Custodia de hijos | 10 | 563 | 1,78 % | Título orientado a criterios del juez y pasos |
| Divorcio en Honduras | 3 | 533 | 0,56 % | Prioridad máxima de snippet |
| Estafas y fraudes | 3 | 393 | 0,76 % | Hacer explícitos denuncia, prueba y pena |
| Sobreseimiento definitivo/provisional | 2 | 389 | 0,51 % | Incluir la diferencia principal al inicio del título |

No deben modificarse las referencias jurídicas verificadas. La intervención recomendada es editorial: `title`, metadescripción, introducción, resumen de respuesta y enlaces internos.

### Consultas de “ganancia rápida”

Consultas ya situadas entre las posiciones 1 y 10, pero con cero clics:

- `sobreseimiento definitivo`: 84 impresiones, posición 7,4.
- `cuando prescribe una deuda en honduras`: 23 impresiones, posición 4,7.
- `en cuanto tiempo prescribe una deuda en honduras`: 22 impresiones, posición 3,5.
- `daños y perjuicios`: 24 impresiones, posición 5,5.
- `sobreseimiento definitivo honduras`: 15 impresiones, posición 4,1.
- `cauca honduras`: 14 impresiones, posición 7,5.

Estas consultas deben incorporarse de forma natural en el título, primer párrafo, subtítulos o preguntas frecuentes de la página que ya posiciona. No se recomienda crear una URL nueva para cada variante.

### Indexación

El sitemap se procesó correctamente el 25/07/2026 y contiene 212 URLs. El informe de cobertura, con última actualización del 10/07/2026, mostraba:

- 115 páginas indexadas.
- 119 páginas no indexadas.
- 107 `Descubierta: actualmente sin indexar`.
- 8 excluidas correctamente por `noindex`.
- 3 páginas con redirección.
- 1 alternativa con canónica adecuada.

La cifra de 107 debe tratarse con cautela porque el informe es anterior al último sitemap y a la implementación reciente. Aun así, el volumen indica que Google todavía no considera todas las URLs igual de prioritarias.

Acciones:

1. Mantener en el sitemap únicamente URLs canónicas, indexables y con valor autónomo.
2. Dividir el control editorial en tres grupos: páginas de negocio, artículos con demanda probada y artículos secundarios.
3. Aumentar enlaces internos desde home, servicios y hubs hacia las páginas estratégicas que están descubiertas pero sin indexar.
4. No solicitar indexación manual de cientos de URLs; inspeccionar solo las 15–25 páginas de negocio y contenido con mayor potencial.
5. Revisar de nuevo la cobertura después de 14–21 días, cuando Google haya actualizado el informe.

### Core Web Vitals

Search Console todavía no dispone de suficientes datos reales de usuarios en móvil ni escritorio durante los últimos 90 días. Por tanto, no se puede afirmar todavía que el sitio apruebe o suspenda CWV con datos de campo. Debe mantenerse una auditoría de laboratorio periódica para las plantillas de home, servicio, localidad y artículo.

## 2. Bing Webmaster Tools y GEO

### Rendimiento orgánico

Periodo visible: 3 meses.

- 210 clics.
- 5,1 mil impresiones.
- CTR medio: 4,13 %.
- La tendencia diaria se acelera claramente desde mediados de julio.

Páginas con buen rendimiento:

- Registro de marca: 83 impresiones, 13 clics, CTR 15,66 %, posición 3,33.
- Acoso laboral: 26 impresiones, 9 clics, CTR 34,62 %, posición 3,23.
- Habilitación de clínicas: 89 impresiones, 9 clics, CTR 10,11 %, posición 3,75.
- Unión de hecho: 84 impresiones, 8 clics, CTR 9,52 %, posición 3,85.
- Prescripción de deudas: 44 impresiones, 7 clics, CTR 15,91 %, posición 2.

Páginas con mayor oportunidad:

- Obtener RTN: 446 impresiones, 1 clic, CTR 0,22 %, posición 6,89.
- Registro sanitario de alimentos ARSA: 108 impresiones, 0 clics, posición 6,76.
- Jornada laboral: 113 impresiones, 2 clics, CTR 1,77 %, posición 4,89.
- Central de riesgos: 117 impresiones, 2 clics, CTR 1,71 %, posición 7,98.
- Facturación electrónica: 65 impresiones, 1 clic, CTR 1,54 %, posición 5,72.
- ISV: 57 impresiones, 0 clics, posición 7,58.
- Contratos de arrendamiento: 42 impresiones, 0 clics, posición 2,36.

### Visibilidad en respuestas de IA

Bing registra 79 páginas citadas. Principales páginas:

| Página | Citas |
|---|---:|
| Naturalización / nacionalidad hondureña | 179 |
| Guía aduanera de importaciones | 133 |
| Constituir una empresa | 126 |
| Unión de hecho | 114 |
| Licencia ambiental | 102 |
| Importar mercancías | 99 |
| Despido laboral | 97 |
| Testamentos y herencias | 90 |
| Prescripción de deudas | 78 |
| Habilitación de clínicas | 65 |

Consultas GEO visibles:

- `licencia ambiental`: 50 citas, 39,06 % de cuota de citación.
- `licencia sanitaria honduras`: 35 citas, 33,33 %.
- `licencia ambiental honduras`: 28 citas, 30,43 %.
- `tipos de sociedades mercantiles en Honduras`: 5 citas, 62,50 %.

Recomendaciones GEO:

1. Conservar la respuesta directa al comienzo de estos artículos.
2. Mantener fechas de revisión, autoría profesional y fuentes jurídicas oficiales.
3. Añadir tablas de requisitos, plazos, autoridad competente y pasos.
4. Explicar límites, excepciones y cuándo es necesario contratar abogado.
5. Reforzar enlaces entre cada artículo citado y su servicio jurídico correspondiente.
6. Extender el mismo patrón a pensión alimenticia, derecho penal urgente, poderes y servicios locales.
7. Evitar reescrituras masivas de las 79 URLs citadas: pueden destruir señales que ya funcionan.

### Rastreo, sitemap e IndexNow

- Bing no muestra ningún sitemap registrado. Debe enviarse `https://www.pinedayasociadoshn.com/sitemap.xml`.
- IndexNow funciona y muestra unas 10,5 mil notificaciones históricas. Las últimas URLs visibles se enviaron el día anterior a las 14:20.
- El volumen de 10,5 mil envíos para un sitio de unas 212 URLs sugiere reenvíos repetidos. IndexNow debe notificarse solo cuando una URL se crea, cambia de forma relevante, redirige o desaparece.
- Bing marca como error de severidad alta un enlace muerto que debe notificarse mediante IndexNow.
- Bing marca como recomendación moderada la falta de enlaces entrantes de dominios de calidad.
- La extracción de API acumuló 895 respuestas 4xx y 1.107 errores de rastreo en 46 días. Estas cifras deben depurarse por URL en Site Explorer; no deben interpretarse como 895 páginas actuales rotas porque son acumulados diarios.

Acciones:

1. Registrar el sitemap en Bing.
2. Identificar la URL muerta exacta, corregir enlaces internos y enviar su baja por IndexNow.
3. Reducir envíos repetidos de IndexNow.
4. Revisar 4xx por patrones: URLs antiguas, variantes de slug, assets, parámetros y enlaces externos mal formados.
5. Conseguir enlaces editoriales reales desde Colegio de Abogados, directorios profesionales de calidad, cámaras de comercio, universidades, medios locales y entidades empresariales; evitar paquetes de enlaces.

## 3. Google Analytics 4

### Adquisición

Periodo: 28/06/2026–26/07/2026.

- 167 sesiones.
- 126 usuarios activos.
- 121 usuarios nuevos.
- 71 sesiones con interacción.
- Tasa de interacción: 42,51 %.
- Tiempo medio de interacción: 1 min 07 s.

Canales:

| Canal | Sesiones | % |
|---|---:|---:|
| Organic Search | 105 | 62,87 % |
| Direct | 32 | 19,16 % |
| Organic Social | 17 | 10,18 % |
| Unassigned | 10 | 5,99 % |
| AI Assistant | 9 | 5,39 % |

Fuentes destacadas:

- Google: 77 sesiones.
- Bing: 27 sesiones.
- ChatGPT: 5 sesiones.
- Copilot: 4 sesiones.

El canal de asistentes de IA ya representa un 5,4 % de las sesiones identificadas. Debe conservarse la agrupación `AI Assistant` y añadirse seguimiento periódico por fuente y landing.

### Problemas críticos de medición

1. **No hay eventos clave:** GA4 informa 0 conversiones.
2. **Landing page `(not set)`:** 73 sesiones, el 43,71 % del total.
3. **Landing vacía:** otras 7 sesiones.
4. **Eventos de negocio casi ausentes:** solo aparece un `seo_blog_cta_click`; no aparecen `whatsapp_click`, `phone_click`, `form_click`, `contact_form_submit` ni `lead_generated`.
5. **Tráfico interno:** aparecen vistas y sesiones de `/intranet/sgie`, pese a que el código actual pretende excluir esa ruta.
6. **Ruido de pruebas:** aparece `codex_test / preview_audit`.
7. **Atribución social anómala:** un único usuario de `l.facebook.com` genera 16 sesiones, señal que conviene revisar.

### Causa probable de `(not set)`

La instrumentación carga `gtag.js` de forma diferida y envía el primer `page_view` desde un efecto de React. Si el stub `gtag` todavía no está disponible cuando se ejecuta ese efecto, `sendPageView` abandona el envío y no vuelve a intentarlo. Otros eventos posteriores pueden iniciar una sesión sin una página de entrada, produciendo `(not set)`.

Hay que verificarlo con DebugView/Tag Assistant, pero el patrón de datos y el código son coherentes con esta carrera de inicialización.

### Correcciones de GA4

Prioridad inmediata:

1. Garantizar que el primer `page_view` se encola exactamente una vez después de inicializar `gtag`.
2. Verificar en navegador: primera carga, navegación SPA, consentimiento aceptado, consentimiento rechazado y cambio de preferencia.
3. Marcar como eventos clave:
   - `contact_form_submit`
   - `whatsapp_click`
   - `phone_click`
   - opcionalmente `email_click`
4. Mantener `form_click` y `consultation_form_start` como microconversiones, no como conversiones principales.
5. Asegurar que los CTA del header, footer, barra flotante, artículos, chat y formulario usan los mismos nombres de evento.
6. Excluir definitivamente intranet, preview, equipo interno y tráfico de auditoría.
7. Crear un informe de embudo:
   `landing orgánica → CTA → inicio de formulario/WhatsApp/teléfono → envío confirmado`.

Objetivo de calidad de datos a 30 días:

- `(not set)` en landing pages por debajo del 5 %.
- 100 % de contactos atribuibles a una página y una fuente.
- Cero tráfico de intranet/preview en la propiedad pública.

## 4. Plan de acción priorizado

### P0 — esta semana

1. Corregir el primer `page_view` de GA4 y validar con DebugView.
2. Configurar eventos clave reales.
3. Eliminar tráfico interno y de pruebas.
4. Registrar el sitemap en Bing.
5. Localizar y corregir el enlace muerto señalado por Bing.

### P1 — próximos 14 días

1. Mejorar títulos y metadescripciones de las 10 páginas con más impresiones y CTR bajo.
2. Priorizar en Google: pensión, poderes, nacionalidad, custodia, divorcio, estafas y sobreseimiento.
3. Priorizar en Bing: RTN, ARSA, jornada laboral, central de riesgos, facturación electrónica, ISV y arrendamiento.
4. Consolidar o diferenciar claramente las dos URLs de naturalización/nacionalidad.
5. Reforzar enlaces desde artículos informativos hacia páginas de servicio y consulta.

### P2 — próximos 30–60 días

1. Revisar las 107 URLs descubiertas sin indexar cuando GSC actualice sus datos.
2. Resolver patrones 4xx y reducir rastreo inútil.
3. Construir enlaces editoriales locales y profesionales.
4. Replicar el patrón GEO de las páginas citadas en contenidos transaccionales.
5. Crear panel mensual conjunto GSC + Bing + GA4 con alertas.

## 5. Objetivos medibles

| KPI | Actual | Objetivo inicial |
|---|---:|---:|
| CTR Google | 2,28 % | ≥ 3,25 % en 60 días |
| CTR móvil Google | ~1,95 % | ≥ 2,75 % |
| Landing `(not set)` GA4 | 43,71 % | < 5 % |
| Eventos clave | 0 | 100 % de contactos medidos |
| Sitemap Bing | No registrado | Registrado y procesado |
| Errores SEO/GEO Bing | 2 tipos | 0 errores técnicos |
| Páginas citadas por IA | 79 | Mantener y ampliar a páginas de negocio |
| Sesiones AI Assistant | 9/167 | Medir tendencia y conversión, no solo volumen |

## Conclusión

El sitio ya ha superado la fase de “ser descubierto”: Google, Bing y los sistemas de respuesta de IA lo están mostrando. La prioridad debe pasar de producción masiva a **medición fiable, mejora de CTR, consolidación de autoridad y conversión del tráfico existente**.

El mayor impacto a corto plazo vendrá de arreglar GA4, registrar el sitemap de Bing y optimizar los fragmentos de las páginas que ya ocupan posiciones competitivas. Después, el crecimiento debe centrarse en enlaces de calidad y en extender el patrón GEO de los contenidos que Bing ya cita.

# Auditoría de cumplimiento del Plan Maestro — Pineda y Asociados

**Fecha de auditoría:** 2 de agosto de 2026  
**Repositorio auditado:** `auditoria-repositorio.zip`  
**Plan de referencia:** `docs/roadmaps/completed/plan-maestro-seo-geo-contenido-2026-07-28.md`
**Naturaleza del sitio:** servicios jurídicos YMYL  
**Tipo de auditoría:** comparativa de código, contenido versionado, gobernanza editorial, SEO, GEO, accesibilidad, rendimiento y conversión  
**Acciones expresamente no realizadas:** despliegue, modificación de Production, escritura en bases de datos, migraciones, merge o publicación de contenidos.

---

## Resumen ejecutivo

### Veredicto

**CUMPLIMIENTO PARCIAL — EL PLAN MAESTRO NO ESTÁ CERRADO.**

El repositorio presenta una implementación técnica avanzada: identidad centralizada, tres perfiles profesionales, home y páginas de servicio sólidas, rutas canónicas, controles de rastreo, inventarios SEO, propuestas editoriales separadas, pruebas especializadas, sanitización del blog, formularios prudentes y un sistema de documentación considerable.

Sin embargo, el criterio rector y varios gates explícitos del Plan Maestro siguen incumplidos:

1. **Los artículos indexables no tienen autor individual de forma universal.** La base y el runtime permiten usar `Pineda y Asociados` como autor.
2. **La revisión institucional se considera suficiente para indexar.** El Plan exige autor humano y revisión verificable, y prohíbe usar la marca como sustituto del autor.
3. **Los artefactos versionados muestran 135 firmas institucionales y cero firmas individuales activadas.** El problema no es aislado: afecta al núcleo completo del blog publicado representado en la evidencia.
4. **Nueve landings municipales clasificadas como `NOINDEX_UNTIL_UNIQUE` siguen configuradas como indexables y forman parte del catálogo estático del sitemap.**
5. **El modelo editorial no contiene `sourceAsOf` ni `primaryPracticeArea`, campos obligatorios del Plan.**
6. **Persisten afirmaciones inconsistentes sobre consulta gratuita o sin costo**, repartidas por páginas, FAQ, componentes y datos locales.
7. **Las 40 mejoras editoriales prioritarias continúan en `lawyer_review_pending`**, correctamente bloqueadas, pero por ello la Fase 4 no puede considerarse terminada.
8. **No se pudo ejecutar la batería de build/tests en este entorno** porque `npm ci` falló al descargar una dependencia desde el registro interno. Los informes versionados de pruebas son evidencia documental, no una validación independiente de este ZIP.

### Grado estimado de cumplimiento

**Estimación orientativa: 64 %.**

Este porcentaje es solo un apoyo de lectura y no el veredicto. La penalización principal proviene de gates binarios del Plan que siguen abiertos: autor individual, revisión jurídica verificable, landings noindex coherentes, sitemap limpio y cierre editorial de artículos prioritarios.

| Dominio | Peso | Cumplimiento estimado | Observación |
|---|---:|---:|---|
| Seguridad editorial y revisión | 25 % | 48 % | Arquitectura de estados avanzada, pero acepta firma institucional y autor corporativo. |
| Identidad, perfiles y autoridad | 15 % | 75 % | Tres perfiles sólidos; autoría real del blog no migrada. |
| Arquitectura, canibalización y landings | 15 % | 68 % | Mapas e inventarios presentes; nueve decisiones `NOINDEX` no aplicadas. |
| Metadata, CTR y páginas prioritarias | 10 % | 78 % | Buen sistema y auditoría; hay inconsistencias entre artefactos y claims comerciales. |
| Calidad y profundidad del blog | 15 % | 50 % | 40 propuestas preparadas, todas pendientes de firma humana. |
| SEO técnico, schema y GEO | 15 % | 75 % | Base robusta; sitemap monolítico, IDs de entidades incoherentes y `llms.txt` incompleto. |
| Accesibilidad, rendimiento y conversión | 5 % | 80 % | Buenas salvaguardas y contratos; validación ejecutable no reproducida aquí. |

### Principales fortalezas

- Fuente central de identidad y origen canónico en `lib/site.ts`.
- Tres perfiles públicos canónicos con metadata, H1, `ProfilePage` y relación con `Person`.
- Home orientada a `abogados en Nacaome`, con H1 correcto y acceso por problema.
- Página central de servicios bien estructurada y con responsables visibles.
- `query-url-map.csv`, inventarios locales, reportes GSC, auditorías de metadata, enlaces y rastreo.
- Separación prudente de 40 propuestas editoriales pendientes: no se aplican automáticamente a Production.
- Sanitización del HTML, transformación render-only, avisos legales, navegación, TOC y enlaces relacionados.
- Política de robots y protección de zonas privadas bien centralizada.
- Formulario de consulta con campos adecuados, consentimiento y advertencia para no enviar información sensible.
- `llms.txt` con identidad, perfiles, NAP, servicios, exclusiones y política técnica.
- 159 archivos de pruebas y una batería amplia de scripts de verificación.

### Principales brechas y riesgos

- **Riesgo crítico YMYL:** 135 firmas institucionales se tratan como suficientes para indexación.
- **Riesgo crítico de autoría:** el esquema de base de datos tiene autor por defecto `Pineda y Asociados`.
- **Riesgo crítico de indexación local:** nueve páginas débiles aparecen en el catálogo del sitemap sin `noindex`.
- **Riesgo alto de confianza:** mensajes contradictorios sobre primera consulta gratuita, sin costo o dependiente del caso.
- **Riesgo alto de datos estructurados:** `author` y `reviewedBy` pueden ser `Organization`; el `@id` del revisor humano no coincide con el nodo canónico.
- **Riesgo alto de trazabilidad:** propuestas, inventarios y metadata auditada describen estados distintos para algunos artículos.
- **Riesgo medio de activación accidental:** existen testimonios positivos de ejemplo y copy prohibido en defaults editables, aunque no todo se renderiza actualmente.
- **Riesgo medio de sobreenlazado:** 53 de 134 artículos figuran con `ACTION_REQUIRED` en el inventario de enlaces.

### Recomendaciones inmediatas

1. Cambiar el gate público para que **solo `published_lawyer_signed`/`lawyer_verified` con autor humano canónico y hash vigente sea indexable**.
2. Aplicar `noindex, follow`, exclusión de sitemap y exclusión de `llms.txt` a las nueve landings `NOINDEX_UNTIL_UNIQUE`.
3. Migrar el modelo del blog a los campos obligatorios del Plan y eliminar el autor corporativo por defecto.
4. Resolver contractualmente si la evaluación inicial es gratuita; después centralizar una única frase y bloquear variantes mediante tests.
5. Completar la revisión humana de los 40 artículos por lotes y promoverlos solo tras firma, hash y fuentes verificadas.

---

## Alcance, metodología y limitaciones

### Alcance inspeccionado

- **3.453 archivos** extraídos del ZIP.
- **98 archivos `page.tsx`** bajo `app/`.
- **159 archivos de prueba** en `tests/`.
- Configuración Next.js, metadata, robots, sitemap, redirects, schemas, contenido versionado, datos locales, perfiles, blog, formularios, tests, scripts y documentación SEO.
- Inventarios versionados del blog, firmas, landings, enlaces, metadata, FAQ, crawl, claims y Search Console.

### Metodología

1. Extracción segura del ZIP y revisión de estructura.
2. Comparación del código con las secciones y gates del Plan Maestro.
3. Inspección directa de fuentes de verdad, rutas, componentes y contratos.
4. Cruce entre código ejecutable y artefactos CSV/Markdown versionados.
5. Muestreo de diez artículos prioritarios mediante la cola editorial y sus propuestas.
6. Recuento estático de modelos, rutas, pruebas, claims y estados.
7. Intento de instalar dependencias para ejecutar los gates.

### Limitaciones

- **El ZIP no contiene `.git`.** No se pueden verificar independientemente rama, commits, limpieza del árbol o relación con una PR.
- **El blog público depende de PostgreSQL/Neon.** El ZIP no contiene una exportación completa y autoritativa de todos los cuerpos productivos. Los CSV y propuestas son evidencia, pero no sustituyen una lectura de la base canónica.
- **No se auditó Production ni Preview por navegador en esta ejecución.** El informe evalúa el repositorio entregado.
- **No se pudo instalar dependencias.** `npm ci --ignore-scripts --no-audit --no-fund` terminó con código 1 por un `404` del registro interno para `zod-validation-error-4.0.2.tgz`. Por tanto, no se ejecutaron `lint`, `tsc`, Vitest, Playwright ni `next build` en esta auditoría.
- Los resultados de pruebas guardados en `docs/seo/current/` se consideran **evidencia documental versionada**, no una certificación reproducida desde cero.
- Los datos GSC/GA4/Bing presentes en el repositorio no se contrastaron con las cuentas originales.

---

## Tabla de cumplimiento por fases

| Fase | Estado | Cumplimiento orientativo | Gate del Plan | Resultado de auditoría |
|---|---|---:|---|---|
| Fase 0 — Seguridad editorial | ⚠️ Parcial | 65 % | Ningún artículo indexable declara revisión pendiente | Los pending están separados, pero el sistema permite autor corporativo y firma institucional como equivalentes a revisión humana. |
| Fase 1 — Autoridad | ❌ Bloqueada | 45 % | 100 % de artículos indexables con autor humano adecuado | Existen tres perfiles, pero la evidencia registra 135 firmas institucionales y 0 individuales. |
| Fase 2 — Arquitectura | ⚠️ Parcial | 68 % | Una URL dominante por intención prioritaria | Hay mapa de consultas y buena separación de Nacaome, pero nueve landings débiles siguen indexables y en sitemap. |
| Fase 3 — CTR | ⚠️ Parcial avanzada | 78 % | Metadata única y completa en páginas prioritarias | El inventario afirma 134 `KEEP` y 1 `FIXED`; existen snapshots editoriales desactualizados y claims comerciales inconsistentes. |
| Fase 4 — Calidad del blog | ❌ Pendiente de revisión humana | 40 % | Ningún contenido corto se presenta falsamente como guía completa | Hay 40 propuestas completas, todas `lawyer_review_pending`; no deben publicarse aún. |
| Fase 5 — GEO y medición | ⚠️ Parcial | 70 % | `llms`, schema, Search Console, dashboards y revisión periódica | Infraestructura amplia; `llms.txt` no lista artículos verificados ni fecha de generación y el schema editorial no cumple el modelo humano estricto. |

---

# Cumplimiento detallado por secciones del Plan

## 1. Identidad del equipo y autoría

### Hallazgos positivos

- `lib/site.ts` centraliza nombre, dominio, teléfono, email, dirección, horarios y perfiles.
- `LAWYER_PROFILES` contiene exactamente los tres slugs canónicos exigidos.
- `app/(public)/equipo/[slug]/page.tsx` genera únicamente esos tres perfiles mediante `generateStaticParams`.
- Cada perfil contiene H1, cargo, colegiación condicionada, áreas, enfoque, tipos de asuntos, CTA y JSON-LD `ProfilePage`.
- Los números CAH solo se muestran si existe variable confirmada.
- Las páginas de perfil pueden listar artículos escritos y revisados sin inventarlos.

### Incumplimientos críticos

#### 1.1. La marca sigue siendo autor válido

**Evidencia:**

- `lib/db/schema/core.ts:386-427`: `author` tiene default `Pineda y Asociados`.
- `lib/editorial-signature.ts:77-84`: si falta autor, se usa `site.name`.
- `lib/schemas/blog.ts:12-26`: cualquier autor no reconocido se transforma en `Organization`.
- `data/blog/types.ts:1-46`: `author` es un string libre, no un identificador canónico ni una unión cerrada.
- `tests/blog-verify-fix.test.ts` incluye un contrato que asigna `Pineda y Asociados` cuando falta autor.

**Conclusión:** contradice directamente la Definition of Done: “todos los artículos indexables tienen autor individual” y la instrucción “no uses la marca como sustituto del autor”.

#### 1.2. La firma institucional habilita indexación

**Evidencia:**

- `lib/editorial-signature.ts:65-70`: el modo por defecto es `LEGACY_INSTITUTIONAL_MODE` salvo variable explícita.
- `lib/editorial-signature.ts:155-173`: la falta de firma individual se convierte en `firm_historical_review` y `published_firm_reviewed`.
- `lib/editorial-signature.ts:188-198`: tanto `published_firm_reviewed` como `published_lawyer_signed` son indexables.
- `app/sitemap.ts:156-158`: el comentario afirma que la firma individual es opcional.
- `docs/seo/current/editorial-signature-validation.csv`: 135 filas; las 135 usan `signature_type=firm` y `signature_name=Pineda y Asociados`; 135 se consideran indexables y 134 aparecen en sitemap.
- `docs/seo/current/master-implementation-status.md:39-46`: documenta 135 firmas institucionales válidas y 0 individuales activadas.

**Severidad:** crítica.

#### 1.3. Faltan campos obligatorios del modelo editorial

No hay referencias ejecutables a:

- `sourceAsOf` / `source_as_of`.
- `primaryPracticeArea` / `primary_practice_area`.

El modelo tampoco obliga estructuralmente a:

- autor canónico;
- revisor canónico;
- fecha de revisión legal para el estado verificado;
- relación entre área principal y responsable.

### Desviaciones menores de identidad

- `FOUNDER_PROFILE`/`founderSchema` atribuye a Danilo áreas adicionales —familia, laboral, civil/notarial y mercantil— en `knowsAbout`, mientras el perfil canónico del Plan lo concentra en penal.
- Las descripciones de Thania y Emil usan “Especializada/Especializado” en `lib/site.ts` y `/despacho`, lenguaje más fuerte que la formulación prudente del Plan.
- Los IDs `Person` no siguen un patrón uniforme: `#danilo-pineda-maradiaga`, `#thania`, `#emil`.

### Estado

**⚠️ Parcial en perfiles; ❌ incumplido en autoría real del blog.**

---

## 2. Home y páginas principales

### Home

**Cumplimientos:**

- `site.tagline`: `Abogados en Nacaome, Valle | Pineda y Asociados`.
- H1 visible exacto: `Abogados en Nacaome para defensa penal y asesoría jurídica`.
- Sección de entrada por problema.
- Tres tarjetas de equipo enlazadas a perfiles.
- CTA principal y canales de contacto.
- Metodología visible y mensajes de presupuesto por escrito.

**Brechas:**

- La metodología visible utiliza cuatro pasos, no los cinco del Plan; `Propuesta por escrito` no aparece como etapa independiente.
- Los defaults editables de `lib/page-content-db.ts` conservan `Primera consulta sin compromiso`.
- Hay testimonios positivos de ejemplo en defaults, incluido un resultado favorable. Aunque no se rendericen hoy, constituyen un riesgo de activación accidental y no deben vivir en una fuente editable productiva.
- El hero usa contenido administrable. Sin validación de políticas en escritura, un cambio desde Admin puede reintroducir claims prohibidos.

### Página `/despacho`

**Cumplimientos:**

- Presenta equipo, perfiles, colegiación condicional, metodología, asignación de asuntos y presupuesto por escrito.
- No muestra números CAH ficticios.
- Evita promesas de resultados en el contenido principal auditado.

**Brechas:**

- Copy visible usa “Especializada” y “Especializado”.
- El método vuelve a ser de cuatro pasos.
- `lib/page-content-db.ts:484-492` conserva defaults expresamente desaconsejados por el Plan: “Visión de Vanguardia”, “excelencia jurídica” y “solvencia técnica”. Aunque la página pueda sanitizarlos o sustituirlos, la fuente editable sigue siendo peligrosa.

### Página `/servicios-juridicos`

**Cumplimientos:**

- Metadata, H1 e introducción se aproximan estrechamente a la especificación.
- Las tarjetas se organizan por problema/servicio y muestran asignación profesional prudente.
- Existe catálogo central y schema de colección.
- Incluye búsqueda y enlaces específicos.

**Brechas:**

- Debe auditarse que cada área residual tenga responsable confirmado antes de mostrarlo; el Plan prohíbe asignar automáticamente áreas bancarias, tributarias, aduaneras, sanitarias y ambientales.
- La asignación sigue dependiendo de datos distintos en varias fuentes, no de una única matriz editorial usada también por el blog.

### Estado

**⚠️ Parcial avanzado.**

---

## 3. Contenido del blog

### Infraestructura de artículo

La ruta `app/(public)/blog/[categoria]/[slug]/page.tsx` incorpora:

- breadcrumb;
- H1;
- resumen/descripción;
- autor y firma;
- fechas y tiempo de lectura;
- TOC generado en servidor;
- HTML sanitizado;
- headings con IDs estables;
- CTA intermedio;
- etiquetas;
- aviso legal único;
- servicio relacionado;
- caja de autor;
- artículos relacionados;
- navegación anterior/siguiente;
- FAQ schema cuando se detecta contenido compatible;
- BlogPosting JSON-LD.

### Brechas estructurales

- La caja “Sobre el autor” utiliza una descripción genérica del bufete en vez de una bio específica del abogado (`page.tsx:324-361`).
- No muestra `sourceAsOf` porque el campo no existe.
- No muestra de forma explícita `primaryPracticeArea`.
- Puede mostrar “Revisión jurídica institucional”, estado contrario al criterio final del Plan.
- El enlace de autor cae a `/despacho` cuando no reconoce un abogado.
- `openGraph.authors` recibe el string libre de `post.author`.
- La presencia de “Fuentes jurídicas consultadas” depende del cuerpo almacenado, no de un contrato obligatorio.

### Estado real de las 40 propuestas prioritarias

- Existen **40 archivos JSON** en `data/seo/article-editorial-proposals/`.
- Los 40 tienen `legalReviewStatus=lawyer_review_pending`.
- Los 40 snapshots indican autor actual `Pineda y Asociados`.
- Los autores propuestos son: Thania 24, Danilo 8 y Emil 8.
- La separación entre propuesta y versión pública es una medida correcta y debe conservarse.
- Mientras no exista firma humana, hash y aprobación, **no se cumple la Fase 4**.

### Muestra representativa de 10 artículos

| Prioridad | Artículo | Autor propuesto | Revisor propuesto | Estado | Observación |
|---:|---|---|---|---|---|
| 1 | `pension-alimenticia-porcentaje-honduras-2026` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | Tema de cifra exacta; requiere validación jurídica especialmente estricta. |
| 2 | `pension-alimenticia-honduras-guia-completa` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | La metadata auditada parece corregida, pero el snapshot de propuesta conserva versiones distintas. |
| 3 | `divorcio-honduras-guia-completa` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | Propuesta profunda, aún no firmada. |
| 4 | `prescripcion-deudas-plazos-honduras` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | Plazos YMYL; requiere norma y fecha de vigencia. |
| 5 | `poder-legal-honduras-cuando-se-necesita` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | Debe diferenciar poder general/especial y requisitos sin simplificación excesiva. |
| 6 | `danos-perjuicios-indemnizacion-honduras` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | El CSV de metadata refleja título corregido; el JSON de propuesta conserva título/meta anteriores. |
| 7 | `diferencia-denuncia-querella-acusacion-honduras` | Danilo Pineda Maradiaga | Emil Barahona | `lawyer_review_pending` | Asignación coherente con penal; pendiente de firma. |
| 8 | `competencia-desleal-como-denunciar-honduras` | Thania Marlene Paz | Emil Barahona | `lawyer_review_pending` | Requiere revisión mercantil y autoridad competente. |
| 9 | `estafas-fraudes-tipos-penales-honduras` | Danilo Pineda Maradiaga | Emil Barahona | `lawyer_review_pending` | El CSV refleja título del Plan; el snapshot editorial conserva una versión anterior. |
| 10 | `despido-laboral-honduras-guia-completa` | Emil Barahona | Thania Marlene Paz | `lawyer_review_pending` | Inconsistencia grave entre snapshot truncado y auditoría de metadata que afirma título corregido. |

### Inconsistencia entre artefactos

Ejemplo `despido-laboral-honduras-guia-completa`:

- `data/seo/article-editorial-proposals/...json` conserva `Despido Laboral en Honduras: Guia de`.
- `docs/seo/current/blog-metadata-audit.csv` afirma como estado actual `Despido Injustificado en Honduras: Prestaciones y Plazos`.

Esto indica que los artefactos no comparten una fecha/fuente de verdad uniforme. Debe incorporarse a cada archivo:

- `generated_at`;
- `source_environment`;
- `source_commit`;
- `database_snapshot_id`;
- `schema_version`.

### Estado

**❌ Calidad prioritaria aún bloqueada por revisión humana.**

---

## 4. Canibalización y landings locales

### Hallazgos positivos

- Existe `docs/seo/current/query-url-map.csv`.
- La home se trata como URL comercial dominante para Nacaome.
- `/abogados-en-nacaome` se ha orientado a ubicación y operación de la sede.
- `/blog/practica-legal/abogados-en-nacaome` se conserva como intención informativa.
- Los componentes locales declaran que la sede está en Nacaome y usan `Service`, no `LocalBusiness`, para no simular sucursales.
- Hay inventario de 16 municipios con impresiones, clics, decisión y valor local.

### Incumplimiento crítico: decisión documental no aplicada al runtime

El inventario clasifica nueve landings como `NOINDEX_UNTIL_UNIQUE`:

1. Pespire.
2. Marcovia.
3. Namasigüe.
4. Orocuina.
5. Langue.
6. Caridad.
7. Alianza.
8. Concepción de María.
9. San Antonio de Flores.

Pero:

- `data/landings-locales.ts` no tiene un campo de indexabilidad.
- `landingMetadata()` genera metadata normal sin `robots: noindex`.
- Las nueve rutas llaman a `landingMetadata()`.
- `data/seo/canonical-paths.json` incluye las 16 landings como rutas estáticas.
- `app/sitemap.ts` agrega todas las rutas estáticas al sitemap.

**Conclusión:** la documentación dice `noindex`, pero el código dice `indexable + sitemap`. El gate de landings no está cerrado.

### Arquitectura regional

No se localizaron las rutas recomendadas:

- `/cobertura/valle`.
- `/cobertura/choluteca`.

No es obligatorio crear ambas sin datos, pero son una alternativa más segura para consolidar municipios sin contenido propio.

### Riesgo de páginas puerta

Muchas landings reutilizan:

- H1 `Abogados en [ciudad]`;
- estructura idéntica;
- mismos bloques de servicio;
- misma FAQ sobre consulta sin costo;
- misma propuesta de valor con sustitución geográfica.

El bloque local y las instituciones verificadas mitigan el riesgo en 7 páginas, pero no en las 9 clasificadas como débiles.

### Estado

**⚠️ Parcial; existe una contradicción de indexación de severidad crítica.**

---

## 5. FAQ

### Cumplimientos

- Existe página central de FAQ.
- Hay FAQ específicas en servicios, despacho, consulta, guía legal y landings.
- Se genera `FAQPage` en superficies compatibles.
- `docs/seo/current/faq-inventory.csv` contiene 76 filas.
- La arquitectura separa preguntas corporativas de varias preguntas jurídicas.

### Brechas

- La FAQ general y páginas comerciales repiten mensajes sobre consulta gratuita.
- El contenido de honorarios/costo no está centralizado en un contrato único.
- Algunas FAQ de páginas locales son prácticamente idénticas.
- Debe evitarse generar schema FAQ a partir de cualquier pareja pregunta/respuesta sin validar que sea visible, completa y específica de la URL.

### Estado

**⚠️ Parcial avanzado.**

---

## 6. Enlazado interno

### Cumplimientos

- `RelatedService` enlaza el servicio principal.
- Se calculan artículos relacionados por categoría/tags.
- Se normalizan enlaces rotos o de dominios de ejemplo en render.
- Existen auditorías y scripts específicos.
- Los anchors principales son descriptivos.

### Brechas

- `docs/seo/current/internal-link-audit.csv`: 134 artículos auditados.
  - 81 `PASS`.
  - 53 `ACTION_REQUIRED` / `REVIEW_LINKS_AND_SOURCES`.
- La ruta de artículo añade enlaces contextuales automáticos y hasta seis ciudades relacionadas; puede diluir el cluster principal y contradecir la recomendación de no enlazar numerosas ciudades desde cada artículo.
- `RelatedCategories` y navegación anterior/siguiente pueden priorizar proximidad cronológica sobre intención semántica.
- La normalización de enlaces en runtime evita errores visibles, pero no corrige la fuente persistida; la deuda sigue existiendo en la base.

### Estado

**⚠️ Parcial.**

---

## 7. Datos estructurados

### Cumplimientos

- Grafo global con `Organization`, `LegalService` y `WebSite`.
- Perfiles con `ProfilePage` y `Person`.
- Artículos con `BlogPosting`, publisher, fechas, imagen, idioma y `mainEntityOfPage`.
- Breadcrumbs en perfiles, artículos y landings.
- `Service.areaServed` en páginas locales sin fingir una sede.
- Credenciales y `sameAs` son condicionales.

### Incumplimientos y riesgos

#### 7.1. Autor corporativo

`lib/schemas/blog.ts` transforma el autor no reconocido en `Organization`. Esto formaliza en JSON-LD el incumplimiento editorial en vez de bloquearlo.

#### 7.2. Revisor institucional

`reviewedBy` puede ser `Organization`, aunque el Plan exige revisión jurídica humana verificable.

#### 7.3. `@id` del revisor humano desconectado

Los nodos canónicos usan IDs en raíz:

- `/#danilo-pineda-maradiaga`.
- `/#thania`.
- `/#emil`.

Pero `reviewedBy` construye IDs como:

- `/equipo/[slug]#person`.

Esto crea entidades distintas para la misma persona y debilita el grafo.

#### 7.4. Campos de artículo incompletos

No se emiten de forma estructurada:

- `sourceAsOf`.
- área principal canónica.
- relación verificable entre artículo y abogado responsable.
- `citation` construida desde una fuente oficial normalizada.

#### 7.5. `dateModified`

Se toma `updatedAt ?? publishedAt`. Sin una política de escritura que impida cambios automáticos, no se garantiza que represente modificación visible o revisión jurídica real.

### Estado

**⚠️ Parcial; necesita corrección antes de declarar schema válido conforme al Plan.**

---

## 8. GEO y visibilidad en sistemas de IA

### Cumplimientos

- `public/llms.txt` existe.
- Incluye identidad, perfiles, NAP, servicios confirmados, subáreas, categorías, FAQ, disclaimers y exclusiones.
- Excluye del listado principal las landings locales aún en auditoría.
- Los headings del blog tienen IDs estables y el schema incluye `speakable`.
- Hay componentes answer-first y fuentes oficiales en las propuestas editoriales.

### Brechas

- El generador de `llms.txt` no consulta los artículos publicados y verificados; solo lista categorías.
- No incluye fecha de generación visible, requisito del Plan.
- No existe un filtro real por `lawyer_verified` para artículos porque no lista artículos.
- Declara el sitemap como “índice completo”, aunque `/sitemap.xml` es un URL set monolítico y las rutas segmentadas redirigen.
- La afirmación “sitio oficial” es correcta como identidad de marca, pero no debe interpretarse como fuente oficial de la legislación; las páginas deben citar normas y organismos originales.
- El valor de `speakable` no sustituye contenido answer-first ni fuentes jurídicas verificadas.

### Estado

**⚠️ Parcial.**

---

## 9. SEO técnico y sitemap

### Cumplimientos

- Origen canónico estricto: solo `https://www.pinedayasociadoshn.com`.
- HTTPS y `www` quedan centralizados.
- `NEXT_PUBLIC_NOINDEX` controla entornos no productivos.
- Robots bloquea intranet, admin, API, calculadora, preview y rutas privadas.
- Sitemap filtra posts con canonical a otra ruta y orígenes de redirects.
- Existe techo de seguridad para IndexNow.
- Metadata canónica y robots por artículo.

### Brechas

#### 9.1. Sitemap acepta revisión institucional

`app/sitemap.ts:156-158` declara explícitamente que la firma individual es opcional. Es incompatible con el Plan.

#### 9.2. Landings noindex incluidas

Las nueve landings débiles forman parte de `PUBLIC_ROUTES`, por lo que se agregan a `staticRoutes` sin considerar la clasificación editorial.

#### 9.3. Sitemaps segmentados no implementados realmente

Existen rutas:

- `/sitemap-pages.xml`.
- `/sitemap-services.xml`.
- `/sitemap-blog.xml`.
- `/sitemap-authors.xml`.
- `/sitemap-local.xml`.

Pero las cinco devuelven `308` hacia `/sitemap.xml` mediante `legacySitemapRedirectResponse`. No hay sitemap index ni separación operativa.

#### 9.4. Dependencia rígida de un mínimo de artículos

El sitemap falla si encuentra menos de 135 artículos. Es útil para detectar degradación, pero acopla el build a un conteo fijo y puede impedir una retirada legítima, una despublicación jurídica urgente o una consolidación aprobada. El gate debería comparar contra un manifiesto editorial versionado, no contra un número fijo.

### Estado

**⚠️ Parcial.**

---

## 10. Rendimiento y accesibilidad

### Fortalezas de código

- Uso amplio de Server Components.
- Modelos ligeros de listado del blog que omiten el cuerpo.
- `next/image` en imágenes destacadas.
- Sanitización y transformación del HTML en servidor.
- TOC y headings en HTML inicial.
- Labels, ayudas y consentimiento en formularios.
- Uso de `inert`/`aria-hidden` en widgets cuando está abierto el consentimiento.
- Contratos Playwright/axe versionados.
- Configuración de Lighthouse y scripts de rendimiento.

### Riesgos y oportunidades

- La imagen de hero de la home se aplica como background CSS; debe comprobarse su impacto real en LCP y preload.
- Cada artículo carga `getAllPosts()` para navegación, relacionados, sidebar, categorías, archivo y tags. Aunque se use modelo resumen, conviene medir consultas, caché y serialización en producción.
- La imagen principal del artículo usa `priority` universal; debe reservarse para la imagen realmente above-the-fold y evitar descargas innecesarias.
- La transformación automática de tablas, enlaces y CTAs añade complejidad al render; necesita perfiles de CPU y tamaño HTML.
- No se validó contraste real ni navegación por teclado en esta ejecución.
- Debe verificarse `prefers-reduced-motion` en todos los componentes de animación.

### Estado

**⚠️ Evidencia sólida, pero no reproducida en esta auditoría por el fallo de instalación.**

---

## 11. Conversión, confianza y formulario

### Cumplimientos

- Formulario con nombre, teléfono/email, área, localidad, urgencia, descripción y consentimiento.
- Advertencia expresa: no enviar confesiones, contraseñas ni documentos sensibles.
- Explicación de urgencias penales y canales directos.
- Presupuesto por escrito como señal de confianza.
- No se solicitan documentos originales en el primer contacto.

### Riesgo alto: consulta gratuita inconsistente

Se localizaron **31 ocurrencias** relevantes en **12 archivos ejecutables o de datos**, excluyendo documentación y tests, con expresiones como:

- “consulta gratuita”;
- “consulta sin costo”;
- “primera consulta sin costo”;
- “evaluación inicial sin costo”.

Aparecen en:

- `data/landings-locales.ts`;
- `data/faqs-hubs.ts`;
- `components/blog/newsletter-section.tsx`;
- `components/marketing/lead-magnet-cta.tsx`;
- landings de penal, familia y civil;
- página de preguntas frecuentes;
- guía legal;
- CTA generado para artículos.

Algunas páginas, en cambio, indican que el costo depende del caso. El Plan exige una única formulación coherente.

### Riesgo de testimonios de ejemplo

`lib/page-content-db.ts` contiene testimonios con lenguaje de resultado favorable. Aunque estén en defaults o no visibles actualmente, deben eliminarse o sustituirse por placeholders claramente no publicables. Un CMS no debe poder activarlos accidentalmente.

### Estado

**⚠️ Parcial; requiere decisión comercial verificable y centralización.**

---

## 12. Validaciones automáticas

### Fortalezas

- Scripts para metadata, títulos, blog, fechas, citas, enlaces, indexabilidad, canibalización, crawl, perfiles, claims, FAQ, a11y, seguridad y rendimiento.
- Vitest, Playwright, Lighthouse y Knip configurados.
- Gates de sanitización y de integridad de tablas.
- Contratos para perfiles y crawl.

### Brechas de contrato

Los tests actuales protegen una política diferente a la del Plan:

- aceptan `published_firm_reviewed`;
- aceptan revisión institucional;
- permiten autor `Pineda y Asociados` en fixtures y normalización;
- no exigen `sourceAsOf`;
- no exigen `primaryPracticeArea`;
- no cruzan la clasificación `NOINDEX_UNTIL_UNIQUE` con metadata y sitemap;
- no bloquean todas las variantes de “consulta gratuita” si el dato no está confirmado.

### Gate faltante recomendado

Crear un único `seo:master-plan-contract` que falle si:

1. un artículo indexable no tiene `authorId` canónico;
2. el autor visible es la marca;
3. `reviewStatus` no es `lawyer_verified`/`published_lawyer_signed`;
4. falta revisor humano cuando corresponde;
5. el hash no coincide;
6. falta `sourceAsOf` o `primaryPracticeArea`;
7. una landing `NOINDEX_UNTIL_UNIQUE` es indexable o aparece en sitemap/IndexNow;
8. `llms.txt` contiene una URL no verificada;
9. schema usa `Organization` como autor o revisor jurídico;
10. aparece copy gratuito no autorizado.

### Estado

**⚠️ Amplia cobertura técnica, pero los contratos no representan todavía el Plan vinculante.**

---

## Search Console y CTR

### Cumplimientos

- Hay importadores, snapshots, reportes de oportunidades, CTR bajo, canibalización y query-page map.
- No se observa una propuesta de eliminación masiva sin datos.
- El mapa de consulta a URL está versionado.
- El inventario de metadata reporta 135 artículos: 134 `KEEP` y 1 `FIXED`.

### Brechas

- Los datos versionados necesitan identificador de extracción, cuenta/propiedad, rango de fechas y timezone en todas las salidas.
- Los artefactos editoriales y de metadata no comparten necesariamente el mismo snapshot.
- Las optimizaciones deben medirse durante 28 días después de publicación real; las propuestas pendientes no pueden considerarse experimentos ejecutados.
- La URL principal, la landing operativa y el artículo informativo de Nacaome requieren seguimiento conjunto para evitar que la intención vuelva a mezclarse.

### Estado

**⚠️ Preparado para medición, no cerrado como ciclo de mejora.**

---

# Mejoras adicionales detectadas no contempladas expresamente en el Plan

## 1. Manifiesto editorial versionado

Crear `data/seo/editorial-publication-manifest.json` con una fila por URL pública:

- URL;
- canonical;
- indexabilidad;
- autor canónico;
- revisor canónico;
- área principal;
- fecha de firma;
- hash firmado;
- fecha de fuentes;
- estado;
- motivo de noindex;
- versión del esquema.

Sitemap, `llms.txt`, perfiles, blog y tests deben consumir ese manifiesto o una vista generada desde la misma fuente.

## 2. Tipos cerrados y claves foráneas

Sustituir strings libres por:

- `authorId` obligatorio con FK a abogados;
- `reviewerId` con FK;
- enum de estados exacto;
- `primaryPracticeAreaId`;
- `sourceAsOf` obligatorio para contenido indexable;
- constraint que impida `published=true` si falta firma válida.

## 3. Política de contenido administrable

Todo texto editable desde Admin debe pasar validadores de claims:

- sin promesas;
- sin “mejor”, “líder”, “éxito”;
- sin consulta gratuita salvo flag comercial confirmado;
- sin universidades/credenciales no autorizadas;
- sin testimonios de ejemplo;
- sin números CAH placeholders.

## 4. Versionado de artefactos de auditoría

Todos los CSV/JSON generados deben incluir metadata común para evitar snapshots contradictorios.

## 5. Retirada jurídica de emergencia

El sitemap no debe exigir un mínimo fijo de 135 si una URL necesita retirada urgente. Usar un manifiesto aprobado con diferencia esperada y motivo.

## 6. Observabilidad editorial

Dashboard con:

- artículos indexables por estado;
- firmas caducadas por cambio de hash;
- fuentes vencidas;
- landings noindex;
- discrepancias sitemap/robots/canonical;
- URLs presentes en `llms.txt` pero no en sitemap;
- artículos sin enlaces de cluster;
- claims comerciales pendientes de confirmar.

---

# Riesgos pendientes

| Riesgo | Severidad | Probabilidad | Impacto | Evidencia principal |
|---|---|---|---|---|
| Marca usada como autor de artículos jurídicos | Crítica | Alta | Muy alto | Default DB, fallback runtime, schema Organization. |
| Firma institucional tratada como revisión suficiente | Crítica | Alta | Muy alto | 135 firmas institucionales, 0 individuales. |
| Nueve landings débiles indexables y en sitemap | Crítica | Alta | Alto | Inventario `NOINDEX_UNTIL_UNIQUE` vs código. |
| Claims de consulta gratuita no confirmados/coherentes | Alta | Alta | Alto | 33 ocurrencias en 13 archivos. |
| Modelo sin `sourceAsOf` y área principal | Alta | Alta | Alto | Cero referencias ejecutables. |
| 40 artículos prioritarios sin firma humana | Alta | Alta | Alto | Toda la cola en `lawyer_review_pending`. |
| IDs duplicados de personas en schema | Alta | Media | Medio/alto | Nodo raíz frente a `/equipo/...#person`. |
| Artefactos con snapshots contradictorios | Alta | Alta | Alto | Propuestas vs metadata auditada. |
| Sitemaps segmentados son solo redirects | Media | Alta | Medio | Cinco rutas devuelven 308. |
| Copy prohibido/testimonios en defaults editables | Media | Media | Alto si se activa | `lib/page-content-db.ts`. |
| 53 artículos con enlaces por revisar | Media | Alta | Medio | `internal-link-audit.csv`. |
| Build/tests no reproducidos desde este ZIP | Media | Alta en esta auditoría | Medio | Error 404 del registry. |

---

# Recomendaciones priorizadas

| Prioridad | Acción | Esfuerzo estimado | Responsable recomendado | Gate de cierre |
|---|---|---:|---|---|
| Crítica | Hacer que solo una firma individual válida habilite indexación | 2–4 días | Desarrollo + abogado responsable | 0 artículos corporativos indexables; 100 % con autor humano. |
| Crítica | Migrar esquema editorial: autor, revisor, área, `sourceAsOf`, hash y estado | 3–6 días | Desarrollo/DB | Constraints y tests bloquean publicación incompleta. |
| Crítica | Aplicar noindex y exclusión de sitemap/IndexNow a nueve landings | 1 día | Desarrollo SEO | Crawl contract compara clasificación con runtime. |
| Alta | Confirmar política de costo y centralizar copy | 0,5–1 día + decisión humana | Dirección + marketing + legal | Una única frase autorizada; 0 variantes prohibidas. |
| Alta | Corregir JSON-LD de autor/revisor y unificar `@id` | 1–2 días | Desarrollo SEO | Un único nodo Person por abogado; Organization nunca como autor jurídico. |
| Alta | Firmar y publicar los 40 artículos por lotes | Variable: 5 lotes | Abogados + editor | Cada artículo: fuentes, fecha, autor, revisor, hash y estado verificado. |
| Alta | Reconciliar artefactos y añadir metadata de snapshot | 1–2 días | Desarrollo/SEO | Todos los informes proceden del mismo snapshot. |
| Media | Reemplazar sitemap monolítico por sitemap index real | 1–2 días | Desarrollo SEO | Segmentos 200 XML, no redirects. |
| Media | Reescribir caja de autor con datos del perfil | 0,5–1 día | Desarrollo/contenido | Bio específica y enlace al perfil. |
| Media | Resolver 53 artículos con enlaces incompletos | 2–4 días | SEO/contenido | 100 % con servicio + cluster seguro + fuentes. |
| Media | Eliminar testimonios y copy prohibido de defaults | 0,5 día | Desarrollo/contenido | Ningún placeholder publicable por accidente. |
| Media | Optimizar `llms.txt` desde manifiesto editorial | 1–2 días | Desarrollo SEO/GEO | Fecha de generación y solo URLs verificadas. |
| Baja | Medir LCP/CLS/INP en Preview y Production | 1 día inicial | Frontend/SEO | Lighthouse + RUM con presupuesto definido. |

---

# Plan correctivo concentrado

## Bloque 1 — Cierre editorial y autoridad

1. Migración de modelo y constraints.
2. Autor humano obligatorio.
3. Firma individual obligatoria para indexación.
4. Schema con IDs canónicos.
5. Perfiles y cajas de autor conectados a la misma fuente.
6. Gate maestro de autoría/revisión.

**Resultado esperado:** el blog deja de depender de revisión institucional como sustituto de un abogado.

## Bloque 2 — Indexación, arquitectura local y claims

1. Campo `indexability` en landings.
2. Noindex/sitemap/IndexNow coherentes.
3. Consolidación regional o enriquecimiento de las nueve landings.
4. Decisión y centralización de consulta gratuita.
5. Limpieza de defaults y testimonios.
6. Sitemap index real.

**Resultado esperado:** una intención, una URL dominante y ninguna página débil enviada a buscadores.

## Bloque 3 — Calidad del blog, GEO y cierre

1. Revisión humana de 40 propuestas por cinco lotes.
2. Fuentes oficiales y `sourceAsOf`.
3. Enlaces de cluster pendientes.
4. `llms.txt` generado desde manifiesto.
5. Ejecución completa de tests, build, schema, sitemap, crawl y navegador.
6. Informe final único con snapshot y evidencias reproducibles.

**Resultado esperado:** Plan Maestro cerrado sin publicar contenido no firmado.

---

# Anexo técnico

## A. Inventario observado

| Métrica | Valor |
|---|---:|
| Archivos del repositorio | 3.453 |
| Páginas Next.js (`page.tsx`) | 98 |
| Archivos de tests | 159 |
| Perfiles canónicos | 3 |
| Artículos en validación de firmas | 135 |
| Firmas institucionales | 135 |
| Firmas individuales activadas | 0 |
| Artículos en cola de revisión | 40 |
| Landings municipales auditadas | 16 |
| Landings `NOINDEX_UNTIL_UNIQUE` | 9 |
| Artículos en auditoría de enlaces | 134 |
| Enlaces `PASS` | 81 |
| Enlaces `ACTION_REQUIRED` | 53 |
| FAQ inventariadas | 76 |
| Ocurrencias de copy gratuito | 31 en 12 archivos |

## B. Evidencias clave por archivo

| Archivo | Líneas/área | Evidencia |
|---|---|---|
| `PLAN_MAESTRO...md` | 1455–1546 | Gates y Definition of Done. |
| `lib/editorial-signature.ts` | 65–70 | Legacy institucional por defecto. |
| `lib/editorial-signature.ts` | 77–84 | Autor fallback a la marca. |
| `lib/editorial-signature.ts` | 155–173 | Firma institucional válida. |
| `lib/editorial-signature.ts` | 188–198 | Firma institucional habilita indexación. |
| `lib/db/schema/core.ts` | 386–427 | Default corporativo y modelo editorial incompleto. |
| `data/blog/types.ts` | 1–46 | Sin `sourceAsOf` ni área principal. |
| `lib/schemas/blog.ts` | 6–40 | Organization como autor/revisor y `@id` alternativo. |
| `app/sitemap.ts` | 133–170 | Agrega rutas estáticas y acepta firma institucional. |
| `data/seo/canonical-paths.json` | 80–150+ | Incluye todas las landings locales. |
| `data/landings-locales.ts` | 914–946 | Metadata sin indexabilidad. |
| `docs/seo/current/local-landing-classification.csv` | 16 filas | Nueve decisiones `NOINDEX_UNTIL_UNIQUE`. |
| `docs/seo/current/editorial-signature-validation.csv` | 135 filas | 135 firmas `firm`; 0 individuales. |
| `docs/seo/current/lawyer-review-queue.csv` | 40 filas | Toda la cola en `lawyer_review_pending`. |
| `docs/seo/current/internal-link-audit.csv` | 134 filas | 53 pendientes. |
| `scripts/generate-llms-txt.mjs` | 225–354 | Perfiles y servicios, sin artículos verificados ni fecha. |
| `lib/page-content-db.ts` | 407–415, 484–492 | Testimonios y copy prohibido en defaults. |

## C. Resultado del intento de validación ejecutable

```text
Comando: npm ci --ignore-scripts --no-audit --no-fund
Node: v22.16.0
npm runtime: 10.9.2
packageManager declarado: npm@12.0.1
Resultado: FAIL, exit code 1
Causa: 404 al descargar zod-validation-error-4.0.2.tgz desde el registry interno.
```

Consecuencia: no se certifican en esta ejecución `lint`, `typecheck`, tests, E2E, Lighthouse ni build. Deben ejecutarse en un entorno con acceso funcional al registro y a la rama Neon de staging.

## D. Checklist de cierre obligatorio

- [ ] Autor corporativo eliminado del modelo y datos indexables.
- [ ] Firma institucional deja de habilitar indexación.
- [ ] 100 % de artículos indexables con autor individual.
- [ ] `sourceAsOf` y `primaryPracticeArea` obligatorios.
- [ ] Revisor humano y hash vigente.
- [ ] Nueve landings débiles con noindex real y fuera de sitemap/IndexNow.
- [ ] Política de consulta gratuita confirmada y centralizada.
- [ ] JSON-LD con IDs de persona únicos.
- [ ] 40 propuestas firmadas o mantenidas fuera de publicación.
- [ ] 53 artículos con enlazado revisado.
- [ ] `llms.txt` con fecha y URLs verificadas.
- [ ] Sitemap index real o justificación documentada para no separarlo.
- [ ] Defaults editables sin claims/testimonios no autorizados.
- [ ] `npm ci`, lint, typecheck, unit, E2E y build verdes.
- [ ] Validación de schema y crawl sobre Preview.
- [ ] Revisión manual del despacho antes de Production.

---

# Conclusión final

El repositorio no es una implementación fallida: contiene una base técnica considerable, controles de seguridad editorial, inventarios, perfiles, schemas, pruebas y una arquitectura más madura que la de un sitio jurídico promedio. El problema es que la implementación ha cerrado técnicamente una política editorial distinta de la establecida por el Plan Maestro.

La diferencia central es inequívoca:

> El código considera suficiente una revisión institucional histórica; el Plan exige un abogado responsable, autor individual y revisión verificable.

Mientras esa diferencia permanezca, no puede declararse completada la Fase 1 ni la Definition of Done. Tampoco deben considerarse cerradas la arquitectura local —por las nueve landings indexables— ni la calidad del blog —por las 40 propuestas pendientes—.

**Veredicto operativo:** mantener Production sin cambios derivados de estas propuestas, corregir primero los gates editoriales e indexación local, completar la revisión humana y solo después ejecutar una validación reproducible de build, sitemap, schema, crawl y navegador.


---
title: "Plan maestro de mejora SEO, GEO, contenido, autoridad y CTR"
project: "Pineda y Asociados / Justicia Verdadera"
site: "https://www.pinedayasociadoshn.com/"
date: "2026-07-28"
status: "ready_for_implementation"
owner: "Pineda y Asociados"
scope:
  - web_publica
  - paginas_de_servicio
  - equipo
  - blog
  - landings_locales
  - enlazado_interno
  - datos_estructurados
  - seo_tecnico
  - geo
  - conversion
---

# Plan maestro de mejora SEO, GEO, contenido, autoridad y CTR

## 0. Mandato de implementación

Este documento es una **especificación ejecutable** para una IA con acceso al repositorio de Pineda y Asociados. No debe interpretarse como una lluvia de ideas ni como una auditoría meramente descriptiva.

La IA implementadora debe:

1. inspeccionar el estado actual del repositorio;
2. comparar cada instrucción con lo ya implementado;
3. conservar todo cambio correcto existente;
4. aplicar únicamente las mejoras pendientes;
5. no inventar datos profesionales, números de colegiación, formación académica, casos ganados, porcentajes de éxito, premios, sedes, empleados o especialidades no verificadas;
6. crear tests y validaciones;
7. entregar un informe archivo por archivo;
8. no desplegar en producción ni modificar datos productivos sin autorización expresa.

El objetivo no es publicar más contenido indiscriminadamente. El objetivo es:

- consolidar las URLs que compiten entre sí;
- aumentar la confianza jurídica;
- mejorar la correspondencia entre consulta, título, snippet y contenido;
- mejorar la indexación de las páginas realmente valiosas;
- aumentar el CTR de las URLs que ya reciben impresiones;
- convertir cada página en la mejor respuesta posible para una intención concreta;
- reforzar la entidad del despacho y de sus abogados;
- reducir contenido repetitivo, genérico o pendiente de revisión;
- crear una arquitectura mantenible para SEO y GEO.

---

# 1. Situación actual y diagnóstico

La web tiene una base sólida:

- sede y señales locales claras en Nacaome, Valle;
- teléfono, WhatsApp, dirección y horario visibles;
- páginas de servicios jurídicos;
- páginas locales;
- blog jurídico amplio;
- más de 15 años de experiencia declarada por el despacho;
- tres abogados colegiados y con experiencia;
- contenido sobre derecho penal, familia, laboral, civil, mercantil, administrativo y otras materias;
- llamadas a la acción y navegación hacia servicios relacionados.

Sin embargo, existen problemas que limitan la indexación, la autoridad y los clics:

## 1.1. Autoría genérica

Muchos artículos muestran como autor a:

> Pineda y Asociados

Esto desaprovecha la experiencia real de los abogados y dificulta que el usuario y los buscadores identifiquen quién responde jurídicamente por el contenido.

## 1.2. Artículos publicados con revisión pendiente

Algunos artículos indexables muestran avisos como:

> Está pendiente de revisión jurídica individual por un abogado colegiado.

o:

> Este contenido contiene cuestiones pendientes de revisión jurídica adicional.

Una página YMYL jurídica no debe competir en Google afirmando al mismo tiempo que aún no está jurídicamente validada.

## 1.3. Títulos cortados, incompletos o poco orientados al clic

Ejemplos observados:

- `Abogados en Nacaome, Valle: 15 Años de`
- `Despido Laboral en Honduras: Guia de`
- `Derechos ARCO en Honduras: Guía Completa de`
- `Daños y Perjuicios en Honduras: Demanda e Indemniz en Hondur`
- `Herencias en Honduras: Guía Paso a Paso de…`

Estos títulos pueden provocar reescrituras de Google, reducir claridad y disminuir el CTR.

## 1.4. Canibalización local

La consulta `abogados en Nacaome` puede ser atacada simultáneamente por:

- la home;
- `/abogados-en-nacaome`;
- `/blog/practica-legal/abogados-en-nacaome`.

Debe existir una URL dominante para cada intención.

## 1.5. Landings municipales muy similares

Las páginas de Goascorán, El Triunfo y otros municipios comparten estructuras y propuestas de valor muy parecidas. Si el contenido puede producirse sustituyendo únicamente el nombre de la localidad, existe riesgo de baja calidad y de páginas puerta.

## 1.6. Exceso de contenido genérico de tres minutos para asuntos jurídicos complejos

Un artículo corto no es automáticamente malo. El problema aparece cuando promete una guía completa sobre una cuestión compleja y no cubre:

- excepciones;
- documentos;
- procedimiento;
- autoridad competente;
- plazos;
- riesgos;
- casos en los que no aplica;
- fuentes oficiales;
- fecha de revisión;
- responsable jurídico.

## 1.7. Señales profesionales incompletas

La identidad canónica del equipo está definida, pero la web debe hacer más visible:

- nombre completo;
- cargo;
- áreas reales de práctica;
- colegiación en Honduras;
- experiencia profesional;
- artículos escritos o revisados;
- página individual de autor.

No se publicará el número CAH hasta disponer del dato real y autorización para mostrarlo.

---

# 2. Fuente única de identidad del equipo

La implementación debe mantener una única fuente de verdad, preferentemente en `lib/site.ts` o en una estructura equivalente centralizada.

## 2.1. Identidades canónicas

### Danilo Pineda Maradiaga

**Nombre obligatorio:** `Danilo Pineda Maradiaga`

**Cargo público recomendado:**

> Abogado penalista · Socio director

**Áreas verificadas:**

- derecho penal;
- proceso penal;
- defensa de personas detenidas, investigadas o acusadas;
- ejecución penal;
- recursos penales.

**Texto público recomendado:**

> Danilo Pineda Maradiaga es abogado penalista, socio director de Pineda y Asociados y abogado colegiado en Honduras. Su práctica se concentra en la defensa penal, la asistencia desde las primeras diligencias, las audiencias, los recursos y la ejecución de la pena. Atiende asuntos en Nacaome y en la zona sur de Honduras con un enfoque técnico, prudente y basado en el análisis individual de cada expediente.

No afirmar años individuales de ejercicio, universidad, número CAH, porcentaje de éxito ni casos concretos sin evidencia.

### Thania Marlene Paz

**Nombre obligatorio:** `Thania Marlene Paz`

**Cargo público recomendado:**

> Abogada · Socia fundadora

**Áreas verificadas:**

- derecho de familia;
- derecho administrativo;
- derecho civil y notarial;
- derecho mercantil y empresarial.

**Texto público recomendado:**

> Thania Marlene Paz es abogada, socia fundadora de Pineda y Asociados y abogada colegiada en Honduras. Su práctica comprende derecho de familia, derecho administrativo, asuntos civiles y notariales y asesoría mercantil. Interviene en procedimientos que requieren coordinación documental, negociación, prevención de riesgos y representación ante autoridades administrativas o judiciales.

### Emil Barahona

**Nombre obligatorio:** `Emil Barahona`

**Cargo público recomendado:**

> Abogado · Socio del bufete

**Áreas verificadas:**

- derecho laboral;
- derecho penal;
- derecho civil y notarial.

**Texto público recomendado:**

> Emil Barahona es abogado, socio de Pineda y Asociados y abogado colegiado en Honduras. Su práctica se centra en derecho laboral, asuntos civiles y notariales y apoyo en materia penal. Asesora a trabajadores, particulares y empresas mediante el análisis de documentos, la preparación de reclamaciones y la representación en procedimientos de negociación o litigio.

## 2.2. Variantes prohibidas

No utilizar:

- `Danilo Pineda` como identidad principal;
- `Thania Pineda`;
- `Emil Hernández`;
- nombres inventados;
- iniciales como autor principal;
- `Pineda y Asociados` como autor humano de artículos jurídicos.

La marca puede aparecer como editorial o publisher, pero no debe sustituir al abogado responsable.

---

# 3. Matriz obligatoria de autoría y revisión

Cada artículo debe tener:

- `author`: abogado que domina el área;
- `reviewedBy`: segundo abogado cuando el tema sea sensible o transversal;
- `legalReviewStatus`;
- `legalReviewedAt`;
- `sourceAsOf`;
- `primaryPracticeArea`;
- `publisher`: Pineda y Asociados.

## 3.1. Asignación principal

| Área o categoría | Autor principal | Revisor secundario recomendado |
|---|---|---|
| Derecho penal | Danilo Pineda Maradiaga | Emil Barahona |
| Detenciones, allanamientos, medidas cautelares, juicio, recursos, ejecución penal | Danilo Pineda Maradiaga | Emil Barahona |
| Derecho laboral | Emil Barahona | Thania Marlene Paz |
| Despidos, prestaciones, jornadas, maternidad, acoso laboral | Emil Barahona | Thania Marlene Paz |
| Derecho de familia | Thania Marlene Paz | Emil Barahona cuando haya implicaciones laborales o patrimoniales |
| Divorcio, custodia, alimentos, unión de hecho, violencia intrafamiliar | Thania Marlene Paz | Danilo Pineda Maradiaga cuando exista componente penal |
| Derecho civil | Thania Marlene Paz | Emil Barahona |
| Arrendamientos, contratos, daños, herencias, propiedad | Thania Marlene Paz | Emil Barahona |
| Servicios notariales | Thania Marlene Paz | Emil Barahona |
| Derecho mercantil y empresarial | Thania Marlene Paz | Emil Barahona cuando exista componente laboral |
| Sociedades, contratos mercantiles, franquicias | Thania Marlene Paz | Emil Barahona |
| Derecho administrativo y servicio civil | Thania Marlene Paz | Emil Barahona cuando el asunto sea laboral |
| Conciliación y arbitraje familiar | Thania Marlene Paz | — |
| Conciliación y arbitraje mercantil | Thania Marlene Paz | Emil Barahona |
| Propiedad intelectual | Thania Marlene Paz, por vinculación mercantil | Segundo revisor designado en configuración |
| Extranjería y gestiones Honduras–España | Thania Marlene Paz, por componente administrativo/civil | Segundo revisor designado en configuración |
| Derecho bancario, tributario, aduanero, sanitario y ambiental | No publicar una nueva firma automática sin confirmar el responsable interno | Mantener el artículo en revisión hasta asignación explícita |

Para las áreas de la última fila, la IA debe buscar una asignación ya existente en el repositorio. Si no existe, debe crear una lista `REQUIERE_ASIGNACION_HUMANA` y no inventarla.

## 3.2. Estado editorial

Valores permitidos:

```ts
type LegalReviewStatus =
  | "draft"
  | "documentary_review"
  | "lawyer_review_pending"
  | "lawyer_verified"
  | "outdated"
  | "withdrawn";
```

Reglas:

- `lawyer_verified`: indexable, puede entrar al sitemap.
- `lawyer_review_pending`: `noindex, follow`, fuera del sitemap y fuera de módulos destacados.
- `outdated`: `noindex, follow` hasta actualización.
- `draft`: no accesible públicamente.
- `withdrawn`: 410 o redirección, según equivalencia.
- Una IA, modelo o proveedor nunca puede figurar como revisor jurídico.
- La fecha `dateModified` solo cambia si el contenido visible o su revisión jurídica cambia de verdad.

---

# 4. Páginas individuales de abogados

Crear:

```text
/equipo/danilo-pineda-maradiaga
/equipo/thania-marlene-paz
/equipo/emil-barahona
```

## 4.1. Plantilla obligatoria

Cada perfil debe contener:

1. nombre completo;
2. cargo;
3. declaración `Abogado/a colegiado/a en Honduras`;
4. áreas verificadas;
5. explicación de su enfoque;
6. tipos de asuntos que atiende;
7. artículos escritos;
8. artículos revisados;
9. enlace al despacho;
10. CTA de consulta;
11. aviso de que la información no garantiza resultados;
12. `ProfilePage` + `Person` JSON-LD.

## 4.2. Títulos y metadescripciones

### Danilo

**Title:**

> Danilo Pineda Maradiaga | Abogado Penalista en Honduras

**Meta description:**

> Perfil de Danilo Pineda Maradiaga, abogado penalista, socio director de Pineda y Asociados y abogado colegiado en Honduras. Defensa penal en Nacaome y la zona sur.

**H1:**

> Danilo Pineda Maradiaga, abogado penalista

### Thania

**Title:**

> Thania Marlene Paz | Abogada de Familia, Civil y Mercantil

**Meta description:**

> Perfil de Thania Marlene Paz, socia fundadora y abogada colegiada en Honduras. Derecho de familia, administrativo, civil, notarial y mercantil.

**H1:**

> Thania Marlene Paz, abogada de familia, civil y mercantil

### Emil

**Title:**

> Emil Barahona | Abogado Laboral, Civil y Penal

**Meta description:**

> Perfil de Emil Barahona, socio de Pineda y Asociados y abogado colegiado en Honduras. Derecho laboral, civil, notarial y apoyo en materia penal.

**H1:**

> Emil Barahona, abogado laboral, civil y penal

---

# 5. Reescritura de la home

URL:

```text
/
```

La home será la URL dominante para:

- abogados en Nacaome;
- bufete de abogados en Nacaome;
- Pineda y Asociados;
- abogados en Valle;
- despacho jurídico en Nacaome.

## 5.1. Metadata definitiva

**Title:**

> Abogados en Nacaome, Valle | Pineda y Asociados

**Meta description:**

> Abogados colegiados en Nacaome para defensa penal, familia, asuntos laborales, civiles y mercantiles. Atención directa, consulta confidencial y presupuesto por escrito.

**H1:**

> Abogados en Nacaome para defensa penal y asesoría jurídica

## 5.2. Hero definitivo

**Eyebrow:**

> Bufete jurídico en Nacaome, Valle

**Texto:**

> Pineda y Asociados reúne abogados colegiados y con experiencia en derecho penal, familia, laboral, civil, notarial, mercantil y administrativo. Atendemos cada asunto con comunicación clara, análisis jurídico individual y presencia activa en los juzgados y autoridades de la zona sur de Honduras.

**CTA principal:**

> Solicitar evaluación confidencial

**CTA secundario:**

> Llamar al +504 9536-3724

**Apoyos de confianza:**

- Atención directa con abogado.
- Presupuesto por escrito antes de iniciar.
- Información protegida por el secreto profesional.
- No prometemos resultados; explicamos opciones y riesgos.

Sustituir `Primera consulta sin compromiso` y `Consulta inicial sin costo` por una única formulación coherente. Si la consulta es realmente gratuita, usar en todas las páginas:

> Evaluación inicial confidencial sin costo

Si no está confirmado que siempre sea gratuita, usar:

> Evaluación inicial confidencial

## 5.3. Sección “Empiece por su problema”

Mantener el enfoque por problema, con estos textos:

- **Me han detenido, denunciado o citado**  
  Defensa penal desde la primera actuación, revisión de la detención, audiencias, medidas cautelares y recursos.

- **Necesito ayuda con divorcio, custodia o alimentos**  
  Orientación en derecho de familia, negociación, medidas urgentes y representación judicial.

- **Tengo un despido o conflicto laboral**  
  Revisión de prestaciones, documentos, plazos, conciliación y reclamación laboral.

- **Necesito revisar una propiedad, contrato o herencia**  
  Asesoría civil y notarial para prevenir conflictos y formalizar actos jurídicos.

- **Vivo fuera de Honduras y necesito una gestión**  
  Coordinación de poderes, documentos, herencias y trámites sujetos al derecho hondureño.

- **No sé qué tipo de abogado necesito**  
  Cuéntenos brevemente la situación y determinaremos el área adecuada antes de contratar.

## 5.4. Sección de equipo

**H2:**

> El abogado responsable depende del área de su caso

**Introducción:**

> Los artículos, servicios y consultas no deben presentarse como trabajo de una marca impersonal. Cada área cuenta con un abogado responsable y, cuando el asunto es transversal, con revisión de un segundo profesional.

Mostrar tres tarjetas con los textos definidos en la sección 2.

## 5.5. Sección de metodología

**H2:**

> Cómo trabajamos su caso

1. **Evaluación inicial**  
   Escuchamos los hechos, identificamos la urgencia y revisamos la documentación disponible.

2. **Diagnóstico jurídico**  
   Explicamos la normativa, las opciones reales, los riesgos y los plazos.

3. **Propuesta por escrito**  
   Definimos alcance, honorarios y actuaciones antes de iniciar.

4. **Gestión y seguimiento**  
   Documentamos las actuaciones y mantenemos informado al cliente.

5. **Cierre**  
   Entregamos un resumen del resultado y de los pasos posteriores cuando sean necesarios.

## 5.6. Eliminaciones

Eliminar de la home:

- frases genéricas repetidas sin evidencia;
- más de un bloque que repita la misma CTA;
- listados de 14 áreas en el footer si ya existe una página central de servicios;
- texto excesivo de ciudades;
- artículos locales que compitan con la home;
- claims como `mejor abogado`, `éxito garantizado`, `especialistas líderes` o similares.

---

# 6. Página del despacho

URL:

```text
/despacho
```

## 6.1. Metadata

**Title:**

> Bufete de Abogados en Nacaome | Nuestro Equipo

**Meta description:**

> Conozca a los abogados colegiados de Pineda y Asociados, sus áreas de práctica y la metodología de atención del bufete en Nacaome y la zona sur de Honduras.

**H1:**

> Bufete de abogados en Nacaome con experiencia en distintas áreas del derecho

## 6.2. Introducción definitiva

> Pineda y Asociados es un bufete jurídico con sede en Nacaome, Valle. El despacho atiende asuntos penales, familiares, laborales, civiles, notariales, mercantiles y administrativos mediante un equipo de abogados colegiados en Honduras. Cada caso se asigna según el área de práctica del abogado responsable y se gestiona con confidencialidad, trazabilidad documental y comunicación directa.

## 6.3. Bloque de colegiación

Mostrar:

> Todos los abogados del equipo están colegiados en Honduras.

No mostrar números CAH ficticios ni placeholders visibles. El número solo se renderizará si existe una variable confirmada y autorizada.

## 6.4. Historia del despacho

Usar:

> El despacho cuenta con más de 15 años de experiencia profesional declarada en la zona sur de Honduras. Antes de publicar un año exacto de fundación o una fecha individual de colegiación, esos datos deberán verificarse documentalmente.

No publicar `fundado en 2010` hasta confirmación.

## 6.5. Evitar

- “visión de vanguardia” como H1;
- “excelencia”, “solvencia”, “liderazgo” o “alto nivel” sin evidencia;
- nombres inconsistentes;
- bios diferentes entre HTML y JSON-LD;
- cargos contradictorios;
- universidades no verificadas.

---

# 7. Página central de servicios

URL:

```text
/servicios-juridicos
```

## 7.1. Metadata

**Title:**

> Servicios Jurídicos en Nacaome | Áreas de Práctica

**Meta description:**

> Defensa penal y asesoría en familia, laboral, civil, notarial, mercantil y administrativo. Identifique el área adecuada y consulte con un abogado colegiado.

**H1:**

> Servicios jurídicos para personas, familias y empresas

## 7.2. Introducción

> No es necesario que conozca el nombre técnico de su problema. Las áreas de práctica están organizadas para ayudarle a identificar el servicio adecuado, el abogado responsable y los documentos que conviene preparar antes de una consulta.

## 7.3. Cada tarjeta debe mostrar

- problema del usuario;
- actuaciones principales;
- abogado responsable;
- enlace con anchor específico;
- no más de 35–45 palabras.

Ejemplo:

**Derecho penal**

> Defensa desde una detención, citación o denuncia hasta el juicio, los recursos y la ejecución penal. Área dirigida por Danilo Pineda Maradiaga, con apoyo de Emil Barahona.

CTA:

> Ver servicios de defensa penal

---

# 8. Metadata y copy por área

## 8.1. Derecho penal

**Title:**

> Abogado Penalista en Nacaome | Defensa Penal

**Meta:**

> Defensa penal ante detenciones, denuncias, audiencias, medidas cautelares, juicio, recursos y ejecución de pena. Atención directa de abogado penalista.

**H1:**

> Defensa penal en Nacaome y la zona sur de Honduras

**Autoridad visible:**

> Área dirigida por Danilo Pineda Maradiaga, abogado penalista y socio director.

**Primer párrafo:**

> Una detención, una citación o una investigación penal requiere actuación inmediata y una estrategia basada en el expediente. El despacho interviene desde las primeras diligencias, revisa la legalidad de las actuaciones, prepara audiencias y recursos y mantiene al cliente informado sobre los riesgos y las opciones de defensa.

## 8.2. Derecho de familia

**Title:**

> Abogada de Familia en Nacaome | Divorcio y Custodia

**Meta:**

> Asesoría en divorcio, custodia, pensión alimenticia, régimen de visitas, unión de hecho y violencia intrafamiliar. Atención confidencial en Nacaome.

**H1:**

> Derecho de familia: soluciones legales para proteger a su familia

**Autoridad visible:**

> Área dirigida por Thania Marlene Paz, abogada y socia fundadora.

**Primer párrafo:**

> Los conflictos familiares requieren una respuesta jurídica firme y, al mismo tiempo, prudente. Analizamos la urgencia, la situación de los menores, los documentos disponibles y las posibilidades de acuerdo antes de definir la vía judicial adecuada.

## 8.3. Derecho laboral

**Title:**

> Abogado Laboral en Nacaome | Despidos y Prestaciones

**Meta:**

> Revisión de despidos, prestaciones, salarios, jornadas, acoso laboral y conflictos de empresa. Consulte plazos y documentos con un abogado laboral.

**H1:**

> Asesoría laboral para trabajadores y empresas

**Autoridad visible:**

> Área dirigida por Emil Barahona, abogado con práctica en derecho laboral.

**Primer párrafo:**

> Un conflicto laboral puede depender de plazos breves y de documentos que deben preservarse desde el primer día. Revisamos contratos, pagos, comunicaciones, horarios y causas de terminación para definir si procede una negociación, una conciliación o una reclamación judicial.

## 8.4. Derecho civil y notarial

**Title:**

> Abogados Civiles en Nacaome | Contratos y Herencias

**Meta:**

> Contratos, arrendamientos, propiedades, herencias, daños, cobros y gestiones notariales en Honduras. Revisión jurídica antes de firmar o reclamar.

**H1:**

> Derecho civil y servicios notariales

**Autoridad visible:**

> Área dirigida por Thania Marlene Paz, con apoyo de Emil Barahona.

## 8.5. Mercantil

**Title:**

> Abogada Mercantil en Honduras | Empresas y Contratos

**Meta:**

> Constitución de sociedades, contratos, franquicias, gobierno corporativo, cobros y prevención de conflictos empresariales en Honduras.

**H1:**

> Derecho mercantil y asesoría para empresas

**Autoridad visible:**

> Área dirigida por Thania Marlene Paz.

## 8.6. Administrativo

**Title:**

> Abogada Administrativa en Honduras | Recursos y Sanciones

**Meta:**

> Defensa en procedimientos administrativos, sanciones, recursos, licitaciones y asuntos de servicio civil ante autoridades de Honduras.

**H1:**

> Derecho administrativo y defensa ante autoridades públicas

**Autoridad visible:**

> Área dirigida por Thania Marlene Paz.

## 8.7. Resto de áreas

Usar títulos concisos:

| Área | Title propuesto |
|---|---|
| Tributario | Abogado Tributario en Honduras | Recursos y Cumplimiento |
| Bancario | Derecho Bancario en Honduras | Deudas y Contratos |
| Aduanero | Derecho Aduanero en Honduras | Importaciones y Recursos |
| Regulación sanitaria | Regulación Sanitaria en Honduras | Registros ARSA |
| Extranjería | Trámites Migratorios en Honduras | Asesoría Legal |
| Propiedad intelectual | Registro y Defensa de Marcas en Honduras |
| Ambiental regulatorio | Derecho Ambiental en Honduras | Permisos y Sanciones |
| Conciliación y arbitraje | Conciliación y Arbitraje en Honduras |
| Honduras–España | Abogado en Honduras desde España | Poderes y Herencias |

Antes de mostrar un abogado responsable en estas áreas, confirmar la asignación en la fuente única de identidad.

---

# 9. Modelo definitivo de artículo jurídico

Cada artículo debe responder a una intención informativa concreta. No debe existir un artículo cuyo objetivo principal sea repetir la landing comercial.

## 9.1. Estructura

1. breadcrumb;
2. categoría;
3. H1 completo;
4. resumen de 40–70 palabras;
5. autor humano;
6. revisor;
7. fechas de publicación y revisión;
8. tiempo de lectura;
9. estado jurídico;
10. tabla de contenidos;
11. respuesta directa;
12. marco legal;
13. procedimiento;
14. documentos;
15. plazos;
16. errores frecuentes;
17. cuándo consultar;
18. fuentes oficiales;
19. artículos relacionados;
20. servicio relacionado;
21. caja de autor;
22. aviso legal único;
23. CTA contextual.

## 9.2. Apertura obligatoria

Evitar introducciones genéricas como:

> Este tema es muy importante en Honduras.

Usar una respuesta directa:

> En Honduras, una reclamación por despido depende de la causa de terminación, la antigüedad, los pagos pendientes y el plazo aplicable. Antes de firmar un finiquito o una renuncia, conviene revisar el contrato, los comprobantes de pago y las comunicaciones del empleador.

## 9.3. Bloque de revisión

Ejemplo:

> **Escrito por:** Emil Barahona, abogado colegiado en Honduras y responsable del área laboral.  
> **Revisión jurídica:** Thania Marlene Paz.  
> **Última revisión:** 28 de julio de 2026.  
> **Normativa revisada hasta:** 28 de julio de 2026.

No mostrar `revisión jurídica` si no ocurrió.

## 9.4. Caja de autor

Ejemplo laboral:

> **Sobre el autor**  
> Emil Barahona es abogado colegiado en Honduras y socio de Pineda y Asociados. Su práctica incluye derecho laboral, asuntos civiles y notariales y apoyo en materia penal. En el blog escribe y revisa contenidos relacionados con despidos, prestaciones, jornadas, conflictos laborales y documentación probatoria.  
> [Ver perfil de Emil Barahona]

## 9.5. Aviso legal único

Mostrar una sola vez, al final:

> Este contenido es informativo y no sustituye el análisis de un caso concreto. La normativa, los plazos y los criterios de las autoridades pueden cambiar. Para recibir una orientación adaptada a su situación, consulte con un abogado habilitado en Honduras.

Eliminar duplicados de avisos en cabecera, cuerpo, autor y footer.

## 9.6. Contenido pendiente

Cuando un artículo necesite revisión:

- mantener accesible para revisión interna;
- aplicar `noindex, follow`;
- excluir del sitemap;
- no mostrar en home, categorías, destacados ni relacionados;
- mostrar internamente el motivo;
- publicar únicamente tras asignar abogado y completar revisión.

---

# 10. Corrección de títulos observados

Aplicar como mínimo:

| URL o tema | Título nuevo |
|---|---|
| Artículo “abogados en Nacaome” | Cómo Elegir Abogado en Nacaome: 10 Criterios |
| Despido laboral | Despido Injustificado en Honduras: Prestaciones y Plazos |
| Derechos ARCO | Derechos ARCO en Honduras: Cómo Ejercerlos |
| Daños y perjuicios | Daños y Perjuicios en Honduras: Cómo Reclamar |
| Herencias | Herencias en Honduras: Testamento y Sucesión |
| Unión de hecho | Unión de Hecho en Honduras: Requisitos y Derechos |
| Estafas | Estafa en Honduras: Tipos, Denuncia y Defensa |
| Allanamiento | Allanamiento en Honduras: Derechos y Qué Hacer |
| Jornada laboral | Jornada Laboral en Honduras: Horas Extra y Recargos |
| Importaciones | Cómo Importar a Honduras: Requisitos y Documentos |
| Franquicias | Contrato de Franquicia en Honduras: Cláusulas y Riesgos |
| Custodia | Custodia de Hijos en Honduras: Criterios del Juez |
| Pensión alimenticia | Pensión Alimenticia en Honduras: Requisitos y Pasos |
| Prescripción penal | Prescripción Penal en Honduras: Plazos y Cálculo |

Reglas:

- 45–65 caracteres como orientación, no como límite rígido;
- consulta principal al inicio;
- marca al final solo cuando aporte;
- evitar `Guía completa` repetido en decenas de páginas;
- evitar años en el title salvo que el contenido se revise anualmente;
- H1 puede ser algo más explicativo que el title;
- meta description completa y no cortada.

---

# 11. Canibalización: mapa de intenciones

Crear:

```text
docs/seo/query-url-map.csv
```

Columnas:

```text
query_cluster,intent,primary_url,secondary_urls,action,canonical,redirect,status
```

## 11.1. Nacaome

### Home

Intención:

- bufete;
- contratación general;
- marca;
- abogados en Nacaome.

URL dominante:

```text
/
```

### Landing local

`/abogados-en-nacaome` debe elegir una de dos opciones:

**Opción recomendada:** redirección 301 a la home si no aporta contenido distinto.

Solo conservarla si se transforma en una página estrictamente local con:

- dirección;
- mapa;
- cómo llegar;
- tribunales y autoridades realmente atendidos;
- modalidad presencial;
- documentos para la primera consulta;
- diferencias operativas respecto a otras localidades;
- testimonios reales autorizados;
- contenido que no se repite en la home.

### Artículo

`/blog/practica-legal/abogados-en-nacaome`

Reorientar a:

> Cómo elegir abogado en Nacaome: 10 criterios antes de contratar

Intención informativa. Debe enlazar a la home con el anchor:

> consultar con un abogado en Nacaome

No usar el artículo como segunda landing comercial.

---

# 12. Landings municipales

No crear más landings hasta analizar Search Console.

## 12.1. Clasificación

Cada landing debe evaluarse mediante:

- impresiones;
- clics;
- CTR;
- posición;
- backlinks;
- conversiones;
- demanda;
- valor local único;
- contenido duplicado;
- distancia y modalidad de atención.

## 12.2. Decisiones

Valores:

- `KEEP_AND_IMPROVE`
- `MERGE_REGIONAL`
- `NOINDEX_UNTIL_UNIQUE`
- `REDIRECT`
- `REMOVE_410`

## 12.3. Requisitos para indexar una landing local

Debe incluir al menos:

1. descripción real de la atención;
2. si existe o no oficina en esa localidad;
3. sede desde la que se presta el servicio;
4. desplazamiento o modalidad remota;
5. instituciones relevantes verificadas;
6. tres problemas jurídicos frecuentes específicos;
7. documentos;
8. tiempos de contacto;
9. abogado responsable;
10. enlaces a servicios;
11. contenido distinto de otras ciudades.

No decir `abogados en [ciudad]` de forma que sugiera una oficina inexistente.

Usar:

> Atención legal para personas de Goascorán desde nuestra sede en Nacaome

en lugar de:

> Nuestro bufete en Goascorán

si no hay sede allí.

## 12.4. Arquitectura regional recomendada

Priorizar:

```text
/cobertura/valle
/cobertura/choluteca
```

Conservar páginas individuales solo para localidades con demanda o contenido propio suficiente.

---

# 13. FAQ

La página general no debe mezclar decenas de preguntas jurídicas de todas las áreas.

## 13.1. FAQ general

Mantener 10–15 preguntas sobre el despacho:

- ¿Dónde está ubicado el despacho?
- ¿Atienden fuera de Nacaome?
- ¿Cómo funciona la evaluación inicial?
- ¿Qué documentos debo llevar?
- ¿Cómo se determinan los honorarios?
- ¿Entregan presupuesto por escrito?
- ¿La consulta es confidencial?
- ¿Quién atenderá mi caso?
- ¿Puedo consultar desde España?
- ¿Atienden urgencias penales?
- ¿Puedo enviar documentos por internet?
- ¿Una consulta garantiza que aceptarán mi caso?

## 13.2. FAQ por servicio

Mover preguntas jurídicas a sus páginas:

- penal;
- familia;
- laboral;
- civil;
- mercantil;
- administrativo.

No repetir la misma respuesta en cuatro URLs.

---

# 14. Enlazado interno

## 14.1. Jerarquía

```text
Home
→ Servicios
→ Área
→ Subservicio
→ Artículo
→ Conversión
```

## 14.2. Reglas

Cada artículo:

- enlaza una vez al servicio principal;
- enlaza dos artículos del mismo cluster;
- enlaza una fuente oficial cuando proceda;
- no enlaza diez ciudades;
- no incluye bloques de veinte artículos;
- usa anchors descriptivos.

Ejemplos:

- `reclamar prestaciones por despido`
- `defensa desde una detención`
- `tramitar una pensión alimenticia`
- `revisar un contrato de arrendamiento`
- `constituir una sociedad en Honduras`

Evitar:

- `ver más`;
- `leer artículo`;
- `conocer más` como único texto del enlace.

---

# 15. Datos estructurados

## 15.1. Global

Usar un grafo JSON-LD coherente con IDs estables:

```text
#organization
#legal-service
#website
```

Tipos:

- `Organization`
- `LegalService`
- `WebSite`

## 15.2. Despacho y contacto

Incluir:

- `name`;
- `url`;
- `telephone`;
- `address`;
- `geo`;
- `openingHoursSpecification`;
- `areaServed`;
- `sameAs`;
- `employee` o relación con perfiles;
- `founder` solo si está verificado;
- no incluir aggregateRating propio no elegible.

## 15.3. Perfiles

`ProfilePage` con `mainEntity: Person`.

Campos:

- `name`;
- `jobTitle`;
- `worksFor`;
- `knowsAbout`;
- `url`;
- `image` si es real;
- `sameAs` solo perfiles oficiales;
- `hasCredential` únicamente cuando esté verificado.

## 15.4. Artículos

`Article` o `BlogPosting`:

- `headline`;
- `description`;
- `datePublished`;
- `dateModified`;
- `author` con URL del perfil;
- `reviewedBy`;
- `publisher`;
- `mainEntityOfPage`;
- `about`;
- `citation`;
- `image`;
- `inLanguage: es-HN`.

No generar fechas falsas ni marcar revisión sin evidencia.

## 15.5. Breadcrumbs

`BreadcrumbList` en:

- servicios;
- subservicios;
- categorías;
- artículos;
- perfiles;
- cobertura.

---

# 16. GEO y visibilidad en sistemas de IA

## 16.1. Contenido answer-first

Cada página debe incluir respuestas extraíbles:

**Pregunta:**

> ¿Cuánto tiempo tengo para reclamar un despido en Honduras?

**Respuesta breve:**

> El plazo depende de la acción concreta y puede ser breve. Debe verificarse según la fecha del despido y la reclamación pretendida. No espere a reunir todos los documentos para pedir una revisión inicial.

Después ampliar y citar la base legal.

## 16.2. Entidades consistentes

Siempre:

- `Pineda y Asociados`;
- `Danilo Pineda Maradiaga`;
- `Thania Marlene Paz`;
- `Emil Barahona`;
- `Nacaome, Valle, Honduras`.

## 16.3. Fuentes

Cada artículo debe tener una sección:

> Fuentes jurídicas consultadas

Con enlaces a:

- Poder Judicial;
- Congreso Nacional;
- La Gaceta;
- SAR;
- ARSA;
- Secretaría de Trabajo;
- instituciones competentes.

No enlazar fuentes genéricas no oficiales cuando exista la norma original.

## 16.4. `llms.txt`

Mantenerlo generado desde datos canónicos. Debe listar:

- identidad;
- ubicación;
- áreas;
- perfiles;
- servicios;
- artículos verificados;
- avisos de alcance;
- fecha de generación.

No incluir artículos `lawyer_review_pending`.

---

# 17. Conversión y confianza

## 17.1. CTA por intención

Penal:

> Solicitar asistencia penal

Familia:

> Consultar un asunto de familia

Laboral:

> Revisar mi despido o prestaciones

Civil:

> Revisar contrato, propiedad o herencia

Empresa:

> Solicitar revisión mercantil

General:

> Solicitar evaluación confidencial

## 17.2. Formulario

Campos:

- nombre;
- teléfono o email;
- área aproximada;
- localidad;
- descripción breve;
- urgencia;
- consentimiento.

No pedir información excesivamente sensible en el primer formulario.

Mensaje:

> No envíe confesiones, contraseñas ni documentos sensibles hasta que el despacho confirme el canal adecuado.

## 17.3. Prueba social

Usar exclusivamente:

- reseñas reales;
- nombre o inicial autorizada;
- plataforma;
- enlace;
- fecha;
- texto no alterado sustancialmente.

No generar testimonios.

---

# 18. Auditoría completa del blog

Crear inventario con una fila por artículo:

```text
slug
title
meta_description
h1
category
intent
author
reviewer
review_status
date_published
date_modified
source_as_of
word_count
internal_links
service_link
canonical_target
indexability
impressions
clicks
ctr
position
action
```

## 18.1. Acciones permitidas

- `KEEP`
- `UPDATE`
- `REWRITE`
- `MERGE`
- `REDIRECT`
- `NOINDEX_PENDING_REVIEW`
- `REMOVE`

## 18.2. Prioridad

1. artículos con revisión pendiente;
2. títulos rotos;
3. consultas YMYL con afirmaciones exactas;
4. URLs con muchas impresiones y CTR bajo;
5. canibalización;
6. artículos de tres minutos que prometen una guía completa;
7. artículos locales duplicados;
8. categorías débiles;
9. resto.

## 18.3. Artículos observados que requieren revisión prioritaria

- prescripción penal;
- custodia;
- pensión alimenticia;
- arrendamientos;
- daños y perjuicios;
- importaciones;
- franquicias;
- registro de medicamentos;
- cualquier artículo con aviso de revisión pendiente.

No significa que el contenido sea necesariamente incorrecto. Significa que no debe permanecer indexado como verificado mientras la página declara lo contrario.

---

# 19. SEO técnico

## 19.1. Indexación

Validar:

- canonical autorreferente;
- una sola versión `www`;
- HTTPS;
- sitemap solo con 200, canonical e indexables;
- `lastmod` real;
- noindex fuera del sitemap;
- 301 para fusiones;
- 410 para contenido eliminado sin equivalente;
- paginaciones;
- parámetros;
- búsqueda interna no indexable;
- preview y admin no indexables.

## 19.2. Sitemap

Separar:

```text
/sitemap-pages.xml
/sitemap-services.xml
/sitemap-blog.xml
/sitemap-authors.xml
/sitemap-local.xml
```

Puede existir un sitemap index.

Excluir:

- pending review;
- drafts;
- redirects;
- 404;
- URLs con canonical a otra;
- filtros;
- búsquedas;
- páginas locales no aprobadas.

## 19.3. HTML

- un H1;
- jerarquía H2/H3;
- título visible coherente con `<title>`;
- idioma `es-HN`;
- imágenes con `width` y `height`;
- alt descriptivo;
- no esconder contenido crítico tras JavaScript;
- enlaces HTML rastreables;
- tablas accesibles;
- IDs de encabezados estables.

## 19.4. Rendimiento

Priorizar:

- LCP hero;
- fuentes;
- imágenes;
- JS de componentes decorativos;
- formularios;
- sliders;
- mapas;
- widgets sociales;
- scripts de terceros.

No sacrificar texto rastreable por animaciones.

---

# 20. Search Console y CTR

Sin datos de Search Console no deben ejecutarse eliminaciones masivas.

Crear un importador o informe que identifique:

- impresiones altas;
- posición 3–15;
- CTR bajo;
- consulta y URL;
- URLs múltiples para una consulta;
- URLs sin clics;
- pérdida de clics;
- cambios por dispositivo.

## 20.1. Regla de optimización

Para una URL con buena posición y CTR bajo:

1. confirmar intención;
2. comparar query con title/H1;
3. reescribir title;
4. reescribir meta;
5. mejorar respuesta inicial;
6. añadir prueba de autoridad;
7. solicitar recrawl;
8. medir 28 días;
9. no cambiar de nuevo antes de tener datos suficientes.

---

# 21. Validaciones automáticas

Crear tests para impedir:

- autor genérico en artículos indexables;
- autor no canónico;
- artículo verificado sin revisor;
- artículo pending dentro del sitemap;
- title vacío o truncado artificialmente;
- H1 incompleto;
- múltiples páginas dominantes para la misma query;
- número CAH placeholder;
- nombres incorrectos;
- años de fundación no confirmados;
- `dateModified` sin cambio;
- article schema sin autor enlazable;
- páginas locales que afirman tener sede donde no existe;
- aviso legal repetido;
- artículo sin servicio relacionado;
- `llms.txt` con contenido no verificado.

---

# 22. Fases de implementación

## Fase 0 — Seguridad editorial

- inventario completo;
- noindex de pending review;
- corregir títulos rotos;
- corregir nombres;
- fuente única de autores;
- tests.

**Gate:** ningún artículo indexable declara revisión pendiente.

## Fase 1 — Autoridad

- perfiles;
- autoría;
- revisión;
- JSON-LD;
- cajas de autor;
- páginas de equipo.

**Gate:** 100 % de artículos indexables con autor humano adecuado.

## Fase 2 — Arquitectura

- query-to-URL map;
- Nacaome;
- landings;
- FAQ;
- categorías;
- redirecciones.

**Gate:** una URL dominante por intención prioritaria.

## Fase 3 — CTR

- títulos;
- metas;
- snippets;
- primeros párrafos;
- CTAs.

**Gate:** todas las páginas prioritarias tienen metadata única y completa.

## Fase 4 — Calidad del blog

- actualizar;
- fusionar;
- revisar;
- fuentes;
- profundidad;
- autores.

**Gate:** ningún contenido prioritario corto se presenta falsamente como “guía completa”.

## Fase 5 — GEO y medición

- llms;
- datos estructurados;
- Search Console;
- dashboards;
- revisión periódica.

---

# 23. Definition of Done

El proyecto se considera completado cuando:

- todos los nombres son canónicos;
- los tres abogados tienen perfil;
- todos los artículos indexables tienen autor individual;
- cada artículo pertenece a un área y abogado;
- los artículos pendientes son noindex;
- una IA nunca aparece como revisor jurídico;
- los títulos incompletos están corregidos;
- la home domina `abogados en Nacaome`;
- no existe un artículo comercial duplicado para la misma intención;
- cada landing municipal tiene valor único o está consolidada;
- FAQ distribuida;
- metadata única;
- JSON-LD válido;
- sitemap limpio;
- canonical correcto;
- enlaces internos contextuales;
- fuentes oficiales;
- `llms.txt` solo con contenido verificado;
- tests verdes;
- build verde;
- Search Console preparado para medición;
- no se han inventado credenciales ni resultados.

---

# 24. Entregables de la IA

La IA implementadora debe entregar:

1. inventario de URLs;
2. mapa de consultas;
3. matriz de autoría;
4. matriz de revisión;
5. lista de artículos noindex;
6. redirecciones;
7. títulos y metas;
8. archivos modificados;
9. tests;
10. validación de schema;
11. validación sitemap;
12. informe de enlaces;
13. informe de contenido;
14. informe de Search Console si hay acceso;
15. commits;
16. porcentaje únicamente como apoyo, nunca como veredicto;
17. riesgos pendientes;
18. datos que requieren confirmación humana.

---

# 25. Fuentes de referencia

## Sitio auditado

- https://www.pinedayasociadoshn.com/
- https://www.pinedayasociadoshn.com/abogados-en-nacaome
- https://www.pinedayasociadoshn.com/blog/practica-legal/abogados-en-nacaome
- https://www.pinedayasociadoshn.com/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras
- https://www.pinedayasociadoshn.com/blog/derecho-penal/cuando-prescribe-delito-en-honduras
- https://www.pinedayasociadoshn.com/blog/derecho-de-familia/custodia-hijos-honduras-juez
- https://www.pinedayasociadoshn.com/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa
- https://www.pinedayasociadoshn.com/blog/derecho-laboral/despido-laboral-honduras-guia-completa
- https://www.pinedayasociadoshn.com/blog/derecho-civil/contratos-arrendamiento-derechos-obligaciones-honduras
- https://www.pinedayasociadoshn.com/servicios-juridicos/regulacion-sanitaria

## Google Search Central

- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/blog/2015/03/an-update-on-doorway-pages

---

# 26. Instrucción final a la IA implementadora

Empieza por auditar el HEAD actual y no supongas que este documento refleja exactamente cada archivo del repositorio.

Implementa el plan de manera autónoma y por fases, manteniendo compatibilidad, pruebas y trazabilidad.

No publiques contenido pendiente de revisión.  
No inventes especializaciones.  
No inventes credenciales.  
No uses la marca como sustituto del autor.  
No crees más páginas municipales antes de consolidar las existentes.  
No elimines URLs con tráfico sin analizar Search Console.  
No modifiques producción, no despliegues y no hagas merge sin autorización expresa.

El criterio rector es:

> una intención, una URL dominante, un abogado responsable, una revisión verificable y una respuesta realmente útil para la persona que busca ayuda jurídica.

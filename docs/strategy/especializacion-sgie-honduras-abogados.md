# Especialización funcional SGIE para abogados en Honduras

**Fecha:** 9 de julio de 2026
**Base documental:** `docs/strategy/plan-maestro-mejora-sgie-admin-integracion.md` (plan maestro SGIE + Admin + Integración)
**Tipo de documento:** Estratégico-funcional. No contiene código ni diseño visual.
**Alcance:** intranet (SGIE + Admin). La web pública queda fuera y no debe verse afectada.
**Grado de certeza de los requisitos legales/procesales:** la totalidad de los requisitos, plazos, etapas, documentos y órganos citados son una **propuesta inicial**. Cualquier requisito legal o procesal no confirmado se marca como **“Pendiente de validación por abogado hondureño”**. Este documento no constituye asesoría legal definitiva.

---

## 1. Título

Especialización funcional SGIE para abogados en Honduras.

---

## 2. Objetivo

Este documento **aterriza el plan maestro a la práctica jurídica hondureña**. Toma la visión de SGIE semi-autónomo (secciones 2.1 a 2.6 del plan maestro) y la traduce a tipos de expediente, ficha judicial, checklists por materia, control de plazos y audiencias, modo audiencia, bitácora y plantillas propias del ejercicio del derecho en Honduras.

El objetivo no es rediseñar SGIE desde cero, sino **especializarlo** para que sea una herramienta de trabajo útil para abogados hondureños: que prepare expedientes completos según la materia, controle plazos y audiencias reales, y deje al abogado como revisor, validador y firmante.

### 2.1 Límites explícitos

- **No se implementa código** ni diseño visual.
- **No se afecta la web pública** en ningún punto.
- **No se asume integración técnica automática** con SEJE, juzgados, fiscalía, notificaciones electrónicas, expedientes judiciales ni ninguna fuente oficial externa.
- Todo lo relacionado con **SEJE, juzgados, fiscalía, notificaciones, expedientes judiciales o fuentes oficiales** se marca como **“Pendiente de validación jurídica/técnica”** si no está confirmado.
- **No se da asesoría legal definitiva.** Los requisitos legales y procesales son propuestas iniciales sujetas a validación.

---

## 3. Principio rector

**SGIE debe preparar expedientes completos y reducir al mínimo el trabajo operativo del abogado.**

Este principio, tomado literalmente del plan maestro (sección 2.1), se aplica aquí con un matiz hondureño: “expediente completo” significa **completo según la materia y el estado procesal**, con la documentación habitual del despacho y los plazos/audiencias registrados. El abogado hondureño debe recibir expedientes listos para revisión jurídica, no carpetas a medio armar que exijan perseguir documentos o calcular plazos a mano.

Consecuencias del principio:

- SGIE gestiona la **relación documental con el cliente** (solicitar, recordar, confirmar recepción, pedir correcciones).
- SGIE **prepara** el expediente (clasifica, valida preliminarmente, detecta faltantes, genera resumen).
- SGIE **escala al abogado** solo las excepciones tipificadas (sección 15).
- El abogado **revisa, firma, aprueba o devuelve**; no opera tareas documentales rutinarias.

---

## 4. Tipos de expediente Honduras

Primera clasificación funcional. Los datos de cada tipo son una **propuesta inicial**; todo requisito legal o procesal está **Pendiente de validación por abogado hondureño**.

### 4.1 Penal

- **Finalidad:** defensa o representación en procesos penales (defensa, querella, victima, asistencia). *Pendiente de validación por abogado hondureño.*
- **Datos mínimos:** cliente, delito imputado (referencia al catálogo canónico `data/delitos.json`), víctimas/contraparte, fiscalía asignada, órgano jurisdiccional, número de expediente judicial, medida cautelar si aplica.
- **Documentos habituales:** denuncia/querella, acta de detención si aplica, declaración, certificación de antecedentes, documentos de identidad, medios de prueba. *Pendiente de validación.*
- **Etapas generales:** investigación, etapa intermedia, juicio, impugnación, ejecución. *Pendiente de validación por abogado hondureño.*
- **Responsables:** abogado responsable, asistente, (eventualmente) investigador.
- **Alertas típicas:** audiencia próxima, vencimiento de medida cautelar, plazo para escritos, citación no confirmada.
- **Plantillas necesarias:** comunicación de audiencia, solicitud documental al cliente, informe interno.
- **Estado “Listo para revisión”:** ficha judicial completa + checklist penal cumplido + plazos registrados + documentos dudosos marcados.

### 4.2 Civil

- **Finalidad:** asuntos civiles (declarativos, ejecutivos, sucesorios, obligaciones). *Pendiente de validación.*
- **Datos mínimos:** cliente, contraparte, materia civil específica, órgano jurisdiccional, número de expediente judicial, cuantía si aplica.
- **Documentos habituales:** demanda/contestación, títulos ejecutivos, contratos, facturas, notificaciones, certificaciones registrales. *Pendiente de validación.*
- **Etapas generales:** demanda, contestación, prueba, sentencia, impugnación, ejecución. *Pendiente de validación.*
- **Responsables:** abogado responsable, asistente.
- **Alertas típicas:** plazo de prueba, audiencia, embargo, remate, prescripción.
- **Plantillas necesarias:** solicitud documental, recordatorio de plazo, comunicación de audiencia.
- **Estado “Listo para revisión”:** ficha judicial completa + checklist civil cumplido + plazos registrados.

### 4.3 Familia

- **Finalidad:** divorcios, pensión alimentaria, custodia, patria potestad, violencia doméstica. *Pendiente de validación.*
- **Datos mínimos:** cliente, contraparte, hijos/menores si aplica, juzgado de familia, número de expediente judicial, medidas provisionales si aplican.
- **Documentos habituales:** actas de nacimiento, matrimonios, identidades, denuncias (si aplica), informes sociales. *Pendiente de validación.*
- **Etapas generales:** medida provisional, demanda, audiencia, sentencia, ejecución. *Pendiente de validación.*
- **Responsables:** abogado responsable, asistente; especial cuidado con confidencialidad.
- **Alertas típicas:** audiencia de medidas provisionales, vencimiento de pensión, audiencia de conciliación.
- **Plantillas necesarias:** comunicación sensible de audiencia, solicitud documental, informe interno.
- **Estado “Listo para revisión”:** ficha judicial completa + checklist familia cumplido + confidencialidad marcada.

### 4.4 Laboral

- **Finalidad:** conflictos individuales o colectivos de trabajo, referencias al Código de Trabajo (`data/codigo_trabajo.json`). *Pendiente de validación.*
- **Datos mínimos:** trabajador/patrono, relación laboral, órgano jurisdiccional laboral, número de expediente judicial, pretensión cuantificada si aplica.
- **Documentos habituales:** contrato, constancias de trabajo, planillas, finiquito, despido, liquidación. *Pendiente de validación.*
- **Etapas generales:** conciliación, demanda, contestación, audiencia (oralidad), sentencia. *Pendiente de validación.*
- **Responsables:** abogado responsable, asistente.
- **Alertas típicas:** audiencia oral, plazo de prescripción laboral, audiencia de conciliación.
- **Plantillas necesarias:** solicitud documental laboral, comunicación de audiencia, informe interno.
- **Estado “Listo para revisión”:** ficha judicial completa + checklist laboral cumplido + audiencias registradas.

### 4.5 Mercantil

- **Finalidad:** sociedades, contratos mercantiles, ejecuciones, concursos. Referencias al Código de Comercio (`data/codigo_comercio.json`). *Pendiente de validación.*
- **Datos mínimos:** cliente (sociedad o persona), registro mercantil si aplica, órgano jurisdiccional, número de expediente judicial, cuantía.
- **Documentos habituales:** escrituras, poderes, registros, contratos, estados financieros. *Pendiente de validación.*
- **Etapas generales:** demanda, prueba, sentencia, ejecución; y vía notarial/registral cuando aplica. *Pendiente de validación.*
- **Responsables:** abogado responsable, asistente.
- **Alertas típicas:** junta, asamblea, inscripción registral, vencimiento de poder.
- **Plantillas necesarias:** solicitud documental mercantil, informe interno.
- **Estado “Listo para revisión”:** ficha judicial completa + checklist mercantil cumplido.

### 4.6 Administrativo

- **Finalidad:** controversias con la administración pública, recursos, tributario (referencias al Código Tributario `data/codigo_tributario.json`). *Pendiente de validación.*
- **Datos mínimos:** cliente, autoridad administrativa, acto impugnado, número de expediente administrativo/judicial si aplica.
- **Documentos habituales:** resoluciones, notificaciones, constancias, dictámenes. *Pendiente de validación.*
- **Etapas generales:** recurso administrativo, agotamiento de vía, contencioso-administrativo. *Pendiente de validación.*
- **Responsables:** abogado responsable, asistente.
- **Alertas típicas:** plazo de recurso, caducidad, notificación.
- **Plantillas necesarias:** solicitud documental, comunicación de plazo.
- **Estado “Listo para revisión”:** ficha judicial/administrativa completa + checklist administrativo cumplido.

### 4.7 Notarial / registral (si aplica)

- **Finalidad:** protocolización, fe de hechos, asuntos registrales. *Pendiente de validación; puede no requerir expediente judicial.*
- **Datos mínimos:** cliente, tipo de acto notarial, registro destino, número de factura/escritura si aplica.
- **Documentos habituales:** minutas, identidades, documentos habilitantes. *Pendiente de validación.*
- **Etapas generales:** preparación, otorgamiento, inscripción registral. *Pendiente de validación.*
- **Responsables:** notario/abogado, asistente.
- **Alertas típicas:** cita de firma, inscripción pendiente.
- **Plantillas necesarias:** cita notarial, informe interno.
- **Estado “Listo para revisión”:** datos del acto completos + checklist notarial cumplido.

---

## 5. Ficha judicial del expediente

La ficha judicial es el **contenedor de metadatos procesales** de un expediente SGIE. No todos los campos aplican a todas las materias (notarial, por ejemplo, puede no tener número de expediente judicial). SGIE debe marcar como obligatorios solo los campos que apliquen al tipo de expediente.

Campos propuestos:

- número interno SGIE;
- número de expediente judicial (si aplica);
- materia;
- órgano jurisdiccional;
- ciudad / departamento;
- juzgado o tribunal;
- fiscalía (si aplica, principalmente penal);
- partes (cliente, contraparte, terceros);
- abogado responsable;
- asistente responsable;
- etapa procesal;
- próxima audiencia;
- próximo plazo;
- referencia SEJE (si aplica) — **Pendiente de validación jurídica/técnica**;
- última consulta judicial (fecha y responsable) — **Pendiente de validación jurídica/técnica**;
- estado SGIE (interno);
- estado judicial/procesal.

> **Nota SEJE:** el campo “referencia SEJE” y “última consulta judicial” se incluyen como **datos de referencia introducidos manualmente**, no como integración automática. Su vigencia y condiciones de uso están **Pendientes de validación jurídica/técnica** (ver sección 10).

---

## 6. Separación entre estado SGIE y estado judicial

Definir dos modelos de estado **independientes**.

### 6.1 Estado interno SGIE

Refleja el estado de **gestión interna** del expediente en el despacho. Ejemplos: `Borrador`, `Solicitando documentación`, `En preparación`, `Listo para revisión`, `En revisión`, `Devuelto`, `Aprobado`, `Bloqueado por cliente`, `Cerrado`. Es controlado por SGIE y por el flujo del plan maestro.

### 6.2 Estado judicial / procesal

Refleja el estado **en el proceso real** (investigación, etapa intermedia, juicio, sentencia, impugnación, ejecución, etc., según materia). Es información de referencia que el despacho registra a partir de lo que conoce del proceso; **no es fuente oficial** y debe mantenerse actualizada por consulta humana. *Pendiente de validación por abogado hondureño.*

### 6.3 Por qué no deben mezclarse

- **Propósito distinto:** el estado SGIE describe preparación interna; el estado judicial describe el proceso real.
- **Fuente distinta:** el estado SGIE lo controla el sistema; el estado judicial lo alimenta el despacho a partir de consultas.
- **Consecuencias distintas:** avanzar el estado SGIE no implica avance procesal; un cambio procesal no cambia automáticamente el estado de preparación interna.
- **Evita falsas certezas:** mezclarlos podría hacer creer que un expediente está listo cuando el proceso real está parado, o viceversa.

La ficha judicial (sección 5) mantiene ambos campos visibles y claramente etiquetados, para que el abogado distinga siempre gestión interna de proceso judicial.

---

## 7. Definición hondureña de expediente completo

Adaptación de la sección 2.2 del plan maestro para que los criterios **dependan del tipo de expediente**. Un expediente estará **“Listo para revisión”** solo si se cumplen todos los aplicables:

1. datos básicos completos;
2. **ficha judicial completa cuando aplique** (sección 5);
3. checklist documental del tipo de expediente completado (sección 8);
4. documentos clasificados;
5. documentos dudosos marcados;
6. plazos y audiencias registrados (sección 9);
7. resumen del expediente generado (con confianza y fuentes);
8. riesgos detectados y marcados;
9. tareas críticas cerradas;
10. trazabilidad completa (bitácora, sección 12).

La regla clave: **no todos los criterios pesan igual en todas las materias**. Un expediente penal puede requerir fiscalía y medida cautelar; uno notarial puede no requerir ficha judicial. SGIE debe aplicar la **definición parametrizada por tipo de expediente**, definida y versionada desde Admin.

---

## 8. Checklists documentales por materia

Estructura de checklist por materia. **No son requisitos legales cerrados**: son una **propuesta inicial pendiente de validación por abogado hondureño**. Cada ítem debe poder marcarse como `obligatorio`, `condicional` o `opcional`, con responsable de validación y confianza si es prevalidado por IA.

### 8.1 Penal

- denuncia/querella;
- declaración del cliente;
- certificación de antecedentes;
- documentos de identidad del cliente;
- documentos de identidad de la contraparte (si disponibles);
- acta de detención / medida cautelar (si aplica);
- medios de prueba aportados por el cliente.

*Todos los ítems: Pendiente de validación por abogado hondureño.*

### 8.2 Civil

- demanda y anexos;
- títulos ejecutivos / contratos;
- facturas / soportes de obligación;
- certificaciones registrales (si aplica);
- notificaciones recibidas;
- poderes del abogado.

*Todos los ítems: Pendiente de validación por abogado hondureño.*

### 8.3 Familia

- actas de nacimiento (hijos, si aplica);
- acta de matrimonio (si aplica);
- documentos de identidad;
- denuncias previas (si aplica);
- informes sociales o psicológicos (si aplica);
- comprobantes de pensión (si aplica).

*Todos los ítems: Pendiente de validación por abogado hondureño.*

### 8.4 Laboral

- contrato de trabajo;
- constancias de trabajo;
- planillas / recibos de pago;
- comunicación de despido (si aplica);
- finiquito / liquidación (si aplica);
- denuncias o actas de conciliación previa.

*Todos los ítems: Pendiente de validación por abogado hondureño.*

### 8.5 Mercantil

- escritura constitutiva / poderes;
- registro mercantil;
- contratos mercantiles;
- estados financieros (si aplica);
- facturas;
- anexos de demanda.

*Todos los ítems: Pendiente de validación por abogado hondureño.*

### 8.6 Administrativo

- resolución impugnada;
- notificaciones administrativas;
- dictámenes (si aplica);
- constancias y soportes;
- recursos previos presentados.

*Todos los ítems: Pendiente de validación por abogado hondureño.*

### 8.7 Notarial / registral (si aplica)

- minuta / anteproyecto;
- identidades de otorgantes;
- documentos habilitantes;
- certificaciones previas (si aplica);
- comprobante de pago de aranceles (si aplica).

*Todos los ítems: Pendiente de validación por abogado hondureño.*

> **Regla de gobierno:** los checklists se definen, versionan y auditan desde Admin (gobernanza de la autonomía, sección 6 del plan maestro). SGIE los aplica; no los inventa.

---

## 9. Control de plazos y audiencias

SGIE debe registrar y vigilar plazos y audiencias, pero **los cálculos de plazos legales requieren validación humana**. SGIE propone fechas a partir de lo introducido, no calcula derechos subjetivos de plazo de forma vinculante.

Campos propuestos por evento de plazo/audiencia:

- fecha de audiencia;
- plazo judicial (fecha límite introducida);
- plazo interno (fecha de seguridad definida por el despacho, anterior al judicial);
- recordatorios (días de antelación configurables);
- responsable;
- documentos necesarios para la audiencia/plazo;
- estado de preparación (`Sin preparar`, `En preparación`, `Listo`, `Celebrada`, `Vencido`);
- resultado (de la audiencia o del cumplimiento del plazo);
- próxima acción derivada.

### 9.1 Reglas operativas propuestas

- El **plazo interno** debe ser anterior al plazo judicial, como margen de seguridad.
- Los **recordatorios** se escalan (recordatorio → aviso → escalado al abogado).
- Las **audiencias próximas** alimentan el dashboard del abogado (sección 16) y las reglas de escalado (sección 15).
- El **cómputo legal de plazos** (días hábiles, suspensiones, feriados) es **Pendiente de validación por abogado hondureño** y nunca debe ser automático-vinculante sin validación.

---

## 10. Relación funcional con SEJE y fuentes oficiales

**No se propone integración automática.** Mientras no se valide viabilidad técnica, permisos y condiciones de uso, la relación con SEJE y fuentes oficiales es **manual**, registrada en SGIE como referencia.

Campos de referencia manual:

- campo de referencia SEJE (identificador introducido por el despacho) — **Pendiente de validación jurídica/técnica**;
- fecha de última consulta;
- estado consultado (texto introducido por el responsable);
- documento descargado (adjunto o enlace interno);
- actuación detectada (descripción introducida);
- responsable de la consulta;
- próxima acción (p. ej., “volver a consultar en X días”, “presentar escrito”).

### 10.1 Condiciones para una futura integración (fuera del alcance actual)

Antes de plantear integración automática con SEJE u otras fuentes oficiales deberían confirmarse, como mínimo:

- **viabilidad técnica** del acceso y formato de datos;
- **permisos y condiciones de uso** del sistema externo;
- **marco legal** aplicable al consumo y almacenamiento;
- **confidencialidad** de los datos descargados;
- **trazabilidad** de cada consulta y descarga.

Hasta entonces, todo lo relacionado con SEJE y fuentes oficiales queda **Pendiente de validación jurídica/técnica** y se trata como entrada manual controlada.

---

## 11. Modo audiencia

Vista funcional de **preparación de audiencia**: concentra todo lo que el abogado necesita para una audiencia concreta, preparado por SGIE. La IA puede asistir en el resumen y en detectar riesgos, pero **no decide ni sustituye** la preparación del abogado.

Elementos del modo audiencia:

- resumen del expediente (generado, con confianza y fuentes);
- etapa procesal;
- juzgado / tribunal;
- fecha y hora;
- partes;
- documentos clave (seleccionados del expediente);
- pruebas (inventario y estado);
- notas internas del despacho;
- checklist preaudiencia (documentos y tareas);
- riesgos detectados (contradicciones, faltantes, plazos colindantes);
- resultado de la audiencia (registro posterior);
- próxima acción.

El modo audiencia debe poder abrirse desde el dashboard del abogado (audiencia próxima) y desde la ficha del expediente. Es la **vístula más sensible a la preparación previa**: si el checklist preaudiencia no está cumplido, SGIE debe alertar y, según configuración, escalar (sección 15).

---

## 12. Bitácora del expediente

Línea de tiempo completa y **fuente única de trazabilidad** del expediente. La bitácora es inmutable para eventos críticos y editable solo con autorización para notas internas.

Eventos a registrar:

- alta del expediente;
- documentos solicitados (con destinatario y plantilla);
- documentos recibidos (con origen y clasificación);
- comunicaciones enviadas/recibidas (cliente, juzgado, contraparte);
- tareas (creación, cierre, reasignación);
- audiencias (programación, resultado);
- escritos presentados (registro interno);
- revisiones del abogado;
- cambios de estado (SGIE y judicial);
- decisiones del abogado (aprobar, devolver, firmar);
- bloqueos (motivo y desbloqueo);
- cierre.

Cada evento debe almacenar **autor, fecha y, si aplica, motivo y fuente**. La bitácora alimenta la auditoría general (sección 6.8 del plan maestro) y los KPIs (sección 17).

---

## 13. Cliente no responde

Flujo específico para el caso más frecuente de bloqueo documental: el cliente no entrega la documentación solicitada. El objetivo es **automatizar el seguimiento** y escalar solo cuando hace falta decisión, sin que el abogado persiga documentos básicos.

Flujo propuesto:

1. **Primer recordatorio:** automático, X días tras la solicitud (configurable en Admin).
2. **Segundo recordatorio:** automático, escalado en tono y canal.
3. **Aviso de bloqueo:** automático al cliente, indicando que el expediente se bloqueará.
4. **Escalado al asistente:** tarea interna para contacto directo (teléfono, mensaje).
5. **Escalado al abogado:** solo si el asistente no logra respuesta y el expediente es crítico (por plazo o audiencia).
6. **Estado “Bloqueado por cliente”:** SGIE marca el expediente como bloqueado, lo retira de la bandeja “Listo para revisión” y lo lleva a la bandeja de excepciones.
7. **Desbloqueo tras recepción documental:** al recibir la documentación faltante, SGIE reanuda el flujo de preparación automáticamente y notifica.

Parámetros (días entre recordatorios, umbral de escalado) se gobiernan desde Admin y deben ser **Pendiente de validación por el despacho** según su política de atención.

---

## 14. Plantillas hondureñas gobernadas desde Admin

Categorías de plantillas específicas para el ejercicio en Honduras, **gobernadas y versionadas desde Admin** (sección 6.6 del plan maestro). SGIE las usa; Admin las controla.

Categorías propuestas:

- solicitud documental;
- recordatorio documental;
- confirmación de recepción;
- solicitud de corrección (documento inválido o ilegible);
- comunicación de audiencia;
- informe interno;
- resumen de expediente;
- devolución por falta de documentos.

### 14.1 Metadatos de cada plantilla

- **versión** (cada cambio genera una versión nueva);
- **variables** disponibles (p. ej., nombre del cliente, fecha de audiencia, juzgado, documentos faltantes);
- **responsable** de la plantilla;
- **aprobación** (estado: borrador, aprobada, activa, retirada);
- **estado** (activa/inactiva);
- **auditoría** (quién editó, cuándo, qué cambió).

> **Confidencialidad:** las plantillas de familia y, en general, las que manejan datos sensibles, deben respetar las marcas de confidencialidad del expediente. Cualquier variable de datos personales se trata según la política de protección de datos del despacho. *Pendiente de validación por abogado hondureño.*

---

## 15. Reglas de escalado al abogado

Casos en los que SGIE **saca el expediente del flujo automático** y lo lleva a la bandeja de decisiones del abogado. Esta lista amplía y concreta las excepciones del plan maestro (sección 10.18) para el contexto hondureño.

- documento dudoso o no prevalidable;
- contradicción entre documentos;
- falta crítica de documentación del checklist;
- plazo vencido o interno superado;
- audiencia próxima sin preparación completa;
- cliente no responde tras el flujo de recordatorios (sección 13);
- baja confianza de la IA (por debajo del umbral de Admin);
- decisión jurídica sensible (estrategia, acto procesal relevante);
- firma;
- cierre.

En todos estos casos, **SGIE no decide**: prepara el contexto, explica la excepción y entrega la decisión al abogado. El umbral de confianza y los días de antelación para “audiencia próxima” se gobiernan desde Admin y son **Pendiente de validación por abogado hondureño**.

---

## 16. Dashboard abogado Honduras

Replanteo de la bandeja del abogado para el contexto hondureño (extiende la sección 13.1 del plan maestro). El eje sigue siendo **“qué revisar ahora”**, no métricas genéricas.

Elementos prioritarios:

- **siguiente expediente listo** para revisión (cola principal);
- **audiencias próximas** (con acceso directo al modo audiencia, sección 11);
- **firmas pendientes**;
- **excepciones críticas** (plazo vencido, audiencia próxima, decisión jurídica sensible);
- **documentos dudosos** pendientes de validación;
- **clientes bloqueados** (expedientes en “Bloqueado por cliente”, sección 13);
- **vencimientos** próximos (plazo interno y judicial).

Principio de diseño: el abogado entra, ve el siguiente expediente revisable o la excepción más urgente, y decide en pocos pasos. Las métricas agregadas se quedan para los dashboards de supervisor y dirección (sección 13 del plan maestro).

---

## 17. KPIs funcionales para despacho hondureño

KPIs específicos para la operación jurídica en Honduras (extienden los KPIs de autonomía del plan maestro, sección 14.1). Deben calcularse en Admin (métricas SGIE); su viabilidad real de cálculo está **Pendiente de validación**.

- expedientes listos para revisión;
- tiempo desde apertura hasta expediente completo;
- expedientes bloqueados por cliente;
- documentos faltantes promedio por expediente;
- audiencias preparadas a tiempo;
- vencimientos próximos;
- expedientes devueltos por documentación incompleta;
- tareas manuales evitadas (ahorro estimado);
- tiempo medio de revisión del abogado.

Estos KPIs miden si la especialización funciona: si los expedientes llegan completos según materia, si los plazos se respetan y si el abogado invierte menos tiempo en gestión documental.

---

## 18. Riesgos

### 18.1 Riesgos jurídicos

- Requisitos legales/procesales asumidos sin validación.
- Cómputo de plazos legales incorrecto si se automatiza sin validación humana.
- Confusión entre estado SGIE y estado judicial.

### 18.2 Riesgos de plazos

- Plazo interno mal configurado (sin margen suficiente).
- Feriados o suspensiones no contemplados.
- Audiencia registrada con fecha incorrecta.

### 18.3 Riesgos documentales

- Checklists incompletos o desactualizados por materia.
- Documentos mal clasificados.
- Documentos dudosos no marcados.

### 18.4 Riesgos de IA

- Confianza sobreestimada en resúmenes o extracciones.
- Detección de contradicciones falsa o ausente.
- Uso de la IA para sustituir decisión jurídica (prohibido).

### 18.5 Riesgos de confidencialidad

- Datos sensibles (familia, penal) expuestos en plantillas o resúmenes.
- Acceso por rol inadecuado.
- Falta de política de protección de datos.

### 18.6 Riesgos de integración externa

- Asumir integración automática con SEJE u otras fuentes sin validar.
- Consumo o almacenamiento de datos oficiales sin marco legal.
- Dependencia de un sistema externo no controlado.

### 18.7 Riesgos de adopción por abogados

- Resistencia a delegar preparación documental.
- Desconfianza en la IA y en el estado “Listo para revisión”.
- Uso paralelo de hojas de cálculo o correo por costumbre.

---

## 19. Roadmap recomendado

Fases para desplegar la especialización de forma incremental y validada.

| Fase | Objetivo | Entregable clave | Validación requerida |
|---|---|---|---|
| 1 | Validación con abogados hondureños | Entrevistas, casos reales, matriz de uso por materia | Sesión con despacho |
| 2 | Definición de materias y tipos de expediente | Catálogo confirmado de materias y tipos | Abogado hondureño |
| 3 | Checklists por materia | Checklists validados por materia | Abogado hondureño |
| 4 | Ficha judicial | Campos confirmados por materia | Abogado hondureño |
| 5 | Control de plazos | Modelo de plazos y recordatorios | Abogado hondureño (cómputo legal) |
| 6 | Modo audiencia | Vista de preparación funcional | Pruebas internas |
| 7 | Bitácora | Línea de tiempo completa | Pruebas internas |
| 8 | Plantillas | Categorías hondureñas versionadas | Responsable de contenido |
| 9 | Reglas de escalado | Umbral de confianza y antelación | Abogado hondureño |
| 10 | Pruebas con expedientes reales anonimizados | Ajustes finales | Abogados y asistentes |

> **Anonimización:** las pruebas de la fase 10 deben hacerse con expedientes reales **anonimizados**, respetando confidencialidad y la política de protección de datos del despacho.

Cada fase **no modifica la web pública**. Las mejoras se limitan a SGIE y Admin (intranet).

---

## 20. Conclusión ejecutiva

SGIE debe convertirse en una **herramienta jurídica-operativa hondureña**, no solo en un gestor documental genérico. Eso significa especializarlo por materia, dotarlo de ficha judicial, checklists, control de plazos y audiencias, modo audiencia, bitácora y plantillas propias del ejercicio del derecho en Honduras, siempre bajo la visión semi-autónoma del plan maestro: **SGIE prepara expedientes completos; el abogado revisa, firma, aprueba o resuelve excepciones.**

Esta especialización se gobierna desde Admin (checklists, plantillas, reglas, plazos, permisos, auditoría) y se mide con KPIs funcionales (expedientes listos, bloqueos por cliente, audiencias preparadas a tiempo, tiempo medio de revisión). El éxito se alcanza cuando un abogado hondureño puede entrar a SGIE, ver el siguiente expediente listo según su materia, decidir en pocos pasos y avanzar, sin perseguir documentos ni calcular plazos a mano.

Todo requisito legal o procesal citado es **propuesta inicial**. Cualquier integración con SEJE u otras fuentes oficiales es **Pendiente de validación jurídica/técnica**. La web pública queda fuera del alcance y no se ve afectada.

---

## Registro de certeza

- **VALIDADO:** el documento se basa en el plan maestro SGIE + Admin actualizado y en las fuentes canónicas del repositorio (`data/delitos.json`, `data/codigo_trabajo.json`, `data/codigo_comercio.json`, `data/codigo_tributario.json`) como referencias de corpus jurídico, no como asesoría legal.
- **Pendiente de validación por abogado hondureño:** todos los requisitos legales/procesales, etapas, documentos habituales, cómputo de plazos y checklists por materia citados.
- **Pendiente de validación jurídica/técnica:** todo lo relativo a SEJE, juzgados, fiscalía, notificaciones electrónicas, expedientes judiciales y fuentes oficiales; en particular, cualquier integración automática.
- **Fuera del alcance:** web pública, código y diseño visual.

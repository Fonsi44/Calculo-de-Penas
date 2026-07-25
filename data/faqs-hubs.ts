/**
 * FAQ específicas para hubs comerciales (servicios-juridicos, despacho,
 * solicitar-consulta). Son contenido editorial propio (no de la DB `faq_entries`
 * que alimenta /preguntas-frecuentes). Cada par Q&A está pensado para:
 *  - Rich result FAQPage (schema embebido por la página).
 *  - Optimización AEO/GEO: respuestas directas y sobrias para asistentes IA.
 *  - Conversión: aclaran dudas frecuentes antes del primer contacto.
 *
 * Arquitectura FAQ del sitio (ver lib/faq-unified.ts para el mapa completo):
 *  - DB `faq_entries` + fallback data/faq.ts → /preguntas-frecuentes (global).
 *  - Este archivo (faqs-hubs.ts) → FAQ editorial por hub comercial.
 *  - area.faqs embebidas en data/areas-juridicas.ts → páginas de detalle.
 *  - i18n home inline → DEPRECADA; la home debe usar lib/faq-unified.ts.
 *
 * Reglas (AGENTS.md R4, R13, R14):
 *  - NO se inventan datos legales, plazos exactos, costos fijos ni resultados.
 *  - Cuando se menciona plazo/costo, va acompañado de "depende del caso" y
 *    "solicite consulta para evaluación específica".
 *  - NO se prometen resultados judiciales (R4, ética abogacía).
 *  - NAP coherente: horario, teléfono y WhatsApp se derivan de `lib/site.ts`
 *    (FASE 2). No se hardcodean literales divergentes.
 *  - Colegiación CAH (P10): no se afirma categóricamente ni se inventa nº.
 *    La afirmación prudente es «abogados en ejercicio en Honduras»; el nº de
 *    colegiación solo se publica vía badges condicionales en /despacho si el
 *    despacho aporta el dato (NEXT_PUBLIC_CAH_*).
 */

import { site } from '@/lib/site';

export interface HubFaqItem {
  pregunta: string;
  respuesta: string;
}

/**
 * /servicios-juridicos — hub del catálogo de áreas.
 * Intención: usuario explorando "qué cubre el bufete" antes de decidir contactar.
 */
export const FAQ_SERVICIOS_JURIDICOS: HubFaqItem[] = [
  {
    pregunta: '¿Qué áreas del derecho cubre Pineda y Asociados?',
    respuesta:
      'El bufete atiende 14 áreas: derecho penal, de familia, laboral, civil, notarial, mercantil y empresarial, administrativo, constitucional, migratorio, ambiental, agrario, propiedad intelectual y tributario. La defensa penal es el pilar histórico, con cobertura integral en las demás ramas para casos que combinan varios frentes.',
  },
  {
    pregunta: '¿Atienden casos en toda Honduras o solo en el sur?',
    respuesta:
      'La sede física está en Nacaome, Valle. La cobertura habitual incluye el departamento de Valle, Choluteca y Francisco Morazán. Para diligencias puntuales fuera de esa zona se coordina según el caso; solicite consulta para confirmar cobertura.',
  },
  {
    pregunta: '¿Cómo decido qué abogado del bufete lleva mi caso?',
    respuesta:
      'Cada área la dirige un especialista: Danilo Pineda Maradiaga en derecho penal, Thania Marlene Paz en familia, civil y mercantil, y Emil Barahona en derecho laboral. En la primera consulta se identifica el área principal y se asigna al especialista correspondiente.',
  },
  {
    pregunta: '¿Ofrecen consulta inicial sin costo?',
    respuesta:
      'Sí, la primera consulta por WhatsApp, llamada o formulario es confidencial y sin costo. Permite evaluar el caso, plantear una estrategia inicial y entregar un presupuesto por escrito cuando se requiera representación formal.',
  },
  {
    pregunta: '¿Mi caso combina varias ramas del derecho, cómo lo gestionan?',
    respuesta:
      'El bufete coordina internamente entre especialistas cuando un caso combina, por ejemplo, penal y familia, o laboral y civil. El cliente tiene un único punto de contacto y no duplica gestiones entre despachos.',
  },
  {
    pregunta: '¿Pueden llevar asuntos a distancia si vivo fuera de Nacaome?',
    respuesta:
      'Sí. La revisión documental, reuniones y seguimiento pueden ser remotos por WhatsApp y videollamada. La presencia presencial en sede judicial o notarial se coordina según la diligencia requerida.',
  },
  {
    pregunta: '¿Entregan presupuesto por escrito?',
    respuesta:
      'Sí. Tras la consulta inicial se entrega un presupuesto por escrito con el alcance del trabajo, honorarios y estimated timeline. No se inicia ninguna gestión sin autorización expresa del cliente.',
  },
  {
    pregunta: '¿Manejan casos para hondureños residentes en España?',
    respuesta:
      'Sí. Existe un módulo específico de asistencia legal para hondureños en España: poderes desde el extranjero, divorcios, custodia, sucesiones y gestión documental coordinada entre España y Honduras.',
  },
];

/**
 * /despacho — página "El Despacho" / about.
 * Intención: usuario evaluando la credibilidad, experiencia y enfoque del bufete.
 */
export const FAQ_DESPACHO: HubFaqItem[] = [
  {
    pregunta: '¿Desde cuándo opera Pineda y Asociados?',
    respuesta:
      'El bufete ejerce en Nacaome, Valle, desde hace más de 15 años. La defensa penal es su pilar histórico, ampliada progresivamente a familia, laboral, civil, mercantil y demás ramas para atender casos multidisciplinarios.',
  },
  {
    pregunta: '¿Quiénes conforman el equipo de abogados?',
    respuesta:
      'El equipo está liderado por Danilo Pineda Maradiaga (socio director, derecho penal), Thania Marlene Paz (familia, civil y mercantil) y Emil Barahona (derecho laboral). Los tres son abogados en ejercicio en Honduras; el número de colegiación ante el Colegio de Abogados de Honduras se muestra en la página del despacho cuando procede.',
  },
  {
    pregunta: '¿Dónde está ubicada la oficina?',
    respuesta:
      'La sede física está en Nacaome, Valle: cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. Andara. Se atiende con cita previa para garantizar dedicación a cada caso.',
  },
  {
    pregunta: '¿Cuál es la filosofía de trabajo del bufete?',
    respuesta:
      'Defensa técnica con rigor, atención directa del abogado (no intermediarios), presupuesto por escrito y estrategia comunicada al cliente en cada etapa. No se prometen resultados: se compromete trabajo serio.',
  },
  {
    pregunta: '¿Cómo es el proceso tras la primera consulta?',
    respuesta:
      'Tras la consulta inicial se entrega un presupuesto por escrito con alcance y honorarios. Una vez autorizado, se firma contrato de prestación de servicios, se abren los plazos reales del caso y se mantiene al cliente informado en cada hito.',
  },
  {
    pregunta: '¿El bufete tiene experiencia en casos penales complejos?',
    respuesta:
      'Sí. La defensa penal es el pilar histórico: detenciones, audiencias iniciales, medidas cautelares, juicio oral y recursos. Cada caso se evalúa individualmente; la complejidad técnica se aborda con el rigor que el expediente requiere.',
  },
  {
    pregunta: '¿Manejan confidencialidad de la información del cliente?',
    respuesta:
      'Sí. Toda comunicación es estrictamente confidencial y se rige por el secreto profesional del abogado y la normativa hondureña de protección de datos. La información del caso no se comparte sin autorización expresa.',
  },
];

/**
 * /solicitar-consulta — página de contacto/conversión.
 * Intención: usuario con un caso concreto dudando si contactar.
 */
export const FAQ_SOLICITAR_CONSULTA: HubFaqItem[] = [
  {
    pregunta: '¿La primera consulta tiene costo?',
    respuesta:
      'No. La consulta inicial por WhatsApp, llamada o formulario es gratuita y confidencial. Sirve para evaluar el caso y entregar un presupuesto por escrito si se requiere representación formal.',
  },
  {
    pregunta: '¿Cuánto tardan en responder?',
    respuesta:
      `Las consultas se responden en horario hábil (${site.hoursShort}). Los casos urgentes, como detenciones o audiencias inminentes, se priorizan. Para emergencias penales fuera de horario hay línea directa por WhatsApp. No comprometemos respuesta inmediata: el compromiso es atender en horario hábil con la diligencia que cada caso requiere.`,
  },
  {
    pregunta: '¿Qué información debo llevar a la primera consulta?',
    respuesta:
      'Cuantos más datos mejor: documento de identidad, fechas relevantes, contratos o documentos relacionados, nombres de las partes y un resumen breve del problema. Si no tiene documentación aún, el abogado le indicará qué conseguir.',
  },
  {
    pregunta: '¿La información que comparto es confidencial?',
    respuesta:
      'Sí. Toda comunicación está protegida por el secreto profesional del abogado y la normativa hondureña de protección de datos. No se comparte ningún dato sin autorización expresa del cliente.',
  },
  {
    pregunta: '¿Puedo consultar por un familiar?',
    respuesta:
      'Sí. Es habitual en casos de detenciones, custodia o sucesiones. Indique su relación con la persona y el contexto; el abogado le orientará sobre los siguientes pasos y la documentación necesaria.',
  },
  {
    pregunta: '¿Atienden emergencias penales fuera de horario?',
    respuesta:
      `Las detenciones, audiencias iniciales y medidas cautelares urgentes se priorizan. Use el WhatsApp directo (${site.whatsappDisplay}) marcando que es una urgencia penal para activar la atención prioritaria. La disponibilidad efectiva depende del momento y la diligencia concreta; en la primera consulta se confirma el alcance de la asistencia posible.`,
  },
  {
    pregunta: '¿Cómo se fijan los honorarios?',
    respuesta:
      'Los honorarios dependen del tipo de caso, la complejidad y el tiempo estimado. Tras la consulta inicial se entrega un presupuesto por escrito. No se inicia ninguna gestión sin autorización expresa del cliente.',
  },
  {
    pregunta: '¿Cómo se entrega el presupuesto y qué incluye?',
    respuesta:
      'El presupuesto se entrega por escrito tras la consulta inicial. Incluye el alcance del trabajo, las etapas previstas y los honorarios. No se inicia ninguna actuación profesional sin su autorización expresa, así que usted decide con información completa antes de contratar.',
  },
  {
    pregunta: '¿Qué ocurre después del primer contacto?',
    respuesta:
      `Tras recibir su solicitud, el bufete revisa la información en horario hábil (${site.hoursShort}) y le responde por el canal que haya indicado. Si procede, se agenda una consulta y, después, se entrega un presupuesto por escrito. El envío del formulario no implica aceptación formal del asunto: la relación profesional nace únicamente con la firma del contrato de prestación de servicios.`,
  },
  {
    pregunta: '¿Atienden a personas de otras localidades, no solo de Nacaome?',
    respuesta:
      'Sí. La sede física está en Nacaome (Valle), pero el bufete atiende habitualmente en el departamento de Valle, Choluteca y la zona sur de Honduras. La revisión documental y el seguimiento pueden hacerse de forma remota por WhatsApp o videollamada; la presencia presencial en sede judicial o notarial se coordina según la diligencia requerida.',
  },
  {
    pregunta: '¿Trabajan con clientes hondureños residentes en España?',
    respuesta:
      'Sí. Existe un módulo específico de asistencia para hondureños en España: poderes desde el extranjero, divorcios, custodia, sucesiones, trámites documentales y apostilla coordinados entre España y Honduras. Lo que requiere autoridad española (como trámites ante la Administración española) se orienta; lo que corresponde a autoridades hondureñas se gestiona directamente.',
  },
  {
    pregunta: '¿Debo enviar originales de documentos por formulario o correo?',
    respuesta:
      'No. Nunca envíe originales en el primer contacto. Para la evaluación inicial basta con una descripción de la situación y, si los tiene, copias digitales legibles. El abogado le indicará qué documentación adicional conviene aportar y en qué formato, una vez conocido el caso.',
  },
  {
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta:
      'Los medios de pago se acuerdan en el presupuesto por escrito. Para evitar errores y mantener la trazabilidad, los detalles concretos se confirman en la contratación, no en el primer contacto.',
  },
];

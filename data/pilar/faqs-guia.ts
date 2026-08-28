/**
 * FAQ específicas para la página pilar /guia-legal-abogados-honduras.
 *
 * Reglas (AGENTS.md R4, R13, R14):
 *  - NO se inventan datos legales, plazos exactos ni costos fijos.
 *  - Las menciones a normativa se limitan a textos vigentes verificables
 *    (Constitución de Honduras, Código Procesal Penal, CP Decreto 130-2017).
 *  - NO se prometen resultados judiciales.
 *  - Cuando se menciona costo/plazo, va con "depende del caso" y derivación
 *    a consulta específica.
 */

import type { HubFaqItem } from '../faqs-hubs';

export const FAQ_GUIA_LEGAL_HONDURAS: HubFaqItem[] = [
  {
    pregunta: '¿Cómo sé si un abogado está autorizado para ejercer en Honduras?',
    respuesta:
      'Para ejercer legalmente en Honduras, un abogado debe estar colegiado e inscrito en el Colegio de Abogados de Honduras y autorizado por la Corte Suprema de Justicia para el uso del fedatario notarial. Antes de contratar, pida al abogado su número de colegiación y verifique su vigencia. Un abogado formalmente autorizado emite recibos, firma contratos de prestación de servicios y responde por su ejercicio profesional.',
  },
  {
    pregunta: '¿Cuánto cobra un abogado en Honduras?',
    respuesta:
      'No existe una tarifa única. Los honorarios dependen del tipo de asunto, la complejidad, la jurisdicción y el tiempo estimado. Algunos trámites notariales (escrituras, poderes, autenticaciones) tienen aranceles referenciales, pero la mayoría de los casos se presupuestan individualmente. Lo correcto es solicitar un presupuesto por escrito antes de iniciar cualquier gestión, con alcance claro y desglose de honorarios.',
  },
  {
    pregunta: '¿Qué documentos debo llevar a la primera consulta con un abogado?',
    respuesta:
      'Documentos de identidad de las partes involucradas, fechas relevantes (hechos, notificaciones, vencimientos), contratos o acuerdos previos, correspondencia relacionada con el caso, resoluciones judiciales o administrativas si las hubiera, y un resumen escrito de los hechos. Si no tiene documentación, el abogado le indicará qué conseguir y cómo obtenerla.',
  },
  {
    pregunta: '¿La primera consulta tiene costo?',
    respuesta:
      'Eso depende del despacho. En Pineda y Asociados la evaluación inicial es confidencial: permite entender el caso, plantear una estrategia inicial y entregar un presupuesto por escrito. Solo se generan honorarios cuando el cliente autoriza por escrito la representación formal.',
  },
  {
    pregunta: '¿Qué pasa si no estoy de acuerdo con mi abogado actual?',
    respuesta:
      'El cliente puede cambiar de abogado en cualquier momento. Lo recomendable es revisar el contrato de prestación de servicios firmado, regularizar los honorarios devengados hasta la fecha y solicitar el expediente completo. El nuevo abogado necesitará copia de todas las actuaciones para continuar el caso sin perder plazos procesales.',
  },
  {
    pregunta: '¿Un abogado puede garantizar el resultado de un caso?',
    respuesta:
      'No. Ningún abogado serio puede garantizar un resultado judicial. El desenlace de un caso depende de pruebas, testigos, criterio del juzgador y circunstancias procesales. Lo que sí puede garantizar un bufete es trabajo técnico riguroso, cumplimiento de plazos, comunicación clara y respeto al secreto profesional.',
  },
  {
    pregunta: '¿Puedo atender mi caso sin abogado?',
    respuesta:
      'En Honduras, la asistencia de abogado es obligatoria en la mayoría de procesos judiciales (penal, civil, laboral, familia). En materia penal el derecho a defensa técnica es constitucional desde el primer momento. Comparecer sin abogado a un proceso formal expone al ciudadano a errores procesales difíciles de reparar. Para consultas puntuales o trámites administrativos simples puede no ser necesario, pero conviene asesoría previa.',
  },
  {
    pregunta: '¿Qué debo firmar al contratar un abogado?',
    respuesta:
      'Un contrato de prestación de servicios profesionales con: identificación de las partes, objeto del servicio, honorarios y forma de pago, obligaciones del abogado y del cliente, causales de terminación y cláusula de confidencialidad. Evite acuerdos verbales: siempre pida el contrato por escrito y conserve copia firmada.',
  },
];

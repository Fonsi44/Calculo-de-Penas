/**
 * FAQ pública del bufete — preguntas generales sobre el despacho.
 *
 * Siguiendo el plan maestro §13, la FAQ general solo contiene preguntas
 * sobre el despacho (10–15). Las preguntas jurídicas por área viven en
 * sus respectivas páginas de servicio (data/areas-juridicas.ts) y en los
 * hubs FAQ específicos (data/faqs-hubs.ts). Esto evita duplicación,
 * canibalización y respuestas inconsistentes entre URLs.
 *
 * Categorías jurídicas eliminadas de aquí (distribuidas por área):
 *   derecho-penal-general → /derecho-penal (FAQ en data/areas-juridicas.ts)
 *   asistencia-detenidos  → /derecho-penal
 *   proceso-penal         → /derecho-penal
 *   derecho-de-familia    → /servicios-juridicos/derecho-de-familia
 *   derecho-laboral       → /servicios-juridicos/derecho-laboral
 *   derecho-civil         → /servicios-juridicos/derecho-civil-y-notarial
 *   derecho-mercantil     → /servicios-juridicos/derecho-mercantil
 *   extranjeria-migracion → /servicios-juridicos/extranjeria-migracion
 *   tributario-sar        → /servicios-juridicos/tributario
 *   otras-areas           → páginas de servicio específicas
 */

export type FaqCategory = {
  slug: string;
  titulo: string;
  descripcion: string;
  preguntas: { pregunta: string; respuesta: string }[];
};

export const categoriasFaq: FaqCategory[] = [
  /* ------------------------------------------------------------------------ */
  /* 1. EL BUFETE Y HONORARIOS                                               */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'bufete-honorarios',
    titulo: 'El Bufete y Honorarios',
    descripcion: 'Cómo trabajamos, qué esperar de nuestros servicios y preguntas sobre honorarios.',
    preguntas: [
      {
        pregunta: '¿Dónde está ubicado el despacho?',
        respuesta: 'Nuestra sede física está en Nacaome, Valle. Atendemos principalmente la zona sur de Honduras. Para más información sobre nuestra ubicación y horario, visite nuestra página de contacto.',
      },
      {
        pregunta: '¿Atienden fuera de Nacaome?',
        respuesta: 'Sí, atendemos casos de toda la zona sur de Honduras, incluyendo San Lorenzo, Choluteca, Goascorán, Amapala y municipios aledaños. Podemos desplazarnos cuando el caso lo requiera y coordinar consultas virtuales.',
      },
      {
        pregunta: '¿Ofrecen evaluación inicial sin costo?',
        respuesta: 'Sí, ofrecemos una evaluación inicial confidencial sin costo para conocer su caso y determinar el área jurídica correspondiente. Esta consulta no le obliga a contratar nuestros servicios.',
      },
      {
        pregunta: '¿Cómo funciona la evaluación inicial?',
        respuesta: 'Tras recibir su solicitud, revisamos la información en horario hábil y le respondemos por el canal indicado. Si procede, agendamos una consulta. Después, se entrega un presupuesto por escrito antes de iniciar cualquier actuación.',
      },
      {
        pregunta: '¿Qué documentos debo llevar a la consulta?',
        respuesta: 'No envíe originales en el primer contacto. Para la evaluación inicial basta con una descripción de la situación y, si los tiene, copias digitales de documentos relacionados. El abogado le indicará qué documentación adicional conviene aportar.',
      },
      {
        pregunta: '¿Cómo se determinan los honorarios?',
        respuesta: 'Los honorarios dependen de la complejidad, la urgencia y las etapas previstas del caso. Trabajamos con honorarios fijos por caso o cuotas periódicas según la naturaleza del asunto. En todos los casos se entregan por escrito y se acuerdan previamente.',
      },
      {
        pregunta: '¿Entregan presupuesto por escrito?',
        respuesta: 'Sí. Tras la consulta inicial se entrega un presupuesto por escrito con el alcance del trabajo, las etapas previstas y los honorarios. Ninguna actuación se inicia sin su autorización expresa.',
      },
      {
        pregunta: '¿La consulta es confidencial?',
        respuesta: 'Sí. Toda comunicación está protegida por el secreto profesional del abogado y la normativa hondureña de protección de datos. No compartimos ningún dato sin autorización expresa del cliente.',
      },
      {
        pregunta: '¿Quién atenderá mi caso?',
        respuesta: 'Cada caso se asigna al abogado responsable según el área de práctica. Cuando el asunto es transversal, cuenta con revisión de un segundo profesional del equipo. Puede conocer a nuestros abogados en la página de equipo.',
      },
      {
        pregunta: '¿Atienden urgencias penales?',
        respuesta: 'Las detenciones, audiencias iniciales y medidas cautelares urgentes se priorizan. Para activar atención prioritaria, utilice nuestro WhatsApp indicando que es una urgencia penal. Atendemos en horario hábil con la diligencia que cada caso requiere.',
      },
      {
        pregunta: '¿Puedo consultar desde el extranjero?',
        respuesta: 'Sí. Atendemos consultas virtuales y podemos representarlo mediante poder notarial. Trabajamos con hondureños residentes en Estados Unidos, España y otros países.',
      },
      {
        pregunta: '¿Una consulta garantiza que aceptarán mi caso?',
        respuesta: 'No. La evaluación inicial es informativa y no implica aceptación del caso. La relación profesional nace únicamente con la firma del contrato de prestación de servicios jurídicos.',
      },
    ],
  },
];

export const totalPreguntas = categoriasFaq.reduce(
  (acc, cat) => acc + cat.preguntas.length,
  0,
);

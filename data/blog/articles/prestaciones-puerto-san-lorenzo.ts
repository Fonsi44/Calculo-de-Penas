/**
 * Artículo editorial Sprint 3 #6.
 * Fuente versionada. Persistencia = DB `blog_posts`. Upsert dry-run por defecto.
 * Ángulo puerto / San Lorenzo. Sin sucursal inventada. Citas CT verificadas.
 */

export const PRESTACIONES_PUERTO_SAN_LORENZO_ARTICLE = {
  slug: 'prestaciones-puerto-san-lorenzo',
  category: 'derecho-laboral',
  title: 'Prestaciones de trabajadores del puerto de San Lorenzo',
  description:
    'Qué documentos reunir si trabaja en el puerto de San Lorenzo y le deben prestaciones. Se atiende desde Nacaome. Sin montos inventados.',
  metaTitle: 'Prestaciones en el puerto de San Lorenzo',
  metaDescription:
    'Prestaciones en el puerto de San Lorenzo: planilla, contrato y qué no firmar. Evaluación desde Nacaome. Los importes dependen del expediente.',
  author: 'Pineda y Asociados',
  tags: [
    'prestaciones San Lorenzo',
    'puerto Valle laboral',
    'despido puerto',
    'derecho laboral',
  ],
  coverImage: '/images/blog/calcular-prestaciones-laborales-honduras.webp',
  readingTime: '5 min',
  published: true,
  noindex: false,
  reviewStatus: 'published',
  canonicalPath: '/blog/derecho-laboral/prestaciones-puerto-san-lorenzo',
  publishedAt: '2026-08-15T18:00:00.000Z',
  body: `<h2>Respuesta directa</h2>
<p>Si trabaja o trabajó en el puerto de San Lorenzo —carga, pesca, comercio, zona libre o servicios al muelle— y le deben salario, vacaciones o una liquidación, el punto de partida es la documentación, no una cifra de pasillo. Esta nota no crea un cargo “laboralista San Lorenzo”. Se atiende desde Nacaome. No sustituye al servicio de <a href="/servicios-juridicos/derecho-laboral">derecho laboral</a> ni a la guía de <a href="/blog/derecho-laboral/calcular-prestaciones-laborales-honduras">cálculo de prestaciones en Honduras</a>.</p>
<p>San Lorenzo es el puerto del sur de Valle, a unos 17 km de la sede. La landing de <a href="/abogados-en-san-lorenzo">abogados en San Lorenzo</a> explica esa logística. Aquí va el ángulo económico: qué guardar si el trabajo es portuario o comercial de esa zona.</p>

<h2>Qué documentos importan en el puerto</h2>
<p>Contrato o acuerdo verbal con fecha de ingreso, turno y lugar de prestación (muelle, bodega, patio, oficina). Planillas, recibos, transferencias y cualquier “adelanto” que le descuenten. Credenciales de acceso, órdenes de turno, mensajes de “hoy no hay barco” o de cambio de jornada. Si hay empresa contratista y empresa principal, anote ambos nombres: la legitimación se revisa con el expediente, no se inventa aquí.</p>
<p>El art. 116 CT regula el preaviso en contratos indefinidos según el tiempo de servicio. El art. 117 CT exige expresar la causa al terminar y no cambiarla después. El art. 345 CT, en despido injustificado, contempla el pago de la parte de vacaciones del periodo trabajado, además de las indemnizaciones que correspondan. No publicamos un monto “típico del puerto”: jornada, recargos y antigüedad varían.</p>
<p>Para auxilio de cesantía e indemnizaciones por despido injustificado, el <strong>art. 123 CT, literal b)</strong>, exige calcular sobre el <strong>promedio de los salarios devengados en los días efectivamente trabajados durante los últimos seis (6) meses</strong> de vigencia del contrato, conforme a la interpretación auténtica del <strong>Decreto 65-1966</strong>. No basta la última planilla bruta: hay que promediar lo realmente devengado en ese semestre.</p>
<p>Si lo despidieron y tiene carta o finiquito, léalo con el abogado antes de cobrar a ciegas. La nota de <a href="/blog/derecho-laboral/despido-valle-documentos-evaluacion">despido en el sur de Valle</a> cubre el paquete planilla-contrato-carta. Esta página añade el contexto portuario: turnos, empresas superpuestas y trabajo intermitente.</p>

<h2>Errores frecuentes</h2>
<p>Aceptar que “en el puerto siempre se paga así” y no pedir desglose. La costumbre no borra el Código de Trabajo.</p>
<p>Firmar un finiquito global sin separar salario, vacaciones y otros conceptos. Después cuesta saber qué quedó pendiente.</p>
<p>Pensar que hay oficina del bufete dentro del recinto portuario. No la hay. La sede es la <a href="/abogados-en-nacaome">oficina en Nacaome</a>.</p>
<p>Usar una calculadora de internet como liquidación oficial. Este despacho no entrega cifra universal; el spoke laboral lo advierte.</p>

<h2>Cómo se evalúa desde Nacaome</h2>
<p><a href="/equipo/emil-barahona">Emil Barahona</a> atiende laboral. El horario es de lunes a sábado, de 7:00 a 20:00. Puede pedir una <a href="/solicitar-consulta#formulario">evaluación inicial confidencial</a> indicando empresa, puesto, fechas y si el trabajo era por turno, obra o tiempo indefinido. No prometemos un monto ni un plazo de cobro. Los importes y la vía (inspección, conciliación o juzgado) dependen del expediente.</p>
<p>La estrategia sigue en el spoke de <a href="/servicios-juridicos/derecho-laboral">derecho laboral</a>.</p>

<h2>Límites de esta nota</h2>
<p>No inventamos un régimen laboral “del puerto” distinto del Código de Trabajo. Turnos, recargos y empresas contratistas se prueban con documentos. Si hay zona libre o un empleador con casa matriz fuera de Valle, dígalo: la notificación y la legitimación se revisan, no se asumen.</p>
<p>Tampoco prometemos cobro en una fecha ni un porcentaje de éxito. La vía puede ser inspección, conciliación o juzgado según el caso. La <a href="/abogados-en-nacaome">oficina en Nacaome</a> queda a unos 17 km; el horario es de lunes a sábado, de 7:00 a 20:00. Si el despido acaba de ocurrir, priorice no firmar el finiquito y escribir a Emil con los PDF que tenga.</p>
<p>Si además hay un contrato mercantil, un flete o un reclamo contra un consignatario, sepárelo del reclamo laboral: son vías distintas. Esta nota solo cubre la relación de trabajo ligada al puerto. El spoke laboral sigue siendo la URL de dinero; San Lorenzo es el contexto económico, no una sucursal.</p>`
} as const;

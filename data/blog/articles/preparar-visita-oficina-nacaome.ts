/**
 * Artículo editorial Sprint 3 #10.
 * Fuente versionada. Persistencia = DB `blog_posts`. Upsert dry-run por defecto.
 * Logística de sede. No abre ciudad nueva. Horario canónico lun–sáb 7:00–20:00.
 */

export const PREPARAR_VISITA_OFICINA_NACAOME_ARTICLE = {
  slug: 'preparar-visita-oficina-nacaome',
  category: 'practica-legal',
  title: 'Cómo preparar la visita a la oficina en Nacaome',
  description:
    'Cómo llegar a la oficina en Nacaome, qué documentos llevar y qué esperar de la evaluación inicial. Horario lun–sáb 7:00–20:00. Sin 24/7.',
  metaTitle: 'Preparar la visita a la oficina en Nacaome',
  metaDescription:
    'Visita a la oficina en Nacaome: cómo llegar, qué llevar y horario lun–sáb 7:00–20:00. Evaluación inicial confidencial. Sin 24/7 operativo.',
  author: 'Pineda y Asociados',
  tags: [
    'oficina Nacaome',
    'cómo llegar bufete Valle',
    'evaluación inicial confidencial',
    'práctica legal',
  ],
  coverImage: '/images/blog/contratos-arrendamiento-derechos-obligaciones-honduras.webp',
  readingTime: '5 min',
  published: true,
  noindex: false,
  reviewStatus: 'published',
  canonicalPath: '/blog/practica-legal/preparar-visita-oficina-nacaome',
  publishedAt: '2026-08-15T22:00:00.000Z',
  body: `<h2>Respuesta directa</h2>
<p>La única sede física está en Nacaome, Valle. Si viene de San Lorenzo, Choluteca u otro municipio, prepare documentos y un relato breve: la visita rinde más. Esta nota no abre ciudades nuevas ni sustituye a la landing de <a href="/abogados-en-nacaome">abogados en Nacaome</a>. Ahí está el mapa y el servicio; aquí, cómo preparar la cita.</p>
<p>La dirección publicada es GGJ7+239, Nacaome, Valle: cuadra y media al este de Hondutel, contiguo a Clínica Dental Dra. ANDARA. El horario de oficina es de lunes a sábado, de 7:00 a 20:00. No hay atención continua fuera de ese horario. Si escribe fuera de ese horario, puede dejar el mensaje; no prometemos respuesta ni presencia inmediata.</p>

<h2>Qué llevar, según el tema</h2>
<p>Penal: citación, actas, boletas, nombre del juzgado y si hay persona detenida. Familia: partidas, sentencia o convenio, gastos e ingresos. Laboral: planilla, contrato, carta de despido o finiquito. Civil: borrador del contrato, título, recibos de arras. Si no tiene todo, traiga lo que haya y una lista de lo que falta. No invente papeles “para completar”.</p>
<p>Lleve identificación. Si viene otra persona en su nombre, traiga autorización o poder; si no, explíquelo al agendar. Una visita no es un juicio: es para ordenar hechos, ver vías y, si procede, un presupuesto por escrito.</p>
<p>Si el asunto es una detención en curso, lea primero la nota de <a href="/blog/derecho-penal/detencion-familiar-nacaome-primeras-horas">primeras horas en Nacaome</a> y escriba por WhatsApp: a veces no conviene esperar a la cita presencial.</p>

<h2>Cómo llegar y qué no esperar</h2>
<p>Desde San Lorenzo son unos 17 km; desde Choluteca, unos 55 km por la CA-1. Los tiempos de carretera varían. No hay sucursal en esas ciudades. Las landings de <a href="/abogados-en-san-lorenzo">San Lorenzo</a> y <a href="/abogados-en-choluteca">Choluteca</a> lo dicen: se atiende desde Nacaome. Las nueve ciudades sin contenido local propio no se indexan como oficina.</p>
<p>No espere un diagnóstico instantáneo ni una promesa de resultado al cruzar la puerta. La <a href="/solicitar-consulta#formulario">evaluación inicial confidencial</a> sirve para ver si el despacho puede ayudar y a qué costo. Penal lo atiende <a href="/equipo/danilo-pineda-maradiaga">Danilo Pineda Maradiaga</a>; familia y buena parte de civil, <a href="/equipo/thania-marlene-paz">Thania Marlene Paz</a>; laboral, <a href="/equipo/emil-barahona">Emil Barahona</a>.</p>

<h2>Errores frecuentes</h2>
<p>Llegar sin cita en hora pico y con el menor o con testigos que no hacen falta. Agende y diga el tema: así está el profesional correcto.</p>
<p>Pedir un resultado asegurado o una formulación comercial no autorizada. La formulación pública es evaluación inicial confidencial. El presupuesto, si hay representación, va por escrito.</p>
<p>Traer solo el teléfono y un relato largo sin fechas. Cinco hechos datados valen más que una hora de enojo.</p>

<h2>Cómo agendar</h2>
<p>Use el formulario o WhatsApp indicando ciudad de origen, tema (penal, familia, laboral, civil) y si ya hay fecha de audiencia. El horario es de lunes a sábado, de 7:00 a 20:00. La página canónica para llegar sigue siendo <a href="/abogados-en-nacaome">abogados en Nacaome</a>.</p>

<h2>Límites de esta nota</h2>
<p>No es una guía turística ni un directorio de las nueve ciudades sin contenido local propio. Esas landings no se indexan como oficina. Si viene de un municipio noindex, igual se le atiende en Nacaome; no le creamos una URL de ciudad.</p>
<p>Tampoco es el hub de cada área. Penal, familia, laboral y civil tienen spoke y, en Nacaome, cargo ya publicado. Esta visita sirve para no llegar con las manos vacías y para no esperar un horario ininterrumpido que el despacho no ofrece. Si solo necesita el mapa, use la landing de Nacaome; si ya tiene un expediente, traiga el PDF y las fechas.</p>
<p>Si viene con un menor, avise: a veces conviene que espere fuera. Si necesita una llamada en lugar de la visita, dígalo al agendar. El despacho no promete un formato único para todos los casos.</p>`
} as const;

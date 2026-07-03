/**
 * Landings locales — páginas de SEO local por ciudad.
 *
 * Foco de búsqueda: "abogados en {ciudad}", "abogado penalista {ciudad}",
 * "bufete de abogados {ciudad}", etc. Son las URLs de mayor intención
 * comercial para un despacho regional en Honduras.
 *
 * Reglas (AGENTS.md §1, §13):
 *  - Solo datos REALES y verificables (servicios del bufete, NAP de Nacaome,
 *    referencias legales al CP Decreto 130-2017 y reformas).
 *  - NO se inventan testimonios, reseñas, número de colegiación ni casos
 *    resueltos. Esos campos se añadirán cuando el bufete aporte datos reales.
 *  - La sede física única es Nacaome; Choluteca y San Lorenzo son ciudades
 *    donde el bufete presta servicios (declaradas en `areaServed` del schema).
 */

export type LandingLocal = {
  /** Slug usado en la URL: /abogados-en-{slug} (o path personalizado si se define) */
  slug: string;
  /** Path canónico personalizado (opcional). Si no se define, se usa /abogados-en-{slug} */
  path?: string;
  /** Nombre de la ciudad para mostrar */
  ciudad: string;
  /** Departamento al que pertenece */
  departamento: string;
  /** True si el bufete tiene sede física allí (afecta NAP y schema) */
  sedeFisica: boolean;
  /** Distancia aproximada en km desde la sede en Nacaome */
  distanciaKm: number;
  /** <title> SEO (≤ 60 chars aprox.) */
  title: string;
  /** Meta description (≤ 155 chars) */
  description: string;
  /** Eyebrow del hero */
  heroEyebrow: string;
  /** H1 del hero */
  heroTitle: string;
  /** Subtítulo del hero */
  heroSubtitle: string;
  /** Párrafo introductorio (tras el hero) — contexto local */
  intro: string;
  /** Servicios destacados para esa ciudad */
  servicios: { titulo: string; descripcion: string }[];
  /** FAQ local (también genera schema FAQPage) */
  faqs: { pregunta: string; respuesta: string }[];
  /** Datos estructurados geográficos */
  geo?: { lat: number; lng: number };
  /** Slugs de posts del blog relacionados con la ciudad (categoría/slug)
   *  para enlazado interno bidireccional landing ↔ blog. */
  postsRelacionados?: { categoria: string; slug: string; titulo: string }[];
};

export const landingsLocales: LandingLocal[] = [
  {
    slug: 'nacaome',
    ciudad: 'Nacaome',
    departamento: 'Valle',
    sedeFisica: true,
    distanciaKm: 0,
    // Title enfocado en intención de búsqueda local primaria.
    // La home usa "${site.name} — ${site.tagline}" (ej: "Pineda y Asociados — Abogados en Nacaome, Valle, Honduras").
    // Esta landing prioriza la keyword exacta "Abogados en Nacaome, Valle".
    // NO incluye el nombre del bufete: el layout lo añade (%s | Pineda y Asociados).
    title: 'Abogados en Nacaome, Valle',
    description:
      'Sede principal de Pineda y Asociados en Nacaome, Valle. Defensa penal, familia, laboral, civil y mercantil. Dirección, horario y WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Sede principal · Valle, Honduras',
    heroTitle: 'Abogados en Nacaome, Valle',
    heroSubtitle:
      'Bufete jurídico con sede en Nacaome. Más de 15 años de ejercicio profesional en la zona sur de Honduras, con defensa penal técnica y asesoría jurídica integral.',
    intro:
      'Nacaome, cabecera del departamento de Valle, concentra gran parte de la actividad judicial y comercial del sur de Honduras. Nuestra sede está ubicada en el centro de la ciudad, cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Atendemos particulares, familias y empresas de Nacaome, San Lorenzo, Amapala y toda la zona sur.',
    servicios: [
      {
        titulo: 'Defensa penal',
        descripcion:
          'Defensa técnica en procesos penales conforme al Código Penal hondureño (Decreto 130-2017) y sus reformas. Acompañamiento desde la detención, audiencia inicial y hasta el juicio oral.',
      },
      {
        titulo: 'Derecho de familia',
        descripcion:
          'Divorcios, pensión alimentaria, custodia, regímenes de visitas y reconocimiento de paternidad ante los juzgados de familia de Valle.',
      },
      {
        titulo: 'Derecho laboral',
        descripcion:
          'Demandas laborales, despido injustificado, reclamación de prestaciones, finiquitos y asesoría a trabajadores y empleadores de Nacaome y la zona costera.',
      },
      {
        titulo: 'Derecho civil y notarial',
        descripcion:
          'Contratos, compraventas, sucesiones, testamentos, constitución de servidumbres y trámites notariales con validez en todo el territorio nacional.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Dónde están ubicados los abogados en Nacaome?',
        respuesta:
          'Nuestra sede está en Nacaome, Valle: GGJ7+239, cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Atendemos de lunes a sábado, de 7:00 a 20:00.',
      },
      {
        pregunta: '¿La primera consulta tiene costo?',
        respuesta:
          'Ofrecemos una primera consulta para evaluar su caso y entregarle un presupuesto por escrito. Puede agendarla por WhatsApp al +504 9536-3724 o mediante el formulario de contacto del sitio.',
      },
      {
        pregunta: '¿Atienden emergencias penales fuera de horario?',
        respuesta:
          'En casos de detención o situaciones urgentes de defensa penal, contáctenos por WhatsApp indicando que es una emergencia. La Constitución de Honduras garantiza el derecho a un abogado desde el primer momento y a ser presentado ante un juez en 24 horas.',
      },
      {
        pregunta: '¿Atienden casos de San Lorenzo y Amapala?',
        respuesta:
          'Sí. Aunque nuestra sede está en Nacaome, atendemos clientes de San Lorenzo, Amapala, Alianza y demás municipios del departamento de Valle.',
      },
    ],
    geo: { lat: 13.53, lng: -87.48 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-nacaome', titulo: 'Abogados en Nacaome: cómo elegir el despacho adecuado' },
      { categoria: 'practica-legal', slug: 'tramites-legales-nacaome', titulo: 'Trámites legales en Nacaome, Valle' },
    ],
  },
  {
    slug: 'choluteca',
    ciudad: 'Choluteca',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 52,
    // NO incluye nombre del bufete: el layout añade "| Pineda y Asociados".
    title: 'Abogados en Choluteca, Honduras',
    description:
      'Abogados en Choluteca, Honduras. Defensa penal, familia, laboral, mercantil y aduanero. Atención desde nuestra sede en Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Zona sur · Choluteca, Honduras',
    heroTitle: 'Abogados en Choluteca',
    heroSubtitle:
      'Atendemos a clientes de Choluteca y el sur de Honduras en defensa penal, derecho de familia, laboral, mercantil y aduanero, con el respaldo de un bufete jurídico de la región.',
    intro:
      'Choluteca es la ciudad más poblada del sur de Honduras y un centro comercial y aduanero clave por su cercanía con la frontera de Nicaragua. Atendemos casos de clientes de Choluteca, Marcovia, San Marcos de Colón y el corredor de la Carretera Panamericana, coordinando audiencias y diligencias ante los juzgados de la región.',
    servicios: [
      {
        titulo: 'Defensa penal',
        descripcion:
          'Representación en procesos penales en Choluteca conforme al Código Penal hondureño (Decreto 130-2017) y reformas. Acompañamiento en audiencias, medidas cautelares y juicio oral.',
      },
      {
        titulo: 'Derecho aduanero y comercio exterior',
        descripcion:
          'Asesoría sobre regímenes aduaneros, importaciones y trámites en la frontera de Guasaule, un corredor comercial clave del sur de Honduras.',
      },
      {
        titulo: 'Derecho laboral',
        descripcion:
          'Reclamación de prestaciones, despidos, finiquitos y asesoría laboral para trabajadores y empresas agrícolas, comerciales y de servicios de Choluteca.',
      },
      {
        titulo: 'Derecho de familia',
        descripcion:
          'Divorcios, pensión alimentaria, custodia y visitas ante los juzgados de familia con competencia en el departamento de Choluteca.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Tienen oficina en Choluteca?',
        respuesta:
          'Nuestra sede física está en Nacaome, a unos 50 km de Choluteca. Atendemos a clientes de Choluteca desde esa oficina y coordinamos las diligencias y audiencias necesarias en los juzgados de Choluteca.',
      },
      {
        pregunta: '¿Atienden casos penales en Choluteca?',
        respuesta:
          'Sí. Asumimos la defensa penal en Choluteca conforme al Código Penal hondureño vigente (Decreto 130-2017 y reformas), incluyendo la audiencia inicial, medidas cautelares y juicio oral.',
      },
      {
        pregunta: '¿Manejan casos de derecho aduanero en Guasaule?',
        respuesta:
          'Sí. Asesoramos en materia aduanera y de comercio exterior, incluyendo regímenes de importación y trámites relacionados con la frontera de Guasaule.',
      },
      {
        pregunta: '¿Cómo agendo una consulta siendo de Choluteca?',
        respuesta:
          'Puede coordinar por WhatsApp al +504 9536-3724 o por el formulario de la web. Acordamos el medio de atención (presencial en Nacaome o coordinación para diligencias en Choluteca) según su caso.',
      },
    ],
    geo: { lat: 13.3, lng: -87.17 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-choluteca', titulo: 'Abogados en Choluteca: guía para elegir despacho' },
    ],
  },
  {
    slug: 'san-lorenzo',
    ciudad: 'San Lorenzo',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 17,
    // NO incluye nombre del bufete: el layout añade "| Pineda y Asociados".
    title: 'Abogados en San Lorenzo, Valle (Puerto)',
    description:
      'Abogados en San Lorenzo, Valle (Honduras). Puerto y zona comercial del sur. Defensa penal, mercantil, laboral, civil y aduanero. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Puerto y zona comercial · Valle, Honduras',
    heroTitle: 'Abogados en San Lorenzo, Valle',
    heroSubtitle:
      'Atendemos a clientes de San Lorenzo, el principal puerto del sur de Honduras, en materia mercantil, aduanera, laboral, civil y penal, con respaldo multidisciplinario de la región.',
    intro:
      'San Lorenzo es el principal puerto marítimo del sur de Honduras y un centro comercial dinámico del departamento de Valle, a escasos 17 km de nuestra sede en Nacaome. Atendemos a importadores, comerciantes, empresas pesqueras, particulares y familias de San Lorenzo y la zona costera.',
    servicios: [
      {
        titulo: 'Derecho mercantil y empresarial',
        descripcion:
          'Constitución de sociedades, contratos comerciales, cobro de cartera y asesoría a empresas con operaciones en el puerto de San Lorenzo.',
      },
      {
        titulo: 'Derecho aduanero y portuario',
        descripcion:
          'Asesoría en regímenes aduaneros, importaciones, Zonas Libres y trámites vinculados a la actividad comercial y portuaria del sur.',
      },
      {
        titulo: 'Derecho laboral',
        descripcion:
          'Asesoría laboral y reclamación de prestaciones para trabajadores y empleadores del comercio, la pesca y los servicios de San Lorenzo.',
      },
      {
        titulo: 'Defensa penal y civil',
        descripcion:
          'Representación en procesos penales y civiles conforme a la legislación hondureña vigente, ante los juzgados con competencia en Valle.',
      },
    ],
    faqs: [
      {
        pregunta: '¿Atienden a empresas del puerto de San Lorenzo?',
        respuesta:
          'Sí. Asesoramos a empresas de comercio, importación, pesca y servicios de San Lorenzo en materia mercantil, laboral y aduanera.',
      },
      {
        pregunta: '¿Están cerca de San Lorenzo?',
        respuesta:
          'Nuestra sede está en Nacaome, a unos 17 km de San Lorenzo. La cercanía permite coordinar atención presencial y seguimiento de diligencias con rapidez.',
      },
      {
        pregunta: '¿Manejan casos de importación y aduanas?',
        respuesta:
          'Sí. Atendemos asuntos de derecho aduanero y comercio exterior vinculados a la actividad del puerto y las Zonas Libres de la región.',
      },
      {
        pregunta: '¿Cómo solicito un presupuesto por escrito?',
        respuesta:
          'Escríbanos por WhatsApp al +504 9536-3724 o use el formulario de contacto. Tras una primera evaluación, le entregamos un presupuesto por escrito del servicio.',
      },
    ],
    geo: { lat: 13.42, lng: -87.45 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-san-lorenzo', titulo: 'Abogados en San Lorenzo: asesoría legal en el puerto' },
    ],
  },
  {
    slug: 'goascoran',
    ciudad: 'Goascorán',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 35,
    title: 'Abogados en Goascorán, Valle — Consulta Jurídica',
    description:
      'Abogados en Goascorán, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724. Primera consulta sin costo.',
    heroEyebrow: 'Zona fronteriza · Valle, Honduras',
    heroTitle: 'Abogados en Goascorán, Valle',
    heroSubtitle:
      'Atendemos a clientes de Goascorán y la zona fronteriza con El Salvador. Defensa penal, derecho de familia, laboral, civil y notarial con bufete de la región.',
    intro:
      'Goascorán, municipio fronterizo del departamento de Valle, conecta Honduras con El Salvador por el Puente La Amistad. A 35 km de nuestra sede en Nacaome, atendemos a familias, comerciantes y trabajadores de Goascorán y sus alrededores con servicios jurídicos integrales.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño. Acompañamiento desde la detención, audiencia inicial y juicio oral para residentes de Goascorán.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimentaria, custodia de menores y régimen de visitas ante los juzgados de familia con competencia en Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos injustificados, finiquitos y asesoría para trabajadores agrícolas y comerciales de Goascorán.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales, trámites de propiedad y asesoría en derecho civil para la zona fronteriza.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Goascorán?', respuesta: 'Nuestra sede está en Nacaome, a 35 km de Goascorán. Coordinamos diligencias en la zona y ofrecemos atención por WhatsApp y teléfono para casos en Goascorán y la región fronteriza.' },
      { pregunta: '¿Atienden casos penales en Goascorán?', respuesta: 'Sí. Asumimos la defensa penal en Goascorán y todo el departamento de Valle conforme al Código Penal hondureño vigente, incluyendo audiencias y medidas cautelares.' },
      { pregunta: '¿Cómo agendo una consulta desde Goascorán?', respuesta: 'Puede contactarnos por WhatsApp al +504 9536-3724 o mediante el formulario de esta web. Acordamos el medio de atención según la urgencia y tipo de caso.' },
      { pregunta: '¿Ofrecen primera consulta sin costo?', respuesta: 'Sí. Realizamos una primera evaluación de su caso sin costo y le entregamos un presupuesto por escrito antes de iniciar cualquier gestión.' },
    ],
    geo: { lat: 13.58, lng: -87.73 },
  },
  {
    slug: 'amapala',
    ciudad: 'Amapala',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 40,
    title: 'Abogados en Amapala, Valle — Defensa Legal en el Sur',
    description:
      'Abogados en Amapala, Valle (Honduras). Defensa penal, familia, laboral y asesoría portuaria. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Isla y puerto · Valle, Honduras',
    heroTitle: 'Abogados en Amapala, Valle',
    heroSubtitle:
      'Atendemos a clientes de Amapala (Isla del Tigre) y el Golfo de Fonseca. Defensa penal, derecho de familia, laboral y asesoría legal para el sector portuario y pesquero.',
    intro:
      'Amapala, municipio insular del departamento de Valle en el Golfo de Fonseca, es un puerto histórico y destino turístico del sur de Honduras. A 40 km de Nacaome, prestamos servicios jurídicos a residentes, comerciantes, pescadores y empresas de la isla y sus alrededores.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación penal conforme al Código Penal hondureño para residentes de Amapala. Asistencia en detenciones, audiencias y juicio oral.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos de familia ante los juzgados del departamento de Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría laboral para trabajadores del sector pesquero, turístico y comercial de Amapala.' },
      { titulo: 'Derecho mercantil y portuario', descripcion: 'Constitución de empresas, contratos comerciales y asesoría legal para negocios del sector portuario y turístico de la isla.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Amapala?', respuesta: 'Nuestra sede está en Nacaome, a unos 40 km de Amapala. Coordinamos la atención por teléfono, WhatsApp y podemos desplazarnos cuando el caso lo requiera.' },
      { pregunta: '¿Atienden casos urgentes en Amapala?', respuesta: 'Sí. Para detenciones o situaciones penales urgentes, contáctenos de inmediato por WhatsApp. La ley garantiza el derecho a un abogado desde el primer momento.' },
      { pregunta: '¿Qué servicios ofrecen al sector pesquero?', respuesta: 'Asesoramos en derecho laboral, mercantil y civil a empresas y trabajadores del sector pesquero y portuario de Amapala y el Golfo de Fonseca.' },
      { pregunta: '¿Cómo solicito una consulta desde Amapala?', respuesta: 'Escríbanos por WhatsApp al +504 9536-3724 indicando que es de Amapala. Evaluamos su caso y le damos un presupuesto por escrito sin compromiso.' },
    ],
    geo: { lat: 13.3, lng: -87.65 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-amapala-valle', titulo: 'Abogados en Amapala: guía legal completa' },
    ],
  },
  {
    slug: 'pespire',
    ciudad: 'Pespire',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 70,
    title: 'Abogados en Pespire, Choluteca — Asesoría Legal',
    description:
      'Abogados en Pespire, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome para todo el sur. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Pespire, Choluteca',
    heroSubtitle:
      'Atendemos a clientes de Pespire y municipios cercanos de Choluteca. Defensa penal, derecho de familia, laboral y civil con bufete del sur de Honduras.',
    intro:
      'Pespire es un municipio del departamento de Choluteca con fuerte tradición agropecuaria y comercial. A 70 km de Nacaome, ofrecemos servicios jurídicos integrales a los residentes de Pespire y las comunidades vecinas del corredor sur.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño para residentes de Pespire. Asistencia en audiencias y defensa técnica.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y procesos familiares ante los juzgados con competencia en el departamento de Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas y comerciales de Pespire y alrededores.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas de terrenos, poderes notariales y trámites de propiedad para residentes de Pespire.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Pespire?', respuesta: 'Nuestra sede principal está en Nacaome, Valle. Atendemos a clientes de Pespire de forma remota con coordinación presencial cuando es necesario, a 70 km de distancia.' },
      { pregunta: '¿Qué tipo de casos atienden en Pespire?', respuesta: 'Principalmente derecho de familia, laboral, penal y civil. También trámites notariales y asesoría en contratos y propiedad.' },
      { pregunta: '¿Cómo me contacto si vivo en Pespire?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono o videollamada para su comodidad.' },
      { pregunta: '¿Cuánto cuesta una consulta jurídica?', respuesta: 'La primera consulta de evaluación no tiene costo. Tras analizar su caso, le entregamos un presupuesto por escrito para que decida sin compromiso.' },
    ],
    geo: { lat: 13.59, lng: -87.36 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-pespire-choluteca', titulo: 'Abogados en Pespire: asesoría legal en 4 áreas' },
    ],
  },
  {
    slug: 'san-marcos-de-colon',
    ciudad: 'San Marcos de Colón',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 80,
    title: 'Abogados en San Marcos de Colón, Choluteca',
    description:
      'Abogados en San Marcos de Colón, Choluteca. Defensa penal, familia, laboral, civil y mercantil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Frontera sur · Choluteca, Honduras',
    heroTitle: 'Abogados en San Marcos de Colón',
    heroSubtitle:
      'Atendemos a clientes de San Marcos de Colón y la zona fronteriza con Nicaragua. Defensa penal, derecho de familia, laboral, civil y mercantil en el sur de Honduras.',
    intro:
      'San Marcos de Colón, municipio del departamento de Choluteca cercano a la frontera con Nicaragua, combina actividad agrícola, ganadera y comercial. A 80 km de Nacaome, ofrecemos servicios jurídicos a los residentes de San Marcos de Colón y comunidades aledañas.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en delitos conforme al Código Penal hondureño. Defensa técnica para residentes de San Marcos de Colón y la zona fronteriza.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y procesos familiares ante los juzgados con competencia en Choluteca.' },
      { titulo: 'Derecho mercantil y aduanero', descripcion: 'Asesoría en comercio fronterizo, contratos mercantiles y trámites aduaneros en la zona de El Espino y Guasaule.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes, trámites notariales y asesoría en propiedad para la zona de San Marcos de Colón.' },
    ],
    faqs: [
      { pregunta: '¿Atienden en San Marcos de Colón?', respuesta: 'Sí. Aunque nuestra sede está en Nacaome, prestamos servicios a clientes de San Marcos de Colón con coordinación de diligencias en la zona fronteriza.' },
      { pregunta: '¿Manejan trámites aduaneros y fronterizos?', respuesta: 'Sí. Asesoramos en materia aduanera, comercio exterior y trámites relacionados con las fronteras de El Espino y Guasaule.' },
      { pregunta: '¿Ofrecen consulta a distancia?', respuesta: 'Sí. Puede iniciar su consulta por WhatsApp o teléfono. Si se requiere presencia, coordinamos el desplazamiento a San Marcos de Colón.' },
      { pregunta: '¿Qué áreas del derecho cubren?', respuesta: 'Derecho penal, de familia, laboral, civil, mercantil y aduanero. Somos un bufete multidisciplinario del sur de Honduras.' },
    ],
    geo: { lat: 13.43, lng: -86.82 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-san-marcos-de-colon-choluteca', titulo: 'Abogados en San Marcos de Colón: defensa y asesoría' },
    ],
  },
  {
    slug: 'marcovia',
    ciudad: 'Marcovia',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 60,
    title: 'Abogados en Marcovia, Choluteca — Guía Legal',
    description:
      'Abogados en Marcovia, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Marcovia, Choluteca',
    heroSubtitle:
      'Servicios jurídicos para residentes de Marcovia y el sur de Choluteca. Defensa penal, derecho de familia, laboral y civil con bufete de la zona sur de Honduras.',
    intro:
      'Marcovia es un municipio del departamento de Choluteca con importante actividad agrícola, camaronera y comercial en el sur de Honduras. A 60 km de Nacaome, brindamos asesoría legal integral a los residentes de Marcovia y sus comunidades.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño. Asistencia en audiencias y acompañamiento legal para residentes de Marcovia.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados de Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores del sector agrícola, camaronero y comercial de Marcovia.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de Marcovia y la zona sur.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Marcovia?', respuesta: 'Nuestra sede está en Nacaome, a unos 60 km de Marcovia. Atendemos a clientes de Marcovia con coordinación remota y presencial cuando el caso lo requiere.' },
      { pregunta: '¿Atienden casos laborales en Marcovia?', respuesta: 'Sí. Reclamamos prestaciones, despidos injustificados y asesoramos a trabajadores de los sectores agrícola, camaronero y comercial de Marcovia.' },
      { pregunta: '¿Cómo inicio una consulta legal?', respuesta: 'Contáctenos por WhatsApp al +504 9536-3724 o use el formulario web. Evaluamos su caso sin costo y le damos un presupuesto por escrito.' },
      { pregunta: '¿Cubren todo el departamento de Choluteca?', respuesta: 'Sí. Atendemos Marcovia, Choluteca, Pespire, San Marcos de Colón y demás municipios del departamento desde nuestra sede en Nacaome.' },
    ],
    geo: { lat: 13.28, lng: -87.31 },
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'abogados-en-marcovia-choluteca', titulo: 'Abogados en Marcovia: guía legal completa' },
    ],
  },
  {
    slug: 'langue',
    ciudad: 'Langue',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 22,
    title: 'Abogados en Langue, Valle — Consulta Legal',
    description:
      'Abogados en Langue, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome a 22 km. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Valle, Honduras',
    heroTitle: 'Abogados en Langue, Valle',
    heroSubtitle:
      'Atendemos a clientes de Langue y municipios cercanos. Defensa penal, derecho de familia, laboral y civil con bufete de la zona sur de Honduras.',
    intro:
      'Langue es un municipio del departamento de Valle ubicado a solo 22 km de Nacaome. Atendemos a familias, trabajadores y comerciantes de Langue y sus aldeas con servicios jurídicos integrales respaldados por más de 15 años de ejercicio profesional.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño vigente para residentes de Langue. Asistencia desde la detención y audiencias.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados con competencia en Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos injustificados y asesoría para trabajadores agrícolas y comerciales de Langue.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de Langue y la zona de Valle.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Langue?', respuesta: 'Nuestra sede principal está en Nacaome, a solo 22 km de Langue. Coordinamos diligencias en la zona y ofrecemos atención por WhatsApp y teléfono.' },
      { pregunta: '¿Qué servicios ofrecen en Langue?', respuesta: 'Defensa penal, derecho de familia, laboral, civil y notarial. Brindamos asesoría integral a residentes de Langue y el departamento de Valle.' },
      { pregunta: '¿Cómo agendo una consulta desde Langue?', respuesta: 'Puede contactarnos por WhatsApp al +504 9536-3724 o mediante el formulario de esta web. La primera consulta de evaluación no tiene costo.' },
      { pregunta: '¿Atienden casos penales urgentes en Langue?', respuesta: 'Sí. Para detenciones o situaciones penales urgentes, contáctenos de inmediato por WhatsApp. La ley garantiza el derecho a un abogado desde el primer momento.' },
    ],
    geo: { lat: 13.62, lng: -87.65 },
  },
  {
    slug: 'aramecina',
    ciudad: 'Aramecina',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 45,
    title: 'Abogados en Aramecina, Valle — Asesoría Jurídica',
    description:
      'Abogados en Aramecina, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Valle, Honduras',
    heroTitle: 'Abogados en Aramecina, Valle',
    heroSubtitle:
      'Servicios jurídicos para residentes de Aramecina y la zona oriental del departamento de Valle. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'Aramecina es un municipio del oriente del departamento de Valle, cercano a la frontera con El Salvador. A 45 km de Nacaome, ofrecemos servicios jurídicos a los residentes de Aramecina y sus comunidades con el respaldo de un bufete multidisciplinario del sur de Honduras.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación penal conforme al Código Penal hondureño para residentes de Aramecina. Acompañamiento en audiencias y defensa técnica.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados de Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas de Aramecina y la zona oriental de Valle.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad en Aramecina y el departamento de Valle.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Aramecina?', respuesta: 'Nuestra sede está en Nacaome, a 45 km de Aramecina. Atendemos a clientes de Aramecina de forma remota y coordinamos presencia cuando el caso lo requiere.' },
      { pregunta: '¿Qué tipo de casos atienden en Aramecina?', respuesta: 'Principalmente derecho de familia, laboral, penal, civil y trámites notariales para residentes de Aramecina y la zona oriental de Valle.' },
      { pregunta: '¿Cómo me contacto si vivo en Aramecina?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono para su comodidad.' },
      { pregunta: '¿Ofrecen consulta sin costo?', respuesta: 'Sí. La primera consulta de evaluación no tiene costo. Tras analizar su caso le entregamos un presupuesto por escrito.' },
    ],
    geo: { lat: 13.74, lng: -87.71 },
  },
  {
    slug: 'caridad',
    ciudad: 'Caridad',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 18,
    title: 'Abogados en Caridad, Valle — Defensa y Asesoría',
    description:
      'Abogados en Caridad, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome a 18 km. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Valle, Honduras',
    heroTitle: 'Abogados en Caridad, Valle',
    heroSubtitle:
      'Atendemos a residentes de Caridad y el centro del departamento de Valle. Defensa penal, derecho de familia, laboral y civil con bufete de la región.',
    intro:
      'Caridad es un municipio del centro del departamento de Valle, ubicado a solo 18 km de Nacaome. Ofrecemos servicios jurídicos integrales a las familias, trabajadores y comerciantes de Caridad con la cercanía y el respaldo de nuestro bufete en la zona sur.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño. Asistencia en detenciones y audiencias para residentes de Caridad.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y régimen de visitas ante los juzgados de familia con competencia en Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos injustificados y asesoría para trabajadores de Caridad y la zona central de Valle.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes y trámites notariales con validez en todo el territorio hondureño.' },
    ],
    faqs: [
      { pregunta: '¿Dónde están ubicados para atender Caridad?', respuesta: 'Nuestra sede está en Nacaome, a solo 18 km de Caridad. La cercanía permite coordinar atención presencial con rapidez.' },
      { pregunta: '¿Qué servicios jurídicos ofrecen en Caridad?', respuesta: 'Defensa penal, derecho de familia, laboral, civil y notarial. Somos un bufete multidisciplinario con más de 15 años de experiencia.' },
      { pregunta: '¿Cómo solicito una consulta desde Caridad?', respuesta: 'Escríbanos por WhatsApp al +504 9536-3724 o use el formulario de contacto. Le damos un presupuesto por escrito sin compromiso.' },
      { pregunta: '¿Atienden emergencias fuera de horario?', respuesta: 'En casos de detención o situaciones penales urgentes, contáctenos por WhatsApp indicando que es una emergencia. Estamos para ayudarle.' },
    ],
    geo: { lat: 13.47, lng: -87.55 },
  },
  {
    slug: 'alianza',
    ciudad: 'Alianza',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 30,
    title: 'Abogados en Alianza, Valle — Consulta Jurídica',
    description:
      'Abogados en Alianza, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome a 30 km. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Valle, Honduras',
    heroTitle: 'Abogados en Alianza, Valle',
    heroSubtitle:
      'Servicios jurídicos para residentes de Alianza y el litoral del departamento de Valle. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'Alianza es un municipio costero del departamento de Valle, ubicado a 30 km de Nacaome en la ribera del Golfo de Fonseca. Atendemos a familias, pescadores y comerciantes de Alianza con servicios jurídicos respaldados por nuestro bufete en la zona sur de Honduras.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación penal conforme al Código Penal hondureño para residentes de Alianza. Defensa técnica en audiencias y procesos.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos de familia ante los juzgados del departamento de Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores del sector pesquero y comercial de Alianza.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de Alianza y la zona costera.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Alianza?', respuesta: 'Nuestra sede principal está en Nacaome, a 30 km de Alianza. Coordinamos la atención por teléfono, WhatsApp y presencia cuando el caso lo requiere.' },
      { pregunta: '¿Atienden casos del sector pesquero en Alianza?', respuesta: 'Sí. Asesoramos en derecho laboral y civil a trabajadores del sector pesquero y comercial de Alianza y el Golfo de Fonseca.' },
      { pregunta: '¿Cómo inicio una consulta legal desde Alianza?', respuesta: 'Contáctenos por WhatsApp al +504 9536-3724. Evaluamos su caso sin costo y le damos un presupuesto por escrito antes de cualquier gestión.' },
      { pregunta: '¿Cubren todo el departamento de Valle?', respuesta: 'Sí. Atendemos Alianza, Nacaome, San Lorenzo, Goascorán, Amapala, Langue, Aramecina, Caridad y todos los municipios de Valle.' },
    ],
    geo: { lat: 13.35, lng: -87.58 },
  },
  {
    slug: 'el-triunfo',
    ciudad: 'El Triunfo',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 65,
    title: 'Abogados en El Triunfo, Choluteca — Defensa Legal',
    description:
      'Abogados en El Triunfo, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en El Triunfo, Choluteca',
    heroSubtitle:
      'Atendemos a clientes de El Triunfo y municipios del sur de Choluteca. Defensa penal, derecho de familia, laboral, civil y asesoría notarial.',
    intro:
      'El Triunfo es un municipio del sur del departamento de Choluteca, cercano a la frontera con Nicaragua. A 65 km de Nacaome, ofrecemos servicios jurídicos a los residentes de El Triunfo y sus comunidades con el respaldo de un bufete consolidado en la zona sur de Honduras.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño. Defensa técnica para residentes de El Triunfo y la zona fronteriza.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y procesos familiares ante los juzgados con competencia en Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas y comerciales de El Triunfo.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de El Triunfo.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en El Triunfo?', respuesta: 'Nuestra sede está en Nacaome, a 65 km de El Triunfo. Atendemos a clientes de El Triunfo con coordinación remota y presencial cuando es necesario.' },
      { pregunta: '¿Qué servicios ofrecen en El Triunfo?', respuesta: 'Defensa penal, derecho de familia, laboral, civil y notarial. Somos un bufete multidisciplinario que cubre todo el sur de Honduras.' },
      { pregunta: '¿Cómo agendo una consulta desde El Triunfo?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono o videollamada.' },
      { pregunta: '¿Cuánto cuesta una consulta jurídica?', respuesta: 'La primera consulta de evaluación no tiene costo. Tras analizar su caso, le entregamos un presupuesto por escrito para que decida sin compromiso.' },
    ],
    geo: { lat: 13.12, lng: -87.01 },
  },
  {
    slug: 'namasigue',
    ciudad: 'Namasigüe',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 55,
    title: 'Abogados en Namasigüe, Choluteca — Asesoría Legal',
    description:
      'Abogados en Namasigüe, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Namasigüe, Choluteca',
    heroSubtitle:
      'Servicios jurídicos para residentes de Namasigüe y el occidente de Choluteca. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'Namasigüe es un municipio del occidente del departamento de Choluteca, con importante actividad agrícola y ganadera. A 55 km de Nacaome, brindamos asesoría legal integral a los residentes de Namasigüe y sus comunidades vecinas.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño para residentes de Namasigüe. Asistencia en audiencias.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados de Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas y ganaderos de Namasigüe.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas de terrenos, poderes notariales y trámites de propiedad en Namasigüe.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Namasigüe?', respuesta: 'Nuestra sede principal está en Nacaome, Valle, a 55 km de Namasigüe. Atendemos a clientes de Namasigüe de forma remota con coordinación presencial cuando es necesario.' },
      { pregunta: '¿Qué tipo de casos atienden en Namasigüe?', respuesta: 'Principalmente derecho de familia, laboral, penal y civil. También trámites notariales y asesoría en contratos y propiedad.' },
      { pregunta: '¿Cómo me contacto si vivo en Namasigüe?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono para su comodidad.' },
      { pregunta: '¿Ofrecen primera consulta sin costo?', respuesta: 'Sí. Realizamos una primera evaluación de su caso sin costo y le entregamos un presupuesto por escrito antes de iniciar cualquier gestión.' },
    ],
    geo: { lat: 13.26, lng: -87.14 },
  },
  {
    slug: 'orocuina',
    ciudad: 'Orocuina',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 70,
    title: 'Abogados en Orocuina, Choluteca — Defensa y Consulta',
    description:
      'Abogados en Orocuina, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Orocuina, Choluteca',
    heroSubtitle:
      'Atendemos a clientes de Orocuina y el oriente de Choluteca. Defensa penal, derecho de familia, laboral, civil y asesoría notarial.',
    intro:
      'Orocuina es un municipio del oriente del departamento de Choluteca, con fuerte tradición agropecuaria. A 70 km de Nacaome, ofrecemos servicios jurídicos integrales a los residentes de Orocuina y las comunidades vecinas del corredor oriental.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño para residentes de Orocuina. Defensa técnica en audiencias.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y procesos familiares ante los juzgados con competencia en Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas y ganaderos de Orocuina.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes y trámites notariales para residentes de Orocuina y el oriente de Choluteca.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Orocuina?', respuesta: 'Nuestra sede está en Nacaome, a 70 km de Orocuina. Atendemos a clientes de Orocuina de forma remota con coordinación presencial cuando es necesario.' },
      { pregunta: '¿Qué servicios ofrecen en Orocuina?', respuesta: 'Defensa penal, derecho de familia, laboral, civil y notarial. Brindamos asesoría integral a residentes de Orocuina y todo Choluteca.' },
      { pregunta: '¿Cómo agendo una consulta desde Orocuina?', respuesta: 'Contáctenos por WhatsApp al +504 9536-3724 o use el formulario web. Evaluamos su caso sin costo y le damos un presupuesto por escrito.' },
      { pregunta: '¿Cubren todo el departamento de Choluteca?', respuesta: 'Sí. Atendemos Orocuina, Choluteca, Marcovia, El Triunfo, Namasigüe, Pespire, San Marcos de Colón y demás municipios del departamento.' },
    ],
    geo: { lat: 13.48, lng: -87.07 },
  },
  {
    slug: 'apacilagua',
    ciudad: 'Apacilagua',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 58,
    title: 'Abogados en Apacilagua, Choluteca — Asesoría Jurídica',
    description:
      'Abogados en Apacilagua, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Apacilagua, Choluteca',
    heroSubtitle:
      'Servicios jurídicos para residentes de Apacilagua y el centro de Choluteca. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'Apacilagua es un municipio del centro del departamento de Choluteca, con importante actividad agropecuaria en el sur de Honduras. A 58 km de Nacaome, brindamos asesoría legal integral a los residentes de Apacilagua y sus comunidades.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño para residentes de Apacilagua.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados de Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas de Apacilagua y el centro de Choluteca.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de Apacilagua.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Apacilagua?', respuesta: 'Nuestra sede principal está en Nacaome, a 58 km de Apacilagua. Atendemos a clientes de Apacilagua de forma remota con coordinación presencial cuando es necesario.' },
      { pregunta: '¿Qué tipo de casos atienden en Apacilagua?', respuesta: 'Principalmente derecho de familia, laboral, penal y civil. También trámites notariales y asesoría en contratos y propiedad.' },
      { pregunta: '¿Cómo inicio una consulta legal desde Apacilagua?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Evaluamos su caso sin costo y le entregamos un presupuesto por escrito.' },
      { pregunta: '¿Ofrecen consulta a distancia?', respuesta: 'Sí. Puede iniciar su consulta por WhatsApp o teléfono. Si se requiere presencia, coordinamos el desplazamiento a Apacilagua.' },
    ],
    geo: { lat: 13.46, lng: -87.08 },
  },
  {
    slug: 'concepcion-de-maria',
    ciudad: 'Concepción de María',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 75,
    title: 'Abogados en Concepción de María, Choluteca',
    description:
      'Abogados en Concepción de María, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Concepción de María',
    heroSubtitle:
      'Atendemos a clientes de Concepción de María y el sur de Choluteca. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'Concepción de María es un municipio del sur del departamento de Choluteca, cercano a la frontera con Nicaragua. A 75 km de Nacaome, ofrecemos servicios jurídicos a los residentes de Concepción de María y las comunidades fronterizas del sur.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño para residentes de Concepción de María.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y procesos familiares ante los juzgados con competencia en Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas de Concepción de María y la zona sur.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad en Concepción de María.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Concepción de María?', respuesta: 'Nuestra sede está en Nacaome, a 75 km de Concepción de María. Atendemos con coordinación remota y presencial cuando el caso lo requiere.' },
      { pregunta: '¿Atienden en la zona fronteriza con Nicaragua?', respuesta: 'Sí. Cubrimos Concepción de María, San Marcos de Colón y otros municipios fronterizos del sur de Choluteca.' },
      { pregunta: '¿Cómo me contacto si vivo en Concepción de María?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Hacemos la primera consulta por teléfono o videollamada.' },
      { pregunta: '¿Cuánto cuesta una consulta jurídica?', respuesta: 'La primera consulta de evaluación no tiene costo. Tras analizar su caso, le entregamos un presupuesto por escrito para que decida sin compromiso.' },
    ],
    geo: { lat: 13.23, lng: -87.03 },
  },
  {
    slug: 'duyure',
    ciudad: 'Duyure',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 85,
    title: 'Abogados en Duyure, Choluteca — Asesoría Legal',
    description:
      'Abogados en Duyure, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Duyure, Choluteca',
    heroSubtitle:
      'Servicios jurídicos para residentes de Duyure y el oriente de Choluteca. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'Duyure es un municipio del oriente del departamento de Choluteca, con tradición agrícola y ganadera. A 85 km de Nacaome, brindamos asesoría legal integral a los residentes de Duyure y las comunidades del oriente de Choluteca.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño para residentes de Duyure.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados de Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas de Duyure.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas de terrenos, poderes notariales y trámites de propiedad en Duyure.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Duyure?', respuesta: 'Nuestra sede principal está en Nacaome, Valle, a 85 km de Duyure. Atendemos a clientes de Duyure de forma remota con coordinación presencial cuando es necesario.' },
      { pregunta: '¿Qué servicios ofrecen en Duyure?', respuesta: 'Defensa penal, derecho de familia, laboral y civil. Brindamos asesoría integral a residentes de Duyure y todo el departamento de Choluteca.' },
      { pregunta: '¿Cómo inicio una consulta legal desde Duyure?', respuesta: 'Contáctenos por WhatsApp al +504 9536-3724 o use el formulario web. Evaluamos su caso sin costo y le damos un presupuesto por escrito.' },
      { pregunta: '¿Ofrecen primera consulta sin costo?', respuesta: 'Sí. Realizamos una primera evaluación de su caso sin costo y le entregamos un presupuesto por escrito antes de iniciar cualquier gestión.' },
    ],
    geo: { lat: 13.53, lng: -86.88 },
  },
  {
    slug: 'morolica',
    ciudad: 'Morolica',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 80,
    title: 'Abogados en Morolica, Choluteca — Defensa Legal',
    description:
      'Abogados en Morolica, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Morolica, Choluteca',
    heroSubtitle:
      'Atendemos a clientes de Morolica y el centro-oriente de Choluteca. Defensa penal, derecho de familia, laboral, civil y asesoría notarial.',
    intro:
      'Morolica es un municipio del centro-oriente del departamento de Choluteca. A 80 km de Nacaome, ofrecemos servicios jurídicos integrales a los residentes de Morolica y sus comunidades vecinas con el respaldo de un bufete consolidado en la zona sur de Honduras.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación en procesos penales conforme al Código Penal hondureño para residentes de Morolica.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y procesos familiares ante los juzgados con competencia en Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas de Morolica.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de Morolica.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Morolica?', respuesta: 'Nuestra sede está en Nacaome, a 80 km de Morolica. Atendemos a clientes de Morolica con coordinación remota y presencial cuando el caso lo requiere.' },
      { pregunta: '¿Qué servicios ofrecen en Morolica?', respuesta: 'Defensa penal, derecho de familia, laboral, civil y notarial. Somos un bufete multidisciplinario que cubre todo el sur de Honduras.' },
      { pregunta: '¿Cómo agendo una consulta desde Morolica?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono para su comodidad.' },
      { pregunta: '¿Cubren todo el departamento de Choluteca?', respuesta: 'Sí. Atendemos Morolica, Choluteca, Marcovia, Pespire, San Marcos de Colón y todos los municipios de Choluteca.' },
    ],
    geo: { lat: 13.56, lng: -86.95 },
  },
  {
    slug: 'san-antonio-de-flores',
    ciudad: 'San Antonio de Flores',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 72,
    title: 'Abogados en San Antonio de Flores, Choluteca',
    description:
      'Abogados en San Antonio de Flores, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en San Antonio de Flores',
    heroSubtitle:
      'Servicios jurídicos para residentes de San Antonio de Flores y el oriente de Choluteca. Defensa penal, derecho de familia, laboral y civil.',
    intro:
      'San Antonio de Flores es un municipio del oriente del departamento de Choluteca. A 72 km de Nacaome, brindamos asesoría legal integral a los residentes de San Antonio de Flores y sus comunidades vecinas.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño para residentes de San Antonio de Flores.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia de menores y procesos familiares ante los juzgados de Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría para trabajadores agrícolas de San Antonio de Flores.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes notariales y trámites de propiedad para residentes de San Antonio de Flores.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en San Antonio de Flores?', respuesta: 'Nuestra sede principal está en Nacaome, a 72 km de San Antonio de Flores. Atendemos a clientes de este municipio de forma remota con coordinación presencial.' },
      { pregunta: '¿Qué tipo de casos atienden en San Antonio de Flores?', respuesta: 'Principalmente derecho de familia, laboral, penal y civil. También trámites notariales y asesoría en contratos y propiedad.' },
      { pregunta: '¿Cómo inicio una consulta legal?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Evaluamos su caso sin costo y le entregamos un presupuesto por escrito.' },
      { pregunta: '¿Ofrecen consulta a distancia?', respuesta: 'Sí. Puede iniciar su consulta por WhatsApp o teléfono. Si se requiere presencia, coordinamos el desplazamiento a San Antonio de Flores.' },
    ],
    geo: { lat: 13.58, lng: -86.89 },
  },
];

/** Devuelve una landing por slug, o undefined si no existe. */
export function getLandingBySlug(slug: string): LandingLocal | undefined {
  return landingsLocales.find((l) => l.slug === slug);
}

/**
 * Genera los metadatos SEO para una landing local (title, description, OG,
 * Twitter, canonical, keywords). Reutilizable por cada wrapper de página.
 */
export const LANDING_OG_IMAGES: Record<string, string> = {
  nacaome: '/og/nacaome.webp',
  choluteca: '/og/choluteca.webp',
  'san-lorenzo': '/og/san-lorenzo.webp',
  goascoran: '/og/goascoran.webp',
  amapala: '/og/amapala.webp',
  pespire: '/og/pespire.webp',
  'san-marcos-de-colon': '/og/san-marcos-de-colon.webp',
  marcovia: '/og/marcovia.webp',
};

export function landingMetadata(landing: LandingLocal) {
  const canonical = landing.path ?? `/abogados-en-${landing.slug}`;
  const ogImage = LANDING_OG_IMAGES[landing.slug] ?? '/og-image.webp';
  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical },
    keywords: [
      `abogados en ${landing.ciudad}`,
      `bufete de abogados ${landing.ciudad}`,
      `abogado penalista ${landing.ciudad}`,
      `abogado ${landing.departamento} Honduras`,
      `consulta jurídica ${landing.ciudad}`,
    ],
    openGraph: {
      title: landing.title,
      description: landing.description,
      url: canonical,
      siteName: 'Pineda y Asociados',
      locale: 'es_HN',
      type: 'website' as const,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: landing.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: landing.title,
      description: landing.description,
      images: [ogImage],
    },
  };
}

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
  /** Slug usado en la URL: /abogados-en-{slug} */
  slug: string;
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
    title: 'Abogados en Nacaome, Valle | Pineda y Asociados',
    description:
      'Bufete de abogados en Nacaome, Valle (Honduras). Defensa penal, familia, laboral, civil y mercantil. Atención directa con presupuesto por escrito. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Sede principal · Valle, Honduras',
    heroTitle: 'Abogados en Nacaome, Valle',
    heroSubtitle:
      'Bufete multidisciplinario con sede en Nacaome. Más de 15 años de ejercicio profesional en la zona sur de Honduras, con defensa penal técnica y asesoría jurídica integral.',
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
    title: 'Abogados en Choluteca | Pineda y Asociados Honduras',
    description:
      'Abogados en Choluteca, Honduras. Defensa penal, familia, laboral, mercantil y aduanero. Atención a clientes de Choluteca desde nuestra sede en la zona sur. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Zona sur · Choluteca, Honduras',
    heroTitle: 'Abogados en Choluteca',
    heroSubtitle:
      'Atendemos a clientes de Choluteca y el sur de Honduras en defensa penal, derecho de familia, laboral, mercantil y aduanero, con el respaldo de un bufete multidisciplinario de la región.',
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
    title: 'Abogados en San Lorenzo, Valle | Pineda y Asociados',
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
];

/** Devuelve una landing por slug, o undefined si no existe. */
export function getLandingBySlug(slug: string): LandingLocal | undefined {
  return landingsLocales.find((l) => l.slug === slug);
}

/**
 * Genera los metadatos SEO para una landing local (title, description, OG,
 * Twitter, canonical, keywords). Reutilizable por cada wrapper de página.
 */
export function landingMetadata(landing: LandingLocal) {
  const canonical = `/abogados-en-${landing.slug}`;
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
          url: '/og-image.png',
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
      images: ['/og-image.png'],
    },
  };
}

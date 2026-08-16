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

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import {
  isLandingNoindex,
  getLandingDecision,
} from '@/lib/seo/public-indexability';

export type LandingLocal = {
  /** Slug usado en la URL: /abogados-en-{slug} (o path personalizado si se define) */
  slug: string;
  /** Path canónico personalizado (opcional). Si no se define, se usa /abogados-en-{slug} */
  path?: string;
  /** Nombre de la ciudad para mostrar */
  ciudad: string;
  /** Departamento al que pertenece */
  departamento: string;
  /** True si el bufete tiene sede física allí (afecta NAP y schema).
   *  Solo Nacaome tiene sedeFisica: true. */
  sedeFisica: boolean;
  /** Distancia aproximada en km desde la sede en Nacaome. */
  distanciaKm: number;
  /** <title> SEO (≤ 60 chars aprox.). Si se omite, se genera variante por tipo de ciudad. */
  title: string;
  /** Variante de title SEO específica (opcional). Si se omite, landingMetadata genera una por tipo de ciudad para evitar canibalización. */
  seoTitle?: string;
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
  /** FAQ local (máx. 3, logística de ciudad; también genera schema FAQPage) */
  faqs: { pregunta: string; respuesta: string }[];
  /** Datos estructurados geográficos */
  geo?: { lat: number; lng: number };
  /** Slugs de posts del blog relacionados con la ciudad (categoría/slug)
   *  para enlazado interno bidireccional landing ↔ blog. */
  postsRelacionados?: { categoria: string; slug: string; titulo: string }[];
  // ─────────────────────────────────────────────────────────────────────
  // FASE 4 (§5) — Modelo territorial. Campos opcionales que representan de
  // forma inequívoca que la atención se presta DESDE Nacaome (única sede),
  // las modalidades posibles y la distancia con fuente verificable.
  // Los datos visibles y JSON-LD proceden de esta misma fuente (DRY, §2).
  // ─────────────────────────────────────────────────────────────────────
  /** Texto corto que describe desde dónde se presta la atención. Por defecto
   *  "nuestra oficina en Nacaome". Nunca debe sugerir sede fuera de Nacaome. */
  servedFrom?: string;
  /** Modalidades de atención reales para esa localidad. */
  serviceModes?: Array<'office' | 'remote' | 'travel'>;
  /** Tiempo de viaje aproximado en texto (p. ej. "45–60 min"). Opcional. */
  approximateTravelTime?: string;
  /** Fuente cartográfica o institucional de la distancia (p. ej. "Google Maps",
   *  "Rome2Rio/Travelmath"). Siempre interpretar como APROXIMADA. */
  distanceSource?: string;
  /** Fecha ISO (YYYY-MM-DD) en que se comprobó la distancia. */
  distanceCheckedAt?: string;
  /** Contexto local real que diferencia la página (actividad económica
   *  predominante respaldada, frontera, puerto, etc.). Sin folclore inventado. */
  localContext?: string[];
  /** Instituciones reales con competencia en la zona, sin atribuirles
   *  responsabilidades incorrectas. */
  institutions?: Array<{ name: string; role: string }>;
};

/**
 * Aviso orientativo reutilizable sobre distancias y tiempos por carretera.
 * Texto coherente con /como-llegar y las landings locales, para evitar
 * falsa precisión (FASE 4 §6).
 */
export const DISTANCIA_APROX_NOTA =
  'Las distancias y tiempos son aproximados por carretera y pueden variar según el punto de salida, la ruta elegida, el tráfico y las condiciones de la vía.';

/**
 * Sede canónica del despacho: única oficina física. Usado por helpers,
 * wrappers y schemas para no dispersar la fuente de verdad de la sede.
 */
export const SEDE_CANONICA = {
  ciudad: 'Nacaome',
  departamento: 'Valle',
  descripcion: 'nuestra oficina en Nacaome',
} as const;

export const landingsLocales: LandingLocal[] = [
  {
    slug: 'nacaome',
    ciudad: 'Nacaome',
    departamento: 'Valle',
    sedeFisica: true,
    distanciaKm: 0,
    // Intención secundaria y operativa: la home es la URL comercial dominante
    // para "abogados en Nacaome". Esta página explica cómo visitar la sede.
    title: 'Oficina en Nacaome | Ubicación y Atención Presencial',
    description:
      'Dirección, referencia de llegada, horario y modalidades de atención de la oficina de Pineda y Asociados en Nacaome, Valle.',
    heroEyebrow: 'Ubicación de la oficina · Valle, Honduras',
    heroTitle: 'Sede en Nacaome: dirección, horario y visita',
    heroSubtitle:
      'Consulte la ubicación, el horario y cómo preparar una atención presencial o remota con el despacho.',
    intro:
      'Nacaome, cabecera del departamento de Valle, concentra gran parte de la actividad judicial y comercial del sur de Honduras. Nuestra sede está ubicada en el centro de la ciudad, cuadra y media al este de Hondutel, contiguo a la Clínica Dental Dra. Andara. Atendemos particulares, familias y empresas de Nacaome, San Lorenzo, Amapala y toda la zona sur. Indicaciones de ruta, mapa y accesos desde Tegucigalpa, Choluteca y San Lorenzo están en /como-llegar. Para contratar defensa o asesoría, use la página principal / o solicite una evaluación inicial confidencial.',
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
        pregunta: '¿Atienden emergencias penales fuera de horario?',
        respuesta:
          'El horario de oficina es de lunes a sábado, de 7:00 a 20:00. Si hay una detención, escríbanos por WhatsApp indicando que es urgente. La Constitución de Honduras garantiza el derecho a un abogado desde el primer momento y a ser presentado ante un juez en 24 horas.',
      },
      {
        pregunta: '¿Atienden casos de San Lorenzo y Amapala?',
        respuesta:
          'Sí. Aunque nuestra sede está en Nacaome, atendemos clientes de San Lorenzo, Amapala, Alianza y demás municipios del departamento de Valle.',
      },
    ],
    geo: { lat: 13.53, lng: -87.48 },
    // FASE 4 (§5) — Territorial: Nacaome es la única sede física del despacho.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['office', 'remote'],
    distanceSource: 'Sede del despacho (cabecera de Valle)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Cabecera del departamento de Valle',
      'Centro judicial y comercial del sur de Honduras',
      'Conexión por carretera con San Lorenzo, Amapala y Goascorán',
    ],
    institutions: [
      { name: 'Juzgados de Letras de Valle', role: 'Sede judicial departamental con competencia en civil, penal, familia y laboral' },
      { name: 'Municipalidad de Nacaome', role: 'Gobierno local' },
    ],
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'tramites-legales-nacaome', titulo: 'Trámites legales en Nacaome, Valle' },
      { categoria: 'derecho-penal', slug: 'detencion-familiar-nacaome-primeras-horas', titulo: 'Si detienen a un familiar en Nacaome: primeras horas' },
      { categoria: 'proceso-penal', slug: 'audiencia-inicial-juzgados-valle', titulo: 'Audiencia inicial en los Juzgados de Letras de Valle' },
      { categoria: 'derecho-de-familia', slug: 'pension-alimenticia-nacaome-documentos', titulo: 'Pensión alimenticia en Nacaome: documentos y evaluación' },
      { categoria: 'derecho-de-familia', slug: 'custodia-visitas-juzgado-valle', titulo: 'Custodia y visitas ante el juzgado de familia de Valle' },
      { categoria: 'derecho-laboral', slug: 'despido-valle-documentos-evaluacion', titulo: 'Despido en el sur de Valle: planilla, contrato y carta' },
      { categoria: 'derecho-civil', slug: 'contrato-compraventa-nacaome-revision', titulo: 'Contrato o compraventa en Nacaome: qué revisar' },
      { categoria: 'practica-legal', slug: 'preparar-visita-oficina-nacaome', titulo: 'Cómo preparar la visita a la oficina en Nacaome' },
    ],
  },
  {
    slug: 'choluteca',
    ciudad: 'Choluteca',
    departamento: 'Choluteca',
    sedeFisica: false,
    // FASE 4 (§6) — Unificado a 55 km para coherencia con la FAQ interna y con
    // lib/legal-review.ts (verificación Rome2Rio/Travelmath). Antes 52 km.
    distanciaKm: 55,
    // NO incluye nombre del bufete: el layout añade "| Pineda y Asociados".
    title: 'Abogados en Choluteca | Sur de Honduras',
    description:
      'Abogados en Choluteca, Honduras. Defensa penal, familia, laboral y aduanero. Evaluación inicial confidencial. WhatsApp +504 9536-3724. Bufete del sur.',
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
          'Nuestra sede física está en Nacaome, a unos 55 km de Choluteca por la carretera Panamericana CA-1. Atendemos a clientes de Choluteca desde esa oficina y coordinamos las diligencias y audiencias necesarias en los juzgados de Choluteca.',
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
    ],
    geo: { lat: 13.3, lng: -87.17 },
    // FASE 4 (§5) — Territorial: Choluteca se atiende DESDE Nacaome, sin sede local.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    approximateTravelTime: 'aprox. 60–75 min por la CA-1',
    distanceSource: 'Carretera Panamericana CA-1 (Rome2Rio/Travelmath)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Ciudad más poblada del sur de Honduras',
      'Centro comercial y aduanero de la región',
      'Cercanía con la frontera de Guasaule (Nicaragua)',
    ],
    institutions: [
      { name: 'Juzgados de Letras de Choluteca', role: 'Sede judicial departamental con competencia en la zona' },
      { name: 'Aduana de Guasaule', role: 'Paso fronterizo con Nicaragua; competencia en trámites aduaneros' },
    ],
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'defensa-penal-choluteca-desde-nacaome', titulo: 'Detención o audiencia en Choluteca: se atiende desde Nacaome' },
      { categoria: 'derecho-aduanero', slug: 'tramite-aduanero-guasaule-abogado', titulo: 'Trámite aduanero en Guasaule: cuándo interviene un abogado' },
    ],
  },
  {
    slug: 'san-lorenzo',
    ciudad: 'San Lorenzo',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 17,
    // NO incluye nombre del bufete: el layout añade "| Pineda y Asociados".
    title: 'Abogados en San Lorenzo, Valle | Puerto Sur · Asesoría Legal',
    description:
      'Abogados en San Lorenzo, Valle. Puerto y zona comercial. Defensa penal, mercantil, laboral y aduanero. Evaluación inicial confidencial. WhatsApp +504 9536-3724.',
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
    ],
    geo: { lat: 13.42, lng: -87.45 },
    // FASE 4 (§5) — Territorial: San Lorenzo, principal puerto del sur, se
    // atiende DESDE Nacaome. Sin sede local.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    approximateTravelTime: 'aprox. 20–30 min',
    distanceSource: 'Carretera del Litoral Atlántico/CA-1 (Google Maps)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Principal puerto marítimo del sur de Honduras',
      'Zona comercial dinámica del departamento de Valle',
      'Actividad de importación, pesca y Zonas Libres',
    ],
    institutions: [
      { name: 'Autoridad Marítima Portuaria', role: 'Competencia en operaciones del puerto de San Lorenzo' },
      { name: 'Juzgados de Letras de Valle', role: 'Sede judicial con competencia en la zona' },
    ],
    postsRelacionados: [
      { categoria: 'derecho-laboral', slug: 'prestaciones-puerto-san-lorenzo', titulo: 'Prestaciones de trabajadores del puerto de San Lorenzo' },
    ],
  },
  {
    slug: 'goascoran',
    ciudad: 'Goascorán',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 35,
    title: 'Abogados en Goascorán, Valle | Frontera El Salvador · Consulta',
    description:
      'Abogados en Goascorán, zona fronteriza de Valle. Defensa penal, familia, laboral y civil. Evaluación inicial confidencial. WhatsApp +504 9536-3724.',
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
    ],
    geo: { lat: 13.58, lng: -87.73 },
    // FASE 4 (§5) — Territorial: Goascorán, zona fronteriza con El Salvador,
    // se atiende DESDE Nacaome. Sin sede local.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    approximateTravelTime: 'aprox. 40–55 min',
    distanceSource: 'Ruta por carretera departamental (Google Maps)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Municipio fronterizo con El Salvador (Puente La Amistad)',
      'Tránsito comercial y familiar transfronterizo',
      'Actividad agrícola y comercial de Valle',
    ],
    institutions: [
      { name: 'Puente La Amistad', role: 'Paso fronterizo Honduras–El Salvador' },
      { name: 'Juzgados de Letras de Valle', role: 'Sede judicial con competencia en la zona' },
    ],
    // Posts de la región de Valle (Nacaome, sede) relevantes para Goascorán.
    // La ciudad no tiene post dedicado propio; estos slugs ya existen en DB y
    // son aplicables a toda la zona sur del departamento de Valle.
    postsRelacionados: [
      { categoria: 'practica-legal', slug: 'tramites-legales-nacaome', titulo: 'Trámites legales en Nacaome, Valle' },
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
      'Abogados en Pespire, Choluteca. Defensa penal, familia, laboral y civil desde Nacaome. Bufete con cobertura en todo el sur de Honduras.',
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
      { pregunta: '¿Cómo me contacto si vivo en Pespire?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono o videollamada para su comodidad.' },
      { pregunta: '¿Cuánto cuesta una evaluación jurídica en Pespire?', respuesta: 'Las condiciones de la evaluación dependen del tipo de asunto y del alcance solicitado. Tras la evaluación inicial, le entregamos un presupuesto por escrito para que decida con información antes de contratar.' },
    ],
    geo: { lat: 13.59, lng: -87.36 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: 'Carretera departamental (Google Maps)',
    distanceCheckedAt: '2026-07-25',
  },
  {
    slug: 'san-marcos-de-colon',
    ciudad: 'San Marcos de Colón',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 80,
    title: 'Abogados en San Marcos de Colón, Choluteca | Frontera Sur',
    description:
      'Abogados en San Marcos de Colón, frontera con Nicaragua. Defensa penal, familiar, laboral, civil y aduanera. Evaluación inicial confidencial.',
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
    ],
    geo: { lat: 13.43, lng: -86.82 },
    // FASE 4 (§5) — Territorial: San Marcos de Colón, frontera con Nicaragua,
    // se atiende DESDE Nacaome. Sin sede local.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    approximateTravelTime: 'aprox. 90 min por la CA-1',
    distanceSource: 'Carretera Panamericana CA-1 (Google Maps)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Municipio fronterizo con Nicaragua (El Espino)',
      'Actividad agrícola, ganadera y comercial',
      'Tránsito y comercio transfronterizo',
    ],
    institutions: [
      { name: 'Frontera de El Espino', role: 'Paso fronterizo con Nicaragua' },
      { name: 'Juzgados de Letras de Choluteca', role: 'Sede judicial departamental con competencia en la zona' },
    ],
  },
  {
    slug: 'marcovia',
    ciudad: 'Marcovia',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 60,
    title: 'Abogados en Marcovia, Choluteca — Asesoría Legal',
    description:
      'Abogados en Marcovia, Choluteca. Defensa penal, familia, laboral y civil con atención desde Nacaome. Bufete del sur de Honduras.',
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
      { pregunta: '¿Cómo inicio una evaluación legal?', respuesta: 'Contáctenos por WhatsApp al +504 9536-3724 o use el formulario web. La evaluación inicial es confidencial y, cuando se requiera representación formal, le entregamos un presupuesto por escrito.' },
    ],
    geo: { lat: 13.28, lng: -87.31 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: 'Carretera Panamericana CA-1 (Google Maps)',
    distanceCheckedAt: '2026-07-25',
  },
  {
    slug: 'el-triunfo',
    ciudad: 'El Triunfo',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 65,
    title: 'Abogados en El Triunfo, Choluteca — Asesoría Legal',
    description:
      'Abogados en El Triunfo, Choluteca. Defensa penal, familia, laboral y civil desde Nacaome. Bufete con cobertura en el sur de Honduras.',
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
      { pregunta: '¿Cómo agendo una consulta desde El Triunfo?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono o videollamada.' },
      { pregunta: '¿Cuánto cuesta una evaluación jurídica desde El Triunfo?', respuesta: 'Las condiciones de la evaluación dependen del tipo de asunto y del alcance solicitado. Tras la evaluación inicial, le entregamos un presupuesto por escrito para que decida con información antes de contratar.' },
    ],
    geo: { lat: 13.12, lng: -87.01 },
    // FASE 4 (§5) — Territorial: El Triunfo, sur de Choluteca cercano a la
    // frontera con Nicaragua, se atiende DESDE Nacaome. Sin sede local.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    approximateTravelTime: 'aprox. 75–90 min por la CA-1',
    distanceSource: 'Carretera Panamericana CA-1 (Google Maps)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Sur del departamento de Choluteca',
      'Cercano a la frontera con Nicaragua',
      'Actividad agrícola y comercial',
    ],
    institutions: [
      { name: 'Juzgados de Letras de Choluteca', role: 'Sede judicial departamental con competencia en la zona' },
    ],
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'que-hacer-si-me-detienen-en-honduras', titulo: '¿Qué Hacer Si Me Detienen en Honduras? Guía Legal Completa' },
      { categoria: 'derecho-laboral', slug: 'despido-laboral-honduras-guia-completa', titulo: 'Despido laboral en Honduras: derechos y cómo reclamar' },
      { categoria: 'derecho-civil', slug: 'reclamar-deuda-legalmente-honduras', titulo: 'Cómo reclamar una deuda legalmente en Honduras' },
    ],
  },
  {
    slug: 'namasigue',
    ciudad: 'Namasigüe',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 55,
    title: 'Abogados en Namasigüe, Choluteca — Asesoría Legal',
    description:
      'Abogados en Namasigüe, Choluteca. Defensa penal, familia, laboral y civil desde Nacaome. Bufete con cobertura en el sur de Honduras.',
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
      { pregunta: '¿Cómo me contacto si vivo en Namasigüe?', respuesta: 'Por WhatsApp al +504 9536-3724 o mediante el formulario web. Podemos hacer la primera consulta por teléfono para su comodidad.' },
      { pregunta: '¿Cómo funciona la evaluación inicial desde Namasigüe?', respuesta: 'La evaluación inicial es confidencial. Puede contactarnos por WhatsApp al +504 9536-3724 o mediante el formulario de esta web; cuando se requiera representación formal, se entrega un presupuesto por escrito antes de iniciar.' },
    ],
    geo: { lat: 13.26, lng: -87.14 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera departamental (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'que-hacer-si-me-detienen-en-honduras', titulo: '¿Qué Hacer Si Me Detienen en Honduras? Guía Legal Completa' },
      { categoria: 'derecho-laboral', slug: 'despido-laboral-honduras-guia-completa', titulo: 'Despido laboral en Honduras: derechos y cómo reclamar' },
      { categoria: 'derecho-civil', slug: 'reclamar-deuda-legalmente-honduras', titulo: 'Cómo reclamar una deuda legalmente en Honduras' },
    ],
  },
  {
    slug: 'orocuina',
    ciudad: 'Orocuina',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 70,
    title: 'Abogados en Orocuina, Choluteca — Asesoría Legal',
    description:
      'Abogados en Orocuina, Choluteca. Defensa penal, familia, laboral y civil desde Nacaome. Bufete con cobertura en el sur de Honduras.',
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
      { pregunta: '¿Cómo agendo una consulta desde Orocuina?', respuesta: 'Contáctenos por WhatsApp al +504 9536-3724 o use el formulario web. La evaluación inicial es confidencial y, cuando se requiera representación formal, le entregamos un presupuesto por escrito.' },
      { pregunta: '¿Se desplazan a Orocuina desde Nacaome?', respuesta: 'Sí. Coordinamos WhatsApp, teléfono y desplazamiento cuando el caso lo requiere. No hay sucursal en Orocuina: se atiende desde Nacaome.' },
    ],
    geo: { lat: 13.48, lng: -87.07 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera departamental (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'defensa-penal-honduras', titulo: 'Defensa Penal en Honduras: Guía de las Primeras Horas' },
      { categoria: 'derecho-laboral', slug: 'derechos-laborales-basicos-honduras', titulo: 'Derechos laborales básicos en Honduras: guía para trabajadores' },
      { categoria: 'practica-legal', slug: 'como-elegir-abogado-honduras', titulo: 'Cómo Elegir un Buen Abogado en Honduras: 6 Criterios Clave' },
    ],
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
    ],
    geo: { lat: 13.3, lng: -87.65 },
    // FASE 4 (§5) — Territorial: Amapala (Isla del Tigre, Golfo de Fonseca),
    // municipio insular de Valle. Se atiende DESDE Nacaome; el acceso combina
    // carretera y vía marítima, por lo que la modalidad predominante es remota.
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    approximateTravelTime: 'varía: incluye tramo terrestre y acceso a la isla',
    distanceSource: 'Distancia por carretera + acceso insular (Google Maps)',
    distanceCheckedAt: '2026-07-25',
    localContext: [
      'Municipio insular (Isla del Tigre) en el Golfo de Fonseca',
      'Puerto histórico y actividad pesquera y turística',
      'Acceso combinado terrestre y marítimo',
    ],
    institutions: [
      { name: 'Juzgados de Letras de Valle', role: 'Sede judicial con competencia en la zona' },
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
      { pregunta: '¿Cómo agendo una consulta desde Langue?', respuesta: 'Puede contactarnos por WhatsApp al +504 9536-3724 o mediante el formulario de esta web. Las condiciones de la evaluación inicial se confirman según el asunto; cuando se requiera representación formal, se entrega un presupuesto por escrito.' },
      { pregunta: '¿Atienden casos penales urgentes en Langue?', respuesta: 'Sí. Para detenciones o situaciones penales urgentes, contáctenos de inmediato por WhatsApp. La ley garantiza el derecho a un abogado desde el primer momento.' },
    ],
    geo: { lat: 13.62, lng: -87.65 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera departamental de Valle (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'cuando-necesito-abogado-penalista-honduras', titulo: '¿Cuándo necesito un abogado penalista en Honduras?' },
      { categoria: 'derecho-de-familia', slug: 'custodia-hijos-honduras-juez', titulo: 'Custodia de Hijos en Honduras: Requisitos, Tipos y Cómo solicitarla' },
      { categoria: 'derecho-notarial', slug: 'poder-legal-honduras-cuando-se-necesita', titulo: 'Poder legal en Honduras: cómo otorgarlo' },
    ],
  },
  // === P7 AUDIT SEO Jul 2026: landings locales secundarias ===
  // Ciudades antes redirigidas (404 soft) a un vecino. Ahora tienen landing
  // propia con contenido único, NAP coherente y CTA. Datos geográficos
  // aproximados verificables (geonames/Honduras). Sin inventar sedes.
  {
    slug: 'caridad',
    ciudad: 'Caridad',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 30,
    title: 'Abogados en Caridad, Valle — Consulta Legal · Sur de Honduras',
    description:
      'Abogados en Caridad, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención coordinada desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Valle, Honduras',
    heroTitle: 'Abogados en Caridad, Valle',
    heroSubtitle:
      'Atendemos a residentes de Caridad y municipios cercanos en defensa penal, derecho de familia, laboral y civil, con el respaldo de un bufete del sur de Honduras.',
    intro:
      'Caridad es un municipio del departamento de Valle, próximo a San Lorenzo y a unos 30 km de Nacaome. Prestamos servicios jurídicos a familias, trabajadores y comerciantes de Caridad y sus aldeas, coordinando audiencias y diligencias ante los juzgados con competencia en el departamento.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación penal conforme al Código Penal hondureño (Decreto 130-2017 y reformas) para residentes de Caridad. Asistencia en detenciones y audiencias.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia, custodia y visitas ante los juzgados de familia con competencia en Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría laboral para trabajadores agrícolas y comerciales de Caridad.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, compraventas, poderes y trámites registrales para residentes de Caridad y el departamento de Valle.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Caridad?', respuesta: 'Nuestra sede física está en Nacaome, a unos 30 km de Caridad. Coordinamos la atención por WhatsApp y teléfono y nos desplazamos cuando el caso lo requiere.' },
      { pregunta: '¿Atienden casos penales en Caridad?', respuesta: 'Sí. Asumimos la defensa penal conforme al Código Penal hondureño vigente, incluyendo audiencia inicial, medidas cautelares y juicio oral.' },
      { pregunta: '¿Cómo solicito una consulta desde Caridad?', respuesta: 'Escríbanos por WhatsApp al +504 9536-3724 indicando que es de Caridad. Las condiciones de la evaluación inicial se confirman según el asunto; cuando se requiera representación formal, se entrega un presupuesto por escrito.' },
    ],
    geo: { lat: 13.74, lng: -87.46 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera del Litoral Pacífico (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'cuando-necesito-abogado-penalista-honduras', titulo: '¿Cuándo necesito un abogado penalista en Honduras?' },
    ],
  },
  {
    slug: 'alianza',
    ciudad: 'Alianza',
    departamento: 'Valle',
    sedeFisica: false,
    distanciaKm: 25,
    title: 'Abogados en Alianza, Valle — Asesoría Jurídica',
    description:
      'Abogados en Alianza, Valle (Honduras). Defensa penal, familia, laboral y civil. Atención coordinada desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Valle, Honduras',
    heroTitle: 'Abogados en Alianza, Valle',
    heroSubtitle:
      'Atendemos a residentes de Alianza y la zona fronteriza de Valle en defensa penal, familia, laboral y civil con un bufete del sur de Honduras.',
    intro:
      'Alianza es un municipio del departamento de Valle, próximo a Goascorán y a la frontera con El Salvador, a unos 25 km de Nacaome. Atendemos a familias y trabajadores de Alianza con servicios jurídicos integrales coordinados desde nuestra sede en Nacaome.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Defensa técnica en procesos penales conforme al Código Penal hondureño para residentes de Alianza y la zona fronteriza.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia y custodia ante los juzgados de familia con competencia en Valle.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría laboral para trabajadores agrícolas de Alianza.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, herencias, poderes notariales y trámites registrales para residentes de Alianza.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Alianza?', respuesta: 'Nuestra sede está en Nacaome, a unos 25 km de Alianza. Coordinamos la atención por WhatsApp y teléfono y nos desplazamos cuando es necesario.' },
      { pregunta: '¿Atienden casos penales en Alianza?', respuesta: 'Sí. Asumimos la defensa penal conforme al Código Penal hondureño, desde la audiencia inicial hasta el juicio oral y los recursos.' },
      { pregunta: '¿Cómo solicito una consulta desde Alianza?', respuesta: 'Escríbanos por WhatsApp al +504 9536-3724 indicando que es de Alianza. Las condiciones de la evaluación inicial se confirman según el asunto; cuando se requiera representación formal, se entrega un presupuesto por escrito.' },
    ],
    geo: { lat: 13.78, lng: -87.71 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera departamental de Valle (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'que-hacer-si-me-detienen-en-honduras', titulo: '¿Qué hacer si me detienen en Honduras?' },
    ],
  },
  {
    slug: 'concepcion-de-maria',
    ciudad: 'Concepción de María',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 65,
    title: 'Abogados en Concepción de María, Choluteca — Consulta Legal',
    description:
      'Abogados en Concepción de María, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en Concepción de María',
    heroSubtitle:
      'Atendemos a residentes de Concepción de María y el sur de Choluteca en defensa penal, familia, laboral y civil con un bufete del sur de Honduras.',
    intro:
      'Concepción de María es un municipio del departamento de Choluteca, en el sur de Honduras, a unos 65 km de Nacaome. Prestamos servicios jurídicos a familias, agricultores y comerciantes de Concepción de María y sus aldeas, coordinando presencia ante los juzgados con competencia en Choluteca.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación penal conforme al Código Penal hondureño (Decreto 130-2017 y reformas) para residentes de Concepción de María.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia y custodia ante los juzgados de familia con competencia en Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría laboral para trabajadores agrícolas y comerciales de Concepción de María.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, herencias, poderes y trámites registrales para residentes de Concepción de María.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en Concepción de María?', respuesta: 'Nuestra sede física está en Nacaome, Valle, a unos 65 km de Concepción de María. Coordinamos la atención por WhatsApp y nos desplazamos para audiencias y diligencias.' },
      { pregunta: '¿Atienden casos penales en Concepción de María?', respuesta: 'Sí. Asumimos la defensa penal conforme al Código Penal hondureño vigente, coordinando presencia en los juzgados de Choluteca.' },
      { pregunta: '¿Cómo solicito una consulta desde Concepción de María?', respuesta: 'Escríbanos por WhatsApp al +504 9536-3724 indicando su municipio. Las condiciones de la evaluación inicial se confirman según el asunto; cuando se requiera representación formal, se entrega un presupuesto por escrito.' },
    ],
    geo: { lat: 13.20, lng: -87.15 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera departamental (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'defensa-penal-honduras', titulo: 'Defensa Penal en Honduras: Guía de las Primeras Horas' },
    ],
  },
  {
    slug: 'san-antonio-de-flores',
    ciudad: 'San Antonio de Flores',
    departamento: 'Choluteca',
    sedeFisica: false,
    distanciaKm: 55,
    title: 'Abogados en San Antonio de Flores, Choluteca — Asesoría Legal',
    description:
      'Abogados en San Antonio de Flores, Choluteca (Honduras). Defensa penal, familia, laboral y civil. Atención desde Nacaome. WhatsApp: +504 9536-3724.',
    heroEyebrow: 'Choluteca, Honduras',
    heroTitle: 'Abogados en San Antonio de Flores',
    heroSubtitle:
      'Atendemos a residentes de San Antonio de Flores y el departamento de Choluteca en defensa penal, familia, laboral y civil con un bufete del sur de Honduras.',
    intro:
      'San Antonio de Flores es un municipio del departamento de Choluteca, en el sur de Honduras, a unos 55 km de Nacaome. Prestamos servicios jurídicos a familias, agricultores y comerciantes de San Antonio de Flores y sus aldeas, coordinando presencia ante los juzgados con competencia en Choluteca.',
    servicios: [
      { titulo: 'Defensa penal', descripcion: 'Representación penal conforme al Código Penal hondureño vigente para residentes de San Antonio de Flores.' },
      { titulo: 'Derecho de familia', descripcion: 'Divorcios, pensión alimenticia y custodia ante los juzgados de familia con competencia en Choluteca.' },
      { titulo: 'Derecho laboral', descripcion: 'Reclamación de prestaciones, despidos y asesoría laboral para trabajadores agrícolas de San Antonio de Flores.' },
      { titulo: 'Derecho civil y notarial', descripcion: 'Contratos, herencias, poderes y trámites registrales para residentes de San Antonio de Flores.' },
    ],
    faqs: [
      { pregunta: '¿Tienen oficina en San Antonio de Flores?', respuesta: 'Nuestra sede física está en Nacaome, Valle, a unos 55 km de San Antonio de Flores. Coordinamos la atención por WhatsApp y nos desplazamos cuando el caso lo requiere.' },
      { pregunta: '¿Atienden casos penales en San Antonio de Flores?', respuesta: 'Sí. Asumimos la defensa penal conforme al Código Penal hondureño, coordinando presencia en los juzgados de Choluteca.' },
      { pregunta: '¿Cómo solicito una consulta desde San Antonio de Flores?', respuesta: 'Escríbanos por WhatsApp al +504 9536-3724 indicando su municipio. Las condiciones de la evaluación inicial se confirman según el asunto; cuando se requiera representación formal, se entrega un presupuesto por escrito.' },
    ],
    geo: { lat: 13.45, lng: -87.30 },
    servedFrom: SEDE_CANONICA.descripcion,
    serviceModes: ['remote', 'office', 'travel'],
    distanceSource: "Carretera departamental (Google Maps)",
    distanceCheckedAt: '2026-07-25',
    postsRelacionados: [
      { categoria: 'derecho-penal', slug: 'que-hacer-si-me-detienen-en-honduras', titulo: '¿Qué hacer si me detienen en Honduras?' },
    ],
  },
];

/**
 * Top ciudades para la sección visual principal de Cobertura en la Home.
 *
 * Criterio (Jul 2026, ajustado Ago 2026):
 * - Solo se destacan landings INDEXABLES: las 9 landings `NOINDEX_UNTIL_UNIQUE`
 *   (pespire, marcovia, namasigue, orocuina, langue, caridad, alianza,
 *   concepcion-de-maria, san-antonio-de-flores) quedan fuera de módulos
 *   destacados y listados SEO automáticos hasta tener valor local único
 *   (fuente: data/seo/local-landing-indexability.json).
 * - Balance departamental: sede (Nacaome), mayores ciudades y fronteras.
 *
 * Esta lista solo controla qué landings indexables se muestran en la Home
 * para evitar saturación visual y mejorar UX.
 */
export const TOP_COBERTURA_SLUGS = new Set([
  'nacaome',
  'choluteca',
  'san-lorenzo',
  'goascoran',
  'san-marcos-de-colon',
  'el-triunfo',
  'amapala',
]);

/** Devuelve las landings destacadas para la Home (top indexables). */
export function getFeaturedLandings(): LandingLocal[] {
  return landingsLocales.filter((l) => TOP_COBERTURA_SLUGS.has(l.slug));
}

/**
 * Decisión de indexabilidad de una landing (fuente única).
 * Exportado para tests y componentes que necesiten clasificar.
 */
export function getLandingIndexability(slug: string): {
  indexable: boolean;
  decision?: string;
} {
  return {
    indexable: !isLandingNoindex(slug),
    decision: getLandingDecision(slug),
  };
}

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
  // Las demás ciudades usan /og-image.webp como fallback (archivo genérico de 1200×630).
  // Las imágenes OG específicas se añadirán cuando se generen assets visuales por ciudad.
};

export function landingMetadata(landing: LandingLocal): Metadata {
  const canonicalPath = landing.path ?? `/abogados-en-${landing.slug}`;
  const ogImage = LANDING_OG_IMAGES[landing.slug] ?? '/og-image.webp';
  // Title SEO diferenciado por tipo de ciudad para evitar canibalización:
  // antes TODAS las landings compartían "Abogados en {ciudad} | Pineda y
  // Asociados", compitiendo entre sí en SERP. Ahora cada tipo de ciudad tiene
  // una variante única (≤60 chars). Si la landing trae `seoTitle` propio,
  // tiene prioridad.
  const seoTitle =
    landing.seoTitle ??
    (landing.sedeFisica
      ? `Abogados en ${landing.ciudad} · Bufete con Sede en Valle`
      : landing.distanciaKm <= 60
        ? `Abogados en ${landing.ciudad} | Sur de Honduras`
        : `Abogados en ${landing.ciudad} | Bufete desde Nacaome`);
  // Decisiones de indexabilidad: las landings NOINDEX_UNTIL_UNIQUE emiten
  // `noindex, follow` (fuente única: data/seo/local-landing-indexability.json).
  const noindex = isLandingNoindex(landing.slug);
  return buildMetadata({
    title: seoTitle,
    description: landing.description,
    canonicalPath,
    noindex,
    noindexFollow: true,
    // Keywords des-canibalizadas: NO incluye "abogado penalista {ciudad}"
    // (esa keyword la targetean las landings de cargo dedicadas
    // /abogado-penalista-nacaome y /abogado-penalista-choluteca).
    // Se sustituye por "bufete jurídico {ciudad}" no competitiva.
    keywords: [
      `abogados en ${landing.ciudad}`,
      `bufete de abogados ${landing.ciudad}`,
      `bufete jurídico ${landing.ciudad}`,
      `abogado ${landing.departamento} Honduras`,
      `consulta jurídica ${landing.ciudad}`,
    ],
    ogImage,
    ogImageAlt: landing.title,
  });
}

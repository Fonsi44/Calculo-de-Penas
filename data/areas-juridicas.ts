/**
 * Taxonomía de Servicios Jurídicos del bufete.
 *
 * Estructura:
 *   - 1 hub de servicios jurídicos generales (13 áreas)
 *   - 1 hub de derecho penal con 7 grupos especializados
 *   - 1 hub de Hondureños en España con 3 subáreas
 *
 * Cada entrada expone:
 *   - slug estable (URL canónica, sin acentos, en kebab-case)
 *   - titulo, resumen y descripcion SEO (orientados a Honduras)
 *   - subservicios (string[]) para bullets de "qué hacemos"
 *   - faqs para JSON-LD FAQPage
 *   - areasRelacionadas (slugs) para interlinking
 *   - keywords long-tail (sin duplicar site.keywords global)
 *   - color: prefijo tailwind para PlaceholderPhoto (bg-{color}-*)
 *
 * Este archivo NO se importa desde proxy ni desde el cliente
 * si no se necesita: está pensado para server components y rutas
 * dinámicas (generateStaticParams).
 */

export type Subservicio = {
  titulo: string;
  descripcion: string;
};

export type FaqItem = {
  pregunta: string;
  respuesta: string;
};

/**
 * Campos opcionales de detalle (FASE 3 — optimización de servicios prioritarios).
 *
 * Permiten enriquecer una página de área con bloques editoriales propios sin
 * obligar a las áreas secundarias a aportarlos: si un campo no está, la página
 * dinámica `[slug]/page.tsx` simplemente no renderiza el bloque asociado.
 *
 * Ningún campo aquí introducido publica afirmaciones jurídicas verificadas:
 * los rangos/plazos/porcentajes pendientes (P01-P15) se conservan como están y
 * las cifras se sustituyen por criterios generales prudentes cuando procede.
 */
export type FuenteGeneral = {
  titulo: string;
  institucion: string;
  url?: string;
};

export type PasoProceso = {
  titulo: string;
  descripcion: string;
};

export type BloqueSeparacion = {
  titulo: string;
  items: string[];
};

export type AreaDetailFields = {
  /** Respuesta directa ~50-100 palabras (citlabe GEO/AEO), post-H1. §5 */
  respuestaDirecta?: string;
  /** Situaciones habituales que atiende el área. §4.3 */
  situacionesHabituales?: string[];
  /** Separación por tipo de audiencia o figura (trabajador/empleador, civil/notarial/registral). §8/§9 */
  separacionAudiencias?: BloqueSeparacion[];
  /** Documentos iniciales orientativos + nota de privacidad. §4.5/§10 */
  documentosIniciales?: {
    items: string[];
    nota?: string;
  };
  /** Proceso general del área (etapas prudentes, sin plazos cerrados). §4.6/§11 */
  proceso?: {
    intro?: string;
    pasos: PasoProceso[];
    nota?: string;
  };
  /** Autoridades o instituciones posiblemente involucradas (texto general). §4.7 */
  autoridades?: string[];
  /** Factores que pueden variar según el caso. §4.8 */
  factoresQueVarian?: string[];
  /** Errores frecuentes que conviene evitar. §4.9 */
  erroresFrecuentes?: string[];
  /** Fuentes oficiales generales consultadas (se muestran como "Fuentes generales"). §13 */
  fuentesGenerales?: FuenteGeneral[];
  /** CTA contextual del área (href con ?motivo=... y label). §15 */
  ctaContextual?: {
    href: string;
    label: string;
  };
};

export type AreaBase = AreaDetailFields & {
  slug: string;
  titulo: string;
  resumen: string;
  descripcion: string;
  icono: string;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
  subservicios: Subservicio[];
  faqs: FaqItem[];
  areasRelacionadas: string[];
  keywords: string[];
  destacado?: string;
};

export type HubPenal = AreaDetailFields & {
  slug: 'derecho-penal';
  titulo: string;
  resumen: string;
  descripcion: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  grupos: AreaBase[];
  faqs: FaqItem[];
  areasRelacionadas: string[];
  keywords: string[];
};

export type HubMigrantes = {
  slug: 'hondurenos-en-espana';
  titulo: string;
  resumen: string;
  descripcion: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  subareas: AreaBase[];
  faqs: FaqItem[];
  areasRelacionadas: string[];
  keywords: string[];
};

export type AreaStandalone = AreaBase & {
  slug: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
};

/* -------------------------------------------------------------------------- */
/* 13 ÁREAS STANDALONE — Servicios jurídicos generales                         */
/* -------------------------------------------------------------------------- */

export const areasGenerales: AreaStandalone[] = [
  {
    slug: 'derecho-de-familia',
    titulo: 'Derecho de Familia',
    resumen: 'Abogado de familia en Nacaome y Honduras: divorcios, custodia, pensión de alimentos, sucesiones, violencia intrafamiliar y protección de menores con atención personalizada.',
    descripcion:
      `Defendemos sus <strong>derechos familiares</strong> en divorcios, custodia, pensión de alimentos, sucesiones y violencia intrafamiliar en Nacaome, San Lorenzo, Choluteca y la zona sur de Honduras. Actuamos ante los <strong>Juzgados de Familia</strong> y en el <strong>Centro de Mediación del Poder Judicial</strong> cuando conviene una solución pactada. Le acompañamos desde la primera consulta confidencial hasta la ejecución de la sentencia, con comunicación directa del abogado responsable, plazos claros y un presupuesto por escrito.`,
    icono: 'users',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Abogado de Familia en Nacaome',
    heroSubtitle:
      'Divorcio, custodia, régimen de comunicación, pensión de alimentos, reconocimiento, protección de menores y violencia intrafamiliar en Nacaome, Valle y el sur de Honduras. Atención humana, estrategia legal clara y defensa técnica ante Juzgados de Familia y Centros de Mediación. Cada caso se valora según sus circunstancias concretas.',
    // §5 — respuesta directa citable (GEO/AEO). Sin cifras P01/P02: se describe
    // el alcance y se remite el cálculo al análisis individual del caso.
    respuestaDirecta:
      'Pineda y Asociados asesora y representa en asuntos de derecho de familia desde su sede en Nacaome, Valle. Atiende divorcio (mutuo acuerdo y contencioso), custodia y régimen de comunicación, pensión de alimentos, reconocimiento o impugnación de filiación, protección de menores y violencia intrafamiliar, incluyendo medidas urgentes. La cuantificación de la pensión, la custodia y los plazos dependen de las circunstancias concretas del caso y de la decisión de la autoridad competente conforme a la legislación vigente.',
    situacionesHabituales: [
      'Divorcio de mutuo acuerdo o contencioso, con o sin bienes ni menores.',
      'Fijación, modificación o incumplimiento de custodia y régimen de comunicación.',
      'Demanda, cuantificación, revisión o ejecución de pensión de alimentos.',
      'Reconocimiento o impugnación de paternidad y filiación.',
      'Protección de menores y medidas urgentes frente a violencia intrafamiliar.',
      'Sucesiones, declaratoria de herederos y liquidación de régimen patrimonial.',
      'Mediación familiar y acuerdos reparatorios cuando conviene una salida pactada.',
    ],
    documentosIniciales: {
      // §10 familia. No se piden públicamente datos completos de menores.
      items: [
        'Identidad de las personas adultas involucradas',
        'Certificados pertinentes (matrimonio, nacimiento según el caso)',
        'Resoluciones judiciales o actas previas, si las hubiera',
        'Comprobantes de gastos (educación, salud, vivienda) cuando proceda',
        'Documentos del asunto: actas, acuerdos, denuncias o escritos previos',
      ],
      nota:
        'No envíe datos completos de menores ni documentos originales en el primer contacto. El despacho le indicará el medio adecuado y la documentación específica según su caso.',
    },
    proceso: {
      intro:
        'El recorrido varía según el tipo de asunto (mutuo acuerdo o contencioso) y la carga judicial. Estos pasos son orientativos.',
      pasos: [
        { titulo: 'Contacto inicial', descripcion: 'Conversación confidencial para entender su situación y prioridades, sin compromiso.' },
        { titulo: 'Revisión preliminar', descripcion: 'Análisis de los hechos, la documentación disponible y las opciones viables.' },
        { titulo: 'Solicitud de documentación', descripcion: 'Le indicamos qué documentos específicos necesitamos para evaluar el caso.' },
        { titulo: 'Explicación de opciones', descripcion: 'Le exponemos las alternativas (acuerdo, mediación o litigio) con sus riesgos y beneficios.' },
        { titulo: 'Presupuesto por escrito', descripcion: 'Honorarios y costos estimados, sin sorpresas, antes de iniciar actuaciones.' },
        { titulo: 'Aceptación formal', descripcion: 'Confirmación del encargo y de la estrategia acordada por escrito.' },
        { titulo: 'Actuación', descripcion: 'Representación y defensa ante la autoridad competente o negociación del acuerdo.' },
        { titulo: 'Seguimiento', descripcion: 'Comunicación sobre avances, incidencias y ejecución de lo resuelto.' },
      ],
    },
    autoridades: [
      'Juzgados de Familia',
      'Centro de Mediación del Poder Judicial',
      'Juzgados de Paz (medidas urgentes)',
      'Ministerio Público (violencia intrafamiliar)',
      'DINAF (protección de menores)',
    ],
    // §7 — criterios generales en lugar de cifras pendientes (P01/P02 no se
    // refuerzan: se describen los factores que valora la autoridad).
    factoresQueVarian: [
      'Necesidades de las personas beneficiarias (menores y otras).',
      'Capacidad económica del obligado y de quien solicita.',
      'Número de personas beneficiarias y su situación.',
      'Salud, educación y vivienda de los involucrados.',
      'Pruebas disponibles y su valoración por la autoridad.',
      'Decisión final del juez o autoridad competente según la legislación vigente.',
    ],
    erroresFrecuentes: [
      'Postergar la consulta hasta que el conflicto se agrava y se pierden opciones tempranas.',
      'Firmar acuerdos sin revisión técnica, renunciando a derechos sin saberlo.',
      'Presentar pruebas desordenadas o incompletas que debilitan la posición.',
      'Confundir acuerdo privado con resolución con efectos jurídicos plenos.',
      'Esperar a recopilar toda la documentación antes de buscar orientación.',
    ],
    fuentesGenerales: [
      { titulo: 'Código de Familia de Honduras', institucion: 'Poder Judicial de Honduras / Tribunal Supremo de Justicia', url: 'https://www.poderjudicial.gob.hn' },
      { titulo: 'Centro de Mediación del Poder Judicial', institucion: 'Poder Judicial de Honduras', url: 'https://www.poderjudicial.gob.hn' },
      { titulo: 'Convenio de La Haya de 1980 (sustracción internacional de menores)', institucion: 'Conferencia de La Haya de Derecho Internacional Privado', url: 'https://www.hcch.net' },
    ],
    ctaContextual: {
      href: '/solicitar-consulta?motivo=derecho-de-familia#formulario',
      label: 'Explicar mi situación familiar',
    },
    subservicios: [
      { titulo: 'Divorcio por mutuo acuerdo', descripcion: 'Tramitación express ante el Juzgado de Familia cuando no hay menores ni bienes en disputa.' },
      { titulo: 'Divorcio contencioso', descripcion: 'Litigio por causales taxativas con estrategia probatoria robusta.' },
      { titulo: 'Custodia compartida, exclusiva y monoparental', descripcion: 'Negociación o defensa judicial con enfoque en el interés superior del menor.' },
      { titulo: 'Régimen de visitas y convivencia', descripcion: 'Fijación, modificación y ejecución de incumplimiento del régimen.' },
      { titulo: 'Pensión de alimentos', descripcion: 'Demanda, cuantificación, ejecución y revisión por cambio de circunstancias.' },
      { titulo: 'Reconocimiento de unión de hecho', descripcion: 'Procedimiento notarial o judicial para reconocimiento de derechos patrimoniales.' },
      { titulo: 'Adopción nacional', descripcion: 'Tramitación ante SENAF, IHNFA y Juzgados de Familia con acompañamiento integral.' },
      { titulo: 'Restitución internacional de menores (Convenio de La Haya 1980)', descripcion: 'Cooperación jurídica internacional para retorno de menores trasladados ilícitamente.' },
      { titulo: 'Sucesiones intestadas y testamentarias', descripcion: 'Declaratoria de herederos, inventario, avalúo, partición y adjudicación.' },
      { titulo: 'Testamentos (ológrafo, abierto, cerrado, especial)', descripcion: 'Otorgamiento ante notario y protocolización.' },
      { titulo: 'Capitulaciones matrimoniales', descripcion: 'Régimen patrimonial del matrimonio y separación de bienes.' },
      { titulo: 'Violencia intrafamiliar y medidas de protección', descripcion: 'Solicitud urgente de medidas cautelares ante Juzgados y Juzgados de Paz.' },
      { titulo: 'Emancipación judicial de menores', descripcion: 'Procedimiento especial ante Juez de Familia.' },
      { titulo: 'Curatela y tutela', descripcion: 'Designación, rendición de cuentas y remoción.' },
      { titulo: ' Filiación y declaración de paternidad', descripcion: 'Investigación judicial de paternidad con prueba de ADN.' },
      { titulo: 'Liquidación de régimen patrimonial', descripcion: 'Liquidación de sociedad conyugal o comunidad de bienes.' },
      { titulo: 'Mediación familiar', descripcion: 'Centro de Mediación del Poder Judicial o mediación privada con efectos de cosa juzgada.' },
    ],
    faqs: [
      { pregunta: '¿Cuánto tarda un divorcio en Honduras?', respuesta: 'Un divorcio por mutuo acuerdo suele resolverse en varios meses cuando no hay menores ni bienes en disputa; un contencioso puede prolongarse según la complejidad y la carga judicial. El plazo concreto depende del caso y del juzgado.' },
      // P01 preservada: NO se publica como verificada, NO se refuerza el rango.
      // Se describe el procedimiento y se remite el cálculo a la decisión judicial.
      { pregunta: '¿Cómo se fija la pensión de alimentos en Honduras?', respuesta: 'La pensión la determina la autoridad competente valorando las necesidades de las personas beneficiarias, la capacidad económica del obligado, el número de beneficiarios, la salud, la educación y otros gastos. No existe una fórmula única aplicable a todos los casos; el resultado depende de las circunstancias y de las pruebas.' },
      { pregunta: '¿Puedo solicitar la custodia compartida?', respuesta: 'Sí. El Código de Familia la contempla y la autoridad valora la capacidad de cada progenitor, el interés superior del menor, su opinión según la edad y la cercanía de los domicilios, entre otros factores. Ningún progenitor tiene preferencia automática.' },
      { pregunta: '¿Qué ocurre si no se paga la pensión de alimentos?', respuesta: 'La pensión puede ejecutarse forzosamente mediante embargo de salario, cuentas o bienes. El incumplimiento puede tener consecuencias legales adicionales según el caso. La vía concreta se define tras revisar las resoluciones aplicables.' },
      { pregunta: '¿Necesito ir a juicio para divorciarme?', respuesta: 'No siempre. Si hay acuerdo sobre los términos, puede tramitarse por la vía del mutuo acuerdo. Cuando no hay acuerdo o existen menores o bienes en disputa, suele requerirse un proceso contencioso. Le explicamos ambas opciones antes de decidir.' },
      { pregunta: '¿Puedo obtener medidas urgentes en un caso de violencia intrafamiliar?', respuesta: 'Sí. Pueden solicitarse medidas de protección urgentes ante la autoridad competente. La procedencia, el alcance y la duración dependen de los hechos y de la valoración que realice la autoridad conforme a la legislación vigente.' },
      { pregunta: '¿Atienden a familias que residen fuera de Honduras?', respuesta: 'Sí, coordinamos asuntos familiares con elementos internacionales (restitución de menores, pensión entre países, reconocimiento de sentencias). Algunos trámites requieren intervenir autoridades o profesionales en el otro país; se lo indicamos con claridad tras revisar el caso.' },
    ],
    areasRelacionadas: ['derecho-civil-y-notarial', 'conciliacion-y-arbitraje', 'derecho-laboral'],
    keywords: [
      'abogado de familia Nacaome',
      'divorcio Honduras',
      'pensión de alimentos Honduras',
      'custodia de menores Valle',
      'sucesiones Honduras',
      'violencia intrafamiliar Honduras',
    ],
    destacado: 'Cada caso de familia se valora según sus circunstancias concretas; los plazos y resultados dependen de la decisión de la autoridad competente.',
  },
  {
    slug: 'derecho-laboral',
    titulo: 'Derecho Laboral',
    resumen: 'Abogado laboralista en Nacaome y Honduras: despidos injustificados, cálculo de prestaciones, aguinaldo, riesgos profesionales, acoso laboral y asesoría preventiva a empresas.',
    descripcion:
      `Reclamamos <strong>preaviso, cesantía, vacaciones, aguinaldo y décimo tercer mes</strong> en despidos injustificados. Defendemos trabajadores en riesgos profesionales y accidentes laborales ante el <strong><a href="https://www.ihss.hn" target="_blank" rel="noopener noreferrer">IHSS</a></strong>, y representamos a empresas en cumplimiento normativo, contratos y reglamentos internos. Actuamos ante <strong>Inspecciones del Trabajo, Tribunales de Conciliación y Juzgados del Trabajo</strong> en la zona sur de Honduras. Le entregamos un presupuesto por escrito y le explicamos cada etapa del proceso.`,
    icono: 'briefcase',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Abogado Laboral en Nacaome',
    heroSubtitle:
      'Despidos, prestaciones, salario, vacaciones, riesgos profesionales y acoso laboral para trabajadores, y contratos, reglamentos y prevención de conflictos para empleadores. Defensa técnica ante Inspecciones del Trabajo, Tribunales de Conciliación y Juzgados del Trabajo en el sur de Honduras. Los importes y plazos dependen de cada relación laboral y de la documentación disponible.',
    // §5 — respuesta directa citable. Diferencia décimo tercer mes (aguinaldo)
    // de décimo cuarto mes SIN añadir fechas o reglas sustantivas nuevas.
    respuestaDirecta:
      'Pineda y Asociados asesora y representa en asuntos laborales desde su sede en Nacaome, Valle, tanto a trabajadores como a empleadores. Para trabajadores atiende despido y terminación, prestaciones (preaviso, cesantía, vacaciones), salario, jornada, horas extraordinarias, maternidad y riesgos profesionales. Para empleadores cuida contratos, reglamentos, terminaciones y prevención de conflictos. Los importes, recargos y plazos dependen de la relación laboral, la documentación y la legislación vigente; el análisis del caso es determinante.',
    // §8 — separación explícita trabajador / empleador.
    separacionAudiencias: [
      {
        titulo: 'Para trabajadores',
        items: [
          'Despido injustificado y despido indirecto',
          'Terminación de la relación laboral',
          'Prestaciones: preaviso, cesantía, vacaciones',
          'Salario, jornada y horas extraordinarias',
          'Maternidad y estabilidad laboral',
          'Riesgos profesionales y accidentes de trabajo',
          'Acoso laboral y discriminación',
          'Revisión de documentación laboral',
        ],
      },
      {
        titulo: 'Para empleadores',
        items: [
          'Contratos individuales y colectivos',
          'Reglamentos internos de trabajo',
          'Terminaciones y gestión de bajas',
          'Cumplimiento normativo laboral',
          'Reclamaciones de trabajadores',
          'Prevención de conflictos laborales',
          'Conciliación prejudicial',
          'Defensa ante Inspecciones y Juzgados del Trabajo',
        ],
      },
    ],
    documentosIniciales: {
      items: [
        'Contrato individual de trabajo (si existe)',
        'Comprobantes de pago (planillas, recibos)',
        'Fecha de ingreso y, en su caso, fecha de despido',
        'Comunicaciones relacionadas con la relación o el despido',
        'Carta de despido o constancia de terminación',
        'Registros de jornada cuando existan',
      ],
      nota:
        'La documentación exacta depende del asunto. No envíe documentos originales ni información especialmente sensible antes de que el despacho le indique un medio adecuado.',
    },
    proceso: {
      intro:
        'El recorrido varía según se actúe como trabajador o como empleador y según la vía (administrativa o judicial). Estos pasos son orientativos.',
      pasos: [
        { titulo: 'Contacto inicial', descripcion: 'Conversación confidencial para entender la relación laboral y el problema planteado.' },
        { titulo: 'Revisión preliminar', descripcion: 'Análisis del contrato, los pagos y la documentación disponible.' },
        { titulo: 'Solicitud de documentación', descripcion: 'Le indicamos qué documentos específicos necesitamos para evaluar el caso.' },
        { titulo: 'Explicación de opciones', descripcion: 'Le exponemos las alternativas (conciliación o litigio) con sus riesgos y beneficios.' },
        { titulo: 'Presupuesto por escrito', descripcion: 'Honorarios y costos estimados antes de iniciar actuaciones.' },
        { titulo: 'Aceptación formal', descripcion: 'Confirmación del encargo y de la estrategia acordada por escrito.' },
        { titulo: 'Actuación', descripcion: 'Representación ante Inspección, Tribunal de Conciliación o Juzgado del Trabajo.' },
        { titulo: 'Seguimiento', descripcion: 'Comunicación sobre avances, incidentes y ejecución de lo resuelto.' },
      ],
    },
    autoridades: [
      'Secretaría del Trabajo y Seguridad Social',
      'Inspección del Trabajo',
      'Tribunales de Conciliación',
      'Juzgados del Trabajo',
      'Corte Suprema de Justicia (casación laboral)',
      'Instituto Hondureño de Seguridad Social (IHSS)',
    ],
    // Sin calculadoras ni fórmulas. Criterios generales; P03/P04 preservados.
    factoresQueVarian: [
      'Antigüedad y modalidad del contrato de trabajo.',
      'Causa y forma de terminación de la relación.',
      'Salario devengado y conceptos no pagados.',
      'Jornada, horas extraordinarias y recargos aplicables.',
      'Existencia de fuero (maternidad, sindical, enfermedad).',
      'Documentación disponible y pruebas del caso.',
    ],
    erroresFrecuentes: [
      'Firmar la liquidación o renuncia sin revisión técnica previa.',
      'Aceptar como definitivo un cálculo de prestaciones sin verificar conceptos.',
      'No conservar comprobantes de pago ni constancias de la relación.',
      'Demorar la reclamación hasta que se dificulta la prueba.',
      'Para empleadores: no documentar adecuadamente la causa de una terminación.',
    ],
    fuentesGenerales: [
      { titulo: 'Código del Trabajo de Honduras', institucion: 'Tribunal Supremo de Justicia / Secretaría del Trabajo', url: 'https://www.tsc.gob.hn/web/leyes/codigo_de_trabajo.pdf' },
      { titulo: 'Decreto 135-80 (Ley de Aguinaldos)', institucion: 'Secretaría de Trabajo y Seguridad Social', url: 'https://www.trabajo.gob.hn' },
      { titulo: 'Reglamento del Seguro Social (IHSS)', institucion: 'Instituto Hondureño de Seguridad Social', url: 'https://www.ihss.hn' },
    ],
    ctaContextual: {
      href: '/solicitar-consulta?motivo=derecho-laboral#formulario',
      label: 'Solicitar revisión inicial de mi situación laboral',
    },
    subservicios: [
      { titulo: 'Despido injustificado', descripcion: 'Cálculo y reclamación de prestaciones: preaviso, cesantía, vacaciones, aguinaldo y décimo tercer mes.' },
      { titulo: 'Despido indirecto por incumplimiento del empleador', descripcion: 'Artículo 113 del Código de Trabajo: reclamo por falta de condiciones dignas.' },
      { titulo: 'Aguinaldo y décimo tercer mes', descripcion: 'Reclamación administrativa y judicial del pago correspondiente.' },
      { titulo: 'Vacaciones y días feriados', descripcion: 'Liquidación de derechos vacacionales fraccionados.' },
      { titulo: 'Horas extras y recargos nocturnos', descripcion: 'Cálculo y demanda por trabajo suplementario no pagado.' },
      { titulo: 'Riesgos profesionales y accidente de trabajo', descripcion: 'Reclamación ante el IHSS y la empresa. Indemnización por muerte, incapacidad o invalidez.' },
      { titulo: 'Enfermedad profesional', descripcion: 'Calificación de la enfermedad y reclamo de prestaciones.' },
      { titulo: 'Contrato individual de trabajo', descripcion: 'Redacción, revisión y terminación con asistencia legal.' },
      { titulo: 'Contrato por tiempo indefinido, plazo fijo y por obra', descripcion: 'Configuración jurídica óptima según el caso.' },
      { titulo: 'Suspensión de contratos', descripcion: 'Procedimiento ante la Secretaría del Trabajo.' },
      { titulo: 'Reinstalación por estabilidad laboral', descripcion: 'Trabajadores con fuero sindical, maternidad o enfermedad.' },
      { titulo: 'Acoso laboral y mobbing', descripcion: 'Denuncia, prueba y reclamo por daño moral.' },
      { titulo: 'Discriminación salarial o de género', descripcion: 'Reclamación con perspectiva de derechos humanos.' },
      { titulo: 'Conciliación prejudicial', descripcion: 'Comparecencia ante el Inspector del Trabajo y el Tribunal de Conciliación.' },
      { titulo: 'Juicio oral laboral', descripcion: 'Defensa técnica en todas las instancias.' },
      { titulo: 'Recurso de casación laboral', descripcion: 'Ante la Corte Suprema de Justicia cuando proceda.' },
      { titulo: 'Asesoría preventiva a empleadores', descripcion: 'Reglamento interno, contratos tipo, prevención de contingencias.' },
    ],
    faqs: [
      // P04 preservada: no se refuerza el tope. Se describe el procedimiento.
      { pregunta: '¿Qué conceptos pueden reclamarse en un despido sin justa causa?', respuesta: 'Dependiendo de la antigüedad y la modalidad del contrato, pueden reclamarse conceptos como preaviso, cesantía, vacaciones proporcionales, aguinaldo y décimo tercer mes (aguinaldo) proporcionales. El cálculo exacto depende de la relación laboral y de la documentación; se le entrega desglose por escrito tras la revisión.' },
      // P03 preservada: no se confirman fechas. Se describe la figura y se
      // remite a la legislación vigente y al análisis del caso.
      { pregunta: '¿Qué es el aguinaldo y cómo se diferencia del décimo tercer mes?', respuesta: 'En Honduras, el aguinaldo equivale al décimo tercer mes: es una prestación a favor del trabajador. El décimo cuarto mes es una figura distinta. La forma y los plazos de pago se rigen por la legislación vigente; le confirmamos los detalles aplicables a su caso concreto tras la revisión.' },
      { pregunta: '¿Qué debo hacer si sufro un accidente laboral?', respuesta: 'Conviene notificar al empleador de inmediato, recibir la atención que corresponda por el seguro social y reunir la documentación médica. Si existe responsabilidad del empleador, pueden reclamarse prestaciones complementarias. La vía y el importe dependen del caso y de la calificación del siniestro.' },
      { pregunta: '¿Puedo reclamar aunque no tenga contrato escrito?', respuesta: 'La falta de contrato escrito no impide acreditar la relación laboral mediante otros medios (comprobantes de pago, testigos, constancias). La viabilidad de la reclamación y los conceptos exigibles se evalúan caso a caso.' },
      { pregunta: '¿Atienden también a empresas y empleadores?', respuesta: 'Sí. Asesoramos a empleadores en contratos, reglamentos internos, terminaciones, cumplimiento normativo y defensa ante reclamaciones. El objetivo es prevenir conflictos y, cuando surgen, gestionarlos de forma ordenada.' },
      { pregunta: '¿Cuánto tarda un reclamo laboral?', respuesta: 'Depende de la vía (conciliación, proceso administrativo o judicial) y de la carga de los tribunales. Algunos casos se resuelven por acuerdo en semanas; otros pueden prolongarse si llegan a juicio y recursos. Le informamos del horizonte temporal realista al evaluar su caso.' },
      { pregunta: '¿Ofrecen calculadoras automáticas de prestaciones?', respuesta: 'No. Los recargos, topes y plazos pueden variar según la legislación vigente y las circunstancias del caso, por lo que un cálculo automático puede inducir a error. Realizamos el cálculo manual verificado tras revisar su documentación.' },
    ],
    areasRelacionadas: ['conciliacion-y-arbitraje', 'derecho-mercantil-empresarial', 'derecho-civil-y-notarial'],
    keywords: [
      'abogado laboral Honduras',
      'despido injustificado Nacaome',
      'aguinaldo Honduras',
      'riesgos profesionales Honduras',
      'Juzgado del Trabajo Valle',
    ],
  },
  {
    slug: 'derecho-civil-y-notarial',
    titulo: 'Derecho Civil y Notarial',
    resumen: 'Abogado civil y servicios notariales en Nacaome y Honduras: contratos, compraventas, arrendamientos, hipotecas, sucesiones, protocolización, cobros judiciales y derecho de daños.',
    descripcion:
      `Brindamos <strong>asesoría civil y notarial</strong> para personas, empresas y familias en la zona sur de Honduras. Redactamos contratos de compraventa, arrendamiento, hipoteca y fideicomiso; tramitamos protocolizaciones, poderes notariales, testamentos y declaratorias de herederos ante el <strong><a href="https://www.ip.gob.hn" target="_blank" rel="noopener noreferrer">Instituto de la Propiedad</a></strong>. Litigamos acciones posesorias, prescripción adquisitiva, cobros judiciales por vía ejecutiva o monitoria, y reclamaciones por responsabilidad civil. Trabajamos con notarios en Nacaome, San Lorenzo y Choluteca, con presupuesto por escrito y trazabilidad de cada actuación.`,
    icono: 'file-text',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Civil y Servicios Notariales en Nacaome',
    heroSubtitle:
      'Asesoría y litigación civil, actuaciones notariales y actuaciones registrales para personas, familias y empresas en el sur de Honduras. Contratos, propiedad, sucesiones, poderes, cobros judiciales y daños y perjuicios. Algunos trámites requieren notario, tribunal y registro de forma coordinada; le explicamos el recorrido completo según su caso.',
    // §5 — respuesta directa. No afirma capacidad notarial del despacho (no
    // confirmada); se coordina con notarios cuando procede.
    respuestaDirecta:
      'Pineda y Asociados asesora en derecho civil y coordina servicios notariales y registrales desde su sede en Nacaome, Valle. En asesoría y litigación civil atiende contratos, incumplimientos, cobro, daños, propiedad, posesión y sucesiones. En lo notarial coordina poderes, autenticaciones, escrituras, declaraciones y protocolizaciones; y en lo registral, presentación, inscripción, subsanación y seguimiento. Cuando un trámite requiere notario, tribunal y registro, se gestiona de forma coordinada; la viabilidad y los plazos dependen del asunto.',
    // §9 — separación visual y editorial: asesoría/litigación · notarial · registral.
    separacionAudiencias: [
      {
        titulo: 'Asesoría y litigación civil',
        items: [
          'Contratos e incumplimientos',
          'Cobro judicial de deudas',
          'Daños y perjuicios',
          'Propiedad, posesión y servidumbres',
          'Conflictos patrimoniales',
          'Sucesiones y herencias',
        ],
      },
      {
        titulo: 'Actuaciones notariales',
        items: [
          'Poderes y mandatos',
          'Autenticaciones y legalizaciones',
          'Escrituras públicas',
          'Declaraciones juradas',
          'Protocolizaciones',
          'Otros actos confirmados según el caso',
        ],
      },
      {
        titulo: 'Actuaciones registrales',
        items: [
          'Presentación de documentos',
          'Inscripción de actos y derechos',
          'Subsanación de defectos',
          'Seguimiento de expedientes',
          'Coordinación documental con notaría y tribunal',
        ],
      },
    ],
    documentosIniciales: {
      items: [
        'Contratos, títulos o documentos relacionados',
        'Escrituras públicas anteriores cuando existan',
        'Certificaciones registrales o antecedentes',
        'Documentos de identidad necesarios',
        'Poderes vigentes, si los hubiera',
        'Comprobantes o documentos del cobro o del daño, según el caso',
      ],
      nota:
        'La documentación exacta depende del asunto. No envíe documentos originales ni información especialmente sensible antes de que el despacho le indique un medio adecuado.',
    },
    proceso: {
      intro:
        'El recorrido depende de si el asunto es de litigación, notarial o registral (o varios a la vez). Estos pasos son orientativos.',
      pasos: [
        { titulo: 'Contacto inicial', descripcion: 'Conversación confidencial para entender el asunto y el resultado que busca.' },
        { titulo: 'Revisión preliminar', descripcion: 'Estudio de títulos, documentos y antecedentes según el caso.' },
        { titulo: 'Solicitud de documentación', descripcion: 'Le indicamos qué documentos específicos necesitamos para evaluar el caso.' },
        { titulo: 'Explicación de opciones', descripcion: 'Le exponemos las vías posibles (notarial, judicial o registral) con sus plazos y costos.' },
        { titulo: 'Presupuesto por escrito', descripcion: 'Honorarios, aranceles y costos estimados antes de iniciar actuaciones.' },
        { titulo: 'Aceptación formal', descripcion: 'Confirmación del encargo y de la estrategia acordada por escrito.' },
        { titulo: 'Actuación', descripcion: 'Gestión notarial, representación judicial o trámite registral según corresponda.' },
        { titulo: 'Seguimiento', descripcion: 'Comunicación sobre avances, incidencias y entrega final.' },
      ],
    },
    autoridades: [
      'Instituto de la Propiedad (IP)',
      'Registro de la Propiedad y de Comercio',
      'Juzgados de Letras (civil)',
      'Notarías (actos notariales)',
      'Catastro Municipal',
    ],
    factoresQueVarian: [
      'Situación registral y antecedentes de título del bien.',
      'Existencia de gravámenes, limitaciones o anotaciones.',
      'Documentación disponible y su antigüedad.',
      'Vía elegida (notarial, judicial o registral).',
      'Plazos del registro y de los tribunales.',
      'Intervención de varias autoridades cuando el trámite lo requiere.',
    ],
    erroresFrecuentes: [
      'Comprar o recibir en garantía sin estudio previo de títulos.',
      'Firmar contratos sin cláusulas clave ni revisión técnica.',
      'Confundir un acto notarial con uno registral y omitir pasos.',
      'No protocolizar documentos extranjeros cuando procede.',
      'Dejar caducar plazos para reclamar un cobro o un daño.',
    ],
    fuentesGenerales: [
      { titulo: 'Código Civil de Honduras', institucion: 'Tribunal Supremo de Justicia / Poder Judicial de Honduras', url: 'https://www.poderjudicial.gob.hn' },
      { titulo: 'Ley de Propiedad y sus reformas', institucion: 'Instituto de la Propiedad (IP)', url: 'https://www.ip.gob.hn' },
      { titulo: 'Ley del Notariado de Honduras', institucion: 'Poder Judicial de Honduras / Colegio de Abogados de Honduras', url: 'https://www.poderjudicial.gob.hn' },
    ],
    ctaContextual: {
      href: '/solicitar-consulta?motivo=derecho-civil-y-notarial#formulario',
      label: 'Consultar un contrato, propiedad, sucesión o trámite notarial',
    },
    subservicios: [
      { titulo: 'Compraventa de inmuebles', descripcion: 'Estudio de títulos, redacción de contrato y protocolización.' },
      { titulo: 'Arrendamiento de vivienda y local comercial', descripcion: 'Contrato, garantía, cobro de rentas y desahucio.' },
      { titulo: 'Donación entre vivos', descripcion: 'Acto notarial con efectos civiles y registro en el Instituto de la Propiedad.' },
      { titulo: 'Permuta y cesión de derechos', descripcion: 'Tramitación y registro.' },
      { titulo: 'Hipoteca y garantía mobiliaria', descripcion: 'Constitución, modificación y ejecución.' },
      { titulo: 'Mandato y poder notarial', descripcion: 'Poder general, especial, judicial o administrativo.' },
      { titulo: 'Sociedad civil y de responsabilidad limitada', descripcion: 'Constitución y reformas.' },
      { titulo: 'Fideicomiso', descripcion: 'Estructura legal y contrato fiduciario.' },
      { titulo: 'Prescripción adquisitiva y reivindicatoria', descripcion: 'Reclamación judicial de la propiedad.' },
      { titulo: 'Usucapión', descripcion: 'Procedimiento ordinario o especial según los años de posesión.' },
      { titulo: 'Servidumbres', descripcion: 'Constitución, modificación o defensa judicial.' },
      { titulo: 'Reivindicación de inmuebles', descripcion: 'Acción posesoria y de dominio.' },
      { titulo: 'Cobro judicial de deudas', descripcion: 'Vía ejecutiva, monitoria o declarativa con título.' },
      { titulo: 'Daños y perjuicios', descripcion: 'Responsabilidad civil contractual y extracontractual.' },
      { titulo: 'Responsabilidad civil por accidente de tránsito', descripcion: 'Reclamación al seguro, demanda civil y ejecución.' },
      { titulo: 'Medición y deslinde', descripcion: 'Procedimiento ante Catastro y Juzgados.' },
      { titulo: 'Protocolización de documentos', descripcion: 'Acto notarial de incorporación al protocolo.' },
    ],
    faqs: [
      { pregunta: '¿Cómo sé si quien vende un inmueble está facultado para hacerlo?', respuesta: 'Se realiza un estudio de títulos y un examen de la situación registral del bien, revisando gravámenes, limitaciones y la titularidad de quien transfiere. El alcance del estudio se ajusta al caso concreto; le indicamos qué consultas son necesarias antes de comprometerse.' },
      { pregunta: '¿Todo trámite civil puede resolverse por vía notarial?', respuesta: 'No. Algunos actos requieren notario, otros tribunal y otros registro; y en ocasiones los tres. Por ejemplo, una compraventa puede involucrar escritura notarial e inscripción registral, mientras que un cobro de deuda con oposición suele requerir vía judicial. Le explicamos qué autoridades intervienen en su caso.' },
      // P06 preservada: no se confirman plazos. Se describe la figura.
      { pregunta: '¿Qué son la prescripción y la usucapión?', respuesta: 'Son figuras relacionadas con la adquisición o pérdida de derechos por el paso del tiempo. La usucapión suele aplicarse a inmuebles tras una posesión pacífica e ininterrumpida durante el plazo que fije la ley. Los plazos y requisitos concretos dependen del supuesto y de la legislación vigente; se evalúan caso a caso.' },
      { pregunta: '¿Pueden ocuparse de una sucesión o herencia?', respuesta: 'Sí. Acompañamos declaratorias, inventarios, avalúos y particiones, y la protocolización o inscripción que corresponda. Cuando existen varias autoridades implicadas (notaría, tribunal y registro), coordinamos el recorrido completo.' },
      { pregunta: '¿Hacen cobros judiciales de deudas?', respuesta: 'Sí. Analizado el título y la documentación, seleccionamos la vía más adecuada (ejecutiva, monitoria o declarativa). La viabilidad y el plazo dependen del título ejecutivo disponible y de la situación del deudor.' },
      { pregunta: '¿La capacidad notarial del despacho está confirmada?', respuesta: 'Para los actos que requieren notaría coordinamos con notario y le informamos del alcance en su caso. No publicamos como confirmada una condición que no ha sido verificada; lo que sí aseguramos es la coordinación de la totalidad del trámite.' },
      { pregunta: '¿Cuánto cuesta un trámite civil o notarial?', respuesta: 'Depende del tipo de acto, la documentación, los aranceles registrales o notariales y la complejidad. Tras la revisión preliminar le entregamos un presupuesto por escrito con honorarios y costos estimados.' },
    ],
    areasRelacionadas: ['derecho-de-familia', 'derecho-mercantil-empresarial', 'conciliacion-y-arbitraje'],
    keywords: [
      'abogado civil Nacaome',
      'compraventa inmuebles Honduras',
      'servicios notariales Nacaome',
      'protocolización de documentos Valle',
      'cobro judicial Honduras',
    ],
  },
  {
    slug: 'derecho-mercantil-empresarial',
    titulo: 'Derecho Mercantil y Empresarial',
    resumen: 'Abogado mercantil y corporativo en Honduras: constitución de sociedades, contratos comerciales, fusiones, registro de marcas, franquicias, gobierno corporativo y arbitraje.',
    descripcion:
      `Asesoramos a <strong>emprendedores, PYMEs, sociedades anónimas y sucursales extranjeras</strong> en todo el ciclo de vida empresarial. Constituimos sociedades (S.A., S. de R.L., comandita), redactamos contratos mercantiles de suministro, distribución, franquicia y joint venture; acompañamos fusiones, adquisiciones, <strong>due diligence</strong> y <strong>gobierno corporativo</strong>. Tramitamos el registro de marcas y patentes ante el Instituto de la Propiedad. Litigamos en <strong>Juzgados de Letras de lo Mercantil</strong> y en arbitraje institucional (CIAM, CICA). Le entregamos un diagnóstico inicial y un plan de acción con plazos y costos claros.`,
    icono: 'building-2',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Mercantil y Empresarial',
    heroSubtitle:
      'Constituya, haga crecer y defienda su empresa con seguridad jurídica en Honduras. Atención personalizada a emprendedores, PYMEs, sociedades anónimas, sucursales y corporativos: contratos mercantiles, fusiones y adquisiciones, gobierno corporativo, propiedad industrial, arbitraje y litigio estratégico ante Juzgados de Letras de lo Mercantil.',
    subservicios: [
      { titulo: 'Constitución de sociedades', descripcion: 'Sociedad anónima, de responsabilidad limitada, en comandita, cooperativa y sucursal.' },
      { titulo: 'Reformas estatutarias', descripcion: 'Aumento de capital, modificación de objeto social, transformación y fusión.' },
      { titulo: 'Disolución y liquidación', descripcion: 'Procedimiento legal y registral.' },
      { titulo: 'Contratos mercantiles', descripcion: 'Suministro, distribución, franquicia, joint venture, agencia, concesión y licencia.' },
      { titulo: 'Gobierno corporativo', descripcion: 'Protocolos familiares, junta directiva, comités de auditoría.' },
      { titulo: 'Compliance corporativo', descripcion: 'Programas de cumplimiento, código de ética, due diligence.' },
      { titulo: 'Protección al consumidor', descripcion: 'Defensa ante el SBDC y demandas colectivas.' },
      { titulo: 'Competencia desleal', descripcion: 'Demanda por actos contrarios a la buena fe comercial.' },
      { titulo: 'Propiedad industrial', descripcion: 'Registro de marcas, patentes, modelos de utilidad y diseños industriales ante el Instituto de la Propiedad.' },
      { titulo: 'Derechos de autor y software', descripcion: 'Registro de obras, contratos de cesión y licenciamiento.' },
      { titulo: 'Contratos internacionales', descripcion: 'Compraventa internacional, distribución, transporte y seguros.' },
      { titulo: 'Cobro de facturas y cheques protestados', descripcion: 'Juicio ejecutivo mercantil.' },
      { titulo: 'Quiebra y concurso mercantil', descripcion: 'Procedimiento ante Juzgados de Letras de lo Mercantil.' },
      { titulo: 'Litigio mercantil estratégico', descripcion: 'Defensa en demandas civiles, mercantiles y arbitraje.' },
      { titulo: 'Asesoría a startups y PYMEs', descripcion: 'Estructura legal, contratos tipo y rondas de inversión.' },
      { titulo: 'Fideicomiso mercantil', descripcion: 'Constitución y operación.' },
    ],
    faqs: [
      { pregunta: '¿Qué tipo de sociedad me conviene en Honduras?', respuesta: 'Depende del tamaño, objeto social y necesidades de capital. La Sociedad Anónima (S.A.) es la más usada por su responsabilidad limitada. La S. de R.L. es común en PYMEs familiares.' },
      { pregunta: '¿Cuánto tarda constituir una sociedad en Honduras?', respuesta: 'Entre 7 y 15 días hábiles con todos los documentos, dependiendo del Registro Mercantil y la publicación en La Gaceta.' },
      { pregunta: '¿Es obligatorio tener un agente residente?', respuesta: 'Sí, para sucursales de empresas extranjeras en Honduras.' },
    ],
    areasRelacionadas: ['derecho-bancario-y-financiero', 'propiedad-intelectual', 'tributario-fiscal'],
    keywords: [
      'abogado mercantil Honduras',
      'constituir empresa Nacaome',
      'sociedad anónima Honduras',
      'registro de marca Honduras',
      'contrato mercantil Valle',
    ],
  },
  {
    slug: 'derecho-bancario-y-financiero',
    titulo: 'Derecho Bancario y Financiero',
    resumen: 'Abogado bancario en Honduras: defensa del usuario financiero, cláusulas abusivas, reestructuras, embargos bancarios, ejecución de garantías, CNBS y lavado de activos.',
    descripcion:
      `Defendemos a <strong>usuarios financieros</strong> y asesoramos a entidades reguladas por la <strong><a href="https://www.cnbs.gob.hn" target="_blank" rel="noopener noreferrer">Comisión Nacional de Bancos y Seguros (CNBS)</a></strong>. Revisamos contratos crediticios, identificamos cláusulas abusivas en tarjetas de crédito y préstamos; negociamos reestructuras antes del embargo y ejecutamos la defensa técnica del cliente. Representamos en <strong>cobro judicial bancario, juicios ejecutivos cambiarios y ejecución de garantías</strong>. Atendemos sanciones de la CNBS, procedimientos de la UAF y acusaciones por captación ilegal de dinero. Si tiene un crédito en mora o enfrenta un embargo bancario, consúltenos.`,
    icono: 'banknote',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Bancario y Financiero',
    heroSubtitle:
      'Defensa frente a bancos, financieras, cooperativas y la CNBS en Honduras. Revisión de contratos crediticios, defensa del usuario financiero, reestructuras, ejecución de garantías, sanciones administrativas, lavado de activos, leasing, factoraje y cumplimiento normativo. Actuación en Juzgados de Letras de lo Mercantil y ante la Comisión Nacional de Bancos y Seguros.',
    subservicios: [
      { titulo: 'Revisión de contratos crediticios', descripcion: 'Identificación de cláusulas abusivas y tasas excesivas.' },
      { titulo: 'Reestructuración de deudas', descripcion: 'Negociación con entidades financieras.' },
      { titulo: 'Ejecución de garantías', descripcion: 'Prendaria, hipotecaria y fiduciaria.' },
      { titulo: 'Defensa del usuario financiero', descripcion: 'Quejas ante la CNBS y la Defensoría del Cliente Financiero.' },
      { titulo: 'Cobro judicial bancario', descripcion: 'Juicio ejecutivo cambiario y declarativo.' },
      { titulo: 'Garantías mobiliarias y prendarias', descripcion: 'Registro y ejecución.' },
      { titulo: 'Fideicomiso de garantía', descripcion: 'Constitución y operación.' },
      { titulo: 'Contratos de leasing y factoraje', descripcion: 'Asesoría y litigio.' },
      { titulo: 'Cumplimiento normativo de la CNBS', descripcion: 'Normas de PLD/FT, gobierno corporativo y riesgo.' },
      { titulo: 'Sanciones administrativas y multas CNBS', descripcion: 'Defensa y recurso.' },
      { titulo: 'Lavado de activos (defensa penal y administrativa)', descripcion: 'Asesoría integral en casos de la UAF.' },
      { titulo: 'Productos financieros no autorizados', descripcion: 'Demanda por captación ilegal.' },
      { titulo: 'Fideicomiso de inversión', descripcion: 'Estructura legal.' },
      { titulo: 'Contratos con cooperativas', descripcion: 'Revisión, reclamo y ejecución.' },
    ],
    faqs: [
      { pregunta: '¿Qué pasa si no puedo pagar mi crédito?', respuesta: 'Antes del embargo, negocie una reestructura con el banco. Si no es posible, la entidad ejecutará las garantías. Un abogado puede defenderle en juicio o en la negociación.' },
      { pregunta: '¿Puedo demandar a un banco por cláusulas abusivas?', respuesta: 'Sí. La Ley de Protección al Consumidor y las normas de la CNBS contemplan sanciones por cláusulas que desequilibren la relación contractual.' },
    ],
    areasRelacionadas: ['derecho-mercantil-empresarial', 'tributario-fiscal'],
    keywords: [
      'abogado bancario Honduras',
      'CNBS asesoría',
      'cobro judicial bancario Valle',
      'cláusulas abusivas banco',
    ],
  },
  {
    slug: 'derecho-administrativo-y-servicio-civil',
    titulo: 'Derecho Administrativo y Servicio Civil',
    resumen: 'Abogado administrativo en Honduras: contencioso-administrativo, sanciones del SAR, ENEE, ARSA, CONATEL, despido de servidores públicos, licitaciones y habeas data.',
    descripcion:
      `Defendemos a personas y empresas frente a actos de la <strong>Administración Pública hondureña</strong>. Interponemos <strong>recursos de reposición y apelación</strong> para agotar la vía administrativa; impugnamos multas del <strong><a href="https://www.sar.gob.hn" target="_blank" rel="noopener noreferrer">SAR</a></strong>, <strong><a href="https://www.arsa.gob.hn" target="_blank" rel="noopener noreferrer">ARSA</a></strong>, <strong><a href="https://www.enee.hn" target="_blank" rel="noopener noreferrer">ENEE</a></strong>, <strong><a href="https://www.conatel.gob.hn" target="_blank" rel="noopener noreferrer">CONATEL</a></strong> y otras entidades. Llevamos <strong>demandas contencioso-administrativas</strong> y asesoramos a servidores públicos en estabilidad laboral, reinstalación y procedimientos disciplinarios. Tramitamos <strong>habeas data, habeas corpus y acciones de inconstitucionalidad</strong>. Si recibió una sanción o fue despedido del Estado, consúltenos antes de que venza el plazo.`,
    icono: 'landmark',
    color: 'muted',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Administrativo y Servicio Civil',
    heroSubtitle:
      'Defensa frente a la Administración Pública en Honduras: sanciones del SAR, ENEE, ARSA, CONATEL y CNBS; despidos de servidores públicos; estabilidad laboral; contencioso-administrativo; licitaciones y contratos del Estado; responsabilidad patrimonial del Estado; acceso a la información pública (IAIP); habeas data y habeas corpus. Actuación ante Juzgados de Letras de lo Contencioso y la Corte Suprema de Justicia.',
    subservicios: [
      { titulo: 'Recurso de reposición y apelación administrativa', descripcion: 'Agotamiento de la vía administrativa.' },
      { titulo: 'Demanda contencioso-administrativa', descripcion: 'Nulidad de actos, indemnizaciones, silencio administrativo.' },
      { titulo: 'Sanciones regulatorias', descripcion: 'Defensa ante SAR, ARSA, ENEE, CONATEL, CNBS y más.' },
      { titulo: 'Despido de servidores públicos', descripcion: 'Reinstalación o indemnización.' },
      { titulo: 'Procedimiento disciplinario', descripcion: 'Asesoría y defensa ante la Dirección de Servicio Civil.' },
      { titulo: 'Concurso público y oposición', descripcion: 'Impugnación de resultados y nombramientos.' },
      { titulo: 'Contratos del Estado', descripcion: 'Licitación, concurso, contratación directa y excepciones.' },
      { titulo: 'Responsabilidad patrimonial del Estado', descripcion: 'Demanda por daños causados por la Administración.' },
      { titulo: 'Acceso a la información pública', descripcion: 'Recurso ante el IAIP.' },
      { titulo: 'Habeas data y habeas corpus', descripcion: 'Garantías constitucionales.' },
      { titulo: 'Acción de inconstitucionalidad', descripcion: 'Ante la Sala de lo Constitucional de la CSJ.' },
      { titulo: 'Juicio de cuentas', descripcion: 'Defensa en el Tribunal Superior de Cuentas.' },
      { titulo: 'Procedimiento administrativo migratorio', descripcion: 'Resoluciones del INM.' },
    ],
    faqs: [
      { pregunta: '¿Cómo impugno una multa del SAR?', respuesta: 'Recurso de reposición ante la Administración Tributaria en 15 días, y si no prospera, demanda ante el Contencioso Administrativo.' },
      { pregunta: '¿Puedo ser despedido siendo empleado público?', respuesta: 'Sí, pero solo por justa causa calificada por la Dirección General de Servicio Civil, previa audiencia y defensa.' },
    ],
    areasRelacionadas: ['derecho-aduanero-y-comercio-exterior', 'tributario-fiscal', 'regulacion-sanitaria'],
    keywords: [
      'abogado administrativo Honduras',
      'contencioso administrativo',
      'recurso de apelación Tegucigalpa',
      'responsabilidad del Estado',
    ],
  },
  {
    slug: 'derecho-aduanero-y-comercio-exterior',
    titulo: 'Derecho Aduanero y Comercio Exterior',
    resumen: 'Abogado aduanero en Honduras: clasificación arancelaria, valoración, importación, exportación, ZOLI, defensa por contrabando, devolución de impuestos al exportador y litigio ante el SAR.',
    descripcion:
      `Asesoramos a <strong>importadores, exportadores y operadores de zonas libres</strong> en Honduras. Realizamos <strong>clasificación arancelaria, valoración aduanera</strong> conforme al Acuerdo de la OMC, gestión de regímenes suspensivos y exportación definitiva con devolución de impuestos ante el <strong><a href="https://www.sar.gob.hn" target="_blank" rel="noopener noreferrer">SAR</a></strong>. Tramitamos permisos <strong>VUCE</strong> y constitución de empresas en ZOLI y ZIP. Defendemos en investigaciones por <strong>contrabando y defraudación fiscal aduanera</strong>, con recursos de reconsideración y litigio contencioso-administrativo. Experiencia directa en Puerto Cortés, Amapala, San Lorenzo y las aduanas del país.`,
    icono: 'ship',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Aduanero y Comercio Exterior',
    heroSubtitle:
      'Importación, exportación, regímenes especiales y defensa ante la Administración Aduanera en Honduras. Clasificación arancelaria, valoración OMC, ZOLI, ZIP, ZAL, devolución de impuestos, defensa por contrabando y defraudación, recursos ante el SAR y litigio contencioso-administrativo. Operativa ágil con cumplimiento normativo en Puerto Cortés, Amapala, San Lorenzo y el resto del país.',
    subservicios: [
      { titulo: 'Clasificación arancelaria', descripcion: 'Determinación del código correcto y consulta a la Administración Aduanera.' },
      { titulo: 'Valoración aduanera', descripcion: 'Métodos principales y auxiliares según el Acuerdo de Valoración de la OMC.' },
      { titulo: 'Importación temporal', descripcion: 'Régimen suspensivo de derechos.' },
      { titulo: 'Exportación definitiva', descripcion: 'Tramitación y recuperación de impuestos.' },
      { titulo: 'Tránsito aduanero', descripcion: 'DUA-T y tránsito internacional.' },
      { titulo: 'Depósito aduanero', descripcion: 'Almacenaje y posterior destinación.' },
      { titulo: 'Zona libre (ZOLI, ZIP)', descripcion: 'Constitución, beneficios y cumplimiento.' },
      { titulo: 'Recinto aduanero (ZAL)', descripcion: 'Operación logística en Puerto Cortés, Amapala, San Lorenzo y otros.' },
      { titulo: 'Devolución de impuestos al exportador', descripcion: 'Trámite ante el SAR y la Aduana.' },
      { titulo: 'Sanciones por contrabando y defraudación', descripcion: 'Defensa penal y administrativa.' },
      { titulo: 'Recurso de reconsideración y apelación', descripcion: 'Agotamiento de vía administrativa.' },
      { titulo: 'Régimen de viajero', descripcion: 'Asesoría para franquicia y franquicia plus.' },
      { titulo: 'Trámites ante ventanilla única de comercio exterior (VUCE)', descripcion: 'Permisos previos, registros y certificaciones.' },
      { titulo: 'Derechos compensatorios y antidumping', descripcion: 'Investigaciones y defensa.' },
      { titulo: 'Comercio de servicios', descripcion: 'Asesoría y cumplimiento.' },
    ],
    faqs: [
      { pregunta: '¿Cuánto tarda una importación en Honduras?', respuesta: 'Entre 3 y 10 días hábiles con documentación completa, dependiendo del canal de selectividad (verde, amarillo o rojo) y el tipo de mercancía.' },
      { pregunta: '¿Qué pasa si me acusan de contrabando?', respuesta: 'Tiene derecho a defensa técnica inmediata. La vía penal puede derivar en la configuración del delito y, según el monto, en prisión.' },
    ],
    areasRelacionadas: ['derecho-mercantil-empresarial', 'derecho-administrativo-y-servicio-civil', 'tributario-fiscal'],
    keywords: [
      'abogado aduanero Honduras',
      'importación Honduras',
      'SAR Aduana',
      'Puerto Cortés',
    ],
  },
  {
    slug: 'regulacion-sanitaria',
    titulo: 'Regulación Sanitaria y Salud',
    resumen: 'Abogado sanitario en Honduras: registro sanitario de medicamentos y alimentos ante ARSA, Buenas Prácticas (BPM, BPAD), defensa de establecimientos, sanciones y mala praxis médica.',
    descripcion:
      `Acompañamos a <strong>laboratorios, fabricantes, importadores y profesionales de la salud</strong> en el cumplimiento de la normativa de la <strong><a href="https://www.arsa.gob.hn" target="_blank" rel="noopener noreferrer">Agencia de Regulación Sanitaria (ARSA)</a></strong>. Tramitamos <strong>registros sanitarios</strong> de medicamentos, alimentos, cosméticos y dispositivos médicos; implementamos Buenas Prácticas de Manufactura (BPM) y Almacenamiento (BPAD). Asesoramos la apertura de establecimientos farmacéuticos y defendemos en sanciones de la ARSA, <strong>responsabilidad médica y mala praxis</strong>. Si fue fiscalizado o enfrenta una denuncia, consúltenos antes de responder.`,
    icono: 'heart-pulse',
    color: 'success',
    heroEyebrow: 'Área legal',
    heroTitle: 'Regulación Sanitaria',
    heroSubtitle:
      'Cumplimiento normativo en alimentos, medicamentos, cosméticos, dispositivos médicos, plaguicidas, establecimientos de salud y telemedicina. Registro sanitario, Buenas Prácticas de Manufactura y Almacenamiento, defensa ante ARSA, mala praxis médica, consentimiento informado y litigio contencioso-administrativo en la zona sur de Honduras.',
    subservicios: [
      { titulo: 'Registro sanitario de medicamentos', descripcion: 'Tramitación ante la ARSA y la Secretaría de Salud.' },
      { titulo: 'Registro de alimentos y bebidas', descripcion: 'Notificación y registro según riesgo.' },
      { titulo: 'Cosméticos y productos de higiene', descripcion: 'Notificación obligatoria y etiquetado.' },
      { titulo: 'Dispositivos médicos', descripcion: 'Clasificación y registro.' },
      { titulo: 'Buenas Prácticas de Manufactura (BPM)', descripcion: 'Implementación y auditoría.' },
      { titulo: 'Buenas Prácticas de Almacenamiento y Distribución (BPAD)', descripcion: 'Cumplimiento normativo.' },
      { titulo: 'Establecimientos farmacéuticos y botiquines', descripcion: 'Apertura, renovación y modificación.' },
      { titulo: 'Sanciones de ARSA', descripcion: 'Defensa y recurso.' },
      { titulo: 'Responsabilidad médica y mala praxis', descripcion: 'Defensa judicial y negociación con aseguradoras.' },
      { titulo: 'Consentimiento informado', descripcion: 'Protocolos y validez legal.' },
      { titulo: 'Telemedicina y salud digital', descripcion: 'Marco regulatorio aplicable.' },
      { titulo: 'Tabaco y alcohol', descripcion: 'Cumplimiento de etiquetado y restricciones.' },
      { titulo: 'Plaguicidas y agroquímicos', descripcion: 'Registro ante SAG-DICTA y ARSA.' },
      { titulo: 'Acción popular en salud', descripcion: 'Defensa del derecho a la salud.' },
    ],
    faqs: [
      { pregunta: '¿Cuánto tarda el registro sanitario en Honduras?', respuesta: 'Para medicamentos entre 6 y 12 meses. Para alimentos y cosméticos, la notificación es más rápida, entre 1 y 3 meses.' },
      { pregunta: '¿Qué hago si me sancionan por publicidad engañosa en salud?', respuesta: 'Recurso de reposición en 10 días y, si es necesario, demanda contencioso-administrativa. Un abogado puede defenderle desde el inicio.' },
    ],
    areasRelacionadas: ['derecho-administrativo-y-servicio-civil', 'derecho-mercantil-empresarial'],
    keywords: [
      'ARSA Honduras',
      'registro sanitario Tegucigalpa',
      'abogado sanitario Honduras',
      'mala praxis médica Valle',
    ],
  },
  {
    slug: 'extranjeria-en-honduras',
    titulo: 'Extranjería en Honduras',
    resumen: 'Abogado migratorio en Honduras: visas de trabajo, residencia temporal y permanente, visa de inversionista, naturalización ordinaria y por matrimonio, defensa ante el INM y deportaciones.',
    descripcion:
      `Asesoramos a <strong>extranjeros que viven, trabajan, invierten o estudian en Honduras</strong>. Tramitamos ante el <strong>Instituto Nacional de Migración (INM)</strong> y la Cancillería: visas de trabajo, <strong>residencia temporal y permanente</strong>, visa de inversionista, rentista y pensionado. Gestionamos <strong>naturalización ordinaria y por matrimonio</strong>, doble nacionalidad y defensa frente a procedimientos de deportación. Si su empresa contrata personal extranjero o necesita regularizar su estatus migratorio, le acompañamos con discreción y criterio técnico.`,
    icono: 'globe',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Extranjería en Honduras',
    heroSubtitle:
      'Acompañamiento integral al extranjero que vive, trabaja, invierte, estudia o se casa con un hondureño. Visas de turista, trabajo, residencia temporal y permanente, visa de inversionista, rentista, pensionado, naturalización ordinaria y por matrimonio, doble nacionalidad, permisos de salida de menores, apostilla, traducción y defensa ante el INM y la Cancillería.',
    subservicios: [
      { titulo: 'Visa de turista', descripcion: 'Prórrogas y conversión de estatus.' },
      { titulo: 'Visa de trabajo', descripcion: 'Por oferta de empleo o transferencia intraempresarial.' },
      { titulo: 'Residencia temporal', descripcion: 'Por vínculo familiar, trabajo, inversión o estudios.' },
      { titulo: 'Residencia permanente', descripcion: 'Después de 3 o 5 años según la categoría.' },
      { titulo: 'Visa de inversionista', descripcion: 'Montos y requisitos vigentes.' },
      { titulo: 'Visa de rentista o pensionado', descripcion: 'Por ingresos estables del exterior.' },
      { titulo: 'Naturalización ordinaria', descripcion: 'Después de 7 años de residencia.' },
      { titulo: 'Naturalización por matrimonio', descripcion: 'Después de 2 años de matrimonio con hondureño.' },
      { titulo: 'Naturalización por servicios prestados', descripcion: 'Para extranjeros con méritos relevantes.' },
      { titulo: 'Doble nacionalidad', descripcion: 'Asesoría sobre la Convención Americana y acuerdos bilaterales.' },
      { titulo: 'Permiso de salida de menores', descripcion: 'Para hijos de extranjeros.' },
      { titulo: 'Apostilla y traducción oficial', descripcion: 'De documentos para el INM.' },
      { titulo: 'Filiación de hijos nacidos en Honduras', descripcion: 'Registro civil y pasaporte.' },
      { titulo: 'Defensa en procedimientos de deportación', descripcion: 'Recurso de revisión y habeas corpus.' },
      { titulo: 'Asesoría a empresas con personal extranjero', descripcion: 'Cumplimiento migratorio laboral.' },
    ],
    faqs: [
      { pregunta: '¿Cuánto tarda la residencia temporal en Honduras?', respuesta: 'Entre 6 y 18 meses dependiendo del tipo y la carga del INM. Con patrocinador abogado, se reduce significativamente.' },
      { pregunta: '¿Puedo naturalizarme sin renunciar a mi nacionalidad?', respuesta: 'Sí, Honduras reconoce la doble nacionalidad por nacimiento. Si la adquirió por naturalización, deberá revisar los tratados bilaterales.' },
    ],
    areasRelacionadas: ['derecho-de-familia', 'derecho-administrativo-y-servicio-civil'],
    keywords: [
      'INM Honduras',
      'residencia Honduras',
      'naturalización Honduras',
      'abogado migratorio Tegucigalpa',
    ],
  },
  {
    slug: 'propiedad-intelectual',
    titulo: 'Propiedad Intelectual',
    resumen: 'Abogado de propiedad intelectual en Honduras: registro de marcas, patentes, modelos de utilidad, derechos de autor, transferencia de tecnología, licencias y defensa frente a infracciones.',
    descripcion:
      `Protegemos los <strong>activos intangibles</strong> de empresas, emprendedores y creadores. Realizamos <strong>registro de marcas, patentes, modelos de utilidad, diseños industriales y derechos de autor</strong> ante la Dirección de Propiedad Intelectual. Redactamos contratos de cesión, licenciamiento y transferencia de tecnología. Tramitamos oposiciones al registro y defendemos frente a infracciones con <strong>medidas cautelares y demandas judiciales</strong>, incluyendo disputas de nombres de dominio (.hn, .com). Le entregamos un diagnóstico inicial y un plan de protección con tiempos y costos.`,
    icono: 'lightbulb',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Propiedad Intelectual',
    heroSubtitle:
      'Registre, defienda y monetice sus marcas, patentes, modelos de utilidad, derechos de autor, diseños industriales, secretos empresariales y nombres de dominio en Honduras. Redacción de contratos de cesión, licenciamiento y transferencia de tecnología, oposición al registro, medidas cautelares, defensa judicial y arbitraje internacional. Asesoría integral con coordinación con oficinas de propiedad intelectual de la región.',
    subservicios: [
      { titulo: 'Registro de marcas', descripcion: 'Búsqueda, presentación, seguimiento y renovación.' },
      { titulo: 'Marcas de certificación y colectivas', descripcion: 'Asociación de productores, denominaciones de origen.' },
      { titulo: 'Patentes de invención', descripcion: 'Examen de fondo, redacción de reivindicaciones y defensa.' },
      { titulo: 'Modelos de utilidad', descripcion: 'Protección de mejoras funcionales.' },
      { titulo: 'Diseños industriales', descripcion: 'Aspecto ornamental de un producto.' },
      { titulo: 'Esquemas de trazado de circuitos integrados', descripcion: 'Registro y defensa.' },
      { titulo: 'Derechos de autor', descripcion: 'Obras literarias, artísticas, musicales, software, audiovisuales.' },
      { titulo: 'Registro de obras ante la Dirección de Propiedad Intelectual', descripcion: 'Depósito legal.' },
      { titulo: 'Contratos de cesión y licenciamiento', descripcion: 'Redacción y negociación.' },
      { titulo: 'Transferencia de tecnología', descripcion: 'Contrato marco y cláusulas de confidencialidad.' },
      { titulo: 'Secretos empresariales', descripcion: 'Protocolos, cláusulas y defensa judicial.' },
      { titulo: 'Procedimiento de oposición al registro', descripcion: 'Por conflicto con marca previa.' },
      { titulo: 'Defensa frente a infracciones', descripcion: 'Medidas cautelares, demolición de productos y demanda.' },
      { titulo: 'Nombres de dominio', descripcion: '.hn, .com, UDRP y arbitraje internacional.' },
      { titulo: 'Compliance y auditoría de cartera IP', descripcion: 'Diagnóstico de activos intangibles.' },
    ],
    faqs: [
      { pregunta: '¿Cuánto tarda el registro de una marca en Honduras?', respuesta: 'Entre 8 y 14 meses si no hay oposiciones. Una marca registrada dura 10 años y se renueva por períodos iguales.' },
      { pregunta: '¿Necesito registrar mi obra para tener derechos de autor?', respuesta: 'No. En Honduras, los derechos de autor nacen con la creación. El registro es prueba del momento y del autor.' },
    ],
    areasRelacionadas: ['derecho-mercantil-empresarial', 'derecho-administrativo-y-servicio-civil'],
    keywords: [
      'registro de marca Honduras',
      'patentes Tegucigalpa',
      'derechos de autor Honduras',
      'propiedad intelectual Nacaome',
    ],
  },
  {
    slug: 'tributario-fiscal',
    titulo: 'Derecho Tributario y Fiscal',
    resumen: 'Abogado tributario en Honduras: liquidación de ISR e ISV, fiscalización del SAR, precios de transferencia, devolución de impuestos, planificación fiscal y contencioso tributario.',
    descripcion:
      `Asesoramos en materia fiscal a <strong>personas naturales, PYMEs y sociedades anónimas</strong> con operaciones en Honduras. Liquidamos el <strong>impuesto sobre la renta (ISR)</strong> y el <strong>impuesto al valor agregado (ISV)</strong>, planificamos la aportación solidaria y regímenes simplificados; estructuramos <strong>precios de transferencia</strong> con estudio y declaración informativa. Defendemos al contribuyente en fiscalizaciones del <strong><a href="https://www.sar.gob.hn" target="_blank" rel="noopener noreferrer">Servicio de Administración de Rentas (SAR)</a></strong> e interponemos recursos de reconsideración, apelación y <strong>contencioso tributario</strong>. Si recibió un requerimiento del SAR, consúltenos antes de presentar descargos.`,
    icono: 'receipt',
    color: 'warning',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Tributario y Fiscal',
    heroSubtitle:
      'Defensa y planificación tributaria estratégica frente al Servicio de Administración de Rentas (SAR) en Honduras. Impuesto sobre la renta (ISR), impuesto al valor agregado (ISV), aportación solidaria, regímenes simplificados, precios de transferencia, fiscalización, recursos administrativos, devolución de impuestos, beneficios fiscales en zonas libres y contencioso tributario ante Juzgados de Letras.',
    subservicios: [
      { titulo: 'Impuesto sobre la renta (personas naturales y jurídicas)', descripcion: 'Liquidación anual, declaraciones, regímenes especiales.' },
      { titulo: 'Impuesto al valor agregado (ISV)', descripcion: 'Declaración mensual, créditos fiscales y devoluciones.' },
      { titulo: 'Impuesto selectivo al consumo', descripcion: 'Bebidas, cigarrillos, combustibles y otros gravados.' },
      { titulo: 'Aportación solidaria', descripcion: 'Cálculo y declaración.' },
      { titulo: 'Regímenes simplificados y especiales', descripcion: 'SAR-Fácil, régimen simplificado del ISV y otros.' },
      { titulo: 'Planificación tributaria', descripcion: 'Optimización fiscal lícita y estructuración de operaciones.' },
      { titulo: 'Precios de transferencia', descripcion: 'Estudio, declaración informativa y defensa.' },
      { titulo: 'Defensa en fiscalización', descripcion: 'Acompañamiento presencial y escrito.' },
      { titulo: 'Recurso de reconsideración y apelación', descripcion: 'Agotamiento de la vía administrativa.' },
      { titulo: 'Contencioso tributario', descripcion: 'Demanda ante Juzgados de Letras de lo Tributario.' },
      { titulo: 'Devolución de pagos indebidos', descripcion: 'Solicitud administrativa y judicial.' },
      { titulo: 'Beneficios fiscales en zonas libres', descripcion: 'Asesoría y cumplimiento.' },
      { titulo: 'Exoneraciones y exenciones', descripcion: 'Por actividad, sector o región.' },
      { titulo: 'Régimen de retención y percepción', descripcion: 'Asesoría operativa.' },
    ],
    faqs: [
      { pregunta: '¿Qué pasa si el SAR me fiscaliza?', respuesta: 'Tiene derecho a presentar descargos con asistencia legal. Un abogado puede evitar sanciones desproporcionadas y, si es necesario, recurrir al Contencioso Tributario.' },
      { pregunta: '¿Cómo planifico fiscalmente mi empresa?', respuesta: 'Identificando el régimen óptimo, deducciones permitidas, beneficios por sector y una correcta documentación de precios de transferencia si aplica.' },
    ],
    areasRelacionadas: ['derecho-mercantil-empresarial', 'derecho-aduanero-y-comercio-exterior'],
    keywords: [
      'abogado tributario Honduras',
      'SAR fiscalización',
      'precios de transferencia Honduras',
      'ISV devolución',
    ],
  },
  {
    slug: 'ambiental-regulatorio',
    titulo: 'Derecho Ambiental y Regulatorio',
    resumen: 'Abogado ambiental en Honduras: licencia ambiental, evaluación de impacto, permisos de vertimiento, residuos sólidos, sanciones de MiAmbiente, cambio climático y litigio ambiental.',
    descripcion:
      `Acompañamos a <strong>empresas, municipalidades y proyectos productivos</strong> en el cumplimiento de la Ley General del Ambiente. Tramitamos la <strong>licencia ambiental</strong> por categoría, evaluaciones de impacto ambiental, permisos de vertimiento, manejo de residuos sólidos y aprovechamientos forestales ante la <strong><a href="https://serna.gob.hn" target="_blank" rel="noopener noreferrer">Secretaría de Recursos Naturales y Ambiente (MiAmbiente)</a></strong>. Defendemos en sanciones ambientales, recursos administrativos, <strong>acciones populares</strong> y responsabilidad por daño ambiental. Si su proyecto requiere licencia ambiental o enfrenta una sanción, consúltenos desde la fase de diseño para ahorrar tiempo y costos.`,
    icono: 'leaf',
    color: 'success',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Ambiental y Regulatorio',
    heroSubtitle:
      'Cumplimiento ambiental preventivo y defensa frente a MiAmbiente y la SERNA en Honduras. Licencias ambientales por categoría, evaluaciones de impacto ambiental, permisos de vertimiento y emisiones, manejo de residuos sólidos y peligrosos, aprovechamientos forestales, sanciones administrativas, acciones populares ambientales, responsabilidad por daño ambiental, bonos de carbono y litigio climático.',
    subservicios: [
      { titulo: 'Licencia ambiental', descripcion: 'Tramitación por categoría según el proyecto.' },
      { titulo: 'Evaluación de impacto ambiental', descripcion: 'Estudio y presentación.' },
      { titulo: 'Diagnóstico ambiental', descripcion: 'Cumplimiento de compromisos.' },
      { titulo: 'Permisos de vertimiento y emisiones', descripcion: 'Trámite ante MiAmbiente y SERNA.' },
      { titulo: 'Manejo de residuos sólidos y peligrosos', descripcion: 'Cumplimiento del Reglamento.' },
      { titulo: 'Bosques y áreas protegidas', descripcion: 'Aprovechamiento forestal, zonas de amortiguamiento.' },
      { titulo: 'Sanciones ambientales', descripcion: 'Defensa y recurso.' },
      { titulo: 'Acción popular ambiental', descripcion: 'Defensa de derechos colectivos.' },
      { titulo: 'Responsabilidad por daño ambiental', descripcion: 'Demanda civil y penal.' },
      { titulo: 'Derecho de petición ambiental', descripcion: 'Acceso a la información.' },
      { titulo: 'Auditoría ambiental voluntaria', descripcion: 'Cumplimiento normativo.' },
      { titulo: 'Cambio climático y bonos de carbono', descripcion: 'Asesoría legal y contractual.' },
      { titulo: 'Litigio climático', descripcion: 'Acciones estratégicas y cumplimiento de compromisos.' },
    ],
    faqs: [
      { pregunta: '¿Necesito licencia ambiental para mi negocio?', respuesta: 'Sí, salvo excepciones de bajo impacto. La categoría depende de la actividad, ubicación y magnitud del proyecto.' },
      { pregunta: '¿Qué pasa si no tengo licencia ambiental?', respuesta: 'Multa, cierre temporal y posible responsabilidad penal si hay daño ambiental.' },
    ],
    areasRelacionadas: ['derecho-administrativo-y-servicio-civil', 'derecho-mercantil-empresarial'],
    keywords: [
      'MiAmbiente Honduras',
      'licencia ambiental Tegucigalpa',
      'evaluación de impacto Honduras',
      'abogado ambiental Valle',
    ],
  },
  {
    slug: 'conciliacion-y-arbitraje',
    titulo: 'Conciliación y Arbitraje',
    resumen: 'Abogado de arbitraje y mediación en Honduras: cláusulas compromisorias, arbitraje CIAM, CICA, CCI, CIADI, mediación prejudicial, dispute boards y homologación de laudos extranjeros.',
    descripcion:
      `Resolvemos disputas por vías más <strong>ágiles, confidenciales y especializadas</strong> que la justicia ordinaria. Redactamos <strong>cláusulas compromisorias</strong> y actuamos en arbitrajes institucionales (<strong>CIAM, CICA</strong>) y ad hoc. Llevamos <strong>arbitrajes internacionales</strong> bajo reglas CCI, CIADI y UNCITRAL, así como <strong>dispute boards</strong> en proyectos de infraestructura. Tramitamos <strong>conciliación prejudicial, mediación privada y homologación de laudos extranjeros</strong> ante la Corte Suprema de Justicia. Si quiere resolver un conflicto sin un juicio que dure años, consúltenos sobre la mejor vía.`,
    icono: 'scale',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Conciliación y Arbitraje',
    heroSubtitle:
      'Resuelva sus disputas de forma rápida, confidencial y especializada en Honduras. Redacción de cláusulas compromisorias, arbitraje institucional (CIAM, CICA) y ad hoc, arbitraje internacional (CCI, CIADI, UNCITRAL, LACIAC), mediación prejudicial, mediación privada, mediación penal y familiar, dispute boards, homologación de laudos extranjeros ante la Corte Suprema y ejecución del laudo.',
    subservicios: [
      { titulo: 'Cláusula compromisoria', descripcion: 'Redacción e incorporación a sus contratos.' },
      { titulo: 'Convención arbitral', descripcion: 'Someter una controversia ya existente a arbitraje.' },
      { titulo: 'Arbitraje institucional', descripcion: 'Ante el CIAM, el Centro de Conciliación del CICA y otros.' },
      { titulo: 'Arbitraje ad hoc', descripcion: 'Reglas de procedimiento y selección de árbitros.' },
      { titulo: 'Arbitraje internacional', descripcion: 'Reglas de la CCI, CIADI y UNCITRAL.' },
      { titulo: 'Conciliación prejudicial', descripcion: 'En el Centro de Mediación del Poder Judicial.' },
      { titulo: 'Mediación privada', descripcion: 'Con efectos de cosa juzgada una vez cumplida.' },
      { titulo: 'Dispute boards', descripcion: 'Para contratos de construcción de larga duración.' },
      { titulo: 'Homologación de laudos extranjeros', descripcion: 'Procedimiento ante la Corte Suprema de Justicia.' },
      { titulo: 'Ejecución del laudo arbitral', descripcion: 'Título ejecutivo y embargo.' },
      { titulo: 'Recurso de nulidad del laudo', descripcion: 'Ante la Corte Suprema.' },
      { titulo: 'Asesoría a empresas con disputas complejas', descripcion: 'Estrategia procesal y elección del foro.' },
      { titulo: 'Mediación penal', descripcion: 'Criterios de oportunidad y suspensión condicional.' },
    ],
    faqs: [
      { pregunta: '¿Qué tan rápido es un arbitraje comparado con un juicio?', respuesta: 'Un arbitraje dura entre 6 y 18 meses. Un juicio civil puede prolongarse entre 3 y 6 años.' },
      { pregunta: '¿El laudo arbitral es ejecutable en Honduras?', respuesta: 'Sí, tiene fuerza de cosa juzgada. Para laudos internacionales, se requiere previamente la homologación ante la CSJ.' },
    ],
    areasRelacionadas: ['derecho-mercantil-empresarial', 'derecho-civil-y-notarial'],
    keywords: [
      'arbitraje Honduras',
      'mediación Nacaome',
      'CIAM Honduras',
      'laudo arbitral Valle',
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* HUB PENAL — 7 grupos especializados                                         */
/* -------------------------------------------------------------------------- */

export const hubPenal: HubPenal = {
  slug: 'derecho-penal',
  titulo: 'Derecho Penal',
  resumen: 'Abogados penalistas en Nacaome, Valle, San Lorenzo y Choluteca: defensa penal estratégica en cualquier etapa del proceso, asistencia a detenidos, juicios orales, casación y ejecución penal en la zona sur de Honduras.',
  descripcion:
    `Defensa penal técnica en todas las etapas del proceso penal hondureño, con sede en Nacaome y cobertura en la zona sur de Honduras: Valle, San Lorenzo, Choluteca y municipios aledaños. Conocemos el <strong>Código Penal (Decreto 130-2017)</strong> y sus reformas, la jurisprudencia de la <strong><a href="https://www.poderjudicial.gob.hn" target="_blank" rel="noopener noreferrer">Sala de lo Penal de la CSJ</a></strong> y la práctica forense en Juzgados de Letras, Tribunales de Sentencia y Cortes de Apelaciones. Si enfrenta una imputación, investigación fiscal u orden de captura, consúltenos: <strong>la defensa temprana es determinante</strong>.`,
  heroEyebrow: 'Área principal',
  heroTitle: 'Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica',
  heroSubtitle:
    'Atendemos casos penales en la zona sur de Honduras, desde nuestro despacho en Nacaome, Valle. Cubrimos San Lorenzo, Choluteca y municipios aledaños. Trabajamos desde la primera actuación procesal (asistencia a detenidos, audiencias iniciales, revisión de medidas cautelares) hasta la ejecución penal, beneficios de ley, recursos de casación y cumplimiento de penas. Defensa técnica, comunicación directa y presupuesto por escrito.',
  // §5 — respuesta directa. Sin plazos cerrados, sin tabla de prescripción/penas,
  // sin reutilizar P09/P14/P15 (que viven en /derecho-penal/[slug]).
  respuestaDirecta:
    'Pineda y Asociados ejerce la defensa penal técnica desde su sede en Nacaome, Valle, en el sur de Honduras. Acompaña a personas detenidas, citadas o investigadas, y a sus familias, desde la primera actuación procesal hasta el juicio oral, los recursos y la ejecución penal. Puede actuar ante detención, citación, denuncia o querella, investigación, requerimiento fiscal, medidas cautelares, audiencias y recursos. La estrategia, los plazos y el resultado dependen de los hechos, la prueba disponible y las resoluciones de la autoridad competente conforme a la legislación vigente.',
  situacionesHabituales: [
    'Una persona ha sido detenida o está siendo buscada.',
    'Se ha recibido una citación o una orden judicial conocida.',
    'Hay una audiencia próxima (inicial, de medida cautelar o de juicio).',
    'Se ha presentado o se quiere presentar una denuncia o querella.',
    'Hay una investigación fiscal en curso o un requerimiento.',
    'Se necesita revisar o sustituir una medida cautelar.',
    'Se va a recurrir una resolución desfavorable.',
    'Un familiar privado de libertad necesita asistencia o gestión de beneficios.',
  ],
  documentosIniciales: {
    items: [
      'Citación, resolución o acta de la audiencia',
      'Denuncia, querella o requerimiento fiscal',
      'Datos de la detención (fecha, lugar, autoridad)',
      'Resoluciones judiciales previas',
      'Documentos relacionados con el caso (mensajes, comprobantes, certificaciones)',
    ],
    nota:
      'La documentación exacta depende del asunto. No envíe originales ni información especialmente sensible antes de que el despacho le indique un medio adecuado. Si hay una detención o audiencia inminente, contacte también por teléfono o WhatsApp.',
    },
  proceso: {
    intro:
      'Las etapas del proceso penal son generales y orientativas. No se publican tablas cerradas de penas, prescripción o duración; los plazos reales dependen del caso, la prueba y la autoridad.',
    pasos: [
      { titulo: 'Contacto inicial urgente', descripcion: 'Si hay detención, citación o audiencia próxima, le atendemos con prioridad por teléfono o WhatsApp.' },
      { titulo: 'Revisión preliminar', descripcion: 'Análisis de la imputación, los hechos y la documentación disponible.' },
      { titulo: 'Solicitud de documentación', descripcion: 'Le indicamos qué resoluciones o antecedentes necesitamos para evaluar el caso.' },
      { titulo: 'Explicación de opciones', descripcion: 'Le exponemos la estrategia y las alternativas (sobreseimiento, mediación, juicio, recursos) con sus riesgos.' },
      { titulo: 'Presupuesto por escrito', descripcion: 'Honorarios y costos estimados antes de asumir la defensa.' },
      { titulo: 'Aceptación formal', descripcion: 'Confirmación del encargo y de la estrategia acordada por escrito.' },
      { titulo: 'Actuación', descripcion: 'Asistencia a detenidos, defensa en audiencias, juicio oral, recursos y ejecución penal.' },
      { titulo: 'Seguimiento', descripcion: 'Comunicación sobre avances, incidencias y próximos pasos.' },
    ],
  },
  autoridades: [
    'Ministerio Público (Fiscalía)',
    'Juzgados de Letras penales',
    'Tribunales de Sentencia',
    'Cortes de Apelaciones',
    'Sala de lo Penal de la Corte Suprema de Justicia',
    'Juzgados de Ejecución Penal',
    'Dirección Nacional de Investigación (DNI)',
  ],
  factoresQueVarian: [
    'La etapa procesal en la que se interviene.',
    'Los hechos imputados y su calificación jurídica.',
    'La prueba disponible y su legalidad.',
    'Las medidas cautelares dispuestas por la autoridad.',
    'La existencia de víctimas y la posibilidad de acuerdo.',
    'Las resoluciones de los tribunales en cada instancia.',
  ],
  erroresFrecuentes: [
    'Declarar o firmar documentos sin asistencia letrada.',
    'Esperar a buscar abogado hasta que la situación se agrava.',
    'Eliminar o alterar información que puede ser prueba.',
    'Discutir el caso en redes sociales o con terceros.',
    'Ignorar una citación o una orden judicial conocida.',
  ],
  fuentesGenerales: [
    { titulo: 'Código Penal de Honduras (Decreto 130-2017) y reformas', institucion: 'Poder Judicial de Honduras / Tribunal Supremo de Justicia', url: 'https://www.tsc.gob.hn/web/leyes/Decreto_130-2017.pdf' },
    { titulo: 'Código Procesal Penal de Honduras', institucion: 'Poder Judicial de Honduras', url: 'https://www.poderjudicial.gob.hn' },
    { titulo: 'Constitución de la República de Honduras (defensa y debido proceso)', institucion: 'Congreso Nacional de Honduras', url: 'https://www.congresonacional.hn' },
  ],
  ctaContextual: {
    href: '/solicitar-consulta?motivo=derecho-penal#formulario',
    label: 'Solicitar atención por una detención, citación o audiencia',
  },
  faqs: [
    { pregunta: '¿Pueden defenderme si acabo de ser detenido?', respuesta: 'Sí. La asistencia letrada es un derecho desde el primer momento. Podemos acudir a la estación policial o al juzgado y ejercer defensa inmediata, dentro del horario y la disponibilidad operativa del despacho.' },
    { pregunta: '¿Cuánto cuesta una defensa penal en Honduras?', respuesta: 'Depende de la complejidad. Ofrecemos consulta inicial confidencial para evaluar el caso y emitir un presupuesto claro por escrito; no se garantiza un importe fijo sin conocer el asunto.' },
    { pregunta: '¿En qué zonas trabajan?', respuesta: 'Nuestra sede está en Nacaome, Valle, y cubrimos principalmente la zona sur de Honduras: San Lorenzo, Choluteca y municipios aledaños. Para casos que requieran desplazamiento fuera de esta zona, consúltenos y valoramos la viabilidad.' },
    { pregunta: '¿Atienden casos graves (homicidio, narcotráfico, delitos sexuales)?', respuesta: 'Sí, con la misma dedicación y un equipo preparado. La gravedad no reduce la defensa: la aumenta. El enfoque y la estrategia se adaptan al caso concreto.' },
    { pregunta: '¿Pueden acturar si me citan a una audiencia?', respuesta: 'Sí. Tras revisar la citación y los antecedentes, preparamos la comparecencia y la estrategia de defensa para la audiencia. Conviene contactar con la mayor antelación posible.' },
    { pregunta: '¿Qué pasa si hay una orden de captura o investigación en curso?', respuesta: 'Conviene actuar de forma planificada: revisar la situación, preparar la defensa y, cuando proceda, gestionar la comparecencia. Cada supuesto es distinto; le orientamos tras evaluar el caso.' },
    { pregunta: '¿Atienden también a los familiares de la persona investigada o detenida?', respuesta: 'Sí. Acompañamos a las familias en la comprensión del proceso, la gestión de documentación y las decisiones que correspondan, respetando los límites de confidencialidad y de contratación formal del servicio.' },
    { pregunta: '¿Garantizan un resultado determinado?', respuesta: 'No. Nadie puede garantizar un resultado en un proceso penal, que depende de hechos, pruebas y resoluciones de autoridad competente. Lo que sí ofrecemos es defensa técnica, estrategia documentada y comunicación clara.' },
  ],
  areasRelacionadas: [
    'mediacion-conflictos-penales-y-multas',
    'asuntos-civiles-y-familiares-desde-el-extranjero',
    'derecho-de-familia',
  ],
  keywords: [
    'abogado penalista Nacaome',
    'defensa penal Valle Honduras',
    'abogado penal San Lorenzo',
    'abogado penalista Choluteca',
    'Código Penal Honduras',
    'asistencia a detenidos Valle',
    'defensa penal sur Honduras',
  ],
  grupos: [
    {
      slug: 'atencion-casos-penales-litigiosos',
      titulo: 'Atención de casos penales litigiosos',
      resumen: 'Abogado penalista litigioso en Honduras: defensa técnica en homicidio, femicidio, robo, estafa, narcotráfico, lavado de activos, delitos sexuales, económicos y de tránsito en todas las etapas del proceso.',
      descripcion:
        `Defendemos <strong>casos penales activos</strong> en la zona sur de Honduras. Asumimos la defensa desde la primera declaración hasta el juicio oral, apelación, casación y revisión ante la <strong><a href="https://www.poderjudicial.gob.hn" target="_blank" rel="noopener noreferrer">Corte Suprema de Justicia</a></strong>. Tenemos experiencia en <strong>delitos contra la vida</strong> (homicidio, femicidio, asesinato), delitos sexuales, delitos patrimoniales (robo, estafa, fraude), <strong>narcotráfico, lavado de activos</strong>, delitos económicos, contrabando, cohecho, prevaricato, trata de personas y delitos de prensa. Si usted o un familiar enfrenta una imputación penal, consúltenos de inmediato: la defensa temprana marca la diferencia.`,
      icono: 'gavel',
      color: 'danger',
      subservicios: [
        { titulo: 'Homicidio simple y homicidio agravado', descripcion: 'Defensa técnica desde la audiencia de declaración del imputado.' },
        { titulo: 'Asesinato, parricidio y femicidio', descripcion: 'Análisis de calificación jurídica y estrategia procesal.' },
        { titulo: 'Tentativa de homicidio y tentativa de asesinato', descripcion: 'Grado de ejecución y aplicación de penas reducidas.' },
        { titulo: 'Homicidio imprudente y accidentes de tránsito con fatalidades', descripcion: 'Defensa penal por responsabilidad culposa y negociación con la víctima.' },
        { titulo: 'Lesiones leves, graves y gravísimas', descripcion: 'Defensa, conciliación y reparación integral del daño.' },
        { titulo: 'Lesiones culposas por accidentes de tránsito o laborales', descripcion: 'Cálculo de responsabilidad y defensa técnica.' },
        { titulo: 'Maltrato familiar habitual agravado', descripcion: 'Defensa técnica con enfoque en derechos humanos y medidas de protección.' },
        { titulo: 'Abuso sexual, agresión sexual y violación', descripcion: 'Defensa técnica especializada con estricto respeto a la confidencialidad.' },
        { titulo: 'Acoso sexual (laboral, educativo o civil)', descripcion: 'Defensa y asesoría en denuncias y querellas por acoso sexual.' },
        { titulo: 'Estupro, explotación sexual comercial y pornografía infantil', descripcion: 'Defensa en delitos contra la indemnidad sexual de menores.' },
        { titulo: 'Maltrato infantil, descuido, omisión y abandono de menores', descripcion: 'Defensa técnica y coordinación con DINAF y juzgados de niñez.' },
        { titulo: 'Sustracción, retención o secuestro ilegal de niños por familiares', descripcion: 'Restitución inmediata del menor y defensa penal.' },
        { titulo: 'Contrabando de mercancías, cigarrillos, licores, combustible y ropa', descripcion: 'Defensa ante el SAR y los juzgados penales.' },
        { titulo: 'Defraudación fiscal aduanera, facturas falsas y subvaluación arancelaria', descripcion: 'Defensa técnica en delitos tributarios y aduaneros.' },
        { titulo: 'Robo con violencia o asalto a mano armada (personas, comercios, vehículos)', descripcion: 'Defensa en todas las modalidades de robo agravado.' },
        { titulo: 'Robo con fuerza en las cosas (rompimiento de puertas, ventanas, candados)', descripcion: 'Defensa técnica en delitos contra la propiedad.' },
        { titulo: 'Tráfico y robo de vehículos automotores, motocicletas y equipo pesado', descripcion: 'Defensa por receptación, alteración de seriales y falsificación de documentos.' },
        { titulo: 'Hurto simple, carterismo y hurtos por descuidos', descripcion: 'Defensa y solicitud de criterios de oportunidad.' },
        { titulo: 'Hurto agravado y robos domésticos por abuso de confianza de empleados', descripcion: 'Defensa técnica con análisis de prueba.' },
        { titulo: 'Receptación de bienes (compra, venta o posesión de objetos robados)', descripcion: 'Defensa por delito de receptación y buena fe.' },
        { titulo: 'Extorsión digital y chantaje con publicación de fotos o videos íntimos', descripcion: 'Defensa en delitos informáticos y contra la intimidad.' },
        { titulo: 'Amenazas de muerte, coacciones e intimidaciones personales o virtuales', descripcion: 'Defensa técnica y solicitud de medidas de protección.' },
        { titulo: 'Estafas inmobiliarias, venta de terrenos fantasmas o dobles escrituras', descripcion: 'Defensa en delitos patrimoniales complejos.' },
        { titulo: 'Estafas comerciales, engaños contractuales y fraude de agencias de viajes', descripcion: 'Defensa técnica y negociación con la víctima.' },
        { titulo: 'Fraude por emisión de cheques sin fondos o cuentas cerradas', descripcion: 'Defensa por libramiento indebido de cheques.' },
        { titulo: 'Fraudes corporativos, piramidales y esquemas Ponzi', descripcion: 'Defensa técnica en delitos financieros complejos.' },
        { titulo: 'Clonación de tarjetas de crédito o débito y robo de datos financieros', descripcion: 'Defensa en delitos informáticos y financieros.' },
        { titulo: 'Narcotráfico y tráfico ilícito de drogas, estupefacientes o sustancias psicotrópicas', descripcion: 'Defensa técnica especializada en la Ley de Uso Ilícito de Estupefacientes.' },
        { titulo: 'Posesión de drogas para el consumo personal vs. posesión para el tráfico', descripcion: 'Diferenciación jurídica y defensa por dosis mínimas o autoconsumo.' },
        { titulo: 'Facilitación de locales, viviendas o vehículos para el tráfico o consumo de sustancias', descripcion: 'Defensa técnica por facilitación de actividades ilícitas.' },
        { titulo: 'Tráfico de precursores químicos y contrabando de medicamentos sin registro', descripcion: 'Defensa penal y administrativa ante la ARSA.' },
        { titulo: 'Lavado de activos y posesión de grandes sumas de dinero en efectivo sin justificar', descripcion: 'Defensa técnica especializada ante la UAF y los juzgados penales.' },
        { titulo: 'Testaferrato (compra de propiedades, vehículos o empresas a nombre de terceros)', descripcion: 'Defensa técnica por simulación de actos jurídicos y ocultamiento de bienes.' },
        { titulo: 'Casos de privación de dominio de bienes y congelamiento de cuentas bancarias', descripcion: 'Defensa en procesos de extinción de dominio.' },
        { titulo: 'Quiebra fraudulenta de empresas y sociedades mercantiles', descripcion: 'Defensa técnica en delitos mercantiles y societarios.' },
        { titulo: 'Delitos societarios y desvío de fondos por administradores en perjuicio de socios', descripcion: 'Defensa técnica en delitos contra el patrimonio empresarial.' },
        { titulo: 'Cohecho, sobornos a autoridades y violación de los deberes de los funcionarios', descripcion: 'Defensa técnica en delitos contra la administración pública.' },
        { titulo: 'Prevaricato y emisión de resoluciones judiciales manifiestamente injustas', descripcion: 'Defensa técnica ante juzgados y tribunales.' },
        { titulo: 'Abuso de autoridad, usurpación de funciones públicas y tortura', descripcion: 'Defensa técnica con perspectiva de derechos humanos.' },
        { titulo: 'Querellas por calumnia (imputación falsa de un delito)', descripcion: 'Asesoría técnica para la interposición o defensa de querellas.' },
        { titulo: 'Querellas por injuria (ofensas graves y menoscabo a la reputación)', descripcion: 'Defensa técnica en delitos contra el honor.' },
        { titulo: 'Difamación a través de medios de comunicación, periódicos o radiofónicos', descripcion: 'Defensa técnica en delitos de prensa y difamación.' },
        { titulo: 'Linchamientos digitales, difamaciones y ataques al honor en redes sociales', descripcion: 'Defensa técnica y solicitud de medidas cautelares de eliminación de contenido.' },
        { titulo: 'Allanamiento de morada e ingreso violento o clandestino de particulares a viviendas', descripcion: 'Defensa técnica en delitos contra la inviolabilidad del domicilio.' },
        { titulo: 'Intrusión ilegal en oficinas comerciales, despachos profesionales o locales cerrados', descripcion: 'Defensa técnica por violación de domicilio comercial.' },
        { titulo: 'Tráfico ilícito de armas, municiones y explosivos', descripcion: 'Defensa técnica en la Ley de Control de Armas.' },
        { titulo: 'Trata de personas', descripcion: 'Defensa técnica especializada con enfoque de derechos humanos.' },
      ],
      faqs: [
        { pregunta: '¿Qué pasa si la acusación es débil?', respuesta: 'Trabajamos la estrategia procesal desde la primera audiencia para atacar la prueba de cargo y, si es posible, lograr la absolución en juicio.' },
      ],
      areasRelacionadas: ['estrategia-penal-y-litigio', 'recursos-y-defensa-avanzada'],
      keywords: [
        'defensa penal Nacaome',
        'abogado penalista sur Honduras',
        'homicidio abogado Valle',
      ],
    },
    {
      slug: 'mediacion-conflictos-penales-y-multas',
      titulo: 'Mediación, conflictos penales y multas',
      resumen: 'Abogado penal en Honduras: mediación penal, criterios de oportunidad, suspensión condicional del proceso, conciliación penal, justicia restaurativa y recurso de multas administrativas.',
      descripcion:
        `Estrategia orientada a extinguir la acción penal por la vía del <strong>acuerdo restaurativo, la mediación o los criterios de oportunidad</strong> del artículo 27 del Código Procesal Penal. Tramitamos <strong>suspensión condicional del proceso</strong>, conciliación en delitos perseguibles por instancia particular, acuerdo reparatorio con la víctima y mediación penal en el Centro de Mediación del Poder Judicial. En el plano administrativo, recurrimos <strong>multas de tránsito, del <a href="https://www.sar.gob.hn" target="_blank" rel="noopener noreferrer">SAR</a>, <a href="https://www.arsa.gob.hn" target="_blank" rel="noopener noreferrer">ARSA</a>, <a href="https://www.enee.hn" target="_blank" rel="noopener noreferrer">ENEE</a>, <a href="https://www.conatel.gob.hn" target="_blank" rel="noopener noreferrer">CONATEL</a> y municipalidades</strong>. Si busca una salida temprana del proceso penal o impugnar una sanción, le orientamos con un plan procesal y un presupuesto por escrito.`,
      icono: 'handshake',
      color: 'accent',
      subservicios: [
        { titulo: 'Criterios de oportunidad (Art. 27 CPP)', descripcion: 'Solicitud al Ministerio Público y al juez.' },
        { titulo: 'Suspensión condicional del proceso', descripcion: 'Régimen de prueba y revocación.' },
        { titulo: 'Conciliación penal', descripcion: 'En delitos perseguibles por instancia particular.' },
        { titulo: 'Acuerdo reparatorio', descripcion: 'Negociación con la víctima y cumplimiento.' },
        { titulo: 'Mediación penal', descripcion: 'Centro de Mediación del Poder Judicial o privado.' },
        { titulo: 'Procedimiento abreviado', descripcion: 'Cuando el caso lo permite.' },
        { titulo: 'Principio de mínima intervención penal', descripcion: 'Alegato y aplicación de despenalización.' },
        { titulo: 'Recurso de reposición de multa', descripcion: 'Contra sanciones de tránsito, SAR, ARSA y otras.' },
        { titulo: 'Apelación de multa administrativa', descripcion: 'Agotamiento de vía administrativa.' },
        { titulo: 'Sustitución de la pena de multa', descripcion: 'Cuando no se puede pagar.' },
        { titulo: 'Pago de reparación civil', descripcion: 'Negociación y efectos sobre la pena.' },
        { titulo: 'Extinción de la acción penal', descripcion: 'Prescripción, muerte del reo y otras causales.' },
        { titulo: 'Archivo de la denuncia', descripcion: 'Solicitud al Ministerio Público.' },
        { titulo: 'Querella y denuncias', descripcion: 'En nombre de la víctima.' },
        { titulo: 'Justicia restaurativa', descripcion: 'Procesos colaborativos víctima-imputado.' },
      ],
      faqs: [
        { pregunta: '¿Es posible evitar el juicio oral?', respuesta: 'Sí, mediante conciliación, criterio de oportunidad, suspensión condicional o procedimiento abreviado, según el caso.' },
        { pregunta: '¿Qué es el criterio de oportunidad y cómo se solicita?', respuesta: 'Es una facultad del Ministerio Público para archivar el caso cuando el hecho no afecta gravemente el bien jurídico o el imputado ha reparado el daño. Se solicita mediante escrito al fiscal del caso, acompañado de pruebas de reparación o de la escasa lesividad.' },
        { pregunta: '¿Cuánto tiempo dura la suspensión condicional del proceso?', respuesta: 'El juez fija un período de prueba de 1 a 3 años, durante el cual el imputado debe cumplir reglas de conducta. Si las cumple, se extingue la acción penal. Si las incumple, se reanuda el proceso.' },
        { pregunta: '¿Qué delitos admiten conciliación penal en Honduras?', respuesta: 'Los delitos perseguibles por instancia particular, como lesiones leves, amenazas, injurias, daños y algunos delitos patrimoniales sin violencia. La conciliación extingue la acción penal si se cumple el acuerdo.' },
        { pregunta: '¿Puedo impugnar una multa de tránsito o del SAR?', respuesta: 'Sí. Para multas de tránsito, cabe recurso de reposición ante la autoridad municipal o el juzgado de faltas. Para multas del SAR, ARSA, ENEE o CONATEL, se interpone recurso de reconsideración en 15 días y, si se rechaza, demanda contencioso-administrativa.' },
      ],
      areasRelacionadas: ['atencion-casos-penales-litigiosos', 'estrategia-penal-y-litigio'],
      keywords: ['mediación penal Honduras', 'criterio de oportunidad', 'conciliación penal'],
    },
    {
      slug: 'menores-justicia-juvenil',
      titulo: 'Menores, justicia juvenil y protección',
      resumen: 'Abogado de justicia juvenil y protección de menores en Honduras: defensa de adolescentes, medidas socioeducativas, restitución de derechos, adopción, DINAF, CNA y trabajo infantil.',
      descripcion:
        `Asistencia especializada en <strong>justicia juvenil y protección de la niñez</strong>, regida por el <strong>Código de la Niñez y la Adolescencia (CNA)</strong>. Defendemos a adolescentes ante Jueces de Niñez y Adolescencia, solicitando <strong>medidas socioeducativas</strong> (amonestación, libertad asistida, servicio a la comunidad). Tramitamos <strong>restitución de derechos</strong>, medidas de protección, patria potestad, obligaciones alimentarias y autorización para viajar. Acompañamos procesos de <strong>adopción nacional e internacional</strong> conforme al Convenio de La Haya de 1993. Si un menor está involucrado en un proceso penal juvenil o necesita protección, consúltenos con la mayor prontitud.`,
      icono: 'baby',
      color: 'warning',
      subservicios: [
        { titulo: 'Defensa de adolescentes infractores', descripcion: 'Procedimiento ante Juez de Niñez y Adolescencia.' },
        { titulo: 'Medidas socioeducativas', descripcion: 'Amonestación, libertad asistida, servicio a la comunidad.' },
        { titulo: 'Privación de libertad', descripcion: 'Únicamente como último recurso (Art. 191 CNA).' },
        { titulo: 'Revisión de medidas', descripcion: 'Cesación, sustitución o revocación.' },
        { titulo: 'Procedimiento contravencional', descripcion: 'Faltas cometidas por adolescentes.' },
        { titulo: 'Restitución de derechos del niño', descripcion: 'Cuándo se aplica y cómo.' },
        { titulo: 'Medidas de protección', descripcion: 'Solicitud de acogimiento familiar o institucional.' },
        { titulo: 'Patria potestad y suspensión', descripcion: 'Causales y procedimiento.' },
        { titulo: 'Adopción', descripcion: 'Nacional e internacional.' },
        { titulo: 'Tráfico y explotación sexual de menores', descripcion: 'Defensa y reparación.' },
        { titulo: 'Maltrato infantil', descripcion: 'Denuncia penal y protección inmediata.' },
        { titulo: 'Cumplimiento de obligaciones alimentarias', descripcion: 'Procedimiento ante Juzgados de Niñez.' },
        { titulo: 'Autorización para viajar', descripcion: 'Con uno o ambos padres.' },
        { titulo: 'Trabajo infantil y peores formas', descripcion: 'Asesoría y denuncia.' },
        { titulo: 'Justicia terapéutica', descripcion: 'Adolescentes con consumo problemático.' },
        { titulo: 'Coordinación con DINAF', descripcion: 'Acompañamiento institucional.' },
      ],
      faqs: [
        { pregunta: '¿A qué edad se es penalmente responsable en Honduras?', respuesta: 'A partir de los 12 años, conforme al Código de la Niñez y la Adolescencia, con un sistema de justicia especializado.' },
      ],
      areasRelacionadas: ['derecho-de-familia', 'atencion-casos-penales-litigiosos'],
      keywords: ['justicia juvenil Honduras', 'DINAF', 'CNA Honduras'],
    },
    {
      slug: 'proceso-penal-completo',
      titulo: 'Proceso penal completo: de la investigación al juicio',
      resumen: 'Defensa penal en Honduras en todas las fases: audiencia inicial, etapa intermedia, juicio oral, prueba pericial, testigos, alegatos, sentencia absolutoria o condenatoria, casación y ejecución.',
      descripcion:
        `Acompañamiento integral del proceso penal hondureño, desde la <strong>investigación preliminar fiscal</strong> hasta la sentencia firme y su ejecución. Actuamos en la <strong>audiencia inicial (Art. 296 CPP)</strong>, etapa intermedia con oferta probatoria y exclusión de prueba ilícita, y en el <strong>debate oral</strong> con preparación de testigos, prueba pericial y alegatos. Interponemos <strong>apelación, casación y revisión</strong> ante la Sala de lo Penal de la CSJ. Presencia directa en Juzgados de Letras, Tribunales de Sentencia, Cortes de Apelaciones y Juzgados de Ejecución Penal. Le entregamos una estrategia escrita con plazos y honorarios.`,
      icono: 'book-open',
      color: 'primary',
      subservicios: [
        { titulo: 'Investigación preliminar fiscal', descripcion: 'Acompañamiento al momento de la detención y primera declaración.' },
        { titulo: 'Audiencia inicial (Art. 296 CPP)', descripcion: 'Imputación, defensa, solicitud de sobreseimiento o medidas cautelares.' },
        { titulo: 'Audiencia de revisión de medidas cautelares', descripcion: 'Cese o sustitución de prisión preventiva.' },
        { titulo: 'Etapa intermedia', descripcion: 'Excepciones, oferta probatoria, exclusión de prueba.' },
        { titulo: 'Acusación y acusación alternativa', descripcion: 'Análisis técnico del pliego.' },
        { titulo: 'Auto de apertura a juicio', descripcion: 'Estrategia de defensa para el debate.' },
        { titulo: 'Juicio oral', descripcion: 'Defensa en debate probatorio, alegatos de apertura y clausura.' },
        { titulo: 'Prueba anticipada', descripcion: 'Solicitud, práctica e impugnación.' },
        { titulo: 'Prueba pericial', descripcion: 'Contratación, control y contradicción.' },
        { titulo: 'Testigos y prueba testimonial', descripcion: 'Preparación y contrainterrogatorio.' },
        { titulo: 'Alegatos finales y sentencia', descripcion: 'Estrategia oral y escrita.' },
        { titulo: 'Sentencia absolutoria', descripcion: 'Cuando proceda, y sus efectos civiles.' },
        { titulo: 'Sentencia condenatoria', descripcion: 'Análisis técnico para recurrir.' },
        { titulo: 'Procedimiento abreviado', descripcion: 'Aplicación cuando el caso lo permite.' },
        { titulo: 'Tribunales de sentencia', descripcion: 'Defensa en las tres judicaturas del país.' },
        { titulo: 'Coordinación interinstitucional', descripcion: 'MP, Policía Nacional, Juzgados, IHSS, DINAF y otros.' },
      ],
      faqs: [
        { pregunta: '¿Cuánto dura un proceso penal en Honduras?', respuesta: 'Depende de la complejidad. Los casos simples pueden resolverse en 6-12 meses, los complejos pueden extenderse a 3-5 años entre primera declaración y sentencia firme.' },
      ],
      areasRelacionadas: ['recursos-y-defensa-avanzada', 'estrategia-penal-y-litigio'],
      keywords: ['juicio oral Honduras', 'audiencia inicial', 'prisión preventiva Honduras'],
    },
    {
      slug: 'recursos-y-defensa-avanzada',
      titulo: 'Recursos y defensa avanzada',
      resumen: 'Recursos en proceso penal en Honduras: reposición, apelación, casación, revisión, amparo, habeas corpus, habeas data, queja ante la CSJ y procedimientos ante la Corte IDH.',
      descripcion:
        `Interponemos <strong>recursos y acciones constitucionales</strong> para revertir resoluciones judiciales contrarias a derecho. Actuamos en <strong>reposición, apelación, casación y revisión</strong> ante la Sala de lo Penal de la <strong><a href="https://www.poderjudicial.gob.hn" target="_blank" rel="noopener noreferrer">Corte Suprema de Justicia</a></strong>. Solicitamos <strong>nulidad de actuaciones</strong> por violación de garantías procesales, <strong>habeas corpus</strong> por detención ilegal, <strong>amparo constitucional</strong> y <strong>acción de inconstitucionalidad</strong>. Cuando se agotan los recursos internos, redactamos quejas ante la <strong>Comisión Interamericana de Derechos Humanos</strong> y llevamos el caso ante la <strong>Corte IDH</strong>. Si recibió una resolución desfavorable, analizamos la viabilidad del recurso antes de que precluya su derecho.`,
      icono: 'shield-alert',
      color: 'danger',
      subservicios: [
        { titulo: 'Recurso de reposición', descripcion: 'Ante el mismo juez que dictó la resolución.' },
        { titulo: 'Apelación', descripcion: 'Ante la Corte de Apelaciones Penal.' },
        { titulo: 'Casación', descripcion: 'Ante la Sala de lo Penal de la CSJ.' },
        { titulo: 'Revisión', descripcion: 'Cuando aparece prueba nueva o cambia la jurisprudencia.' },
        { titulo: 'Apelación de auto de prisión', descripcion: 'Revisión de medidas cautelares.' },
        { titulo: 'Recurso de hecho', descripcion: 'Cuando se deniega un recurso de apelación.' },
        { titulo: 'Queja ante la CSJ', descripcion: 'Por denegación de casación.' },
        { titulo: 'Nulidad de actuaciones', descripcion: 'Por violación de garantías procesales.' },
        { titulo: 'Excepciones en el proceso penal', descripcion: 'Falta de competencia, prescripción, cosa juzgada, amnistía.' },
        { titulo: 'Amparo constitucional', descripcion: 'Por violación de derechos fundamentales.' },
        { titulo: 'Habeas corpus', descripcion: 'Por detención ilegal o prisión preventiva desproporcionada.' },
        { titulo: 'Habeas data penal', descripcion: 'Acceso a antecedentes y datos.' },
        { titulo: 'Acción de inconstitucionalidad', descripcion: 'Contra leyes contrarias a la Constitución.' },
        { titulo: 'Recurso de queja por retardo de justicia', descripcion: 'Ante la CSJ.' },
        { titulo: 'Queja ante la Comisión Interamericana', descripcion: 'Por violación de derechos humanos en el proceso.' },
        { titulo: 'Procedimiento ante la Corte IDH', descripcion: 'Cuando se agotan los recursos internos.' },
      ],
      faqs: [
        { pregunta: '¿Se puede recurrir una sentencia condenatoria?', respuesta: 'Sí. Contra la sentencia de primera instancia procede apelación ante la Corte de Apelaciones, y contra la de segunda, casación ante la CSJ.' },
      ],
      areasRelacionadas: ['proceso-penal-completo', 'estrategia-penal-y-litigio'],
      keywords: ['casación penal Honduras', 'recurso de apelación', 'habeas corpus Honduras'],
    },
    {
      slug: 'estrategia-penal-y-litigio',
      titulo: 'Estrategia penal y litigio',
      resumen: 'Estrategia penal en Honduras: auditoría de riesgo penal corporativo, compliance penal, peritajes privados, contrainformes, defensa corporativa y negociación con el Ministerio Público.',
      descripcion:
        `Asesoría preventiva y construcción de <strong>estrategia procesal</strong> desde las primeras horas del caso penal. Realizamos <strong>auditoría de riesgo penal corporativo</strong>, políticas de compliance penal, códigos de ética e investigaciones internas con cadena de custodia. En el litigio, identificamos pruebas, contratamos <strong>peritajes privados y contrainformes</strong>, y preparamos la negociación con el Ministerio Público para alcanzar acuerdos o criterios de oportunidad. Asumimos la <strong>defensa corporativa</strong> de personas jurídicas y la asistencia a declaración del imputado. Antes de imputar o declarar, una buena estrategia evita condenas: consúltenos con un plan de defensa documentado.`,
      icono: 'target',
      color: 'primary',
      subservicios: [
        { titulo: 'Auditoría de riesgo penal corporativo', descripcion: 'Compliance y prevención de delitos.' },
        { titulo: 'Mapa de riesgos penales', descripcion: 'Identificación de vulnerabilidades por actividad.' },
        { titulo: 'Políticas de compliance penal', descripcion: 'Diseño e implementación.' },
        { titulo: 'Canal de denuncias', descripcion: 'Asesoría legal para su gestión.' },
        { titulo: 'Investigaciones internas', descripcion: 'Con garantía de cadena de custodia.' },
        { titulo: 'Línea ética y código de conducta', descripcion: 'Redacción y entrenamiento.' },
        { titulo: 'Defensa corporativa', descripcion: 'Personas jurídicas y administradores.' },
        { titulo: 'Querella y acusación particular', descripcion: 'En nombre de la víctima.' },
        { titulo: 'Peritajes privados', descripcion: 'Selección y coordinación.' },
        { titulo: 'Contrainforme pericial', descripcion: 'Contra peritajes oficiales.' },
        { titulo: 'Investigadores privados', descripcion: 'Coordinación con firmas de investigación.' },
        { titulo: 'Análisis jurisprudencial', descripcion: 'Búsqueda y aplicación de precedentes.' },
        { titulo: 'Estrategia de negociación con el MP', descripcion: 'Acuerdos y conformidad.' },
        { titulo: 'Defensa en flagrancia', descripcion: 'Primeras horas críticas.' },
        { titulo: 'Asistencia a declaración', descripcion: 'Acompañamiento profesional.' },
        { titulo: 'Análisis de viabilidad de la prueba', descripcion: 'Estrategia probatoria.' },
      ],
      faqs: [
        { pregunta: '¿Cómo evitar que el caso llegue a juicio oral?', respuesta: 'Trabajar en la fase de investigación y en la audiencia inicial con estrategia procesal. Negociar criterios de oportunidad o suspensión condicional cuando proceda.' },
      ],
      areasRelacionadas: ['proceso-penal-completo', 'recursos-y-defensa-avanzada'],
      keywords: ['estrategia penal Honduras', 'compliance penal', 'peritaje penal'],
    },
    {
      slug: 'ejecucion-penal-y-beneficios',
      titulo: 'Ejecución penal y beneficios',
      resumen: 'Beneficios penitenciarios en Honduras: libertad condicional, redención de pena por trabajo y estudio, indulto, conmutación, reclusión domiciliaria, habeas corpus en prisión y derechos del condenado.',
      descripcion:
        `Acompañamos a <strong>personas privadas de libertad y sus familias</strong> durante la etapa de cumplimiento de la pena. Solicitamos <strong>libertad condicional, redención de pena por trabajo y estudio, indulto y conmutación</strong>. Gestionamos traslados de centro penal, reclusión domiciliaria con monitoreo electrónico, revisión de cómputo de pena y excarcelación inmediata por cumplimiento. Interponemos <strong>habeas corpus</strong> por detención ilegal o condiciones indignas en prisión. Si un familiar suyo está privado de libertad, consúltenos: le informamos los requisitos exactos y los plazos para cada beneficio.`,
      icono: 'key',
      color: 'success',
      subservicios: [
        { titulo: 'Libertad condicional', descripcion: 'Cumplimiento de los requisitos legales y trámite.' },
        { titulo: 'Redención de pena por trabajo y estudio', descripcion: 'Cómputo y solicitud.' },
        { titulo: 'Período de seguridad', descripcion: 'Estudio de procedencia y solicitud.' },
        { titulo: 'Traslado de centro penal', descripcion: 'Por acercamiento familiar, salud o seguridad.' },
        { titulo: 'Permisos de salida y visita íntima', descripcion: 'Trámite ante la dirección del penal.' },
        { titulo: 'Indulto y conmutación', descripcion: 'Solicitud ante el Congreso Nacional o el Presidente.' },
        { titulo: 'Suspensión de la ejecución de la pena', descripcion: 'Cuando proceda.' },
        { titulo: 'Reclusión en domicilio', descripcion: 'Con monitoreo electrónico.' },
        { titulo: 'Beneficios para personas con enfermedad terminal o discapacidad grave', descripcion: 'Trámite humanitario.' },
        { titulo: 'Revisión de cómputo de pena', descripcion: 'Verificación de abonos y redenciones.' },
        { titulo: 'Excarcelación inmediata', descripcion: 'Por cumplimiento, amnistía o revisión.' },
        { titulo: 'Defensa ante sanciones disciplinarias', descripcion: 'Recurso de alzada y contencioso.' },
        { titulo: 'Acción de habeas corpus en prisión', descripcion: 'Por detención ilegal, tortura o condiciones indignas.' },
        { titulo: 'Acompañamiento familiar al privado de libertad', descripcion: 'Gestión de visitas y derechos del interno.' },
        { titulo: 'Coordinación con pastoral penitenciaria', descripcion: 'Apoyo espiritual y social.' },
      ],
      faqs: [
        { pregunta: '¿Cuándo se puede pedir libertad condicional en Honduras?', respuesta: 'Tras cumplir la mitad o las dos terceras partes de la pena, según el delito, y con buena conducta comprobada.' },
      ],
      areasRelacionadas: ['proceso-penal-completo', 'mediacion-conflictos-penales-y-multas'],
      keywords: ['libertad condicional Honduras', 'beneficios penitenciarios', 'INP Honduras'],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* HUB MIGRANTES — 3 subáreas transnacionales                                  */
/* -------------------------------------------------------------------------- */

export const hubMigrantes: HubMigrantes = {
  slug: 'hondurenos-en-espana',
  titulo: 'Hondureños en España',
  resumen: 'Abogado para hondureños en España: apostilla de La Haya, poderes notariales, divorcios internacionales, custodia, alimentos, sucesiones, nacionalidad española y reagrupación familiar.',
  descripcion:
    `Atención jurídica especializada para la <strong>comunidad hondureña en España</strong> y españoles con intereses en Honduras. Coordinamos con notarías, registros civiles, consulados y la Secretaría de Relaciones Exteriores para validar actos jurídicos con pleno efecto en ambos países. Cubrimos <strong>gestión documental y legalización</strong> (apostilla, traducción jurada), <strong>actos notariales internacionales</strong> (poderes, testamentos, compraventas) y <strong>asuntos civiles y familiares transfronterizos</strong> (divorcio internacional, custodia, alimentos, sucesiones, nacionalidad española). Si reside en España y su asunto legal está en Honduras, le entregamos un plan de trabajo con plazos, costos y los documentos necesarios.`,
  heroEyebrow: 'Asistencia transnacional',
  heroTitle: 'Hondureños en España: asistencia legal integral',
  heroSubtitle:
    'Ponemos a su disposición nuestra solvencia legal y técnica para gestionar de forma remota todos sus asuntos jurídicos en territorio hondureño. Facilitamos la emisión de documentación oficial, actos notariales, poderes internacionales, gestión de herencias y procesos de derecho de familia, garantizando que sus trámites locales se ejecuten con pleno efecto jurídico desde Honduras para sus necesidades en el extranjero',
  faqs: [
    { pregunta: '¿Pueden hacer poderes notariales en Honduras desde España?', respuesta: 'Sí. Coordinamos con notarios en Honduras para que usted firme en el Consulado o por poder especial, con apostilla y traducción cuando corresponda.' },
    { pregunta: '¿Cuánto tarda una legalización?', respuesta: 'La apostilla de La Haya en Honduras se obtiene en 1-3 días hábiles. Las traducciones juradas en España, según disponibilidad del traductor.' },
    { pregunta: '¿Pueden representarme en un juicio en Honduras si estoy en España?', respuesta: 'Sí, mediante poder especial para pleitos, otorgado ante notario español y traducido/apostillado, o firmado ante el Consulado.' },
    { pregunta: '¿Qué trámites hacen ustedes y cuáles requieren un abogado en España o son personales?', respuesta: 'Como bufete colegiado en Honduras, asumimos directamente la actuación jurídica en territorio hondureño (juicios, notarías, registros, SAR, RNP, etc.) y la coordinación documental con España (apostilla, traducción jurada, poderes, exequátur). Los trámites que requieren actuación ante autoridades españolas —como solicitud de reagrupación familiar, arraigo, nacionalidad española por residencia o inscripción en el Registro Civil español— se realizan ante la Administración General del Estado, Policía Nacional o notaría española, y en algunos casos exigen intervenir un profesional habilitado en España o ser realizados personalmente por el interesado. En esos supuestos le orientamos sobre el procedimiento y la documentación hondureña que necesita, y le indicamos cuándo conviene contar con abogado en España; no le representamos en jurisdicción española salvo lo que expresamente podamos coordinar.' },
  ],
  areasRelacionadas: [
    'gestion-documental-y-legalizacion',
    'actos-notariales-internacionales',
    'asuntos-civiles-y-familiares-desde-el-extranjero',
    'derecho-de-familia',
  ],
  keywords: [
    'Hondureños en España',
    'abogado Honduras España',
    'legalización de documentos Honduras',
    'apostilla Honduras España',
    'poder notarial desde España',
  ],
  subareas: [
    {
      slug: 'gestion-documental-y-legalizacion',
      titulo: 'Gestión documental y legalización',
      resumen: 'Apostilla de La Haya en Honduras, traducción jurada español-hondureño, partidas de nacimiento y matrimonio, antecedentes penales, DNI, pasaporte y certificaciones consulares para España.',
      descripcion:
        `Tramitamos la documentación que los <strong>hondureños en España</strong> y españoles con intereses en Honduras necesitan con validez jurídica en ambos países. Gestionamos la <strong>apostilla de La Haya</strong> ante la Secretaría de Relaciones Exteriores, <strong>traducción jurada</strong> español-hondureño, partidas de nacimiento, matrimonio y defunción, <strong>antecedentes penales</strong> y su cancelación en España, renovación de DNI y pasaporte hondureño en el Consulado, permisos de residencia y NIE, <strong>apostilla de documentos académicos</strong> y equivalencia de estudios. Le coordinamos con notarías en Honduras para protocolización de actos en España, gestión de escrituras notariales y asesoría en <strong>doble nacionalidad</strong>.`,
      icono: 'file-check-2',
      color: 'primary',
      subservicios: [
        { titulo: 'Apostilla de La Haya en Honduras', descripcion: 'Trámite ante la Secretaría de Relaciones Exteriores.' },
        { titulo: 'Legalización consular', descripcion: 'Para países no firmantes del Convenio de La Haya.' },
        { titulo: 'Traducción jurada español-hondureño', descripcion: 'Válida para juicios y registros.' },
        { titulo: 'Partida de nacimiento', descripcion: 'Solicitud, renovación y apostilla.' },
        { titulo: 'Partida de matrimonio', descripcion: 'Registro civil español o hondureño.' },
        { titulo: 'Partida de defunción', descripcion: 'Trámite consular y local.' },
        { titulo: 'Antecedentes penales', descripcion: 'Solicitud en Honduras y cancelación de antecedentes en España.' },
        { titulo: 'Certificado de nacimiento actualizado', descripcion: 'Para procedimientos migratorios.' },
        { titulo: 'Certificación de la Dirección General del RNP', descripcion: 'Para efectos en España.' },
        { titulo: 'DNI y pasaporte hondureño', descripcion: 'Renovación y duplicado en el Consulado.' },
        { titulo: 'Carta de soltería', descripcion: 'Para matrimonios en España.' },
        { titulo: 'Fe de vida', descripcion: 'Certificación para pensiones y prestaciones.' },
        { titulo: 'Antecedentes no penales para visado', descripcion: 'Trámite completo.' },
        { titulo: 'Permiso de residencia y NIE', descripcion: 'Renovación y cita previa.' },
        { titulo: 'Renovación del pasaporte español en Honduras', descripcion: 'Para hijos nacidos en Honduras.' },
        { titulo: 'Apostilla de documentos académicos', descripcion: 'Títulos universitarios y estudios.' },
        { titulo: 'Equivalencia de estudios', descripcion: 'Homologación ante la Secretaría de Educación.' },
        { titulo: 'Certificado de vida laboral', descripcion: 'Para pensiones y prestaciones.' },
        { titulo: 'Apostilla múltiple para expedientes', descripcion: 'Paquetes de documentos.' },
        { titulo: 'Coordinación con notarías en Honduras', descripcion: 'Para protocolización de actos en España.' },
        { titulo: 'Gestión integral de escrituras notariales', descripcion: 'Compraventa, herencia, matrimonio y poderes.' },
        { titulo: 'Documentos de identidad para recién nacidos', descripcion: 'Registro civil binacional.' },
        { titulo: 'Pasaporte de menor con uno o ambos padres en el extranjero', descripcion: 'Trámite y autorización.' },
        { titulo: 'Certificación consular de documentos', descripcion: 'Firmas legalizadas en el Consulado de Honduras en Madrid.' },
        { titulo: 'Asesoría en doble nacionalidad', descripcion: 'Por nacimiento, matrimonio o carta de naturaleza.' },
      ],
      faqs: [
        { pregunta: '¿Qué es la apostilla de La Haya?', respuesta: 'Es un sello que da validez internacional a un documento público entre los países firmantes del Convenio. Honduras lo es desde 2007.' },
        { pregunta: '¿Puedo apostillar en el Consulado de Honduras en Madrid?', respuesta: 'No. La apostilla se obtiene en Honduras, en la Secretaría de Relaciones Exteriores. En el Consulado se puede certificar la firma del documento.' },
      ],
      areasRelacionadas: ['actos-notariales-internacionales', 'asuntos-civiles-y-familiares-desde-el-extranjero'],
      keywords: ['apostilla Honduras', 'traducción jurada español-hondureño', 'documentos Honduras España'],
    },
    {
      slug: 'actos-notariales-internacionales',
      titulo: 'Actos notariales internacionales',
      resumen: 'Poderes notariales desde España, testamentos mancomunados, compraventas de inmuebles en Honduras, capitulaciones, donaciones y asesoría sobre derecho internacional privado Honduras-España.',
      descripcion:
        `Coordinamos con notarías en Honduras y España el otorgamiento de <strong>actos notariales con eficacia transnacional</strong>. Otorgamos <strong>poderes generales para pleitos</strong>, poderes especiales para venta, herencia, divorcio, administración de bienes y representación tributaria ante el <strong><a href="https://www.sar.gob.hn" target="_blank" rel="noopener noreferrer">SAR</a></strong>. Redactamos <strong>testamentos mancomunados</strong>, capitulaciones matrimoniales, compraventas e hipotecas sobre inmuebles en Honduras desde España, donaciones y renuncias de derechos hereditarios. Si vive en España y necesita resolver un asunto patrimonial en Honduras, podemos hacerlo por poder sin que tenga que viajar.`,
      icono: 'scroll',
      color: 'accent',
      subservicios: [
        { titulo: 'Poder general para pleitos', descripcion: 'Para representación judicial en Honduras.' },
        { titulo: 'Poder especial', descripcion: 'Para actos específicos: venta, herencia, divorcio.' },
        { titulo: 'Poder para administración de bienes', descripcion: 'Inmuebles en Honduras desde España.' },
        { titulo: 'Poder para representación tributaria', descripcion: 'Ante el SAR.' },
        { titulo: 'Poder para trámites bancarios', descripcion: 'En Honduras, desde España.' },
        { titulo: 'Poder para sucesión', descripcion: 'Aceptación de herencia y partición.' },
        { titulo: 'Poder para venta de inmuebles', descripcion: 'Coordinación notarial en Honduras.' },
        { titulo: 'Revocación y sustitución de poderes', descripcion: 'Acto notarial en ambos países.' },
        { titulo: 'Testamento ológrafo en España válido en Honduras', descripcion: 'Asesoría sobre ley aplicable.' },
        { titulo: 'Testamento mancomunado o conjunto', descripcion: 'Cuando ambos cónyuges están en España.' },
        { titulo: 'Protocolización de testamento otorgado en el extranjero', descripcion: 'En Honduras, ante el RNP.' },
        { titulo: 'Capitulaciones matrimoniales', descripcion: 'Régimen económico del matrimonio.' },
        { titulo: 'Acta de manifestaciones', descripcion: 'Para acreditar declaraciones relevantes.' },
        { titulo: 'Acta de protocolización de documentos privados', descripcion: 'Para darles fecha cierta.' },
        { titulo: 'Compraventa de inmuebles en Honduras', descripcion: 'Coordinación con notario en Honduras desde España.' },
        { titulo: 'Hipoteca sobre inmueble en Honduras', descripcion: 'Tramitación y registro.' },
        { titulo: 'Donación entre padres e hijos', descripcion: 'Planificación patrimonial.' },
        { titulo: 'Renuncia de derechos hereditarios', descripcion: 'Acto solemne ante notario.' },
        { titulo: 'Disolución de comunidad de bienes', descripcion: 'Procedimiento notarial.' },
        { titulo: 'Asesoría sobre ley aplicable', descripcion: 'Convenio de derecho internacional privado Honduras-España.' },
      ],
      faqs: [
        { pregunta: '¿Puedo vender una casa en Honduras viviendo en España?', respuesta: 'Sí, mediante poder especial para vender otorgado ante notario español (apostillado y traducido) o ante el Consulado de Honduras en Madrid.' },
      ],
      areasRelacionadas: ['gestion-documental-y-legalizacion', 'asuntos-civiles-y-familiares-desde-el-extranjero'],
      keywords: ['poder notarial desde España', 'testamento Honduras España', 'compraventa inmueble Honduras desde España'],
    },
    {
      slug: 'asuntos-civiles-y-familiares-desde-el-extranjero',
      titulo: 'Asuntos civiles y familiares desde el extranjero',
      resumen: 'Abogado Honduras-España: divorcio internacional, custodia y sustracción de menores (Convenio de La Haya 1980), alimentos internacionales, sucesiones, nacionalidad española y reagrupación familiar.',
      descripcion:
        `Asistencia legal en <strong>derecho de familia internacional entre Honduras y España</strong>. Tramitamos <strong>divorcios internacionales</strong> eligiendo la jurisdicción más favorable, reconocimiento (exequátur) de sentencias de divorcio, <strong>custodia internacional y sustracción parental</strong> (Convenio de La Haya 1980), pensión de alimentos internacional (Convenio de La Haya 2007) y <strong>sucesiones internacionales</strong>. Gestionamos <strong>nacionalidad española</strong> por residencia, carta de naturaleza y Ley de Memoria Democrática, <strong>reagrupación familiar</strong> y arraigo. Si vive en España y su asunto legal está en Honduras, le acompañamos con un equipo que conoce ambos ordenamientos.`,
      icono: 'plane',
      color: 'warning',
      subservicios: [
        { titulo: 'Divorcio internacional Honduras-España', descripcion: 'Mutuo acuerdo o contencioso, según la jurisdicción más favorable.' },
        { titulo: 'Reconocimiento de sentencia de divorcio español en Honduras', descripcion: 'Procedimiento ante la CSJ.' },
        { titulo: 'Reconocimiento de sentencia de divorcio hondureño en España', descripcion: 'Exequátur ante la Audiencia Provincial.' },
        { titulo: 'Custodia internacional de menores', descripcion: 'Traslado ilícito y restitución (Convenio de La Haya 1980).' },
        { titulo: 'Sustracción parental', descripcion: 'Procedimiento urgente de restitución.' },
        { titulo: 'Régimen de visitas transfronterizo', descripcion: 'Coordinación entre países.' },
        { titulo: 'Pensión de alimentos internacional', descripcion: 'Convenio de La Haya 2007.' },
        { titulo: 'Ejecución de alimentos en Honduras', descripcion: 'Cuando el obligado reside en España.' },
        { titulo: 'Ejecución de alimentos en España', descripcion: 'Cuando el obligado reside en Honduras.' },
        { titulo: 'Sucesión internacional', descripcion: 'Ley aplicable y jurisdicción competente.' },
        { titulo: 'Reconocimiento de testamento otorgado en España', descripcion: 'Protocolización en Honduras.' },
        { titulo: 'Adopción internacional', descripcion: 'Convenio de La Haya 1993.' },
        { titulo: 'Matrimonio civil en Honduras de residentes en España', descripcion: 'Trámite consular y registro civil.' },
        { titulo: 'Capitulaciones entre cónyuges con bienes en dos países', descripcion: 'Asesoría fiscal y patrimonial.' },
        { titulo: 'Mediación familiar internacional', descripcion: 'Centro de Mediación o mediador privado.' },
        { titulo: 'Asesoría en mudanza y reagrupación familiar', descripcion: 'Cumplimiento de requisitos migratorios.' },
        { titulo: 'Reagrupación familiar en España', descripcion: 'Para hijos o cónyuges en Honduras.' },
        { titulo: 'Arraigo social, laboral y familiar en España', descripcion: 'Para personas en situación irregular.' },
        { titulo: 'Renovación y modificación de autorización de residencia', descripcion: 'Cuando cambian circunstancias.' },
        { titulo: 'Nacionalidad española por residencia', descripcion: 'Después de 1, 2 o 10 años según el caso.' },
        { titulo: 'Nacionalidad por carta de naturaleza', descripcion: 'Por circunstancias excepcionales.' },
        { titulo: 'Nacionalidad para hijos de españoles nacidos en Honduras', descripcion: 'Ley de Memoria Democrática y otros supuestos.' },
        { titulo: 'Doble nacionalidad Honduras-España', descripcion: 'Compatibilidad y renuncia.' },
        { titulo: 'Inscripción de matrimonio celebrado en Honduras', descripcion: 'En el Registro Civil español.' },
        { titulo: 'Inscripción de nacimiento de hijo en el Consulado', descripcion: 'Para que conste como español.' },
      ],
      faqs: [
        { pregunta: '¿Cuánto tarda un divorcio internacional entre Honduras y España?', respuesta: 'Entre 6 meses y 2 años según la jurisdicción elegida y la cooperación procesal. Podemos analizar la estrategia más favorable.' },
        { pregunta: '¿Puedo pedir alimentos desde España si el padre está en Honduras?', respuesta: 'Sí, mediante solicitud al Ministerio Público y al Juzgado de Familia. La ejecución del Convenio de La Haya 2007 aplica si ambos países están vinculados.' },
      ],
      areasRelacionadas: ['gestion-documental-y-legalizacion', 'actos-notariales-internacionales', 'derecho-de-familia'],
      keywords: ['divorcio internacional Honduras España', 'custodia internacional', 'Convenio de La Haya Honduras'],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Helpers de acceso                                                           */
/* -------------------------------------------------------------------------- */

export type AnyArea = AreaStandalone | AreaBase;

export function getAreaBySlug(slug: string): AreaStandalone | undefined {
  return areasGenerales.find((a) => a.slug === slug);
}

export function getPenalGrupoBySlug(slug: string): AreaBase | undefined {
  return hubPenal.grupos.find((g) => g.slug === slug);
}

export function getMigranteSubareaBySlug(slug: string): AreaBase | undefined {
  return hubMigrantes.subareas.find((s) => s.slug === slug);
}

export function getAllAreaSlugs(): string[] {
  const slugs: string[] = [];
  for (const a of areasGenerales) slugs.push(a.slug);
  for (const g of hubPenal.grupos) slugs.push(g.slug);
  for (const s of hubMigrantes.subareas) slugs.push(s.slug);
  return slugs;
}

/**
 * Devuelve las áreas relacionadas con un slug dado.
 *
 * Arreglado (Jul 2026): antes solo resolvía contra `areasGenerales`, lo que
 * descartaba silenciosamente los targets penales/migrantes. Ahora resuelve
 * contra TODAS las áreas (generales + grupos penales + subáreas migrantes).
 * El tipo de retorno es AnyArea[] para incluir los tres tipos.
 */
export function getRelatedAreas(slug: string): AnyArea[] {
  const all: AnyArea[] = [
    ...areasGenerales,
    ...hubPenal.grupos,
    ...hubMigrantes.subareas,
  ];
  const direct = all.find((a) => a.slug === slug)?.areasRelacionadas ?? [];
  return direct
    .map((s) => all.find((a) => a.slug === s))
    .filter((a): a is AnyArea => Boolean(a));
}

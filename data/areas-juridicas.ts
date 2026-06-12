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

export type AreaBase = {
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

export type HubPenal = {
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
      'Somos un bufete de abogados de familia en Honduras con experiencia en divorcios, custodia compartida, pensión de alimentos, régimen de visitas, violencia intrafamiliar, sucesiones, testamentos, adopciones y restitución internacional de menores. Atendemos en los Juzgados de Familia de Nacaome, San Lorenzo, Choluteca y Tegucigalpa, y en el Centro de Mediación del Poder Judicial cuando conviene una solución pactada. Le acompañamos desde la primera consulta confidencial hasta la ejecución de la sentencia, con comunicación directa del abogado responsable, plazos claros y un presupuesto por escrito. Si atraviesa un momento difícil en su familia, le escuchamos, le informamos sus derechos reales y le ayudamos a tomar decisiones con la serenidad que su caso requiere.',
    icono: 'users',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho de Familia en Honduras',
    heroSubtitle:
      'Le acompañamos en divorcios, custodia, pensión de alimentos, sucesiones, violencia intrafamiliar y protección de menores en Nacaome, Valle y todo Honduras. Atención humana, estrategia legal clara y defensa técnica ante Juzgados de Familia y Tribunales de Sentencia.',
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
      { pregunta: '¿Cuánto tarda un divorcio en Honduras?', respuesta: 'Un divorcio por mutuo acuerdo se resuelve entre 2 y 6 meses si no hay menores ni bienes. Un contencioso puede durar de 1 a 3 años según la complejidad y la carga judicial.' },
      { pregunta: '¿Cómo se calcula la pensión de alimentos en Honduras?', respuesta: 'El juez fija un porcentaje de los ingresos del obligado (entre 30% y 60% según el número de hijos) más el 50% de gastos educativos y de salud extraordinarios.' },
      { pregunta: '¿Puedo pedir custodia compartida?', respuesta: 'Sí, el Código de Familia la contempla. El juez evalúa la capacidad de ambos progenitores, la opinión del menor y la cercanía de los domicilios.' },
      { pregunta: '¿Qué pasa si el padre no paga la pensión de alimentos?', respuesta: 'Se ejecuta forzosamente con embargo de salario, cuentas bancarias o bienes. Puede configurarse el delito de incumplimiento de deberes familiares.' },
    ],
    areasRelacionadas: ['mediacion-conflictos-penales-y-multas', 'asuntos-civiles-y-familiares-desde-el-extranjero'],
    keywords: [
      'abogado de familia Nacaome',
      'divorcio Honduras',
      'pensión de alimentos Honduras',
      'custodia de menores Valle',
      'sucesiones Honduras',
      'violencia intrafamiliar Honduras',
    ],
    destacado: 'Conocemos a los Juzgados de Familia de Nacaome, San Lorenzo, Choluteca y Tegucigalpa.',
  },
  {
    slug: 'derecho-laboral',
    titulo: 'Derecho Laboral',
    resumen: 'Abogado laboralista en Nacaome y Honduras: despidos injustificados, cálculo de prestaciones, aguinaldo, riesgos profesionales, acoso laboral y asesoría preventiva a empresas.',
    descripcion:
      'Despachos de abogados laboralistas en Honduras con actuación en Tegucigalpa, San Pedro Sula, Choluteca, Nacaome y todo el país. Calculamos y reclamamos preaviso, cesantía, vacaciones, aguinaldo y décimo tercer mes en despidos injustificados; defendemos trabajadores en riesgos profesionales y accidentes laborales ante el IHSS; representamos a empresas en cumplimiento normativo, redacción de contratos, reglamentos internos y prevención de contingencias. Actuamos en Inspecciones del Trabajo, Tribunales de Conciliación, Juzgados del Trabajo y Corte Suprema en casación. Le entregamos un presupuesto por escrito, le explicamos cada etapa del proceso y le acompañamos con un abogado responsable. Si fue despedido, no cobró su aguinaldo o sufre acoso laboral, contáctenos antes de firmar cualquier documento.',
    icono: 'briefcase',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Laboral en Honduras',
    heroSubtitle:
      'Defendemos sus derechos como trabajador o acompañamos a su empresa con cumplimiento normativo. Reclamamos prestaciones, despidos, aguinaldo, décimo tercer mes, riesgos profesionales, acoso laboral y negociación colectiva ante Juzgados del Trabajo, Tribunales de Conciliación y Corte Suprema de Justicia en todo Honduras.',
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
      { pregunta: '¿Cuánto me corresponde si me despiden sin justa causa?', respuesta: 'Preaviso (1 mes o 15 días según antigüedad), cesantía (1 mes por año o fracción máxima 25), vacaciones proporcionales, aguinaldo proporcional y décimo tercer mes proporcional.' },
      { pregunta: '¿Cuándo se paga el aguinaldo en Honduras?', respuesta: 'El aguinaldo se paga en dos cuotas: 50% antes del 30 de junio y 50% antes del 30 de noviembre, o en un solo pago antes del 20 de diciembre.' },
      { pregunta: '¿Qué hago si sufro un accidente laboral?', respuesta: 'Notificar al empleador de inmediato, recibir atención del IHSS y, si hay negligencia, demandar la indemnización complementaria ante el Juzgado del Trabajo.' },
    ],
    areasRelacionadas: ['asesoria-preventiva', 'conciliacion-y-arbitraje'],
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
    resumen: 'Abogado civil y notario en Nacaome y Honduras: contratos, compraventas, arrendamientos, hipotecas, sucesiones, protocolización, cobros judiciales y derecho de daños.',
    descripcion:
      'Brindamos asesoría legal civil y notarial en Honduras para personas, empresas y familias. Redactamos y revisamos contratos de compraventa, arrendamiento, hipoteca, permuta, donación, mandato y fideicomiso; tramitamos protocolizaciones, poderes notariales, capitulaciones, testamentos y declaratorias de herederos ante el Instituto de la Propiedad. Litigamos en acciones posesorias, reivindicatorias, prescripción adquisitiva, usucapión, servidumbres, deslindes, cobros judiciales por la vía ejecutiva o monitoria, y reclamaciones de daños y perjuicios por responsabilidad civil contractual o extracontractual. Trabajamos con un equipo de notarios en Nacaome, Tegucigalpa y San Pedro Sula para ofrecerle un servicio completo, con presupuesto por escrito y trazabilidad de cada actuación.',
    icono: 'file-text',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Civil y Notarial',
    heroSubtitle:
      'Contratos sólidos, actos notariales seguros y litigio civil estratégico en Honduras. Le acompañamos en compraventas, arrendamientos, hipotecas, sucesiones, donaciones, mandatos, poderes, protocolización, cobros judiciales y responsabilidad civil, con estudio de títulos, registro de la propiedad y defensa ante Juzgados de Letras.',
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
      { pregunta: '¿Cómo saber si un vendedor de inmueble tiene derecho a vender?', respuesta: 'Solicitamos un estudio de títulos de 20 años al Instituto de la Propiedad, revisamos gravámenes, limitaciones y verificamos la identidad del titular registral.' },
      { pregunta: '¿Se puede desahuciar al inquilino que no paga en Honduras?', respuesta: 'Sí, mediante juicio verbal de desahucio por falta de pago con plazo de 2 meses, y en casos urgentes juicio ejecutivo.' },
      { pregunta: '¿Qué diferencia hay entre prescripción y usucapión?', respuesta: 'La prescripción adquisitiva es la figura general; la usucapión suele aplicarse a bienes inmuebles con posesión pacífica e ininterrumpida por el plazo legal (5, 10 o 20 años según el caso).' },
    ],
    areasRelacionadas: ['derecho-de-familia', 'asuntos-civiles-y-familiares-desde-el-extranjero'],
    keywords: [
      'abogado civil Nacaome',
      'compraventa inmuebles Honduras',
      'notario Nacaome',
      'protocolización de documentos Valle',
      'cobro judicial Honduras',
    ],
  },
  {
    slug: 'derecho-mercantil-empresarial',
    titulo: 'Derecho Mercantil y Empresarial',
    resumen: 'Abogado mercantil y corporativo en Honduras: constitución de sociedades, contratos comerciales, fusiones, registro de marcas, franquicias, gobierno corporativo y arbitraje.',
    descripcion:
      'Asesoramos a emprendedores, PYMEs, sociedades anónimas, sucursales extranjeras y corporativos en todo el ciclo de vida empresarial. Constituimos y reformamos sociedades (S.A., S. de R.L., comandita, cooperativas), redactamos contratos mercantiles de suministro, distribución, franquicia, joint venture, agencia, concesión y licencia; acompañamos fusiones, adquisiciones, due diligence, gobierno corporativo, compliance y competencia desleal. Tramitamos el registro de marcas, patentes, modelos de utilidad, derechos de autor y nombres de dominio. Litigamos en Juzgados de Letras de lo Mercantil y en arbitraje institucional (CIAM, CICA) cuando es la vía más eficiente. Si va a invertir, expandir, contratar o defender su empresa en Honduras, consúltenos: le entregamos un diagnóstico inicial y un plan de acción con plazos y costos claros.',
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
      'Defendemos a usuarios financieros y asesoramos a entidades reguladas por la Comisión Nacional de Bancos y Seguros (CNBS) en Honduras. Revisamos contratos crediticios, identificamos cláusulas abusivas en tarjetas de crédito, préstamos personales, hipotecarios y líneas de capital de trabajo; negociamos reestructuras antes del embargo y, cuando es inevitable, ejecutamos la defensa técnica del cliente. Representamos en cobro judicial bancario, juicios ejecutivos cambiarios, garantías mobiliarias, prendarias, hipotecarias y fiduciarias. Atendemos sanciones de la CNBS,multas por incumplimiento de PLD/FT, procedimientos de la UAF, recursos de reconsideración y nulidad, y acusaciones por captación ilegal de dinero. Si tiene un crédito en mora, enfrenta un embargo bancario o requiere asesoría preventiva para su entidad financiera, consúltenos.',
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
      'Defendemos a personas y empresas frente a actos de la Administración Pública hondureña. Interponemos recursos de reposición y apelación para agotar la vía administrativa; impugnamos multas del SAR, ARSA, ENEE, CONATEL, CNBS y otras entidades reguladoras; llevamos demandas contencioso-administrativas ante los Juzgados de Letras de lo Contencioso y la Corte Suprema de Justicia. Asesoramos a servidores públicos en estabilidad laboral, reinstalación, indemnizaciones, concursos públicos y procedimientos disciplinarios ante la Dirección General de Servicio Civil. Redactamos y revisamos contratos del Estado (licitación, concurso, contratación directa y excepciones), acompañamos al IAIP en acceso a la información y tramitamos habeas data, habeas corpus y acciones de inconstitucionalidad. Si recibió una sanción, fue despedido del Estado o necesita impugnar un acto administrativo, consúltenos antes de que venza el plazo.',
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
      'Asesoramos integralmente a importadores, exportadores, despachadores aduaneros y operadores de zonas libres en Honduras. Realizamos clasificación arancelaria, valoración conforme al Acuerdo de la OMC, gestión de regímenes suspensivos (importación temporal, tránsito aduanero DUA-T, depósito), exportación definitiva con devolución de impuestos ante el SAR, y constitución de empresas en ZOLI, ZIP y ZAL. Tramitamos permisos VUCE, declaraciones de comercio de servicios, derechos compensatorios y antidumping. Defendemos técnicamente en investigaciones por contrabando y defraudación fiscal aduanera, recursos de reconsideración, apelación ante el SAR y litigio contencioso-administrativo. Si importa, exporta, opera una zona libre o enfrenta una sanción aduanera, le acompañamos con experiencia directa en Puerto Cortés, Amapala, San Lorenzo y las aduanas del país.',
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
      'Acompañamos a laboratorios, fabricantes, importadores, distribuidores, farmacias, clínicas y profesionales de la salud en el cumplimiento de la normativa de la Agencia de Regulación Sanitaria (ARSA) y la Secretaría de Salud. Tramitamos registros sanitarios de medicamentos, alimentos, bebidas, cosméticos, productos de higiene, dispositivos médicos, plaguicidas y agroquímicos; implementamos Buenas Prácticas de Manufactura (BPM), Buenas Prácticas de Almacenamiento y Distribución (BPAD) y procedimientos de farmacovigilancia. Asesoramos la apertura y renovación de establecimientos farmacéuticos, botiquines, droguerías y consultorios. Defendemos en sanciones de la ARSA, recursos de reposición y apelación, litigio contencioso-administrativo y casos de responsabilidad médica y mala praxis. Si su establecimiento fue fiscalizado, debe renovar un registro o enfrenta una denuncia por publicidad engañosa, consúltenos antes de responder.',
    icono: 'heart-pulse',
    color: 'success',
    heroEyebrow: 'Área legal',
    heroTitle: 'Regulación Sanitaria',
    heroSubtitle:
      'Cumplimiento normativo en alimentos, medicamentos, cosméticos, dispositivos médicos, plaguicidas, establecimientos de salud y telemedicina. Registro sanitario, Buenas Prácticas de Manufactura y Almacenamiento, defensa ante ARSA, mala praxis médica, consentimiento informado y litigio contencioso-administrativo en todo Honduras.',
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
      'Asesoramos a extranjeros que viven, trabajan, invierten, estudian o se casan con nacionales en Honduras. Tramitamos ante el Instituto Nacional de Migración (INM) y la Cancillería: visas de turista con sus prórrogas y conversión de estatus, visas de trabajo por oferta de empleo o transferencia intraempresarial, residencia temporal por vínculo familiar, laboral, inversión o estudios, residencia permanente, visa de inversionista, rentista y pensionado. Gestionamos naturalización ordinaria (7 años), por matrimonio (2 años), por servicios prestados y doble nacionalidad. Acompañamos permisos de salida de menores, apostilla de documentos, registro civil de hijos nacidos en Honduras, filiación y defensa frente a procedimientos de deportación, recursos de revisión y habeas corpus. Si su empresa contrata personal extranjero o usted necesita regularizar su estatus migratorio, le acompañamos con discreción y criterio técnico.',
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
    areasRelacionadas: ['hondurenos-en-espana', 'derecho-de-familia'],
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
      'Protegemos y defendemos los activos intangibles de empresas, emprendedores y creadores en Honduras. Realizamos búsqueda, presentación, seguimiento y renovación de marcas (incluidas marcas de certificación, colectivas y denominaciones de origen), patentes de invención, modelos de utilidad, diseños industriales, esquemas de trazado de circuitos integrados y derechos de autor sobre obras literarias, artísticas, musicales, software y audiovisuales. Redactamos y negociamos contratos de cesión, licenciamiento, transferencia de tecnología, confidencialidad y secretos empresariales. Tramitamos procedimientos de oposición al registro y defendemos frente a infracciones con medidas cautelares, demolición de productos y demandas judiciales, incluyendo disputas de nombres de dominio (.hn, .com, UDRP). Si va a lanzar un producto, registrar una marca o enfrenta una infracción, le entregamos un diagnóstico inicial y un plan de protección con tiempos y costos.',
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
      'Asesoramos en materia fiscal a personas naturales, profesionales independientes, PYMEs, sociedades anónimas y grupos empresariales con operaciones en Honduras. Liquidamos el impuesto sobre la renta (ISR) y el impuesto al valor agregado (ISV), planificamos la aportación solidaria, régimen simplificado, SAR-Fácil, retenciones y percepciones; estructuramos operaciones de precios de transferencia con estudio, declaración informativa y documentación de soporte. Defendemos técnicamente al contribuyente en fiscalizaciones del Servicio de Administración de Rentas (SAR), acompañamos visitas, interponemos recursos de reconsideración y apelación, y litigamos ante los Juzgados de Letras de lo Tributario. Gestionamos devoluciones de pagos indebidos, beneficios fiscales en zonas libres, exoneraciones sectoriales y regímenes especiales. Si recibió un requerimiento del SAR, fue fiscalizado o necesita optimizar su carga tributaria, consúltenos antes de presentar descargos.',
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
      'Acompañamos a empresas, municipalidades y proyectos productivos en el cumplimiento de la Ley General del Ambiente, los reglamentos de MiAmbiente, la SERNA y las ordenanzas municipales en Honduras. Tramitamos la licencia ambiental por categoría, evaluaciones de impacto ambiental, diagnósticos ambientales, permisos de vertimiento y emisiones, manejo de residuos sólidos y peligrosos, y aprovechamientos forestales en áreas protegidas. Implementamos auditorías ambientales voluntarias, programas de cumplimiento y protocolos de cambio climático, bonos de carbono y créditos ambientales. Defendemos técnicamente en sanciones de MiAmbiente, recursos administrativos, acciones populares ambientales, responsabilidad por daño ambiental y litigio climático estratégico. Si su proyecto requiere licencia ambiental, enfrenta una sanción de MiAmbiente o necesita acreditar cumplimiento normativo, consúltenos desde la fase de diseño para ahorrar tiempo y costos.',
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
      'Resolvemos disputas civiles, mercantiles, de familia y contratos de construcción por vías más ágiles, confidenciales y especializadas que la justicia ordinaria. Redactamos cláusulas compromisorias y convenciones arbitrales; actuamos como abogados de parte en arbitrajes institucionales (CIAM, Centro de Conciliación del CICA, CCIC) y arbitrajes ad hoc con reglas de procedimiento y selección de árbitros. Llevamos arbitrajes internacionales bajo reglas de la CCI, CIADI, UNCITRAL y LACIAC, así como dispute boards en proyectos de infraestructura de larga duración. Tramitamos conciliación prejudicial en el Centro de Mediación del Poder Judicial, mediación privada con efectos de cosa juzgada, mediación penal para criterios de oportunidad, y mediación familiar internacional. Homologamos laudos arbitrales extranjeros ante la Corte Suprema de Justicia, ejecutamos el laudo como título ejecutivo y recurrimos en nulidad cuando corresponde. Si quiere resolver un conflicto sin un juicio que dure años, consúltenos sobre la mejor vía.',
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
  resumen: 'Abogados penalistas en Nacaome, Valle y todo Honduras: defensa penal estratégica en cualquier etapa del proceso, asistencia a detenidos, juicios orales, casación y ejecución penal.',
  descripcion:
    'Defensa penal técnica en todas las etapas del proceso penal hondureño, con presencia activa en Tegucigalpa, San Pedro Sula, Comayagua, Choluteca y Nacaome. Conocimiento profundo del Código Penal (Decreto 130-2017 y reformas 119-2019, 46-2020, 93-2021, 59-2024), de la jurisprudencia de la Sala de lo Penal de la Corte Suprema de Justicia y de la práctica forense en Juzgados de Letras, Tribunales de Sentencia y Cortes de Apelaciones. Trabajamos desde la primera actuación procesal (asistencia a detenidos, audiencias iniciales, revisión de medidas cautelares) hasta la ejecución penal y los beneficios de ley. Si enfrenta una imputación, una investigación fiscal, una citación judicial, una orden de captura o requiere asistencia inmediata por la detención de un familiar, consúltenos: la defensa temprana y especializada es determinante.',
  heroEyebrow: 'Área principal',
  heroTitle: 'Abogados Penalistas en Nacaome, Valle — Defensa Penal Técnica',
  heroSubtitle:
    'Atendemos casos penales en toda Honduras, desde Nacaome, Valle. Trabajamos desde la primera actuación procesal (asistencia a detenidos, audiencias iniciales, revisión de medidas cautelares) hasta la ejecución penal, beneficios de ley, recursos de casación y cumplimiento de penas. Defensa técnica, comunicación directa y presupuesto por escrito.',
  faqs: [
    { pregunta: '¿Pueden defenderme si acabo de ser detenido?', respuesta: 'Sí. La asistencia letrada es un derecho irrenunciable desde el primer momento. Podemos acudir a la estación policial o al juzgado y ejercer defensa inmediata.' },
    { pregunta: '¿Cuánto cuesta una defensa penal en Honduras?', respuesta: 'Depende de la complejidad. Ofrecemos consulta inicial confidencial para evaluar el caso y emitir un presupuesto claro por escrito.' },
    { pregunta: '¿Trabajan en todo el país?', respuesta: 'Sí. Tenemos presencia activa en Tegucigalpa, San Pedro Sula, Comayagua, Choluteca y Nacaome, y nos desplazamos a cualquier jurisdicción.' },
    { pregunta: '¿Atienden casos graves (homicidio, narcotráfico, delitos sexuales)?', respuesta: 'Sí, con la misma dedicación y un equipo preparado. La gravedad no reduce la defensa: la aumenta.' },
  ],
  areasRelacionadas: [
    'mediacion-conflictos-penales-y-multas',
    'asuntos-civiles-y-familiares-desde-el-extranjero',
    'derecho-de-familia',
  ],
  keywords: [
    'abogado penalista Nacaome',
    'defensa penal Honduras',
    'Código Penal Honduras',
    'asistencia a detenidos Valle',
    'abogado penal Tegucigalpa',
    'proceso penal Honduras',
  ],
  grupos: [
    {
      slug: 'atencion-casos-penales-litigiosos',
      titulo: 'Atención de casos penales litigiosos',
      resumen: 'Abogado penalista litigioso en Honduras: defensa técnica en homicidio, femicidio, robo, estafa, narcotráfico, lavado de activos, delitos sexuales, económicos y de tránsito en todas las etapas del proceso.',
      descripcion:
        'Atendemos casos penales activos en Tegucigalpa, San Pedro Sula, Comayagua, Choluteca, Nacaome y todo Honduras. Asumimos la defensa desde la primera declaración del imputado, pasando por la audiencia inicial, etapa intermedia, acusación y acusación alternativa, hasta el juicio oral, los recursos de apelación, casación y revisión ante la Corte Suprema de Justicia. Tenemos experiencia directa en delitos contra la vida (homicidio simple, agravado, asesinato, parricidio, femicidio, tentativas y homicidios imprudentes por accidentes de tránsito), lesiones, violencia intrafamiliar, delitos contra la libertad e indemnidad sexual (abuso, agresión, violación, estupro, explotación sexual, pornografía infantil), sustracción de menores, delitos patrimoniales (robo, hurto, receptación, estafas, defraudación, fraudes corporativos, esquemas Ponzi, clonación de tarjetas), delitos económicos (lavado de activos, testaferrato, quiebra fraudulenta, delitos societarios), narcotráfico y tráfico de drogas, tenencia y facilitación de locales, contrabando y defraudación fiscal aduanera, cohecho, prevaricato, abuso de autoridad, trata de personas, tráfico ilícito de armas, delitos de prensa (calumnia, injuria, difamación, linchamiento digital) y allanamiento de morada. Si usted o un familiar enfrenta una imputación penal, consúltenos de inmediato: la defensa temprana marca la diferencia.',
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
        { pregunta: '¿Qué pasa si la acusación es débil?', respuesta: 'Trabajamos la estrategia procesal desde la primera audiencia para atacar la prueba de cargo y, si es posible, добиться absolución en juicio.' },
      ],
      areasRelacionadas: ['estrategia-penal-y-litigio', 'recursos-y-defensa-avanzada'],
      keywords: [
        'defensa penal Tegucigalpa',
        'abogado penalista San Pedro Sula',
        'homicidio abogado Honduras',
      ],
    },
    {
      slug: 'mediacion-conflictos-penales-y-multas',
      titulo: 'Mediación, conflictos penales y multas',
      resumen: 'Abogado penal en Honduras: mediación penal, criterios de oportunidad, suspensión condicional del proceso, conciliación penal, justicia restaurativa y recurso de multas administrativas.',
      descripcion:
        'Estrategia orientada a extinguir la acción penal por la vía del acuerdo restaurativo, la mediación, los criterios de oportunidad, la suspensión condicional del proceso o el procedimiento abreviado, según proceda en su caso. Tramitamos criterios de oportunidad del artículo 27 del Código Procesal Penal, suspensión condicional con régimen de prueba, conciliación en delitos perseguibles por instancia particular, acuerdo reparatorio con la víctima, mediación penal en el Centro de Mediación del Poder Judicial o con mediadores privados, y aplicación del principio de mínima intervención penal. Gestionamos archivo de denuncias, desistimiento de querellas y solicitudes de prescripción, muerte del reo y otras causales de extinción. En el plano administrativo, recurrimos multas de tránsito, del SAR, ARSA, ENEE, CONATEL, municipalidades y cualquier entidad reguladora: reposición, apelación, nulidad, sustitución de la pena de multa y pago de reparación civil. Si busca una salida temprana del proceso penal o impugnar una sanción administrativa, le orientamos con un plan procesal y un presupuesto por escrito.',
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
      ],
      areasRelacionadas: ['atencion-casos-penales-litigiosos', 'asesoria-preventiva'],
      keywords: ['mediación penal Honduras', 'criterio de oportunidad', 'conciliación penal'],
    },
    {
      slug: 'menores-justicia-juvenil',
      titulo: 'Menores, justicia juvenil y protección',
      resumen: 'Abogado de justicia juvenil y protección de menores en Honduras: defensa de adolescentes, medidas socioeducativas, restitución de derechos, adopción, DINAF, CNA y trabajo infantil.',
      descripcion:
        'Asistencia técnica especializada en el sistema de justicia juvenil y protección de la niñez, regido por el Código de la Niñez y la Adolescencia (CNA) y supervisado por la DINAF. Defendemos a adolescentes en conflicto con la ley ante Jueces de Niñez y Adolescencia, solicitando, revisando o impugnando medidas socioeducativas: amonestación, libertad asistida, servicio a la comunidad, y privación de libertad únicamente como último recurso. Tramitamos restitución de derechos del niño, medidas de protección (acogimiento familiar o institucional), revisión, cesación o sustitución de medidas, y procedimientos contravencionales por faltas cometidas por adolescentes. Actuamos en patria potestad y su suspensión, obligaciones alimentarias, autorización para viajar, justicia terapéutica para adolescentes con consumo problemático y trabajo infantil. Acompañamos procesos de adopción nacional e internacional conforme al Convenio de La Haya de 1993, y casos de tráfico y explotación sexual de menores. Si un menor de su familia está involucrado en un proceso penal juvenil o necesita protección, consúltenos con la mayor prontitud.',
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
        'Acompañamiento legal integral del proceso penal hondureño, desde la investigación preliminar fiscal hasta la sentencia firme y su ejecución. Actuamos en la audiencia inicial del artículo 296 del Código Procesal Penal (imputación, formulación de cargos, defensa, solicitud de sobreseimiento, revisión de medidas cautelares y, en su caso, prisión preventiva), en la etapa intermedia con excepciones, oferta probatoria y exclusión de prueba ilícita, en la audiencia de auto de apertura a juicio, en el debate oral y público con preparación y contrainterrogatorio de testigos, prueba pericial, prueba anticipada, alegatos de apertura y clausura, y en los recursos de apelación, casación y revisión. Tenemos presencia directa en Juzgados de Letras, Tribunales de Sentencia, Cortes de Apelaciones, Sala de lo Penal de la Corte Suprema de Justicia y Juzgados de Ejecución Penal. Coordinamos con el Ministerio Público, Policía Nacional, IHSS, DINAF y otras instituciones para una defensa coherente. Si necesita un abogado que conozca el proceso penal hondureño de principio a fin, le entregamos una estrategia escrita con plazos y honorarios.',
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
        'Interponemos recursos y acciones constitucionales para revertir resoluciones judiciales contrarias a derecho en procesos penales hondureños. Actuamos en reposición ante el mismo juez que dictó la resolución, en apelación ante la Corte de Apelaciones Penal, en casación y revisión ante la Sala de lo Penal de la Corte Suprema de Justicia, y en queja ante la CSJ cuando se deniega un recurso. Solicitamos nulidad de actuaciones por violación de garantías procesales, excepciones en el proceso penal (falta de competencia, prescripción, cosa juzgada, amnistía), habeas corpus por detención ilegal, prisión preventiva desproporcionada, tortura o condiciones indignas de reclusión, habeas data penal para acceder a antecedentes y datos personales, acción de inconstitucionalidad contra leyes contrarias a la Constitución y amparo constitucional por violación de derechos fundamentales. Cuando se agotan los recursos internos, redactamos quejas ante la Comisión Interamericana de Derechos Humanos y llevamos el caso ante la Corte IDH. Si recibió una resolución desfavorable en cualquier instancia, analizamos la viabilidad del recurso y los plazos perentorios antes de que precluya su derecho.',
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
        'Asesoría preventiva y construcción de estrategia procesal desde las primeras horas del caso penal. Realizamos auditoría de riesgo penal corporativo, mapas de riesgos por actividad, políticas de compliance penal, códigos de ética, canales de denuncias e investigaciones internas con cadena de custodia, en línea con estándares OEA, ONU y ONUDD. En el litigio, identificamos pruebas favorables, analizamos la viabilidad probatoria, contratamos peritajes privados y contrainformes periciales, coordinamos con investigadores privados legalmente habilitados y preparamos estrategia de negociación con el Ministerio Público para alcanzar acuerdos, conformidad o criterios de oportunidad. Asumimos la defensa corporativa de personas jurídicas y administradores, llevamos la asistencia a declaración del imputado, la defensa en flagrancia durante las primeras horas críticas y la querella o acusación particular en nombre de la víctima. Antes de imputar o de declarar, una buena estrategia evita condenas y reduce penas: consúltenos con un plan de defensa documentado y un presupuesto por escrito.',
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
        'Acompañamos a personas privadas de libertad y a sus familias durante toda la etapa de cumplimiento de la pena ante el Instituto Nacional Penitenciario (INP) y los Juzgados de Ejecución Penal. Solicitamos y tramitamos libertad condicional, redención de pena por trabajo y estudio, período de seguridad, permisos de salida, visita íntima, indulto y conmutación ante el Congreso Nacional o el Presidente de la República, suspensión de la ejecución de la pena y reclusión en domicilio con monitoreo electrónico cuando proceda. Gestionamos traslados de centro penal por acercamiento familiar, salud o seguridad, beneficios humanitarios para personas con enfermedad terminal o discapacidad grave, revisión de cómputo de pena, excarcelación inmediata por cumplimiento, amnistía o revisión, y defensa ante sanciones disciplinarias mediante recurso de alzada y contencioso-administrativo. Interponemos habeas corpus por detención ilegal, tortura o condiciones indignas en prisión y coordinamos con pastoral penitenciaria y organizaciones de derechos humanos. Si un familiar suyo está privado de libertad, consúltenos: le informamos los requisitos exactos y los plazos para cada beneficio.',
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
      areasRelacionadas: ['proceso-penal-completo', 'asesoria-preventiva'],
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
    'Atención jurídica especializada para la comunidad hondureña residente en España y para españoles con intereses en Honduras. Coordinamos con notarías, registros civiles, consulados, la Secretaría de Relaciones Exteriores de Honduras y autoridades españolas para validar y ejecutar actos jurídicos con pleno efecto en ambos países. Cubrimos gestión documental y legalización (apostilla, traducción jurada, partidas, antecedentes), actos notariales internacionales (poderes para pleitos, ventas y sucesiones, testamentos mancomunados, compraventas de inmuebles en Honduras desde España) y asuntos civiles y familiares transfronterizos (divorcio internacional, custodia, sustracción parental, alimentos bajo el Convenio de La Haya 2007, sucesiones internacionales, nacionalidad española, reagrupación familiar y arraigo). Si reside en España y su asunto legal está en Honduras, le entregamos un plan de trabajo con plazos, costos y los documentos que necesita aportar.',
  heroEyebrow: 'Asistencia transnacional',
  heroTitle: 'Hondureños en España: asistencia legal integral',
  heroSubtitle:
    'Resolvemos sus trámites legales entre Honduras y España con pleno efecto jurídico en ambos países. Gestión documental, apostilla de La Haya, traducción jurada, poderes notariales, divorcios internacionales, custodia, alimentos, sucesiones, nacionalidad española, reagrupación familiar y actos notariales coordinados con consulado y notarías en Honduras.',
  faqs: [
    { pregunta: '¿Pueden hacer poderes notariales en Honduras desde España?', respuesta: 'Sí. Coordinamos con notarios en Honduras para que usted firme en el Consulado o por poder especial, con apostilla y traducción cuando corresponda.' },
    { pregunta: '¿Cuánto tarda una legalización?', respuesta: 'La apostilla de La Haya en Honduras se obtiene en 1-3 días hábiles. Las traducciones juradas en España, según disponibilidad del traductor.' },
    { pregunta: '¿Pueden representarme en un juicio en Honduras si estoy en España?', respuesta: 'Sí, mediante poder especial para pleitos, otorgado ante notario español y traducido/apostillado, o firmado ante el Consulado.' },
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
        'Tramitamos integralmente la documentación que los hondureños en España y los españoles con intereses en Honduras necesitan con validez jurídica en ambos países. Gestionamos la apostilla de La Haya ante la Secretaría de Relaciones Exteriores de Honduras, legalización consular para países no firmantes del Convenio, traducción jurada español-hondureño válida para juicios y registros, partidas de nacimiento, matrimonio y defunción, antecedentes penales y su cancelación en España, certificados de nacimiento actualizados para procedimientos migratorios, certificación de la Dirección General del RNP, renovación de DNI y pasaporte hondureño en el Consulado, carta de soltería, fe de vida para pensiones, permisos de residencia y NIE, renovación del pasaporte español para hijos nacidos en Honduras, apostilla de documentos académicos y equivalencia de estudios, certificados de vida laboral, paquetes de apostilla múltiple para expedientes, coordinación con notarías para protocolización de actos en España, gestión integral de escrituras notariales (compraventa, herencia, matrimonio, poderes), documentos de identidad para recién nacidos y asesoría en doble nacionalidad por nacimiento, matrimonio o carta de naturaleza.',
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
        'Coordinamos con notarías en Honduras y España el otorgamiento de actos notariales con eficacia transnacional, de modo que tengan pleno efecto jurídico en ambos países. Otorgamos poderes generales para pleitos, poderes especiales para actos específicos (venta, herencia, divorcio), poderes para administración de bienes inmuebles en Honduras desde España, para representación tributaria ante el SAR, para trámites bancarios en Honduras, para sucesión y aceptación de herencia, revocación y sustitución de poderes, y asesoría para la redacción de testamentos ológrafos en España válidos en Honduras, testamentos mancomunados, protocolización de testamentos otorgados en el extranjero ante el RNP, capitulaciones matrimoniales, actas de manifestaciones, actas de protocolización de documentos privados, compraventas e hipotecas sobre inmuebles en Honduras desde España, donaciones entre padres e hijos con planificación patrimonial, renuncias de derechos hereditarios, disolución de comunidad de bienes y asesoría sobre ley aplicable conforme al Convenio de derecho internacional privado Honduras-España. Si vive en España y necesita resolver un asunto patrimonial en Honduras, podemos hacerlo por poder sin que tenga que viajar.',
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
        'Asistencia legal en derecho de familia internacional entre Honduras y España. Tramitamos divorcios internacionales (mutuo acuerdo o contencioso) eligiendo la jurisdicción más favorable, reconocimiento (exequátur) de sentencias de divorcio españolas en Honduras ante la CSJ y de sentencias hondureñas en España ante la Audiencia Provincial. Llevamos custodia internacional de menores, sustracción parental, restitución de menores ilícitamente trasladados (Convenio de La Haya 1980), regímenes de visita transfronterizos, pensión de alimentos internacional (Convenio de La Haya 2007) y ejecución forzosa cuando el obligado reside en el otro país. Atendemos sucesiones internacionales (ley aplicable y jurisdicción competente), reconocimiento de testamentos otorgados en España, adopción internacional (Convenio de La Haya 1993), matrimonio civil de residentes en España, capitulaciones con bienes en dos países, mediación familiar internacional, reagrupación familiar en España, arraigo social, laboral y familiar, renovación y modificación de autorizaciones de residencia, nacionalidad española por residencia (1, 2 o 10 años), por carta de naturaleza, para hijos de españoles nacidos en Honduras (Ley de Memoria Democrática), doble nacionalidad Honduras-España, inscripción de matrimonio celebrado en Honduras en el Registro Civil español e inscripción de nacimiento en el Consulado. Si vive en España y su asunto legal está en Honduras, le acompañamos con un equipo que conoce ambos ordenamientos.',
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

export function getRelatedAreas(slug: string): AreaStandalone[] {
  const all = [
    ...areasGenerales,
    ...hubPenal.grupos,
    ...hubMigrantes.subareas,
  ];
  const direct = all.find((a) => a.slug === slug)?.areasRelacionadas ?? [];
  return direct
    .map((s) => areasGenerales.find((a) => a.slug === s))
    .filter((a): a is AreaStandalone => Boolean(a));
}

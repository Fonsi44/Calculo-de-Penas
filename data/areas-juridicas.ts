/**
 * Taxonomía de áreas jurídicas del bufete.
 *
 * Estructura:
 *   - 1 hub de servicios jurídicos generales (13 áreas)
 *   - 1 hub de derecho penal con 7 grupos especializados
 *   - 1 hub de migrantes hondureños en España con 3 subáreas
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
 * Este archivo NO se importa desde middleware ni desde el cliente
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
  slug: 'migrantes-hondurenos-en-espana';
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
    resumen: 'Divorcio, custodia, alimentos, sucesiones y protección de menores en Honduras.',
    descripcion:
      'Asesoramiento y litigio en asuntos de familia ante Juzgados de Familia y Tribunales de Sentencia en Honduras. Mediación previa, procesos contenciosos y cumplimiento efectivo de resoluciones.',
    icono: 'users',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho de Familia en Honduras',
    heroSubtitle:
      'Acompañamiento legal en momentos sensibles: divorcios, custodia, alimentos y sucesiones con un equipo que prioriza el interés superior del menor y la solución pactada.',
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
    resumen: 'Despidos, prestaciones, riesgos profesionales, contratos y conflictos laborales en Honduras.',
    descripcion:
      'Defensa de trabajadores y asesoría a empresas en el marco del Código de Trabajo y los convenios de la OIT ratificados por Honduras. Actuación ante Juzgados del Trabajo y Tribunales de Conciliación.',
    icono: 'briefcase',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Laboral en Honduras',
    heroSubtitle:
      'Defendemos sus derechos como trabajador o acompañamos a su empresa con cumplimiento normativo. Actuación en despidos, prestaciones, riesgos profesionales y negociación colectiva.',
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
    resumen: 'Contratos, obligaciones, propiedad, sucesiones y actos notariales en Honduras.',
    descripcion:
      'Redacción, revisión y litigio en actos civiles y notariales. Contratos de compraventa, arrendamiento, hipoteca, permuta, donación, mandato, gestión de negocios y sucesiones.',
    icono: 'file-text',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Civil y Notarial',
    heroSubtitle:
      'Contratos sólidos, actos notariales seguros y litigio civil estratégico. Acompañamiento desde la negociación hasta la protocolización y, si es necesario, la defensa judicial.',
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
    resumen: 'Constitución de sociedades, contratos comerciales, propiedad intelectual y litigio mercantil.',
    descripcion:
      'Acompañamiento integral a empresas nacionales y extranjeras: constitución, gobierno corporativo, contratos comerciales, fusiones, adquisiciones, defensa judicial y arbitraje.',
    icono: 'building-2',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Mercantil y Empresarial',
    heroSubtitle:
      'Constituya, haga crecer y defienda su empresa con seguridad jurídica. Atención personalizada a emprendedores, PYMEs, sociedades anónimas y corporativos en Honduras.',
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
    resumen: 'Defensa ante bancos, regulación financiera CNBS, contratos crediticios y cobranzas.',
    descripcion:
      'Asesoría y defensa legal en el sector financiero regulado por la Comisión Nacional de Bancos y Seguros (CNBS). Defensa de usuarios financieros y acompañamiento a entidades.',
    icono: 'banknote',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Bancario y Financiero',
    heroSubtitle:
      'Defensa frente a bancos, financieras y cooperativas. Revisión de contratos crediticios, reestructuras, ejecución de garantías y asesoría preventiva.',
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
    resumen: 'Sanciones, recurso de revisión, contratos públicos, responsabilidad del Estado y servicio civil.',
    descripcion:
      'Defensa frente a actos administrativos, sanciones regulatorias y procedimientos disciplinarios. Litigio ante el Contencioso Administrativo y Juzgados de Letras de lo Contencioso.',
    icono: 'landmark',
    color: 'muted',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Administrativo y Servicio Civil',
    heroSubtitle:
      'Defensa frente a la Administración Pública: sanciones, despidos de servidores, contratos administrativos, licitaciones y responsabilidad del Estado.',
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
    resumen: 'Importación, exportación, regímenes aduaneros, valoración y defensa ante SAR.',
    descripcion:
      'Asesoría integral en operaciones de comercio exterior: clasificación arancelaria, valoración, regímenes suspensivos, zonas libres, devolución de impuestos y litigio aduanero.',
    icono: 'ship',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Aduanero y Comercio Exterior',
    heroSubtitle:
      'Importación, exportación, regímenes especiales y defensa ante la Administración Aduanera. Operativa ágil con cumplimiento normativo.',
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
    resumen: 'ARSA, registro sanitario, alimentos, medicamentos, cosméticos, dispositivos médicos y derecho sanitario.',
    descripcion:
      'Acompañamiento legal integral en el sector regulado por la Agencia de Regulación Sanitaria (ARSA). Registro sanitario, buenas prácticas, fiscalización, sanciones y litigio.',
    icono: 'heart-pulse',
    color: 'success',
    heroEyebrow: 'Área legal',
    heroTitle: 'Regulación Sanitaria',
    heroSubtitle:
      'Cumplimiento normativo en alimentos, medicamentos, cosméticos, dispositivos médicos y establecimientos de salud. Defensa ante ARSA y litigio contencioso-administrativo.',
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
    resumen: 'Visas, residencia, naturalización, permisos de trabajo y defensa ante el INM.',
    descripcion:
      'Asesoría y trámite ante el Instituto Nacional de Migración (INM) y la Cancillería. Visas de turista, trabajo, residencia, inversionista, rentista, pensionado y naturalización.',
    icono: 'globe',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Extranjería en Honduras',
    heroSubtitle:
      'Acompañamiento integral al extranjero que vive, trabaja, invierte o se casa con un hondureño. Visas, residencia, naturalización y defensa ante el INM.',
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
    areasRelacionadas: ['migrantes-hondurenos-en-espana', 'derecho-de-familia'],
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
    resumen: 'Registro de marcas, patentes, derechos de autor y defensa frente a infracciones.',
    descripcion:
      'Protección y defensa de los activos intangibles de su empresa o creación personal. Marcas, patentes, modelos de utilidad, diseños, derechos de autor y secretos empresariales.',
    icono: 'lightbulb',
    color: 'accent',
    heroEyebrow: 'Área legal',
    heroTitle: 'Propiedad Intelectual',
    heroSubtitle:
      'Registre, defienda y monetice sus marcas, patentes, obras y secretos empresariales. Asesoría integral en Honduras y coordinación internacional.',
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
    resumen: 'Asesoría fiscal, defensa ante el SAR, fiscalización, devoluciones y planificación tributaria.',
    descripcion:
      'Acompañamiento tributario para personas naturales y jurídicas. Cumplimiento, fiscalización, recursos, planificación, precios de transferencia y régimen simplificado.',
    icono: 'receipt',
    color: 'warning',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Tributario y Fiscal',
    heroSubtitle:
      'Defensa y planificación tributaria estratégica frente al Servicio de Administración de Rentas (SAR). Personas naturales, empresas y regímenes especiales.',
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
    resumen: 'Licencia ambiental, evaluación de impacto, sanciones MiAmbiente y litigio ambiental.',
    descripcion:
      'Acompañamiento en el cumplimiento de la Ley General del Ambiente y normativas de MiAmbiente, SERNA y alcaldías. Licencias, estudios de impacto, sanciones y defensa.',
    icono: 'leaf',
    color: 'success',
    heroEyebrow: 'Área legal',
    heroTitle: 'Derecho Ambiental y Regulatorio',
    heroSubtitle:
      'Cumplimiento ambiental preventivo y defensa frente a MiAmbiente. Licencias, evaluaciones de impacto, auditorías y litigio ambiental estratégico.',
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
    resumen: 'Métodos alternos de solución de conflictos en Honduras, nacionales e internacionales.',
    descripcion:
      'Resolución de disputas por vías más rápidas y especializadas que la justicia ordinaria. Conciliación, mediación y arbitraje nacional e internacional.',
    icono: 'scale',
    color: 'primary',
    heroEyebrow: 'Área legal',
    heroTitle: 'Conciliación y Arbitraje',
    heroSubtitle:
      'Resuelva sus disputas de forma rápida, confidencial y especializada. Conciliación, mediación y arbitraje nacional e internacional, institucional o ad hoc.',
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
  resumen: 'Defensa penal estratégica en Honduras, desde la primera actuación procesal hasta la ejecución.',
  descripcion:
    'Defensa técnica en todas las etapas del proceso penal hondureño, con presencia activa en Tegucigalpa, San Pedro Sula, Comayagua, Choluteca y Nacaome. Conocimiento profundo del Código Penal (Decreto 130-2017), la jurisprudencia de la CSJ y la práctica forense en Juzgados de Letras, Tribunales de Sentencia y Corte Suprema.',
  heroEyebrow: 'Área principal',
  heroTitle: 'Defensa penal seria, técnica y confidencial',
  heroSubtitle:
    'Atendemos casos penales en toda Honduras. Trabajamos desde la primera actuación procesal (asistencia a detenidos, audiencias iniciales, revisión de medidas cautelares) hasta la ejecución penal y los beneficios de ley.',
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
      resumen: 'Defensa técnica en casos penales en todas las etapas del proceso.',
      descripcion:
        'Atendemos casos penales activos: imputaciones, acusaciones, acusaciones alternativas, recursos y defensa en juicio oral. Experiencia en delitos contra la vida, patrimonio, libertad sexual, drogas, económicos y de tránsito.',
      icono: 'gavel',
      color: 'danger',
      subservicios: [
        { titulo: 'Defensa en audiencia de declaración del imputado', descripcion: 'Primeras diligencias y aplicación del principio de no autoincriminación.' },
        { titulo: 'Homicidio simple y calificado', descripcion: 'Art. 117-122 CP.' },
        { titulo: 'Lesiones graves y gravísimas', descripcion: 'Art. 123-125 CP.' },
        { titulo: 'Robo simple y agravado', descripcion: 'Art. 217-228 CP.' },
        { titulo: 'Hurto, abigeato y extorsión', descripcion: 'Defensa en todas sus modalidades.' },
        { titulo: 'Estafa, apropiación indebida y defraudación', descripcion: 'Delitos patrimoniales complejos.' },
        { titulo: 'Tráfico de drogas y narcomenudeo', descripcion: 'Ley de Uso Ilícito de Estupefacientes.' },
        { titulo: 'Delitos sexuales', descripcion: 'Violación, agresión, abuso y corrupción de menores.' },
        { titulo: 'Violencia doméstica e intrafamiliar', descripcion: 'Defensa y solicitud de medidas.' },
        { titulo: 'Amenazas, coacción y lesiones', descripcion: 'Criterios de oportunidad y mediación.' },
        { titulo: 'Conducción temeraria y accidente con lesionados o muerte', descripcion: 'Defensa penal y civil.' },
        { titulo: 'Portación ilegal de armas', descripcion: 'Permisos, tenencia y portación.' },
        { titulo: 'Lavado de activos y enriquecimiento ilícito', descripcion: 'Defensa técnica especializada.' },
        { titulo: 'Delitos fiscales y aduaneros', descripcion: 'Defraudación tributaria y contrabando.' },
        { titulo: 'Delitos electorales', descripcion: 'Defensa en causas del TJE.' },
        { titulo: 'Delitos informáticos y cibernéticos', descripcion: 'Estafas electrónicas, acceso indebido y grooming.' },
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
      resumen: 'Solución temprana de conflictos, mediación penal y recurso de multas administrativas.',
      descripcion:
        'Estrategia orientada a extinguir la acción penal por la vía del acuerdo restaurativo, la mediación o los criterios de oportunidad, cuando proceda. También recurrimos sanciones administrativas y multas.',
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
      resumen: 'Defensa de adolescentes en conflicto con la ley y medidas de protección para menores.',
      descripcion:
        'Asistencia técnica especializada en el sistema de justicia juvenil, regido por el Código de la Niñez y la Adolescencia. Defensa, seguimiento y representación ante Jueces de Niñez.',
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
      resumen: 'Acompañamiento legal integral en todas las fases del proceso penal hondureño.',
      descripcion:
        'Defensa técnica desde la etapa preparatoria (investigación fiscal) hasta el juicio oral, recursos y ejecución. Conocimiento profundo de los Juzgados de Letras, Tribunales de Sentencia y Cortes de Apelaciones.',
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
      resumen: 'Apelación, casación, revisión y amparo en procesos penales.',
      descripcion:
        'Recursos contra resoluciones judiciales en todas las instancias. Apelación ante Cortes de Apelaciones, casación y revisión ante la Sala de lo Penal de la Corte Suprema de Justicia.',
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
      resumen: 'Asesoría preventiva, peritajes, pruebas, testigos y estrategia integral de defensa.',
      descripcion:
        'Análisis de riesgo penal, construcción de estrategia de defensa desde el inicio, identificación de pruebas favorables, negociación con el Ministerio Público y control de prueba pericial.',
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
      resumen: 'Libertad condicional, redención de pena, traslado, indulto y derechos del condenado.',
      descripcion:
        'Acompañamiento durante la etapa de cumplimiento de la pena. Solicitud de beneficios penitenciarios, defensa ante el Instituto Nacional Penitenciario y los Juzgados de Ejecución Penal.',
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
  slug: 'migrantes-hondurenos-en-espana',
  titulo: 'Migrantes Hondureños en España',
  resumen: 'Gestión documental, actos notariales internacionales y asuntos civiles y familiares desde España.',
  descripcion:
    'Atención jurídica especializada para la comunidad hondureña residente en España. Coordinamos con notarías, registros civiles, consulados y autoridades españolas para validar y ejecutar actos jurídicos con pleno efecto en Honduras y Europa.',
  heroEyebrow: 'Asistencia transnacional',
  heroTitle: 'Migrantes hondureños en España: asistencia legal integral',
  heroSubtitle:
    'Resolvemos sus trámites legales entre Honduras y España. Documentación, notariado, familia, sucesiones y reconocimientos con pleno efecto jurídico en ambos países.',
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
    'migrantes hondureños en España',
    'abogado Honduras España',
    'legalización de documentos Honduras',
    'apostilla Honduras España',
    'poder notarial desde España',
  ],
  subareas: [
    {
      slug: 'gestion-documental-y-legalizacion',
      titulo: 'Gestión documental y legalización',
      resumen: 'Apostilla, traducción, registro civil, partidas y documentación para efectos en Honduras y Europa.',
      descripcion:
        'Tramitación integral de documentos entre Honduras y España. Apostilla de La Haya, traducción jurada, registro civil, partidas literales, antecedentes penales, poderes y certificaciones consulares.',
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
      resumen: 'Poderes, testamentos, compraventas y protocolización con efecto en Honduras y España.',
      descripcion:
        'Coordinación con notarías en Honduras y España para otorgamiento de actos notariales con eficacia transnacional. Poderes especiales, poderes para pleitos, declaraciones, capitulaciones y protocolización de actos.',
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
      resumen: 'Divorcios, alimentos, custodia, sucesiones y reconocimiento de sentencias entre Honduras y España.',
      descripcion:
        'Asistencia legal en derecho de familia internacional: divorcios, custodia de hijos, alimentos, sucesiones y reconocimiento de sentencias extranjeras. Aplicación del Convenio de La Haya cuando corresponde.',
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

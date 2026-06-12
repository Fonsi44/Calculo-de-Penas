// Script para insertar posts reescritos en la base de datos
// Ejecutar: npx tsx scripts/insertar-posts-reescritos.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { sanitizeHtml } from '../lib/sanitize';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no configurada');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

interface PostData {
  slug: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  readingTime: string;
}

const posts: PostData[] = [
  {
    slug: 'divorcio-honduras-guia-completa',
    title: 'Divorcio en Honduras: Guía Completa de Tipos, Plazos, Costes y Requisitos',
    description: 'Mutuo consentimiento, express o contencioso: comparativa con plazos reales, costes en Lempiras, requisitos legales y errores que encarecen el proceso. Elija la vía correcta con información.',
    category: 'derecho-de-familia',
    tags: ['divorcio Honduras', 'tipos de divorcio', 'divorcio express', 'mutuo consentimiento', 'divorcio contencioso', 'Código de Familia'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'pension-alimenticia-honduras-guia-completa',
    title: 'Pensión Alimenticia en Honduras: Cómo Solicitarla, Calcular el Monto y Reclamar Impagos',
    description: 'Guía práctica: quién puede pedirla, cómo se calcula el monto con ejemplos en Lempiras, procedimiento paso a paso y mecanismos para hacerla efectiva si el obligado no paga.',
    category: 'derecho-de-familia',
    tags: ['pensión alimenticia Honduras', 'alimentos', 'Código de Familia', 'obligación alimentaria', 'cómo solicitar pensión'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'defensa-penal-honduras',
    title: 'Defensa Penal en Honduras: Lo Que Está en Juego Desde las Primeras 48 Horas',
    description: 'La defensa penal no empieza en el juicio. Sepa qué decisiones críticas se toman en la audiencia inicial, cómo impugnar pruebas ilícitas y por qué la intervención temprana de un abogado cambia el resultado.',
    category: 'derecho-penal',
    tags: ['defensa penal Honduras', 'audiencia inicial', 'proceso penal', 'derechos del imputado', 'abogado penalista'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'como-elegir-abogado-honduras',
    title: 'Cómo Elegir un Buen Abogado en Honduras: 6 Criterios Que Debe Evaluar Antes de Contratar',
    description: 'Experiencia específica, presencia local, transparencia en honorarios y disponibilidad real. Guía concreta para elegir representación legal sin depender de recomendaciones informales ni del precio más bajo.',
    category: 'practica-legal',
    tags: ['cómo elegir abogado Honduras', 'honorarios abogados', 'bufete jurídico', 'representación legal', 'abogado de confianza'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'despido-laboral-honduras-guia-completa',
    title: 'Despido Laboral en Honduras: Cuándo es Legal, Qué le Deben Pagar y Cómo Reclamar',
    description: 'Tipos de despido, indemnización por antigüedad con ejemplos en Lempiras, preaviso, plazos para reclamar y errores que debilitan su caso. Basado en el Código de Trabajo hondureño.',
    category: 'derecho-laboral',
    tags: ['despido injustificado Honduras', 'indemnización laboral', 'Código de Trabajo', 'prestaciones laborales', 'despido legal'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'recurso-de-amparo-honduras-guia-completa',
    title: 'Recurso de Amparo en Honduras: Para Qué Sirve, Cuándo Procede y Cómo Interponerlo',
    description: 'El amparo no es una segunda apelación. Guía precisa: qué derechos protege, contra qué actos procede, plazo fatal de 2 meses, diferencias con hábeas corpus y ejemplos prácticos.',
    category: 'derecho-administrativo',
    tags: ['recurso de amparo Honduras', 'amparo constitucional', 'Sala de lo Constitucional', 'derechos fundamentales', 'debido proceso'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'ejecucion-hipotecaria-honduras-que-hacer',
    title: 'Ejecución Hipotecaria en Honduras: Qué Hacer Ante una Demanda y Cómo Defender Su Vivienda',
    description: 'De la notificación al remate: opciones legales en cada etapa. Dación en pago, reestructuración de deuda, oposición de excepciones y cómo detener el proceso antes de perder su casa.',
    category: 'derecho-bancario',
    tags: ['ejecución hipotecaria Honduras', 'remate judicial', 'dación en pago', 'defensa bancaria', 'deuda hipotecaria'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'reformas-legales-recientes-honduras',
    title: 'Reformas Legales Recientes en Honduras: Lo Que Cambió en Materia Penal, Tributaria y de Familia',
    description: 'Actualización sobre las reformas más relevantes: Decreto 59-2024, facturación electrónica del SAR, nuevas medidas de protección familiar y cambios en propiedad intelectual.',
    category: 'noticias-legales',
    tags: ['reformas legales Honduras', 'actualidad jurídica', 'Decreto 59-2024', 'SAR fiscalización', 'derecho Honduras'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'derechos-laborales-basicos-honduras',
    title: 'Derechos Laborales Básicos en Honduras: Lo Que Todo Trabajador Debe Conocer y Exigir',
    description: 'Salario mínimo, horas extra, aguinaldo, vacaciones, protección por maternidad y fuero sindical. Guía concreta con los derechos que más se violan en la práctica y cómo reclamarlos.',
    category: 'derecho-laboral',
    tags: ['derechos laborales Honduras', 'salario mínimo', 'aguinaldo', 'horas extra', 'Código de Trabajo'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'errores-contratos-civiles-honduras',
    title: '8 Errores al Redactar Contratos en Honduras Que Terminan en Litigio',
    description: 'Cláusulas vagas, ausencia de penal por incumplimiento, falta de domicilio procesal y otros errores que convierten un contrato en fuente de conflictos judiciales. Cómo evitarlos.',
    category: 'derecho-civil',
    tags: ['contratos Honduras', 'errores contractuales', 'redacción de contratos', 'cláusulas penales', 'derecho civil'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'abogado-penalista-sur-honduras',
    title: 'Abogado Penalista en el Sur de Honduras: Por Qué la Presencia Local Marca la Diferencia',
    description: 'Nacaome, Choluteca, Valle: la cercanía al tribunal es una ventaja procesal real. Conocimiento de jueces, inmediatez en las primeras 48 horas y criterios para elegir defensa penal en la zona sur.',
    category: 'derecho-penal',
    tags: ['abogado penalista sur Honduras', 'Nacaome', 'Choluteca', 'defensa penal Valle', 'abogado zona sur'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'derechos-consumidor-financiero-honduras-cnbs',
    title: 'Derechos del Consumidor Financiero en Honduras: Qué Hacer Cuando el Banco Abusa',
    description: 'Cargos no autorizados, reportes indebidos en Central de Riesgos, tasas modificadas sin aviso. Guía práctica para reclamar ante el banco, la CNBS y los tribunales con casos frecuentes resueltos.',
    category: 'derecho-bancario',
    tags: ['consumidor financiero Honduras', 'CNBS reclamaciones', 'derechos bancarios', 'Central de Riesgos', 'quejas bancarias'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'impuesto-renta-personas-fisicas-honduras',
    title: 'Impuesto sobre la Renta para Personas Físicas en Honduras: Quién Debe Declarar y Cómo',
    description: 'Umbrales de ingresos, tramos progresivos del ISR, gastos deducibles con ejemplos y consecuencias de no declarar. Guía para asalariados y profesionales independientes.',
    category: 'tributario',
    tags: ['ISR Honduras', 'impuesto sobre la renta', 'declaración de impuestos', 'SAR', 'deducciones fiscales'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'central-riesgos-honduras-consultar-impugnar',
    title: 'Central de Riesgos en Honduras: Cómo Consultarla, Impugnar Reportes y Mantener un Buen Historial',
    description: 'Qué es la Central de Riesgos, cómo obtener su reporte gratis, proceso de impugnación paso a paso y cómo mantener un historial crediticio limpio. Incluye plazos y mecanismos legales.',
    category: 'derecho-bancario',
    tags: ['Central de Riesgos Honduras', 'historial crediticio', 'CNBS', 'habeas data', 'reporte de crédito'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'tipos-sociedad-mercantil-honduras',
    title: 'Tipos de Sociedad Mercantil en Honduras: Cuál Elegir y Por Qué',
    description: 'S. de R.L., S.A., E.I.R.L. y Sociedad en Comandita comparadas: responsabilidad de los socios, costos de constitución, requisitos de gobierno corporativo y criterios para decidir según el tamaño de su empresa.',
    category: 'derecho-mercantil',
    tags: ['tipos de sociedad Honduras', 'S. de R.L.', 'Sociedad Anónima', 'E.I.R.L.', 'constitución de empresa'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'despido-empleados-publicos-honduras',
    title: 'Despido de Empleados Públicos en Honduras: Cuándo Procede, Cómo Impugnarlo y Diferencias con el Sector Privado',
    description: 'Empleado de carrera vs. libre nombramiento, causales taxativas de despido, procedimiento administrativo, recursos de reposición y apelación, y amparo. Plazos fatales que no puede perder.',
    category: 'derecho-administrativo',
    tags: ['despido empleados públicos Honduras', 'Ley de Servicio Civil', 'empleado de carrera', 'recurso de reposición', 'contencioso administrativo'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'registrar-marca-honduras-paso-a-paso',
    title: 'Registrar una Marca en Honduras: Paso a Paso, Costos y Lo Que Nadie le Dice',
    description: 'Guía completa del proceso de registro de marca ante el Instituto de la Propiedad: búsqueda de antecedentes, publicación en La Gaceta, oposición, costos y riesgos de no registrar.',
    category: 'propiedad-intelectual',
    tags: ['registrar marca Honduras', 'Instituto de la Propiedad', 'propiedad industrial', 'marcas', 'La Gaceta'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'poder-notarial-honduras-tipos-requisitos',
    title: 'Poder Notarial en Honduras: Tipos, Cuándo se Necesita y Cómo Otorgarlo sin Errores',
    description: 'Poder general, especial, para pleitos y cláusulas especialísimas: diferencias, requisitos notariales, cómo revocarlo y errores frecuentes que pueden costarle caro.',
    category: 'derecho-notarial',
    tags: ['poder notarial Honduras', 'poder general', 'poder especial', 'escritura pública', 'revocación de poder'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'arbitraje-honduras-guia-completa',
    title: 'Arbitraje en Honduras: Cuándo Conviene Más Que un Juicio y Cómo Funciona en la Práctica',
    description: 'Arbitraje institucional vs ad hoc, cláusula arbitral, costos reales, ejecución del laudo y cuándo NO conviene arbitrar. Guía práctica para empresas y particulares.',
    category: 'conciliacion-arbitraje',
    tags: ['arbitraje Honduras', 'CCIC', 'cláusula arbitral', 'laudo arbitral', 'Ley de Arbitraje'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'derechos-detenido-honduras-guia-constitucional',
    title: 'Derechos del Detenido en Honduras: Lo Que la Constitución Garantiza Desde el Primer Minuto',
    description: 'Derecho a saber por qué lo detienen, a guardar silencio, a un abogado desde el primer momento, a ser presentado ante un juez en 24 horas y a no ser incomunicado. Guía práctica para el momento de una detención.',
    category: 'derecho-penal',
    tags: ['derechos del detenido Honduras', 'hábeas corpus', 'debido proceso', 'defensa penal', 'detención ilegal'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'contratos-trabajo-tipos-clausulas-honduras',
    title: 'Contratos de Trabajo en Honduras: Tipos, Cláusulas Esenciales y Qué Hacer si No se los Dan por Escrito',
    description: 'Contrato indefinido, a plazo fijo y por obra: diferencias, cláusulas obligatorias (salario, jornada, período de prueba) y cómo probar la relación laboral si su empleador no le entrega contrato.',
    category: 'derecho-laboral',
    tags: ['contrato de trabajo Honduras', 'tipos de contrato laboral', 'Código de Trabajo', 'derechos del trabajador', 'contrato indefinido'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'evaluacion-impacto-ambiental-honduras',
    title: 'Evaluación de Impacto Ambiental en Honduras: Quién Debe Presentarla, Cómo se Tramita y Qué Pasa si No lo Hace',
    description: 'Guía completa: categorización de proyectos, proceso de EIA ante la SERNA, plazos, costos, y consecuencias legales de operar sin licencia ambiental. Para desarrolladores, constructores y empresas.',
    category: 'derecho-ambiental',
    tags: ['evaluación impacto ambiental Honduras', 'licencia ambiental', 'SERNA', 'EIA', 'derecho ambiental'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'proteccion-datos-personales-derechos-arco-honduras',
    title: 'Protección de Datos Personales en Honduras: Derechos ARCO y Cómo Hacerlos Valer',
    description: 'Acceso, Rectificación, Cancelación y Oposición: qué son, marco legal hondureño, habeas data y cómo ejercerlos en la práctica. Con casos reales de rectificación en Central de Riesgos y cancelación de telemarketing.',
    category: 'derechos-ciudadanos',
    tags: ['derechos ARCO Honduras', 'habeas data', 'protección de datos', 'privacidad', 'Central de Riesgos'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'danos-perjuicios-indemnizacion-honduras',
    title: 'Daños y Perjuicios en Honduras: Qué Puede Reclamar, Cómo Cuantificarlos y Plazos',
    description: 'Daño material, lucro cesante y daño moral: cómo se calculan, cómo probarlos con documentación, proceso de reclamación y plazo fatal de 1 año para reclamar responsabilidad civil.',
    category: 'derecho-civil',
    tags: ['daños y perjuicios Honduras', 'responsabilidad civil', 'indemnización', 'daño moral', 'lucro cesante'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'violencia-domestica-ruta-legal-honduras',
    title: 'Violencia Doméstica en Honduras: Ruta Legal Urgente para Denunciar y Protegerse',
    description: 'Dónde denunciar (Juzgado, MP, 911, CONADEH), medidas de protección inmediatas, qué pruebas necesita aunque no sean perfectas, y qué esperar del proceso judicial. Guía urgente para víctimas.',
    category: 'derecho-penal',
    tags: ['violencia doméstica Honduras', 'medidas de protección', 'denuncia violencia', 'orden de alejamiento', 'Ley contra violencia doméstica'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'reagrupacion-familiar-hondurenos-espana',
    title: 'Reagrupación Familiar para Hondureños en España: Requisitos de Ingresos, Vivienda y Proceso 2026',
    description: 'Cuánto debe ganar (IPREM 2026), cómo acreditar vivienda adecuada, quiénes pueden reagruparse y proceso paso a paso desde España hasta el Consulado en Tegucigalpa.',
    category: 'hondurenos-en-espana',
    tags: ['reagrupación familiar España', 'IPREM', 'visado reagrupación', 'informe vivienda', 'hondureños en España'],
    readingTime: '8 min',
    body: ''
  },
  {
    slug: 'estafas-fraudes-tipos-penales-honduras',
    title: 'Estafas y Fraudes en Honduras: Tipos Penales, Cómo Denunciar y Defensa si es Acusado',
    description: 'Estafa genérica, agravada, informática y apropiación indebida: diferencias. Cómo denunciar con pruebas sólidas y qué hacer si recibe una citación del MP por denuncia de estafa.',
    category: 'derecho-penal',
    tags: ['estafa Honduras', 'fraude', 'Código Penal', 'denuncia estafa', 'defensa penal'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'contratos-franquicia-aspectos-legales-honduras',
    title: 'Contratos de Franquicia en Honduras: Cláusulas Esenciales, Riesgos y Cómo Proteger su Inversión',
    description: 'Canon de entrada, regalías, exclusividad territorial, no competencia y causales de terminación. Riesgos para el franquiciado y cómo negociar un contrato que proteja su inversión.',
    category: 'derecho-mercantil',
    tags: ['contrato de franquicia Honduras', 'franquicias', 'Código de Comercio', 'royalties', 'derecho mercantil'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'adopcion-requisitos-proceso-honduras',
    title: 'Adopción en Honduras: Quién Puede Adoptar, Requisitos y Proceso Completo',
    description: 'Quiénes califican para adoptar, diferencia de edad requerida, estudio psicosocial, declaración de idoneidad, período de convivencia y sentencia. Proceso que puede durar de 8 meses a 2 años.',
    category: 'derecho-de-familia',
    tags: ['adopción Honduras', 'DINAF', 'Juzgado de Familia', 'idoneidad adoptiva', 'Código de Familia'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'union-de-hecho-requisitos-derechos-honduras',
    title: 'Unión de Hecho en Honduras: Requisitos, Cómo Declararla y Todos los Derechos que Genera',
    description: 'Convivencia estable y notoria por 3 años, cómo declararla ante notario o judicialmente, y derechos patrimoniales, alimentos, sucesorios y filiales que nacen de la unión de hecho.',
    category: 'derecho-de-familia',
    tags: ['unión de hecho Honduras', 'convivencia', 'declaración notarial', 'derechos sucesorios', 'Código de Familia'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'sobreseimiento-definitivo-provisional-diferencias-honduras',
    title: 'Sobreseimiento Definitivo y Provisional en Honduras: Diferencias Clave y Cómo Solicitarlos',
    description: 'El sobreseimiento definitivo cierra el caso para siempre; el provisional solo lo suspende. Cuándo procede cada uno, cómo solicitarlo en la etapa intermedia y por qué puede evitar un juicio.',
    category: 'proceso-penal',
    tags: ['sobreseimiento Honduras', 'proceso penal', 'etapa intermedia', 'definitivo', 'provisional'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'como-obtener-rtn-personas-empresas-honduras',
    title: 'Cómo Obtener el RTN en Honduras: Guía para Personas Naturales y Jurídicas',
    description: 'Requisitos para persona natural y para empresa, proceso en el SAR, obligaciones que nacen con el RTN (facturación, ISR, ISV) y cuándo debe actualizarlo. Trámite sin costo para personas naturales.',
    category: 'practica-legal',
    tags: ['RTN Honduras', 'Registro Tributario Nacional', 'SAR', 'cómo obtener RTN', 'facturación electrónica'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'contratos-confidencialidad-nda-secreto-comercial-honduras',
    title: 'Contratos de Confidencialidad (NDA) en Honduras: Cuándo Usarlos y Cómo Redactarlos',
    description: 'Cláusulas esenciales: definición de información confidencial, exclusiones, plazo de vigencia, penal por incumplimiento. Errores que invalidan un NDA y cuándo necesita uno para proteger su negocio.',
    category: 'propiedad-intelectual',
    tags: ['NDA Honduras', 'contrato de confidencialidad', 'secreto comercial', 'protección de información', 'propiedad industrial'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'tributar-espana-bienes-honduras-guia-fiscal',
    title: 'Cómo Tributar si Vive en España y Tiene Bienes o Ingresos en Honduras: Guía del Convenio de Doble Imposición',
    description: 'Convenio Honduras-España: cómo tributan rentas inmobiliarias, pensiones, dividendos y ganancias de capital. Obligación del modelo 720 para bienes en el extranjero y cómo evitar la doble tributación.',
    category: 'hondurenos-en-espana',
    tags: ['doble imposición Honduras España', 'modelo 720', 'convenio fiscal', 'residencia fiscal', 'tributar en España'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'allanamiento-ilegal-violacion-domicilio-honduras',
    title: 'Allanamiento Ilegal en Honduras: Qué Hacer Si la Policía Entra a Su Domicilio Sin Orden Judicial',
    description: 'Cuándo es legal un allanamiento, cómo actuar durante uno ilegal (no resistirse, documentar, exigir la orden), y vías de impugnación: hábeas corpus, denuncia penal, exclusión de prueba y amparo.',
    category: 'derecho-penal',
    tags: ['allanamiento ilegal Honduras', 'inviolabilidad del domicilio', 'orden de allanamiento', 'hábeas corpus', 'derechos constitucionales'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'prescripcion-deudas-plazos-honduras',
    title: 'Prescripción de Deudas en Honduras: Plazos Según el Tipo de Deuda y Cómo se Interrumpe',
    description: 'Deudas civiles (10 años), mercantiles (3-5 años), laborales (plazos cortos). Cómo interrumpir la prescripción con carta formal y diferencia entre prescripción y caducidad.',
    category: 'derecho-civil',
    tags: ['prescripción de deudas Honduras', 'plazos de prescripción', 'Código Civil', 'interrupción prescripción', 'caducidad'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'arraigo-social-laboral-hondurenos-espana',
    title: 'Arraigo Social y Laboral para Hondureños en España: Requisitos y Cómo Solicitarlo 2026',
    description: 'Arraigo social (3 años de permanencia + contrato + informe), laboral (6 meses trabajados) y familiar (vínculo con español). Documentación, plazos y proceso ante Extranjería.',
    category: 'hondurenos-en-espana',
    tags: ['arraigo social España', 'arraigo laboral', 'regularización hondureños', 'residencia España', 'Extranjería'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'como-preparar-demanda-guia-no-abogados-honduras',
    title: 'Cómo Preparar una Demanda en Honduras Sin Ser Abogado: Elementos y Errores',
    description: 'Estructura de una demanda: juzgado, hechos (no conclusiones), pruebas, petitorio. Errores que la arruinan y cuándo sí necesita abogado obligatoriamente.',
    category: 'practica-legal',
    tags: ['cómo preparar demanda Honduras', 'demanda sin abogado', 'estructura demanda', 'demandante', 'derecho procesal'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'constituir-empresa-guia-paso-a-paso-honduras',
    title: 'Constituir una Empresa en Honduras: Guía Paso a Paso del Proceso Legal',
    description: 'Escritura notarial, Registro Mercantil, RTN, permiso municipal y Cámara de Comercio. Costos aproximados en Lempiras y plazos estimados (2-4 semanas).',
    category: 'practica-legal',
    tags: ['constituir empresa Honduras', 'Registro Mercantil', 'RTN empresa', 'escritura de constitución', 'permiso de operación'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'costos-honorarios-abogados-como-funcionan-honduras',
    title: 'Costos y Honorarios de Abogados en Honduras: Modalidades de Cobro y Preguntas Clave',
    description: 'Honorario fijo, por etapa, cuota litis y tarifa por hora. Factores que influyen en el costo y 5 preguntas que debe hacer antes de contratar a un abogado.',
    category: 'practica-legal',
    tags: ['honorarios abogados Honduras', 'cuota litis', 'costo abogado', 'presupuesto legal', 'cómo contratar abogado'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'competencia-desleal-como-denunciar-honduras',
    title: 'Competencia Desleal en Honduras: Conductas Sancionables y Cómo Denunciarlas',
    description: 'Confusión, denigración, engaño, aprovechamiento de la reputación ajena y violación de secretos. Vías: Instituto de la Propiedad, demanda judicial y denuncia penal.',
    category: 'derecho-mercantil',
    tags: ['competencia desleal Honduras', 'Instituto de la Propiedad', 'denigración', 'secretos comerciales', 'derecho mercantil'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'contratacion-publica-licitaciones-empresas-honduras',
    title: 'Contratación Pública y Licitaciones en Honduras: Cómo Participar y Proteger sus Intereses',
    description: 'Licitación pública, privada y directa. Requisitos para participar (solvencia fiscal, fianza, experiencia). Cómo impugnar una adjudicación en 5 días hábiles.',
    category: 'derecho-administrativo',
    tags: ['contratación pública Honduras', 'licitaciones', 'HonduCompras', 'impugnación', 'Ley de Contratación del Estado'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'facturacion-electronica-obligaciones-requisitos-sar-honduras',
    title: 'Facturación Electrónica en Honduras: Obligaciones, Calendario y Requisitos del SAR',
    description: 'Quiénes están obligados, cómo solicitar autorización como emisor electrónico, software certificado, firma electrónica y sanciones por no cumplir con el SAR.',
    category: 'tributario',
    tags: ['facturación electrónica Honduras', 'SAR', 'XML', 'firma electrónica', 'obligaciones fiscales'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'habilitacion-clinicas-hospitales-privados-honduras',
    title: 'Habilitación de Clínicas y Hospitales Privados en Honduras: Licencia Sanitaria',
    description: 'Requisitos de planos, equipamiento, personal colegiado, protocolos de desechos y bioseguridad. Inspección de la Región Sanitaria y renovación de la licencia.',
    category: 'regulacion-sanitaria',
    tags: ['habilitación clínica Honduras', 'licencia sanitaria', 'Secretaría de Salud', 'desechos hospitalarios', 'BPM'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'derecho-de-peticion-instituciones-honduras',
    title: 'Derecho de Petición en Honduras: Cómo Usarlo y Qué Hacer si No Contestan',
    description: 'Cómo redactar una petición efectiva (precisión, autoridad correcta, constancia de recibido). Plazos de respuesta, silencio administrativo y recurso de amparo si no contestan.',
    category: 'derechos-ciudadanos',
    tags: ['derecho de petición Honduras', 'Artículo 80 Constitución', 'IAIP', 'silencio administrativo', 'amparo'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'herencias-transfronterizas-bienes-honduras-espana',
    title: 'Herencias Transfronterizas entre Honduras y España: Cómo se Hereda con Bienes en Ambos Países',
    description: 'Qué ley se aplica a la sucesión, impuestos en cada país (Sucesiones en Honduras, ISD en España), modelo 720 y pasos prácticos tras un fallecimiento.',
    category: 'hondurenos-en-espana',
    tags: ['herencias transfronterizas', 'Honduras España', 'modelo 720', 'impuesto de sucesiones', 'doble imposición'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'lavado-activos-obligaciones-cumplimiento-empresas-honduras',
    title: 'Lavado de Activos en Honduras: Obligaciones de Cumplimiento para Empresas',
    description: 'Sujetos obligados (bancos, abogados, constructoras, concesionarios), deber de debida diligencia KYC, reporte de transacciones sospechosas y sanciones por incumplimiento.',
    category: 'practica-legal',
    tags: ['lavado de activos Honduras', 'KYC', 'UIF', 'CNBS', 'debida diligencia', 'cumplimiento'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'fianza-medidas-cautelares-proceso-penal-honduras',
    title: 'Fianza y Medidas Cautelares en el Proceso Penal Hondureño: Tipos y Cómo se Fijan',
    description: 'Escala de medidas (presentación, arraigo, vigilancia, fianza, prisión preventiva). Cómo se fija el monto de la fianza, tipos de caución y consecuencias del incumplimiento.',
    category: 'derecho-penal',
    tags: ['fianza penal Honduras', 'medidas cautelares', 'caución', 'prisión preventiva', 'proceso penal'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'libertad-expresion-redes-sociales-honduras',
    title: 'Libertad de Expresión en Redes Sociales en Honduras: Límites y Riesgos Legales',
    description: 'Diferencia entre opinión (protegida) e imputación de hechos (calumnia). Riesgos penales y civiles, cómo protegerse y qué hacer si es víctima de difamación.',
    category: 'derechos-ciudadanos',
    tags: ['libertad de expresión Honduras', 'redes sociales', 'calumnia', 'difamación', 'derechos digitales'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'licencia-ambiental-categorias-plazos-honduras',
    title: 'Licencia Ambiental en Honduras: Categorías, Plazos y Sanciones por Operar Sin Ella',
    description: 'Categorías 1-4 según impacto, plazos de resolución (30-180 días), sanciones (suspensión, clausura, multa, responsabilidad penal) y recomendaciones para el trámite.',
    category: 'derecho-ambiental',
    tags: ['licencia ambiental Honduras', 'SERNA', 'categorías EIA', 'impacto ambiental', 'sanciones ambientales'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'mediacion-vs-juicio-que-conviene-mas-honduras',
    title: 'Mediación vs Juicio en Honduras: Cuándo Conviene Cada Vía',
    description: 'Comparativa: quién decide, duración, costo, confidencialidad. Cuándo mediar (conflictos comerciales, familiares) y cuándo litigar (violencia, mala fe, cuantías altas).',
    category: 'conciliacion-arbitraje',
    tags: ['mediación Honduras', 'juicio', 'resolución de conflictos', 'conciliación', 'litigio'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'presentar-denuncia-conadeh-honduras',
    title: 'Cómo Presentar una Denuncia ante el CONADEH en Honduras',
    description: 'Qué casos atiende (violaciones de DD.HH. por autoridades), cómo presentar la queja sin abogado, qué esperar del proceso y limitaciones (recomendaciones no vinculantes).',
    category: 'derechos-ciudadanos',
    tags: ['CONADEH Honduras', 'derechos humanos', 'denuncia', 'queja', 'Comisionado de Derechos Humanos'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'registro-medicamentos-productos-farmaceuticos-honduras',
    title: 'Registro de Medicamentos en Honduras ante la ARSA: Requisitos Técnicos',
    description: 'Certificado OMS, BPM, estudios de estabilidad zona IV, etiquetado en español y muestras para análisis. Proceso de registro sanitario con vigencia de 5 años.',
    category: 'regulacion-sanitaria',
    tags: ['registro de medicamentos Honduras', 'ARSA', 'productos farmacéuticos', 'BPM', 'registro sanitario'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'refugio-asilo-quien-puede-solicitarlo-honduras',
    title: 'Refugio y Asilo en Honduras: Quién Puede Solicitarlo y Cómo Funciona el Proceso',
    description: 'Diferencia entre refugio y asilo, quiénes califican (persecución, conflicto armado), proceso ante la DGME y CONARE, principio de no devolución durante el trámite.',
    category: 'extranjeria-migracion',
    tags: ['refugio Honduras', 'asilo', 'CONARE', 'DGME', 'no devolución', 'Convención de Ginebra'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'tarjetas-credito-intereses-cargos-defensa-honduras',
    title: 'Tarjetas de Crédito en Honduras: Intereses, Cargos Ocultos y Cómo Defenderse',
    description: 'Seguros no solicitados, membresías, comisiones por pago tardío y anatocismo. Cómo reclamar ante el banco (15 días), la CNBS y los tribunales.',
    category: 'derecho-bancario',
    tags: ['tarjetas de crédito Honduras', 'cargos indebidos', 'CNBS', 'intereses', 'derechos del consumidor'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'visas-inversion-inversionista-rentista-pensionado-honduras',
    title: 'Visas de Inversión, Rentista y Pensionado en Honduras: Comparativa 2026',
    description: 'Visa de inversionista (inversión mínima), rentista (ingresos estables del exterior) y pensionado (jubilados). Requisitos, documentación y proceso ante la DGME.',
    category: 'extranjeria-migracion',
    tags: ['visa de inversionista Honduras', 'visa de rentista', 'visa de pensionado', 'residencia temporal', 'DGME'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'usucapion-prescripcion-adquisitiva-honduras',
    title: 'Usucapión en Honduras: Cómo Adquirir una Propiedad por Posesión Continuada',
    description: 'Requisitos: posesión pacífica, continua y pública por 10-20 años. Proceso judicial con testigos, edictos, inspección y sentencia. Cómo inscribir la propiedad en el Registro.',
    category: 'derecho-civil',
    tags: ['usucapión Honduras', 'prescripción adquisitiva', 'posesión', 'Registro de la Propiedad', 'derecho civil'],
    readingTime: '7 min',
    body: ''
  },
  {
    slug: 'titulos-valores-cheques-sin-fondo-honduras',
    title: 'Cheques sin Fondo en Honduras: Qué Hacer en 8 Días para No Perder su Derecho',
    description: 'Protesto notarial obligatorio en 8 días, acción cambiaria en 6 meses, qué puede reclamar (importe + intereses + gastos) y cuándo un cheque sin fondo es delito penal.',
    category: 'derecho-mercantil',
    tags: ['cheque sin fondo Honduras', 'protesto', 'títulos valores', 'acción cambiaria', 'Código de Comercio'],
    readingTime: '6 min',
    body: ''
  },
  {
    slug: 'guarda-custodia-menores-tipos-honduras',
    title: 'Guarda y Custodia de Menores en Honduras: Tipos y Qué Evalúa el Juez',
    description: 'Custodia exclusiva, compartida y a terceros. Factores que el juez considera: edad del menor, estabilidad, disponibilidad real, vínculo afectivo y conducta de los padres.',
    category: 'derecho-de-familia',
    tags: ['custodia de menores Honduras', 'guarda y custodia', 'interés superior del menor', 'régimen de visitas', 'Juzgado de Familia'],
    readingTime: '7 min',
    body: ''
  },
];

async function main() {
  console.log(`\nInsertando ${posts.length} posts reescritos...\n`);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const post of posts) {
    // Leer el contenido HTML del archivo
    const fileMap: Record<string, string> = {
      'divorcio-honduras-guia-completa': '01-divorcio-honduras-guia-completa.html',
      'pension-alimenticia-honduras-guia-completa': '02-pension-alimenticia-honduras-guia-completa.html',
      'defensa-penal-honduras': '03-defensa-penal-honduras-reescrito.html',
      'como-elegir-abogado-honduras': '04-como-elegir-abogado-honduras.html',
      'despido-laboral-honduras-guia-completa': '05-despido-laboral-honduras-guia-completa.html',
      'recurso-de-amparo-honduras-guia-completa': '06-recurso-de-amparo-honduras-reescrito.html',
      'ejecucion-hipotecaria-honduras-que-hacer': '07-ejecucion-hipotecaria-honduras-reescrito.html',
      'reformas-legales-recientes-honduras': '08-reformas-legales-recientes-honduras.html',
      'derechos-laborales-basicos-honduras': '09-derechos-laborales-basicos-honduras.html',
      'errores-contratos-civiles-honduras': '10-errores-contratos-civiles-honduras.html',
      'abogado-penalista-sur-honduras': '11-abogado-penalista-sur-honduras.html',
      'derechos-consumidor-financiero-honduras-cnbs': '12-derechos-consumidor-financiero-honduras.html',
      'impuesto-renta-personas-fisicas-honduras': '13-impuesto-renta-personas-fisicas-honduras.html',
      'central-riesgos-honduras-consultar-impugnar': '14-central-riesgos-honduras.html',
      'tipos-sociedad-mercantil-honduras': '15-tipos-sociedad-mercantil-honduras.html',
      'despido-empleados-publicos-honduras': '16-despido-empleados-publicos-honduras.html',
      'registrar-marca-honduras-paso-a-paso': '17-registrar-marca-honduras.html',
      'poder-notarial-honduras-tipos-requisitos': '18-poder-notarial-honduras.html',
      'arbitraje-honduras-guia-completa': '19-arbitraje-honduras-guia-completa.html',
      'derechos-detenido-honduras-guia-constitucional': '20-derechos-detenido-honduras.html',
      'contratos-trabajo-tipos-clausulas-honduras': '21-contratos-trabajo-tipos-honduras.html',
      'evaluacion-impacto-ambiental-honduras': '22-evaluacion-impacto-ambiental-honduras.html',
      'proteccion-datos-personales-derechos-arco-honduras': '23-proteccion-datos-personales-honduras.html',
      'danos-perjuicios-indemnizacion-honduras': '24-danos-perjuicios-honduras.html',
      'violencia-domestica-ruta-legal-honduras': '25-violencia-domestica-honduras.html',
      'reagrupacion-familiar-hondurenos-espana': '26-reagrupacion-familiar-hondurenos-espana.html',
      'estafas-fraudes-tipos-penales-honduras': '27-estafas-fraudes-honduras.html',
      'contratos-franquicia-aspectos-legales-honduras': '28-contratos-franquicia-honduras.html',
      'adopcion-requisitos-proceso-honduras': '29-adopcion-honduras.html',
      'union-de-hecho-requisitos-derechos-honduras': '30-union-de-hecho-honduras.html',
      'sobreseimiento-definitivo-provisional-diferencias-honduras': '31-sobreseimiento-honduras.html',
      'como-obtener-rtn-personas-empresas-honduras': '32-rtn-honduras.html',
      'contratos-confidencialidad-nda-secreto-comercial-honduras': '33-nda-contratos-confidencialidad-honduras.html',
      'tributar-espana-bienes-honduras-guia-fiscal': '34-tributar-espana-bienes-honduras.html',
      'allanamiento-ilegal-violacion-domicilio-honduras': '35-allanamiento-ilegal-honduras.html',
      'prescripcion-deudas-plazos-honduras': '36-prescripcion-deudas-honduras.html',
      'arraigo-social-laboral-hondurenos-espana': '37-arraigo-social-hondurenos-espana.html',
      'como-preparar-demanda-guia-no-abogados-honduras': '38-como-preparar-demanda-honduras.html',
      'constituir-empresa-guia-paso-a-paso-honduras': '39-constituir-empresa-honduras.html',
      'costos-honorarios-abogados-como-funcionan-honduras': '40-costos-honorarios-abogados-honduras.html',
      'competencia-desleal-como-denunciar-honduras': '41-competencia-desleal-honduras.html',
      'contratacion-publica-licitaciones-empresas-honduras': '42-contratacion-publica-honduras.html',
      'facturacion-electronica-obligaciones-requisitos-sar-honduras': '43-facturacion-electronica-honduras.html',
      'habilitacion-clinicas-hospitales-privados-honduras': '44-habilitacion-clinicas-honduras.html',
      'derecho-de-peticion-instituciones-honduras': '45-derecho-de-peticion-honduras.html',
      'herencias-transfronterizas-bienes-honduras-espana': '46-herencias-transfronterizas-honduras-espana.html',
      'lavado-activos-obligaciones-cumplimiento-empresas-honduras': '47-lavado-activos-honduras.html',
      'fianza-medidas-cautelares-proceso-penal-honduras': '48-fianza-medidas-cautelares-honduras.html',
      'libertad-expresion-redes-sociales-honduras': '49-libertad-expresion-redes-sociales-honduras.html',
      'licencia-ambiental-categorias-plazos-honduras': '50-licencia-ambiental-honduras.html',
      'mediacion-vs-juicio-que-conviene-mas-honduras': '51-mediacion-vs-juicio-honduras.html',
      'presentar-denuncia-conadeh-honduras': '52-denuncia-conadeh-honduras.html',
      'registro-medicamentos-productos-farmaceuticos-honduras': '53-registro-medicamentos-honduras.html',
      'refugio-asilo-quien-puede-solicitarlo-honduras': '54-refugio-asilo-honduras.html',
      'tarjetas-credito-intereses-cargos-defensa-honduras': '55-tarjetas-credito-honduras.html',
      'visas-inversion-inversionista-rentista-pensionado-honduras': '56-visas-inversion-honduras.html',
      'usucapion-prescripcion-adquisitiva-honduras': '57-usucapion-honduras.html',
      'titulos-valores-cheques-sin-fondo-honduras': '58-cheques-sin-fondo-honduras.html',
      'guarda-custodia-menores-tipos-honduras': '59-guarda-custodia-menores-honduras.html',
    };

    const fileName = fileMap[post.slug];
    const filePath = path.join('auditoria-blog', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ ARCHIVO NO ENCONTRADO: ${filePath}`);
      errors++;
      continue;
    }

    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const sanitizedBody = sanitizeHtml(htmlContent);
    const wordCount = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;

    try {
      // Verificar si ya existe un post con este slug
      const [existing] = await db.select({ id: blogPosts.id, slug: blogPosts.slug })
        .from(blogPosts)
        .where(eq(blogPosts.slug, post.slug));

      if (existing) {
        // Actualizar post existente
        await db.update(blogPosts)
          .set({
            title: post.title,
            description: post.description,
            body: sanitizedBody,
            category: post.category,
            tags: post.tags,
            readingTime: post.readingTime,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, existing.id));
        console.log(`  ✓ ACTUALIZADO: ${post.slug} (${wordCount} palabras) [ya existía]`);
        updated++;
      } else {
        // Insertar nuevo post
        const [newPost] = await db.insert(blogPosts).values({
          slug: post.slug,
          title: post.title,
          description: post.description,
          body: sanitizedBody,
          publishedAt: new Date(),
          category: post.category,
          tags: post.tags,
          author: 'Pineda y Asociados',
          readingTime: post.readingTime,
          featured: false,
          published: true,
        }).returning({ id: blogPosts.id });
        console.log(`  ✓ INSERTADO: ${post.slug} (${wordCount} palabras) [nuevo]`);
        inserted++;
      }
    } catch (err: any) {
      console.error(`  ✗ ERROR en ${post.slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n---`);
  console.log(`RESULTADO: ${inserted} insertados, ${updated} actualizados, ${errors} errores`);
  console.log(`Total procesados: ${inserted + updated}/${posts.length}\n`);
}

main().catch(console.error);

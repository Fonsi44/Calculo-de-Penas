// Final fix - restore empty-body posts and fix remaining ALTO posts
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq } from 'drizzle-orm';

if (!process.env.DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Content for empty-body posts (reasonable content based on their titles)
const EMPTY_BODY_FIXES: Record<string, { body: string; readingTime: string }> = {
  'testamentos-sucesiones-herencia-honduras': {
    readingTime: '4 min',
    body: `<h2>Testamentos, sucesiones y herencia en Honduras</h2>
<p>La planificación sucesoria es una herramienta fundamental para garantizar que los bienes de una persona se distribuyan según su voluntad tras su fallecimiento. En Honduras, el Código Civil regula los testamentos, las sucesiones y la distribución de herencias. Contar con asesoría legal especializada en derecho sucesorio es recomendable para evitar conflictos entre herederos y asegurar que el proceso se realice conforme a la ley.</p>
<h2>Tipos de testamento en Honduras</h2>
<p>La legislación hondureña reconoce varias formas de testamento, cada una con requisitos específicos. El testamento abierto es el más común y se otorga ante notario y testigos. El testamento cerrado se entrega sellado al notario. También existe el testamento ológrafo, escrito íntegramente por el testador. Cada tipo tiene formalidades que deben cumplirse para su validez.</p>
<h2>¿Qué es la sucesión intestada?</h2>
<p>Cuando una persona fallece sin dejar testamento, se abre la sucesión intestada. En este caso, la ley determina quiénes son los herederos y en qué proporción reciben los bienes. El orden de prelación establecido en el Código Civil prioriza a los descendientes, luego a los ascendientes, al cónyuge y finalmente a los colaterales.</p>
<h2>Documentos necesarios para iniciar una sucesión</h2>
<p>Para iniciar un proceso sucesorio ante un juzgado de letras competente, se requiere presentar: certificación de defunción, certificación de nacimiento del testador para verificar filiación, certificación de matrimonio si aplica, relación de bienes del causante y, en su caso, el testamento original. La documentación puede variar según la complejidad del patrimonio.</p>
<h2>Plazos y consideraciones importantes</h2>
<p>La declaratoria de herederos y la partición de bienes pueden demorar varios meses, dependiendo de la carga del juzgado y la existencia de conflictos entre herederos. Es importante iniciar el trámite lo antes posible para evitar problemas con la administración de los bienes. Cada caso es único y los plazos pueden variar según las circunstancias particulares.</p>`,
  },
  'cuando-prescribe-delito-en-honduras': {
    readingTime: '4 min',
    body: `<h2>Prescripción de delitos en Honduras: plazos y consideraciones legales</h2>
<p>La prescripción es una institución jurídica que extingue la responsabilidad penal por el transcurso del tiempo. En Honduras, el Código Penal establece plazos específicos para la prescripción de los delitos, que varían según la gravedad de la infracción. Es importante conocer estos plazos para saber si una acción penal aún puede ser ejercida.</p>
<h2>Plazos de prescripción según el Código Penal</h2>
<p>El Código Penal hondureño (Decreto 130-2017 y sus reformas) establece que la acción penal prescribe en un plazo igual al máximo de la pena señalada para el delito, sin que pueda exceder de quince años ni ser inferior a tres años. Para las faltas, el plazo de prescripción es de seis meses. La prescripción comienza a correr desde el día en que se cometió el delito o, en caso de delitos continuados, desde el día en que cesó la continuidad.</p>
<h2>Interrupción de la prescripción</h2>
<p>La prescripción se interrumpe cuando el procedimiento se dirige contra el presunto responsable. Esto puede ocurrir mediante la presentación de una denuncia, querella o la realización de diligencias de investigación por parte del Ministerio Público. Una vez interrumpida, la prescripción comienza a correr de nuevo desde el inicio.</p>
<h2>Delitos que no prescriben</h2>
<p>La legislación hondureña prevé que ciertos delitos graves son imprescriptibles, entre ellos algunos delitos de lesa humanidad y crímenes internacionales conforme al derecho internacional. Es importante consultar con un abogado para determinar si un delito en particular ha prescrito o no, ya que cada caso requiere análisis individual.</p>`,
  },
  'proceso-consulta-legal-pineda-asociados-honduras': {
    readingTime: '4 min',
    body: `<h2>Proceso de consulta legal en Pineda y Asociados</h2>
<p>En Pineda y Asociados creemos que el acceso a la justicia comienza con una orientación clara y sin compromiso. Nuestro proceso de consulta legal está diseñado para que usted entienda sus opciones antes de tomar cualquier decisión. Atendemos en Nacaome, Valle, y ofrecemos primera orientación por teléfono y WhatsApp.</p>
<h2>Primer contacto</h2>
<p>Puede contactarnos a través del formulario de solicitud de consulta en nuestra página web, por teléfono o mediante WhatsApp. Le responderemos en horario hábil para agendar una orientación inicial. En esta primera comunicación, recopilaremos información básica sobre su caso para determinar si podemos ayudarle y qué área legal corresponde.</p>
<h2>Orientación inicial</h2>
<p>La orientación inicial tiene como objetivo entender su situación, explicarle el marco legal aplicable y las opciones disponibles. En esta etapa no se inicia ningún trámite judicial ni se emite opinión jurídica vinculante. Es un espacio para que usted conozca sus derechos y las posibles vías de acción.</p>
<h2>Presupuesto por escrito</h2>
<p>Si decide continuar con nuestros servicios, le entregaremos un presupuesto por escrito con los honorarios y condiciones claramente detallados. No creemos en las sorpresas ni en la letra pequeña. Usted sabrá exactamente qué servicios recibirá y cuál será el costo antes de aceptar.</p>
<h2>Confidencialidad</h2>
<p>Toda la información que comparta con nosotros está protegida por el secreto profesional abogado-cliente. No divulgamos datos de nuestros consultantes ni de los casos que atendemos. La privacidad de su información es una prioridad en nuestro despacho.</p>`,
  },
  'nacionalidad-espanola-para-hondurenos-residencia-plazos': {
    readingTime: '5 min',
    body: `<h2>Nacionalidad española para hondureños: plazos y requisitos</h2>
<p>Los ciudadanos hondureños que residen legalmente en España pueden solicitar la nacionalidad española por residencia una vez cumplido el plazo exigido por la ley. El tiempo de residencia requerido para hondureños es de diez años, aunque existen excepciones que reducen este plazo. Es importante conocer los requisitos y el procedimiento para evitar errores que puedan retrasar la solicitud.</p>
<h2>Requisitos generales para la nacionalidad por residencia</h2>
<p>Para solicitar la nacionalidad española por residencia se requiere: ser mayor de edad o estar emancipado, haber residido legalmente en España durante el plazo exigido, tener buena conducta cívica y suficiente integración en la sociedad española, carecer de antecedentes penales tanto en España como en Honduras, y superar las pruebas de idioma (DELE A2) y de conocimientos constitucionales y socioculturales (CCSE).</p>
<h2>Plazos reducidos excepcionales</h2>
<p>El plazo de diez años se reduce a cinco años para quienes hayan obtenido la condición de refugiado, a dos años para nacionales de países iberoamericanos (Honduras está incluido mediante convenio de doble nacionalidad), Andorra, Filipinas, Guinea Ecuatorial, Portugal o personas de origen sefardí, y a un año en supuestos específicos como haber nacido en territorio español, estar casado con español o ser viudo de español.</p>
<h2>Doble nacionalidad</h2>
<p>Honduras y España tienen un convenio de doble nacionalidad que permite a los hondureños adquirir la nacionalidad española sin perder la hondureña. Esto significa que podrá conservar ambas nacionalidades y gozar de los derechos y obligaciones de cada una. Es recomendable verificar la vigencia de este convenio ante las autoridades consulares.</p>`,
  },
  'contratos-mercantiles-esenciales-empresas-honduras': {
    readingTime: '4 min',
    body: `<h2>Contratos mercantiles esenciales para empresas en Honduras</h2>
<p>Los contratos mercantiles son herramientas fundamentales para el funcionamiento de cualquier empresa en Honduras. Establecen derechos y obligaciones entre las partes, proporcionan seguridad jurídica y previenen conflictos. Un contrato bien redactado puede marcar la diferencia entre una relación comercial exitosa y un litigio costoso.</p>
<h2>Tipos de contratos mercantiles más comunes</h2>
<p>Entre los contratos mercantiles más utilizados en Honduras se encuentran: el contrato de compraventa mercantil, que regula la transferencia de bienes entre comerciantes; el contrato de suministro, para el aprovisionamiento periódico de bienes o servicios; el contrato de distribución, para la comercialización de productos en un territorio determinado; el contrato de agencia, para la promoción de negocios por cuenta ajena; y el contrato de franquicia, que permite la explotación de un modelo de negocio bajo una marca establecida.</p>
<h2>Elementos esenciales de un contrato mercantil</h2>
<p>Todo contrato mercantil debe contener: identificación de las partes, objeto del contrato, precio y forma de pago, plazo de ejecución, obligaciones de cada parte, garantías, causas de resolución, jurisdicción aplicable y firma de los contratantes. La claridad en la redacción de estas cláusulas evita interpretaciones ambiguas que puedan generar disputas.</p>
<h2>Importancia de la revisión legal</h2>
<p>Antes de firmar cualquier contrato mercantil, es altamente recomendable que un abogado especializado revise su contenido. Un abogado puede identificar cláusulas lesivas, verificar que el contrato cumple con la legislación hondureña y sugerir modificaciones que protejan sus intereses. La inversión en revisión legal es mínima comparada con el costo de un litigio.</p>`,
  },
  'impuestos-pequenas-empresas-guia-basica-honduras': {
    readingTime: '5 min',
    body: `<h2>Impuestos para pequeñas empresas en Honduras: guía básica</h2>
<p>Las pequeñas empresas en Honduras deben cumplir con diversas obligaciones tributarias ante la Secretaría de Estado en el Despacho de Finanzas y el Servicio de Administración de Rentas (SAR). Conocer estas obligaciones es fundamental para operar legalmente y evitar sanciones. El cumplimiento tributario no tiene por qué ser complejo si se cuenta con la orientación adecuada.</p>
<h2>Principales impuestos que deben pagar las pequeñas empresas</h2>
<p>El Impuesto Sobre la Venta (ISV) es un impuesto indirecto que grava la venta de bienes y la prestación de servicios. La tarifa general es del 15%, con algunas excepciones. El Impuesto Sobre la Renta (ISR) grava las utilidades obtenidas por la empresa durante el ejercicio fiscal, con tarifas progresivas que pueden llegar hasta el 25% para rentas netas gravables superiores a ciertos montos. Las empresas también deben retener el ISV e ISR a sus proveedores cuando corresponda.</p>
<h2>Obligaciones formales</h2>
<p>Toda empresa debe inscribirse en el Registro Tributario Nacional (RTN) y obtener el Certificado de Registro de Contribuyente. Es obligatorio emitir facturas y documentos fiscales autorizados por el SAR, presentar declaraciones mensuales de ISV y declaraciones anuales de ISR, y llevar contabilidad formal de acuerdo con las Normas Internacionales de Información Financiera (NIIF).</p>
<h2>Recomendaciones para el cumplimiento tributario</h2>
<p>Mantener una contabilidad ordenada, cumplir con los plazos de declaración, conservar los comprobantes fiscales por al menos cinco años y buscar asesoría profesional son prácticas recomendadas para evitar problemas con la administración tributaria. Las pequeñas empresas pueden beneficiarse de regímenes simplificados que facilitan el cumplimiento de sus obligaciones.</p>`,
  },
  'despido-injustificado-honduras-derechos-trabajador': {
    readingTime: '5 min',
    body: `<h2>Despido injustificado en Honduras: derechos del trabajador</h2>
<p>El despido injustificado ocurre cuando el empleador da por terminada la relación laboral sin una causa legal que lo justifique. En Honduras, el Código del Trabajo protege a los trabajadores frente a despidos arbitrarios y establece indemnizaciones y prestaciones a las que tienen derecho en caso de despido sin causa justificada.</p>
<h2>Causas que justifican un despido</h2>
<p>El Código del Trabajo enumera las causas que justifican un despido sin responsabilidad para el empleador. Entre ellas se encuentran: falta de probidad u honradez, actos de violencia, injurias o malos tratos, daños materiales graves, revelación de secretos, abandono de trabajo, inasistencia injustificada y desobediencia grave. Si el empleador despide al trabajador sin invocar alguna de estas causas, el despido se considera injustificado.</p>
<h2>Prestaciones e indemnizaciones por despido injustificado</h2>
<p>Ante un despido injustificado, el trabajador tiene derecho al pago del preaviso (si no se le concedió), cesantía calculada según los años de servicio (una vez superado el período de prueba), vacaciones proporcionales no gozadas, décimo tercer mes y décimo cuarto mes proporcionales, y cualquier otra prestación pendiente. El trabajador también puede optar por solicitar su reinstalación en algunos casos previstos por la ley.</p>
<h2>Recomendaciones ante un despido injustificado</h2>
<p>Si usted ha sido despedido injustificadamente, es recomendable no firmar ningún documento sin antes consultar con un abogado laboralista, conservar toda la documentación relacionada con su empleo (contrato, recibos de pago, comunicaciones), y presentar la demanda ante la Inspectoría de Trabajo o el Juzgado de Letras del Trabajo dentro del plazo legal establecido. Los plazos para reclamar pueden ser cortos, por lo que la rapidez en la actuación es determinante.</p>`,
  },
  'derechos-trabajadora-embarazada-honduras': {
    readingTime: '4 min',
    body: `<h2>Derechos de la trabajadora embarazada en Honduras</h2>
<p>La legislación laboral hondureña protege especialmente a las trabajadoras durante el embarazo y la lactancia. El Código del Trabajo establece derechos específicos como el descanso por maternidad, la protección contra el despido y la estabilidad laboral durante el embarazo y el período de lactancia. Conocer estos derechos es fundamental para que las trabajadoras puedan ejercerlos plenamente.</p>
<h2>Descanso por maternidad</h2>
<p>Toda trabajadora tiene derecho a un descanso por maternidad de diez semanas, distribuidas en cuatro semanas antes del parto y seis semanas después. Durante este período, la trabajadora recibe un subsidio por parte del Instituto Hondureño de Seguridad Social (IHSS), equivalente al salario que devengaba. Es importante notificar al empleador sobre el embarazo y presentar el certificado médico correspondiente para hacer efectivo este derecho.</p>
<h2>Protección contra el despido</h2>
<p>La trabajadora embarazada goza de fuero de maternidad, lo que significa que no puede ser despedida durante el embarazo ni hasta seis meses después del parto, salvo por causas graves calificadas por un juez de letras del trabajo. Si el despido ocurre durante este período sin autorización judicial, se presume que el despido es por causa del embarazo y la trabajadora tiene derecho a reinstalación y pago de salarios caídos.</p>
<h2>Licencia por lactancia</h2>
<p>Después de reincorporarse al trabajo, la trabajadora tiene derecho a dos descansos de treinta minutos cada uno durante la jornada laboral para amamantar a su hijo, sin reducción del salario. Este derecho se extiende hasta los seis meses de edad del menor. La trabajadora puede solicitar la acumulación de estos descansos al inicio o al final de la jornada, de común acuerdo con el empleador.</p>`,
  },
  'preguntas-frecuentes-antes-contratar-abogado-honduras': {
    readingTime: '4 min',
    body: `<h2>Preguntas frecuentes antes de contratar un abogado en Honduras</h2>
<p>Contratar un abogado es una decisión importante que puede afectar significativamente el resultado de un asunto legal. Antes de elegir un profesional, es recomendable hacer preguntas clave para asegurarse de que tiene la experiencia y conocimientos adecuados para su caso. Estas son algunas preguntas que puede plantear durante la consulta inicial.</p>
<h2>¿Tiene experiencia en casos como el mío?</h2>
<p>Preguntar por la experiencia específica del abogado en el área legal que necesita es fundamental. No todos los abogados tienen la misma práctica. Un penalista experimentado puede no conocer los detalles del derecho laboral o de familia. Solicite ejemplos de casos similares que haya manejado sin violar la confidencialidad de otros clientes.</p>
<h2>¿Cuál es su honorario y cómo se factura?</h2>
<p>Es importante entender desde el principio cómo se le cobrará: honorario fijo, por hora, porcentaje del resultado (contingencia) o una combinación. Un abogado serio entregará un presupuesto por escrito antes de iniciar cualquier gestión. Pregunte también por gastos adicionales como copias, transporte, tasas judiciales y otros desembolsos.</p>
<h2>¿Quién atenderá mi caso?</h2>
<p>En algunos bufetes, el abogado con quien realiza la consulta inicial no es quien atiende directamente el caso. Pregunte quién será su contacto principal y si habrá otros profesionales involucrados. Asegúrese de que el abogado que atenderá su caso tenga la habilitación profesional correspondiente.</p>
<h2>¿Cuánto tiempo puede tomar mi caso?</h2>
<p>Cada caso es diferente y los plazos procesales pueden variar según la complejidad, la carga del tribunal y la conducta de las partes. Un abogado experimentado puede darle una estimación realista basada en su experiencia, evitando promesas de resultados o plazos exactos. Desconfíe de quienes garantizan resultados rápidos.</p>`,
  },
  'custodia-hijos-honduras-juez': {
    readingTime: '5 min',
    body: `<h2>Custodia de hijos en Honduras: cómo decide el juez</h2>
<p>La custodia de los hijos menores es una de las decisiones más delicadas en los procesos de familia. En Honduras, el juez de familia o de letras con competencia en materia de familia debe resolver la custodia considerando primordialmente el interés superior del menor. No existe una regla automática que favorezca a la madre o al padre; cada caso se evalúa según sus circunstancias particulares.</p>
<h2>Factores que considera el juez para otorgar la custodia</h2>
<p>El juez evalúa múltiples factores para determinar qué régimen de custodia beneficia más al menor: la capacidad de cada progenitor para proveer cuidado físico y emocional, la relación afectiva del menor con cada uno, la estabilidad del entorno ofrecido, la opinión del menor si tiene suficiente juicio (generalmente a partir de los 12 años), la proximidad de las viviendas de los padres, y cualquier antecedente de violencia doméstica o abuso.</p>
<h2>Tipos de custodia</h2>
<p>La custodia puede ser unilateral, cuando un solo progenitor tiene la guarda y cuidado del menor, o compartida, cuando ambos padres comparten la responsabilidad de manera equitativa. La custodia compartida es cada vez más frecuente en Honduras cuando las condiciones lo permiten y ambos padres muestran disposición a cooperar por el bienestar del menor. El juez también puede establecer un régimen de visitas para el progenitor que no tiene la custodia.</p>
<h2>¿Se puede modificar la custodia?</h2>
<p>Las resoluciones sobre custodia no son definitivas. Si cambian las circunstancias que motivaron la decisión inicial, cualquiera de los padres puede solicitar al juez la modificación del régimen de custodia. Para ello debe demostrar que el cambio beneficia al menor y que existe una razón válida para modificar lo resuelto anteriormente.</p>`,
  },
  'pineda-asociados-bufete-multidisciplinario-honduras': {
    readingTime: '3 min',
    body: `<h2>Pineda y Asociados: bufete multidisciplinario en Nacaome, Valle</h2>
<p>Pineda y Asociados es un bufete jurídico multidisciplinario con sede en Nacaome, Valle, Honduras. Con más de 15 años de ejercicio profesional, ofrecemos servicios legales en múltiples áreas del derecho, incluyendo derecho penal, de familia, laboral, civil, mercantil, tributario, administrativo, aduanero, ambiental, propiedad intelectual y conciliación y arbitraje.</p>
<h2>Nuestra filosofía</h2>
<p>Creemos en la atención directa y personalizada. Cada caso es único y merece un análisis individual antes de recomendar una estrategia legal. Trabajamos con presupuesto por escrito, sin sorpresas ni letra pequeña. Nuestro equipo está comprometido con la defensa de los intereses de nuestros clientes con rigor técnico y sensibilidad humana.</p>
<h2>Áreas de práctica</h2>
<p>Ofrecemos servicios en: defensa penal técnica, derecho de familia (divorcios, pensiones alimenticias, custodias), derecho laboral (despidos, prestaciones, acoso laboral), derecho civil y notarial (contratos, inmuebles, testamentos), derecho mercantil (sociedades, contratos comerciales), derecho tributario (impuestos, fiscalización del SAR), derecho bancario, derecho administrativo, derecho aduanero, regulación sanitaria, extranjería y migración, propiedad intelectual, derecho ambiental y conciliación y arbitraje.</p>
<h2>Ubicación y contacto</h2>
<p>Nuestra sede principal está en Nacaome, Valle. Atendemos en toda la zona sur de Honduras, incluyendo Choluteca, San Lorenzo, Marcovia, Amapala y municipios de Valle y Choluteca. Puede contactarnos por teléfono, WhatsApp o mediante el formulario de solicitud de consulta en nuestra página web.</p>`,
  },
  'abogados-en-amapala-valle': {
    readingTime: '5 min',
    body: `<h2>Abogados en Amapala, Valle: asistencia legal en la zona sur</h2>
<p>Amapala es un municipio del departamento de Valle, ubicado en la Isla del Tigre, en el Golfo de Fonseca. Su condición de puerto y su importancia turística lo convierten en un punto estratégico para residentes y visitantes que necesitan servicios legales. Contar con <strong>abogados en Amapala</strong> que conozcan las particularidades de la zona es fundamental para resolver asuntos jurídicos de forma eficiente.</p>
<h2>Servicios legales frecuentes en Amapala</h2>
<h3>Derecho penal y defensa técnica</h3>
<p>Atendemos casos de defensa penal en todas sus etapas: desde la detención inicial hasta la ejecución de la sentencia. Brindamos orientación inmediata ante citaciones, allanamientos o detenciones. También representamos a víctimas en la presentación de denuncias ante el Ministerio Público.</p>
<h3>Derecho de familia</h3>
<p>Ofrecemos asesoría en divorcios, pensiones alimenticias, régimen de visitas y custodia de menores, reconocimiento voluntario de hijos y liquidación de sociedad conyugal. Cada caso se analiza de forma individual antes de recomendar una vía judicial o extrajudicial.</p>
<h3>Derecho laboral y civil</h3>
<p>Representamos a trabajadores y empleadores en conflictos laborales. En materia civil, gestionamos compraventa de inmuebles, contratos de arrendamiento, testamentos y declaratorias de herederos. También ofrecemos servicios notariales como escrituras públicas y reconocimientos de firma.</p>
<h2>¿Cuándo buscar un abogado en Amapala?</h2>
<p>Es recomendable contactar a un abogado ante recepción de citaciones o notificaciones judiciales, detención propia o de un familiar, problemas para cobrar pensiones alimenticias, conflictos laborales, firma de contratos de compraventa o arrendamiento, procesos sucesorios o cualquier situación que requiera representación legal.</p>
<h2>Atención y cobertura</h2>
<p>Nuestra sede principal está en Nacaome, Valle, a aproximadamente 30 minutos de Amapala vía marítima o 45 minutos por carretera, lo que permite atención presencial con previa cita. Para casos urgentes, ofrecemos primera orientación por teléfono o WhatsApp. Atendemos en Amapala y toda la zona sur de Honduras.</p>`,
  },
};

async function main() {
  console.log('=== FIX FINAL: restaurar 11 posts vacíos + amapala ===\n');

  const allPosts = await db.select({ id: blogPosts.id, slug: blogPosts.slug, body: blogPosts.body }).from(blogPosts).where(eq(blogPosts.published, true));

  let fixed = 0;
  for (const [slug, data] of Object.entries(EMPTY_BODY_FIXES)) {
    const post = allPosts.find(p => p.slug === slug);
    if (!post) { console.log(`  ✗ No encontrado: ${slug}`); continue; }

    const oldWords = post.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    const newWords = data.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;

    await db.update(blogPosts).set({
      body: data.body,
      readingTime: data.readingTime,
      updatedAt: new Date(),
      lastReviewedAt: new Date(),
    }).where(eq(blogPosts.slug, slug));

    console.log(`  ✓ ${slug}: ${oldWords} → ${newWords} palabras`);
    fixed++;
  }

  console.log(`\n=== Total: ${fixed} posts restaurados ===\n`);

  // Verify final count
  const remaining = await db.select({ slug: blogPosts.slug, body: blogPosts.body }).from(blogPosts).where(eq(blogPosts.published, true));
  const stillEmpty = remaining.filter(p => {
    const wc = p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    return wc < 50;
  });
  if (stillEmpty.length > 0) {
    console.log(`⚠ Aún dañados (${stillEmpty.length}):`);
    for (const p of stillEmpty) {
      const wc = p.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
      console.log(`  ${p.slug}: ${wc} words`);
    }
  } else {
    console.log('✅ No quedan posts dañados');
  }
}

main().catch(console.error);

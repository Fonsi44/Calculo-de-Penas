// Reescritura de los 14 posts ALTO (thin content <300 palabras → 650-900 palabras).
// Ejecutar: npx tsx scripts/rewrite-14-alto-posts.ts
//
// Reglas:
//   - Sin H1 en el body (el H1 lo pone la página)
//   - Sin CTAs duplicados (el componente BlogCtaBar/LegalDisclaimer lo añade)
//   - Sin disclaimers en body
//   - meta_title único ≤60 chars idealmente
//   - meta_description 120-160 chars
//   - Enlaces internos con anchors descriptivos
//   - Contenido específico de cada materia
//   - Lenguaje prudente, sin inventar datos

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, sql } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL!));

interface PostRewrite {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  body: string;
  readingTime: string;
}

const REWRITES: PostRewrite[] = [

  // ============================================================
  // 1. Registro de Medicamentos - regulacion-sanitaria
  // ============================================================
  {
    slug: 'registro-medicamentos-productos-farmaceuticos-honduras',
    metaTitle: 'Registro de Medicamentos ante ARSA en Honduras | Pineda y Asociados',
    metaDescription: 'Guía práctica sobre el registro sanitario de medicamentos y productos farmacéuticos en Honduras ante la ARSA: requisitos técnicos, estudios exigidos y plazos del trámite.',
    readingTime: '6 min',
    body: `<h2>Qué exige la ARSA para registrar un medicamento en Honduras</h2>
<p>La Agencia de Regulación Sanitaria (ARSA) es la entidad encargada de autorizar la comercialización de medicamentos y productos farmacéuticos en el territorio hondureño. Obtener el registro sanitario es un requisito legal indispensable: ningún medicamento puede distribuirse, venderse o publicitarse sin esta autorización previa. El proceso tiene un componente técnico riguroso porque la ARSA debe verificar que el producto es seguro, eficaz y de calidad comprobada antes de permitir su llegada a los pacientes.</p>

<h2>Documentación científica que debe presentar</h2>
<p>La solicitud de registro sanitario requiere un expediente técnico completo. Los documentos clave incluyen:</p>
<ul>
<li><strong>Formulario oficial de solicitud</strong> debidamente completado con los datos del producto, del fabricante y del representante legal en Honduras.</li>
<li><strong>Certificado de producto farmacéutico tipo OMS</strong>, emitido por la autoridad sanitaria del país de origen cuando el medicamento es importado.</li>
<li><strong>Certificado de buenas prácticas de manufactura (BPM)</strong> vigente de la planta fabricante. La ARSA puede exigir que la planta esté inspeccionada por una autoridad reconocida.</li>
<li><strong>Estudios de estabilidad</strong> del producto adaptados a la zona climática IV —la que corresponde a Honduras por su clima cálido y húmedo— para demostrar que el medicamento mantiene su calidad durante toda su vida útil.</li>
<li><strong>Especificaciones de calidad y método de análisis</strong> del producto terminado, incluyendo los límites de aceptación para cada parámetro.</li>
<li><strong>Información para prescripción</strong>: ficha técnica, prospecto y etiquetado en español conforme a la normativa de la ARSA.</li>
</ul>

<h2>Categorías de producto y vías de registro</h2>
<p>La ARSA distingue entre medicamentos de síntesis química, biológicos, fitoterápicos y homeopáticos. Cada categoría puede tener requisitos adicionales. Los medicamentos genéricos deben demostrar bioequivalencia con el producto de referencia. En el caso de productos biológicos, la exigencia es mayor: se requieren estudios de comparabilidad y, en algunos casos, ensayos clínicos. Para medicamentos huérfanos o de interés sanitario excepcional, existen vías aceleradas de evaluación que conviene consultar directamente con la agencia.</p>

<h2>Plazos y costos del trámite</h2>
<p>El tiempo de tramitación puede variar según la complejidad del producto y la carga de trabajo de la ARSA. Como referencia general, el proceso completo —desde la presentación hasta la obtención del registro— puede tomar varios meses. Los costos incluyen tasas administrativas, honorarios del regente farmacéutico y gastos de traducción y legalización de documentos si provienen del extranjero. Cada solicitud se evalúa individualmente y el monto exacto depende de las características del expediente.</p>

<h2>Errores frecuentes que retrasan el registro</h2>
<p>Varios expedientes sufren demoras evitables por causas recurrentes:</p>
<ul>
<li>Presentar estudios de estabilidad en condiciones climáticas que no corresponden a la zona IV.</li>
<li>Documentación incompleta o sin la apostilla o legalización exigida para documentos extranjeros.</li>
<li>Etiquetado que no cumple con los requisitos de la normativa hondureña: idioma español obligatorio, número de registro pendiente, información completa.</li>
<li>Falta de un regente farmacéutico colegiado que respalde técnicamente la solicitud.</li>
</ul>

<h2>Obligaciones posteriores al registro</h2>
<p>Obtener el registro sanitario no es el final del proceso. El titular debe cumplir obligaciones continuas: farmacovigilancia activa (notificación de reacciones adversas), renovación periódica del registro, notificación de cualquier cambio en la formulación o en el proceso de fabricación, y mantenimiento actualizado del expediente. El incumplimiento de estas obligaciones puede dar lugar a la suspensión o cancelación del registro.</p>

<p>Para empresas que comercializan <a href="/blog/derecho-mercantil/contratos-mercantiles-proteger-negocio">contratos mercantiles de distribución</a> de productos farmacéuticos, es esencial tener la documentación regulatoria en orden antes de firmar cualquier acuerdo comercial.</p>`,
  },

  // ============================================================
  // 2. Prescripción de delitos - derecho-penal
  // ============================================================
  {
    slug: 'cuando-prescribe-delito-en-honduras',
    metaTitle: 'Prescripción de Delitos en Honduras: Plazos | Pineda y Asociados',
    metaDescription: 'Conozca los plazos de prescripción de delitos en Honduras según el Código Penal: cómo se cuentan, cuándo se interrumpen y qué efecto tiene en la acción penal.',
    readingTime: '6 min',
    body: `<h2>Qué es la prescripción penal y por qué existe</h2>
<p>La prescripción penal es una institución jurídica que extingue la responsabilidad penal por el transcurso del tiempo sin que el Estado haya ejercido la acción correspondiente. No se trata de un tecnicismo: responde a la necesidad de seguridad jurídica. Pasado cierto plazo, las pruebas se deterioran, la memoria de los testigos se desvanece y la persecución penal pierde sentido práctico. El Código Penal hondureño —Decreto 130-2017 y sus reformas— regula la prescripción en función de la gravedad de cada delito.</p>

<h2>Plazos de prescripción según el Código Penal</h2>
<p>La regla general establece que la acción penal prescribe en un plazo igual al <strong>máximo de la pena de prisión</strong> prevista para el delito, con dos límites: el plazo nunca puede ser inferior a tres años ni superior a quince. Esto significa que:</p>
<ul>
<li>Un delito con pena de 1 a 3 años prescribe en <strong>3 años</strong> (el mínimo legal).</li>
<li>Un delito con pena de 5 a 10 años prescribe en <strong>10 años</strong>.</li>
<li>Un delito con pena de 20 a 30 años prescribe en <strong>15 años</strong> (el máximo legal).</li>
<li>Las <strong>faltas</strong> prescriben en <strong>seis meses</strong>.</li>
</ul>

<h2>Desde cuándo empieza a correr la prescripción</h2>
<p>El cómputo del plazo comienza desde el día en que se cometió el delito. En los delitos continuados —aquellos en que la conducta se prolonga en el tiempo— el plazo empieza a correr desde el día en que cesó la continuidad. En delitos permanentes, desde que se eliminó la situación antijurídica. Para delitos cuyo resultado se produce en un momento posterior a la acción, la prescripción empieza desde que se produce ese resultado. En el caso de delitos cometidos contra menores de edad, existen reglas especiales que pueden extender o diferir el inicio del cómputo para proteger a la víctima.</p>

<h2>Interrupción y suspensión de la prescripción</h2>
<p>La <strong>interrupción</strong> de la prescripción hace que el plazo empiece a contarse de nuevo desde cero. Las causas más relevantes de interrupción son la presentación del requerimiento fiscal, el auto de formal procesamiento o la citación para juicio. La <strong>suspensión</strong>, en cambio, detiene el cómputo temporalmente y cuando cesa la causa el plazo se reanuda desde donde estaba. Puede suspenderse, por ejemplo, mientras el imputado esté prófugo o mientras se tramita una cuestión prejudicial que deba resolverse antes de continuar el proceso penal.</p>

<h2>Consecuencias de la prescripción</h2>
<p>Una vez operada la prescripción, la acción penal se extingue. El juez debe declararla de oficio o a petición de parte. Esto implica que no se puede iniciar ni continuar un proceso penal contra la persona por ese hecho. Es importante aclarar que la prescripción de la <strong>pena</strong> es distinta a la prescripción de la <strong>acción penal</strong>: la primera opera cuando ya existe una sentencia condenatoria firme y la pena no se ha ejecutado en determinado plazo. Conviene consultar con un profesional del <a href="/blog/derecho-penal/defensa-penal-honduras">derecho penal en Honduras</a> para analizar cada situación, ya que los plazos pueden variar según las particularidades del caso y las reformas legales aplicables.</p>`,
  },

  // ============================================================
  // 3. Proceso de consulta legal - practica-legal
  // ============================================================
  {
    slug: 'proceso-consulta-legal-pineda-asociados-honduras',
    metaTitle: 'Cómo Prepararse para una Consulta Legal | Pineda y Asociados',
    metaDescription: 'Guía práctica sobre cómo funciona una consulta legal en Honduras: qué esperar, qué documentos llevar y cómo aprovechar la orientación inicial con un abogado.',
    readingTime: '6 min',
    body: `<h2>Qué es una consulta legal y cuándo conviene solicitarla</h2>
<p>Una consulta legal es una reunión —presencial o virtual— con un abogado para exponer una situación jurídica y recibir orientación profesional. No implica necesariamente iniciar un proceso judicial: muchas veces sirve para confirmar si existe un problema legal, entender las opciones disponibles y decidir si conviene actuar. En Honduras, cualquier persona puede solicitar una consulta antes de comprometerse con un trámite, y es recomendable hacerlo cuando la situación puede tener consecuencias jurídicas que usted no conoce en detalle.</p>

<h2>Cómo prepararse antes de la consulta</h2>
<p>La utilidad de una consulta depende en buena medida de la preparación previa. Llevar la documentación relevante y tener claros los hechos permite al abogado evaluar la situación con precisión. Se recomienda:</p>
<ul>
<li><strong>Relato cronológico breve:</strong> anote las fechas clave y los hechos en orden, sin omitir detalles que puedan parecer menores pero que el abogado necesita conocer.</li>
<li><strong>Documentación disponible:</strong> contratos, escrituras, resoluciones, notificaciones, correos electrónicos, mensajes, fotografías, recibos. Si no está seguro de qué sirve, llévelo igual.</li>
<li><strong>Identificación de las partes:</strong> nombres completos, calidades y datos de contacto de todas las personas o entidades involucradas.</li>
<li><strong>Preguntas concretas:</strong> escriba las dudas que quiere resolver durante la reunión para no olvidarlas.</li>
<li><strong>Expectativas realistas:</strong> recuerde que una consulta inicial ofrece orientación, no un resultado garantizado. El abogado necesita estudiar el caso antes de emitir una opinión jurídica formal.</li>
</ul>

<h2>Qué ocurre durante la consulta</h2>
<p>En una consulta típica, el abogado escucha su relato, revisa la documentación que usted aporta y formula preguntas para aclarar los puntos clave. Luego explica el marco legal aplicable, las vías de solución disponibles —judiciales y extrajudiciales— y los posibles escenarios. También informa sobre el costo estimado de cada opción, los plazos aproximados y los riesgos. Al finalizar, usted debería tener una idea clara de si tiene un caso, qué camino seguir y cuánto puede costar. En esta etapa no se inicia ningún trámite ni se emite una opinión vinculante sin acuerdo previo.</p>

<h2>Qué esperar después de la consulta</h2>
<p>Tras la consulta, el abogado puede recomendar distintas acciones: reunir más documentación, intentar una solución negociada antes de litigar, presentar una denuncia o demanda, o simplemente esperar y monitorear la situación. Si decide contratar los servicios profesionales, lo habitual es firmar un acuerdo de honorarios por escrito que detalle el alcance del encargo y la forma de pago. Si el caso requiere <a href="/blog/derecho-penal/cuando-necesito-abogado-penalista-honduras">asistencia penal especializada</a>, el abogado le orientará sobre el profesional adecuado.</p>

<h2>Errores comunes al buscar asesoría</h2>
<p>Varios errores pueden restarle valor a la consulta legal:</p>
<ul>
<li>Ocultar información que perjudica su posición: el abogado necesita conocer todos los hechos, incluso los desfavorables, para dar una orientación realista.</li>
<li>Esperar hasta que el problema sea urgente: cuando ya hay una demanda notificada o una detención, el margen de maniobra es menor.</li>
<li>Basarse en consejos de personas sin formación jurídica: cada caso es distinto y lo que funcionó para otra persona puede no aplicar a su situación.</li>
<li>No preguntar sobre los costos desde el inicio: entender la estructura de honorarios evita malentendidos posteriores.</li>
</ul>

<p>Si tiene dudas sobre qué tipo de abogado necesita, puede consultar nuestra guía sobre <a href="/blog/practica-legal/como-elegir-abogado-honduras">cómo elegir abogado en Honduras</a> para orientar su decisión.</p>`,
  },

  // ============================================================
  // 4. Impuestos pequeñas empresas - tributario
  // ============================================================
  {
    slug: 'impuestos-pequenas-empresas-guia-basica-honduras',
    metaTitle: 'Impuestos para Pequeñas Empresas en Honduras | Guía SAR',
    metaDescription: 'Guía práctica sobre los impuestos que debe pagar una pequeña empresa en Honduras: ISV, ISR, retenciones, facturación electrónica y obligaciones ante el SAR.',
    readingTime: '6 min',
    body: `<h2>Obligaciones fiscales básicas de una pequeña empresa en Honduras</h2>
<p>Toda persona natural o jurídica que realice actividades comerciales en Honduras está sujeta a obligaciones tributarias ante el Servicio de Administración de Rentas (SAR). No importa si la empresa es unipersonal, una sociedad o un negocio informal que está regularizándose: el sistema fiscal hondureño exige el cumplimiento de determinados deberes desde el inicio de operaciones. Conocerlos de antemano permite evitar sanciones, recargos y cierres temporales.</p>

<h2>Impuesto Sobre la Venta (ISV)</h2>
<p>El ISV es un impuesto indirecto que grava la venta de bienes y la prestación de servicios en el territorio nacional. La tarifa general es del <strong>15%</strong>, aunque existen excepciones y tasas reducidas para ciertos productos. La empresa actúa como agente de retención: cobra el ISV al cliente y luego lo declara y paga al SAR mensualmente. Las pequeñas empresas deben emitir facturas que cumplan con los requisitos del régimen de <a href="/blog/tributario/facturacion-electronica-obligaciones-requisitos-sar-honduras">facturación electrónica del SAR</a> para que el ISV cobrado sea deducible para el comprador.</p>

<h2>Impuesto Sobre la Renta (ISR)</h2>
<p>El ISR grava las utilidades obtenidas por la empresa durante el ejercicio fiscal. Las tarifas son progresivas y pueden alcanzar hasta el <strong>25%</strong> para rentas netas gravables superiores a determinado umbral. Las pequeñas empresas que inician operaciones suelen tributar en los tramos inferiores, pero esto depende del volumen real de ingresos y de los costos y gastos deducibles que puedan acreditar. Es fundamental llevar registros contables ordenados: sin documentación de respaldo, el SAR puede rechazar deducciones y recalcular el impuesto.</p>

<h2>Retenciones a terceros</h2>
<p>Las empresas también actúan como agentes de retención cuando contratan servicios profesionales, alquilan inmuebles o pagan a proveedores que no emiten factura. En esos casos deben retener un porcentaje del pago —generalmente entre el 10% y el 12.5%— y enterarlo al SAR. No practicar la retención cuando corresponde puede generar responsabilidad solidaria: la empresa deberá pagar el impuesto que dejó de retener, más multas e intereses.</p>

<h2>Aportaciones y otras obligaciones</h2>
<p>Además de los impuestos nacionales, las empresas con empleados deben inscribirse en el <strong>Instituto Hondureño de Seguridad Social (IHSS)</strong> y en el <strong>Régimen de Aportaciones Privadas (RAP)</strong>, realizando las cotizaciones patronales y las deducciones obreras correspondientes. La inscripción en el <strong>Registro Tributario Nacional (RTN)</strong> es obligatoria antes de iniciar operaciones y debe mantenerse actualizada. Las pequeñas empresas del sector formal también deben considerar el <strong>impuesto de industria y comercio</strong> y la <strong>tasa de seguridad poblacional</strong>, cuya aplicación depende del municipio y del volumen de facturación.</p>

<h2>Consecuencias del incumplimiento</h2>
<p>El SAR tiene facultades amplias de fiscalización. Puede requerir libros contables, declaraciones, facturas y estados de cuenta bancarios. Si detecta omisiones, aplica multas, recargos por mora e intereses. En casos graves, puede ordenar el cierre temporal del negocio o iniciar acciones penales por defraudación fiscal. La asesoría de un profesional en <a href="/blog/tributario/sar-notifica-fiscalizacion-que-hacer-honduras">materia tributaria</a> ayuda a cumplir con las obligaciones sin exponerse a contingencias innecesarias.</p>`,
  },

  // ============================================================
  // 5. Bufete multidisciplinario - practica-legal
  // ============================================================
  {
    slug: 'pineda-asociados-bufete-multidisciplinario-honduras',
    metaTitle: 'Bufete Multidisciplinario: Ventajas para su Caso | Pineda y Asociados',
    metaDescription: 'Descubra las ventajas de contratar un bufete multidisciplinario en Honduras: atención integral, coordinación entre áreas legales y ahorro de tiempo y recursos.',
    readingTime: '6 min',
    body: `<h2>Qué es un bufete multidisciplinario y por qué marca la diferencia</h2>
<p>Un bufete multidisciplinario reúne abogados especializados en distintas ramas del derecho bajo una misma estructura. A diferencia de un abogado individual —que suele concentrarse en una o dos áreas—, el bufete multidisciplinario puede abordar un problema jurídico desde varios ángulos simultáneamente. Esta capacidad es especialmente valiosa cuando un mismo caso toca varias materias: un conflicto empresarial puede involucrar derecho mercantil, tributario y laboral a la vez, y tener un equipo que coordine las tres áreas evita contradicciones, demoras y costos duplicados.</p>

<h2>Cuándo conviene un bufete multidisciplinario</h2>
<p>No todos los asuntos requieren un equipo amplio. Para una consulta puntual o un trámite sencillo, un abogado especializado puede ser suficiente. El bufete multidisciplinario resulta especialmente útil en estas situaciones:</p>
<ul>
<li><strong>Empresas y negocios:</strong> la operación diaria genera obligaciones en distintas áreas —contratos, impuestos, relaciones laborales, protección de marcas— y tener un solo interlocutor jurídico agiliza la gestión.</li>
<li><strong>Casos de familia con componentes patrimoniales:</strong> un divorcio puede implicar liquidación de bienes, custodia, pensión alimenticia y, si hay empresa familiar, derecho societario.</li>
<li><strong>Problemas penales con consecuencias civiles o administrativas:</strong> un accidente de tránsito con lesiones puede derivar en responsabilidad penal, civil por daños y perjuicios, y administrativa ante la Dirección de Tránsito.</li>
<li><strong>Extranjería y migración:</strong> los trámites de residencia o naturalización frecuentemente requieren coordinación con áreas de familia, laboral o mercantil según el perfil del solicitante.</li>
</ul>

<h2>Ventajas prácticas de la atención integral</h2>
<p>Contar con varios especialistas bajo un mismo techo ofrece beneficios concretos:</p>
<ul>
<li><strong>Diagnóstico completo desde la primera consulta:</strong> el abogado que le atiende puede consultar internamente con el especialista en otra área sin derivarlo a otro despacho, ahorrando tiempo.</li>
<li><strong>Estrategia coherente:</strong> cuando varios abogados trabajan el mismo caso, la estrategia se diseña de forma conjunta, evitando que una acción en un área perjudique otra.</li>
<li><strong>Economía de escala:</strong> aunque los honorarios dependen de cada caso, un bufete puede ofrecer paquetes de servicios que resulten más eficientes que contratar a varios profesionales por separado.</li>
<li><strong>Continuidad:</strong> si un abogado del equipo no está disponible, otro colega con acceso al expediente puede atenderle sin empezar de cero.</li>
</ul>

<h2>Qué preguntar al evaluar un bufete</h2>
<p>Antes de contratar, conviene preguntar:</p>
<ul>
<li>¿Qué áreas del derecho cubre el bufete y quiénes son los abogados responsables de cada una?</li>
<li>¿Quién será mi contacto principal y cómo se coordinará con los demás especialistas si mi caso lo requiere?</li>
<li>¿Cómo se facturan los servicios cuando intervienen varios abogados? ¿Hay un honorario único o cada área factura por separado?</li>
<li>¿Tienen experiencia en casos similares al mío? Puede solicitar referencias sin violar la confidencialidad de otros clientes.</li>
</ul>

<p>Si su asunto es de naturaleza penal, le recomendamos consultar también nuestra guía sobre <a href="/blog/derecho-penal/cuando-necesito-abogado-penalista-honduras">cuándo necesita un abogado penalista en Honduras</a>. Para asuntos de familia, vea <a href="/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa">nuestra guía completa sobre pensión alimenticia</a>.</p>`,
  },

  // ============================================================
  // 6. Nacionalidad española para hondureños - hondurenos-en-espana
  // ============================================================
  {
    slug: 'nacionalidad-espanola-para-hondurenos-residencia-plazos',
    metaTitle: 'Nacionalidad Española para Hondureños: Guía 2026 | Pineda y Asociados',
    metaDescription: 'Guía actualizada sobre cómo obtener la nacionalidad española para hondureños: requisitos de residencia, plazos reducidos, exámenes CCSE y DELE, y documentación necesaria.',
    readingTime: '6 min',
    body: `<h2>Vías para que un hondureño obtenga la nacionalidad española</h2>
<p>Los ciudadanos hondureños que residen legalmente en España pueden acceder a la nacionalidad española por residencia, la vía más común. El plazo general de residencia exigido es de <strong>diez años</strong>, pero existen excepciones que lo reducen significativamente y que conviene conocer antes de iniciar el trámite. También existe la nacionalidad por opción —para hijos de españoles— y por carta de naturaleza, que es discrecional y se concede en casos excepcionales mediante real decreto.</p>

<h2>Plazos reducidos que aplican a hondureños</h2>
<p>El Código Civil español contempla reducciones del plazo general de diez años en los siguientes casos:</p>
<ul>
<li><strong>Dos años:</strong> para nacionales de países iberoamericanos —Honduras lo es—, Andorra, Filipinas, Guinea Ecuatorial, Portugal y sefardíes.</li>
<li><strong>Un año:</strong> para quienes hayan nacido en territorio español, quienes no ejercieron la facultad de optar, quienes lleven un año casados con español/a, viudos/as de español/a, y quienes hayan estado bajo tutela de un español.</li>
<li><strong>Cinco años:</strong> para refugiados.</li>
</ul>
<p>Dado que Honduras es un país iberoamericano, <strong>el plazo real para la mayoría de hondureños es de dos años</strong> de residencia legal, continuada e inmediatamente anterior a la solicitud. Este plazo es uno de los más favorables del sistema español.</p>

<h2>Requisitos generales que debe cumplir</h2>
<p>Además del plazo de residencia, el solicitante debe acreditar:</p>
<ul>
<li><strong>Residencia legal e ininterrumpida:</strong> la tarjeta de residencia debe estar vigente al momento de la solicitud y durante todo el período exigido.</li>
<li><strong>Buena conducta cívica:</strong> se valora mediante los antecedentes penales tanto de España como de Honduras, que deben estar libres de condenas por delitos dolosos.</li>
<li><strong>Integración en la sociedad española:</strong> se acredita mediante dos pruebas del Instituto Cervantes: el diploma DELE A2 (conocimiento de español) y la prueba CCSE (conocimientos constitucionales y socioculturales de España). Los nacionales de países hispanohablantes —incluido Honduras— están exentos del DELE A2, pero deben presentar la prueba CCSE.</li>
<li><strong>Medios de vida:</strong> debe demostrar que cuenta con ingresos suficientes para mantenerse, ya sea por trabajo por cuenta ajena, propia o rentas.</li>
</ul>

<h2>Documentación habitual</h2>
<p>El expediente de nacionalidad requiere, como mínimo: formulario oficial de solicitud, pasaporte hondureño vigente, tarjeta de residencia española, certificado de nacimiento hondureño debidamente apostillado, certificado de antecedentes penales de Honduras apostillado, certificado de antecedentes penales de España, certificado de empadronamiento, y certificado de la prueba CCSE del Instituto Cervantes. Dependiendo de la vía (matrimonio, nacimiento en España, etc.), se exigirán documentos adicionales. La validez de los certificados de antecedentes penales es limitada —generalmente tres meses— por lo que conviene coordinar bien las fechas de emisión para que no caduquen durante la tramitación.</p>

<h2>El proceso paso a paso</h2>
<p>La solicitud se presenta telemáticamente ante el Ministerio de Justicia de España. Una vez admitida, el expediente pasa por varias fases: calificación, informe del Ministerio del Interior, posible entrevista con el juez encargado del Registro Civil y, finalmente, resolución. El plazo de resolución puede extenderse por encima de un año, aunque la administración está obligada a resolver en un tiempo razonable. Si la resolución es favorable, el interesado debe jurar o prometer fidelidad al Rey y obediencia a la Constitución y las leyes españolas en un plazo de 180 días.</p>

<p>Para hondureños que también necesiten realizar <a href="/blog/hondurenos-en-espana/poder-desde-espana-para-tramites-honduras">trámites legales en Honduras desde España</a>, recomendamos coordinar ambos procesos para evitar desplazamientos innecesarios.</p>`,
  },

  // ============================================================
  // 7. Contratos mercantiles esenciales - derecho-mercantil
  // ============================================================
  {
    slug: 'contratos-mercantiles-esenciales-empresas-honduras',
    metaTitle: 'Contratos Mercantiles Esenciales en Honduras | Pineda y Asociados',
    metaDescription: 'Conozca los contratos mercantiles que toda empresa en Honduras debe tener: compraventa, distribución, agencia, franquicia y suministro, con cláusulas clave para proteger su negocio.',
    readingTime: '6 min',
    body: `<h2>Por qué los contratos mercantiles protegen su empresa</h2>
<p>Un contrato mercantil bien redactado no es un formalismo: es la herramienta que define qué espera cada parte, qué ocurre si hay incumplimiento y cómo se resuelven las disputas sin necesidad de litigio. En Honduras, el Código de Comercio establece el marco general aplicable a los actos de comercio, pero la mayoría de las reglas concretas dependen de lo que las partes pacten. Un contrato deficiente o verbal deja a la empresa expuesta a interpretaciones imprevistas, costos inesperados y conflictos cuya solución puede ser larga y costosa.</p>

<h2>Contrato de compraventa mercantil</h2>
<p>Es el contrato más frecuente: regula la transferencia de bienes entre comerciantes o entre un comerciante y un consumidor. Las cláusulas que no deben faltar incluyen: descripción precisa del bien, precio y forma de pago, lugar y momento de entrega, transferencia del riesgo, garantías por vicios ocultos, y responsabilidad por evicción. En operaciones internacionales, es esencial definir el INCOTERM aplicable, la ley que rige el contrato y el mecanismo de resolución de controversias. Un error común es usar modelos genéricos de internet que no se ajustan a la legislación hondureña ni a la operación concreta de la empresa.</p>

<h2>Contrato de distribución</h2>
<p>La distribución permite a un fabricante o proveedor colocar sus productos en el mercado a través de un tercero que los comercializa por cuenta propia. Las cláusulas clave incluyen: territorio asignado en exclusiva o no, obligaciones de compra mínima, política de precios de reventa —con cuidado de no incurrir en prácticas restrictivas de la competencia—, uso de marca y material promocional, y causas y consecuencias de la terminación del contrato. La terminación anticipada sin justa causa puede generar indemnización por clientela, concepto que el derecho mercantil hondureño reconoce en ciertas circunstancias.</p>

<h2>Contrato de agencia mercantil</h2>
<p>A diferencia del distribuidor, el agente promueve negocios por cuenta ajena sin asumir el riesgo de la operación. La Ley de Representantes, Distribuidores y Agentes de Honduras regula aspectos como la exclusividad, las comisiones, la obligación de información y la indemnización por terminación unilateral. Este tipo de contrato es frecuente en sectores como seguros, productos farmacéuticos y maquinaria industrial. La ausencia de contrato escrito no significa ausencia de obligaciones: la relación puede probarse por otros medios y la ley suple lo no pactado con disposiciones que pueden no favorecer a la empresa.</p>

<h2>Contrato de franquicia</h2>
<p>La franquicia permite explotar un modelo de negocio probado bajo una marca establecida. Además de las cláusulas comerciales habituales, requiere especial atención a: transmisión de know-how y asistencia técnica, manual de operaciones como parte integrante del contrato, territorio y exclusividad, cánones de entrada y regalías periódicas, obligaciones de confidencialidad y no competencia durante y después del contrato, y causales de resolución. La franquicia no está regulada de forma específica en Honduras, por lo que el contrato se rige por las normas generales del Código de Comercio y por lo que las partes pacten.</p>

<h2>Contrato de suministro</h2>
<p>El suministro obliga a una parte a entregar bienes o servicios de forma periódica y a la otra a pagar un precio por cada entrega. Es común en la industria, la construcción y el sector agrícola. Las cláusulas esenciales incluyen: cantidades mínimas y máximas por período, frecuencia de entrega, especificaciones de calidad, mecanismo de ajuste de precios, y consecuencias del incumplimiento de una entrega individual sobre el contrato en su conjunto. Un aspecto que suele descuidarse es la previsión de fuerza mayor: Honduras está expuesta a fenómenos naturales que pueden interrumpir cadenas de suministro, y el contrato debe contemplarlo.</p>

<p>Para empresas que están iniciando operaciones, recomendamos revisar también la guía sobre <a href="/blog/derecho-mercantil/constitucion-empresas-honduras-pasos-legales">constitución de empresas en Honduras</a> y sobre <a href="/blog/derecho-civil/errores-contratos-civiles-honduras">errores comunes en contratos</a>.</p>`,
  },

  // ============================================================
  // 8. Despido injustificado - derecho-laboral
  // ============================================================
  {
    slug: 'despido-injustificado-honduras-derechos-trabajador',
    metaTitle: 'Despido Injustificado en Honduras: Derechos | Pineda y Asociados',
    metaDescription: 'Si fue despedido sin causa justa en Honduras, conozca sus derechos: indemnización, prestaciones laborales, prueba del despido y cómo reclamar ante la Secretaría de Trabajo.',
    readingTime: '6 min',
    body: `<h2>Qué es un despido injustificado según el Código del Trabajo</h2>
<p>El despido es injustificado cuando el empleador termina la relación laboral sin invocar una causa prevista en el Código del Trabajo de Honduras. La ley enumera de forma taxativa las causas que permiten un despido sin responsabilidad patronal: falta de probidad, actos de violencia, injurias, daños materiales graves, revelación de secretos, abandono de trabajo, inasistencia injustificada y desobediencia grave, entre otras. Si el empleador no puede probar una de estas causas ante la autoridad competente, el despido se considera injustificado y genera obligaciones económicas a favor del trabajador.</p>

<h2>Cuánto le corresponde por despido injustificado</h2>
<p>La indemnización por despido injustificado se suma a las prestaciones laborales que corresponden en cualquier terminación de la relación de trabajo. En términos generales, la ley establece:</p>
<ul>
<li><strong>Indemnización por despido:</strong> el equivalente a un mes de salario por cada año de servicio continuo, con un tope que puede variar según el tiempo laborado y el salario.</li>
<li><strong>Preaviso:</strong> si el empleador no le dio el preaviso que exige la ley, debe pagarle el equivalente al salario del período de preaviso omitido. La duración del preaviso depende de la antigüedad y del tipo de contrato.</li>
<li><strong>Vacaciones proporcionales y aguinaldo proporcional:</strong> derechos adquiridos que deben liquidarse independientemente de la causa del despido.</li>
<li><strong>Cesantía:</strong> se calcula en función del tiempo de servicio y del salario. Puede consultar nuestra guía detallada sobre <a href="/blog/derecho-laboral/calcular-liquidacion-laboral-honduras">cómo calcular la liquidación laboral</a>.</li>
</ul>

<h2>Cómo probar que el despido fue injustificado</h2>
<p>La carga de la prueba corresponde al empleador: es él quien debe demostrar ante el juez de trabajo que el despido se basó en una causa legal. Sin embargo, el trabajador debe estar preparado para acreditar la existencia de la relación laboral —contrato, recibos de pago, carnés, testigos— y la fecha y circunstancias del despido. Si el despido fue verbal, conviene reunir evidencia cuanto antes: mensajes, correos, testigos presenciales o cualquier documento que indique que se le impidió el ingreso al centro de trabajo. Un error frecuente es firmar cualquier documento de renuncia o finiquito sin asesoría previa: una vez firmado, es difícil revertirlo.</p>

<h2>Qué hacer tras un despido injustificado</h2>
<p>El primer paso es acudir a la <strong>Secretaría de Trabajo y Seguridad Social</strong> para intentar una conciliación. En esta instancia administrativa, un inspector de trabajo cita al empleador y busca un acuerdo. Si no hay conciliación, el trabajador puede presentar una demanda ante el <strong>Juzgado de Trabajo</strong> competente —generalmente el del domicilio del empleador o del lugar de la prestación del servicio—. Los plazos para reclamar tienen límites legales, por lo que conviene actuar pronto. La asesoría de un profesional en <a href="/blog/derecho-laboral/despido-laboral-honduras-guia-completa">derecho laboral hondureño</a> puede ayudarle a calcular correctamente lo que le corresponde y a preparar la documentación necesaria antes de cualquier comparecencia.</p>

<h2>Plazos que debe conocer</h2>
<p>Las acciones laborales prescriben en plazos determinados por la ley. El plazo general para reclamar derechos laborales es de dos meses contados desde la terminación del contrato, aunque ciertas prestaciones pueden tener plazos mayores. No espere a que el empleador rectifique por iniciativa propia: si pasan los plazos legales sin reclamar, podría perder el derecho a exigir lo que le corresponde.</p>`,
  },

  // ============================================================
  // 9. Derechos trabajadora embarazada - derecho-laboral
  // ============================================================
  {
    slug: 'derechos-trabajadora-embarazada-honduras',
    metaTitle: 'Derechos de la Trabajadora Embarazada | Pineda y Asociados',
    metaDescription: 'Conozca los derechos laborales de la mujer embarazada en Honduras: fuero maternal, descanso por maternidad, protección contra el despido, lactancia y estabilidad laboral.',
    readingTime: '6 min',
    body: `<h2>Protección especial durante el embarazo y la lactancia</h2>
<p>La legislación laboral hondureña otorga a la trabajadora embarazada una protección reforzada que ninguna empleadora puede ignorar. El Código del Trabajo, la Constitución de la República y los convenios internacionales ratificados por Honduras configuran un sistema de derechos que cubre desde el momento de la concepción hasta el período de lactancia. Esta protección es de orden público: no puede ser renunciada ni limitada por acuerdo entre las partes. El objetivo es garantizar la estabilidad laboral de la madre y la protección del menor en formación y durante sus primeros meses de vida.</p>

<h2>Descanso por maternidad: duración y remuneración</h2>
<p>Toda trabajadora tiene derecho a un descanso por maternidad retribuido. La duración y distribución pueden variar según el régimen aplicable, pero en términos generales comprende varias semanas antes y después del parto. Durante este período, la trabajadora recibe un subsidio a través del <strong>Instituto Hondureño de Seguridad Social (IHSS)</strong>, siempre que esté afiliada y haya cumplido con las semanas de cotización exigidas. Si no está afiliada al IHSS, el empleador debe asumir el pago del salario durante el descanso. Es indispensable presentar el certificado médico que acredite la fecha probable del parto para formalizar el derecho.</p>

<h2>Fuero maternal: qué significa en la práctica</h2>
<p>El fuero maternal es la protección que impide al empleador despedir a la trabajadora durante el embarazo y el período de lactancia sin una autorización previa de la autoridad competente. Esto significa que:</p>
<ul>
<li>El empleador no puede despedirla invocando causas distintas a las legalmente previstas sin antes solicitar autorización ante el juez de trabajo.</li>
<li>Si el despido se produce sin esa autorización, es nulo y la trabajadora tiene derecho a ser reintegrada a su puesto con el pago de los salarios dejados de percibir.</li>
<li>La protección abarca también el período de lactancia, cuya duración está regulada por la ley.</li>
<li>El fuero protege incluso si el empleador desconocía el embarazo al momento del despido: la trabajadora puede acreditar el estado de gravidez con posterioridad y solicitar la nulidad.</li>
</ul>

<h2>Lactancia: tiempo y condiciones</h2>
<p>Durante el período de lactancia, la trabajadora tiene derecho a pausas remuneradas para amamantar a su hijo. La ley establece un tiempo diario que puede dividirse en dos períodos, dentro de la jornada laboral y sin que ello implique reducción salarial. El empleador está obligado a proporcionar un espacio adecuado e higiénico para este fin cuando la empresa tenga un número determinado de trabajadoras. En la práctica, muchas empresas permiten que la trabajadora acumule este tiempo al inicio o al final de la jornada, pero esto requiere acuerdo mutuo.</p>

<h2>Prohibición de exigir prueba de embarazo</h2>
<p>La legislación hondureña prohíbe al empleador exigir pruebas de embarazo como condición para la contratación o para la continuidad en el empleo. Tampoco puede condicionar la renovación de un contrato al estado de gravidez de la trabajadora. Si usted enfrenta una situación de este tipo, puede denunciarla ante la Secretaría de Trabajo. La discriminación por razón de embarazo está expresamente prohibida y puede dar lugar a sanciones administrativas y responsabilidades civiles.</p>

<h2>Qué hacer si sus derechos son vulnerados</h2>
<p>Si el empleador desconoce alguno de estos derechos, la trabajadora puede presentar una reclamación ante la <strong>Secretaría de Trabajo y Seguridad Social</strong> a través de la inspección laboral. También puede acudir al <strong>Juzgado de Trabajo</strong> si la vía administrativa no resuelve el conflicto. La asesoría de un abogado especializado en <a href="/blog/derecho-laboral/despido-laboral-honduras-derechos">derechos laborales en Honduras</a> es recomendable para evaluar la situación y determinar la vía más adecuada, especialmente si ya se ha producido un despido o una amenaza de despido.</p>`,
  },

  // ============================================================
  // 10. Licencia ambiental - derecho-ambiental
  // ============================================================
  {
    slug: 'licencia-ambiental-categorias-plazos-honduras',
    metaTitle: 'Licencia Ambiental en Honduras: Categorías | Pineda y Asociados',
    metaDescription: 'Guía sobre la licencia ambiental en Honduras: categorías de impacto, requisitos de la SERNA, plazos de tramitación y sanciones por operar sin la autorización correspondiente.',
    readingTime: '6 min',
    body: `<h2>Qué es la licencia ambiental y quién necesita obtenerla</h2>
<p>La licencia ambiental es el permiso que otorga la Secretaría de Recursos Naturales y Ambiente (SERNA) —antes MiAmbiente— a los proyectos, obras o actividades que pueden causar impacto en el entorno natural o social. La legislación hondureña exige que ningún proyecto sujeto a evaluación de impacto ambiental pueda iniciar su ejecución sin haber obtenido previamente la licencia correspondiente. Esta obligación aplica tanto a proyectos nuevos como a ampliaciones o modificaciones significativas de proyectos existentes, y cubre sectores tan diversos como la construcción, la industria, la minería, la agricultura intensiva, el turismo y la energía.</p>

<h2>Categorías según el nivel de impacto</h2>
<p>El Reglamento del Sistema Nacional de Evaluación de Impacto Ambiental (SINEIA) clasifica los proyectos en cuatro categorías:</p>
<ul>
<li><strong>Categoría 1 — Bajo impacto:</strong> proyectos que por su naturaleza y escala generan impactos ambientales previsiblemente mínimos. Requieren una <strong>declaración jurada ambiental</strong> y un registro simplificado. El plazo de resolución es relativamente breve. Ejemplos típicos: pequeñas obras de infraestructura, comercios de barrio, oficinas.</li>
<li><strong>Categoría 2 — Impacto moderado:</strong> proyectos que requieren una <strong>Evaluación de Impacto Ambiental (EIA)</strong> detallada. Deben presentar un estudio elaborado por un equipo técnico calificado que analice los impactos y proponga medidas de mitigación. El plazo de tramitación es mayor y puede incluir consultas públicas. Ejemplos: urbanizaciones medianas, plantas de procesamiento, hoteles.</li>
<li><strong>Categoría 3 — Impacto alto:</strong> proyectos con impactos significativos que exigen una EIA completa, medidas de compensación y un plan de gestión ambiental riguroso. La evaluación es más exigente y el plazo más largo. Ejemplos: minería, grandes obras de infraestructura, represas.</li>
<li><strong>Categoría 4 — Impacto muy alto:</strong> proyectos con impactos potencialmente irreversibles. El nivel de escrutinio es máximo, con participación ciudadana obligatoria y estudios complementarios. Ejemplos: proyectos que afectan áreas protegidas o ecosistemas frágiles.</li>
</ul>

<h2>Documentación y estudios requeridos</h2>
<p>El expediente que debe presentarse ante la SERNA varía según la categoría, pero generalmente incluye: formulario oficial de solicitud, documento de identidad o escritura de constitución del proponente, título de propiedad o contrato de arrendamiento del inmueble donde se ejecutará el proyecto, descripción detallada del proyecto, estudio de impacto ambiental (para categorías 2, 3 y 4), plan de medidas de mitigación, y comprobante de pago de la tasa administrativa correspondiente. Los estudios de impacto ambiental deben ser elaborados por profesionales o empresas registradas ante la SERNA.</p>

<h2>Sanciones por operar sin licencia</h2>
<p>Operar un proyecto sin la licencia ambiental correspondiente expone al titular a sanciones administrativas que pueden incluir multas —cuyo monto puede ser significativo en función de la gravedad de la infracción—, suspensión temporal de actividades, clausura definitiva y obligación de restaurar el daño ambiental causado. Además, la ausencia de licencia puede afectar la obtención de otros permisos necesarios para la operación, como licencias municipales de construcción o permisos sanitarios. En casos de daño ambiental grave, puede derivar también en responsabilidad penal para los responsables del proyecto.</p>

<p>Si su proyecto también requiere permisos de construcción o evaluación municipal, puede consultar nuestra guía sobre <a href="/blog/derecho-ambiental/evaluacion-impacto-ambiental-honduras">evaluación de impacto ambiental</a> y sobre <a href="/blog/derecho-administrativo/contratacion-publica-licitaciones-empresas-honduras">contratación pública en Honduras</a> si su proyecto se relaciona con el sector gubernamental.</p>`,
  },

  // ============================================================
  // 11. Mediación vs Juicio - conciliacion-arbitraje
  // ============================================================
  {
    slug: 'mediacion-vs-juicio-que-conviene-mas-honduras',
    metaTitle: 'Mediación vs Juicio en Honduras: Diferencias | Pineda y Asociados',
    metaDescription: 'Compare mediación y juicio en Honduras: costos, duración, confidencialidad y cuándo conviene cada vía según el tipo de conflicto legal. Guía práctica para decidir.',
    readingTime: '6 min',
    body: `<h2>Dos caminos para resolver un conflicto legal</h2>
<p>Cuando surge un conflicto jurídico —una disputa contractual, un problema de familia, una deuda— el instinto suele ser pensar en un juicio. Pero el litigio judicial no es la única vía, ni siempre la más conveniente. La mediación y otros métodos alternos de resolución de conflictos ofrecen una ruta distinta: en lugar de que un juez imponga una decisión, las partes buscan un acuerdo con la ayuda de un tercero neutral. Comprender las diferencias entre ambos caminos ayuda a tomar una decisión informada antes de comprometer tiempo y recursos.</p>

<h2>Qué es la mediación y cómo funciona en Honduras</h2>
<p>La mediación es un procedimiento voluntario y confidencial en el que un mediador imparcial facilita la comunicación entre las partes para que ellas mismas construyan un acuerdo. El mediador no decide quién tiene razón ni impone una solución: su función es ayudar a las partes a identificar sus intereses reales, explorar opciones y redactar un acuerdo que satisfaga a ambas. En Honduras, la mediación puede realizarse en centros de conciliación y arbitraje reconocidos, como el de la Cámara de Comercio e Industrias de Cortés (CCIC), o ante la Secretaría de Trabajo en conflictos laborales. El acuerdo alcanzado en mediación, si se eleva a escritura pública o se homologa judicialmente, tiene fuerza ejecutiva.</p>

<h2>Cuándo conviene la mediación</h2>
<p>La mediación suele ser la mejor opción cuando:</p>
<ul>
<li>Las partes tienen o tendrán una relación continua (socios comerciales, familiares, vecinos) y necesitan preservarla.</li>
<li>El conflicto no es puramente jurídico sino que involucra emociones, percepciones o intereses comerciales que un juez no puede resolver con una sentencia.</li>
<li>La confidencialidad es importante: en mediación nada de lo dicho trasciende al público, mientras que las audiencias judiciales son generalmente públicas.</li>
<li>El costo del litigio es desproporcionado respecto al valor en disputa.</li>
<li>Se necesita una solución rápida: mientras un juicio puede durar más de un año, una mediación puede resolverse en semanas.</li>
</ul>

<h2>Cuándo el juicio es inevitable o preferible</h2>
<p>Hay situaciones en las que la vía judicial es la más adecuada o la única disponible:</p>
<ul>
<li>Cuando una de las partes se niega a participar en mediación o actúa de mala fe, sin intención real de llegar a un acuerdo.</li>
<li>En casos que requieren un pronunciamiento judicial que siente precedente o declare un derecho de forma definitiva.</li>
<li>Cuando existen medidas cautelares urgentes (embargos, prohibiciones de enajenar) que solo un juez puede decretar.</li>
<li>En procesos penales, donde el Estado ejerce la acción penal y la mediación solo es posible en delitos de acción privada o en ciertas condiciones previstas por la ley.</li>
<li>Cuando la ley exige expresamente la intervención judicial (declaraciones de herederos, divorcios contenciosos, interdicción).</li>
</ul>

<h2>Comparativa práctica</h2>
<table>
<thead><tr><th>Aspecto</th><th>Mediación</th><th>Juicio</th></tr></thead>
<tbody>
<tr><td><strong>Quién decide</strong></td><td>Las propias partes mediante acuerdo</td><td>Un juez impone la decisión</td></tr>
<tr><td><strong>Duración aproximada</strong></td><td>Semanas a pocos meses</td><td>Varios meses a más de dos años</td></tr>
<tr><td><strong>Costo</strong></td><td>Generalmente menor; honorarios del mediador compartidos</td><td>Mayor: honorarios de abogado, peritajes, costas procesales</td></tr>
<tr><td><strong>Confidencialidad</strong></td><td>Absoluta: lo tratado no puede usarse en un juicio posterior</td><td>Audiencias públicas, salvo excepciones legales</td></tr>
<tr><td><strong>Resultado</strong></td><td>Acuerdo voluntario con fuerza ejecutiva si se formaliza</td><td>Sentencia obligatoria, sujeta a recursos</td></tr>
</tbody>
</table>

<p>Para conflictos familiares, ofrecemos una guía sobre <a href="/blog/conciliacion-arbitraje/mediacion-familiar-cuando-funciona-honduras">cuándo funciona la mediación familiar en Honduras</a>. Para conflictos comerciales, consulte nuestra guía sobre <a href="/blog/conciliacion-arbitraje/arbitraje-honduras-guia-completa">arbitraje en Honduras</a> como alternativa adicional al litigio.</p>`,
  },

  // ============================================================
  // 12. Preguntas antes de contratar abogado - practica-legal
  // ============================================================
  {
    slug: 'preguntas-frecuentes-antes-contratar-abogado-honduras',
    metaTitle: 'Preguntas Clave Antes de Contratar Abogado | Pineda y Asociados',
    metaDescription: 'Lista de preguntas esenciales que debe hacer antes de contratar un abogado en Honduras: experiencia, honorarios, estrategia y qué esperar del proceso legal.',
    readingTime: '6 min',
    body: `<h2>Por qué las preguntas correctas marcan la diferencia</h2>
<p>Elegir un abogado sin hacer las preguntas adecuadas es como firmar un contrato sin leerlo. La relación abogado-cliente se basa en la confianza, pero la confianza se construye con información. Una primera consulta bien aprovechada le permite evaluar si el profesional tiene la experiencia relevante para su caso, si su estilo de trabajo se ajusta a lo que usted necesita y si los honorarios son claros y previsibles. Estas son las preguntas que conviene plantear —y las razones detrás de cada una— durante esa primera conversación.</p>

<h2>¿Tiene experiencia específica en casos como el mío?</h2>
<p>No todos los abogados dominan todas las áreas. Un penalista con veinte años de trayectoria puede no conocer los detalles de un proceso de divorcio o de una reclamación administrativa. Preguntar por la experiencia concreta en el tipo de asunto que usted tiene —y solicitar ejemplos de casos similares, sin violar la confidencialidad— le da una medida real de la competencia del profesional en esa materia. También es válido preguntar cuánto tiempo lleva ejerciendo y si está colegiado en Honduras con registro profesional vigente.</p>

<h2>¿Cómo se calculan sus honorarios y qué incluyen?</h2>
<p>Entender la estructura de honorarios desde el inicio evita malentendidos. Las modalidades más habituales en Honduras son: honorario fijo por todo el caso, tarifa por hora, porcentaje del resultado (cuota litis, frecuente en reclamaciones de cantidad) y mixto (fijo más variable). Pregunte también qué incluye el honorario: incluye gastos de desplazamiento, fotocopias, tasas judiciales, honorarios de peritos. Si el presupuesto es ajustado, pregunte si existe la posibilidad de un plan de pagos.</p>

<h2>¿Cuál es la estrategia recomendada y cuánto puede durar el proceso?</h2>
<p>Un abogado experimentado debería poder esbozarle, tras una primera revisión de su caso, al menos dos o tres escenarios posibles: el mejor, el peor y el más probable. Pregunte también por los plazos estimados: ninguna duración está garantizada —los tribunales tienen su propio ritmo—, pero una estimación realista le ayuda a planificar. Desconfíe de quien promete resultados garantizados: en derecho, ningún resultado es seguro y quien afirma lo contrario no está siendo honesto.</p>

<h2>¿Quién llevará mi caso directamente?</h2>
<p>En bufetes con varios abogados, la persona que le atiende en la consulta puede no ser quien lleve el día a día de su expediente. Pregunte quién será su abogado de contacto directo, si podrá comunicarse con él por teléfono o mensajería, y con qué frecuencia recibirá información sobre el avance. Un caso abandonado en un cajón durante meses sin comunicación es una de las quejas más frecuentes de los clientes. Establezca expectativas claras desde el principio.</p>

<h2>¿Existen alternativas al litigio?</h2>
<p>Un buen abogado no siempre recomienda demandar de inmediato. Pregunte si existen vías alternativas: una carta de requerimiento extrajudicial, una mediación, una negociación directa con la otra parte. Estas opciones pueden resolver el conflicto más rápido, con menor costo y sin el desgaste de un juicio. Si el abogado descarta todas las alternativas sin explicar por qué, conviene indagar las razones antes de decidir.</p>

<h2>¿Qué documentación debo aportar y qué puedo esperar en cada etapa?</h2>
<p>Saber qué documentos necesita, en qué formato y con qué urgencia evita sorpresas. Pregunte también por las etapas del proceso y qué se espera de usted en cada una: ¿debe comparecer personalmente?, ¿habrá audiencias?, ¿necesitará testigos? Cuanto más informado esté, mejor podrá colaborar con su abogado y más realistas serán sus expectativas. Si desea una guía más amplia, consulte nuestro artículo sobre <a href="/blog/practica-legal/como-elegir-buen-abogado-guia-practica-honduras">cómo elegir un buen abogado en Honduras</a>.</p>`,
  },

  // ============================================================
  // 13. Abogados en Amapala - practica-legal (local)
  // ============================================================
  {
    slug: 'abogados-en-amapala-valle',
    metaTitle: 'Abogados en Amapala, Valle | Asesoría Legal en la Isla del Tigre',
    metaDescription: 'Servicios legales en Amapala, Valle, Honduras: derecho penal, familia, civil y laboral. Atención a residentes y visitantes de la Isla del Tigre y municipios del Golfo de Fonseca.',
    readingTime: '5 min',
    body: `<h2>Asesoría legal cercana en Amapala, Valle</h2>
<p>Amapala es un municipio costero del departamento de Valle, asentado en la Isla del Tigre, en el Golfo de Fonseca. Su actividad portuaria, turística y pesquera genera necesidades jurídicas particulares que no siempre pueden atenderse desde las grandes ciudades. Contar con <strong>abogados en Amapala</strong> que conozcan la dinámica local y puedan desplazarse a la zona es una ventaja para quienes residen, trabajan o tienen negocios en este municipio y sus alrededores.</p>

<h2>Servicios legales frecuentes en la zona</h2>

<h3>Derecho penal y defensa</h3>
<p>Atendemos asuntos penales en todas sus etapas: desde la denuncia y la investigación preliminar hasta la audiencia inicial y el juicio oral. Brindamos orientación inmediata ante citaciones del Ministerio Público, allanamientos o detenciones. También representamos los intereses de víctimas que desean presentar una denuncia y necesitan orientación sobre sus derechos dentro del proceso penal hondureño.</p>

<h3>Derecho de familia</h3>
<p>Ofrecemos asesoría en divorcios de mutuo acuerdo o contenciosos, fijación y modificación de <a href="/blog/derecho-de-familia/pension-alimenticia-honduras-como-solicitarla">pensión alimenticia</a>, régimen de visitas, custodia de menores y declaración de unión de hecho. En comunidades pequeñas, los asuntos de familia suelen requerir especial sensibilidad: trabajamos con discreción y buscamos soluciones que minimicen el conflicto, especialmente cuando hay menores involucrados.</p>

<h3>Derecho civil y propiedad</h3>
<p>La compraventa de inmuebles, la regularización de terrenos, los contratos de arrendamiento y los conflictos de linderos son frecuentes en la zona. Asesoramos en <a href="/blog/derecho-civil/compraventa-inmuebles-aspectos-legales-honduras">compraventa de inmuebles</a>, revisamos la situación registral de la propiedad, redactamos contratos y, cuando es necesario, gestionamos la vía judicial para proteger los derechos de propiedad de nuestros clientes.</p>

<h3>Derecho laboral</h3>
<p>Trabajadores del sector turístico, pesquero y portuario pueden enfrentar despidos, falta de pago de prestaciones o condiciones laborales irregulares. Orientamos tanto a trabajadores como a pequeños empleadores sobre sus derechos y obligaciones según el Código del Trabajo hondureño, incluyendo reclamaciones ante la Secretaría de Trabajo.</p>

<h2>Cobertura y desplazamiento</h2>
<p>Aunque nuestra sede principal está en Nacaome, atendemos regularmente Amapala y otros municipios del departamento de Valle. La comunicación inicial puede realizarse por teléfono, WhatsApp o a través del formulario de contacto en nuestro sitio web. Si su caso requiere presencia física, coordinamos el desplazamiento sin costo adicional de transporte para la primera consulta en la zona.</p>

<h2>Cuándo conviene buscar asesoría legal en Amapala</h2>
<p>Recibir una notificación judicial, ser citado por una autoridad, enfrentar un conflicto de propiedad o necesitar iniciar un trámite de familia son señales claras de que conviene consultar con un abogado. En una isla donde los servicios profesionales pueden ser limitados, tener un contacto legal de confianza evita desplazamientos innecesarios a otras ciudades y permite resolver los asuntos con mayor agilidad. Consulte también nuestra página sobre <a href="/blog/practica-legal/abogados-en-nacaome">abogados en Nacaome</a> si su asunto se relaciona con la cabecera departamental.</p>`,
  },

  // ============================================================
  // 14. Custodia de hijos - derecho-de-familia
  // ============================================================
  {
    slug: 'custodia-hijos-honduras-juez',
    metaTitle: 'Custodia de Hijos en Honduras: Guía Legal | Pineda y Asociados',
    metaDescription: 'Sepa cómo decide un juez la custodia de menores en Honduras: tipos de guarda, criterios judiciales, interés superior del menor y cómo preparar un caso de custodia.',
    readingTime: '6 min',
    body: `<h2>Cómo decide un juez hondureño la custodia de los hijos</h2>
<p>La custodia de los hijos menores de edad es, con frecuencia, el punto más delicado de un proceso de familia. En Honduras, el juez de familia —o el juez de letras con competencia en materia de familia— debe resolver la custodia aplicando un principio rector: el <strong>interés superior del menor</strong>. Este principio, reconocido en la Constitución de la República y en el Código de Familia, obliga al juez a anteponer el bienestar del niño o la niña a cualquier otro interés, incluido el de los padres. No existe una preferencia automática por la madre ni por el padre: cada caso se evalúa sobre la base de sus circunstancias concretas.</p>

<h2>Tipos de custodia que contempla la ley</h2>
<p>El ordenamiento hondureño permite distintas modalidades de custodia:</p>
<ul>
<li><strong>Custodia exclusiva o monoparental:</strong> uno de los progenitores asume la guarda y el cuidado diario del menor, mientras que el otro tiene un régimen de visitas. Es la fórmula más frecuente cuando los padres no conviven y no hay acuerdo para una custodia compartida.</li>
<li><strong>Custodia compartida:</strong> ambos progenitores participan de forma equilibrada en el cuidado diario del menor, alternando períodos de convivencia. Requiere un grado alto de cooperación entre los padres y una logística que no perjudique al menor (proximidad de domicilios, compatibilidad de horarios escolares). El juez la otorga cuando considera que beneficia al menor y que los padres están en condiciones de ejercerla responsablemente.</li>
<li><strong>Custodia a favor de un tercero:</strong> en situaciones excepcionales —padres fallecidos, incapacitados o privados de la patria potestad— la custodia puede atribuirse a abuelos, tíos u otros familiares que garanticen un entorno adecuado para el menor.</li>
</ul>

<h2>Qué evalúa el juez para decidir</h2>
<p>El juez analiza múltiples factores antes de resolver:</p>
<ul>
<li><strong>Capacidad de cada progenitor</strong> para proveer cuidado físico y emocional: alimentación, vivienda, salud, educación y estabilidad afectiva.</li>
<li><strong>Relación afectiva del menor con cada progenitor</strong> y con otros miembros relevantes del entorno familiar (hermanos, abuelos).</li>
<li><strong>Opinión del menor</strong> si tiene suficiente juicio. A partir de determinada edad —generalmente doce años— el juez suele escuchar al menor en entrevista reservada.</li>
<li><strong>Estabilidad del entorno:</strong> domicilio fijo, escuela, rutinas, vínculos sociales. Los cambios bruscos e injustificados suelen desaconsejarse salvo que el entorno actual sea perjudicial.</li>
<li><strong>Antecedentes de violencia doméstica o abuso:</strong> cualquier indicio de maltrato físico, psicológico o sexual es un factor determinante que puede excluir a un progenitor de la custodia.</li>
<li><strong>Disponibilidad real:</strong> horarios laborales, posibilidad de atender al menor en enfermedad, apoyo de red familiar cercana.</li>
</ul>

<h2>Cómo preparar un caso de custodia</h2>
<p>Si va a solicitar la custodia o va a comparecer en un proceso donde se discute, es recomendable:</p>
<ul>
<li>Reunir documentación que acredite su capacidad de cuidado: constancia de trabajo e ingresos, contrato de vivienda o título de propiedad, certificados escolares del menor.</li>
<li>Identificar testigos que puedan declarar sobre su relación con el menor y su idoneidad como progenitor.</li>
<li>No obstaculizar la relación del menor con el otro progenitor, salvo que exista riesgo real y acreditado. Los jueces valoran negativamente la obstrucción injustificada del régimen de visitas.</li>
<li>Mantener un comportamiento procesal correcto: las alegaciones falsas, las descalificaciones sin prueba y la litigación desleal perjudican la credibilidad ante el juez.</li>
<li>Consultar con un abogado de familia antes de tomar decisiones unilaterales que puedan interpretarse como un intento de imponer hechos consumados.</li>
</ul>

<p>Para más información sobre asuntos relacionados, consulte nuestra <a href="/blog/derecho-de-familia/divorcio-honduras-guia-completa">guía completa sobre divorcio en Honduras</a> y sobre la <a href="/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa">pensión alimenticia en Honduras</a>, ya que custodia, alimentos y divorcio suelen tramitarse de forma conjunta.</p>`,
  },

];

// ─── Actualizar en DB ─────────────────────────────────────────
async function main() {
  for (const r of REWRITES) {
    const [existing] = await db.select({ id: blogPosts.id, slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.slug, r.slug));

    if (!existing) {
      console.log(`⚠️  Slug no encontrado: ${r.slug}`);
      continue;
    }

    await db.update(blogPosts)
      .set({
        body: r.body,
        metaTitle: r.metaTitle,
        metaDescription: r.metaDescription,
        readingTime: r.readingTime,
        updatedAt: sql`NOW()`,
      })
      .where(eq(blogPosts.slug, r.slug));

    const words = r.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    console.log(`✅ ${r.slug}: ${words} palabras`);
  }

  console.log(`\n🎯 ${REWRITES.length} posts ALTO reescritos. Ejecute el detector para verificar.`);
}

main().catch(e => { console.error(e); process.exit(1); });

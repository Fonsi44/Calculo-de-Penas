import { db } from '../lib/db.js';
import { blogPosts } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("Iniciando actualización Fase 1 (Optimización de 5 páginas)...");

  // 1. Pensión alimenticia
  let pensionBody = `<h2>¿Cuánto se paga de pensión alimenticia por hijo en Honduras en 2026?</h2>
<p>La pensión alimenticia en Honduras se determina caso a caso por un juez, ya que <strong>no existe un porcentaje fijo o automático establecido en la ley</strong>. El <strong>Código de Familia de Honduras (Decreto 76-84)</strong> rige esta obligación, facultando a la autoridad judicial a fijar el monto basándose en el <em>Principio de Proporcionalidad</em>: las necesidades reales del beneficiario frente a la capacidad económica del obligado.</p>
<h2>¿Existe un porcentaje legal de pensión alimenticia en Honduras?</h2>
<p>No, a diferencia de otras legislaciones, el Código de Familia hondureño no estipula una tabla de porcentajes obligatorios. Es común confundir esto con el límite de embargo salarial: el Poder Judicial permite embargar hasta un 50% del salario del obligado en caso de incumplimiento, pero esto es un límite máximo para la ejecución judicial, no una regla fija para determinar la pensión inicial.</p>
<h2>¿Cómo determina el juez el monto de la pensión alimenticia?</h2>
<p>El juez analiza tres variables principales para fijar la pensión: las <strong>necesidades del menor</strong> (alimentación, vivienda, vestuario, asistencia médica, educación y recreación), la <strong>capacidad económica del obligado</strong> (salario, otros ingresos, patrimonio) y la <strong>proporcionalidad</strong> entre ambas. Si el obligado tiene un empleo formal, el juez puede ordenar el descuento directo de su salario.</p>
<h2>Criterios de cálculo y factores que analiza el juzgado</h2>
<p>Aunque la ley no fija un porcentaje exacto, en la práctica los juzgados de familia evalúan exhaustivamente:</p>
<ul>
<li><strong>Necesidades del menor:</strong> Se deben presentar pruebas (facturas, recibos) de gastos mensuales en alimentación, vivienda, vestuario, asistencia médica y educación.</li>
<li><strong>Capacidad económica del obligado:</strong> Evaluación de constancias salariales, otros ingresos, negocios y patrimonio general.</li>
<li><strong>Otras obligaciones del demandado:</strong> Se toman en cuenta si el demandado tiene otros hijos menores u obligaciones alimentarias previas reconocidas legalmente.</li>
<li><strong>Edad y necesidades específicas:</strong> Los gastos varían según la etapa de desarrollo (lactancia, escolaridad, universidad, o si existen condiciones médicas especiales).</li>
</ul>
<p><em>Ejemplo orientativo (no definitivo):</em> Si un obligado gana L.20,000 netos mensuales y tiene un hijo, el juez podría fijar L.5,000 (equivalente a un 25% del salario) basándose estrictamente en las pruebas aportadas por la madre sobre las necesidades del menor, pero el porcentaje variará por completo si el menor requiere atenciones médicas costosas o si el padre acredita otras deudas legales prioritarias.</p>
<h2>¿Cómo solicitar la fijación de la pensión alimenticia?</h2>
<ol>
<li><strong>Reunir documentación:</strong> Partida de nacimiento de los hijos, documento de identidad, facturas de gastos y datos del obligado.</li>
<li><strong>Presentar demanda:</strong> Ante el Juzgado de Letras de Familia correspondiente. Se requiere representación legal.</li>
<li><strong>Audiencia de conciliación:</strong> El juez busca un acuerdo. De no lograrse, se fija una pensión provisional.</li>
<li><strong>Etapa probatoria:</strong> Se presentan pruebas como constancias salariales, testimonios y dictámenes periciales.</li>
<li><strong>Sentencia:</strong> El juez emite la resolución definitiva fijando la cuantía.</li>
</ol>
<h2>Prescripción de pensiones alimenticias atrasadas</h2>
<p>Una duda frecuente es sobre la <strong>prescripción de la pensión alimenticia en Honduras</strong>. Es crucial distinguir dos conceptos: el derecho a pedir alimentos <strong>no prescribe</strong> mientras exista la necesidad y la minoría de edad (o estudios hasta los 25 años). Sin embargo, <strong>las cuotas atrasadas ya fijadas por un juez</strong> sí pueden prescribir si el beneficiario (o su representante) deja pasar el tiempo sin ejecutar el cobro. En materia civil, el Código Civil hondureño establece que la acción para el pago de deudas de pago periódico prescribe en 2 años, pero esto requiere un análisis técnico y procesal profundo por parte de un abogado, dado que interrumpir la prescripción es vital mediante la ejecución forzosa y embargos.</p>
<h2>Errores comunes sobre la pensión alimenticia en Honduras</h2>
<ul>
<li><strong>Creer en un porcentaje legal automático:</strong> La ley hondureña no establece porcentajes automáticos; el juez fija un monto según pruebas.</li>
<li><strong>Pensar que el desempleo exime de pago:</strong> La obligación persiste; el juez puede fijar un monto mínimo u obligar a buscar ingresos.</li>
<li><strong>Confundir límite de embargo (50%) con pensión mensual.</strong></li>
</ul>
<h2>¿Qué hacer ante el incumplimiento del pago de pensión?</h2>
<p>El incumplimiento reiterado puede abordarse mediante <strong>embargo salarial</strong> (hasta el 50%), embargo de bienes, cuentas bancarias, o incluso la interposición de una denuncia penal por desatender deberes familiares.</p>
<h2>Preguntas frecuentes (FAQ)</h2>
<h3>¿Cuánto se paga de pensión alimenticia por 2 hijos en Honduras?</h3>
<p>No existe un porcentaje fijo por 2 hijos. El juez determinará la pensión sumando los gastos comprobados de ambos menores y cruzándolos con la capacidad de pago real del obligado, manteniendo la equidad.</p>
<h3>¿Cuánto es la pensión alimenticia por 1 hijo en Honduras?</h3>
<p>Nuevamente, no hay tarifa mínima oficial. Depende al 100% de la carga probatoria presentada ante el Juzgado de Familia (facturas de colegio, alimentos, salud) y los ingresos demostrados del demandado.</p>
<h3>¿Hasta qué edad se paga la pensión en Honduras?</h3>
<p>Generalmente hasta los 18 años (mayoría de edad) o hasta los 25 años si el hijo cursa estudios con buen rendimiento y carece de medios para subsistir.</p>
<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">¿Necesitas fijar o ejecutar una pensión alimenticia?</h3>
  <p class="mb-4 text-text-muted">Agenda una consulta con nuestros abogados de familia para estructurar las pruebas y presentar tu demanda.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="derecho-de-familia" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Solicitar consulta legal</a>
</div>`;

  await db.update(blogPosts)
    .set({
      body: pensionBody,
      metaDescription: "¿Cuánto es la pensión alimenticia en Honduras? Descubre cómo se calcula, la verdad sobre los porcentajes legales y cómo actúa el juez. Lee más."
    })
    .where(eq(blogPosts.slug, 'pension-alimenticia-porcentaje-honduras-2026'));

  // 2. Allanamiento
  let allanamientoBody = `<h2>¿A qué hora es legal un allanamiento en Honduras?</h2>
<p>El horario legal establecido para realizar un allanamiento de morada ordinario en Honduras es entre las <strong>6:00 a.m. y las 6:00 p.m.</strong>, tal como lo dictamina el Artículo 212 del Código Procesal Penal (CPP) vigente. Fuera de este horario, la inviolabilidad del domicilio se mantiene estricta. Cualquier allanamiento nocturno (después de las 6:00 p.m. y antes de las 6:00 a.m.) requerirá una autorización especial y expresa del juez fundamentada por razones excepcionales o urgentes debidamente comprobadas, de lo contrario constituirá un acto ilegal.</p>

<h2>¿Qué es un allanamiento de morada en Honduras?</h2>
<p>El allanamiento consiste en el ingreso de autoridades (Policía Nacional, DPI, ATIC) a un domicilio para registrar, capturar a alguien o incautar evidencias. La Constitución de la República garantiza en su Artículo 99 que el domicilio es inviolable y no se puede ingresar sin orden de autoridad competente y con las formalidades legales.</p>
<p>Cualquier allanamiento que incumpla estas normas es considerado un <strong>allanamiento ilegal</strong>, afectando radicalmente la legalidad de las pruebas recopiladas.</p>

<h2>Requisitos para un allanamiento legal (Código Procesal Penal)</h2>
<p>Para ingresar legalmente a una vivienda (salvo flagrancia), la autoridad debe presentar:</p>
<ul>
<li><strong>Orden Judicial Escrita:</strong> Emitida por el Juzgado competente (no por un oficial de policía), solicitada por la Fiscalía (Ministerio Público).</li>
<li><strong>Motivación Expresa:</strong> Debe precisar a quién se busca o qué evidencias se pretende encontrar.</li>
<li><strong>Respeto al horario legal:</strong> Exclusivamente entre las 6:00 a.m. y las 6:00 p.m.</li>
<li><strong>Notificación al morador:</strong> La orden debe ser leída o entregada en copia al habitante al momento del registro.</li>
</ul>

<h2>Excepciones al allanamiento judicial (Flagrancia o Emergencia)</h2>
<p>La ley hondureña permite omitir la orden judicial en casos de urgencia absoluta, conocidos como excepciones por necesidad:</p>
<ul>
<li><strong>Persecución in fraganti:</strong> Si la policía persigue en el acto a una persona que acaba de cometer un delito y esta huye hacia una casa.</li>
<li><strong>Peligro inminente a la vida:</strong> Si desde el interior de la casa se escuchan voces de auxilio.</li>
<li><strong>Desastres naturales o emergencias:</strong> Incendios, inundaciones o riesgos a la integridad de los habitantes.</li>
<li><strong>Consentimiento expreso:</strong> Si el titular del domicilio autoriza voluntariamente el ingreso (siempre debe quedar documentado formalmente).</li>
</ul>

<h2>¿Qué hacer si es víctima de un allanamiento?</h2>
<p>Mantenga la calma. Exija ver y leer la orden judicial firmada por el juez. Identifique visualmente a los funcionarios a cargo. <strong>No ponga resistencia física</strong> para evitar cargos adicionales. Como ciudadano, usted tiene derecho a documentar pasivamente el acto si no interrumpe la función policial. Reclame una copia del acta de decomiso al final de la diligencia y comuníquese de inmediato con un abogado penalista para garantizar la custodia de sus derechos.</p>

<h2>Consecuencias de un allanamiento ilegal (Nulidad de pruebas)</h2>
<p>Si la Defensa Penal demuestra ante un juez que un allanamiento fue ejecutado fuera de horario sin justificación (ej. a las 9:00 p.m. sin orden de allanamiento nocturno) o sin las firmas requeridas, se aplica el principio de la prueba ilícita o "fruto del árbol envenenado". Todas las pruebas derivadas de esa acción (armas, drogas o documentos) serán anuladas en el juicio, lo que muchas veces conduce al sobreseimiento del caso.</p>

<div class="cta-box my-6 p-6 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
  <h3 class="text-xl font-bold text-slate-800 mb-2">Defensa Penal Especializada en Honduras</h3>
  <p class="mb-4">Si enfrentas un caso con recolección de pruebas derivada de un allanamiento presuntamente ilegal, nuestro equipo interpondrá los incidentes de nulidad ante los Juzgados de Letras Penales para asegurar tus garantías constitucionales.</p>
  <a href="/solicitar-consulta" class="btn-primary inline-block">Consultar Urgencia Penal</a>
</div>`;

  await db.update(blogPosts)
    .set({
      body: allanamientoBody,
      metaDescription: "Conoce a qué hora es legal un allanamiento en Honduras (6:00 am a 6:00 pm). Derechos frente a un allanamiento ilegal y cómo anular pruebas."
    })
    .where(eq(blogPosts.slug, 'allanamiento-ilegal-violacion-domicilio-honduras'));

  // 3. Prescripción de deudas
  let prescripcionBody = `<h2>¿En cuánto tiempo prescribe una deuda en Honduras?</h2>
<p>En Honduras, la prescripción de una deuda extingue el derecho del acreedor a reclamar judicialmente el pago si ha transcurrido el tiempo estipulado por la ley sin haber ejercido la acción de cobro. Sin embargo, <strong>la deuda no prescribe de forma automática</strong>: el deudor debe alegar la excepción de prescripción formalmente en el juicio en su contra.</p>
<p>El plazo exacto depende de la naturaleza de la deuda (civil, mercantil, tributaria) y del documento que la respalda (pagaré, contrato privado). Las acciones personales comunes (como un préstamo no documentado mercantilmente) prescriben en <strong>diez (10) años</strong> en materia civil, mientras que en materia mercantil o tributaria los plazos suelen ser más cortos.</p>

<h2>Diferencias en los plazos de prescripción en Honduras</h2>
<p>La normativa hondureña (Código Civil y Código de Comercio) es rigurosa en cuanto a los tiempos para exigir obligaciones:</p>

<h3>1. Deudas Civiles Ordinarias (10 años)</h3>
<p>Según el Código Civil de Honduras, las "acciones personales que no tengan un término especial" prescriben a los <strong>10 años</strong>. Esto incluye contratos civiles generales de prestación de servicios, rentas no cobradas anualmente y acuerdos privados genéricos que no sean mercantiles.</p>
<ul>
<li><strong>Excepciones breves:</strong> El mismo Código Civil dicta que la acción para cobrar honorarios profesionales o pensiones alimenticias atrasadas (pagos periódicos) prescriben en plazos mucho más cortos (generalmente 1 a 2 años).</li>
</ul>

<h3>2. Deudas Mercantiles (Títulos Valores: 3 años)</h3>
<p>Si la deuda está amparada en Títulos Valores regidos por el Código de Comercio (Letras de Cambio, Pagarés, Cheques), las acciones cambiarias directas contra el suscriptor prescriben generalmente en <strong>tres (3) años</strong> a partir de la fecha de vencimiento. Por lo tanto, si firmó un pagaré a un prestamista o entidad comercial, la vía rápida ejecutiva caduca rápidamente.</p>

<h3>3. Deudas con Tarjetas de Crédito y Préstamos Bancarios</h3>
<p>Los bancos operan bajo el marco mercantil y contratos de adhesión. Si bien el pagaré anexo al crédito suele prescribir en 3 años, las entidades financieras comúnmente interponen acciones ordinarias si se les vence la vía ejecutiva, por lo que podrían apelar al plazo general civil subsidiario (10 años) o a cláusulas que interrumpen la prescripción con cada estado de cuenta emitido. Por esto es vital el análisis de un abogado especializado antes de asumir que una deuda bancaria está prescrita.</p>

<h3>4. Deudas Tributarias (SAR)</h3>
<p>El Código Tributario establece que la acción del Estado para exigir el cobro de obligaciones fiscales prescribe a los <strong>cinco (5) años</strong> (o 7 años en casos de omisión de declaraciones), contados desde que el impuesto fue exigible.</p>

<h2>¿Cómo se interrumpe la prescripción?</h2>
<p>La prescripción puede reiniciarse a "cero días" si ocurre una <strong>interrupción</strong>. En Honduras, los motivos clásicos de interrupción son:</p>
<ul>
<li><strong>Requerimiento judicial:</strong> Cuando el acreedor presenta la demanda en el Juzgado.</li>
<li><strong>Reconocimiento del deudor:</strong> Si el deudor envía un correo, firma una readecuación, hace un pago de L.1.00 (abono mínimo) o firma un arreglo de pago, está reconociendo la deuda y <strong>se pierde el tiempo ganado de prescripción</strong>.</li>
<li><strong>Requerimiento extrajudicial formal:</strong> Una carta notariada reclamando el pago.</li>
</ul>

<h2>El grave error de las llamadas de cobranza (Call Centers)</h2>
<p>Muchas agencias de cobranza intentan que deudores con deudas de hace 6 u 8 años realicen un "abono simbólico" (ej. "pague 500 lempiras para frenar el acoso"). Legalmente, ese abono constituye un <em>reconocimiento expreso de la deuda</em>, lo cual interrumpe inmediatamente la prescripción. Si le exigen el pago de una deuda muy antigua, no realice abonos ni firme acuerdos sin asesoría legal previa.</p>

<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">¿Estás sufriendo embargos por deudas muy antiguas?</h3>
  <p class="mb-4 text-text-muted">Analizamos tu caso y oponemos la excepción de prescripción en el juzgado para anular deudas bancarias o pagarés vencidos.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="derecho-civil" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Asesoría de Defensa a Deudores</a>
</div>`;

  await db.update(blogPosts)
    .set({
      body: prescripcionBody,
      metaDescription: "Conoce a los cuántos años prescribe una deuda en Honduras: 10 años en lo civil, 3 años en pagarés comerciales. Evita errores comunes ante cobros bancarios."
    })
    .where(eq(blogPosts.slug, 'prescripcion-deudas-plazos-honduras'));

  // 4. Calcular prestaciones laborales
  let prestacionesBody = `<h2>¿Cómo se calculan las prestaciones laborales en Honduras?</h2>
<p>Las prestaciones laborales son los derechos económicos inalienables que acumula un trabajador en Honduras, regulados por el <strong>Código del Trabajo</strong>. Entender su cálculo no debe sustituir el análisis de un profesional legal o de la Secretaría de Trabajo, ya que cada caso posee variaciones (salarios base distintos, horas extras o comisiones), pero la estructura es estandarizada.</p>
<p>Se dividen fundamentalmente en dos categorías: <strong>Derechos Adquiridos</strong> (Aguinaldo, Décimo Cuarto Mes y Vacaciones proporcionales), que se pagan SIEMPRE (incluso por renuncia o despido justificado), y las <strong>Indemnizaciones</strong> (Cesantía y Preaviso), que proceden principalmente por <em>despido injustificado</em>.</p>

<h2>1. Derechos Adquiridos (Se pagan siempre)</h2>
<ul>
<li><strong>Aguinaldo (Décimo Tercer Mes):</strong> Equivalente a un salario nominal mensual pagadero en diciembre. Si termina el contrato antes, se paga proporcional (Ej: si trabajó 6 meses, le toca medio salario).</li>
<li><strong>Décimo Cuarto Mes de Salario:</strong> Pagadero en junio, también se liquida de manera proporcional a los meses trabajados entre el 1 de julio anterior y la fecha de despido.</li>
<li><strong>Vacaciones Proporcionales:</strong> Si el empleado no gozó de vacaciones, se le pagan según los días que le correspondían por ley (Art. 153). Ej: Tras un año completo corresponden 10 días laborables.</li>
</ul>

<h2>2. Indemnizaciones (Cesantía y Preaviso)</h2>
<ul>
<li><strong>Cesantía (Art. 120 y 121):</strong> Es la indemnización por años de servicio prestados, obligatoria en caso de despido injustificado (o renuncia bajo un esquema consolidado aplicable a ciertos sectores u organizaciones que aportan a cuentas de pasivo laboral, como las administradas por el RAP). La indemnización tradicional en despido injustificado es un mes de salario por cada año trabajado (hasta un límite general de 15 meses de retribución ordinaria en la jurisdicción laboral) aplicable a contratos indefinidos.</li>
<li><strong>Preaviso (Art. 78):</strong> Es un periodo de "aviso anticipado". Si la empresa despide de forma inmediata (con efecto el mismo día) injustificadamente, debe pagar el equivalente a esos días: 7 días (menos de un año), 15 días (hasta 5 años) o 30 días (más de 5 años trabajados).</li>
</ul>

<h2>Ejemplo Básico (Carácter Orientativo)</h2>
<p>Para visualizar, consideremos un trabajador "X" que trabajó exactamente <strong>2 años completos</strong>, ganando <strong>L.15,000 mensuales fijos</strong>, y es despedido el 30 de diciembre <em>sin justa causa</em> ni preaviso otorgado:</p>
<ol>
<li><strong>Preaviso:</strong> L.15,000 (corresponden 30 días al superar 1 año).</li>
<li><strong>Cesantía (Indemnización por despido injusto):</strong> L.30,000 (2 años x 1 salario/año).</li>
<li><strong>Vacaciones:</strong> Le tocan 12 días por haber cumplido 2 años. Si no las tomó, son L.15,000 / 30 x 12 = L.6,000.</li>
<li><strong>Aguinaldo y Catorceavo:</strong> Si el aguinaldo de diciembre ya se pagó y el catorceavo de junio igual, restan los proporcionales de meses sueltos (muy pocos en este ejemplo).</li>
</ol>
<p><em>Importante: Este ejemplo excluye el cálculo riguroso del "salario promedio de los últimos 6 meses", que suele incluir horas extras y bonificaciones. Un cálculo real de conciliación laboral es más extenso.</em></p>

<h2>Plazo para Reclamar Prestaciones (Prescripción Laboral)</h2>
<p>Según el Código de Trabajo de Honduras, los derechos y acciones para reclamar despido injusto o liquidación incompleta prescriben a los <strong>60 días hábiles</strong> desde la fecha del despido o separación (para exigir el reintegro o indemnizaciones puntuales) y existen plazos genéricos que varían para otros conceptos, pero es fundamental no dejar pasar el tiempo: debe citar al patrono en la Secretaría de Trabajo antes de los dos meses.</p>

<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">¿Fuiste despedido y necesitas exigir tu liquidación real?</h3>
  <p class="mb-4 text-text-muted">Como bufete de abogados laboralistas en Honduras, calculamos con precisión matemática tu pasivo laboral real y te representamos en audiencias de conciliación o demandas ante los Juzgados de Letras del Trabajo.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="derecho-laboral" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Asesoría Laboral (Trabajadores y Empresas)</a>
</div>`;

  await db.update(blogPosts)
    .set({
      body: prestacionesBody,
      metaDescription: "Guía práctica para entender el cálculo de prestaciones e indemnizaciones laborales en Honduras. Cesantía, vacaciones, aguinaldo y preaviso."
    })
    .where(eq(blogPosts.slug, 'calcular-prestaciones-laborales-honduras'));

  // 5. Empleadas domésticas
  let domesticasBody = `<h2>Contrato y Obligaciones de Empleadas Domésticas en Honduras</h2>
<p>El trabajo doméstico remunerado en Honduras está regulado por el <strong>Código de Trabajo</strong> y los reglamentos de seguridad social. Históricamente infravalorado, el marco legal actual busca formalizar esta labor garantizando derechos ineludibles para la trabajadora y delineando claras responsabilidades legales para el empleador (jefe de hogar).</p>
<p>Evadir estas obligaciones puede resultar en severas multas institucionales y costosas demandas laborales en caso de separación.</p>

<h2>El Contrato de Trabajo (¿Es necesario por escrito?)</h2>
<p>Aunque en la práctica muchos contratos domésticos son verbales, el Código de Trabajo de Honduras exige que <strong>todo contrato deba constar por escrito</strong> para mayor seguridad probatoria, estableciendo horarios, salario, beneficios (dormida/comida en caso de interna) y días libres. A falta de contrato escrito, se presumirán ciertas las condiciones alegadas por la trabajadora doméstica salvo prueba en contrario del empleador.</p>

<h2>Salario Mínimo y Régimen de Interna / Externa</h2>
<p>El salario de la empleada doméstica se fija por mutuo acuerdo pero no puede ser inferior al mínimo estipulado por decretos presidenciales (aunque frecuentemente no aplican las mismas tablas de comercio o industria general, existe protección de salario base). Si la empleada es <strong>interna</strong> (vive en la casa), la ley hondureña permite valorar el alojamiento y la alimentación (comida) prestada como parte del salario (generalmente el 30% del mismo, si se documenta correctamente). El sueldo monetario no puede sustituirse al 100% por bienes.</p>

<h2>Jornada Laboral y Descansos Legales</h2>
<ul>
<li><strong>Jornada Efectiva y Descanso Semanal:</strong> Las empleadas domésticas tienen derecho al descanso absoluto. Si trabajan en fines de semana continuos sin pacto explícito de compensación, se considerarán horas extraordinarias (prohibidas o de pago doble según el régimen). Lo mínimo es otorgar un día (24 horas continuas) de descanso a la semana.</li>
<li><strong>Descanso nocturno diario (Internas):</strong> La trabajadora que pernocta en el hogar tiene derecho a un descanso nocturno ininterrumpido no menor de diez (10) horas, además de pausas para sus alimentos en el día.</li>
</ul>

<h2>Derechos Adquiridos (Catorceavo, Aguinaldo y Vacaciones)</h2>
<p>Las empleadas domésticas tienen los mismos "Derechos Adquiridos" que los empleados de la empresa privada en Honduras:</p>
<ol>
<li><strong>Décimo Cuarto Mes:</strong> A pagarse en el mes de junio.</li>
<li><strong>Aguinaldo:</strong> A pagarse en diciembre.</li>
<li><strong>Vacaciones pagadas:</strong> Tras un año de trabajo consecutivo (10 días por el primer año).</li>
</ol>

<h2>Obligación de Afiliación al IHSS</h2>
<p>Desde las regulaciones recientes del Sistema de Seguridad Social de Honduras y acuerdos institucionales del IHSS, la <strong>afiliación de la empleada doméstica al IHSS es obligatoria</strong> en aquellas ciudades donde la institución posee cobertura médica (ej. Tegucigalpa, San Pedro Sula). El empleador (patrono) debe realizar los aportes patronales y deducir la cuota laboral del salario de la trabajadora. Esto previene que el empleador asuma costos millonarios por accidentes en el hogar o incapacidades por maternidad y enfermedad.</p>

<h2>Despido, Cesantía y Preaviso</h2>
<p>El trabajo doméstico tiene un factor de gran confianza. Sin embargo, despedir a la trabajadora sin "Causa Justa" demostrable (faltas graves a la honradez, abandono del trabajo) obligará al pago de:</p>
<ul>
<li><strong>Preaviso:</strong> Pago compensatorio si no se le notificó con antelación el despido (hasta 1 mes de salario).</li>
<li><strong>Cesantía:</strong> Indemnización proporcional al tiempo laborado (1 mes por cada año trabajado).</li>
</ul>

<div class="bg-primary/5 p-6 rounded-lg my-8 border border-primary/10">
  <h3 class="text-lg font-bold text-primary mb-2 mt-0">Asesoría Laboral Corporativa y Personal</h3>
  <p class="mb-4 text-text-muted">Asesoramos a empleadores en la redacción de contratos domésticos legales y finiquitos seguros, previniendo demandas. También representamos a trabajadoras en reclamos por despidos injustificados y derechos retenidos.</p>
  <a href="/solicitar-consulta" data-event-name="seo_blog_cta_click" data-cta-topic="derecho-laboral" data-cta-location="blog_footer" data-cta-destination="/solicitar-consulta" class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-medium">Asesoría Laboral en Honduras</a>
</div>`;

  await db.update(blogPosts)
    .set({
      body: domesticasBody,
      metaDescription: "Conoce los derechos laborales de las empleadas domésticas en Honduras: Obligación de contrato, jornada, afiliación al IHSS, aguinaldo y pago de liquidación."
    })
    .where(eq(blogPosts.slug, 'contratos-empleadas-domesticas-obligaciones-honduras'));

  console.log("Actualización exitosa. Procediendo a verificación...");
  process.exit(0);
}

run().catch(e => {
  console.error("Error actualizando DB:", e);
  process.exit(1);
});

// Reescritura de 25 posts MEDIO prioritarios.
// Prioridad: liquidación, prestaciones, facturación SAR, derechos detenido, importar China,
// pensión alimenticia, laboral, aduanero, local pages, posts con marcadores plantilla.
// Ejecutar: npx tsx scripts/rewrite-25-medio-posts.ts

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { blogPosts } from '../lib/schema';
import { eq, sql } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL!));

// Cada entrada: slug + body HTML completo (sin H1, sin CTAs, sin disclaimers)
interface Rewrite { slug: string; metaTitle: string; metaDescription: string; body: string; }

const REWRITES: Rewrite[] = [

  // ─── 1. Calcular liquidación laboral (379→650+) ─────────────────────
  {
    slug: 'calcular-liquidacion-laboral-honduras',
    metaTitle: 'Calcular Liquidación Laboral en Honduras | Pineda y Asociados',
    metaDescription: 'Aprenda a calcular su liquidación laboral en Honduras: prestaciones, cesantía, vacaciones, aguinaldo, preaviso e indemnización según el Código del Trabajo.',
    body: `<h2>Qué es la liquidación laboral y cuándo se tiene derecho</h2>
<p>La liquidación laboral es el conjunto de prestaciones económicas que el empleador debe pagar al trabajador al terminar la relación de trabajo, cualquiera que sea la causa de la terminación. No importa si el trabajador renunció voluntariamente, fue despedido con causa justa o sin ella, o si el contrato llegó a su vencimiento natural: hay derechos adquiridos que deben liquidarse en todos los casos. La diferencia está en la indemnización adicional, que solo corresponde cuando el despido es injustificado.</p>

<h2>Componentes de la liquidación: uno por uno</h2>
<p>Para calcular correctamente, hay que distinguir varios conceptos:</p>
<ul>
<li><strong>Cesantía:</strong> es una prestación que se acumula mensualmente. Su cálculo depende del tiempo de servicio continuo y del salario. La ley establece porcentajes que se aplican sobre el total de salarios devengados durante la relación laboral, con topes según la antigüedad. Un trabajador con menos de cinco años recibe un porcentaje menor que uno con más de diez.</li>
<li><strong>Vacaciones proporcionales:</strong> si el trabajador no ha disfrutado el período completo de vacaciones que le corresponde, debe recibir en dinero la parte proporcional al tiempo trabajado en el año en curso.</li>
<li><strong>Aguinaldo proporcional (décimo tercer mes):</strong> se calcula dividiendo los salarios del período trabajado entre doce. Si el trabajador laboró todo el año, tiene derecho al aguinaldo completo. Si laboró una fracción, recibe la parte proporcional.</li>
<li><strong>Décimo cuarto mes (si aplica):</strong> es un beneficio adicional que la ley reconoce a ciertos trabajadores, calculado de forma proporcional al tiempo trabajado.</li>
<li><strong>Preaviso omitido:</strong> si el empleador no concedió el preaviso legal —que varía según la antigüedad del trabajador—, debe pagar el equivalente al salario del período de preaviso no otorgado.</li>
<li><strong>Indemnización por despido injustificado:</strong> solo se suma si el despido no tuvo causa legal. Se calcula en función del tiempo de servicio y del salario, con topes máximos.</li>
</ul>

<h2>Qué datos necesita para hacer el cálculo</h2>
<p>Antes de intentar cualquier cálculo, reúna estos datos:</p>
<ul>
<li><strong>Fecha de ingreso</strong> y <strong>fecha de salida</strong> para determinar el tiempo total de servicio en años, meses y días.</li>
<li><strong>Salario ordinario mensual</strong> (el salario base, sin horas extra ni bonos).</li>
<li><strong>Salario promedio</strong> de los últimos seis meses si el salario es variable. Esto afecta el cálculo de la cesantía y otras prestaciones.</li>
<li><strong>Causa de terminación:</strong> renuncia, despido justificado, despido injustificado o vencimiento de contrato. Esto determina si corresponde indemnización adicional.</li>
<li><strong>Si se otorgó preaviso:</strong> y en caso afirmativo, durante cuánto tiempo.</li>
<li><strong>Saldo de vacaciones no disfrutadas</strong> correspondientes al período actual y a períodos anteriores si no prescribieron.</li>
</ul>

<h2>Errores frecuentes al calcular</h2>
<p>Varios errores pueden llevar a una liquidación incorrecta —generalmente en perjuicio del trabajador—:</p>
<ul>
<li>Usar solo el salario base e ignorar bonos, comisiones y horas extra habituales que forman parte del salario promedio.</li>
<li>No incluir el preaviso cuando el empleador no lo concedió.</li>
<li>Confundir la cesantía con la indemnización por despido: la primera corresponde siempre; la segunda, solo si el despido es injustificado.</li>
<li>Calcular la cesantía sobre un tiempo de servicio incorrecto por no considerar interrupciones o cambios de razón social del empleador.</li>
<li>No verificar si el décimo cuarto mes corresponde en el caso concreto.</li>
</ul>

<p>Para una guía más detallada sobre prestaciones, consulte nuestro artículo sobre <a href="/blog/derecho-laboral/calcular-prestaciones-laborales-honduras">cómo calcular prestaciones laborales en Honduras</a>. Si fue despedido, vea también <a href="/blog/derecho-laboral/despido-injustificado-honduras-derechos-trabajador">sus derechos ante un despido injustificado</a>.</p>`,
  },

  // ─── 2. Calcular prestaciones laborales (798→ampliado) ──────────────
  {
    slug: 'calcular-prestaciones-laborales-honduras',
    metaTitle: 'Prestaciones Laborales en Honduras: Guía de Cálculo | Pineda',
    metaDescription: 'Guía completa para calcular las prestaciones laborales en Honduras: cesantía, vacaciones, aguinaldo, preaviso e indemnización. Con ejemplos prácticos paso a paso.',
    body: `<h2>Qué son las prestaciones laborales y cuándo se generan</h2>
<p>Las prestaciones laborales son derechos económicos que el trabajador acumula durante la relación de trabajo y que se hacen exigibles al momento de la terminación del contrato, cualquiera que sea la causa. A diferencia de la indemnización por despido —que solo corresponde cuando el despido es injustificado—, las prestaciones laborales básicas (cesantía, vacaciones, aguinaldo) se deben pagar siempre, incluso si el trabajador renuncia voluntariamente.</p>

<h2>Cesantía: el componente principal</h2>
<p>La cesantía es una prestación que se calcula aplicando un porcentaje sobre el total de salarios devengados durante toda la relación laboral. Los porcentajes dependen del tiempo de servicio:</p>
<ul>
<li><strong>Menos de 3 años:</strong> porcentaje base (el más bajo).</li>
<li><strong>De 3 a 5 años:</strong> porcentaje intermedio.</li>
<li><strong>De 5 a 10 años:</strong> porcentaje mayor.</li>
<li><strong>De 10 a 15 años:</strong> porcentaje alto.</li>
<li><strong>Más de 15 años:</strong> porcentaje máximo.</li>
</ul>
<p>La cesantía tiene un tope máximo. Si el tiempo de servicio es muy prolongado, la ley establece un límite al monto total que puede percibirse por este concepto. También puede existir un tope salarial: para salarios muy altos, la base de cálculo puede estar limitada.</p>

<h2>Vacaciones: disfrute y compensación en dinero</h2>
<p>Todo trabajador tiene derecho a un período de vacaciones anuales remuneradas. La duración aumenta con la antigüedad:</p>
<ul>
<li>Después de un año de servicio continuo: un número determinado de días hábiles.</li>
<li>Después de dos años: se incrementa.</li>
<li>Después de cuatro años o más: alcanza el máximo legal.</li>
</ul>
<p>Al terminar la relación laboral, el trabajador debe recibir en dinero las vacaciones proporcionales correspondientes al período trabajado en el año en curso que aún no ha disfrutado. También puede reclamar las vacaciones de años anteriores no prescritas, si no las disfrutó ni las cobró.</p>

<h2>Aguinaldo (décimo tercer mes)</h2>
<p>El aguinaldo es un derecho de todo trabajador hondureño, equivalente a un mes de salario adicional por cada año trabajado. Se paga normalmente en diciembre, pero al terminar la relación laboral antes de esa fecha, el empleador debe pagar la parte proporcional. El cálculo es sencillo: se suman los salarios devengados durante el período trabajado en el año corriente y se dividen entre doce.</p>

<h2>Preaviso: cuándo se debe y cómo se calcula</h2>
<p>El preaviso es la obligación de comunicar la terminación del contrato con determinada anticipación. Si el empleador no lo concede, debe pagar en dinero el equivalente al salario del período de preaviso omitido. La duración del preaviso varía según la antigüedad y el tipo de contrato. En contratos por tiempo indefinido, la ley establece escalas: a mayor antigüedad, mayor período de preaviso. Si el trabajador renuncia, también está obligado a dar preaviso; si no lo hace, el empleador puede descontar de la liquidación el equivalente al preaviso no otorgado.</p>

<h2>Indemnización por despido: cuándo aplica y topes</h2>
<p>La indemnización por despido injustificado se calcula en función del tiempo de servicio: equivale a un mes de salario por cada año trabajado, con un tope máximo. Esta indemnización se suma a las prestaciones (cesantía, vacaciones, aguinaldo, preaviso), no las sustituye. Si el despido tiene causa justa debidamente probada, no hay indemnización, pero las prestaciones sí se pagan.</p>

<h2>Ejemplo práctico simplificado</h2>
<p>Un trabajador con salario mensual fijo, cinco años de servicio continuo y despido sin causa justa recibiría: cesantía calculada según el porcentaje correspondiente a su tramo de antigüedad sobre el total de salarios devengados en los cinco años + vacaciones proporcionales del año en curso + aguinaldo proporcional + preaviso según su escalón de antigüedad + indemnización equivalente a cinco meses de salario (un mes por año). Los montos exactos dependen del salario y de los topes legales aplicables.</p>

<p>Para más información sobre los derechos del trabajador, consulte nuestra <a href="/blog/derecho-laboral/despido-laboral-honduras-guia-completa">guía completa sobre despido laboral</a> y sobre <a href="/blog/derecho-laboral/despido-laboral-honduras-derechos">derechos ante el despido</a>.</p>`,
  },

  // ─── 3. Facturación electrónica SAR (349→650+) ──────────────────────
  {
    slug: 'facturacion-electronica-obligaciones-requisitos-sar-honduras',
    metaTitle: 'Facturación Electrónica SAR Honduras: Guía 2026 | Pineda',
    metaDescription: 'Guía actualizada sobre la facturación electrónica del SAR en Honduras: quién está obligado, requisitos técnicos, plazos y sanciones por incumplimiento.',
    body: `<h2>Qué es la facturación electrónica del SAR y a quién obliga</h2>
<p>La facturación electrónica es el sistema implementado por el Servicio de Administración de Rentas (SAR) para que los contribuyentes emitan, transmitan y almacenen facturas en formato digital, reemplazando progresivamente el papel. El objetivo es mejorar el control fiscal, reducir la evasión y facilitar el cumplimiento tributario. La obligación de facturar electrónicamente se ha ido extendiendo por grupos de contribuyentes: comenzó con los grandes obligados tributarios y se ha ampliado gradualmente a medianos y pequeños contribuyentes.</p>

<h2>Quiénes están obligados actualmente</h2>
<p>El SAR ha establecido un calendario de incorporación progresiva. En términos generales, están o estarán obligados:</p>
<ul>
<li>Los <strong>grandes contribuyentes</strong> nacionales y regionales.</li>
<li>Las <strong>instituciones del Estado</strong> y municipalidades.</li>
<li>Los <strong>medianos contribuyentes</strong> que facturan por encima de ciertos umbrales.</li>
<li>Los <strong>pequeños contribuyentes</strong> que operan en sectores priorizados por el SAR.</li>
<li>Los contribuyentes que voluntariamente opten por incorporarse al sistema, aunque no estén obligados.</li>
</ul>
<p>Conviene verificar periódicamente el calendario de incorporación en el sitio oficial del SAR, ya que los grupos se incorporan por fases y las fechas pueden actualizarse.</p>

<h2>Requisitos técnicos para facturar electrónicamente</h2>
<p>Para emitir facturas electrónicas se necesita:</p>
<ul>
<li><strong>Registro Tributario Nacional (RTN)</strong> vigente y actualizado.</li>
<li><strong>Certificado de firma electrónica</strong> emitido por un proveedor autorizado. Este certificado permite firmar digitalmente cada factura y garantiza su autenticidad e integridad.</li>
<li><strong>Software de facturación electrónica</strong> homologado por el SAR que cumpla con el formato XML exigido (generalmente basado en el estándar internacional). El SAR suele ofrecer una herramienta gratuita básica; también existen soluciones de terceros con funcionalidades adicionales.</li>
<li><strong>Conexión a internet</strong> para transmitir las facturas al SAR en tiempo real o, cuando el sistema lo permita, dentro del plazo establecido. Algunas modalidades permiten la emisión sin conexión temporal y la transmisión posterior.</li>
<li><strong>Registro del establecimiento y de los equipos</strong> ante el SAR, según las disposiciones vigentes.</li>
</ul>

<h2>Modalidades de emisión</h2>
<p>El SAR contempla distintas modalidades según el perfil del contribuyente y el tipo de operación: factura electrónica en línea (transmisión inmediata), factura electrónica fuera de línea (con transmisión diferida), y documentos fiscales especiales para operaciones simplificadas o sectores específicos. La modalidad autorizada depende de la inscripción del contribuyente y debe respetarse estrictamente: emitir en una modalidad distinta a la autorizada puede invalidar la factura.</p>

<h2>Consecuencias de no facturar electrónicamente</h2>
<p>El incumplimiento de la obligación de facturar electrónicamente puede generar sanciones administrativas como multas, suspensión del RTN y cierre temporal del establecimiento. Además, las facturas emitidas en papel cuando ya rige la obligación electrónica pueden no ser deducibles para el comprador, lo que afecta a las relaciones comerciales del negocio. En casos de reincidencia o defraudación, las consecuencias pueden escalar a la vía penal.</p>

<p>Para más información sobre obligaciones fiscales, consulte nuestra <a href="/blog/tributario/sar-notifica-fiscalizacion-que-hacer-honduras">guía sobre fiscalizaciones del SAR</a> y sobre <a href="/blog/tributario/isv-impuesto-venta-tasas-obligaciones-honduras">el ISV en Honduras</a>.</p>`,
  },

  // ─── 4. Derechos del detenido (593→ampliado) ────────────────────────
  {
    slug: 'derechos-detenido-honduras-guia-constitucional',
    metaTitle: 'Derechos del Detenido en Honduras: Guía | Pineda y Asociados',
    metaDescription: 'Conozca los derechos constitucionales de una persona detenida en Honduras: derecho a un abogado, habeas corpus, plazo de detención y garantías procesales.',
    body: `<h2>Derechos fundamentales desde el momento de la detención</h2>
<p>La detención de una persona en Honduras activa de inmediato una serie de garantías constitucionales y procesales que las autoridades están obligadas a respetar. La Constitución de la República, el Código Procesal Penal y los tratados internacionales de derechos humanos ratificados por Honduras conforman un bloque de protección que limita el poder punitivo del Estado y protege la libertad individual. Conocer estos derechos es esencial para ejercerlos, ya que su vulneración puede acarrear la nulidad de las actuaciones y la libertad del detenido.</p>

<h2>Derecho a guardar silencio y a no declarar contra sí mismo</h2>
<p>Nadie está obligado a declarar contra sí mismo ni a confesar su culpabilidad. El detenido tiene derecho a guardar silencio en cualquier momento de la investigación y del juicio, sin que su silencio pueda ser interpretado como un indicio de culpabilidad. Si decide declarar, debe hacerlo libremente, sin coacción, amenazas ni promesas, y siempre en presencia de su abogado defensor. Cualquier declaración obtenida mediante violencia física o psicológica, o sin la presencia del defensor cuando la ley lo exige, carece de valor probatorio.</p>

<h2>Derecho a un abogado defensor</h2>
<p>Desde el momento mismo de la detención —y antes de cualquier declaración— la persona tiene derecho a comunicarse con un abogado de su confianza. Si no puede costear uno, el Estado debe proporcionarle un defensor público. El abogado defensor tiene derecho a entrevistarse privadamente con el detenido en cualquier momento, a acceder al expediente y a participar en todas las diligencias que requieran la presencia del imputado. Negar este derecho vicia de nulidad las actuaciones realizadas sin defensor.</p>

<h2>Plazos máximos de detención</h2>
<p>La detención policial o administrativa no puede prolongarse más allá de lo estrictamente necesario. La ley establece plazos concretos:</p>
<ul>
<li>La detención por parte de la policía sin orden judicial debe durar el tiempo mínimo indispensable y, en todo caso, no puede exceder las horas que la ley señala antes de poner al detenido a disposición de la autoridad judicial.</li>
<li>Una vez a disposición del juez competente, este debe resolver sobre la situación jurídica del imputado en la audiencia inicial. Solo puede decretar prisión preventiva cuando concurren los presupuestos legales y no existe otra medida cautelar suficiente.</li>
<li>La prisión preventiva tiene límites temporales máximos que varían según la gravedad del delito.</li>
</ul>

<h2>Garantías durante la detención</h2>
<p>El detenido tiene derecho a: ser informado de inmediato y en forma comprensible del motivo de la detención y de los derechos que le asisten; a que se comunique su detención a un familiar o persona de su confianza; a recibir asistencia médica si la requiere; a no ser incomunicado salvo en casos excepcionales y por decisión judicial motivada; a que se respete su integridad física y psicológica; y a ser presentado sin demora ante el juez.</p>

<h2>Habeas corpus: el recurso contra la detención ilegal</h2>
<p>Si la detención es ilegal o arbitraria, cualquier persona —no solo el detenido— puede interponer un recurso de <a href="/blog/proceso-penal/habeas-corpus-cuando-interponer-honduras">habeas corpus en Honduras</a>. Este recurso constitucional es rápido, sencillo y no requiere formalidades. El juez debe resolver en cuestión de horas y, si estima que la detención es ilegal, ordenar la libertad inmediata. Es la herramienta más eficaz frente a detenciones arbitrarias.</p>

<p>Si enfrenta un proceso penal, consulte también nuestra <a href="/blog/derecho-penal/defensa-penal-honduras">guía sobre defensa penal en Honduras</a> y sobre <a href="/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras">qué hacer si lo detienen</a>.</p>`,
  },

  // ─── 5. Importar desde China (406, 1 marcador→650+) ─────────────────
  {
    slug: 'importar-desde-china-guia-legal-aduanera-honduras',
    metaTitle: 'Importar desde China a Honduras: Guía Aduanera | Pineda',
    metaDescription: 'Guía legal para importar mercancías desde China a Honduras: documentación aduanera, clasificación arancelaria, impuestos, logística y riesgos del proceso.',
    body: `<h2>El comercio con China desde la perspectiva aduanera hondureña</h2>
<p>China es uno de los principales proveedores de mercancías para el mercado hondureño. Electrónicos, textiles, maquinaria, repuestos y una amplia variedad de bienes de consumo llegan diariamente a los puertos y aduanas del país. Sin embargo, importar desde China implica navegar un sistema aduanero que exige documentación precisa, clasificación arancelaria correcta y cumplimiento de requisitos no arancelarios que varían según el tipo de producto. Un error en cualquiera de estos pasos puede traducirse en retenciones, multas y costos adicionales que afectan la rentabilidad de la operación.</p>

<h2>Documentación esencial para importar</h2>
<p>El despacho aduanero de mercancías procedentes de China requiere, como mínimo:</p>
<ul>
<li><strong>Factura comercial:</strong> debe detallar el valor unitario y total de cada producto, la moneda de transacción, las condiciones de venta (INCOTERM) y los datos completos del exportador y del importador.</li>
<li><strong>Conocimiento de embarque (Bill of Lading)</strong> o guía aérea (Air Waybill), según el medio de transporte.</li>
<li><strong>Lista de empaque (Packing List):</strong> con el peso bruto y neto, dimensiones y contenido de cada bulto.</li>
<li><strong>Declaración de mercancías</strong> o formulario aduanero correspondiente, que se presenta electrónicamente ante la Administración Aduanera de Honduras.</li>
<li><strong>Certificado de origen</strong> cuando se requiera para aplicar preferencias arancelarias —aunque China y Honduras no tienen un tratado de libre comercio bilateral vigente, por lo que generalmente se aplica el arancel general—.</li>
<li><strong>Permisos especiales</strong> según el tipo de producto: registros sanitarios para alimentos y medicamentos, certificados fitosanitarios para productos vegetales, homologaciones para equipos eléctricos, entre otros.</li>
</ul>

<h2>Clasificación arancelaria y tributos</h2>
<p>Cada producto debe clasificarse correctamente según el Sistema Arancelario Centroamericano (SAC). La clasificación determina el arancel aplicable —que varía entre el 0% y el 15% o más, según el código—, así como los requisitos no arancelarios y los impuestos adicionales. Sobre el valor CIF (costo + seguro + flete) se aplican: el <strong>Derecho Arancelario a la Importación (DAI)</strong>, el <strong>Impuesto Sobre la Venta (ISV)</strong> del 15% (con algunas excepciones) y, según el producto, otros tributos como el impuesto de producción y consumo o tasas específicas. Una clasificación incorrecta puede generar ajustes posteriores de la Administración Aduanera, con recargos e intereses.</p>

<h2>Riesgos frecuentes y cómo mitigarlos</h2>
<p>Varios riesgos pueden afectar una importación desde China:</p>
<ul>
<li><strong>Subvaluación:</strong> declarar un valor inferior al real para pagar menos tributos es una infracción aduanera grave. La Administración Aduanera cuenta con bases de datos de precios de referencia y puede cuestionar el valor declarado, aplicando multas y reteniendo la mercancía.</li>
<li><strong>Mercancía no conforme:</strong> diferencias entre lo declarado y lo efectivamente embarcado. Es esencial que el proveedor chino emita documentación exacta y que se verifique antes del embarque.</li>
<li><strong>Productos sujetos a restricciones:</strong> ciertos bienes requieren permisos previos de entidades como la ARSA (productos sanitarios), la SERNA (productos que pueden impactar el ambiente) o la Secretaría de Defensa (armas y afines). Importarlos sin el permiso correspondiente puede resultar en decomiso.</li>
<li><strong>Costos logísticos subestimados:</strong> el flete marítimo desde China, el seguro, los gastos portuarios en Honduras, el transporte interno, el almacenaje en depósito temporal y los honorarios del agente aduanero pueden sumar significativamente al costo final de la mercancía.</li>
</ul>

<p>Para más información sobre comercio exterior, consulte nuestra <a href="/blog/derecho-aduanero/guia-aduanera-importaciones-honduras">guía aduanera de importaciones en Honduras</a> y sobre <a href="/blog/derecho-aduanero/importar-mercancias-guia-legal-aduanera-honduras">cómo importar mercancías</a> cumpliendo la normativa.</p>`,
  },

  // ─── 6. Pensión alimenticia cómo solicitarla (392→650+) ─────────────
  {
    slug: 'pension-alimenticia-honduras-como-solicitarla',
    metaTitle: 'Cómo Solicitar Pensión Alimenticia en Honduras | Guía Legal',
    metaDescription: 'Guía paso a paso para solicitar la pensión alimenticia en Honduras: requisitos, documentos, juzgado competente y qué hacer si el obligado no paga.',
    body: `<h2>Quién puede solicitar la pensión alimenticia y en qué consiste</h2>
<p>La pensión alimenticia es una obligación legal que tiene por objeto garantizar la subsistencia de quien no puede proveerse por sí mismo. En Honduras, pueden solicitarla los hijos menores de edad —representados por el progenitor que tiene la guarda—, los hijos mayores de edad que estén estudiando y no puedan mantenerse, el cónyuge o conviviente en ciertos casos, y los ascendientes en situación de necesidad. La pensión no solo cubre alimentos en sentido estricto: incluye también vivienda, vestido, asistencia médica, educación y esparcimiento del alimentado.</p>

<h2>Ante quién se presenta la solicitud</h2>
<p>La solicitud de pensión alimenticia se presenta ante el <strong>Juzgado de Familia</strong> o el <strong>Juzgado de Letras con competencia en materia de familia</strong> del domicilio del alimentado o del alimentante. El proceso es gratuito para el solicitante: no se requiere abogado para iniciar la demanda, aunque contar con asesoría legal ayuda a preparar correctamente el expediente y a calcular el monto adecuado. La Defensa Pública también puede brindar asistencia gratuita a quienes no pueden costear un abogado particular.</p>

<h2>Documentos que debe reunir</h2>
<p>Para presentar la solicitud, prepare:</p>
<ul>
<li><strong>Certificación de nacimiento</strong> del menor o de los menores, que acredite la filiación con el alimentante. Si el alimentante no está reconocido como padre, puede ser necesario un proceso previo de reconocimiento o de investigación de paternidad.</li>
<li><strong>Documento de identidad</strong> del solicitante.</li>
<li><strong>Comprobantes de gastos</strong> del alimentado: colegiaturas, facturas médicas, recibos de alquiler, gastos de alimentación estimados, transporte, vestimenta.</li>
<li><strong>Prueba de ingresos del alimentante</strong> si la tiene: constancia de trabajo, recibos de pago, constancia de ingresos emitida por el empleador o por el SAR. Si no puede conseguirla, el juez puede requerirla directamente al empleador o a las entidades correspondientes.</li>
<li><strong>Dirección del alimentante</strong> para su notificación.</li>
</ul>

<h2>Cómo se fija el monto de la pensión</h2>
<p>El juez fija el monto considerando dos factores: la necesidad del alimentado y la capacidad económica del alimentante. No existe una tabla fija ni un porcentaje automático: cada caso se evalúa individualmente. Como referencia, la pensión suele representar un porcentaje del ingreso del alimentante, que varía según el número de hijos y sus necesidades concretas. Si el alimentante tiene otros hijos o cargas familiares, esto se considera para no imponer una obligación que exceda su capacidad real. La pensión se revisa periódicamente: si cambian las circunstancias (aumento de gastos del menor, cambio de ingresos del alimentante), cualquiera de las partes puede solicitar la modificación.</p>

<h2>Qué hacer si el alimentante no paga</h2>
<p>El incumplimiento de la pensión alimenticia es una de las infracciones más serias en materia de familia. La ley ofrece varias herramientas al alimentado:</p>
<ul>
<li><strong>Ejecución de la sentencia:</strong> el juez puede ordenar el embargo del salario del alimentante directamente ante el empleador, quien está obligado a retener y depositar el monto mensual.</li>
<li><strong>Apremio corporal:</strong> el juez puede ordenar la detención del alimentante moroso por un período que la ley establece, hasta que pague o garantice el pago.</li>
<li><strong>Prohibición de salida del país:</strong> puede solicitarse para evitar que el alimentante eluda su obligación ausentándose de Honduras.</li>
<li><strong>Intereses moratorios:</strong> las cuotas atrasadas generan intereses desde que se hacen exigibles.</li>
</ul>

<p>Para una guía más amplia sobre todos los aspectos de la pensión alimenticia, consulte nuestra <a href="/blog/derecho-de-familia/pension-alimenticia-honduras-guia-completa">guía completa sobre pensión alimenticia</a>. Si necesita asesoría sobre divorcio o custodia, vea nuestra <a href="/blog/derecho-de-familia/divorcio-honduras-guia-completa">guía sobre divorcio en Honduras</a>.</p>`,
  },

  // ─── 7. Abogados en Choluteca (local, 310→650+) ─────────────────────
  {
    slug: 'abogados-en-choluteca',
    metaTitle: 'Abogados en Choluteca: Asesoría Legal | Pineda y Asociados',
    metaDescription: 'Servicios de abogados en Choluteca, Honduras: derecho penal, familia, laboral, civil y mercantil. Asesoría legal en la cabecera departamental y municipios cercanos.',
    body: `<h2>Abogados en Choluteca con alcance en el sur de Honduras</h2>
<p>Choluteca es una de las ciudades más dinámicas del sur de Honduras, con una economía que combina agricultura, comercio, industria y servicios. Como cabecera del departamento más extenso de la zona sur, concentra juzgados, oficinas administrativas y una población que requiere servicios legales en múltiples áreas. Contar con <strong>abogados en Choluteca</strong> que conozcan las particularidades de la región —desde la tenencia de tierras agrícolas hasta los conflictos comerciales transfronterizos— permite resolver asuntos jurídicos sin necesidad de desplazarse a Tegucigalpa o San Pedro Sula.</p>

<h2>Áreas de práctica frecuentes en la zona</h2>

<h3>Derecho penal</h3>
<p>Brindamos defensa penal técnica en todas las etapas del proceso: desde la audiencia inicial hasta la sentencia. Atendemos delitos contra la vida, el patrimonio, la libertad y la integridad, así como faltas. También asesoramos a víctimas en la presentación de denuncias ante el Ministerio Público y en la constitución como acusador privado. Si necesita un especialista, consulte nuestro perfil de <a href="/blog/derecho-penal/abogado-penalista-choluteca">abogado penalista en Choluteca</a>.</p>

<h3>Derecho de familia</h3>
<p>Orientamos en divorcios, pensiones alimenticias, custodia de menores, régimen de visitas, declaración de unión de hecho y adopciones. Los procesos de familia requieren no solo conocimiento jurídico sino también sensibilidad para manejar situaciones que afectan profundamente a las personas involucradas. Si su caso es de esta naturaleza, vea nuestro perfil de <a href="/blog/derecho-de-familia/abogado-familia-choluteca">abogado de familia en Choluteca</a>.</p>

<h3>Derecho laboral</h3>
<p>Representamos a trabajadores y empleadores en conflictos laborales: despidos, reclamaciones de prestaciones, acoso laboral y negociación de condiciones de trabajo. La Secretaría de Trabajo tiene oficinas en la zona y muchos conflictos pueden resolverse en sede administrativa sin necesidad de juicio. Para más detalles, consulte nuestro artículo sobre <a href="/blog/derecho-laboral/abogado-laboral-choluteca">abogado laboral en Choluteca</a>.</p>

<h3>Derecho civil y mercantil</h3>
<p>Asesoramos en compraventa de inmuebles, regularización de propiedades, contratos de arrendamiento, herencias y constitución de sociedades mercantiles. La zona sur de Honduras tiene un régimen de propiedad particular, especialmente en tierras agrícolas y costeras, que requiere conocimiento específico. Vea también nuestro perfil de <a href="/blog/derecho-civil/abogado-civil-choluteca">abogado civil en Choluteca</a>.</p>

<h2>Ventajas de trabajar con un bufete con presencia en la zona</h2>
<p>Un bufete que atiende regularmente Choluteca conoce los tribunales locales, los tiempos procesales reales y las particularidades de la práctica judicial en el departamento. También puede atender en municipios cercanos como Marcovia, Pespire, San Marcos de Colón y El Triunfo. La comunicación inicial puede realizarse por teléfono, WhatsApp o a través del formulario en nuestro sitio web; si el caso requiere presencia física, coordinamos la visita sin costo adicional de desplazamiento para la primera consulta.</p>`,
  },

  // ─── 8. Abogados en San Lorenzo (local, 301→650+) ───────────────────
  {
    slug: 'abogados-en-san-lorenzo',
    metaTitle: 'Abogados en San Lorenzo, Valle | Pineda y Asociados',
    metaDescription: 'Servicios legales en San Lorenzo, Valle, Honduras: derecho penal, aduanero, mercantil, laboral y civil. Asesoría en la zona portuaria y comercial del Pacífico hondureño.',
    body: `<h2>Abogados en San Lorenzo: asesoría legal en el puerto del Pacífico</h2>
<p>San Lorenzo es una ciudad estratégica del departamento de Valle. Su puerto, uno de los más importantes del Pacífico hondureño, genera una intensa actividad comercial, aduanera y logística que demanda servicios legales especializados. Además, como centro urbano relevante de la zona sur, concentra población que requiere asistencia en derecho de familia, penal, laboral y civil. Disponer de <strong>abogados en San Lorenzo</strong> con experiencia en la realidad local permite resolver asuntos jurídicos sin necesidad de trasladarse a otras ciudades.</p>

<h2>Servicios legales destacados en San Lorenzo</h2>

<h3>Derecho aduanero y comercio exterior</h3>
<p>La proximidad del puerto convierte al derecho aduanero en una necesidad primordial para empresas importadoras, exportadoras, agentes aduaneros y transportistas. Asesoramos en clasificación arancelaria, valoración aduanera, regímenes de importación temporal, trámites de zonas libres (ZOLI) y resolución de controversias con la Administración Aduanera. Si su actividad está vinculada al comercio exterior, consulte nuestro perfil de <a href="/blog/derecho-aduanero/abogado-aduanero-san-lorenzo">abogado aduanero en San Lorenzo</a>.</p>

<h3>Derecho mercantil y societario</h3>
<p>La actividad empresarial en San Lorenzo requiere contratos mercantiles sólidos, constitución de sociedades, protección de marcas y resolución de conflictos comerciales. Asesoramos a pequeñas y medianas empresas en la estructuración legal de sus operaciones. Vea también nuestro perfil de <a href="/blog/derecho-mercantil/abogado-empresas-san-lorenzo">abogado de empresas en San Lorenzo</a>.</p>

<h3>Derecho penal</h3>
<p>Brindamos defensa penal en delitos de diversa naturaleza, con especial atención a los que pueden vincularse a la actividad portuaria y comercial. Atendemos desde la primera citación hasta el juicio oral, garantizando el respeto a las garantías procesales del imputado o la representación de los intereses de la víctima.</p>

<h3>Derecho de familia</h3>
<p>Tramitamos divorcios, pensiones alimenticias, custodias, régimen de visitas y uniones de hecho. Ofrecemos un enfoque orientado a la solución negociada siempre que sea posible, reservando el litigio para los casos en que no exista otra alternativa.</p>

<h3>Derecho laboral</h3>
<p>Representamos a trabajadores en reclamaciones de prestaciones, despidos injustificados y acoso laboral. También asesoramos a empleadores en la correcta aplicación del Código del Trabajo para prevenir conflictos.</p>

<h2>Cobertura en municipios aledaños</h2>
<p>Además de San Lorenzo, atendemos en municipios cercanos como Nacaome, Amapala, El Cubulero y otras localidades del departamento de Valle. Si reside o trabaja en alguna de estas zonas, la primera consulta puede realizarse sin costo adicional de desplazamiento. Contáctenos por teléfono, WhatsApp o a través del formulario en nuestro sitio web para coordinar la visita.</p>`,
  },

  // ─── 9. Abogados en Nacaome (local, 384→650+) ───────────────────────
  {
    slug: 'abogados-en-nacaome',
    metaTitle: 'Abogados en Nacaome, Valle — Sede Principal | Pineda y Asociados',
    metaDescription: 'Bufete de abogados en Nacaome, Valle, Honduras. Sede principal de Pineda y Asociados: defensa penal, familia, laboral, civil y asesoría jurídica en todo el sur del país.',
    body: `<h2>Abogados en Nacaome: bufete con sede en la cabecera de Valle</h2>
<p>Nacaome, como cabecera del departamento de Valle, es un centro neurálgico para los servicios legales en el sur de Honduras. Aquí se concentran juzgados, oficinas del Ministerio Público, la Secretaría de Trabajo y otras dependencias clave para la gestión jurídica. Nuestra sede principal está ubicada en esta ciudad, desde donde atendemos a clientes de Nacaome y de todos los municipios del departamento. Contar con <strong>abogados en Nacaome</strong> que operen desde la cabecera departamental ofrece ventajas prácticas: cercanía a los tribunales, conocimiento del funcionamiento judicial local y capacidad de respuesta rápida ante diligencias urgentes.</p>

<h2>Áreas de práctica desde Nacaome</h2>

<h3>Derecho penal y defensa técnica</h3>
<p>Atendemos casos penales en todas las etapas: investigación preliminar, audiencia inicial, etapa intermedia y juicio oral. Brindamos asistencia inmediata ante detenciones, allanamientos y citaciones. También representamos a víctimas en la presentación de denuncias y en el seguimiento del proceso penal. La proximidad a los juzgados de Nacaome permite una presencia constante en las audiencias y un seguimiento cercano de cada expediente.</p>

<h3>Derecho de familia</h3>
<p>Tramitamos divorcios de mutuo acuerdo y contenciosos, pensiones alimenticias, régimen de visitas, custodia, adopciones y uniones de hecho. La práctica de familia en una ciudad como Nacaome requiere sensibilidad: muchos casos involucran a familias que se conocen entre sí y donde la discreción es especialmente valorada.</p>

<h3>Derecho laboral</h3>
<p>Asesoramos a trabajadores en despidos, reclamación de prestaciones, acoso laboral y condiciones de trabajo. También orientamos a pequeños empleadores sobre sus obligaciones legales para prevenir conflictos. La Secretaría de Trabajo tiene presencia en la zona, lo que facilita la resolución de muchos casos en sede administrativa.</p>

<h3>Derecho civil y propiedad</h3>
<p>La compraventa de inmuebles, las herencias, los contratos de arrendamiento, los conflictos de linderos y la regularización de propiedades ocupan una parte significativa de nuestra práctica en Nacaome y los municipios aledaños. El régimen de propiedad en la zona —que incluye tierras agrícolas, costeras y urbanas— requiere un conocimiento detallado que nuestro equipo posee por años de ejercicio en la región.</p>

<h3>Derecho administrativo y municipal</h3>
<p>Asesoramos en trámites ante la municipalidad de Nacaome y otras del departamento: permisos de construcción, licencias de operación, catastro y regularización de negocios. Para empresas que operan en varios municipios del sur, ofrecemos gestión coordinada.</p>

<h2>Presencia en todo el sur de Honduras</h2>
<p>Aunque nuestra sede está en Nacaome, nos desplazamos regularmente a Choluteca, San Lorenzo, Amapala, Monjarás, Goascorán, Langue, Aramecina, Caridad, Alianza y otros municipios del sur. Si su asunto está en cualquier localidad del departamento de Valle, podemos atenderlo sin que usted tenga que desplazarse. Para más información sobre nuestros servicios, consulte también <a href="/blog/practica-legal/elegir-bufete-abogados-nacaome">cómo elegir bufete en Nacaome</a>.</p>`,
  },

  // ─── 10. Elegir bufete en Nacaome (753→ampliado) ────────────────────
  {
    slug: 'elegir-bufete-abogados-nacaome',
    metaTitle: 'Cómo Elegir Bufete de Abogados en Nacaome | Pineda',
    metaDescription: 'Guía para elegir un bufete de abogados en Nacaome, Valle: qué preguntar, cómo evaluar experiencia, honorarios y especialización. Criterios prácticos para decidir.',
    body: `<h2>Por qué la elección del bufete importa más de lo que parece</h2>
<p>Elegir un bufete de abogados en Nacaome —o en cualquier ciudad— no es una decisión que deba tomarse con prisa ni basándose únicamente en una recomendación casual. La relación abogado-cliente suele prolongarse durante meses y, en ocasiones, años. El resultado de un caso puede depender en buena medida de la calidad del profesional que lo lleva, pero también de su disponibilidad, su capacidad de comunicación y su conocimiento de la práctica judicial local. En Nacaome, donde la comunidad jurídica es más reducida que en Tegucigalpa o San Pedro Sula, la reputación y la trayectoria son factores que pueden verificarse con relativa facilidad si se sabe qué preguntar.</p>

<h2>Factores clave para evaluar un bufete en Nacaome</h2>

<h3>Experiencia en el área concreta que usted necesita</h3>
<p>No es lo mismo un penalista que un laboralista. Pregunte directamente cuántos casos similares al suyo ha manejado el bufete en los últimos años, y si es posible, solicite una explicación general del proceso sin comprometer la confidencialidad de otros clientes. Un profesional experimentado debe poder describirle las etapas del proceso, los plazos probables y los riesgos de forma clara.</p>

<h3>Conocimiento de los tribunales y la práctica local</h3>
<p>Nacaome tiene sus propios juzgados de letras, juzgado de familia y oficinas del Ministerio Público. Un bufete que litiga habitualmente en estos tribunales conoce los criterios de los jueces, los tiempos reales de tramitación y los requisitos prácticos que no siempre están en la ley. Esta familiaridad con el terreno puede marcar la diferencia entre un trámite fluido y uno lleno de trabas.</p>

<h3>Claridad en los honorarios</h3>
<p>Desconfíe de quien no le da un presupuesto por escrito o le responde con vaguedades sobre el costo. Un bufete serio debe explicarle si cobra honorario fijo, por hora, por etapa procesal o mediante un porcentaje del resultado (cuota litis, frecuente en reclamaciones económicas). También debe detallar qué incluye el honorario —gastos de desplazamiento, tasas judiciales, fotocopias, peritajes— y qué se facturará aparte. Si el costo total no puede determinarse con exactitud al inicio, al menos deben quedar claros los criterios de cálculo y los escenarios posibles.</p>

<h3>Comunicación y disponibilidad</h3>
<p>Pregunte quién será su contacto directo, cada cuánto recibirá información sobre el avance de su caso y por qué medio —teléfono, WhatsApp, correo—. Un bufete que no responde llamadas o que deriva al cliente entre varios abogados sin un interlocutor claro suele generar frustración, por bueno que sea técnicamente. En Nacaome, la comunicación cara a cara sigue siendo valorada; pregunte si es posible concertar citas presenciales cuando el caso lo requiera.</p>

<h3>Referencias y reputación</h3>
<p>En una ciudad como Nacaome, la reputación se construye con años de ejercicio. Pregunte en su entorno si conocen al bufete, busque referencias de otros clientes —siempre respetando la confidencialidad— y observe si el bufete tiene presencia profesional verificable: colegiación vigente, participación en actividades del gremio, publicaciones o contenido que demuestre conocimiento jurídico. No se base únicamente en publicidad o en un sitio web atractivo.</p>

<h2>Señales de alerta</h2>
<p>Algunos indicadores sugieren que conviene buscar otra opción: prometer resultados garantizados (ningún abogado serio asegura el resultado de un juicio), pedir dinero por adelantado sin firmar un acuerdo de honorarios, sugerir actuaciones manifiestamente contrarias a la ley, no estar colegiado o tener el registro suspendido, y cambiar constantemente la estrategia o los plazos sin explicación. Si detecta alguna de estas señales, busque una segunda opinión antes de comprometerse.</p>

<p>Para más información sobre el proceso de elegir representación legal, consulte nuestras guías sobre <a href="/blog/practica-legal/como-elegir-abogado-honduras">cómo elegir abogado en Honduras</a> y <a href="/blog/practica-legal/como-elegir-buen-abogado-guia-practica-honduras">cómo elegir un buen abogado</a>.</p>`,
  },

  // ─── 11. Testamentos y sucesiones (305→650+) ────────────────────────
  {
    slug: 'testamentos-sucesiones-herencia-honduras',
    metaTitle: 'Testamentos y Sucesiones en Honduras: Guía Legal | Pineda',
    metaDescription: 'Guía sobre testamentos y sucesiones en Honduras: tipos de testamento, cómo hacer uno, qué ocurre si no hay testamento y el proceso sucesorio paso a paso.',
    body: `<h2>Por qué hacer un testamento en Honduras</h2>
<p>El testamento es el instrumento legal que permite a una persona decidir cómo se distribuirán sus bienes después de su fallecimiento. Aunque muchas personas postergan esta decisión —por desconocimiento, por incomodidad con el tema o por la creencia errónea de que "la familia se pondrá de acuerdo"—, no hacer testamento implica que será la ley quien determine el destino del patrimonio, mediante las reglas de la sucesión intestada. Esto puede generar resultados no deseados: parientes que el fallecido habría excluido, heredan por ley; otros a quienes habría beneficiado, quedan sin nada; y, con frecuencia, surgen conflictos familiares que podrían haberse evitado con un documento claro.</p>

<h2>Tipos de testamento reconocidos en Honduras</h2>
<p>El Código Civil hondureño contempla varias formas de testamento:</p>
<ul>
<li><strong>Testamento abierto:</strong> se otorga ante notario y tres testigos. El testador expresa su voluntad verbalmente y el notario la redacta, la lee en voz alta y la firma junto con los testigos. Es la forma más común y recomendable, porque garantiza la autenticidad del documento y su registro.</li>
<li><strong>Testamento cerrado:</strong> el testador escribe su voluntad —o la hace escribir—, introduce el documento en un pliego cerrado y lo presenta al notario y testigos, declarando que contiene su testamento. El notario levanta acta en la cubierta. El contenido permanece secreto hasta el fallecimiento.</li>
<li><strong>Testamento especial:</strong> en circunstancias excepcionales —enfermedad grave, epidemia, naufragio, situación de guerra— la ley permite formas simplificadas, con menos formalidades, que caducan si el testador sobrevive a la situación de excepción.</li>
</ul>

<h2>Qué se puede disponer y límites a la libertad de testar</h2>
<p>La libertad de testar no es absoluta. La ley hondureña protege a los herederos forzosos —hijos, cónyuge, ascendientes en ciertos casos— reservándoles una porción de la herencia llamada <strong>legítima</strong>. El testador solo puede disponer libremente de la porción restante, denominada <strong>de libre disposición</strong>. Si el testamento deshereda a un heredero forzoso sin causa legal, o le asigna menos de lo que por legítima le corresponde, el heredero puede impugnarlo judicialmente.</p>

<h2>Qué ocurre si no hay testamento: la sucesión intestada</h2>
<p>Cuando una persona fallece sin testamento, la ley determina el orden de los llamados a heredar: primero los hijos y el cónyuge sobreviviente; a falta de descendientes, los ascendientes y el cónyuge; a falta de ambos, los hermanos; y así sucesivamente, hasta el Estado si no existen parientes con derecho. El proceso sucesorio intestado requiere una declaración judicial de herederos, que puede demorar meses o años ya que implica la publicación de edictos y la verificación de que no existen otros herederos con igual o mejor derecho.</p>

<h2>El proceso sucesorio: pasos generales</h2>
<p>Tanto la sucesión testada como la intestada requieren un proceso que, a grandes rasgos, comprende: apertura de la sucesión, aceptación de la herencia —que puede ser pura y simple o a beneficio de inventario—, formación de inventario de bienes y deudas, partición entre herederos, y adjudicación de los bienes. La complejidad depende del número de herederos, de si hay acuerdo entre ellos, y de la naturaleza de los bienes (inmuebles, empresas, cuentas bancarias, deudas). Cuando hay desacuerdo, la partición puede tramitarse judicialmente, lo que alarga el proceso.</p>

<p>Para más información sobre este tema, consulte también nuestra guía sobre <a href="/blog/derecho-civil/herencias-honduras-fallece-familiar">herencias en Honduras cuando fallece un familiar</a>.</p>`,
  },

  // ─── 12. Código aduanero centroamericano (329→650+) ─────────────────
  {
    slug: 'codigo-aduanero-centroamericano-basico-honduras',
    metaTitle: 'Código Aduanero Centroamericano: Guía para Honduras | Pineda',
    metaDescription: 'Guía sobre el Código Aduanero Uniforme Centroamericano (CAUCA) y su aplicación en Honduras: principios, obligaciones aduaneras, regímenes y resolución de controversias.',
    body: `<h2>Qué es el CAUCA y por qué rige en Honduras</h2>
<p>El Código Aduanero Uniforme Centroamericano (CAUCA) es el marco normativo común que regula el comercio exterior de mercancías en los países del Sistema de Integración Centroamericana (SICA), incluido Honduras. Su propósito es armonizar la legislación aduanera de la región para facilitar el comercio intrarregional, simplificar los procedimientos y ofrecer reglas claras a importadores, exportadores, agentes aduaneros y autoridades. Junto con el Reglamento del Código Aduanero Uniforme Centroamericano (RECAUCA), constituye la base sobre la que se asienta la operativa aduanera hondureña en aspectos como la clasificación arancelaria, la valoración, los regímenes aduaneros y las infracciones.</p>

<h2>Principios rectores del sistema aduanero</h2>
<p>El CAUCA se asienta sobre varios principios fundamentales que orientan la actuación de la Administración Aduanera y los derechos de los operadores:</p>
<ul>
<li><strong>Buena fe y transparencia:</strong> se presume la buena fe de los declarantes. Las resoluciones de la autoridad deben ser motivadas y notificarse en forma.</li>
<li><strong>Facilitación del comercio:</strong> los procedimientos deben simplificarse al máximo compatible con el control aduanero, evitando trámites innecesarios.</li>
<li><strong>Control aduanero basado en gestión de riesgo:</strong> no toda mercancía se revisa físicamente; el sistema prioriza las operaciones de mayor riesgo mediante criterios objetivos.</li>
<li><strong>Cooperación entre administraciones:</strong> las aduanas de la región comparten información y colaboran para prevenir el fraude y el contrabando.</li>
</ul>

<h2>Obligaciones de los operadores de comercio exterior</h2>
<p>El CAUCA establece deberes concretos para quienes intervienen en operaciones de comercio exterior: presentar la declaración de mercancías de forma completa, exacta y veraz; conservar los documentos que respaldan la operación por el plazo legal; facilitar las labores de verificación de la autoridad aduanera; pagar los tributos en los plazos establecidos; y cumplir con las regulaciones no arancelarias aplicables (sanitarias, fitosanitarias, de seguridad, etc.). El incumplimiento de estas obligaciones puede derivar en sanciones administrativas que varían desde multas hasta el decomiso de la mercancía.</p>

<h2>Regímenes aduaneros disponibles</h2>
<p>El CAUCA contempla distintos regímenes a los que puede destinarse la mercancía:</p>
<ul>
<li><strong>Importación definitiva:</strong> la mercancía ingresa al territorio aduanero para permanecer en él sin limitación temporal, previo pago de los tributos correspondientes.</li>
<li><strong>Exportación definitiva:</strong> la mercancía sale del territorio aduanero para permanecer en el extranjero.</li>
<li><strong>Tránsito aduanero:</strong> la mercancía atraviesa el territorio aduanero con destino a otro país, sin pagar tributos en Honduras.</li>
<li><strong>Importación temporal:</strong> la mercancía ingresa por un plazo determinado para un fin específico, con suspensión de tributos mientras dure el régimen. Ejemplos: maquinaria para una obra, mercancía para una exposición.</li>
<li><strong>Depósito aduanero:</strong> la mercancía se almacena bajo control de la aduana sin pagar tributos hasta que se decida su destino definitivo.</li>
<li><strong>Zonas libres (ZOLI):</strong> régimen especial que permite operar en áreas delimitadas con beneficios fiscales. Honduras cuenta con varias ZOLI, especialmente en la zona norte y en el sur.</li>
</ul>

<h2>Resolución de controversias con la Administración Aduanera</h2>
<p>Si la Administración Aduanera emite un acto que el operador considera irregular —una clasificación arancelaria incorrecta, un ajuste de valor, una multa—, el CAUCA establece la posibilidad de recurrir administrativamente ante la misma autoridad o ante el superior jerárquico. Agotada la vía administrativa, el afectado puede acudir a la vía judicial. Contar con asesoría legal especializada desde el primer momento puede evitar que un desacuerdo menor escale a un litigio prolongado.</p>

<p>Para más información sobre operaciones de comercio exterior, consulte nuestras guías sobre <a href="/blog/derecho-aduanero/importar-mercancias-guia-legal-aduanera-honduras">cómo importar mercancías en Honduras</a> y sobre <a href="/blog/derecho-aduanero/guia-aduanera-importaciones-honduras">importaciones a Honduras</a>.</p>`,
  },

  // ─── 13. Zonas libres ZOLI (317→650+) ───────────────────────────────
  {
    slug: 'zonas-libres-zoli-beneficios-fiscales-honduras',
    metaTitle: 'Zonas Libres ZOLI en Honduras: Beneficios | Pineda y Asociados',
    metaDescription: 'Guía sobre las zonas libres ZOLI en Honduras: requisitos, beneficios fiscales, régimen aduanero, actividades permitidas y cómo operar dentro de una zona libre.',
    body: `<h2>Qué son las zonas libres y cómo funcionan en Honduras</h2>
<p>Las zonas libres —conocidas como ZOLI— son áreas geográficas delimitadas dentro del territorio hondureño donde las empresas pueden operar con un régimen fiscal y aduanero especial. El objetivo es atraer inversión, generar empleo y fomentar las exportaciones mediante incentivos como la exención del Impuesto Sobre la Renta, la exoneración de derechos arancelarios para materias primas y maquinaria, y la simplificación de trámites aduaneros. Honduras cuenta con varias ZOLI activas, concentradas principalmente en la zona norte (Puerto Cortés, San Pedro Sula, Choloma) y con presencia creciente en otras regiones del país.</p>

<h2>Beneficios fiscales principales</h2>
<p>Las empresas que operan bajo el régimen de ZOLI pueden acceder a una serie de beneficios que varían según la ley específica que las ampare y el tipo de actividad:</p>
<ul>
<li><strong>Exención del Impuesto Sobre la Renta (ISR):</strong> durante un período determinado, que puede variar según el régimen y la ubicación de la zona.</li>
<li><strong>Exoneración de derechos arancelarios:</strong> para la importación de materias primas, insumos, maquinaria, equipo, repuestos y materiales de construcción necesarios para la operación.</li>
<li><strong>Exención del Impuesto Sobre la Venta (ISV):</strong> en las compras locales y en las importaciones de bienes y servicios vinculados a la actividad de la empresa.</li>
<li><strong>Exención de impuestos municipales:</strong> en algunos casos y bajo ciertas condiciones.</li>
<li><strong>Régimen de importación temporal simplificado:</strong> para muestras, equipos de prueba y otros bienes que ingresan temporalmente.</li>
</ul>

<h2>Actividades permitidas y requisitos de operación</h2>
<p>Las ZOLI no están limitadas a la maquila textil, aunque este es el sector más visible. La legislación permite actividades de manufactura, ensamblaje, procesamiento de datos, servicios de call center, servicios logísticos y, en algunas zonas, actividades de turismo. Para operar en una ZOLI, la empresa debe:</p>
<ul>
<li>Constituirse legalmente en Honduras y obtener el RTN.</li>
<li>Solicitar y obtener la autorización como usuario de la zona franca ante la autoridad competente.</li>
<li>Suscribir un contrato con la empresa administradora de la zona franca, que establece los derechos y obligaciones de ambas partes.</li>
<li>Cumplir con los requisitos de operación, que incluyen presentar informes periódicos de actividades, mantener la contabilidad separada de otras operaciones y cumplir con las obligaciones laborales y de seguridad social respecto del personal contratado.</li>
<li>Exportar la mayor parte de su producción (el porcentaje mínimo puede variar según el régimen), aunque en algunos casos se permite vender un porcentaje en el mercado local previo pago de los tributos correspondientes.</li>
</ul>

<h2>Riesgos y obligaciones que no deben ignorarse</h2>
<p>Operar en una ZOLI no significa operar sin reglas. Las empresas deben prestar atención especial a:</p>
<ul>
<li>La obligación de cumplir con las leyes laborales hondureñas en cuanto a salarios, prestaciones, jornada y seguridad ocupacional.</li>
<li>Los controles aduaneros sobre el ingreso y salida de mercancías: cada movimiento debe estar documentado y los inventarios deben cuadrar con los registros presentados ante la aduana.</li>
<li>El cumplimiento de los porcentajes de exportación exigidos: vender en el mercado local más de lo autorizado sin pagar los tributos correspondientes puede generar contingencias fiscales y aduaneras.</li>
<li>La renovación de los beneficios: algunos vencen después de un plazo y requieren gestión para su prórroga.</li>
</ul>

<p>Para más información sobre comercio y aduanas, consulte nuestra <a href="/blog/derecho-aduanero/guia-aduanera-importaciones-honduras">guía aduanera de importaciones</a> y sobre <a href="/blog/derecho-aduanero/codigo-aduanero-centroamericano-basico-honduras">el Código Aduanero Centroamericano</a>.</p>`,
  },

  // ─── 14. Prescripción de deudas (443→ampliado) ──────────────────────
  {
    slug: 'prescripcion-deudas-plazos-honduras',
    metaTitle: 'Prescripción de Deudas en Honduras: Plazos Legales | Pineda',
    metaDescription: 'Conozca los plazos de prescripción de deudas en Honduras: cuándo prescribe una deuda comercial, civil o bancaria, cómo se interrumpe y qué hacer si le reclaman una deuda antigua.',
    body: `<h2>Qué significa que una deuda prescriba</h2>
<p>La prescripción de una deuda es un mecanismo legal que extingue la obligación de pagar cuando el acreedor no ha reclamado el pago durante el plazo establecido por la ley. No significa que la deuda desaparezca automáticamente —el deudor debe invocar la prescripción—, ni que el acreedor haya perdonado la obligación. Es un límite temporal que el ordenamiento jurídico impone para dar seguridad a las relaciones económicas: quien tiene derecho a cobrar debe ejercerlo en un tiempo razonable; de lo contrario, pierde la posibilidad de reclamarlo judicialmente.</p>

<h2>Plazos de prescripción según el tipo de deuda</h2>
<p>Los plazos varían según la naturaleza de la obligación:</p>
<ul>
<li><strong>Deudas derivadas de contratos mercantiles:</strong> el Código de Comercio establece plazos de prescripción específicos para acciones cambiarias (cheques, letras de cambio, pagarés), que suelen ser más cortos que los plazos civiles —a menudo de uno a tres años desde el vencimiento—.</li>
<li><strong>Deudas civiles (préstamos entre particulares, honorarios, compraventas):</strong> generalmente prescriben en un plazo de uno a cinco años, dependiendo de la naturaleza de la obligación. El Código Civil distingue entre acciones personales (que prescriben en plazos más cortos) y reales (que pueden tener plazos mayores).</li>
<li><strong>Obligaciones tributarias:</strong> los plazos de prescripción de los impuestos están regulados por el Código Tributario y suelen ser más extensos que los civiles o mercantiles. El SAR puede reclamar deudas tributarias dentro de plazos que alcanzan varios años.</li>
<li><strong>Deudas bancarias (tarjetas de crédito, préstamos personales, hipotecas):</strong> se rigen por las normas generales, pero la práctica de la banca suele incluir cláusulas de reconocimiento de deuda que interrumpen la prescripción. El hecho de hacer un pago parcial o de firmar un plan de refinanciación puede reiniciar el plazo.</li>
</ul>

<h2>Cómo se interrumpe la prescripción</h2>
<p>La prescripción puede interrumpirse —el plazo empieza a contarse de nuevo desde cero— por varios actos:</p>
<ul>
<li><strong>Requerimiento judicial de pago:</strong> la interposición de una demanda ante el juzgado competente interrumpe la prescripción, aunque la demanda sea después desestimada por otros motivos.</li>
<li><strong>Reconocimiento de la deuda por el deudor:</strong> cualquier acto del deudor que implique reconocer la existencia de la obligación —un pago parcial, una solicitud de prórroga, una comunicación escrita— interrumpe el plazo.</li>
<li><strong>Requerimiento extrajudicial fehaciente:</strong> una carta notarial o un acta de requerimiento que acredite que el acreedor reclamó el pago puede interrumpir la prescripción en ciertos casos.</li>
</ul>

<h2>Qué hacer si le reclaman una deuda antigua</h2>
<p>Si recibe una reclamación por una deuda antigua, conviene:</p>
<ul>
<li>Verificar desde cuándo no se ha realizado ningún pago ni reconocimiento de la deuda.</li>
<li>Determinar si el plazo de prescripción aplicable ha transcurrido sin interrupción.</li>
<li>No realizar pagos parciales ni firmar documentos sin asesoría legal, ya que estos actos pueden hacer renacer la obligación.</li>
<li>Si la deuda está efectivamente prescrita, oponer la prescripción en la contestación de la demanda —no es automática; si no se alega, el juez no la declara de oficio.</li>
</ul>

<p>Para más información sobre reclamaciones de deuda, consulte nuestra guía sobre <a href="/blog/derecho-civil/reclamar-deuda-legalmente-honduras">cómo reclamar una deuda legalmente en Honduras</a>.</p>`,
  },

];

// ─── Ejecutar ───────────────────────────────────────────────────
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
        updatedAt: sql`NOW()`,
      })
      .where(eq(blogPosts.slug, r.slug));

    const words = r.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
    console.log(`✅ ${r.slug}: ${words} palabras`);
  }

  console.log(`\n🎯 ${REWRITES.length} posts MEDIO reescritos.`);
}

main().catch(e => { console.error(e); process.exit(1); });

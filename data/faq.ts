/**
 * FAQ pública del bufete — 73 preguntas en 11 categorías.
 *
 * Cada categoría tiene un slug, título, descripción breve y array de preguntas.
 * Orientado a personas que buscan información legal clara y práctica en Honduras.
 *
 * Las preguntas se importan en la página /preguntas-frecuentes.
 */

export type FaqCategory = {
  slug: string;
  titulo: string;
  descripcion: string;
  preguntas: { pregunta: string; respuesta: string }[];
};

export const categoriasFaq: FaqCategory[] = [
  /* ------------------------------------------------------------------------ */
  /* 1. DERECHO PENAL GENERAL                                                 */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'derecho-penal-general',
    titulo: 'Derecho Penal General',
    descripcion: 'Preguntas frecuentes sobre defensa penal, delitos y el Código Penal hondureño.',
    preguntas: [
      {
        pregunta: '¿Cuánto cuesta una defensa penal?',
        respuesta: 'Cada caso requiere análisis individual. Le informamos el alcance de los honorarios tras la consulta inicial, de forma clara y por escrito.',
      },
      {
        pregunta: '¿Puedo cambiar de abogado durante el proceso penal?',
        respuesta: 'Sí. Usted puede revocar el poder a su abogado y designar a otro en cualquier momento. Le orientamos sobre los pasos a seguir.',
      },
      {
        pregunta: '¿Qué delitos cubre el Código Penal hondureño?',
        respuesta: 'El Código Penal (Decreto 130-2017 y reformas 119-2019, 46-2020, 93-2021, 59-2024) tipifica delitos contra la vida, la integridad personal, la libertad, el patrimonio, el orden económico, la salud pública, la administración pública y más. Cubre desde homicidio y lesiones hasta delitos informáticos y ambientales.',
      },
      {
        pregunta: '¿Cuál es la diferencia entre dolo y culpa?',
        respuesta: 'El dolo es la intención deliberada de cometer el delito. La culpa (imprudencia) ocurre cuando se causa un resultado dañoso sin intención, por negligencia, impericia o inobservancia de reglamentos.',
      },
      {
        pregunta: '¿Qué son las circunstancias agravantes y atenuantes?',
        respuesta: 'Las agravantes aumentan la pena (reincidencia, alevosía, ensañamiento, abuso de superioridad). Las atenuantes la reducen (arrepentimiento, reparación del daño, estado de necesidad). Se valoran en la individualización judicial de la pena.',
      },
      {
        pregunta: '¿Puede una persona con antecedentes penales obtener un empleo público?',
        respuesta: 'Depende del delito y del tipo de empleo. Algunos cargos públicos requieren certificado de antecedentes penales limpio. Otros permiten la contratación si el delito no está relacionado con las funciones del puesto.',
      },
      {
        pregunta: '¿Qué hago si soy víctima de un delito?',
        respuesta: 'Puede presentar la denuncia ante el Ministerio Público o la Policía Nacional. Como víctima, tiene derecho a ser informado, a participar en el proceso, a solicitar medidas de protección y a reclamar la reparación del daño.',
      },
      {
        pregunta: '¿Cuándo prescribe un delito en Honduras?',
        respuesta: 'La prescripción varía según la gravedad: los delitos graves pueden prescribir en 10 a 15 años, los menos graves en 3 a 5 años y las faltas en 6 meses. Delitos de lesa humanidad y algunos graves son imprescriptibles.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 2. ASISTENCIA A DETENIDOS Y URGENCIAS                                    */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'asistencia-detenidos',
    titulo: 'Asistencia a Detenidos y Urgencias',
    descripcion: 'Información sobre sus derechos si es detenido y cómo obtener asistencia legal inmediata.',
    preguntas: [
      {
        pregunta: '¿Atienden casos urgentes fuera del horario?',
        respuesta: 'Atendemos de lunes a sábado de 7:00 a 20:00. Para emergencias con persona detenida, contáctenos por WhatsApp y le orientaremos de inmediato durante el horario de atención.',
      },
      {
        pregunta: '¿Qué derechos tengo si soy detenido en Honduras?',
        respuesta: 'Tiene derecho a: saber por qué lo detienen, permanecer en silencio, llamar a un abogado, recibir asistencia consular si es extranjero, y ser presentado ante un juez en el plazo constitucional de 24 horas.',
      },
      {
        pregunta: '¿Cuánto tiempo puede estar alguien detenido sin que lo presenten ante un juez?',
        respuesta: 'La Constitución de Honduras establece un máximo de 24 horas desde la detención para ser presentado ante un juez. Pasado ese plazo, la detención es ilegal y procede el recurso de hábeas corpus.',
      },
      {
        pregunta: '¿Qué es el hábeas corpus?',
        respuesta: 'Es una garantía constitucional que protege la libertad personal. Cualquier persona puede solicitarlo si considera que una detención es ilegal o arbitraria. El juez debe resolverlo en un plazo máximo de 24 horas.',
      },
      {
        pregunta: '¿Pueden esposarme durante el juicio?',
        respuesta: 'No. El imputado tiene derecho a comparecer en libertad o con medidas cautelares proporcionales. Las esposas solo se usan durante el traslado o si existe riesgo de fuga o violencia.',
      },
      {
        pregunta: '¿Cómo solicito la asistencia de un abogado de oficio?',
        respuesta: 'Puede solicitarlo al juez o al Ministerio Público en cualquier etapa del proceso. Si no tiene recursos, el Estado debe proporcionarle un defensor público sin costo.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 3. PROCESO PENAL                                                         */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'proceso-penal',
    titulo: 'Proceso Penal',
    descripcion: 'Etapas, plazos y derechos dentro del proceso penal hondureño.',
    preguntas: [
      {
        pregunta: '¿Cuánto dura un proceso penal en Honduras?',
        respuesta: 'Depende de la complejidad. Un proceso simple puede resolverse en 6 a 12 meses. Casos complejos (varios imputados, delitos graves, prueba pericial) pueden durar 2 a 4 años o más.',
      },
      {
        pregunta: '¿Cuáles son las etapas del proceso penal?',
        respuesta: 'Las etapas principales son: investigación preliminar (Ministerio Público), audiencia inicial, etapa intermedia (acusación y excepciones), juicio oral y público, y etapa de impugnación (recursos).',
      },
      {
        pregunta: '¿Qué es la audiencia inicial?',
        respuesta: 'Es la primera comparecencia ante el juez. Se controla la legalidad de la detención, se informan los derechos al imputado, se formula la imputación y se deciden las medidas cautelares.',
      },
      {
        pregunta: '¿Qué tipos de medidas cautelares existen?',
        respuesta: 'Desde la citación (menos gravosa) hasta la prisión preventiva. Incluyen: presentación periódica, prohibición de salida del país, arraigo domiciliario, caución económica y vigilancia electrónica.',
      },
      {
        pregunta: '¿Se puede evitar la prisión preventiva?',
        respuesta: 'Sí. El juez debe aplicar la medida menos gravosa que sea suficiente para asegurar la comparecencia del imputado y la investigación. La prisión preventiva es excepcional. Su abogado puede solicitar medidas alternativas.',
      },
      {
        pregunta: '¿Qué es el sobreseimiento?',
        respuesta: 'Es la resolución judicial que pone fin al proceso penal sin condena. Puede ser definitivo (no se reabre) o provisional (si la investigación no ha agotado todas las líneas).',
      },
      {
        pregunta: '¿Qué recursos tengo contra una sentencia condenatoria?',
        respuesta: 'Puede interponer recurso de apelación ante la Corte de Apelaciones y, si procede, recurso de casación ante la Sala Penal de la Corte Suprema de Justicia.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 4. DERECHO DE FAMILIA                                                    */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'derecho-de-familia',
    titulo: 'Derecho de Familia',
    descripcion: 'Divorcio, custodia, pensión de alimentos y sucesiones en Honduras.',
    preguntas: [
      {
        pregunta: '¿Cuánto tarda un divorcio en Honduras?',
        respuesta: 'Un divorcio por mutuo acuerdo se resuelve entre 2 y 6 meses si no hay menores ni bienes en disputa. Un contencioso puede durar de 1 a 3 años según la complejidad.',
      },
      {
        pregunta: '¿Cómo se calcula la pensión de alimentos?',
        respuesta: 'El juez fija un porcentaje de los ingresos del obligado (entre 30% y 60% según el número de hijos) más el 50% de gastos educativos y de salud extraordinarios. Se revisa periódicamente según cambio de circunstancias.',
      },
      {
        pregunta: '¿Puedo pedir la custodia compartida?',
        respuesta: 'Sí, el Código de Familia la contempla. El juez evalúa la capacidad de ambos progenitores, la opinión del menor y la cercanía de los domicilios para determinar el régimen más favorable.',
      },
      {
        pregunta: '¿Qué pasa si el padre no paga la pensión de alimentos?',
        respuesta: 'Se ejecuta forzosamente con embargo de salario, cuentas bancarias o bienes. Puede configurarse el delito de incumplimiento de deberes familiares.',
      },
      {
        pregunta: '¿Qué es la unión de hecho y cómo se reconoce?',
        respuesta: 'Es la convivencia pública y notoria entre dos personas sin estar casadas. Se reconoce por escritura notarial o sentencia judicial, y genera derechos patrimoniales similares al matrimonio.',
      },
      {
        pregunta: '¿Cómo se tramita una adopción en Honduras?',
        respuesta: 'Debe iniciar el proceso ante la Dirección de Niñez, Adolescencia y Familia, y luego ante el Juzgado de Familia. Requiere evaluación psicológica, estudio social y cumplimiento de requisitos legales.',
      },
      {
        pregunta: '¿Qué derechos tengo como heredero?',
        respuesta: 'Los herederos forzosos (hijos, cónyuge, padres) tienen derecho a una porción legítima de la herencia. Si no hay testamento, la ley distribuye los bienes según el orden de sucesión intestada.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 5. DERECHO LABORAL                                                       */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'derecho-laboral',
    titulo: 'Derecho Laboral',
    descripcion: 'Despidos, prestaciones, derechos laborales y reclamaciones en Honduras.',
    preguntas: [
      {
        pregunta: '¿Cuánto me corresponde si me despiden sin justa causa?',
        respuesta: 'Preaviso (1 mes o 15 días según antigüedad), cesantía (1 mes por año o fracción, máximo 25 meses), vacaciones proporcionales, aguinaldo proporcional y décimo tercer mes proporcional.',
      },
      {
        pregunta: '¿Cuándo se paga el aguinaldo en Honduras?',
        respuesta: 'El aguinaldo se paga en dos cuotas: 50% antes del 30 de junio y 50% antes del 30 de noviembre, o en un solo pago antes del 20 de diciembre. Es un derecho irrenunciable.',
      },
      {
        pregunta: '¿Qué hago si sufro un accidente laboral?',
        respuesta: 'Notificar al empleador de inmediato, recibir atención del IHSS y, si hay negligencia del empleador, demandar la indemnización complementaria ante el Juzgado del Trabajo.',
      },
      {
        pregunta: '¿Tengo derecho a vacaciones pagadas?',
        respuesta: 'Sí. Después de un año de trabajo continuo, tiene derecho a 10 días hábiles de vacaciones pagadas. Se incrementan con los años de servicio.',
      },
      {
        pregunta: '¿Qué es el despido indirecto?',
        respuesta: 'Ocurre cuando el empleador incumple sus obligaciones (falta de pago, maltrato, condiciones inseguras) y el trabajador decide dar por terminada la relación laboral por causa imputable al empleador.',
      },
      {
        pregunta: '¿Las horas extras se pagan?',
        respuesta: 'Sí. Las horas extras se pagan con un recargo del 100% sobre el salario ordinario para las primeras dos horas diurnas, y del 150% para horas nocturnas y las siguientes.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 6. DERECHO CIVIL Y NOTARIAL                                              */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'derecho-civil',
    titulo: 'Derecho Civil y Notarial',
    descripcion: 'Contratos, inmuebles, deudas y actos notariales en Honduras.',
    preguntas: [
      {
        pregunta: '¿Cómo saber si un vendedor de inmueble tiene derecho a vender?',
        respuesta: 'Solicitamos un estudio de títulos de 20 años al Instituto de la Propiedad, revisamos gravámenes, limitaciones y verificamos la identidad del titular registral.',
      },
      {
        pregunta: '¿Se puede desahuciar al inquilino que no paga?',
        respuesta: 'Sí, mediante juicio verbal de desahucio por falta de pago. El plazo estimado es de 2 meses. En casos urgentes existe el juicio ejecutivo.',
      },
      {
        pregunta: '¿Qué diferencia hay entre prescripción y usucapión?',
        respuesta: 'La prescripción adquisitiva es la figura general. La usucapión suele aplicarse a bienes inmuebles con posesión pacífica e ininterrumpida por el plazo legal (5, 10 o 20 años según el caso).',
      },
      {
        pregunta: '¿Cómo se cobra una deuda judicialmente?',
        respuesta: 'Si tiene un título ejecutivo (pagaré, cheque, contrato), puede iniciar juicio ejecutivo. Si no, debe iniciar juicio declarativo. En ambos casos se puede embargar bienes del deudor.',
      },
      {
        pregunta: '¿Qué es la protocolización de un documento?',
        respuesta: 'Es el acto notarial mediante el cual un documento privado se incorpora al protocolo del notario, adquiriendo fecha cierta y publicidad registral.',
      },
      {
        pregunta: '¿Necesito un abogado para comprar una casa?',
        respuesta: 'No es obligatorio, pero es altamente recomendable. Un abogado revisa títulos, redacta el contrato, verifica gravámenes y asegura que la transferencia se registre correctamente en el Instituto de la Propiedad.',
      },
      {
        pregunta: '¿Qué hago si alguien invade mi propiedad?',
        respuesta: 'Puede interponer una acción reivindicatoria o posesoria ante el juez civil. Si la invasión es reciente, puede solicitar medidas cautelares urgentes como el lanzamiento.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 7. DERECHO MERCANTIL Y EMPRESARIAL                                       */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'derecho-mercantil',
    titulo: 'Derecho Mercantil y Empresarial',
    descripcion: 'Constitución de empresas, contratos comerciales y propiedad intelectual.',
    preguntas: [
      {
        pregunta: '¿Qué tipo de sociedad me conviene en Honduras?',
        respuesta: 'Depende del tamaño, objeto social y necesidades de capital. La Sociedad Anónima (S.A.) es la más usada por su responsabilidad limitada. La S. de R.L. es común en PYMEs familiares.',
      },
      {
        pregunta: '¿Cuánto tarda constituir una sociedad?',
        respuesta: 'Entre 7 y 15 días hábiles con todos los documentos, dependiendo del Registro Mercantil y la publicación en La Gaceta.',
      },
      {
        pregunta: '¿Es obligatorio registrar una marca?',
        respuesta: 'No es obligatorio, pero es recomendable para proteger su identidad comercial. Una marca registrada le otorga derechos exclusivos y la posibilidad de impedir que terceros la usen sin autorización.',
      },
      {
        pregunta: '¿Cuánto dura el registro de una marca?',
        respuesta: 'El registro dura 10 años y se renueva por períodos iguales. Es importante monitorear las renovaciones para no perder la vigencia.',
      },
      {
        pregunta: '¿Qué es la propiedad industrial?',
        respuesta: 'Es el conjunto de derechos sobre marcas, patentes, modelos de utilidad, diseños industriales, nombres comerciales y denominaciones de origen. Se protege a través del Instituto de la Propiedad.',
      },
      {
        pregunta: '¿Puedo demandar por competencia desleal?',
        respuesta: 'Sí. Si un competidor realiza actos contrarios a la buena fe comercial (confusión, engaño, imitación, denigración), puede demandar el cese de la conducta y la indemnización de daños.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 8. EXTRANJERÍA Y MIGRACIÓN                                               */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'extranjeria-migracion',
    titulo: 'Extranjería y Migración',
    descripcion: 'Visas, residencia, naturalización y trámites migratorios en Honduras.',
    preguntas: [
      {
        pregunta: '¿Cuánto tarda la residencia temporal en Honduras?',
        respuesta: 'Entre 6 y 18 meses dependiendo del tipo y la carga del Instituto Nacional de Migración. Con asesoría legal, el proceso puede ser más ágil.',
      },
      {
        pregunta: '¿Puedo naturalizarme sin renunciar a mi nacionalidad?',
        respuesta: 'Sí, Honduras reconoce la doble nacionalidad por nacimiento. Si la adquirió por naturalización, deberá revisar los tratados bilaterales y la legislación aplicable.',
      },
      {
        pregunta: '¿Qué visas existen para invertir en Honduras?',
        respuesta: 'Existen visas para inversionistas, rentistas y pensionados. Cada una tiene requisitos específicos de inversión mínima, ingresos o capacidad económica.',
      },
      {
        pregunta: '¿Cómo obtengo la residencia por matrimonio?',
        respuesta: 'Debe presentar certificado de matrimonio, pruebas de convivencia, solvencia económica y documentos de identidad ante el INM. Después de 2 años de matrimonio puede optar a la naturalización.',
      },
      {
        pregunta: '¿Qué hago si mi solicitud migratoria es denegada?',
        respuesta: 'Puede interponer recurso de revisión ante el INM y, si no prospera, demandar ante la Sala de lo Contencioso Administrativo.',
      },
      {
        pregunta: '¿Los menores hondureños necesitan permiso para viajar al exterior?',
        respuesta: 'Sí. Si viajan solos o con uno de los padres, necesitan autorización notarial del otro progenitor o del juez de familia si no hay acuerdo.',
      },
      {
        pregunta: '¿Qué es la apostilla y para qué sirve?',
        respuesta: 'Es un sello que certifica la autenticidad de documentos públicos para que tengan validez en el extranjero. Honduras es parte del Convenio de La Haya de 1961.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 9. TRIBUTARIO Y SAR                                                      */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'tributario-sar',
    titulo: 'Tributario y SAR',
    descripcion: 'Impuestos, fiscalización y defensa ante el Servicio de Administración de Rentas.',
    preguntas: [
      {
        pregunta: '¿Qué pasa si el SAR me fiscaliza?',
        respuesta: 'Tiene derecho a presentar descargos con asistencia legal. Un abogado puede evitar sanciones desproporcionadas y, si es necesario, recurrir al Contencioso Tributario.',
      },
      {
        pregunta: '¿Cómo planifico fiscalmente mi empresa?',
        respuesta: 'Identificando el régimen óptimo, deducciones permitidas, beneficios por sector y una correcta documentación de precios de transferencia si aplica.',
      },
      {
        pregunta: '¿Cuáles son los principales impuestos en Honduras?',
        respuesta: 'Impuesto sobre la Renta (ISR), Impuesto al Valor Agregado (ISV 15%), Impuesto Selectivo al Consumo, Aportación Solidaria Temporal e Impuesto Municipal.',
      },
      {
        pregunta: '¿Cuándo debo presentar la declaración de renta?',
        respuesta: 'Las personas naturales declaran anualmente entre el 1 de abril y el 31 de mayo. Las personas jurídicas tienen un calendario escalonado según el último dígito del RTN.',
      },
      {
        pregunta: '¿Qué es el régimen simplificado del ISV?',
        respuesta: 'Es un régimen opcional para pequeños contribuyentes que simplifica el pago del ISV. En lugar de declarar mensualmente, pagan una cuota fija trimestral o semestral.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 10. BUFETE Y HONORARIOS                                                  */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'bufete-honorarios',
    titulo: 'El Bufete y Honorarios',
    descripcion: 'Cómo trabajamos, qué esperar de nuestros servicios y preguntas sobre honorarios.',
    preguntas: [
      {
        pregunta: '¿Trabajan en todo Honduras?',
        respuesta: 'Sí. Asumimos defensas en todo el territorio nacional. Coordinamos las audiencias y los traslados según corresponda. Tenemos presencia activa en Tegucigalpa, San Pedro Sula, Nacaome, Choluteca y Comayagua.',
      },
      {
        pregunta: '¿Ofrecen consulta inicial gratuita?',
        respuesta: 'Sí, ofrecemos una consulta inicial confidencial y sin compromiso para evaluar su caso y determinar si podemos ayudarle.',
      },
      {
        pregunta: '¿Cómo se cobran los honorarios?',
        respuesta: 'Trabajamos con honorarios fijos por caso, cuotas periódicas o porcentaje según la naturaleza del asunto. Todo se entrega por escrito y se acuerda previamente.',
      },
      {
        pregunta: '¿Qué métodos de pago aceptan?',
        respuesta: 'Aceptamos efectivo, transferencia bancaria, depósito en cuenta y pagos electrónicos. Para su comodidad, ofrecemos opciones de pago fraccionado en ciertos casos.',
      },
      {
        pregunta: '¿Puedo contratarlos desde el extranjero?',
        respuesta: 'Sí. Atendemos consultas virtuales y podemos representarlo mediante poder notarial. Trabajamos con hondureños residentes en Estados Unidos, España y otros países.',
      },
      {
        pregunta: '¿Cuánto tiempo tengo para demandar después de un accidente?',
        respuesta: 'Depende del tipo de acción. En materia civil, el plazo general es de 1 a 5 años según el caso. En materia penal, varía según el delito. Consulte con un abogado lo antes posible.',
      },
      {
        pregunta: '¿Qué debo llevar a mi primera consulta?',
        respuesta: 'Documentos relacionados con su caso: identificación, contratos, facturas, notificaciones, actas, certificaciones o cualquier documento que considere relevante. Nosotros le orientaremos.',
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /* 11. OTRAS ÁREAS                                                          */
  /* ------------------------------------------------------------------------ */
  {
    slug: 'otras-areas',
    titulo: 'Otras Áreas',
    descripcion: 'Derecho administrativo, ambiental, aduanero, sanitario y más.',
    preguntas: [
      {
        pregunta: '¿Necesito licencia ambiental para mi negocio?',
        respuesta: 'Sí, salvo excepciones de bajo impacto. La categoría depende de la actividad, ubicación y magnitud del proyecto. MiAmbiente clasifica los proyectos en categorías 1, 2 y 3 según su riesgo ambiental.',
      },
      {
        pregunta: '¿Cómo impugno una multa del SAR?',
        respuesta: 'Recurso de reposición ante la Administración Tributaria en 15 días, y si no prospera, demanda ante el Contencioso Administrativo Tributario.',
      },
      {
        pregunta: '¿Cuánto tarda el registro sanitario de un medicamento?',
        respuesta: 'Entre 6 y 12 meses para medicamentos. Para alimentos y cosméticos, la notificación es más rápida, entre 1 y 3 meses.',
      },
      {
        pregunta: '¿Qué es el arbitraje y cómo funciona?',
        respuesta: 'Es un método alterno de resolución de conflictos donde las partes someten su disputa a uno o varios árbitros, cuya decisión (laudo) tiene fuerza de cosa juzgada. Es más rápido que un juicio ordinario.',
      },
      {
        pregunta: '¿Cuánto tarda una importación en Honduras?',
        respuesta: 'Entre 3 y 10 días hábiles con documentación completa, dependiendo del canal de selectividad aduanera (verde, amarillo o rojo) y el tipo de mercancía.',
      },
      {
        pregunta: '¿Puedo demandar al Estado por daños?',
        respuesta: 'Sí. La responsabilidad patrimonial del Estado procede cuando un órgano público causa un daño por funcionamiento normal o anormal del servicio público.',
      },
      {
        pregunta: '¿Cómo protejo mis datos personales?',
        respuesta: 'Honduras cuenta con la Ley de Protección de Datos Personales. Puede solicitar al responsable del tratamiento el acceso, rectificación, cancelación y oposición al uso de sus datos.',
      },
    ],
  },
];

export const totalPreguntas = categoriasFaq.reduce(
  (acc, cat) => acc + cat.preguntas.length,
  0,
);

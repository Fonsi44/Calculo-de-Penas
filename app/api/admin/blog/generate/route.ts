import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';

const generateSchema = z.object({
  topic: z.string().min(1).max(200),
  category: z.string().min(1).max(200),
});

const BLOG_STRUCTURE_INTROS: Record<string, string> = {
  'derecho-penal': 'El Código Penal hondureño (Decreto 130-2017, con reformas hasta 2024) regula los delitos y las penas en el país. En este artículo analizamos de forma práctica',
  'proceso-penal': 'El proceso penal hondureño, regulado por el Código Procesal Penal, sigue una estructura de etapas que van desde la investigación hasta la sentencia. Aquí explicamos',
  'derecho-de-familia': 'El derecho de familia en Honduras protege los vínculos familiares y regula aspectos como el matrimonio, el divorcio, la filiación y la protección de menores. A continuación abordamos',
  'derecho-laboral': 'El Código del Trabajo hondureño establece los derechos y obligaciones de trabajadores y empleadores. En esta guía práctica explicamos',
  'derecho-civil': 'El Código Civil de Honduras regula las relaciones entre particulares, desde contratos hasta herencias y propiedad. En este artículo tratamos',
  'derecho-mercantil': 'El Código de Comercio hondureño regula la actividad empresarial y los actos de comercio. Analizamos aquí',
  'tributario': 'El sistema tributario hondureño, administrado por el SAR (Servicio de Administración de Rentas), establece obligaciones fiscales para personas y empresas. En este artículo detallamos',
  'extranjeria-migracion': 'La Ley de Migración y Extranjería de Honduras regula la entrada, permanencia y salida de personas del territorio nacional. A continuación explicamos',
  'hondurenos-en-espana': 'Los hondureños residentes en España enfrentan desafíos legales específicos que requieren asesoría especializada tanto en derecho español como hondureño. En esta guía abordamos',
  'derecho-notarial': 'La fe pública notarial en Honduras otorga seguridad jurídica a los actos y contratos entre particulares. Aquí explicamos',
  'derecho-bancario': 'El sistema financiero hondureño, supervisado por la CNBS, regula las relaciones entre entidades bancarias y consumidores. En este artículo analizamos',
  'noticias-legales': 'El ordenamiento jurídico hondureño está en constante evolución. En este artículo repasamos',
  'practica-legal': 'La práctica legal en Honduras requiere conocimiento actualizado de procedimientos, normativa y estrategia. Aquí ofrecemos una guía práctica sobre',
  'derechos-ciudadanos': 'La Constitución de Honduras y los tratados internacionales garantizan derechos fundamentales a los ciudadanos. En este artículo explicamos',
  'derecho-administrativo': 'El derecho administrativo hondureño regula las relaciones entre los ciudadanos y la administración pública. Abordamos aquí',
  'derecho-aduanero': 'El Código Aduanero Centroamericano y su normativa complementaria en Honduras regulan el comercio internacional. En esta guía explicamos',
  'regulacion-sanitaria': 'La regulación sanitaria en Honduras, a cargo de la ARSA y la Secretaría de Salud, establece requisitos para productos y servicios de salud. Aquí detallamos',
  'propiedad-intelectual': 'La propiedad intelectual en Honduras protege las creaciones del intelecto humano. En este artículo abordamos',
  'derecho-ambiental': 'La legislación ambiental hondureña, basada en la Ley General del Ambiente, regula la protección de los recursos naturales. Explicamos aquí',
  'conciliacion-arbitraje': 'Los métodos alternos de resolución de conflictos, como la conciliación y el arbitraje, ofrecen vías eficientes para resolver disputas sin juicio. En este artículo analizamos',
};

function getStructure(category: string): string {
  const sectionSets: Record<string, string> = {
    'derecho-penal': `\n
<h2>1. Marco normativo aplicable</h2>
<p>La regulación de esta materia se encuentra principalmente en el Código Penal (Decreto 130-2017) y sus reformas, así como en el Código Procesal Penal. Es importante identificar con precisión el tipo penal aplicable y las circunstancias específicas del caso.</p>

<h2>2. Elementos del tipo penal</h2>
<p>Para que una conducta sea considerada delito deben concurrir todos los elementos del tipo penal: acción u omisión, tipicidad, antijuridicidad y culpabilidad. Cada uno de estos elementos debe analizarse a la luz de los hechos concretos.</p>

<h2>3. Penas y circunstancias modificativas</h2>
<p>La pena aplicable depende del delito concreto y de las circunstancias agravantes o atenuantes que concurran. El Código Penal establece un sistema de determinación de la pena que considera, entre otros factores, la participación del autor y el grado de ejecución del delito.</p>

<h2>4. Defensa y estrategia procesal</h2>
<p>Una defensa penal eficaz comienza con la asistencia legal inmediata. Las primeras horas tras una detención son críticas para la estrategia de defensa, especialmente en la audiencia inicial donde se deciden las medidas cautelares.</p>

<h2>5. Recomendaciones prácticas</h2>
<p>Si enfrenta un proceso penal, busque asesoría legal especializada cuanto antes. Un abogado penalista con experiencia en el sistema judicial hondureño puede marcar la diferencia en el resultado del caso. La defensa temprana y la presencia local son factores determinantes.</p>`,
    'derecho-de-familia': `\n
<h2>1. Base legal en Honduras</h2>
<p>El Código de Familia (Decreto 76-84) y sus reformas constituyen el marco normativo principal en esta materia. Adicionalmente, la Ley contra la Violencia Doméstica y los tratados internacionales sobre derechos de la infancia complementan la regulación.</p>

<h2>2. Requisitos y procedimiento</h2>
<p>Los requisitos varían según la materia específica: divorcio, pensión alimenticia, custodia o adopción. En general, se requiere presentar una solicitud ante el Juzgado de Familia competente, acompañada de la documentación que acredite los hechos y las pretensiones.</p>

<h2>3. Tiempos estimados del proceso</h2>
<p>Los plazos judiciales dependen de la complejidad del caso y de la carga de trabajo del juzgado. Un divorcio por mutuo acuerdo puede resolverse en semanas, mientras que un proceso contencioso de custodia puede extenderse varios meses.</p>

<h2>4. Documentación que debe reunir</h2>
<p>La documentación básica incluye: documentos de identidad, certificados de matrimonio o nacimiento, pruebas de ingresos, y cualquier evidencia que respalde su solicitud. Es recomendable contar con asesoría legal para preparar correctamente la documentación.</p>

<h2>5. Consejos prácticos</h2>
<p>Antes de iniciar cualquier proceso de familia, consulte con un abogado especializado. Una orientación legal temprana le ayudará a conocer sus derechos, evitar errores procesales y tomar decisiones informadas sobre su caso.</p>`,
    'derecho-laboral': `\n
<h2>1. Marco legal aplicable</h2>
<p>El Código del Trabajo de Honduras y sus reformas establecen los derechos y obligaciones fundamentales en las relaciones laborales. La Secretaría de Trabajo y Seguridad Social es la entidad encargada de velar por su cumplimiento.</p>

<h2>2. Derechos del trabajador</h2>
<p>Todo trabajador en Honduras tiene derechos básicos: salario mínimo, jornada laboral máxima de 8 horas diarias y 44 semanales, descanso semanal, vacaciones remuneradas, aguinaldo, decimocuarto mes de salario y protección contra el despido injustificado.</p>

<h2>3. Cálculo de prestaciones</h2>
<p>Cuando termina la relación laboral, el trabajador tiene derecho al pago de prestaciones: salarios pendientes, vacaciones no gozadas, aguinaldo proporcional, decimocuarto proporcional y, en caso de despido injustificado, la indemnización correspondiente según el tiempo de servicio.</p>

<h2>4. Procedimiento de reclamación</h2>
<p>Si sus derechos laborales han sido vulnerados, puede presentar una denuncia ante la Inspección de Trabajo o iniciar una demanda ante el Juzgado de Trabajo. Existen plazos de caducidad que deben respetarse para no perder el derecho a reclamar.</p>

<h2>5. Recomendaciones prácticas</h2>
<p>Conserve toda la documentación laboral: contrato de trabajo, recibos de salario, constancias de cargo y cualquier comunicación con su empleador. Ante un despido o conflicto laboral, busque asesoría legal lo antes posible.</p>`,
  };
  // Para categorías sin estructura específica, devolvemos solo contenido base sin secciones plantilla.
  // El editor debe completar manualmente el contenido sustancial antes de publicar.
  return sectionSets[category] ?? `\n
<h2>Aspectos clave sobre este tema en Honduras</h2>
<p>La legislación hondureña contiene disposiciones relevantes en esta materia cuyo conocimiento práctico ayuda a entender los derechos y las obligaciones de las partes involucradas. Cada situación debe analizarse individualmente, ya que las circunstancias concretas pueden modificar la aplicación de las reglas generales.</p>

<h2>Consideraciones prácticas</h2>
<p>Antes de tomar cualquier decisión con implicaciones legales, conviene reunir la documentación disponible, verificar los plazos aplicables según la normativa vigente y consultar con un profesional que pueda evaluar el caso concreto. Los procedimientos legales requieren el cumplimiento de formalidades cuya omisión puede afectar la validez de las actuaciones.</p>`;
}

// Conclusión sin CTA ni referencia comercial — el JSX añade BlogCtaBar + LegalDisclaimer.
const BLOG_STRUCTURE_CONCLUSION = `\n
<h2>Conclusión</h2>
<p>Conocer el marco legal aplicable y los procedimientos vigentes permite tomar decisiones informadas y proteger los derechos propios. La normativa hondureña ofrece herramientas que, bien utilizadas con la orientación adecuada, pueden resolver o prevenir conflictos jurídicos. Ante cualquier duda sobre un caso concreto, conviene buscar información actualizada y verificar los requisitos ante la autoridad competente, ya que las disposiciones legales pueden variar con reformas posteriores a la fecha de este artículo.</p>`;

function generateSlug(topic: string): string {
  return topic
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getIntro(category: string, topic: string): string {
  const catIntro = BLOG_STRUCTURE_INTROS[category];
  if (catIntro) return `<p>${catIntro} <strong>${topic}</strong>.</p>`;
  return `<p>En el ordenamiento jurídico hondureño, el tema de <strong>${topic}</strong> es de gran relevancia. En este artículo analizamos los aspectos legales fundamentales que todo ciudadano debe conocer.</p>`;
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    const body = await request.json();
    const parsed = generateSchema.parse(body);

    const rateLimitResult = await rateLimit(`blog-generate:${auth.userId}`, { max: 10, windowMs: 300_000 });
    if (!rateLimitResult.ok) {
      return Response.json({ error: 'Demasiadas generaciones. Espera 5 minutos.' }, { status: 429 });
    }

    const slug = generateSlug(parsed.topic);
    const title = parsed.topic;
    const description = `Guía legal sobre ${parsed.topic.toLowerCase()} en Honduras. Aspectos clave, requisitos y recomendaciones prácticas del equipo de Pineda y Asociados.`;

    // SEO metadata — el admin debe revisarlos antes de publicar
    const metaTitle = title.length <= 60 ? title : title.substring(0, 57).trim() + '...';
    const metaDescription = description.length <= 160
      ? description
      : description.substring(0, 157).replace(/\s+\S*$/, '') + '.';
    const intro = getIntro(parsed.category, parsed.topic);
    const structure = getStructure(parsed.category);
    // El disclaimer legal ya NO se concatena al body del post: el componente
    // <LegalDisclaimer> lo renderiza de forma centralizada en el JSX de la
    // página del post, evitando doble disclaimer (body + JSX).
    const content = `${intro}${structure}${BLOG_STRUCTURE_CONCLUSION}`;

    const estimateReadingTime = Math.max(2, Math.round(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)) + ' min';

    const tagSuggestions = [
      parsed.category.replace(/-/g, ' '),
      'Honduras',
      ...parsed.topic.toLowerCase().split(' ').filter((w: string) => w.length > 4),
    ].slice(0, 6);

    await logAudit({
      usuarioId: auth.userId,
      accion: 'blog_generated',
      recurso: 'blog',
      recursoId: slug,
      metadata: { topic: parsed.topic, category: parsed.category },
      request,
    });

    return Response.json({
      slug,
      title,
      description,
      metaTitle,
      metaDescription,
      body: content,
      readingTime: estimateReadingTime,
      tags: tagSuggestions,
      category: parsed.category,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: err.issues }, { status: 400 });
    }
    return authFailureResponse(err);
  }
}

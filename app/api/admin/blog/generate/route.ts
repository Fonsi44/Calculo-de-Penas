import { requireAdmin, authFailureResponse } from '@/lib/auth';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const generateSchema = z.object({
  topic: z.string().min(1).max(200),
  category: z.string().min(1).max(200),
});

const BLOG_STRUCTURE_INTROS: Record<string, string> = {
  'derecho-penal': 'El Código Penal hondureño (Decreto 130-2017) regula los delitos y las penas en Honduras. En este artículo analizamos en profundidad',
  'derecho-de-familia': 'El derecho de familia en Honduras protege los vínculos familiares y regula aspectos fundamentales de la vida cotidiana. A continuación explicamos',
  'derecho-laboral': 'El Código del Trabajo hondureño establece los derechos y obligaciones de trabajadores y empleadores. En esta guía detallamos',
  'derecho-civil': 'El Código Civil de Honduras regula las relaciones entre particulares. En este artículo abordamos',
  'derecho-mercantil': 'El Código de Comercio hondureño regula la actividad empresarial y mercantil. Analizamos aquí',
  'tributario': 'El sistema tributario hondureño, administrado por el SAR, establece obligaciones fiscales para personas y empresas. En este artículo explicamos',
  'extranjeria-migracion': 'La Ley de Migración y Extranjería de Honduras regula la entrada, permanencia y salida de extranjeros. A continuación detallamos',
  'derecho-bancario': 'El sistema financiero hondureño, supervisado por la CNBS, regula las relaciones entre bancos y consumidores. En este artículo analizamos',
};

const BLOG_STRUCTURE_SECTIONS = `\n
<h2>1. Marco legal aplicable</h2>
<p>La legislación hondureña establece un marco jurídico completo que regula esta materia. Es fundamental conocer las disposiciones legales aplicables para entender los derechos y obligaciones de las partes involucradas.</p>

<h2>2. Requisitos y procedimiento</h2>
<p>Para iniciar cualquier trámite o reclamación en este ámbito, es necesario cumplir con ciertos requisitos legales. El procedimiento puede variar según la complejidad del caso y la jurisdicción competente.</p>

<h2>3. Plazos y términos legales</h2>
<p>La ley establece plazos específicos que deben respetarse. El incumplimiento de estos términos puede tener consecuencias graves, incluyendo la pérdida de derechos o la prescripción de la acción.</p>

<h2>4. Documentación necesaria</h2>
<p>Es imprescindible contar con la documentación completa y en regla. Los documentos deben estar debidamente autenticados y, en su caso, apostillados conforme al Convenio de La Haya.</p>

<h2>5. Recomendaciones prácticas</h2>
<p>Contar con asesoría legal especializada es la mejor garantía para proteger sus derechos. Un abogado experto puede orientarle sobre la estrategia más adecuada para su caso concreto.</p>`;

const BLOG_STRUCTURE_CONCLUSION = `\n
<h2>Conclusión</h2>
<p>El conocimiento de sus derechos y de los procedimientos legales aplicables es fundamental para tomar decisiones informadas. En <strong>Pineda y Asociados</strong> contamos con un equipo de abogados especializados que pueden asesorarle en cada etapa del proceso.</p>
<p>Si necesita orientación legal personalizada, no dude en <strong>contactarnos</strong> para una consulta inicial sin compromiso. Estamos a su disposición para proteger sus intereses.</p>`;

const SEO_FOOTER = `\n
<p><em>Este artículo tiene carácter informativo y no constituye asesoramiento legal. Para obtener asesoramiento personalizado sobre su caso, contacte con un abogado colegiado.</em></p>`;

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

    const slug = generateSlug(parsed.topic);
    const title = parsed.topic;
    const description = `Guía legal completa sobre ${parsed.topic.toLowerCase()} en Honduras. Requisitos, procedimiento, plazos, documentación necesaria y recomendaciones prácticas.`;
    const intro = getIntro(parsed.category, parsed.topic);
    const content = `${intro}${BLOG_STRUCTURE_SECTIONS}${BLOG_STRUCTURE_CONCLUSION}${SEO_FOOTER}`;

    const estimateReadingTime = Math.max(2, Math.round(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)) + ' min';

    const tagSuggestions = [
      parsed.category.replace(/-/g, ' '),
      'Honduras',
      ...parsed.topic.toLowerCase().split(' ').filter((w: string) => w.length > 5),
    ].slice(0, 5);

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
